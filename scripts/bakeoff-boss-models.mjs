#!/usr/bin/env node
/**
 * bakeoff.mjs — MULTI-MODEL BANC D'ESSAI for the `boss` sprite family.
 *
 * WHY. Bertrand rejected the shipped Commandant art ("ne colle pas du tout au
 * reste des graphismes") and named the enemies as the target. Investigation:
 * the two families were never made by the same pipeline —
 *   enemies : gptimage-large, "clean bold comic ink" tail, magenta ground
 *   boss    : flux,           "16-bit pixel art"  tail, black   ground
 * This harness picks the winner empirically instead of by argument.
 *
 * PROTOCOL. One axis varies: the MODEL. Subject prompt, seed and style tail are
 * frozen — the tail at the known-good value (COMIC_TAIL, the exact string behind
 * the validated enemies). CONTROL cells re-run one model against the legacy
 * pixel-art tail so the tail's own contribution stays visible.
 *
 * REFERENCE IMAGES. Models advertising `max_reference_images` also get the real
 * enemy sprites passed as visual references (served from the public repo over
 * raw.githubusercontent.com) — the most literal reading of "base-toi sur les
 * ennemis". Ref-capable models therefore run TWO cells (text-only + ref-guided);
 * models without ref support run text-only and are labelled as such, because
 * comparing a ref-conditioned cell to a text-only one is not apples to apples.
 *
 * AUTH — the trap this harness exists to avoid.
 *   image.pollinations.ai SILENTLY IGNORES `model=` when unauthenticated: it
 *   serves `sana` with HTTP 200. Five different models returned ONE identical
 *   MD5 in testing. gen.pollinations.ai/image/ instead answers an honest 401.
 *   So: this harness uses gen.pollinations.ai, AND fingerprints every response
 *   so any byte-collision between two cells is reported as FALLBACK-SUSPECT
 *   rather than presented as a result.
 *
 * USAGE
 *   export POLLINATIONS_TOKEN='...'
 *   node bakeoff.mjs --dry            # plan + cell count, generates nothing
 *   node bakeoff.mjs                  # full matrix
 *   node bakeoff.mjs --models flux,nanobanana-2 --pose commander_exposed
 */
import fs from "fs";
import path from "path";
import https from "https";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const OUT = path.resolve(REPO, "bakeoff-out");
const LEVEL_ART = path.join(REPO, "src/game/levels/levelArt.json");
const RAW = "https://raw.githubusercontent.com/bczy/prohimuf/main/public/assets";

// The known-good tail, VERBATIM from scripts/gen-gptimage-asset.mjs — the exact
// string behind the enemy sprites Bertrand validates. Frozen; do not edit.
const COMIC_TAIL =
  ", clean bold comic book ink illustration, three-tone cel shading grey black and white, thick clean black outline, flat evenly filled shapes, full body figure fully visible and centered, floating isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no floor, no cast shadow, no drop shadow, no text, no letters, no logo, no writing, no signature, blank plain clothing with no markings";

// The tail the boss currently ships with — control cells only, so the reader can
// see how much of the rejected look is the tail rather than the model.
const LEGACY_TAIL = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8")).boss.style;

// The enemy sprites passed as visual references to ref-capable models.
const REF_IMAGES = [`${RAW}/enemy_sprite.png`, `${RAW}/enemy_riot.png`];

// The table from chat. `ref` = max_reference_images advertised by the /models
// endpoint (0 = text-only model).
const MATRIX = [
  { model: "gptimage-large", ref: 16, note: "le modèle des ennemis — la référence à battre", control: true },
  { model: "gpt-image-2", ref: 16, note: "successeur, jamais essayé ici" },
  { model: "gptimage", ref: 16, note: "GPT Image 1 Mini" },
  { model: "nanobanana-2", ref: 14, note: "celui que tu visais" },
  { model: "nanobanana-pro", ref: 14, note: "" },
  { model: "nanobanana-2-lite", ref: 14, note: "" },
  { model: "seedream5-pro", ref: 10, note: "fort en aplats nets" },
  { model: "seedream-pro", ref: 14, note: "" },
  { model: "ideogram-v4-quality", ref: 0, note: "fort en trait franc" },
  { model: "flux", ref: 0, note: "le pipeline boss actuel — le rejeté", control: true },
  { model: "klein", ref: 10, note: "FLUX.2 Klein 4B" },
  { model: "zimage", ref: 0, note: "outsider" },
  { model: "qwen-image", ref: 3, note: "outsider" },
  { model: "wan-image-pro", ref: 9, note: "outsider" },
];

