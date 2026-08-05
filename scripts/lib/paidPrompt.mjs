/**
 * paidPrompt.mjs — the house STYLE block (verbatim, shared) separated from the
 * per-plan CONTENT block (SP2 §4.1, T2). Extracted from gen-street-paid.mjs's
 * former hardcoded Belliard prompt: the risk named in the spec ("le prompt
 * Belliard déteint sur tout" — every generated level's decor drifting toward
 * Belliard's own district/fiction) is closed by never concatenating a level's
 * content INTO the style block — `buildPaidPrompt` always assembles content
 * THEN style, and the style half never varies per plan.
 *
 * `STYLE_BLOCK` is compared VERBATIM by paidPrompt.test.mjs (byte-for-byte —
 * the Tardi ink/three-values house law any generated backdrop must carry),
 * so edit it deliberately, never as a side effect of a plan's content clause.
 */

/** The Tardi ink, three-values house style — shared by EVERY generated backdrop. */
export const STYLE_BLOCK =
  "Bold high-contrast black-and-white hand-inked comic book panel, 1990s French graphic novel Tardi style, " +
  "thick constant-weight black ink outlines and large solid flat black shadow shapes, flat grey fills and " +
  "coarse halftone dots, clearly a hand drawing not a photograph, no photographic texture, no smooth grey " +
  "gradients, deep night with dark windows, strict three values near-black mid-grey and paper-white, no glow.";

/**
 * The calibration-imposed elements (spec §4.1): when a plan declares
 * `calibration`, the phase (b) detection loop needs a bare windowless gable end
 * wall AND a narrow dark passage breaking the row somewhere in the facade — the
 * same two features belliard's proven prompt always requested. Absent
 * `calibration`, nothing is imposed (the plan hasn't opted into automated
 * window detection yet).
 */
function calibrationClause(plan) {
  if (!plan.calibration) return "";
  return (
    " One bare windowless gable end wall and one narrow dark passage breaking the row, " +
    `so the row exposes exactly the vertical band and column structure the automated ` +
    `window-detection harness expects.`
  );
}

/**
 * buildPaidPrompt(plan) -> string
 * Content (district/register/calibration elements, derived from the plan) THEN
 * style (STYLE_BLOCK, verbatim, shared) — never the other way round, so a
 * thin/absent content clause cannot let the style block's own Belliard-era
 * phrasing read as this level's fiction.
 */
export function buildPaidPrompt(plan) {
  const content =
    `A long unbroken row of weathered ${plan.fiction.district} apartment buildings of irregular widths ` +
    "and heights standing side by side, seen in strict flat frontal elevation perfectly head-on with no " +
    "perspective and no vanishing point, four to five storeys each, louvered shutters, iron balcony rails, " +
    "grey zinc mansard roofs with chimneys, ground-floor rolling metal shutters covered in flat inked " +
    "graffiti tags, the row filling the whole width with a small band of empty night sky at the far left " +
    `end and the far right end, set in ${plan.fiction.year}.` +
    calibrationClause(plan);
  return `${content} ${STYLE_BLOCK}`;
}

/**
 * seedFromLevelId(levelId) -> positive integer seed, deterministic per id (spec
 * §2.2 decision: the backdrop's seed is PINNED, derived from the levelId, never
 * random — so re-dispatching the same level's backdrop workflow always requests
 * the same image). A small FNV-1a hash: pure, no dependency, stable across Node
 * versions/platforms (unlike relying on a locale-sensitive string method).
 */
export function seedFromLevelId(levelId) {
  let h = 0x811c9dc5;
  for (let i = 0; i < levelId.length; i++) {
    h ^= levelId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Unsigned, and kept well under the pollinations seed range's practical
  // ceiling (>>> 0 gives a uint32; % 1_000_000 keeps the URL short and the
  // number free of a `-` sign some endpoints choke on).
  return (h >>> 0) % 1_000_000;
}
