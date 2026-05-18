export const CATALOG_BACKUP_VERSION = 1;

export function createCatalogBackup({ items, profile, createdAt = new Date().toISOString() }) {
  return {
    version: CATALOG_BACKUP_VERSION,
    app: "collectible-catalog-pwa",
    createdAt,
    profile: profile || {},
    items: Array.isArray(items) ? items : []
  };
}

export function parseCatalogBackup(input) {
  const payload = typeof input === "string" ? JSON.parse(input) : input;

  if (Array.isArray(payload)) {
    return createCatalogBackup({ items: payload, profile: {} });
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Backup file is not valid.");
  }

  if (!Array.isArray(payload.items)) {
    throw new Error("Backup file does not contain catalog items.");
  }

  return createCatalogBackup({
    items: payload.items,
    profile: payload.profile || {},
    createdAt: payload.createdAt || new Date().toISOString()
  });
}
