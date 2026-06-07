// api/escrow.js
//
// Single router that handles the entire offer → escrow → release lifecycle.
//
// Routes
// ──────
//   POST /api/escrow/submit           — buyer submits an offer on a listing
//   POST /api/escrow/accept           — seller accepts a pending offer
//   POST /api/escrow/decline          — seller declines a pending offer
//   POST /api/escrow/pay              — buyer pays from wallet → funds locked as pending on seller
//   POST /api/escrow/transfer         — seller marks assets transferred → starts inspection window
//   POST /api/escrow/confirm          — buyer confirms receipt → releases funds to seller wallet
//   POST /api/escrow/dispute          — buyer opens a dispute during inspection window
//   GET  /api/escrow/status           — fetch all escrow deals for the authenticated user
//   POST /api/escrow/process-expired  — (cron) auto-release deals whose inspection window + 24h grace has passed
//
// Firebase layout
// ───────────────
//   offers/{offerId}                        — canonical offer record
//   users/{uid}/incomingOffers/{offerId}    — seller's notification index
//   users/{uid}/sentOffers/{offerId}        — buyer's notification index
//   escrow/{offerId}                        — escrow deal record (created on /pay)
//   users/{uid}/balance                     — wallet balance (number)
//   websites/{listingId}                    — listing record (uid = sellerUid)
//
// Escrow status machine
// ─────────────────────
//   offer_accepted  →  funded  →  assets_transferred  →  inspection  →  released
//                                                       ↘  disputed
//
//   Auto-release: if inspection window + 24h grace elapses with no buyer action,
//   /process-expired (called by cron every hour) releases funds automatically.
//
// Money flow
// ──────────
//   /pay:      buyer.balance  -= amount   |  escrow.pendingAmount = amount
//   /confirm:  seller.balance += amount   |  escrow.status = 'released'
//   (dispute or cancellation handled manually by admin for now — balance restored server-side)

'use strict';

const express = require('express');
const admin   = require('firebase-admin');
const crypto  = require('crypto');
const router  = express.Router();

// ── Firebase Admin (initialise once) ──────────────────────────────────────
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db   = admin.database();
const auth = admin.auth();

// ── Helpers ────────────────────────────────────────────────────────────────

async function verifyToken(idToken) {
    if (!idToken) throw Object.assign(new Error('Missing idToken'), { status: 401 });
    const decoded = await auth.verifyIdToken(idToken);
    return decoded.uid;
}

