import { createAuthClient } from "../src/infrastructure/authClient.js";
import { createSessionRepository } from "../src/infrastructure/sessionRepository.js";

const authClient = createAuthClient({
  apiBaseUrl: "https://api.example.test",
  fetchImpl: async (url, options) => {
    const payload = JSON.parse(options.body);

    assert(url === "https://api.example.test/auth/login", "Login should call the auth endpoint.");
    assert(payload.email === "collector@example.com", "Login should send email.");
    assert(payload.password === "catalog-demo", "Login should send password.");

    return {
      ok: true,
      json: async () => ({
        token: "dev-local-token",
        collectionId: "family-collection",
        user: {
          email: payload.email,
          displayName: "Family Collector"
        }
      })
    };
  }
});

const session = await authClient.login({
  email: "collector@example.com",
  password: "catalog-demo"
});

const memoryStorage = createMemoryStorage();
const repository = createSessionRepository(memoryStorage);
repository.save(session);

assert(repository.load().token === "dev-local-token", "Saved session should load.");
repository.clear();
assert(repository.load() === null, "Cleared session should be empty.");

console.log("auth-client-smoke ok");

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
