#!/usr/bin/env node
/**
 * Generate the enemy sprite FLIPBOOK frames for every archetype (base cops,
 * riot/CRS, motorcycle cop, delivery civilian, bonus figure) in the same 16-bit
 * pixel-art style as the accepted set: light tones on a PURE BLACK background
 * (cutout-enemies.mjs keys the black to transparency afterwards; EnemySprite
 * tints per kind). Period-authentic Prohibition-1987 flips: 2 frames at 6 fps.
 *
 * Single source of truth: the `enemies` block of src/game/levels/levelArt.json
 * (style, size, per-type seed/prompt/frames). Add or tune an enemy THERE, never
 * in this script (mirrors gen-vehicle-sprites.mjs reading the `vehicles` block).
 *
 * Frame model (see the manifest `$comment`):
 *   - Keys are the EXACT base filename (asset root + legacy variant suffix), e.g.
 *     `enemy_sprite_2` = normal cop VARIANT 2.
 *   - `frames[0]` is ALWAYS "" → target file `<key>.png`. That committed
 *     unsuffixed PNG is frame 1 and is the accepted hero; it is regenerated
 *     only when its file is MISSING on disk, or rewritten by the matched-pair
 *     fallback below. FORCE=1 deliberately does NOT touch frame 1 — to reroll
 *     an accepted hero, delete its PNG and re-run.
 *   - `frames[i>0]` is a short pose-delta clause → target file `<key>_f<i+1>.png`
 *     (the `_f` prefix disambiguates the frame index from the legacy `_2`/`_3`
 *     variant suffix, so `enemy_shooting_2_f2.png` = cop variant 2, shooting,
 *     frame 2). Only the pose clause varies between frames; `style` is appended
 *     verbatim to every prompt for family consistency.
 *
 * Frame ≥2 generation is two-tier (logged loudly per file):
 *   1. PRIMARY — `kontext` img2img (the style-lock tool, art bible §3.12): the
 *      committed frame-1 PNG is passed as the `image=` source so the extra frame
 *      is the SAME character in a new pose, not an independent roll. Skipped
 *      when frame 1 was (re)written by THIS run — it isn't committed at the
 *      checked-out SHA yet, so the raw URL would serve stale or missing art.
 *   2. FALLBACK — matched flux pair: if kontext fails (non-200 after retries),
 *      frame 1 AND frame 2 are generated as a consistent pair from the pinned
 *      seed (base prompt vs base prompt + delta clause). Both buffers are
 *      fetched BEFORE either file is written, so a partial failure never
 *      destroys the accepted frame 1 without its matching frame 2. The pair
 *      OVERWRITES the old frame 1 and goes through the human art gate in the PR.
 *
 * Only MISSING files are generated; FORCE=1 additionally regenerates the
 * `_f<N>` frames but never frame 1 (see above). Existing frame-1 PNGs are all
 * committed, so in practice only the `_f2` files get generated. Network image
 * generation (Pollinations/FLUX) is normally blocked in the local sandbox, so a
 * failed fetch is logged per-asset and never crashes the run — real art is
 * produced in CI.
 *
 * Usage (CI): node scripts/gen-enemy-types.mjs && node scripts/cutout-enemies.mjs
 *   The cutout step runs after: the new `_f2` files match its `enemy_*.png` glob
 *   and get keyed; committed pre-keyed frame-1 files stay skipped (ADR 0013).
 *
 * node scripts/gen-enemy-types.mjs --list           # list defined enemy keys (no network)
 * node scripts/gen-enemy-types.mjs --asset <key>    # restrict the run to one enemy key
 *
 * `--plan <id>` (SP2 phase (c), T5) — additive path: instead of levelArt.json's
 * `enemies.types`, iterates `plan.archetypes[]` (`src/game/levels/generated/<id>.ts`,
 * `scripts/lib/loadPlan.mjs`). Each archetype's `spriteBase` is the output key
 * (so its files land at `public/assets/<spriteBase>*.png`, namespaced by
 * construction — a level's archetypes are validated to declare a spriteBase of
 * its own), its prompt is derived from the kind's name segment (after the
 * `<id>:` namespace) plus a standard pose clause for frame 2 (aiming/firing when
 * `shoots`, reaching forward otherwise) — same 2-frame flipbook shape as the
 * hand-authored table. The shared `enemies.style`/`size` from levelArt.json is
 * still reused (house pixel-art look), so a generated cast reads as the SAME
 * family, not a one-off. Seeds are FREE (spec §2.2 — re-run to reroll, unlike
 * the backdrop's pinned seed) and every step past loading (kontext/matched-pair,
 * cutout, fill-holes SOLIDIFY + `--check`) is UNCHANGED — they already match
 * the `enemy_*.png` glob regardless of where the key came from.
 * (check-sprite-integrity.mjs is deliberately NOT in that list: it is un-wired
 * from the enemy pipeline — ADR-0029 — in plan mode exactly as in table mode.)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { sleep, fetchWithRetry, fluxUrl, buildRequestUrl } from "./lib/pollinations.mjs";
import { loadHeroRegistry, heroForSlot, heroRawUrl, resolveRepoSha } from "./lib/heroes.mjs";
import { skip } from "./lib/idempotent.mjs";
import { parseAssetArgs } from "./lib/cli.mjs";
import { loadPlan } from "./lib/loadPlan.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, process.env.OUT_DIR ?? "public/assets");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const FORCE = process.env.FORCE === "1";

// Raw URL of a committed frame-1 PNG — the kontext img2img `image=` source when
// the slot has no promoted hero (ADR-0043). In CI these resolve to the exact
// checked-out commit; locally they fall back to the repo default branch
// (harmless — the local sandbox has no network anyway). Built via the shared
// heroRawUrl (scripts/lib/heroes.mjs), the same builder a promoted hero's URL
// goes through, so the two paths can never diverge on URL shape.
const { repo: REPO, sha: SHA } = resolveRepoSha();
function frame1RawUrl(key, repo = REPO, sha = SHA) {
  return heroRawUrl(`public/assets/${key}.png`, { repo, sha });
}

// ── Load the enemy definitions from levelArt.json (single source) ────────────
function loadEnemies() {
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const block = json.enemies;
  if (!block || !block.types) {
    throw new Error(`No "enemies.types" block in ${path.relative(ROOT, LEVEL_ART)}`);
  }
  const styleSuffix = block.style ?? "";
  const width = block.size?.width ?? 256;
  const height = block.size?.height ?? 256;
  return Object.entries(block.types).map(([key, def]) => {
    // Pinned seed → reproducible rolls, reviewable diffs (no Math.random()).
    // Fail fast rather than serialize `seed=undefined` into the URL.
    if (!Number.isInteger(def?.seed) || def.seed <= 0) {
      throw new Error(`enemies.types.${key}: missing or non-positive integer "seed"`);
    }
    return {
      key,
      seed: def.seed,
      prompt: def.prompt ?? "",
      frames: Array.isArray(def.frames) ? def.frames : [""],
      style: styleSuffix,
      width,
      height,
    };
  });
}

/**
 * loadEnemiesFromPlan(plan, styleAndSize) — plan-mode equivalent of loadEnemies():
 * same output shape ({key, seed, prompt, frames, style, width, height}), one
 * entry per archetype. Pure (no fs/network): a test can assert the mapping
 * without loading a real plan.
 */
