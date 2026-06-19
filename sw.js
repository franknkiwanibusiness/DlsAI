// Siterifty — /sw.js
// Must be served from the root of the domain (https://siterifty.com/sw.js)
// so it has scope over the entire site.

self.addEventListener('install', function(e) {
    self.skipWaiting(); // activate immediately, don't wait for old SW to die
});

self.addEventListener('activate', function(e) {
    e.waitUntil(self.clients.claim()); // take control of all open tabs right away
});

// ── Handle incoming Web Push from server ──────────────────────────────────────
self.addEventListener('push', function(e) {
    var data = {};
    try {
        data = e.data ? e.data.json() : {};
    } catch(_) {
        data = { title: 'Siterifty', body: e.data ? e.data.text() : '' };
    }

    var title = data.title || 'Siterifty';
    var body  = data.body  || '';
    var icon  = data.icon  || '/favicon.ico';
    var type  = data.type  || 'message';

    // Badge and tag grouped by type so bursts don't spam
    var tag = type + '_' + Date.now();

    e.waitUntil(
        self.registration.showNotification(title, {
            body:    body,
            icon:    icon,
            badge:   '/favicon.ico',
            tag:     tag,
            vibrate: [200, 100, 200],
            data:    { url: 'https://siterifty.com', type: type }
        })
    );
});

// ── Handle notification click — open/focus the site ──────────────────────────
self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    var targetUrl = (e.notification.data && e.notification.data.url) || 'https://siterifty.com';

    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
            // If a tab is already open, focus it
            for (var i = 0; i < clients.length; i++) {
                var client = clients[i];
                if (client.url.indexOf('siterifty.com') !== -1 && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new tab
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
