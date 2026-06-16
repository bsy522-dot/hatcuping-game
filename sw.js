// Service Worker - hatcuping-game v13.0
const CACHE_NAME = 'hatcuping-v13';
const PRECACHE_URLS = [
  './',
  './index.html',
  './v8_patch.js',
  './v9_patch.js',
  './v10_patch.js',
  './v11_patch.js',
  './v12_patch.js',
  './v13_patch.js',
  './hatcuping-game-v2.html',
  './hatcuping-rpg-v2.html',
  './hatcuping-unified.html',
  './manifest.json',
  './sprites_data.js',
  './env_backgrounds.js',
  './unified/core/state.js',
  './unified/core/save.js',
  './unified/core/mode_dispatcher.js',
  './unified/core/story_router.js',
  './unified/ui/canvas.js',
  './unified/engines/engine_title.js',
  './unified/engines/engine_dodge.js',
  './unified/engines/engine_platformer.js',
  './unified/engines/engine_run.js',
  './unified/engines/engine_v2scene.js',
  './unified/engines/engine_v3map.js',
  './unified/engines/engine_v3battle.js',
  './unified/data/romi_stats.js',
  './unified/data/partner_effects.js',
  './unified/story/act1_morning.js',
  './unified/story/act1_5_snow.js',
  './unified/story/act1_post_dodge.js',
  './unified/story/act1b_book.js',
  './unified/story/act2_escape.js',
  './unified/story/act2_post.js',
  './unified/story/act3_bus.js',
  './unified/story/act4_village.js',
  './unified/story/act5_forest.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
