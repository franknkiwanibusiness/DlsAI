/**
 * ============================================================
 *  MINIMISTY — PRODUCTION BACKEND SERVER
 *  Node.js + Express
 *
 *  Handles:
 *  • POST /api/cjdropship/shipping  — live shipping rate lookup
 *  • POST /api/cjdropship/fulfill   — place order on CJ + PayPal verify
 *  • GET  /api/health               — uptime check
 *  • POST /api/webhook/paypal       — PayPal IPN safety net
 *
 *  Stack: Express · axios · nodemailer · firebase-admin
 * ============================================================
 */

"use strict";

const express    = require("express");
const axios      = require("axios");
const cors       = require("cors");
const nodemailer = require("nodemailer");
const admin      = require("firebase-admin");
const crypto     = require("crypto");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));

// ─── FIREBASE ADMIN INIT ─────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const db = admin.database();

// ─── CJ DROPSHIPPING CONFIG ───────────────────────────────────
const CJ_BASE           = "https://developers.cjdropshipping.com/api2.0";
const CJ_EMAIL          = process.env.CJ_EMAIL;
const CJ_PASSWORD       = process.env.CJ_PASSWORD;
const CJ_PRODUCT_SKU    = process.env.CJ_PRODUCT_SKU || "CJYD239388104DW";

// Cache the CJ access token so we don't re-auth on every request
let cjToken     = null;
let cjTokenExp  = 0;

/**
 * getCJToken — gets or refreshes the CJ API access token.
 * CJ tokens expire after ~24 hours. We refresh 5 minutes early.
 */
async function getCJToken() {
  const now = Date.now();
  if (cjToken && now < cjTokenExp) return cjToken;

  const res = await axios.post(`${CJ_BASE}/authentication/getAccessToken`, {
    email:    CJ_EMAIL,
    password: CJ_PASSWORD,
  });

  const data = res.data;
  if (data.result !== true || !data.data?.accessToken) {
    throw new Error(`CJ Auth failed: ${JSON.stringify(data)}`);
  }

  cjToken    = data.data.accessToken;
  // Expire in 23 hours (CJ gives 24h)
  cjTokenExp = now + 23 * 60 * 60 * 1000;
  console.log("CJ token refreshed.");
  return cjToken;
}

/**
 * cjRequest — authenticated GET/POST helper.
 */
async function cjRequest(method, path, body = null) {
  const token = await getCJToken();
  const config = {
    method,
    url: `${CJ_BASE}${path}`,
    headers: {
      "CJ-Access-Token": token,
      "Content-Type":    "application/json",
    },
  };
  if (body) config.data = body;
  const res = await axios(config);
  return res.data;
}

// ─── PAYPAL VERIFICATION ──────────────────────────────────────
const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function getPayPalAccessToken() {
  const res = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: { username: PAYPAL_CLIENT_ID, password: PAYPAL_CLIENT_SECRET },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  return res.data.access_token;
}

/**
 * verifyPayPalOrder — confirms the order is COMPLETED and amount matches.
 * NEVER fulfill without this check — prevents fake payment attacks.
 */
