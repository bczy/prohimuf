#!/usr/bin/env -S vite-node
// Acceptance script for spec-mcp-level-editor §6 / plan T5: `dryrun("fixture")`
// structurally matches the COMMITTED SP1 §8 evidence
// (docs/qa/evidence/story-level-harness-sp1/report.json), per the field-by-field
// policy documented on `compareDryrunReport` in core.mjs.
//
// This file (via `./core.mjs`) imports TS from `src/game/**` through the project's
// `@game/*` Vite alias — plain `node` cannot resolve that import and fails with
// ERR_MODULE_NOT_FOUND. Run it through `vite-node`, exactly like the
// `mcp:level-editor` server entry point does (see package.json):
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers yarn vite-node scripts/mcp-level-editor/dryrun-fixture.mjs
//
// NOT wired into `yarn vitest run scripts` — same precedent as the repo's other
// headless-Chromium gates (scripts/e2e-*.mjs): a real vite dev server + a real
// browser is too heavy for the default unit-test pass. `qa-lead` runs this at
// VERIFY.
//
// (PLAYWRIGHT_BROWSERS_PATH only needed where Chromium isn't on Playwright's
// default lookup path — set already in this sandbox.) The pure comparison logic
// itself (`compareDryrunReport`) has its own fast vitest coverage in
// `scripts/__tests__/mcpDryrunCompare.test.mjs`, run on every default pass.
import { readFileSync } from "node:fs";
import path from "node:path";

import { compareDryrunReport, dryrun, repoRoot } from "./core.mjs";

async function main() {
  const expectedPath = path.join(
    repoRoot(),
    "docs/qa/evidence/story-level-harness-sp1/report.json",
  );
  const expected = JSON.parse(readFileSync(expectedPath, "utf8"));

  console.log('[dryrun-fixture] running dryrun({ levelId: "fixture" })…');
  const actual = await dryrun({ levelId: "fixture" });
  console.log("[dryrun-fixture] actual report:", JSON.stringify(actual, null, 2));

  const { ok, mismatches } = compareDryrunReport(actual, expected);
  if (!ok) {
    console.error("[dryrun-fixture] FAILED — structural mismatch vs the committed evidence:");
    for (const m of mismatches) console.error(`  ✗ ${m}`);
    process.exitCode = 1;
    return;
  }
  console.log("[dryrun-fixture] PASSED — matches the committed §8 evidence structurally");
}

main().catch((error) => {
  console.error("[dryrun-fixture] Fatal:", error);
  process.exitCode = 1;
});
