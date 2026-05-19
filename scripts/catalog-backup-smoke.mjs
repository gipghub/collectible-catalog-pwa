import {
  createBackupPreview,
  createCatalogBackup,
  parseCatalogBackup
} from "../src/domain/catalogBackup.js";

const backup = createCatalogBackup({
  createdAt: "2026-05-18T12:00:00.000Z",
  profile: {
    displayName: "Collector"
  },
  items: [
    {
      id: "item-1",
      title: "Backup test item"
    }
  ]
});

assert(backup.version === 1, "Backup should include version.");
assert(backup.items.length === 1, "Backup should include items.");

const parsed = parseCatalogBackup(JSON.stringify(backup));
assert(parsed.items[0].title === "Backup test item", "Parsed backup should preserve item.");
assert(parsed.profile.displayName === "Collector", "Parsed backup should preserve profile.");

const preview = createBackupPreview(parsed, [{ id: "current", title: "Current item" }]);
assert(preview.itemCount === 1, "Preview should count backup items.");
assert(preview.currentItemCount === 1, "Preview should count current items.");
assert(preview.sampleTitles[0] === "Backup test item", "Preview should include sample titles.");

const legacy = parseCatalogBackup(JSON.stringify([{ id: "legacy-item", title: "Legacy export" }]));
assert(legacy.items[0].title === "Legacy export", "Parser should accept legacy item arrays.");

let failed = false;
try {
  parseCatalogBackup("{}");
} catch {
  failed = true;
}
assert(failed, "Parser should reject invalid backups.");

console.log("catalog-backup-smoke ok");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