function poseData(poseKey) {
  const art = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const entry = art.boss.types[poseKey];
  if (!entry?.prompt) throw new Error(`boss.types.${poseKey}: no prompt`);
  return { subject: entry.prompt, seed: entry.seed };
}

function urlFor({ prompt, seed, model, size, refs }) {
  let u =
    `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
    `?model=${encodeURIComponent(model)}&width=${size}&height=${size}` +
    `&nologo=true&quality=high&seed=${seed}`;
  if (refs?.length) u += `&image=${encodeURIComponent(refs.join(","))}`;
  return u;
}

function fetchBuf(url, token, redir = 0, originHost = null) {
  return new Promise((resolve, reject) => {
    const host = new URL(url).host;
    const origin = originHost ?? host;
    // A cross-host redirect must never carry the bearer token.
    const headers = token && host === origin ? { Authorization: `Bearer ${token}` } : {};
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redir >= 5) return reject(new Error("too many redirects"));
          res.resume();
          return resolve(fetchBuf(new URL(res.headers.location, url).toString(), token, redir + 1, origin));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            let msg = `HTTP ${res.statusCode}`;
            try {
              msg += ` — ${JSON.parse(buf.toString()).error?.message ?? ""}`;
            } catch {
              /* body is not JSON — the status code alone is the message */
            }
            return reject(new Error(msg.trim()));
          }
          resolve(buf);
        });
      })
      .on("error", reject);
  });
}

async function run() {
  const argv = process.argv.slice(2);
  const arg = (n) => {
    const i = argv.indexOf(n);
    return i >= 0 ? argv[i + 1] : null;
  };
  const pose = arg("--pose") ?? "commander_shielded";
  const size = Number(arg("--size") ?? 1024);
  const only = arg("--models");
  const dry = argv.includes("--dry");

  const matrix = only
    ? only.split(",").map((m) => MATRIX.find((x) => x.model === m.trim()) ?? { model: m.trim(), ref: 0 })
    : MATRIX;

  const { subject, seed } = poseData(pose);
  const cells = [];
  for (const m of matrix) {
    cells.push({ ...m, tail: "comic", mode: "texte seul", prompt: subject + COMIC_TAIL, refs: null });
    if (m.ref > 0)
      cells.push({
        ...m,
        tail: "comic",
        mode: "guidé par les ennemis",
        prompt: subject + COMIC_TAIL,
        refs: REF_IMAGES.slice(0, Math.min(m.ref, REF_IMAGES.length)),
      });
    if (m.control)
      cells.push({ ...m, tail: "legacy", mode: "témoin (ancienne queue)", prompt: subject + LEGACY_TAIL, refs: null });
  }

  console.log(`pose=${pose} seed=${seed} size=${size} modèles=${matrix.length} cellules=${cells.length}`);
  if (dry) {
    cells.forEach((c) => console.log(`  ${c.model.padEnd(22)} ${c.tail.padEnd(7)} ${c.mode}`));
    return;
  }

  const token = process.env.POLLINATIONS_TOKEN?.trim();
  if (!token) {
    console.error(
      "\nPOLLINATIONS_TOKEN absent.\n" +
        "gen.pollinations.ai répond 401 sans token, et image.pollinations.ai sert\n" +
        "silencieusement `sana` pour TOUTE valeur de model= (HTTP 200, octets\n" +
        "identiques) — le banc serait un mensonge. Rien n'a été généré.\n" +
        "  export POLLINATIONS_TOKEN='...'   puis relancer.\n",
    );
    process.exit(3);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const seen = new Map();
  let ok = 0;
  for (const c of cells) {
    const slug = `${c.model.replace(/[^\w.-]/g, "_")}__${c.tail}__${c.refs ? "ref" : "txt"}`;
    const file = path.join(OUT, `${pose}__${slug}.png`);
    try {
      const buf = await fetchBuf(urlFor({ prompt: c.prompt, seed, model: c.model, size, refs: c.refs }), token);
      fs.writeFileSync(file, buf);
      const md5 = crypto.createHash("md5").update(buf).digest("hex");
      // Byte-identical output from two different models means the model param
      // was ignored — a silent fallback, not an agreement between models.
      c.fallbackSuspect = seen.get(md5) ?? null;
      seen.set(md5, `${c.model}/${c.mode}`);
      Object.assign(c, { file, md5, bytes: buf.length });
      ok++;
      console.log(
        `  [ok ] ${c.model.padEnd(22)} ${c.mode.padEnd(24)} ${buf.length}B` +
          (c.fallbackSuspect ? `  !! FALLBACK-SUSPECT (mêmes octets que ${c.fallbackSuspect})` : ""),
      );
    } catch (e) {
      c.error = e.message;
      console.log(`  [ERR] ${c.model.padEnd(22)} ${c.mode.padEnd(24)} ${e.message}`);
    }
  }

  writeHtml(cells, { pose, seed, size, ok, total: cells.length });
}

// Pollinations serves JPEG bytes even from a .png request path (verified: `file`
// reports "JPEG image data" on a .png URL), so the mime is sniffed from the magic
// bytes rather than assumed — a data: URI with the wrong mime is a coin flip.
function dataUri(f) {
  if (!f || !fs.existsSync(f)) return null;
  const buf = fs.readFileSync(f);
  const mime =
    buf[0] === 0x89 && buf[1] === 0x50
      ? "image/png"
      : buf[0] === 0xff && buf[1] === 0xd8
        ? "image/jpeg"
        : buf.slice(0, 4).toString() === "RIFF"
          ? "image/webp"
          : "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function writeHtml(cells, meta) {
  const refs = [
    { label: "enemy_sprite.png", sub: "CIBLE — le registre à atteindre", f: `${REPO}/public/assets/enemy_sprite.png` },
    { label: "enemy_riot.png", sub: "CIBLE — identité composée (24 mots)", f: `${REPO}/public/assets/enemy_riot.png` },
    { label: "enemy_shooting.png", sub: "CIBLE — pose de tir", f: `${REPO}/public/assets/enemy_shooting.png` },
    { label: `${meta.pose}.png`, sub: "REJETÉ — ce que Bertrand a renvoyé", f: `${REPO}/public/assets/boss/${meta.pose}.png`, bad: true },
  ];

  const card = (label, uri, sub, warn, bad) => `
    <figure class="cell${warn ? " warn" : ""}${bad ? " bad" : ""}">
      <div class="thumb">${uri ? `<img src="${uri}" alt="${label}">` : `<div class="missing">non généré</div>`}</div>
      <figcaption><b>${label}</b>${sub ? `<span>${sub}</span>` : ""}${warn ? `<em>${warn}</em>` : ""}</figcaption>
    </figure>`;

  const html = `<!doctype html><meta charset="utf-8">
<title>Banc d'essai multi-modèles — boss ${meta.pose}</title>
<style>
 :root{color-scheme:dark}
 body{font:14px/1.6 ui-sans-serif,system-ui,sans-serif;margin:0;padding:36px 32px 64px;background:#0b0b0c;color:#e8e8ea;max-width:1400px}
 h1{font-size:21px;margin:0 0 6px;letter-spacing:-.01em}
 .meta{opacity:.55;margin-bottom:26px;font-size:13px}
 h2{font-size:12px;letter-spacing:.09em;text-transform:uppercase;opacity:.5;margin:38px 0 14px;font-weight:600}
 .brief{background:#131318;border:1px solid #26262c;border-radius:10px;padding:18px 20px;margin:0 0 8px;font-size:13.5px}
 .brief h3{margin:0 0 8px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;opacity:.75}
 .brief p{margin:0 0 10px} .brief p:last-child{margin:0}
 .brief b{color:#fff} .brief code{background:#000;padding:1px 5px;border-radius:4px;font-size:12px}
 .brief.warn{border-left:3px solid #d4a017} .brief.stop{border-left:3px solid #c0392b}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px}
 .cell{margin:0;background:#16161a;border:1px solid #26262c;border-radius:10px;overflow:hidden}
 .cell.warn{border-color:#a33} .cell.bad{border-color:#7a3030}
 .thumb{aspect-ratio:1;display:grid;place-items:center;background:
   conic-gradient(from 45deg,#1c1c22 25%,#141418 0 50%,#1c1c22 0 75%,#141418 0) 0 0/16px 16px}
 .thumb img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}
 .missing{opacity:.3;font-size:12px}
 figcaption{padding:10px 12px;font-size:12.5px;display:flex;flex-direction:column;gap:3px}
 figcaption span{opacity:.5;font-size:11px;line-height:1.4}
 figcaption em{color:#ff8a8a;font-style:normal;font-size:11px}
</style>

<h1>Banc d'essai multi-modèles — boss <code>${meta.pose}</code></h1>
<div class="meta">seed ${meta.seed} · ${meta.size}px · ${meta.ok}/${meta.total} cellules générées</div>

<div class="brief">
 <h3>Ce qu'on cherche</h3>
 <p>Le Commandant shippé ne colle pas au reste du jeu. L'enquête a montré que <b>les deux familles n'ont jamais eu la même cible</b> : les ennemis validés ont été produits par <code>gptimage-large</code> avec une queue de style « encre comic » sur fond magenta ; le boss tourne sur <code>flux</code> avec une queue « 16-bit pixel art » sur fond noir. Ce ne sont pas deux réglages du même pipeline, ce sont deux pipelines.</p>
 <p>Le but de cette page est donc de trancher <b>par les pixels et pas par l'argument</b> : quel modèle rend le mieux le registre d'encre du roster ?</p>
</div>

<div class="brief warn">
 <h3>Protocole — un seul axe varie</h3>
 <p>Le <b>sujet</b> et le <b>seed</b> sont identiques dans toutes les cellules. La <b>queue de style</b> est gelée sur la valeur connue-bonne (celle des ennemis). Seul le <b>modèle</b> change. Les cellules « témoin » rejouent un modèle avec l'ancienne queue pixel-art, pour rendre visible la part du problème qui vient de la queue et non du modèle.</p>
 <p>Les modèles qui acceptent des images de référence tournent <b>deux fois</b> : une fois en texte seul, une fois avec <code>enemy_sprite.png</code> et <code>enemy_riot.png</code> passés en référence visuelle. Une cellule « guidé » et une cellule « texte seul » ne se comparent donc pas directement — c'est indiqué sur chaque vignette.</p>
</div>

<div class="brief stop">
 <h3>Piège d'authentification — pourquoi les cellules sont empreintées</h3>
 <p>Sans token, <code>image.pollinations.ai</code> <b>ignore silencieusement</b> le paramètre <code>model=</code> et sert <code>sana</code> avec un HTTP 200 : cinq modèles différents ont renvoyé un MD5 identique au test. Ce banc utilise donc <code>gen.pollinations.ai</code>, qui répond un 401 honnête, et empreinte chaque réponse. <b>Toute cellule bordée de rouge porte des octets identiques à une autre cellule</b> — c'est une signature de repli, pas un résultat.</p>
</div>

<div class="brief">
 <h3>Quoi regarder</h3>
 <p><b>1. Le registre.</b> De l'encre ou du rendu ? On veut des masses noires pleines, des arêtes dures, un liséré blanc, zéro rampe de lumière. Une affiche, pas une photo.<br>
 <b>2. La neutralité.</b> Aucun ton chair, aucune dorure. Les 21 sprites d'ennemis mesurent exactement 0,00 % de pixels non-neutres ; le boss shippé montait à 52 %.<br>
 <b>3. La silhouette.</b> Le Commandant doit lire « chef » en moins de 0,3 s <i>sans couleur</i> : manteau au genou (unique dans un roster de blousons), tête nue (le seul crâne découvert), stature.<br>
 <b>4. Le fond.</b> Un magenta franc et uniforme, sans ombre portée — c'est ce que le chroma-key attend.</p>
</div>

<h2>Références</h2>
<div class="grid">${refs.map((r) => card(r.label, dataUri(r.f), r.sub, null, r.bad)).join("")}</div>

<h2>Candidats</h2>
<div class="grid">${cells
    .map((c) =>
      card(
        c.model,
        dataUri(c.file),
        `${c.mode}${c.note ? ` · ${c.note}` : ""}`,
        c.error ? `échec : ${c.error}` : c.fallbackSuspect ? `octets identiques à ${c.fallbackSuspect}` : null,
      ),
    )
    .join("")}</div>`;

  const out = path.join(OUT, `bakeoff-${meta.pose}.html`);
  fs.writeFileSync(out, html);
  console.log(`\nPreview: ${out}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
