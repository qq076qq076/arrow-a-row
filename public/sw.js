const CACHE_NAME = 'arrow-a-row-shell-v1';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse ?? fetch(event.request).then((response) => {
      const responseCopy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
      return response;
    })),
  );
});
