const smokeTestFiles = [
  "auth-client-smoke.mjs",
  "catalog-backup-smoke.mjs",
  "backend-smoke.mjs",
  "catalog-repository-smoke.mjs",
  "label-tools-smoke.mjs",
  "sale-listing-smoke.mjs"
];

for (const file of smokeTestFiles) {
  await import(`./${file}`);
}

console.log("All smoke tests passed.");
