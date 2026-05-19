# Local Database

The app is now local-first for a one-person collection. Catalog records are stored in IndexedDB inside the browser, which is a better fit than `localStorage` for larger catalogs and photo-heavy records.

## What Lives Locally

- Catalog records.
- Resized photo data or photo URLs.
- Comparable sales and provider candidates.
- Yard-sale and seller listing fields.

## Migration

Earlier prototype versions stored the catalog under `localStorage` key `collectible-catalog.records.v1`. On first load, if IndexedDB is empty and that legacy catalog exists, the app copies those records into IndexedDB.

The old data is left in place as a safety net.

## Limits

IndexedDB data is private to the browser profile and device. It does not automatically sync to another phone or laptop.

For one-person use, backup/restore is the main safety feature:

- Use **Move / Backup** to save a catalog file.
- Use **Send To Laptop** to open the device share sheet when the browser supports file sharing.
- Import a catalog backup with a restore preview before replacement.
- Preserve profile settings and photo data stored in catalog records.
- Record the last backup date in the profile.

## Backup Format

Backups are downloaded as dated JSON files:

```text
collectible-catalog-backup-YYYY-MM-DD.json
```

A safe sample file for practicing restore preview is available at [docs/examples/sample-backup.json](examples/sample-backup.json).

Each backup includes:

- Backup format version.
- Creation timestamp.
- Profile settings.
- Catalog items, including photo data URLs or photo URLs already stored in item records.

Older prototype exports that were just an array of items can still be imported.

Importing a backup first opens a restore preview with the backup date, item count, current item count, photo count, profile name, and sample item names. Choosing **Restore Backup** replaces the catalog on the current device.

The sidebar also shows a backup status reminder so a local-only catalog does not go too long without an export. The **Move / Backup** dialog keeps the main local-only choices in one place: save a backup file, send it to a laptop, restore from a file, or print the current catalog list.

## Cloud Remains Optional

The backend and sync boundary remain available, but they are no longer required for a one-person local app. The app can run fully local unless cloud sync or shared family access becomes important later.
