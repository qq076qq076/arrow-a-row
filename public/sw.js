const CACHE_NAME = 'arrow-a-row-shell-v4';
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/assets/manifest.json', '/icons/icon-192.svg', '/icons/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith('arrow-a-row-shell-') && name !== CACHE_NAME).map((name) => caches.delete(name)))),
  ]));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const responseCopy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
      return response;
    }).catch(() => caches.match(event.request).then((cachedResponse) => cachedResponse ?? caches.match('/index.html'))));
    return;
  }

  event.respondWith(caches.match(event.request).then((cachedResponse) => cachedResponse ?? fetch(event.request).then((response) => {
    if (response.ok && url.pathname.startsWith('/assets/')) {
      const responseCopy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
    }
    return response;
  })));
});
