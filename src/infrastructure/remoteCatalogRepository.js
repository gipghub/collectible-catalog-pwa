export function createRemoteCatalogRepository({
  apiBaseUrl,
  apiToken = "",
  collectionId = "default",
  syncEnabled = false,
  fetchImpl = fetch
}) {
  const baseUrl = String(apiBaseUrl || "").replace(/\/+$/, "");
  const isConfigured = Boolean(syncEnabled && baseUrl);

  return {
    isConfigured,

    async load() {
      if (!isConfigured) {
        return [];
      }

      const response = await fetchImpl(getCollectionUrl(baseUrl, collectionId), {
        headers: createHeaders(apiToken)
      });

      await assertOk(response, "Catalog sync load failed");
      const payload = await response.json();
      return Array.isArray(payload.items) ? payload.items : [];
    },

    async save(items) {
      if (!isConfigured) {
        return;
      }

      const response = await fetchImpl(getCollectionUrl(baseUrl, collectionId), {
        method: "PUT",
        headers: createHeaders(apiToken),
        body: JSON.stringify({
          collectionId,
          items,
          updatedAt: new Date().toISOString()
        })
      });

      await assertOk(response, "Catalog sync save failed");
    }
  };
}

function getCollectionUrl(baseUrl, collectionId) {
  return `${baseUrl}/collections/${encodeURIComponent(collectionId)}/items`;
}

function createHeaders(apiToken) {
  return {
    "Content-Type": "application/json",
    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
  };
}

async function assertOk(response, fallbackMessage) {
  if (response.ok) {
    return;
  }

  let message = fallbackMessage;

  try {
    const payload = await response.json();
    message = payload.message || message;
  } catch {
    message = response.statusText || message;
  }

  throw new Error(`${message} (${response.status})`);
}
