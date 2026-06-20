// api/chat.js — Siterifty AI Assistant with live seller/buyer context
// Fetches the user's real listings and plan data from Firebase
// so the AI can answer account questions accurately without the user typing IDs.
//
// AUTOSELL CHANGE: Added _systemOverride field support.
// When AutoSell sends a chat request it passes _systemOverride in the body —
// a fully built sales system prompt. When present, it REPLACES the BASE_SYSTEM_PROMPT
// (but still appends live user/account context so the AI knows seller's plan, listings etc.)

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

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

async function getUserData(uid) {
  if (!uid || typeof uid !== 'string') return null;
  try {
    initFirebase();
    const db = getDatabase();
    const snap = await db.ref('users/' + uid).get();
    if (!snap.exists()) return null;

    const user = snap.val();
    
    const listingsSnap = await db.ref('listings/' + uid).get();
    let listings = [];
    if (listingsSnap.exists()) {
      const entries = Object.values(listingsSnap.val() || {});
      entries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      listings = entries.slice(0, 5).map(l => ({
        title: l.title || 'Untitled',
        price: l.price || 0,
        status: l.status || 'draft',
        views: l.views || 0,
        createdAt: l.createdAt
      }));
    }

    return {
      plan: user.plan || 'Free',
      balance: user.balance || 0,
      username: user.username || 'there',
      email: user.email || '',
      listings: listings,
      totalListings: listingsSnap.exists() ? Object.keys(listingsSnap.val() || {}).length : 0
    };
  } catch(e) {
    console.warn('User data fetch error:', e);
    return null;
  }
}

function buildUserContext(userData) {
  if (!userData) return '';

  const listingLines = userData.listings.map(l => {
    const date = l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-GB') : 'recently';
    return `• "${l.title}" — $${l.price} — ${l.status} — ${l.views} views (listed ${date})`;
  }).join('\n');

  const planFeatures = {
    Free: '1 listing/day, 5/month cap, 30% platform fee, community support',
    Starter: '5 listings/day, 150/month, 15% fee, priority search, email support (24h), basic analytics',
    Growth: '15 listings/day, unlimited monthly, 10% fee, featured highlights, priority support (4h), advanced analytics, bulk management',
    Pro: 'Unlimited daily, unlimited monthly, 5% fee, top search placement, dedicated account manager, 24/7 live chat, custom storefront'
  };

  return `
== THIS SELLER'S ACCOUNT DATA ==
Plan: ${userData.plan}
Wallet Balance: $${userData.balance.toFixed(2)}
Username: ${userData.username}
Total listings created: ${userData.totalListings}

${userData.listings.length > 0 ? `Recent Listings:\n${listingLines}\n` : 'No listings created yet.\n'}

Plan Features (${userData.plan}):
${planFeatures[userData.plan] || planFeatures.Free}`;
}

const BASE_SYSTEM_PROMPT = `You are the Siterifty assistant — a friendly, knowledgeable support agent for Siterifty.com, a premium marketplace to buy and sell websites and digital businesses.

== PLATFORM OVERVIEW ==
Siterifty connects website sellers with buyers. Sellers list their sites, buyers purchase via secure escrow, and funds go to the seller's wallet.

== SELLER PLANS ==
- Free: $0/mo — 1 listing/day, 5/month cap, 30% platform fee, community support
- Starter: $20/mo — 5 listings/day, 150/month, 15% fee, priority search, email support (24h), basic analytics
- Growth: $40/mo — 15 listings/day, unlimited monthly, 10% fee, featured highlights, priority support (4h), advanced analytics, bulk management
- Pro: $50/mo — Unlimited everything, 5% fee, top search placement, dedicated account manager, 24/7 live chat, custom storefront

Upgrade anytime from the dashboard. Plans are monthly, cancel anytime.

== WALLET & PAYMENTS ==
- Wallet balance can be used for: buying websites, paying your monthly plan, paying hosting fees
- Top up via PayPal: minimum $10, one-time payment (not recurring)
- PayPal fee: 3.49% + $0.49 per transaction (shown before you pay)
- Wallet balance is non-refundable store credit — cannot be withdrawn to bank/PayPal
- Balance never expires

== HOSTING FOR BUYERS ==
- When a buyer purchases your site, they can subscribe to managed hosting: $49.99/month
- Includes: database, serverless functions, admin dashboard
- You earn the sale, they get infrastructure to run their new site

== ESCROW & TRANSACTIONS ==
- All site sales use secure escrow
- Buyer pays → funds held → site transferred → buyer confirms → funds released to seller's wallet
- Platform fee deducted from sale amount based on seller's plan

== FEES (for sellers) ==
- Free: 30% of sale price
- Starter: 15% of sale price
- Growth: 10% of sale price  
- Pro: 5% of sale price

== STATS ==
- 8,400+ sellers on the platform
- 12,000+ sites listed
- 4.9★ average rating
- Ships to 180+ countries

== CONTACT & SUPPORT ==
- Email: support@siterifty.com
- In-app chat (you!)
- Response time: within 24 hours for Free, 24h for Starter, 4h for Growth, immediate for Pro

== BEHAVIOUR RULES ==
- Be concise. 2-4 sentences max per reply unless detailed explanation is needed.
- Never make up information not listed here.
- If asked about a feature not documented, say: "I don't have that info — please email support@siterifty.com and we'll get back to you within 24 hours."
- Be warm, professional, and helpful.
- When a customer seems frustrated, acknowledge first, then solve.
- Always use dollar amounts with $ symbol.`;

