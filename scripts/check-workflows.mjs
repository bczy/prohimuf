#!/usr/bin/env node
// Static validation of GitHub Actions workflows and local composite actions.
//
// Exists because these three failures each cost a full push → CI → red → fix
// cycle while landing the ADR-0070 panel migration, and every one of them was
// visible in the file on disk:
//
//   1. `uses: ./.github/actions/X` in a job with no prior `actions/checkout`
//      → "Can't find 'action.yml' [...] Did you forget to run
//        actions/checkout before running your local action?"
//      A local action is read off the runner's disk BEFORE any of its own
//      steps run, so a checkout INSIDE the composite is always too late.
//
//   2. A literal empty expression pair written inside a description VALUE
//      → "An expression was expected". GitHub templates values, so prose that
//      shows expression syntax breaks the action. (YAML comments are safe —
//      they are stripped before templating, which is why this walks the
//      parsed document and not the raw lines.)
//
//   3. `uses: ./path` pointing at a directory with no action.yml — a typo or
//      a rename that only surfaces on the runner.
//
// Usage:
//   node scripts/check-workflows.mjs [file...]   (defaults to all workflows
//                                                 and local actions)
// Exit code 1 on any error. Warnings never fail the run.

import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { globSync } from "node:fs";
import { parse } from "yaml";
import { join } from "node:path";

const ERRORS = [];
const WARNINGS = [];

const err = (file, msg, hint) => ERRORS.push({ file, msg, hint });
const warn = (file, msg, hint) => WARNINGS.push({ file, msg, hint });

/** Steps that put the repository on the runner's disk. */
function isCheckout(step) {
  const uses = typeof step?.uses === "string" ? step.uses : "";
  return uses.startsWith("actions/checkout@");
}

/**
 * A checkout that lands in the workspace ROOT. One with `path:` puts the tree
 * in a subdirectory, so it does NOT make `uses: ./...` resolvable.
 */
function isRootCheckout(step) {
  return isCheckout(step) && !step?.with?.path;
}

const EMPTY_EXPR = /\$\{\{\s*\}\}/;

/**
 * Trap 2 — an expression pair with nothing inside it, in a STRING VALUE.
 *
 * Deliberately walks the parsed document rather than the raw lines: several
 * of this repo's workflows legitimately mention the syntax in YAML COMMENTS
 * ("pass this through env, not ${…} interpolation"), and comments are
 * stripped before GitHub templates the file — only values are evaluated.
 * Scanning raw text flags those and trains everyone to ignore the checker.
 */
