// Siterifty — /api/settings.js
// Handles: push-subscribe, send-email, newsletter-subscribe, notify-event, delete_account
// Deploy to: https://siterifty.com/api/settings.js
//
// Required env vars:
//   VAPID_PUBLIC_KEY      — your VAPID public key
//   VAPID_PRIVATE_KEY     — your VAPID private key
//   VAPID_EMAIL           — mailto:you@siterifty.com
//   RESEND_API_KEY        — from resend.com (for email sending)
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

const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL       = process.env.VAPID_EMAIL || 'mailto:admin@siterifty.com';
const RESEND_API_KEY    = process.env.RESEND_API_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
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
        _subscriptions.set(id, { subscription, metadata: metadata || {}, savedAt: Date.now() });
        console.log('[settings] push-subscribe:', id, metadata?.uid);
        return res.status(200).json({ ok: true, deviceId: id });
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
