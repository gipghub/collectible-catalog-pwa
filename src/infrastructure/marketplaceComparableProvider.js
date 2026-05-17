import { buildComparableQuery } from "../domain/comparable.js";

export function createMarketplaceComparableProvider() {
  return {
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
    }
  };
}
