// Siterifty — /api/settings.js
// Handles: push-subscribe, push-notify, send-email, newsletter-subscribe, notify-event, delete_account
// Deploy to: https://siterifty.com/api/settings.js
//
// Required env vars:
//   VAPID_PRIVATE_KEY     — VAPID private key (public key is hardcoded to match frontend)
//   RESEND_API_KEY        — from resend.com (donate/payment emails only)
//   FIREBASE_PROJECT_ID   — Firebase project ID
//   FIREBASE_DATABASE_URL — Realtime Database URL
//   FIREBASE_CLIENT_EMAIL — Firebase Admin service account email
//   FIREBASE_PRIVATE_KEY  — Firebase Admin private key

import webpush from 'web-push';
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

const VAPID_PUBLIC_KEY  = 'BMTBoZaETNkmPu3gl42TbHyU9CH6tRTS9_TBGB2-oor3nSvt5WhJyk1PcmOiOLIt5z5xRterBfR2xlY2Ubyq1Do';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL       = process.env.VAPID_EMAIL || 'mailto:admin@siterifty.com';
const RESEND_API_KEY    = process.env.RESEND_API_KEY;

if (VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ─────────────────────────────────────────────
// In-memory push subscription store.
// Replace with Firebase Admin / your DB in production
// so subscriptions survive server restarts.
// ─────────────────────────────────────────────
const _subscriptions = new Map(); // deviceId → subscription object

export default async function handler(req, res) {
    // CORS — allow your domain only in production
    res.setHeader('Access-Control-Allow-Origin', 'https://siterifty.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { action } = body;

    // ── delete_account requires Firebase Admin auth ───────────────
    if (action === 'delete_account') {
        const authHeader = req.headers.authorization || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!idToken) return res.status(401).json({ error: 'Missing Authorization header' });
        initFirebase();
        let decoded;
        try { decoded = await getAuth().verifyIdToken(idToken); }
        catch { return res.status(401).json({ error: 'Invalid or expired session.' }); }
        return handleDeleteAccount(req, res, decoded.uid);
    }

    // ── 1. Push subscribe ─────────────────────────────────────────
    if (action === 'push-subscribe') {
        const { subscription, deviceId, metadata } = body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Missing subscription' });
        }
        const id = deviceId || (metadata?.uid || 'anon') + '_' + Date.now();
        // Keep in-memory map as before
        _subscriptions.set(id, { subscription, metadata: metadata || {}, savedAt: Date.now() });
        // Also persist to Firebase so push-notify can look it up by uid even after server restart
        const uid = metadata?.uid;
        if (uid) {
            try {
                initFirebase();
                const db = getDatabase();
                await Promise.all([
                    db.ref(`pushSubscriptions/${id}`).set({ subscription, uid, savedAt: Date.now() }),
                    db.ref(`users/${uid}/pushSubscription`).set(subscription),
                ]);
            } catch (e) {
                console.warn('[settings] push-subscribe firebase save failed:', e.message);
            }
        }
        console.log('[settings] push-subscribe:', id, uid);
        return res.status(200).json({ ok: true, deviceId: id });
    }

    // ── 1b. Push notify — called by sender client on every send action ────
    // Looks up recipient's push subscription from Firebase and fires real Web Push.
    // Also writes to users/{recipientUid}/pendingPush as in-tab fallback.
    if (action === 'push-notify') {
        const authHeader = req.headers.authorization || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!idToken) return res.status(401).json({ error: 'Missing Authorization header' });

        initFirebase();
        try { await getAuth().verifyIdToken(idToken); }
        catch { return res.status(401).json({ error: 'Invalid or expired session.' }); }

        const { recipientUid, type, title, body: notifBody } = body;
        if (!recipientUid) return res.status(400).json({ error: 'Missing recipientUid' });

        const db = getDatabase();

        // Write pendingPush entry — picked up instantly by recipient's open tab via onValue
        await db.ref(`users/${recipientUid}/pendingPush`).push({
            type:      type || 'message',
            title:     title || 'Siterifty',
            body:      notifBody || '',
            timestamp: Date.now(),
        }).catch(e => console.warn('[push-notify] pendingPush write failed:', e.message));

        // Send real Web Push to recipient's stored subscription (works with tab closed / phone locked)
        if (!VAPID_PRIVATE_KEY) {
            return res.status(200).json({ ok: true, pushed: false, reason: 'VAPID_PRIVATE_KEY not set' });
        }

        const subSnap = await db.ref(`users/${recipientUid}/pushSubscription`).get().catch(() => null);
        if (!subSnap || !subSnap.exists()) {
            return res.status(200).json({ ok: true, pushed: false, reason: 'No subscription for user' });
        }

        const subscription = subSnap.val();
        const payload = JSON.stringify({
            title: title || 'Siterifty',
            body:  notifBody || '',
            icon:  'https://i.imgur.com/8EEl86u.jpeg',
            type:  type || 'message',
        });

        try {
            await webpush.sendNotification(subscription, payload);
            return res.status(200).json({ ok: true, pushed: true });
        } catch (e) {
            // 410/404 = subscription expired — remove it so we don't keep trying
            if (e.statusCode === 410 || e.statusCode === 404) {
                await db.ref(`users/${recipientUid}/pushSubscription`).remove().catch(() => {});
            }
            console.warn('[push-notify] webpush failed:', e.statusCode, e.message);
            return res.status(200).json({ ok: true, pushed: false, reason: e.message });
        }
    }

    // ── 2. Send email (notif toggle confirmation) ─────────────────
    if (action === 'send-email') {
        const { to, subject, html } = body;
        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Missing to/subject/html' });
        }
        if (!RESEND_API_KEY) {
            console.warn('[settings] RESEND_API_KEY not set — skipping email');
            return res.status(200).json({ ok: true, skipped: true });
        }
        try {
            const r = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + RESEND_API_KEY
                },
                body: JSON.stringify({
                    from: 'Siterifty <no-reply@siterifty.com>',
                    to:   [to],
                    subject,
                    html
                })
            });
            if (!r.ok) {
                const err = await r.text();
                console.error('[settings] Resend error:', err);
                return res.status(502).json({ error: 'Email send failed', detail: err });
            }
            const data = await r.json();
            return res.status(200).json({ ok: true, id: data.id });
        } catch (e) {
            console.error('[settings] send-email exception:', e);
            return res.status(500).json({ error: e.message });
        }
    }

    // ── 3. Newsletter subscribe ───────────────────────────────────
    if (action === 'newsletter-subscribe') {
        const { email } = body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        // TODO: add to your mailing list provider (Resend Audiences, Mailchimp, etc.)
        // Example with Resend Audiences:
        // await fetch('https://api.resend.com/audiences/{AUDIENCE_ID}/contacts', {
        //     method: 'POST',
        //     headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email, unsubscribed: false })
        // });
        console.log('[settings] newsletter-subscribe:', email);
        return res.status(200).json({ ok: true });
    }

    // ── 4. Internal notify event (listing views, plan changes, etc.) ──
    if (action === 'notify-event' || action === 'listing-view' || action === 'plan-change') {
        const { uid, plan, email, eventType, listing } = body;
        // Log internally — extend this to trigger push to relevant subscribers
        console.log('[settings] notify-event:', { action, uid, plan, eventType });

        // Example: send a push to a specific user's subscriptions
        // const userSubs = [..._subscriptions.values()].filter(s => s.metadata?.uid === uid);
        // for (const { subscription } of userSubs) {
        //     await webpush.sendNotification(subscription, JSON.stringify({
        //         title: 'Siterifty',
        //         body: `New ${eventType} on your listing`,
        //         url: '/dashboard'
        //     })).catch(() => {});
        // }

        return res.status(200).json({ ok: true });
    }

    // ── 5. Broadcast push to all subscribers (admin use) ─────────
    if (action === 'broadcast') {
        const { title, body: msgBody, url } = body;
        if (!title || !msgBody) return res.status(400).json({ error: 'Missing title/body' });
        const payload = JSON.stringify({
            title,
            body:  msgBody,
            icon:  'https://i.imgur.com/8EEl86u.jpeg',
            url:   url || 'https://siterifty.com'
        });
        let sent = 0, failed = 0;
        for (const [id, { subscription }] of _subscriptions) {
            try {
                await webpush.sendNotification(subscription, payload);
                sent++;
            } catch (e) {
                console.warn('[settings] broadcast failed for', id, e.statusCode);
                if (e.statusCode === 410 || e.statusCode === 404) {
                    _subscriptions.delete(id); // expired — clean up
                }
                failed++;
            }
        }
        return res.status(200).json({ ok: true, sent, failed });
    }

    // ── 6. Transfer account ───────────────────────────────────────
    if (action === 'transfer_account') {
        const authHeader = req.headers.authorization || '';
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!idToken) return res.status(401).json({ error: 'Missing Authorization header' });

        initFirebase();
        const auth = getAuth();
        const db   = getDatabase();

        // Verify the caller's session
        let decoded;
        try { decoded = await auth.verifyIdToken(idToken); }
        catch { return res.status(401).json({ error: 'Invalid or expired session.' }); }

        const fromUid = decoded.uid;
        const { recipientEmail, accountYear, username, plan } = body;

        if (!recipientEmail || !recipientEmail.includes('@')) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Password was verified client-side via Firebase re-auth before getIdToken(true).
        // The fresh ID token is proof — no server-side password check needed.

        // Make sure recipient email differs from caller's
        if (recipientEmail.toLowerCase() === decoded.email.toLowerCase()) {
            return res.status(400).json({ error: 'Recipient must be different from your account email.' });
        }

        // Check for balance or open escrow (same guards as delete_account)
        const userSnap  = await db.ref(`users/${fromUid}`).get();
        const userData  = userSnap.val() || {};
        const balance   = parseFloat(userData.balance || 0);
        if (balance > 0.01) {
            return res.status(400).json({ error: `You have a wallet balance of $${balance.toFixed(2)}. Please withdraw before transferring.` });
        }
        const escrowSnap  = await db.ref(`users/${fromUid}/escrow`).get();
        const openOrders  = Object.values(escrowSnap.val() || {}).filter(o => o && o.status === 'pending');
        if (openOrders.length > 0) {
            return res.status(400).json({ error: 'You have open escrow orders. Please resolve them before transferring.' });
        }

        const siteDomain   = 'siterifty.com';
        const safeUsername = username || decoded.email.split('@')[0];
        const safePlan     = plan     || 'Free';
        const now     = new Date();
        const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

        // Email to recipient
        const recipientHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://i.imgur.com/8EEl86u.jpeg" alt="Siterifty" style="width:48px;height:48px;border-radius:12px;"><div style="font-size:22px;font-weight:800;color:#f1f0ff;margin-top:12px;letter-spacing:-0.03em;">Account Transfer Notice</div></div><div style="background:#12121a;border:1px solid rgba(251,191,36,0.2);border-radius:16px;padding:28px;margin-bottom:24px;"><div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:14px;margin-bottom:20px;"><div style="font-size:13px;font-weight:700;color:#fbbf24;margin-bottom:4px;">Account Transfer Initiated</div><div style="font-size:12px;color:rgba(251,191,36,0.7);line-height:1.6;">The Siterifty account <strong style="color:#fbbf24;">@${safeUsername}</strong> has been transferred to your email address.</div></div><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0;color:#8b8aa8;">From account</td><td style="padding:8px 0;color:#f1f0ff;text-align:right;">${decoded.email}</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0;color:#8b8aa8;">To (you)</td><td style="padding:8px 0;color:#fbbf24;text-align:right;">${recipientEmail}</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0;color:#8b8aa8;">Username</td><td style="padding:8px 0;color:#f1f0ff;text-align:right;">@${safeUsername}</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0;color:#8b8aa8;">Plan transferred</td><td style="padding:8px 0;color:#a855f7;text-align:right;">${safePlan}</td></tr><tr><td style="padding:8px 0;color:#8b8aa8;">Date &amp; time</td><td style="padding:8px 0;color:#f1f0ff;text-align:right;">${dateStr} · ${timeStr}</td></tr></table></div><div style="background:#12121a;border:1px solid rgba(255,255,255,0.13);border-radius:16px;padding:20px;margin-bottom:24px;"><div style="font-size:12px;color:#8b8aa8;line-height:1.7;">You now have full ownership of this account. Sign in to Siterifty with your email address to access the transferred account. If you did not expect this transfer, contact <a href="mailto:support@${siteDomain}" style="color:#a855f7;">support@${siteDomain}</a> immediately.</div></div><div style="text-align:center;font-size:11px;color:rgba(139,138,168,0.4);">© 2026 ${siteDomain} · Automated security notice · AES-256 encrypted audit log retained</div></div></body></html>`;

        // Email to original owner
        const ownerHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;"><div style="max-width:520px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:32px;"><img src="https://i.imgur.com/8EEl86u.jpeg" alt="Siterifty" style="width:48px;height:48px;border-radius:12px;"><div style="font-size:22px;font-weight:800;color:#f1f0ff;margin-top:12px;letter-spacing:-0.03em;">Transfer Complete</div></div><div style="background:#12121a;border:1px solid rgba(248,113,113,0.2);border-radius:16px;padding:28px;margin-bottom:24px;"><div style="background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.18);border-radius:10px;padding:14px;margin-bottom:20px;"><div style="font-size:13px;font-weight:700;color:#f87171;margin-bottom:4px;">Your account has been transferred</div><div style="font-size:12px;color:rgba(248,113,113,0.75);line-height:1.6;">You have successfully transferred <strong style="color:#f87171;">@${safeUsername}</strong> to <strong>${recipientEmail}</strong>. You no longer have access to this account.</div></div><table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px 0;color:#8b8aa8;">Transferred to</td><td style="padding:8px 0;color:#f1f0ff;text-align:right;">${recipientEmail}</td></tr><tr><td style="padding:8px 0;color:#8b8aa8;">Date &amp; time</td><td style="padding:8px 0;color:#f1f0ff;text-align:right;">${dateStr} · ${timeStr}</td></tr></table></div><div style="background:#12121a;border:1px solid rgba(255,255,255,0.13);border-radius:16px;padding:20px;margin-bottom:24px;"><div style="font-size:12px;color:#8b8aa8;line-height:1.7;">This action is permanent and irreversible. If you did not authorise this transfer, contact <a href="mailto:support@${siteDomain}" style="color:#a855f7;">support@${siteDomain}</a> immediately with your account details.</div></div><div style="text-align:center;font-size:11px;color:rgba(139,138,168,0.4);">© 2026 ${siteDomain} · AES-256 encrypted audit log retained</div></div></body></html>`;

        // ── Point of no return — transfer happens BEFORE emails ─────────

        // 1. Update Firebase Auth email → locks original owner out immediately.
        //    Recipient uses "Forgot password" with their email to set a new password.
        try {
            await auth.updateUser(fromUid, {
                email:         recipientEmail,
                emailVerified: false,
            });
        } catch (e) {
            console.error('[transfer_account] auth.updateUser failed', e);
            return res.status(500).json({ error: 'Failed to update account credentials. Transfer aborted — no data was changed.' });
        }

        // 2. Update RTDB so app-level email references match the new owner.
        try {
            await db.ref(`users/${fromUid}`).update({
                email:           recipientEmail,
                transferredFrom: decoded.email,
                transferredAt:   Date.now(),
            });
        } catch (e) {
            console.error('[transfer_account] RTDB user update failed', e);
            // Auth already updated — log but continue.
        }

        // 3. Revoke all sessions — signs original owner out everywhere right now.
        try {
            await auth.revokeRefreshTokens(fromUid);
        } catch (e) {
            console.warn('[transfer_account] revokeRefreshTokens failed', e);
        }

        // 4. Write audit log — transfer is done, safe to record it.
        try {
            await db.ref('accountTransfers').push({
                fromEmail:   decoded.email,
                fromUid,
                toEmail:     recipientEmail,
                username:    safeUsername,
                plan:        safePlan,
                timestamp:   Date.now(),
                accountYear: accountYear || null,
            });
        } catch (e) {
            console.warn('[transfer_account] audit log write failed', e);
        }

        // 5. Now send confirmation emails — ownership is already transferred.
        if (RESEND_API_KEY) {
            await Promise.all([
                fetch('https://api.resend.com/emails', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_API_KEY },
                    body:    JSON.stringify({ from: 'Siterifty <no-reply@siterifty.com>', to: [recipientEmail], subject: 'Siterifty Account Transfer — You have received an account', html: recipientHtml })
                }).catch(e => console.warn('[transfer_account] recipient email failed', e)),
                fetch('https://api.resend.com/emails', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_API_KEY },
                    body:    JSON.stringify({ from: 'Siterifty <no-reply@siterifty.com>', to: [decoded.email], subject: 'Siterifty: Your account has been transferred', html: ownerHtml })
                }).catch(e => console.warn('[transfer_account] owner email failed', e))
            ]);
        } else {
            console.warn('[transfer_account] RESEND_API_KEY not set — emails skipped');
        }

        console.log(`[transfer_account] uid=${fromUid} (${decoded.email}) -> ${recipientEmail} complete`);
        return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });
}


