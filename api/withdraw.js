// ============================================================
//  /api/withdraw.js  — Siterifty secure withdrawal endpoint
//  Vercel / Next.js API route (Node.js runtime)
//
//  Required environment variables:
//    FIREBASE_PROJECT_ID
//    FIREBASE_DATABASE_URL
//    FIREBASE_CLIENT_EMAIL
//    FIREBASE_PRIVATE_KEY          (include \n line-breaks)
//    GROQ_API_KEY                  (for AI scam detection)
// ============================================================

import admin from 'firebase-admin';

// ── Firebase Admin singleton ─────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores \n literally in env — restore real newlines
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db   = admin.database();
const auth = admin.auth();

// ── Plan fee table ───────────────────────────────────────────
const PLAN_FEES = { free: 0.30, starter: 0.15, growth: 0.10, pro: 0.05 };
const MINIMUM_NET = 10; // minimum NET payout in USD — enforced server-side only

// ── AI scam / fraud detection ────────────────────────────────
async function analyseWithdrawal({ uid, email, paypalEmail, amount, userRecord, recentWithdrawals }) {
  try {
    const prompt = `You are a fraud-detection assistant for Siterifty, a website marketplace.
Analyse this withdrawal request and decide if it looks suspicious or like a scam attempt.

User details:
- UID: ${uid}
- Account email: ${email}
- Account created: ${userRecord?.metadata?.creationTime || 'unknown'}
- Email verified: ${userRecord?.emailVerified ?? 'unknown'}

Withdrawal details:
- Payout to PayPal: ${paypalEmail}
- Net amount: $${amount.toFixed(2)} USD
- Recent withdrawals (last 30 days): ${JSON.stringify(recentWithdrawals || [])}

Red flags to consider:
• Account very new (< 7 days) requesting large withdrawal
• PayPal email differs greatly from account email (possible account takeover)
• Multiple large withdrawals in short succession
• Unverified email on account
• Round numbers that seem test-like (e.g. $9999.99, $0.01)

Respond ONLY with a JSON object — no markdown, no extra text:
{
  "flagged": true | false,
  "confidence": "low" | "medium" | "high",
  "reason": "one short sentence explaining why flagged, or empty string if clean"
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 256,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: 'You are a fraud-detection assistant. Respond ONLY with valid JSON — no markdown, no extra text.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) return { flagged: false, reason: '' };

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return parsed;
  } catch (e) {
    // If AI call fails, don't block the withdrawal — log and continue
    console.error('[withdraw] AI analysis error:', e.message);
    return { flagged: false, reason: '' };
  }
}

// ── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idToken, action } = req.body || {};

  if (!idToken) return res.status(401).json({ error: 'Unauthorised' });

  // ── Verify Firebase ID token ─────────────────────────────
  let decoded;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  const uid = decoded.uid;

  // ── Route by action ──────────────────────────────────────

  // ────────────────────────────────────────────────────────
  //  action: "preview"  — return server-side balance + fees
  // ────────────────────────────────────────────────────────
  if (action === 'preview') {
    const snap = await db.ref(`users/${uid}`).once('value');
    const userData = snap.val() || {};

    const balance = parseFloat(userData.balance) || 0;
    const plan    = (userData.plan || 'free').toLowerCase();
    const feeRate = PLAN_FEES[plan] ?? 0.30;
    const fee     = parseFloat((balance * feeRate).toFixed(2));
    const net     = parseFloat((balance - fee).toFixed(2));

    return res.status(200).json({ balance, plan, feeRate, fee, net });
  }

  // ────────────────────────────────────────────────────────
  //  action: "history"  — fetch withdrawal records from Firebase
  // ────────────────────────────────────────────────────────
  if (action === 'history') {
    const snap = await db
      .ref(`withdrawals/${uid}`)
      .orderByChild('date')
      .limitToLast(50)
      .once('value');

    const raw = snap.val() || {};
    // Convert object → array, sorted newest first
    const history = Object.values(raw).sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ history });
  }

  // ────────────────────────────────────────────────────────
  //  action: "withdraw"  — execute the withdrawal
  // ────────────────────────────────────────────────────────
  if (action === 'withdraw') {
    const { paypalEmail, method } = req.body;

    // Basic PayPal email validation
    if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      return res.status(400).json({ error: 'A valid PayPal email is required.' });
    }

    // Read user data fresh from Firebase — never trust client-sent amounts
    const userSnap = await db.ref(`users/${uid}`).once('value');
    const userData = userSnap.val();

    if (!userData) return res.status(404).json({ error: 'User account not found.' });

    const balance = parseFloat(userData.balance) || 0;
    const plan    = (userData.plan || 'free').toLowerCase();
    const feeRate = PLAN_FEES[plan] ?? 0.30;
    const fee     = parseFloat((balance * feeRate).toFixed(2));
    const net     = parseFloat((balance - fee).toFixed(2));

    // ── Server-side minimum check (not in frontend — users can't bypass) ──
    if (net < MINIMUM_NET) {
      return res.status(400).json({
        error: `Your net payout ($${net.toFixed(2)}) is below the minimum of $${MINIMUM_NET.toFixed(2)}.`,
      });
    }
    if (balance <= 0) {
      return res.status(400).json({ error: 'No balance available to withdraw.' });
    }

    // ── Fetch recent withdrawals for AI analysis ──────────
    const recentSnap = await db
      .ref(`withdrawals/${uid}`)
      .orderByChild('date')
      .startAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .once('value');
    const recentWithdrawals = Object.values(recentSnap.val() || {});

    // ── AI fraud / scam detection ─────────────────────────
    let userRecord;
    try { userRecord = await auth.getUser(uid); } catch(_){}

    const aiResult = await analyseWithdrawal({
      uid,
      email: decoded.email || '',
      paypalEmail,
      amount: net,
      userRecord,
      recentWithdrawals,
    });

    if (aiResult.flagged && aiResult.confidence === 'high') {
      // High-confidence fraud: reject outright and flag the account for review
      await db.ref(`users/${uid}/flaggedForReview`).set({
        flaggedAt: new Date().toISOString(),
        reason: aiResult.reason,
        attemptedAmount: net,
      });
      return res.status(403).json({
        error: 'Your withdrawal has been flagged for security review. Our team will contact you within 1–2 business days.',
        flagged: true,
      });
    }

    // ── Atomic balance deduction via Firebase transaction ──
    let newBalance;
    try {
      const txResult = await db.ref(`users/${uid}/balance`).transaction(currentBalance => {
        const cur = parseFloat(currentBalance) || 0;
        // Re-validate inside transaction to prevent race conditions
        if (cur !== balance) return; // abort — balance changed since preview
        if (cur <= 0) return;        // abort — nothing to withdraw
        return 0; // deduct full balance (withdrawal is of full balance)
      });

      if (!txResult.committed) {
        return res.status(409).json({
          error: 'Your balance changed during processing. Please try again.',
        });
      }
      newBalance = 0;
    } catch (e) {
      console.error('[withdraw] transaction error:', e);
      return res.status(500).json({ error: 'Database error. Please try again.' });
    }

    // ── Record withdrawal in Firebase ─────────────────────
    const withdrawalId = `wd_${uid}_${Date.now()}`;
    const entry = {
      id:          withdrawalId,
      uid,
      amount:      net,
      gross:       balance,
      fee,
      feeRate,
      method:      method || 'paypal',
      paypalEmail,
      status:      aiResult.flagged ? 'flagged' : 'pending',
      date:        new Date().toISOString(),
      plan,
      aiFlag:      aiResult.flagged ? aiResult.reason : null,
    };

    await db.ref(`withdrawals/${uid}/${withdrawalId}`).set(entry);

    // Also write to a flat admin-visible collection
    await db.ref(`admin/withdrawals/${withdrawalId}`).set(entry);

    return res.status(200).json({
      success:    true,
      amount:     net,
      gross:      balance,
      fee,
      paypalEmail,
      method:     entry.method,
      status:     entry.status,
      newBalance,
      flagged:    aiResult.flagged,
      warning:    aiResult.flagged ? aiResult.reason : null,
    });
  }

  // Unknown action
  return res.status(400).json({ error: 'Unknown action.' });
}
