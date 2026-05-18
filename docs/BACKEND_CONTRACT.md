# Backend Contract

The production app is now prepared for an authenticated catalog API while still working offline with local browser storage.

## Runtime Configuration

The static client reads an optional global config before `src/main.js` runs:

```html
<script>
  window.COLLECTIBLE_APP_CONFIG = {
    syncEnabled: true,
    photoUploadEnabled: true,
    apiBaseUrl: "https://api.example.com",
    apiToken: "user-session-token",
    collectionId: "family-collection"
  };
</script>
```

If `syncEnabled` or `apiBaseUrl` is missing, the app stays in local-only mode. If `photoUploadEnabled` is missing, photos stay as local resized data URLs.

## Auth Endpoint

### Login

```http
POST /auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "collector@example.com",
  "password": "catalog-demo"
}
```

Response:

```json
{
  "token": "user-session-token",
  "user": {
    "email": "collector@example.com",
    "displayName": "Family Collector"
  },
  "collectionId": "family-collection"
}
```

The current static client still expects the token to be supplied through runtime config. A future UI pass should add a sign-in screen that calls this endpoint and stores the session securely.

## Catalog Sync Endpoint

### Load Items

```http
GET /collections/{collectionId}/items
Authorization: Bearer {token}
```

Response:

```json
{
  "items": [
    {
      "id": "catalog-item-id",
      "catalogCode": "COL-20260517-ABC123",
      "title": "1964 Kennedy half dollar",
      "category": "Coins",
      "updatedAt": "2026-05-18T01:30:00.000Z"
    }
  ]
}
```

### Save Items

```http
PUT /collections/{collectionId}/items
Authorization: Bearer {token}
Content-Type: application/json
```

Request body:

```json
{
  "collectionId": "family-collection",
  "items": [],
  "updatedAt": "2026-05-18T01:30:00.000Z"
}
```

The backend should validate ownership from the token, not from the `collectionId` alone.

## Merge Rule

The client keeps local data usable first, then merges local and remote records by `id`. When the same record exists in both places, the record with the newest `updatedAt` wins. This is intentionally simple for the first production slice and can later be replaced by per-field conflict resolution.

## Photo Storage

When `photoUploadEnabled` is enabled, the browser uploads the resized image before saving the item and stores the returned URL in the existing photo field. This keeps the current UI compatible while moving the image bytes out of catalog records.

### Upload Photo

```http
POST /collections/{collectionId}/photos
Authorization: Bearer {token}
Content-Type: application/json
```

Request body:

```json
{
  "fileName": "front.jpg",
  "dataUrl": "data:image/jpeg;base64,..."
}
```

Response:

```json
{
  "fileName": "2026-05-18-generated-id.jpg",
  "contentType": "image/jpeg",
  "size": 120345,
  "path": "family-collection/2026-05-18-generated-id.jpg",
  "url": "https://api.example.com/uploads/family-collection/2026-05-18-generated-id.jpg"
}
```

The longer-term production shape should replace `photoDataUrl` with metadata such as:

```json
{
  "photo": {
    "url": "https://cdn.example.com/collections/family/item.jpg",
    "width": 1200,
    "height": 900,
    "contentType": "image/jpeg"
  }
}
```

## Comparable Provider

Marketplace credentials should live behind backend endpoints. The browser should send item context and receive normalized comparable candidates; it should never hold shared eBay, WorthPoint, or auction-house credentials.
