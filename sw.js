/**
 * Master Arcade Suite Service Worker
 */

const CACHE_NAME = 'rpdevs-arcade-suite-v8';
const ASSETS = [
  './',
  './index.html',
  './portal.css',
  './portal.js',
  './manifest.json',
  './arcade_vault.js',
  './gamepad.js',
  './crt.css',
  './crt.js',
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
  './dotsandboxes/style.css',
  './sokoban/index.html',
  './sokoban/style.css',
  './connectfour/index.html',
  './connectfour/style.css',
  './breakout/index.html',
  './breakout/style.css',
  './pong/index.html',
  './pong/style.css',
  './fallingblocks/index.html',
  './fallingblocks/style.css',
  './mazechaser/index.html',
  './mazechaser/style.css',
  './asteroids/index.html',
  './asteroids/style.css',
  './wordle/index.html',
  './wordle/style.css'
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
