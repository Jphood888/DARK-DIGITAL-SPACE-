/* DDS service worker: shows push alerts and opens the site when they are tapped */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Dark Digital Space', { body: d.body || '', icon: '/icon.png', badge: '/icon.png', tag: d.tag || undefined, data: { url: d.url || '/' }, renotify: !!d.tag }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close(); var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ('focus' in cs[i]) { try { cs[i].navigate(url); } catch (x) {} return cs[i].focus(); } }
    return self.clients.openWindow(url);
  }));
});
