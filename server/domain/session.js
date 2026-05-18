export function createSession({ token, email, displayName, collectionIds }) {
  return {
    token: cleanText(token),
    email: cleanText(email),
    displayName: cleanText(displayName, "Collector"),
    collectionIds: normalizeCollectionIds(collectionIds)
  };
}

export function canAccessCollection(session, collectionId) {
  return session?.collectionIds.includes(collectionId);
}

function normalizeCollectionIds(value) {
  const collectionIds = Array.isArray(value) ? value : [value];

  return collectionIds
    .map((collectionId) => cleanText(collectionId))
    .filter(Boolean);
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
