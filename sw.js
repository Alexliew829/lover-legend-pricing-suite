// Lover Legend Pricing Suite V9.4 - legacy service worker cleanup
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil((async function () {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) {
        return caches.delete(key);
      }));
    } catch (error) {}

    try {
      await self.registration.unregister();
    } catch (error) {}

    try {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });
      await Promise.all(clients.map(function (client) {
        return client.navigate(client.url);
      }));
    } catch (error) {}
  })());
});

// No fetch interception: all requests return to normal browser networking.
self.addEventListener("fetch", function () {});