export function loadEnemiesFromPlan(plan, { style = "", width = 256, height = 256 } = {}) {
  const ns = `${plan.id}:`;
  return plan.archetypes.map((a) => {
    const descriptor = a.kind.startsWith(ns) ? a.kind.slice(ns.length) : a.kind;
    const clean = descriptor.replace(/[-_]+/g, " ").trim();
    const poseClause = a.shoots ? ", aiming and firing a weapon" : ", reaching forward";
    return {
      key: a.spriteBase,
      // FREE seed (spec §2.2): re-running rerolls, unlike the backdrop's
      // pinned seed — the plan has no per-archetype seed field to pin from.
      seed: Math.floor(Math.random() * 99999) + 1,
      prompt: `a ${clean}, standing guard`,
      frames: ["", poseClause],
      style,
      width,
      height,
    };
  });
}

// The frame ≥2 kontext prompt — shared with planRequests so the guard checks
// the EXACT prompt (and therefore URL) a real run would send.
function extraFrameKontextPrompt(clause, style) {
  return `same character, same pixel art style, same framing and scale, ${clause}${style}`;
}

// The frame ≥2 img2img SOURCE for a slot: the frozen promoted hero when one is
// declared (ADR-0043) — immutable and always already committed, so it carries
// none of frame1RawUrl's staleness risk — else the committed frame-1 PNG
// (today's behaviour, unchanged when no hero exists).
function extraFrameImageSource(e, registry, repo, sha) {
  const hero = heroForSlot(registry, "enemies", e.key);
  return hero ? heroRawUrl(hero.approved, { repo, sha }) : frame1RawUrl(e.key, repo, sha);
}

