import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { LEVELS, FIRST_PLAYABLE_LEVEL, loadUnlockedLevels } from "@game/levels/levels";
import {
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
} from "@game/systems/narrativeSystem";

/**
 * Data-invariant half of ADR-0012's regression coverage (D3): the optional tutorial
 * stage sits at index 0, is the sole non-playable entry, never participates in the
 * `+1` unlock chain, and its illustration paths point at sprites that actually ship.
 * The render/App-side flow guarantee lives in Lane B. Per ADR-0015 (amending ADR-0012
 * D4) the tutorial script forks into desktop/mobile variants that differ only on the
 * two control panels; these invariants cover both variants.
 */
const VARIANTS = [TUTORIAL_NARRATIVE_DESKTOP, TUTORIAL_NARRATIVE_MOBILE] as const;
// Every exported scene: both tutorial variants + all pre/post-level narrative. The
// gesture/image invariants below sweep this so a future pre/post-level line that pairs a
// gesture with an image, or sets a gesture without an alt, fails CI (ADR-0019).
const ALL_SCENES = [
  ...VARIANTS,
  ...Object.values(PRE_LEVEL_NARRATIVE),
  ...Object.values(POST_LEVEL_NARRATIVE),
] as const;
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
    for (const key of ["tutorial", "tutorial_desktop", "tutorial_mobile"]) {
      expect(Object.keys(PRE_LEVEL_NARRATIVE)).not.toContain(key);
      expect(Object.keys(POST_LEVEL_NARRATIVE)).not.toContain(key);
    }
    expect(TUTORIAL_NARRATIVE_DESKTOP.id).toBe("tutorial_desktop");
    expect(TUTORIAL_NARRATIVE_MOBILE.id).toBe("tutorial_mobile");
  });

  it("illustrates panels only with sprites shipped under public/assets/", () => {
    for (const variant of VARIANTS) {
      const images = variant.lines
        .map((l) => l.image)
        .filter((img): img is string => img !== undefined);
      // Sanity: at least one panel is illustrated, so this assertion has teeth.
      expect(images.length).toBeGreaterThan(0);
      for (const img of images) {
        expect(img.startsWith("/")).toBe(false); // no leading slash — base URL is added by render
        expect(existsSync(resolve(process.cwd(), "public", img))).toBe(true);
      }
    }
  });

  it("keeps both variants at the expanded 11-panel count (ADR-0019)", () => {
    for (const variant of VARIANTS) {
      expect(variant.lines).toHaveLength(11);
    }
  });

  it("forks only the control panels between device variants", () => {
    const desktop = TUTORIAL_NARRATIVE_DESKTOP;
    const mobile = TUTORIAL_NARRATIVE_MOBILE;
    // Progress-dot parity: both variants have the same panel count.
    expect(desktop.lines.length).toBe(mobile.lines.length);
    // Shared segments are the SAME objects by reference — zero copy duplication
    // (opening [0,1] + expanded field [4..10], ADR-0019).
    for (const i of [0, 1, 4, 5, 6, 7, 8, 9, 10]) {
      expect(desktop.lines[i]).toBe(mobile.lines[i]);
    }
    // The two control panels (indices 2 and 3) diverge between devices.
    expect(desktop.lines[2]?.text).not.toBe(mobile.lines[2]?.text);
    expect(desktop.lines[3]?.text).not.toBe(mobile.lines[3]?.text);
  });

  it("keeps each variant's control copy device-accurate", () => {
    const desktopControls =
      (TUTORIAL_NARRATIVE_DESKTOP.lines[2]?.text ?? "") +
      (TUTORIAL_NARRATIVE_DESKTOP.lines[3]?.text ?? "");
    const mobileControls =
      (TUTORIAL_NARRATIVE_MOBILE.lines[2]?.text ?? "") +
      (TUTORIAL_NARRATIVE_MOBILE.lines[3]?.text ?? "");
    expect(mobileControls).toMatch(/deux doigts/i);
    expect(mobileControls).not.toMatch(/clic|souris/i);
    expect(desktopControls).toMatch(/souris/i);
    expect(desktopControls).toMatch(/clic/i);
    expect(desktopControls).not.toMatch(/doigt|balay/i);
  });

  it("keeps the shared segments free of device-specific control tokens (ADR-0015)", () => {
    // Shared panels must carry none of the four fork tokens, or a shared panel would
    // leak device-specific copy onto the wrong variant.
    for (const i of [0, 1, 4, 5, 6, 7, 8, 9, 10]) {
      const text = TUTORIAL_NARRATIVE_DESKTOP.lines[i]?.text ?? "";
      expect(text).not.toMatch(/clic|souris|doigt|balay/i);
    }
  });

  it("sets gesture and image as mutually exclusive on every line (ADR-0019)", () => {
    for (const scene of ALL_SCENES) {
      for (const line of scene.lines) {
        expect(line.gesture !== undefined && line.image !== undefined).toBe(false);
      }
    }
  });

  it("carries gestures only on the forked control panels [2,3] (ADR-0019)", () => {
    for (const variant of VARIANTS) {
      variant.lines.forEach((line, i) => {
        if (i === 2 || i === 3) {
          expect(line.gesture).toBeDefined();
        } else {
          expect(line.gesture).toBeUndefined();
        }
      });
    }
  });

  it("selects device-correct gesture values per variant (ADR-0019)", () => {
    expect(TUTORIAL_NARRATIVE_DESKTOP.lines[2]?.gesture).toBe("mouse-click");
    expect(TUTORIAL_NARRATIVE_DESKTOP.lines[3]?.gesture).toBe("edge-scroll");
    expect(TUTORIAL_NARRATIVE_MOBILE.lines[2]?.gesture).toBe("two-finger-tap");
    expect(TUTORIAL_NARRATIVE_MOBILE.lines[3]?.gesture).toBe("swipe-pan");
  });

  it("provides an accessible gestureAlt wherever a gesture is set (ADR-0019)", () => {
    for (const scene of ALL_SCENES) {
      for (const line of scene.lines) {
        if (line.gesture !== undefined) {
          expect((line.gestureAlt ?? "").trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
