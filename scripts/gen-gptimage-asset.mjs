#!/usr/bin/env node
/**
 * gpt-asset.mjs — reusable gptimage asset harness.
 * Generates ONE asset via gptimage-large on a flat magenta chroma ground,
 * chroma-keys it (supersampled), downscales to the target size, and writes a
 * clean transparent PNG + a cyan preview.
 *
 * Usage:
 *   node gpt-asset.mjs --prompt "<subject>" --seed 4814 --out /path/out.png \
 *        [--gen 1024] [--size 256] [--tol 95] [--kind sprite|vehicle]
 *
 * Token: `POLLINATIONS_TOKEN` env var first (CI secret), then the legacy
 * scratchpad token file (local fallback) — see scripts/lib/gptimage.mjs's
 * readToken(). Never printed. gptimage-large is premium (spends Pollen).
 *
 * Thin CLI over scripts/lib/gptimage.mjs (tech-plan-road-props.md decision 4)
 * — same flags, same behaviour as before the refactor.
 */
import fs from "fs";
import { readToken, genUrl, withRetry, keyAndDown, cyanPreviewCanvas } from "./lib/gptimage.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => {
    if (v.startsWith("--")) a.push([v.slice(2), arr[i + 1]]);
    return a;
  }, []),
);
const PROMPT = args.prompt;
const SEED = parseInt(args.seed ?? "1", 10);
const OUT = args.out;
const GEN = parseInt(args.gen ?? "1024", 10);
const SIZE = parseInt(args.size ?? "256", 10);
const TOL = parseInt(args.tol ?? "95", 10);
const _KIND = args.kind ?? "sprite";
if (!PROMPT || !OUT) {
  console.error("need --prompt and --out");
  process.exit(2);
}
const TOKEN = readToken();

// House "clean comic" treatment tail + flat magenta chroma ground + hard no-text
// + no ground shadow (killed at source, avoids a post-matte).
const FIGURE_TAIL =
  ", clean bold comic book ink illustration, three-tone cel shading grey black and white, thick clean black outline, flat evenly filled shapes, full body figure fully visible and centered, floating isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no floor, no cast shadow, no drop shadow, no text, no letters, no logo, no writing, no signature, blank plain clothing with no markings";
const STYLE = args.tail ? ", " + args.tail : FIGURE_TAIL;

const buf = await withRetry(genUrl(`${PROMPT}${STYLE}`, SEED, { gen: GEN }), TOKEN);
const { s, ground, opaque } = await keyAndDown(buf, {
  targetW: SIZE,
  targetH: SIZE,
  keepColor: Boolean(args.keepcolor),
  tol: TOL,
});
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ""), { recursive: true });
fs.writeFileSync(OUT, s.toBuffer("image/png"));
// cyan preview next to it
const v = cyanPreviewCanvas(s);
fs.writeFileSync(OUT.replace(/\.png$/, "_cyan.png"), v.toBuffer("image/png"));
console.log(
  JSON.stringify({ out: OUT, seed: SEED, ground, opaquePct: +(opaque * 100).toFixed(1) }),
);
