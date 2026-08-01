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

  it("counts attempts across a merge whose resolution DISCARDED them (--full-history)", () => {
    // Attempt 2 lands on a side branch, then a `-s ours` merge discards its
    // change to the counter. Default `git log <range> -- <path>` history
    // simplification follows only the TREESAME parent and never shows that
    // commit (count: 1 → guard passes). With --full-history the pruned side
    // is walked too (attempt 2 AND the non-TREESAME merge count), so the
    // guard sees >= 3 and must FAIL — a paid attempt whose trace a merge
    // resolution dropped still spent real money.
    commitPaidAttemptTrace(1);
    git(work, "checkout", "-q", "-b", "side");
    commitPaidAttemptTrace(2);
    git(work, "checkout", "-q", "feat/test");
    git(work, "merge", "-q", "-s", "ours", "--no-edit", "side");
    git(work, "fetch", "-q", "origin", "main");
    const res = runStep(GUARD_SCRIPT, work, { LEVEL_ID });
    expect(res.stdout).toContain(": 3");
    expect(res.status).not.toBe(0);
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

  it("retries a rejected push with rebase — the trace lands EXACTLY ONCE (no double-count)", () => {
    // Push the branch once so it exists on origin, then diverge origin from
    // under us (a sibling workflow's commit-back landed first) so our push is
    // a rejected non-FF. The rebase retry must replay the ONE local trace
    // commit on top and succeed — never re-commit it (a second trace commit
    // for the same attempt would double-count against the 3-attempt cap).
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
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/rebasing and retrying/);

    const check = fs.mkdtempSync(path.join(os.tmpdir(), "gen-plan-backdrop-check-"));
    git(tmpRoot, "clone", "-q", "-b", "feat/test", origin, check);
    // Both sides landed: the divergent commit AND the trace commit.
    expect(fs.existsSync(path.join(check, "divergent.txt"))).toBe(true);
    const counterRel = `public/assets/levels/${LEVEL_ID}/.paid-attempts`;
    expect(fs.existsSync(path.join(check, counterRel))).toBe(true);
    // EXACTLY one commit touches the counter — the cap semantics the retry
    // must never break.
    const touching = git(check, "log", "--full-history", "--oneline", "--", counterRel)
      .trim()
      .split("\n")
      .filter(Boolean);
    expect(touching).toHaveLength(1);
    fs.rmSync(check, { recursive: true, force: true });
  });

  it("FAILS after 3 persistent rejections — never spends without a pushed trace", () => {
    // The branch exists on origin, then origin starts refusing every push
    // (pre-receive hook): the retry loop must exhaust its 3 attempts and fail
    // loudly BEFORE any paid call could run.
    git(work, "push", "-q", "-u", "origin", "feat/test");
    const hook = path.join(origin, "hooks", "pre-receive");
    fs.writeFileSync(hook, "#!/bin/sh\nexit 1\n");
    fs.chmodSync(hook, 0o755);

    const res = runStep(RECORD_SCRIPT, work, {
      LEVEL_ID,
      GITHUB_RUN_ID: "424242",
      GITHUB_REF_NAME: "feat/test",
    });
    expect(res.status).not.toBe(0);
    expect(res.stdout).toMatch(/push attempt 3 rejected/);
    expect(res.stdout).toMatch(/refusing to spend a paid call/);
  });
});

describe("gen-plan-backdrop.yml — commit-back step and artifact fallback (static)", () => {
  // The commit-back's real push behaviour is the same loop the record step
  // proves dynamically above — here we pin that the step USES it (the panel
  // run-2 MAJEUR: a single-shot push hard-failed on the exact race its
  // sibling workflows self-heal from) and that a paid-for PNG survives the
  // runner via the artifact fallback when every push fails.
  const COMMIT_SCRIPT = loadStep("Commit the generated backdrop");

  it("wraps the push in the sibling workflows' 3-attempt rebase retry", () => {
    expect(COMMIT_SCRIPT).toMatch(/for attempt in 1 2 3/);
    expect(COMMIT_SCRIPT).toMatch(/git pull --rebase --autostash origin/);
    expect(COMMIT_SCRIPT).toMatch(/attempt still counts against the cap/);
  });

  it("no longer promises a cost-free re-run — it points at the artifact instead", () => {
    expect(COMMIT_SCRIPT).not.toMatch(/re-run this same dispatch/);
    expect(COMMIT_SCRIPT).toMatch(/plan-backdrop-unpushed/);
  });

  it("declares an if: failure() upload-artifact step for the unpushed backdrop", () => {
    const doc = parse(fs.readFileSync(WORKFLOW, "utf8"));
    const step = doc.jobs.generate.steps.find(
      (s) => s.name === "Upload generated backdrop (push failed)",
    );
    expect(step).toBeDefined();
    expect(step.if).toBe("failure()");
    expect(step.uses).toMatch(/^actions\/upload-artifact@/);
    expect(step.with.name).toBe("plan-backdrop-unpushed");
    expect(step.with.path).toContain("public/assets/levels/");
  });
});

