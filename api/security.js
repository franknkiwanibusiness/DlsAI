// /api/security.js
//
// Vercel serverless function: AI-assisted moderation for repeatedly-reported users.
//
// Flow:
//   1. Pull every report for a target user from Firebase RTDB ('reports' node).
//   2. Dedupe by distinct reporterUid within the last 30 days (one user spamming
//      reports about the same target does NOT count multiple times).
//   3. If distinct-reporter count >= REPORT_THRESHOLD (default 10), pull the
//      target's profile + listings from 'users/{uid}' so the AI has real context
//      (account age, verified status, sold count, listing history) instead of
//      judging on the reports alone.
//   4. Ask Groq (Llama 3.3 70B by default) to decide: no_action | warn | ban,
//      and if ban, a duration. The model is explicitly told to weigh whether
//      this looks like a coordinated brigade vs. a genuine pattern of abuse.
//   5. Short bans (<= AUTO_EXECUTE_MAX_DAYS) are written straight to Firebase.
//      Longer bans/permabans are stored as a PENDING recommendation that a
//      human admin must confirm via a separate action — the blast radius of
//      a wrong long-term ban is too high to leave fully autonomous.
//
// Required env vars (set in Vercel project settings):
//   FIREBASE_PROJECT_ID
//   FIREBASE_DATABASE_URL
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (paste with literal \n escapes; we unescape below)
//   GROQ_API_KEY
//   ADMIN_API_KEY          (shared secret this endpoint requires to be called)
//
// Call shape:
//   POST /api/security
//   { "targetUid": "abc123" }                 -> evaluate one user
//   POST /api/security?mode=approve
//   { "targetUid": "abc123", "action": "ban", "durationDays": 30 } -> confirm a pending long ban
//   POST /api/security?mode=sweep
//   {}                                         -> scan all reports, evaluate every user over threshold
//
// All requests must include header:  x-admin-key: <ADMIN_API_KEY>

import admin from 'firebase-admin';

// ── Config ───────────────────────────────────────────────────────────────
const REPORT_THRESHOLD = 10;          // distinct reporters needed to trigger review
const WINDOW_DAYS = 30;               // only count reports within this window
const AUTO_EXECUTE_MAX_DAYS = 7;      // bans <= this are applied immediately
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const ALLOWED_DURATIONS = {
  '24h': 1,
  '1d': 1,
  '3d': 3,
  '1w': 7,
  '3w': 21,
  '1m': 30,
  '1y': 365,
  'permanent': null, // null = indefinite
};

// ── Firebase admin init (reuse across invocations) ──────────────────────
function getDb() {
  if (!admin.apps.length) {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return admin.database();
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Pull all reports for a single target, dedupe by reporterUid, restrict to
 * the trailing WINDOW_DAYS window. Reports with no reporterUid are folded
 * into a single synthetic "anonymous" bucket so they can't be used to fake
 * volume, but also aren't simply discarded.
 */
async function getDistinctReportsForTarget(db, targetUid, windowDays = WINDOW_DAYS) {
  const snap = await db.ref('reports').orderByChild('targetUid').equalTo(targetUid).once('value');
  const raw = snap.val() || {};
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;

  const byReporter = new Map(); // reporterUid -> most recent report in window
  let anonymousReport = null;

  for (const [reportId, r] of Object.entries(raw)) {
    if (!r || !r.createdAt || r.createdAt < cutoff) continue;
    const reporter = r.reporterUid || null;
    const entry = { reportId, ...r };
    if (!reporter) {
      // Keep just one anonymous report in the count, regardless of how many
      // null-reporterUid reports exist, since these can't be deduped reliably.
      if (!anonymousReport || entry.createdAt > anonymousReport.createdAt) anonymousReport = entry;
      continue;
    }
    const existing = byReporter.get(reporter);
    if (!existing || entry.createdAt > existing.createdAt) byReporter.set(reporter, entry);
  }

  const distinctReports = [...byReporter.values()];
  if (anonymousReport) distinctReports.push(anonymousReport);
  return distinctReports;
}

/** Pull target profile + a light summary of their listings for AI context. */
async function getTargetContext(db, targetUid) {
  const userSnap = await db.ref('users/' + targetUid).once('value');
  const user = userSnap.val() || {};

  const listingsSnap = await db.ref('users/' + targetUid + '/listings').once('value');
  const listingsVal = listingsSnap.val() || {};
  const listings = Object.values(listingsVal);

  const soldCount = user.soldCount != null
    ? user.soldCount
    : listings.filter(l => (l.status || '').toLowerCase() === 'sold').length;

  const accountAgeDays = user.createdAt
    ? Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24))
    : null;

  return {
    uid: targetUid,
    username: user.username || null,
    bio: user.bio || user.description || null,
    verified: !!user.verified,
    soldCount,
    listingCount: listings.length,
    accountAgeDays,
    priorBans: user.banHistory ? Object.values(user.banHistory).length : 0,
    currentBanStatus: user.banStatus || null,
  };
}

