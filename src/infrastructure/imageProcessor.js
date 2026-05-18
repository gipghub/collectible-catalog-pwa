export async function readImageAsDataUrl(file, options = {}) {
  if (!file) {
    return "";
  }

  const { maxSize = 1400, quality = 0.82 } = options;
  const rawDataUrl = await readFile(file);
  const image = await loadImage(rawDataUrl);
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

export function createConfiguredImageReader({ appConfig, fetchImpl = fetch, fallbackReader = readImageAsDataUrl }) {
  return async function readConfiguredImage(file) {
    const dataUrl = await fallbackReader(file);

    if (!appConfig?.photoUploadEnabled || !appConfig.apiBaseUrl) {
      return dataUrl;
    }

    try {
      const response = await fetchImpl(getPhotoUploadUrl(appConfig), {
        method: "POST",
        headers: createHeaders(appConfig.apiToken),
        body: JSON.stringify({
          dataUrl,
          fileName: file?.name || "collectible-photo.jpg"
        })
      });

      if (!response.ok) {
        throw new Error(`Photo upload failed (${response.status})`);
      }

      const payload = await response.json();
      return payload.url || dataUrl;
    } catch (error) {
      console.info("Cloud photo upload is unavailable; keeping the photo locally.", error);
      return dataUrl;
    }
  };
}

function getPhotoUploadUrl(appConfig) {
  const baseUrl = String(appConfig.apiBaseUrl || "").replace(/\/+$/, "");
  const collectionId = encodeURIComponent(appConfig.collectionId || "default");
  return `${baseUrl}/collections/${collectionId}/photos`;
}

function createHeaders(apiToken) {
  return {
    "Content-Type": "application/json",
    ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {})
  };
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = source;
  });
}
