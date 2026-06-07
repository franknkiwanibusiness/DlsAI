// Siterifty Service Worker — required for Web Push notifications
// Deploy this file to the ROOT of your domain: https://siterifty.com/sw.js

self.addEventListener('install', function(e) {
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(clients.claim());
});

self.addEventListener('push', function(e) {
    var data = {};
    try { data = e.data ? e.data.json() : {}; } catch(_) {}
    var title   = data.title  || 'Siterifty';
    var body    = data.body   || 'You have a new notification.';
    var icon    = data.icon   || '/favicon.ico';
    var url     = data.url    || '/';
    e.waitUntil(
        self.registration.showNotification(title, {
            body:  body,
            icon:  icon,
            badge: icon,
            data:  { url: url }
        })
    );
});

self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    var target = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].url === target && 'focus' in list[i]) {
                    return list[i].focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(target);
        })
    );
});
