#!/usr/bin/env node
/**
 * test-affected — Prohibition remake (muf)
 * Runs only the tests impacted by your local changes.
 *
 * Pipeline:
 *   1. Resolve changed files vs git (tracked diff + untracked, excluding ignored).
 *   2. Feed them to `codegraph affected --stdin --quiet` (traces import deps
 *      to find the test files those changes impact). Run from repo root.
 *   3. Run `yarn vitest run <affected test files>` and propagate its exit code.
 *
 * Dependency-free: Node built-ins only.
 *
 * Usage:
 *   node scripts/test-affected.mjs
 *   yarn test:affected
 */

import { execFileSync, spawnSync } from "node:child_process";
import process from "node:process";

// Resolve repo root from this script's location (scripts/ -> repo root).
const REPO_ROOT = new URL("..", import.meta.url).pathname;

/** Print a readable error and exit non-zero (B4). */
function fail(message) {
  console.error(`[test:affected] ${message}`);
  process.exit(1);
}

/**
 * Run a git command from the repo root and return trimmed stdout.
 * Throws on non-zero / missing binary (caught by the caller -> fail()).
 */
function git(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

/** Collect changed files: tracked changes vs HEAD + untracked (non-ignored). */
function getChangedFiles() {
  let diff;
  let untracked;
  try {
    diff = git(["diff", "--name-only", "HEAD"]);
    untracked = git(["ls-files", "--others", "--exclude-standard"]);
  } catch (e) {
    fail(`git failed (is this a git repo, and is git installed?): ${e.message}`);
  }

  const files = [...diff.split("\n"), ...untracked.split("\n")]
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  // De-duplicate (a file could appear in both lists in edge cases).
  return [...new Set(files)];
}

/**
 * Pass changed files to codegraph via stdin and return the affected test
 * files it reports (one per line). Throws on non-zero / missing binary.
 */
function getAffectedTests(changedFiles) {
  const result = spawnSync("codegraph", ["affected", "--stdin", "--quiet"], {
    cwd: REPO_ROOT,
    input: changedFiles.join("\n") + "\n",
    encoding: "utf8",
  });

  if (result.error) {
    // ENOENT etc. — binary not found or could not be spawned.
    fail(`could not run codegraph (is it installed and on PATH?): ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    fail(`codegraph exited with code ${String(result.status)}${stderr ? `: ${stderr}` : ""}`);
  }

  return (result.stdout || "")
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

function main() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log("[test:affected] No changed files vs HEAD — nothing to run.");
    process.exit(0);
  }

  const affectedTests = getAffectedTests(changedFiles);

  if (affectedTests.length === 0) {
    console.log(
      `[test:affected] ${String(changedFiles.length)} changed file(s), but no affected tests — nothing to run.`,
    );
    process.exit(0);
  }

  console.log(
    `[test:affected] Running ${String(affectedTests.length)} affected test file(s):`,
  );
  for (const t of affectedTests) {
    console.log(`  - ${t}`);
  }

  // Run the affected tests; inherit stdio so vitest output streams through.
  const run = spawnSync("yarn", ["vitest", "run", ...affectedTests], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });

  if (run.error) {
    fail(`could not run vitest via yarn: ${run.error.message}`);
  }

  // Propagate vitest's exit code (B2/B4).
  process.exit(run.status ?? 1);
}

main();
