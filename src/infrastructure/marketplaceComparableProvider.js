import { buildComparableQuery, createComparableCandidate } from "../domain/comparable.js";

const ENDPOINT_STORAGE_KEY = "collectible-catalog.comparableEndpoint.v1";
const PRICECHARTING_TOKEN_STORAGE_KEY = "collectible-catalog.priceChartingToken.v1";
const PRICECHARTING_PRODUCT_API = "https://www.pricecharting.com/api/product";
const PRICECHARTING_SEARCH_URL = "https://www.pricecharting.com/search-products";
const PRICECHARTING_PRICE_FIELDS = [
  { key: "loose-price", label: "Loose/Ungraded" },
  { key: "cib-price", label: "Complete" },
  { key: "new-price", label: "New/Sealed" },
  { key: "graded-price", label: "Graded" },
  { key: "box-only-price", label: "Box only" },
  { key: "manual-only-price", label: "Manual only" }
];

export function createMarketplaceComparableProvider(storage = window.localStorage, fetcher = window.fetch.bind(window)) {
  return {
    getEndpoint() {
      return storage.getItem(ENDPOINT_STORAGE_KEY) || "";
    },

    setEndpoint(endpoint) {
      const cleanEndpoint = String(endpoint || "").trim();

      if (cleanEndpoint) {
        storage.setItem(ENDPOINT_STORAGE_KEY, cleanEndpoint);
      } else {
        storage.removeItem(ENDPOINT_STORAGE_KEY);
      }
    },

    getPriceChartingToken() {
      return storage.getItem(PRICECHARTING_TOKEN_STORAGE_KEY) || "";
    },

    setPriceChartingToken(token) {
      const cleanToken = String(token || "").trim();

      if (cleanToken) {
        storage.setItem(PRICECHARTING_TOKEN_STORAGE_KEY, cleanToken);
      } else {
        storage.removeItem(PRICECHARTING_TOKEN_STORAGE_KEY);
      }
    },

    buildLinks(item) {
      const query = buildComparableQuery(item);
      const encodedQuery = encodeURIComponent(query);

      return [
        {
          name: "eBay sold",
          url: `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}&LH_Sold=1&LH_Complete=1`
        },
        {
          name: "Google Shopping",
          url: `https://www.google.com/search?tbm=shop&q=${encodedQuery}`
        },
        {
          name: "Etsy",
          url: `https://www.etsy.com/search?q=${encodedQuery}`
        },
        {
          name: "Mercari",
          url: `https://www.mercari.com/search/?keyword=${encodedQuery}`
        },
        {
          name: "WorthPoint",
          url: `https://www.worthpoint.com/inventory/search?query=${encodedQuery}`
        }
      ];
    },

    async scanCandidates(item) {
      const endpoint = this.getEndpoint();
      const priceChartingToken = this.getPriceChartingToken();

      if (!endpoint && !priceChartingToken) {
        return createDemoCandidates(item);
      }

      const providerScans = [];

      if (priceChartingToken) {
        providerScans.push(scanPriceChartingCandidates(priceChartingToken, item, fetcher));
      }

      if (endpoint) {
        providerScans.push(scanEndpointCandidates(endpoint, item, fetcher));
      }

      const settledScans = await Promise.allSettled(providerScans);
      const successfulScans = settledScans.filter((scan) => scan.status === "fulfilled");

      if (successfulScans.length > 0) {
        return successfulScans.flatMap((scan) => scan.value);
      }

      const errors = settledScans
        .filter((scan) => scan.status === "rejected")
        .map((scan) => scan.reason?.message || "Provider scan failed.");

      throw new Error(errors.join(" "));
    }
  };
}

