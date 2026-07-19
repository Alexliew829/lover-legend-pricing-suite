const CACHE_PREFIX = "lover-legend-pricing-suite";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith(CACHE_PREFIX))
            .map(key => caches.delete(key))
        )
      ),
      self.registration.unregister(),
      self.clients.claim()
    ])
  );
});
