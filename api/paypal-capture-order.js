// ─────────────────────────────────────────────────────────────────
//  /api/paypal-capture-order.js
//  Vercel Serverless Function
//
//  Called after buyer approves payment in the PayPal popup.
//  Captures server-side, verifies amount matches Firebase order,
//  marks order paid, logs affiliate earnings.
//
//  Env vars (Vercel → Settings → Environment Variables):
//    PAYPAL_CLIENT_ID       — PayPal app client ID
//    PAYPAL_SECRET_KEY      — PayPal app secret
//    FIREBASE_PROJECT_ID    — Firebase project ID
//    FIREBASE_DATABASE_URL  — Firebase Realtime DB URL
//    FIREBASE_CLIENT_EMAIL  — Firebase service account email
//    FIREBASE_PRIVATE_KEY   — Firebase service account private key
// ─────────────────────────────────────────────────────────────────

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase }                   from 'firebase-admin/database';

// ── Firebase Admin (lazy singleton) ──────────────────────────────
function getFirebaseDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return getDatabase();
}

// ── PayPal helpers ────────────────────────────────────────────────
const PAYPAL_BASE = 'https://api-m.paypal.com';

async function getPayPalAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_KEY}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

// ── Price calculator ──────────────────────────────────────────────
function calculateTotal(order, appliedCode) {
  const { subtotalUSD: subtotal, shippingUSD: shipping } = order.pricing;

  let codeDisc = 0;
  if (appliedCode) {
    codeDisc = appliedCode.type === 'pct'
      ? subtotal * (appliedCode.value / 100)
      : Math.min(appliedCode.value, subtotal);
  }

  const tax   = (subtotal - codeDisc) * 0.05;
  const total = +(subtotal + shipping - codeDisc + tax).toFixed(2);
  return { total, codeDisc, tax };
}

// ── Main handler ──────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  'https://minimisty.store');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      paypalOrderId,
      orderId,
      appliedCode,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      shippingMethod,
      addons,
    } = req.body;

    if (!paypalOrderId || !orderId) {
      return res.status(400).json({ error: 'paypalOrderId and orderId are required' });
    }

    const db = getFirebaseDb();

    // 1. Load order from Firebase — source of truth
    const snapshot = await db.ref(`orders/${orderId}`).get();
    if (!snapshot.exists()) return res.status(404).json({ error: 'Order not found' });

    const order = snapshot.val();

    // 2. Idempotency guard — already paid
    if (order.status === 'paid') {
      return res.status(200).json({ success: true, alreadyPaid: true, orderId });
    }

    // 3. Verify PayPal order ID matches what we stored at create time
    if (order.paypalOrderId && order.paypalOrderId !== paypalOrderId) {
      console.error('PayPal order ID mismatch', {
        stored:   order.paypalOrderId,
        received: paypalOrderId,
        orderId,
      });
      return res.status(400).json({ error: 'PayPal order ID mismatch' });
    }

    // 4. Capture the payment server-side using the secret key
    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method:  'POST',
        headers: {
          Authorization:       `Bearer ${accessToken}`,
          'Content-Type':      'application/json',
          'PayPal-Request-Id': `capture-${orderId}-${Date.now()}`,
          'Prefer':            'return=representation',
        },
      }
    );

    const captureData = await captureRes.json();

    if (!captureRes.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return res.status(502).json({
        error:  'PayPal capture failed',
        status: captureData.status,
        detail: captureData,
      });
    }

    // 5. Extract and verify the captured amount — fraud prevention
    const captureUnit    = captureData.purchase_units?.[0];
    const capturePayment = captureUnit?.payments?.captures?.[0];
    const capturedAmount = parseFloat(capturePayment?.amount?.value || '0');

    const { total: expectedTotal, codeDisc, tax } = calculateTotal(order, appliedCode || null);

    if (Math.abs(capturedAmount - expectedTotal) > 0.01) {
      console.error('AMOUNT MISMATCH — flagging for fraud review', {
        expected: expectedTotal,
        captured: capturedAmount,
        orderId,
        paypalOrderId,
      });
      await db.ref(`orders/${orderId}`).update({
        status:          'fraud_review',
        fraudReason:     'amount_mismatch',
        expectedAmount:  expectedTotal,
        capturedAmount,
        paypalOrderId,
        flaggedAt:       Date.now(),
      });
      return res.status(402).json({ error: 'Payment amount mismatch. Order flagged for review.' });
    }

    // 6. Write the completed order to Firebase
    const completedOrder = {
      ...order,
      status:          'paid',
      customerEmail:   customerEmail   || '',
      customerName:    customerName    || '',
      customerPhone:   customerPhone   || '',
      shippingAddress: shippingAddress || {},
      shippingMethod:  shippingMethod  || 'standard',
      addons:          addons          || { giftWrapping: false, shippingProtection: false },
      paymentMethod:   'paypal',
      paypalOrderId,
      paypalCaptureId: capturePayment?.id || null,
      capturedAmount,
      appliedCode:     appliedCode || null,
      pricing: {
        ...order.pricing,
        codeDiscUSD:   +codeDisc.toFixed(2),
        taxUSD:        +tax.toFixed(2),
        finalTotalUSD: +capturedAmount.toFixed(2),
      },
      completedAt: Date.now(),
    };

    await db.ref(`orders/${orderId}`).set(completedOrder);
    await db.ref('analytics/totalOrders').transaction(n => (n || 0) + 1);

    // 7. Log affiliate/referral sale if applicable
    if (appliedCode?.isReferral && appliedCode?.refCode) {
      const refCode     = appliedCode.refCode;
      const isAffiliate = refCode.startsWith('AFF');
      const earningsUSD = isAffiliate ? +(capturedAmount * 0.15).toFixed(2) : 0;

      const statsRef    = db.ref(`affiliateStats/${refCode}`);
      const statsSnap   = await statsRef.get();
      const current     = statsSnap.val() || { clicks: 0, orders: 0, earningsUSD: 0 };

      await statsRef.update({
        orders:      (current.orders || 0) + 1,
        earningsUSD: +((current.earningsUSD || 0) + earningsUSD).toFixed(2),
      });

      await db.ref(`affiliateSales/${refCode}_${orderId}`).set({
        orderId,
        refCode,
        isAffiliate,
        earningsUSD,
        finalTotalUSD: +capturedAmount.toFixed(2),
        createdAt:     Date.now(),
      });
    }

    return res.status(200).json({
      success:         true,
      orderId,
      capturedAmount,
      paypalCaptureId: capturePayment?.id,
    });

  } catch (err) {
    console.error('paypal-capture-order error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}