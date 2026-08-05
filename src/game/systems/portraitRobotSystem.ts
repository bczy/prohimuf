import type {
  FaceCatalogue,
  PortraitBandId,
  PortraitIntent,
  PortraitOutcome,
  PortraitPalier,
  PortraitPuzzle,
  PortraitResult,
  PortraitScene,
  PortraitSelection,
  VariantDistance,
} from "@game/types/portraitRobot";
import type { LevelModifier } from "@game/types/levelModifier";

/**
 * Portrait-robot — every rule of the photofit scene, pure (ADR-0079, ADR-0080, ADR-0082).
 *
 * This module is the ONLY place the gate §3 tuning table is written down
 * (`docs/game-design/design-gate-portrait-robot.md` §3, which primes over every lane
 * spec). No React, no Three, no DOM, **no `Date.now`, no `Math.random`**: the chrono is
 * a `dt` accumulator and the draw is a hash of a seed supplied by the shell.
 *
 * The frame fold `stepPortraitScene` is the hook-facing entry point and the reason the
 * "4/4 pile au buzzer ⇒ IDENTIFIED" property is a property of the reducer instead of a
 * race between `pointerup` and rAF (ADR-0079 D8.3). `applyPortraitIntent` and
 * `tickPortraitScene` stay exported for tests only — a call to either from `src/hooks`
 * is a blocking finding at the review panel (hand-off §3.4), pinned by
 * `portraitRobotSystem.contract.test.ts`.
 */

// ---------------------------------------------------------------------------
// Gate §3 — canonical tuning. Nothing below is re-declared anywhere else.
// ---------------------------------------------------------------------------

/**
 * The four bands, in draw order (gate §3 `stripCount` = 4, figé).
 *
 * Declared as a `const` TUPLE, not as `readonly PortraitBandId[]`: the render
 * lane's gesture hook resolves a `data-band` attribute against it and the system
 * reads `[0]` as the initial cursor, and both were paying a `!`/`as` assertion
 * for a length the literal already proves. It is also the single declaration of
 * that order — no lane re-types the four ids (panel run-1, `BAND_IDS`).
 */
export const PORTRAIT_BAND_ORDER = [
  "hair",
  "eyes",
  "nose",
  "mouth",
] as const satisfies readonly PortraitBandId[];

/** Hard ceiling, gate A5. Six variants per band, one gabarit, 24 assets. */
export const VARIANTS_PER_BAND = 6;

/** Chrono per `Prefs.difficulty` (gate §3 `timerSeconds`). */
export const PORTRAIT_TIMER_SECONDS: Readonly<Record<"easy" | "normal" | "hard", number>> = {
  easy: 56,
  normal: 35,
  hard: 30,
};

/** Absolute tension thresholds, identical in all three difficulties (gate A13). */
export const PALIER_URGENCE_SECONDS = 10.0;
export const PALIER_DERNIER_SECONDS = 5.0;

/**
 * The floor A18 makes opposable: a mid-parcours cue must sit at least this far from the
 * urgence cue, or the two fuse into a ramp on `hard`. It is the object, not the literal
 * `17,0` it produces there.
 */
export const PALIER_MID_MIN_GAP_SECONDS = 7.0;

/** Reveal hold per issue, asymmetric on purpose (gate A15). */
export const REVEAL_SECONDS_IDENTIFIED = 1.4;
export const REVEAL_SECONDS_UNRESOLVED = 2.6;

/** Score barème (gate §3). */
export const PORTRAIT_SCORE: Readonly<Record<PortraitOutcome, number>> = {
  IDENTIFIED: 1500,
  PARTIAL: 400,
  FAILED: 0,
};

/** Energy applied to the NEXT level's initial capital — malus only, `FAILED` only (A1/A1c). */
export const PORTRAIT_ENERGY_DELTA: Readonly<Record<PortraitOutcome, number>> = {
  IDENTIFIED: 0,
  PARTIAL: 0,
  FAILED: -20,
};

