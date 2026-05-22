// api/save-subscription.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: 'https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscription, uid } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' });

  try {
    const db = getDatabase(getAdminApp());
    const key = Buffer.from(subscription.endpoint).toString('base64').slice(-40).replace(/[^a-zA-Z0-9]/g, '_');
    await db.ref(`pushSubscriptions/${key}`).set({ subscription, uid: uid || 'admin', savedAt: Date.now() });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('save-subscription error:', err);
    return res.status(500).json({ error: err.message });
  }
}