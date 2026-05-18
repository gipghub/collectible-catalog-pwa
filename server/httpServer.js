import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { readJsonBody, sendJson } from "./application/catalogController.js";

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export function createHttpServer({ config, authService, catalogController }) {
  return createServer(async (request, response) => {
    applyCors(response, config.corsOrigin);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    try {
      const url = new URL(request.url, getRequestOrigin(request));
      const collectionMatch = /^\/collections\/([^/]+)\/items$/.exec(url.pathname);
      const photoMatch = /^\/collections\/([^/]+)\/photos$/.exec(url.pathname);

      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, { ok: true, service: "collectible-catalog-api" });
        return;
      }

      if (request.method === "POST" && url.pathname === "/auth/login") {
        const body = await readJsonBody(request);
        sendJson(response, authService.login(body));
        return;
      }

      if (request.method === "GET" && collectionMatch) {
        await catalogController.loadItems(request, response, decodeURIComponent(collectionMatch[1]));
        return;
      }

      if (request.method === "PUT" && collectionMatch) {
        await catalogController.saveItems(request, response, decodeURIComponent(collectionMatch[1]));
        return;
      }

      if (request.method === "POST" && photoMatch) {
        await catalogController.savePhoto(request, response, decodeURIComponent(photoMatch[1]));
        return;
      }

      if (request.method === "GET" && url.pathname.startsWith("/uploads/")) {
        await sendUploadedPhoto(response, config.storageRoot, url.pathname);
        return;
      }

      sendJson(response, { message: "Route not found." }, 404);
    } catch (error) {
      sendJson(response, { message: error.message || "Server error." }, error.statusCode || 500);
    }
  });
}

function applyCors(response, corsOrigin) {
  response.setHeader("Access-Control-Allow-Origin", corsOrigin);
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
}

async function sendUploadedPhoto(response, storageRoot, pathName) {
  const requestedPath = pathName.replace(/^\/uploads\//, "");
  const photoRoot = join(storageRoot, "photos");
  const absolutePath = normalize(join(photoRoot, requestedPath));

  if (!absolutePath.startsWith(normalize(photoRoot))) {
    sendJson(response, { message: "Photo not found." }, 404);
    return;
  }

  const file = await stat(absolutePath).catch(() => null);

  if (!file?.isFile()) {
    sendJson(response, { message: "Photo not found." }, 404);
    return;
  }

  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extname(absolutePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable"
  });
  createReadStream(absolutePath).pipe(response);
}

function getRequestOrigin(request) {
  const protocol = request.headers["x-forwarded-proto"] || "http";
  return `${protocol}://${request.headers.host}`;
}
