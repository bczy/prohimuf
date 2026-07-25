#!/usr/bin/env node
// Closes the panel auto-remediation loop.
//
// `@copilot` on a pull request never commits to that PR's branch — Copilot
// opens a *stacked* pull request whose base is the branch under review. This
// script merges such a corrective PR once its own checks are green, which
// lands the fix on the parent branch, then re-dispatches the panel on the
// parent PR.
//
// The explicit dispatch is required: a merge performed with GITHUB_TOKEN does
// not trigger further workflow runs, so the panel would otherwise never
// re-evaluate the fix.
//
// Inputs (env):
//   GH_TOKEN           — required (needs `actions: write` to re-dispatch).
//   HEAD_SHA           — required, the commit whose checks just completed.
//   GITHUB_REPOSITORY  — required.
//   DEFAULT_BRANCH     — required.

import { execFileSync } from "node:child_process";

const { GH_TOKEN, HEAD_SHA, DEFAULT_BRANCH } = process.env;
const OWNER_REPO = process.env.GITHUB_REPOSITORY;

// Copilot coding agent authors its pull requests under these logins.
const COPILOT_LOGINS = new Set(["copilot", "copilot-swe-agent[bot]", "copilot[bot]"]);

function main() {
  for (const [name, value] of [
    ["GH_TOKEN", GH_TOKEN],
    ["HEAD_SHA", HEAD_SHA],
    ["DEFAULT_BRANCH", DEFAULT_BRANCH],
    ["GITHUB_REPOSITORY", OWNER_REPO],
  ]) {
    if (!value) throw new Error(`${name} missing`);
  }
  const [owner, repo] = OWNER_REPO.split("/");

  const prs = JSON.parse(
    gh(["api", `repos/${owner}/${repo}/commits/${HEAD_SHA}/pulls`, "-q", "."]) || "[]",
  );

  const candidates = prs.filter(
    (pr) =>
      pr.state === "open" &&
      pr.base.ref !== DEFAULT_BRANCH &&
      COPILOT_LOGINS.has((pr.user?.login || "").toLowerCase()),
  );

  if (candidates.length === 0) {
    console.log("No open Copilot corrective PR for this commit — nothing to merge.");
    return;
  }

  for (const pr of candidates) {
    if (!allChecksGreen(owner, repo, pr.head.sha)) {
      console.log(`PR #${pr.number}: checks not green — leaving it open.`);
      continue;
    }
    console.log(`PR #${pr.number}: checks green — merging into ${pr.base.ref}.`);
    try {
      gh(["pr", "merge", String(pr.number), "--squash", "--delete-branch", "-R", OWNER_REPO]);
    } catch (err) {
      console.error(`PR #${pr.number}: merge failed: ${err.message}`);
      continue;
    }
    redispatchPanel(owner, repo, pr.base.ref);
  }
}

// Green = every completed check run succeeded (or was neutral/skipped) and none
// is still pending. An unknown or in-progress state is never treated as green.
function allChecksGreen(owner, repo, sha) {
  const data = JSON.parse(
    gh(["api", `repos/${owner}/${repo}/commits/${sha}/check-runs`, "-q", "."]) || "{}",
  );
  const runs = data.check_runs || [];
  if (runs.length === 0) return false;
  const ok = new Set(["success", "neutral", "skipped"]);
  for (const run of runs) {
    if (run.status !== "completed") {
      console.log(`  check "${run.name}" still ${run.status}`);
      return false;
    }
    if (!ok.has(run.conclusion)) {
      console.log(`  check "${run.name}" concluded ${run.conclusion}`);
      return false;
    }
  }
  return true;
}

// The parent PR is the open PR whose head branch is the corrective PR's base.
function redispatchPanel(owner, repo, parentBranch) {
  const parents = JSON.parse(
    gh([
      "api",
      `repos/${owner}/${repo}/pulls?state=open&head=${owner}:${parentBranch}`,
      "-q",
      ".",
    ]) || "[]",
  );
  if (parents.length === 0) {
    console.log(`No open parent PR for branch ${parentBranch} — not re-dispatching.`);
    return;
  }
  for (const parent of parents) {
    console.log(`Re-dispatching the panel on parent PR #${parent.number}.`);
    try {
      gh([
        "workflow",
        "run",
        "code-review-panel.yml",
        "-R",
        OWNER_REPO,
        "-f",
        `pr_number=${parent.number}`,
      ]);
    } catch (err) {
      console.error(`Re-dispatch failed for #${parent.number}: ${err.message}`);
    }
  }
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", env: process.env });
}

try {
  main();
} catch (err) {
  console.error(`[panel-autofix-merge] ${err.message}`);
  process.exit(1);
}
