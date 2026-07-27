#!/usr/bin/env node
/**
 * Generate the QTE boss ("le Commandant") figure + hall-prop sprites (ADR-0051
 * boss encounter system, ADR-0052 differentiation levers, ADR-0053 niveau-final
 * live-ship). Nine entries: 7 commander poses (square 256x256) + the two
 * Niveau-Final hall props — `lustre` (portrait 320x512) and `speaker_wall`
 * (landscape 512x320), per-type `size` overrides ([S13]).
 *
 * PIPELINE (aligned on the enemies set, dev-tooling-assets bake-off,
 * docs/handoffs — 27-cell then 24-cell CI harness, all-green): gptimage-large
 * via gen.pollinations.ai (image.pollinations.ai silently ignores `model=`
 * unauthenticated and serves `sana`), reference-guided by the validated enemy
 * sprites, comic-ink style tail on a flat magenta (#FF3CDC) chroma ground,
 * chroma-keyed with the shared gptimage.mjs `keyAndDown()` (edge flood-fill +
 * luma flatten + crop-to-aspect + downscale) — the exact chain that produced
 * enemy_*.png (scripts/lib/gptimage.mjs, gen-gptimage-asset.mjs), NOT the
 * legacy FLUX/black-ground/cutout-enemies.mjs recipe this script used before.
 *
 * The style tail (COMIC_TAIL below) is a script-local constant, not read from
 * levelArt.json's `boss.style` — same precedent as gen-gptimage-asset.mjs,
 * which hardcodes its own tail rather than reading `enemies.style` (dead text:
 * the enemy sprites were never produced through that field either). Keeping
 * `boss.style` untouched in levelArt.json is deliberate; only `prompt`/`seed`/
 * `asset`/`size` from that block are consulted here.
 *
 * Single source of truth for WHAT to generate: the `boss` block of
 * src/game/levels/levelArt.json (prompt, seed, per-entry `size` override,
 * `asset` path). Add or tune a figure/prop THERE, never in this script. The
 * block deliberately lives BESIDE `enemies`, same as `hostages` (ADR-0030):
 * its keys must not enter the ARCHETYPES-derived enemies.types register
 * (levelArt.consistency gate) — the Commandant is a plein-pied QTE-only
 * figure, never a shootable window archetype. Entries marked `pending: true`
 * (no `prompt` yet) are skipped — see loadBossFigures().
 *
 * Naming contract: public/assets/boss/<key>.png (mirrors the hostage/<key>.png
 * convention). Zero render consumer exists today (ADR-0053 D6 — render
 * integration is a deferred follow-up pass); this script only needs to produce
 * the files at the paths the manifest declares.
 *
 * Only MISSING files are generated, so re-runs are cheap; set FORCE=1 to
 * regenerate. Network image generation (Pollinations) is blocked in the local
 * sandbox, so this normally runs in CI (.github/workflows/gen-boss-sprites.yml).
 *
 * Usage:
 *   node scripts/gen-boss-sprites.mjs                             # generate missing (network gptimage-large)
 *   FORCE=1 node scripts/gen-boss-sprites.mjs                     # regenerate all  [CI]
 *   node scripts/gen-boss-sprites.mjs --asset commander_shielded  # one figure only
 *   node scripts/gen-boss-sprites.mjs --list                      # list defined figures
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readToken, genUrl, withRetry, keyAndDown } from "./lib/gptimage.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";
const GEN = 1024;

// Verbatim from scripts/gen-gptimage-asset.mjs's FIGURE_TAIL — the exact
// string behind the validated enemy sprites, confirmed the winner by the
// multi-model bake-off (scripts/bakeoff-boss-models.mjs). See file header for
// why this lives here rather than in levelArt.json's `boss.style`.
const COMIC_TAIL =
  ", clean bold comic book ink illustration, three-tone cel shading grey black and white, thick clean black outline, flat evenly filled shapes, full body figure fully visible and centered, floating isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no floor, no cast shadow, no drop shadow, no text, no letters, no logo, no writing, no signature, blank plain clothing with no markings";

// The validated enemy sprites, passed as visual references (gptimage-large
// supports up to 16) — the bake-off's "guidé par les ennemis" cell, the most
// literal reading of "base-toi sur les ennemis". Served from the public repo
// over raw.githubusercontent.com, same source bakeoff-boss-models.mjs uses.
const REF_IMAGES = [
  "https://raw.githubusercontent.com/bczy/prohimuf/main/public/assets/enemy_sprite.png",
  "https://raw.githubusercontent.com/bczy/prohimuf/main/public/assets/enemy_riot.png",
];

// Style-match test (scripts/style-match-test.mjs, 4 variants on commander_shielded,
// same seed/refs, phrasing-only): opening the WHOLE prompt with the style-lock —
// ahead of the subject, not appended after the tail — read as the cleanest linework
// of the four and was Bertrand's pick ("beaucoup mieux"). Kept as its own constant
// (not folded into COMIC_TAIL) so the two ideas — "what to draw" vs "match this
// reference technique" — stay separately editable.
const STYLE_LOCK = "in the exact art style of the two attached reference character images: ";

// ── Load the boss definitions from levelArt.json (single source) ────────────
function loadBossFigures() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.boss;
  if (!block || !block.types) {
    throw new Error(`No "boss.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const blockWidth = block.size?.width ?? 256;
  const blockHeight = block.size?.height ?? 256;
  return Object.entries(block.types)
    .filter(([key, def]) => {
      // `pending: true` entries (shield_cover_raised/lowered today) carry no
      // `prompt` yet — a deliberate not-ready-to-draft marker, not a defect.
      // Generating them would silently bake the literal string "undefined"
      // into the request. Skip them here rather than at the request layer.
      if (def.pending) {
        console.log(
          `  [pending] ${key} — no prompt yet, skipped (see levelArt.json boss.types.${key})`,
        );
        return false;
      }
      return true;
    })
    .map(([key, def]) => {
      if (!Number.isInteger(def.seed) || def.seed <= 0) {
        throw new Error(`boss.types.${key}: "seed" must be a positive integer (pinned rolls)`);
      }
      if (typeof def.asset !== "string" || def.asset.trim() === "") {
        throw new Error(`boss.types.${key}: "asset" must be a non-empty path`);
      }
      if (typeof def.prompt !== "string" || def.prompt.trim() === "") {
        throw new Error(
          `boss.types.${key}: "prompt" must be a non-empty string (or set pending: true)`,
        );
      }
      // Per-entry `size` override ([S13], nearForegroundArt.types precedent): the
      // 7 humanoid figures share the block-default square canvas; `lustre`
      // (portrait) and `speaker_wall` (landscape) each carry their own
      // natural-aspect size.
      const width = def.size?.width ?? blockWidth;
      const height = def.size?.height ?? blockHeight;
      return {
        key,
        // Subject only — COMIC_TAIL (script-local, see file header) is
        // appended at request time in generate(), not levelArt.json's
        // (unused-for-generation) `boss.style`.
        subject: def.prompt,
        width,
        height,
        seed: def.seed,
        outFile: path.resolve(ROOT, "public", def.asset),
      };
    });
}

// ── gptimage-large fetch, reference-guided, magenta ground ───────────────────
// Same chain as gen-gptimage-asset.mjs (the script that actually produced
// enemy_*.png): gen.pollinations.ai, gptimage-large, comic-ink tail, enemy
// sprites as visual references.
async function generate(fig, token) {
  console.log(`  [seed] ${fig.key} seed=${fig.seed} (pinned)`);
  const url = genUrl(`${STYLE_LOCK}${fig.subject}${COMIC_TAIL}`, fig.seed, {
    gen: GEN,
    refs: REF_IMAGES,
  });
  return withRetry(url, token);
}

// ── Deterministic despeckle (shared sweep from retouch-sprites.mjs) ───────────
// The magenta-ground key can leave a handful of tiny opaque debris islands
// around the figure/prop; the integrity gate's SPECKLE BUDGET (≤ 4 comps <
// 12px) rejects them. Sweep every non-dominant sub-speckle component after the
// key so each entry ships clean — same scripted-retouch idiom as
// gen-hostage-sprites.mjs.
async function tryDespeckle(file, key) {
  try {
    const { sweepSpeckle } = await import("./retouch-sprites.mjs");
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");
    const img = await loadImage(file);
    const W = img.width;
    const H = img.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const image = ctx.getImageData(0, 0, W, H);
    const { removedComps, removedPx } = sweepSpeckle({ W, H, d: image.data });
    if (removedComps > 0) {
      ctx.putImageData(image, 0, 0);
      fs.writeFileSync(file, canvas.toBuffer("image/png"));
    }
    console.log(`  [despeckle] ${key} — removed ${removedComps} comp / ${removedPx}px`);
  } catch (e) {
    console.log(`  [despeckle-skip] ${key} — ${e.message} (runs in CI)`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const figures = loadBossFigures();

  if (args.includes("--list")) {
    for (const f of figures) {
      console.log(
        `${f.key.padEnd(24)} ${String(f.width).padStart(4)}x${f.height}  seed=${f.seed}  ${path.relative(ROOT, f.outFile)}`,
      );
    }
    return;
  }

  const assetIdx = args.indexOf("--asset");
  const only = assetIdx !== -1 ? args[assetIdx + 1] : null;
  const targets = only ? figures.filter((f) => f.key === only) : figures;
  if (targets.length === 0) {
    throw new Error(`Unknown boss key "${only}" (see --list)`);
  }

  const pending = [];
  for (const f of targets) {
    if (!FORCE && fs.existsSync(f.outFile)) {
      console.log(`[skip] ${f.key} — ${path.relative(ROOT, f.outFile)} exists (FORCE=1 to redo)`);
      continue;
    }
    pending.push(f);
  }
  if (pending.length === 0) return;
  const token = readToken();

  for (const f of pending) {
    console.log(`[gen ] ${f.key} ${f.width}x${f.height}`);
    const buf = await generate(f, token);
    // tol=150 (default is 95): the style tail's "no cast shadow, no drop
    // shadow" clauses are NOT obeyed — the bake-off's ref-guided cells (e.g.
    // commander_down, commander_exposed) render a visible darker-magenta
    // shadow blob under the boots/coat that survives the default tolerance
    // (it's a blend toward black, still far enough from pure magenta to read
    // as foreground) and then gets desaturated into a permanent grey smudge.
    // Verified empirically against the actual bake-off PNGs (CI run
    // 30180744248, artifact bakeoff-2): tol=150 removes every shadow blob
    // observed across all 9 entries (commander_down/_exposed/_hit worst hit)
    // with zero visible erosion of the figure/prop art at that same
    // tolerance — a pipeline fix, not a prompt-wording retry.
    const { s, opaque } = await keyAndDown(buf, { targetW: f.width, targetH: f.height, tol: 150 });
    fs.mkdirSync(path.dirname(f.outFile), { recursive: true });
    fs.writeFileSync(f.outFile, s.toBuffer("image/png"));
    console.log(
      `  [ok ] wrote ${path.relative(ROOT, f.outFile)} (opaque ${(opaque * 100).toFixed(1)}%)`,
    );
    await tryDespeckle(f.outFile, f.key);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
