/* ═══════════════════════════════════════════════════════════════
   MINIMISTY.store — Service Worker
   Handles: Push notifications · Offline cache · Background sync
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME   = 'minimisty-v1';
const CACHE_URLS   = ['/'];          // add more static assets here if needed
const STORE_URL    = 'https://minimisty.store/';
const STORE_ICON   = 'https://i.imgur.com/h94iKss.jpeg';
const STORE_BADGE  = '/badge-72.png'; // 72×72 monochrome PNG — swap for your own

// ── Notification defaults by type ─────────────────────────────
const NOTIF_DEFAULTS = {
  restock: {
    title: '🧊 Back in Stock!',
    body:  'FrostBlade Pro is available again. Grab yours before it sells out.',
    tag:   'restock',
  },
  drop: {
    title: '🚨 New Drop — Limited Stock',
    body:  'Something new just landed at MINIMISTY.store. Be first.',
    tag:   'drop',
  },
  cart: {
    title: '🛒 You left something behind',
    body:  'Your FrostBlade Pro is still waiting. Complete your order now.',
    tag:   'cart-abandonment',
  },
  offer: {
    title: '⚡ Exclusive offer — today only',
    body:  'A special deal is waiting for you at MINIMISTY.store.',
    tag:   'offer',
  },
  order: {
    title: '📦 Your order is on its way!',
    body:  'Your FrostBlade Pro has been shipped. Track it now.',
    tag:   'order-update',
  },
  // fallback
  general: {
    title: 'MINIMISTY.store',
    body:  'You have a new update from MINIMISTY.',
    tag:   'general',
  },
};

// ══════════════════════════════════════════════════════════════
//  INSTALL — cache core assets
// ══════════════════════════════════════════════════════════════
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS)).catch(() => {})
  );
});

// ══════════════════════════════════════════════════════════════
//  ACTIVATE — clean old caches
// ══════════════════════════════════════════════════════════════
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ══════════════════════════════════════════════════════════════
//  FETCH — network-first with cache fallback for navigation
// ══════════════════════════════════════════════════════════════
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  // Only cache same-origin navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/').then(r => r || Response.error()))
    );
  }
});

// ══════════════════════════════════════════════════════════════
//  PUSH — receive and display notification
// ══════════════════════════════════════════════════════════════
self.addEventListener('push', event => {
  let payload = {};

  // Try to parse JSON payload from server
  if (event.data) {
    try { payload = event.data.json(); } catch (_) {
      payload = { body: event.data.text() };
    }
  }

  // Pick the right defaults based on payload.type
  const type     = payload.type || 'general';
  const defaults = NOTIF_DEFAULTS[type] || NOTIF_DEFAULTS.general;

  const title   = payload.title   || defaults.title;
  const body    = payload.body    || defaults.body;
  const tag     = payload.tag     || defaults.tag;
  const url     = payload.url     || STORE_URL;
  const icon    = payload.icon    || STORE_ICON;
  const image   = payload.image   || undefined;
  const actions = payload.actions || buildActions(type);

  const options = {
    body,
    tag,
    icon,
    badge:              STORE_BADGE,
    image,
    vibrate:            [100, 50, 100],
    requireInteraction: type === 'cart' || type === 'restock',
    data:               { url, type, ...payload.data },
    actions,
    // Timestamp — use server-sent time or now
    timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
  };

  // Remove undefined keys (Safari / older browsers are strict)
  Object.keys(options).forEach(k => options[k] === undefined && delete options[k]);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Build contextual action buttons ───────────────────────────
function buildActions(type) {
  switch (type) {
    case 'cart':
      return [
        { action: 'checkout', title: '🛒 Complete order' },
        { action: 'dismiss',  title: 'Dismiss' },
      ];
    case 'restock':
    case 'drop':
      return [
        { action: 'shop',    title: '🛍 Shop now' },
        { action: 'dismiss', title: 'Later' },
      ];
    case 'offer':
      return [
        { action: 'claim',   title: '⚡ Claim offer' },
        { action: 'dismiss', title: 'No thanks' },
      ];
    case 'order':
      return [
        { action: 'track',   title: '📦 Track order' },
        { action: 'dismiss', title: 'OK' },
      ];
    default:
      return [];
  }
}

// ══════════════════════════════════════════════════════════════
//  NOTIFICATION CLICK — open / focus correct URL
// ══════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const data   = event.notification.data || {};
  const action = event.action;
  let targetUrl = data.url || STORE_URL;

  // Override URL based on action button clicked
  if (action === 'dismiss') return;
  if (action === 'checkout') targetUrl = STORE_URL + '#checkout';
  if (action === 'track')    targetUrl = data.trackingUrl || STORE_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing tab if already open on the same origin
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        const target    = new URL(targetUrl);
        if (clientUrl.origin === target.origin && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// ══════════════════════════════════════════════════════════════
//  NOTIFICATION CLOSE — optional analytics ping
// ══════════════════════════════════════════════════════════════
self.addEventListener('notificationclose', event => {
  const data = event.notification.data || {};
  // Fire-and-forget dismiss event — swap endpoint for your own
  try {
    fetch('/api/push-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event:    'dismissed',
        tag:      event.notification.tag,
        type:     data.type     || 'unknown',
        deviceId: data.deviceId || 'unknown',
      }),
    }).catch(() => {});
  } catch (_) {}
});

// ══════════════════════════════════════════════════════════════
//  PUSH SUBSCRIPTION CHANGE — auto-resubscribe on key rotation
// ══════════════════════════════════════════════════════════════
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(sub =>
        fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), resubscribe: true }),
        })
      ).catch(() => {})
  );
});