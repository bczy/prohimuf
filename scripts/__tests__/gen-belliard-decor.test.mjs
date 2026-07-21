import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { planBelliardAssets, planTileSize } from "../gen-belliard-decor.mjs";

const manifest = JSON.parse(fs.readFileSync(path.resolve("src/game/levels/levelArt.json"), "utf8"));
const plan = planBelliardAssets(manifest);
const byFile = Object.fromEntries(plan.map((a) => [a.file, a]));

describe("planBelliardAssets", () => {
  it("plans exactly the five-asset fanzine lot (ground/street excluded)", () => {
    expect(plan.map((a) => a.file).sort()).toEqual([
      "foreground.png",
      "sky.png",
      "troncon-a.png",
      "troncon-b.png",
      "troncon-c.png",
    ]);
  });

  it("shares one pinned seed across the three tronçons (one printing run)", () => {
    const seeds = ["troncon-a.png", "troncon-b.png", "troncon-c.png"].map((f) => byFile[f].seed);
    expect(new Set(seeds).size).toBe(1);
    expect(byFile["sky.png"].seed).not.toBe(byFile["troncon-a.png"].seed);
    expect(byFile["foreground.png"].seed).not.toBe(byFile["sky.png"].seed);
  });

  it("keeps the final tronçon aspect on the manifest ratio (padding preserves it)", () => {
    // `width` is the inner generation width; `finalWidth` is the padded PNG that
    // carries the on-screen aspect.
    expect(byFile["troncon-a.png"].finalWidth / byFile["troncon-a.png"].height).toBeCloseTo(
      1.9234,
      2,
    );
    expect(byFile["troncon-b.png"].finalWidth / byFile["troncon-b.png"].height).toBeCloseTo(
      2.0406,
      2,
    );
    expect(byFile["troncon-c.png"].finalWidth / byFile["troncon-c.png"].height).toBeCloseTo(
      2.1156,
      2,
    );
  });

  it("guarantees an empty margin on both sides of every tronçon", () => {
    for (const f of ["troncon-a.png", "troncon-b.png", "troncon-c.png"]) {
      const t = byFile[f];
      expect(t.width).toBeLessThan(t.finalWidth); // inner art narrower than final
      expect(t.offsetX).toBeGreaterThan(0); // left margin
      expect(t.finalWidth - t.width - t.offsetX).toBeGreaterThan(0); // right margin
    }
  });

  it("sky/foreground are full-bleed (no padding)", () => {
    expect(byFile["sky.png"].finalWidth).toBeUndefined();
    expect(byFile["foreground.png"].finalWidth).toBeUndefined();
  });

  it("takes sky/foreground sizes from the manifest", () => {
    expect(byFile["sky.png"].width).toBe(manifest.sizes.sky.width);
    expect(byFile["foreground.png"].height).toBe(manifest.sizes.foreground.height);
  });

  it("keeps the foreground chroma-key phrase the cutout pipeline needs", () => {
    expect(byFile["foreground.png"].prompt).toMatch(/magenta chroma-key/i);
  });

  it("never carries a colour or pixel-art token into any prompt (the v2 failure)", () => {
    // The manifest `style` tail (pixel-art + colour) must NOT reach these prompts.
    const banned = /\b(pixel art|pixel-art|neon|violet|orange|cyan|magenta cyan|16-bit|snes)\b/i;
    for (const a of plan) {
      // `magenta chroma-key` is a keying instruction, not décor colour — strip it first.
      const decor = a.prompt.replace(/magenta chroma-key/gi, "").replace(/bright magenta/gi, "");
      expect(decor, `${a.file} must stay B&W`).not.toMatch(banned);
    }
  });

  it("carries Bertrand's 2026-07-21 corrections in the tronçon prompts", () => {
    const p = byFile["troncon-a.png"].prompt;
    expect(p, "BD/cartoon register, not photo").toMatch(
      /comic-book illustration.*not a photograph/i,
    );
    expect(p, "strict frontal, no perspective").toMatch(/frontal orthographic elevation/i);
    expect(p, "no vanishing point").toMatch(/no vanishing point/i);
    expect(p, "margin on both sides").toMatch(/both the far left and the far right edge/i);
  });
});

describe("planTileSize", () => {
  it("centres the inner art with a symmetric margin inside the final width", () => {
    const { finalWidth, innerWidth, offsetX } = planTileSize(640, 1.6491, 0.08);
    expect(finalWidth).toBe(Math.round(640 * 1.6491));
    expect(innerWidth).toBeLessThan(finalWidth);
    // >= ~8% of the final width transparent on each side
    expect(offsetX).toBeGreaterThanOrEqual(Math.floor(finalWidth * 0.075));
    expect(finalWidth - innerWidth - offsetX).toBeGreaterThanOrEqual(
      Math.floor(finalWidth * 0.075),
    );
  });
});
