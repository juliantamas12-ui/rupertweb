/* QuestLog Service Worker
 * Strategy:
 *   - Network-first for HTML and JSON (so frequent deploys appear immediately)
 *   - Cache-first for static icons / fonts
 *   - Offline fallback: serves last cached questlog.html when offline
 * Bump VERSION on breaking cache shape changes.
 */
const VERSION = 'questlog-v6-2026-06-11-access-bypass';
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

  // Navigation (HTML page loads): network-first, fall back to cached questlog.html.
  // Only cache real same-origin 200 HTML; never cache redirects or opaque responses
  // (Cloudflare Access redirects HTML pages too when sessions expire).
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic' && (res.headers.get('content-type') || '').includes('text/html')) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
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

  // JSON / API: network-first, short cache fallback for offline.
  // Only cache real JSON 200s; never cache redirects or HTML
  // (Cloudflare Access bounces /api/* to a login HTML page when the
  // session expires, and we don't want that getting cached and replayed).
  if (url.pathname.endsWith('.json') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const ct = res.headers.get('content-type') || '';
          if (res.ok && res.type === 'basic' && ct.includes('application/json')) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
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

// ───── App Badge persistence ─────
// The PWA Badging API (navigator.setAppBadge / clearAppBadge) surfaces an
// unread count on the home-screen icon (Chromium / Edge / iOS Safari 16.4+).
// We persist the count in a dedicated Cache entry so it survives SW restarts;
// it is incremented from the push handler and cleared either by clicking a
// notification or when the foreground app posts {type:'clear-badge'} after
// the user views their alerts. SW global is unreliable across cold starts -
// the cache entry is the source of truth.
const BADGE_CACHE = 'questlog-badge';
const BADGE_KEY = '/__questlog_badge__';

async function getBadgeCount() {
  try {
    const c = await caches.open(BADGE_CACHE);
    const hit = await c.match(BADGE_KEY);
    if (!hit) return 0;
    const n = parseInt(await hit.text(), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (_) { return 0; }
}

async function setBadgeCount(n) {
  try {
    const c = await caches.open(BADGE_CACHE);
    await c.put(BADGE_KEY, new Response(String(n | 0), { headers: { 'content-type': 'text/plain' } }));
  } catch (_) {}
  try {
    if (n > 0 && self.navigator && typeof self.navigator.setAppBadge === 'function') {
      await self.navigator.setAppBadge(n);
    } else if ((!n || n <= 0) && self.navigator && typeof self.navigator.clearAppBadge === 'function') {
      await self.navigator.clearAppBadge();
    }
  } catch (_) {
    // Badging API not supported (e.g. Firefox) - cache still holds the count
    // so when the user opens the app the foreground side can read it via
    // `getRegistration()` + message-channel if it ever needs to. Silent
    // degradation, no functional regression.
  }
}

// Push notification handler. Worker dispatchWebPush sends payloads shaped as
//   { title, body, tag?, data: { url, appid?, ts? } }
// (see worker.js dispatchWebPush). `tag` collapses successive notifications
// for the same app (e.g. multiple price drops on the same game) into one,
// and `data.url` is what notificationclick uses to focus or open the right
// tab. Falls back gracefully if the payload is plain text.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch (_) { payload = { title: 'QuestLog', body: event.data.text() }; }
  const opts = {
    body: payload.body || '',
    icon: '/icons/questlog-192.png',
    badge: '/icons/questlog-192.png',
    data: payload.data || {}
  };
  if (payload.tag) opts.tag = payload.tag;
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'QuestLog', opts),
      // Increment + persist + paint the home-screen badge. Skip the test-push
      // synthetic payload (appid sentinel = 0, set by /api/push/test) so the
      // Send test notification button doesn't leave a stray badge behind.
      (async () => {
        const isTest = payload.data && (payload.data.appid === 0 || payload.data.appid === '0');
        if (isTest) return;
        const cur = await getBadgeCount();
        await setBadgeCount(cur + 1);
      })()
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/questlog.html';
  event.waitUntil(
    Promise.all([
      // Clicking any notification means the user has acknowledged this batch -
      // reset the badge. The in-app render path also clears it when the user
      // simply opens the panel.
      setBadgeCount(0),
      self.clients.matchAll({ type: 'window' }).then((wins) => {
        for (const w of wins) {
          if (w.url.includes(url) && 'focus' in w) return w.focus();
        }
        return self.clients.openWindow(url);
      })
    ])
  );
});

// Foreground -> SW channel. The questlog.html page posts {type:'clear-badge'}
// after the Recent Price Drops panel renders successfully, so simply opening
// the app counts as 'I have seen these'. Defensive: any unknown message type
// is ignored.
self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'clear-badge') {
    event.waitUntil(setBadgeCount(0));
  }
});
