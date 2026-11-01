const VERSION = "f2abc8577760cc0b";
const FILES = [".nojekyll","app-config.json","assets/index-BvCQ9_2N.css","assets/index-DwFHLzjG.js","assets/three-C45dwzNz.js","icon-180.png","icon-192.png","icon-512.png","icon.svg","index.html","manifest.json"];
const SCOPE = self.registration.scope;
const PREFIX = `geomonge:${SCOPE}:`;
const CACHE = PREFIX + VERSION;
const URLS = FILES.map((file) => new URL(file, SCOPE).href);
const allowed = new Set(URLS);
const index = new URL("index.html", SCOPE).href;
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(URLS.map((url) => new Request(url, { cache: "reload" })))));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CACHE_STATUS") {
    event.waitUntil(caches.open(CACHE).then(async (cache) => {
      const ready = (await Promise.all(URLS.map((url) => cache.match(url)))).every(Boolean);
      event.ports[0]?.postMessage({ ready, version: VERSION, count: FILES.length });
    }));
  }
});
self.addEventListener("fetch", (event) => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || !url.href.startsWith(SCOPE) || url.pathname.includes("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => response.ok ? response : caches.open(CACHE).then((cache) => cache.match(index)).then((cached) => cached || response)).catch(() => caches.open(CACHE).then((cache) => cache.match(index))));
  } else if (allowed.has(url.href)) {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(request).then((cached) => cached || fetch(request))));
  }
});
