import { buildComparableQuery, createComparableCandidate } from "../domain/comparable.js";

const ENDPOINT_STORAGE_KEY = "collectible-catalog.comparableEndpoint.v1";

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

      if (!endpoint) {
        return createDemoCandidates(item);
      }

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
  };
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

function endpointHost(endpoint) {
  try {
    return new URL(endpoint).host;
  } catch {
    return "Provider";
  }
}