// ─────────────────────────────────────────────────────────────────────────────
// ACTION: delete_account
// Permanently removes all user data from RTDB and deletes the Auth account.
// Blocked if the user has a wallet balance > $0 or open escrow orders.
// ─────────────────────────────────────────────────────────────────────────────
async function handleDeleteAccount(req, res, uid) {
    const db   = getDatabase();
    const auth = getAuth();

    // 1. Safety checks — balance and open orders
    const userSnap = await db.ref(`users/${uid}`).get();
    const userData = userSnap.val() || {};

    const balance = parseFloat(userData.balance || 0);
    if (balance > 0.01) {
        return res.status(400).json({
            error:   'balance_remaining',
            balance: parseFloat(balance.toFixed(2)),
        });
    }

    const offersSnap = await db.ref(`users/${uid}/escrow`).get();
    const offers = offersSnap.val() || {};
    const openOrders = Object.values(offers).filter(o => o && o.status === 'pending');
    if (openOrders.length > 0) {
        return res.status(400).json({ error: 'open_orders' });
    }

    // 2. Remove all RTDB data under users/{uid}
    try {
        await db.ref(`users/${uid}`).remove();
    } catch (e) {
        console.error('[delete_account] RTDB user remove failed', e);
        return res.status(500).json({ error: 'Failed to delete user data. Please try again.' });
    }

    // 3. Remove user's listings from websites/ node
    try {
        const listingsSnap = await db.ref('websites').orderByChild('uid').equalTo(uid).get();
        if (listingsSnap.exists()) {
            const updates = {};
            listingsSnap.forEach(child => { updates[`websites/${child.key}`] = null; });
            await db.ref().update(updates);
        }
    } catch (e) {
        console.error('[delete_account] listings remove failed', e);
        // Non-fatal — continue with auth deletion
    }

    // 4. Clean up transfers/withdrawals referencing this uid (mark as deleted)
    try {
        const txSnap = await db.ref('transfers').orderByChild('from').equalTo(uid).get();
        if (txSnap.exists()) {
            const updates = {};
            txSnap.forEach(child => { updates[`transfers/${child.key}/fromDeleted`] = true; });
            await db.ref().update(updates);
        }
    } catch (e) { console.warn('[delete_account] transfer cleanup failed', e); }

    // 5. Delete the Firebase Auth account — point of no return
    try {
        await auth.deleteUser(uid);
    } catch (e) {
        console.error('[delete_account] Auth deleteUser failed', e);
        return res.status(500).json({ error: 'Account data removed but auth deletion failed. Contact support.' });
    }

    console.log(`[delete_account] uid=${uid} fully deleted`);
    return res.status(200).json({ success: true });
}
