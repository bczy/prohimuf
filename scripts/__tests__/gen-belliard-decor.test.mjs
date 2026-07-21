import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { planBelliardAssets } from "../gen-belliard-decor.mjs";

const manifest = JSON.parse(fs.readFileSync(path.resolve("src/game/levels/levelArt.json"), "utf8"));
const plan = planBelliardAssets(manifest);
const byFile = Object.fromEntries(plan.map((a) => [a.file, a]));

describe("planBelliardAssets", () => {
  it("generates only the foreground (tronçons come from img2img+desat, not FLUX)", () => {
    expect(plan.map((a) => a.file)).toEqual(["foreground.png"]);
  });

  it("takes the foreground size from the manifest", () => {
    expect(byFile["foreground.png"].width).toBe(manifest.sizes.foreground.width);
    expect(byFile["foreground.png"].height).toBe(manifest.sizes.foreground.height);
  });

  it("keeps the foreground chroma-key phrase the cutout pipeline needs", () => {
    expect(byFile["foreground.png"].prompt).toMatch(/magenta chroma-key/i);
  });

  it("never carries a colour or pixel-art token into the prompt (the v2 failure)", () => {
    const banned = /\b(pixel art|pixel-art|neon|violet|orange|cyan|magenta cyan|16-bit|snes)\b/i;
    // `magenta chroma-key` is a keying instruction, not décor colour — strip it first.
    const decor = byFile["foreground.png"].prompt
      .replace(/magenta chroma-key/gi, "")
      .replace(/bright magenta/gi, "");
    expect(decor).not.toMatch(banned);
  });
});
