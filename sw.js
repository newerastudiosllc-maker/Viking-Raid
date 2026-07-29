/* ============================================================
   VIKING RAID — service worker (offline app shell)
   New Era Studios LLC
   ============================================================ */
const CACHE = "viking-raid-v7";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./js/config.js",
  "./js/data.js",
  "./js/state.js",
  "./js/systems.js",
  "./js/render.js",
  "./js/audio.js",
  "./js/ui.js",
  "./js/main.js",
  "./assets/logo.png",
  "./assets/hero_chieftain.png",
  "./assets/scene_village.png",
  "./assets/scene_forest.png",
  "./assets/scene_fortress.png",
  "./assets/scene_frozen_shore.png",
  "./assets/scene_fjords.png",
  "./assets/scene_marches.png",
  "./assets/scene_cliffs.png",
  "./assets/scene_bosslair.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icons/ab_berserk.png",
  "./assets/icons/ab_shield.png",
  "./assets/icons/ab_horn.png",
  "./assets/icons/ab_valkyrie.png",
  "./assets/icons/ab_ragnarok.png",
  "./assets/icons/unit_berserker.png",
  "./assets/icons/unit_archer.png",
  "./assets/icons/unit_shieldmaiden.png",
  "./assets/icons/route_calm.png",
  "./assets/icons/route_storm.png",
  "./assets/icons/route_cursed.png",
  "./assets/map_chart.png",
  "./assets/icons/tab_raid.png",
  "./assets/icons/tab_forge.png",
  "./assets/icons/tab_hero.png",
  "./assets/icons/tab_loot.png",
  "./assets/icons/tab_saga.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Network-first for the HTML so updates roll out, cache fallback offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }
  // Cache-first for everything else.
  e.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }).catch(() => cached)
      );
    })
  );
});
