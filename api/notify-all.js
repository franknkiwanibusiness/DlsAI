// api/notify-all.js
// Called by external Cron Job service (every minute)
// Checks for new orders/emails since last run and pushes to all subscriptions
//
// Env vars needed:
//   FIREBASE_SERVICE_ACCOUNT  — JSON string of service account key
//   VAPID_PUBLIC_KEY           — public VAPID key
//   VAPID_PRIVATE_KEY          — private VAPID key (secret key from Vercel env)
//   VAPID_EMAIL                — mailto: address
//   CRON_SECRET                — optional secret to protect this endpoint

import webpush from 'web-push';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@minimisty.store',
  process.env.VAPID_PUBLIC_KEY || 'BMTBoZaETNkmPu3gl42TbHyU9CH6tRTS9_TBGB2-oor3nSvt5WhJyk1PcmOiOLIt5z5xRterBfR2xlY2Ubyq1Do',
  process.env.VAPID_PRIVATE_KEY // Changed from VAPID_API_KEY to match your updated Vercel environment setting
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

  const results = await Promise.allSettled(
    Object.entries(subs).map(async ([key, { subscription }]) => {
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 3600, urgency: 'high' });
      } catch (err) {
        if (err.statusCode === 410) {
          // Expired — remove it
          await db.ref(`pushSubscriptions/${key}`).remove();
        }
      }
    })
  );
  return results.length;
}

export default async function handler(req, res) {
  // Optional cron secret check
  if (process.env.CRON_SECRET && req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    // Check traditional Vercel Authorization header or custom fallback bearer token
    const auth = req.headers['authorization'];
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const app = getAdminApp();
    const db  = getDatabase(app);

    const now  = Date.now();
    const since = now - 70000; // last ~70 seconds (slightly more than 1 min to avoid gaps)

    // Check for new orders
    const ordersSnap = await db.ref('orders').orderByChild('createdAt').startAt(since).once('value');
    const orders = ordersSnap.val() || {};
    const newPaid = Object.values(orders).filter(o => o.status === 'paid');

    for (const order of newPaid) {
      const email = order.contact?.email || 'Customer';
      const total = order.pricing?.totalUSD ? `$${order.pricing.totalUSD.toFixed(2)}` : '';
      await sendToAll(db, 'New Order', `${email} ${total}`, '/admin#orders');
    }

    // Check for new email captures (with safe null fallback to prevent crash)
    const custSnap = await db.ref('customers').orderByChild('ts').startAt(since).once('value');
    const newCusts = Object.values(custSnap.val() || {});
    if (newCusts.length) {
      await sendToAll(db, `${newCusts.length} New Email${newCusts.length > 1 ? 's' : ''}`, newCusts.map(c => c.email).slice(0,2).join(', '), '/admin#customers');
    }

    return res.status(200).json({ ok: true, checked: { orders: newPaid.length, emails: newCusts.length } });
  } catch (err) {
    console.error('notify-all error:', err);
    return res.status(500).json({ error: err.message });
  }
}
