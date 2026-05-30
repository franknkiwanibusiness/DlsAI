// api/admin-login.js
// Vercel Serverless Function — POST /api/admin-login
//
// Required Vercel environment variables:
//   EMAIL_API_KEY          — super admin email
//   PASSWORD_API_KEY       — super admin password
//   FIREBASE_PROJECT_ID
//   FIREBASE_DATABASE_URL
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const superEmail    = process.env.EMAIL_API_KEY;
  const superPassword = process.env.PASSWORD_API_KEY;

  // ── Path 1: Super admin ────────────────────────────────────────────────
  // Must match both EMAIL_API_KEY and PASSWORD_API_KEY exactly.
  if (email === superEmail && password === superPassword) {
    try {
      let uid;
      try {
        const rec = await admin.auth().getUserByEmail(superEmail);
        uid = rec.uid;
      } catch {
        uid = 'super-admin-' + Buffer.from(superEmail).toString('hex').slice(0, 16);
      }
      const token = await admin.auth().createCustomToken(uid, { role: 'super', adminEmail: email });
      return res.status(200).json({ token, role: 'super' });
    } catch (e) {
      console.error('Super token error:', e);
      return res.status(500).json({ error: 'Failed to create session.' });
    }
  }

  // ── Path 2: Support admin ──────────────────────────────────────────────
  // Email only — just needs users/{uid}/isAdmin = true in Firebase.
  // Password field is ignored entirely for support admins.
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const snap = await admin.database().ref(`users/${userRecord.uid}/isAdmin`).once('value');
    if (snap.val() !== true) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = await admin.auth().createCustomToken(userRecord.uid, { role: 'support', adminEmail: email });
    return res.status(200).json({ token, role: 'support' });
  } catch (e) {
    console.error('Support login error:', e);
    return res.status(500).json({ error: 'Failed to create session.' });
  }
}
