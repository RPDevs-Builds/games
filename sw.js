/**
 * Master Arcade Suite Service Worker
 */

const CACHE_NAME = 'rpdevs-arcade-suite-v1';
const ASSETS = [
  './',
  './index.html',
  './portal.css',
  './portal.js',
  './manifest.json',
  './lightsout/index.html',
  './lightsout/style.css',
  './snake/index.html',
  './snake/style.css',
  './simon/index.html',
  './simon/style.css',
  './minesweeper/index.html',
  './minesweeper/style.css',
  './2048/index.html',
  './2048/style.css',
  './dotsandboxes/index.html',
  './dotsandboxes/style.css'
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
