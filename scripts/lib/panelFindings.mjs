// Transport-agnostic findings plumbing shared by the panel's skeptic step.
//
// Extracted from the retired scripts/panel-invoke-skeptic.mjs when the panel
// moved off the direct-API transport onto anthropics/claude-code-action@v1
// (subscription auth — see ADR-0070).
// None of this reads or writes an LLM: it is pure aggregation over the
// findings-*/*.json artifacts the four reviewer jobs upload, plus the
// safety net that stops the skeptic from silently dropping a finding.

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Read every reviewer's findings artifact under `dir` (one subdirectory per
 * `findings-<role>` artifact, per `actions/download-artifact`'s
 * `pattern: findings-*` layout), tag each finding with the reviewer that
 * produced it, and drop exact duplicates (same reviewer, file, line, title —
 * e.g. a reviewer artifact that somehow contains more than one JSON file).
 */
export async function collectFindings(dir = "findings-in") {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const findings = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sub = join(dir, entry.name);
    const jsonFiles = (await readdir(sub)).filter((f) => f.endsWith(".json"));
    for (const jsonFile of jsonFiles) {
      try {
        const raw = await readFile(join(sub, jsonFile), "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const finding of parsed) findings.push({ ...finding, _reviewer: entry.name });
        }
      } catch (err) {
        console.warn(`Skipping ${jsonFile}: ${err.message}`);
      }
    }
  }
  return dedupe(findings);
}

function dedupe(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const key = findingKey(f);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Identity of a finding for dedup/matching purposes. */
export function findingKey(f) {
  return `${f._reviewer || ""}::${f.file || ""}:${f.line || ""}::${f.title || ""}`;
}

/**
 * Merge the skeptic's per-`id` verdicts back onto the ORIGINAL finding
 * objects. This is the safety property the id scheme exists for: the
 * skeptic's structured output is `{id, confirmed, refutation?}` only (see
 * `.github/panel-prompts/skeptic.md`), so it can flip a verdict but cannot
 * rewrite a finding's `severity`/`file`/`title` — those always come from the
 * reviewer, never from the skeptic's echo.
 *
 * A finding whose `id` the skeptic never answered (a short response, e.g.
 * from max-turns) is CONFIRMED by default — the skeptic must not be able to
 * silently drop a finding by omission.
 *
 * @param {ReadonlyArray<{id: number}>} findingsWithIds
 * @param {Map<number, {confirmed?: boolean, refutation?: string}>} verifiedById
 */
export function mergeConfirmations(findingsWithIds, verifiedById) {
  return findingsWithIds.map(({ id, ...finding }) => {
    const verdict = verifiedById.get(id);
    if (!verdict) return { ...finding, confirmed: true };
    const { confirmed = true, refutation } = verdict;
    return { ...finding, confirmed, refutation };
  });
}
