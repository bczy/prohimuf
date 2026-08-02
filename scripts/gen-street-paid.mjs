#!/usr/bin/env node
/**
 * gen-street-paid.mjs — the single-wide PAID backdrop generator (SP2 phase (a),
 * spec-level-harness-sp2 §3/§4.1).
 *
 * Two modes:
 *
 *   `--plan <id>` (SP2, T2) — the level-harness path: loads
 *   `src/game/levels/generated/<id>.ts`'s plan (scripts/lib/loadPlan.mjs), builds
 *   its prompt from `scripts/lib/paidPrompt.mjs` (content derived from the plan +
 *   the shared house STYLE_BLOCK verbatim — never the other way round, so one
 *   level's decor cannot bleed into another's, spec §4.1), and writes the
 *   COMMITTABLE backdrop to `public/assets/levels/<id>/<plan.backdrop.file>.png`.
 *   The seed is PINNED, derived deterministically from the levelId
 *   (`seedFromLevelId`, spec §2.2) — never random, so re-dispatching the same
 *   level's workflow always requests the same image. Idempotent: skipped when
 *   the target file already exists, unless `FORCE=1`. The workflow that drives
 *   this (`gen-plan-backdrop.yml`, T3) enforces the 3-paid-attempt cap; this
 *   script itself has no cap of its own (a local/manual run is one attempt).
 *
 *   No `--plan` (legacy, UNCHANGED) — the original Belliard A/B experiment: one
 *   image per MODEL×SEED, written to street-experiments/ for artifact upload,
 *   never committed. Kept for reference; do not extend it.
 *
 * Self-contained (no @napi-rs/canvas dependency): reads POLLINATIONS_TOKEN and
 * does a Bearer-authenticated fetch against gen.pollinations.ai, which honours
 * width/height EXACTLY (unlike the anonymous flux endpoint's ~0.59 MP cap) —
 * required for a single-wide backdrop's exact aspect.
 *
 *   node scripts/gen-street-paid.mjs --plan fixture       # plan mode (network)
 *   FORCE=1 node scripts/gen-street-paid.mjs --plan fixture
 *
 *   MODELS=seedream-pro,nanobanana-2 W=3072 H=768 SEED=7111 \
 *     node scripts/gen-street-paid.mjs                     # legacy A/B mode
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { loadPlan } from "./lib/loadPlan.mjs";
import { resolveBackdropFile } from "./lib/planPaths.mjs";
import { buildPaidPrompt, seedFromLevelId } from "./lib/paidPrompt.mjs";
import { skip } from "./lib/idempotent.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(process.cwd(), "street-experiments");
const FORCE = process.env.FORCE === "1";

const LEGACY_PROMPT =
  "Bold high-contrast black-and-white hand-inked comic book panel, 1990s French graphic novel Tardi style, " +
  "thick constant-weight black ink outlines and large solid flat black shadow shapes, flat grey fills and " +
  "coarse halftone dots, clearly a hand drawing not a photograph, no photographic texture, no smooth grey " +
  "gradients. A long unbroken row of weathered Paris 18e faubourg apartment buildings of irregular widths and " +
  "heights standing side by side, seen in strict flat frontal elevation perfectly head-on with no perspective " +
  "and no vanishing point, four to five storeys each, louvered shutters, iron balcony rails, grey zinc mansard " +
  "roofs with chimneys, ground-floor rolling metal shutters covered in flat inked graffiti tags, one bare " +
  "windowless gable end wall and one narrow dark passage breaking the row, deep night with dark windows, strict " +
  "three values near-black mid-grey and paper-white, no glow, the row filling the whole width with a small band " +
  "of empty night sky at the far left end and the far right end.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function token() {
  const t = (process.env.POLLINATIONS_TOKEN || "").trim();
  if (!t) throw new Error("POLLINATIONS_TOKEN is not set");
  return t;
}

function genUrl(prompt, model, seed, width, height) {
  return (
    `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
    `?model=${encodeURIComponent(model)}&width=${String(width)}&height=${String(height)}&seed=${String(seed)}&nologo=true&quality=high&private=true`
  );
}

async function fetchImg(u, bearer, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(u, { headers: { Authorization: `Bearer ${bearer}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 2000)
        throw new Error(`too small (${buf.length}B): ${buf.toString().slice(0, 160)}`);
      return buf;
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(3000 * (i + 1));
    }
  }
  // Unreachable: the last attempt either returned the buffer or re-threw.
}

/**
 * Resolve a plan-mode run's target: the OUTPUT path a real generation would
 * write, and the exact request (prompt/model/seed/width/height) it would send —
 * split out so a test can assert the wiring without a network call.
 */
export function planRunTarget(plan, { model = process.env.MODEL ?? "ideogram-v4-quality" } = {}) {
  const width = Number(process.env.W || 5120);
  const height = Number(process.env.H || Math.round(width / plan.backdrop.aspect));
  return {
    // Containment via le resolver PARTAGÉ (une seule copie de la loi, cf. planPaths).
    outFile: resolveBackdropFile(plan),
    prompt: buildPaidPrompt(plan),
    model,
    seed: seedFromLevelId(plan.id),
    width,
    height,
  };
}

async function runPlanMode(levelId) {
  const plan = await loadPlan(levelId);
  const target = planRunTarget(plan);
  if (skip(target.outFile, { force: FORCE, existsSync: fs.existsSync })) {
    console.log(`[skip] ${levelId} — ${path.relative(ROOT, target.outFile)} already exists`);
    return;
  }
  fs.mkdirSync(path.dirname(target.outFile), { recursive: true });
  console.log(
    `[gen]  ${levelId} — ${target.width}x${target.height}, model=${target.model}, seed=${String(target.seed)}`,
  );
  const bearer = token();
  const buf = await fetchImg(
    genUrl(target.prompt, target.model, target.seed, target.width, target.height),
    bearer,
    3,
  );
  fs.writeFileSync(target.outFile, buf);
  console.log(`[ok]   ${levelId} → ${path.relative(ROOT, target.outFile)} (${buf.length} bytes)`);
}

async function runLegacyMode() {
  const models = (process.env.MODELS || "ideogram-v4-quality").split(",");
  const seeds = (process.env.SEEDS || "7111,7112,7113").split(",");
  const w = Number(process.env.W || 5120);
  const h = Number(process.env.H || 1024);
  const bearer = token();
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`Generating street ${w}x${h} → ${OUT}\n`);
  for (const m of models) {
    for (const seed of seeds) {
      try {
        const buf = await fetchImg(genUrl(LEGACY_PROMPT, m, seed, w, h), bearer, 3);
        fs.writeFileSync(path.join(OUT, `street-${m}-${seed}.png`), buf);
        console.log(`  [ok]   ${m} seed ${seed} (${(buf.length / 1024) | 0} KB)`);
      } catch (e) {
        console.log(`  [fail] ${m} seed ${seed} — ${e.message}`);
      }
    }
  }
  console.log("\ndone.");
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf("--plan");
  if (i !== -1) {
    const levelId = args[i + 1];
    if (!levelId || levelId.startsWith("--")) throw new Error("--plan requires a level id");
    await runPlanMode(levelId);
    return;
  }
  await runLegacyMode();
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => {
    console.error("Fatal:", e.message);
    process.exit(1);
  });
}
