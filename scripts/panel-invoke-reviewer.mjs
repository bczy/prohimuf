#!/usr/bin/env node
// Panel reviewer invocation — calls the Anthropic API with a reviewer prompt
// and the assembled PR diff/context, then writes the findings JSON array.
//
// Inputs (env):
//   ANTHROPIC_API_KEY  — required.
//   PROMPT_FILE        — path to the reviewer prompt (.github/panel-prompts/*.md).
//   FINDINGS_FILE      — path to write findings JSON array to.
//   ANTHROPIC_MODEL    — optional, defaults to claude-sonnet-4-5.
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

const {
  ANTHROPIC_API_KEY,
  PROMPT_FILE,
  FINDINGS_FILE,
  ANTHROPIC_MODEL = "claude-sonnet-4-5",
} = process.env;

async function main() {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");
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

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 8192,
    system: prompt,
    messages: [{ role: "user", content: userMessage }],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`anthropic ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

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
  if (FINDINGS_FILE) {
    await writeFile(FINDINGS_FILE, "[]").catch(() => {});
  }
  // Exit 0 — fail-open at the reviewer level (see file header).
  process.exit(0);
});
