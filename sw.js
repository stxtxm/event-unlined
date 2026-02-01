const CACHE_NAME = "event-unlined-v1";
const urlsToCache = [
  "/event-unlined/",
  "/event-unlined/eventunlined-logo.svg",
  "/event-unlined/manifest.json",
  "/event-unlined/server-config.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
