// api/transfer/lookup.js — Recipient email lookup for transfer modal
// Verifies a recipient exists without exposing sensitive data

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
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const recipientEmailNorm = recipientEmail.trim().toLowerCase();

  // Verify sender is authenticated
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (e) {
    return res.status(401).json({ error: 'Authentication failed. Please sign in again.' });
  }

  const senderEmail = (decodedToken.email || '').toLowerCase();
  const senderUid   = decodedToken.uid;

  // Block self-lookup
  if (senderEmail === recipientEmailNorm) {
    return res.status(400).json({ error: 'You cannot transfer funds to yourself.' });
  }

  // Look up recipient in Firebase Auth
  let recipientRecord;
  try {
    recipientRecord = await admin.auth().getUserByEmail(recipientEmailNorm);
  } catch (e) {
    return res.status(404).json({ error: 'No account found with that email address.' });
  }

  const recipientUid = recipientRecord.uid;

  // Double-check not self (by UID)
  if (recipientUid === senderUid) {
    return res.status(400).json({ error: 'You cannot transfer funds to yourself.' });
  }

  // Check recipient is not banned
  const banSnap = await db.ref(`users/${recipientUid}/banned/active`).get();
  if (banSnap.val() === true) {
    return res.status(400).json({ error: 'This account is not eligible to receive transfers.' });
  }

  // Pull display name from Realtime DB
  const userSnap = await db.ref(`users/${recipientUid}`).get();
  const userData  = userSnap.val() || {};
  const name = userData.username || userData.displayName || recipientRecord.displayName || '';

  return res.status(200).json({
    email: recipientEmailNorm,
    name,
  });
}
