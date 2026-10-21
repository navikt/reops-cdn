#!/usr/bin/env node
/**
 * Diff locally built dist/ files against what's live on the CDN.
 * Usage: node build/diff-cdn.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const CDN_BASE = "https://cdn.nav.no/team-researchops/sporing";
const distDir = path.join(__dirname, "..", "dist");

const files = ["sporing.js", "sporing-dev.js", "sporing-reops.js"];

// Files live in dist/sporing/<name> locally and at <CDN_BASE>/<name> remotely,
// where CDN_BASE already includes the /sporing path segment.
function localPathFor(file) {
  return path.join(distDir, "sporing", file);
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function main() {
  let anyDiff = false;

  for (const file of files) {
    const localPath = localPathFor(file);

    if (!fs.existsSync(localPath)) {
      console.log(`⚠ ${file}: not found in dist/, run "pnpm run build:tracking-scripts" first. Skipping.`);
      continue;
    }

    const local = fs.readFileSync(localPath, "utf8");
    const url = `${CDN_BASE}/${file}`;

    let remote;
    try {
      remote = await fetchUrl(url);
    } catch (err) {
      console.log(`⚠ ${file}: failed to fetch ${url} (${err.message}). Skipping.`);
      continue;
    }

    if (local === remote) {
      console.log(`✓ ${file}: matches CDN (${url})`);
    } else {
      anyDiff = true;
      console.log(`✗ ${file}: DIFFERS from CDN (${url})`);
      console.log(`  local size:  ${local.length} bytes`);
      console.log(`  CDN size:    ${remote.length} bytes`);
    }
  }

  if (anyDiff) {
    console.log(
      "\nSome files differ. Either the CDN hasn't been updated yet, or your local build is stale.",
    );
    process.exit(1);
  }

  console.log("\nAll dist/ files match what's live on the CDN.");
}

main().catch((err) => {
  console.error("Failed to run CDN diff:", err);
  process.exit(1);
});
