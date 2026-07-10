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
 * Assembled-prompt contract (matches gen-vehicle-sprites.mjs and the art bible
 * docs/art-direction.md §3-4): the generator sends FLUX, per type, the four-slot
 * concatenation `vehicles.opening` (medium + view, front-loaded) + the type's
 * `prompt` (subject/silhouette only) + `vehicles.neonPhrase` ({neon}/{hex}
 * rim-light template, resolved from the type's `neon` field) + `vehicles.style`
 * (shared medium/texture/black-ground tail). The lint reconstructs that assembled
 * prompt per type and checks it — the five house concepts may live in any slot
 * (side-view in `opening`, the neon-glow in `neonPhrase`, black ground in
 * `style`); the concepts, not their location, are the contract.
 *
 * Bible-critical rules enforced (§3): NEVER negate — FLUX reads "not photoreal"
 * as photoreal, so the anti-photoreal requirement is satisfied POSITIVELY by the
 * medium statement (flat 2D sprite / fanzine illustration / ink linework), and a
 * zero-negation prompt is the ideal (clean, no warning). Negation is only an
 * UPPER bound. Prose length is capped: 30-90 assembled words is the target.
 *
 * Severity model:
 *   ERROR (exit non-zero, gates CI):
 *     - a required vehicles slot missing/empty (`opening`, `neonPhrase`, `style`),
 *     - the assembled prompt missing a required house concept token,
 *     - `neonPhrase` hardcoding a hue instead of a {neon}/{hex} slot,
 *     - a per-type prompt that is empty,
 *     - a per-type prompt naming a neon hue that CONTRADICTS its `neon` field,
 *     - >4 negations in an assembled prompt (§3.1 hard ceiling),
 *     - an assembled prompt over 120 words (§3.3 hard ceiling),
 *     - a level prompt that is empty,
 *     - a level foreground prompt missing the magenta chroma-key phrase.
 *   WARN (advisory, non-gating):
 *     - a per-type prompt restating its OWN assigned neon colour (redundant),
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

// Neon hues we treat as "colour names" for the contradiction/redundancy check.
// Restricted to the palette the `neon` field can take, so incidental words like
// "white" (in "black and white") are NOT misread as a hardcoded neon hue.
const NEON_HUES = ["orange", "cyan", "magenta", "green"];

// Hex anchors for the neon hues — mirrors NEON_HEX in gen-vehicle-sprites.mjs so
// the lint resolves {hex} exactly as the generator does when assembling prompts.
const NEON_HEX = {
  orange: "#FF8C14",
  cyan: "#28F0FF",
  magenta: "#FF3CDC",
  green: "#78FF3C",
};

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
  {
    name: "neon-glow term",
    any: [/\bneon\b/i],
    also: [/\bglow\b/i, /\bglowing\b/i, /\bluminous\b/i, /\bluminescent\b/i, /\brim light\b/i],
  },
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

// Resolve a neonPhrase template ({neon}/{hex}) for a given hue, exactly as the
// generator does — so the assembled prompt the lint sees matches what FLUX gets.
function resolveNeonPhrase(neonPhrase, neon) {
  return neonPhrase.replaceAll("{neon}", neon).replaceAll("{hex}", NEON_HEX[neon] ?? "");
}

function wordCount(text) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// The shared neon phrase must bind the hue to the `neon` field via a {neon} or
// {hex} placeholder, never hardcode a colour — that keeps the field the single
// source of truth for every type's rim light.
const NEON_SLOT_RE = /\{neon\}|\{hex\}/i;

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

function hardcodedHues(text) {
  return NEON_HUES.filter((h) => new RegExp(`\\b${h}\\b`, "i").test(text));
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

  // The generator now assembles every prompt from four slots; `opening` and
  // `neonPhrase` are load-bearing (medium/view and the law-of-glow), so their
  // absence is a hard error, not a silent fall-through to the old single-field
  // shape.
  const opening = vehicles.opening ?? "";
  const neonPhrase = vehicles.neonPhrase ?? "";
  const style = vehicles.style ?? "";

  if (!opening.trim()) rep.error("vehicles.opening", "missing/empty — required medium + view slot");
  if (!neonPhrase.trim())
    rep.error("vehicles.neonPhrase", "missing/empty — required law-of-glow rim-light slot");
  if (!style.trim()) rep.error("vehicles.style", "missing/empty — required shared style tail");

  // neonPhrase must reference the neon field via {neon}/{hex}, never a hardcoded
  // hue — that keeps the field the single source of truth for every type.
  if (neonPhrase.trim()) {
    if (!NEON_SLOT_RE.test(neonPhrase)) {
      rep.error(
        "vehicles.neonPhrase",
        "does not reference a {neon}/{hex} placeholder — the rim-light hue must be bound to each type's `neon` field",
      );
    }
    const stray = hardcodedHues(neonPhrase);
    if (stray.length > 0) {
      rep.error(
        "vehicles.neonPhrase",
        `hardcodes neon hue(s) "${stray.join(", ")}" — use the {neon}/{hex} slot so the hue stays per-type`,
      );
    }
  }

  const types = vehicles.types ?? {};
  for (const [type, def] of Object.entries(types)) {
    const p = `vehicles.types.${type}.prompt`;
    const prompt = def.prompt ?? "";
    const neon = def.neon ?? "";

    if (!prompt.trim()) {
      rep.error(p, "empty prompt");
      continue;
    }

    // Reconstruct the ASSEMBLED prompt FLUX receives for this type (art bible §4):
    // opening + subject + resolved neonPhrase + shared style.
    const assembled = `${opening}${prompt}${resolveNeonPhrase(neonPhrase, neon)}${style}`;
    const ap = `vehicles.types.${type} (assembled)`;

    // House concepts must appear somewhere in the assembled prompt (side-view in
    // `opening`, neon-glow in `neonPhrase`, black ground in `style`, …).
    for (const tok of STYLE_TOKENS) {
      if (!tokenSatisfied(tok, assembled)) {
        rep.error(ap, `missing required house concept: ${tok.name}`);
      }
    }

    // Hardcoded neon colour in the SUBJECT clause: contradicting the `neon` field
    // is an ERROR; restating the assigned hue is a WARN (redundant).
    for (const h of hardcodedHues(prompt)) {
      if (h.toLowerCase() === neon.toLowerCase()) {
        rep.warn(
          p,
          `restates its assigned neon colour "${h}" — redundant, the hue comes from the \`neon\` field`,
        );
      } else {
        rep.error(
          p,
          `names neon hue "${h}" but its \`neon\` field is "${neon}" — the prompt contradicts the single source of truth`,
        );
      }
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