/** Build the prompt and call Groq for a moderation decision. */
async function getAiDecision({ targetContext, reports }) {
  const reportSummaries = reports.map(r => ({
    reason: r.reason || 'unspecified',
    details: (r.details || '').slice(0, 500), // cap to keep prompt bounded
    daysAgo: Math.round((Date.now() - (r.createdAt || Date.now())) / (1000 * 60 * 60 * 24)),
  }));

  const systemPrompt = `You are a content moderation assistant for an online marketplace (buying/selling small websites). You are reviewing a user who has received ${reports.length} reports from distinct users within the last ${WINDOW_DAYS} days.

Your job is to decide whether this is:
(a) a genuine pattern of policy-violating behavior worth acting on, or
(b) likely a coordinated brigade / hate campaign / mass-reporting abuse where the reports themselves are not credible evidence of wrongdoing.

Weigh signals like: are report reasons varied and specific with real detail, or repetitive/vague/copy-pasted-sounding? Does the account profile (age, verified status, sold count, listing history, prior ban history) support or contradict the reports? A brand-new account with zero history and 10 nearly-identical vague reports is more likely an organized pile-on OR could indicate a scam account — use judgment, do not default to assuming brigading just because reports are similar, but also do not punish without specific credible detail.

You must respond with ONLY valid JSON, no markdown, no commentary, in this exact shape:
{
  "verdict": "no_action" | "warn" | "ban",
  "duration": "24h" | "1d" | "3d" | "1w" | "3w" | "1m" | "1y" | "permanent" | null,
  "confidence": 0.0-1.0,
  "reasoning": "2-4 sentences explaining the decision, referencing specific evidence",
  "brigade_risk": "low" | "medium" | "high"
}

Rules:
- "duration" must be null unless verdict is "ban".
- Reserve "permanent" and "1y" for severe, well-corroborated violations (e.g. credible evidence of fraud, scamming buyers, threats, doxxing) — not just volume of reports.
- If brigade_risk is "high" and reports lack specific detail, prefer "no_action" or at most "warn" even if the report count is high.
- Be conservative: it is worse to wrongly ban a legitimate seller than to under-react to a single batch of reports, since this can be escalated again later.`;

  const userPrompt = JSON.stringify({
    target_profile: targetContext,
    distinct_report_count: reports.length,
    reports: reportSummaries,
  }, null, 2);

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Groq API error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  let decision;
  try {
    decision = JSON.parse(content);
  } catch (e) {
    throw new Error('Failed to parse AI decision as JSON: ' + content);
  }

  if (!['no_action', 'warn', 'ban'].includes(decision.verdict)) {
    throw new Error('AI returned invalid verdict: ' + JSON.stringify(decision));
  }
  if (decision.verdict === 'ban' && !(decision.duration in ALLOWED_DURATIONS)) {
    throw new Error('AI returned invalid duration: ' + JSON.stringify(decision));
  }

  return decision;
}

