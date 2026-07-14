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

  it("A6: tutorial scenes carry no backdrop (byte-identical to pre-ADR-0023)", () => {
    expect(TUTORIAL_NARRATIVE_DESKTOP.backdrop).toBeUndefined();
    expect(TUTORIAL_NARRATIVE_MOBILE.backdrop).toBeUndefined();
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
});
