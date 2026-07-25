#!/usr/bin/env node
// Panel reviewer invocation — calls the GitHub Models inference API with a
// reviewer prompt and the assembled PR diff/context, then writes the findings
// JSON array.
//
// Inputs (env):
//   GITHUB_TOKEN   — required (provided by Actions; job needs `models: read`).
//   PROMPT_FILE    — path to the reviewer prompt (.github/panel-prompts/*.md).
//   FINDINGS_FILE  — path to write findings JSON array to.
//   PANEL_MODEL    — optional, defaults to openai/gpt-4.1.
//
// Inputs (files, in ./panel-input/):
//   pr.json     — { title, body }
//   diff.patch  — unified diff origin/main...HEAD
//   files.txt   — name-status listing
//
// Output:
//   Writes a JSON array of findings to $FINDINGS_FILE. On any error, writes []
//   and exits 0 — the panel is fail-open at the reviewer level; the skeptic
//   and triage jobs are the ones that hold the verdict.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { callPanelModel, extractJsonArray } from "./panel-llm.mjs";

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

  const text = await callPanelModel({ system: prompt, user: userMessage });

  const findings = extractJsonArray(text);
  await writeFile(FINDINGS_FILE, JSON.stringify(findings, null, 2));
  console.log(`Wrote ${findings.length} finding(s) to ${FINDINGS_FILE}`);
}

main().catch(async (err) => {
  console.error(`[panel-invoke-reviewer] ${err.message}`);
  if (FINDINGS_FILE) {
    await writeFile(FINDINGS_FILE, "[]").catch(() => {});
  }
  // Exit 0 — fail-open at the reviewer level (see file header).
  process.exit(0);
});
