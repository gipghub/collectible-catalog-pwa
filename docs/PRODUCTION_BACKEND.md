# Production Backend Slice

This repo now includes a small dependency-free Node backend that proves the first production path: sign in, sync a collection, and upload photos outside browser storage.

## Start Locally

```powershell
npm run start:api
```

The API listens on `http://127.0.0.1:8787`.

## Development Credentials

The default local credentials are intentionally simple so the prototype can be tested without another service:

```text
Email: collector@example.com
Password: catalog-demo
Token: dev-local-token
Collection: family-collection
```

Override them before starting the server:

```powershell
$env:COLLECTIBLE_DEMO_EMAIL="you@example.com"
$env:COLLECTIBLE_DEMO_PASSWORD="change-me"
$env:COLLECTIBLE_DEMO_TOKEN="local-secret-token"
$env:COLLECTIBLE_COLLECTION_ID="family-collection"
npm run start:api
```

## Connect The PWA

Add runtime config before `src/main.js` loads:

```html
<script>
  window.COLLECTIBLE_APP_CONFIG = {
    syncEnabled: true,
    photoUploadEnabled: true,
    apiBaseUrl: "http://127.0.0.1:8787",
    apiToken: "dev-local-token",
    collectionId: "family-collection"
  };
</script>
```

With that config, catalog saves sync to the API and selected photos upload to `server/storage/photos`.

## Current Storage

Catalog JSON is stored in `server/storage/catalogs` and uploaded photos are stored in `server/storage/photos`. The folder is ignored by git except for `.gitkeep`.

## Hardening Before Real Users

- Replace demo auth with a real identity provider.
- Store passwords and tokens securely; never commit real tokens.
- Move photo files to object storage.
- Add HTTPS, rate limiting, structured logs, and backup/restore.
- Add collection roles for relatives, such as owner, editor, and viewer.
