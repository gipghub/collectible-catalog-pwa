import {
  createCollectible,
  matchesCollectible,
  sortCollectibles,
  updateCollectible
} from "../domain/collectible.js";
import {
  candidateToComparable,
  createComparable,
  createComparableCandidate
} from "../domain/comparable.js";

export function createCatalogService(repository) {
  let items = repository.load().map((item) => createCollectible(item, new Date(item.updatedAt || Date.now())));
  const subscribers = new Set();

  function publish() {
    repository.save(items);
    subscribers.forEach((subscriber) => subscriber(getItems()));
  }

  function getItems() {
    return sortCollectibles(items);
  }

  return {
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(getItems());
      return () => subscribers.delete(subscriber);
    },

    list(filters = {}) {
      const filteredItems = items.filter((item) => matchesCollectible(item, filters.search, filters.category));
      return sortCollectibles(filteredItems, filters.sortBy);
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
    },

    addComparableCandidates(itemId, inputs) {
      const existing = this.getById(itemId);

      if (!existing) {
        return [];
      }

      const candidates = inputs.map((input) => createComparableCandidate(input));
      const comparableCandidates = mergeCandidates(existing.comparableCandidates, candidates);
      const updated = updateCollectible(existing, { comparableCandidates });

      items = items.map((item) => (item.id === itemId ? updated : item));
      publish();
      return candidates;
    },

    acceptComparableCandidate(itemId, candidateId) {
      const existing = this.getById(itemId);
      const candidate = existing?.comparableCandidates.find((item) => item.id === candidateId);

      if (!existing || !candidate || candidate.status === "accepted") {
        return null;
      }

      const now = new Date();
      const comparable = candidateToComparable(candidate, now);
      const comparableCandidates = existing.comparableCandidates.map((item) =>
        item.id === candidateId
          ? { ...item, status: "accepted", reviewedAt: now.toISOString() }
          : item
      );
      const updated = updateCollectible(existing, {
        comparables: [comparable, ...existing.comparables],
        comparableCandidates
      });

      items = items.map((item) => (item.id === itemId ? updated : item));
      publish();
      return comparable;
    },

    rejectComparableCandidate(itemId, candidateId) {
      const existing = this.getById(itemId);

      if (!existing) {
        return null;
      }

      const now = new Date();
      const comparableCandidates = existing.comparableCandidates.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, status: "rejected", reviewedAt: now.toISOString() }
          : candidate
      );
      const updated = updateCollectible(existing, { comparableCandidates });

      items = items.map((item) => (item.id === itemId ? updated : item));
      publish();
      return updated;
    }
  };
}

function mergeCandidates(existingCandidates = [], newCandidates = []) {
  const reviewedCandidates = existingCandidates.filter((candidate) => candidate.status !== "pending");
  const pendingCandidates = existingCandidates.filter((candidate) => candidate.status === "pending");
  const mergedPending = [...newCandidates, ...pendingCandidates];
  const seen = new Set();

  return [...reviewedCandidates, ...mergedPending].filter((candidate) => {
    const key = candidate.providerItemId || candidate.url || `${candidate.title}-${candidate.price}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
