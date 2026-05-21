// api/send-notification.js
// Sends a Web Push notification to a single subscription endpoint
// Uses VAPID keys from env vars:
//   VAPID_PUBLIC_KEY  = BMTBoZaETNkmPu3gl42TbHyU9CH6tRTS9_TBGB2-oor3nSvt5WhJyk1PcmOiOLIt5z5xRterBfR2xlY2Ubyq1Do
//   VAPID_PRIVATE_KEY = (your secret private key stored in Vercel env)
//   VAPID_EMAIL       = mailto:admin@minimisty.store

import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@minimisty.store',
  process.env.VAPID_PUBLIC_KEY || 'BMTBoZaETNkmPu3gl42TbHyU9CH6tRTS9_TBGB2-oor3nSvt5WhJyk1PcmOiOLIt5z5xRterBfR2xlY2Ubyq1Do',
  process.env.VAPID_PRIVATE_KEY // Updated to fetch your private key seamlessly
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscription, title, body, url, tag } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'No subscription' });

  const payload = JSON.stringify({ 
    title: title || 'Minimisty', 
    body: body || '', 
    url: url || '/admin', 
    tag: tag || 'minimisty' 
  });

  try {
    await webpush.sendNotification(subscription, payload, {
      TTL: 86400, // 24 hours
      urgency: 'high',
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    // 410 = subscription expired/unsubscribed — clean it up
    if (err.statusCode === 410) {
      console.log('Subscription expired, should clean up:', subscription.endpoint);
      return res.status(410).json({ error: 'Subscription expired' });
    }
    console.error('send-notification error:', err);
    return res.status(500).json({ error: err.message });
  }
}