// One per-frame descriptor builder — `planRequests` below AND
// `generateExtraFrame`'s PRIMARY (kontext) branch both consume this SAME
// function, so scripts/check-hero-wiring.mjs (ADR-0043 Layer B) verifies the
// EXECUTED request a real run sends, not a parallel reconstruction that could
// silently drift from it (MAJEUR-2).
function planFrameRequest(e, i, registry, repo, sha) {
  const imageUrl = extraFrameImageSource(e, registry, repo, sha);
  const url = buildRequestUrl({
    prompt: extraFrameKontextPrompt(e.frames[i], e.style),
    seed: e.seed,
    width: e.width,
    height: e.height,
    imageUrl,
  });
  return { key: e.key, frame: i + 1, imageUrl, url };
}

// Pure, network-free: the exact per-frame KONTEXT request `generateExtraFrame`
// below would send for every enemy key's frame ≥2 (the PRIMARY strategy; the
// matched-flux-pair FALLBACK is a runtime failure path with no fixed URL to
// plan against). Lets scripts/check-hero-wiring.mjs (ADR-0043 Layer B) assert
// a declared hero really reaches `image=` WITHOUT a network call — generation
// and the guard both go through buildRequestUrl, so they cannot diverge.
export function planRequests({ repo, sha, registry } = {}) {
  const resolved = resolveRepoSha({ repo, sha });
  const reg = registry ?? loadHeroRegistry(ROOT);
  const requests = [];
  for (const e of loadEnemies()) {
    for (let i = 1; i < e.frames.length; i++) {
      requests.push(planFrameRequest(e, i, reg, resolved.repo, resolved.sha));
    }
  }
  return requests;
}

// ── Frame ≥2: kontext primary → matched-flux-pair fallback ───────────────────
async function generateExtraFrame(e, i, out, frame1Fresh, registry, repo, sha) {
  const name = `${e.key}_f${i + 1}`;
  const clause = e.frames[i];
  const hero = heroForSlot(registry, "enemies", e.key);

  if (!hero && frame1Fresh) {
    // No promoted hero for this slot, and frame 1 was (re)written by THIS run:
    // the raw.githubusercontent URL still serves the OLD committed art (or
    // 404s for a brand-new enemy), so kontext would lock onto the wrong
    // source. Go straight to the matched pair. A promoted hero's frozen copy
    // is immutable and always already committed (promote-hero.mjs never runs
    // during generation), so this staleness risk does not apply once a slot
    // has a hero (ADR-0043) — hence the `!hero` guard removing the fragility.
    console.log(`  [skip-kontext] ${name} — frame 1 not committed at ${sha}; using matched pair`);
  } else {
    // PRIMARY: kontext img2img — frozen hero when declared, else committed frame 1.
    // Same per-frame descriptor `planRequests()` emits (planFrameRequest) — the
    // guard verifies THIS executed path, not a parallel reconstruction.
    const { url: kUrl } = planFrameRequest(e, i, registry, repo, sha);
    const sourceLabel = hero ? `hero "${hero.slug}"` : `${e.key}.png`;
    console.log(`  [gen]  ${name} — strategy=KONTEXT img2img (source ${sourceLabel})`);
    try {
      const buf = await fetchWithRetry(kUrl);
      fs.writeFileSync(out, buf);
      console.log(`  [ok]   ${name} via KONTEXT img2img (${buf.length} bytes)`);
      return;
    } catch (err) {
      console.log(`  [kontext-fail] ${name} — ${err.message}; FALLING BACK to matched flux pair`);
    }
  }

  // FALLBACK: matched flux pair under the pinned seed. Regenerates frame 1 too so
  // the pose delta is consistent; OVERWRITES the committed frame 1 (goes through
  // the human art gate in the PR). Both buffers are fetched before either write:
  // a partial failure must never destroy frame 1 without its matching frame 2.
  const frame1Out = path.join(OUT_DIR, `${e.key}.png`);
  try {
    console.log(`  [gen]  ${name} — strategy=MATCHED FLUX PAIR (also overwrites ${e.key}.png)`);
    const buf1 = await fetchWithRetry(fluxUrl(`${e.prompt}${e.style}`, e.seed, e.width, e.height));
    const buf2 = await fetchWithRetry(
      fluxUrl(`${e.prompt}, ${clause}${e.style}`, e.seed, e.width, e.height),
    );
    fs.writeFileSync(frame1Out, buf1);
    console.log(
      `  [ok]   ${e.key} — frame 1 of matched pair (${buf1.length} bytes) — OVERWRITES committed art`,
    );
    fs.writeFileSync(out, buf2);
    console.log(`  [ok]   ${name} — frame 2 of matched pair (${buf2.length} bytes)`);
  } catch (err) {
    console.log(`  [fail] ${name} — matched pair failed: ${err.message} (will be generated in CI)`);
  }
}

