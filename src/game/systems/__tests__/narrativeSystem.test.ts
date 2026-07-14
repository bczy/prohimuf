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
});
