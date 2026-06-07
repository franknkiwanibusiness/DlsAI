// api/wallet.js
// All pricing is defined server-side only — the client never sends an amount.

const express  = require('express');
const admin    = require('firebase-admin');
const router   = express.Router();

// ── Firebase Admin (initialise once across the whole app) ──────────────────
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();

// ── Pricing table (server owns these — never trust the client) ─────────────
const PRICES = {
    photo:          0.10,   // sending a photo in chat
    link:           0.10,   // inserting a link in chat
    unblock:        0.10,   // unblocking another user (free plan only)
    'boost-thread': 1.00,   // boosting a conversation to the top
};

// ── Helper: verify idToken → returns uid or throws ────────────────────────
async function verifyToken(idToken) {
    if (!idToken) throw new Error('Missing idToken');
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
}

// ── Helper: atomic balance deduction ──────────────────────────────────────
// Uses a Firebase transaction so concurrent requests can't double-spend.
async function deductBalance(uid, amount) {
    const ref = db.ref(`users/${uid}/balance`);
    let newBalance;

    await ref.transaction(current => {
        const bal = parseFloat(current || 0);
        if (bal < amount) return; // returning undefined aborts the transaction
        newBalance = parseFloat((bal - amount).toFixed(2));
        return newBalance;
    }, (err, committed) => {
        if (err)        throw new Error('Database error');
        if (!committed) throw new Error('Insufficient balance');
    });

    return newBalance;
}

// ── POST /api/wallet/charge ────────────────────────────────────────────────
// Body: { idToken, type }
// type: 'photo' | 'link' | 'unblock'
// The server looks up the price; the client never sends an amount.
router.post('/charge', async (req, res) => {
    try {
        const { idToken, type } = req.body;

        const price = PRICES[type];
        if (price === undefined) {
            return res.status(400).json({ error: 'Unknown charge type' });
        }

        const uid = await verifyToken(idToken);

        // Check plan — paid users are never charged for per-action fees
        const userSnap = await db.ref(`users/${uid}`).once('value');
        const userData  = userSnap.val() || {};
        const plan      = (userData.plan || 'free').toLowerCase();

        if (plan !== 'free') {
            return res.json({ newBalance: parseFloat(userData.balance || 0), skipped: true });
        }

        const newBalance = await deductBalance(uid, price);

        // Log the transaction
        await db.ref(`users/${uid}/transactions`).push({
            type,
            amount:  -price,
            ts:      admin.database.ServerValue.TIMESTAMP,
            balance: newBalance,
        });

        return res.json({ newBalance });
    } catch (err) {
        const status = err.message === 'Insufficient balance' ? 402 : 500;
        return res.status(status).json({ error: err.message || 'Charge failed' });
    }
});

// ── POST /api/wallet/unblock ───────────────────────────────────────────────
// Charges the unblock fee (free for paid plans), then removes the block flags
// from Firebase so the server is the single source of truth for this mutation.
// Body: { idToken, blockedUid, threadId }
router.post('/unblock', async (req, res) => {
    try {
        const { idToken, blockedUid, threadId } = req.body;
        if (!blockedUid) return res.status(400).json({ error: 'Missing blockedUid' });

        const uid = await verifyToken(idToken);

        // Check plan
        const userSnap = await db.ref(`users/${uid}`).once('value');
        const userData  = userSnap.val() || {};
        const plan      = (userData.plan || 'free').toLowerCase();
        const isPaid    = plan !== 'free';

        let newBalance = parseFloat(userData.balance || 0);

        if (!isPaid) {
            // Atomically deduct — will throw 'Insufficient balance' if too low
            newBalance = await deductBalance(uid, PRICES.unblock);

            // Log
            await db.ref(`users/${uid}/transactions`).push({
                type:    'unblock',
                amount:  -PRICES.unblock,
                ts:      admin.database.ServerValue.TIMESTAMP,
                balance: newBalance,
                meta:    { unblockedUid: blockedUid },
            });
        }

        // Remove block flags (server-side write — safe from client manipulation)
        const updates = {};
        if (threadId) updates[`messages/${threadId}/blocked/${uid}`] = null;
        updates[`users/${uid}/blocked/${blockedUid}`] = null;
        await db.ref().update(updates);

        return res.json({ newBalance, skipped: isPaid });
    } catch (err) {
        const status = err.message === 'Insufficient balance' ? 402 : 500;
        return res.status(status).json({ error: err.message || 'Unblock failed' });
    }
});

// ── POST /api/wallet/boost-thread ─────────────────────────────────────────
// Body: { idToken, threadId }
router.post('/boost-thread', async (req, res) => {
    try {
        const { idToken, threadId } = req.body;
        if (!threadId) return res.status(400).json({ error: 'Missing threadId' });

        const price = PRICES['boost-thread'];
        const uid   = await verifyToken(idToken);

        const newBalance = await deductBalance(uid, price);

        // Mark thread as boosted with expiry (7 days)
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        await db.ref(`messages/${threadId}/boost`).set({
            boostedBy: uid,
            boostedAt: admin.database.ServerValue.TIMESTAMP,
            expiresAt,
        });

        // Log the transaction
        await db.ref(`users/${uid}/transactions`).push({
            type:    'boost-thread',
            amount:  -price,
            ts:      admin.database.ServerValue.TIMESTAMP,
            balance: newBalance,
            meta:    { threadId },
        });

        return res.json({ newBalance, expiresAt });
    } catch (err) {
        const status = err.message === 'Insufficient balance' ? 402 : 500;
        return res.status(status).json({ error: err.message || 'Boost failed' });
    }
});

// ── POST /api/wallet/topup ─────────────────────────────────────────────────
// Called after a verified PayPal webhook confirms payment.
// Body: { idToken, amount }  — only call this from your PayPal webhook handler,
// not directly from the client in production.
router.post('/topup', async (req, res) => {
    try {
        const { idToken, amount } = req.body;
        const parsed = parseFloat(amount);
        if (!parsed || parsed <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const uid = await verifyToken(idToken);
        const ref = db.ref(`users/${uid}/balance`);

        let newBalance;
        await ref.transaction(current => {
            newBalance = parseFloat(((parseFloat(current || 0)) + parsed).toFixed(2));
            return newBalance;
        });

        await db.ref(`users/${uid}/transactions`).push({
            type:    'topup',
            amount:  parsed,
            ts:      admin.database.ServerValue.TIMESTAMP,
            balance: newBalance,
        });

        return res.json({ newBalance });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Top-up failed' });
    }
});

module.exports = router;
