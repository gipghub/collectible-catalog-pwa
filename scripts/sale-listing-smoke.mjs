import { createSaleListing } from "../src/domain/saleListing.js";
import { formatMoney } from "../src/domain/collectible.js";

const listing = createSaleListing({
  id: "item-1",
  catalogCode: "COL-TEST-001",
  title: "Vintage lunch tin",
  category: "Toys",
  condition: "Good",
  maker: "Thermos",
  series: "1970s",
  askingPrice: 25,
  saleNotes: "Local pickup near the yard sale table."
}, {
  currency: "USD",
  formatMoney
});

assert(listing.title === "Vintage lunch tin - Toys", "Listing title should include item and category.");
assert(listing.priceLabel === "$25", "Listing should format asking price.");
assert(listing.description.includes("Local pickup"), "Listing should include pickup language.");
assert(listing.description.includes("COL-TEST-001"), "Listing should include catalog code.");
assert(listing.channels.some((channel) => channel.name === "Facebook Marketplace"), "Listing should include Facebook Marketplace.");
assert(listing.channels.some((channel) => channel.name === "eBay"), "Listing should include eBay.");

console.log("sale-listing-smoke ok");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
