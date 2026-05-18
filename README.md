# Collectible Catalog PWA

A dependency-free starter app for cataloging collectibles across desktop, tablet, and mobile browsers. It includes photo capture, searchable catalog entries, comparable-search links, PriceCharting guide-value candidates, provider-ready comparable candidates, manually recorded comparable sales, and printable labels that cross-reference each item by catalog code and barcode.

## Prototype

- Repository: https://github.com/gipghub/collectible-catalog-pwa
- Live app: https://gipghub.github.io/collectible-catalog-pwa/
- Deployment: GitHub Pages publishes the static prototype from `main`.
- CI/CD: A GitHub Actions workflow is prepared in `.github/workflows/ci-cd.yml`; pushing it requires GitHub CLI `workflow` scope.

## Run Locally

From this folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173
```

If that port is already in use, run the same command with another port, for example `4175`.

The app stores catalog data in the browser with `localStorage`. Photos are resized in-browser before storage.

## What Is Included

- Mobile-friendly PWA shell for web and mobile browser use.
- Camera/photo capture through the device camera or file picker.
- Collectible entries with category, condition, maker, value, tags, notes, and photo.
- Search and category filtering.
- Sortable catalog views by recent update, title, category, maker, value, and acquisition date.
- Subtle collectible watermark background with trading card, coin, record, stamp, and paper ephemera motifs.
- Comparable-search links for marketplaces and web sources.
- Direct PriceCharting API token support for guide-value candidates.
- Provider-ready comparable scanning with accepted/rejected candidate review.
- Manual comparable sale records with range and average summary.
- Persistent user profile settings with dark, light, or system theme.
- Printable inventory lists that respect the current search, category filter, and sort order.
- Printable labels with catalog code, item URL, and Code 128 barcode.
- Clean Code-oriented folder structure:
  - `src/domain`: business rules and entities.
  - `src/application`: app use cases and state orchestration.
  - `src/infrastructure`: browser storage, barcode, image, and search-provider adapters.
  - `src/ui`: DOM rendering and interaction logic.

## Next Product Milestones

1. Replace browser-only storage with a synced backend.
2. Add user accounts, collection sharing, and cloud photo storage.
3. Add a hosted comparable provider endpoint with eBay Marketplace Insights, WorthPoint, or auction-house credentials stored server-side.
4. Add QR labels and printer presets for Avery-style label sheets.
5. Wrap the PWA with Expo, Capacitor, or native shells for app-store distribution.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEVELOPMENT_PROCESS.md](docs/DEVELOPMENT_PROCESS.md) for the design approach.
