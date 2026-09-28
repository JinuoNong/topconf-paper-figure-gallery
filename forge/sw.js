const CACHE_NAME = 'figureforge-static-v1';
const STATIC_FILE = /\.(?:html|css|js|mjs|wasm|onnx|json|bin|png|gif)(?:$|\?)/i;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('figureforge-static-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if(request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Always prefer the network for the document so a new deployment is seen.
  if(request.mode === 'navigate'){
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }
  if(!STATIC_FILE.test(url.pathname)) return;

  // Cache-first for the large same-origin data/model/vendor assets.
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      if(response.ok){
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
