import { resolve } from "node:path";

const DEFAULT_PORT = 8787;
const DEFAULT_COLLECTION_ID = "family-collection";

export function loadServerConfig(env = process.env) {
  const storageRoot = resolve(env.COLLECTIBLE_STORAGE_DIR || "server/storage");
  const demoEmail = cleanText(env.COLLECTIBLE_DEMO_EMAIL, "collector@example.com");
  const demoPassword = cleanText(env.COLLECTIBLE_DEMO_PASSWORD, "catalog-demo");
  const demoToken = cleanText(env.COLLECTIBLE_DEMO_TOKEN, "dev-local-token");
  const defaultCollectionId = cleanText(env.COLLECTIBLE_COLLECTION_ID, DEFAULT_COLLECTION_ID);

  return {
    port: toPort(env.PORT, DEFAULT_PORT),
    storageRoot,
    corsOrigin: cleanText(env.COLLECTIBLE_CORS_ORIGIN, "*"),
    defaultCollectionId,
    demoUser: {
      email: demoEmail,
      password: demoPassword,
      token: demoToken,
      displayName: cleanText(env.COLLECTIBLE_DEMO_NAME, "Family Collector"),
      collectionIds: [defaultCollectionId]
    }
  };
}

function toPort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
