export function createComparable(input, now = new Date()) {
  return {
    id: input.id || crypto.randomUUID(),
    source: cleanText(input.source, "Manual"),
    title: cleanText(input.title, "Comparable sale"),
    price: toNumber(input.price),
    url: cleanText(input.url),
    soldAt: input.soldAt || "",
    notes: cleanText(input.notes),
    createdAt: input.createdAt || now.toISOString()
  };
}

export function createComparableCandidate(input, now = new Date()) {
  return {
    id: input.id || crypto.randomUUID(),
    providerItemId: cleanText(input.providerItemId),
    source: cleanText(input.source, "Provider"),
    title: cleanText(input.title, "Comparable candidate"),
    price: toNumber(input.price),
    url: cleanText(input.url),
    soldAt: input.soldAt || "",
    condition: cleanText(input.condition),
    confidence: clampConfidence(input.confidence),
    matchNotes: cleanText(input.matchNotes),
    status: normalizeCandidateStatus(input.status),
    createdAt: input.createdAt || now.toISOString(),
    reviewedAt: input.reviewedAt || ""
  };
}

export function candidateToComparable(candidate, now = new Date()) {
  return createComparable({
    source: candidate.source,
    title: candidate.title,
    price: candidate.price,
    url: candidate.url,
    soldAt: candidate.soldAt,
    notes: candidate.matchNotes,
    createdAt: now.toISOString()
  }, now);
}

export function buildComparableQuery(item) {
  return [item.title, item.maker, item.series, item.category]
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join(" ");
}

export function summarizeComparables(comparables) {
  const prices = comparables
    .map((comparable) => Number(comparable.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) {
    return {
      count: 0,
      low: null,
      high: null,
      average: null
    };
  }

  const total = prices.reduce((sum, price) => sum + price, 0);

  return {
    count: prices.length,
    low: Math.min(...prices),
    high: Math.max(...prices),
    average: total / prices.length
  };
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function toNumber(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function clampConfidence(value) {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

function normalizeCandidateStatus(value) {
  return ["pending", "accepted", "rejected"].includes(value) ? value : "pending";
}
