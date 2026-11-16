'use strict';
const PREFIX = 'dau-xuong-game-';
const CACHE = PREFIX + '0.2.0';
const FILES = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILES.map(file => new Request(new URL(file, self.registration.scope), {cache:'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          await cache.put(new URL('./index.html', self.registration.scope), response.clone());
          return response;
        }
      } catch {}
      return (await cache.match(new URL('./index.html', self.registration.scope))) || Response.error();
    })());
    return;
  }
  const asset = FILES.slice(1).map(file => new URL(file, self.registration.scope).href);
  if (asset.includes(event.request.url)) {
    event.respondWith((async () => (await (await caches.open(CACHE)).match(event.request)) || fetch(event.request))());
  }
});
