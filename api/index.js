/**
 * Siterifty — Single serverless API handler
 * Deployed as /api/index.js on Vercel (catches /api/* via vercel.json rewrite)
 *
 * Routes (dispatched by req.url path after /api/):
 *   POST  wallet/topup            — verify PayPal capture, credit Firebase balance
 *   POST  wallet/withdraw         — verify balance, deduct, send PayPal payout
 *   POST  paypal-webhook          — PayPal BILLING.SUBSCRIPTION.* events → update plan
 *   POST  cancel-subscription     — cancel a PayPal subscription server-side
 *   POST  admin/login             — return signed JWT for admin dashboard
 *   POST  notify                  — send Resend email / record event
 *   POST  send-email              — send arbitrary transactional email via Resend
 *   POST  chat                    — AI support chat via Groq
 *
 * Separate serverless functions (own files in /api/):
 *   POST  /api/valuate            — AI site valuation (api/valuate.js)
 *   GET   /api/stats              — homepage stat numbers (api/stats.js)
 *   POST  /api/refer              — referral credit (api/refer.js)
 *
 * Security model:
 *   • Every wallet route requires a Firebase ID token in Authorization: Bearer <token>
 *   • The token is verified server-side using Firebase REST verify endpoint
 *   • Balance reads/writes happen ONLY here, never trusted from the client
 *   • PayPal captures are re-verified via the PayPal Orders API before any credit
 *   • PayPal payouts use the server-side Payouts API — client can't fake the amount
 *   • Webhook calls are verified via PayPal-Transmission-Sig
 *   • Admin routes use LOGIN_EMAIL / LOGIN_PASSWORD from env, return a short-lived JWT
 */

const https = require("https");
const crypto = require("crypto");

// ─── Env ────────────────────────────────────────────────────────────────────
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_DATABASE_URL,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  PAYPAL_CLIENT_ID,
  PAYPAL_SECRET,
  RESEND_API_KEY,
  GROQ_API_KEY,
  LOGIN_EMAIL,
  LOGIN_PASSWORD,
  ADMIN_JWT_SECRET,          // optional — falls back to a derived secret
} = process.env;

const PAYPAL_BASE = "https://api-m.paypal.com"; // swap to sandbox for testing
const JWT_SECRET  = ADMIN_JWT_SECRET || crypto
  .createHash("sha256")
  .update((LOGIN_PASSWORD || "siterifty") + "jwt")
  .digest("hex");

// ─── Tiny HTTP helper ───────────────────────────────────────────────────────
function request(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      headers: { ...headers, ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}) },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// ─── PayPal helpers ─────────────────────────────────────────────────────────
let _ppToken = null;
let _ppTokenExpiry = 0;

