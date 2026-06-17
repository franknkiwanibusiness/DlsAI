// /api/listing.js
//
// Handles everything the "Sell My Site" form's AI AutoFill + Ownership
// Verification UI calls on a single endpoint:
//
//   POST /api/listing   action=autofill-meta     { url }                 -> { meta }
//   POST /api/listing   action=autofill-enhance  { url, meta }           -> { title, description }
//   POST /api/listing   action=verify-meta       { url, token }          -> { verified, error? }
//   POST /api/listing   action=verify (multipart){ file, type, domain, email } -> { approved, reason? }
//
// Auth: autofill-meta / autofill-enhance / verify-meta require a Firebase ID
// token (Authorization: Bearer <token>) so this can't be used as an open
// SSRF/AI-cost proxy by anonymous callers. verify-meta additionally re-reads
// the *real* stored token from Firebase for that uid+domain rather than
// trusting the token the client sends, so a caller cannot pass an arbitrary
// token and self-certify a domain they don't actually have a record for.
//
// Required env vars:
//   FIREBASE_PROJECT_ID, FIREBASE_DATABASE_URL, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   GROQ_API_KEY        (text — autofill-enhance)
//   GROQ_VISION_API_KEY (optional override; falls back to GROQ_API_KEY — doc screenshot review)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }, // we parse JSON and multipart ourselves below
};

// ── Config ───────────────────────────────────────────────────────────────
const GROQ_TEXT_MODEL   = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'llama-3.2-90b-vision-preview';
const FETCH_TIMEOUT_MS  = 8000;
const MAX_HTML_BYTES    = 2 * 1024 * 1024;   // don't read more than 2MB of HTML
const MAX_IMAGE_BYTES   = 8 * 1024 * 1024;   // 8MB cap on proof screenshots

// Per-uid rate limiting (in-memory; fine for a single serverless instance,
// resets on cold start — good enough to blunt accidental loops/abuse without
// needing a separate datastore). Keyed by `${uid}:${action}`.
const RATE_LIMITS = {
  'autofill-meta':    { max: 20, windowMs: 60 * 60 * 1000 },
  'autofill-enhance': { max: 20, windowMs: 60 * 60 * 1000 },
  'verify-meta':      { max: 30, windowMs: 60 * 60 * 1000 },
  'verify':           { max: 20, windowMs: 60 * 60 * 1000 },
};
const _rateBuckets = new Map(); // key -> [timestamps]

function isRateLimited(uid, action) {
  const cfg = RATE_LIMITS[action];
  if (!cfg) return false;
  const key = uid + ':' + action;
  const now = Date.now();
  const arr = (_rateBuckets.get(key) || []).filter(t => now - t < cfg.windowMs);
  if (arr.length >= cfg.max) {
    _rateBuckets.set(key, arr);
    return true;
  }
  arr.push(now);
  _rateBuckets.set(key, arr);
  return false;
}

// ── Firebase admin init (reuse across invocations) ──────────────────────
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

async function requireAuth(req) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return null;
  initFirebase();
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.uid;
  } catch (err) {
    return null;
  }
}

// ── URL helpers ──────────────────────────────────────────────────────────

function normalizeUrl(raw) {
  let s = (raw || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    return u;
  } catch (e) {
    return null;
  }
}

// Block requests aimed at internal/private network ranges so this endpoint
// can't be used as an SSRF pivot against internal infrastructure or cloud
// metadata endpoints. Best-effort hostname/IP literal check — not a substitute
// for network-level egress controls, but stops the obvious cases.
function isBlockedHost(hostname) {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '169.254.169.254') return true; // cloud metadata
  if (h === '::1' || h === '0.0.0.0') return true;
  const ipMatch = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const a = parseInt(ipMatch[1], 10);
    const b = parseInt(ipMatch[2], 10);
    if (a === 127) return true;                       // loopback
    if (a === 10) return true;                         // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;            // 192.168.0.0/16
    if (a === 169 && b === 254) return true;            // link-local
  }
  return false;
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(t);
  }
}

// Read up to maxBytes of a response body as text (avoids pulling down huge pages).
async function readTextCapped(resp, maxBytes) {
  const reader = resp.body?.getReader ? resp.body.getReader() : null;
  if (!reader) return await resp.text(); // environments without streaming body

  const decoder = new TextDecoder();
  let received = 0;
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    out += decoder.decode(value, { stream: true });
    if (received >= maxBytes) {
      try { await reader.cancel(); } catch (_) {}
      break;
    }
  }
  return out;
}