/** The payoff, mechanical and mandatory (gate A10): seconds the next level holds wave 1. */
export const PORTRAIT_WAVE_HOLD_SECONDS: Readonly<Record<PortraitOutcome, number>> = {
  IDENTIFIED: 20,
  PARTIAL: 10,
  FAILED: 0,
};

// ---------------------------------------------------------------------------
// The paliers (ADR-0079 D9)
// ---------------------------------------------------------------------------

/**
 * Seconds-remaining at which the mid-parcours palier fires, gate §3 amended by A18:
 * `max(timerSeconds / 2 ; PALIER_URGENCE + 7,0)` ⇒ 28,0 (`easy`) / 17,5 (`normal`) /
 * 17,0 (`hard`).
 *
 * **Closed edge:** when the computed value is `>= timerSeconds` the palier is not played
 * at all (no cue at t=0) — `midPalierThreshold` still returns the number, and
 * `palierFor` is the single place that edge is honoured, so no consumer re-derives it.
 */
export function midPalierThreshold(timerSeconds: number): number {
  return Math.max(timerSeconds / 2, PALIER_URGENCE_SECONDS + PALIER_MID_MIN_GAP_SECONDS);
}

/**
 * The tension threshold reached at `remainingSeconds`. Descending by construction
 * because `remainingSeconds` only ever decreases (`tickPortraitScene` ignores a negative
 * or non-finite `dt`), so no consumer needs to remember a previous value — and no
 * consumer may compare `remainingSeconds` to 10 or 5 on its own (ADR-0079 D9).
 */
export function palierFor(remainingSeconds: number, timerSeconds: number): PortraitPalier {
  if (remainingSeconds <= PALIER_DERNIER_SECONDS) return "LAST";
  if (remainingSeconds <= PALIER_URGENCE_SECONDS) return "URGENT";
  const mid = midPalierThreshold(timerSeconds);
  if (mid < timerSeconds && remainingSeconds <= mid) return "MID";
  return "NONE";
}

// ---------------------------------------------------------------------------
// The draw (ADR-0080 D4) — pure, hashed, total
// ---------------------------------------------------------------------------

function mix(h: number, v: number): number {
  let x = (h ^ v) >>> 0;
  x = Math.imul(x, 2654435761) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  return x >>> 0;
}

/**
 * Small integer hash of `(seed, bandIndex, salt)` → uint32. No library, no float used as
 * entropy, total on any input (a non-finite seed folds to 0 rather than poisoning the
 * draw with `NaN`). Changing it re-rolls every puzzle — that is exactly what the
 * `seed-sweep` invariant is there to catch (ADR-0080 D3).
 */
export function portraitHash(seed: number, bandIndex: number, salt: number): number {
  const s = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  const magnitude = Math.abs(s);
  let h = 2166136261 >>> 0;
  h = mix(h, (magnitude % 4294967296) >>> 0);
  h = mix(h, Math.floor(magnitude / 4294967296) >>> 0);
  h = mix(h, s < 0 ? 1 : 0);
  h = mix(h, bandIndex >>> 0);
  h = mix(h, salt >>> 0);
  return h >>> 0;
}

