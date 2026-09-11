const CACHE_NAME = 'gymbros-shell-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

// Only ever intervene for full-page navigations, and only to show a friendly
// offline page when the network is unreachable. Everything else (app data,
// server actions, JS/CSS chunks) passes straight through so nothing goes stale.
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || request.mode !== 'navigate')
        return;

    event.respondWith(
        fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
});
