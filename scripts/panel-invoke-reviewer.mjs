#!/usr/bin/env node
// Panel reviewer invocation — calls the Anthropic API with a reviewer prompt
// and the assembled PR diff/context, then writes the findings JSON array.
//
// Inputs (env):
//   ANTHROPIC_API_KEY  — primary provider (optional if GITHUB_TOKEN is set).
//   GITHUB_TOKEN       — GitHub Models fallback (ADR-0067); needs `models: read`.
//   PROMPT_FILE        — path to the reviewer prompt (.github/panel-prompts/*.md).
//   FINDINGS_FILE      — path to write findings JSON array to.
//   ANTHROPIC_MODEL / GITHUB_MODELS_MODEL — optional per-provider overrides.
//
// Inputs (files, in ./panel-input/):
//   pr.json     — { title, body }
//   diff.patch  — unified diff origin/main...HEAD
//   files.txt   — name-status listing
//
// Output:
//   Writes a JSON array of findings to $FINDINGS_FILE.
//
// Failure policy (ADR-0067): the reviewer still writes [] on error so the
// skeptic's input contract holds, but it EXITS NON-ZERO. An unreviewed diff
// must never be indistinguishable from a clean one — triage turns a failed
// reviewer job into a DEGRADED verdict instead of a hollow PASS.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { callPanelModel } from "./lib/panelLlm.mjs";

const { PROMPT_FILE, FINDINGS_FILE } = process.env;

async function main() {
  if (!PROMPT_FILE) throw new Error("PROMPT_FILE missing");
  if (!FINDINGS_FILE) throw new Error("FINDINGS_FILE missing");
  if (!existsSync(PROMPT_FILE)) throw new Error(`prompt not found: ${PROMPT_FILE}`);

  const [prompt, pr, diff, files] = await Promise.all([
    readFile(PROMPT_FILE, "utf8"),
    readFile("panel-input/pr.json", "utf8").catch(() => "{}"),
    readFile("panel-input/diff.patch", "utf8").catch(() => ""),
    readFile("panel-input/files.txt", "utf8").catch(() => ""),
  ]);

  // Guardrail: cap diff at ~200 KB to stay within reasonable token budget.
  const MAX_DIFF = 200 * 1024;
  const diffTrunc =
    diff.length > MAX_DIFF
      ? `${diff.slice(0, MAX_DIFF)}\n\n[TRUNCATED: diff exceeded ${MAX_DIFF} bytes]`
      : diff;

  const userMessage = [
    "## PR metadata",
    "```json",
    pr.trim(),
    "```",
    "",
    "## Files changed",
    "```",
    files.trim(),
    "```",
    "",
    "## Unified diff (origin/main...HEAD)",
    "```diff",
    diffTrunc,
    "```",
    "",
    "Emit ONLY the JSON array of findings, nothing else.",
  ].join("\n");

  const { text, provider } = await callPanelModel({ system: prompt, user: userMessage });
  console.log(`[panel-invoke-reviewer] answered by ${provider}`);

  const findings = extractJsonArray(text);
  await writeFile(FINDINGS_FILE, JSON.stringify(findings, null, 2));
  console.log(`Wrote ${findings.length} finding(s) to ${FINDINGS_FILE}`);
}

function extractJsonArray(text) {
  // Try direct parse first, then extract the first [...] block.
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    /* fall through */
  }
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

main().catch(async (err) => {
  console.error(`[panel-invoke-reviewer] ${err.message}`);
  // Keep the artifact shape valid for the skeptic, then FAIL the job: an empty
  // findings list must not read as "reviewed and clean" (see file header).
  if (FINDINGS_FILE) {
    await writeFile(FINDINGS_FILE, "[]").catch(() => {});
  }
  process.exit(1);
});