// ── Batch moderation system ─────────────────────────────────────────────
// Messages are sent immediately (no pre-send blocking). Every chat message
// is written to Firebase with `moderated:false`. This handler is triggered
// by the client at most once per 60s (gated via meta/lastModerationRun) and
// scans the WHOLE database for unmoderated messages, batches up to 30 of
// them into a SINGLE Groq call (so we never burn more than 1 request per
// run regardless of how many messages are pending), marks each reviewed
// message moderated:true so the AI never re-reads it, deletes any flagged
// as unsafe from both inbox copies, and applies warnings/strikes/bans.
//
// Strike ladder (reuses existing ban gate fields on users/{uid}):
//   Unsafe #1, #2, #3  -> warnings++ (no lockout, yellow toast only)
//   Unsafe #4          -> strikes=1 -> banStatus:'suspended', bannedUntil:+1h
//   Unsafe #5          -> strikes=2 -> bannedUntil:+5h
//   Unsafe #6          -> strikes=3 -> bannedUntil:+12h
//   Unsafe #7          -> strikes=4 -> banStatus:'permanent', no bannedUntil
//
// POST body: { _action: 'runModeration' }
// Returns:   { ran: true, reviewed: N, flagged: N } or { ran: false, reason }

const MODERATION_BATCH_SIZE = 30;
const MODERATION_INTERVAL_MS = 60 * 1000;
const STRIKE_BAN_HOURS = [1, 5, 12]; // strike 1, 2, 3 — strike 4 is permanent

const MODERATION_SYSTEM_PROMPT = `You are a content moderation classifier for Siterifty, a marketplace for buying/selling websites.
You will receive a numbered list of chat messages. For EACH message, decide if it violates platform rules.
Flag a message as UNSAFE if it contains:
- Sexual content, sexual solicitation, or explicit material
- Scam attempts: requests for payment outside the platform, fake deals, phishing, requests for passwords/2FA codes/login credentials
- Attempts to move the conversation off-platform (sharing phone numbers, WhatsApp, Telegram, email specifically to bypass escrow/fees)
- Threats, harassment, or hate speech

Otherwise mark it SAFE. Respond ONLY with a JSON array, no other text, no markdown fences. Each element:
{"i": <message number>, "safe": true|false, "reason": "<short reason if unsafe, omit if safe>"}`;

