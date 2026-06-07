// Service Worker for 澳門洗碼報表 PWA
// v10.19：HTML 永不快取，強制從網路讀取
var CACHE_NAME = "macau-report-v10.19";
var urlsToCache = [
  "/manifest.json"
];

// Install: cache core files
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for HTML (never cache HTML), cache-first for static assets
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  // API requests: network only
  if (event.request.url.indexOf("/api/") !== -1) return;
  // HTML: network only, NEVER cache
  if (event.request.headers.get("accept") && event.request.headers.get("accept").indexOf("text/html") !== -1) {
    event.respondWith(
      fetch(event.request, { cache: "no-cache" }).catch(function() {
        return caches.match(event.request);  // offline fallback only
      })
    );
    return;
  }
  // Other static assets: cache first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, cloned); });
        return response;
      });
    })
  );
});
