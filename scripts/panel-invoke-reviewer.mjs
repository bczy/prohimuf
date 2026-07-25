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
//
// Budget policy (ADR-0067): the diff is split per file and sent over as many
// calls as the answering provider's request budget needs (GitHub Models caps
// every model at 8000 input tokens). Findings from all calls are merged and
// de-duplicated, so a fallback review still covers the WHOLE diff.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { callPanelModelBatched, splitUnifiedDiff } from "./lib/panelLlm.mjs";

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

  // Guardrail: cap the whole diff at ~200 KB. Beyond that even Anthropic gets a
  // prompt too diluted to review usefully.
  const MAX_DIFF = 200 * 1024;
  const diffTrunc =
    diff.length > MAX_DIFF
      ? `${diff.slice(0, MAX_DIFF)}\n\n[TRUNCATED: diff exceeded ${String(MAX_DIFF)} bytes]`
      : diff;

  // The preamble is repeated in every call; only the diff is split. Each batch
  // must therefore be self-sufficient — hence the metadata and the "emit ONLY
  // JSON" instruction living here rather than around the payload.
  const preamble = [
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
    "## Unified diff (origin/main...HEAD) — this call may carry only PART of it;",
    "review exactly what is below and emit ONLY the JSON array of findings.",
    "```diff",
    "",
  ].join("\n");

  const parts = splitUnifiedDiff(diffTrunc);
  const { texts, provider, calls } = await callPanelModelBatched({
    system: prompt,
    preamble,
    parts: parts.length > 0 ? parts : [""],
  });
  console.log(`[panel-invoke-reviewer] answered by ${provider} in ${String(calls)} call(s)`);

  const findings = dedupe(texts.flatMap(extractJsonArray));
  await writeFile(FINDINGS_FILE, JSON.stringify(findings, null, 2));
  console.log(`Wrote ${String(findings.length)} finding(s) to ${FINDINGS_FILE}`);
}

/** A file reviewed in two batches can yield the same finding twice. */
function dedupe(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const key = JSON.stringify([f?.file ?? "", f?.line ?? "", f?.title ?? "", f?.severity ?? ""]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