describe("gen-plan-backdrop.yml — short-circuit step (dry run)", () => {
  // Panel run-2 MAJEUR: re-dispatching an already-generated level used to
  // burn a capped attempt (trace pushed BEFORE the paid call) and then
  // hard-fail the commit step on "nothing staged". The precheck applies the
  // script's own skip-if-exists idempotence at workflow level, BEFORE the
  // guard and BEFORE the trace. It runs against the real repo checkout (it
  // resolves the target through planRunTarget on the fixture plan), not the
  // disposable git pair.
  const PRECHECK_SCRIPT = loadStep("Short-circuit — backdrop already generated");
  const FIXTURE_DIR = path.join(REPO_ROOT, "public", "assets", "levels", "fixture");
  const FIXTURE_PNG = path.join(FIXTURE_DIR, "street-wide.png");

  function runPrecheck(env) {
    const outFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gh-output-")), "out");
    fs.writeFileSync(outFile, "");
    const res = spawnSync("bash", ["-c", PRECHECK_SCRIPT], {
      cwd: REPO_ROOT,
      env: { ...process.env, LEVEL_ID: "fixture", GITHUB_OUTPUT: outFile, ...env },
      encoding: "utf8",
    });
    return { res, output: fs.readFileSync(outFile, "utf8") };
  }

  it("sets skip=false when the target backdrop is absent from the branch", () => {
    expect(fs.existsSync(FIXTURE_PNG)).toBe(false); // fixture ships no assets, by contract
    const { res, output } = runPrecheck({});
    expect(res.status).toBe(0);
    expect(output).toContain("skip=false");
  });

  it("short-circuits (skip=true, exit 0) when the backdrop already exists and FORCE != 1", () => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(FIXTURE_PNG, "png-bytes");
    try {
      const { res, output } = runPrecheck({});
      expect(res.status).toBe(0);
      expect(output).toContain("skip=true");
      expect(res.stdout).toMatch(/already generated .*nothing to pay/);
    } finally {
      fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
    }
  });

  it("does NOT short-circuit under FORCE=1 (explicit paid regeneration)", () => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(FIXTURE_PNG, "png-bytes");
    try {
      const { res, output } = runPrecheck({ FORCE: "1" });
      expect(res.status).toBe(0);
      expect(output).toContain("skip=false");
    } finally {
      fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
    }
  });

  it("gates every paid step on the precheck's skip output", () => {
    const doc = parse(fs.readFileSync(WORKFLOW, "utf8"));
    const steps = doc.jobs.generate.steps;
    const precheck = steps.find((s) => s.name === "Short-circuit — backdrop already generated");
    expect(precheck.id).toBe("precheck");
    for (const name of [
      "Guard — cap 3 PAID ATTEMPTS per level per PR",
      "Record a paid attempt (commit + PUSH, before the paid call)",
      "Generate the backdrop (paid)",
      "Commit the generated backdrop",
    ]) {
      const step = steps.find((s) => s.name === name);
      expect(step.if, name).toBe("steps.precheck.outputs.skip != 'true'");
    }
    // The precheck must run BEFORE the guard and the trace — its whole point.
    const order = steps.map((s) => s.name);
    expect(order.indexOf("Short-circuit — backdrop already generated")).toBeLessThan(
      order.indexOf("Guard — cap 3 PAID ATTEMPTS per level per PR"),
    );
  });
});
