import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Initialize Firebase Admin
if (!getApps().length) {
    initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}
const db = getDatabase();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const event = req.body;

    // Triggered every time a monthly payment is successful
    if (event.event_type === 'PAYMENT.SALE.COMPLETED' || event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
        
        const uid = event.resource.custom_id; // The UID we passed in the button
        const nextPayment = new Date();
        nextPayment.setDate(nextPayment.getDate() + 32); // Add 32 days buffer

        if (uid) {
            await db.ref(`users/${uid}`).update({
                isPremium: true,
                tier: 'Premium',
                tokens: 250, // Refresh tokens for the new month
                premiumUntil: nextPayment.getTime() // Timestamp for expiration check
            });
            return res.status(200).json({ status: 'success' });
        }
    }
    
    // Triggered if user cancels or payment fails
    if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED' || event.event_type === 'BILLING.SUBSCRIPTION.EXPIRED') {
        const uid = event.resource.custom_id;
        if (uid) {
            await db.ref(`users/${uid}`).update({ isPremium: false, tier: 'Free' });
        }
    }

    res.status(200).send('Webhook Received');
}
