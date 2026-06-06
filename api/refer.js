// /api/refer.js
// Handles all referral crediting server-side. Three actions:
//
//   action: "apply"          — new user applies a ref code (original flow, $1 to new user)
//   action: "credit_plan"    — referrer gets commission after referred user buys a plan
//   action: "credit_listing" — referrer gets $0.10 after referred user posts a listing
//
// All three require a valid Firebase ID token. Amounts are hardcoded here —
// the client never sends a number that affects a balance.
//
// Required env vars:
//   FIREBASE_PROJECT_ID
//   FIREBASE_DATABASE_URL
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (full PEM, newlines as \n)

import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();

// In-memory rate limiter (resets on cold start — fine as a secondary layer)
const _recentAttempts = new Map();
const RATE_LIMIT_MS   = 10_000;

// Plan commission table — server-side only, client never sends amounts
const PLAN_COMMISSION = { starter: 0.10, growth: 0.20, pro: 0.30 };
const PLAN_PRICES     = { starter: 20,   growth: 40,   pro: 50   };
const LISTING_BONUS   = 0.10;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.authorization || '';
    const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: 'Missing authorization token' });

    let uid;
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        uid = decoded.uid;
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    const last = _recentAttempts.get(uid) || 0;
    if (Date.now() - last < RATE_LIMIT_MS) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    _recentAttempts.set(uid, Date.now());

    const { action } = req.body || {};

    // ══════════════════════════════════════════════════════════════════════════
    //  ACTION: apply — new user claims a referral code (gives $1 to new user)
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'apply' || !action) {
        const { refCode } = req.body;
        if (!refCode || typeof refCode !== 'string') {
            return res.status(400).json({ error: 'Missing refCode' });
        }

        const safeRef = refCode.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
        if (!safeRef) return res.status(400).json({ error: 'Invalid refCode format' });

        try {
            const newSnap = await db.ref('users/' + uid).once('value');
            const newData = newSnap.val();
            if (!newData) return res.status(404).json({ error: 'User record not found' });

            const newUsername = (newData.username || '').toLowerCase();
            if (safeRef === newUsername) {
                return res.status(400).json({ error: 'Cannot use your own referral link' });
            }
            if (newData.referredByUid) {
                return res.status(409).json({ error: 'Referral already applied' });
            }

            const refSnap = await db.ref('usernames/' + safeRef).once('value');
            if (!refSnap.exists()) {
                return res.status(404).json({ error: 'Referral code not found', invalidRef: true });
            }
            const referrerUid = refSnap.val();
            if (referrerUid === uid) {
                return res.status(400).json({ error: 'Cannot use your own referral link' });
            }

            const referrerSnap = await db.ref('users/' + referrerUid).once('value');
            if (!referrerSnap.val()) {
                return res.status(404).json({ error: 'Referrer account not found', invalidRef: true });
            }

            const CREDIT_AMOUNT = 1.00;
            const newBalance = parseFloat((parseFloat(newData.balance || 0) + CREDIT_AMOUNT).toFixed(2));

            await db.ref('users/' + uid).update({
                balance:       newBalance,
                referredBy:    safeRef,
                referredByUid: referrerUid,
            });
            await db.ref('users/' + referrerUid).update({
                referralCount: (referrerSnap.val().referralCount || 0) + 1,
            });
            await db.ref('referrals').push({
                referrerUid,
                referrerUsername: safeRef,
                newUid:           uid,
                newUsername,
                newUserCredit:    CREDIT_AMOUNT,
                referrerCredit:   0,
                timestamp:        Date.now(),
            });

            return res.status(200).json({
                success:          true,
                referrerUsername: safeRef,
                creditApplied:    CREDIT_AMOUNT,
                newBalance,
            });
        } catch (e) {
            console.error('[/api/refer apply]', e);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ACTION: credit_plan — referrer earns commission on their referral's plan purchase
    //  Called after a successful PayPal subscription onApprove for the referred user.
    //  uid = the user who just bought the plan (the referred user).
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'credit_plan') {
        const { planKey } = req.body;
        const rate = PLAN_COMMISSION[planKey];
        if (!rate) {
            return res.status(400).json({ error: 'Invalid or missing planKey' });
        }

        try {
            // Load the buyer (referred user) to find who referred them
            const buyerSnap = await db.ref('users/' + uid).once('value');
            const buyerData = buyerSnap.val();
            if (!buyerData) return res.status(404).json({ error: 'User not found' });

            const referrerUid = buyerData.referredByUid;
            if (!referrerUid) {
                // No referrer — nothing to do, not an error
                return res.status(200).json({ success: true, credited: false, reason: 'no_referrer' });
            }

            // Idempotency — don't double-credit the same plan purchase
            const alreadyKey = `referralPlanCredited_${planKey}`;
            if (buyerData[alreadyKey]) {
                return res.status(409).json({ error: 'Commission already credited for this plan', credited: false });
            }

            // Amounts are computed here — never from the client
            const commission = parseFloat((PLAN_PRICES[planKey] * rate).toFixed(2));

            const referrerSnap = await db.ref('users/' + referrerUid).once('value');
            const referrerData = referrerSnap.val() || {};
            const newBal    = parseFloat((parseFloat(referrerData.balance        || 0) + commission).toFixed(2));
            const newEarned = parseFloat((parseFloat(referrerData.referralEarned || 0) + commission).toFixed(2));

            // Atomic writes
            await db.ref('users/' + referrerUid).update({
                balance:        newBal,
                referralEarned: newEarned,
            });
            // Mark idempotency flag on buyer so we never double-credit
            await db.ref('users/' + uid).update({ [alreadyKey]: true });

            await db.ref('referralEarnings').push({
                referrerUid,
                fromUid:    uid,
                type:       'plan_purchase',
                plan:       planKey,
                commission,
                timestamp:  Date.now(),
            });

            return res.status(200).json({
                success:    true,
                credited:   true,
                commission,
                newBalance: newBal,
            });
        } catch (e) {
            console.error('[/api/refer credit_plan]', e);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ACTION: credit_listing — referrer earns $0.10 when their referral posts a listing
    //  uid = the user who just posted the listing.
    // ══════════════════════════════════════════════════════════════════════════
    if (action === 'credit_listing') {
        try {
            const listerSnap = await db.ref('users/' + uid).once('value');
            const listerData = listerSnap.val();
            if (!listerData) return res.status(404).json({ error: 'User not found' });

            const referrerUid = listerData.referredByUid;
            if (!referrerUid) {
                return res.status(200).json({ success: true, credited: false, reason: 'no_referrer' });
            }

            // Only credit the very first listing (prevent farming $0.10 repeatedly)
            if (listerData.referralListingCredited) {
                return res.status(409).json({ error: 'Listing bonus already credited', credited: false });
            }

            const referrerSnap = await db.ref('users/' + referrerUid).once('value');
            const referrerData = referrerSnap.val() || {};
            const newBal    = parseFloat((parseFloat(referrerData.balance        || 0) + LISTING_BONUS).toFixed(2));
            const newEarned = parseFloat((parseFloat(referrerData.referralEarned || 0) + LISTING_BONUS).toFixed(2));

            await db.ref('users/' + referrerUid).update({
                balance:        newBal,
                referralEarned: newEarned,
            });
            await db.ref('users/' + uid).update({ referralListingCredited: true });

            await db.ref('referralEarnings').push({
                referrerUid,
                fromUid:   uid,
                type:      'listing_posted',
                commission: LISTING_BONUS,
                timestamp: Date.now(),
            });

            return res.status(200).json({
                success:    true,
                credited:   true,
                commission: LISTING_BONUS,
                newBalance: newBal,
            });
        } catch (e) {
            console.error('[/api/refer credit_listing]', e);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(400).json({ error: 'Unknown action' });
}
