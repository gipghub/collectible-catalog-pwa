import { createAuthService } from "./application/authService.js";
import { createCatalogController } from "./application/catalogController.js";
import { createHttpServer } from "./httpServer.js";
import { loadServerConfig } from "./infrastructure/appConfig.js";
import { createCatalogStore } from "./infrastructure/catalogStore.js";
import { createPhotoStore } from "./infrastructure/photoStore.js";

const config = loadServerConfig();
const authService = createAuthService({ demoUser: config.demoUser });
const catalogStore = createCatalogStore({ storageRoot: config.storageRoot });
const photoStore = createPhotoStore({ storageRoot: config.storageRoot });
const catalogController = createCatalogController({
  authService,
  catalogStore,
  photoStore,
  publicBaseUrl: (request) => `${request.headers["x-forwarded-proto"] || "http"}://${request.headers.host}`
});

const server = createHttpServer({
  config,
  authService,
  catalogController
});

server.listen(config.port, "127.0.0.1", () => {
  console.log(`Collectible Catalog API listening on http://127.0.0.1:${config.port}`);
});
