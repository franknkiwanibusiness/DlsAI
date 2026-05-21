// sw.js — Minimisty Admin Service Worker
const CACHE_NAME = 'minimisty-admin-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Push notification handler
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data?.json() || {}; } catch { data = { title: 'Minimisty', body: e.data?.text() || 'New notification' }; }

  const title = data.title || 'Minimisty Admin';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/admin' },
    actions: [{ action: 'view', title: 'View' }],
    tag: data.tag || 'minimisty-admin',
    renotify: true,
    requireInteraction: false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/admin';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});