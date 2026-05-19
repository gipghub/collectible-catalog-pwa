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

export function createBackupPreview(backup, currentItems = []) {
  const items = Array.isArray(backup.items) ? backup.items : [];
  const current = Array.isArray(currentItems) ? currentItems : [];

  return {
    createdAt: backup.createdAt || "",
    itemCount: items.length,
    currentItemCount: current.length,
    photoCount: items.filter((item) => Boolean(item.photoDataUrl)).length,
    profileName: cleanPreviewText(backup.profile?.displayName || backup.profile?.collectionName),
    sampleTitles: items.slice(0, 4).map((item) => cleanPreviewText(item.title, "Untitled item"))
  };
}

function cleanPreviewText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
