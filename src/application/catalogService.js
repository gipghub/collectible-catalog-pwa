import { createCollectible, matchesCollectible, updateCollectible } from "../domain/collectible.js";
import { createComparable } from "../domain/comparable.js";

export function createCatalogService(repository) {
  let items = repository.load().map((item) => createCollectible(item, new Date(item.updatedAt || Date.now())));
  const subscribers = new Set();

  function publish() {
    repository.save(items);
    subscribers.forEach((subscriber) => subscriber(getItems()));
  }

  function getItems() {
    return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  return {
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(getItems());
      return () => subscribers.delete(subscriber);
    },

    list(filters = {}) {
      return getItems().filter((item) => matchesCollectible(item, filters.search, filters.category));
    },

    getById(id) {
      return items.find((item) => item.id === id) || null;
    },

    create(input) {
      const item = createCollectible(input);
      items = [item, ...items];
      publish();
      return item;
    },

    update(id, input) {
      const existing = this.getById(id);

      if (!existing) {
        return null;
      }

      const updated = updateCollectible(existing, input);
      items = items.map((item) => (item.id === id ? updated : item));
      publish();
      return updated;
    },

    remove(id) {
      items = items.filter((item) => item.id !== id);
      publish();
    },

    addComparable(itemId, input) {
      const existing = this.getById(itemId);

      if (!existing) {
        return null;
      }

      const comparable = createComparable(input);
      const updated = updateCollectible(existing, {
        comparables: [comparable, ...existing.comparables]
      });

      items = items.map((item) => (item.id === itemId ? updated : item));
      publish();
      return comparable;
    }
  };
}
