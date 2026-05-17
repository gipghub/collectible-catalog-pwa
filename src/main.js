import { createCatalogService } from "./application/catalogService.js";
import { createCatalogRepository } from "./infrastructure/catalogRepository.js";
import { readImageAsDataUrl } from "./infrastructure/imageProcessor.js";
import { createMarketplaceComparableProvider } from "./infrastructure/marketplaceComparableProvider.js";
import { createCode128BarcodeSvg } from "./infrastructure/barcode.js";
import { mountApp } from "./ui/appView.js";

const service = createCatalogService(createCatalogRepository());

mountApp({
  root: document.querySelector("#app"),
  service,
  imageReader: readImageAsDataUrl,
  comparableProvider: createMarketplaceComparableProvider(),
  createBarcodeSvg: createCode128BarcodeSvg
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.info("Offline cache is unavailable.", error);
  });
}
