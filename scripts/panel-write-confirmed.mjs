#!/usr/bin/env node
// Panel skeptic — replaces scripts/panel-invoke-skeptic.mjs under the
// subscription-auth transport (anthropics/claude-code-action@v1; see the
// ADR-0070).
//
// claude-code-action is a GitHub Action, invocable only as a workflow `uses:`
// step, not something this script can call itself — so unlike the old
// single-shot script, the actual model call sits BETWEEN this script's two
// modes as a step in the `verify` job of code-review-panel.yml:
//
//   node scripts/panel-write-confirmed.mjs prepare
//     Collects every reviewer's findings (scripts/lib/panelFindings.mjs),
//     assigns each a small integer `id`, and writes findings-with-ids.json
//     for the workflow's prompt-assembly step. If there is nothing to
//     verify, writes findings-confirmed.json=[] directly (unchanged
//     behavior: "No reviewer findings — verdict PASS") and sets
//     has_findings=false ($GITHUB_OUTPUT) so the workflow skips the model
//     call entirely.
//
//   node scripts/panel-write-confirmed.mjs finalize
//     Reads PANEL_STRUCTURED_OUTPUT (the action's `structured_output`,
//     matching `{ verdicts: [{id, confirmed, refutation?}] }` — empty/absent
//     on total failure) and findings-with-ids.json, merges the skeptic's
//     per-id verdicts back onto the ORIGINAL finding objects via
//     `mergeConfirmations` (the safety property: the skeptic can flip a
//     verdict but cannot rewrite a finding's severity/file/title), and
//     writes findings-confirmed.json.
//
// Fail-open-but-fail-the-job (unchanged policy): on total failure — no
// structured output, invalid JSON, or no `verdicts` array — every finding is
// confirmed and the script exits 1, so triage reports DEGRADED rather than
// treating an unverified run as authoritative.

import { existsSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { collectFindings, mergeConfirmations } from "./lib/panelFindings.mjs";

const OUT = "findings-confirmed.json";
const WITH_IDS = "findings-with-ids.json";

async function prepare() {
  const findings = await collectFindings();
  if (findings.length === 0) {
    await writeFile(OUT, "[]");
    await setOutput("has_findings", "false");
    console.log("No reviewer findings — verdict PASS.");
    return;
  }
  const withIds = findings.map((finding, id) => ({ ...finding, id }));
  await writeFile(WITH_IDS, JSON.stringify(withIds, null, 2));
  await setOutput("has_findings", "true");
  console.log(`Prepared ${String(findings.length)} finding(s) for the skeptic.`);
}

async function finalize() {
  const withIds = existsSync(WITH_IDS) ? JSON.parse(await readFile(WITH_IDS, "utf8")) : [];
  if (withIds.length === 0) {
    // prepare() already wrote findings-confirmed.json=[]; nothing to verify.
    return;
  }

  let verdicts;
  try {
    const parsed = JSON.parse(process.env.PANEL_STRUCTURED_OUTPUT ?? "");
    if (!Array.isArray(parsed?.verdicts)) throw new Error("no `verdicts` array");
    verdicts = parsed.verdicts;
  } catch (err) {
    console.error(`[panel-write-confirmed] skeptic answer unusable: ${err.message}`);
    const confirmed = withIds.map(({ id: _id, ...finding }) => ({ ...finding, confirmed: true }));
    await writeFile(OUT, JSON.stringify(confirmed, null, 2));
    process.exitCode = 1;
    return;
  }

  const verifiedById = new Map(verdicts.map((v) => [v.id, v]));
  const merged = mergeConfirmations(withIds, verifiedById);
  await writeFile(OUT, JSON.stringify(merged, null, 2));
  const confirmedCount = merged.filter((f) => f.confirmed).length;
  console.log(`Skeptic verdict: ${String(confirmedCount)}/${String(merged.length)} confirmed`);
}

async function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  await appendFile(file, `${name}=${value}\n`);
}

const MODES = { prepare, finalize };
const mode = MODES[process.argv[2]];
if (!mode) {
  console.error("usage: panel-write-confirmed.mjs <prepare|finalize>");
  process.exit(1);
}
mode().catch((err) => {
  console.error(`[panel-write-confirmed] ${err.message}`);
  process.exit(1);
});
