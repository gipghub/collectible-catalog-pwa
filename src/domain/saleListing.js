export const SALE_CHANNELS = [
  {
    id: "facebook",
    name: "Facebook Marketplace",
    url: "https://www.facebook.com/marketplace/create/item"
  },
  {
    id: "ebay",
    name: "eBay",
    url: "https://www.ebay.com/sl/sell"
  },
  {
    id: "craigslist",
    name: "Craigslist",
    url: "https://www.craigslist.org/about/sites"
  },
  {
    id: "offerup",
    name: "OfferUp",
    url: "https://offerup.com/"
  },
  {
    id: "nextdoor",
    name: "Nextdoor",
    url: "https://nextdoor.com/for_sale_and_free/"
  }
];

export function createSaleListing(item, { currency = "USD", formatMoney } = {}) {
  const price = getListingPrice(item);
  const priceLabel = price === null
    ? "Make offer"
    : formatMoney
      ? formatMoney(price, currency)
      : `$${price}`;
  const title = [item.title, item.category].filter(Boolean).join(" - ");
  const details = [
    `Category: ${item.category || "Collectible"}`,
    `Condition: ${item.condition || "Ungraded"}`,
    item.maker ? `Maker/brand: ${item.maker}` : "",
    item.series ? `Series/set: ${item.series}` : "",
    item.saleNotes ? `Sale notes: ${item.saleNotes}` : "",
    item.notes ? `Item notes: ${item.notes}` : ""
  ].filter(Boolean);
  const descriptionLines = [
    item.title,
    "",
    `Price: ${priceLabel}`,
    ...details,
    "",
    "Local pickup. Cash preferred unless otherwise arranged.",
    `Catalog code: ${item.catalogCode}`
  ];

  return {
    title,
    price,
    priceLabel,
    description: descriptionLines.join("\n"),
    shareText: `${title}\n${priceLabel}\n${details.join("\n")}`,
    channels: SALE_CHANNELS.map((channel) => ({
      ...channel,
      url: getChannelUrl(channel, title)
    }))
  };
}

function getListingPrice(item) {
  const askingPrice = toMoneyNumber(item.askingPrice);

  if (askingPrice !== null) {
    return askingPrice;
  }

  return toMoneyNumber(item.estimatedValue);
}

function getChannelUrl(channel, title) {
  if (channel.id === "ebay") {
    return `${channel.url}?keyword=${encodeURIComponent(title)}`;
  }

  return channel.url;
}

function toMoneyNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
