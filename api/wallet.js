// /api/wallet.js
//
// Server-side wallet operations — transfer (donate) and promote (ad campaign).
//
// All balance math happens here, never on the client. The client sends a
// Firebase ID token proving who the sender is, plus an `action` field:
//
//   action: 'transfer' — wallet-to-wallet donation between users
//   action: 'promote'  — deduct budget and activate a sponsored listing
//
// All deductions use Firebase Realtime Database transactions so they are
// atomic, cannot go negative, and cannot be spoofed via devtools /
// window._fbUserData manipulation.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase }                   from 'firebase-admin/database';
import { getAuth }                       from 'firebase-admin/auth';

function initFirebase() {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({
        credential: cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

// ── Transfer (donate) constants ──────────────────────────────────────────────
// Keep FEE_RATE / FEE_FIXED in sync with the DONATE_* constants in your
// seller page HTML (used for live preview only — these are the enforced values).
const FEE_RATE  = 0.03;   // 3 % platform fee
const FEE_FIXED = 0.49;   // + $0.49 fixed

const MIN_TRANSFER = 1;
const MAX_TRANSFER = 999;

// ── Promote constants ────────────────────────────────────────────────────────
// CPM is computed dynamically per-listing by /api/sellmypage (AI + deterministic
// estimator, scaled by country ad-market tier), not a fixed set of tiers — so
// we validate it as a range here, the same way budget is range-validated below.
// Keep MIN/MAX in sync with the CPM guide in sellmypage.js's review_ad handler
// (currently $0.80–$8.00).
const MIN_CPM = 0.80;
const MAX_CPM = 8.00;

// Minimum ad spend scales with the listing's own price (richer listings can
// reasonably afford a bigger floor, but not a flat percentage — see comment
// on minPromoteBudgetForPrice). Keep this curve identical to minPromoteBudget()
// in sellmypage.js, which computes the same number for display purposes.
const PROMOTE_MIN_BUDGET_FLOOR   = 5;   // platform-wide absolute floor
const MAX_PROMOTE_BUDGET         = 500; // platform-wide absolute ceiling

function minPromoteBudgetForPrice(price) {
    const p = Number(price) || 0;
    let pct;
    if (p < 100)        pct = null; // flat floor only, no percentage math at this size
    else if (p < 500)   pct = 5;
    else if (p < 2000)  pct = 4;
    else if (p < 10000) pct = 2.5;
    else if (p < 50000) pct = 1.5;
    else                pct = 1;

    if (pct === null) return PROMOTE_MIN_BUDGET_FLOOR;
    const amount = (p * pct) / 100;
    return Math.min(MAX_PROMOTE_BUDGET, Math.max(PROMOTE_MIN_BUDGET_FLOOR, Math.round(amount * 100) / 100));
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // 1. Authenticate sender via Firebase ID token
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
        return res.status(401).json({ success: false, error: 'Missing Authorization header' });
    }

    initFirebase();
    const db = getDatabase();

    let decoded;
    try {
        decoded = await getAuth().verifyIdToken(idToken);
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' });
    }
    const senderUid = decoded.uid;

    // 2. Route by action
    const { action } = req.body || {};

    if (action === 'transfer_lookup') {
        return handleTransferLookup(req, res, db, senderUid);
    }
    if (action === 'transfer') {
        return handleTransfer(req, res, db, senderUid);
    }
    if (action === 'promote') {
        return handlePromote(req, res, db, senderUid);
    }
    if (action === 'withdraw') {
        return handleWithdraw(req, res, db, senderUid);
    }

    return res.status(400).json({ success: false, error: 'Invalid action.' });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: transfer_lookup
// Looks up a user by email so the transfer UI can confirm the recipient.
// Body: { action, recipientEmail }
// ─────────────────────────────────────────────────────────────────────────────
async function handleTransferLookup(req, res, db, senderUid) {
    const { recipientEmail } = req.body || {};
    if (!recipientEmail || !recipientEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }

    // Scan users node for matching email — RTDB has no query-by-email,
    // so we use Firebase Auth Admin which has a direct lookup.
    let recipientUser;
    try {
        recipientUser = await getAuth().getUserByEmail(recipientEmail.toLowerCase().trim());
    } catch {
        return res.status(404).json({ success: false, error: 'No Siterifty account found for that email.' });
    }

    if (recipientUser.uid === senderUid) {
        return res.status(400).json({ success: false, error: "You can't transfer to yourself." });
    }

    // Pull display name from RTDB user record
    const snap = await db.ref(`users/${recipientUser.uid}`).get();
    const userData = snap.val() || {};

    return res.status(200).json({
        success: true,
        uid:     recipientUser.uid,
        email:   recipientUser.email,
        name:    userData.username || userData.displayName || recipientUser.displayName || '',
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: withdraw
// Deducts balance and queues a PayPal payout request.
// Body: { action, paypalEmail, method, requestedGross }
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_FEE_RATES = { free: 0.30, Free: 0.30, starter: 0.15, Starter: 0.15, growth: 0.10, Growth: 0.10, pro: 0.05, Pro: 0.05 };
const MIN_WITHDRAW = 50;
const MAX_WITHDRAW = 999;

async function handleWithdraw(req, res, db, senderUid) {
    const { paypalEmail, requestedGross } = req.body || {};

    if (!paypalEmail || !paypalEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'Enter a valid PayPal email.' });
    }

    const gross = Number(requestedGross);
    if (!isFinite(gross) || gross <= 0) {
        return res.status(400).json({ success: false, error: 'Enter a valid amount.' });
    }
    if (gross < MIN_WITHDRAW) {
        return res.status(400).json({ success: false, error: `Minimum withdrawal is $${MIN_WITHDRAW.toFixed(2)}.` });
    }
    if (gross > MAX_WITHDRAW) {
        return res.status(400).json({ success: false, error: `Maximum withdrawal is $${MAX_WITHDRAW.toFixed(2)}.` });
    }

    // Get user's plan to compute correct fee rate
    const userSnap = await db.ref(`users/${senderUid}`).get();
    const userData = userSnap.val() || {};
    const plan     = userData.plan || 'Free';
    const feeRate  = PLAN_FEE_RATES[plan] ?? 0.30;

    const grossCents = Math.round(gross * 100);
    const feeCents   = Math.round(grossCents * feeRate);
    const netCents   = grossCents - feeCents;

    // Atomically deduct from balance
    const balRef = db.ref(`users/${senderUid}/balance`);
    let result;
    try {
        result = await balRef.transaction(current => {
            if (current === null) return current;
            let balCents = Math.round(Number(current) * 100);
            if (!isFinite(balCents)) balCents = 0;
            if (balCents < grossCents) return undefined; // abort — insufficient
            return (balCents - grossCents) / 100;
        });
    } catch (err) {
        console.error('[wallet/withdraw] transaction error', err);
        return res.status(500).json({ success: false, error: 'Withdrawal failed. Please try again.' });
    }

    if (!result.committed) {
        return res.status(400).json({ success: false, error: 'Insufficient balance.' });
    }

    const newBalance   = result.snapshot.val();
    const withdrawalId = 'wd_' + Date.now() + '_' + senderUid.slice(0, 6);
    const now          = Date.now();

    // Queue withdrawal record under the user + global withdrawals node
    const record = {
        withdrawalId,
        uid:         senderUid,
        paypalEmail,
        method:      'paypal',
        gross:       grossCents / 100,
        fee:         feeCents   / 100,
        amount:      netCents   / 100,  // net payout
        feeRate,
        plan,
        status:      'pending',         // admin processes manually or via PayPal Payouts API
        createdAt:   now,
    };

    await Promise.all([
        db.ref(`users/${senderUid}/withdrawals/${withdrawalId}`).set(record)
            .catch(e => console.error('[wallet/withdraw] user record failed', e)),
        db.ref(`withdrawals/${withdrawalId}`).set(record)
            .catch(e => console.error('[wallet/withdraw] global record failed', e)),
    ]);

    return res.status(200).json({
        success:      true,
        withdrawalId,
        newBalance,
        gross:        grossCents / 100,
        fee:          feeCents   / 100,
        amount:       netCents   / 100,
        status:       'pending',
    });
}
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: transfer
// Body: { action, recipientUid, amount }
// ─────────────────────────────────────────────────────────────────────────────
async function handleTransfer(req, res, db, senderUid) {
    const { recipientEmail, recipientUid: _recipientUid, amount } = req.body || {};

    // Accept either recipientEmail (from new client) or recipientUid (legacy)
    let recipientUid = _recipientUid;
    if (!recipientUid && recipientEmail) {
        try {
            const authUser = await getAuth().getUserByEmail(recipientEmail.toLowerCase().trim());
            recipientUid = authUser.uid;
        } catch {
            return res.status(404).json({ success: false, error: 'No account found for that email.' });
        }
    }

    if (typeof recipientUid !== 'string' || !recipientUid) {
        return res.status(400).json({ success: false, error: 'Missing recipient.' });
    }
    if (recipientUid === senderUid) {
        return res.status(400).json({ success: false, error: "You can't donate to yourself." });
    }

    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) {
        return res.status(400).json({ success: false, error: 'Enter a valid amount.' });
    }
    if (amt < MIN_TRANSFER) {
        return res.status(400).json({ success: false, error: `Minimum donation is $${MIN_TRANSFER.toFixed(2)}.` });
    }
    if (amt > MAX_TRANSFER) {
        return res.status(400).json({ success: false, error: `Maximum donation is $${MAX_TRANSFER.toFixed(2)}.` });
    }

    const sendCents = Math.round(amt * 100);
    const feeCents  = Math.round(sendCents * FEE_RATE + FEE_FIXED * 100);
    const recvCents = Math.max(sendCents - feeCents, 0);

    // Make sure the recipient exists
    const recipientSnap = await db.ref(`users/${recipientUid}`).get();
    if (!recipientSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Recipient account not found.' });
    }

    // Atomically deduct from sender
    const senderBalRef = db.ref(`users/${senderUid}/balance`);
    let senderResult;
    try {
        senderResult = await senderBalRef.transaction(current => {
            if (current === null) return current; // retry
            let balCents = Math.round(Number(current) * 100);
            if (!isFinite(balCents)) balCents = 0;
            if (balCents < sendCents) return undefined; // abort — insufficient
            return (balCents - sendCents) / 100;
        });
    } catch (err) {
        console.error('[wallet/transfer] sender transaction error', err);
        return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
    }

    if (!senderResult.committed) {
        return res.status(400).json({ success: false, error: 'Insufficient balance.' });
    }
    const newSenderBalance = senderResult.snapshot.val();

    // Credit recipient
    const recipientBalRef = db.ref(`users/${recipientUid}/balance`);
    try {
        await recipientBalRef.transaction(current => {
            let balCents = Math.round(Number(current || 0) * 100);
            if (!isFinite(balCents)) balCents = 0;
            return (balCents + recvCents) / 100;
        });
    } catch (err) {
        // Sender already debited — roll back so funds aren't lost
        console.error('[wallet/transfer] recipient credit failed, rolling back', err);
        await senderBalRef.transaction(current => {
            let balCents = Math.round(Number(current || 0) * 100);
            if (!isFinite(balCents)) balCents = 0;
            return (balCents + sendCents) / 100;
        }).catch(e2 => console.error('[wallet/transfer] rollback failed', e2));
        return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
    }

    // Log transfer record
    await db.ref('transfers').push({
        type:      'donation',
        from:      senderUid,
        to:        recipientUid,
        amount:    sendCents / 100,
        fee:       feeCents / 100,
        received:  recvCents / 100,
        createdAt: Date.now(),
    }).catch(err => console.error('[wallet/transfer] failed to log record', err));

    return res.status(200).json({
        success:           true,
        newBalance:        newSenderBalance,
        amountSent:        sendCents / 100,
        fee:               feeCents / 100,
        recipientReceived: recvCents / 100,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: promote
// Body: { action, listingId, budget, cpm }
// ─────────────────────────────────────────────────────────────────────────────
async function handlePromote(req, res, db, senderUid) {
    const { listingId, budget, cpm } = req.body || {};

    // Validate inputs
    if (typeof listingId !== 'string' || !listingId) {
        return res.status(400).json({ success: false, error: 'Missing listingId.' });
    }

    const budgetAmt = Number(budget);
    if (!isFinite(budgetAmt) || budgetAmt <= 0) {
        return res.status(400).json({ success: false, error: 'Enter a valid budget.' });
    }
    if (budgetAmt > MAX_PROMOTE_BUDGET) {
        return res.status(400).json({ success: false, error: `Maximum budget is $${MAX_PROMOTE_BUDGET}.` });
    }

    const cpmAmt = Number(cpm);
    if (!isFinite(cpmAmt) || cpmAmt <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid CPM value.' });
    }
    if (cpmAmt < MIN_CPM || cpmAmt > MAX_CPM) {
        return res.status(400).json({ success: false, error: `CPM must be between $${MIN_CPM.toFixed(2)} and $${MAX_CPM.toFixed(2)}.` });
    }

    // Verify the listing exists and belongs to this user
    const listingSnap = await db.ref(`websites/${listingId}`).get();
    if (!listingSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Listing not found.' });
    }
    const listing = listingSnap.val();

    if (listing.uid !== senderUid) {
        return res.status(403).json({ success: false, error: 'You do not own this listing.' });
    }

    // Listing must be approved/live — not pending, rejected, or sold
    const allowedStatuses = ['live', 'approved', 'active'];
    const listingStatus   = (listing.status || '').toLowerCase();
    if (!allowedStatuses.includes(listingStatus)) {
        return res.status(400).json({
            success: false,
            error: `Listing must be approved before promoting. Current status: ${listingStatus}.`,
        });
    }

    // Minimum spend scales with the listing's own asking price (read from the
    // trusted Firebase record, never from client input — the client's
    // suggested min_budget from /api/sellmypage is UX-only, this is the
    // actual enforced floor). Keep this curve identical to minPromoteBudget()
    // in sellmypage.js so the UI's suggested minimum never disagrees with
    // what launch will actually accept.
    const listingPrice = Number(listing.price) || 0;
    const minBudgetAmt = minPromoteBudgetForPrice(listingPrice);
    if (budgetAmt < minBudgetAmt) {
        return res.status(400).json({ success: false, error: `Minimum budget for this listing is $${minBudgetAmt.toFixed(2)}.` });
    }

    const budgetCents   = Math.round(budgetAmt * 100);
    const estimatedViews = Math.round((budgetAmt / cpmAmt) * 1000);

    // Atomically deduct budget from user's wallet
    const balRef = db.ref(`users/${senderUid}/balance`);
    let deductResult;
    try {
        deductResult = await balRef.transaction(current => {
            if (current === null) return current; // retry
            let balCents = Math.round(Number(current) * 100);
            if (!isFinite(balCents)) balCents = 0;
            if (balCents < budgetCents) return undefined; // abort — insufficient
            return (balCents - budgetCents) / 100;
        });
    } catch (err) {
        console.error('[wallet/promote] balance transaction error', err);
        return res.status(500).json({ success: false, error: 'Promotion failed. Please try again.' });
    }

    if (!deductResult.committed) {
        return res.status(400).json({ success: false, error: 'Insufficient balance.' });
    }
    const newBalance = deductResult.snapshot.val();

    // Mark listing as sponsored in websites/<id>
    const now = Date.now();
    const sponsorData = {
        sponsored:        true,
        isSponsored:      true,
        promoteViews:     estimatedViews,
        promoteViewsUsed: 0,
        promoteBudget:    budgetAmt,
        promoteCpm:       cpmAmt,
        promoteStart:     now,
        promoteStatus:    'active',
    };

    try {
        await db.ref(`websites/${listingId}`).update(sponsorData);
        // Mirror to user's own listing node
        await db.ref(`users/${senderUid}/listings/${listingId}`).update(sponsorData);
    } catch (err) {
        // Budget was deducted but listing not marked — roll back wallet
        console.error('[wallet/promote] listing update failed, rolling back', err);
        await balRef.transaction(current => {
            let balCents = Math.round(Number(current || 0) * 100);
            if (!isFinite(balCents)) balCents = 0;
            return (balCents + budgetCents) / 100;
        }).catch(e2 => console.error('[wallet/promote] rollback failed', e2));
        return res.status(500).json({ success: false, error: 'Promotion failed. Please try again.' });
    }

    // Log campaign record
    await db.ref(`users/${senderUid}/campaigns`).push({
        listingId,
        siteTitle:      listing.title    || '',
        siteUrl:        listing.url      || '',
        category:       listing.category || '',
        budget:         budgetAmt,
        cpm:            cpmAmt,
        estimatedViews,
        status:         'active',
        createdAt:      now,
    }).catch(err => console.error('[wallet/promote] failed to log campaign', err));

    return res.status(200).json({
        success:        true,
        newBalance,
        budget:         budgetAmt,
        estimatedViews,
    });
}