// ── Meta tag extraction ─────────────────────────────────────────────────

function extractMeta(html) {
  const get = (re) => {
    const m = html.match(re);
    return m ? m[1].trim() : null;
  };

  const title =
    get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ||
    get(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i) ||
    get(/<title[^>]*>([^<]*)<\/title>/i);

  const description =
    get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
    get(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i) ||
    get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    get(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);

  const siteName =
    get(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i);

  const image =
    get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);

  const decodeEntities = (s) => s
    ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    : s;

  return {
    title:       decodeEntities(title),
    description: decodeEntities(description),
    siteName:    decodeEntities(siteName),
    image,
  };
}

// Find our own ownership-verification meta tag in raw HTML.
function findVerificationToken(html) {
  const m = html.match(
    /<meta[^>]+name=["']siterifty-site-verification["'][^>]+content=["']([a-f0-9]+)["']/i
  ) || html.match(
    /<meta[^>]+content=["']([a-f0-9]+)["'][^>]+name=["']siterifty-site-verification["']/i
  );
  return m ? m[1].trim().toLowerCase() : null;
}

// ── action: autofill-meta ───────────────────────────────────────────────

async function handleAutofillMeta(body, res) {
  const target = normalizeUrl(body?.url);
  if (!target) return res.status(400).json({ error: 'Please enter a valid URL.' });
  if (isBlockedHost(target.hostname)) {
    return res.status(400).json({ error: 'That URL cannot be fetched.' });
  }

  let resp;
  try {
    resp = await fetchWithTimeout(target.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteriftyBot/1.0; +https://siterifty.com)' },
    });
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'The site took too long to respond.' : 'Could not reach this URL.';
    return res.status(502).json({ error: reason });
  }

  if (!resp.ok) {
    return res.status(502).json({ error: `Site responded with ${resp.status}. Make sure it's public.` });
  }

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return res.status(400).json({ error: 'URL does not appear to be a webpage.' });
  }

  const html = await readTextCapped(resp, MAX_HTML_BYTES);
  const meta = extractMeta(html);

  if (!meta.title && !meta.description) {
    return res.status(200).json({
      meta: { title: null, description: null, siteName: null, image: null },
      warning: 'No meta title/description found on this page — AI enhancement will work from the URL alone.',
    });
  }

  return res.status(200).json({ meta });
}

// ── action: autofill-enhance ────────────────────────────────────────────

async function handleAutofillEnhance(body, res) {
  const target = normalizeUrl(body?.url);
  if (!target) return res.status(400).json({ error: 'Please enter a valid URL.' });

  const meta = body?.meta || {};
  const rawTitle = (meta.title || '').slice(0, 300);
  const rawDesc  = (meta.description || '').slice(0, 1000);

  if (!rawTitle && !rawDesc) {
    // Nothing to enhance — fall back to a generic skeleton based on the domain.
    const domain = target.hostname.replace(/^www\./, '');
    return res.status(200).json({
      title: domain,
      description: `A website at ${domain}. Add a few sentences about what it does, who it's for, and why it's a good acquisition.`,
    });
  }

  const systemPrompt = `You write concise, honest marketplace listing copy for websites being sold on Siterifty. You are given the raw meta title/description scraped from a site's homepage and must turn it into compelling but accurate listing copy.

Rules:
- Do not invent revenue, traffic, or financial figures — those are entered separately by the seller.
- Do not make unverifiable claims ("#1 in its niche", "guaranteed income").
- Title: max 80 characters, no quotes, sounds like a marketplace listing title (not a marketing slogan).
- Description: 2-4 sentences, max 500 characters, written for a buyer evaluating an acquisition — what the site does, who uses it, what's included.
- Output ONLY valid JSON, no markdown, no commentary: {"title": "...", "description": "..."}`;

  const userPrompt = JSON.stringify({ url: target.toString(), scraped_title: rawTitle, scraped_description: rawDesc });

  let aiResp;
  try {
    aiResp = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    }, 15000);
  } catch (err) {
    return res.status(502).json({ error: 'AI enhancement timed out. Please try again.' });
  }

  if (!aiResp.ok) {
    console.error('[listing/autofill-enhance] Groq error', aiResp.status, await aiResp.text().catch(() => ''));
    return res.status(502).json({ error: 'AI enhancement failed. Please try again.' });
  }

  const data = await aiResp.json();
  let parsed;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch (e) {
    return res.status(502).json({ error: 'AI returned an unexpected response. Please try again.' });
  }

  const title = (parsed.title || rawTitle || '').slice(0, 80);
  const description = (parsed.description || rawDesc || '').slice(0, 500);

  return res.status(200).json({ title, description });
}

