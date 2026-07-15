// Chancellor PWA Service Worker
var CACHE = 'chancellor-v1';
var FILES = ['/chancellor.html', '/chancellor-manifest.json'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(FILES)})
  );
});

self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request);
    })
  );
});
