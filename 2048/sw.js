const CACHE_NAME = '2048-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './src/engine.js',
  './src/audio.js',
  './src/ui.js',
  './crt.css',
  './crt.js',
  './arcade_vault.js',
  './gamepad.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)).catch(() => caches.match('./index.html')));
});
