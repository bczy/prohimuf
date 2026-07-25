#!/usr/bin/env node
// Panel skeptic invocation — reads all reviewer findings, calls the GitHub
// Models inference API with the skeptic prompt, and writes findings-confirmed.json.
//
// Inputs (env):
//   GITHUB_TOKEN  — required (provided by Actions; job needs `models: read`).
//   PROMPT_FILE   — path to skeptic prompt (.github/panel-prompts/skeptic.md).
//   PANEL_MODEL   — optional, defaults to openai/gpt-4.1.
//
// Inputs (files):
//   findings-in/findings-*/*.json  — one folder per reviewer artifact.
//   panel-input/diff.patch         — for grounding refutations.
//
// Output:
//   Writes findings-confirmed.json (JSON array with `confirmed` + optional
//   `refutation` fields added).
//
// Fail-open policy: if the API errors, we CONFIRM every finding (safer default
// per skeptic prompt: "when in doubt, CONFIRM").

import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { callPanelModel, extractJsonArray } from "./panel-llm.mjs";

const { PROMPT_FILE } = process.env;

const FINDINGS_IN = "findings-in";
const OUT = "findings-confirmed.json";

async function main() {
  if (!PROMPT_FILE) throw new Error("PROMPT_FILE missing");
  if (!existsSync(PROMPT_FILE)) throw new Error(`prompt not found: ${PROMPT_FILE}`);

  const findings = await collectFindings();
  if (findings.length === 0) {
    await writeFile(OUT, "[]");
    console.log("No reviewer findings — verdict PASS.");
    return;
  }

  const [prompt, diff] = await Promise.all([
    readFile(PROMPT_FILE, "utf8"),
    readFile("panel-input/diff.patch", "utf8").catch(() => ""),
  ]);

  const MAX_DIFF = 200 * 1024;
  const diffTrunc = diff.length > MAX_DIFF ? `${diff.slice(0, MAX_DIFF)}\n\n[TRUNCATED]` : diff;

  const userMessage = [
    "## Findings submitted by the four reviewers",
    "```json",
    JSON.stringify(findings, null, 2),
    "```",
    "",
    "## Unified diff (origin/main...HEAD) — ground truth",
    "```diff",
    diffTrunc,
    "```",
    "",
    "Emit ONLY the JSON array (same findings with `confirmed` + optional `refutation`), nothing else.",
  ].join("\n");

  const text = await callPanelModel({ system: prompt, user: userMessage });

  const verified = extractJsonArray(text);
  // Safety net: if verified array is shorter than input, confirm the missing
  // ones — the skeptic cannot silently drop findings.
  const byKey = new Map(verified.map((f) => [findingKey(f), f]));
  const merged = findings.map((f) => byKey.get(findingKey(f)) || { ...f, confirmed: true });
  await writeFile(OUT, JSON.stringify(merged, null, 2));
  console.log(
    `Skeptic verdict: ${merged.filter((f) => f.confirmed).length}/${merged.length} confirmed`,
  );
}

async function collectFindings() {
  if (!existsSync(FINDINGS_IN)) return [];
  const entries = await readdir(FINDINGS_IN, { withFileTypes: true });
  const findings = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const dir = join(FINDINGS_IN, e.name);
    const jsonFiles = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    for (const jf of jsonFiles) {
      try {
        const raw = await readFile(join(dir, jf), "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const f of parsed) findings.push({ ...f, _reviewer: e.name });
        }
      } catch (err) {
        console.warn(`Skipping ${jf}: ${err.message}`);
      }
    }
  }
  return findings;
}

function findingKey(f) {
  return `${f._reviewer || ""}::${f.file || ""}:${f.line || ""}::${f.title || ""}`;
}

main().catch(async (err) => {
  console.error(`[panel-invoke-skeptic] ${err.message}`);
  // Fail-open: confirm everything.
  const findings = await collectFindings().catch(() => []);
  const confirmed = findings.map((f) => ({ ...f, confirmed: true }));
  await writeFile(OUT, JSON.stringify(confirmed, null, 2)).catch(() => {});
  process.exit(0);
});
