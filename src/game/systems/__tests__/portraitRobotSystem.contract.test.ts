import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ADR-0079 D8.3, fourth test — the regression guard, and the one that matters at review
 * time. The first three prove today's code; this one prevents tomorrow's.
 *
 * The ordering guarantee is only real while `stepPortraitScene` is the bridge's SINGLE
 * call site. A hook that calls `applyPortraitIntent` or `tickPortraitScene` itself has
 * re-acquired an ordering, which brings back the buzzer race — silently, with the three
 * tests above still green. Hence a source-level assertion rather than a behavioural one:
 * the failure mode is a call site, so the test reads call sites.
 *
 * Standing blocking finding at stage 6 regardless of test colour (hand-off §3.4,
 * ADR-0079 C2bis).
 */

const FORBIDDEN_OUTSIDE_GAME = ["applyPortraitIntent", "tickPortraitScene", "resolvePortraitScene"];

/**
 * The invariant is about CALL SITES, not about strings: a hook whose doc comment says
 * "this never calls `applyPortraitIntent`" is honouring the rule, not breaking it, and a
 * test that cannot tell the two apart would be paid in false positives until someone
 * deleted it. Comments out, code in.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe("the frame fold is the only entry point across the seam", () => {
  it("no file outside src/game imports or calls a rule other than stepPortraitScene", () => {
    const offenders: string[] = [];
    for (const dir of ["src/hooks", "src/render"]) {
      for (const file of sourceFiles(dir)) {
        const code = stripComments(readFileSync(file, "utf8"));
        for (const symbol of FORBIDDEN_OUTSIDE_GAME) {
          if (new RegExp(`\\b${symbol}\\b`).test(code)) offenders.push(`${file} → ${symbol}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no gesture literal leaks into the intent vocabulary (ADR-0083 D1)", () => {
    const source = readFileSync("src/game/types/portraitRobot.ts", "utf8");
    const union = source.slice(source.indexOf("export type PortraitIntent"));
    // `SUBMIT` was deleted, not internalised (B1): an unreachable member is a loaded gun
    // that re-implements the deleted CTA by accident. `SWIPE`/`DRAG`/`TAP` would mean the
    // gesture abstraction has failed.
    for (const member of ["SUBMIT", "SWIPE", "DRAG", "TAP", "ARROW"]) {
      expect(union).not.toContain(`"${member}"`);
    }
  });

  it("src/game invents no entropy and reads no clock", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles("src/game")) {
      // Comments are the only legitimate mention (every one of them is a prohibition).
      const code = stripComments(readFileSync(file, "utf8"));
      if (/Math\.random|Date\.now|new Date\(/.test(code)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
