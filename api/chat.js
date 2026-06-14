// api/chat.js — Siterifty AI Assistant with live seller/buyer context
// Fetches the user's real listings and plan data from Firebase
// so the AI can answer account questions accurately without the user typing IDs.

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

// Fetch user data: plan, balance, and recent listings
async function getUserData(uid) {
  if (!uid || typeof uid !== 'string') return null;
  try {
    initFirebase();
    const db = getDatabase();
    const snap = await db.ref('users/' + uid).get();
    if (!snap.exists()) return null;

    const user = snap.val();
    
    // Fetch user's listings (up to 5 most recent)
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

// Build context string for the AI
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
Email: ${userData.email}
Total listings created: ${userData.totalListings}

${userData.listings.length > 0 ? `Recent Listings:\n${listingLines}\n` : 'No listings created yet.\n'}

Plan Features (${userData.plan}):
${planFeatures[userData.plan] || planFeatures.Free}

== IMPORTANT RULES ==
- Use this data to answer questions about their plan, balance, and listings.
- If they ask about upgrading, explain the benefits of Starter ($20/mo), Growth ($40/mo - most popular), and Pro ($50/mo - best value).
- If they have low balance, suggest topping up via PayPal (minimum $10, 3.49% + $0.49 fee).
- Never reveal the user's email or full user ID in responses.
- Always be helpful and concise — 2-4 sentences unless more detail is needed.`;
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
- Free sellers: 30% fee
- Starter: 15% fee (save 15%)
- Growth: 10% fee (save 20%)
- Pro: 5% fee (save 25%)

== BUYING A WEBSITE ==
- Browse listings, view site metrics and pricing
- Click "Buy" — funds taken from wallet or prompt to top up
- Site transferred within 48 hours after purchase confirmation
- Buyer gets: all assets, domain transfer support, optional hosting subscription

== LISTING A WEBSITE ==
- From dashboard, create listing with title, description, price, metrics (traffic, revenue, profit)
- Listings are reviewed within 24 hours
- Once approved, appears in search results
- Higher plans get priority placement and featured highlights

== FEES (for sellers) ==
- Free: 30% of sale price
- Starter: 15% of sale price
- Growth: 10% of sale price  
- Pro: 5% of sale price
Example: $1,000 sale on Pro plan → you keep $950, platform fee $50

== STATS ==
- 8,400+ sellers on the platform
- 12,000+ sites listed
- 4.9★ average rating
- Ships to 180+ countries

== CONTACT & SUPPORT ==
- Email: support@siterifty.com
- In-app chat (you!)
- Response time: within 24 hours for Free, 24h for Starter, 4h for Growth, immediate for Pro
- For urgent issues, Pro members get dedicated account manager

== BEHAVIOUR RULES ==
- Be concise. 2-4 sentences max per reply unless detailed explanation is needed.
- Never make up information not listed here.
- If asked about a feature not documented, say: "I don't have that info — please email support@siterifty.com and we'll get back to you within 24 hours."
- Be warm, professional, and helpful.
- When a customer seems frustrated, acknowledge first, then solve.
- Always use dollar amounts with $ symbol.
- If they ask about upgrading, highlight the fee savings: "On Pro you keep 95% of every sale vs 70% on Free."
- If they have wallet balance, remind them they can use it to pay for their monthly plan.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { messages, deviceId, userPlan, username } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ reply: 'Malformed request: messages array is required.' });
    }

    // Fetch user data using deviceId (which is the Firebase UID)
    const userData = await getUserData(deviceId);
    const userContext = buildUserContext(userData);
    const systemPrompt = BASE_SYSTEM_PROMPT + userContext;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Swapped to the high-limit 14k RPD model
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

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not get a response right now.';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('chat handler error:', error);
    return res.status(500).json({ reply: "Something went sideways on our end. Please drop a line to support@siterifty.com." });
  }
}
