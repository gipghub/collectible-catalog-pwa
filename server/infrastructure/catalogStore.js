import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "./jsonStore.js";

export function createCatalogStore({ storageRoot }) {
  const catalogRoot = join(storageRoot, "catalogs");

  return {
    async load(collectionId) {
      const payload = await readJsonFile(getCatalogPath(catalogRoot, collectionId), {
        collectionId,
        items: [],
        updatedAt: ""
      });

      return {
        collectionId,
        items: Array.isArray(payload.items) ? payload.items : [],
        updatedAt: payload.updatedAt || ""
      };
    },

    async save(collectionId, items) {
      const payload = {
        collectionId,
        items: Array.isArray(items) ? items : [],
        updatedAt: new Date().toISOString()
      };

      await writeJsonFile(getCatalogPath(catalogRoot, collectionId), payload);
      return payload;
    }
  };
}

function getCatalogPath(catalogRoot, collectionId) {
  return join(catalogRoot, `${safePathPart(collectionId)}.json`);
}

function safePathPart(value) {
  return String(value || "default").replace(/[^a-z0-9_-]/gi, "-").slice(0, 80);
}
