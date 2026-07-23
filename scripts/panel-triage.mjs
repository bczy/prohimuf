#!/usr/bin/env node
// Panel triage — reads findings-confirmed.json, posts a summary comment on
// the PR, and publishes the `panel-verdict` check run. No LLM call: this is
// pure aggregation + GitHub API.
//
// Verdict rules:
//   - Any confirmed BLOQUANT  → FAIL
//   - Any confirmed MAJEUR    → CONDITIONAL
//   - Otherwise               → PASS
//
// Inputs (env):
//   GH_TOKEN    — required (github.token from workflow).
//   PR_NUMBER   — required.
//   HEAD_SHA    — required (from prepare job output).

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const { GH_TOKEN, PR_NUMBER, HEAD_SHA } = process.env;
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

  const findings = existsSync("findings-confirmed.json")
    ? JSON.parse(await readFile("findings-confirmed.json", "utf8"))
    : [];

  const confirmed = findings.filter((f) => f.confirmed !== false);
  const counts = tally(confirmed);
  const verdict = decide(counts);

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

function decide(counts) {
  if (counts.BLOQUANT > 0) {
    return {
      conclusion: "failure",
      title: "FAIL — blocking finding(s) confirmed",
      summary: `${counts.BLOQUANT} BLOQUANT, ${counts.MAJEUR} MAJEUR, ${counts.MINEUR} MINEUR`,
    };
  }
  if (counts.MAJEUR > 0) {
    return {
      conclusion: "neutral",
      title: "CONDITIONAL — major finding(s) confirmed",
      summary: `${counts.MAJEUR} MAJEUR, ${counts.MINEUR} MINEUR`,
    };
  }
  return {
    conclusion: "success",
    title: "PASS — no blocking or major finding",
    summary: `${counts.MINEUR} MINEUR`,
  };
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
  const args = [
    "api",
    `repos/${owner}/${repo}/check-runs`,
    "-X",
    "POST",
    "--input",
    "-",
  ];
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
