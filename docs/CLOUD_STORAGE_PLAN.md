# Cloud Photo Storage Plan

The app is already wired so the browser can upload resized photos to the API when `photoUploadEnabled` is true. The current backend stores those files on disk under `server/storage/photos`; the next production hosting step is to swap that local photo store for object storage.

## Current Connection Points

- Browser: `src/infrastructure/imageProcessor.js` uploads to `POST /collections/{collectionId}/photos`.
- API controller: `server/application/catalogController.js` validates auth before saving photos.
- Storage adapter: `server/infrastructure/photoStore.js` owns the save operation and returned URL.

## Runtime Config

For local disk storage:

```powershell
npm run start:api
```

For a CDN or reverse-proxied photo base URL:

```powershell
$env:COLLECTIBLE_PHOTO_PUBLIC_BASE_URL="https://cdn.example.com/collectible-photos"
npm run start:api
```

The returned photo URL will use that base URL while the file save still uses the local adapter. This is useful when a host maps `server/storage/photos` to public object storage or a CDN-backed volume.

## Object Storage Adapter Shape

The production adapter should keep the same `saveDataUrl` contract:

```js
{
  async saveDataUrl({ collectionId, dataUrl, originalName }) {
    return {
      fileName: "generated-name.jpg",
      contentType: "image/jpeg",
      size: 120345,
      path: "family-collection/generated-name.jpg",
      url: "https://storage.example.com/family-collection/generated-name.jpg"
    };
  }
}
```

Recommended provider options:

- Supabase Storage for a simpler app stack with auth and database in one place.
- Firebase Storage if Firebase Auth becomes the identity layer.
- S3-compatible storage if the app is hosted on AWS, Cloudflare R2, Backblaze B2, or DigitalOcean Spaces.

## Production Requirements

- Store provider credentials as environment secrets, never in the browser.
- Validate image type and file size before upload.
- Use per-collection object prefixes.
- Return durable public or signed URLs depending on whether collection photos should be public.
- Add backup/restore and lifecycle rules before real family data is the only copy.
