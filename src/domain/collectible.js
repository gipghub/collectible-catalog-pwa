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

export const CATALOG_SORT_OPTIONS = [
  { value: "updated-desc", label: "Recently updated" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "category-asc", label: "Category" },
  { value: "maker-asc", label: "Maker" },
  { value: "value-desc", label: "Value high to low" },
  { value: "value-asc", label: "Value low to high" },
  { value: "acquired-desc", label: "Acquired newest" }
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

export function sortCollectibles(items, sortBy = "updated-desc") {
  const sortOption = CATALOG_SORT_OPTIONS.some((option) => option.value === sortBy) ? sortBy : "updated-desc";
  const sortedItems = [...items];

  return sortedItems.sort((left, right) => {
    if (sortOption === "title-asc") {
      return compareText(left.title, right.title) || compareText(left.catalogCode, right.catalogCode);
    }

    if (sortOption === "title-desc") {
      return compareText(right.title, left.title) || compareText(left.catalogCode, right.catalogCode);
    }

    if (sortOption === "category-asc") {
      return compareText(left.category, right.category)
        || compareText(left.title, right.title)
        || compareText(left.catalogCode, right.catalogCode);
    }

    if (sortOption === "maker-asc") {
      return compareText(left.maker, right.maker)
        || compareText(left.title, right.title)
        || compareText(left.catalogCode, right.catalogCode);
    }

    if (sortOption === "value-desc") {
      return compareMoney(left.estimatedValue, right.estimatedValue, "desc")
        || compareText(left.title, right.title)
        || compareText(left.catalogCode, right.catalogCode);
    }

    if (sortOption === "value-asc") {
      return compareMoney(left.estimatedValue, right.estimatedValue, "asc")
        || compareText(left.title, right.title)
        || compareText(left.catalogCode, right.catalogCode);
    }

    if (sortOption === "acquired-desc") {
      return compareDate(left.acquisitionDate, right.acquisitionDate, "desc")
        || compareText(left.title, right.title)
        || compareText(left.catalogCode, right.catalogCode);
    }

    return compareDate(left.updatedAt, right.updatedAt, "desc")
      || compareText(left.title, right.title)
      || compareText(left.catalogCode, right.catalogCode);
  });
}

export function formatMoney(value, currency = "USD") {
  const amount = toMoneyNumber(value);

  if (amount === null) {
    return "No value";
  }

  const fractionDigits = Number.isInteger(amount) ? 0 : 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(amount);
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function compareText(leftValue, rightValue) {
  return cleanText(leftValue).localeCompare(cleanText(rightValue), undefined, {
    sensitivity: "base",
    numeric: true
  });
}

function compareMoney(leftValue, rightValue, direction) {
  const leftAmount = toMoneyNumber(leftValue);
  const rightAmount = toMoneyNumber(rightValue);
  const leftHasValue = leftAmount !== null;
  const rightHasValue = rightAmount !== null;

  if (!leftHasValue && !rightHasValue) {
    return 0;
  }

  if (!leftHasValue) {
    return 1;
  }

  if (!rightHasValue) {
    return -1;
  }

  return direction === "desc" ? rightAmount - leftAmount : leftAmount - rightAmount;
}

function toMoneyNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function compareDate(leftValue, rightValue, direction) {
  const leftTime = Date.parse(leftValue);
  const rightTime = Date.parse(rightValue);
  const leftHasValue = Number.isFinite(leftTime);
  const rightHasValue = Number.isFinite(rightTime);

  if (!leftHasValue && !rightHasValue) {
    return 0;
  }

  if (!leftHasValue) {
    return 1;
  }

  if (!rightHasValue) {
    return -1;
  }

  return direction === "desc" ? rightTime - leftTime : leftTime - rightTime;
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
