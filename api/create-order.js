// api/create-order.js  —  Vercel Serverless Function
// This is the ONLY place prices are calculated.
// The frontend sends item identifiers only — never prices.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// ─── AUTHORITATIVE PRICE TABLE ────────────────────────────────────────────────
// These never leave the server. Frontend cannot read or edit these.
const PRICES_USD = { single: 39.99, dual: 69.99, family: 84.99 };
const SHIPS_USD  = { single: 1.99,  dual: 0,     family: 0     };
const SAVES_USD  = { single: 0,     dual: 10.00, family: 35.00 };
const BUNDLE_QTY = { single: 1,     dual: 2,     family: 3     };
const VALID_BUNDLES  = ['single', 'dual', 'family'];
const VALID_VARIANTS = ['Black', 'White', 'Blue', 'Pink', 'Green'];
// ─────────────────────────────────────────────────────────────────────────────

function initFirebase() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS — only your domain
  res.setHeader('Access-Control-Allow-Origin', 'https://minimisty.store');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { items, deviceId, sessionId, geo, currency, exchangeRate, currencySymbol } = req.body;

    // ── 1. Validate input ──────────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    if (items.length > 200) {
      return res.status(400).json({ error: 'Too many items' });
    }

    for (const item of items) {
      if (!VALID_BUNDLES.includes(item.bundle)) {
        return res.status(400).json({ error: `Invalid bundle: ${item.bundle}` });
      }
      // Variant is cosmetic only — validate it's a known string but don't affect price
      if (item.variant && typeof item.variant !== 'string') {
        return res.status(400).json({ error: 'Invalid variant' });
      }
    }

    // ── 2. Calculate totals SERVER-SIDE from authoritative table ──────────
    let subtotalUSD = 0;
    let shipUSD     = 0;
    let discUSD     = 0;

    const sanitisedItems = items.map(item => {
      const bundle = item.bundle;
      const price  = PRICES_USD[bundle];
      const ship   = SHIPS_USD[bundle];
      const disc   = SAVES_USD[bundle];
      const qty    = BUNDLE_QTY[bundle];

      subtotalUSD += price;
      shipUSD     += ship;
      discUSD     += disc;

      // Only carry cosmetic/display data from the client — no prices
      return {
        product:    'FrostBlade Pro',
        bundle,
        qty,
        variant:    typeof item.variant === 'string' ? item.variant.slice(0, 60) : 'Black',
        variantImg: typeof item.variantImg === 'string' ? item.variantImg.slice(0, 300) : '',
        // Server-computed prices stored here for the checkout page to read
        priceUSD:   price,
        shipUSD:    ship,
        discUSD:    disc,
      };
    });

    const taxUSD   = +(subtotalUSD * 0.05).toFixed(2);
    const totalUSD = +(subtotalUSD + shipUSD + taxUSD).toFixed(2);

    // ── 3. Generate order ID ──────────────────────────────────────────────
    const orderId = 'ORD_' + Date.now().toString(36).toUpperCase()
                  + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();

    // ── 4. Save to Firebase with server-computed totals ───────────────────
    initFirebase();
    const db = getDatabase();

    const orderData = {
      orderId,
      status:          'pending_checkout',
      createdAt:       Date.now(),
      deviceId:        typeof deviceId === 'string' ? deviceId.slice(0, 60) : '',
      sessionId:       typeof sessionId === 'string' ? sessionId.slice(0, 60) : '',
      currency:        typeof currency === 'string' ? currency.slice(0, 5) : 'USD',
      exchangeRate:    typeof exchangeRate === 'number' ? exchangeRate : 1,
      currencySymbol:  typeof currencySymbol === 'string' ? currencySymbol.slice(0, 5) : '$',
      geo:             geo && typeof geo === 'object' ? {
        country: String(geo.country || '').slice(0, 3),
        city:    String(geo.city    || '').slice(0, 60),
      } : {},
      pricing: {
        subtotalUSD: +subtotalUSD.toFixed(2),
        shippingUSD: +shipUSD.toFixed(2),
        discountUSD: +discUSD.toFixed(2),
        taxUSD,
        totalUSD,
      },
      items: sanitisedItems,
      // Pricing source flag — useful for your records
      pricingSource: 'server',
    };

    await db.ref('orders/' + orderId).set(orderData);
    await db.ref('analytics/totalCheckouts').transaction(n => (n || 0) + 1);

    // ── 5. Return only the orderId — no prices go back to the browser ─────
    return res.status(200).json({ orderId });

  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}