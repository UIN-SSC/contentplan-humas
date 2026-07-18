const CACHE_NAME = "cp-humas-pwa-v1";
const ASSETS_TO_CACHE = [
  "index.html",
  "manifest.json",
  "icon.svg"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-First untuk API & Data Live, Cache-First untuk Statis)
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Jika request ke Google Apps Script (API), selalu Network-Only / Network-First agar data selalu baru
  if (url.includes("script.google.com") || url.includes("/exec")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Untuk file statis (HTML, Manifest, Icon), gunakan Cache-First dengan Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
