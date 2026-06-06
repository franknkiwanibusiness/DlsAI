// api/limits.js
// Single server-side source of truth for all free-user rate limits.
// Client JS calls /api/limits/consume — nothing is stored in localStorage
// or anywhere the user can edit with DevTools.
//
// Limit types:
//   'chat'    — homepage AI chat messages  (10 / hour,  resets each clock-hour UTC)
//   'support' — support email submissions  ( 1 / day,   resets at UTC midnight)
//   'image'   — messages page photo sends  ( 1 / day,   resets at UTC midnight)
//   'link'    — messages page link sends   ( 1 / day,   resets at UTC midnight)
//
// Paid users always pass through (skipped: true).

const express = require('express');
const admin   = require('firebase-admin');
const router  = express.Router();

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

// ── Limit configuration ────────────────────────────────────────────────────
// window: 'hour' resets each UTC clock-hour; 'day' resets at UTC midnight.
const LIMITS = {
    chat:    { free: 10,  window: 'hour' },
    support: { free: 1,   window: 'day'  },
    image:   { free: 1,   window: 'day'  },
    link:    { free: 1,   window: 'day'  },
};

// ── Window key helpers ─────────────────────────────────────────────────────
// Produces a short string that changes once per window period.
// Firebase path: limits/{uid}/{type}/{windowKey}  → count (integer)

function windowKey(window_) {
    const now = new Date();
    if (window_ === 'hour') {
        // "2026-06-07T14" — changes every UTC hour
        return now.toISOString().slice(0, 13);
    }
    // "2026-06-07" — changes every UTC day
    return now.toISOString().slice(0, 10);
}

// ── Helper: verify idToken → returns uid or throws ────────────────────────
async function verifyToken(idToken) {
    if (!idToken) throw Object.assign(new Error('Missing idToken'), { status: 401 });
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
}

// ── POST /api/limits/consume ───────────────────────────────────────────────
// Atomically checks AND increments the counter in a single Firebase transaction.
// Body:     { idToken, type }
// 200 ok:   { ok: true,  used: N, limit: N, skipped: bool }
// 429 over: { error: 'Limit reached', used: N, limit: N, message: '...' }
router.post('/consume', async (req, res) => {
    try {
        const { idToken, type } = req.body;

        const cfg = LIMITS[type];
        if (!cfg) return res.status(400).json({ error: 'Unknown limit type' });

        const uid = await verifyToken(idToken);

        // ── Check plan ──────────────────────────────────────────────────────
        const planSnap = await db.ref(`users/${uid}/plan`).once('value');
        const plan     = (planSnap.val() || 'free').toLowerCase();

        if (plan !== 'free') {
            return res.json({ ok: true, used: 0, limit: null, skipped: true });
        }

        // ── Atomic increment with ceiling ───────────────────────────────────
        const limit  = cfg.free;
        const dayRef = db.ref(`limits/${uid}/${type}/${windowKey(cfg.window)}`);

        let finalCount = 0;
        let allowed    = false;

        await dayRef.transaction(
            current => {
                const count = current || 0;
                if (count >= limit) return; // abort transaction — undefined return
                finalCount = count + 1;
                allowed    = true;
                return finalCount;
            },
            (err, committed) => {
                if (err) throw new Error('Database error');
                allowed = committed;
            }
        );

        if (!allowed) {
            // Read the actual current count to return accurate 'used' value
            const snap = await dayRef.once('value');
            return res.status(429).json({
                error:   'Limit reached',
                used:    snap.val() || limit,
                limit,
                message: `Free users can only send ${limit} ${type} message${limit !== 1 ? 's' : ''} per ${cfg.window}. Upgrade for unlimited access.`,
            });
        }

        return res.json({ ok: true, used: finalCount, limit });

    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message || 'Consume failed' });
    }
});

// ── GET /api/limits/status ─────────────────────────────────────────────────
// Returns current usage across all limit types for the authenticated user.
// Useful for showing remaining counts in the UI without consuming a slot.
// Query param: ?idToken=<token>
// Response: { plan, chat: { used, limit, window, remaining }, support: { … }, … }
router.get('/status', async (req, res) => {
    try {
        const uid = await verifyToken(req.query.idToken);

        const planSnap = await db.ref(`users/${uid}/plan`).once('value');
        const plan     = (planSnap.val() || 'free').toLowerCase();

        if (plan !== 'free') {
            const result = { plan };
            for (const [type, cfg] of Object.entries(LIMITS)) {
                result[type] = { used: 0, limit: null, window: cfg.window, remaining: null };
            }
            return res.json(result);
        }

        const entries = await Promise.all(
            Object.entries(LIMITS).map(async ([type, cfg]) => {
                const snap = await db.ref(`limits/${uid}/${type}/${windowKey(cfg.window)}`).once('value');
                const used = snap.val() || 0;
                const limit = cfg.free;
                return [type, { used, limit, window: cfg.window, remaining: Math.max(0, limit - used) }];
            })
        );

        return res.json({ plan, ...Object.fromEntries(entries) });

    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message || 'Status failed' });
    }
});

module.exports = router;
