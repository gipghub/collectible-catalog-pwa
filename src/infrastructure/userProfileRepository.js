import { createUserProfile } from "../domain/userProfile.js";

const STORAGE_KEY = "collectible-catalog.userProfile.v1";

export function createUserProfileRepository(storage = window.localStorage) {
  return {
    load() {
      try {
        const rawProfile = storage.getItem(STORAGE_KEY);
        return createUserProfile(rawProfile ? JSON.parse(rawProfile) : {});
      } catch (error) {
        console.warn("User profile could not be loaded.", error);
        return createUserProfile();
      }
    },

    save(profile) {
      storage.setItem(STORAGE_KEY, JSON.stringify(createUserProfile(profile)));
    }
  };
}
