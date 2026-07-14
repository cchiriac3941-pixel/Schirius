const CACHE_NAME = 'schirius-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/base.css',
  '/js/common.js',
  '/pages/discover.html',
  '/pages/artist.html',
  '/pages/featured.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
