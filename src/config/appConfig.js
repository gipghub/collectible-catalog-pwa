const DEFAULT_CONFIG = {
  apiBaseUrl: "",
  apiToken: "",
  collectionId: "default",
  syncEnabled: false
};

export function loadAppConfig(source = globalThis.COLLECTIBLE_APP_CONFIG || {}) {
  const apiBaseUrl = cleanUrl(source.apiBaseUrl);
  const apiToken = cleanText(source.apiToken);
  const collectionId = cleanText(source.collectionId, DEFAULT_CONFIG.collectionId);
  const syncEnabled = Boolean(source.syncEnabled && apiBaseUrl);

  return {
    ...DEFAULT_CONFIG,
    apiBaseUrl,
    apiToken,
    collectionId,
    syncEnabled
  };
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function cleanUrl(value) {
  return cleanText(value).replace(/\/+$/, "");
}
