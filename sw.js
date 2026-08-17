// Service worker for Cutting The Surplus.
// Network-first: always tries to fetch the latest version first, so a
// fresh commit shows up on the very next open — no more "close and
// reopen twice" lag. Falls back to cache only when there's no signal,
// so the app still opens offline.

const CACHE_NAME = 'cutting-surplus-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Fresh response from the network — use it, and update the
        // offline cache in the background for next time there's no signal.
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)) // offline — serve last-known-good
  );
});
