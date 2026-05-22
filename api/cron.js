// api/cron.js
// Vercel Cron — runs on schedule defined in vercel.json
// Checks Firebase for new orders, emails, shares, carts and pushes to all subscriptions

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
        if (err.statusCode === 410) await db.ref(`pushSubscriptions/${key}`).remove();
      }
    })
  );
}

export default async function handler(req, res) {
  const auth = req.headers['authorization'];
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const app = getAdminApp();
    const db  = getDatabase(app);

    // Read last-checked timestamp from Firebase so we never miss or double-notify
    const lastSnap = await db.ref('_cronState/lastChecked').once('value');
    const since = lastSnap.val() || (Date.now() - 86400000);
    const now   = Date.now();

    // New paid orders
    const ordersSnap = await db.ref('orders').orderByChild('createdAt').startAt(since).once('value');
    const newPaid = Object.values(ordersSnap.val() || {}).filter(o => o.status === 'paid');
    for (const o of newPaid) {
      const email = o.contact?.email || 'Customer';
      const total = o.pricing?.totalUSD ? `$${o.pricing.totalUSD.toFixed(2)}` : '';
      await sendToAll(db, 'New Order', `${email} ${total}`.trim(), '/admin#orders');
    }

    // New email captures
    const custSnap = await db.ref('customers').orderByChild('ts').startAt(since).once('value');
    const newCusts = Object.values(custSnap.val() || {});
    if (newCusts.length) {
      await sendToAll(db, `${newCusts.length} New Email${newCusts.length > 1 ? 's' : ''}`,
        newCusts.map(c => c.email).slice(0, 3).join(', '), '/admin#customers');
    }

    // New shares
    const sharesSnap = await db.ref('shares').orderByChild('ts').startAt(since).once('value');
    const newShares = Object.values(sharesSnap.val() || {});
    if (newShares.length) {
      await sendToAll(db, `${newShares.length} New Share${newShares.length > 1 ? 's' : ''}`,
        newShares.map(s => s.platform || '—').slice(0, 3).join(', '), '/admin#shares');
    }

    // New cart adds
    const cartSnap = await db.ref('cartEvents').orderByChild('ts').startAt(since).once('value');
    const newCarts = Object.values(cartSnap.val() || {});
    if (newCarts.length) {
      await sendToAll(db, `${newCarts.length} Cart Add${newCarts.length > 1 ? 's' : ''}`,
        newCarts.map(c => c.variant || 'Item').slice(0, 3).join(', '), '/admin#analytics');
    }

    // Save timestamp so next run picks up from here
    await db.ref('_cronState/lastChecked').set(now);

    return res.status(200).json({ ok: true, since, now, found: { orders: newPaid.length, emails: newCusts.length, shares: newShares.length, carts: newCarts.length } });
  } catch (err) {
    console.error('cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}