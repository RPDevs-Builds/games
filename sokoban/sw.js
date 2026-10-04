const CACHE_NAME = 'rpdevs-sokoban-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './src/engine.js',
  './src/audio.js',
  './src/ui.js',
  '../crt.css',
  '../crt.js',
  '../arcade_vault.js',
  '../gamepad.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
