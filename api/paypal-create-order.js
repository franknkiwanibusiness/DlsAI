// ─────────────────────────────────────────────────────────────────
//  /api/paypal-create-order.js
//  Vercel Serverless Function
//
//  Receives:  { orderId, appliedCode }
//  Fetches the verified order from Firebase, calculates the real
//  total server-side, then creates a PayPal order via the REST API.
//  Returns:   { paypalOrderId, total }
//
//  Env vars (Vercel → Settings → Environment Variables):
//    PAYPAL_CLIENT_ID       — PayPal app client ID
//    PAYPAL_SECRET_KEY      — PayPal app secret
//    FIREBASE_PROJECT_ID    — Firebase project ID
//    FIREBASE_DATABASE_URL  — e.g. https://your-project-default-rtdb.firebaseio.com
//    FIREBASE_CLIENT_EMAIL  — Firebase service account email
//    FIREBASE_PRIVATE_KEY   — Firebase service account private key (with \n newlines)
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
        // Vercel stores \n as literal \\n — replace back to real newlines
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

// ── Price calculator (mirrors checkout.html logic) ────────────────
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
  return { total, subtotal, shipping, codeDisc, tax };
}

// ── Main handler ──────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  'https://minimisty.store');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, appliedCode } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    // 1. Fetch order from Firebase — cannot be spoofed by the client
    const db       = getFirebaseDb();
    const snapshot = await db.ref(`orders/${orderId}`).get();

    if (!snapshot.exists()) return res.status(404).json({ error: 'Order not found' });

    const order = snapshot.val();

    if (order.pricingSource !== 'server') {
      return res.status(400).json({ error: 'Order pricing not verified' });
    }
    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already completed' });
    }

    // 2. Calculate authoritative total server-side
    const { total, subtotal, shipping, codeDisc, tax } = calculateTotal(order, appliedCode || null);
    if (total <= 0) return res.status(400).json({ error: 'Invalid order total' });

    // 3. Get PayPal access token using secret from Vercel env
    const accessToken = await getPayPalAccessToken();

    // 4. Create PayPal order via REST API with the verified amount
    const paypalRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method:  'POST',
      headers: {
        Authorization:       `Bearer ${accessToken}`,
        'Content-Type':      'application/json',
        'PayPal-Request-Id': `${orderId}-${Date.now()}`,
        'Prefer':            'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description:  'FrostBlade Pro — MINIMISTY.store',
          amount: {
            currency_code: 'USD',
            value:         String(total),
            breakdown: {
              item_total:  { currency_code: 'USD', value: String(subtotal.toFixed(2)) },
              shipping:    { currency_code: 'USD', value: String(shipping.toFixed(2)) },
              tax_total:   { currency_code: 'USD', value: String(tax.toFixed(2)) },
              discount:    { currency_code: 'USD', value: String(codeDisc.toFixed(2)) },
            },
          },
        }],
        application_context: {
          brand_name:          'MINIMISTY.store',
          shipping_preference: 'NO_SHIPPING',
          user_action:         'PAY_NOW',
        },
      }),
    });

    if (!paypalRes.ok) {
      const err = await paypalRes.json();
      console.error('PayPal create-order error:', err);
      return res.status(502).json({ error: 'PayPal order creation failed', detail: err });
    }

    const paypalOrder = await paypalRes.json();

    // 5. Store PayPal order ID in Firebase so capture can verify it later
    await db.ref(`orders/${orderId}`).update({
      paypalOrderId:     paypalOrder.id,
      paypalOrderStatus: 'CREATED',
      paypalCreatedAt:   Date.now(),
    });

    return res.status(200).json({ paypalOrderId: paypalOrder.id, total });

  } catch (err) {
    console.error('paypal-create-order error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}