const LEGACY_STORAGE_KEY = "collectible-catalog.records.v1";
const DATABASE_NAME = "collectible-catalog";
const DATABASE_VERSION = 1;
const ITEM_STORE = "catalogItems";

export function createCatalogRepository({
  indexedDBImpl = globalThis.indexedDB,
  legacyStorage = window.localStorage
} = {}) {
  if (!indexedDBImpl) {
    return createLocalStorageCatalogRepository(legacyStorage);
  }

  const databasePromise = openCatalogDatabase(indexedDBImpl);
  const fallbackRepository = createLocalStorageCatalogRepository(legacyStorage);

  return {
    async load() {
      try {
        const database = await databasePromise;
        const items = await getAllItems(database);

        if (items.length > 0) {
          return items;
        }

        const legacyItems = await fallbackRepository.load();

        if (legacyItems.length > 0) {
          await saveItems(database, legacyItems);
        }

        return legacyItems;
      } catch (error) {
        console.warn("IndexedDB catalog could not be loaded; using localStorage fallback.", error);
        return fallbackRepository.load();
      }
    },

    async save(items) {
      try {
        const database = await databasePromise;
        await saveItems(database, items);
      } catch (error) {
        console.warn("IndexedDB catalog could not be saved; using localStorage fallback.", error);
        await fallbackRepository.save(items);
      }
    }
  };
}

export function createLocalStorageCatalogRepository(storage = window.localStorage) {
  return {
    async load() {
      try {
        const rawCatalog = storage.getItem(LEGACY_STORAGE_KEY);
        return rawCatalog ? JSON.parse(rawCatalog) : [];
      } catch (error) {
        console.warn("Catalog could not be loaded.", error);
        return [];
      }
    },

    async save(items) {
      storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(items));
    }
  };
}

function openCatalogDatabase(indexedDBImpl) {
  return new Promise((resolve, reject) => {
    const request = indexedDBImpl.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(ITEM_STORE)) {
        database.createObjectStore(ITEM_STORE, { keyPath: "id" });
      }
    });

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
    request.addEventListener("blocked", () => reject(new Error("Catalog database upgrade is blocked.")));
  });
}

function getAllItems(database) {
  return runStoreRequest(database, "readonly", (store) => store.getAll());
}

function saveItems(database, items = []) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ITEM_STORE, "readwrite");
    const store = transaction.objectStore(ITEM_STORE);

    store.clear();
    for (const item of items) {
      store.put(item);
    }

    transaction.addEventListener("complete", () => resolve());
    transaction.addEventListener("error", () => reject(transaction.error));
    transaction.addEventListener("abort", () => reject(transaction.error || new Error("Catalog save aborted.")));
  });
}

function runStoreRequest(database, mode, createRequest) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ITEM_STORE, mode);
    const request = createRequest(transaction.objectStore(ITEM_STORE));

    request.addEventListener("success", () => resolve(request.result || []));
    request.addEventListener("error", () => reject(request.error));
    transaction.addEventListener("error", () => reject(transaction.error));
  });
}
