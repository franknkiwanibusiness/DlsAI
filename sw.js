/* ═══════════════════════════════════════════════════════════════
   MINIMISTY.store — Service Worker
   Handles: Push notifications · Offline cache · Background sync
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME  = 'minimisty-v1';
const CACHE_URLS  = ['/'];
const STORE_URL   = 'https://minimisty.store/';
const STORE_ICON  = 'https://i.imgur.com/h94iKss.jpeg';
const STORE_BADGE = '/badge-72.png';

// ── Notification defaults by type ─────────────────────────────
const NOTIF_DEFAULTS = {
  restock: {
    title: 'Back in Stock!',
    body:  'FrostBlade Pro is available again. Grab yours before it sells out.',
    tag:   'restock',
  },
  drop: {
    title: 'New Drop — Limited Stock',
    body:  'Something new just landed at MINIMISTY.store. Be first.',
    tag:   'drop',
  },
  cart: {
    title: 'Complete your order!',
    body:  'Your FrostBlade Pro is still waiting. Checkout before it sells out.',
    tag:   'cart-abandonment',
  },
  offer: {
    title: 'Exclusive offer — today only',
    body:  'A special deal is waiting for you at MINIMISTY.store.',
    tag:   'offer',
  },
  order: {
    title: 'Your order is on its way!',
    body:  'Your FrostBlade Pro has been shipped. Track it now.',
    tag:   'order-update',
  },
  general: {
    title: 'MINIMISTY.store',
    body:  'You have a new update from MINIMISTY.',
    tag:   'general',
  },
};

// ══════════════════════════════════════════════════════════════
//  INSTALL
// ══════════════════════════════════════════════════════════════
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS)).catch(() => {})
  );
});

// ══════════════════════════════════════════════════════════════
//  ACTIVATE
// ══════════════════════════════════════════════════════════════
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ══════════════════════════════════════════════════════════════
//  FETCH — network-first, cache fallback for navigation
// ══════════════════════════════════════════════════════════════
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;
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
  if (event.data) {
    try { payload = event.data.json(); }
    catch (_) { payload = { body: event.data.text() }; }
  }

  const type     = payload.type || 'general';
  const defaults = NOTIF_DEFAULTS[type] || NOTIF_DEFAULTS.general;
  const title    = payload.title   || defaults.title;
  const body     = payload.body    || defaults.body;
  const tag      = payload.tag     || defaults.tag;
  const url      = payload.url     || STORE_URL;
  const icon     = payload.icon    || STORE_ICON;
  const image    = payload.image   || undefined;
  const actions  = payload.actions || buildActions(type);

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
    timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
  };
  Object.keys(options).forEach(k => options[k] === undefined && delete options[k]);

  event.waitUntil(self.registration.showNotification(title, options));
});

// ══════════════════════════════════════════════════════════════
//  BACKGROUND SYNC — abandoned-cart notification
// ══════════════════════════════════════════════════════════════
self.addEventListener('sync', event => {
  if (event.tag === 'abandoned-cart-check') {
    event.waitUntil(handleAbandonedCartSync());
  }
});

async function handleAbandonedCartSync() {
  try {
    const cartData = await readCartFromIDB();
    if (!cartData) return;

    // Only fire if cart was written >3 minutes ago (user genuinely left)
    const ageMs = Date.now() - (cartData.ts || 0);
    if (ageMs < 3 * 60 * 1000) return;

    // Try server first
    let serverOk = false;
    try {
      const res = await fetch('/api/push-abandoned-cart', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId: cartData.deviceId, cartData }),
      });
      serverOk = res.ok;
    } catch (_) {}

    // Local fallback if server unavailable
    if (!serverOk) {
      const sym = cartData.symbol || '$';
      const val = cartData.cartValue ? `${sym}${Number(cartData.cartValue).toFixed(2)}` : '';
      await self.registration.showNotification('Complete your order!', {
        body:               `Your cart${val ? ` (${val})` : ''} is still waiting. Checkout before it sells out.`,
        tag:                'cart-abandonment',
        icon:               STORE_ICON,
        badge:              STORE_BADGE,
        vibrate:            [100, 50, 100],
        requireInteraction: true,
        actions: [
          { action: 'checkout', title: 'Complete order' },
          { action: 'dismiss',  title: 'Dismiss' },
        ],
        data: { url: STORE_URL, type: 'cart' },
      });
    }

    await clearCartFromIDB();
  } catch (err) {
    console.warn('[SW] abandoned-cart sync error:', err);
  }
}

// ── IndexedDB helpers ─────────────────────────────────────────
function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('minimisty-sw', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('store');
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

async function readCartFromIDB() {
  try {
    const db = await openIDB();
    return new Promise(resolve => {
      const tx  = db.transaction('store', 'readonly');
      const req = tx.objectStore('store').get('pendingCart');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => resolve(null);
    });
  } catch (_) { return null; }
}

async function clearCartFromIDB() {
  try {
    const db = await openIDB();
    return new Promise(resolve => {
      const tx = db.transaction('store', 'readwrite');
      tx.objectStore('store').delete('pendingCart');
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();
    });
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════════
//  MESSAGE — page triggers a local notification via postMessage
//
//  Usage from the page:
//    navigator.serviceWorker.ready.then(r =>
//      r.active.postMessage({
//        type: 'SHOW_NOTIFICATION',
//        payload: { type: 'cart', title: '...', body: '...' }
//      })
//    )
//
//  NOTE: MessageEvent does NOT support event.waitUntil().
//  We use an async handler and call showNotification directly.
// ══════════════════════════════════════════════════════════════
self.addEventListener('message', async event => {
  if (!event.data || event.data.type !== 'SHOW_NOTIFICATION') return;

  const payload  = event.data.payload || {};
  const nType    = payload.type || 'general';
  const defaults = NOTIF_DEFAULTS[nType] || NOTIF_DEFAULTS.general;
  const title    = payload.title || defaults.title;
  const body     = payload.body  || defaults.body;
  const tag      = payload.tag   || defaults.tag;

  const options = {
    body,
    tag,
    icon:               payload.icon || STORE_ICON,
    badge:              STORE_BADGE,
    vibrate:            [100, 50, 100],
    requireInteraction: nType === 'cart' || nType === 'restock',
    actions:            buildActions(nType),
    data:               { url: payload.url || STORE_URL, type: nType },
  };

  try {
    await self.registration.showNotification(title, options);
  } catch (err) {
    console.warn('[SW] showNotification error:', err);
  }
});

// ══════════════════════════════════════════════════════════════
//  NOTIFICATION CLICK
// ══════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const data      = event.notification.data || {};
  const action    = event.action;
  let   targetUrl = data.url || STORE_URL;

  if (action === 'dismiss') return;
  if (action === 'checkout') targetUrl = STORE_URL + '#checkout';
  if (action === 'track')    targetUrl = data.trackingUrl || STORE_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        const target    = new URL(targetUrl);
        if (clientUrl.origin === target.origin && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// ══════════════════════════════════════════════════════════════
//  NOTIFICATION CLOSE — analytics ping
// ══════════════════════════════════════════════════════════════
self.addEventListener('notificationclose', event => {
  const data = event.notification.data || {};
  try {
    fetch('/api/push-event', {
      method:  'POST',
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
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), resubscribe: true }),
        })
      ).catch(() => {})
  );
});

// ── Contextual action buttons ─────────────────────────────────
// NOTE: Emoji in action titles is intentional and correct.
// The Notification Actions spec only allows icon: (a URL) or title: (string).
// Inline SVG / data URIs are blocked by all browsers in notification icons.
// Emoji is the only cross-browser way to add visual cues to action buttons.
function buildActions(type) {
  switch (type) {
    case 'cart':
      return [
        { action: 'checkout', title: 'Complete order' },
        { action: 'dismiss',  title: 'Dismiss' },
      ];
    case 'restock':
    case 'drop':
      return [
        { action: 'shop',    title: 'Shop now' },
        { action: 'dismiss', title: 'Later' },
      ];
    case 'offer':
      return [
        { action: 'claim',   title: 'Claim offer' },
        { action: 'dismiss', title: 'No thanks' },
      ];
    case 'order':
      return [
        { action: 'track',   title: 'Track order' },
        { action: 'dismiss', title: 'OK' },
      ];
    default:
      return [];
  }
}