/* ==========================================================================
   Miya's Cookies — service worker
   App shell (CSS/JS/sprites) is cached up front and served cache-first.
   Pages are network-first with a cached fallback so the site opens offline.
   Bump CACHE when assets change (matches ASSET_VERSION in config.php).
   ========================================================================== */
const CACHE = 'miya-v0.1.0';
const SHELL = [
  './',
  './index.php',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/music.js',
  './assets/js/intro.js',
  './assets/js/app.js',
  './assets/img/hero.png',
  './assets/img/sprites/miya_nutella_idle.png',
  './assets/img/sprites/miya_nutella_run.png',
  './assets/img/sprites/miya_nutella_hero.png',
  './assets/img/sprites/miya_nutella_idle@4x.png',
  './assets/img/sprites/miya_nutella_hero@4x.png',
  './assets/img/sprites/miya_nutella_wave@4x.png',
  './assets/img/sprites/miya_nutella_tray@4x.png',
  './assets/img/props/cookie_signature@4x.png',
  './assets/img/props/cookie_bitten@4x.png',
  './assets/img/props/cookie_split@4x.png',
  './assets/img/props/cookie_tray.png',
  './assets/img/props/cookie_tray@4x.png',
  './assets/img/props/star.png',
  './assets/img/props/star@4x.png',
  './assets/img/props/heart@4x.png',
  './assets/img/props/milk_glass@4x.png',
  './assets/img/props/nutella_jar@4x.png',
  './assets/img/icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // fonts etc. go straight to network

  if (req.mode === 'navigate' || url.pathname.endsWith('.php')) {
    // pages: network first, fall back to cache
    e.respondWith(
      fetch(req).then((res) => { caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.php')))
    );
    return;
  }
  // assets: cache first, then network (and cache it for next time)
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
      return res;
    }))
  );
});
