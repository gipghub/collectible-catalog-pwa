import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAuthService } from "../server/application/authService.js";
import { createCatalogController } from "../server/application/catalogController.js";
import { createHttpServer } from "../server/httpServer.js";
import { createCatalogStore } from "../server/infrastructure/catalogStore.js";
import { createPhotoStore } from "../server/infrastructure/photoStore.js";

const storageRoot = await mkdtemp(join(tmpdir(), "collectible-api-"));
const config = {
  storageRoot,
  corsOrigin: "*",
  demoUser: {
    email: "collector@example.com",
    password: "catalog-demo",
    token: "dev-local-token",
    displayName: "Family Collector",
    collectionIds: ["family-collection"]
  }
};

const authService = createAuthService({ demoUser: config.demoUser });
const catalogStore = createCatalogStore({ storageRoot });
const photoStore = createPhotoStore({ storageRoot });
const server = createHttpServer({
  config,
  authService,
  catalogController: createCatalogController({
    authService,
    catalogStore,
    photoStore,
    publicBaseUrl: (request) => `http://${request.headers.host}`
  })
});

try {
  const baseUrl = await listen(server);
  const login = await postJson(`${baseUrl}/auth/login`, {
    email: "collector@example.com",
    password: "catalog-demo"
  });

  assert(login.token === "dev-local-token", "Login should return the demo token.");

  await putJson(`${baseUrl}/collections/family-collection/items`, {
    items: [{ id: "item-1", title: "Test coin", updatedAt: new Date().toISOString() }]
  }, login.token);

  const catalog = await getJson(`${baseUrl}/collections/family-collection/items`, login.token);
  assert(catalog.items.length === 1, "Saved catalog item should load.");

  const photo = await postJson(`${baseUrl}/collections/family-collection/photos`, {
    fileName: "photo.jpg",
    dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w=="
  }, login.token, 201);

  assert(photo.url.includes("/uploads/family-collection/"), "Photo upload should return a public URL.");
  console.log("backend-smoke ok");
} finally {
  server.close();
  await rm(storageRoot, { recursive: true, force: true });
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

async function getJson(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert(response.ok, `GET ${url} failed with ${response.status}`);
  return response.json();
}

async function postJson(url, body, token = "", expectedStatus = 200) {
  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(token),
    body: JSON.stringify(body)
  });
  assert(response.status === expectedStatus, `POST ${url} failed with ${response.status}`);
  return response.json();
}

async function putJson(url, body, token) {
  const response = await fetch(url, {
    method: "PUT",
    headers: createHeaders(token),
    body: JSON.stringify(body)
  });
  assert(response.ok, `PUT ${url} failed with ${response.status}`);
  return response.json();
}

function createHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
