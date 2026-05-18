export function createAuthClient({ apiBaseUrl, fetchImpl = fetch }) {
  const baseUrl = String(apiBaseUrl || "").replace(/\/+$/, "");

  return {
    isConfigured: Boolean(baseUrl),

    async login({ email, password }) {
      if (!baseUrl) {
        throw new Error("Sign in is not configured.");
      }

      const response = await fetchImpl(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      await assertOk(response, "Sign in failed");
      return response.json();
    }
  };
}

async function assertOk(response, fallbackMessage) {
  if (response.ok) {
    return;
  }

  let message = fallbackMessage;

  try {
    const payload = await response.json();
    message = payload.message || message;
  } catch {
    message = response.statusText || message;
  }

  throw new Error(`${message} (${response.status})`);
}
