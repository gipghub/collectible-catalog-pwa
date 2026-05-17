export const CATEGORIES = [
  "Trading Cards",
  "Coins",
  "Comics",
  "Stamps",
  "Toys",
  "Vinyl",
  "Books",
  "Art",
  "Memorabilia",
  "Other"
];

export const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Ungraded"
];

export function createCollectible(input, now = new Date()) {
  const id = input.id || crypto.randomUUID();
  const createdAt = input.createdAt || now.toISOString();

  return {
    id,
    catalogCode: input.catalogCode || createCatalogCode(now, id),
    title: cleanText(input.title, "Untitled collectible"),
    category: cleanText(input.category, "Other"),
    maker: cleanText(input.maker),
    series: cleanText(input.series),
    condition: cleanText(input.condition, "Ungraded"),
    acquisitionDate: input.acquisitionDate || "",
    purchasePrice: toNumberOrEmpty(input.purchasePrice),
    estimatedValue: toNumberOrEmpty(input.estimatedValue),
    tags: normalizeTags(input.tags),
    notes: cleanText(input.notes),
    photoDataUrl: input.photoDataUrl || "",
    comparables: Array.isArray(input.comparables) ? input.comparables : [],
    comparableCandidates: Array.isArray(input.comparableCandidates) ? input.comparableCandidates : [],
    createdAt,
    updatedAt: now.toISOString()
  };
}

export function updateCollectible(existing, input, now = new Date()) {
  return {
    ...createCollectible({ ...existing, ...input }, now),
    id: existing.id,
    catalogCode: existing.catalogCode,
    createdAt: existing.createdAt,
    updatedAt: now.toISOString()
  };
}

export function createCatalogCode(now, id) {
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const idPart = id.replaceAll("-", "").slice(0, 6).toUpperCase();
  return `COL-${datePart}-${idPart}`;
}

export function matchesCollectible(item, query, category) {
  const normalizedQuery = cleanText(query).toLowerCase();
  const matchesCategory = !category || category === "All" || item.category === category;

  if (!normalizedQuery) {
    return matchesCategory;
  }

  const searchable = [
    item.title,
    item.catalogCode,
    item.category,
    item.maker,
    item.series,
    item.condition,
    item.notes,
    item.tags.join(" ")
  ]
    .join(" ")
    .toLowerCase();

  return matchesCategory && searchable.includes(normalizedQuery);
}

export function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "No value";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function normalizeTags(value) {
  const tags = Array.isArray(value) ? value : String(value || "").split(",");

  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function toNumberOrEmpty(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : "";
}
