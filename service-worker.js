const CACHE_NAME = 'bollettasmart-v1';

// Per ora gestiamo una strategia Network-First per evitare pagine bianche dovute a cache stale durante lo sviluppo
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});