import admin from 'firebase-admin';

// Initialize Admin SDK using the Environment Variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL // Make sure to add this to Vercel too!
  });
}

const db = admin.database();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const event = req.body;
  
  // Extract UID from the custom_id we passed in the frontend script
  const uid = event.resource?.custom_id || event.resource?.custom;

  try {
    // Event 1: Subscription Started (The Plan)
    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' && uid) {
      await db.ref(`users/${uid}`).update({
        isPremium: true,
        tier: 'PREMIUM',
        tokens: 250 // Instant reward for subbing
      });
      console.log(`User ${uid} upgraded to Premium`);
    }

    // Event 2: One-time Token Purchase (One-off)
    // Use this if you want the webhook to handle Refills instead of the frontend
    if (event.event_type === 'PAYMENT.SALE.COMPLETED' && uid) {
       // Logic for one-time sales if needed
    }

    res.status(200).send('Webhook Received');
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Internal Server Error');
  }
}
