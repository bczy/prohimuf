import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { planBelliardAssets } from "../gen-belliard-decor.mjs";

const manifest = JSON.parse(
  fs.readFileSync(path.resolve("src/game/levels/levelArt.json"), "utf8"),
);
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

  it("derives each tronçon width from its native aspect", () => {
    expect(byFile["troncon-a.png"].width / byFile["troncon-a.png"].height).toBeCloseTo(1.6491, 2);
    expect(byFile["troncon-b.png"].width / byFile["troncon-b.png"].height).toBeCloseTo(1.7857, 2);
    expect(byFile["troncon-c.png"].width / byFile["troncon-c.png"].height).toBeCloseTo(1.9224, 2);
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
});