function xorshift32(state: number): number {
  let x = state >>> 0 || 0x9e3779b9;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

/** Seeded Fisher–Yates over `[0, n)`. Replayable, and never the identity by accident. */
function seededShuffle(n: number, seed: number): number[] {
  const out = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0;
  for (let i = n - 1; i > 0; i -= 1) {
    s = xorshift32(s);
    const j = s % (i + 1);
    // `i` and `j` are both in `[0, n)` by the loop bound and the modulo, so the
    // fallbacks are for the index signature, never for a case: `out` is dense.
    const tmp = out[i] ?? i;
    out[i] = out[j] ?? j;
    out[j] = tmp;
  }
  return out;
}

/**
 * The truth slot of a band that has no variant to be right about (panel B4b). Out of the
 * slot space by construction, so `correctCount` can never credit it — the degradation of
 * an invalid catalogue is UNFAVOURABLE, which is the only safe direction.
 */
export const NO_TRUTH_SLOT = -1;

/** The `"i:j"` key (`i < j`) of a distance pair — the ONE place the convention is written. */
export function distanceKey(a: number, b: number): string {
  return a < b ? `${String(a)}:${String(b)}` : `${String(b)}:${String(a)}`;
}

/**
 * The distance row of one variant: its distance to each of the five others.
 * A variant's class only exists relative to another one (ADR-0080 D2), so difficulty is
 * read off a ROW, never off a variant.
 */
export function distanceRow(
  distances: Readonly<Record<string, VariantDistance>>,
  index: number,
  variantCount: number,
): readonly VariantDistance[] {
  const row: VariantDistance[] = [];
  for (let other = 0; other < variantCount; other += 1) {
    if (other === index) continue;
    const d = distances[distanceKey(index, other)];
    if (d !== undefined) row.push(d);
  }
  return row;
}

/**
 * The gate's V1 decoy composition, made executable (gate §3, A5): a variant is eligible
 * to be the truth when its row is exactly 2 `strong` + 3 `medium` + 0 `fine`.
 * `drawPortraitPuzzle` picks only among eligible variants — which is what makes the
 * composition true for EVERY seed rather than on average.
 */
export function isEligibleTruth(
  distances: Readonly<Record<string, VariantDistance>>,
  index: number,
  variantCount: number,
): boolean {
  const row = distanceRow(distances, index, variantCount);
  if (row.length !== variantCount - 1) return false;
  const strong = row.filter((d) => d === "strong").length;
  const medium = row.filter((d) => d === "medium").length;
  const fine = row.filter((d) => d === "fine").length;
  return strong === 2 && medium === 3 && fine === 0;
}

/**
 * The board for one seed (ADR-0080 D4). Same seed ⇒ same puzzle, on every device.
 * Total: it never throws, including on a catalogue that would fail `validatePortrait`
 * (a band with no eligible truth falls back to its whole pool — the caller's problem,
 * ADR-0074's restated gotcha).
 *
 * Every index it produces is a SLOT (a position in `order`), never a catalogue index.
 */
export function drawPortraitPuzzle(catalogue: FaceCatalogue, seed: number): PortraitPuzzle {
  const order: number[][] = [];
  const truth: number[] = [];
  const initialSelection: number[] = [];

  catalogue.bands.forEach((band, bandIndex) => {
    const n = band.variants.length;
    if (n === 0) {
      // A band with NO variant is UNRESOLVABLE, and `NO_TRUTH_SLOT` is how the board says
      // so: no selection can ever equal it, so the band counts as wrong forever.
      //
      // It used to push `0` — and `selection` also started at `0`, so an empty band was
      // permanently CORRECT: a catalogue with 3 bands emptied resolved itself to
      // `IDENTIFIED` at t=0, and a broken catalogue was a gift (panel B4b). Degrading an
      // invalid catalogue must never favour the player; the phase skip belongs to
      // `validatePortrait`, and this is what happens if someone bypasses it.
      order.push([]);
      truth.push(NO_TRUTH_SLOT);
      initialSelection.push(0);
      return;
    }
    const eligible = band.variants
      .map((_, i) => i)
      .filter((i) => isEligibleTruth(band.distances, i, n));
    const pool = eligible.length > 0 ? eligible : band.variants.map((_, i) => i);

    // `pool` is non-empty here (the `n === 0` band returned above), so the `?? 0`
    // is the index signature's tax and not a fallback the draw can take.
    const truthIndex = pool[portraitHash(seed, bandIndex, 0) % pool.length] ?? 0;
    const bandOrder = seededShuffle(n, portraitHash(seed, bandIndex, 1));
    const truthSlot = bandOrder.indexOf(truthIndex);

    // The all-wrong start (gate A14) by ARITHMETIC, not by rejection sampling and not by
    // a shell-side nudge (ADR-0080 D4.4 / A7 / A8): offsetting off the truth slot by
    // 1..n-1 modulo n makes `initialSlot === truthSlot` UNREPRESENTABLE, so
    // `correctCount(initialSelection) === 0` holds for every seed by construction.
    const initialSlot =
      n === 1 ? 0 : (truthSlot + 1 + (portraitHash(seed, bandIndex, 2) % (n - 1))) % n;

    order.push(bandOrder);
    truth.push(truthSlot);
    initialSelection.push(initialSlot);
  });

  return { order, truth, initialSelection };
}

// ---------------------------------------------------------------------------
// The scene (ADR-0079 D2/D3/D8)
// ---------------------------------------------------------------------------

/** How many bands sit on their truth slot. The ONE derivation the outcome is read from. */
export function correctCount(selection: PortraitSelection, truth: readonly number[]): number {
  return truth.reduce((n, slot, i) => (selection[i] === slot ? n + 1 : n), 0);
}

/**
 * A fresh scene for `seed`. `correctCount` is 0 at entry for every seed (ADR-0080 D4.4),
 * which is what makes auto-resolution safe with no guard delay (ADR-0079 D8.4).
 */
export function createPortraitScene(
  catalogue: FaceCatalogue,
  seed: number,
  timerSeconds: number,
): PortraitScene {
  const puzzle = drawPortraitPuzzle(catalogue, seed);
  return {
    phase: "ACTIVE",
    puzzle,
    selection: puzzle.initialSelection,
    focusedBand: PORTRAIT_BAND_ORDER[0],
    remainingSeconds: timerSeconds,
    timerSeconds,
    palier: palierFor(timerSeconds, timerSeconds),
    revealSeconds: 0,
    result: null,
  };
}

/**
 * The SINGLE resolution function (ADR-0079 D6/D8.1). Lock-in, expiry and confirmed early
 * exit all land here, and the outcome is derived from `correctCount` alone — there is no
 * "how did we get here" parameter, so two exit paths cannot disagree about one board.
 * `IDENTIFIED` is not "the lock-in outcome", it is "what 4/4 means".
 *
 * Idempotent: resolving a resolved scene returns it unchanged.
 */
export function resolvePortraitScene(scene: PortraitScene): PortraitScene {
  if (scene.phase !== "ACTIVE") return scene;
  const n = correctCount(scene.selection, scene.puzzle.truth);
  const outcome: PortraitOutcome = n === 4 ? "IDENTIFIED" : n === 3 ? "PARTIAL" : "FAILED";
  const result: PortraitResult = {
    outcome,
    correctCount: n,
    scoreDelta: PORTRAIT_SCORE[outcome],
  };
  return {
    ...scene,
    phase: "RESOLVED",
    result,
    revealSeconds: outcome === "IDENTIFIED" ? REVEAL_SECONDS_IDENTIFIED : REVEAL_SECONDS_UNRESOLVED,
  };
}

const BAND_INDEX: Readonly<Record<PortraitBandId, number>> = {
  hair: 0,
  eyes: 1,
  nose: 2,
  mouth: 3,
};

/** Board mutation only — knows nothing about resolution (ADR-0079 D8.1). */
function applySelection(scene: PortraitScene, intent: PortraitIntent): PortraitScene {
  if (intent.kind === "ABANDON") return scene;
  // `BAND_INDEX` is TOTAL over `PortraitBandId`, so there is no "unknown band"
  // case to guard here — the old `i === undefined` branch was unreachable, and an
  // unreachable guard reads as a handled case that is not handled. The real
  // degradations (an empty band, an out-of-range index) are below, where they can
  // actually happen.
  const i = BAND_INDEX[intent.band];
  if (intent.kind === "FOCUS") return { ...scene, focusedBand: intent.band };

  const n = scene.puzzle.order[i]?.length ?? 0;
  if (n === 0) return scene;
  const current = scene.selection[i] ?? 0;

  let next: number;
  if (intent.kind === "CYCLE") {
    next = (((current + intent.delta) % n) + n) % n;
  } else {
    if (!Number.isInteger(intent.index) || intent.index < 0 || intent.index >= n) return scene;
    next = intent.index;
  }
  if (next === current) return scene;

  const selection = [...scene.selection];
  selection[i] = next;
  return { ...scene, selection };
}

/**
 * Fold ONE intent (ADR-0079 D8.1). The 4/4 lock-in is a **post-condition** of this
 * function, evaluated on every entry — that is why a 4th correct band placed in the same
 * frame as the buzzer yields `IDENTIFIED` regardless of delivery order.
 *
 * Total: an out-of-range index, an unknown band or an intent arriving on a `RESOLVED`
 * scene is a no-op, never a throw.
 *
 * `ABANDON` resolves at the CURRENT board, byte-identically to expiry. It can never
 * yield `IDENTIFIED` and needs no special case to say so: a 4/4 board would already have
 * resolved on the entry that produced it (gate A17 — the question is empty by
 * construction, and the `IDENTIFIED`-is-impossible line is a regression assertion, not a
 * mechanism).
 */
export function applyPortraitIntent(scene: PortraitScene, intent: PortraitIntent): PortraitScene {
  if (scene.phase !== "ACTIVE") return scene;
  if (intent.kind === "ABANDON") return resolvePortraitScene(scene);
  const next = applySelection(scene, intent);
  return correctCount(next.selection, next.puzzle.truth) === 4 ? resolvePortraitScene(next) : next;
}

/**
 * Advance the chrono (ADR-0079 D8.2). The `phase !== "ACTIVE"` guard makes expiry only
 * ever evaluable on a scene where NO lock-in occurred — the gate's "l'expiration n'est
 * évaluée que si aucun verrouillage n'a eu lieu" is the *domain* of this function, not a
 * branch someone could forget.
 *
 * A non-finite or non-positive `dt` advances nothing: time never runs backwards, which is
 * what keeps `palier` monotone without a second monotonicity guard.
 */
export function tickPortraitScene(scene: PortraitScene, dt: number): PortraitScene {
  if (scene.phase !== "ACTIVE") return scene;
  const advance = Number.isFinite(dt) && dt > 0 ? dt : 0;
  const remaining = Math.max(0, scene.remainingSeconds - advance);
  if (remaining <= 0) {
    return resolvePortraitScene({
      ...scene,
      remainingSeconds: 0,
      palier: palierFor(0, scene.timerSeconds),
    });
  }
  return {
    ...scene,
    remainingSeconds: remaining,
    palier: palierFor(remaining, scene.timerSeconds),
  };
}

/**
 * **The frame fold, and the only entry point the bridge may call** (ADR-0079 D8.3).
 *
 * Inputs are drained BEFORE time advances, once per frame. `usePortraitRobot` pushes
 * pointer/touch/key events into a ref-held inbox and hands the whole inbox here with the
 * frame's `dt`; it owns no ordering. That is the protection: an ordering discipline a
 * hook is *asked* to respect is a comment, one it *cannot express* is an architecture.
 *
 * Two call sites bring the buzzer race back, silently, with green tests — hence the
 * contract test and the standing blocking finding at stage 6 (hand-off §3.4).
 */
export function stepPortraitScene(
  scene: PortraitScene,
  intents: readonly PortraitIntent[],
  dt: number,
): PortraitScene {
  return tickPortraitScene(intents.reduce(applyPortraitIntent, scene), dt);
}

/**
 * The scene's only residue (ADR-0079 D4) and the ONE place gate §3's payoff table is
 * written down. `src/render` never maps an outcome to a number (ADR-0079 A5).
 *
 * There is no life field to fill — `LevelModifier` cannot express one (gate A1, AC5).
 */
export function levelModifierFromPortrait(result: PortraitResult): LevelModifier {
  return {
    energyDelta: PORTRAIT_ENERGY_DELTA[result.outcome],
    firstWaveDelaySeconds: PORTRAIT_WAVE_HOLD_SECONDS[result.outcome],
    narrativeBeat: result.outcome,
  };
}
