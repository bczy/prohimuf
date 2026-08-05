/**
 * Portrait-robot — the interstitial photofit scene, contract types (ADR-0079,
 * ADR-0080, ADR-0082; tuning canon: `docs/game-design/design-gate-portrait-robot.md` §3).
 *
 * The player reconstructs a face from four stacked bands (hair / eyes / nose /
 * mouth), six variants each, against a chrono. Placing the fourth correct band
 * ENDS the scene by itself — there is no validation act, no button, no
 * "submit": the lock-in test is a post-condition of the reducer (ADR-0079 D8.1),
 * so 4/4 reached in the same frame as the buzzer is `IDENTIFIED` on every device
 * and at every frame rate. The verdict leaves as a `LevelModifier`
 * (`./levelModifier`); the scene itself is thrown away at phase exit.
 *
 * `PortraitScene` is a STANDALONE immutable record, not a field of `GameState`:
 * there is no simulation to freeze here. Every rule lives in
 * `src/game/systems/portraitRobotSystem.ts`, whose functions are total, pure and
 * DOM-free. The chrono is a `dt` accumulator, the draw is a hash of a seed
 * supplied by the shell: **zero `Date.now`, zero `Math.random`** anywhere in
 * `src/game` for this feature.
 *
 * Types only: zero React/Three, zero functions, zero tuning number (ADR-0074 §1).
 * The types carry the SHAPE; the values of gate §3 live in the system.
 */

/**
 * Root-relative directory of the sliced band assets, and the file-name
 * convention agreed with `dev-tooling-assets` (ADR-0080 D5):
 *
 *   `assets/portrait/<band>-<nn>.png`
 *
 * where `<band>` is a `PortraitBandId` verbatim (`hair` / `eyes` / `nose` /
 * `mouth`) and `<nn>` is the variant ordinal, 1-based and zero-padded to two
 * digits (`01`…`06`) — e.g. `assets/portrait/eyes-03.png`. The same string is
 * the variant's `id` minus the extension, so a path and an id are derivable
 * from one another and neither is authored twice.
 *
 * 24 files, all written by `scripts/slice-portrait-plate.mjs` in ONE run from a
 * single plate — the script has no per-band mode, and that absence IS the
 * atomicity guarantee. Nothing else may write into this directory, and no band
 * may be hand-patched (`plateChecksum`, ADR-0080 D5).
 *
 * Exported here because three lanes read it: the catalogue (`src/game/portraits`)
 * builds `PortraitVariant.asset` from it, `assetManifest.ts` builds the
 * `"portrait-robot"` preload target from it, and the slicing script writes to it.
 */
export const PORTRAIT_ASSET_DIR = "assets/portrait";

/** The four bands, in draw order — top of the skull down to the chin (ADR-0080 D2). */
export type PortraitBandId = "hair" | "eyes" | "nose" | "mouth";

/**
 * Perceptual distance between TWO variants of the same band (ADR-0080 D2).
 * Difficulty is the distance between the decoys and the truth, never their
 * number: `strong` reads as another face, `medium` needs a comparison, `fine`
 * is a near-twin. Authored pairwise because a variant's class only exists
 * relative to another one — a per-variant class would silently mean "distance
 * from variant 0" and be wrong for every seed where variant 0 is not the truth.
 */
export type VariantDistance = "strong" | "medium" | "fine";

/** One drawable band image plus the one thing the player can be told about it. */
export interface PortraitVariant {
  /** Stable id, e.g. `"eyes-03"` — the asset file name minus `.png`. */
  readonly id: string;
  /** BASE-relative path under `PORTRAIT_ASSET_DIR`, e.g. `"assets/portrait/eyes-03.png"`. */
  readonly asset: string;
  /**
   * The NAMED TRAIT (gate A5), one short sentence in the witness's words. It is
   * what makes a variant describable — never pixel coordinates, never a hint of
   * correctness.
   */
  readonly trait: string;
}

/** One band of the catalogue: its six variants and the distances between them. */
export interface PortraitBand {
  readonly id: PortraitBandId;
  /** Canonical player-facing label (gate A6) — the narrative lane owns the string. */
  readonly label: string;
  /** Exactly 6 — a hard ceiling (gate A5), asserted by `validatePortrait`. */
  readonly variants: readonly PortraitVariant[];
  /**
   * Symmetric pairwise distances, upper triangle only: exactly 15 entries keyed
   * `"i:j"` with `i < j` (indices into `variants`). Completeness, the absence of
   * self-pairs and the decoy profile are `validatePortrait` invariants — this
   * type only says "a map of pairs".
   */
  readonly distances: Readonly<Record<string, VariantDistance>>;
}

