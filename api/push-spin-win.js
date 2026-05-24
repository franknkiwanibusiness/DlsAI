/* ═══════════════════════════════════════════════════════════════
   /api/push-spin-win
   Sends a "you won X" push after the spin wheel resolves.
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

async function getSubscription(deviceId, providedSub) {
  if (providedSub && providedSub.endpoint) return providedSub;
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
      deviceId = 'unknown',
      prize    = {},
    } = req.body;

    if (!prize.label || !prize.code) {
      return res.status(400).json({ error: 'Missing prize details' });
    }

    const sub = await getSubscription(deviceId, providedSub);
    if (!sub) return res.status(404).json({ error: 'No subscription found' });

    // Build a friendly description of the discount
    const discountDesc = prize.discount >= 1
      ? `$${Number(prize.discount).toFixed(2)} off`
      : `${Math.round(prize.discount * 100)}% off`;

    const payload = JSON.stringify({
      type:  'offer',
      title: `You won ${prize.label}!`,
      body:  `Your code ${prize.code} gives you ${discountDesc} your order. Complete checkout now before it expires.`,
      tag:   'spin-win',
      url:   'https://minimisty.store/#checkout',
    });

    await webpush.sendNotification(sub, payload);
    return res.status(200).json({ ok: true });
  } catch (err) {
    if (err.statusCode === 410) {
      console.log('[push-spin-win] subscription expired:', req.body.deviceId);
      return res.status(410).json({ error: 'Subscription expired' });
    }
    console.error('[push-spin-win]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}