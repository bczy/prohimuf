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

const MODELS = (
  process.env.MODELS || "seedream-pro,nanobanana-2,gptimage-large,ideogram-v4-quality"
).split(",");
const W = Number(process.env.W || 3072);
const H = Number(process.env.H || 768);
const SEED = Number(process.env.SEED || 7111);

const url = (model) =>
  `https://gen.pollinations.ai/image/${encodeURIComponent(PROMPT)}` +
  `?model=${encodeURIComponent(model)}&width=${W}&height=${H}&seed=${SEED}&nologo=true&quality=high&private=true`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function token() {
  const t = (process.env.POLLINATIONS_TOKEN || "").trim();
  if (!t) throw new Error("POLLINATIONS_TOKEN is not set");
  return t;
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
}

async function main() {
  const bearer = token();
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`Generating street ${W}x${H} seed ${SEED} → ${OUT}\n`);
  for (const m of MODELS) {
    try {
      const buf = await fetchImg(url(m), bearer, 3);
      fs.writeFileSync(path.join(OUT, `street-${m}.png`), buf);
      console.log(`  [ok]   ${m} (${(buf.length / 1024) | 0} KB)`);
    } catch (e) {
      console.log(`  [fail] ${m} — ${e.message}`);
    }
  }
  console.log("\ndone.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
