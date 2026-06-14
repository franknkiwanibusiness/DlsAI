// /api/transfer.js
//
// Server-side wallet-to-wallet transfer ("Donate" feature on the seller profile page).
//
// All balance math happens here, never on the client. The client only sends
// { recipientUid, amount } plus a Firebase ID token proving who the sender is.
// The sender's balance is re-read from Realtime Database and atomically
// decremented inside a transaction, so it cannot go negative and cannot be
// spoofed by editing window._fbUserData, devtools, etc.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

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

// Keep these in sync with the DONATE_* constants in seller-7-1.html (used for the
// live preview only — these server values are the ones actually enforced).
const FEE_RATE  = 0.03;  // 3% platform fee
const FEE_FIXED = 0.49;  // + $0.49 fixed, PayPal-style

// Hard limits — enforced server-side regardless of what the client sends.
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 999;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // ── 1. Authenticate the sender via Firebase ID token ──
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
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' });
    }
    const senderUid = decoded.uid;

    // ── 2. Validate the request body ──
    const { recipientUid, amount } = req.body || {};

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
    if (amt < MIN_AMOUNT) {
        return res.status(400).json({ success: false, error: `Minimum donation is $${MIN_AMOUNT.toFixed(2)}.` });
    }
    if (amt > MAX_AMOUNT) {
        return res.status(400).json({ success: false, error: `Maximum donation is $${MAX_AMOUNT.toFixed(2)}.` });
    }

    // Work in integer cents to avoid floating point drift.
    const sendCents = Math.round(amt * 100);
    const feeCents  = Math.round(sendCents * FEE_RATE + FEE_FIXED * 100);
    const recvCents = Math.max(sendCents - feeCents, 0);

    // ── 3. Make sure the recipient actually exists ──
    const recipientSnap = await db.ref(`users/${recipientUid}`).get();
    if (!recipientSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Recipient account not found.' });
    }

    // ── 4. Atomically deduct from the sender, checking balance server-side ──
    const senderBalRef = db.ref(`users/${senderUid}/balance`);
    let senderResult;
    try {
        senderResult = await senderBalRef.transaction(current => {
            let balCents = Math.round(Number(current || 0) * 100);
            if (!isFinite(balCents)) balCents = 0;
            if (balCents < sendCents) {
                // Returning undefined aborts the transaction without writing anything.
                return;
            }
            return (balCents - sendCents) / 100;
        });
    } catch (err) {
        console.error('[transfer] sender transaction error', err);
        return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
    }

    if (!senderResult.committed) {
        return res.status(400).json({ success: false, error: 'Insufficient balance.' });
    }
    const newSenderBalance = senderResult.snapshot.val();

    // ── 5. Credit the recipient ──
    const recipientBalRef = db.ref(`users/${recipientUid}/balance`);
    try {
        await recipientBalRef.transaction(current => {
            let balCents = Math.round(Number(current || 0) * 100);
            if (!isFinite(balCents)) balCents = 0;
            return (balCents + recvCents) / 100;
        });
    } catch (err) {
        // Sender has already been debited — roll back so funds aren't lost.
        console.error('[transfer] recipient transaction error, rolling back sender debit', err);
        await senderBalRef.transaction(current => {
            let balCents = Math.round(Number(current || 0) * 100);
            if (!isFinite(balCents)) balCents = 0;
            return (balCents + sendCents) / 100;
        }).catch(e2 => console.error('[transfer] rollback failed', e2));
        return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
    }

    // ── 6. Record the transaction for history / auditing ──
    await db.ref('transfers').push({
        type: 'donation',
        from: senderUid,
        to: recipientUid,
        amount: sendCents / 100,
        fee: feeCents / 100,
        received: recvCents / 100,
        createdAt: Date.now(),
    }).catch(err => console.error('[transfer] failed to log transfer record', err));

    return res.status(200).json({
        success: true,
        newBalance: newSenderBalance,
        amountSent: sendCents / 100,
        fee: feeCents / 100,
        recipientReceived: recvCents / 100,
    });
}
