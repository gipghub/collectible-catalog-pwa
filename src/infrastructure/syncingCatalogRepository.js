const LOCAL_STATUS = {
  mode: "local",
  isSyncing: false,
  lastSyncedAt: "",
  pendingChanges: false,
  error: ""
};

export function createSyncingCatalogRepository({
  localRepository,
  remoteRepository,
  clock = () => new Date()
}) {
  const subscribers = new Set();
  let syncStatus = {
    ...LOCAL_STATUS,
    mode: remoteRepository?.isConfigured ? "ready" : "local"
  };
  let activeSync = null;

  function setSyncStatus(patch) {
    syncStatus = { ...syncStatus, ...patch };
    subscribers.forEach((subscriber) => subscriber(getSyncStatus()));
  }

  function getSyncStatus() {
    return { ...syncStatus };
  }

  async function syncItems(items = null) {
    const localItems = items || await localRepository.load();

    if (!remoteRepository?.isConfigured) {
      setSyncStatus({ mode: "local", isSyncing: false, pendingChanges: false, error: "" });
      return localItems;
    }

    if (activeSync) {
      return activeSync;
    }

    setSyncStatus({ mode: "syncing", isSyncing: true, error: "" });

    activeSync = remoteRepository.load()
      .then((remoteItems) => {
        const mergedItems = mergeCatalogItems(localItems, remoteItems);
        return Promise.resolve(localRepository.save(mergedItems))
          .then(() => remoteRepository.save(mergedItems))
          .then(() => mergedItems);
      })
      .then((mergedItems) => {
        setSyncStatus({
          mode: "synced",
          isSyncing: false,
          lastSyncedAt: clock().toISOString(),
          pendingChanges: false,
          error: ""
        });
        return mergedItems;
      })
      .catch((error) => {
        setSyncStatus({
          mode: "error",
          isSyncing: false,
          pendingChanges: true,
          error: error.message || "Catalog sync failed."
        });
        return localItems;
      })
      .finally(() => {
        activeSync = null;
      });

    return activeSync;
  }

  return {
    async load() {
      return localRepository.load();
    },

    save(items) {
      Promise.resolve(localRepository.save(items)).catch((error) => {
        setSyncStatus({
          mode: "error",
          isSyncing: false,
          pendingChanges: true,
          error: error.message || "Local catalog save failed."
        });
      });

      if (!remoteRepository?.isConfigured) {
        setSyncStatus({ mode: "local", pendingChanges: false, error: "" });
        return;
      }

      setSyncStatus({ mode: "pending", pendingChanges: true, error: "" });
      queueMicrotask(() => syncItems(items));
    },

    syncNow(items) {
      return syncItems(items);
    },

    getSyncStatus,

    subscribeSyncStatus(subscriber) {
      subscribers.add(subscriber);
      subscriber(getSyncStatus());
      return () => subscribers.delete(subscriber);
    }
  };
}

export function mergeCatalogItems(localItems = [], remoteItems = []) {
  const itemsById = new Map();

  for (const item of [...remoteItems, ...localItems]) {
    const existing = itemsById.get(item.id);

    if (!existing || isNewer(item, existing)) {
      itemsById.set(item.id, item);
    }
  }

  return [...itemsById.values()].sort((left, right) =>
    getTime(right.updatedAt) - getTime(left.updatedAt)
  );
}

function isNewer(candidate, existing) {
  return getTime(candidate.updatedAt) >= getTime(existing.updatedAt);
}

function getTime(value) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}
