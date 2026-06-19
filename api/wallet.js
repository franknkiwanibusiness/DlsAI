// /api/wallet.js
//
// Read-only wallet endpoint — returns the authenticated user's balance fields.
// All money movement (transfers, withdrawals, deal payments, promotions) is
// handled by /api/transfer.js.
//
// GET  /api/wallet  — returns { balance, pendingBalance, rejectedBalance }
// POST /api/wallet  — action: 'promote' only (deducts ad budget, activates listing)
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
// ── Promote constants ─────────────────────────────────────────────────────────
const MIN_CPM = 0.80;
const MAX_CPM = 8.00;
const PROMOTE_MIN_BUDGET_FLOOR = 5;
const MAX_PROMOTE_BUDGET       = 500;
function minPromoteBudgetForPrice(price) {
const p = Number(price) || 0;
let pct;
if (p < 100)        pct = null;
else if (p < 500)   pct = 5;
else if (p < 2000)  pct = 4;
else if (p < 10000) pct = 2.5;
else if (p < 50000) pct = 1.5;
else                pct = 1;
if (pct === null) return PROMOTE_MIN_BUDGET_FLOOR;
const amount = (p * pct) / 100;
return Math.min(MAX_PROMOTE_BUDGET, Math.max(PROMOTE_MIN_BUDGET_FLOOR, Math.round(amount * 100) / 100));
}
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
// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
initFirebase();
const db = getDatabase();
// ── GET: return balance fields ────────────────────────────────────────────
if (req.method === 'GET') {
const decoded = await authenticate(req, res);
if (!decoded) return;
const snap = await db.ref(`users/${decoded.uid}`).get();
const d    = snap.val() || {};
return res.status(200).json({
success:         true,
balance:         Number(d.balance         || 0),
pendingBalance:  Number(d.pendingBalance   || 0),
rejectedBalance: Number(d.rejectedBalance  || 0),
});
}
// ── POST: promote only ────────────────────────────────────────────────────
if (req.method === 'POST') {
const decoded = await authenticate(req, res);
if (!decoded) return;
const uid = decoded.uid;
const { action } = req.body || {};
if (action === 'promote') return handlePromote(req, res, db, uid);
return res.status(400).json({ success: false, error: 'Invalid action. Use /api/transfer for money movement.' });
}
res.setHeader('Allow', 'GET, POST');
return res.status(405).json({ success: false, error: 'Method not allowed' });
}
// ── ACTION: promote ───────────────────────────────────────────────────────────
// Body: { action, listingId, budget, cpm }
async function handlePromote(req, res, db, senderUid) {
const { listingId, budget, cpm } = req.body || {};
if (typeof listingId !== 'string' || !listingId)
return res.status(400).json({ success: false, error: 'Missing listingId.' });
const budgetAmt = Number(budget);
if (!isFinite(budgetAmt) || budgetAmt <= 0)
return res.status(400).json({ success: false, error: 'Enter a valid budget.' });
if (budgetAmt > MAX_PROMOTE_BUDGET)
return res.status(400).json({ success: false, error: `Maximum budget is $${MAX_PROMOTE_BUDGET}.` });
const cpmAmt = Number(cpm);
if (!isFinite(cpmAmt) || cpmAmt <= 0)
return res.status(400).json({ success: false, error: 'Invalid CPM value.' });
if (cpmAmt < MIN_CPM || cpmAmt > MAX_CPM)
return res.status(400).json({ success: false, error: `CPM must be between $${MIN_CPM.toFixed(2)} and $${MAX_CPM.toFixed(2)}.` });
// Verify listing exists and belongs to this user
const listingSnap = await db.ref(`websites/${listingId}`).get();
if (!listingSnap.exists())
return res.status(404).json({ success: false, error: 'Listing not found.' });
const listing = listingSnap.val();
if (listing.uid !== senderUid)
return res.status(403).json({ success: false, error: 'You do not own this listing.' });
const allowedStatuses = ['live', 'approved', 'active'];
if (!allowedStatuses.includes((listing.status || '').toLowerCase()))
return res.status(400).json({ success: false, error: `Listing must be approved before promoting. Current status: ${listing.status}.` });
const listingPrice = Number(listing.price) || 0;
const minBudgetAmt = minPromoteBudgetForPrice(listingPrice);
if (budgetAmt < minBudgetAmt)
return res.status(400).json({ success: false, error: `Minimum budget for this listing is $${minBudgetAmt.toFixed(2)}.` });
const budgetCents    = Math.round(budgetAmt * 100);
const estimatedViews = Math.round((budgetAmt / cpmAmt) * 1000);
// Atomically deduct from wallet
const balRef = db.ref(`users/${senderUid}/balance`);
let deductResult;
try {
deductResult = await balRef.transaction(current => {
if (current === null) return current;
let balCents = Math.round(Number(current) * 100);
if (!isFinite(balCents)) balCents = 0;
if (balCents < budgetCents) return undefined; // abort — insufficient
return (balCents - budgetCents) / 100;
});
} catch (err) {
console.error('[wallet/promote] balance transaction error', err);
return res.status(500).json({ success: false, error: 'Promotion failed. Please try again.' });
}
if (!deductResult.committed)
return res.status(400).json({ success: false, error: 'Insufficient balance.' });
const newBalance = deductResult.snapshot.val();
const now        = Date.now();
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
await db.ref(`users/${senderUid}/listings/${listingId}`).update(sponsorData);
} catch (err) {
console.error('[wallet/promote] listing update failed, rolling back', err);
await balRef.transaction(current => {
let balCents = Math.round(Number(current || 0) * 100);
if (!isFinite(balCents)) balCents = 0;
return (balCents + budgetCents) / 100;
}).catch(e2 => console.error('[wallet/promote] rollback failed', e2));
return res.status(500).json({ success: false, error: 'Promotion failed. Please try again.' });
}
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
return res.status(200).json({ success: true, newBalance, budget: budgetAmt, estimatedViews });
}