// ── action: verify-meta ─────────────────────────────────────────────────

async function handleVerifyMeta(uid, body, res) {
  const target = normalizeUrl(body?.url);
  if (!target) return res.status(400).json({ verified: false, error: 'Please enter a valid URL.' });
  if (isBlockedHost(target.hostname)) {
    return res.status(400).json({ verified: false, error: 'That URL cannot be verified.' });
  }

  // Re-derive the domain key the same way the frontend does, and look up the
  // *server-trusted* token for this uid+domain in Firebase — never trust a
  // token value the client sends, since otherwise anyone could pass any
  // token string and "verify" a domain they don't have a record for.
  const domainKey = target.hostname.replace(/^www\./, '').replace(/[.#$\[\]/]/g, '_');
  const db = getDatabase();
  const path = `users/${uid}/metaVerify/${domainKey}`;
  const snap = await db.ref(path).get();

  if (!snap.exists() || !snap.val()?.token) {
    return res.status(400).json({ verified: false, error: 'No verification token found for this domain. Reload the form and try again.' });
  }
  const record = snap.val();
  const expectedToken = String(record.token).toLowerCase();

  // Defense in depth: if the client did send a token, it must match the
  // server-stored one. If it sent none, we still proceed using the stored token.
  if (body?.token && String(body.token).toLowerCase() !== expectedToken) {
    return res.status(400).json({ verified: false, error: 'Verification token mismatch. Reload the form and try again.' });
  }

  let resp;
  try {
    resp = await fetchWithTimeout(target.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteriftyBot/1.0; +https://siterifty.com)' },
    });
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'The site took too long to respond.' : 'Could not reach this URL.';
    return res.status(200).json({ verified: false, error: reason });
  }

  if (!resp.ok) {
    return res.status(200).json({ verified: false, error: `Site responded with ${resp.status}.` });
  }

  const html = await readTextCapped(resp, MAX_HTML_BYTES);
  const foundToken = findVerificationToken(html);

  if (!foundToken || foundToken !== expectedToken) {
    return res.status(200).json({ verified: false, error: "Tag not found. Make sure it's in <head> and the site is live." });
  }

  // Persist verified status server-side too (source of truth), even though
  // the frontend also writes this to Firebase directly after a true response.
  await db.ref(path).update({ status: 'verified', verifiedAt: Date.now() }).catch(err => {
    console.warn('[listing/verify-meta] failed to persist verified status', err);
  });

  return res.status(200).json({ verified: true });
}

// ── action: verify (domain/hosting ownership screenshot) ──────────────────

async function readUploadedFile(filePart) {
  const filepath = filePart.filepath || filePart.path;
  const buf = await fs.promises.readFile(filepath);
  return buf;
}

async function handleVerifyScreenshot(fields, filePart, res) {
  const type = (fields.type || '').toString();   // 'domain' | 'hosting'
  const domain = (fields.domain || '').toString().trim().toLowerCase();
  const email = (fields.email || '').toString().trim().toLowerCase();

  if (!['domain', 'hosting'].includes(type)) {
    return res.status(400).json({ approved: false, reason: 'Invalid verification type.' });
  }
  if (!filePart) {
    return res.status(400).json({ approved: false, reason: 'No file uploaded.' });
  }
  if (filePart.size > MAX_IMAGE_BYTES) {
    return res.status(400).json({ approved: false, reason: 'File too large (max 8MB).' });
  }
  const mime = filePart.mimetype || filePart.type || '';
  if (!mime.startsWith('image/')) {
    return res.status(400).json({ approved: false, reason: 'Please upload an image (screenshot), not a document.' });
  }

  const buf = await readUploadedFile(filePart);
  const b64 = buf.toString('base64');

  const promptByType = {
    domain: `This is a screenshot of a domain registrar account page (e.g. GoDaddy, Namecheap, Cloudflare, Google Domains). Verify ALL of the following are visibly true in the image:
1. The domain shown matches: "${domain}"
2. An account email or contact email visible in the screenshot matches: "${email}" (or the screenshot otherwise clearly belongs to an account using that email)
3. The screenshot looks like a genuine registrar dashboard, not an edited image or unrelated screenshot.`,
    hosting: `This is a screenshot of a hosting/server dashboard (e.g. Vercel, Netlify, AWS, DigitalOcean, cPanel). Verify ALL of the following are visibly true in the image:
1. The domain or project shown is associated with: "${domain}"
2. An account email visible in the screenshot matches: "${email}" (or the screenshot otherwise clearly belongs to an account using that email)
3. The screenshot looks like a genuine hosting dashboard, not an edited image or unrelated screenshot.`,
  };

  const systemPrompt = `You are a strict fraud-review assistant verifying proof-of-ownership screenshots for a website marketplace (Siterifty). Sellers upload a screenshot to prove they control a domain or hosting account. Be skeptical — sellers are financially motivated to pass this check.

Respond with ONLY valid JSON, no markdown:
{"approved": true|false, "reason": "short explanation, especially if rejected", "confidence": "low"|"medium"|"high"}

Reject if: the domain/email doesn't match, the image looks edited/cropped to hide details, it's not actually a registrar/hosting dashboard, or you cannot clearly confirm the required details.`;

  let aiResp;
  try {
    aiResp = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_VISION_API_KEY || process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: promptByType[type] },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
            ],
          },
        ],
      }),
    }, 20000);
  } catch (err) {
    return res.status(502).json({ approved: false, reason: 'Verification timed out. Please try again.' });
  }

  if (!aiResp.ok) {
    console.error('[listing/verify-screenshot] Groq error', aiResp.status, await aiResp.text().catch(() => ''));
    return res.status(502).json({ approved: false, reason: 'Verification failed. Please try again.' });
  }

  const data = await aiResp.json();
  let parsed;
  try {
    parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch (e) {
    return res.status(502).json({ approved: false, reason: 'Verification returned an unexpected response.' });
  }

  return res.status(200).json({
    approved: !!parsed.approved,
    reason: parsed.reason || null,
    confidence: parsed.confidence || null,
  });
}

