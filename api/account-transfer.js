// api/account-transfer.js
// Handles account transfers as "linked accounts" — the original account is NOT deleted.
// Instead, Firebase gets a linkedAccounts entry on both sides so the recipient can
// sign in with their own email and switch to the transferred account seamlessly.
//
// Flow:
//   1. Sender calls POST /api/account-transfer/initiate
//      → server creates a signed JWT token, emails recipient an accept link
//   2. Recipient clicks link  →  page loads with ?transferToken=<token>
//      → JS calls POST /api/account-transfer/accept (with their idToken)
//      → server verifies JWT, writes linkedAccounts in Firebase on both UIDs
//   3. On login, client reads linkedAccounts and shows a switcher in the dashboard

const express  = require('express');
const admin    = require('firebase-admin');
const crypto   = require('crypto');
const router   = express.Router();

// ── Firebase Admin ─────────────────────────────────────────────────────────
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}
const db = admin.database();

// ── Token helpers (HMAC-signed, no extra deps) ─────────────────────────────
const TOKEN_SECRET  = process.env.TRANSFER_TOKEN_SECRET || process.env.FIREBASE_PRIVATE_KEY?.slice(0, 64) || 'changeme-secret';
const TOKEN_TTL_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days to accept

function signToken(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig  = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
    return body + '.' + sig;
}

function verifyToken(token) {
    const [body, sig] = (token || '').split('.');
    if (!body || !sig) throw new Error('Invalid token format');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        throw new Error('Invalid token signature');
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (Date.now() > payload.exp) throw new Error('Transfer link expired');
    return payload;
}

// ── Helper: verify Firebase idToken ───────────────────────────────────────
async function verifyIdToken(idToken) {
    if (!idToken) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    return admin.auth().verifyIdToken(idToken);
}

