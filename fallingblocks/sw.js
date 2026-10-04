const CACHE_NAME = 'fallingblocks-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './src/engine.js',
  './src/audio.js',
  './src/ui.js',
  './arcade_vault.js',
  './crt.js',
  './crt.css',
  './gamepad.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
