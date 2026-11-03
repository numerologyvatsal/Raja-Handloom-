// Service worker: keeps the app files so the app opens even without internet.
var CACHE = "rh-v6";
var FILES = [
  "./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-180.png",
  "css/style.css",
  "images/logo.png",
  "js/state.js", "js/ui.js", "js/shop.js", "js/bill.js",
  "js/pdf.js", "js/designs.js", "js/link.js", "js/report.js", "js/backup.js", "js/app.js"
];

// Save the files one by one, so one missing file cannot stop the installation
self.addEventListener("install", function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) {
    return Promise.all(FILES.map(function(f) {
      return c.add(f).catch(function() {});
    }));
  }));
  self.skipWaiting();
});

// Remove old saved versions
self.addEventListener("activate", function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return clients.claim(); }));
});

// Network first (so updates show up). When offline, use the saved copy. Always answers with something.
self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET" || e.request.url.indexOf(location.origin) !== 0) return;
  e.respondWith(
    fetch(e.request).then(function(r) {
      if (r && r.ok) {
        var copy = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
      }
      return r;
    }).catch(function() {
      return caches.match(e.request).then(function(hit) {
        if (hit) return hit;
        return caches.match("index.html").then(function(home) {
          return home || new Response("Offline", { status: 503 });
        });
      });
    })
  );
});
