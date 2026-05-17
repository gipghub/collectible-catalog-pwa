const STORAGE_KEY = "collectible-catalog.records.v1";

export function createCatalogRepository(storage = window.localStorage) {
  return {
    load() {
      try {
        const rawCatalog = storage.getItem(STORAGE_KEY);
        return rawCatalog ? JSON.parse(rawCatalog) : [];
      } catch (error) {
        console.warn("Catalog could not be loaded.", error);
        return [];
      }
    },

    save(items) {
      storage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  };
}