async function runBatchModeration() {
  initFirebase();
  const db = getDatabase();

  // ── 60s gate — only one run allowed per interval, checked atomically ──
  const lastRunRef = db.ref('meta/lastModerationRun');
  const gate = await lastRunRef.transaction(current => {
    const now = Date.now();
    if (current && now - current < MODERATION_INTERVAL_MS) return; // abort, too soon
    return now;
  });
  if (!gate.committed) {
    return { ran: false, reason: 'cooldown' };
  }

  // ── Collect unmoderated messages across the whole DB ──
  // Messages live at users/{uid}/inbox/{key} (written twice, once per
  // participant, sharing the same key).
  const pending = []; // { key, message, fromUid, paths: [...] }

  const usersSnap = await db.ref('users').get();
  if (usersSnap.exists()) {
    const users = usersSnap.val();
    outer:
    for (const uid of Object.keys(users)) {
      const inbox = users[uid]?.inbox;
      if (!inbox) continue;
      for (const key of Object.keys(inbox)) {
        const msg = inbox[key];
        if (!msg || msg.moderated) continue;
        if (typeof msg.message !== 'string' || !msg.message.trim()) continue;
        // Dedup: this same key exists under both fromUid and toUid inboxes.
        let entry = pending.find(p => p.key === key);
        if (!entry) {
          entry = { key, message: msg.message, fromUid: msg.fromUid, paths: [] };
          pending.push(entry);
        }
        entry.paths.push(`users/${uid}/inbox/${key}`);
        if (pending.length >= MODERATION_BATCH_SIZE) break outer;
      }
    }
  }

  if (pending.length === 0) {
    return { ran: true, reviewed: 0, flagged: 0 };
  }

  const batch = pending.slice(0, MODERATION_BATCH_SIZE);

  // ── Single Groq call covering the whole batch ──
  const listText = batch.map((m, i) => `${i + 1}. ${m.message.slice(0, 500)}`).join('\n');
  let results = [];
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 2048,
        temperature: 0,
        messages: [
          { role: 'system', content: MODERATION_SYSTEM_PROMPT },
          { role: 'user', content: listText }
        ]
      })
    });

    if (!response.ok) {
      console.error('[runBatchModeration] Groq error:', await response.text());
      return { ran: false, reason: 'groq_error' };
    }

    const data = await response.json();
    const raw = (data.choices?.[0]?.message?.content || '').trim()
      .replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    results = JSON.parse(raw);
  } catch (e) {
    console.error('[runBatchModeration] parse/fetch error:', e);
    // Fail open — mark batch moderated as safe rather than leaving it stuck
    // re-querying forever; an admin can still review via the admin panel.
    results = batch.map((_, i) => ({ i: i + 1, safe: true }));
  }

  const resultByIndex = {};
  for (const r of results) resultByIndex[r.i] = r;

  const dbUpdates = {};
  let flaggedCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const entry = batch[i];
    const verdict = resultByIndex[i + 1] || { safe: true };

    if (verdict.safe) {
      for (const path of entry.paths) {
        dbUpdates[path + '/moderated'] = true;
        dbUpdates[path + '/safe'] = true;
      }
    } else {
      flaggedCount++;
      // Delete both copies of the flagged message entirely.
      for (const path of entry.paths) {
        dbUpdates[path] = null;
      }
      await applyStrike(db, entry.fromUid, verdict.reason || 'Violation of community guidelines.');
    }
  }

  if (Object.keys(dbUpdates).length > 0) {
    await db.ref('/').update(dbUpdates);
  }

  return { ran: true, reviewed: batch.length, flagged: flaggedCount };
}

// ── Apply a warning or strike to a user after a flagged message ──────────
async function applyStrike(db, uid, reason) {
  if (!uid) return;
  const userRef = db.ref('users/' + uid);

  await userRef.transaction(user => {
    if (!user) return user;
    const warnings = (user.warnings || 0);
    const strikes  = (user.strikes || 0);

    if (warnings < 3) {
      // Still in the warning phase — no ban yet.
      user.warnings = warnings + 1;
      user.lastModerationReason = reason;
    } else {
      // Warnings exhausted — escalate to a strike/ban.
      const newStrikeCount = strikes + 1;
      user.strikes = newStrikeCount;
      user.lastModerationReason = reason;

      if (newStrikeCount <= STRIKE_BAN_HOURS.length) {
        const hours = STRIKE_BAN_HOURS[newStrikeCount - 1];
        user.banStatus = 'suspended';
        user.bannedUntil = Date.now() + hours * 60 * 60 * 1000;
        user.banReason = reason;
      } else {
        // Strike 4+ — permanent, no bannedUntil.
        user.banStatus = 'permanent';
        user.bannedUntil = null;
        user.banReason = reason;
      }
    }
    return user;
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { messages, deviceId, _systemOverride, _action } = req.body;

    // ── Batch moderation route — triggered by the client at most once/60s ──
    if (_action === 'runModeration') {
      const result = await runBatchModeration();
      return res.status(200).json(result);
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: 'Malformed request: messages array is required.' });
    }

    // Fetch seller/user account data (works for both support chat and AutoSell)
    const userData    = await getUserData(deviceId);
    const userContext = buildUserContext(userData);

    // AutoSell passes _systemOverride — use that as the base instead of support prompt.
    // Still append live account context so AI knows the seller's plan, listings etc.
    const systemPrompt = _systemOverride
      ? _systemOverride + '\n' + userContext
      : BASE_SYSTEM_PROMPT + userContext;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1024,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', errText);
      return res.status(500).json({ reply: "Sorry, I'm having trouble connecting right now. Please email support@siterifty.com for help." });
    }

    const data  = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not get a response right now.';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('chat handler error:', error);
    return res.status(500).json({ reply: "Something went sideways on our end. Please drop a line to support@siterifty.com." });
  }
}
