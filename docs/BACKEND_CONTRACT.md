# Backend Contract

The production app is now prepared for an authenticated catalog API while still working offline with local browser storage.

## Runtime Configuration

The static client reads an optional global config before `src/main.js` runs:

```html
<script>
  window.COLLECTIBLE_APP_CONFIG = {
    syncEnabled: true,
    apiBaseUrl: "https://api.example.com",
    apiToken: "user-session-token",
    collectionId: "family-collection"
  };
</script>
```

If `syncEnabled` or `apiBaseUrl` is missing, the app stays in local-only mode.

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

The current app still stores resized photo data URLs inside catalog records. The next production step should move photos to object storage and replace `photoDataUrl` with metadata such as:

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
