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

The first version does not scrape websites. Automated marketplace scraping often violates terms of service, breaks under layout changes, and is difficult to make reliable. Instead, the app creates focused search links and lets the user record comparable sales. A future comparable provider can be added behind the same adapter boundary when an approved API is available.

## Label Strategy

Each catalog item receives a stable catalog code. Labels include:

- Item name.
- Category and condition.
- Catalog code.
- Direct catalog URL.
- Code 128 barcode for scanning the catalog code.

Scanning the barcode returns the catalog code, which can be pasted into search to find the entry. Future label iterations can add QR codes and label-stock presets.
