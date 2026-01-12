const CACHE_NAME = 'omsai-travels-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.js',
  './App.js',
  './Navbar.js',
  './BookingForm.js',
  './FleetSection.js',
  './constants.js',
  'https://cdn.tailwindcss.com',
  'https://files.catbox.moe/eg15uw.png',
  'https://files.catbox.moe/w6ushi.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network first, fall back to cache strategy for index and JS
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});