/**
 * The authored catalogue (`src/game/portraits/`): one gabarit, four bands, 24
 * variants. `validatePortrait` is the single source of its invariants and never
 * throws — an invalid catalogue makes the shell SKIP the phase, it never bricks
 * a run.
 */
export interface FaceCatalogue {
  /** The single face template of V1 (gate A5). */
  readonly gabaritId: string;
  /** Provenance of the plate the 24 PNGs were sliced from (ADR-0080 D5). */
  readonly plateChecksum: string;
  /** Exactly 4, in draw order. */
  readonly bands: readonly PortraitBand[];
}

/**
 * One board, drawn from the catalogue by `drawPortraitPuzzle(catalogue, seed)`
 * (ADR-0080 D4). Same seed ⇒ same puzzle, on every device, forever: the truth,
 * the presentation order and the starting board are all hashes of the seed.
 *
 * Every index below is a SLOT — a position in `order`, i.e. what the player
 * sees — never an index into the catalogue's authored `variants` array.
 */
export interface PortraitPuzzle {
  /** Presentation order per band: 4 arrays of 6 catalogue indices, seeded-shuffled. */
  readonly order: readonly (readonly number[])[];
  /** The correct slot per band — 4 entries, one per `PortraitBandId` in draw order. */
  readonly truth: readonly number[];
  /**
   * The board the player STARTS on — 4 slots, one per band (gate A14,
   * `initialStateAllWrong`).
   *
   * `correctCount(initialSelection) === 0` for **every** seed, and it holds by
   * ARITHMETIC, not by luck: the draw offsets the initial slot off the truth
   * slot modularly (ADR-0080 D4.4). Do not "protect" it with a rejection-sampling
   * loop, and do not let the shell nudge a board it dislikes — either would turn
   * a property into a procedure that usually succeeds, and would break seed
   * replayability (ADR-0080 A7/A8). The `seed-sweep` validator invariant is the
   * regression guard on the arithmetic, not the proof of it.
   *
   * Without this, auto-resolution (D8.1) could resolve a scene at t=0, before
   * the player touched anything — which is why it lives on the puzzle and not
   * in a guard delay.
   */
  readonly initialSelection: readonly number[];
}

/**
 * What the player currently has on the board: one selected slot per band, 4
 * entries, in draw order. The ONLY mutable thing about a scene, and its only
 * mutator is `applyPortraitIntent`.
 */
export type PortraitSelection = readonly number[];

/**
 * Life-cycle of the scene. Strictly forward-only, and short: `ACTIVE` →
 * `RESOLVED`. Every exit path — lock-in at 4/4, chrono expiry, confirmed early
 * exit — goes through the SAME `resolvePortraitScene`, so two paths cannot
 * disagree about the same board (ADR-0079 D8.1). Both `applyPortraitIntent` and
 * `tickPortraitScene` are the identity on a `RESOLVED` scene: time cannot run
 * on a decided scene, and that is a property of their domain, not a check.
 */
export type PortraitPhase = "ACTIVE" | "RESOLVED";

/**
 * Tension threshold currently reached, monotone DESCENDING over the scene
 * (ADR-0079 D9, gate A13/A18). `NONE → MID → URGENT → LAST`, recomputed by
 * `tickPortraitScene` from the chrono.
 *
 * It is state and not a predicate on purpose: with a continuous chrono, a
 * consumer testing `remainingSeconds <= 10` fires EVERY FRAME for the last ten
 * seconds — bearable in a unit test, unbearable with a screen reader on. Copy,
 * music and the `aria-live` announcement react to a CHANGE of this value, never
 * to a comparison of their own, so the three cannot desynchronise and the
 * crossing is detected once by construction. Replaying a seed replays the
 * paliers. The mixed proportional/absolute rule that produces it is written
 * once, in the system.
 */
export type PortraitPalier = "NONE" | "MID" | "URGENT" | "LAST";

/**
 * The player's vocabulary — what a player ASKS FOR, never how they asked
 * (ADR-0082 D1). No `SWIPE`, no `DRAG`, no `TAP`, no `ARROW_LEFT`: if a
 * gesture-shaped member ever appears here, the abstraction has failed. The
 * desktop drag of B3 was absorbed by `SET` with zero new member — pointer
 * mid-travel belongs to the hook, only crans cross the seam.
 *
 * **There is no `SUBMIT`, and none may be added** — not "for the keyboard", not
 * for a long-press, not for an `Enter` binding. B1 deleted the validation ACT,
 * not merely its label: the scene resolves itself at 4/4 (ADR-0079 D8.1). An
 * unreachable member here is a loaded gun that re-implements the deleted CTA by
 * accident, which is why it is absent from the union rather than ignored by the
 * reducer (ADR-0082 D1). The resolution kept a name — the rule
 * `resolvePortraitScene` — it just stopped being a request.
 *
 * `applyPortraitIntent` is total: an out-of-range index, an unknown band or an
 * intent arriving after the end is a no-op, never a throw.
 */