async function verifyPayPalOrder(orderId, expectedUSD) {
  const token = await getPayPalAccessToken();
  const res   = await axios.get(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const order  = res.data;
  const status = order.status;

  if (status !== "COMPLETED") {
    throw new Error(`PayPal order ${orderId} status is "${status}", not COMPLETED.`);
  }

  const capturedAmount = parseFloat(
    order.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || "0"
  );

  // Allow 1-cent rounding tolerance
  if (Math.abs(capturedAmount - expectedUSD) > 0.02) {
    throw new Error(
      `Amount mismatch: expected $${expectedUSD}, captured $${capturedAmount}`
    );
  }

  return { verified: true, capturedAmount, order };
}

// ─── EMAIL (NODEMAILER) ───────────────────────────────────────
const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * sendOrderConfirmation — sends branded email to the customer.
 */
async function sendOrderConfirmation(orderData) {
  const {
    shipping, variantSummary, quantity, totalUSD, cjOrderId, paypalOrderId,
  } = orderData;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f2f2f7; margin: 0; padding: 0; }
    .wrap { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 24px;
            border: 2.5px solid #000; overflow: hidden; box-shadow: 0 8px 0 #000; }
    .header { background: #000; padding: 30px; text-align: center; }
    .header h1 { color: #fff; font-size: 28px; margin: 0; letter-spacing: 2px; }
    .header p  { color: #32D74B; font-size: 13px; margin: 6px 0 0; font-weight: 700; }
    .body   { padding: 30px; }
    .badge  { display: inline-block; background: #32D74B; color: #000; font-size: 11px;
              font-weight: 900; padding: 5px 14px; border-radius: 20px; border: 2px solid #000;
              margin-bottom: 20px; }
    h2      { font-size: 22px; margin: 0 0 6px; }
    p       { color: #555; font-size: 14px; line-height: 1.6; }
    .row    { display: flex; justify-content: space-between; padding: 10px 0;
              border-bottom: 1px solid #f2f2f7; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .label  { color: #888; font-weight: 700; }
    .value  { font-weight: 900; color: #000; }
    .total  { font-size: 22px; color: #5856d6; }
    .address-box { background: #f2f2f7; border-radius: 14px; padding: 16px; margin-top: 20px;
                   font-size: 13px; line-height: 1.7; font-weight: 600; }
    .footer { background: #f2f2f7; padding: 20px; text-align: center; font-size: 11px;
              color: #aaa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>MINIMISTY™</h1>
      <p>🎉 ORDER CONFIRMED & BEING PACKED</p>
    </div>
    <div class="body">
      <div class="badge">✓ PAYMENT RECEIVED</div>
      <h2>Hey ${shipping.name?.split(" ")[0] || "there"}!</h2>
      <p>Your <strong>MINIMISTY TURBO MIST</strong> order is confirmed and has been
         sent to our fulfillment team. You'll receive a tracking number soon!</p>

      <div style="margin-top: 24px;">
        <div class="row">
          <span class="label">Order ID</span>
          <span class="value" style="font-size:12px;">${cjOrderId}</span>
        </div>
        <div class="row">
          <span class="label">PayPal Reference</span>
          <span class="value" style="font-size:12px;">${paypalOrderId}</span>
        </div>
        <div class="row">
          <span class="label">Item</span>
          <span class="value">MINIMISTY x${quantity}</span>
        </div>
        <div class="row">
          <span class="label">Variant(s)</span>
          <span class="value">${variantSummary}</span>
        </div>
        <div class="row">
          <span class="label">Total Charged (USD)</span>
          <span class="value total">$${parseFloat(totalUSD).toFixed(2)}</span>
        </div>
      </div>

      <div class="address-box">
        <strong>📦 Shipping to:</strong><br>
        ${shipping.name}<br>
        ${shipping.address}${shipping.address2 ? ", " + shipping.address2 : ""}<br>
        ${shipping.city}, ${shipping.state} ${shipping.zip}<br>
        ${shipping.countryFull}
      </div>

      <p style="margin-top: 20px; font-size: 13px; color: #aaa;">
        Estimated delivery: <strong>5–16 business days</strong> depending on your shipping method.
        A tracking email will follow once your package ships.
      </p>
    </div>
    <div class="footer">
      MINIMISTY™ · Questions? Reply to this email<br>
      <a href="mailto:support@minimisty.com" style="color:#5856d6;">support@minimisty.com</a>
    </div>
  </div>
</body>
</html>`;

  await mailer.sendMail({
    from:    `"MINIMISTY™" <${process.env.SMTP_USER}>`,
    to:      shipping.email,
    subject: `🎉 Order Confirmed — MINIMISTY TURBO MIST x${quantity}`,
    html,
  });
  console.log("Confirmation email sent to:", shipping.email);
}

/**
 * sendInternalAlert — notify yourself of every new order.
 */
async function sendInternalAlert(orderData) {
  if (!process.env.ADMIN_EMAIL) return;

  const { shipping, quantity, variantSummary, totalUSD, cjOrderId, paypalOrderId } = orderData;

  await mailer.sendMail({
    from:    `"MINIMISTY Orders" <${process.env.SMTP_USER}>`,
    to:      process.env.ADMIN_EMAIL,
    subject: `💰 NEW ORDER $${parseFloat(totalUSD).toFixed(2)} — ${shipping.name}`,
    html: `
      <h2>New MINIMISTY Order</h2>
      <p><b>Customer:</b> ${shipping.name} (${shipping.email})</p>
      <p><b>Items:</b> x${quantity} — ${variantSummary}</p>
      <p><b>Total USD:</b> $${parseFloat(totalUSD).toFixed(2)}</p>
      <p><b>CJ Order:</b> ${cjOrderId}</p>
      <p><b>PayPal:</b> ${paypalOrderId}</p>
      <p><b>Ship to:</b> ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}, ${shipping.countryFull}</p>
    `,
  });
}

// ─── HELPERS ──────────────────────────────────────────────────

/**
 * Map color label → CJ vid (variant ID).
 * You MUST update these to the exact variant IDs from your CJ product listing.
 * Find them via GET /product/query?pid=YOUR_PRODUCT_ID
 */
const COLOR_TO_CJ_VID = {
  "Blue 4000mAh":      process.env.CJ_VID_BLUE      || "BLUE_VID_HERE",
  "Dark Gray 4000mAh": process.env.CJ_VID_DARKGRAY   || "DARKGRAY_VID_HERE",
  "Pink 4000mAh":      process.env.CJ_VID_PINK       || "PINK_VID_HERE",
  "White 4000mAh":     process.env.CJ_VID_WHITE      || "WHITE_VID_HERE",
};

/**
 * buildCJOrderLines — turns bundleColors map into CJ line items.
 * Merges duplicate variants (e.g. 2x Blue = qty 2).
 *
 * @param {object} bundleColors  - { 1: "Blue 4000mAh", 2: "Pink 4000mAh", ... }
 * @param {string} sku
 */
function buildCJOrderLines(bundleColors, sku) {
  const counts = {}; // variantName → count
  Object.values(bundleColors).forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });

  return Object.entries(counts).map(([variant, qty]) => ({
    vid:      COLOR_TO_CJ_VID[variant] || COLOR_TO_CJ_VID["Dark Gray 4000mAh"],
    quantity: qty,
  }));
}

// ─── LOG ERROR TO FIREBASE ────────────────────────────────────
async function logError(type, context) {
  try {
    await db.ref("errors").push({
      type,
      timestamp: new Date().toISOString(),
      ...context,
    });
  } catch (_) { /* never crash the error logger */ }
}

// ============================================================
//  ROUTES
// ============================================================

// ─── GET /api/health ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});


// ─── POST /api/cjdropship/shipping ───────────────────────────
/**
 * Body: { sku, zip, country, qty }
 * Returns array of shipping options from CJ.
 *
 * CJ API: POST /shopping/order/createOrderV2 (shipping estimate)
 * We use the logistics query endpoint instead:
 * GET /logistics/freightCalculate
 */
app.post("/api/cjdropship/shipping", async (req, res) => {
  const { zip, country, qty = 1 } = req.body;

  if (!zip || !country) {
    return res.status(400).json({ error: "zip and country are required" });
  }

  try {
    const data = await cjRequest("GET",
      `/logistics/freightCalculate?startCountryCode=CN` +
      `&endCountryCode=${encodeURIComponent(country)}` +
      `&endZip=${encodeURIComponent(zip)}` +
      `&pid=${encodeURIComponent(process.env.CJ_PRODUCT_PID || CJ_PRODUCT_SKU)}` +
      `&quantity=${qty}`
    );

    if (data.result !== true) {
      throw new Error(data.message || "CJ freight API returned false result");
    }

    // Normalise response into a simple options array
    const rawOptions = data.data || [];
    const options    = rawOptions.map((o) => ({
      id:            o.logisticsId    || o.id,
      name:          o.logisticsName  || o.name,
      price:         parseFloat(o.logisticsPrice || o.price || 0),
      estDays:       o.logisticsTime  || o.time || "8-16",
      trackable:     !!o.trackable,
    }));

    return res.json({ shippingOptions: options });

  } catch (err) {
    console.error("[/shipping]", err.message);
    await logError("SHIPPING_LOOKUP_FAILED", { zip, country, error: err.message });
    // Return graceful fallback instead of 500 — frontend uses $5 fallback
    return res.status(200).json({
      shippingOptions: [
        { id: "fallback", name: "Standard Shipping", price: 0.99, estDays: "8-16", trackable: true },
        { id: "fallback2", name: "Prime Insured (USPS)", price: 2.95, estDays: "5-12", trackable: true },
      ],
      fallback: true,
    });
  }
});


// ─── POST /api/cjdropship/fulfill ────────────────────────────
/**
 * Body: {
 *   paypalOrderId,  ← REQUIRED for verification
 *   sku,
 *   variantName,
 *   bundleColors,   ← { 1: "Blue 4000mAh", 2: "Pink 4000mAh", ... }
 *   quantity,
 *   shipping: { name, email, phone, address, address2, city, state, zip, countryFull, cjShipping }
 * }
 *
 * Steps:
 * 1. Verify PayPal order is COMPLETED and amount matches
 * 2. Build CJ order payload
 * 3. Create order on CJ
 * 4. Save order + shipping to Firebase
 * 5. Send customer + admin emails
 */
app.post("/api/cjdropship/fulfill", async (req, res) => {
  const {
    paypalOrderId,
    sku            = CJ_PRODUCT_SKU,
    variantName,
    bundleColors   = { 1: variantName || "Dark Gray 4000mAh" },
    quantity       = 1,
    shipping,
  } = req.body;

  // ── Basic validation ──────────────────────────────────────
  if (!paypalOrderId || !shipping?.email) {
    return res.status(400).json({ error: "paypalOrderId and shipping.email are required" });
  }

  // ── 1. PayPal verification ────────────────────────────────
  // Re-compute expected USD from bundle pricing (same logic as frontend)
  const BUNDLE_PRICES = { 1: 39.50, 2: 37.45, 3: 34.95 };
  const unitPrice     = BUNDLE_PRICES[quantity] || 39.50;
  const subtotal      = parseFloat((unitPrice * quantity).toFixed(2));
  const tax           = parseFloat((subtotal * 0.05).toFixed(2));
  // Shipping is passed in from the frontend's selectedShippingFee
  const shippingFee   = parseFloat(req.body.shippingFee || 0.99);
  const expectedTotal = parseFloat((subtotal + tax + shippingFee).toFixed(2));

  let captureData;
  try {
    captureData = await verifyPayPalOrder(paypalOrderId, expectedTotal);
    console.log(`[fulfill] PayPal ${paypalOrderId} verified ✓ $${captureData.capturedAmount}`);
  } catch (verifyErr) {
    console.error("[fulfill] PayPal verification failed:", verifyErr.message);
    await logError("PAYPAL_VERIFY_FAILED", {
      paypalOrderId,
      error: verifyErr.message,
      expectedTotal,
    });
    return res.status(402).json({
      error:   "Payment verification failed",
      details: verifyErr.message,
    });
  }

  // ── 2. Build CJ order lines ───────────────────────────────
  const orderLines = buildCJOrderLines(bundleColors, sku);
  const cjShip     = shipping.cjShipping || {};

  // CJ v2 order payload
  const cjPayload = {
    orderNumber:     `MINI-${paypalOrderId.slice(-10).toUpperCase()}`,
    shippingAddress: {
      consignee:      cjShip.consignee   || shipping.name,
      email:          cjShip.email       || shipping.email,
      phoneNumber:    cjShip.phone       || shipping.phone || "",
      countryCode:    cjShip.countryCode || "US",
      province:       cjShip.province    || shipping.state || "",
      city:           cjShip.city        || shipping.city  || "",
      address:        cjShip.address     || shipping.address || "",
      address2:       cjShip.address2    || shipping.address2 || "",
      zip:            cjShip.zip         || shipping.zip   || "",
    },
    products: orderLines,
    // remark visible in CJ dashboard
    remark: `MINIMISTY x${quantity} | Session: ${req.body.sessionId || "-"}`,
  };

  // ── 3. Place CJ order ─────────────────────────────────────
  let cjOrderId = "CJ-PENDING";
  let cjResponse;

  try {
    cjResponse = await cjRequest("POST", "/shopping/order/createOrderV2", cjPayload);

    if (cjResponse.result !== true) {
      throw new Error(cjResponse.message || JSON.stringify(cjResponse));
    }

    cjOrderId = cjResponse.data?.orderId || cjResponse.data?.cjOrderId || cjOrderId;
    console.log("[fulfill] CJ order created:", cjOrderId);

  } catch (cjErr) {
    console.error("[fulfill] CJ order creation failed:", cjErr.message);

    // CRITICAL: Payment was already captured — log for manual recovery
    await logError("CJ_ORDER_FAILED_AFTER_PAYMENT", {
      paypalOrderId,
      cjPayload: JSON.stringify(cjPayload),
      error:     cjErr.message,
      shipping,
      quantity,
      capturedAmount: captureData.capturedAmount,
    });

    // Still return 200 to the client — we have their money and will fulfill manually
    return res.status(200).json({
      success:    true,
      orderId:    "PENDING-" + paypalOrderId.slice(-6),
      manualFlag: true,
      message:    "Payment captured. Fulfillment will be processed manually.",
    });
  }

  // ── 4. Build full order record ────────────────────────────
  const variantSummary = Object.values(bundleColors)
    .map((v) => v.replace(" 4000mAh", ""))
    .join(" + ") || variantName || "Default";

  const orderRecord = {
    paypalOrderId,
    cjOrderId,
    sessionId:      req.body.sessionId || null,
    shipping,
    bundleColors,
    variantSummary,
    quantity,
    subtotalUSD:    subtotal.toFixed(2),
    taxUSD:         tax.toFixed(2),
    shippingUSD:    shippingFee.toFixed(2),
    totalUSD:       captureData.capturedAmount.toFixed(2),
    currency:       req.body.currency || "USD",
    shippingMethod: req.body.shippingMethod || "Standard",
    country:        cjShip.countryCode || "US",
    status:         "PAID_FULFILLED",
    timestamp:      new Date().toISOString(),
  };

  // Save to Firebase orders/
  try {
    await db.ref("orders").push(orderRecord);
    console.log("[fulfill] Order saved to Firebase.");
  } catch (fbErr) {
    console.error("[fulfill] Firebase save failed (non-critical):", fbErr.message);
    // Don't fail the request — order is already on CJ
  }

  // ── 5. Send emails (non-blocking) ────────────────────────
  Promise.all([
    sendOrderConfirmation(orderRecord).catch((e) =>
      console.error("[email] Confirmation failed:", e.message)
    ),
    sendInternalAlert(orderRecord).catch((e) =>
      console.error("[email] Admin alert failed:", e.message)
    ),
  ]);

  return res.status(200).json({
    success:  true,
    orderId:  cjOrderId,
    message:  "Order placed and fulfillment initiated.",
  });
});


// ─── POST /api/webhook/paypal (IPN safety net) ───────────────
/**
 * PayPal calls this for every payment event.
 * Acts as a second safety net — if the frontend somehow missed
 * flagging an order, we detect PAYMENT.CAPTURE.COMPLETED here
 * and log it for recovery.
 */
app.post("/api/webhook/paypal", async (req, res) => {
  // Acknowledge immediately (PayPal expects fast 200)
  res.status(200).send("OK");

  try {
    const event = req.body;
    if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return;

    const orderId = event.resource?.supplementary_data?.related_ids?.order_id ||
                    event.resource?.id;
    const amount  = event.resource?.amount?.value;

    console.log(`[paypal-webhook] Capture event: ${orderId} $${amount}`);

    await db.ref("paypal_webhooks").push({
      event_type: event.event_type,
      orderId,
      amount,
      timestamp: new Date().toISOString(),
      raw:       JSON.stringify(event).slice(0, 2000), // trim to avoid huge writes
    });
  } catch (err) {
    console.error("[paypal-webhook] Error:", err.message);
  }
});


// ─── POST /api/cjdropship/track ──────────────────────────────
/**
 * Optional: lets you build a tracking page.
 * Body: { cjOrderId }
 */
app.post("/api/cjdropship/track", async (req, res) => {
  const { cjOrderId } = req.body;
  if (!cjOrderId) return res.status(400).json({ error: "cjOrderId required" });

  try {
    const data = await cjRequest("GET", `/shopping/order/getOrderDetail?orderId=${cjOrderId}`);
    return res.json({ tracking: data.data || data });
  } catch (err) {
    console.error("[track]", err.message);
    return res.status(500).json({ error: "Tracking lookup failed", details: err.message });
  }
});


// ─── GLOBAL ERROR HANDLER ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});


// ─── START ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  MINIMISTY backend running on port ${PORT}`);
  console.log(`    ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`    PayPal: ${process.env.PAYPAL_ENV || "sandbox"}`);
  console.log(`    CJ SKU: ${CJ_PRODUCT_SKU}\n`);
});

module.exports = app;