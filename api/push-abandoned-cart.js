/* ═══════════════════════════════════════════════════════════════
   /api/push-abandoned-cart
   Sends a "you left something behind" push to a device.
   Called in two modes:
     immediate: true  — fired right when item is added to cart
     immediate: false — fired by the SW background sync after
                        the user has been away >3 minutes
   ═══════════════════════════════════════════════════════════════

   ENV VARS required:
     VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
*/

import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT  || 'mailto:support@minimisty.store',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// ── Swap this for your real subscription lookup ───────────────
// e.g. look up by deviceId in Firebase / Postgres
async function getSubscription(deviceId, providedSub) {
  // If the page sent the subscription object directly, use it
  if (providedSub && providedSub.endpoint) return providedSub;
  // Otherwise look up from your DB by deviceId
  // const row = await db.query('SELECT sub FROM push_subscriptions WHERE device_id=$1', [deviceId]);
  // return row?.sub ?? null;
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://minimisty.store');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      subscription: providedSub,
      deviceId   = 'unknown',
      cartItems  = [],
      cartData   = {},
      cartValue,
      symbol     = '$',
      immediate  = false,
    } = req.body;

    const sub = await getSubscription(deviceId, providedSub);
    if (!sub) return res.status(404).json({ error: 'No subscription found' });

    // If this is an immediate add-to-cart ping, delay 30 minutes
    // server-side before sending — gives the user time to actually
    // check out without being spammed the moment they click Add.
    // (The SW background sync already has its own 3-minute delay
    //  client-side, so we don't double-delay for that path.)
    const delayMs = immediate ? 30 * 60 * 1000 : 0;

    const val   = cartValue ? `${symbol}${Number(cartValue).toFixed(2)}` : '';
    const items = cartItems.length > 0 ? cartItems : cartData.cartItems || [];
    const qty   = items.reduce((s, i) => s + (i.qty || 1), 0);
    const label = qty > 1 ? `${qty} items` : 'your item';

    const payload = JSON.stringify({
      type:  'cart',
      title: 'Complete your order!',
      body:  `${label}${val ? ` (${val})` : ''} in your cart. Checkout before it sells out.`,
      tag:   'cart-abandonment',
      url:   'https://minimisty.store/#checkout',
    });

    if (delayMs > 0) {
      // Fire and forget after delay — use a job queue in production
      setTimeout(async () => {
        try { await webpush.sendNotification(sub, payload); } catch (_) {}
      }, delayMs);
      return res.status(202).json({ ok: true, scheduledIn: delayMs });
    }

    await webpush.sendNotification(sub, payload);
    return res.status(200).json({ ok: true });
  } catch (err) {
    // 410 Gone = subscription expired, remove from DB
    if (err.statusCode === 410) {
      console.log('[push-abandoned-cart] subscription expired, remove from DB:', req.body.deviceId);
      // await db.query('DELETE FROM push_subscriptions WHERE device_id=$1', [req.body.deviceId]);
      return res.status(410).json({ error: 'Subscription expired' });
    }
    console.error('[push-abandoned-cart]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}