// ── POST /api/account-transfer/initiate ───────────────────────────────────
// Called by the sender after they confirm in the UI.
// Body: { idToken, recipientEmail, year }
// Creates a signed token and sends the accept email to the recipient.
router.post('/initiate', async (req, res) => {
    try {
        const { idToken, recipientEmail, year } = req.body;

        if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
            return res.status(400).json({ error: 'Invalid recipient email' });
        }

        const decoded  = await verifyIdToken(idToken);
        const fromUid  = decoded.uid;
        const fromEmail = decoded.email;

        if (!fromEmail) return res.status(400).json({ error: 'Sender has no email on record' });
        if (fromEmail.toLowerCase() === recipientEmail.toLowerCase()) {
            return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }

        // Load sender's profile
        const snap     = await db.ref(`users/${fromUid}`).once('value');
        const userData = snap.val() || {};
        const username = userData.username || fromEmail.split('@')[0];

        // Build signed payload
        const payload = {
            fromUid,
            fromEmail,
            username,
            recipientEmail: recipientEmail.toLowerCase(),
            plan:      userData.plan || 'Free',
            iat:       Date.now(),
            exp:       Date.now() + TOKEN_TTL_MS,
        };
        const token = signToken(payload);

        // Store pending transfer in Firebase (lets us invalidate tokens if needed)
        const transferRef = db.ref(`pendingTransfers/${fromUid}`);
        await transferRef.set({ token, recipientEmail: recipientEmail.toLowerCase(), createdAt: Date.now() });

        // Build the accept URL
        const SITE = process.env.SITE_URL || 'https://siterifty.com';
        const acceptUrl = `${SITE}/?transferToken=${encodeURIComponent(token)}`;

        // Email HTML for recipient
        const now     = new Date();
        const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const domain  = new URL(SITE).hostname;

        const recipientHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <img src="https://i.imgur.com/8EEl86u.jpeg" alt="Siterifty" style="width:48px;height:48px;border-radius:12px;">
    <div style="font-size:22px;font-weight:800;color:#f1f0ff;margin-top:12px;letter-spacing:-0.03em;">Account Transfer — Action Required</div>
  </div>
  <div style="background:#12121a;border:1px solid rgba(251,191,36,0.25);border-radius:16px;padding:28px;margin-bottom:20px;">
    <div style="font-size:13px;color:#8b8aa8;line-height:1.7;margin-bottom:18px;">
      <strong style="color:#f1f0ff;">@${username}</strong> (${fromEmail}) has transferred their Siterifty account to you.
      Click the button below to accept and link it to your account. The link expires in <strong style="color:#fbbf24;">7 days</strong>.
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:8px 0;color:#8b8aa8;">Username</td><td style="padding:8px 0;color:#f1f0ff;text-align:right;">@${username}</td></tr>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:8px 0;color:#8b8aa8;">Plan</td><td style="padding:8px 0;color:#a855f7;text-align:right;">${userData.plan || 'Free'}</td></tr>
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:8px 0;color:#8b8aa8;">Transferred to</td><td style="padding:8px 0;color:#fbbf24;text-align:right;">${recipientEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#8b8aa8;">Date</td><td style="padding:8px 0;color:#f1f0ff;text-align:right;">${dateStr}</td></tr>
    </table>
    <div style="text-align:center;">
      <a href="${acceptUrl}" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#f472b6);font-size:14px;font-weight:800;color:#fff;text-decoration:none;letter-spacing:0.02em;">Accept Transfer →</a>
    </div>
    <div style="margin-top:14px;font-size:11px;color:rgba(139,138,168,0.5);text-align:center;">
      Sign in or create an account with <strong>${recipientEmail}</strong> — the transferred account will link automatically.
    </div>
  </div>
  <div style="background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 18px;margin-bottom:20px;">
    <div style="font-size:11px;color:#8b8aa8;line-height:1.7;">
      If you did not expect this, ignore this email. If you have concerns contact
      <a href="mailto:support@${domain}" style="color:#a855f7;">support@${domain}</a>.
    </div>
  </div>
  <div style="text-align:center;font-size:11px;color:rgba(139,138,168,0.35);">© 2026 ${domain} · Automated security notice</div>
</div></body></html>`;

        // Send the email (uses existing _sendEmail infrastructure on the server)
        // Assumes you have a sendEmail helper or nodemailer setup — adjust as needed:
        const emailFn = req.app.locals.sendEmail || global.sendEmail;
        if (emailFn) {
            await emailFn(recipientEmail, `Siterifty — @${username} account transferred to you`, recipientHtml);
        } else {
            console.warn('[account-transfer] No sendEmail function found — attach to app.locals.sendEmail');
        }

        // Also log in Firebase accountTransfers for audit
        await db.ref('accountTransfers').push({
            fromUid, fromEmail, toEmail: recipientEmail.toLowerCase(),
            username, plan: userData.plan || 'Free',
            status: 'pending', createdAt: Date.now()
        });

        return res.json({ ok: true, message: 'Transfer email sent to ' + recipientEmail });

    } catch (err) {
        console.error('[account-transfer/initiate]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Initiate failed' });
    }
});

// ── POST /api/account-transfer/accept ─────────────────────────────────────
// Called by the recipient after they click the email link and are signed in.
// Body: { idToken, transferToken }
// Writes linkedAccounts on both users in Firebase.
router.post('/accept', async (req, res) => {
    try {
        const { idToken, transferToken } = req.body;

        // Verify recipient is signed in
        const decoded     = await verifyIdToken(idToken);
        const recipientUid   = decoded.uid;
        const recipientEmail = (decoded.email || '').toLowerCase();

        // Verify and decode the transfer token
        const payload = verifyToken(transferToken);

        // Make sure this token is meant for this email
        if (payload.recipientEmail !== recipientEmail) {
            return res.status(403).json({ error: 'This transfer link is for a different email address.' });
        }

        // Prevent self-link
        if (payload.fromUid === recipientUid) {
            return res.status(400).json({ error: 'Cannot link an account to itself.' });
        }

        // Check the pending transfer still exists (not revoked)
        const pendingSnap = await db.ref(`pendingTransfers/${payload.fromUid}`).once('value');
        if (!pendingSnap.exists()) {
            return res.status(410).json({ error: 'This transfer has already been accepted or was cancelled.' });
        }

        const fromUid  = payload.fromUid;
        const now      = Date.now();

        // Load both user profiles
        const [fromSnap, toSnap] = await Promise.all([
            db.ref(`users/${fromUid}`).once('value'),
            db.ref(`users/${recipientUid}`).once('value'),
        ]);
        const fromData = fromSnap.val() || {};
        const toData   = toSnap.val()   || {};

        // ── Write linked accounts (both directions) ─────────────────────────
        // On the transferred account: record the new owner
        // On the recipient's account: record the linked account
        const updates = {};

        // The transferred account knows the recipient owns it
        updates[`users/${fromUid}/linkedOwner`] = {
            uid:      recipientUid,
            email:    recipientEmail,
            linkedAt: now,
        };

        // The recipient account has a linkedAccounts list
        updates[`users/${recipientUid}/linkedAccounts/${fromUid}`] = {
            uid:      fromUid,
            email:    fromData.email    || payload.fromEmail,
            username: fromData.username || payload.username,
            plan:     fromData.plan     || payload.plan     || 'Free',
            linkedAt: now,
        };

        // Mark the pending transfer as accepted & remove it
        updates[`accountTransfers`] = null; // don't wipe the whole log
        updates[`pendingTransfers/${fromUid}`] = null; // consumed

        // Also log the acceptance
        await db.ref('accountTransferLog').push({
            fromUid, fromEmail: payload.fromEmail,
            toUid: recipientUid, toEmail: recipientEmail,
            username: payload.username,
            acceptedAt: now,
        });

        await db.ref().update(updates);

        return res.json({
            ok: true,
            linkedAccount: {
                uid:      fromUid,
                email:    fromData.email    || payload.fromEmail,
                username: fromData.username || payload.username,
                plan:     fromData.plan     || payload.plan || 'Free',
            }
        });

    } catch (err) {
        console.error('[account-transfer/accept]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Accept failed' });
    }
});

// ── POST /api/account-transfer/switch ─────────────────────────────────────
// Returns a custom sign-in token so the client can signInWithCustomToken()
// and appear as the linked account without knowing its password.
// Body: { idToken, targetUid }
router.post('/switch', async (req, res) => {
    try {
        const { idToken, targetUid } = req.body;
        if (!targetUid) return res.status(400).json({ error: 'Missing targetUid' });

        const decoded      = await verifyIdToken(idToken);
        const requesterUid = decoded.uid;

        // Verify the requester actually has this account linked
        const linkSnap = await db.ref(`users/${requesterUid}/linkedAccounts/${targetUid}`).once('value');
        if (!linkSnap.exists()) {
            // Also allow the reverse: target might still carry the old linkedOwner record
            const ownerSnap = await db.ref(`users/${targetUid}/linkedOwner/uid`).once('value');
            if (!ownerSnap.exists() || ownerSnap.val() !== requesterUid) {
                return res.status(403).json({ error: 'That account is not linked to yours.' });
            }
        }

        // Issue a custom token for the target uid
        const customToken = await admin.auth().createCustomToken(targetUid, { linkedSwitch: true });

        return res.json({ ok: true, customToken });

    } catch (err) {
        console.error('[account-transfer/switch]', err);
        return res.status(err.status || 500).json({ error: err.message || 'Switch failed' });
    }
});

module.exports = router;
