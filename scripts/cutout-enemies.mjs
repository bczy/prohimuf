#!/usr/bin/env node
/**
 * Make the cop sprites' flat dark background transparent so they read as
 * figures in the windows instead of opaque rectangles.
 *
 * Two passes, both keyed to the sampled corner colour (never a hardcoded
 * colour), so the subject is preserved whatever the generated ground is:
 *
 *   1. Edge flood-fill — clears background pixels CONNECTED to an image edge.
 *      Dark pixels *inside* the cop (uniform, boots) are preserved because the
 *      fill can only reach the outer background.
 *   2. Enclosed-island pass — clears flat background regions that are fully
 *      ENCLOSED by the subject (a bike-frame triangle, an arm/torso gap, a
 *      wheel interior). A 4-corner flood can never reach these, so without this
 *      pass they stay opaque and show as stray white/black blobs. See the pass
 *      itself for the topology + colour guards that keep the subject safe.
 *
 * Operates in place on public/assets/enemy_*.png, or on the file paths passed
 * as CLI args (single-file in-place retouch of a committed sprite).
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const DIR = path.resolve(process.cwd(), "public/assets");
const THRESHOLD_SQ = 24 * 24; // conservative: only near-identical background is cleared
// Enclosed-island pass tolerances (per channel, keyed to the sampled ground):
//   LOOSE_BAND — connectivity mask. Wide enough that a legitimately pale subject
//     region (a white helmet highlight) stays in the SAME connected component as
//     the exterior ground and so reads "touches transparent" → never cleared;
//     narrow enough that dark subject detail (frame tubes, spokes, arms) breaks
//     the true enclaves off into isolated components. 55 reproduces the
//     graphiste's validated min(R,G,B)>=200 mask on a white (255) ground.
//   TIGHT_BAND — erase test on the component MEAN colour. Only components whose
//     average is essentially the flat ground are cleared; warm/half-tone subject
//     regions (skin, warm-lit jacket) fall outside it.
const LOOSE_BAND = 55;
const TIGHT_BAND = 20;

function dist2(a, b, c, r, g, bl) {
  const dr = a - r;
  const dg = b - g;
  const db = c - bl;
  return dr * dr + dg * dg + db * db;
}

async function cutout(file) {
  const img = await loadImage(file);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, W, H);
  const d = image.data;

  // Ground colour = average of the four corners, but only over corners that are
  // still OPAQUE. On a raw generation all four are the flat ground (white, black
  // or the vehicles' magenta), so this stays fully corner-adaptive. On a sprite
  // that was ALREADY keyed (a committed enemy_*.png being retouched in place),
  // the PNG encoder has zeroed the RGB under every transparent pixel, so the
  // corners report (0,0,0) and carry no ground info — those are skipped. When
  // none survive, the image is pre-keyed: its exterior is gone but the enclosed
  // islands the flood missed remain, and in this project every committed sprite
  // was generated on a light ground, so the reference falls back to white. The
  // live CI path never hits this fallback (it keys raw generations whose corners
  // are opaque), so a future black-ground regen stays correctly corner-adaptive.
  const corners = [0, (W - 1) * 4, (H - 1) * W * 4, ((H - 1) * W + (W - 1)) * 4];
  let br = 0;
  let bg = 0;
  let bb = 0;
  let nGround = 0;
  for (const o of corners) {
    if (d[o + 3] === 0) continue; // transparent corner: prior key wiped its RGB
    br += d[o];
    bg += d[o + 1];
    bb += d[o + 2];
    nGround++;
  }
  if (nGround > 0) {
    br /= nGround;
    bg /= nGround;
    bb /= nGround;
  } else {
    br = bg = bb = 255; // pre-keyed committed sprite: light-ground fallback
  }

  const visited = new Uint8Array(W * H);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (visited[p]) return;
    visited[p] = 1;
    const o = p * 4;
    if (dist2(d[o], d[o + 1], d[o + 2], br, bg, bb) <= THRESHOLD_SQ) {
      d[o + 3] = 0; // clear alpha
      stack.push(p);
    }
  };

  // Seed from top + sides only (not the bottom): the cop's dark trousers are
  // close to the background colour, so seeding the bottom edge would leak the
  // fill up between the legs and eat them. A small shadow at the feet remains.
  for (let x = 0; x < W; x++) {
    pushIf(x, 0);
  }
  for (let y = 0; y < H; y++) {
    pushIf(0, y);
    pushIf(W - 1, y);
  }
  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % W;
    const y = (p - x) / W;
    pushIf(x - 1, y);
    pushIf(x + 1, y);
    pushIf(x, y - 1);
    pushIf(x, y + 1);
  }

  // ── Enclosed background-island pass ────────────────────────────────────────
  // The flood above only reaches ground CONNECTED to an image edge. Ground
  // fully ENCLOSED by the subject (the triangle inside a bike frame, the gap
  // between an arm and the torso, a wheel interior) is unreachable and stays
  // opaque, showing as stray blobs. This additive pass finds those enclaves as
  // connected components of a loose ground-colour mask and clears them.
  //
  // Two guards keep the subject intact (nothing is ever globally colour-keyed):
  //   • Topology (principal, ground-agnostic guard): a component is cleared only
  //     if it touches NEITHER the image border NOR an already-transparent pixel.
  //     A legitimately pale subject region (helmet, jacket) reaches the exterior
  //     — directly, or bridged through the loose mask — so it reads
  //     touchTransparent and is spared; only truly land-locked ground qualifies.
  //   • Colour (keyed to the sampled ground br/bg/bb, per LOOSE_BAND/TIGHT_BAND):
  //     the LOOSE band builds the connectivity mask; the TIGHT band, tested on
  //     the component MEAN, clears only components that really are the flat
  //     ground, sparing warm/half-tone subject regions.
  // Purely additive — it can only clear pixels the flood should have reached —
  // so alpha stays binary and a re-run finds the enclaves already transparent
  // (they now read touchTransparent) and clears 0 px (idempotent).
  const inLoose = (o) =>
    d[o + 3] !== 0 &&
    Math.abs(d[o] - br) <= LOOSE_BAND &&
    Math.abs(d[o + 1] - bg) <= LOOSE_BAND &&
    Math.abs(d[o + 2] - bb) <= LOOSE_BAND;

  const labeled = new Uint8Array(W * H);
  const comp = [];
  for (let start = 0; start < W * H; start++) {
    if (labeled[start]) continue;
    labeled[start] = 1;
    if (!inLoose(start * 4)) continue;
    // Flood this connected component of the loose ground mask.
    comp.length = 0;
    const cstack = [start];
    let touchBorder = false;
    let touchTransparent = false;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    while (cstack.length > 0) {
      const p = cstack.pop();
      comp.push(p);
      const x = p % W;
      const y = (p - x) / W;
      const o = p * 4;
      sr += d[o];
      sg += d[o + 1];
      sb += d[o + 2];
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchBorder = true;
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < W - 1 ? p + 1 : -1,
        y > 0 ? p - W : -1,
        y < H - 1 ? p + W : -1,
      ];
      for (const n of neighbours) {
        if (n < 0) continue;
        if (d[n * 4 + 3] === 0) {
          touchTransparent = true; // component reaches the keyed exterior
          continue;
        }
        if (labeled[n]) continue;
        labeled[n] = 1;
        if (inLoose(n * 4)) cstack.push(n);
        // else: opaque subject pixel — marks the mask boundary, not cleared.
      }
    }
    if (touchBorder || touchTransparent) continue; // reaches exterior → keep
    const inv = 1 / comp.length;
    if (
      Math.abs(sr * inv - br) <= TIGHT_BAND &&
      Math.abs(sg * inv - bg) <= TIGHT_BAND &&
      Math.abs(sb * inv - bb) <= TIGHT_BAND
    ) {
      for (const p of comp) d[p * 4 + 3] = 0; // clear the enclosed island
    }
  }

  ctx.putImageData(image, 0, 0);
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
  console.log(`  cut ${path.basename(file)} (${W}x${H})`);
}

async function main() {
  // With explicit path args, key only those files (surgical in-place retouch of
  // a committed sprite). With none, key the whole enemy_*.png batch as in CI.
  const args = process.argv.slice(2);
  const files =
    args.length > 0
      ? args.map((f) => path.resolve(process.cwd(), f))
      : fs
          .readdirSync(DIR)
          .filter((f) => /^enemy_.*\.png$/.test(f))
          .map((f) => path.join(DIR, f));
  if (files.length === 0) {
    console.log("no enemy_*.png found");
    return;
  }
  for (const f of files) await cutout(f);
  console.log("done.");
}

// The edge flood-fill cutout is reused by sibling generators (e.g.
// gen-vehicle-sprites.mjs), so expose it. Only run the enemy_*.png batch when
// this file is invoked directly as a CLI, not when imported as a module.
export { cutout };

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
