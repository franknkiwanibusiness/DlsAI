// api/push-send.js
// Send a push notification to all subscribed devices (or a specific one)
// POST { title, body, url, icon, tag, targetDeviceId?, actions? }
// Protected by CRON_SECRET header

import webpush from 'web-push';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@minimisty.store',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

export async function sendToAll(db, payload, targetDeviceId = null) {
  const snap = await db.ref('pushSubscriptions').once('value');
  const subs = snap.val() || {};

  const entries = Object.entries(subs).filter(([, v]) =>
    v.active !== false && (!targetDeviceId || v.deviceId === targetDeviceId)
  );

  const results = await Promise.allSettled(
    entries.map(async ([key, { subscription }]) => {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload),
          { TTL: 86400, urgency: 'normal' }
        );
        return { key, sent: true };
      } catch (err) {
        // 410 Gone = browser unsubscribed — clean up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.ref(`pushSubscriptions/${key}`).remove();
        }
        return { key, sent: false, err: err.statusCode };
      }
    })
  );

  const sent   = results.filter(r => r.status === 'fulfilled' && r.value?.sent).length;
  const failed = results.length - sent;
  return { total: results.length, sent, failed };
}

export default async function handler(req, res) {
  // Auth check
  const auth = req.headers['authorization'];
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    title = 'MINIMISTY',
    body  = 'New update!',
    url   = '/',
    icon,
    tag,
    targetDeviceId,
    actions,
    requireInteraction,
  } = req.body || {};

  try {
    const app = getAdminApp();
    const db  = getDatabase(app);

    const payload = { title, body, url, icon, tag, actions, requireInteraction };
    const stats = await sendToAll(db, payload, targetDeviceId || null);

    return res.status(200).json({ ok: true, ...stats });
  } catch (err) {
    console.error('push-send error:', err);
    return res.status(500).json({ error: err.message });
  }
}