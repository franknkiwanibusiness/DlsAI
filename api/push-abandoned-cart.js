// api/push-abandoned-cart.js
// Called by service worker background sync OR by the cron job
// Sends a push notification to a user who left items in their cart
// POST { deviceId, cartItems, cartValue, currency, symbol }

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { deviceId, cartItems = [], cartValue, symbol = '$' } = req.body || {};
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

  try {
    const app = getAdminApp();
    const db  = getDatabase(app);

    // Find subscription(s) for this device
    const snap = await db.ref('pushSubscriptions').orderByChild('deviceId').equalTo(deviceId).once('value');
    const subs = snap.val() || {};
    const entries = Object.entries(subs).filter(([, v]) => v.active !== false);

    if (!entries.length) return res.status(200).json({ ok: true, sent: 0, reason: 'no subscription' });

    // Build notification
    const qty   = cartItems.reduce((a, i) => a + (i.qty || 1), 0);
    const total = cartValue ? `${symbol}${Number(cartValue).toFixed(2)}` : '';
    const body  = qty === 1
      ? `You left a FrostBlade Pro in your cart${total ? ` — ${total}` : ''}. Grab it before stock runs out! 🧊`
      : `You left ${qty} items in your cart${total ? ` (${total})` : ''}. Don't let them melt away! 🧊`;

    const payload = JSON.stringify({
      title: '🧊 Your cart is waiting!',
      body,
      url:  '/?utm_source=push&utm_medium=abandoned_cart',
      tag:  'abandoned-cart',
      requireInteraction: false,
      actions: [
        { action: 'open',    title: '✅ Complete Order' },
        { action: 'dismiss', title: 'Maybe Later'       },
      ],
    });

    const results = await Promise.allSettled(
      entries.map(async ([key, { subscription }]) => {
        try {
          await webpush.sendNotification(subscription, payload, { TTL: 86400, urgency: 'normal' });
          return { sent: true };
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.ref(`pushSubscriptions/${key}`).remove();
          }
          return { sent: false };
        }
      })
    );

    const sent = results.filter(r => r.value?.sent).length;

    // Log the abandoned cart notification
    await db.ref(`abandonedCartPush/${deviceId}_${Date.now()}`).set({
      deviceId,
      cartItems,
      cartValue: cartValue || 0,
      sentAt: Date.now(),
      sent,
    });

    return res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error('push-abandoned-cart error:', err);
    return res.status(500).json({ error: err.message });
  }
}