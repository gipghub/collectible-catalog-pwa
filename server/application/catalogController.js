import { canAccessCollection } from "../domain/session.js";

export function createCatalogController({ authService, catalogStore, photoStore, publicBaseUrl }) {
  return {
    async loadItems(request, response, collectionId) {
      authorizeCollection(authService, request, collectionId);
      const catalog = await catalogStore.load(collectionId);
      sendJson(response, catalog);
    },

    async saveItems(request, response, collectionId) {
      authorizeCollection(authService, request, collectionId);
      const body = await readJsonBody(request);
      const catalog = await catalogStore.save(collectionId, body.items);
      sendJson(response, catalog);
    },

    async savePhoto(request, response, collectionId) {
      authorizeCollection(authService, request, collectionId);
      const body = await readJsonBody(request, { maxBytes: 8_000_000 });
      const photo = await photoStore.saveDataUrl({
        collectionId,
        dataUrl: body.dataUrl,
        originalName: body.fileName
      });

      sendJson(response, {
        ...photo,
        url: `${publicBaseUrl(request)}/uploads/${photo.path}`
      }, 201);
    }
  };
}

function authorizeCollection(authService, request, collectionId) {
  const session = authService.authenticate(request.headers.authorization);

  if (!canAccessCollection(session, collectionId)) {
    const error = new Error("You do not have access to this collection.");
    error.statusCode = 403;
    throw error;
  }

  return session;
}

export function sendJson(response, payload, statusCode = 200) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

export function readJsonBody(request, { maxBytes = 1_000_000 } = {}) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > maxBytes) {
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });
    request.on("error", reject);
    request.on("end", () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch {
        const error = new Error("Request body must be valid JSON.");
        error.statusCode = 400;
        reject(error);
      }
    });
  });
}
