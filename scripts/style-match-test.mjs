#!/usr/bin/env node
/**
 * style-match-test.mjs — ONE-POSE, phrasing-only test: does insisting harder on
 * "match the reference comic style" actually pull gptimage-large's boss output
 * closer to the enemies' register?
 *
 * WHY. Bertrand's read on the 9 shipped Commandant planches (run 30199021002):
 * "moins BD" than the enemies — decent ink, but softer/more painterly than
 * enemy_sprite/enemy_riot's flat cel-shaded look. The model and refs are
 * already fixed by the earlier bake-off (gptimage-large, enemy_sprite +
 * enemy_riot as `&image=` references); this test varies ONLY the prompt
 * phrasing around style-matching, on a SINGLE pose (`commander_shielded`),
 * to see whether wording — not model, not refs — closes the remaining gap.
 *
 * V0 is the exact shipped baseline (scripts/gen-boss-sprites.mjs, verbatim
 * COMIC_TAIL) — the control every other variant is judged against.
 * V1-V3 append/reorder an explicit style-lock instruction, informed by the
 * earlier lesson (lead-art's parry_windup ruling): clause ORDER and directness
 * matter to these models, not just content — a buried or softly-worded
 * instruction competes with everything around it and can lose.
 *
 * USAGE (CI only — see style-match-test.yml; the token is a write-only GitHub
 * secret unreadable from a local shell):
 *   node style-match-test.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readToken, genUrl, withRetry, keyAndDown } from "./lib/gptimage.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEVEL_ART = path.resolve(ROOT, "src/game/levels/levelArt.json");
const OUT = path.resolve(ROOT, "style-test-out");
const GEN = 1024;

const COMIC_TAIL =
  ", clean bold comic book ink illustration, three-tone cel shading grey black and white, thick clean black outline, flat evenly filled shapes, full body figure fully visible and centered, floating isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no floor, no cast shadow, no drop shadow, no text, no letters, no logo, no writing, no signature, blank plain clothing with no markings";

const REF_IMAGES = [
  "https://raw.githubusercontent.com/bczy/prohimuf/main/public/assets/enemy_sprite.png",
  "https://raw.githubusercontent.com/bczy/prohimuf/main/public/assets/enemy_riot.png",
];

const POSE = "commander_shielded";

function subjectFor(pose) {
  const art = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const entry = art.boss.types[pose];
  return { subject: entry.prompt, seed: entry.seed };
}

const { subject, seed } = subjectFor(POSE);

// The four variants. Each is {label, prompt} — model, refs and seed stay fixed.
const LOCK_AFTER_TAIL =
  ", match the exact flat cel-shaded comic-book ink style, linework weight and shading technique of the two attached reference character images — same technique, not photorealistic, not painterly, not softly rendered";
const LOCK_BEFORE_TAIL =
  ", drawn in the exact same flat cel-shaded comic-book ink style as the two attached reference character images";
const LOCK_FRONT = "in the exact art style of the two attached reference character images: ";

const VARIANTS = [
  {
    label: "V0-baseline",
    note: "le prompt exact qui a produit les 9 planches shippées — le témoin",
    prompt: `${subject}${COMIC_TAIL}`,
  },
  {
    label: "V1-lock-after-tail",
    note: "instruction de style ajoutée APRÈS la queue existante",
    prompt: `${subject}${COMIC_TAIL}${LOCK_AFTER_TAIL}`,
  },
  {
    label: "V2-lock-before-tail",
    note: "même instruction, mais placée AVANT la queue (au plus près du sujet)",
    prompt: `${subject}${LOCK_BEFORE_TAIL}${COMIC_TAIL}`,
  },
  {
    label: "V3-lock-first",
    note: "l'instruction ouvre le prompt entier, avant même le sujet",
    prompt: `${LOCK_FRONT}${subject}${COMIC_TAIL}`,
  },
];

async function run() {
  const token = readToken();
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];

  for (const v of VARIANTS) {
    console.log(`[gen] ${v.label} (${v.prompt.length} chars)`);
    try {
      const buf = await withRetry(genUrl(v.prompt, seed, { gen: GEN, refs: REF_IMAGES }), token);
      const { s, opaque } = await keyAndDown(buf, { targetW: 256, targetH: 256, tol: 150 });
      const file = `${POSE}__${v.label}.png`;
      fs.writeFileSync(path.join(OUT, file), s);
      manifest.push({ ...v, file, opaquePct: +((opaque * 100) / (256 * 256)).toFixed(1) });
      console.log(`  [ok] ${file} — ${opaque} opaque px`);
    } catch (e) {
      manifest.push({ ...v, error: e.message });
      console.log(`  [ERR] ${v.label} — ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));
  writeHtml(manifest);
}

function dataUri(f) {
  const buf = fs.readFileSync(f);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function writeHtml(manifest) {
  const refs = [
    { label: "enemy_sprite.png", f: path.join(ROOT, "public/assets/enemy_sprite.png") },
    { label: "enemy_riot.png", f: path.join(ROOT, "public/assets/enemy_riot.png") },
    {
      label: "commander_shielded.png (shippé)",
      f: path.join(ROOT, "public/assets/boss/commander_shielded.png"),
    },
  ];
  const card = (label, uri, sub) => `
    <figure class="cell">
      <div class="thumb">${uri ? `<img src="${uri}">` : `<div class="missing">échec</div>`}</div>
      <figcaption><b>${label}</b>${sub ? `<span>${sub}</span>` : ""}</figcaption>
    </figure>`;

  const html = `<!doctype html><meta charset="utf-8">
<title>Test de style — ${POSE}</title>
<style>
 :root{color-scheme:dark}
 body{font:14px/1.6 ui-sans-serif,system-ui,sans-serif;margin:0;padding:36px 32px 64px;background:#0b0b0c;color:#e8e8ea;max-width:1200px}
 h1{font-size:21px;margin:0 0 6px} .meta{opacity:.55;margin-bottom:26px;font-size:13px}
 h2{font-size:12px;letter-spacing:.09em;text-transform:uppercase;opacity:.5;margin:34px 0 14px}
 .brief{background:#131318;border:1px solid #26262c;border-left:3px solid #d4a017;border-radius:10px;padding:16px 20px;margin:0 0 8px;font-size:13.5px}
 .brief code{background:#000;padding:1px 5px;border-radius:4px;font-size:12px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
 .cell{margin:0;background:#16161a;border:1px solid #26262c;border-radius:10px;overflow:hidden}
 .thumb{aspect-ratio:1;display:grid;place-items:center;background:
   conic-gradient(from 45deg,#1c1c22 25%,#141418 0 50%,#1c1c22 0 75%,#141418 0) 0 0/16px 16px}
 .thumb img{max-width:100%;max-height:100%;object-fit:contain;image-rendering:pixelated}
 .missing{opacity:.3;font-size:12px}
 figcaption{padding:10px 12px;font-size:12.5px;display:flex;flex-direction:column;gap:3px}
 figcaption span{opacity:.55;font-size:11px}
</style>
<h1>Test de style — ${POSE}</h1>
<div class="meta">gptimage-large · même seed (${seed}) · mêmes références (enemy_sprite + enemy_riot) · seule la formulation du style change</div>
<div class="brief"><b>Ce qui varie :</b> uniquement la phrase qui insiste sur le style BD, et sa position dans le prompt. Modèle, seed, références visuelles et queue de base identiques dans les 4 cellules.</div>
<h2>Références</h2>
<div class="grid">${refs.map((r) => card(r.label, dataUri(r.f))).join("")}</div>
<h2>Variantes</h2>
<div class="grid">${manifest
    .map((m) =>
      card(
        m.label,
        m.file ? dataUri(path.join(OUT, m.file)) : null,
        m.error ? `échec: ${m.error}` : `${m.note}${m.opaquePct !== undefined ? ` · ${m.opaquePct}% opaque` : ""}`,
      ),
    )
    .join("")}</div>`;

  fs.writeFileSync(path.join(OUT, "style-test.html"), html);
  console.log(`\nPreview: ${path.join(OUT, "style-test.html")}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
