const STORAGE_KEY = "collectible-catalog.session.v1";

export function createSessionRepository(storage = window.localStorage) {
  return {
    load() {
      try {
        const rawSession = storage.getItem(STORAGE_KEY);
        return rawSession ? normalizeSession(JSON.parse(rawSession)) : null;
      } catch (error) {
        console.warn("Sign-in session could not be loaded.", error);
        return null;
      }
    },

    save(session) {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalizeSession(session)));
    },

    clear() {
      storage.removeItem(STORAGE_KEY);
    }
  };
}

function normalizeSession(input = {}) {
  return {
    token: cleanText(input.token),
    collectionId: cleanText(input.collectionId, "default"),
    user: {
      email: cleanText(input.user?.email),
      displayName: cleanText(input.user?.displayName, "Collector")
    }
  };
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
