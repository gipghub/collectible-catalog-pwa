import { createCatalogRepository } from "../src/infrastructure/catalogRepository.js";

const storage = createMemoryStorage();
const fallbackRepository = createCatalogRepository({
  indexedDBImpl: null,
  legacyStorage: storage
});

await fallbackRepository.save([
  {
    id: "item-1",
    title: "Local test item",
    updatedAt: new Date().toISOString()
  }
]);

const items = await fallbackRepository.load();

assert(items.length === 1, "Repository should load saved local item.");
assert(items[0].title === "Local test item", "Repository should preserve saved item fields.");

const legacyStorage = createMemoryStorage();
legacyStorage.setItem("collectible-catalog.records.v1", JSON.stringify([
  {
    id: "legacy-item",
    title: "Migrated item",
    updatedAt: new Date().toISOString()
  }
]));

const indexedRepository = createCatalogRepository({
  indexedDBImpl: createFakeIndexedDB(),
  legacyStorage
});
const migratedItems = await indexedRepository.load();

assert(migratedItems.length === 1, "IndexedDB repository should migrate legacy items.");
assert(migratedItems[0].title === "Migrated item", "Migrated item should preserve fields.");

await indexedRepository.save([
  {
    id: "indexed-item",
    title: "Indexed item",
    updatedAt: new Date().toISOString()
  }
]);

const indexedItems = await indexedRepository.load();
assert(indexedItems.length === 1, "IndexedDB repository should save one current item.");
assert(indexedItems[0].title === "Indexed item", "IndexedDB repository should load saved item.");

console.log("catalog-repository-smoke ok");

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function createFakeIndexedDB() {
  const databases = new Map();

  return {
    open(name) {
      const request = createRequest();

      queueMicrotask(() => {
        const isNewDatabase = !databases.has(name);
        const database = isNewDatabase ? createFakeDatabase() : databases.get(name);
        databases.set(name, database);
        request.result = database;

        if (isNewDatabase) {
          request.emit("upgradeneeded");
        }

        request.emit("success");
      });

      return request;
    }
  };
}

function createFakeDatabase() {
  const stores = new Map();

  return {
    objectStoreNames: {
      contains(name) {
        return stores.has(name);
      }
    },
    createObjectStore(name) {
      stores.set(name, new Map());
    },
    transaction(name) {
      const store = stores.get(name);
      const transaction = createEventTarget({ error: null });
      transaction.objectStore = () => createFakeStore(store);
      queueMicrotask(() => transaction.emit("complete"));
      return transaction;
    }
  };
}

function createFakeStore(items) {
  return {
    getAll() {
      const request = createRequest();
      queueMicrotask(() => {
        request.result = [...items.values()];
        request.emit("success");
      });
      return request;
    },
    clear() {
      items.clear();
      return createSuccessfulRequest();
    },
    put(item) {
      items.set(item.id, item);
      return createSuccessfulRequest();
    }
  };
}

function createSuccessfulRequest() {
  const request = createRequest();
  queueMicrotask(() => request.emit("success"));
  return request;
}

function createRequest() {
  return createEventTarget({
    error: null,
    result: undefined
  });
}

function createEventTarget(target) {
  const listeners = new Map();

  return {
    ...target,
    addEventListener(type, callback) {
      listeners.set(type, [...(listeners.get(type) || []), callback]);
    },
    emit(type) {
      for (const callback of listeners.get(type) || []) {
        callback();
      }
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
