#!/usr/bin/env node
/**
 * Generate the Rue Belliard décor **v3** fanzine-B&W lot as FLUX text-to-image.
 *
 * WHY A DEDICATED SCRIPT (not gen-level-art.mjs): the manifest `style` tail is
 * colour 16-bit pixel-art ("deep blue violet … magenta cyan neon accents"), and
 * gen-level-art.mjs appends it to every layer. For Belliard's photocopied-fanzine
 * B&W register that tail RE-INTRODUCES colour — the exact v2 failure. So this lot
 * bypasses that path: self-contained fanzine prompts, NO style tail, NO label
 * suffix, `enhance=false`, pinned seeds (one printing run).
 *
 * WHY IT IS ALSO NOT gen-from-reference.mjs: that path is kontext img2img off a
 * colour photo reference — the other half of the v2 colour root cause. This is
 * pure text-to-image, no reference image conditioned in.
 *
 * Source of truth for the prompts:
 *   - sky, foreground → src/game/levels/levelArt.json (belliard.prompts) — the
 *     manifest slots, single-source, already lead-art gated.
 *   - troncon-a/b/c   → the SHARED_STYLE + per-tile distinguishing clause below.
 *     Tronçon tiles have NO manifest prompt slot (`backdrop.tiles` carries only
 *     file+aspect and `prompts` is typed `Record<LayerName,string>`), so the
 *     gated v3 strings live here, mirrored verbatim from
 *     docs/art-direction/prompt-drafts/level-belliard-decor-v3.md (lead-art
 *     PROMPT GATE PASS, 2026-07-21). Keeping the tokens B&W is guarded by
 *     scripts/__tests__/gen-belliard-decor.test.mjs.
 *
 * Lot (5 assets): troncon-a, troncon-b, troncon-c, sky, foreground.
 * NOT in the lot: ground.png (kept v6) and street.png (not rendered in tronçon
 * mode) — see the v3 draft §5/§6.
 *
 * Output: public/assets/levels/belliard/{troncon-a,troncon-b,troncon-c,sky,foreground}.png
 *
 *   node scripts/gen-belliard-decor.mjs --dry-run   # print the plan (no network)
 *   node scripts/gen-belliard-decor.mjs             # generate missing files
 *   FORCE=1 node scripts/gen-belliard-decor.mjs     # regenerate all five
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fluxUrl, fetchWithRetry, sleep } from "./lib/pollinations.mjs";
import { skip } from "./lib/idempotent.mjs";

const ROOT = process.cwd();
const OUT_DIR = path.resolve(ROOT, "public/assets/levels/belliard");
const MANIFEST = path.resolve(ROOT, "src/game/levels/levelArt.json");
const LEVEL_ID = "belliard";

// One shared pinned seed for A/B/C so the three read as one printing run
// (v3 §2). Sky and foreground carry their own pinned seeds.
const TRONCON_SEED = 7110;
const SKY_SEED = 7120;
const FOREGROUND_SEED = 7130;

// Shared height in px for the three tronçons; width follows the native aspect so
// the tiles read as one run. The renderer scales each tile to world height, so
// only the RATIO matters on screen — a shared pixel height keeps the xerox grain
// consistent across the three.
const TRONCON_HEIGHT = 640;

// Guaranteed empty margin on EACH side of a tronçon (Bertrand correction 3): the
// prompt asks for it, and this GUARANTEES it — the building is generated into the
// inner width and padded with transparent columns out to the manifest-aspect final
// width, so nothing is clipped and the on-screen aspect is unchanged.
const TRONCON_MARGIN_FRAC = 0.14;

/**
 * Pure size planner for a padded tronçon tile. Exported for the unit test.
 * `finalWidth` keeps the manifest aspect (height*aspect); the art is generated at
 * `innerWidth` and centred, leaving >= marginFrac transparent on each side.
 * @returns {{finalWidth:number, innerWidth:number, offsetX:number}}
 */
export function planTileSize(height, aspect, marginFrac = TRONCON_MARGIN_FRAC) {
  const finalWidth = Math.round(height * aspect);
  const innerWidth = Math.round(finalWidth * (1 - 2 * marginFrac));
  const offsetX = Math.round((finalWidth - innerWidth) / 2);
  return { finalWidth, innerWidth, offsetX };
}

// The byte-for-byte shared "printing-run" style block (v3 §1), reused by A/B/C.
// Bertrand 2026-07-21 corrections front-loaded: (1) BD/cartoon drawing register
// not photo, (2) strict frontal / no perspective, (3) empty margin both sides.
const SHARED_STYLE =
  "Hand-drawn black-and-white comic-book illustration, bold clean black ink outlines and flat " +
  "cel-shaded grey fills, clear ligne-claire cartoon drawing, not a photograph. Strict flat frontal " +
  "orthographic elevation: every façade parallel to the picture plane and seen perfectly head-on, " +
  "flat like an architect's front-elevation drawing and like a comic-book panel viewed dead ahead, " +
  "no vanishing point. Printed on a 1990s photocopied fanzine page, coarse halftone toner dots and " +
  "xerox grain over the linework, three-value ladder of near-black #141210, mid-grey #3A3E44 and " +
  "paper-white #E9E3D2. One to three ordinary weathered Paris 18e faubourg buildings standing alone as " +
  "an isolated cut-out cluster against open empty night sky, not a continuous street, irregular widths, four-to-five " +
  "storeys, louvered shutters, simple iron balcony rails, grey zinc mansard roofs, two or three " +
  "thick blocky chimneys per building, a low iron Petite-Ceinture grille at each base. Deep night, " +
  "windows dark or shuttered, an occasional lit window a flat paper-white #E9E3D2 rectangle, no " +
  "glow. Ground floor one value step lighter, its roll-down metal shutters layered with flat inked " +
  "graffiti tags and a photocopied flyer in illegible lettering, tags thinning fast to bare clean " +
  "upper walls. The buildings form one compact cluster floating in the centre of the frame, set " +
  "well in from the sides, a wide band of empty plain night sky running down both the far left and " +
  "the far right edge, the outermost building clearly ending inside the frame with sky beside it, " +
  "the cluster never reaching or touching the left or right edge.";