async function getUser(uid) {
    const snap = await db.ref(`users/${uid}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('User not found'), { status: 404 });
    return snap.val();
}

async function getListing(listingId) {
    const snap = await db.ref(`websites/${listingId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Listing not found'), { status: 404 });
    return snap.val();
}

async function getOffer(offerId) {
    const snap = await db.ref(`offers/${offerId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Offer not found'), { status: 404 });
    return snap.val();
}

async function getEscrow(offerId) {
    const snap = await db.ref(`escrow/${offerId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Escrow record not found'), { status: 404 });
    return snap.val();
}

// Sync status to both user index nodes so panels always show the right state
async function syncOfferStatus(offerId, offer, status) {
    const updates = {};
    updates[`offers/${offerId}/status`]                                          = status;
    updates[`offers/${offerId}/updatedAt`]                                       = Date.now();
    updates[`users/${offer.sellerUid}/incomingOffers/${offerId}/status`]         = status;
    updates[`users/${offer.buyerUid}/sentOffers/${offerId}/status`]              = status;
    await db.ref('/').update(updates);
}

// ── POST /api/escrow/submit ────────────────────────────────────────────────
// Buyer submits an offer.  All validation is server-side.
// Body: { idToken, listingId, amount, note? }
router.post('/submit', async (req, res) => {
    try {
        const { idToken, listingId, amount: rawAmount, note = '' } = req.body;

        const buyerUid = await verifyToken(idToken);
        const amount   = parseFloat(rawAmount);

        if (!listingId)       return res.status(400).json({ error: 'listingId required' });
        if (!amount || amount < 1) return res.status(400).json({ error: 'Minimum offer is $1' });

        const listing = await getListing(listingId);
        const sellerUid = listing.uid || listing.sellerUid || '';

        if (!sellerUid) return res.status(400).json({ error: 'Listing has no seller' });
        if (sellerUid === buyerUid) return res.status(400).json({ error: 'You cannot offer on your own listing' });

        // Fixed-price listing: reject any offer that isn't exactly the asking price
        const isNegotiable = listing.negotiable === 'yes' || listing.negotiable === true;
        if (!isNegotiable) {
            const askingPrice = parseFloat(listing.price) || 0;
            if (askingPrice > 0 && amount !== askingPrice) {
                return res.status(400).json({
                    error: `This listing has a fixed price of $${askingPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Offers are not accepted.`,
                });
            }
        }

        // Prevent duplicate pending offers (one active offer per buyer per listing)
        const existingSnap = await db.ref(`users/${buyerUid}/sentOffers`)
            .orderByChild('listingId').equalTo(listingId).once('value');
        if (existingSnap.exists()) {
            const offers = Object.values(existingSnap.val());
            const hasPending = offers.some(o => o.status === 'pending' || o.status === 'accepted');
            if (hasPending) {
                return res.status(409).json({ error: 'You already have an active offer on this listing' });
            }
        }

        const ts       = Date.now();
        const offerId  = crypto.randomUUID();
        const buyer    = await getUser(buyerUid);

        const offerData = {
            offerId,
            listingId,
            listingTitle: listing.title || listing.url || '',
            listingPrice: parseFloat(listing.price) || 0,
            sellerUid,
            buyerUid,
            buyerEmail:  buyer.email  || '',
            buyerName:   buyer.username || buyer.displayName || '',
            amount,
            note:        note.substring(0, 500),
            status:      'pending',
            createdAt:   ts,
            updatedAt:   ts,
        };

        const updates = {};
        updates[`offers/${offerId}`]                                      = offerData;
        updates[`users/${sellerUid}/incomingOffers/${offerId}`]           = {
            offerId, listingId, listingTitle: offerData.listingTitle,
            amount, buyerUid, buyerName: offerData.buyerName,
            status: 'pending', createdAt: ts,
        };
        updates[`users/${buyerUid}/sentOffers/${offerId}`]                = {
            offerId, listingId, listingTitle: offerData.listingTitle,
            amount, sellerUid, status: 'pending', createdAt: ts,
        };
        await db.ref('/').update(updates);

        return res.json({ ok: true, offerId });

    } catch (err) {
        console.error('[escrow/submit]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Submit failed' });
    }
});

// ── POST /api/escrow/accept ────────────────────────────────────────────────
// Seller accepts a pending offer.
// Body: { idToken, offerId }
router.post('/accept', async (req, res) => {
    try {
        const { idToken, offerId } = req.body;
        if (!offerId) return res.status(400).json({ error: 'offerId required' });

        const uid   = await verifyToken(idToken);
        const offer = await getOffer(offerId);

        if (offer.sellerUid !== uid) return res.status(403).json({ error: 'Not your offer to accept' });
        if (offer.status !== 'pending') return res.status(400).json({ error: `Offer is already ${offer.status}` });

        await syncOfferStatus(offerId, offer, 'accepted');

        return res.json({ ok: true });

    } catch (err) {
        console.error('[escrow/accept]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Accept failed' });
    }
});

// ── POST /api/escrow/decline ───────────────────────────────────────────────
// Seller declines a pending offer.
// Body: { idToken, offerId }
router.post('/decline', async (req, res) => {
    try {
        const { idToken, offerId } = req.body;
        if (!offerId) return res.status(400).json({ error: 'offerId required' });

        const uid   = await verifyToken(idToken);
        const offer = await getOffer(offerId);

        if (offer.sellerUid !== uid) return res.status(403).json({ error: 'Not your offer to decline' });
        if (!['pending', 'accepted'].includes(offer.status)) {
            return res.status(400).json({ error: `Cannot decline an offer with status: ${offer.status}` });
        }

        await syncOfferStatus(offerId, offer, 'declined');

        return res.json({ ok: true });

    } catch (err) {
        console.error('[escrow/decline]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Decline failed' });
    }
});

// ── POST /api/escrow/pay ───────────────────────────────────────────────────
// Buyer pays from wallet.  Money is deducted from buyer immediately and held
// as pendingAmount on the escrow record — NOT credited to seller yet.
// Seller only receives the money after /confirm (buyer confirms receipt).
// Body: { idToken, offerId }
router.post('/pay', async (req, res) => {
    try {
        const { idToken, offerId } = req.body;
        if (!offerId) return res.status(400).json({ error: 'offerId required' });

        const buyerUid = await verifyToken(idToken);
        const offer    = await getOffer(offerId);

        if (offer.buyerUid !== buyerUid) return res.status(403).json({ error: 'Not your offer' });
        if (offer.status !== 'accepted') return res.status(400).json({ error: 'Offer must be accepted before payment' });

        // Check if already paid
        const existingEscrow = await db.ref(`escrow/${offerId}`).once('value');
        if (existingEscrow.exists()) {
            return res.status(409).json({ error: 'This offer has already been paid' });
        }

        const amount = parseFloat(offer.amount);
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid offer amount' });

        // ── Atomic balance deduction ───────────────────────────────────────
        const balRef = db.ref(`users/${buyerUid}/balance`);
        let newBuyerBalance = 0;
        let allowed = false;

        const { committed, snapshot } = await balRef.transaction(current => {
            const balance = parseFloat(current || 0);
            if (balance < amount) return; // abort — insufficient funds
            newBuyerBalance = parseFloat((balance - amount).toFixed(2));
            return newBuyerBalance;
        });

        allowed = committed;

        if (!allowed) {
            const snap = await balRef.once('value');
            const currentBalance = parseFloat(snap.val() || 0);
            const shortfall = parseFloat((amount - currentBalance).toFixed(2));
            return res.status(402).json({
                error: 'Insufficient wallet balance',
                balance: currentBalance,
                required: amount,
                shortfall,
            });
        }

        // ── Create escrow record ───────────────────────────────────────────
        const ts = Date.now();
        const escrowRecord = {
            offerId,
            listingId:      offer.listingId,
            listingTitle:   offer.listingTitle || '',
            buyerUid,
            sellerUid:      offer.sellerUid,
            amount,
            pendingAmount:  amount,   // held until buyer confirms — not yet seller's
            status:         'funded', // offer_accepted → funded → assets_transferred → inspection → released
            fundedAt:       ts,
            createdAt:      ts,
            updatedAt:      ts,
        };

        const updates = {};
        updates[`escrow/${offerId}`]                                        = escrowRecord;
        updates[`offers/${offerId}/status`]                                 = 'funded';
        updates[`offers/${offerId}/updatedAt`]                              = ts;
        updates[`users/${offer.sellerUid}/incomingOffers/${offerId}/status`] = 'funded';
        updates[`users/${buyerUid}/sentOffers/${offerId}/status`]           = 'funded';
        await db.ref('/').update(updates);

        return res.json({
            ok:         true,
            newBalance: newBuyerBalance,
            escrow:     escrowRecord,
        });

    } catch (err) {
        console.error('[escrow/pay]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Payment failed' });
    }
});

