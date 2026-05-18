import { createCatalogService } from "./application/catalogService.js";
import { loadAppConfig } from "./config/appConfig.js";
import { createCatalogRepository } from "./infrastructure/catalogRepository.js";
import { createRemoteCatalogRepository } from "./infrastructure/remoteCatalogRepository.js";
import { createSyncingCatalogRepository } from "./infrastructure/syncingCatalogRepository.js";
import { createAuthClient } from "./infrastructure/authClient.js";
import { createConfiguredImageReader } from "./infrastructure/imageProcessor.js";
import { createMarketplaceComparableProvider } from "./infrastructure/marketplaceComparableProvider.js";
import { createCode128BarcodeSvg } from "./infrastructure/barcode.js";
import { createSessionRepository } from "./infrastructure/sessionRepository.js";
import { createUserProfileRepository } from "./infrastructure/userProfileRepository.js";
import { mountApp } from "./ui/appView.js";

const appConfig = loadAppConfig();
const sessionRepository = createSessionRepository();
const savedSession = sessionRepository.load();

if (savedSession?.token && appConfig.apiBaseUrl) {
  appConfig.apiToken = savedSession.token;
  appConfig.collectionId = savedSession.collectionId || appConfig.collectionId;
}

const catalogRepository = createSyncingCatalogRepository({
  localRepository: createCatalogRepository(),
  remoteRepository: createRemoteCatalogRepository(appConfig)
});
const service = createCatalogService(catalogRepository);

mountApp({
  root: document.querySelector("#app"),
  appConfig,
  authClient: createAuthClient(appConfig),
  sessionRepository,
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
