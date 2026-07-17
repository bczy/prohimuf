#!/usr/bin/env node
/**
 * DOC FRESHNESS GATE — keeps the harness infographics
 * (docs/diagrams/harness-*-infographic.html) in sync with the harness docs they
 * visualise. Sibling to check-agents-infographic.mjs, same staleness-detection
 * contract; kept separate so each series has its own watched surface and manifest
 * (if a third series appears, unify these two into one config-driven checker).
 *
 * The four harness posters are authored artifacts emitted by
 * docs/diagrams/build-harness-infographics.py — no script can regenerate their
 * prose from the docs, so the enforceable contract is STALENESS DETECTION: a
 * manifest pins a sha256 per watched source, and verify mode fails when any moved
 * without a re-pin (--update) in the same PR. The crew sprites the pages embed are
 * NOT re-checked here — their pixel-drift is owned by check-agents-infographic.mjs
 * (which owns muf-crew-bitmap.py); this gate only checks the referenced sprites
 * exist.
 *
 * Watched sources: HARNESS.md, docs/ci.md, docs/asset-pipeline.md, the harness
 * ADRs (0005/0007/0028), and the builder.
 *
 * Usage:
 *   node scripts/check-harness-infographics.mjs           # verify (CI mode)
 *   node scripts/check-harness-infographics.mjs --update  # re-pin the manifest
 * Exit: 0 fresh (or manifest updated); 1 stale, missing infographic, or missing sprite.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MANIFEST = "docs/diagrams/harness-infographics.sources.json";
const CREW_DIR = "docs/diagrams/crew";
const INFOGRAPHICS = [
  "docs/diagrams/harness-level-art-infographic.html",
  "docs/diagrams/harness-window-alignment-infographic.html",
  "docs/diagrams/harness-dynamic-verify-infographic.html",
  "docs/diagrams/harness-shared-lib-infographic.html",
];
const WATCHED = [
  "HARNESS.md",
  "docs/ci.md",
  "docs/asset-pipeline.md",
  "docs/adr/0005-dynamic-verification-harness.md",
  "docs/adr/0007-shared-harness-library.md",
  "docs/adr/0028-window-alignment-harness.md",
  "docs/diagrams/build-harness-infographics.py",
];

function sha256(absPath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

function collectSources() {
  return Object.fromEntries(
    WATCHED.slice()
      .sort()
      .map((rel) => [rel, sha256(path.join(ROOT, rel))]),
  );
}

/** Every infographic exists, and every crew sprite it references exists. */
function collectExistenceProblems() {
  const problems = [];
  for (const rel of INFOGRAPHICS) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      problems.push(`infographic is missing: ${rel} (run the builder)`);
      continue;
    }
    const html = fs.readFileSync(abs, "utf8");
    for (const m of html.matchAll(/src="crew\/([a-z0-9-]+\.png)"/g)) {
      if (!fs.existsSync(path.join(ROOT, CREW_DIR, m[1]))) {
        problems.push(`sprite referenced by ${path.basename(rel)} is missing: ${CREW_DIR}/${m[1]}`);
      }
    }
  }
  return problems;
}

function main() {
  const update = process.argv.includes("--update");
  const manifestAbs = path.join(ROOT, MANIFEST);

  const existence = collectExistenceProblems();
  if (existence.length > 0) {
    console.error(`[check-harness-infographics] FAILED:\n`);
    for (const p of existence.sort()) console.error(`  ✗ ${p}`);
    console.error(`\nRebuild with:  python3 docs/diagrams/build-harness-infographics.py`);
    process.exit(1);
  }

  if (update) {
    const current = collectSources();
    fs.writeFileSync(manifestAbs, `${JSON.stringify(current, null, 2)}\n`);
    console.log(
      `[check-harness-infographics] manifest re-pinned (${Object.keys(current).length} sources) — ` +
        `commit ${MANIFEST} together with the infographic updates.`,
    );
    return;
  }

  let pinned;
  try {
    pinned = JSON.parse(fs.readFileSync(manifestAbs, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(
        `[check-harness-infographics] FAILED — ${MANIFEST} is missing; run with --update to create it.`,
      );
      process.exit(1);
    }
    throw err;
  }

  const current = collectSources();
  const stale = [];
  for (const [rel, hash] of Object.entries(current)) {
    if (!(rel in pinned)) stale.push(`added:    ${rel}`);
    else if (pinned[rel] !== hash) stale.push(`changed:  ${rel}`);
  }
  for (const rel of Object.keys(pinned)) {
    if (!(rel in current)) stale.push(`removed:  ${rel}`);
  }

  if (stale.length > 0) {
    console.error(`[check-harness-infographics] STALE — a harness source moved:\n`);
    for (const line of stale.sort()) console.error(`  ✗ ${line}`);
    console.error(
      `\nUpdate the harness infographics to match (python3 docs/diagrams/build-harness-infographics.py),` +
        `\nthen re-pin in the same PR:  node scripts/check-harness-infographics.mjs --update`,
    );
    process.exit(1);
  }

  console.log(
    `[check-harness-infographics] FRESH — ${Object.keys(current).length} watched sources match; ` +
      `${INFOGRAPHICS.length} infographics present.`,
  );
}

main();