// ── Body parsing helpers ────────────────────────────────────────────────

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: MAX_IMAGE_BYTES });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const flat = {};
      for (const [k, v] of Object.entries(fields)) flat[k] = Array.isArray(v) ? v[0] : v;
      const fileEntry = files.file ? (Array.isArray(files.file) ? files.file[0] : files.file) : null;
      resolve({ fields: flat, file: fileEntry });
    });
  });
}

// ── HTTP handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const contentType = req.headers['content-type'] || '';

  try {
    // ── multipart branch: action=verify (screenshot upload) ──
    if (contentType.includes('multipart/form-data')) {
      const uid = await requireAuth(req);
      if (!uid) return res.status(401).json({ approved: false, reason: 'Please sign in.' });

      const { fields, file } = await parseMultipart(req);
      if (fields.action !== 'verify') {
        return res.status(400).json({ error: 'Unknown action for multipart request.' });
      }
      if (isRateLimited(uid, 'verify')) {
        return res.status(429).json({ approved: false, reason: 'Too many verification attempts. Please wait a bit and try again.' });
      }
      return await handleVerifyScreenshot(fields, file, res);
    }

    // ── JSON branch: autofill-meta / autofill-enhance / verify-meta ──
    const body = await readJsonBody(req);
    const action = body?.action;

    if (!['autofill-meta', 'autofill-enhance', 'verify-meta'].includes(action)) {
      return res.status(400).json({ error: 'Unknown or missing action.' });
    }

    const uid = await requireAuth(req);
    if (!uid) return res.status(401).json({ error: 'Please sign in to use this feature.' });

    if (isRateLimited(uid, action)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a bit and try again.' });
    }

    if (action === 'autofill-meta')    return await handleAutofillMeta(body, res);
    if (action === 'autofill-enhance') return await handleAutofillEnhance(body, res);
    if (action === 'verify-meta') {
      initFirebase();
      return await handleVerifyMeta(uid, body, res);
    }
  } catch (err) {
    console.error('[api/listing]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