/** Apply (or queue) the ban based on duration thresholds. */
async function applyDecision(db, targetUid, decision, reports) {
  const now = Date.now();
  const durationDays = decision.verdict === 'ban' ? ALLOWED_DURATIONS[decision.duration] : null;
  const isIndefiniteOrLong = decision.verdict === 'ban' && (durationDays === null || durationDays > AUTO_EXECUTE_MAX_DAYS);

  const recordBase = {
    verdict: decision.verdict,
    duration: decision.duration,
    durationDays,
    confidence: decision.confidence,
    reasoning: decision.reasoning,
    brigadeRisk: decision.brigade_risk,
    reportCount: reports.length,
    reportIds: reports.map(r => r.reportId),
    decidedAt: now,
    model: GROQ_MODEL,
  };

  if (decision.verdict === 'no_action') {
    await db.ref('moderationLog').push({ ...recordBase, targetUid, status: 'closed_no_action' });
    return { executed: false, pendingApproval: false, record: recordBase };
  }

  if (decision.verdict === 'warn') {
    await db.ref('users/' + targetUid + '/warnings').push({
      reason: decision.reasoning,
      createdAt: now,
      source: 'ai_security_review',
    });
    await db.ref('moderationLog').push({ ...recordBase, targetUid, status: 'warned' });
    return { executed: true, pendingApproval: false, record: recordBase };
  }

  // verdict === 'ban'
  if (isIndefiniteOrLong) {
    // Queue for human approval rather than auto-executing a long/permanent ban.
    const pendingRef = db.ref('pendingModerationActions').push();
    await pendingRef.set({ ...recordBase, targetUid, status: 'pending_admin_approval' });
    await db.ref('moderationLog').push({ ...recordBase, targetUid, status: 'pending_admin_approval', pendingId: pendingRef.key });
    return { executed: false, pendingApproval: true, pendingId: pendingRef.key, record: recordBase };
  }

  // Short ban (<= AUTO_EXECUTE_MAX_DAYS): execute immediately.
  const bannedUntil = durationDays === null ? null : now + durationDays * 24 * 60 * 60 * 1000;
  await db.ref('users/' + targetUid).update({
    banStatus: durationDays === null ? 'permanent' : 'suspended',
    bannedUntil,
    banReason: decision.reasoning,
  });
  await db.ref('users/' + targetUid + '/banHistory').push({
    ...recordBase,
    bannedUntil,
    appliedAt: now,
  });
  await db.ref('moderationLog').push({ ...recordBase, targetUid, status: 'executed', bannedUntil });

  return { executed: true, pendingApproval: false, bannedUntil, record: recordBase };
}

/** Evaluate a single target end-to-end. Returns null if under threshold. */
async function evaluateTarget(db, targetUid) {
  const reports = await getDistinctReportsForTarget(db, targetUid);
  if (reports.length < REPORT_THRESHOLD) {
    return { targetUid, reportCount: reports.length, belowThreshold: true };
  }

  const targetContext = await getTargetContext(db, targetUid);
  const decision = await getAiDecision({ targetContext, reports });
  const result = await applyDecision(db, targetUid, decision, reports);

  return {
    targetUid,
    reportCount: reports.length,
    belowThreshold: false,
    decision,
    ...result,
  };
}

// ── Appeal config ─────────────────────────────────────────────────────────────
const AUTO_UNBAN_MAX_DAYS       = 3;    // only auto-unban if original ban was this short or less
const AUTO_UNBAN_MIN_CONFIDENCE = 0.80; // AI confidence threshold required for auto-unban
const MAX_APPEALS_PER_BAN       = 3;    // max appeal submissions per ban instance
const APPEAL_COOLDOWN_MS        = 30_000; // 30s between submissions

/**
 * Ask Groq to review a ban appeal.
 * Returns { appeal_verdict, confidence, reasoning, risk_notes }
 * appeal_verdict: "approve" | "deny" | "escalate"
 */
async function reviewAppeal({ banReason, banStatus, durationDays, priorBanCount, appealMessage }) {
  const systemPrompt = `You are a moderation assistant reviewing a ban appeal on Siterifty, a marketplace for buying and selling small websites.

A user has been suspended and is appealing. Assess whether the appeal is credible and whether the ban should be lifted.

Respond ONLY with valid JSON, no markdown:
{
  "appeal_verdict": "approve" | "deny" | "escalate",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentences explaining your decision",
  "risk_notes": "any flags — e.g. vague, doesn't address the reason, seems coached"
}

Guidelines:
- "approve": Appeal directly and credibly refutes the ban reason with specific context. Only for minor/ambiguous violations.
- "deny": Vague, formulaic, doesn't address the actual reason, or violation was clearly serious.
- "escalate": Genuinely unclear, complex context, or serious violation that warrants human review regardless.
- Be skeptical of "I didn't do anything wrong" without specifics.
- More lenient for first-time users appealing short bans with genuine, specific explanations.
- A good appeal names WHAT the ban was for and specifically WHY it was wrong or mitigated.`;

  const userPrompt = JSON.stringify({
    ban_reason: banReason || 'Unspecified violation',
    ban_type: banStatus,
    ban_duration_days: durationDays,
    prior_ban_count: priorBanCount,
    appeal_message: appealMessage.slice(0, 2000),
  }, null, 2);

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    }),
  });

  if (!resp.ok) throw new Error(`Groq API error ${resp.status}: ${await resp.text().catch(() => '')}`);
  const data = await resp.json();
  try { return JSON.parse(data.choices?.[0]?.message?.content || '{}'); }
  catch(e) { throw new Error('Failed to parse AI appeal response'); }
}

