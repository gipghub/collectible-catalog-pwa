# Collectible Catalog PWA

A dependency-free starter app for cataloging collectibles across desktop, tablet, and mobile browsers. It includes photo capture, searchable catalog entries, comparable-search links, PriceCharting guide-value candidates, provider-ready comparable candidates, manually recorded comparable sales, yard-sale planning, and printable labels that cross-reference each item by catalog code and barcode.

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

Production sync and cloud photo upload can be enabled by defining `window.COLLECTIBLE_APP_CONFIG` before `src/main.js` loads. Without that config, the app stays in local-only mode. See [docs/BACKEND_CONTRACT.md](docs/BACKEND_CONTRACT.md) and [docs/PRODUCTION_BACKEND.md](docs/PRODUCTION_BACKEND.md).

## Run The Local API

The first production backend slice is included as a dependency-free Node server:

```powershell
npm run start:api
```

It listens on:

```text
http://127.0.0.1:8787
```

The local development login is:

```text
Email: collector@example.com
Password: catalog-demo
Token: dev-local-token
Collection: family-collection
```

For local API testing:

```powershell
npm run test:backend
```

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
- Yard sale planner with Sell/Unsure/Donated/Sold status, asking price, private floor price, sold price, and sale notes.
- Share-for-sale workflow that creates ready-to-paste listings for Facebook Marketplace, eBay, Craigslist, OfferUp, Nextdoor, or the device share sheet.
- Printable public price tags plus a private seller sheet for sale-day tracking.
- Printable labels with catalog code, item URL, and Code 128 barcode.
- Sync-ready repository boundary with visible local/sync status in the app header.
- Local production API slice with bearer-token auth, catalog sync, and disk-backed photo storage.
- Clean Code-oriented folder structure:
  - `src/domain`: business rules and entities.
  - `src/application`: app use cases and state orchestration.
  - `src/infrastructure`: browser storage, sync, barcode, image, and search-provider adapters.
  - `src/ui`: DOM rendering and interaction logic.
  - `server`: production API slice with application, domain, and infrastructure modules.

## Next Product Milestones

1. Replace the local demo auth with a real identity provider and encrypted secrets.
2. Move disk-backed photo storage to object storage such as S3, Supabase Storage, or Firebase Storage.
3. Add collection sharing and role-based access for relatives.
4. Add a hosted comparable provider endpoint with eBay Marketplace Insights, WorthPoint, or auction-house credentials stored server-side.
5. Add QR labels and printer presets for Avery-style label sheets.
6. Wrap the PWA with Expo, Capacitor, or native shells for app-store distribution.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/BACKEND_CONTRACT.md](docs/BACKEND_CONTRACT.md), and [docs/DEVELOPMENT_PROCESS.md](docs/DEVELOPMENT_PROCESS.md) for the design approach.
