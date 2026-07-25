#!/usr/bin/env node
// Panel triage — reads findings-confirmed.json, posts a summary comment on
// the PR, and publishes the `panel-verdict` check run. No LLM call: this is
// pure aggregation + GitHub API.
//
// Verdict rules:
//   - Any reviewer/skeptic job that FAILED → DEGRADED (ADR-0067)
//   - Any confirmed BLOQUANT               → FAIL
//   - Any confirmed MAJEUR                 → CONDITIONAL
//   - Otherwise                            → PASS
//
// DEGRADED exists because zero findings has two very different causes: the diff
// was reviewed and is clean, or the reviewers never ran (an LLM outage — see
// ADR-0067). Both used to publish PASS, which made the gate decorative exactly
// when it was needed. A degraded run is never `success`.
//
// Inputs (env):
//   GH_TOKEN         — required (github.token from workflow).
//   PR_NUMBER        — required.
//   HEAD_SHA         — required (from prepare job output).
//   PANEL_FAILED_JOBS — optional, comma-separated names of panel jobs whose
//                      result was `failure`/`cancelled`. Non-empty ⇒ DEGRADED.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { decide } from "./lib/panelVerdict.mjs";

const { GH_TOKEN, PR_NUMBER, HEAD_SHA, PANEL_FAILED_JOBS = "" } = process.env;
const OWNER_REPO = process.env.GITHUB_REPOSITORY;

function requireEnv(name, value) {
  if (!value) throw new Error(`${name} missing`);
  return value;
}

async function main() {
  requireEnv("GH_TOKEN", GH_TOKEN);
  requireEnv("PR_NUMBER", PR_NUMBER);
  requireEnv("HEAD_SHA", HEAD_SHA);
  requireEnv("GITHUB_REPOSITORY", OWNER_REPO);

  const artifactExists = existsSync("findings-confirmed.json");
  const findings = artifactExists
    ? JSON.parse(await readFile("findings-confirmed.json", "utf8"))
    : [];

  const confirmed = findings.filter((f) => f.confirmed !== false);
  const counts = tally(confirmed);
  const degraded = PANEL_FAILED_JOBS.split(",")
    .map((j) => j.trim())
    .filter(Boolean);

  // ADR-0067 fail-safe: a missing findings-confirmed artifact from a job that
  // reported success means the artifact was undownloadable — the diff was NOT
  // reviewed. Treat as DEGRADED rather than an empty (and therefore green) PASS.
  if (!artifactExists && !degraded.includes("skeptic")) {
    degraded.push("skeptic(artifact-missing)");
  }

  const verdict = decide(counts, degraded);

  const body = renderComment(confirmed, counts, verdict);
  postComment(body);
  publishCheckRun(verdict, counts, body);

  console.log(`panel-verdict = ${verdict.conclusion} (${verdict.summary})`);
}

function tally(findings) {
  const c = { BLOQUANT: 0, MAJEUR: 0, MINEUR: 0, OTHER: 0 };
  for (const f of findings) {
    const sev = (f.severity || "").toUpperCase();
    if (sev in c) c[sev] += 1;
    else c.OTHER += 1;
  }
  return c;
}

function renderComment(findings, counts, verdict) {
  const header = [
    "## Code Review Panel — verdict",
    "",
    `**${verdict.title}**`,
    "",
    `- BLOQUANT: ${counts.BLOQUANT}`,
    `- MAJEUR: ${counts.MAJEUR}`,
    `- MINEUR: ${counts.MINEUR}`,
    counts.OTHER ? `- OTHER: ${counts.OTHER}` : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  if (verdict.degraded !== undefined) {
    return (
      `${header}\n` +
      `These panel jobs did not complete: **${verdict.degraded.join(", ")}**.\n\n` +
      "The diff was therefore NOT fully reviewed — the counts above are not a\n" +
      "clean bill of health. Re-run the panel once the cause is fixed (see\n" +
      "ADR-0067 for the provider fallback), or merge only on an explicit human\n" +
      "decision to waive the gate.\n"
    );
  }

  if (findings.length === 0) {
    return `${header}\nNo confirmed findings. See ADR-0063 for the panel contract.\n`;
  }

  const rows = findings.map((f) => {
    const sev = (f.severity || "?").toUpperCase();
    const reviewer = f._reviewer || "?";
    const loc = f.file ? `\`${f.file}${f.line ? `:${f.line}` : ""}\`` : "";
    const title = f.title || "(untitled)";
    const scenario = (f.scenario || "").replace(/\n/g, " ");
    const fix = (f.suggested_fix || "").replace(/\n/g, " ");
    return [
      `### [${sev}] ${title}`,
      `- Reviewer: \`${reviewer}\``,
      loc ? `- Location: ${loc}` : "",
      scenario ? `- Scenario: ${scenario}` : "",
      fix ? `- Suggested fix: ${fix}` : "",
      "",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return `${header}\n${rows.join("\n")}`;
}

function postComment(body) {
  const [owner, repo] = OWNER_REPO.split("/");
  const args = [
    "api",
    `repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`,
    "-X",
    "POST",
    "-f",
    `body=${body}`,
  ];
  try {
    execFileSync("gh", args, { stdio: "inherit", env: process.env });
  } catch (err) {
    console.error(`Comment post failed: ${err.message}`);
  }
}

function publishCheckRun(verdict, counts, body) {
  const [owner, repo] = OWNER_REPO.split("/");
  const payload = {
    name: "panel-verdict",
    head_sha: HEAD_SHA,
    status: "completed",
    conclusion: verdict.conclusion,
    output: {
      title: verdict.title,
      summary: verdict.summary,
      text: body.slice(0, 65000),
    },
  };
  const args = ["api", `repos/${owner}/${repo}/check-runs`, "-X", "POST", "--input", "-"];
  try {
    execFileSync("gh", args, {
      input: JSON.stringify(payload),
      stdio: ["pipe", "inherit", "inherit"],
      env: process.env,
    });
  } catch (err) {
    console.error(`Check-run publish failed: ${err.message}`);
    // Exit non-zero so branch protection blocks the merge if the check itself
    // couldn't be published — this is safer than silently letting the PR
    // through.
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[panel-triage] ${err.message}`);
  process.exit(1);
});
