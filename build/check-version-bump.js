#!/usr/bin/env node
/**
 * CI guard: if a tracker script in src/ changed vs base branch,
 * its VERSION const must also have changed.
 * Usage: node build/check-version-bump.js <base-ref>
 */

const { execFileSync } = require("child_process");

const baseRef = process.argv[2] || "origin/main";
const versionRe = /const VERSION\s*=\s*["'](.+?)["']/;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const fs = require("fs");

// Resolve refs without allowing them to become command-line options.
const baseCommit = git([
  "rev-parse",
  "--verify",
  "--end-of-options",
  `${baseRef}^{commit}`,
]).trim();

function versionAt(ref, file) {
  try {
    const content =
      ref === "WORKING_TREE"
        ? fs.readFileSync(file, "utf8")
        : git(["show", "--end-of-options", `${ref}:${file}`]);
    const m = content.match(versionRe);
    return m ? m[1] : null;
  } catch {
    return null; // file didn't exist at ref -> treat as new file
  }
}

// include committed diffs (base...HEAD) AND uncommitted working-tree changes
// NUL delimiters preserve spaces, newlines, quotes, and shell metacharacters.
const committedFiles = git([
  "diff", "--name-only", "-z", `${baseCommit}...HEAD`, "--", "src/",
])
  .split("\0")
  .filter(Boolean);
const workingTreeFiles = git([
  "diff", "--name-only", "-z", "HEAD", "--", "src/",
])
  .split("\0")
  .filter(Boolean);
const untrackedFiles = git([
  "ls-files", "--others", "--exclude-standard", "-z", "--", "src/",
])
  .split("\0")
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
  const oldVersion = versionAt(baseCommit, file);
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
