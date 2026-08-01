import { describe, it, expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// Black-box, subprocess-driven exercise of main()'s argv validation (same
// pattern as check-art-prompts.test.mjs / gen-nearfg-sprites.test.mjs's
// main()-level tests) — this is the ONE assertion this driver can make
// without a real browser + a served build (SP2 T6): it fails FAST (before
// ever launching Chromium) on a missing level id, rather than crashing deep
// inside Playwright with a confusing stack.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(__dirname, "..", "e2e-generated-level.mjs");

describe("e2e-generated-level.mjs — argv validation (no browser launched)", () => {
  it("fails fast with a usage message when no level id is given", () => {
    const res = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8" });
    expect(res.status).toBe(2);
    expect(res.stderr).toMatch(/Usage: node scripts\/e2e-generated-level\.mjs <levelId>/);
  });
});
