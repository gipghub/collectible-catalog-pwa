export const THEME_OPTIONS = ["dark", "light", "system"];

export const CURRENCY_OPTIONS = ["USD", "CAD", "EUR", "GBP", "JPY"];

export function createUserProfile(input = {}) {
  return {
    displayName: cleanText(input.displayName, "Collector"),
    email: cleanText(input.email),
    collectionName: cleanText(input.collectionName, "Collection workspace"),
    defaultCategory: cleanText(input.defaultCategory, "Other"),
    currency: normalizeCurrency(input.currency),
    lastBackupAt: cleanText(input.lastBackupAt),
    lastLabelPrintedAt: cleanText(input.lastLabelPrintedAt),
    onboardingDismissedAt: cleanText(input.onboardingDismissedAt),
    theme: normalizeTheme(input.theme)
  };
}

export function getProfileInitials(profile) {
  return profile.displayName
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "C";
}

export function resolveTheme(theme, prefersDark = false) {
  if (theme === "system") {
    return prefersDark ? "dark" : "light";
  }

  return theme;
}

function normalizeTheme(value) {
  return THEME_OPTIONS.includes(value) ? value : "dark";
}

function normalizeCurrency(value) {
  return CURRENCY_OPTIONS.includes(value) ? value : "USD";
}

function cleanText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}
