/* ============================================
   Service Worker for offline PWA support
   The Covenant of Emergent Minds
   ============================================ */

var CACHE_NAME = 'emergent-minds-v1';
var ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/pages/axioms.html',
    '/pages/manifesto.html',
    '/pages/get-involved.html',
    '/pages/donate.html',
    '/pages/governance.html'
];

// Install — cache core assets
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (key) {
                    return key !== CACHE_NAME;
                }).map(function (key) {
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', function (event) {
    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                // Cache successful responses
                if (response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(function () {
                return caches.match(event.request);
            })
    );
});