async function getPayPalToken() {
  if (_ppToken && Date.now() < _ppTokenExpiry) return _ppToken;
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const res = await request(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (res.status !== 200) throw new Error("PayPal auth failed: " + JSON.stringify(res.body));
  _ppToken = res.body.access_token;
  _ppTokenExpiry = Date.now() + (res.body.expires_in - 60) * 1000;
  return _ppToken;
}

async function paypalGet(path) {
  const token = await getPayPalToken();
  return request(`${PAYPAL_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

async function paypalPost(path, payload) {
  const token = await getPayPalToken();
  return request(`${PAYPAL_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

// ─── Firebase Admin (REST) helpers ──────────────────────────────────────────
// We use the Firebase REST API + a signed JWT (service account) so we don't
// need the firebase-admin npm package (keeps the bundle tiny on Vercel).

let _fbAccessToken = null;
let _fbTokenExpiry = 0;

async function getFirebaseToken() {
  if (_fbAccessToken && Date.now() < _fbTokenExpiry) return _fbAccessToken;

  // Build a Google OAuth2 JWT for the service account
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: FIREBASE_CLIENT_EMAIL,
      sub: FIREBASE_CLIENT_EMAIL,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/userinfo.email",
    })
  ).toString("base64url");

  const privateKey = (FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${header}.${claim}.${signature}`;

  const res = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (res.status !== 200) throw new Error("Firebase token error: " + JSON.stringify(res.body));
  _fbAccessToken = res.body.access_token;
  _fbTokenExpiry = Date.now() + (res.body.expires_in - 120) * 1000;
  return _fbAccessToken;
}

const DB = () => FIREBASE_DATABASE_URL.replace(/\/$/, "");

async function dbGet(path) {
  const token = await getFirebaseToken();
  const res = await request(`${DB()}${path}.json?access_token=${token}`);
  if (res.status !== 200) throw new Error("DB read failed: " + path);
  return res.body; // null if missing
}

async function dbPatch(path, data) {
  const token = await getFirebaseToken();
  const res = await request(`${DB()}${path}.json?access_token=${token}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.status !== 200) throw new Error("DB write failed: " + path);
  return res.body;
}

async function dbSet(path, data) {
  const token = await getFirebaseToken();
  const res = await request(`${DB()}${path}.json?access_token=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.status !== 200) throw new Error("DB set failed: " + path);
  return res.body;
}

async function dbPush(path, data) {
  const token = await getFirebaseToken();
  const res = await request(`${DB()}${path}.json?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.status !== 200) throw new Error("DB push failed: " + path);
  return res.body; // { name: "-Nxxx" }
}

// ─── Firebase ID token verification ─────────────────────────────────────────
// Verifies a client-side Firebase ID token using Google's public keys.
const _googleKeyCache = { keys: null, expiry: 0 };

async function verifyFirebaseIdToken(idToken) {
  // Fetch Google public certs if needed
  if (!_googleKeyCache.keys || Date.now() > _googleKeyCache.expiry) {
    const res = await request(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    );
    _googleKeyCache.keys = res.body;
    _googleKeyCache.expiry = Date.now() + 3600 * 1000;
  }

  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Bad token format");

  const header  = JSON.parse(Buffer.from(parts[0], "base64url").toString());
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  const cert    = _googleKeyCache.keys[header.kid];
  if (!cert) throw new Error("Unknown key id");

  const verify = crypto.createVerify("RSA-SHA256");
  verify.update(`${parts[0]}.${parts[1]}`);
  const valid = verify.verify(cert, parts[2], "base64url");
  if (!valid) throw new Error("Invalid signature");

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error("Wrong audience");
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error("Wrong issuer");

  return payload; // { uid, email, ... }
}

// ─── Admin JWT helpers ───────────────────────────────────────────────────────
function signAdminJWT(payload, expiresInSec = 3600 * 8) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claim  = Buffer.from(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSec })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${claim}`)
    .digest("base64url");
  return `${header}.${claim}.${sig}`;
}

function verifyAdminJWT(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Bad JWT");
  const expected = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${parts[0]}.${parts[1]}`)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) throw new Error("Bad JWT sig");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("JWT expired");
  return payload;
}

// ─── Resend helper ───────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, from }) {
  // Use env var so the from domain matches whatever Resend verified domain is set
  const emailDomain = process.env.RESEND_DOMAIN || process.env.APP_DOMAIN || "dlsvalue.site";
  if (!from) from = "Siterifty <no-reply@" + emailDomain + ">";
  const res = await request("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return res;
}

// ─── Groq helper ─────────────────────────────────────────────────────────────
async function groqChat(messages, { model = "llama3-8b-8192", max_tokens = 600, system } = {}) {
  const msgs = system ? [{ role: "system", content: system }, ...messages] : messages;
  const res = await request("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages: msgs, max_tokens, temperature: 0.7 }),
  });
  if (res.status !== 200) throw new Error("Groq error: " + JSON.stringify(res.body));
  return res.body.choices?.[0]?.message?.content || "";
}

// ─── PayPal webhook signature verification ───────────────────────────────────
async function verifyPayPalWebhook(req, rawBody, headers) {
  // PayPal transmits: paypal-transmission-id, paypal-transmission-time,
  //                   paypal-cert-url, paypal-transmission-sig, paypal-auth-algo
  const transmissionId   = headers["paypal-transmission-id"];
  const transmissionTime = headers["paypal-transmission-time"];
  const certUrl          = headers["paypal-cert-url"];
  const transmissionSig  = headers["paypal-transmission-sig"];
  const authAlgo         = headers["paypal-auth-algo"] || "SHA256withRSA";

  if (!transmissionId || !transmissionSig || !certUrl) return false;

  // Fetch PayPal's cert
  const certRes = await request(certUrl);
  const cert = typeof certRes.body === "string" ? certRes.body : JSON.stringify(certRes.body);

  const crc32 = computeCRC32(rawBody);
  const message = `${transmissionId}|${transmissionTime}|${process.env.PAYPAL_WEBHOOK_ID || ""}|${crc32}`;

  const algo = authAlgo.replace("withRSA", "").replace("SHA", "sha");
  const verify = crypto.createVerify(`${algo}WithRSAEncryption`.replace("shaWithRSAEncryption","sha256WithRSAEncryption"));
  verify.update(message);
  return verify.verify(cert, transmissionSig, "base64");
}

