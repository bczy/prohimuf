import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync, spawnSync } from "child_process";
import { parse } from "yaml";

/**
 * Dry-run of gen-plan-backdrop.yml's two budget-guard steps (SP2 T3, cap
 * corrected by the code-review panel — see the workflow's own header comment)
 * — in a REAL disposable git repo, not a parsed-YAML assertion, because the
 * behaviour this cap depends on (git log over a path, a rejected push) can
 * only be proven by actually running it. No GitHub Actions runner involved:
 * this extracts each step's `run:` block verbatim and executes it with bash,
 * env-for-env the same way the runner would, against a throwaway origin/work
 * pair of repos.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const WORKFLOW = path.join(REPO_ROOT, ".github", "workflows", "gen-plan-backdrop.yml");

function loadStep(stepName) {
  const doc = parse(fs.readFileSync(WORKFLOW, "utf8"));
  const steps = doc.jobs.generate.steps;
  const step = steps.find((s) => s.name === stepName);
  if (!step) throw new Error(`step "${stepName}" not found in ${WORKFLOW}`);
  return step.run;
}

const GUARD_SCRIPT = loadStep("Guard — cap 3 PAID ATTEMPTS per level per PR");
const RECORD_SCRIPT = loadStep("Record a paid attempt (commit + PUSH, before the paid call)");

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function runStep(script, cwd, env) {
  return spawnSync("bash", ["-c", script], {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

let tmpRoot;
let origin;
let work;
const LEVEL_ID = "fixture-plan-cap";

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gen-plan-backdrop-"));
  origin = path.join(tmpRoot, "origin.git");
  work = path.join(tmpRoot, "work");
  git(tmpRoot, "init", "--bare", "-q", origin);
  git(tmpRoot, "clone", "-q", origin, work);
  git(work, "config", "user.name", "test");
  git(work, "config", "user.email", "test@example.com");
  fs.writeFileSync(path.join(work, "README.md"), "seed\n");
  git(work, "add", ".");
  git(work, "commit", "-q", "-m", "chore: seed main");
  git(work, "branch", "-M", "main");
  git(work, "push", "-q", "-u", "origin", "main");
  git(work, "checkout", "-q", "-b", "feat/test");
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function commitPaidAttemptTrace(n) {
  const counter = path.join(work, "public", "assets", "levels", LEVEL_ID, ".paid-attempts");
  fs.mkdirSync(path.dirname(counter), { recursive: true });
  fs.appendFileSync(counter, `attempt ${String(n)}\n`);
  git(work, "add", "-f", counter);
  git(work, "commit", "-q", "-m", `chore(assets): record a paid backdrop attempt for ${LEVEL_ID}`);
}

describe("gen-plan-backdrop.yml — guard step (dry run)", () => {
  it("passes with 0 attempts (counter file never committed at all)", () => {
    git(work, "fetch", "-q", "origin", "main");
    const res = runStep(GUARD_SCRIPT, work, { LEVEL_ID });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("paid attempts so far for 'fixture-plan-cap': 0");
  });

  it("passes with exactly 2 prior attempts (cap allows a 3rd)", () => {
    commitPaidAttemptTrace(1);
    commitPaidAttemptTrace(2);
    git(work, "fetch", "-q", "origin", "main");
    const res = runStep(GUARD_SCRIPT, work, { LEVEL_ID });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(": 2");
  });

  it("fails at exactly 3 prior attempts (the hard cap)", () => {
    commitPaidAttemptTrace(1);
    commitPaidAttemptTrace(2);
    commitPaidAttemptTrace(3);
    git(work, "fetch", "-q", "origin", "main");
    const res = runStep(GUARD_SCRIPT, work, { LEVEL_ID });
    expect(res.status).not.toBe(0);
    // `echo "::error::…"` is a GitHub annotation written to STDOUT by
    // convention, not stderr.
    expect(res.stdout).toMatch(/cap/i);
  });

  it("counts ATTEMPTS (commits touching the counter), not the counter's own content", () => {
    // Two commits, but each appends TWO lines to the counter — content is not
    // what the cap reads, only commit count on the path.
    const counter = path.join(work, "public", "assets", "levels", LEVEL_ID, ".paid-attempts");
    fs.mkdirSync(path.dirname(counter), { recursive: true });
    fs.writeFileSync(counter, "line 1\nline 2\n");
    git(work, "add", "-f", counter);
    git(work, "commit", "-q", "-m", "chore(assets): record a paid backdrop attempt (batched)");
    git(work, "fetch", "-q", "origin", "main");
    const res = runStep(GUARD_SCRIPT, work, { LEVEL_ID });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(": 1");
  });
});

describe("gen-plan-backdrop.yml — record-attempt step (dry run)", () => {
  it("commits and PUSHES the trace file before any paid call", () => {
    const res = runStep(RECORD_SCRIPT, work, {
      LEVEL_ID,
      GITHUB_RUN_ID: "424242",
      GITHUB_REF_NAME: "feat/test",
    });
    expect(res.status).toBe(0);
    const counter = path.join(work, "public", "assets", "levels", LEVEL_ID, ".paid-attempts");
    expect(fs.existsSync(counter)).toBe(true);
    // Pushed, not just committed locally: a fresh clone of origin must see it.
    const check = fs.mkdtempSync(path.join(os.tmpdir(), "gen-plan-backdrop-check-"));
    git(tmpRoot, "clone", "-q", "-b", "feat/test", origin, check);
    expect(
      fs.existsSync(path.join(check, "public", "assets", "levels", LEVEL_ID, ".paid-attempts")),
    ).toBe(true);
    fs.rmSync(check, { recursive: true, force: true });
  });

  it("FAILS (does not silently continue) when the push is rejected", () => {
    // Push the branch once so it exists on origin, then diverge origin from
    // under us (another run pushed first) so our push is a rejected non-FF.
    git(work, "push", "-q", "-u", "origin", "feat/test");
    const other = fs.mkdtempSync(path.join(os.tmpdir(), "gen-plan-backdrop-other-"));
    git(tmpRoot, "clone", "-q", "-b", "feat/test", origin, other);
    git(other, "config", "user.name", "other");
    git(other, "config", "user.email", "other@example.com");
    fs.writeFileSync(path.join(other, "divergent.txt"), "x\n");
    git(other, "add", ".");
    git(other, "commit", "-q", "-m", "chore: diverge origin");
    git(other, "push", "-q", "origin", "feat/test");
    fs.rmSync(other, { recursive: true, force: true });

    const res = runStep(RECORD_SCRIPT, work, {
      LEVEL_ID,
      GITHUB_RUN_ID: "424242",
      GITHUB_REF_NAME: "feat/test",
    });
    expect(res.status).not.toBe(0);
    expect(res.stdout).toMatch(/refusing to spend a paid call/);
  });
});
