/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const CACHE_NAME = 'megh-cache-v3';
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
  '/megh/js/particles.js',
  '/megh/js/events.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Montserrat:wght@400;600;700&family=Roboto+Mono:wght@400;500;700&display=swap'
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
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
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