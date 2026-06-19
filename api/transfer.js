// /api/transfer.js
//
// Central handler for all wallet money-movement on Siterifty.
//
// POST actions:
//
//   transfer_lookup  { recipientEmail }
//     → resolves an email address to a display name + uid for the transfer UI.
//
//   transfer         { recipientEmail, amount }
//     → wallet-to-wallet send by email (Transfer Funds modal).
//       3 % platform fee deducted from sender on top of the sent amount.
//
//   donate           { recipientUid, amount }
//     → wallet-to-wallet send by UID (Donate button on seller profiles).
//       3 % + $0.49 fixed fee deducted from the amount sent.
//
//   (no action)      { recipientUid, amount, _dealEscrow, dealId }
//     → escrow payment: deducts from buyer, writes to pendingBalance of seller.
//
//   withdraw         { requestedGross, paypalEmail, method }
//     → queues a payout request.  Fee rate is looked up from the user's plan in
//       Firebase — the client never supplies the rate.  Balance is atomically
//       deducted; a withdrawal record is written with status:'pending' for the
//       payout processor to fulfil.
//
// All balance math is server-side.  The user's balance is re-read from
// Realtime Database inside a Firebase transaction so it cannot go negative and
// cannot be spoofed by editing window._fbUserData or replaying requests.

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

// ── Fee constants ─────────────────────────────────────────────────────────────

// Transfer (send by email) — 3 % on top of amount sent (sender pays the fee)
const TRANSFER_FEE_RATE  = 0.03;
const TRANSFER_MIN       = 1;
const TRANSFER_MAX       = 1000;

// Donate (by UID) — 3 % + $0.49 deducted from amount (recipient gets less)
const DONATE_FEE_RATE  = 0.03;
const DONATE_FEE_FIXED = 0.49;
const DONATE_MIN       = 1;
const DONATE_MAX       = 999;

// Withdraw — fee rate looked up server-side from user's plan; never trusted from client
const WITHDRAW_FEE_BY_PLAN = {
  free:    0.30,
  starter: 0.15,
  growth:  0.10,
  pro:     0.05,
};
const WITHDRAW_MIN = 50;
const WITHDRAW_MAX = 999;

// ── Auth helper ───────────────────────────────────────────────────────────────
async function authenticate(req, res) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    res.status(401).json({ success: false, error: 'Missing Authorization header' });
    return null;
  }
  try {
    return await getAuth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired session. Please sign in again.' });
    return null;
  }
}

// ── Shared: atomically deduct from a balance ref ──────────────────────────────
// Returns { committed, newBalance } or throws.
async function deductBalance(balRef, deductCents) {
  const result = await balRef.transaction(current => {
    if (current === null) return current;   // retry with real value
    let balCents = Math.round(Number(current) * 100);
    if (!isFinite(balCents)) balCents = 0;
    if (balCents < deductCents) return undefined;  // abort — insufficient
    return (balCents - deductCents) / 100;
  });
  return { committed: result.committed, newBalance: result.snapshot.val() };
}

