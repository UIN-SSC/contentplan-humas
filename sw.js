const CACHE_NAME = "cp-humas-pwa-v2";
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

  // Ubah strategi menjadi Network-First, Fallback ke Cache
  // Ini memastikan user selalu mendapat update terbaru tanpa perlu clear cache,
  // namun tetap bisa dibuka saat offline.
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // Jika online dan berhasil ambil data dari server, simpan/update ke cache
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // Jika gagal (misal sedang offline), ambil dari cache
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback khusus untuk navigasi halaman jika tidak ada di cache
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
