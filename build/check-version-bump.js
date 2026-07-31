#!/usr/bin/env node
/**
 * CI guard: if a tracker script in src/ changed vs base branch,
 * its VERSION const must also have changed.
 * Usage: node build/check-version-bump.js <base-ref>
 */

const { execSync } = require("child_process");

const baseRef = process.argv[2] || "origin/main";
const versionRe = /const VERSION\s*=\s*["'](.+?)["']/;

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

const fs = require("fs");

function versionAt(ref, file) {
  try {
    const content =
      ref === "WORKING_TREE"
        ? fs.readFileSync(file, "utf8")
        : sh(`git show ${ref}:${file}`);
    const m = content.match(versionRe);
    return m ? m[1] : null;
  } catch {
    return null; // file didn't exist at ref -> treat as new file
  }
}

// include committed diffs (base...HEAD) AND uncommitted working-tree changes
const committedFiles = sh(`git diff --name-only ${baseRef}...HEAD -- src/`)
  .split("\n")
  .filter(Boolean);
const workingTreeFiles = sh(`git diff --name-only HEAD -- src/`)
  .split("\n")
  .filter(Boolean);
const untrackedFiles = sh(`git ls-files --others --exclude-standard -- src/`)
  .split("\n")
  .filter(Boolean);

const changedFiles = [
  ...new Set([...committedFiles, ...workingTreeFiles, ...untrackedFiles]),
].filter((f) => f.endsWith(".js"));

if (changedFiles.length === 0) {
  console.log("No src/*.js changes detected. Skipping VERSION check.");
  process.exit(0);
}

let failed = false;

for (const file of changedFiles) {
  const oldVersion = versionAt(baseRef, file);
  const newVersion = versionAt("WORKING_TREE", file);

  if (oldVersion === null) {
    console.log(`✓ ${file} is new, VERSION check skipped.`);
    continue;
  }

  if (newVersion === null) {
    console.log(`⚠ ${file} has no VERSION const, skipping.`);
    continue;
  }

  if (oldVersion === newVersion) {
    console.error(
      `✗ ${file} changed but VERSION not bumped (still "${oldVersion}").`,
    );
    failed = true;
  } else {
    console.log(`✓ ${file} VERSION bumped: "${oldVersion}" -> "${newVersion}"`);
  }
}

if (failed) {
  console.error(
    "\nBump VERSION in each changed tracker script before merging.",
  );
  process.exit(1);
}

console.log("\nAll changed tracker scripts have bumped VERSION.");
