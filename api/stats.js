/**
 * /api/stats.js — visitor counter + homepage stat numbers
 * GET /api/stats
 * Returns: { ok, a, b, c }
 *   a = sellers (thousands)   — displayed as "Xk+ sellers"
 *   b = sites listed (thousands) — displayed as "Xk+ sites listed"
 *   c = countries             — displayed as "X+ countries"
 */

import https  from 'https';
import crypto from 'crypto';

const {
  FIREBASE_DATABASE_URL,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

// ─── Tiny HTTP helper ────────────────────────────────────────────────────────
function request(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      headers: { ...headers, ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ─── Firebase token (service account) ───────────────────────────────────────
let _fbAccessToken = null;
let _fbTokenExpiry = 0;

async function getFirebaseToken() {
  if (_fbAccessToken && Date.now() < _fbTokenExpiry) return _fbAccessToken;

  const now    = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim  = Buffer.from(JSON.stringify({
    iss: FIREBASE_CLIENT_EMAIL,
    sub: FIREBASE_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/userinfo.email',
  })).toString('base64url');

  const privateKey = (FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(privateKey, 'base64url');
  const jwt = `${header}.${claim}.${signature}`;

  const res = await request('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (res.status !== 200) throw new Error('Firebase token error: ' + JSON.stringify(res.body));
  _fbAccessToken = res.body.access_token;
  _fbTokenExpiry = Date.now() + (res.body.expires_in - 120) * 1000;
  return _fbAccessToken;
}

const DB = () => (FIREBASE_DATABASE_URL || '').replace(/\/$/, '');

async function dbGet(path) {
  const token = await getFirebaseToken();
  const res = await request(`${DB()}${path}.json?access_token=${token}`);
  if (res.status !== 200) throw new Error('DB read failed: ' + path);
  return res.body;
}

async function dbSet(path, data) {
  const token = await getFirebaseToken();
  const res = await request(`${DB()}${path}.json?access_token=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.status !== 200) throw new Error('DB set failed: ' + path);
  return res.body;
}

// ─── CORS ────────────────────────────────────────────────────────────────────
function setCORS(req, res) {
  const origin = (req.headers && req.headers.origin) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Fire-and-forget visitor count increment
  dbGet('/meta/visitorCount').then((count) => {
    dbSet('/meta/visitorCount', (parseInt(count || 0) + 1));
  }).catch(() => {});

  const BASE_DATE = new Date('2024-01-01').getTime();
  const daysSince = Math.floor((Date.now() - BASE_DATE) / 86400000);
  const a = Math.floor(12 + daysSince * 0.04);
  const b = Math.floor(8  + daysSince * 0.03);
  const c = Math.floor(40 + daysSince * 0.02);

  return res.status(200).json({ ok: true, a, b, c });
}
