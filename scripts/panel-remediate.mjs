#!/usr/bin/env node
// Panel remediation — hands the confirmed BLOQUANT/MAJEUR findings to the
// Copilot coding agent by posting an `@copilot` request on the PR.
//
// Copilot pushes its fix directly to the branch under review, which is a
// `synchronize` event, so the panel re-runs and re-judges on its own.
//
// Rounds are capped: the request comment carries a hidden marker, and this
// script counts previous markers before acting. At the cap it stops and hands
// the PR back to a human — an unfixable finding must not spin forever.
//
// Inputs (env):
//   GH_TOKEN                  — required. Must be a PAT (PANEL_BOT_TOKEN):
//                               verified on PR #133, a request posted with the
//                               default GITHUB_TOKEN does NOT wake the agent —
//                               the comment appears and nothing happens.
//   HAS_BOT_TOKEN             — "true" when GH_TOKEN is the PAT. Anything else
//                               makes this script warn loudly rather than
//                               no-op in silence.
//   PR_NUMBER                 — required.
//   GITHUB_REPOSITORY         — required.
//   PANEL_AUTOFIX_MAX_ROUNDS  — optional, defaults to 2.
//
// Inputs (files):
//   findings-confirmed.json   — skeptic output.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const { GH_TOKEN, PR_NUMBER, HAS_BOT_TOKEN, PANEL_AUTOFIX_MAX_ROUNDS = "2" } = process.env;
const OWNER_REPO = process.env.GITHUB_REPOSITORY;

const MARKER = "<!-- panel-autofix";
const ACTIONABLE = new Set(["BLOQUANT", "MAJEUR"]);

async function main() {
  for (const [name, value] of [
    ["GH_TOKEN", GH_TOKEN],
    ["PR_NUMBER", PR_NUMBER],
    ["GITHUB_REPOSITORY", OWNER_REPO],
  ]) {
    if (!value) throw new Error(`${name} missing`);
  }

  const maxRounds = Number.parseInt(PANEL_AUTOFIX_MAX_ROUNDS, 10);
  if (!Number.isInteger(maxRounds) || maxRounds < 1) {
    throw new Error(`PANEL_AUTOFIX_MAX_ROUNDS invalid: ${PANEL_AUTOFIX_MAX_ROUNDS}`);
  }

  const findings = existsSync("findings-confirmed.json")
    ? JSON.parse(await readFile("findings-confirmed.json", "utf8"))
    : [];

  const actionable = findings.filter(
    (f) => f.confirmed !== false && ACTIONABLE.has((f.severity || "").toUpperCase()),
  );

  if (actionable.length === 0) {
    console.log("No confirmed BLOQUANT/MAJEUR finding — nothing to remediate.");
    return;
  }

  const round = countRounds() + 1;
  if (round > maxRounds) {
    console.log(`Round cap reached (${maxRounds}) — handing back to a human.`);
    postComment(renderCapReached(actionable, maxRounds));
    return;
  }

  console.log(`Requesting remediation round ${round}/${maxRounds} for ${actionable.length}.`);
  postComment(renderRequest(actionable, round, maxRounds));

  // A request posted with GITHUB_TOKEN is inert: the comment lands, the agent
  // never starts. Say so in the job summary rather than let the whole feature
  // look like it worked.
  if (HAS_BOT_TOKEN !== "true") {
    console.log(
      "::warning::PANEL_BOT_TOKEN is not set. The @copilot request was posted " +
        "with GITHUB_TOKEN, which does not wake the coding agent, so no fix " +
        "will arrive. Add a PAT as the PANEL_BOT_TOKEN secret.",
    );
  }
}

// Counts `@copilot` requests already posted on this PR, via the hidden marker.
// Only a comment that *starts* with the marker counts: Copilot quotes the
// request in its reply, so a substring match would see every round twice and
// hit the cap after a single round.
function countRounds() {
  const [owner, repo] = OWNER_REPO.split("/");
  const pages = JSON.parse(
    gh(["api", "--paginate", "--slurp", `repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`]) ||
      "[]",
  );
  const bodies = pages.flat().map((c) => c.body || "");
  return bodies.filter((body) => body.trimStart().startsWith(MARKER)).length;
}

function renderRequest(findings, round, maxRounds) {
  return [
    `${MARKER} round:${round} -->`,
    "@copilot the code review panel confirmed the findings below on this pull request.",
    "Please address them.",
    "",
    `_Automated remediation round ${round} of ${maxRounds} (ADR-0063)._`,
    "",
    "### Findings to address",
    "",
    ...findings.map(renderFinding),
    "",
    "### How to handle these",
    "",
    "- These findings come from an LLM review panel and **some are false positives**.",
    "  If a finding does not hold, do NOT change the code to satisfy it: reply in a",
    "  comment explaining precisely why it is wrong, and leave that code alone.",
    "- Never weaken, skip or delete a test to silence a finding.",
    "- Keep the fix surgical — touch only what the finding names. Do not refactor",
    "  adjacent code and do not add unrequested flexibility.",
    "- Respect the boundary law: `src/game/**` imports zero React and zero Three.",
    "- Run `yarn typecheck`, `yarn test` and `yarn lint` before you finish.",
  ].join("\n");
}

function renderCapReached(findings, maxRounds) {
  return [
    "## Panel auto-remediation — stopped",
    "",
    `The automated remediation cap of ${maxRounds} round(s) is reached and`,
    `${findings.length} BLOQUANT/MAJEUR finding(s) are still confirmed.`,
    "Automation stops here; this pull request needs a human decision.",
    "",
    ...findings.map(renderFinding),
  ].join("\n");
}

function renderFinding(f) {
  const sev = (f.severity || "?").toUpperCase();
  const loc = f.file ? ` — \`${f.file}${f.line ? `:${f.line}` : ""}\`` : "";
  const detail = (f.scenario || f.detail || "").replace(/\n/g, " ").trim();
  const fix = (f.suggested_fix || "").replace(/\n/g, " ").trim();
  return [
    `- **[${sev}] ${f.title || "(untitled)"}**${loc}`,
    detail ? `  - Scenario: ${detail}` : "",
    fix ? `  - Suggested fix: ${fix}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function postComment(body) {
  const [owner, repo] = OWNER_REPO.split("/");
  gh([
    "api",
    `repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`,
    "-X",
    "POST",
    "-f",
    `body=${body}`,
  ]);
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", env: process.env });
}

main().catch((err) => {
  console.error(`[panel-remediate] ${err.message}`);
  // Non-fatal: the verdict check already blocks the merge. A remediation
  // failure must not mask the panel's own result.
  process.exit(0);
});
