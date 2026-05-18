import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";

const ACCEPTED_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);

export function createPhotoStore({ storageRoot, publicBaseUrl = "" }) {
  const photoRoot = join(storageRoot, "photos");

  return {
    async saveDataUrl({ collectionId, dataUrl, originalName = "" }) {
      const parsed = parseDataUrl(dataUrl);
      const extension = getExtension(parsed.contentType, originalName);
      const fileName = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}${extension}`;
      const relativePath = `${safePathPart(collectionId)}/${fileName}`;
      const absolutePath = join(photoRoot, relativePath);

      await mkdir(join(photoRoot, safePathPart(collectionId)), { recursive: true });
      await writeFile(absolutePath, parsed.buffer);

      return {
        fileName,
        contentType: parsed.contentType,
        size: parsed.buffer.length,
        path: relativePath.replaceAll("\\", "/"),
        url: publicBaseUrl ? `${publicBaseUrl}/${relativePath.replaceAll("\\", "/")}` : ""
      };
    }
  };
}

export function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(String(dataUrl || ""));

  if (!match) {
    throw createBadRequestError("Photo upload must be a base64 data URL.");
  }

  const contentType = match[1].toLowerCase();

  if (!ACCEPTED_IMAGE_TYPES.has(contentType)) {
    throw createBadRequestError("Photo must be a JPEG, PNG, or WebP image.");
  }

  return {
    contentType,
    buffer: Buffer.from(match[2], "base64")
  };
}

function getExtension(contentType, originalName) {
  const originalExtension = extname(originalName).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(originalExtension)) {
    return originalExtension === ".jpeg" ? ".jpg" : originalExtension;
  }

  return ACCEPTED_IMAGE_TYPES.get(contentType);
}

function createBadRequestError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function safePathPart(value) {
  return String(value || "default").replace(/[^a-z0-9_-]/gi, "-").slice(0, 80);
}
