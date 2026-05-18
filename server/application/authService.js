import { createSession } from "../domain/session.js";

export function createAuthService({ demoUser }) {
  const sessionsByToken = new Map([
    [demoUser.token, createSession(demoUser)]
  ]);

  return {
    login({ email, password }) {
      if (email !== demoUser.email || password !== demoUser.password) {
        const error = new Error("Email or password is incorrect.");
        error.statusCode = 401;
        throw error;
      }

      const session = sessionsByToken.get(demoUser.token);

      return {
        token: session.token,
        user: {
          email: session.email,
          displayName: session.displayName
        },
        collectionId: session.collectionIds[0]
      };
    },

    authenticate(authorizationHeader) {
      const token = parseBearerToken(authorizationHeader);
      const session = sessionsByToken.get(token);

      if (!session) {
        const error = new Error("A valid bearer token is required.");
        error.statusCode = 401;
        throw error;
      }

      return session;
    }
  };
}

function parseBearerToken(value = "") {
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1].trim() : "";
}