/** Resolve the enemy list: `--plan <id>` (T5) or the levelArt.json table (default). */
async function resolveEnemies(args) {
  const i = args.indexOf("--plan");
  if (i === -1) return loadEnemies();
  const levelId = args[i + 1];
  if (!levelId || levelId.startsWith("--")) throw new Error("--plan requires a level id");
  const plan = await loadPlan(levelId);
  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const style = json.enemies?.style ?? "";
  const width = json.enemies?.size?.width ?? 256;
  const height = json.enemies?.size?.height ?? 256;
  return loadEnemiesFromPlan(plan, { style, width, height });
}

async function main() {
  const args = process.argv.slice(2);
  const { list, target } = parseAssetArgs(args);
  let enemies = await resolveEnemies(args);

  if (list) {
    // Plan-agnostic header (like gen-nearfg-sprites.mjs's): in --plan mode the
    // keys come from the plan's archetypes[], not levelArt.json.
    console.log("Defined enemy keys:");
    enemies.forEach((e) =>
      console.log(`  ${e.key.padEnd(24)} ${e.frames.length} frame(s) ${e.width}x${e.height}`),
    );
    return;
  }

  if (target) {
    enemies = enemies.filter((e) => e.key === target);
    if (enemies.length === 0) {
      console.error(`Enemy "${target}" not found. Use --list.`);
      process.exit(1);
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const registry = loadHeroRegistry(ROOT);
  console.log(`Enemy-type flipbook sprites → ${OUT_DIR}\n`);

  for (const e of enemies) {
    // Set when this run (re)writes frame 1: extra frames must then skip kontext
    // (its image= source is the committed art, which no longer matches).
    let frame1Fresh = false;
    for (let i = 0; i < e.frames.length; i++) {
      const name = i === 0 ? e.key : `${e.key}_f${i + 1}`;
      const out = path.join(OUT_DIR, `${name}.png`);

      if (i === 0) {
        // Frame 1: only ever generated when MISSING — FORCE=1 does not apply
        // (the accepted hero is protected; delete the PNG to reroll it), hence
        // force is hard-pinned false here regardless of the FORCE env var.
        if (skip(out, { force: false, existsSync: fs.existsSync })) {
          console.log(`  [skip] ${name} (exists)`);
          continue;
        }
        frame1Fresh = true;
        console.log(`  [gen]  ${name} — frame 1 (flux, seed=${e.seed})`);
        try {
          const buf = await fetchWithRetry(
            fluxUrl(`${e.prompt}${e.style}`, e.seed, e.width, e.height),
          );
          fs.writeFileSync(out, buf);
          console.log(`  [ok]   ${name} (${buf.length} bytes)`);
        } catch (err) {
          console.log(`  [fail] ${name} — ${err.message} (will be generated in CI)`);
        }
      } else {
        if (skip(out, { force: FORCE, existsSync: fs.existsSync })) {
          console.log(`  [skip] ${name} (exists)`);
          continue;
        }
        await generateExtraFrame(e, i, out, frame1Fresh, registry, REPO, SHA);
      }
      await sleep(2000);
    }
  }

  console.log("\nDone.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
