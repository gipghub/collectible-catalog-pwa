# Architecture

## Product Goal

The app helps collectors create a trustworthy inventory of collectibles, attach photos, research comparable sales, and print physical labels that point back to the catalog record.

## Current Platform Choice

This starter is a Progressive Web App. It runs on desktop browsers and mobile browsers without a build step, which keeps the prototype easy to inspect and evolve. The architecture keeps business logic isolated so it can later move into an Expo, React Native, or native mobile shell.

## Layering

`domain`
: Owns collectible, comparable, and label concepts. It has no dependency on the browser or UI.

`application`
: Coordinates use cases such as creating entries, updating records, deleting items, and adding comparable sales.

`infrastructure`
: Talks to browser capabilities such as `localStorage`, canvas image processing, barcode rendering, and marketplace search-link generation.

`ui`
: Renders screens, handles DOM events, and delegates business decisions to application services.

## Comparable Search Boundary

The app does not scrape websites. Automated marketplace scraping often violates terms of service, breaks under layout changes, and is difficult to make reliable. Instead, the app creates focused research links and supports an approved comparable provider endpoint.

The provider endpoint is configured in the browser and called with item context. It should return normalized candidate sales. The app then requires human review before a candidate becomes a recorded comparable. This keeps valuation traceable and prevents low-quality matches from silently changing collection value.

Expected endpoint contract:

```json
{
  "source": "Provider name",
  "candidates": [
    {
      "providerItemId": "external-id",
      "title": "Comparable sale title",
      "price": 125,
      "url": "https://example.com/sale",
      "soldAt": "2026-04-20",
      "condition": "Near Mint",
      "confidence": 84,
      "matchNotes": "Same set and similar condition"
    }
  ]
}
```

Marketplace API credentials should live in a backend or serverless function, never in this static client.

## Label Strategy

Each catalog item receives a stable catalog code. Labels include:

- Item name.
- Category and condition.
- Catalog code.
- Direct catalog URL.
- Code 128 barcode for scanning the catalog code.

Scanning the barcode returns the catalog code, which can be pasted into search to find the entry. Future label iterations can add QR codes and label-stock presets.
