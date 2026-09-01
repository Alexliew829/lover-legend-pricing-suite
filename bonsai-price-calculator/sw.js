// V3.3 legacy service-worker cleanup.
// This app no longer uses offline page caching so Home Screen always loads the latest deployment.
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
          return caches.delete(key);
        }));
      }),
      self.registration.unregister()
    ]).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
});
