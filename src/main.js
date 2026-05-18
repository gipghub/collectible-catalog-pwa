import { createCatalogService } from "./application/catalogService.js";
import { loadAppConfig } from "./config/appConfig.js";
import { createCatalogRepository } from "./infrastructure/catalogRepository.js";
import { createRemoteCatalogRepository } from "./infrastructure/remoteCatalogRepository.js";
import { createSyncingCatalogRepository } from "./infrastructure/syncingCatalogRepository.js";
import { createConfiguredImageReader } from "./infrastructure/imageProcessor.js";
import { createMarketplaceComparableProvider } from "./infrastructure/marketplaceComparableProvider.js";
import { createCode128BarcodeSvg } from "./infrastructure/barcode.js";
import { createUserProfileRepository } from "./infrastructure/userProfileRepository.js";
import { mountApp } from "./ui/appView.js";

const appConfig = loadAppConfig();
const catalogRepository = createSyncingCatalogRepository({
  localRepository: createCatalogRepository(),
  remoteRepository: createRemoteCatalogRepository(appConfig)
});
const service = createCatalogService(catalogRepository);

mountApp({
  root: document.querySelector("#app"),
  service,
  profileRepository: createUserProfileRepository(),
  imageReader: createConfiguredImageReader({ appConfig }),
  comparableProvider: createMarketplaceComparableProvider(),
  createBarcodeSvg: createCode128BarcodeSvg
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.info("Offline cache is unavailable.", error);
  });
}
