#!/usr/bin/env node
/**
 * ART GATE 1 — prompt CONTRACT lint over src/game/levels/levelArt.json.
 *
 * A fast (<1s, no network) static check that the art *prompts* obey the house
 * contract BEFORE any paid FLUX generation runs. It cannot see pixels — that is
 * check-sprite-style.mjs's job — but it catches the class of quality failure
 * that is baked into the *words*: a shared house style that dropped a required
 * concept, a per-vehicle prompt that hardcodes a neon colour (the hue must come
 * from the `neon` field so it stays the single source of truth), a prompt so
 * clotted with negations that FLUX ignores them, or a level foreground prompt
 * that forgot the magenta chroma-key phrase the cutout pipeline keys on.
 *
 * B&W-vehicle contract — ADR 0011 (render-side neon rim). The loi du glow was
 * DECOUPLED from the baked art: FLUX-schnell could not confine the neon token to
 * the rim and flooded the whole body across three batches, so vehicles are now
 * generated as PURE black-and-white xerox and the neon rim is drawn at runtime in
 * `src/render` (hue from the type's `neon` field, which survives as render
 * METADATA only). The consequence for this gate is that the old neon RULE INVERTS
 * for the vehicles set: a neon/glow/acid/hue-name token in the assembled vehicle
 * prompt is no longer required — it is now an ERROR, because that token is exactly
 * what triggers the body flood.
 *
 * Assembled-prompt contract (matches gen-vehicle-sprites.mjs and the art bible
 * docs/art-direction.md §3-4): the generator sends FLUX, per type, the
 * concatenation `vehicles.opening` (medium + view, front-loaded) + the type's
 * `prompt` (subject/silhouette only) + `vehicles.style` (shared medium/texture/
 * black-ground tail). `vehicles.neonPhrase` is RETIRED (ADR 0011) — it must be
 * empty or absent; a non-empty neonPhrase is an error. The lint reconstructs the
 * assembled prompt per type and checks it — the house concepts may live in any
 * slot (side-view in `opening`, chroma-key ground in `style`); the concepts, not their
 * location, are the contract. The vehicle GROUND is a chroma key: it flipped from
 * #000000 to a flat saturated magenta (#FF3CDC) / green (#78FF3C) — B&W-on-black
 * gets flood-eaten, the saturated key does not — so `style` must now name that key
 * ground. That ground phrase is whitelisted (stripped before the hue-name scan),
 * so its key hue is exempt, but a hue name anywhere else still bakes a body and
 * errors.
 *
 * Bible-critical rules enforced (§3): NEVER negate — FLUX reads "not photoreal"
 * as photoreal, so the anti-photoreal requirement is satisfied POSITIVELY by the
 * medium statement (flat 2D sprite / fanzine illustration / ink linework), and a
 * zero-negation prompt is the ideal (clean, no warning). Negation is only an
 * UPPER bound. Prose length is capped: 30-90 assembled words is the target (the
 * assembled prompt is now shorter — the neonPhrase slot is gone).
 *
 * Severity model:
 *   ERROR (exit non-zero, gates CI):
 *     - a required vehicles slot missing/empty (`opening`, `style`),
 *     - a non-empty `neonPhrase` (baked neon is retired — ADR 0011),
 *     - the assembled prompt missing a required house concept token,
 *     - a neon/glow/acid/hue-name token PRESENT in the assembled vehicle prompt
 *       (inverse of the old rule — baked neon floods the body, ADR 0011),
 *     - a per-type prompt that is empty,
 *     - >4 negations in an assembled prompt (§3.1 hard ceiling),
 *     - an assembled prompt over 120 words (§3.3 hard ceiling),
 *     - a level prompt that is empty,
 *     - a level foreground prompt missing the magenta chroma-key phrase.
 *   WARN (advisory, non-gating):
 *     - 3-4 negations (over the ≤2 budget but under the hard ceiling),
 *     - an assembled prompt outside the 30-90 word target band,
 *     - a per-type prompt describing environment/scenery, not the subject.
 *
 * Usage:
 *   node scripts/check-art-prompts.mjs                # lint everything
 *   node scripts/check-art-prompts.mjs --set vehicles # only the vehicles block
 *   node scripts/check-art-prompts.mjs --set enemies   # only the enemies block
 *   node scripts/check-art-prompts.mjs --set levels    # only the levels block
 * Exit: 0 when there are no ERROR-level violations (WARNs allowed); 1 otherwise.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// LEVEL_ART env override mirrors the OUT_DIR/DIST_DIR pattern in sibling scripts
// (gen-vehicle-sprites.mjs, e2e-assets.mjs) — handy for fixtures/tests.
const LEVEL_ART = path.resolve(ROOT, process.env.LEVEL_ART ?? "src/game/levels/levelArt.json");

// ── Negation detector (shared with the budget check) ─────────────────────────
// "not", "not a", "not an", "no " — the forms FLUX tends to ignore. Pattern
// pinned to the contract spec exactly so the budget is measured consistently.
const NEG_RE = /\bnot?( a| an)?\b|\bno \b/gi;

// Neon hues we treat as "colour names". Restricted to the palette the `neon`
// field can take, so incidental words like "white" (in "black and white") are
// NOT misread as a hue.
const NEON_HUES = ["orange", "cyan", "magenta", "green"];

// Forbidden EVERYWHERE in the assembled vehicle prompt (ADR 0011, inverse rule).
// Baked neon floods the FLUX-schnell body; the rim is now render-side, so no
// neon/glow/acid/rim-light may appear ANYWHERE in a vehicle prompt (subject or
// style tail). `rim light` matches an optional hyphen/space; bare "light" (e.g.
// "flat ambient lighting") is intentionally NOT forbidden.
const FORBIDDEN_NEON_ANYWHERE = [
  { name: "neon", re: /\bneon\b/i },
  { name: "acid", re: /\bacid\b/i },
  { name: "glow", re: /\bglow(?:ing)?\b/i },
  { name: "luminous", re: /\bluminous\b/i },
  { name: "luminescent", re: /\bluminescent\b/i },
  { name: "rim light", re: /\brim[- ]?light\b/i },
];

// Hue NAMES would bake a coloured body (the flood that killed three batches), so
// they are forbidden — but scanned AFTER the chroma-key GROUND phrase is stripped
// out (below), so the key hue is exempt while a hue word ANYWHERE else (subject or
// a stray style word) still errors.
const FORBIDDEN_HUE = NEON_HUES.map((h) => ({
  name: `${h} (hue)`,
  re: new RegExp(`\\b${h}\\b`, "i"),
}));

// Chroma-key GROUND phrase(s) — WHITELISTED. Serge's keying switch moved the
// vehicle ground from #000000 to a flat saturated magenta (#FF3CDC) / green
// (#78FF3C) key (B&W-on-black gets flood-eaten [S1]; the saturated key keys
// cleanly, corner-adaptive flood-fill in cutout-enemies.mjs). The hue here NAMES
// the key colour to be removed, not a baked accent — the vehicle analogue of the
// `magenta chroma-key` phrase checkLevels REQUIRES on foreground rails. These
// exact ground phrases are stripped from the prompt BEFORE the hue scan, so the
// key hue is exempt but a hue word elsewhere still errors.
const CHROMA_KEY_GROUND_RE = [
  /\bbright (?:magenta|green) \(#[0-9A-Fa-f]{6}\) chroma-?key background\b/gi,
  /\bfully (?:magenta|green) empty surroundings\b/gi,
];

function stripChromaKeyGround(text) {
  let t = text;
  for (const re of CHROMA_KEY_GROUND_RE) t = t.replace(re, " ");
  return t;
}

// Assembled-prompt word budget (art bible §3.3).
const WORD_TARGET_MIN = 30;
const WORD_TARGET_MAX = 90;
const WORD_HARD_MAX = 120;

// Negation budget (art bible §3.1): ≤2 tolerated, 3-4 warns, >4 is a hard error.
const NEG_WARN_OVER = 2;
const NEG_ERROR_OVER = 4;

// Environment/scenery words that mean a *vehicle* prompt drifted from
// subject-only into describing a scene (the cutout wants an isolated silhouette).
const SCENERY_RE =
  /\b(street|road|sidewalk|pavement|sky|skyline|building|buildings|cityscape|landscape|scenery|crowd|people|pedestrian|traffic)\b/i;

// Required house-style concept tokens, checked against the COMBINED shared style
// text (opening + neonPhrase + style). Each token is satisfied if ANY of its
// alternative patterns matches (and every `also` group has a hit) — so wording
// can vary but the CONCEPT must be present. Missing a concept is an ERROR (the
// whole vehicle set inherits the shared style). The anti-photoreal token accepts
// POSITIVE medium signals (illustration / halftone / ink / linework), not only
// negations, because the house contract now favours positive description.
const STYLE_TOKENS = [
  {
    name: "flat 2D side view/profile",
    any: [/\bside view\b/i, /\bside profile\b/i, /\bprofile view\b/i, /\bside elevation\b/i],
    also: [/\b2d\b/i, /\bflat\b/i, /\btwo-?dimensional\b/i, /\borthographic\b/i],
  },
  {
    name: "fanzine/xerox/photocopy term",
    any: [/\bfanzine\b/i, /\bxerox\b/i, /\bphotocopy\b/i, /\bphotocopied\b/i, /\btoner\b/i],
  },
  // The neon-glow term is DELIBERATELY no longer a required house concept: the
  // rim moved render-side (ADR 0011) and a neon token in a vehicle prompt now
  // FLOODS the body. Its inverse is enforced below via FORBIDDEN_NEON.
  {
    // CHROMA-KEY GROUND (Serge's keying switch). Vehicles used to be generated on
    // #000000 and edge-flood-keyed, but B&W-on-black gets flood-eaten ([S1]); the
    // ground is now a flat SATURATED magenta (#FF3CDC) or green (#78FF3C) chroma
    // key, keyed to transparency (corner-adaptive flood-fill in cutout-enemies.mjs
    // handles any flat ground colour). The prompt must name that key ground.
    name: "chroma-key ground term (magenta/green key)",
    any: [
      /\bchroma-?key\b/i,
      /\bmagenta\b/i,
      /#FF3CDC/i,
      /\bgreen[- ]?screen\b/i,
      /\bgreen\b/i,
      /#78FF3C/i,
    ],
  },
  {
    name: "anti-photoreal (positive medium statement)",
    any: [
      // The art bible (§3.1) FORBIDS negation-reliance; the anti-photoreal
      // requirement is met POSITIVELY by naming a non-photographic medium.
      /\bsprite\b/i,
      /\bpixel art\b/i,
      /\billustration\b/i,
      /\bhalftone\b/i,
      /\blinework\b/i,
      /\bink\b/i,
      /\bwoodcut\b/i,
      /\bscreen-?print\b/i,
      /\brisograph\b/i,
      /\bfanzine\b/i,
      // legacy negative forms still tolerated (not required)
      /\bnot photoreal\b/i,
      /\bnon-?photoreal\b/i,
      /\banti-?photoreal\b/i,
    ],
  },
];

// Enemy flipbook `style` tail concepts (checked on `enemies.style`). Enemies are
// baked-style pixel sprites keyed off a solid BLACK ground — the neon-forbidden
// rule (ADR 0011) is VEHICLE-only and is deliberately NOT applied here (the enemy
// style legitimately names "pale neon tones"). Only two concepts are contract:
// the black chroma ground the cutout keys, and the pixel-art medium.
const ENEMY_STYLE_TOKENS = [
  {
    name: "solid black background (#000000)",
    any: [/#000000/i, /\bblack background\b/i, /\bmatte black\b/i],
  },
  {
    name: "pixel-art medium",
    any: [/\bpixel art\b/i, /\bsprite\b/i],
  },
];

function wordCount(text) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// The distinctive phrase the foreground cutout pipeline keys on.
const MAGENTA_KEY_RE = /magenta chroma-key/i;

function tokenSatisfied(tok, text) {
  const anyOk = tok.any.some((re) => re.test(text));
  if (!anyOk) return false;
  if (tok.also) return tok.also.some((re) => re.test(text));
  return true;
}

function countNegations(text) {
  const m = text.match(NEG_RE);
  return m ? m.length : 0;
}

// Forbidden tokens: neon/glow/acid/rim-light anywhere in the assembled prompt,
// plus hue NAMES scanned over the prompt with the chroma-key GROUND phrase(s)
// stripped out — so the key colour in `style` is exempt but a hue word anywhere
// else (a baked body colour) still errors.
function forbiddenNeonHits(assembled) {
  const deGround = stripChromaKeyGround(assembled);
  return [
    ...FORBIDDEN_NEON_ANYWHERE.filter((tok) => tok.re.test(assembled)),
    ...FORBIDDEN_HUE.filter((tok) => tok.re.test(deGround)),
  ].map((tok) => tok.name);
}

// ── Violation collection ─────────────────────────────────────────────────────
function makeReport() {
  const errors = [];
  const warns = [];
  return {
    errors,
    warns,
    error(pathStr, msg) {
      errors.push({ pathStr, msg });
    },
    warn(pathStr, msg) {
      warns.push({ pathStr, msg });
    },
  };
}

function checkVehicles(vehicles, rep) {
  if (!vehicles) {
    rep.error("vehicles", "missing `vehicles` block");
    return;
  }

  // The generator assembles each prompt from `opening` (medium/view) + the type's
  // subject `prompt` + the shared `style` tail. `opening` and `style` are
  // load-bearing, so their absence is a hard error. `neonPhrase` is RETIRED
  // (ADR 0011) — the neon rim moved render-side; a non-empty neonPhrase is now an
  // error, not a required slot.
  const opening = vehicles.opening ?? "";
  const neonPhrase = vehicles.neonPhrase ?? "";
  const style = vehicles.style ?? "";

  if (!opening.trim()) rep.error("vehicles.opening", "missing/empty — required medium + view slot");
  if (!style.trim()) rep.error("vehicles.style", "missing/empty — required shared style tail");

  // neonPhrase may be empty or absent (no longer required). If it carries ANY
  // content, the baked-neon rim is back — that is the flood trigger ADR 0011
  // removed, so it is a hard error.
  if (neonPhrase.trim()) {
    rep.error(
      "vehicles.neonPhrase",
      "baked neon is retired, see ADR 0011 — the neon rim is now drawn render-side; the vehicle sprite must be pure B&W, so `neonPhrase` must be empty or absent",
    );
  }

  const types = vehicles.types ?? {};
  for (const [type, def] of Object.entries(types)) {
    const p = `vehicles.types.${type}.prompt`;
    const prompt = def.prompt ?? "";

    if (!prompt.trim()) {
      rep.error(p, "empty prompt");
      continue;
    }

    // Reconstruct the ASSEMBLED prompt FLUX receives for this type (ADR 0011):
    // opening + subject + shared style. The retired neonPhrase slot is excluded.
    const assembled = `${opening}${prompt}${style}`;
    const ap = `vehicles.types.${type} (assembled)`;

    // House concepts must appear somewhere in the assembled prompt (side-view in
    // `opening`, black ground in `style`, …). The neon-glow concept is no longer
    // required — see the inverse forbidden-token check below.
    for (const tok of STYLE_TOKENS) {
      if (!tokenSatisfied(tok, assembled)) {
        rep.error(ap, `missing required house concept: ${tok.name}`);
      }
    }

    // INVERSE neon rule (ADR 0011): baked neon floods the FLUX body, so NO
    // neon/glow/acid/hue-name token may appear in the assembled vehicle prompt.
    // Its presence is a hard error. (The type's `neon` field is untouched — it is
    // render metadata and never enters the assembled prompt.)
    const forbidden = forbiddenNeonHits(assembled);
    if (forbidden.length > 0) {
      rep.error(
        ap,
        `contains forbidden neon token(s) "${forbidden.join(", ")}" — baked neon floods the body; ` +
          `vehicles are pure B&W xerox and the rim is drawn render-side (ADR 0011)`,
      );
    }

    // Negation budget over the assembled prompt (art bible §3.1): ≤2 clean,
    // 3-4 warn, >4 hard error. Zero negations is the ideal.
    const negs = countNegations(assembled);
    if (negs > NEG_ERROR_OVER) {
      rep.error(
        ap,
        `${negs} negations — over the hard ceiling of ${NEG_ERROR_OVER}; FLUX reads negation as affirmation, rewrite positively`,
      );
    } else if (negs > NEG_WARN_OVER) {
      rep.warn(
        ap,
        `${negs} negations — over the ≤${NEG_WARN_OVER} budget; prefer positive description`,
      );
    }

    // Assembled word budget (art bible §3.3): 30-90 target, >120 hard ceiling.
    const words = wordCount(assembled);
    if (words > WORD_HARD_MAX) {
      rep.error(ap, `${words} words — over the hard ceiling of ${WORD_HARD_MAX}`);
    } else if (words < WORD_TARGET_MIN || words > WORD_TARGET_MAX) {
      rep.warn(
        ap,
        `${words} words — outside the ${WORD_TARGET_MIN}-${WORD_TARGET_MAX} target band`,
      );
    }

    // Subject/silhouette only (checked on the subject clause, not the shared tail).
    if (SCENERY_RE.test(prompt)) {
      const hit = prompt.match(SCENERY_RE)[0];
      rep.warn(p, `mentions scenery "${hit}" — vehicle prompts should describe the subject only`);
    }
  }
}

// Enemy flipbook contract (story-enemy-sprite-flipbook). The generator
// (gen-enemy-types.mjs) reads the same `enemies` block: per type a pinned
// integer `seed`, a non-empty subject `prompt`, and a `frames` array whose first
// entry is "" (the committed frame-1 PNG, never a delta clause) and whose
// i>0 entries are non-empty pose-delta clauses for the `_f<i+1>.png` frame files
// (1..4 frames). The shared `style` tail must carry the black chroma ground the
// cutout keys and the pixel-art medium. Reuses the negation + word budgets over
// the assembled frame-1 prompt (base + style); the vehicle-only neon-forbidden
// and scenery rules do NOT apply to enemies.
function checkEnemies(enemies, rep) {
  if (!enemies) {
    rep.error("enemies", "missing `enemies` block");
    return;
  }

  const style = enemies.style ?? "";
  if (!style.trim()) {
    rep.error("enemies.style", "missing/empty — required shared style tail");
  } else {
    for (const tok of ENEMY_STYLE_TOKENS) {
      if (!tok.any.some((re) => re.test(style))) {
        rep.error("enemies.style", `missing required token: ${tok.name}`);
      }
    }
  }

  // Negation + word budgets over an assembled prompt (any frame variant).
  function checkBudgets(ap, assembled) {
    const negs = countNegations(assembled);
    if (negs > NEG_ERROR_OVER) {
      rep.error(
        ap,
        `${negs} negations — over the hard ceiling of ${NEG_ERROR_OVER}; FLUX reads negation as affirmation, rewrite positively`,
      );
    } else if (negs > NEG_WARN_OVER) {
      rep.warn(
        ap,
        `${negs} negations — over the ≤${NEG_WARN_OVER} budget; prefer positive description`,
      );
    }

    const words = wordCount(assembled);
    if (words > WORD_HARD_MAX) {
      rep.error(ap, `${words} words — over the hard ceiling of ${WORD_HARD_MAX}`);
    } else if (words < WORD_TARGET_MIN || words > WORD_TARGET_MAX) {
      rep.warn(
        ap,
        `${words} words — outside the ${WORD_TARGET_MIN}-${WORD_TARGET_MAX} target band`,
      );
    }
  }

  const types = enemies.types ?? {};
  if (Object.keys(types).length === 0) {
    rep.error("enemies.types", "missing or empty `types` block");
  }
  for (const [key, def] of Object.entries(types)) {
    const p = `enemies.types.${key}`;
    if (def === null || typeof def !== "object" || Array.isArray(def)) {
      rep.error(p, "entry must be an object");
      continue;
    }
    const prompt = def.prompt ?? "";

    if (!prompt.trim()) rep.error(`${p}.prompt`, "empty prompt");
    if (!Number.isInteger(def.seed) || def.seed <= 0) {
      rep.error(`${p}.seed`, "seed must be a positive integer");
    }

    const frames = def.frames;
    if (!Array.isArray(frames) || frames.length < 1 || frames.length > 4) {
      rep.error(`${p}.frames`, "must be an array of length 1-4");
    } else {
      if (frames[0] !== "") {
        rep.error(
          `${p}.frames[0]`,
          'frame 1 must be an empty string "" (the committed unsuffixed PNG, never a delta clause)',
        );
      }
      for (let i = 1; i < frames.length; i++) {
        if (typeof frames[i] !== "string" || !frames[i].trim()) {
          rep.error(`${p}.frames[${i}]`, "delta clause must be a non-empty string");
        }
      }
    }

    // Budgets over every prompt the generator actually sends: the frame-1
    // assembly, plus BOTH frame>=2 variants (kontext primary and matched-pair
    // fallback — see gen-enemy-types.mjs), which are longer than frame 1's.
    if (prompt.trim()) {
      checkBudgets(`${p} (assembled)`, `${prompt}${style}`);

      if (Array.isArray(frames)) {
        for (let i = 1; i < frames.length; i++) {
          const clause = typeof frames[i] === "string" ? frames[i] : "";
          if (!clause.trim()) continue; // shape error already reported above
          checkBudgets(
            `${p}.frames[${i}] (kontext assembled)`,
            `same character, same pixel art style, same framing and scale, ${clause}${style}`,
          );
          checkBudgets(`${p}.frames[${i}] (pair assembled)`, `${prompt}, ${clause}${style}`);
        }
      }
    }
  }
}

function checkLevels(levels, rep) {
  if (!Array.isArray(levels)) {
    rep.error("levels", "missing or non-array `levels`");
    return;
  }
  levels.forEach((lv, i) => {
    const base = `levels[${i}](${lv.id ?? "?"}).prompts`;
    const prompts = lv.prompts ?? {};
    for (const [layer, value] of Object.entries(prompts)) {
      if (layer.startsWith("$")) continue; // skip $comment keys
      const p = `${base}.${layer}`;
      if (typeof value !== "string" || !value.trim()) {
        rep.error(p, "empty prompt");
        continue;
      }
      if (layer === "foreground" && !MAGENTA_KEY_RE.test(value)) {
        rep.error(
          p,
          "foreground prompt is missing the `magenta chroma-key` phrase the cutout pipeline keys on",
        );
      }
    }
  });
}

function main() {
  const args = process.argv.slice(2);
  const si = args.indexOf("--set");
  const set = si !== -1 ? args[si + 1] : "all";
  if (!["all", "vehicles", "enemies", "levels"].includes(set)) {
    console.error(`Unknown --set "${set}" (expected: vehicles | enemies | levels)`);
    process.exit(2);
  }

  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const rep = makeReport();

  if (set === "all" || set === "vehicles") checkVehicles(json.vehicles, rep);
  if (set === "all" || set === "enemies") checkEnemies(json.enemies, rep);
  if (set === "all" || set === "levels") checkLevels(json.levels, rep);

  const rel = path.relative(ROOT, LEVEL_ART);
  console.log(`[check-art-prompts] linting ${rel} (set: ${set})\n`);

  if (rep.warns.length > 0) {
    console.log(`WARN (${rep.warns.length}):`);
    for (const w of rep.warns) console.log(`  ⚠ ${w.pathStr}\n      ${w.msg}`);
    console.log("");
  }

  if (rep.errors.length > 0) {
    console.error(`ERROR (${rep.errors.length}):`);
    for (const e of rep.errors) console.error(`  ✗ ${e.pathStr}\n      ${e.msg}`);
    console.error(`\n[check-art-prompts] FAILED — ${rep.errors.length} error(s).`);
    process.exit(1);
  }

  console.log(
    `[check-art-prompts] PASSED — no contract errors` +
      (rep.warns.length > 0 ? ` (${rep.warns.length} warning(s))` : ""),
  );
}

main();
