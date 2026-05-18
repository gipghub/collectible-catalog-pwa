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

## Production Sync Boundary

The app now starts through a configuration-driven repository boundary. It always loads a local IndexedDB repository first so a family member can keep cataloging even without a network connection. Older `localStorage` catalog data is migrated into IndexedDB on first load. When `window.COLLECTIBLE_APP_CONFIG.syncEnabled` and `apiBaseUrl` are present, the local repository is wrapped by a sync repository that talks to a remote catalog API.

Sync behavior is intentionally conservative:

- Local records remain the source of immediate UI responsiveness.
- Saves are written locally before any network call.
- Manual sync merges local and remote records by `id`.
- When the same item exists in both places, the newest `updatedAt` wins.
- Sync status is visible in the app header as local-only, ready, pending, synced, syncing, or issue.

See `docs/BACKEND_CONTRACT.md` for the first backend endpoint contract.

## Comparable Search Boundary

The app does not scrape websites. Automated marketplace scraping often violates terms of service, breaks under layout changes, and is difficult to make reliable. Instead, the app creates focused research links and supports an approved comparable provider endpoint.

The browser can also call PriceCharting directly with a user-supplied API token. That path produces guide-value candidates from the official product price endpoint. These are useful valuation signals, but they are not historic sold listings.

The custom provider endpoint is configured in the browser and called with item context. It should return normalized candidate sales from approved sources such as eBay Marketplace Insights, WorthPoint, auction records, or a private dealer feed. The app then requires human review before a candidate becomes a recorded comparable. This keeps valuation traceable and prevents low-quality matches from silently changing collection value.

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

Marketplace API credentials should live in a backend or serverless function, never in this static client. For production use, PriceCharting tokens should move behind that same backend boundary if the token belongs to the business rather than the individual collector using the browser.

## Label Strategy

Each catalog item receives a stable catalog code. Labels include:

- Item name.
- Category and condition.
- Catalog code.
- Direct catalog URL.
- Code 128 barcode for scanning the catalog code.

Scanning the barcode returns the catalog code, which can be pasted into search to find the entry. Future label iterations can add QR codes and label-stock presets.
