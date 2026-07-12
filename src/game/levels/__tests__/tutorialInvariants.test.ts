import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { LEVELS, FIRST_PLAYABLE_LEVEL, loadUnlockedLevels } from "@game/levels/levels";
import {
  TUTORIAL_NARRATIVE,
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
} from "@game/systems/narrativeSystem";

/**
 * Data-invariant half of ADR-0012's regression coverage (D3): the optional tutorial
 * stage sits at index 0, is the sole non-playable entry, never participates in the
 * `+1` unlock chain, and its illustration paths point at sprites that actually ship.
 * The render/App-side flow guarantee lives in Lane B.
 */
describe("tutorial stage invariants (ADR-0012)", () => {
  it("places the tutorial at index 0 as the only tutorial-kind entry", () => {
    expect(LEVELS[0]?.kind).toBe("tutorial");
    expect(LEVELS[0]?.id).toBe("tutorial");
    expect(LEVELS.filter((l) => l.kind === "tutorial")).toHaveLength(1);
  });

  it("exposes Rue Belliard as the first playable level", () => {
    expect(FIRST_PLAYABLE_LEVEL.id).toBe("belliard");
    expect(FIRST_PLAYABLE_LEVEL.kind).not.toBe("tutorial");
  });

  it("never targets the tutorial via a +1 unlock and never unlocks it by default", () => {
    // The unlock chain (App.tsx) only ever advances to LEVELS[i + 1]; index 0 is
    // therefore unreachable as an unlock target.
    for (let i = 0; i + 1 < LEVELS.length; i++) {
      expect(LEVELS[i + 1]?.kind).not.toBe("tutorial");
    }
    // Equivalent, index-free invariant with real teeth: the tutorial exists at 0
    // and no reachable `+1` position (i.e. any index ≥ 1) is a tutorial entry.
    expect(LEVELS.slice(1).every((l) => l.kind !== "tutorial")).toBe(true);
    localStorage.clear();
    const unlocked = loadUnlockedLevels();
    expect(unlocked.has("tutorial")).toBe(false);
    expect(unlocked.has("belliard")).toBe(true);
  });

  it("keeps the tutorial script out of the level-keyed narrative maps", () => {
    expect(Object.keys(PRE_LEVEL_NARRATIVE)).not.toContain("tutorial");
    expect(Object.keys(POST_LEVEL_NARRATIVE)).not.toContain("tutorial");
    expect(TUTORIAL_NARRATIVE.id).toBe("tutorial");
  });

  it("illustrates panels only with sprites shipped under public/assets/", () => {
    const images = TUTORIAL_NARRATIVE.lines
      .map((l) => l.image)
      .filter((img): img is string => img !== undefined);
    // Sanity: at least one panel is illustrated, so this assertion has teeth.
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img.startsWith("/")).toBe(false); // no leading slash — base URL is added by render
      expect(existsSync(resolve(process.cwd(), "public", img))).toBe(true);
    }
  });
});
