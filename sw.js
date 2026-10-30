// Service worker: keeps the app files so it opens without internet.
var CACHE = "rh-v2";
var FILES = [
  "./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-180.png",
  "css/style.css",
  "js/logo.js", "js/state.js", "js/ui.js", "js/shop.js", "js/bill.js",
  "js/pdf.js", "js/designs.js", "js/sync.js", "js/app.js"
];

self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return clients.claim(); }));
});

// Network first (so updates show up), cache when offline
self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET" || e.request.url.indexOf(location.origin) !== 0) return;
  e.respondWith(
    fetch(e.request).then(function(r) {
      var copy = r.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
      return r;
    }).catch(function() { return caches.match(e.request); })
  );
});
