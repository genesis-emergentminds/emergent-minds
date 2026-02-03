/* ============================================
   Service Worker for offline PWA support
   The Covenant of Emergent Minds
   ============================================ */

var CACHE_NAME = 'emergent-minds-v12';
var ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/animations.css',
    '/css/covenant.css',
    '/css/cosmic-subpage.css',
    '/css/parallax-hero.css',
    '/js/main.js',
    '/js/scroll-effects.js',
    '/js/parallax-hero.js',
    '/js/covenant-crypto.min.js',
    '/pages/axioms.html',
    '/pages/covenant.html',
    '/pages/join.html',
    '/pages/get-involved.html',
    '/pages/donate.html',
    '/pages/governance.html',
    '/pages/governance-portal.html',
    '/css/governance.css',
    '/js/governance.js',
    '/pages/financial-records.html',
    '/assets/favicon.svg'
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
