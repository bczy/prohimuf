#!/usr/bin/env node
// Panel reviewer — materialises anthropics/claude-code-action@v1's structured
// output into this reviewer's findings artifact. Replaces
// scripts/panel-invoke-reviewer.mjs, which called the Anthropic/GitHub-Models
// APIs directly; the model call itself is now a workflow step
// (.github/actions/panel-reviewer/action.yml step "d"), since
// claude-code-action is a GitHub Action, not an importable transport. See
// ADR-0070.
//
// Inputs (env):
//   PANEL_STRUCTURED_OUTPUT — the action's `structured_output` output; an
//     object matching PANEL_FINDINGS_SCHEMA (see the workflow), i.e.
//     `{ reviewed_files: string[], findings: Finding[] }`.
//   FINDINGS_FILE — path to write `findings` (the array, unchanged) to.
//   ROLE — this reviewer's angle (code-review, edge-case-hunter,
//     bmad-review, security-review); used for the coverage sidecar name and
//     log lines only.
//
// Inputs (files):
//   panel-input/files.txt — name-status diff listing from the prepare job,
//     used to compute the coverage guard below.
//
// Failure modes, both surfaced as a non-zero exit (DEGRADED at triage; see
// the workflow's "Collect failed panel jobs" step):
//   - PANEL_STRUCTURED_OUTPUT is missing/not JSON/has no `findings` array —
//     the agent answered garbage (or the action itself never produced
//     output). Nothing is written; there is nothing trustworthy to write.
//   - `reviewed_files` is empty while the diff touched files — the agent
//     never actually looked at the diff. `findings` (however empty) is
//     still written first, so a legitimately empty review is not lost, then
//     the job fails on the coverage guard.
//
// Coverage is otherwise LOGGED, not enforced: a `coverage-<role>.json`
// sidecar and a $GITHUB_STEP_SUMMARY entry list any changed file missing
// from `reviewed_files`, so partial coverage is visible without blocking —
// there is no calibration data yet to say how much partial coverage is
// tolerable. That's an intentional scope cut.

import { appendFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const { PANEL_STRUCTURED_OUTPUT, FINDINGS_FILE, ROLE, GITHUB_STEP_SUMMARY } = process.env;

async function main() {
  if (!FINDINGS_FILE) throw new Error("FINDINGS_FILE missing");
  if (!ROLE) throw new Error("ROLE missing");

  const parsed = parseStructuredOutput(PANEL_STRUCTURED_OUTPUT);

  await writeFile(FINDINGS_FILE, JSON.stringify(parsed.findings, null, 2));
  console.log(`[panel-write-findings:${ROLE}] wrote ${String(parsed.findings.length)} finding(s)`);

  await checkCoverage(parsed.reviewed_files);
}

function parseStructuredOutput(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw ?? "");
  } catch {
    throw new Error(
      `PANEL_STRUCTURED_OUTPUT is not valid JSON — the agent answered garbage or produced no output: ${String(raw).slice(0, 300)}`,
    );
  }
  if (!Array.isArray(parsed?.findings)) {
    throw new Error("structured output has no `findings` array — the agent answered garbage");
  }
  return {
    findings: parsed.findings,
    reviewed_files: Array.isArray(parsed.reviewed_files) ? parsed.reviewed_files : [],
  };
}

/** `git diff --name-status` lines → the changed paths, deleted files excluded
 * (the reviewer job checks out the PR head, so a deleted file cannot be
 * opened there — it would be unreasonable to require it in `reviewed_files`). */
async function changedFiles() {
  if (!existsSync("panel-input/files.txt")) return [];
  const raw = await readFile("panel-input/files.txt", "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("D\t"))
    .map((line) => line.split("\t").pop())
    .filter(Boolean);
}

async function checkCoverage(reviewedFiles) {
  const changed = await changedFiles();
  const reviewedSet = new Set(reviewedFiles);
  const missed = changed.filter((f) => !reviewedSet.has(f));

  await writeFile(
    `coverage-${ROLE}.json`,
    JSON.stringify(
      { role: ROLE, changed_files: changed, reviewed_files: reviewedFiles, missed_files: missed },
      null,
      2,
    ),
  );

  const summary = [
    `### Coverage — ${ROLE}`,
    `- changed files: ${String(changed.length)}`,
    `- reviewed_files reported: ${String(reviewedFiles.length)}`,
    missed.length > 0
      ? `- **not in reviewed_files:** ${missed.join(", ")}`
      : "- all changed files accounted for",
    "",
  ].join("\n");
  if (GITHUB_STEP_SUMMARY) {
    await appendFile(GITHUB_STEP_SUMMARY, `${summary}\n`);
  } else {
    console.log(summary);
  }

  if (reviewedFiles.length === 0 && changed.length > 0) {
    throw new Error(
      `reviewed_files is empty but ${String(changed.length)} file(s) changed — coverage guard failed`,
    );
  }
}

main().catch((err) => {
  console.error(`[panel-write-findings] ${err.message}`);
  process.exit(1);
});
