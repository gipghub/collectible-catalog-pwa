const CACHE_NAME = "collectible-catalog-v14";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/styles.css",
  "./src/assets/collectibles-watermark.svg",
  "./src/main.js",
  "./src/config/appConfig.js",
  "./src/domain/collectible.js",
  "./src/domain/comparable.js",
  "./src/domain/label.js",
  "./src/application/catalogService.js",
  "./src/infrastructure/barcode.js",
  "./src/infrastructure/catalogRepository.js",
  "./src/infrastructure/imageProcessor.js",
  "./src/infrastructure/marketplaceComparableProvider.js",
  "./src/infrastructure/remoteCatalogRepository.js",
  "./src/infrastructure/syncingCatalogRepository.js",
  "./src/infrastructure/userProfileRepository.js",
  "./src/domain/userProfile.js",
  "./src/ui/appView.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
