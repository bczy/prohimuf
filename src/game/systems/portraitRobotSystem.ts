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

/**
 * Variants per band, one gabarit. Raised 6 → 10 on Bertrand's call (2026-08-09, "plus de
 * bandes"), so the four remaining registered plates enter the pool: 4 bands × 10 = 40
 * assets, and 10⁴ = 10 000 possible suspects instead of 1296.
 *
 * Gate A5 wrote "six" as a hard ceiling, so this supersedes it — the ceiling was a
 * production budget (24 assets to draw), not a mechanic. What DOES stay a mechanic is the
 * decoy composition: every eligible truth keeps exactly 2 `strong` neighbours and no
 * `fine` one, which `isEligibleTruth` now expresses independently of the count.
 */
export const VARIANTS_PER_BAND = 10;

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

/** Total reveal DURATION per issue, asymmetric on purpose (gate A15). Never decremented. */
export const REVEAL_SECONDS_IDENTIFIED = 1.4;
export const REVEAL_SECONDS_UNRESOLVED = 2.6;

/**
 * How long the COMPLETE corrected face is held AFTER the reveal, before the phase hands
 * over (gate §3 `resultHoldSeconds`, A15, story AC4). One value, all issues.
 *
 * Panel run-1 found this number redeclared in `src/render`; the correction DELETED it
 * instead of moving it here, and the player then saw the verdict stamp for 0,7 s before
 * being shipped to the end screen. A15 says what the 2,2 s buys — « le temps de lire le
 * tampon et la ligne KENZA » — so the canonical tableau is `2,6 + 2,2 = 4,8 s`, not an
 * excess to trim. It is a phase of its own (`portraitRevealProgress`), not a tail.
 */
export const RESULT_HOLD_SECONDS = 2.2;

/**
 * The tail of the reveal itself, at `PARTIAL`/`FAILED`: after the four band verdicts have
 * walked top to bottom, the whole corrected face is held this long BEFORE the result hold
 * begins (gate §3 « 4×~0,45 s + 0,8 s de tenue »). It is what makes the per-band step
 * exactly 0,45 s, and `revealBandStepSeconds` is the only place it is spent.
 */
export const REVEAL_HOLD_TAIL_SECONDS = 0.8;

/**
 * Seconds each band's verdict takes during the reveal — `(2,6 − 0,8) / 4 = 0,45 s` on
 * `PARTIAL`/`FAILED`, where there are corrections to read.
 *
 * **`0` on `IDENTIFIED`, and that is the canon, not a degenerate case:** gate §3 spells
 * out « pas de reptation » there — a flash and the four stamps SIMULTANEOUS, because a
 * 4/4 board has nothing left to teach. A step of `0` means "all four at once", which is
 * how `portraitRevealProgress` reads it.
 *
 * Takes the OUTCOME, not a duration: derived from a duration it used to accelerate as
 * that duration shrank (panel run-2).
 */
export function revealBandStepSeconds(outcome: PortraitOutcome): number {
  if (outcome === "IDENTIFIED") return 0;
  return (REVEAL_SECONDS_UNRESOLVED - REVEAL_HOLD_TAIL_SECONDS) / PORTRAIT_BAND_ORDER.length;
}

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
 * to be the truth when its row holds exactly 2 `strong`, no `fine`, and `medium`
 * everywhere else. Stated that way it is INDEPENDENT of the variant count — the gate
 * wrote "2 strong + 3 medium" for six variants, which is the same rule at n = 6, and
 * hard-coding the 3 would have silently disqualified every variant at n = 10 (falling
 * back to the whole pool, i.e. no decoy composition at all, with nothing saying so).
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
  return strong === 2 && fine === 0 && medium === variantCount - 3;
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
    resultHoldSeconds: 0,
    revealElapsed: 0,
    result: null,
  };
}

// ---------------------------------------------------------------------------
// The reveal timeline (gate §3 / A15, story AC4)
// ---------------------------------------------------------------------------

/**
 * Where the post-verdict tableau currently is. Forward-only, like the phase itself:
 * `NONE` (scene still `ACTIVE`) → `REVEALING` → `HOLDING` → `DONE`.
 */
