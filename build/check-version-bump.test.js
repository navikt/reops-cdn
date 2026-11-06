const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const checker = path.join(__dirname, "check-version-bump.js");

function fixture(t, files = { "src/tracker.js": 'const VERSION = "1";\n' }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "version-check-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd: dir,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.invalid",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.invalid",
    },
  }).trim();
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  };
  git("init", "--quiet");
  for (const [file, content] of Object.entries(files)) write(file, content);
  git("add", "--", ".");
  git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Base");
  const base = git("rev-parse", "HEAD");
  const run = (ref = base) => spawnSync(process.execPath, [checker, ref], {
    cwd: dir,
    encoding: "utf8",
  });
  return { dir, git, write, run };
}

test("unchanged scripts pass", (t) => {
  const { run } = fixture(t);
  assert.equal(run().status, 0);
});

test("working-tree edits require a version bump", (t) => {
  const { write, run } = fixture(t);
  write("src/tracker.js", 'const VERSION = "1";\n// changed\n');
  assert.equal(run().status, 1);
  write("src/tracker.js", 'const VERSION = "2";\n// changed\n');
  assert.equal(run().status, 0);
});

test("committed edits require a version bump", (t) => {
  const { write, git, run } = fixture(t);
  write("src/tracker.js", 'const VERSION = "1";\n// changed\n');
  git("add", "--", ".");
  git("-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Change");
  assert.equal(run().status, 1);
});

test("untracked scripts are detected without executing their contents", (t) => {
  const { dir, write, run } = fixture(t);
  write("src/new.js", 'const VERSION = "1";\nrequire("fs").writeFileSync("PWNED", "yes");\n');
  const result = run();
  assert.equal(result.status, 0);
  assert.match(result.stdout, /src\/new\.js is new/);
  assert.equal(fs.existsSync(path.join(dir, "PWNED")), false);
});

test("hostile filenames stay literal and still require a version bump", (t) => {
  const files = [
    "src/$(touch PWNED).js",
    "src/`touch PWNED`.js",
    "src/quote'\";touch PWNED;.js",
    "src/space and\nnewline.js",
  ];
  const { dir, write, run } = fixture(t, Object.fromEntries(
    files.map((file) => [file, 'const VERSION = "1";\n']),
  ));
  for (const file of files) write(file, 'const VERSION = "1";\n// changed\n');
  const result = run();
  assert.equal(result.status, 1);
  assert.equal((result.stderr.match(/VERSION not bumped/g) || []).length, files.length);
  assert.equal(fs.existsSync(path.join(dir, "PWNED")), false);
  for (const file of files) write(file, 'const VERSION = "2";\n');
  assert.equal(run().status, 0);
});

test("trusted checker runs even when the PR replaces its own checker", (t) => {
  const { dir, write, run } = fixture(t);
  write("build/check-version-bump.js", 'require("fs").writeFileSync("PWNED", "yes");\n');
  write("src/tracker.js", 'const VERSION = "1";\n// changed\n');
  assert.equal(run().status, 1);
  assert.equal(fs.existsSync(path.join(dir, "PWNED")), false);
});

test("hostile refs cannot execute shell commands or become options", (t) => {
  const { dir, run } = fixture(t);
  assert.notEqual(run("HEAD;touch PWNED").status, 0);
  assert.notEqual(run("--help").status, 0);
  assert.equal(fs.existsSync(path.join(dir, "PWNED")), false);
});