// ── Shared: atomically credit a balance ref ───────────────────────────────────
async function creditBalance(balRef, creditCents) {
  await balRef.transaction(current => {
    let balCents = Math.round(Number(current || 0) * 100);
    if (!isFinite(balCents)) balCents = 0;
    return (balCents + creditCents) / 100;
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  initFirebase();
  const db = getDatabase();

  const decoded = await authenticate(req, res);
  if (!decoded) return;
  const uid = decoded.uid;

  const body   = req.body || {};
  const action = body.action || null;

  if (action === 'transfer_lookup') return handleTransferLookup(req, res, db, uid);
  if (action === 'transfer')        return handleTransfer(req, res, db, uid);
  if (action === 'donate')          return handleDonate(req, res, db, uid);
  if (action === 'withdraw')        return handleWithdraw(req, res, db, uid);

  // Legacy / escrow path: no action field, but has recipientUid
  if (body.recipientUid)            return handleEscrow(req, res, db, uid);

  return res.status(400).json({ success: false, error: "Invalid action." });
}

// ── ACTION: transfer_lookup ───────────────────────────────────────────────────
// Body: { recipientEmail }
// Returns the display name + uid so the UI can show a confirmation before send.
async function handleTransferLookup(req, res, db, senderUid) {
  const { recipientEmail } = req.body || {};

  if (typeof recipientEmail !== 'string' || !recipientEmail.includes('@'))
    return res.status(400).json({ success: false, error: 'Enter a valid email address.' });

  const email = recipientEmail.trim().toLowerCase();

  // Find user by email in Firebase Auth
  let userRecord;
  try {
    userRecord = await getAuth().getUserByEmail(email);
  } catch {
    return res.status(404).json({ success: false, error: 'No account found with that email.' });
  }

  if (userRecord.uid === senderUid)
    return res.status(400).json({ success: false, error: 'You cannot transfer to yourself.' });

  const snap = await db.ref(`users/${userRecord.uid}`).get();
  const data = snap.val() || {};

  return res.status(200).json({
    success: true,
    uid:     userRecord.uid,
    email:   userRecord.email,
    name:    data.username || data.displayName || '',
  });
}

// ── ACTION: transfer (by email) ───────────────────────────────────────────────
// Body: { recipientEmail, amount }
// Sender pays amount + 3% fee from their balance. Recipient receives full amount.
async function handleTransfer(req, res, db, senderUid) {
  const { recipientEmail, amount } = req.body || {};

  if (typeof recipientEmail !== 'string' || !recipientEmail.includes('@'))
    return res.status(400).json({ success: false, error: 'Enter a valid recipient email.' });

  const amt = Number(amount);
  if (!isFinite(amt) || amt <= 0)
    return res.status(400).json({ success: false, error: 'Enter a valid amount.' });
  if (amt < TRANSFER_MIN)
    return res.status(400).json({ success: false, error: `Minimum transfer is $${TRANSFER_MIN.toFixed(2)}.` });
  if (amt > TRANSFER_MAX)
    return res.status(400).json({ success: false, error: `Maximum transfer is $${TRANSFER_MAX.toFixed(2)}.` });

  // Resolve recipient
  let recipientRecord;
  try {
    recipientRecord = await getAuth().getUserByEmail(recipientEmail.trim().toLowerCase());
  } catch {
    return res.status(404).json({ success: false, error: 'No account found with that email.' });
  }

  if (recipientRecord.uid === senderUid)
    return res.status(400).json({ success: false, error: 'You cannot transfer to yourself.' });

  const sendCents  = Math.round(amt * 100);
  const feeCents   = Math.round(sendCents * TRANSFER_FEE_RATE);
  const totalCents = sendCents + feeCents;  // sender pays amount + fee

  // Deduct total (amount + fee) from sender
  const senderBalRef = db.ref(`users/${senderUid}/balance`);
  let deduct;
  try {
    deduct = await deductBalance(senderBalRef, totalCents);
  } catch (err) {
    console.error('[transfer/transfer] deduct error', err);
    return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
  }
  if (!deduct.committed)
    return res.status(400).json({ success: false, error: 'Insufficient balance.' });

  // Credit full amount to recipient
  const recipientBalRef = db.ref(`users/${recipientRecord.uid}/balance`);
  try {
    await creditBalance(recipientBalRef, sendCents);
  } catch (err) {
    console.error('[transfer/transfer] credit failed, rolling back', err);
    await creditBalance(senderBalRef, totalCents)
      .catch(e2 => console.error('[transfer/transfer] rollback failed', e2));
    return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
  }

  const recipSnap = await db.ref(`users/${recipientRecord.uid}`).get();
  const recipData = recipSnap.val() || {};

  await db.ref('transfers').push({
    type:      'transfer',
    from:      senderUid,
    to:        recipientRecord.uid,
    amount:    sendCents  / 100,
    fee:       feeCents   / 100,
    total:     totalCents / 100,
    createdAt: Date.now(),
  }).catch(err => console.error('[transfer/transfer] log failed', err));

  return res.status(200).json({
    success:    true,
    newBalance: deduct.newBalance,
    amount:     sendCents  / 100,
    fee:        feeCents   / 100,
    total:      totalCents / 100,
    recipient:  { uid: recipientRecord.uid, email: recipientRecord.email, name: recipData.username || '' },
  });
}

// ── ACTION: donate (by UID) ───────────────────────────────────────────────────
// Body: { recipientUid, amount }
// Fee deducted from the amount — recipient receives less.
async function handleDonate(req, res, db, senderUid) {
  const { recipientUid, amount } = req.body || {};

  if (typeof recipientUid !== 'string' || !recipientUid)
    return res.status(400).json({ success: false, error: 'Missing recipient.' });
  if (recipientUid === senderUid)
    return res.status(400).json({ success: false, error: "You can't donate to yourself." });

  const amt = Number(amount);
  if (!isFinite(amt) || amt <= 0)
    return res.status(400).json({ success: false, error: 'Enter a valid amount.' });
  if (amt < DONATE_MIN)
    return res.status(400).json({ success: false, error: `Minimum donation is $${DONATE_MIN.toFixed(2)}.` });
  if (amt > DONATE_MAX)
    return res.status(400).json({ success: false, error: `Maximum donation is $${DONATE_MAX.toFixed(2)}.` });

  const sendCents = Math.round(amt * 100);
  const feeCents  = Math.round(sendCents * DONATE_FEE_RATE + DONATE_FEE_FIXED * 100);
  const recvCents = Math.max(sendCents - feeCents, 0);

  const recipientSnap = await db.ref(`users/${recipientUid}`).get();
  if (!recipientSnap.exists())
    return res.status(404).json({ success: false, error: 'Recipient account not found.' });

  const senderBalRef = db.ref(`users/${senderUid}/balance`);
  let deduct;
  try {
    deduct = await deductBalance(senderBalRef, sendCents);
  } catch (err) {
    console.error('[transfer/donate] deduct error', err);
    return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
  }
  if (!deduct.committed)
    return res.status(400).json({ success: false, error: 'Insufficient balance.' });

  const recipientBalRef = db.ref(`users/${recipientUid}/balance`);
  try {
    await creditBalance(recipientBalRef, recvCents);
  } catch (err) {
    console.error('[transfer/donate] credit failed, rolling back', err);
    await creditBalance(senderBalRef, sendCents)
      .catch(e2 => console.error('[transfer/donate] rollback failed', e2));
    return res.status(500).json({ success: false, error: 'Transfer failed. Please try again.' });
  }

  await db.ref('transfers').push({
    type:      'donation',
    from:      senderUid,
    to:        recipientUid,
    amount:    sendCents / 100,
    fee:       feeCents  / 100,
    received:  recvCents / 100,
    createdAt: Date.now(),
  }).catch(err => console.error('[transfer/donate] log failed', err));

  return res.status(200).json({
    success:           true,
    newBalance:        deduct.newBalance,
    amountSent:        sendCents / 100,
    fee:               feeCents  / 100,
    recipientReceived: recvCents / 100,
  });
}

// ── ACTION: escrow (legacy — no action field) ─────────────────────────────────
// Body: { recipientUid, amount, _dealEscrow, dealId }
// Deducts from buyer; writes to seller's pendingBalance instead of live balance.
async function handleEscrow(req, res, db, buyerUid) {
  const { recipientUid: sellerUid, amount, dealId } = req.body || {};

  if (typeof sellerUid !== 'string' || !sellerUid)
    return res.status(400).json({ success: false, error: 'Missing seller.' });
  if (sellerUid === buyerUid)
    return res.status(400).json({ success: false, error: 'Invalid deal.' });

  const amt = Number(amount);
  if (!isFinite(amt) || amt <= 0)
    return res.status(400).json({ success: false, error: 'Invalid amount.' });

  const amtCents = Math.round(amt * 100);

  const sellerSnap = await db.ref(`users/${sellerUid}`).get();
  if (!sellerSnap.exists())
    return res.status(404).json({ success: false, error: 'Seller account not found.' });

  const buyerBalRef = db.ref(`users/${buyerUid}/balance`);
  let deduct;
  try {
    deduct = await deductBalance(buyerBalRef, amtCents);
  } catch (err) {
    console.error('[transfer/escrow] deduct error', err);
    return res.status(500).json({ success: false, error: 'Payment failed. Please try again.' });
  }
  if (!deduct.committed)
    return res.status(400).json({ success: false, error: 'Insufficient balance.' });

  // Credit seller's pendingBalance (not live balance) until deal is confirmed
  const sellerPendingRef = db.ref(`users/${sellerUid}/pendingBalance`);
  try {
    await creditBalance(sellerPendingRef, amtCents);
  } catch (err) {
    console.error('[transfer/escrow] pending credit failed, rolling back', err);
    await creditBalance(buyerBalRef, amtCents)
      .catch(e2 => console.error('[transfer/escrow] rollback failed', e2));
    return res.status(500).json({ success: false, error: 'Payment failed. Please try again.' });
  }

  await db.ref('transfers').push({
    type:      'escrow',
    from:      buyerUid,
    to:        sellerUid,
    amount:    amtCents / 100,
    dealId:    dealId || null,
    status:    'held',
    createdAt: Date.now(),
  }).catch(err => console.error('[transfer/escrow] log failed', err));

  return res.status(200).json({
    success:    true,
    newBalance: deduct.newBalance,
    amount:     amtCents / 100,
  });
}

// ── ACTION: withdraw ──────────────────────────────────────────────────────────
// Body: { requestedGross, paypalEmail, method }
// Fee rate is read from the user's plan in Firebase — never trusted from client.
// Balance is atomically deducted; a withdrawal record is written with
// status:'pending' for the payout processor (e.g. PayPal Payouts API) to fulfil.
async function handleWithdraw(req, res, db, uid) {
  const { requestedGross, paypalEmail, method = 'paypal' } = req.body || {};

  if (typeof paypalEmail !== 'string' || !paypalEmail.includes('@'))
    return res.status(400).json({ success: false, error: 'A valid PayPal email is required.' });

  const gross = Number(requestedGross);
  if (!isFinite(gross) || gross <= 0)
    return res.status(400).json({ success: false, error: 'Enter a valid withdrawal amount.' });
  if (gross < WITHDRAW_MIN)
    return res.status(400).json({ success: false, error: `Minimum withdrawal is $${WITHDRAW_MIN.toFixed(2)}.` });
  if (gross > WITHDRAW_MAX)
    return res.status(400).json({ success: false, error: `Maximum withdrawal is $${WITHDRAW_MAX.toFixed(2)} per transaction.` });

  const grossCents = Math.round(gross * 100);

  // Look up user's plan from Firebase — never trust the client
  const userSnap = await db.ref(`users/${uid}`).get();
  if (!userSnap.exists())
    return res.status(404).json({ success: false, error: 'User account not found.' });

  const userData = userSnap.val();

  if (userData.banned && userData.banned.active)
    return res.status(403).json({ success: false, error: 'Your account is suspended. Contact support.' });

  const plan    = (userData.plan || 'free').toLowerCase();
  const feeRate = WITHDRAW_FEE_BY_PLAN[plan] ?? WITHDRAW_FEE_BY_PLAN.free;
  const feeCents = Math.round(grossCents * feeRate);
  const netCents = Math.max(grossCents - feeCents, 0);

  // Atomically deduct gross from balance
  const balRef = db.ref(`users/${uid}/balance`);
  let deduct;
  try {
    deduct = await deductBalance(balRef, grossCents);
  } catch (err) {
    console.error('[transfer/withdraw] deduct error', err);
    return res.status(500).json({ success: false, error: 'Withdrawal failed. Please try again.' });
  }
  if (!deduct.committed)
    return res.status(400).json({ success: false, error: 'Insufficient balance.' });

  // Write withdrawal record for payout processor
  const now          = Date.now();
  const withdrawalId = `wd_${uid}_${now}`;
  try {
    await db.ref(`withdrawals/${withdrawalId}`).set({
      uid,
      paypalEmail,
      method,
      plan,
      gross:     grossCents / 100,
      fee:       feeCents   / 100,
      feeRate,
      net:       netCents   / 100,
      status:    'pending',
      createdAt: now,
    });
    await db.ref(`users/${uid}/withdrawals/${withdrawalId}`).set({
      gross:      grossCents / 100,
      fee:        feeCents   / 100,
      net:        netCents   / 100,
      feeRate,
      status:     'pending',
      paypalEmail,
      createdAt:  now,
    });
  } catch (err) {
    // Record write failed — roll back balance deduction so funds aren't lost
    console.error('[transfer/withdraw] record write failed, rolling back', err);
    await creditBalance(balRef, grossCents)
      .catch(e2 => console.error('[transfer/withdraw] rollback failed', e2));
    return res.status(500).json({ success: false, error: 'Withdrawal failed. Please try again.' });
  }

  return res.status(200).json({
    success:      true,
    withdrawalId,
    newBalance:   deduct.newBalance,
    gross:        grossCents / 100,
    fee:          feeCents   / 100,
    feeRate,
    amount:       netCents   / 100,   // net payout to user
    status:       'pending',
  });
}
