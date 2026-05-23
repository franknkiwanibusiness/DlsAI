// api/push-subscribe.js
// Saves a browser push subscription to Firebase Realtime Database
// POST { subscription: PushSubscriptionJSON, deviceId, metadata }

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

function getAdminApp() {
  if (getApps().length) return getApps()[0];
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscription, deviceId, metadata = {} } = req.body || {};

  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    const app = getAdminApp();
    const db  = getDatabase(app);

    // Key by endpoint hash so re-subscribing the same browser just overwrites
    const key = Buffer.from(subscription.endpoint).toString('base64').replace(/[/+=]/g, '').slice(-40);

    await db.ref(`pushSubscriptions/${key}`).set({
      subscription,
      deviceId:  deviceId || 'unknown',
      createdAt: Date.now(),
      country:   metadata.country  || 'unknown',
      city:      metadata.city     || 'unknown',
      userAgent: metadata.userAgent || '',
      active:    true,
    });

    return res.status(200).json({ ok: true, key });
  } catch (err) {
    console.error('push-subscribe error:', err);
    return res.status(500).json({ error: err.message });
  }
}