// ── POST /api/escrow/transfer ──────────────────────────────────────────────
// Seller marks assets as transferred.
// This advances status to 'assets_transferred', then immediately to 'inspection'
// and records the inspection deadline (7 days).
// The seller should redirect to /transfer after this — this endpoint is the
// server-side confirmation that the transfer action happened.
// Body: { idToken, offerId, transferNote? }
router.post('/transfer', async (req, res) => {
    try {
        const { idToken, offerId, transferNote = '' } = req.body;
        if (!offerId) return res.status(400).json({ error: 'offerId required' });

        const sellerUid = await verifyToken(idToken);
        const escrow    = await getEscrow(offerId);

        if (escrow.sellerUid !== sellerUid) return res.status(403).json({ error: 'Not your deal' });
        if (escrow.status !== 'funded') {
            return res.status(400).json({ error: `Cannot mark transfer: escrow status is '${escrow.status}'` });
        }

        const INSPECTION_DAYS = 7;
        const ts              = Date.now();
        const inspectionEnds  = ts + INSPECTION_DAYS * 24 * 60 * 60 * 1000;

        const updates = {};
        updates[`escrow/${offerId}/status`]              = 'inspection';
        updates[`escrow/${offerId}/assetsTransferredAt`] = ts;
        updates[`escrow/${offerId}/inspectionEndsAt`]    = inspectionEnds;
        updates[`escrow/${offerId}/transferNote`]        = transferNote.substring(0, 500);
        updates[`escrow/${offerId}/updatedAt`]           = ts;
        updates[`offers/${offerId}/status`]              = 'inspection';
        updates[`offers/${offerId}/updatedAt`]           = ts;
        updates[`users/${escrow.sellerUid}/incomingOffers/${offerId}/status`] = 'inspection';
        updates[`users/${escrow.buyerUid}/sentOffers/${offerId}/status`]      = 'inspection';
        await db.ref('/').update(updates);

        return res.json({
            ok:             true,
            status:         'inspection',
            inspectionEnds,
        });

    } catch (err) {
        console.error('[escrow/transfer]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Transfer failed' });
    }
});

