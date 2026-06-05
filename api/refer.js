// /api/refer.js
// Server-side referral handler — $1 credit is NEVER written from the client.
// The client sends its Firebase ID token + the ref code stored in localStorage.
// This endpoint verifies both, then uses Firebase Admin SDK to write the balance.
//
// Required env vars:
//   FIREBASE_PROJECT_ID
//   FIREBASE_DATABASE_URL
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY       (paste the full PEM string, newlines as \n)

import admin from 'firebase-admin';

// ── Initialise Admin SDK once (Vercel keeps the module warm between requests) ──
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Vercel stores \n literally — convert back to real newlines
            privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();

// ── Rate limit store (in-memory, resets on cold start — good enough as a layer) ──
// Keyed by UID, value = timestamp of last referral attempt
const _recentAttempts = new Map();
const RATE_LIMIT_MS   = 10_000; // 10 s between attempts per user

export default async function handler(req, res) {
    // ── Only POST ──
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Auth header ──
    const authHeader = req.headers.authorization || '';
    const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
        return res.status(401).json({ error: 'Missing authorization token' });
    }

    // ── Body ──
    const { refCode } = req.body || {};
    if (!refCode || typeof refCode !== 'string') {
        return res.status(400).json({ error: 'Missing refCode' });
    }

    // Sanitise: lowercase, strip anything that isn't a-z0-9_-
    const safeRef = refCode.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
    if (!safeRef) {
        return res.status(400).json({ error: 'Invalid refCode format' });
    }

    let newUid;
    let newUsername;

    try {
        // ── 1. Verify the Firebase ID token server-side ──
        const decoded = await admin.auth().verifyIdToken(idToken);
        newUid = decoded.uid;
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // ── 2. Rate limit — one attempt per user per 10 s ──
    const lastAttempt = _recentAttempts.get(newUid) || 0;
    if (Date.now() - lastAttempt < RATE_LIMIT_MS) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    _recentAttempts.set(newUid, Date.now());

    try {
        // ── 3. Load new user's record ──
        const newSnap = await db.ref('users/' + newUid).once('value');
        const newData = newSnap.val();
        if (!newData) {
            return res.status(404).json({ error: 'User record not found' });
        }
        newUsername = (newData.username || '').toLowerCase();

        // ── 4. Can't refer yourself ──
        if (safeRef === newUsername) {
            return res.status(400).json({ error: 'Cannot use your own referral link' });
        }

        // ── 5. Idempotency — already credited ──
        if (newData.referredByUid) {
            return res.status(409).json({ error: 'Referral already applied' });
        }

        // ── 6. Look up referrer by username ──
        const refSnap = await db.ref('usernames/' + safeRef).once('value');
        if (!refSnap.exists()) {
            return res.status(404).json({ error: 'Referral code not found', invalidRef: true });
        }
        const referrerUid = refSnap.val();

        // ── 7. Referrer must exist and not be the same user ──
        if (referrerUid === newUid) {
            return res.status(400).json({ error: 'Cannot use your own referral link' });
        }
        const referrerSnap = await db.ref('users/' + referrerUid).once('value');
        const referrerData = referrerSnap.val();
        if (!referrerData) {
            return res.status(404).json({ error: 'Referrer account not found', invalidRef: true });
        }

        // ── 8. Apply $1 credit to new user — fixed server-side, client cannot change this ──
        const CREDIT_AMOUNT = 1.00; // hardcoded — never comes from the client
        const currentBalance = parseFloat(newData.balance || 0);
        const newBalance     = parseFloat((currentBalance + CREDIT_AMOUNT).toFixed(2));

        await db.ref('users/' + newUid).update({
            balance:       newBalance,
            referredBy:    safeRef,
            referredByUid: referrerUid,
        });

        // ── 9. Increment referrer's count ──
        const referrerCount = (referrerData.referralCount || 0) + 1;
        await db.ref('users/' + referrerUid).update({
            referralCount: referrerCount,
        });

        // ── 10. Log the referral event ──
        await db.ref('referrals').push({
            referrerUid,
            referrerUsername: safeRef,
            newUid,
            newUsername,
            newUserCredit:  CREDIT_AMOUNT,
            referrerCredit: 0,
            timestamp:      Date.now(),
        });

        return res.status(200).json({
            success:          true,
            referrerUsername: safeRef,
            creditApplied:    CREDIT_AMOUNT,
            newBalance,
        });

    } catch (e) {
        console.error('[/api/refer]', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
