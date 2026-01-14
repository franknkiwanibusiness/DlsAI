import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// 1. Initialize Firebase Admin (Only once)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = getDatabase();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const event = req.body;

  // 2. Handle Subscription Success
  if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' || 
      event.event_type === 'PAYMENT.SALE.COMPLETED') {
    
    // custom_id was passed in your createSubscription logic
    const uid = event.resource.custom_id || event.resource.custom;

    if (uid) {
      try {
        await db.ref(`users/${uid}`).update({
          isPremium: true,
          tokens: 250 // Give them their premium daily start
        });
        console.log(`Premium activated for: ${uid}`);
        return res.status(200).json({ message: 'User updated' });
      } catch (error) {
        console.error('Firebase Update Error:', error);
        return res.status(500).send('Internal Error');
      }
    }
  }

  // 3. Acknowledge receipt to PayPal
  res.status(200).send('Event received');
}
