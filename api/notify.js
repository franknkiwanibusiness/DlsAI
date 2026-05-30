// ══════════════════════════════════════════════════════════════════
//  /api/notify.js  —  Siterifty unified notification handler
//
//  Actions:
//    send-email           → transactional email via Resend
//    push-subscribe       → save + validate web push subscription
//    newsletter-subscribe → save email + send welcome
//    listing-event        → push + conditional email on listing actions
//    ad-event             → push + conditional email on ad/campaign actions
// ══════════════════════════════════════════════════════════════════

import webpush from 'web-push';

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// ── Plan config ──────────────────────────────────────────────────
// Free: 100 emails/day total but we never auto-email free users
// Paid: max 1/3 of Resend daily cap = ~33 emails/day across all paid users
// Per-user: only 1 email per event type per listing (no spam)
const FREE_PLAN    = 'free';
const PAID_PLANS   = ['starter', 'growth', 'pro'];
const EMAIL_EVENTS = {
    // Only email on these event types, and only for paid users
    listing_approved:  true,
    // Never email for rejected, pending, ad_approved, ad_rejected, ad_pending
};

// ── Event definitions ────────────────────────────────────────────
// dot: 'green' | 'yellow' | 'red'
const LISTING_EVENTS = {
    listing_approved: {
        dot:     'green',
        title:   '✅ Listing Approved',
        body:    (d) => `"${d.title}" is now live on the marketplace.`,
        emailSubject: (d) => `Your listing "${d.title}" is live on Siterifty`,
        emailHtml: (d) => `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
    <div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#34d399;margin-bottom:16px;"></div>
    <h2 style="margin:0 0 12px;font-size:20px;">Your listing is live 🎉</h2>
    <p style="color:#8b8aa8;font-size:14px;line-height:1.6;margin:0 0 8px;">
        <strong style="color:#f1f0ff;">"${d.title}"</strong> passed AI review and is now visible to buyers on Siterifty.
    </p>
    <p style="color:#8b8aa8;font-size:13px;margin:0 0 24px;">Asking price: <strong style="color:#f1f0ff;">$${d.price || '—'}</strong></p>
    <a href="https://siterifty.com" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#a855f7,#f472b6);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">View Marketplace →</a>
    <p style="color:#8b8aa8;font-size:11px;margin:24px 0 0;">Siterifty · <a href="https://siterifty.com" style="color:#8b8aa8;">siterifty.com</a></p>
</div>`,
    },
    listing_pending: {
        dot:     'yellow',
        title:   '⏳ Listing Under Review',
        body:    (d) => `"${d.title}" is being reviewed by our team.`,
        emailSubject: null, // no email for pending
        emailHtml:    null,
    },
    listing_rejected: {
        dot:     'red',
        title:   '❌ Listing Rejected',
        body:    (d) => `"${d.title}" didn't pass review. ${d.reason ? 'Reason: ' + d.reason : ''}`,
        emailSubject: null, // no email for rejected
        emailHtml:    null,
    },
    ad_approved: {
        dot:     'green',
        title:   '✅ Ad Campaign Live',
        body:    (d) => `Your ad for "${d.title}" is now running.`,
        emailSubject: null,
        emailHtml:    null,
    },
    ad_pending: {
        dot:     'yellow',
        title:   '⏳ Ad Under Review',
        body:    (d) => `Your ad for "${d.title}" is being reviewed by our team.`,
        emailSubject: null,
        emailHtml:    null,
    },
    ad_rejected: {
        dot:     'red',
        title:   '❌ Ad Rejected',
        body:    (d) => `Your ad for "${d.title}" was rejected. ${d.reason ? 'Reason: ' + d.reason : ''}`,
        emailSubject: null,
        emailHtml:    null,
    },
};

// ── Firebase REST helpers ────────────────────────────────────────
const DB = process.env.FIREBASE_DATABASE_URL;