// Per-tronçon distinguishing clause (v3 §2). aspect drives the tile width.
const TRONCONS = [
  {
    file: "troncon-a",
    aspect: 1.9234,
    distinct:
      "Here, two such buildings of clearly different width and height stand together as an isolated " +
      "pair with open night sky all around them, a clear vertical sliver of sky between the two.",
  },
  {
    file: "troncon-b",
    aspect: 2.0406,
    distinct:
      "Here, three such buildings stand clustered together as an isolated group with open night sky " +
      "around them, one showing a bare windowless mid-grey #3A3E44 masonry gable end wall.",
  },
  {
    file: "troncon-c",
    aspect: 2.1156,
    distinct:
      "Here, two or three such buildings stand together as an isolated cluster with open night sky " +
      "around them, one narrow dark passage alley set back well within the cluster, away from either edge.",
  },
];

/**
 * Pure planner: turn the manifest into the concrete generation plan (no network,
 * no fs writes). Exported for the unit test.
 * @returns {{file:string, prompt:string, seed:number, width:number, height:number}[]}
 */
export function planBelliardAssets(manifest) {
  const level = (manifest.levels ?? []).find((l) => l.id === LEVEL_ID);
  if (!level) throw new Error(`level "${LEVEL_ID}" not found in manifest`);
  const sizes = manifest.sizes ?? {};
  const plan = TRONCONS.map((t) => {
    const { finalWidth, innerWidth, offsetX } = planTileSize(TRONCON_HEIGHT, t.aspect);
    return {
      file: `${t.file}.png`,
      prompt: `${SHARED_STYLE} ${t.distinct}`,
      seed: TRONCON_SEED,
      // `width` is the GENERATION width (inner); the written PNG is padded to finalWidth.
      width: innerWidth,
      height: TRONCON_HEIGHT,
      finalWidth,
      offsetX,
    };
  });
  plan.push({
    file: "sky.png",
    prompt: level.prompts.sky,
    seed: SKY_SEED,
    width: sizes.sky.width,
    height: sizes.sky.height,
  });
  plan.push({
    file: "foreground.png",
    prompt: level.prompts.foreground,
    seed: FOREGROUND_SEED,
    width: sizes.foreground.width,
    height: sizes.foreground.height,
  });
  return plan;
}

// Pad a generated PNG onto a transparent finalWidth×height canvas at offsetX,
// leaving empty (fully transparent) columns on both sides.
async function padSides(buf, finalWidth, height, offsetX) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(buf);
  const cv = createCanvas(finalWidth, height);
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, finalWidth, height); // transparent margins
  ctx.drawImage(img, offsetX, 0);
  return cv.toBuffer("image/png");
}

async function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force") || process.env.FORCE === "1";
  const dryRun = argv.includes("--dry-run") || argv.includes("--list");

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const plan = planBelliardAssets(manifest);

  if (dryRun) {
    console.log("Belliard décor v3 lot (FLUX text-to-image, no style tail):\n");
    for (const a of plan) {
      console.log(
        `  ${a.file.padEnd(16)} seed=${a.seed}  ${a.width}x${a.height}  ${a.prompt.trim().split(/\s+/).length} words`,
      );
    }
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating Belliard décor v3 → ${OUT_DIR}${force ? " (force)" : ""}\n`);
  for (const a of plan) {
    const out = path.join(OUT_DIR, a.file);
    if (skip(out, { force, existsSync: fs.existsSync })) {
      console.log(`  [skip] ${a.file} (exists)`);
      continue;
    }
    const label = a.finalWidth
      ? `${a.width}x${a.height}→${a.finalWidth}x${a.height}`
      : `${a.width}x${a.height}`;
    console.log(`  [gen]  ${a.file} (seed ${a.seed}, ${label})`);
    try {
      const buf = await fetchWithRetry(fluxUrl(a.prompt, a.seed, a.width, a.height));
      // Tronçons: pad the generated art with transparent columns out to the
      // manifest-aspect final width, guaranteeing an empty margin on both sides.
      const finalBuf = a.finalWidth ? await padSides(buf, a.finalWidth, a.height, a.offsetX) : buf;
      fs.writeFileSync(out, finalBuf);
      console.log(`  [ok]   ${a.file} (${finalBuf.length} bytes)`);
    } catch (e) {
      console.log(`  [fail] ${a.file} — ${e.message}`);
    }
    await sleep(2000);
  }
  console.log("\ndone.");
}

// Run only when invoked directly, so the test can import the pure planner.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
