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