async function dbGet(path) {
    const res = await fetch(`${DB}/${path}.json`);
    if (!res.ok) return null;
    return res.json();
}

async function dbSet(path, data) {
    const res = await fetch(`${DB}/${path}.json`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
    });
    return res.ok;
}

async function dbPush(path, data) {
    const res = await fetch(`${DB}/${path}.json`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
    });
    return res.ok;
}

// ── Email rate limiting ──────────────────────────────────────────
// Key: daily_email_count/YYYY-MM-DD
// Limit: floor(100 / 3) = 33 emails per day across all paid users
const DAILY_EMAIL_CAP = 33;

async function canSendEmail(eventType) {
    // Only send emails for approved events
    if (!EMAIL_EVENTS[eventType]) return false;

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const countData = await dbGet(`email_rate/${today}`);
    const count = (countData && countData.count) || 0;
    return count < DAILY_EMAIL_CAP;
}

async function incrementEmailCount() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const countData = await dbGet(`email_rate/${today}`);
    const count = ((countData && countData.count) || 0) + 1;
    await dbSet(`email_rate/${today}`, { count, updatedAt: Date.now() });
}

// ── Dedup: only 1 email per user per listing per event type ─────
async function hasEmailedUser(uid, listingId, eventType) {
    const key = `emailed/${uid}/${listingId}_${eventType}`;
    const val  = await dbGet(key);
    return !!val;
}

async function markEmailedUser(uid, listingId, eventType) {
    const key = `emailed/${uid}/${listingId}_${eventType}`;
    await dbSet(key, { sentAt: Date.now() });
}

// ── Send email via Resend ────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
    if (!to || !subject || !html) return { ok: false, error: 'Missing fields' };
    const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from:    'Siterifty <notifications@siterifty.com>',
            to, subject, html,
        }),
    });
    if (!res.ok) {
        console.error('[notify/email] Resend error:', await res.text());
        return { ok: false };
    }
    return { ok: true };
}

// ── Send push to all devices for a user ─────────────────────────
async function pushToUser(uid, { title, body, dot }) {
    // Load all subscriptions for this user
    const allSubs = await dbGet('push_subscriptions');
    if (!allSubs) return;

    const userSubs = Object.values(allSubs).filter(s => s.uid === uid && s.subscription);
    if (!userSubs.length) return;

    const dotColor = dot === 'green' ? '#34d399' : dot === 'yellow' ? '#f59e0b' : '#f87171';

    const payload = JSON.stringify({
        title,
        body,
        dot,
        dotColor,
        icon:  '/icon-192.png',
        badge: '/badge-72.png',
        tag:   `siterifty-${uid}-${Date.now()}`,
    });

    const results = await Promise.allSettled(
        userSubs.map(s =>
            webpush.sendNotification(s.subscription, payload, { TTL: 86400 })
                .catch(async err => {
                    // Clean up expired subscriptions
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        const key = Object.keys(allSubs).find(k => allSubs[k] === s);
                        if (key) await dbSet(`push_subscriptions/${key}`, null);
                    }
                })
        )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return { sent, total: userSubs.length };
}

// ── Action handlers ──────────────────────────────────────────────

async function handleListingEvent({ uid, plan, email, eventType, listing }) {
    const event = LISTING_EVENTS[eventType];
    if (!event) return { ok: false, error: 'Unknown event type' };

    const data = {
        title:  listing?.title  || 'Your listing',
        price:  listing?.price  || null,
        reason: listing?.reason || '',
        id:     listing?.id     || '',
    };

    // 1. Always push regardless of plan
    const pushResult = await pushToUser(uid, {
        title: event.title,
        body:  event.body(data),
        dot:   event.dot,
    });

    // 2. Email only paid users, only approved events, only within daily cap, only once per listing
    let emailSent = false;
    const planKey = (plan || 'free').toLowerCase();

    if (
        PAID_PLANS.includes(planKey) &&
        event.emailSubject &&
        event.emailHtml &&
        await canSendEmail(eventType) &&
        !(await hasEmailedUser(uid, data.id, eventType))
    ) {
        const emailResult = await sendEmail({
            to:      email,
            subject: event.emailSubject(data),
            html:    event.emailHtml(data),
        });
        if (emailResult.ok) {
            emailSent = true;
            await incrementEmailCount();
            await markEmailedUser(uid, data.id, eventType);
        }
    }

    return { ok: true, push: pushResult, emailSent };
}

