#!/usr/bin/env node
/**
 * Build script for tracker variants
 * Minifies the source trackers and outputs to dist/
 */

const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const srcDir = path.join(__dirname, "..", "src");
const outputDir = path.join(__dirname, "..", "dist");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Scripts to build — output into dist/sporing/ so CDN paths stay
// https://cdn.nav.no/team-researchops/sporing/<file>
const scripts = [
  { input: "sporing.js", output: "sporing/sporing.js" },
  { input: "sporing-dev.js", output: "sporing/sporing-dev.js" },
  { input: "sporing-reops.js", output: "sporing/sporing-reops.js" },
];

// Directories whose *contents* are copied verbatim to dist/ (no minification).
// plain/skills/foo/SKILL.md -> https://cdn.nav.no/team-researchops/skills/foo/SKILL.md
const plainDirs = ["plain"];

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("Building tracker scripts...\n");

async function buildScripts() {
  // Build main scripts
  for (const { input, output } of scripts) {
    const inputFile = path.join(srcDir, input);
    const outputFile = path.join(outputDir, output);

    if (!fs.existsSync(inputFile)) {
      console.log(`⚠ Skipping ${input} (not found)`);
      continue;
    }

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    console.log(`Building ${output}...`);

    try {
      const code = fs.readFileSync(inputFile, "utf8");
      const result = await minify(code, {
        compress: {
          drop_console: false,
          drop_debugger: true,
        },
        mangle: true,
        format: {
          comments: false,
        },
      });

      if (result.error) {
        throw result.error;
      }

      fs.writeFileSync(outputFile, result.code);
      const stats = fs.statSync(outputFile);
      console.log(
        `✓ ${output} built successfully (${Math.round((stats.size / 1024) * 10) / 10} KB)`,
      );
    } catch (error) {
      console.error(`✗ Failed to build ${output}:`, error.message);
      process.exit(1);
    }
  }

  // Copy plain (verbatim) directories — contents land at dist root
  for (const dir of plainDirs) {
    const src = path.join(__dirname, "..", dir);
    if (!fs.existsSync(src)) {
      console.log(`⚠ Skipping ${dir}/ (not found)`);
      continue;
    }
    copyDirRecursive(src, outputDir);
    console.log(`✓ ${dir}/ copied verbatim`);
  }

  console.log("\n✓ Build complete!");
}

buildScripts().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
