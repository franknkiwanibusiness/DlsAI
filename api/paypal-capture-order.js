// ─────────────────────────────────────────────────────────────────
//  /api/paypal-capture-order.js
//  Vercel Serverless Function
//
//  Called after the buyer approves payment in the PayPal popup.
//  Receives:  { paypalOrderId, orderId, appliedCode, shippingAddress, ... }
//  Captures the payment server-side, verifies the amount matches
//  our Firebase order, marks the order paid, and returns success.
//
//  Env vars required:
//    PAYPAL_CLIENT_ID      — your PayPal app client ID
//    PAYPAL_SECRET_KEY     — your PayPal app secret
//    PAYPAL_ENV            — "sandbox" | "live"
//    FIREBASE_DB_URL       — Firebase Realtime DB URL
//    FIREBASE_SERVICE_KEY  — Firebase service account JSON string
// ─────────────────────────────────────────────────────────────────

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase }                   from 'firebase-admin/database';

// ── Firebase Admin (lazy singleton) ──────────────────────────────
function getFirebaseDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DB_URL,
    });
  }
  return getDatabase();
}

// ── PayPal helpers ────────────────────────────────────────────────
const PAYPAL_BASE = process.env.PAYPAL_ENV === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

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
  const data = await res.json();
  return data.access_token;
}

// ── Price calculator (authoritative — mirrors create-order) ───────
function calculateTotal(order, appliedCode) {
  const p        = order.pricing;
  const subtotal = p.subtotalUSD;
  const shipping = p.shippingUSD;

  let codeDisc = 0;
  if (appliedCode) {
    codeDisc = appliedCode.type === 'pct'
      ? subtotal * (appliedCode.value / 100)
      : Math.min(appliedCode.value, subtotal);
  }

  const tax   = (subtotal - codeDisc) * 0.05;
  const total = +(subtotal + shipping - codeDisc + tax).toFixed(2);
  return { total, subtotal, shipping, codeDisc, tax };
}

// ── Main handler ──────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
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

    // 1. Load our Firebase order (source of truth)
    const snapshot = await db.ref(`orders/${orderId}`).get();
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = snapshot.val();

    // 2. Reject already-paid orders (idempotency guard)
    if (order.status === 'paid') {
      return res.status(200).json({ success: true, alreadyPaid: true, orderId });
    }

    // 3. Verify this PayPal order ID matches what we stored at create time
    if (order.paypalOrderId && order.paypalOrderId !== paypalOrderId) {
      console.error('PayPal order ID mismatch', { stored: order.paypalOrderId, received: paypalOrderId });
      return res.status(400).json({ error: 'PayPal order ID mismatch' });
    }

    // 4. Get a fresh PayPal access token
    const accessToken = await getPayPalAccessToken();

    // 5. Capture the payment via PayPal REST API
    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method:  'POST',
      headers: {
        Authorization:       `Bearer ${accessToken}`,
        'Content-Type':      'application/json',
        'PayPal-Request-Id': `capture-${orderId}-${Date.now()}`,
        'Prefer':            'return=representation',
      },
    });

    const captureData = await captureRes.json();

    if (!captureRes.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return res.status(502).json({
        error:  'PayPal capture failed',
        status: captureData.status,
        detail: captureData,
      });
    }

    // 6. Extract the captured amount from PayPal's response and verify it
    const captureUnit    = captureData.purchase_units?.[0];
    const capturePayment = captureUnit?.payments?.captures?.[0];
    const capturedAmount = parseFloat(capturePayment?.amount?.value || '0');

    // Calculate what we expected
    const { total: expectedTotal } = calculateTotal(order, appliedCode || null);

    // Allow a tiny floating-point tolerance (1 cent)
    if (Math.abs(capturedAmount - expectedTotal) > 0.01) {
      console.error('Amount mismatch — POTENTIAL FRAUD', {
        expected: expectedTotal,
        captured: capturedAmount,
        orderId,
        paypalOrderId,
      });
      // Do NOT fulfil — flag for manual review
      await db.ref(`orders/${orderId}`).update({
        status:         'fraud_review',
        fraudReason:    'amount_mismatch',
        expectedAmount: expectedTotal,
        capturedAmount,
        paypalOrderId,
        flaggedAt:      Date.now(),
      });
      return res.status(402).json({
        error: 'Payment amount mismatch. Order flagged for review.',
      });
    }

    // 7. Build the completed order record
    const codeDisc = appliedCode
      ? (appliedCode.type === 'pct'
          ? order.pricing.subtotalUSD * (appliedCode.value / 100)
          : Math.min(appliedCode.value, order.pricing.subtotalUSD))
      : 0;

    const completedOrder = {
      ...order,
      status:           'paid',
      customerEmail:    customerEmail  || order.customerEmail  || '',
      customerName:     customerName   || order.customerName   || '',
      customerPhone:    customerPhone  || order.customerPhone  || '',
      shippingAddress:  shippingAddress || order.shippingAddress || {},
      shippingMethod:   shippingMethod  || 'standard',
      addons:           addons          || { giftWrapping: false, shippingProtection: false },
      paymentMethod:    'paypal',
      paypalOrderId,
      paypalCaptureId:  capturePayment?.id || null,
      capturedAmount,
      appliedCode:      appliedCode || null,
      pricing: {
        ...order.pricing,
        codeDiscUSD:   +codeDisc.toFixed(2),
        taxUSD:        +((order.pricing.subtotalUSD - codeDisc) * 0.05).toFixed(2),
        finalTotalUSD: +capturedAmount.toFixed(2),
      },
      completedAt: Date.now(),
    };

    // 8. Write to Firebase atomically
    await db.ref(`orders/${orderId}`).set(completedOrder);
    await db.ref('analytics/totalOrders').transaction(n => (n || 0) + 1);

    // 9. Log affiliate/referral sale if applicable
    if (appliedCode?.isReferral && appliedCode?.refCode) {
      const refCode      = appliedCode.refCode;
      const isAffiliate  = refCode.startsWith('AFF');
      const earningsUSD  = isAffiliate ? +(capturedAmount * 0.15).toFixed(2) : 0;

      const statsUpdate = { orders: (await db.ref(`affiliateStats/${refCode}/orders`).get().then(s => s.val() || 0)) + 1 };
      if (earningsUSD > 0) {
        statsUpdate.earningsUSD = (await db.ref(`affiliateStats/${refCode}/earningsUSD`).get().then(s => s.val() || 0)) + earningsUSD;
      }
      await db.ref(`affiliateStats/${refCode}`).update(statsUpdate);
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
      success:  true,
      orderId,
      capturedAmount,
      paypalCaptureId: capturePayment?.id,
    });

  } catch (err) {
    console.error('paypal-capture-order error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}