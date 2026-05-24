/* ═══════════════════════════════════════════════════════════════
   /api/push-subscribe
   Saves a Web Push subscription to your database.
   Works on Vercel / Netlify Edge / Node.js (Express / Fastify).
   ═══════════════════════════════════════════════════════════════

   ENV VARS required:
     VAPID_PUBLIC_KEY   — your VAPID public key (base64url)
     VAPID_PRIVATE_KEY  — your VAPID private key (base64url)
     VAPID_SUBJECT      — mailto: or https: contact URL
     FIREBASE_DB_URL    — (optional) if you store subs in Firebase

   Generate VAPID keys once with:
     npx web-push generate-vapid-keys
*/

import webpush from 'web-push';

// ── VAPID config (set these in your hosting env vars) ─────────
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT  || 'mailto:support@minimisty.store',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// ── In-memory store (swap for a real DB in production) ────────
// For Firebase: import and use firebase-admin to write to
//   /pushSubscriptions/<deviceId>
// For Supabase / Postgres: INSERT INTO push_subscriptions ...
const subscriptions = new Map();

export default async function handler(req, res) {
  // CORS pre-flight
  res.setHeader('Access-Control-Allow-Origin', 'https://minimisty.store');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { subscription, deviceId = 'unknown', metadata = {}, resubscribe = false } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing subscription' });
    }

    // Persist — replace this block with your DB write
    subscriptions.set(deviceId, {
      subscription,
      deviceId,
      metadata,
      resubscribe,
      savedAt: new Date().toISOString(),
    });

    // Optional: send a welcome notification on first subscribe
    if (!resubscribe) {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          type:  'general',
          title: 'You\'re all set!',
          body:  'You\'ll get drop alerts, restock notices and exclusive offers.',
          url:   'https://minimisty.store/',
        }),
      ).catch(() => {}); // don't fail the request if this errors
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[push-subscribe]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}