const CACHE_NAME = 'rpdevs-frogger-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon.png',
  './icon-512.png',
  './src/engine.js',
  './src/audio.js',
  './src/ui.js',
  './arcade_vault.js',
  './gamepad.js',
  './crt.css',
  './crt.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request)).catch(() => caches.match('./index.html'))
  );
});
