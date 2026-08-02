import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The CALL-SITE guard (ADR-0079 D6, sign-off condition C3).
 *
 * Since the fail-fast left `generated/index.ts`'s module body, the only thing standing
 * between a duplicate generated id and a silently split-brained app (`LEVEL_ART`
 * last-wins vs `ALL_LEVELS.find` first-wins) is ONE line at the composition root. No
 * runtime test can prove that line exists: a test that calls `registerGeneratedLevels()`
 * itself says nothing about `src/main.tsx`, and the pool test of `generatedLevels.test.ts`
 * passes on the archetype registration, which never left the module body. Importing
 * `main.tsx` for real is not an option either — it renders the whole Three.js app.
 *
 * So this guard reads the entry point AS SOURCE. That is assumed and stated: it is a
 * textual assertion, it would not survive an exotic rewrite of the call (aliased import,
 * indirection through a helper), and it is deliberately paired with the acceptance that
 * `main.tsx` stays the boring three-line bootstrap it is today. Its job is to turn the
 * ONE realistic accident — someone deletes or moves the call while tidying the entry
 * point — into a red suite. Proven by mutation (remove the call ⇒ this file goes red).
 *
 * Lives under `src/game/levels/__tests__/` because that is where the invariant's data
 * lives and what the vitest `include` covers; it reads text, it imports no React.
 */
const MAIN_TSX = resolve(__dirname, "../../../main.tsx");
const source = readFileSync(MAIN_TSX, "utf8");

describe("bootstrap registration of the generated levels (main.tsx)", () => {
  it("imports registerGeneratedLevels from the game barrel", () => {
    expect(source).toMatch(
      /import\s*\{[^}]*\bregisterGeneratedLevels\b[^}]*\}\s*from\s*["']@game\/levels\/generated["']/,
    );
  });

  it("calls it at MODULE BODY level, not inside a function or a React effect", () => {
    // Column 0 = top-level statement. Inside a component/effect it would be indented,
    // and StrictMode's double-mount would run it twice per boot (condition C4).
    expect(source).toMatch(/^registerGeneratedLevels\(\);$/m);
  });

  it("calls it BEFORE the first render", () => {
    // search(anchored regex), not indexOf: a commented-out call must not match.
    const call = source.search(/^registerGeneratedLevels\(\);$/m);
    const render = source.indexOf("createRoot(");
    expect(call).toBeGreaterThanOrEqual(0);
    expect(render).toBeGreaterThanOrEqual(0);
    expect(call).toBeLessThan(render);
  });
});
