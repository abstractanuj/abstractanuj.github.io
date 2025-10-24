/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const CACHE_NAME = 'megh-cache-v2';
const urlsToCache = [
  '/megh/index.html',
  '/megh/index.css',
  '/megh/index.js',
  '/megh/js/maze.js',
  '/megh/js/player.js',
  '/megh/js/ui.js',
  '/megh/js/state.js',
  '/megh/js/debug.js',
  '/megh/js/audio.js',
  '/megh/js/timer.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Montserrat:wght@400;600;700&family=Roboto+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // We don't cache POST requests
                if (event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});