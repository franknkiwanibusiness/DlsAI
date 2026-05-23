// api/cron.js
// Vercel Cron — runs on schedule defined in vercel.json
// Checks Firebase for new orders, emails, shares, carts and:
//   1. Pushes admin notifications to all subscriptions
//   2. Sends abandoned-cart notifications to specific users

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

// ── Send push to all subscriptions ──────────────────────────────
async function sendToAll(db, title, body, url = '/', tag = 'admin') {
  const snap = await db.ref('pushSubscriptions').once('value');
  const subs = snap.val() || {};
  const payload = JSON.stringify({ title, body, url, tag });

  const results = await Promise.allSettled(
    Object.entries(subs).map(async ([key, { subscription }]) => {
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 3600, urgency: 'high' });
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.ref(`pushSubscriptions/${key}`).remove();
        }
      }
    })
  );

  return results.length;
}

// ── Send abandoned-cart push to a specific device ───────────────
async function sendAbandonedCart(db, deviceId, cartData) {
  const snap = await db.ref('pushSubscriptions').orderByChild('deviceId').equalTo(deviceId).once('value');
  const subs = snap.val() || {};
  const entries = Object.entries(subs).filter(([, v]) => v.active !== false);
  if (!entries.length) return 0;

  const qty   = cartData.items?.reduce((a, i) => a + (i.qty || 1), 0) || 1;
  const total = cartData.totalUSD ? `$${Number(cartData.totalUSD).toFixed(2)}` : '';
  const body  = qty === 1
    ? `Your FrostBlade Pro is waiting${total ? ` — ${total}` : ''}. Limited stock — don't miss out! 🧊`
    : `${qty} items still in your cart${total ? ` (${total})` : '''}. Grab them before they're gone! 🧊`;

  const payload = JSON.stringify({
    title: '🧊 Your cart misses you',
    body,
    url:  '/?utm_source=push&utm_medium=abandoned_cart&utm_campaign=cron',
    tag:  'abandoned-cart',
    actions: [
      { action: 'open',    title: '✅ Complete Order' },
      { action: 'dismiss', title: 'Maybe Later'       },
    ],
  });

  let sent = 0;
  await Promise.allSettled(
    entries.map(async ([key, { subscription }]) => {
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 86400, urgency: 'normal' });
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.ref(`pushSubscriptions/${key}`).remove();
        }
      }
    })
  );
  return sent;
}

// ══════════════════════════════════════════════════════════
//  MAIN HANDLER
// ══════════════════════════════════════════════════════════
export default async function handler(req, res) {
  // Vercel cron scheduler always calls via GET; also accept POST for manual triggers
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers['authorization'];
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const app = getAdminApp();
    const db  = getDatabase(app);

    // Read last-checked timestamp
    const lastSnap = await db.ref('_cronState/lastChecked').once('value');
    const since = lastSnap.val() || (Date.now() - 3600000); // default: last hour
    const now   = Date.now();

    const stats = { orders: 0, emails: 0, shares: 0, carts: 0, abandonedCarts: 0 };

    // ── 1. New paid orders → admin notification ──────────────────
    const ordersSnap = await db.ref('orders').orderByChild('createdAt').startAt(since).once('value');
    const newPaid = Object.values(ordersSnap.val() || {}).filter(o => o.status === 'paid');
    for (const o of newPaid) {
      const email = o.contact?.email || 'Customer';
      const total = o.pricing?.totalUSD ? `$${o.pricing.totalUSD.toFixed(2)}` : '';
      await sendToAll(db,
        '🛍️ New Order!',
        `${email}${total ? ` — ${total}` : ''}`.trim(),
        '/admin#orders',
        'new-order'
      );
      stats.orders++;
    }

    // ── 2. New email captures → admin notification ───────────────
    const custSnap = await db.ref('customers').orderByChild('ts').startAt(since).once('value');
    const newCusts = Object.values(custSnap.val() || {});
    if (newCusts.length) {
      await sendToAll(db,
        `📧 ${newCusts.length} New Email${newCusts.length > 1 ? 's' : ''}`,
        newCusts.map(c => c.email).slice(0, 3).join(', '),
        '/admin#customers',
        'new-emails'
      );
      stats.emails = newCusts.length;
    }

    // ── 3. New shares → admin notification ──────────────────────
    const sharesSnap = await db.ref('shares').orderByChild('ts').startAt(since).once('value');
    const newShares = Object.values(sharesSnap.val() || {});
    if (newShares.length) {
      await sendToAll(db,
        `🔗 ${newShares.length} Share${newShares.length > 1 ? 's' : ''}`,
        newShares.map(s => s.platform || '—').slice(0, 3).join(', '),
        '/admin#shares',
        'new-shares'
      );
      stats.shares = newShares.length;
    }

    // ── 4. New cart adds → admin notification ───────────────────
    const cartSnap = await db.ref('cartEvents').orderByChild('ts').startAt(since).once('value');
    const newCarts = Object.values(cartSnap.val() || {});
    if (newCarts.length) {
      await sendToAll(db,
        `🛒 ${newCarts.length} Cart Add${newCarts.length > 1 ? 's' : ''}`,
        newCarts.map(c => c.variant || 'Item').slice(0, 3).join(', '),
        '/admin#analytics',
        'cart-adds'
      );
      stats.carts = newCarts.length;
    }

    // ── 5. Abandoned carts → per-user notification ───────────────
    // Find carts added 30–120 min ago that haven't converted to a paid order
    const abandonWindow = 30 * 60 * 1000;  // 30 min minimum
    const abandonMax    = 120 * 60 * 1000; // 2 hours maximum
    const abanFrom = now - abandonMax;
    const abanTo   = now - abandonWindow;

    const abanCartSnap = await db.ref('cartEvents')
      .orderByChild('ts').startAt(abanFrom).endAt(abanTo).once('value');
    const abanCarts = Object.values(abanCartSnap.val() || {});

    // Group by device, pick latest
    const byDevice = {};
    for (const c of abanCarts) {
      if (!c.deviceId || c.deviceId === 'unknown') continue;
      if (!byDevice[c.deviceId] || c.ts > byDevice[c.deviceId].ts) {
        byDevice[c.deviceId] = c;
      }
    }

    for (const [deviceId, cart] of Object.entries(byDevice)) {
      // Check they haven't completed an order since
      const orderSnap = await db.ref('deviceOrders/' + deviceId).once('value');
      const orders = Object.values(orderSnap.val() || {});
      const hasCompletedOrder = orders.some(o => o.createdAt > cart.ts);
      if (hasCompletedOrder) continue;

      // Check we haven't already pushed an abandoned-cart notification for this cart
      const alreadyPushedSnap = await db.ref('abandonedCartPush/' + deviceId + '_last').once('value');
      const lastPushed = alreadyPushedSnap.val()?.sentAt || 0;
      if (lastPushed > cart.ts) continue; // already notified this cart

      const sent = await sendAbandonedCart(db, deviceId, {
        items: [{ qty: cart.qty || 1 }],
        totalUSD: cart.priceUSD,
      });

      if (sent > 0) {
        await db.ref('abandonedCartPush/' + deviceId + '_last').set({
          sentAt: now, deviceId, cartTs: cart.ts
        });
        stats.abandonedCarts++;
      }
    }

    // Save timestamp
    await db.ref('_cronState/lastChecked').set(now);

    return res.status(200).json({ ok: true, since, now, stats });
  } catch (err) {
    console.error('cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}