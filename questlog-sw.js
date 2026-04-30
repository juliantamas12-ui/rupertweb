/* QuestLog Service Worker
 * Strategy:
 *   - Network-first for HTML and JSON (so frequent deploys appear immediately)
 *   - Cache-first for static icons / fonts
 *   - Offline fallback: serves last cached questlog.html when offline
 * Bump VERSION on breaking cache shape changes.
 */
const VERSION = 'questlog-v4-2026-04-30';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const STATIC_ASSETS = [
  '/icons/questlog-192.png',
  '/icons/questlog-512.png',
  '/icons/questlog-maskable-512.png',
  '/questlog.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[sw] precache failed', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Only handle same-origin requests; let cross-origin (Steam CDN, etc.) fall through.
  if (url.origin !== self.location.origin) return;

  // Navigation (HTML page loads): network-first, fall back to cached questlog.html
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => {
            if (hit) return hit;
            // Only use questlog.html as offline fallback for questlog navigations
            if (url.pathname === '/questlog.html' || url.pathname === '/' ) {
              return caches.match('/questlog.html');
            }
            return Response.error();
          })
        )
    );
    return;
  }

  // JSON / API: network-first, short cache fallback for offline
  if (url.pathname.endsWith('.json') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Static assets (icons, css, fonts): cache-first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        });
      })
    );
    return;
  }

  // Default: just hit the network.
});

// Push notification scaffolding — disabled until VAPID keys + backend exist.
// When ready: register subscription on connect-Steam success, store on the worker, deliver via /api/push.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch (_) { payload = { title: 'QuestLog', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'QuestLog', {
      body: payload.body || '',
      icon: '/icons/questlog-192.png',
      badge: '/icons/questlog-192.png',
      data: payload.data || {}
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/questlog.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && 'focus' in w) return w.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
