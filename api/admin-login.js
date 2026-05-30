// api/admin-login.js
// Vercel Serverless Function — POST /api/admin-login
//
// Required Vercel environment variables:
//   EMAIL_API_KEY          — super admin email
//   PASSWORD_API_KEY       — super admin password
//   FIREBASE_PROJECT_ID    — e.g. itzhoyoo-f9f7e
//   FIREBASE_DATABASE_URL  — e.g. https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com
//   FIREBASE_CLIENT_EMAIL  — service account client_email
//   FIREBASE_PRIVATE_KEY   — service account private_key (include \n escapes)

import admin from 'firebase-admin';

// ── Initialize Firebase Admin (once per cold start) ────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores \n as literal \\n in env — unescape it
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// ── CORS helper ────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORS(res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const superEmail    = process.env.EMAIL_API_KEY;
  const superPassword = process.env.PASSWORD_API_KEY;

  // ── Determine role ─────────────────────────────────────────────────────
  let role = null; // null = denied, 'super' = full access, 'support' = limited

  // 1. Check if super admin credentials
  if (email === superEmail && password === superPassword) {
    role = 'super';
  }

  // 2. If not super, check Firebase for a matching user with isAdmin = true
  //    (password doesn't need to match for support admins — they just need
  //     to be flagged in Firebase AND provide any non-empty password)
  if (!role && password) {
    try {
      // Look up the Firebase Auth user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      // Check Realtime Database flag
      const snap = await admin
        .database()
        .ref(`users/${userRecord.uid}/isAdmin`)
        .once('value');

      if (snap.val() === true) {
        role = 'support';
      }
    } catch (e) {
      // getUserByEmail throws if user not found — treat as denied
    }
  }

  if (!role) {
    // Generic message — don't reveal whether email exists
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // ── Mint a Firebase custom token ───────────────────────────────────────
  //    We embed the role as a custom claim so the client can read it
  //    from the ID token without an extra DB call.
  try {
    // Find or resolve the UID for the token
    let uid;
    if (role === 'super') {
      // Super admin may or may not exist in Firebase Auth — create a
      // deterministic synthetic UID so the token is always valid
      try {
        const rec = await admin.auth().getUserByEmail(superEmail);
        uid = rec.uid;
      } catch {
        // User doesn't exist in Auth — use a stable synthetic UID
        uid = 'super-admin-' + Buffer.from(superEmail).toString('hex').slice(0, 16);
      }
    } else {
      const rec = await admin.auth().getUserByEmail(email);
      uid = rec.uid;
    }

    const customToken = await admin.auth().createCustomToken(uid, {
      role,                          // 'super' | 'support'
      adminEmail: email,
    });

    return res.status(200).json({ token: customToken, role });
  } catch (e) {
    console.error('Token mint error:', e);
    return res.status(500).json({ error: 'Failed to create session. Try again.' });
  }
}
