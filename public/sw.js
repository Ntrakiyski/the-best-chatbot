// Simple service worker for basic PWA offline support
// Strategy:
// - Cache-first for static assets (/_next/static, /icons, and common extensions)
// - Network-first for navigations (HTML) with cache fallback

const VERSION = 'v1';
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([
      // Add minimal shell assets if desired. Keeping empty for now; runtime will fill.
    ]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/_next/static')) return true;
  if (url.pathname.startsWith('/icons/')) return true;
  if (url.pathname.startsWith('/favicon')) return true;
  return /\.(?:png|jpg|jpeg|svg|gif|webp|css|js|woff2?)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Handle navigation requests (HTML) with network-first
  if (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')
  ) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Offline fallback (very light)
          return new Response(
            '<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Offline</title></head><body><main style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">You are offline. Please reconnect and try again.</main></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(request)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch (err) {
          return caches.match(request);
        }
      })()
    );
    return;
  }

  // Default: try network, then cache
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        return response;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});

