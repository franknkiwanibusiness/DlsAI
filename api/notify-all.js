// api/notify-all.js
// Two modes:
//   POST with body  → instant trigger from store front (no cron needed)
//   GET / no body   → cron mode, polls Firebase for last 70s of activity
//
// Env vars needed:
//   FIREBASE_SERVICE_ACCOUNT  — JSON string of service account key
//   VAPID_PUBLIC_KEY           — public VAPID key
//   VAPID_PRIVATE_KEY          — private VAPID key (secret)
//   VAPID_EMAIL                — mailto: address

import webpush from 'web-push';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@minimisty.store',
  process.env.VAPID_PUBLIC_KEY || 'BMTBoZaETNkmPu3gl42TbHyU9CH6tRTS9_TBGB2-oor3nSvt5WhJyk1PcmOiOLIt5z5xRterBfR2xlY2Ubyq1Do',
  process.env.VAPID_PRIVATE_KEY
);

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseURL: 'https://itzhoyoo-f9f7e-default-rtdb.firebaseio.com',
  });
}

async function sendToAll(db, title, body, url) {
  const snap = await db.ref('pushSubscriptions').once('value');
  const subs = snap.val() || {};
  const payload = JSON.stringify({ title, body, url });

  await Promise.allSettled(
    Object.entries(subs).map(async ([key, { subscription }]) => {
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 3600, urgency: 'high' });
      } catch (err) {
        if (err.statusCode === 410) {
          await db.ref(`pushSubscriptions/${key}`).remove();
        }
      }
    })
  );
}

export default async function handler(req, res) {
  try {
    const app = getAdminApp();
    const db  = getDatabase(app);

    // ── DIRECT TRIGGER MODE (POST from store front) ──
    // Store calls this instantly when something happens, passing event data
    if (req.method === 'POST' && req.body?.event) {
      const { event, data } = req.body;

      if (event === 'order' && data) {
        const email = data.email || 'Customer';
        const total = data.total ? `$${parseFloat(data.total).toFixed(2)}` : '';
        await sendToAll(db, '🛍 New Order', `${email} ${total}`.trim(), '/dashboard');
        return res.status(200).json({ ok: true, sent: 'order' });
      }

      if (event === 'email' && data) {
        const email = data.email || 'New subscriber';
        const source = data.source ? ` · ${data.source.replace(/_/g,' ')}` : '';
        await sendToAll(db, '📧 New Email Capture', `${email}${source}`, '/dashboard');
        return res.status(200).json({ ok: true, sent: 'email' });
      }

      if (event === 'share' && data) {
        await sendToAll(db, '🔗 New Share', `${data.platform || 'Share'} · ${data.refCode || ''}`.trim(), '/dashboard');
        return res.status(200).json({ ok: true, sent: 'share' });
      }

      return res.status(400).json({ error: 'Unknown event type' });
    }

    // ── CRON / POLL MODE (GET or no body) ──
    // Fallback if you ever add the cron back in vercel.json
    const now   = Date.now();
    const since = now - 70000;

    const ordersSnap = await db.ref('orders').orderByChild('createdAt').startAt(since).once('value');
    const orders     = ordersSnap.val() || {};
    const newPaid    = Object.values(orders).filter(o => o.status === 'paid');

    for (const order of newPaid) {
      const email = order.contact?.email || 'Customer';
      const total = order.pricing?.totalUSD ? `$${order.pricing.totalUSD.toFixed(2)}` : '';
      await sendToAll(db, '🛍 New Order', `${email} ${total}`.trim(), '/dashboard');
    }

    const custSnap  = await db.ref('customers').orderByChild('ts').startAt(since).once('value');
    const newCusts  = Object.values(custSnap.val() || {});
    if (newCusts.length) {
      await sendToAll(
        db,
        `📧 ${newCusts.length} New Email${newCusts.length > 1 ? 's' : ''}`,
        newCusts.map(c => c.email).slice(0, 2).join(', '),
        '/dashboard'
      );
    }

    return res.status(200).json({ ok: true, checked: { orders: newPaid.length, emails: newCusts.length } });

  } catch (err) {
    console.error('notify-all error:', err);
    return res.status(500).json({ error: err.message });
  }
}