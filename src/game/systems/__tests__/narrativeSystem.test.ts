import { describe, it, expect } from "vitest";
import {
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
} from "../narrativeSystem";

describe("narrativeSystem data integrity", () => {
  it("A1: PRE and POST cover the exact same set of level keys", () => {
    const preKeys = Object.keys(PRE_LEVEL_NARRATIVE).sort();
    const postKeys = Object.keys(POST_LEVEL_NARRATIVE).sort();
    expect(preKeys).toEqual(postKeys);
    expect(preKeys.length).toBeGreaterThan(0);
  });

  it("A2: every PRE scene id matches the <key>_pre convention", () => {
    for (const [key, scene] of Object.entries(PRE_LEVEL_NARRATIVE)) {
      expect(scene.id).toBe(`${key}_pre`);
    }
  });

  it("A2: every POST scene id matches the <key>_post convention", () => {
    for (const [key, scene] of Object.entries(POST_LEVEL_NARRATIVE)) {
      expect(scene.id).toBe(`${key}_post`);
    }
  });

  it("A3: no scene has an empty lines array", () => {
    const scenes = [
      ...Object.values(PRE_LEVEL_NARRATIVE),
      ...Object.values(POST_LEVEL_NARRATIVE),
      TUTORIAL_NARRATIVE_DESKTOP,
      TUTORIAL_NARRATIVE_MOBILE,
    ];
    for (const scene of scenes) {
      expect(scene.lines.length).toBeGreaterThan(0);
    }
  });

  it("A4: every line has a non-empty (trimmed) speaker and text", () => {
    const scenes = [
      ...Object.values(PRE_LEVEL_NARRATIVE),
      ...Object.values(POST_LEVEL_NARRATIVE),
      TUTORIAL_NARRATIVE_DESKTOP,
      TUTORIAL_NARRATIVE_MOBILE,
    ];
    for (const scene of scenes) {
      for (const line of scene.lines) {
        expect(line.speaker.trim().length).toBeGreaterThan(0);
        expect(line.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("A5: every PRE/POST scene carries a level-facade backdrop (ADR-0023)", () => {
    for (const [key, scene] of [
      ...Object.entries(PRE_LEVEL_NARRATIVE),
      ...Object.entries(POST_LEVEL_NARRATIVE),
    ]) {
      // Scene-scoped location décor: a relative asset path (no leading slash) at the
      // level's own facade, so the render lane can BASE_URL-prefix + halftone it.
      expect(scene.backdrop).toBe(`assets/levels/${key}/facade.png`);
      expect(scene.backdrop?.startsWith("/")).toBe(false);
    }
  });

  it("A6: tutorial scenes may now carry authored scene backdrops (ADR-0073)", () => {
    for (const scene of [TUTORIAL_NARRATIVE_DESKTOP, TUTORIAL_NARRATIVE_MOBILE]) {
      expect(scene.backdrop).toBeDefined();
      expect(scene.backdrop?.startsWith("/")).toBe(false);
    }
  });

  it("A7: every line that sets `image` also sets a non-empty `imageAlt`", () => {
    const scenes = [
      ...Object.values(PRE_LEVEL_NARRATIVE),
      ...Object.values(POST_LEVEL_NARRATIVE),
      TUTORIAL_NARRATIVE_DESKTOP,
      TUTORIAL_NARRATIVE_MOBILE,
    ];
    for (const scene of scenes) {
      for (const line of scene.lines) {
        if (line.image !== undefined) {
          expect(line.image.startsWith("/")).toBe(false);
          expect((line.imageAlt ?? "").trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  // The gate finding 3 escaped in run 1: the old coverage only checked bullets were
  // ≤2 and non-empty — it never checked WHICH panels carry them, so the build could
  // (and did) drift to a set disjoint from the spec's whitelist without a red test.
  // EQUALITY, not subset: an extra bullet-carrying panel is exactly the defect.
  it("A9: only the whitelisted tutorial panels carry teachingBullets (spec D2.2)", () => {
    // 0-based indices in the gated 16-panel map, identical on both variants (shared
    // field lines): 5 weapon-crate/HUD-arme (C2), 10 civilian courier (C3),
    // 12 hostage ring (C3), 14 HUD recap (C1).
    const WHITELIST = [5, 10, 12, 14];
    for (const scene of [TUTORIAL_NARRATIVE_DESKTOP, TUTORIAL_NARRATIVE_MOBILE]) {
      const carriers = scene.lines
        .map((line, i) => (line.teachingBullets === undefined ? -1 : i))
        .filter((i) => i >= 0);
      expect(carriers).toEqual(WHITELIST);
    }
  });

  it("A9: each whitelisted panel teaches the fact its cue and sentence do not carry", () => {
    // Pins the payload, not just the placement — a whitelisted panel emptied of its
    // teaching content would still satisfy the index set above.
    const lines = TUTORIAL_NARRATIVE_DESKTOP.lines;
    expect(lines[5]?.teachingBullets).toEqual([
      "HUD arme : A = calibre, stock ∞",
      "B/C = spécial : compteur, clignote sur réserve",
    ]);
    expect(lines[10]?.teachingBullets).toEqual(["On tire aux fenêtres, jamais dans la rue"]);
    expect(lines[12]?.teachingBullets).toEqual([
      "La couleur suit la zone sous l'anneau",
      "Vert = tête, jaune = torse, rouge = 0 dégât",
    ]);
    expect(lines[14]?.teachingBullets).toEqual([
      "HUD: score/niveau/vague/temps/vies/arme",
      "Livraison: jauge verte pendant le passage",
    ]);
  });

  it("A8: teachingBullets are optional, capped at 2, and non-empty when authored", () => {
    const scenes = [
      ...Object.values(PRE_LEVEL_NARRATIVE),
      ...Object.values(POST_LEVEL_NARRATIVE),
      TUTORIAL_NARRATIVE_DESKTOP,
      TUTORIAL_NARRATIVE_MOBILE,
    ];
    for (const scene of scenes) {
      for (const line of scene.lines) {
        if (line.teachingBullets === undefined) continue;
        expect(line.teachingBullets.length).toBeLessThanOrEqual(2);
        for (const bullet of line.teachingBullets) {
          expect(bullet.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });
});
