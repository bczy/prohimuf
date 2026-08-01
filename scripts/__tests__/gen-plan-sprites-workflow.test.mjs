import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { parse } from "yaml";

/**
 * Dry-run of gen-plan-sprites.yml's "[props] Style gate" step (SP2 T5) — the
 * loop reads `gen-nearfg-sprites.mjs --plan <id> --list` and calls
 * check-nearfg-style.mjs per prop. Two bash traps are pinned here:
 *   - `cmd | while read; do fail=1; done` runs the loop body in a SUBSHELL,
 *     so `fail=1` never reaches the `exit "$fail"` after the loop;
 *   - `done < <(cmd)` hides cmd's exit status from `set -e`, so a crashed
 *     --list would gate ZERO props and exit 0 — a silent vacuous PASS
 *     (PR #156 panel finding). The list is captured via a plain assignment
 *     (errexit-visible) and fed to the loop with a here-string instead.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const WORKFLOW = path.join(REPO_ROOT, ".github", "workflows", "gen-plan-sprites.yml");

function loadStep(stepName) {
  const doc = parse(fs.readFileSync(WORKFLOW, "utf8"));
  const steps = doc.jobs.generate.steps;
  const step = steps.find((s) => s.name === stepName);
  if (!step) throw new Error(`step "${stepName}" not found in ${WORKFLOW}`);
  return step.run;
}

const STYLE_GATE_SCRIPT = loadStep("[props] Style gate (grey/C1 + silhouette) — one per plan prop");

it("never pipes the per-prop loop into a subshell (fail=1 must survive the loop)", () => {
  // Static guard against the exact regression this test exists for: a pipe
  // into `while read` — `| while read` — silently drops `fail=1`.
  expect(STYLE_GATE_SCRIPT).not.toMatch(/\|\s*while\s+read/);
});

it("never feeds the loop from a process substitution (--list's own failure must be seen)", () => {
  // `done < <(cmd)` hides cmd's exit status from errexit — the list must be
  // captured as a plain assignment first, then fed to the loop.
  expect(STYLE_GATE_SCRIPT).not.toMatch(/<\s*<\(/);
  expect(STYLE_GATE_SCRIPT).toMatch(/list=\$\(node scripts\/gen-nearfg-sprites\.mjs/);
});

it("FAILS (non-zero) when the --list subprocess itself fails — no vacuous PASS", () => {
  // A level id with no plan makes `gen-nearfg-sprites.mjs --plan … --list`
  // itself exit non-zero before printing a single prop line. The gate must
  // fail loudly, not iterate zero times and exit 0.
  const res = spawnSync("bash", ["-c", STYLE_GATE_SCRIPT], {
    cwd: REPO_ROOT,
    env: { ...process.env, LEVEL_ID: "no-such-generated-level" },
    encoding: "utf8",
  });
  expect(res.status).not.toBe(0);
});

it("FAILS (non-zero) when the plan's prop file is missing — real bash run", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-plan-sprites-"));
  try {
    // Exercise the REAL script against the real fixture plan (no PNG on disk
    // for it — never generated, per its own doc comment) from the repo root,
    // so the relative `node scripts/...` calls resolve exactly as they would
    // on the runner (working-directory == repo root).
    const res = spawnSync("bash", ["-c", STYLE_GATE_SCRIPT], {
      cwd: REPO_ROOT,
      env: { ...process.env, LEVEL_ID: "fixture" },
      encoding: "utf8",
    });
    expect(res.status).not.toBe(0);
    expect(res.stdout).toMatch(/MISSING/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
