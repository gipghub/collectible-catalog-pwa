# Collectible Catalog PWA

A dependency-free starter app for cataloging collectibles across desktop, tablet, and mobile browsers. It includes photo capture, searchable catalog entries, comparable-search links, PriceCharting guide-value candidates, provider-ready comparable candidates, manually recorded comparable sales, yard-sale planning, and printable labels that cross-reference each item by catalog code and barcode.

## Prototype

- Repository: https://github.com/gipghub/collectible-catalog-pwa
- Live app: https://gipghub.github.io/collectible-catalog-pwa/
- Deployment: GitHub Pages publishes the static prototype from `main`.
- CI/CD: `.github/workflows/ci-cd.yml` runs project checks, smoke tests, and GitHub Pages deployment on every push to `main`.

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

The app stores catalog data locally in the browser with IndexedDB. Photos are resized in-browser before storage. Older `localStorage` catalog data is migrated into IndexedDB the first time the updated app opens.

To safely try restore preview without risking real data, use the sample backup in [docs/examples/sample-backup.json](docs/examples/sample-backup.json).

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
- Install prompt support for browsers that allow adding the PWA to the home screen.
- Camera/photo capture through the device camera or file picker.
- Local-first IndexedDB catalog storage for one-person offline use.
- Export/import JSON backups with profile settings, item records, stored photo data, and a restore preview before replacing local data.
- Move / Backup flow for saving a backup file, sending it to a laptop with the device share sheet, restoring from a file, or printing the catalog.
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
- Seller tracking for listing status, sale site, listing URL, listed date, and sold-via details.
- Printable public price tags plus a private seller sheet for sale-day tracking.
- Printable labels with catalog code, item URL, Code 128 barcode, scannable QR code, and compact/Avery 5160/large-tag sheet presets.
- Print QA checklist for label sheets, QR/barcode scans, and yard-sale sheets.
- Backup reminder status so a local-only catalog does not go too long without an export.
- First-run checklist for adding an item, taking a photo, exporting a backup, printing labels, and marking yard-sale items.
- Sync-ready repository boundary with visible local/sync status in the app header.
- Local production API slice with bearer-token auth, catalog sync, and disk-backed photo storage.
- Clean Code-oriented folder structure:
  - `src/domain`: business rules and entities.
  - `src/application`: app use cases and state orchestration.
  - `src/infrastructure`: browser storage, sync, barcode, image, and search-provider adapters.
  - `src/ui`: DOM rendering and interaction logic.
  - `server`: production API slice with application, domain, and infrastructure modules.

## Next Product Milestones

1. Add tested install instructions for iPhone, iPad, Android, Windows, and Mac.
2. Package an optional laptop desktop build that stores data in a local app folder.
3. Add a one-click "copy backup to USB folder" flow for the desktop version.
4. Add a hosted comparable provider endpoint with eBay Marketplace Insights, WorthPoint, or auction-house credentials stored server-side.
5. Add optional cloud sync only if the owner later decides they want device-to-device sync.
6. Wrap the PWA with Expo, Capacitor, or native shells for app-store distribution.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/BACKEND_CONTRACT.md](docs/BACKEND_CONTRACT.md), [docs/CLOUD_STORAGE_PLAN.md](docs/CLOUD_STORAGE_PLAN.md), [docs/DEVELOPMENT_PROCESS.md](docs/DEVELOPMENT_PROCESS.md), [docs/LOCAL_DATABASE.md](docs/LOCAL_DATABASE.md), and [docs/PRINT_CHECKLIST.md](docs/PRINT_CHECKLIST.md) for the design approach and local-use guidance.
