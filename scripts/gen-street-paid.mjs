#!/usr/bin/env node
/**
 * EXPERIMENT — generate the wide drawn Belliard street with PAID Pollinations
 * models (non-flux), at EXACT large dimensions (gen.pollinations.ai honours
 * width/height exactly, unlike the anonymous flux endpoint which caps ~0.59 MP).
 *
 * Self-contained (no @napi-rs/canvas dependency): reads POLLINATIONS_TOKEN and
 * does a Bearer-authenticated fetch. Outputs to street-experiments/ for artifact
 * upload — NOT committed. One image per model for A/B comparison.
 *
 *   MODELS=seedream-pro,nanobanana-2 W=3072 H=768 SEED=7111 \
 *     node scripts/gen-street-paid.mjs
 */
import fs from "fs";
import path from "path";
import { genPaidUrl, fetchImage } from "./lib/pollinations.mjs";

const OUT = path.resolve(process.cwd(), "street-experiments");
const PROMPT =
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

const MODELS = (process.env.MODELS || "ideogram-v4-quality").split(",");
const SEEDS = (process.env.SEEDS || "7111,7112,7113").split(",");
const W = Number(process.env.W || 5120); // 5:1 wide street
const H = Number(process.env.H || 1024);

const url = (model, seed) => genPaidUrl({ prompt: PROMPT, seed, width: W, height: H, model });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function checkToken() {
  if (!(process.env.POLLINATIONS_TOKEN || "").trim()) {
    throw new Error("POLLINATIONS_TOKEN is not set");
  }
}

// Bearer auth is attached automatically by lib/pollinations.mjs's authHeaders() for any
// *.pollinations.ai host — no local header-building here anymore.
async function fetchImg(u, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const buf = await fetchImage(u);
      if (buf.length < 2000)
        throw new Error(`too small (${buf.length}B): ${buf.toString().slice(0, 160)}`);
      return buf;
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(3000 * (i + 1));
    }
  }
}

async function main() {
  checkToken();
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`Generating street ${W}x${H} → ${OUT}\n`);
  for (const m of MODELS) {
    for (const seed of SEEDS) {
      try {
        const buf = await fetchImg(url(m, seed), 3);
        fs.writeFileSync(path.join(OUT, `street-${m}-${seed}.png`), buf);
        console.log(`  [ok]   ${m} seed ${seed} (${(buf.length / 1024) | 0} KB)`);
      } catch (e) {
        console.log(`  [fail] ${m} seed ${seed} — ${e.message}`);
      }
    }
  }
  console.log("\ndone.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