async function handleAdEvent({ uid, plan, email, eventType, ad }) {
    // Ads only get push notifications — no email for any ad event
    const event = LISTING_EVENTS[eventType];
    if (!event) return { ok: false, error: 'Unknown ad event type' };

    const data = {
        title:  ad?.title  || 'Your ad',
        reason: ad?.reason || '',
    };

    const pushResult = await pushToUser(uid, {
        title: event.title,
        body:  event.body(data),
        dot:   event.dot,
    });

    return { ok: true, push: pushResult, emailSent: false };
}

async function handleSendEmail({ to, subject, html }) {
    if (!to || !subject || !html) return { ok: false, error: 'Missing to / subject / html' };
    const result = await sendEmail({ to, subject, html });
    return result;
}

async function handlePushSubscribe({ subscription, deviceId, metadata, resubscribe }) {
    if (!subscription?.endpoint) return { ok: false, error: 'Invalid subscription' };

    // Validate with a silent push
    try {
        await webpush.sendNotification(subscription, JSON.stringify({ silent: true }), { TTL: 60 });
    } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
            return { ok: false, error: 'Push subscription no longer valid' };
        }
    }

    const record = {
        subscription,
        deviceId:    deviceId || null,
        uid:         metadata?.uid   || null,
        email:       metadata?.email || null,
        ua:          metadata?.ua    || null,
        resubscribe: resubscribe || false,
        createdAt:   Date.now(),
    };

    const safeKey = (deviceId || Date.now()).toString().replace(/[.#$[\]/]/g, '_');
    await dbSet(`push_subscriptions/${safeKey}`, record);
    return { ok: true, deviceId };
}

async function handleNewsletterSubscribe({ email }) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: 'Invalid email' };
    }
    const safeKey = email.replace(/[.#$[\]]/g, '_');
    await dbSet(`newsletter_subscribers/${safeKey}`, { email, subscribedAt: Date.now() });

    await sendEmail({
        to:      email,
        subject: 'Welcome to Siterifty updates 👋',
        html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0a0f;color:#f1f0ff;border-radius:16px;">
    <h2 style="margin:0 0 12px;font-size:20px;">You're on the list.</h2>
    <p style="color:#8b8aa8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Thanks for subscribing. We'll send new listings, features, and marketplace news — no spam, ever.
    </p>
    <a href="https://siterifty.com" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#a855f7,#f472b6);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Browse Listings →</a>
    <p style="color:#8b8aa8;font-size:11px;margin:24px 0 0;">Reply "unsubscribe" to opt out anytime.</p>
</div>`,
    });

    return { ok: true };
}

// ── Main handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const origin  = req.headers.origin || '';
    const allowed = ['https://siterifty.com', 'https://www.siterifty.com'];
    if (origin && !allowed.includes(origin) && process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { action, ...payload } = req.body || {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    try {
        let result;
        switch (action) {
            case 'send-email':           result = await handleSendEmail(payload);          break;
            case 'push-subscribe':       result = await handlePushSubscribe(payload);      break;
            case 'newsletter-subscribe': result = await handleNewsletterSubscribe(payload);break;
            case 'listing-event':        result = await handleListingEvent(payload);       break;
            case 'ad-event':             result = await handleAdEvent(payload);            break;
            default: return res.status(400).json({ error: `Unknown action: ${action}` });
        }
        return res.status(result.ok ? 200 : 400).json(result);
    } catch (err) {
        console.error(`[notify/${action}]`, err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