export type PortraitIntent =
  /**
   * Move `delta` variants along in `band`, wrapping. Carries its band, so no
   * cursor is implied.
   *
   * `delta` is any integer, not `1 | -1`, and that is an ORDERING guarantee, not
   * a convenience: a desktop drag banks N crans and must land N crans from the
   * board the FOLD holds, not from the board React last rendered. Expressed as an
   * absolute `SET(index + crans)` the hook had to read a stale selection and the
   * result depended on what else was in the inbox that frame (panel run-1 minor,
   * « `SET` absolu calculé sur un état non folded »). Relative is
   * order-independent by construction, so no consumer needs to know the fold's
   * schedule. It also removes the hook's need to wrap, which is where the
   * "wrap on 6 instead of on the band's real length" bug lived.
   */
  | { readonly kind: "CYCLE"; readonly band: PortraitBandId; readonly delta: number }
  /** Address a slot directly (keyboard `1..6`). */
  | { readonly kind: "SET"; readonly band: PortraitBandId; readonly index: number }
  /**
   * Move the keyboard / screen-reader cursor. Exists ONLY for that path;
   * orthogonal to `CYCLE` and never a precondition of it.
   */
  | { readonly kind: "FOCUS"; readonly band: PortraitBandId }
  /**
   * Confirmed early exit. Resolves at the CURRENT board, byte-identically to
   * expiry — so it can never yield `IDENTIFIED` (a 4/4 board would already have
   * resolved on the entry that produced it), and it needs no special case to
   * say so. The two-step arming that guards it is IHM sub-state and lives in the
   * hook, outside the game model (gate A17).
   */
  | { readonly kind: "ABANDON" };

/** The three issues, derived from `correctCount` alone: `4 ⇒ IDENTIFIED`, `3 ⇒ PARTIAL`, `≤2 ⇒ FAILED`. */
export type PortraitOutcome = "IDENTIFIED" | "PARTIAL" | "FAILED";

/**
 * The scene's only residue. `levelModifierFromPortrait` turns it into a
 * `LevelModifier`; nothing else may read a number off it and decide a payoff.
 */
export interface PortraitResult {
  readonly outcome: PortraitOutcome;
  /** Bands correct at resolution, 0..4. */
  readonly correctCount: number;
  /** Score awarded — gate §3's barème, computed in the system, never in the render. */
  readonly scoreDelta: number;
}

/** Runtime state of the scene: created at phase entry, folded, discarded at exit. */
export interface PortraitScene {
  readonly phase: PortraitPhase;
  /** The board drawn from the seed. Immutable for the scene's lifetime. */
  readonly puzzle: PortraitPuzzle;
  /** Current board — starts at `puzzle.initialSelection`, i.e. 0/4 correct. */
  readonly selection: PortraitSelection;
  /** Cursor for the keyboard / screen-reader path only (`FOCUS`); no gesture depends on it. */
  readonly focusedBand: PortraitBandId;
  /**
   * Chrono, a `dt` accumulator counting down — never a wall clock, never
   * quantised. There is no unit, no digit and no displayed number (gate A13):
   * the screen draws a continuous gauge, and consumers read `palier`, not this.
   */
  readonly remainingSeconds: number;
  /** The chrono's starting value (gate §3, per difficulty). Kept so `palier`'s relative threshold is pure. */
  readonly timerSeconds: number;
  /** Highest tension threshold crossed so far — see `PortraitPalier`. */
  readonly palier: PortraitPalier;
  /**
   * How long the resolution tableau is held before the phase hands over, in
   * seconds. Two values, asymmetric on purpose (gate A15): the losing issues
   * need time to show the corrections band by band, `IDENTIFIED` has nothing
   * left to inform. Set by `resolvePortraitScene`; `0` while `ACTIVE`.
   *
   * It lives on the scene so the screen reads `scene.revealSeconds` — a
   * `switch` on the outcome inside the `.tsx` would put two gate numbers in the
   * render layer (ADR-0082 D4, same breach as ADR-0079 A5 at a smaller scale).
   */
  readonly revealSeconds: number;
  /**
   * The verdict, or `null` while `ACTIVE`. Non-null exactly when
   * `phase === "RESOLVED"` — one flip, one writer, and nothing in the phase is
   * evaluated twice.
   *
   * Note what is NOT here: any per-band correctness signal. No tint, no check,
   * no `aria` hint, no timing tell — the scene grants exactly ONE feedback, and
   * it is global and terminal: the phase ending (gate A16). A field the render
   * could read to hint a band would make that prohibition unenforceable.
   */
  readonly result: PortraitResult | null;
}