function checkEmptyExpressions(file, doc) {
  const visit = (node, path) => {
    if (typeof node === "string") {
      if (EMPTY_EXPR.test(node)) {
        err(
          file,
          `empty expression \${{ }} in the value at \`${path || "(root)"}\``,
          "GitHub templates string VALUES — including `description:` — so an " +
            "empty expression fails the whole file to load with 'An " +
            "expression was expected'. Reword so the value does not contain " +
            "the literal sequence (a YAML comment would be fine).",
        );
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => visit(v, `${path}[${String(i)}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        visit(v, path ? `${path}.${k}` : k);
      }
    }
  };
  visit(doc, "");
}

/** Trap 3 — the local action a step points at must actually exist. */
function checkLocalActionExists(file, uses) {
  const dir = uses.replace(/^\.\//, "").replace(/\/+$/, "");
  const hasManifest = ["action.yml", "action.yaml", "Dockerfile"].some((f) =>
    existsSync(join(dir, f)),
  );
  if (!hasManifest) {
    err(
      file,
      `\`uses: ${uses}\` has no action.yml / action.yaml / Dockerfile`,
      "Check the path for a typo, or commit the action manifest.",
    );
  }
}

/** Trap 1 — a local action needs the repo checked out at the ROOT first. */
function checkJobs(file, doc) {
  for (const [jobName, job] of Object.entries(doc?.jobs ?? {})) {
    const steps = Array.isArray(job?.steps) ? job.steps : [];
    let rootCheckedOut = false;

    steps.forEach((step, idx) => {
      if (isRootCheckout(step)) rootCheckedOut = true;

      const uses = typeof step?.uses === "string" ? step.uses : "";
      if (!uses.startsWith("./")) return;

      checkLocalActionExists(file, uses);

      if (!rootCheckedOut) {
        const onlySubdir = steps.slice(0, idx).some((s) => isCheckout(s) && s?.with?.path);
        err(
          file,
          `job \`${jobName}\`, step ${String(idx + 1)}: \`uses: ${uses}\` with no ` +
            `preceding root \`actions/checkout\``,
          onlySubdir
            ? "There IS a checkout before it, but it uses `path:` — that lands " +
                "the tree in a subdirectory, so `uses: ./...` still cannot " +
                "resolve. Add a checkout without `path:` as well."
            : "GitHub reads the action's manifest off disk before running any " +
                "of its steps, so a checkout inside the composite is too late. " +
                "Add `actions/checkout` to this job, before the `uses:` step.",
        );
      }
    });

    // Bootstrap warning: resolving a local action from a ref other than the
    // one being tested means the runner may not have that action yet.
    steps.forEach((step, idx) => {
      const uses = typeof step?.uses === "string" ? step.uses : "";
      if (!uses.startsWith("./")) return;
      const priorRootCheckout = steps.slice(0, idx).filter(isRootCheckout).pop();
      const ref = priorRootCheckout?.with?.ref;
      if (typeof ref === "string" && /base|main|master/.test(ref)) {
        warn(
          file,
          `job \`${jobName}\`: \`uses: ${uses}\` resolves from a BASE-branch checkout`,
          "Deliberate for secret-bearing actions (untrusted PR code must not " +
            "execute), but it means a PR that ADDS or RENAMES this action " +
            "cannot run it until the change is merged. Expect a red job on " +
            "that PR, and say so in its description.",
        );
      }
    });
  }
}

function checkFile(file) {
  const raw = readFileSync(file, "utf8");

  let doc;
  try {
    doc = parse(raw);
  } catch (e) {
    err(file, `YAML does not parse: ${e.message}`);
    return;
  }
  checkEmptyExpressions(file, doc);
  if (doc?.jobs) checkJobs(file, doc);
}

const files =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [...globSync(".github/workflows/*.y?(a)ml"), ...globSync(".github/actions/*/action.y?(a)ml")];

for (const f of files) {
  if (existsSync(f)) checkFile(f);
}

/**
 * actionlint catches a wider class of issues (shellcheck on run blocks,
 * unknown contexts, bad `needs:` graphs) but is an external binary. Run it
 * when it happens to be installed; never make committing depend on it.
 */
function runActionlintIfPresent(targets) {
  const workflows = targets.filter((f) => f.includes(".github/workflows/"));
  if (workflows.length === 0) return;
  const probe = spawnSync("actionlint", ["-version"], { stdio: "ignore" });
  if (probe.error) return;
  const res = spawnSync("actionlint", workflows, { encoding: "utf8" });
  if (res.status !== 0 && res.stdout) {
    // actionlint's own severities include style/info notes; surface its
    // output but let the explicit checks above own the exit code.
    console.warn(`[check-workflows] actionlint:\n${res.stdout.trim()}`);
  }
}

runActionlintIfPresent(files);

for (const w of WARNINGS) {
  console.warn(`[check-workflows] WARN  ${w.file}: ${w.msg}`);
  if (w.hint) console.warn(`                       ↳ ${w.hint}`);
}
for (const e of ERRORS) {
  console.error(`[check-workflows] ERROR ${e.file}: ${e.msg}`);
  if (e.hint) console.error(`                       ↳ ${e.hint}`);
}

if (ERRORS.length > 0) {
  console.error(
    `\n[check-workflows] ${String(ERRORS.length)} error(s) — these fail on the runner, not here. Fix before pushing.`,
  );
  process.exit(1);
}
console.log(
  `[check-workflows] ok — ${String(files.length)} file(s), ${String(WARNINGS.length)} warning(s).`,
);