// ── POST /api/escrow/confirm ───────────────────────────────────────────────
// Buyer confirms they received the assets.
// THIS is when the money actually moves: pendingAmount credited to seller's wallet.
// Body: { idToken, offerId }
router.post('/confirm', async (req, res) => {
    try {
        const { idToken, offerId } = req.body;
        if (!offerId) return res.status(400).json({ error: 'offerId required' });

        const buyerUid = await verifyToken(idToken);
        const escrow   = await getEscrow(offerId);

        if (escrow.buyerUid !== buyerUid) return res.status(403).json({ error: 'Not your deal' });
        if (escrow.status !== 'inspection') {
            return res.status(400).json({ error: `Cannot confirm: escrow status is '${escrow.status}'` });
        }

        // Buyer cannot confirm after the inspection window has already auto-released
        // (inspectionEndsAt + 24h grace — same threshold as process-expired)
        const AUTO_RELEASE_GRACE_MS = 24 * 60 * 60 * 1000;
        if (escrow.inspectionEndsAt && Date.now() > escrow.inspectionEndsAt + AUTO_RELEASE_GRACE_MS) {
            return res.status(400).json({ error: 'Inspection window has expired; funds were auto-released' });
        }

        const { newSellerBalance, releasedAmount } = await autoReleaseEscrow(offerId, escrow);

        return res.json({
            ok:               true,
            newSellerBalance,
            releasedAmount,
        });

    } catch (err) {
        console.error('[escrow/confirm]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Confirm failed' });
    }
});

