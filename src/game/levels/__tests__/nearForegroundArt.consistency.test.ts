import { describe, it, expect } from "vitest";
import manifest from "../levelArt.json";
import { NEAR_KIND_SPECS } from "../../../render/scene/nearForegroundArt";
import type { NearForegroundKind } from "@game/levels/levelArt";

/**
 * The `nearForegroundArt.$comment` claims: "Per-type `size` sets the GENERATED
 * texture pixel dims (width = round(512*aspect)); it must match NEAR_KIND_SPECS
 * aspect (pinned by nearForegroundArt.consistency test) so the plane never distorts."
 * This is that test. It pins the no-distortion seam between the generation block
 * (levelArt.json, tooling lane) and the world sizing (NEAR_KIND_SPECS, render lane):
 * every kind must be declared, point at `assets/nearfg/<kind>.png`, and carry a
 * 512-tall texture whose width is round(512 * aspect).
 */

const TEX_H = 512;

interface NearArtType {
  readonly asset: string;
  readonly size: { readonly width: number; readonly height: number };
}
const BLOCK = (manifest as { nearForegroundArt?: { types?: Record<string, NearArtType> } })
  .nearForegroundArt;

const KINDS = Object.keys(NEAR_KIND_SPECS) as NearForegroundKind[];

describe("nearForegroundArt block ↔ NEAR_KIND_SPECS consistency", () => {
  it("declares the generation block", () => {
    expect(BLOCK, "levelArt.json must declare a nearForegroundArt block").toBeDefined();
    expect(BLOCK?.types).toBeDefined();
  });

  it.each(KINDS)("'%s' has a well-formed, non-distorting generated-sprite entry", (kind) => {
    const entry = BLOCK?.types?.[kind];
    expect(entry, `nearForegroundArt.types.${kind} must exist`).toBeDefined();
    if (entry === undefined) return;

    expect(entry.asset).toBe(`assets/nearfg/${kind}.png`);
    // Texture height is fixed at 512; width follows the render-side aspect exactly so
    // the plane (planeW = planeH * aspect) samples the PNG without stretching.
    expect(entry.size.height).toBe(TEX_H);
    expect(entry.size.width).toBe(Math.round(TEX_H * NEAR_KIND_SPECS[kind].aspect));
  });
});