async function scanEndpointCandidates(endpoint, item, fetcher) {
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      query: buildComparableQuery(item),
      item: {
        catalogCode: item.catalogCode,
        title: item.title,
        category: item.category,
        maker: item.maker,
        series: item.series,
        condition: item.condition,
        tags: item.tags
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Comparable provider returned ${response.status}.`);
  }

  const payload = await response.json();
  const rawCandidates = Array.isArray(payload) ? payload : payload.candidates;

  if (!Array.isArray(rawCandidates)) {
    throw new Error("Comparable provider response must include a candidates array.");
  }

  return rawCandidates.map((candidate) => createComparableCandidate({
    providerItemId: candidate.providerItemId || candidate.id,
    source: candidate.source || payload.source || endpointHost(endpoint),
    title: candidate.title,
    price: candidate.price || candidate.soldPrice,
    url: candidate.url,
    soldAt: candidate.soldAt || candidate.soldDate,
    condition: candidate.condition,
    confidence: candidate.confidence,
    matchNotes: candidate.matchNotes || candidate.notes
  }));
}

async function scanPriceChartingCandidates(token, item, fetcher) {
  const query = buildComparableQuery(item);
  const requestUrl = new URL(PRICECHARTING_PRODUCT_API);
  requestUrl.searchParams.set("t", token);
  requestUrl.searchParams.set("q", query);

  const response = await fetcher(requestUrl.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`PriceCharting returned ${response.status}.`);
  }

  const payload = await response.json();

  if (payload.status && payload.status !== "success") {
    throw new Error(payload["error-message"] || "PriceCharting did not return a matching product.");
  }

  const productName = payload["product-name"] || payload.name || "";
  const productId = payload.id || productName;

  if (!productName) {
    return [];
  }

  const productUrl = createPriceChartingSearchUrl(productName || query);
  const priceRows = PRICECHARTING_PRICE_FIELDS
    .map((field, index) => ({
      ...field,
      index,
      price: centsToDollars(payload[field.key])
    }))
    .filter((field) => field.price > 0)
    .sort((left, right) =>
      conditionRank(item.condition, left.key, left.index) - conditionRank(item.condition, right.key, right.index)
    )
    .slice(0, 5);

  return priceRows.map((row, index) => createComparableCandidate({
    providerItemId: `pricecharting-${productId}-${row.key}`,
    source: "PriceCharting",
    title: [productName, payload["console-name"], row.label].filter(Boolean).join(" - "),
    price: row.price,
    url: productUrl,
    condition: row.label,
    confidence: calculatePriceChartingConfidence(item, payload, index),
    matchNotes: "PriceCharting guide value. Review condition and category before accepting."
  }));
}

function createDemoCandidates(item) {
  const anchorPrice = Number(item.estimatedValue || item.purchasePrice || 45);
  const basePrice = Number.isFinite(anchorPrice) && anchorPrice > 0 ? anchorPrice : 45;
  const query = encodeURIComponent(buildComparableQuery(item));
  const months = [1, 2, 4];
  const multipliers = [0.84, 1.02, 1.18];

  return multipliers.map((multiplier, index) => {
    const soldAt = new Date();
    soldAt.setMonth(soldAt.getMonth() - months[index]);

    return createComparableCandidate({
      providerItemId: `demo-${item.id}-${index}`,
      source: "Demo estimate",
      title: `${item.title} ${index === 0 ? "similar condition" : index === 1 ? "close match" : "strong recent sale"}`,
      price: Math.round(basePrice * multiplier),
      url: `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Sold=1&LH_Complete=1`,
      soldAt: soldAt.toISOString().slice(0, 10),
      condition: item.condition,
      confidence: [72, 84, 78][index],
      matchNotes: "Demo candidate. Connect an approved provider endpoint for real sold-listing data."
    });
  });
}

function centsToDollars(value) {
  const cents = Number(value);

  if (!Number.isFinite(cents) || cents <= 0) {
    return 0;
  }

  return Math.round(cents) / 100;
}

function conditionRank(condition, priceKey, fallbackRank) {
  const normalizedCondition = String(condition || "").toLowerCase();
  const isNearMint = normalizedCondition.includes("near mint");
  const lowerGrade = normalizedCondition.includes("ungraded")
    || normalizedCondition.includes("good")
    || normalizedCondition.includes("fair")
    || normalizedCondition.includes("poor");
  let preferredKeys = ["cib-price", "loose-price", "new-price", "graded-price", "box-only-price", "manual-only-price"];

  if (normalizedCondition.includes("mint") && !isNearMint) {
    preferredKeys = ["new-price", "graded-price", "cib-price", "loose-price", "box-only-price", "manual-only-price"];
  } else if (lowerGrade) {
    preferredKeys = ["loose-price", "cib-price", "new-price", "graded-price", "box-only-price", "manual-only-price"];
  } else if (normalizedCondition.includes("graded")) {
    preferredKeys = ["graded-price", "new-price", "cib-price", "loose-price", "box-only-price", "manual-only-price"];
  }

  const preferredRank = preferredKeys.indexOf(priceKey);

  return preferredRank === -1 ? fallbackRank + preferredKeys.length : preferredRank;
}

function calculatePriceChartingConfidence(item, product, resultIndex) {
  const itemTitle = String(item.title || "").toLowerCase();
  const productTitle = String(product["product-name"] || "").toLowerCase();
  const titleBoost = itemTitle && productTitle.includes(itemTitle) ? 8 : 0;

  return Math.max(58, 88 + titleBoost - (resultIndex * 7));
}

function createPriceChartingSearchUrl(query) {
  const url = new URL(PRICECHARTING_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("type", "prices");
  return url.toString();
}

function endpointHost(endpoint) {
  try {
    return new URL(endpoint).host;
  } catch {
    return "Provider";
  }
}
