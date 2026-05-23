// ─────────────────────────────────────────────────────────────────
//  /api/paypal-create-order.js
//  Vercel Serverless Function
//
//  Receives:  { orderId }
//  Fetches the verified order from Firebase, calculates the real
//  total server-side, then creates a PayPal order via the REST API.
//  Returns:   { paypalOrderId }
//
//  Env vars required (Vercel → Settings → Environment Variables):
//    PAYPAL_CLIENT_ID      — your PayPal app client ID
//    PAYPAL_SECRET_KEY     — your PayPal app secret
//    PAYPAL_ENV            — "sandbox" | "live"  (defaults to "live")
//    FIREBASE_DB_URL       — e.g. https://your-project-default-rtdb.firebaseio.com
//    FIREBASE_SERVICE_KEY  — JSON string of your Firebase service account key
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// ── Price calculator (mirrors checkout.html logic) ────────────────
function calculateTotal(order, appliedCode) {
  const p            = order.pricing;
  const subtotal     = p.subtotalUSD;
  const shipping     = p.shippingUSD;

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
    const { orderId, appliedCode } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    // 1. Fetch the order from Firebase (server-side — cannot be spoofed)
    const db       = getFirebaseDb();
    const snapshot = await db.ref(`orders/${orderId}`).get();

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = snapshot.val();

    // 2. Reject orders that weren't priced server-side
    if (order.pricingSource !== 'server') {
      return res.status(400).json({ error: 'Order pricing not verified' });
    }

    // 3. Reject orders already paid
    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order already completed' });
    }

    // 4. Calculate the authoritative total (server-side)
    const { total } = calculateTotal(order, appliedCode || null);

    if (total <= 0) {
      return res.status(400).json({ error: 'Invalid order total' });
    }

    // 5. Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // 6. Create PayPal order via REST API
    const paypalRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method:  'POST',
      headers: {
        Authorization:              `Bearer ${accessToken}`,
        'Content-Type':             'application/json',
        'PayPal-Request-Id':        `${orderId}-${Date.now()}`, // idempotency key
        'Prefer':                   'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            description:  'FrostBlade Pro — MINIMISTY.store',
            amount: {
              currency_code: 'USD',
              value:         String(total),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value:         String((order.pricing.subtotalUSD).toFixed(2)),
                },
                shipping: {
                  currency_code: 'USD',
                  value:         String((order.pricing.shippingUSD).toFixed(2)),
                },
                tax_total: {
                  currency_code: 'USD',
                  value:         String(((order.pricing.subtotalUSD) * 0.05).toFixed(2)),
                },
                discount: {
                  currency_code: 'USD',
                  value:         String((0).toFixed(2)), // bundle discount already in subtotal
                },
              },
            },
          },
        ],
        application_context: {
          brand_name:          'MINIMISTY.store',
          shipping_preference: 'NO_SHIPPING', // we collect address ourselves
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

    // 7. Store the PayPal order ID against our Firebase order (for capture verification)
    await db.ref(`orders/${orderId}`).update({
      paypalOrderId:    paypalOrder.id,
      paypalOrderStatus: 'CREATED',
      paypalCreatedAt:  Date.now(),
    });

    return res.status(200).json({
      paypalOrderId: paypalOrder.id,
      total,
    });

  } catch (err) {
    console.error('paypal-create-order error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}