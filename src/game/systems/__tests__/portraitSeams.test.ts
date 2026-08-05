import { describe, it, expect } from "vitest";
import { manifestFor } from "@game/systems/assetManifest";
import { PORTRAIT_ROBOT_NARRATIVE } from "@game/systems/narrativeSystem";
import { FACE_CATALOGUE } from "@game/portraits/faceCatalogue.data";
import { PORTRAIT_ASSET_DIR } from "@game/types/portraitRobot";
import { FIRST_PLAYABLE_LEVEL } from "@game/levels/levels";

/**
 * The two remaining additive seams (hand-off §3.2): the `"portrait-robot"` manifest
 * target (ADR-0080 D5) and the three obligatory narrative beats (ADR-0079 D5).
 */

describe('the "portrait-robot" manifest target', () => {
  const manifest = manifestFor("portrait-robot");

  it("is exactly the 24 sliced band PNGs, de-duplicated and stably ordered", () => {
    expect(manifest).toHaveLength(24);
    expect(new Set(manifest).size).toBe(24);
    expect(manifest).toEqual(manifestFor("portrait-robot"));
  });

  it("is read off the catalogue — no path is authored twice", () => {
    expect([...manifest]).toEqual(
      FACE_CATALOGUE.bands.flatMap((band) => band.variants.map((v) => v.asset)),
    );
    for (const path of manifest) expect(path.startsWith(`${PORTRAIT_ASSET_DIR}/`)).toBe(true);
  });

  it("BASE-relative, no leading slash — the render lane prefixes BASE_URL", () => {
    for (const path of manifest) expect(path.startsWith("/")).toBe(false);
  });

  it("no level manifest carries them — a player who never reaches the scene never downloads them", () => {
    const levelManifest = manifestFor(FIRST_PLAYABLE_LEVEL.id);
    for (const path of manifest) expect(levelManifest).not.toContain(path);
  });
});

describe("the three obligatory recalls (gate A1b/A10)", () => {
  it("exists for every issue — none is mute", () => {
    expect(Object.keys(PORTRAIT_ROBOT_NARRATIVE).sort()).toEqual([
      "FAILED",
      "IDENTIFIED",
      "PARTIAL",
    ]);
  });

  it("stays inside the loop budget: 4 lines max, non-empty, unique ids", () => {
    const ids = new Set<string>();
    for (const scene of Object.values(PORTRAIT_ROBOT_NARRATIVE)) {
      expect(scene.lines.length).toBeGreaterThan(0);
      expect(scene.lines.length).toBeLessThanOrEqual(4);
      for (const line of scene.lines) expect(line.text.trim()).not.toBe("");
      ids.add(scene.id);
    }
    expect(ids.size).toBe(3);
  });

  it("names no figure and scolds nobody (fiction §5.3 interdits)", () => {
    const forbidden = [
      /\d/,
      /échou/i,
      /score/i,
      /énergie/i,
      /secondes?/i,
      /valide/i,
      /confirme/i,
    ];
    for (const scene of Object.values(PORTRAIT_ROBOT_NARRATIVE)) {
      for (const line of scene.lines) {
        for (const pattern of forbidden) {
          // "page 23" is the zine, not a figure about the player's run — the ONE
          // number the fiction authorises, and it is a proper noun in disguise.
          const text = line.text.replace("page 23", "page vingt-trois");
          expect(text).not.toMatch(pattern);
        }
      }
    }
  });

  it("FAILED carries the obligatory self-harm beat — Sam, and the man got in", () => {
    const failed = PORTRAIT_ROBOT_NARRATIVE.FAILED.lines.map((l) => l.text).join(" ");
    expect(failed).toContain("Sam");
    expect(failed).toContain("L'autre est entré");
  });
});
