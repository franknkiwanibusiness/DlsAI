// api/transfer.js — Siterifty secure wallet transfer
// Uses Firebase Admin SDK (server-only) + Groq AI fraud detection
// All balance math happens server-side in a transaction — no frontend manipulation possible

import admin from 'firebase-admin';
import Groq from 'groq-sdk';

// ─── Firebase Admin singleton ──────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel escapes newlines in env vars — restore them
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db    = admin.database();
const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Constants ────────────────────────────────────────────────────────────
const MIN_AMOUNT        = 1;       // $1 minimum per transfer
const MAX_AMOUNT        = 1000;    // $1000 maximum per transfer
const FEE_RATE          = 0.03;    // 3% fee deducted from sender
const DAILY_LIMIT       = 2000;    // $2,000 total outgoing per calendar day
const DAILY_TX_COUNT    = 10;      // max 10 transfers per day
const LOOKBACK_DAYS     = 7;       // Groq reviews last 7 days of activity

// ─── Helpers ──────────────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function usdStr(n) {
  return '$' + Number(n).toFixed(2);
}

// ─── Groq AI fraud check ──────────────────────────────────────────────────
async function runFraudCheck({ senderUid, senderEmail, recipientEmail, amount, todayTotal, todayCount, recentTx }) {
  const prompt = `
You are a financial fraud detection system for Siterifty, a website marketplace.
Analyze this transfer and recent history, then respond ONLY with valid JSON.

Transfer:
- Sender UID: ${senderUid}
- Sender email: ${senderEmail}
- Recipient email: ${recipientEmail}
- Amount: ${usdStr(amount)}
- Sender's transfers today: ${todayCount} transfers totalling ${usdStr(todayTotal)}
- Recent 7-day transfers (newest first): ${JSON.stringify(recentTx.slice(0, 20))}

Detect:
1. Round-tripping (A→B→A laundering)
2. Structuring (many transfers just under limit)
3. Burst activity (many transfers to different accounts in short window)
4. Unusual patterns (new account moving large sums, transfers to same recipient repeatedly today)
5. Any other money-laundering or fraud signal

Respond ONLY with this exact JSON shape, no markdown, no extra text:
{
  "risk": "low" | "medium" | "high",
  "action": "allow" | "warn" | "block" | "ban",
  "reason": "one sentence plain English reason visible to the user if blocked/warned",
  "internal": "brief internal note for audit log"
}

Rules:
- "low"  → action must be "allow"
- "medium" → action must be "warn" (transfer proceeds but user sees warning)
- "high"   → action must be "block" OR "ban"
- "ban"    → only for clear evidence of deliberate fraud / repeated violations
- Be consistent across identical patterns. Do not randomly vary decisions.
`;

  try {
    const chat = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 300,
    });
    const raw = chat.choices[0]?.message?.content?.trim() || '{}';
    // Strip any accidental markdown fences
    const clean = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('[transfer] Groq error:', e.message);
    // Fail open with medium risk — don't block legitimate transfers if AI is down
    return { risk: 'medium', action: 'warn', reason: 'Fraud check temporarily unavailable — transfer logged for review.', internal: 'groq_error: ' + e.message };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Parse & validate input ──────────────────────────────────────────
  const { idToken, recipientEmail, amount: rawAmount } = req.body || {};

  if (!idToken || !recipientEmail || rawAmount === undefined) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return res.status(400).json({ error: `Amount must be between ${usdStr(MIN_AMOUNT)} and ${usdStr(MAX_AMOUNT)}.` });
  }

  // Normalise email
  const recipientEmailNorm = recipientEmail.trim().toLowerCase();

  // ── 2. Verify sender identity (server-side, cannot be spoofed) ─────────
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (e) {
    return res.status(401).json({ error: 'Authentication failed. Please sign in again.' });
  }

  const senderUid   = decodedToken.uid;
  const senderEmail = (decodedToken.email || '').toLowerCase();

  // ── 3. Block self-transfer ─────────────────────────────────────────────
  if (senderEmail === recipientEmailNorm) {
    return res.status(400).json({ error: 'You cannot transfer funds to yourself.' });
  }

  // ── 4. Resolve recipient ───────────────────────────────────────────────
  let recipientRecord;
  try {
    recipientRecord = await admin.auth().getUserByEmail(recipientEmailNorm);
  } catch (e) {
    return res.status(404).json({ error: 'No account found with that email address.' });
  }

  const recipientUid = recipientRecord.uid;

  if (recipientUid === senderUid) {
    return res.status(400).json({ error: 'You cannot transfer funds to yourself.' });
  }

  // Check recipient is not banned
  const recipientBanSnap = await db.ref(`users/${recipientUid}/banned/active`).get();
  if (recipientBanSnap.val() === true) {
    return res.status(400).json({ error: 'The recipient account is not eligible to receive transfers.' });
  }

  // ── 5. Daily limit check ───────────────────────────────────────────────
  const day = todayKey();
  const dailyRef  = db.ref(`transferLimits/${senderUid}/${day}`);
  const dailySnap = await dailyRef.get();
  const dailyData = dailySnap.val() || { total: 0, count: 0 };

  if (dailyData.count >= DAILY_TX_COUNT) {
    return res.status(429).json({ error: `Daily transfer limit reached (${DAILY_TX_COUNT} transfers per day). Try again tomorrow.` });
  }
  if ((dailyData.total + amount) > DAILY_LIMIT) {
    const remaining = Math.max(0, DAILY_LIMIT - dailyData.total);
    return res.status(429).json({ error: `Daily transfer limit reached. You can transfer up to ${usdStr(remaining)} more today.` });
  }

  // ── 6. Pull recent transfers for AI review ─────────────────────────────
  const recentSnap = await db.ref(`transfers`)
    .orderByChild('senderUid')
    .equalTo(senderUid)
    .limitToLast(50)
    .get();

  const recentTx = [];
  const cutoff = Date.now() - LOOKBACK_DAYS * 86400000;
  recentSnap.forEach(child => {
    const t = child.val();
    if (t.ts >= cutoff) recentTx.push({ to: t.recipientEmail, amount: t.amount, ts: t.ts, day: new Date(t.ts).toISOString().slice(0,10) });
  });
  recentTx.sort((a, b) => b.ts - a.ts);

  // ── 7. Groq AI fraud check ─────────────────────────────────────────────
  const fraud = await runFraudCheck({
    senderUid, senderEmail,
    recipientEmail: recipientEmailNorm,
    amount,
    todayTotal: dailyData.total,
    todayCount: dailyData.count,
    recentTx,
  });

  // Handle ban
  if (fraud.action === 'ban') {
    await db.ref(`users/${senderUid}/banned`).set({
      active: true,
      reason: 'Automated fraud detection: ' + fraud.internal,
      bannedAt: Date.now(),
      bannedBy: 'fraud_ai',
    });
    // Log the flagged attempt
    await db.ref('fraudLogs').push({
      senderUid, senderEmail, recipientEmail: recipientEmailNorm,
      amount, ts: Date.now(),
      fraudResult: fraud,
    });
    return res.status(403).json({ error: 'Your account has been suspended due to suspicious activity. Contact support to appeal.' });
  }

  // Handle block (not ban — just reject this transfer)
  if (fraud.action === 'block') {
    await db.ref('fraudLogs').push({
      senderUid, senderEmail, recipientEmail: recipientEmailNorm,
      amount, ts: Date.now(),
      fraudResult: fraud,
    });
    return res.status(403).json({ error: fraud.reason || 'This transfer was blocked by our fraud system.' });
  }

  // ── 8. Compute final amounts ───────────────────────────────────────────
  const fee         = parseFloat((amount * FEE_RATE).toFixed(2));
  const totalDeduct = parseFloat((amount + fee).toFixed(2)); // sender loses amount + fee
  const creditAmt   = amount;                                 // recipient gets exact amount

  // ── 9. Atomic transaction — read-then-write with abort on balance issues ──
  let txResult;
  try {
    txResult = await db.ref('/').transaction(root => {
      if (root === null) return root; // Firebase retry

      const senderBalance    = parseFloat((root.users?.[senderUid]?.balance)    || 0);
      const recipientBalance = parseFloat((root.users?.[recipientUid]?.balance) || 0);

      // Abort if sender can't cover
      if (senderBalance < totalDeduct) {
        return undefined; // abort transaction
      }

      // Double-check sender still not banned inside transaction
      if (root.users?.[senderUid]?.banned?.active === true) {
        return undefined;
      }

      // Apply balances — precise rounding to avoid floating point drift
      root.users[senderUid].balance    = parseFloat((senderBalance    - totalDeduct).toFixed(2));
      root.users[recipientUid].balance = parseFloat((recipientBalance + creditAmt).toFixed(2));

      return root;
    });
  } catch (e) {
    console.error('[transfer] transaction error:', e);
    return res.status(500).json({ error: 'Transfer failed due to a server error. No funds were moved.' });
  }

  if (!txResult.committed) {
    // Either insufficient balance or account banned
    const senderSnap = await db.ref(`users/${senderUid}`).get();
    const senderData = senderSnap.val() || {};

    if (senderData?.banned?.active === true) {
      return res.status(403).json({ error: 'Your account is suspended.' });
    }
    // Must be insufficient balance
    const actualBal = parseFloat(senderData.balance || 0);
    return res.status(400).json({
      error: `Insufficient balance. You have ${usdStr(actualBal)} but this transfer requires ${usdStr(totalDeduct)} (including ${usdStr(fee)} fee).`
    });
  }

  // ── 10. Record transfer log + update daily limits ──────────────────────
  const txId  = db.ref('transfers').push().key;
  const txTs  = Date.now();
  const txLog = {
    txId,
    senderUid,
    senderEmail,
    recipientUid,
    recipientEmail: recipientEmailNorm,
    amount,
    fee,
    totalDeducted: totalDeduct,
    credited: creditAmt,
    ts: txTs,
    day,
    fraudRisk: fraud.risk,
    fraudAction: fraud.action,
    fraudInternal: fraud.internal || '',
  };

  const updates = {};
  updates[`transfers/${txId}`] = txLog;
  updates[`transferLimits/${senderUid}/${day}/total`]  = (dailyData.total + amount);
  updates[`transferLimits/${senderUid}/${day}/count`]  = (dailyData.count + 1);

  // Per-user transfer history (for display in UI)
  updates[`userTransfers/${senderUid}/${txId}`]    = { ...txLog, direction: 'sent' };
  updates[`userTransfers/${recipientUid}/${txId}`] = { ...txLog, direction: 'received' };

  await db.ref('/').update(updates);

  // ── 11. Read back new sender balance ──────────────────────────────────
  const newSenderSnap = await db.ref(`users/${senderUid}/balance`).get();
  const newBalance    = parseFloat(newSenderSnap.val() || 0);

  // Fetch recipient display name for response
  const recipientDbSnap = await db.ref(`users/${recipientUid}`).get();
  const recipientData   = recipientDbSnap.val() || {};

  return res.status(200).json({
    success:       true,
    txId,
    amount,
    fee,
    totalDeducted: totalDeduct,
    credited:      creditAmt,
    newBalance,
    recipient: {
      email:    recipientEmailNorm,
      name:     recipientData.username || recipientData.displayName || recipientRecord.displayName || '',
    },
    warning: fraud.action === 'warn' ? fraud.reason : null,
  });
}