// ── POST /api/escrow/dispute ───────────────────────────────────────────────
// Buyer opens a dispute during inspection window.
// Funds stay locked until admin resolves manually.
// Body: { idToken, offerId, reason }
router.post('/dispute', async (req, res) => {
    try {
        const { idToken, offerId, reason = '' } = req.body;
        if (!offerId) return res.status(400).json({ error: 'offerId required' });

        const buyerUid = await verifyToken(idToken);
        const escrow   = await getEscrow(offerId);

        if (escrow.buyerUid !== buyerUid) return res.status(403).json({ error: 'Not your deal' });
        if (escrow.status !== 'inspection') {
            return res.status(400).json({ error: `Can only dispute during inspection (current: ${escrow.status})` });
        }

        // Cannot dispute after the inspection window + grace period has elapsed
        const AUTO_RELEASE_GRACE_MS = 24 * 60 * 60 * 1000;
        if (escrow.inspectionEndsAt && Date.now() > escrow.inspectionEndsAt + AUTO_RELEASE_GRACE_MS) {
            return res.status(400).json({ error: 'Inspection window has expired; funds were auto-released' });
        }

        const ts = Date.now();
        const updates = {};
        updates[`escrow/${offerId}/status`]       = 'disputed';
        updates[`escrow/${offerId}/disputedAt`]   = ts;
        updates[`escrow/${offerId}/disputeReason`]= reason.substring(0, 1000);
        updates[`escrow/${offerId}/updatedAt`]    = ts;
        updates[`offers/${offerId}/status`]       = 'disputed';
        updates[`offers/${offerId}/updatedAt`]    = ts;
        updates[`users/${escrow.sellerUid}/incomingOffers/${offerId}/status`] = 'disputed';
        updates[`users/${buyerUid}/sentOffers/${offerId}/status`]             = 'disputed';

        // Write to admin dispute queue
        updates[`disputes/${offerId}`] = {
            offerId,
            listingId:   escrow.listingId,
            listingTitle: escrow.listingTitle,
            buyerUid,
            sellerUid:   escrow.sellerUid,
            amount:      escrow.amount,
            reason:      reason.substring(0, 1000),
            status:      'open',
            createdAt:   ts,
        };

        await db.ref('/').update(updates);

        return res.json({ ok: true });

    } catch (err) {
        console.error('[escrow/dispute]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Dispute failed' });
    }
});

// ── GET /api/escrow/status ─────────────────────────────────────────────────
// Returns all escrow deals for the authenticated user (buyer or seller side).
// Query: ?idToken=<token>
router.get('/status', async (req, res) => {
    try {
        const uid = await verifyToken(req.query.idToken);

        // Fetch all escrow records where user is buyer or seller
        // Firebase doesn't support OR queries so we fetch both index nodes
        const [buyerSnap, sellerSnap] = await Promise.all([
            db.ref('users/' + uid + '/sentOffers').once('value'),
            db.ref('users/' + uid + '/incomingOffers').once('value'),
        ]);

        const offerIds = new Set();
        if (buyerSnap.exists())  Object.keys(buyerSnap.val()).forEach(id => offerIds.add(id));
        if (sellerSnap.exists()) Object.keys(sellerSnap.val()).forEach(id => offerIds.add(id));

        if (!offerIds.size) return res.json({ deals: [] });

        // Fetch escrow records for each offer that has one
        const escrowSnaps = await Promise.all(
            [...offerIds].map(id => db.ref(`escrow/${id}`).once('value'))
        );

        const deals = escrowSnaps
            .filter(s => s.exists())
            .map(s => s.val());

        return res.json({ deals });

    } catch (err) {
        console.error('[escrow/status]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Status failed' });
    }
});

// ── autoReleaseEscrow ──────────────────────────────────────────────────────
// Shared logic used by both /confirm and /process-expired.
// Atomically credits seller, zeroes pendingAmount, marks listing sold.
// Returns { newSellerBalance, releasedAmount, ts }.
async function autoReleaseEscrow(offerId, escrow, { autoReleased = false } = {}) {
    const amount    = parseFloat(escrow.pendingAmount || escrow.amount);
    const sellerUid = escrow.sellerUid;
    const buyerUid  = escrow.buyerUid;

    const sellerBalRef = db.ref(`users/${sellerUid}/balance`);
    let newSellerBalance = 0;

    await sellerBalRef.transaction(current => {
        newSellerBalance = parseFloat(((parseFloat(current || 0)) + amount).toFixed(2));
        return newSellerBalance;
    });

    const ts = Date.now();
    const updates = {};
    updates[`escrow/${offerId}/status`]         = 'released';
    updates[`escrow/${offerId}/releasedAt`]     = ts;
    updates[`escrow/${offerId}/pendingAmount`]  = 0;
    updates[`escrow/${offerId}/updatedAt`]      = ts;
    if (autoReleased) {
        updates[`escrow/${offerId}/autoReleased`] = true;
    }
    updates[`offers/${offerId}/status`]         = 'released';
    updates[`offers/${offerId}/updatedAt`]      = ts;
    updates[`users/${sellerUid}/incomingOffers/${offerId}/status`] = 'released';
    updates[`users/${buyerUid}/sentOffers/${offerId}/status`]      = 'released';
    updates[`websites/${escrow.listingId}/status`] = 'sold';
    updates[`websites/${escrow.listingId}/soldAt`] = ts;
    updates[`websites/${escrow.listingId}/soldTo`] = buyerUid;

    await db.ref('/').update(updates);

    return { newSellerBalance, releasedAmount: amount, ts };
}

