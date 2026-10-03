const CACHE_NAME = 'minesweeper-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './src/engine.js',
  './src/audio.js',
  './src/ui.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)).catch(() => caches.match('./index.html')));
});
