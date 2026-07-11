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
 * B&W-vehicle contract — ADR 0006 (render-side neon rim). The loi du glow was
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
 * black-ground tail). `vehicles.neonPhrase` is RETIRED (ADR 0006) — it must be
 * empty or absent; a non-empty neonPhrase is an error. The lint reconstructs the
 * assembled prompt per type and checks it — the house concepts may live in any
 * slot (side-view in `opening`, black ground in `style`); the concepts, not their
 * location, are the contract.
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
 *     - a non-empty `neonPhrase` (baked neon is retired — ADR 0006),
 *     - the assembled prompt missing a required house concept token,
 *     - a neon/glow/acid/hue-name token PRESENT in the assembled vehicle prompt
 *       (inverse of the old rule — baked neon floods the body, ADR 0006),
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
// NOT misread as a hue. In B&W mode (ADR 0006) ANY of these in the assembled
// vehicle prompt is a flood trigger → error.
const NEON_HUES = ["orange", "cyan", "magenta", "green"];

// Forbidden-token set for the assembled VEHICLE prompt (ADR 0006, inverse rule).
// Baked neon floods the FLUX-schnell body; the rim is now render-side, so no
// neon/glow/acid/hue-name may appear in a vehicle prompt. `rim light` is matched
// with an optional hyphen/space; bare "light" (e.g. "flat ambient lighting") is
// intentionally NOT forbidden.
const FORBIDDEN_NEON = [
  { name: "neon", re: /\bneon\b/i },
  { name: "acid", re: /\bacid\b/i },
  { name: "glow", re: /\bglow(?:ing)?\b/i },
  { name: "luminous", re: /\bluminous\b/i },
  { name: "luminescent", re: /\bluminescent\b/i },
  { name: "rim light", re: /\brim[- ]?light\b/i },
  ...NEON_HUES.map((h) => ({ name: `${h} (hue)`, re: new RegExp(`\\b${h}\\b`, "i") })),
];

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
  // rim moved render-side (ADR 0006) and a neon token in a vehicle prompt now
  // FLOODS the body. Its inverse is enforced below via FORBIDDEN_NEON.
  {
    name: "dark/black background term",
    any: [
      /\bblack background\b/i,
      /\bblack cutout background\b/i,
      /\bmatte black background\b/i,
      /\bdark background\b/i,
      /\bflat black\b/i,
      /\bpure black\b/i,
      /background \(#000000\)/i,
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

// Every forbidden neon/glow/acid/hue token present in the assembled prompt.
function forbiddenNeonHits(text) {
  return FORBIDDEN_NEON.filter((tok) => tok.re.test(text)).map((tok) => tok.name);
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
  // (ADR 0006) — the neon rim moved render-side; a non-empty neonPhrase is now an
  // error, not a required slot.
  const opening = vehicles.opening ?? "";
  const neonPhrase = vehicles.neonPhrase ?? "";
  const style = vehicles.style ?? "";

  if (!opening.trim()) rep.error("vehicles.opening", "missing/empty — required medium + view slot");
  if (!style.trim()) rep.error("vehicles.style", "missing/empty — required shared style tail");

  // neonPhrase may be empty or absent (no longer required). If it carries ANY
  // content, the baked-neon rim is back — that is the flood trigger ADR 0006
  // removed, so it is a hard error.
  if (neonPhrase.trim()) {
    rep.error(
      "vehicles.neonPhrase",
      "baked neon is retired, see ADR 0006 — the neon rim is now drawn render-side; the vehicle sprite must be pure B&W, so `neonPhrase` must be empty or absent",
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

    // Reconstruct the ASSEMBLED prompt FLUX receives for this type (ADR 0006):
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

    // INVERSE neon rule (ADR 0006): baked neon floods the FLUX body, so NO
    // neon/glow/acid/hue-name token may appear in the assembled vehicle prompt.
    // Its presence is a hard error. (The type's `neon` field is untouched — it is
    // render metadata and never enters the assembled prompt.)
    const forbidden = forbiddenNeonHits(assembled);
    if (forbidden.length > 0) {
      rep.error(
        ap,
        `contains forbidden neon token(s) "${forbidden.join(", ")}" — baked neon floods the body; ` +
          `vehicles are pure B&W xerox and the rim is drawn render-side (ADR 0006)`,
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
  if (!["all", "vehicles", "levels"].includes(set)) {
    console.error(`Unknown --set "${set}" (expected: vehicles | levels)`);
    process.exit(2);
  }

  const json = JSON.parse(fs.readFileSync(LEVEL_ART, "utf8"));
  const rep = makeReport();

  if (set === "all" || set === "vehicles") checkVehicles(json.vehicles, rep);
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