// ── HTTP handler ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple shared-secret auth. This endpoint can ban accounts — never leave it open.
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const mode = (req.query?.mode || 'evaluate').toString();
  const db = getDb();

  try {
    if (mode === 'evaluate') {
      const { targetUid } = req.body || {};
      if (!targetUid) return res.status(400).json({ error: 'targetUid is required' });
      const result = await evaluateTarget(db, targetUid);
      return res.status(200).json(result);
    }

    if (mode === 'sweep') {
      // Scan all reports, group by target, evaluate everyone at/above threshold.
      const snap = await db.ref('reports').once('value');
      const raw = snap.val() || {};
      const targets = new Set(Object.values(raw).map(r => r && r.targetUid).filter(Boolean));

      const results = [];
      for (const targetUid of targets) {
        const r = await evaluateTarget(db, targetUid);
        if (!r.belowThreshold) results.push(r);
      }
      return res.status(200).json({ scanned: targets.size, actioned: results.length, results });
    }

    if (mode === 'approve') {
      // Human admin confirms a queued long-duration/permanent ban.
      const { pendingId, targetUid } = req.body || {};
      if (!pendingId || !targetUid) {
        return res.status(400).json({ error: 'pendingId and targetUid are required' });
      }
      const pendingSnap = await db.ref('pendingModerationActions/' + pendingId).once('value');
      const pending = pendingSnap.val();
      if (!pending || pending.targetUid !== targetUid) {
        return res.status(404).json({ error: 'Pending action not found' });
      }

      const now = Date.now();
      const bannedUntil = pending.durationDays === null ? null : now + pending.durationDays * 24 * 60 * 60 * 1000;
      await db.ref('users/' + targetUid).update({
        banStatus: pending.durationDays === null ? 'permanent' : 'suspended',
        bannedUntil,
        banReason: pending.reasoning,
      });
      await db.ref('users/' + targetUid + '/banHistory').push({ ...pending, bannedUntil, appliedAt: now, approvedBy: 'admin' });
      await db.ref('pendingModerationActions/' + pendingId).update({ status: 'approved_and_executed', approvedAt: now });
      await db.ref('moderationLog').push({ ...pending, targetUid, status: 'approved_and_executed', bannedUntil });

      return res.status(200).json({ executed: true, bannedUntil });
    }

    if (mode === 'reject') {
      const { pendingId } = req.body || {};
      if (!pendingId) return res.status(400).json({ error: 'pendingId is required' });
      await db.ref('pendingModerationActions/' + pendingId).update({ status: 'rejected_by_admin', rejectedAt: Date.now() });
      return res.status(200).json({ rejected: true });
    }


    // ── mode=appeal: user submitting a ban appeal ──────────────────────────
    if (mode === 'appeal') {
      // NOTE: this mode does NOT require x-admin-key — it is called directly
      // by the banned user from the frontend ban gate. Auth is purely "are you
      // actually banned?" checked against Firebase below.
      const { uid, message } = req.body || {};
      if (!uid || typeof uid !== 'string' || uid.length > 128)
        return res.status(400).json({ error: 'Invalid uid.' });
      if (!message || typeof message !== 'string' || message.trim().length < 20)
        return res.status(400).json({ error: 'Appeal message too short. Please be more specific.' });

      const trimmed = message.trim();
      const userSnap = await db.ref('users/' + uid).once('value');
      const user = userSnap.val();
      if (!user) return res.status(404).json({ error: 'User not found.' });

      const { banStatus, bannedUntil, banReason, appealCount = 0, lastAppealAt = 0 } = user;

      // Verify actually banned
      const isBanned =
        banStatus === 'permanent' ||
        (banStatus === 'suspended' && (!bannedUntil || Date.now() < bannedUntil));
      if (!isBanned) return res.status(400).json({ error: 'This account is not currently suspended.' });

      // Rate limits
      if (appealCount >= MAX_APPEALS_PER_BAN)
        return res.status(429).json({ error: `Maximum of ${MAX_APPEALS_PER_BAN} appeals reached for this ban. Contact support if you believe there is a special circumstance.` });
      if (Date.now() - lastAppealAt < APPEAL_COOLDOWN_MS) {
        const secsLeft = Math.ceil((APPEAL_COOLDOWN_MS - (Date.now() - lastAppealAt)) / 1000);
        return res.status(429).json({ error: `Please wait ${secsLeft} seconds before submitting another appeal.` });
      }

      // Determine original ban duration from banHistory for auto-unban eligibility
      const banHistory = user.banHistory ? Object.values(user.banHistory) : [];
      const latestBan  = banHistory.sort((a, b) => (b.appliedAt || 0) - (a.appliedAt || 0))[0];
      const durationDays = latestBan ? (latestBan.durationDays ?? null) : null;
      const priorBanCount = Math.max(0, banHistory.length - 1); // exclude the current ban

      // Increment appeal counter before AI call to prevent concurrent spam
      await db.ref('users/' + uid).update({ appealCount: appealCount + 1, lastAppealAt: Date.now() });

      // AI review
      const review = await reviewAppeal({ banReason, banStatus, durationDays, priorBanCount, appealMessage: trimmed });

      const now = Date.now();
      const eligibleForAutoUnban =
        banStatus !== 'permanent' &&
        durationDays !== null &&
        durationDays <= AUTO_UNBAN_MAX_DAYS &&
        priorBanCount === 0 &&
        review.appeal_verdict === 'approve' &&
        (review.confidence || 0) >= AUTO_UNBAN_MIN_CONFIDENCE;

      const appealRecord = {
        uid, message: trimmed, banReason: banReason || null,
        banStatus, bannedUntil: bannedUntil || null, durationDays, priorBanCount,
        aiVerdict: review.appeal_verdict, aiConfidence: review.confidence,
        aiReasoning: review.reasoning, aiRiskNotes: review.risk_notes || null,
        autoUnbanned: eligibleForAutoUnban, submittedAt: now,
      };

      if (eligibleForAutoUnban) {
        await db.ref('users/' + uid).update({ banStatus: null, bannedUntil: null, banReason: null, appealCount: 0 });
        await db.ref('appeals').push({ ...appealRecord, status: 'auto_approved_and_unbanned' });
        await db.ref('moderationLog').push({ ...appealRecord, type: 'appeal', status: 'auto_approved_and_unbanned' });
        return res.status(200).json({ unbanned: true, reasoning: review.reasoning });
      }

      const appealRef = db.ref('pendingAppeals').push();
      await appealRef.set({ ...appealRecord, status: 'pending_human_review' });
      await db.ref('appeals').push({ ...appealRecord, status: 'pending_human_review', pendingId: appealRef.key });
      await db.ref('moderationLog').push({ ...appealRecord, type: 'appeal', status: 'queued_for_review', pendingId: appealRef.key });
      return res.status(200).json({ queued: true, appealId: appealRef.key });
    }

    // ── mode=accounts: account invite & managed-account system ───────────────
    // Auth: Firebase ID token in Authorization: Bearer header (not x-admin-key)
    if (mode === 'accounts') {
      const authHeader = req.headers['authorization'] || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!idToken) return res.status(401).json({ error: 'Missing Bearer token.' });

      let caller;
      try { caller = await admin.auth().verifyIdToken(idToken); }
      catch(e) { return res.status(401).json({ error: 'Invalid or expired token.' }); }

      const { action, inviteeEmail, role, ownerUid } = req.body || {};

      // helper: sanitise email into a Firebase-safe key
      function emailKey(email) {
        return (email || '').toLowerCase().trim().replace(/[.#$[\]]/g, '_');
      }

      // ── invite ────────────────────────────────────────────────────────────
      if (action === 'invite') {
        if (!inviteeEmail || !inviteeEmail.includes('@'))
          return res.status(400).json({ error: 'Valid inviteeEmail required.' });
        if (inviteeEmail.toLowerCase() === (caller.email || '').toLowerCase())
          return res.status(400).json({ error: 'Cannot invite yourself.' });

        const r   = role === 'editor' ? 'editor' : 'viewer';
        const key = emailKey(inviteeEmail);

        // Fetch owner's display name from their profile
        const ownerSnap = await db.ref('users/' + caller.uid).once('value');
        const ownerData = ownerSnap.val() || {};
        const ownerName = ownerData.username || caller.email || 'Someone';

        const payload = {
          ownerUid:     caller.uid,
          ownerEmail:   caller.email || '',
          ownerName,
          inviteeEmail: inviteeEmail.toLowerCase(),
          role:         r,
          status:       'pending',
          invitedAt:    Date.now(),
        };

        await Promise.all([
          db.ref('pendingInvites/' + key).set(payload),
          db.ref('users/' + caller.uid + '/teamMembers/' + key).update({
            email: inviteeEmail.toLowerCase(), role: r, status: 'pending', invitedAt: Date.now(),
          }),
        ]);
        return res.status(200).json({ ok: true, message: 'Invite sent to ' + inviteeEmail });
      }

      // ── revoke ────────────────────────────────────────────────────────────
      if (action === 'revoke') {
        if (!inviteeEmail) return res.status(400).json({ error: 'inviteeEmail required.' });
        const key = emailKey(inviteeEmail);
        const ops = [
          db.ref('pendingInvites/' + key).remove(),
          db.ref('users/' + caller.uid + '/teamMembers/' + key).remove(),
        ];
        // Best-effort: also remove from invitee's managedAccounts if they've already accepted
        try {
          const inviteeRecord = await admin.auth().getUserByEmail(inviteeEmail.toLowerCase());
          if (inviteeRecord) {
            ops.push(db.ref('users/' + inviteeRecord.uid + '/managedAccounts/' + caller.uid).remove());
          }
        } catch(_) {}
        await Promise.all(ops);
        return res.status(200).json({ ok: true, message: 'Member removed.' });
      }

      // ── accept ────────────────────────────────────────────────────────────
      if (action === 'accept') {
        if (!ownerUid) return res.status(400).json({ error: 'ownerUid required.' });
        const key     = emailKey(caller.email || '');
        const invSnap = await db.ref('pendingInvites/' + key).once('value');
        const inv     = invSnap.val();
        if (!inv || inv.status !== 'pending')
          return res.status(404).json({ error: 'No pending invite found.' });
        if (inv.ownerUid !== ownerUid)
          return res.status(403).json({ error: 'Invite owner mismatch.' });

        await Promise.all([
          db.ref('users/' + caller.uid + '/managedAccounts/' + ownerUid).set({
            ownerUid,
            ownerEmail:  inv.ownerEmail,
            ownerName:   inv.ownerName || inv.ownerEmail,
            role:        inv.role || 'viewer',
            acceptedAt:  Date.now(),
          }),
          db.ref('pendingInvites/' + key).update({ status: 'accepted', acceptedAt: Date.now() }),
          db.ref('users/' + ownerUid + '/teamMembers/' + key).update({ status: 'active', acceptedAt: Date.now() }),
        ]);
        return res.status(200).json({ ok: true, ownerName: inv.ownerName || inv.ownerEmail, role: inv.role || 'viewer' });
      }

      // ── reject ────────────────────────────────────────────────────────────
      if (action === 'reject') {
        const key = emailKey(caller.email || '');
        await db.ref('pendingInvites/' + key).update({ status: 'rejected', rejectedAt: Date.now() });
        if (ownerUid) {
          await db.ref('users/' + ownerUid + '/teamMembers/' + key).update({ status: 'rejected' });
        }
        return res.status(200).json({ ok: true, message: 'Invite declined.' });
      }

      // ── leave (member exits a managed account) ────────────────────────────
      if (action === 'leave') {
        if (!ownerUid) return res.status(400).json({ error: 'ownerUid required.' });
        const key = emailKey(caller.email || '');
        await Promise.all([
          db.ref('users/' + caller.uid + '/managedAccounts/' + ownerUid).remove(),
          db.ref('users/' + ownerUid + '/teamMembers/' + key).remove(),
          db.ref('pendingInvites/' + key).remove(),
        ]);
        return res.status(200).json({ ok: true, message: 'Left managed account.' });
      }

      // ── list_managed ──────────────────────────────────────────────────────
      if (action === 'list_managed') {
        const snap = await db.ref('users/' + caller.uid + '/managedAccounts').once('value');
        return res.status(200).json({ ok: true, accounts: snap.val() || {} });
      }

      // ── list_members ──────────────────────────────────────────────────────
      if (action === 'list_members') {
        const snap = await db.ref('users/' + caller.uid + '/teamMembers').once('value');
        return res.status(200).json({ ok: true, members: snap.val() || {} });
      }

      return res.status(400).json({ error: 'Unknown accounts action: ' + action });
    }

    return res.status(400).json({ error: 'Unknown mode: ' + mode });
  } catch (err) {
    console.error('[api/security]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