export type PortraitRevealStage = "NONE" | "REVEALING" | "HOLDING" | "DONE";

/** Everything a consumer may know about the reveal. Nothing else about it is readable. */
export interface PortraitRevealProgress {
  readonly stage: PortraitRevealStage;
  /** Bands whose verdict has been played, 0..4, top to bottom. */
  readonly revealedBands: number;
  /** The phase's single hand-over signal: the reveal AND the result hold are both spent. */
  readonly handoverReady: boolean;
}

/**
 * **The only reader of the reveal clock** (ADR-0079 A5).
 *
 * `revealSeconds` / `resultHoldSeconds` are constants and `revealElapsed` rises; the one
 * comparison between them lives here, so the run-2 blocking defect — a consumer comparing
 * its own rising accumulator to a shrinking duration, halving every published number — is
 * not "fixed", it is **inexpressible**: the hook holds no clock and no threshold to get
 * wrong, it reads `revealedBands` and `handoverReady`.
 *
 * `reducedMotion` cuts the WALK, never the CONTENT (ADR-0054 §3): the four corrections
 * are all shown at once instead of in sequence, and the durations are untouched — a
 * player who needs less motion does not get less time to read.
 */
export function portraitRevealProgress(
  scene: PortraitScene,
  reducedMotion = false,
): PortraitRevealProgress {
  const { result } = scene;
  if (scene.phase !== "RESOLVED" || result === null) {
    return { stage: "NONE", revealedBands: 0, handoverReady: false };
  }
  const step = reducedMotion ? 0 : revealBandStepSeconds(result.outcome);
  const bandCount = PORTRAIT_BAND_ORDER.length;
  const revealedBands =
    step <= 0 ? bandCount : Math.min(bandCount, Math.floor(scene.revealElapsed / step));

  const stage: PortraitRevealStage =
    scene.revealElapsed < scene.revealSeconds
      ? "REVEALING"
      : scene.revealElapsed < scene.revealSeconds + scene.resultHoldSeconds
        ? "HOLDING"
        : "DONE";
  return { stage, revealedBands, handoverReady: stage === "DONE" };
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
    resultHoldSeconds: RESULT_HOLD_SECONDS,
    revealElapsed: 0,
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
    // Any integer delta, wrapped on the band's REAL length — a banked drag of N crans
    // is one entry, and a band that does not have 6 variants wraps on what it has.
    if (!Number.isInteger(intent.delta)) return scene;
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
 *
 * **On a RESOLVED scene the only thing that moves is `revealElapsed`** (panel M7). The
 * verdict, the board, the chrono AND the two durations are frozen for good — D8.2's
 * identity holds where it matters — but the tableau's clock is a `dt` ACCUMULATOR here
 * rather than a `setTimeout` in the component, and that is what makes it honour the pause
 * **by construction**: a paused frame simply hands no `dt`. A wall clock in the component
 * kept running behind `RotateOverlay` and the phase ended while the player was looking at
 * a rotate prompt. It RISES and is clamped at `revealSeconds + resultHoldSeconds`;
 * consumers read `portraitRevealProgress`, never this field (ADR-0079 A5).
 */
export function tickPortraitScene(scene: PortraitScene, dt: number): PortraitScene {
  const advance = Number.isFinite(dt) && dt > 0 ? dt : 0;
  if (scene.phase !== "ACTIVE") {
    const total = scene.revealSeconds + scene.resultHoldSeconds;
    if (advance === 0 || scene.revealElapsed >= total) return scene;
    return { ...scene, revealElapsed: Math.min(total, scene.revealElapsed + advance) };
  }
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
    // The one field of the modifier that settles the PAST (hand-off §6.2): the shell
    // spends it at the exit of the portrait phase, not at the next `createInitialState`.
    // Carried here anyway because the scene has exactly one output channel.
    scoreDelta: result.scoreDelta,
    energyDelta: PORTRAIT_ENERGY_DELTA[result.outcome],
    firstWaveDelaySeconds: PORTRAIT_WAVE_HOLD_SECONDS[result.outcome],
    narrativeBeat: result.outcome,
  };
}