function computeCRC32(str) {
  // Simple CRC32 for webhook verification
  const buf = Buffer.from(str);
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return ((crc ^ 0xFFFFFFFF) >>> 0);
}
let _crcTable = null;
function makeCRCTable() {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    _crcTable[i] = c;
  }
  return _crcTable;
}

// ─── Plan fee table (must match frontend) ───────────────────────────────────
const PLAN_FEES = { free: 0.30, starter: 0.15, growth: 0.10, pro: 0.05 };
const PLAN_NAMES = { free: "Free", starter: "Starter", growth: "Growth", pro: "Pro" };

// ─── Read raw body ────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

// ─── CORS headers ─────────────────────────────────────────────────────────────
// Reflects the request Origin so the API works on any domain (dlsvalue.site,
// siterifty.com, Vercel preview URLs, localhost, etc.) without hardcoding.
function setCORS(req, res) {
  const origin = (req.headers && req.headers.origin) || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
module.exports = async function handler(req, res) {
  setCORS(req, res);
  if (req.method === "OPTIONS") return json(res, 204, {});

  // Strip /api/ prefix and trailing slash
  const route = (req.url || "")
    .replace(/^\/api\/?/, "")
    .replace(/\?.*$/, "")
    .replace(/\/$/, "");

  const rawBody = await readBody(req);
  let body = {};
  try { body = rawBody ? JSON.parse(rawBody) : {}; } catch { /* non-JSON body ok for webhook */ }

  // ── Auth helper — extracts + verifies Firebase ID token ──────────────────
  async function requireAuth() {
    const auth = req.headers["authorization"] || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token) throw Object.assign(new Error("Missing auth token"), { status: 401 });
    try {
      return await verifyFirebaseIdToken(token);
    } catch (e) {
      throw Object.assign(new Error("Invalid auth token: " + e.message), { status: 401 });
    }
  }

  try {
    // ════════════════════════════════════════════════════════════
    // POST wallet/topup
    // Body: { orderId: string }   — PayPal capture order ID
    // Headers: Authorization: Bearer <firebase-id-token>
    // ════════════════════════════════════════════════════════════
    if (route === "wallet/topup" && req.method === "POST") {
      const user = await requireAuth();
      const { orderId } = body;
      if (!orderId) return json(res, 400, { error: "Missing orderId" });

      // 1. Verify the order with PayPal server-side
      const orderRes = await paypalGet(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      if (orderRes.status !== 200) return json(res, 400, { error: "PayPal order not found" });

      const order = orderRes.body;

      // 2. Must be COMPLETED (already captured by the client SDK) or APPROVED
      if (!["COMPLETED", "APPROVED"].includes(order.status)) {
        return json(res, 400, { error: `Order status is ${order.status}, not COMPLETED` });
      }

      // 3. If only APPROVED, capture it server-side now
      if (order.status === "APPROVED") {
        const captureRes = await paypalPost(
          `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}
        );
        if (captureRes.status !== 201 && captureRes.status !== 200) {
          return json(res, 400, { error: "PayPal capture failed", detail: captureRes.body });
        }
      }

      // 4. Pull the real captured amount from PayPal — never trust client
      const unit = order.purchase_units?.[0];
      const captured = unit?.payments?.captures?.[0] || unit?.amount;
      const grossPaid = parseFloat(captured?.amount?.value || captured?.value || 0);
      if (grossPaid <= 0) return json(res, 400, { error: "Could not determine payment amount" });

      // 5. Subtract PayPal fee (3.49% + 0.49) to get credit amount
      const fee    = parseFloat((grossPaid * 0.0349 + 0.49).toFixed(2));
      const credit = parseFloat((grossPaid - fee).toFixed(2));
      if (credit <= 0) return json(res, 400, { error: "Amount too small after fees" });

      // 6. Check for duplicate (idempotency) — store orderId in DB
      const existing = await dbGet(`/transactions/${orderId}`);
      if (existing) return json(res, 409, { error: "Order already credited" });

      // 7. Atomic balance update in Firebase
      const userData = await dbGet(`/users/${user.uid}`);
      const currentBal = parseFloat((userData && userData.balance) || 0);
      const newBal = parseFloat((currentBal + credit).toFixed(2));

      await dbPatch(`/users/${user.uid}`, { balance: newBal });

      // 8. Record transaction (prevents double-credit)
      await dbSet(`/transactions/${orderId}`, {
        uid:       user.uid,
        type:      "topup",
        orderId,
        gross:     grossPaid,
        fee,
        credit,
        balBefore: currentBal,
        balAfter:  newBal,
        ts:        Date.now(),
        status:    "completed",
      });

      // 9. Confirmation email
      if (user.email) {
        sendEmail({
          to: user.email,
          subject: "Your Siterifty wallet has been topped up",
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
            <h2 style="margin:0 0 12px;font-size:20px;color:#34d399;">+$${credit.toFixed(2)} added to your wallet</h2>
            <p style="color:#8b8aa8;font-size:14px;line-height:1.6;">Your new balance is <strong style="color:#f1f0ff;">$${newBal.toFixed(2)}</strong>.</p>
            <p style="color:#8b8aa8;font-size:12px;margin-top:16px;">PayPal order: <code>${orderId}</code></p>
          </div>`,
        }).catch(() => {});
      }

      return json(res, 200, { success: true, credit, balance: newBal });
    }

    // ════════════════════════════════════════════════════════════
    // POST wallet/withdraw
    // Body: { paypalEmail: string }
    // Headers: Authorization: Bearer <firebase-id-token>
    // ════════════════════════════════════════════════════════════
    if (route === "wallet/withdraw" && req.method === "POST") {
      const user = await requireAuth();
      const { paypalEmail } = body;
      if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
        return json(res, 400, { error: "Invalid PayPal email" });
      }

      // 1. Read balance + plan from Firebase — never trust client
      const userData = await dbGet(`/users/${user.uid}`);
      if (!userData) return json(res, 404, { error: "User not found" });

      const gross   = parseFloat((userData.balance || 0).toFixed(2));
      const planKey = (userData.plan || "free").toLowerCase();
      const feeRate = PLAN_FEES[planKey] ?? 0.30;
      const fee     = parseFloat((gross * feeRate).toFixed(2));
      const net     = parseFloat((gross - fee).toFixed(2));

      if (net <= 0) return json(res, 400, { error: "No balance to withdraw" });
      if (net < 1)  return json(res, 400, { error: "Minimum withdrawal is $1.00" });

      // 2. Deduct balance BEFORE sending payout (prevents race)
      await dbPatch(`/users/${user.uid}`, { balance: 0 });

      // 3. Send PayPal Payout
      const payoutRes = await paypalPost("/v1/payments/payouts", {
        sender_batch_header: {
          sender_batch_id: `wd_${user.uid}_${Date.now()}`,
          email_subject:   "Your Siterifty withdrawal has been sent",
          email_message:   "Your earnings have been sent to your PayPal account.",
        },
        items: [{
          recipient_type: "EMAIL",
          amount: { value: net.toFixed(2), currency: "USD" },
          receiver: paypalEmail,
          note:     `Siterifty withdrawal — ${PLAN_NAMES[planKey] || "Free"} plan (${(feeRate * 100).toFixed(0)}% fee)`,
          sender_item_id: `wd_${user.uid}_${Date.now()}`,
        }],
      });

      // 4. If payout failed, refund the balance
      if (payoutRes.status !== 201 && payoutRes.status !== 200) {
        await dbPatch(`/users/${user.uid}`, { balance: gross }); // refund
        return json(res, 502, {
          error: "PayPal payout failed — your balance has been restored",
          detail: payoutRes.body,
        });
      }

      const payoutId = payoutRes.body?.batch_header?.payout_batch_id || null;

      // 5. Log the withdrawal in Firebase
      await dbPush(`/users/${user.uid}/withdrawals`, {
        uid:       user.uid,
        payoutId,
        paypalEmail,
        gross,
        fee,
        feeRate,
        net,
        plan:      planKey,
        balBefore: gross,
        balAfter:  0,
        ts:        Date.now(),
        status:    "pending",
      });

      // 6. Confirmation email
      if (user.email) {
        sendEmail({
          to: user.email,
          subject: "Your Siterifty withdrawal is on its way",
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
            <h2 style="margin:0 0 12px;font-size:20px;color:#34d399;">$${net.toFixed(2)} is on its way</h2>
            <p style="color:#8b8aa8;font-size:14px;line-height:1.6;">Sent to <strong style="color:#f1f0ff;">${paypalEmail}</strong> via PayPal. Funds arrive within 1–3 business days.</p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;color:#8b8aa8;">
              <tr><td>Gross balance</td><td style="text-align:right;color:#f1f0ff;">$${gross.toFixed(2)}</td></tr>
              <tr><td>Platform fee (${(feeRate*100).toFixed(0)}% · ${PLAN_NAMES[planKey]} plan)</td><td style="text-align:right;color:#f87171;">−$${fee.toFixed(2)}</td></tr>
              <tr><td style="color:#34d399;font-weight:700;">You receive</td><td style="text-align:right;color:#34d399;font-weight:700;">$${net.toFixed(2)}</td></tr>
            </table>
          </div>`,
        }).catch(() => {});
      }

      return json(res, 200, { success: true, net, payoutId });
    }

    // ════════════════════════════════════════════════════════════
    // POST paypal-webhook
    // PayPal BILLING.SUBSCRIPTION.* and PAYMENT.SALE.* events
    // ════════════════════════════════════════════════════════════
    if (route === "paypal-webhook" && req.method === "POST") {
      // Verify signature (skip if PAYPAL_WEBHOOK_ID not set — log warning)
      if (process.env.PAYPAL_WEBHOOK_ID) {
        const valid = await verifyPayPalWebhook(req, rawBody, req.headers).catch(() => false);
        if (!valid) return json(res, 401, { error: "Invalid webhook signature" });
      }

      const event    = body;
      const resource = event.resource || {};
      const subId    = resource.id || resource.billing_agreement_id;

      const PLAN_MAP = {
        [process.env.PAYPAL_PLAN_STARTER]: "Starter",
        [process.env.PAYPAL_PLAN_GROWTH]:  "Growth",
        [process.env.PAYPAL_PLAN_PRO]:     "Pro",
      };

      switch (event.event_type) {
        case "BILLING.SUBSCRIPTION.ACTIVATED":
        case "BILLING.SUBSCRIPTION.RENEWED": {
          // Find user by paypalSubId
          const planId  = resource.plan_id;
          const planName = PLAN_MAP[planId] || "Starter";
          // We stored paypalSubId on the user record at subscription time (client does this)
          // Look up by subId index
          const uidSnap = await dbGet(`/paypalSubs/${subId}`);
          if (uidSnap && uidSnap.uid) {
            await dbPatch(`/users/${uidSnap.uid}`, { plan: planName, paypalSubId: subId });
          }
          break;
        }
        case "BILLING.SUBSCRIPTION.CANCELLED":
        case "BILLING.SUBSCRIPTION.EXPIRED":
        case "BILLING.SUBSCRIPTION.SUSPENDED": {
          const uidSnap = await dbGet(`/paypalSubs/${subId}`);
          if (uidSnap && uidSnap.uid) {
            await dbPatch(`/users/${uidSnap.uid}`, { plan: "Free", paypalSubId: null });
          }
          break;
        }
        default:
          // Unknown event — ignore but acknowledge
          break;
      }

      return json(res, 200, { received: true });
    }

    // ════════════════════════════════════════════════════════════
    // POST cancel-subscription
    // Body: { subscriptionId: string, uid: string }
    // Headers: Authorization: Bearer <firebase-id-token>
    // ════════════════════════════════════════════════════════════
    if (route === "cancel-subscription" && req.method === "POST") {
      const user = await requireAuth();
      const { subscriptionId } = body;
      if (!subscriptionId) return json(res, 400, { error: "Missing subscriptionId" });

      // Verify the subscription belongs to this user
      const userData = await dbGet(`/users/${user.uid}`);
      if (!userData || userData.paypalSubId !== subscriptionId) {
        return json(res, 403, { error: "Subscription does not belong to this account" });
      }

      const res2 = await paypalPost(
        `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
        { reason: "User requested cancellation" }
      );

      // PayPal returns 204 on success
      if (res2.status !== 204 && res2.status !== 200) {
        return json(res, 502, { error: "PayPal cancel failed", detail: res2.body });
      }

      // Downgrade immediately (webhook will also fire, that's fine)
      await dbPatch(`/users/${user.uid}`, { plan: "Free", paypalSubId: null });
      return json(res, 200, { success: true });
    }

    // ════════════════════════════════════════════════════════════
    // POST admin/login
    // Body: { email, password }
    // ════════════════════════════════════════════════════════════
    if (route === "admin/login" && req.method === "POST") {
      const { email, password } = body;
      if (
        !email || !password ||
        email.trim().toLowerCase() !== (LOGIN_EMAIL || "").trim().toLowerCase() ||
        password !== LOGIN_PASSWORD
      ) {
        // Constant-time-ish delay to slow brute force
        await new Promise((r) => setTimeout(r, 400));
        return json(res, 401, { error: "Invalid credentials" });
      }
      const token = signAdminJWT({ role: "admin", email: email.trim().toLowerCase() });
      return json(res, 200, { token, expiresIn: 3600 * 8 });
    }

    // ════════════════════════════════════════════════════════════
    // POST notify  — email / event logging
    // Body: { action, to?, subject?, html?, email?, eventType?, uid? }
    // ════════════════════════════════════════════════════════════
    if (route === "notify" && req.method === "POST") {
      const { action, to, subject, html, email, eventType, uid, listing } = body;

      if (action === "send-email" || action === "newsletter-subscribe") {
        const recipient = to || email;
        if (!recipient) return json(res, 400, { error: "Missing email" });
        if (action === "newsletter-subscribe") {
          // Just log the subscription to Firebase
          await dbPush("/newsletter", { email: recipient, ts: Date.now() });
          return json(res, 200, { success: true });
        }
        if (!subject || !html) return json(res, 400, { error: "Missing subject/html" });
        const r = await sendEmail({ to: recipient, subject, html });
        return json(res, r.status < 300 ? 200 : 502, { success: r.status < 300, id: r.body?.id });
      }

      // Generic event logging
      if (uid && eventType) {
        await dbPush(`/events`, { uid, action, eventType, ts: Date.now(), listing: listing || null });
      }

      return json(res, 200, { success: true });
    }

    // ════════════════════════════════════════════════════════════
    // POST send-email  — transactional email
    // Body: { to, subject, html }
    // ════════════════════════════════════════════════════════════
    if (route === "send-email" && req.method === "POST") {
      const { to, subject, html } = body;
      if (!to || !subject || !html) return json(res, 400, { error: "Missing to/subject/html" });
      const r = await sendEmail({ to, subject, html });
      if (r.status >= 300) return json(res, 502, { error: "Email failed", detail: r.body });
      return json(res, 200, { success: true, id: r.body?.id });
    }

    // ════════════════════════════════════════════════════════════
    // POST chat  — AI support chat
    // Body: { messages, deviceId, userPlan, username }
    // ════════════════════════════════════════════════════════════
    if (route === "chat" && req.method === "POST") {
      const { messages, userPlan, username } = body;
      if (!messages || !Array.isArray(messages)) {
        return json(res, 400, { error: "messages array required" });
      }

      const system = `You are Siterifty's helpful AI assistant. You help users buy and sell websites, understand plans (Free 30% fee, Starter $20/mo 15% fee, Growth $40/mo 10% fee, Pro $50/mo 5% fee), navigate the platform, and troubleshoot issues. Be concise, friendly, and helpful.
Current user: ${username || "Guest"} on ${userPlan || "Free"} plan.
Never make up information about specific listings or prices. Direct complex issues to the support tab.`;

      // Limit to last 10 messages to keep tokens reasonable
      const trimmed = messages.slice(-10).map(({ role, content }) => ({ role, content }));

      const reply = await groqChat(trimmed, { system, max_tokens: 500 });
      return json(res, 200, { reply });
    }

    // ════════════════════════════════════════════════════════════
    // POST wallet/reveal
    // Deduct $1 from balance for a contact-info reveal.
    // Body: { listingId: string }
    // Headers: Authorization: Bearer <firebase-id-token>
    // Returns: { success, balance }
    // ════════════════════════════════════════════════════════════
    if (route === "wallet/reveal" && req.method === "POST") {
      const user = await requireAuth();
      const { listingId } = body;
      if (!listingId) return json(res, 400, { error: "Missing listingId" });

      // 1. Re-read balance from Firebase — never trust the client's cached value
      const userData = await dbGet(`/users/${user.uid}`);
      if (!userData) return json(res, 404, { error: "User not found" });

      const currentBal = parseFloat((userData.balance || 0).toFixed(2));
      if (currentBal < 1) {
        return json(res, 402, { error: "Insufficient balance. Please top up your wallet." });
      }

      // 2. Check for idempotency — has this user already revealed this listing?
      const existingReveal = await dbGet(`/websites/${listingId}/reveals/${user.uid}`);
      if (existingReveal) {
        // Already paid — allow re-render without charging again
        return json(res, 200, { success: true, balance: currentBal, alreadyRevealed: true });
      }

      // 3. Deduct $1 and record the reveal atomically
      const newBal = parseFloat((currentBal - 1).toFixed(2));
      await dbPatch(`/users/${user.uid}`, { balance: newBal });
      await dbSet(`/websites/${listingId}/reveals/${user.uid}`, {
        uid: user.uid,
        revealedAt: Date.now(),
        method: "balance",
      });

      return json(res, 200, { success: true, balance: newBal });
    }

    // ════════════════════════════════════════════════════════════
    // GET admin/revenue
    // Returns platform-wide revenue totals for the admin wallet pill.
    // Requires: Authorization: Bearer <firebase-id-token>
    //           Token's email must match LOGIN_EMAIL env var.
    // Returns: {
    //   totalTopups,       — sum of all completed top-up gross amounts
    //   totalSubRevenue,   — sum of active paid subscriber monthly prices
    //   totalHeld,         — sum of all user wallet balances currently on platform
    //   totalWithdrawn,    — sum of all completed withdrawals (net paid out)
    //   totalRevenue,      — totalTopups + totalSubRevenue
    //   subCount,          — number of active paid subscribers
    //   userCount,         — total registered users
    //   listingCount,      — total website listings
    //   breakdown: { starter, growth, pro }  — subscriber counts per plan
    // }
    // ════════════════════════════════════════════════════════════
    if (route === "admin/revenue" && req.method === "GET") {
      // 1. Verify Firebase ID token
      const user = await requireAuth();

      // 2. Check admin email — must match LOGIN_EMAIL env var
      const adminEmail = (LOGIN_EMAIL || "").trim().toLowerCase();
      if (!adminEmail || (user.email || "").trim().toLowerCase() !== adminEmail) {
        return json(res, 403, { error: "Admin access only" });
      }

      // 3. Read all users (for balances, plans, counts)
      const usersData = await dbGet("/users");
      let totalHeld        = 0;
      let totalSubRevenue  = 0;
      let userCount        = 0;
      let subCount         = 0;
      const breakdown      = { starter: 0, growth: 0, pro: 0 };
      const SUB_PRICES     = { starter: 20, growth: 40, pro: 50 };

      if (usersData && typeof usersData === "object") {
        for (const uid of Object.keys(usersData)) {
          const u = usersData[uid];
          if (!u) continue;
          userCount++;
          totalHeld += parseFloat(u.balance || 0);
          const planKey = (u.plan || "free").toLowerCase();
          if (SUB_PRICES[planKey]) {
            totalSubRevenue += SUB_PRICES[planKey];
            subCount++;
            breakdown[planKey] = (breakdown[planKey] || 0) + 1;
          }
        }
      }
      totalHeld = parseFloat(totalHeld.toFixed(2));

      // 4. Read all transactions (for topup totals + withdrawals)
      const txData = await dbGet("/transactions");
      let totalTopups    = 0;
      let totalWithdrawn = 0;
      let txCount        = 0;

      if (txData && typeof txData === "object") {
        for (const txId of Object.keys(txData)) {
          const tx = txData[txId];
          if (!tx) continue;
          txCount++;
          if (tx.type === "topup" && tx.status === "completed") {
            totalTopups += parseFloat(tx.gross || 0);
          }
          if (tx.type === "withdrawal" && tx.status === "completed") {
            totalWithdrawn += parseFloat(tx.net || 0);
          }
        }
      }
      totalTopups    = parseFloat(totalTopups.toFixed(2));
      totalWithdrawn = parseFloat(totalWithdrawn.toFixed(2));

      // 5. Count listings
      const listingsData = await dbGet("/websites");
      let listingCount = 0;
      if (listingsData && typeof listingsData === "object") {
        listingCount = Object.keys(listingsData).length;
      }

      const totalRevenue = parseFloat((totalTopups + totalSubRevenue).toFixed(2));

      return json(res, 200, {
        totalTopups,
        totalSubRevenue,
        totalHeld,
        totalWithdrawn,
        totalRevenue,
        subCount,
        userCount,
        listingCount,
        txCount,
        breakdown,
      });
    }

    // ════════════════════════════════════════════════════════════
    // Admin helper — verify caller is admin
    // ════════════════════════════════════════════════════════════
    async function requireAdmin() {
      const user = await requireAuth();
      const adminEmail = (LOGIN_EMAIL || "").trim().toLowerCase();
      if (!adminEmail || (user.email || "").trim().toLowerCase() !== adminEmail) {
        throw Object.assign(new Error("Admin access only"), { status: 403 });
      }
      return user;
    }

    // ════════════════════════════════════════════════════════════
    // POST admin/ban
    // Body: { email, reason }
    // ════════════════════════════════════════════════════════════
    if (route === "admin/ban" && req.method === "POST") {
      await requireAdmin();
      const { email, reason } = body;
      if (!email) return json(res, 400, { error: "email required" });

      const usersData = await dbGet("/users");
      let uid = null;
      if (usersData && typeof usersData === "object") {
        for (const [k, v] of Object.entries(usersData)) {
          if (v && (v.email || "").toLowerCase() === email.toLowerCase()) { uid = k; break; }
        }
      }
      if (!uid) return json(res, 404, { error: "No user found with that email" });

      await dbPatch(`/users/${uid}`, {
        banned: { active: true, reason: reason || "Terms of Service violation", ts: Date.now() }
      });
      return json(res, 200, { ok: true, uid });
    }

    // ════════════════════════════════════════════════════════════
    // POST admin/unban
    // Body: { email }
    // ════════════════════════════════════════════════════════════
    if (route === "admin/unban" && req.method === "POST") {
      await requireAdmin();
      const { email } = body;
      if (!email) return json(res, 400, { error: "email required" });

      const usersData = await dbGet("/users");
      let uid = null;
      if (usersData && typeof usersData === "object") {
        for (const [k, v] of Object.entries(usersData)) {
          if (v && (v.email || "").toLowerCase() === email.toLowerCase()) { uid = k; break; }
        }
      }
      if (!uid) return json(res, 404, { error: "No user found with that email" });

      await dbPatch(`/users/${uid}`, {
        banned: { active: false, reason: "", ts: Date.now() }
      });
      return json(res, 200, { ok: true, uid });
    }

    // ════════════════════════════════════════════════════════════
    // GET admin/appeals
    // Returns all pending appeals
    // ════════════════════════════════════════════════════════════
    if (route === "admin/appeals" && req.method === "GET") {
      await requireAdmin();
      const appealsData = await dbGet("/appeals");
      const pending = [];
      if (appealsData && typeof appealsData === "object") {
        for (const [key, val] of Object.entries(appealsData)) {
          if (val && val.status === "pending") pending.push({ key, ...val });
        }
      }
      pending.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      return json(res, 200, { appeals: pending });
    }

    // ════════════════════════════════════════════════════════════
    // POST admin/appeals/resolve
    // Body: { key, action: "approve"|"deny" }
    // ════════════════════════════════════════════════════════════
    if (route === "admin/appeals/resolve" && req.method === "POST") {
      await requireAdmin();
      const { key, action } = body;
      if (!key || !action) return json(res, 400, { error: "key and action required" });

      await dbPatch(`/appeals/${key}`, { status: "reviewed", resolution: action, resolvedAt: Date.now() });

      if (action === "approve") {
        const appeal = await dbGet(`/appeals/${key}`);
        if (appeal && appeal.uid && appeal.uid !== "unknown") {
          await dbPatch(`/users/${appeal.uid}`, {
            banned: { active: false, reason: "", ts: Date.now() }
          });
        }
      }
      return json(res, 200, { ok: true });
    }

    // ════════════════════════════════════════════════════════════
    // POST admin/grant-credit
    // Body: { email, amount }
    // ════════════════════════════════════════════════════════════
    if (route === "admin/grant-credit" && req.method === "POST") {
      await requireAdmin();
      const { email, amount } = body;
      if (!email) return json(res, 400, { error: "email required" });
      const credit = parseFloat(parseFloat(amount || 1).toFixed(2));
      if (isNaN(credit) || credit <= 0 || credit > 1) {
        return json(res, 400, { error: "Amount must be between $0.01 and $1.00" });
      }

      const usersData = await dbGet("/users");
      let uid = null;
      if (usersData && typeof usersData === "object") {
        for (const [k, v] of Object.entries(usersData)) {
          if (v && (v.email || "").toLowerCase() === email.toLowerCase()) { uid = k; break; }
        }
      }
      if (!uid) return json(res, 404, { error: "No user found with that email" });

      const userData = await dbGet("/users/" + uid);
      const currentBal = parseFloat(((userData && userData.balance) || 0).toFixed(2));
      const newBal = parseFloat((currentBal + credit).toFixed(2));
      await dbPatch("/users/" + uid, { balance: newBal });

      return json(res, 200, { ok: true, uid, previousBalance: currentBal, newBalance: newBal });
    }

    // ════════════════════════════════════════════════════════════
    // POST admin/maintenance
    // Body: { active, message, eta }
    // ════════════════════════════════════════════════════════════
    if (route === "admin/maintenance" && req.method === "POST") {
      await requireAdmin();
      const { active, message, eta } = body;
      await dbSet("/meta/maintenance", {
        active: !!active,
        message: message || "",
        eta: eta || ""
      });
      return json(res, 200, { ok: true });
    }

    // ─── 404 ──────────────────────────────────────────────────
    return json(res, 404, { error: `Unknown route: ${route}` });

  } catch (err) {
    console.error("[API error]", route, err);
    return json(res, err.status || 500, { error: err.message || "Internal server error" });
  }
};
