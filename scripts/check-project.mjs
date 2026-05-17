import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  "src/main.js",
  "src/application/catalogService.js",
  "src/domain/collectible.js",
  "src/domain/userProfile.js",
  "src/infrastructure/catalogRepository.js",
  "src/infrastructure/userProfileRepository.js",
  "src/ui/appView.js",
  "src/styles.css"
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing required file: ${file}`);
}

JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const javascriptFiles = await findFiles(root, [".js", ".mjs"]);

for (const file of javascriptFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

const html = readFileSync(join(root, "index.html"), "utf8");
assert(html.includes('type="module" src="./src/main.js"'), "index.html must load src/main.js as a module");
assert(html.includes('rel="manifest"'), "index.html must link the web manifest");

console.log(`Validated ${javascriptFiles.length} JavaScript files and core app metadata.`);

async function findFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if ([".git", "node_modules"].includes(entry.name)) {
        continue;
      }

      files.push(...await findFiles(path, extensions));
      continue;
    }

    if (extensions.includes(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
