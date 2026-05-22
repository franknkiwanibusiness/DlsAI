// ══════════════════════════════════════════════════════════
//  MINIMISTY.store — Service Worker
//  Handles: Push Notifications + Offline Cache
// ══════════════════════════════════════════════════════════

const CACHE_NAME = 'minimisty-v1';
const OFFLINE_URLS = ['/'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Push handler ──
self.addEventListener('push', e => {
  let data = { title: 'MINIMISTY', body: 'You have a new message!', url: '/' };
  try { data = { ...data, ...JSON.parse(e.data.text()) }; } catch(_) {}

  const options = {
    body:    data.body,
    icon:    data.icon  || '/icon-192.png',
    badge:   data.badge || '/badge-96.png',
    image:   data.image || undefined,
    tag:     data.tag   || 'minimisty-push',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data:    { url: data.url || '/', ...data },
    actions: data.actions || [
      { action: 'open',    title: '👀 View Now' },
      { action: 'dismiss', title: 'Dismiss'     },
    ],
    vibrate: [100, 50, 100],
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification click ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then(c => c.navigate(url));
      return clients.openWindow(url);
    })
  );
});

// ── Background sync (abandoned cart) ──
self.addEventListener('sync', e => {
  if (e.tag === 'abandoned-cart-check') {
    e.waitUntil(handleAbandonedCartSync());
  }
});

async function handleAbandonedCartSync() {
  // Reads cart data stored by the page and triggers a server-side notification
  try {
    const db = await openIDB();
    const cartData = await idbGet(db, 'pendingCart');
    if (!cartData) return;

    await fetch('/api/push-abandoned-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cartData),
      keepalive: true,
    });

    await idbDelete(db, 'pendingCart');
  } catch(_) {}
}

// ── Minimal IndexedDB helpers (no library needed) ──
function openIDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('minimisty-sw', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('store');
    req.onsuccess  = e => res(e.target.result);
    req.onerror    = e => rej(e.target.error);
  });
}
function idbGet(db, key) {
  return new Promise((res, rej) => {
    const tx = db.transaction('store', 'readonly');
    const req = tx.objectStore('store').get(key);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}
function idbDelete(db, key) {
  return new Promise((res, rej) => {
    const tx = db.transaction('store', 'readwrite');
    const req = tx.objectStore('store').delete(key);
    req.onsuccess = () => res();
    req.onerror   = e => rej(e.target.error);
  });
}