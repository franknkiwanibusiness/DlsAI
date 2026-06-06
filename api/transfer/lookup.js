// api/transfer/lookup.js — Recipient lookup for transfer flow
// Verifies sender auth, resolves recipient email → display name
// Server-side only — never exposes UIDs or sensitive data to frontend

import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idToken, recipientEmail } = req.body || {};

  if (!idToken || !recipientEmail) {
    return res.status(400).json({ error: 'Missing fields.' });
  }

  // Verify sender
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Authentication failed.' });
  }

  const recipientEmailNorm = recipientEmail.trim().toLowerCase();
  const senderEmail        = (decoded.email || '').toLowerCase();

  if (senderEmail === recipientEmailNorm) {
    return res.status(400).json({ error: 'You cannot transfer to yourself.' });
  }

  // Resolve recipient
  let recipientRecord;
  try {
    recipientRecord = await admin.auth().getUserByEmail(recipientEmailNorm);
  } catch {
    return res.status(404).json({ error: 'No Siterifty account found with that email address.' });
  }

  // Check recipient isn't banned
  const banSnap = await db.ref(`users/${recipientRecord.uid}/banned/active`).get();
  if (banSnap.val() === true) {
    return res.status(400).json({ error: 'This account is not eligible to receive transfers.' });
  }

  // Fetch display name from DB (username takes priority)
  const recipientDbSnap = await db.ref(`users/${recipientRecord.uid}`).get();
  const recipientData   = recipientDbSnap.val() || {};

  const displayName =
    recipientData.username ||
    recipientData.displayName ||
    recipientRecord.displayName ||
    '';

  return res.status(200).json({
    email: recipientEmailNorm,
    name:  displayName,
  });
}