// ── POST /api/escrow/process-expired ──────────────────────────────────────
// Cron endpoint — call this every hour (e.g. via Cloud Scheduler, Vercel cron,
// or a simple setInterval in your server entrypoint).
//
// Logic:
//   • Find all escrow records with status = 'inspection'
//   • Grace period: 24 hours after inspectionEndsAt
//   • If now > inspectionEndsAt + 24h  →  auto-release funds to seller
//
// Secured by CRON_SECRET env var — set a long random string and pass it as
// the Authorization header from your scheduler:
//   Authorization: Bearer <CRON_SECRET>
//
// Example Cloud Scheduler HTTP target:
//   POST https://yourapp.com/api/escrow/process-expired
//   Headers: { Authorization: "Bearer <CRON_SECRET>" }
//   Schedule: every 1 hours
router.post('/process-expired', async (req, res) => {
    // ── Auth: only your scheduler may call this ────────────────────────────
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        console.error('[process-expired] CRON_SECRET env var is not set');
        return res.status(500).json({ error: 'Server misconfiguration' });
    }
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const AUTO_RELEASE_GRACE_MS = 24 * 60 * 60 * 1000; // 24 hours after window ends
    const now = Date.now();
    const released = [];
    const errors   = [];

    try {
        // Query all escrow records in 'inspection' status
        const snap = await db.ref('escrow')
            .orderByChild('status')
            .equalTo('inspection')
            .once('value');

        if (!snap.exists()) {
            return res.json({ released: [], errors: [], checked: 0 });
        }

        const records = snap.val(); // { offerId: escrowRecord, ... }
        const offerIds = Object.keys(records);

        // Process sequentially to avoid hammering Firebase with concurrent writes
        for (const offerId of offerIds) {
            const escrow = records[offerId];

            // Skip if inspection window + grace hasn't elapsed yet
            if (!escrow.inspectionEndsAt) continue;
            const releaseAfter = escrow.inspectionEndsAt + AUTO_RELEASE_GRACE_MS;
            if (now < releaseAfter) continue;

            try {
                const result = await autoReleaseEscrow(offerId, escrow, { autoReleased: true });
                released.push({
                    offerId,
                    sellerUid:        escrow.sellerUid,
                    buyerUid:         escrow.buyerUid,
                    releasedAmount:   result.releasedAmount,
                    newSellerBalance: result.newSellerBalance,
                });
                console.log(
                    `[process-expired] auto-released offerId=${offerId}` +
                    ` amount=${result.releasedAmount}` +
                    ` seller=${escrow.sellerUid}`
                );
            } catch (err) {
                console.error(`[process-expired] failed offerId=${offerId}`, err);
                errors.push({ offerId, error: err.message });
            }
        }

        return res.json({
            checked:  offerIds.length,
            released: released.length,
            errors:   errors.length,
            details:  released,
            failures: errors,
        });

    } catch (err) {
        console.error('[process-expired] fatal', err);
        return res.status(500).json({ error: err.message || 'Process failed' });
    }
});

module.exports = router;
