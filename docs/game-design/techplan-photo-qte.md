# Tech Plan — QTE photo paparazzi (STORY-QTE-PHOTO-PAPARAZZI)

**Stage 3 (TECH PLAN).** Author: `senior-architect` (Winston) · Date: 2026-08-01 ·
**amended Rev.3, 2026-08-02**
**Branch:** `design/qte-photo-paparazzi`
**Inputs (all GATED, design gate PASS round 2 final):**

- frame law `docs/adr/0077-qte-photo-paparazzi-set-pieces.md` (D1–D9 + determinism guardrail)
- gate verdict `docs/game-design/design-gate-photo-qte.md` (rulings R2-1…R2-5, package E-4)
- mechanic `docs/game-design/spec-photo-qte-paparazzi.md` (Rev. 2)
- fiction `docs/game-design/spec-photo-qte-fiction.md` (**Rev.3**, §2 + §9.0)
- UX `docs/game-design/ux/photo-qte-controls.md` (Rev. 2)

## AMENDEMENT Rev.3 — the host level is BELLIARD (Bertrand, 2026-08-02)

**Decision (final, overrides gate ruling R-10):** the first set-piece is hosted on **Belliard**,
the shipped level 1. **No new level is built.** The hide is a roof dormer at the top of the
street; the scene plays at the mouth of the passage (`x_norm 0,372–0,408`); the sound cover is
the traffic-light cycle at `x_norm 0,388` (fiction Rev.3 §2.1–§2.4, §9.0).

**What that changes in this plan — the whole delta, in one place:**

| #   | Change                                                                                                                                                                                                                                             | Where          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | The carry's source level: **Belliard → Niveau Final**. The mechanism (persisted, monotone, `muf_leverage`, object blob, pure algebra + bridge I/O) is **unchanged**; only the source row moves.                                                    | §5, ADR-0080   |
| 2   | `photoQteSpec` is authored on the **Belliard** row — which already authors `hostageQte`, `loot` and (behind the flag) `bossQteSpec`. The Rev.2 exclusivity invariant is **withdrawn and replaced** by a serialisation invariant + a runtime guard. | **D-K**, §2.7  |
| 3   | Belliard is **no longer byte-identical** — it gains the spec. The guarantee is reformulated and its test moves to a level that authors no spec.                                                                                                    | §2.6 E-4(c)    |
| 4   | The sound cover rides a **shipped, live, wall-clock render prop** (`trafficSignalPhase`, 13.5 s cycle). It must not become the cover's source of truth.                                                                                            | **D-J**        |
| 5   | Lane C loses nothing it had (it never built a level) but its manifest target moves to `belliard` — the **first-play preload**, which is a heavier place to put a 1280×768 plate.                                                                   | §6 Lane C, §7  |
| 6   | Two new questions for `pm` (progression placement, farmability). **Q-2 stays open.**                                                                                                                                                               | §8bis Q-3, Q-4 |

Not changed by the relocation, and deliberately re-affirmed: the frozen-scene block (D-A), the
device-neutral input (D-B), the single evaluator (D-C), the projection split (D-D), the boss
lever's authored-row discipline (D-F, §4 — **sharpened**, see §4.1), the hash kernel (D-H), the
lane split and the build order (§7).

**Decision record:** ADR-0077 (frame) **+ new `docs/adr/0080-photo-leverage-cross-level-carry.md`**
(the cross-level carry — see §9: ADR-0077 does **not** cover it).
**Status:** APPROVED for build — **three lanes**, one ordering constraint, one typed seam.

This plan freezes the contracts (types, signatures, file-by-file change list) so the lanes build
in parallel without touching each other's files, and answers the seven E-4 asks with concrete
structures. Every tuning value stays the design's; this plan only says **where it lives and who
computes it**.

**Boundary law (AGENTS.md), restated because this feature is where it would break:** the whole
photo rule — state machine, subject track, the five tests, sway, film, suspicion, verdicts,
outcome — is **pure, in `src/game`, TDD**. The render draws the state the tick produced and
**decides nothing**: no re-evaluation of containment, no re-derivation of a verdict, no
device fork, no second source of truth for the subject box. Any render-side `if` that reproduces
a rule is a boundary violation and a review-panel blocker.

---

## 1. Headline decisions

**D-A — The set-piece is a FOURTH frozen-scene block in `tickGameState`, not a new loop.**
Same shape as the hostage duel (`stateMachine.ts` §1b) and the boss encounter: an authored
per-level spec (`photoQteSpec`), a runtime sub-record (`photoQte`), a scripted trigger, and an
early return that spreads `...state` with `elapsedSeconds` frozen. This single decision answers
**three of the seven E-4 asks by construction** and adds zero new architecture:

- **E-4(a) tick-gate on `paused` — FREE.** `useGameLoop.ts:327` is `if (paused) return;` at the
  top of `useFrame`. A set-piece ticked inside `tickGameState` cannot advance while paused —
  `sceneClock`, sway phase, `raisedElapsed`, film and suspicion are all fields of `photoQte`,
  which only `tickPhotoQte` moves. **Asserted, not assumed** (test A-T1, §6.1): N frames with
  `paused === true` produce a byte-identical `photoQte`. Any design that ran the set-piece on
  its own rAF/timer would have to re-implement pause — that design is rejected here.
- **E-4(g) the decline exit does not reload the level — FREE.** The set-piece never destroyed
  the level state: enemies, waves, bullets, courier, delivery, timer and score all rode through
  on `...state` with the clock frozen. `Continuer` / `[ LAISSER TOMBER ]` simply clear the
  sub-record (`photoQte.phase === "EXITED"`, then `photoQte: null` on the next tick) and the
  next tick resumes the ordinary path. There is **no level restart, no checkpoint system, and
  none is needed**.
- **"Retry from checkpoint" is the set-piece's own entry, not a level checkpoint.**
  `[ RECOMMENCER ]` calls `createPhotoQte(spec)` again — `sceneClock = 0`, film restored,
  suspicion 0, same `swaySeed` ⇒ byte-identical scene (AC10). No new persistence, no level
  reload. **This is a clarification the specs left implicit; it is now pinned.**

**D-B — The device fork dies in the bridge: the pure layer sees ONE device-neutral input.**
Desktop hold-Space and the mobile tap-to-toggle (T-2, residue C-2) both resolve to a single
`raiseIntent: boolean` before crossing into `src/game`. The pure machine owns everything the
intent implies — `raisedElapsed`, `SHUTTER_ARM_SECONDS`, the sway path reset, `raiseIndex`,
suspicion freeze. Consequences:

- `src/game` contains **zero** knowledge of Space, taps, pinches or buttons — boundary law held.
- **T-5 (posture resumes `LOWERED` after a pause) costs one line, on both devices:** desktop is
  free (the key is not held when the overlay had focus ⇒ `raiseIntent === false`), and the
  bridge **clears the mobile toggle latch whenever `paused` goes true**. One rule, two devices.
- The mechanic spec's §1.2 (residue C-2) and the UX §1.4 fork are then the _same_ statement.

**D-C — `subjectBoxAt()` is the ONLY evaluator, and the render consumes the tick's output
(E-4d, F12(1a) by construction).** The subject box is evaluated **once per tick**, in the pure
layer, and the result is carried on the runtime record (`photoQte.subjectBox`). T3/T4/T5 read
that value; the AF brackets are drawn from that same carried value. The render **never** imports
the track, never interpolates, never re-evaluates. F12(1a) ("brackets and tests read the same
evaluated value — one call site, by construction not by inspection") is therefore a property of
the data flow, not a convention: there is only one place that _can_ compute it.

**D-D — Composition and role are two independently computed fields, and the split is enforced
by the projection type (E-4b).** `photoQte` carries a `composition` record (mechanical: contained
/ fill / valid / focusHeld / bracket state) and a `frames` array (semantic: verdict + instant +
reject reason). The render never receives both at once: `photoSceneView(qte)` (drawn during
`ACTIVE`) **has no field that can express a verdict**, and `photoSheetView(qte)` returns `null`
unless `phase ∈ {CONTACT_SHEET, DONE}`. The two-beat feedback (D8) is thus a **type-level**
guarantee — a render lane _cannot_ leak the secret because the leak is not in scope.

**D-E — The cross-level carry gets its own ADR (ADR-0080).** It is the first state in muf that
travels from one level to another (progression unlocks aside), it needs a sixth `muf_*` storage
key, and it re-opens the pure/impure split ADR-0076 D4 settled. ADR-0077 does not cover it —
it explicitly hands "lane split and contracts" to stage 3 and says nothing about cross-level
state. See §5 and `docs/adr/0080-photo-leverage-cross-level-carry.md`.

**D-F — `rewardMultiplier` is authored tiers on the Niveau Final row, resolved ONCE into the
runtime record, applied through ONE helper (E-4f).** The trap the design named is real and
worse than it looks: `shieldedLullSeconds` and `telegraphLeadSeconds` are **module constants**
(`BOSS_PHASE_TABLE`, `bossQteSystem.ts:271`) **shared by Belliard and the Niveau Final**. A
multiplier applied to the table would hit both encounters — exactly the shield-break story's K-2
burn. See §4 for the full contract, including the derived property that makes "the −0.5 s cut is
never silently eaten" **structural** rather than hoped for.

**D-G — `BRIEFING` is a phase of the set-piece machine, not a pre-level narrative scene.**
F13 counts `briefingMax` inside the attempt budget and §1.3 makes it skippable _inside_ the
attempt, so the briefing is part of the set-piece, not the level's pre-roll (`PRE_LEVEL_NARRATIVE`
in `App.tsx` fires _before_ the level exists and cannot be re-entered on `[ RECOMMENCER ]`). The
authored data reuses the shipped `NarrativeLine[]` shape (`narrativeSystem.ts`); the render draws
it inside the set-piece surface. **Flagged back to `game-designer`:** mechanic §1.1's phase table
omits `BRIEFING` — it follows from F13 and §1.3, and this plan builds it. Non-blocking.

**D-H — Extract the determinism kernel BEFORE writing the third copy of it.** `hash32` and
`smoothstep` already exist **twice**, byte-identical in body, in `qteSystem.ts` (245/307) and
`bossQteSystem.ts` (465/530). The photo sway needs the same closed-form hashed-waypoint model
(spec §3.3). Adding a third copy is precisely the "silent fork of the shared skeleton" ADR-0077's
Consequences hand to the review panel. **Decision: extract to `src/game/systems/hash.ts`, with a
golden-vector test written FIRST**, then re-point both existing consumers. The extraction is a
pure move (identical bodies), and the shipped seed pins (`19940715`, `19991232`) are its
regression: if a single hashed waypoint moved, Belliard/Vitry/Niveau-Final tests go red.

**D-I — The viewfinder is rate-limited to `PAN_RATE_MAX` on BOTH devices.** _(New call — needs a
one-line design ratification, see §8 Q-1.)_ UX §1.1 gives desktop an **absolute** mouse-to-
viewfinder mapping; the mechanic authors `PAN_RATE_MAX = 12.0 su/s` and hangs floors F5b/F5c and
AC6c on it. Taken literally, an absolute mapping lets a desktop player teleport the frame, which
makes F5c vacuous and AC6c ("a non-panning player loses the hold; ≥ 1.20 su/s completes it") a
**mobile-only** criterion — i.e. two different fairness models for one gated tuning. Decision:
the pure layer treats the desktop mouse as a **target** and moves the viewfinder centre toward it
at up to `PAN_RATE_MAX`. At 251 mm that is ≈ 86 % of the frame width per second — indistinguishable
from absolute at human speeds, identical fairness maths on both devices, and one AC set instead
of two. Cheap to revert to pure-absolute (one branch) if design rules otherwise.

**D-J — The set-piece's traffic light is drawn FROM `inCover(sceneClock)`. `trafficSignalPhase`
is NOT the cover's source of truth, and is not touched.** _(New, Rev.3.)_ The relocation hangs the
cover on a prop that is **already live in code**, and that prop is the wrong clock in three
independent ways. `src/render/scene/trafficSignal.ts` is a decorative near-foreground signal
(ADR-0047) driven by `state.clock.elapsedTime` in `NearForeground.tsx`:

1. **Wrong period.** Its cycle is **13.5 s** (`5.5 + 2 + 4.5 + 1.5`); the mechanic authors
   `periodSeconds = 21.0` / `coverSeconds = 7.0` / `tellSeconds = 1.8`. They are not the same
   machine and never were.
2. **Wrong clock.** `state.clock.elapsedTime` is R3F **wall time**. It does not stop on `paused`
   and it does not freeze inside a frozen-scene block — only `reducedMotion` freezes it. Driving
   the cover from it would break **E-4(a)** at the one place the gate asked us to prove it.
3. **Not deterministic in the F11 sense.** A wall-clock phase makes `[ RECOMMENCER ]`
   non-reproducible: AC10 ("same seed + same inputs ⇒ byte-identical scene") would fail on the
   only signal the player actually reads.

**Decision:** the light drawn inside the set-piece surface is a **projection of `photoQte`** —
`inCover(spec.cover, sceneClock, sceneDuration)` plus the tell window, both already pure functions
of §2.3. The street's `NearForeground` feu stays **byte-untouched, decorative, and off-screen**
while the set-piece holds the full screen, so the two never disagree in front of the player.
The fiction's "un objet déjà shippé fait tout le travail" is a **narrative** continuity claim, not
a code-reuse instruction — recorded here so no one wires `trafficSignalPhase` into the tick and
calls it reuse. **Rejected explicitly:** retuning `TRAFFIC_PHASES` to 21 s to make the two agree —
that prop is shared decor on every level that shows it, which is the D-F trap in another costume.
Routed to `game-designer` + `sound-designer` + `lead-art` as a **note, not an ask** (§11).

**D-K — Belliard already hosts two set-pieces; the photo one SERIALISES with them by a runtime
guard, and the Rev.2 exclusivity invariant is withdrawn.** _(New, Rev.3 — this is the single
biggest consequence of the relocation.)_ The Belliard row authors `hostageQte`
(`triggerAtElapsedSeconds: 12`, worst case ≈ 21.5 s) **and**, behind `BELLIARD_BOSS_ENABLED`, a
`bossQteSpec` created at **timer expiry** (90 s, ADR-0059 Amendment 2) — with a
`createInitialState` assert already guarding their margin (`hostageBossMarginIssue`,
`validateLevel.ts`). Rev.2's §2.7 proposed forbidding `photoQte` + `hostageQte` in the same level
on the grounds that "Stalingrad has no hostage duel". **On Belliard that invariant would reject the
host level itself.** It is withdrawn. What replaces it:

- **Correctness is a runtime guard, not authoring discipline.** `shouldTriggerPhotoQte` returns
  `false` while any other set-piece holds the scene:
  `!isQteActive(qte) && !isBossQteActive(bossQte)`. Two frozen-scene blocks can then never be
  active on the same tick, whatever a future row authors. Without it, block **1a sits BEFORE 1b**
  (§2.6), so a photo threshold at or below the hostage's frozen `elapsedSeconds` would **pre-empt
  a duel already on screen** — a bug that no authored value alone can rule out.
- **The clocks compose for free.** Both set-pieces freeze `elapsedSeconds`, so the photo scene
  costs the level timer **zero seconds**: the hostage still triggers at 12 s of played time, the
  truck still lands at 20 s, the boss finale still fires at 90 s, and
  `hostageBossMarginIssue` / the `createInitialState` assert are **arithmetically unaffected**.
  Nobody should "fix" them for this feature. A test states it (A-T12).
- **Authoring gets an ORDERING invariant instead of a ban** (§2.7), because a guard that prevents
  a collision cannot prevent **starvation**: a photo trigger authored after the hostage's, or after
  `timeSeconds`, would simply never fire and nobody would notice.
- **Where the trigger lands, and why it is fiction-compatible.** Fiction §2.4 places the beat
  "avant le camion", with Muf "monté en avance". The truck is at 20 s and the hostage at 12 s, so
  the only window that satisfies both the fiction and the ordering invariant is **before 12 s** —
  recommendation `triggerAtElapsedSeconds ∈ [2, 8]`, authored by `game-designer`. The exact value
  is design's; the **constraint** is architecture's and is asserted.

---

## 2. The pure layer (`dev-gameplay`, `src/game/**`, TDD)

### 2.1 `src/game/types/photoQte.ts` — types only, zero functions

```ts
import type { NarrativeLine } from "@game/systems/narrativeSystem"; // see note
import type { PhotoLeverage } from "@game/types/photoLeverage";

/** One authored keyframe of the subject track (E-4d). Scene units on the plate. */
export interface SubjectKeyframe {
  readonly t: number; // seconds, strictly increasing across the array
  readonly cx: number; // box centre x
  readonly cy: number; // box centre y
  readonly w: number; // box width
  readonly h: number; // box height
}

export type PhotoInstantRole = "master" | "bonus";

/** An authored photographable instant — an INTERVAL over the track, never a second box. */
export interface PhotoInstant {
  readonly id: string; // "ARRIVEE" | "ECHANGE" | "PLAQUE" — stable, ASCII
  readonly role: PhotoInstantRole;
  readonly tellAt: number; // strictly < openAt (F2)
  readonly openAt: number;
  readonly closeAt: number;
}

/** Periodic sound cover, authored as a generator, not as a window list (one source). */
export interface CoverWindows {
  readonly firstOpenAt: number; // 10.0
  readonly periodSeconds: number; // 21.0
  readonly coverSeconds: number; // 7.0
  readonly tellSeconds: number; // 1.8
}

/** Authored per set-piece (`LevelConfig.photoQte`). Absent ⇒ no set-piece, byte-identical. */
export interface PhotoQteSpec {
  readonly triggerAtElapsedSeconds: number;
  readonly sceneDuration: number; // 60.0
  readonly filmCount: number; // 6
  readonly swaySeed: number; // integer, pinned at stage-5 verify (AC10)
  readonly briefingMaxSeconds: number; // 25.0, skippable
  readonly briefingLines: readonly NarrativeLine[]; // D-G
  readonly cover: CoverWindows;
  readonly subjectTrack: readonly SubjectKeyframe[]; // the 9 keyframes of §2.5
  readonly instants: readonly PhotoInstant[]; // exactly one role === "master" (F-assert)
  readonly plate: PhotoPlate; // art ids only — no paths, no sizes (see §7)
}

export type PhotoQtePhase =
  | "BRIEFING"
  | "ESTABLISHING"
  | "ACTIVE"
  | "SPOTTED"
  | "ROLL_END"
  | "SCENE_END"
  | "DEVELOPING"
  | "CONTACT_SHEET"
  | "DONE"
  | "EXITED";

export type PhotoPosture = "LOWERED" | "RAISED";

export type PhotoRejectReason =
  | "no-subject"
  | "out-of-frame"
  | "too-wide"
  | "too-tight"
  | "blurred";

export type PhotoVerdict = "MASTER" | "BONUS" | "REJECTED";

/** One exposed frame. `instantId` is the CANDIDATE instant (T2), null when none was open. */
export interface PhotoFrameRecord {
  readonly ordinal: number; // 1-based, shot order
  readonly verdict: PhotoVerdict;
  readonly instantId: string | null;
  readonly rejectReason: PhotoRejectReason | null; // null iff verdict !== "REJECTED"
  readonly inCover: boolean; // for the sheet's diagnostic only
}

/** The MECHANICAL read (E-4b). Nothing here can express a verdict — by design. */
export interface PhotoComposition {
  readonly contained: boolean; // T3
  readonly fill: number; // T4's ratio, live
  readonly fillValid: boolean; // T4
  readonly focusHeldSeconds: number;
  readonly bracket: "dashed" | "solid" | "locked"; // T-1's three states, T3∧T4 + T5 only
}

export interface Box {
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
}

export interface PhotoQte {
  readonly phase: PhotoQtePhase;
  readonly posture: PhotoPosture;
  readonly phaseRemaining: number; // BRIEFING cap / ESTABLISHING / DEVELOPING
  readonly sceneClock: number; // the ONLY cadence input
  readonly raisedElapsed: number;
  readonly raiseIndex: number; // sway path identity (hashed with swaySeed)
  readonly focal: number; // mm, RETAINED across posture changes (D1.a)
  readonly viewfinder: Box; // centre + fovW/fovH, always inside the plate
  readonly subjectBox: Box; // D-C: evaluated ONCE per tick, here
  readonly composition: PhotoComposition;
  readonly film: number;
  readonly suspicion: number;
  readonly frames: readonly PhotoFrameRecord[];
  readonly outcome: PhotoLeverage; // derived at DEVELOPING, frozen from then on
  readonly spec: PhotoQteSpec; // carried so the tick needs no second argument
}

/** Device-neutral input (D-B). Assembled in the bridge; `src/game` sees only this. */
export interface PhotoInput {
  /** Desktop: normalised mouse 0..1 as a TARGET (D-I). Mobile: null. */
  readonly aim: { readonly x: number; readonly y: number } | null;
  /** Mobile: this frame's viewfinder pan delta, normalised. Desktop: 0. */
  readonly panDx: number;
  readonly panDy: number;
  /** Signed focal input this frame (wheel notches / pinch delta), device-normalised. */
  readonly focalDelta: number;
  /** Consumed EDGE, one per press — never a level. */
  readonly shutter: boolean;
  /** D-B: the single posture intent. Desktop = Space held; mobile = toggle latch. */
  readonly raiseIntent: boolean;
  readonly skipBriefing: boolean;
  readonly cta: "continue" | "retry" | "decline" | null;
  readonly reducedMotion: boolean;
}
```

**Note on `NarrativeLine`:** it currently lives in `@game/systems/narrativeSystem`. `types/`
must not depend on `systems/` (`types/level.ts` doc-comment states the rule). **Lane A moves the
`NarrativeLine` / `NarrativeScene` _type declarations_ to `src/game/types/narrative.ts` and
re-exports them from `narrativeSystem.ts`** — a pure type move, zero behaviour, one import line
for every existing consumer. If that move is judged out of scope by `producer`, the fallback is
`briefingLines: readonly PhotoBriefingLine[]` (a structural clone) — rejected here as a
gratuitous second vocabulary for the same thing.

### 2.2 `src/game/types/photoLeverage.ts` — the carry value, alone in its own module

```ts
/**
 * What the roll bought, as it crosses a level boundary (ADR-0080). Three values today
 * (design gate R2-4); the storage shape is an OBJECT so the deferred `PARIS-MINUIT`
 * UNE variant (E-5 / F-2) adds a `hasPlaque` FIELD, never a migration.
 */
export type PhotoLeverage = "none" | "master" | "master-bonus";

/** Authored on the Niveau Final `bossQteSpec` row (E-4f). Absent ⇒ ×1.00 everywhere. */
export interface PhotoLeverageTiers {
  readonly master: number; // ×0.90
  readonly masterBonus: number; // ×0.80
}
```

### 2.3 `src/game/systems/photoQteSystem.ts` — the machine

```ts
export function createPhotoQte(spec: PhotoQteSpec): PhotoQte; // asserts F1–F13
export function isPhotoQteActive(qte: PhotoQte | null): boolean; // phase ∉ {DONE, EXITED}
export function shouldTriggerPhotoQte(
  spec: PhotoQteSpec | null,
  qte: PhotoQte | null,
  elapsedSeconds: number,
): boolean;

export interface PhotoQteTickResult {
  readonly qte: PhotoQte;
  /** Set on the tick the player leaves; the bridge persists it (ADR-0080). */
  readonly settled: PhotoLeverage | null;
  /** true on the tick a shutter actually exposed a frame — the render's click/flash cue. */
  readonly exposed: { readonly focusHeld: boolean } | null;
}

export function tickPhotoQte(qte: PhotoQte, input: PhotoInput, delta: number): PhotoQteTickResult;

/** THE single evaluator (D-C, E-4d, F12(1a)). Total on [0, sceneDuration] (F12(3)). */
export function subjectBoxAt(track: readonly SubjectKeyframe[], t: number): Box;

/** Pure reads used by the tick AND by the floor asserts — never re-implemented. */
export function inCover(cover: CoverWindows, t: number, sceneDuration: number): boolean;
export function instantAt(instants: readonly PhotoInstant[], t: number): PhotoInstant | null;
export function swayOffsetAt(
  seed: number,
  raiseIndex: number,
  raisedElapsed: number,
  reducedMotion: boolean,
): { x: number; y: number };

/** R2-4: derived from the frame records, NOT a stored flag, NOT a tier change. */
export function hasPlaqueBonus(frames: readonly PhotoFrameRecord[]): boolean;
export function photoOutcomeOf(frames: readonly PhotoFrameRecord[]): PhotoLeverage;
```

**The five tests (§2.2), in this order, in `tickPhotoQte`, on the state the render DREW**
(WYSIWYG classify order: resolve the input against last frame's drawn state, _then_ advance the
sim — the house rule, same as the hostage duel):

| Test | Where it lives                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1   | `posture === "RAISED" && raisedElapsed >= SHUTTER_ARM_SECONDS` — fail ⇒ input swallowed, **no record, no film, no suspicion, no `exposed` event** |
| T2   | `instantAt(spec.instants, sceneClock)` ⇒ candidate or `null` — **never surfaced live**                                                            |
| T3   | `subjectBox` fully inside `viewfinder` with `FRAME_MARGIN` clear on all four sides                                                                |
| T4   | `fill = max(B.w/V.w, B.h/V.h) ∈ [FILL_MIN, FILL_MAX]`                                                                                             |
| T5   | `composition.focusHeldSeconds >= FOCUS_HOLD` (T3∧T4 continuity, reset to 0 on any break)                                                          |

`FILL_MAX` is **derived** (`1 − 2 × FRAME_MARGIN`), never authored twice (spec §3.2).
`SWAY_AMP_Y` is **derived** (`SWAY_AMP_X / 1.7778`), never authored twice (§3.3).
`SWAY_AMP_X = 2.00` carries the R2-1 ceiling comment (`≤ 2.10 su`) **next to the constant**.

**Floors F1–F13 are asserted in `createPhotoQte`, against the authored data, and throw** — the
house discipline (ADR-0035 D2, ADR-0034 G4/G5), the same posture `createBossQte` already takes.
F12(1)(b) (drawn == box) is **not** assertable in a unit test: it becomes a CI script, §7.

**Determinism (F11):** no `Math.random`, no `Date.now`, no per-tick PRNG cursor. `swayOffsetAt`
is closed-form in `(swaySeed, raiseIndex, raisedElapsed)` and consumes `hash32`/`smoothstep`
from the extracted kernel (D-H). Reduced motion swaps the easing to linear and the leg duration
to `SWAY_LEG_DURATION_RM`, **amplitudes identical** (spec §3.4) — so every §7 floor is
byte-identical between the two modes by construction, which is the point.

### 2.4 `src/game/systems/photoLeverageSystem.ts` — the carry ALGEBRA (pure half of ADR-0080)

```ts
/** Total: unknown / corrupt / absent all read as "none". Never throws (ADR-0076 D4 posture). */
export function parsePhotoLeverage(raw: string | null): PhotoLeverage;
/** Monotone: only ever upgrades (none < master < master-bonus). Idempotent. */
export function mergePhotoLeverage(a: PhotoLeverage, b: PhotoLeverage): PhotoLeverage;
/** The tier lookup. Absent tiers ⇒ 1.0. `"none"` ⇒ 1.0. Never a module constant (E-4f). */
export function photoRewardMultiplier(
  tiers: PhotoLeverageTiers | undefined,
  leverage: PhotoLeverage,
): number;
export const PHOTO_LEVERAGE_STORAGE_KEY = "muf_leverage";
```

### 2.5 `src/game/systems/hash.ts` — the extracted determinism kernel (D-H)

`hash32(a, b, c)` and `smoothstep(u)`, moved verbatim. Consumers: `qteSystem.ts`,
`bossQteSystem.ts`, `photoQteSystem.ts`. Golden-vector test lands **before** the move.

### 2.6 Wiring into `stateMachine.ts`

- `LevelParams` gains `photoQte?: PhotoQteSpec | null` and `photoLeverage?: PhotoLeverage`.
- `createInitialState` seeds `photoQteSpec`, `photoQte: null`, and
  `photoLeverage: params.photoLeverage ?? "none"` on `GameState`.
- **New block 1a, placed BEFORE the hostage block (1b)**, mirroring it exactly:

```ts
let photoQte = state.photoQte;
if (
  shouldTriggerPhotoQte(state.photoQteSpec, photoQte, elapsedSeconds) &&
  state.photoQteSpec !== null
) {
  photoQte = createPhotoQte(state.photoQteSpec);
}
if (isPhotoQteActive(photoQte) && photoQte !== null) {
  const r = tickPhotoQte(photoQte, photoInput, delta);
  return {
    ...state,
    crosshair, // the pointer still moves; nothing else does
    elapsedSeconds: state.elapsedSeconds, // frozen — the beat is outside time
    photoQte: r.qte,
    // F8, asserted as a ZERO-DELTA test: energy, score, lives, kills, quota untouched.
    impactEvents: [],
    feedback: [],
    pointFeedback: [],
    playerHitEvents: [],
    weaponEmpty: false,
  };
}
```

- On `phase === "EXITED"` the next tick sets `photoQte: null` and falls through to the ordinary
  path — the level resumes exactly where it froze (E-4g).
- **`photoInput`** is a new trailing optional parameter of `tickGameState`
  (`photoInput: PhotoInput = NEUTRAL_PHOTO_INPUT`), so every existing caller and every existing
  test compiles unchanged.

**E-4(c) — byte-identity, restated correctly for Rev.3.** The Rev.2 wording said "run N ticks of
Belliard with and without the new code path". **Belliard is now the host level: it authors the
spec, so it is precisely the one level that is NOT byte-identical.** The guarantee is unchanged in
substance — the additive-and-optional law of `bossQteSpec` / `lootSpec` — but it must be stated
about the right set, in three parts, each with its own test:

1. **Every level that authors no `photoQte` is tick-identical to `main`.** That is the tutorial,
   Vitry, Stalingrad, the Niveau Final and the dev harness. The trigger predicate returns `false`
   on a null spec, the block is never entered, outputs match tick-for-tick. This is the classic
   identity test (`niveauFinal.test.ts` / `deliveryAssault.test.ts` pattern) and it simply **runs
   on Vitry and Stalingrad instead of Belliard**.
2. **Belliard is tick-identical to `main` with its `photoQte` field removed.** Same test, same
   pattern, applied to the host row: the level's own behaviour is unchanged by the feature's
   presence in the codebase — only by the presence of the authored spec on its row. This is the
   test that actually protects level 1.
3. **Belliard is tick-identical to `main` ACROSS the set-piece, measured on the level clock.**
   Because the block freezes `elapsedSeconds` and returns `...state` untouched (F8), Belliard's
   state at level-clock `T` after the set-piece has opened, run and exited equals `main`'s state at
   `T` — every field except `photoQte` / `photoLeverage`. That is A-T7's zero-delta test extended
   to the host level, and it is the honest form of "the set-piece changes nothing".

Stated plainly for the review panel: **Belliard gains the spec; the guarantee is that the spec is
the ONLY thing it gains.** Anything else that differs is a bug this triple test catches.

### 2.7 `validateLevel.ts` — one new structural invariant (**rewritten Rev.3**)

> **Withdrawn:** Rev.2's `photo-hostage-exclusive` (a level may not author both `photoQte` and
> `hostageQte`). It rested on "Stalingrad has no hostage duel"; the host level is now Belliard,
> which **does** have one, plus a boss finale. The rule would reject the host row. See D-K.

`photo-setpiece-ordering` (**error**), the exact analogue of `hostageBossMarginIssue` — a
**sequencing** rule, not a ban. When a level authors `photoQte`:

- `photoQte.triggerAtElapsedSeconds` must be **strictly less** than
  `hostageQte.triggerAtElapsedSeconds − SAFETY_MARGIN_SECONDS` when a hostage QTE is authored;
- `photoQte.triggerAtElapsedSeconds` must be **strictly less** than
  `timeSeconds − SAFETY_MARGIN_SECONDS`, so the boss finale (created at timer expiry) can never
  win the race — and so a spec authored past the level's end is caught at load instead of never
  firing in silence.

`SAFETY_MARGIN_SECONDS` is the constant `validateLevel.ts` already exports for the hostage/boss
rule; it is reused, not re-typed. On Belliard (`hostage 12`, `timeSeconds 90`) this pins the photo
trigger below ~10 s, which is exactly D-K's `[2, 8]` recommendation, derived rather than asserted.

**Why an invariant AND a runtime guard, not one of the two.** The guard (D-K) makes a collision
**impossible**; the invariant makes a **starvation** visible. A photo spec that can never fire is
not a crash — it is a set-piece that silently does not exist, which is the failure mode a
data-driven level system produces most easily and reports least loudly.

The floors F1–F13 stay in `createPhotoQte` (they are tuning invariants, not level-shape
invariants) — `validateLevel` gets no copy of them.

---

## 3. The seam (bridge ↔ render) — the only cross-lane contract

Two transports, both mirroring shipped precedents. Both are **authored by Lane A** and consumed
by Lane B, so the lanes never edit the same file.

### 3.1 `PhotoControlChannel` — render → bridge (new; mirror of `ImpactChannel`, reversed)

Exported from `src/hooks/useGameLoop.ts`, created by `GameScene.tsx` (render), passed to both
`useGameLoop` and the DOM controls. It carries the inputs that have no keyboard/mouse home: the
mobile raise toggle and the contact-sheet CTAs.

```ts
export interface PhotoControlChannel {
  /** Mobile posture LATCH (tap-to-toggle, T-2). The bridge READS it; the button writes it. */
  raiseToggle: boolean;
  /** One-shot CTA press, drained by the bridge on the next tick. */
  pendingCta: "continue" | "retry" | "decline" | null;
  /** One-shot briefing skip. */
  pendingSkip: boolean;
}
```

**T-5 lives here, in one line:** on the frame `paused` goes true, the bridge sets
`raiseToggle = false`. Desktop needs nothing (Space is not held behind the overlay). Both
devices therefore resume `LOWERED`, focal retained (it lives in `photoQte`, untouched), shutter
re-arming on the next raise — UX A9(b) satisfied by construction.

### 3.2 New input channels (additive, on shipped hooks)

| Channel                 | File                                                   | Shape                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop focal (wheel)   | `src/hooks/useMouse.ts`                                | `wheelDelta: number` on `MouseState`, accumulated by a `wheel` listener, **zeroed by the loop each frame** (same consume-once posture as `pendingShots`) |
| Desktop posture (Space) | `src/game/types/input.ts` + `src/hooks/useKeyboard.ts` | `raise: boolean` on `KeyboardState` (`" "` keydown/keyup, plus `blur` ⇒ false)                                                                           |
| Mobile focal (pinch)    | `src/hooks/useTouchControls.ts`                        | **`pinchDelta: number`** — the per-frame spread-ratio delta, written by the SAME pinch handler that commits `zoom`, consumed and zeroed by the reader    |
| Mobile pan / shutter    | `src/hooks/useTouchControls.ts`                        | **unchanged** — `panDeltaX/Y` and `pendingTaps` are reused as-is                                                                                         |
| Mobile posture          | `PhotoControlChannel.raiseToggle`                      | §3.1                                                                                                                                                     |

**Why `pinchDelta` and not `touch.zoom`:** `zoom` is the _committed camera fraction_, clamped to
`[MIN_ZOOM_FRACTION, MAX_ZOOM_FRACTION]` and owned by the camera path. Re-purposing it as a focal
axis would saturate at the camera's clamp long before 300 mm and would couple two unrelated
zooms. `pinchDelta` is additive, costs one accumulator, and leaves the camera path byte-untouched.

**Flick is disabled inside the set-piece by construction (UX §1.1):** the inertial-pan block in
`useGameLoop` is already skipped while a QTE holds the scene, and the photo input builder reads
`panDeltaX/Y` **only** — it never reads `flickVelocityX/Y`. Lane A additionally **clears
`flickVelocityX/Y` on the trigger tick**, so a flick armed one frame before the set-piece opens
cannot fire into the street when it closes.

### 3.3 The three QTE-active guards that must learn about the photo QTE

`isPhotoQteActive(state.photoQte)` joins the existing
`isQteActive(prev.qte) || isBossQteActive(prev.bossQte)` disjunction at exactly three sites —
missing one is the bug this list exists to prevent:

1. `useGameLoop.ts` ≈ 344 — the mobile pinch→`ortho.zoom` application (the photo pinch must
   drive focal, never the camera).
2. `useGameLoop.ts` ≈ 366 — the mobile inertial camera pan.
3. `GameScene.tsx:389` — the desktop edge-scroll.

Lane A owns (1) and (2); Lane B owns (3). Pinned here so neither lane assumes the other did it.

### 3.4 `HudData` extension (DOM HUD projection)

`src/render/ui/hud/types.ts` gains, in the shape of the existing `HudHostageQte`/`HudBossQte`
projections — **view values only, no rule, and nothing semantic while `ACTIVE`**:

```ts
export interface HudPhotoQte {
  phase: PhotoQtePhase;
  posture: PhotoPosture;
  film: number; // the diegetic dial's numeral (UX §2.1)
  suspicion: number; // 0..SUSPICION_MAX — needle ANGLE only, never printed (A7)
  focalMm: number; // the "300 mm" engraved label (fiction §4.2)
  bracket: "dashed" | "solid" | "locked"; // the three states (T-1)
}
```

`HudData.photoQte?: HudPhotoQte | undefined`, present only while `isPhotoQteActive`. The contact
sheet is **not** in `HudData` — it is a screen, and it reads `photoSheetView(qte)` (§D-D) off the
state ref like `EndScreen` reads `runSummary`.

**`HudData.photoOutcome?: PhotoLeverage`** is pushed on the tick `tickPhotoQte` returns
`settled !== null` — that is the signal `App.tsx` persists on (§5.3).

---

## 4. The boss lever — E-4(f), amendment A1, in code

### 4.1 The trap, named precisely

`shieldedLullSeconds` and `telegraphLeadSeconds` are **module constants** in `BOSS_PHASE_TABLE`
(`bossQteSystem.ts:271`), **shared by Belliard and the Niveau Final**. There is no per-level
tuning row today. So:

- Applying the multiplier to the table, or to `phaseTuning()`, hits **both** encounters — the
  exact failure mode the design pinned ("the shield-break story's K-2 already burned this crew
  once on a system constant that reached both live encounters"). **Forbidden.**
- **Rev.3 sharpens this to the point of absurdity, which is a gift.** The leverage is now earned on
  **Belliard**, and Belliard's own boss finale reads that same shared table **in the same run,
  minutes later**. A multiplier applied to the table would compress the boss of the very level the
  player just photographed — a bug so immediate that it would ship as a feature. The authored-row
  decision does not change; its stakes do, and the "Belliard identical at every leverage value"
  test (§4.3) stops being belt-and-braces and becomes the load-bearing assertion of §4.
- The multiplier must therefore be **authored data on the Niveau Final row**, resolved into the
  **runtime record**, and applied at the point of use.

### 4.2 The contract

**`src/game/types/bossQte.ts`:**

```ts
export interface BossQteSpec {
  // …existing fields, untouched…
  /**
   * Photo-proof leverage tiers (ADR-0080, amendment A1 to spec-boss-shield-break-tempo-shot.md).
   * Authored on the Niveau Final row ONLY. Absent ⇒ ×1.00 at every leverage value ⇒ the
   * encounter is byte-identical (Belliard and the dev harness author none).
   */
  readonly photoLeverageTiers?: PhotoLeverageTiers;
}

export interface BossQte {
  // …existing fields, untouched…
  /** Resolved ONCE at createBossQte from (spec.photoLeverageTiers, leverage). 1.0 default. */
  readonly rewardMultiplier: number;
}
```

**`src/game/systems/bossQteSystem.ts`:**

```ts
export const LULL_RESIDUAL_FLOOR = 0.35; // ε — a QUOTATION of §6-B's own worst shipped
// headroom (phase 3: 0.70 − 0.35), not a preference.

/** THE single application point of the multiplier. Phase-scoped: index 0,1 only (R2-2). */
function shieldedLullOf(row: BossPhaseTuning, phaseIndex: number, m: number): number {
  return phaseIndex <= 1 ? m * row.shieldedLullSeconds : row.shieldedLullSeconds;
}

export function createBossQte(spec: BossQteSpec, leverage: PhotoLeverage = "none"): BossQte;
```

**Every raw read of `row.shieldedLullSeconds` in the tick is replaced by `shieldedLullOf(...)`.**
There are exactly **three**, and they are listed so none is missed:

| Site                      | What it is                                |
| ------------------------- | ----------------------------------------- |
| `bossQteSystem.ts` ≈ 1116 | `ZOOMING → ACTIVE`, first `SHIELDED` lull |
| `bossQteSystem.ts` ≈ 1290 | phase-break end → resume cycling          |
| `bossQteSystem.ts` ≈ 1317 | ordinary `EXPOSED → SHIELDED` close       |

Plus the shield-break branch at ≈ 1323-1325, which becomes **amendment A1 point 2's exact order**:

```ts
// 1) multiplier (phases 1-2 only)   2) the gated cut   3) the existing clamp — in THIS order.
const base = shieldedLullOf(closingRow, phaseIndex, qte.rewardMultiplier);
stanceRemaining = base;
if (shieldBreakPending) {
  const floor = closingRow.telegraphLeadSeconds + SHIELD_BREAK_LULL_FLOOR_MARGIN;
  stanceRemaining = Math.max(base - SHIELD_BREAK_LULL_CUT, floor);
  shieldBreakPending = false;
}
```

The two `createBossQte` sanity reads (≈ 869 `surgeLull`, ≈ 897 `firstLull`) must use the same
helper or be shown to be multiplier-independent — Lane A states which, in a comment, per site.

### 4.3 The compound floor (F10), asserted at construction, **non-strict `≥`**

In `createBossQte`, over phases `p ∈ {0, 1}` of the **runtime** row (never the authored data
alone), with `m = rewardMultiplier`:

```
m × shieldedLullSeconds(p) − SHIELD_BREAK_LULL_CUT  ≥  telegraphLeadSeconds(p) + LULL_RESIDUAL_FLOOR
```

**The `≥` is non-strict on purpose and must not be "tightened" in review** (R2-2, binding pin):
with ε pinned by quotation, phase 3 at ×1.00 sits at **exactly** `0.70 = 0.35 + 0.35`, so a
strict `>` would fail the **shipped baseline**. The assert message carries that sentence, so the
next reviewer reads the reason at the failure site rather than in a document.

**A derived property worth having, and it is free.** `LULL_RESIDUAL_FLOOR (0.35) >
SHIELD_BREAK_LULL_FLOOR_MARGIN (0.05)`. So any multiplier that passes the construction-time
compound assert leaves `base − CUT ≥ tell + 0.35 > tell + 0.05 = floor`, i.e. **the runtime
`Math.max(…, floor)` clamp is provably unreachable at every legal multiplier.** That turns
AC12's "the −0.5 s cut is observed to actually apply, never silently clamped away" from a
playtest hope into a **structural** guarantee, and it is the cleanest possible answer to K-3.
Lane A writes it as a comment at the clamp and as a unit test at ×0.80.

**Phase 3 byte-identity (AC12, R2-2's second pin):** a test asserts that at ×1.00, ×0.90 and
×0.80 the phase-3 lull, tell, exposed duration and drain are **identical**, and that Belliard's
whole `BossQte` timeline is identical at every leverage value (it authors no tiers, so the
multiplier resolves to 1.0 — but the test states it, because "it can't happen" is what K-2 said).

### 4.4 Authored values (transcribed, not invented)

`levels.data.ts`, Niveau Final row only:
`photoLeverageTiers: { master: 0.90, masterBonus: 0.80 }`. Belliard, Vitry, Stalingrad, tutorial
and the dev harness author **none**. The legal wall (`m ≥ ×0.781`, phase 2 binds) is enforced by
the §4.3 assert, not by a comment.

**Rev.3:** Belliard authors the `photoQte` **and no tiers** — the two fields are independent and
land on the same row. The player can therefore hold `master-bonus` while fighting Belliard's own
Commandant, and that encounter resolves to **×1.00** by absence. The §4.3 test asserts it at all
three leverage values; it is now a real scenario rather than a hypothetical one.

---

## 5. The cross-level carry — E-4(e), and why it is ADR-0080

### 5.1 What the code actually says today

- **There is no run that spans levels.** ADR-0076 F1 is explicit: "a run is one attempt on one
  level". `RunStats` is reset by construction at `createInitialState`.
- **Levels are separated by the menu.** `App.tsx` `handlePlay(levelId)` mounts a fresh
  `GameScene`; **Rev.3 — between Belliard and the Niveau Final the player crosses the end screen,
  the menu, narrative screens, TWO further levels (Vitry, Stalingrad), any number of retries, and
  any number of browser reloads.**
- The only shipped cross-level state is `muf_progress` (unlocked ids) — persisted, monotone.

So "run-scoped" as the design means it (**Rev.3: "this playthrough, Belliard → Niveau Final"**) has
**no existing home**. In-memory React state would silently lose the leverage on any reload, which
means a player could earn the proof and then meet a baseline boss with no explanation — a bug
report that reads as "the reward doesn't work".

**The relocation does not weaken this reasoning — it removes the last doubt about it.** Under
Rev.2 the gap was one menu transition; under Rev.3 it is two whole levels and, realistically,
several play sessions. Any in-memory scheme now fails **by default** rather than in an edge case,
and "persisted, monotone, own key" stops being the conservative choice and becomes the only one.

### 5.2 The decision (full rationale in ADR-0080)

**Persisted, monotone, its own key, pure algebra + bridge I/O — the ADR-0076 D4 posture.**

| Concern            | Decision                                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage key        | `muf_leverage` — a sixth, distinct `muf_*` key. Never read/written by prefs, progress, scores, funnel.                                                                                                                                                              |
| Blob shape         | `{ "v": 1, "leverage": "master-bonus" }` — an **object**, so the deferred `hasPlaque` bit (E-5 / R2-4) is an added FIELD, not a migration.                                                                                                                          |
| Parse              | Total (`parsePhotoLeverage`): absent / corrupt / unknown ⇒ `"none"`. Never throws.                                                                                                                                                                                  |
| Merge              | Monotone (`none < master < master-bonus`), idempotent. A later worse roll never downgrades an obtained proof. **Rev.3: load-bearing.** Belliard is level 1 and always unlocked, so replaying it (and declining the set-piece) is the NORMAL case, not an edge case. |
| Pure half          | `src/game/systems/photoLeverageSystem.ts`                                                                                                                                                                                                                           |
| Impure half        | `src/hooks/photoLeverageStorage.ts` (`loadPhotoLeverage` / `recordPhotoLeverage`), try/catch-swallow                                                                                                                                                                |
| When it is written | on the tick `tickPhotoQte` returns `settled !== null` — i.e. when the player **leaves** the set-piece, whatever the exit. The photograph exists the moment it is in the box; the leverage is **not** contingent on surviving **Belliard**.                          |
| When it is read    | `App.tsx handlePlay` → `LevelParams.photoLeverage` → `GameState.photoLeverage` → `createBossQte`                                                                                                                                                                    |

**Why "written at DONE, not at level clear":** making the reward contingent on clearing
**Belliard** would couple an explicitly optional bonus to a mandatory success — pressure the whole
K-4 correction exists to remove. Recorded as ADR-0080's one policy call, flagged to `pm` (§8 Q-2).
**Rev.3 strengthens it:** on level 1, with the set-piece firing in the first ten seconds, dying to
the street afterwards is not an edge case but the _likely_ outcome for a new player. Banking at
level clear would mean most first-time photographers lose the proof they just took. **Q-2 remains
open for `pm`** — the relocation gives it a better argument, not a decision.

### 5.3 The path, end to end

```
tickPhotoQte → settled: PhotoLeverage        (pure, src/game)
  → useGameLoop projects HudData.photoOutcome (bridge)
    → App.tsx effect: recordPhotoLeverage(o)  (src/hooks, localStorage)
      … menu, narrative, Vitry, Stalingrad, retries, sessions, reloads …
        → handlePlay("niveau-final"): loadPhotoLeverage()
          → LevelParams.photoLeverage
            → createInitialState → GameState.photoLeverage
              → createBossQte(spec, leverage) → BossQte.rewardMultiplier
                → shieldedLullOf(row, phaseIndex, m)   [phases 1-2 only]
```

Every arrow is an existing shape (the funnel takes the identical route). Nothing new is invented
except the key and the value type.

**3-valued today, and the upgrade price is written down (R2-4's trap):** `PhotoLeverage` has
three values because the plaque's payoff (fiction variant (b)) is chosen **on the contact sheet,
in-scene, with the frames still in hand** — `hasPlaqueBonus(frames)` is a local derivation, not a
carried fact. Un-deferring the `PARIS-MINUIT` UNE variant moves that read to the **scores
screen**, a different level and a different surface, at which point the carry needs a `hasPlaque`
field. Cost, stated so `pm` can price E-5 honestly: one field on the blob (the parse is already
total, so old blobs read as `false`), one field on `PhotoLeverage`'s carrier, one read at the
scores screen. **It is not a 2-string change, but it is not a migration either.**

---

## 6. Lane briefs — file-by-file, non-overlapping

### Lane A — `dev-gameplay` (owns `src/game/**` + `src/hooks/**`; TDD; runs FIRST)

**A0 — the seam slice (lands and releases before B and C need it, ~half a day).**

- **CREATE** `src/game/types/photoQte.ts` (§2.1), `src/game/types/photoLeverage.ts` (§2.2).
- **MOVE** the `NarrativeLine` / `NarrativeScene` type declarations to
  `src/game/types/narrative.ts`, re-exported from `narrativeSystem.ts` (D-G note). Pure type
  move, zero behaviour.
- **MODIFY** `src/hooks/useGameLoop.ts`: export `PhotoControlChannel` (§3.1).
- Release: Lanes B and C unblock here.

**A1 — the determinism kernel (D-H), before anything hashes.**

- **CREATE** `src/game/systems/__tests__/hash.test.ts` — golden vectors for `hash32` over a fixed
  triple table and `smoothstep` at u ∈ {0, ¼, ½, ¾, 1}. **Written first, against the current
  bodies.**
- **CREATE** `src/game/systems/hash.ts`; **MODIFY** `qteSystem.ts` and `bossQteSystem.ts` to
  import it and delete their local copies. Regression = the shipped seed pins (`19940715`,
  `19991232`) and the existing QTE/boss suites, which must stay green **unchanged**.

**A2 — the photo machine (the bulk).**

- **CREATE** `src/game/systems/photoQteSystem.ts` (§2.3) + `__tests__/photoQteSystem.test.ts`.
  TDD order: `subjectBoxAt` totality/interpolation → `inCover`/`instantAt` → the five tests →
  sway closed form → the phase machine → the exits → the floors.
- **Tests that are not optional** (they are the gate's own pins):
  - **A-T1 (E-4a)** — N ticks with `paused` never reach the tick ⇒ `photoQte` byte-identical.
    Asserted at the `useGameLoop` level (the `if (paused) return` is the mechanism).
  - **A-T2 (E-4b/D8/AC4)** — `photoSceneView(qte)` has **no** field whose value differs between
    a `locked` frame on `NO_SUBJECT` and a `locked` frame on the master instant. Structural, not
    a screenshot.
  - **A-T3 (F12(1a)/AC6b(a))** — the brackets' box and T3/T4's box are the **same object
    reference** carried on `photoQte.subjectBox`. One call site, provable.
  - **A-T4 (F12(2)/AC6b(b))** — `subjectBoxAt` is byte-constant on `[closeAt(n), tell(n+1)]` for
    both dead beats, over the authored table.
  - **A-T5 (F12(3)/AC6b(c))** — total and inside the plate for every `t ∈ [0, 60]`, keyframes
    exactly on 0 and 60.
  - **A-T6 (AC6b(e))** — a release fired during any of the three transits returns `no-subject`,
    whatever the composition says.
  - **A-T7 (F8/AC11/E-4c)** — zero-delta, in the three parts of §2.6: `SPOTTED` moves no energy,
    no score, no lives, no kills, no quota; a `photoQteSpec === null` level (**Vitry, Stalingrad**)
    is tick-identical to `main` over N ticks; **Belliard with its `photoQte` field stripped** is
    tick-identical to `main`; and **Belliard across the whole set-piece** matches `main` field for
    field at equal level-clock, `photoQte` / `photoLeverage` excepted.
  - **A-T8 (AC2)** — shutter while lowered or unarmed: zero film, zero suspicion, zero record,
    zero `exposed` event. Focal retained across a lower/raise (D1.a); re-arm takes 0.40 s (D1.b).
  - **A-T9 (AC7)** — two silent shutters do not spot; the third does. A covered shutter moves the
    needle by exactly 0. Suspicion frozen while lowered.
  - **A-T10 (AC10)** — same seed + same input sequence ⇒ byte-identical scene across two runs
    **and across delta chunking** (1/60 vs 1/30 vs jittered), retry N identical to retry 1.
  - **A-T11 (F1–F13)** — each floor breached by a mutated authored fixture ⇒ `createPhotoQte`
    throws with a named message. One test per floor.
  - **A-T12 (D-K, Rev.3) — the Belliard coexistence suite.** Four assertions, on the real row:
    (a) the photo QTE **never** triggers while `hostageQte` or `bossQte` is active, even when its
    authored threshold is (adversarially) set below the frozen `elapsedSeconds` of a live duel;
    (b) after the set-piece exits, the hostage still triggers at **12 s of played time** and the
    truck delivery still at **20 s** — the frozen clock costs the level timer zero;
    (c) `hostageBossMarginIssue` and the `createInitialState` margin assert return **the same
    verdict** on the Belliard row with and without the `photoQte` field;
    (d) `validateLevel` **rejects** a Belliard row whose photo trigger is authored after the
    hostage's, and after `timeSeconds` (§2.7), with the named codes.
- **MODIFY** `src/game/types/gameState.ts` (`photoQteSpec`, `photoQte`, `photoLeverage`),
  `src/game/systems/stateMachine.ts` (§2.6 + the D-K trigger guard), `src/game/types/level.ts`
  (`photoQte?`), `src/game/levels/validateLevel.ts` (§2.7), `src/game/levels/levels.data.ts`
  (**Rev.3 — the BELLIARD row's `photoQte`**, beside its existing `hostageQte` / `loot` /
  `bossQteSpec`, **and** the Niveau Final's `photoLeverageTiers`).
- **Briefing/aftermath scene ids are `belliard_photo_pre` / `belliard_photo_post`** (fiction Rev.3
  §9.0), backdrop `assets/levels/belliard/facade.png` — an already-manifested asset, so the
  narrative surface costs Lane C nothing new.

**A3 — the boss lever + the carry (§4, §5).**

- **MODIFY** `src/game/types/bossQte.ts`, `src/game/systems/bossQteSystem.ts` (§4.2/§4.3),
  `src/game/systems/__tests__/bossQteSystem.test.ts`, `src/game/levels/__tests__/niveauFinal.test.ts`
  (phase-3 byte-identity at every tier; Belliard identical at every tier).
- **CREATE** `src/game/systems/photoLeverageSystem.ts` + tests;
  `src/hooks/photoLeverageStorage.ts` (mirror `runFunnelStorage.ts` verbatim in posture).

**A4 — the bridge.**

- **MODIFY** `src/hooks/useMouse.ts` (`wheelDelta`), `src/hooks/useKeyboard.ts` +
  `src/game/types/input.ts` (`raise`), `src/hooks/useTouchControls.ts` (`pinchDelta`),
  `src/hooks/useGameLoop.ts`: assemble `PhotoInput` (D-B), drain the `PhotoControlChannel`, clear
  `raiseToggle` on pause (T-5), clear `flickVelocity*` on the trigger tick, extend the two
  QTE-active guards (§3.3 sites 1-2), project `HudData.photoQte` + `HudData.photoOutcome`.

**Honor:** boundary law — **zero** React/Three in `src/game`; zero device vocabulary in
`src/game`; no `Math.random`/`Date.now` anywhere in the new code. **Do not touch `src/render/**`,
`levelArt.json`, `assetManifest.ts`or`scripts/`.\*\*

### Lane B — `dev-r3f-render` (owns `src/render/**` only; consumes the seam)

**Starts after A0.** The DOM surfaces (contact sheet, HUD dress, mobile button) can be built
against the A0 types before A2 exists.

- **CREATE** `src/render/scene/PhotoQteView.tsx` — the full-screen telephoto surface. Draws the
  plate, the key-pose sprites, the viewfinder crop at `qte.viewfinder`, and the three-state AF
  brackets at `qte.subjectBox` — **all read off the state ref, none recomputed**. `LOWERED`
  draws the whole plate; `RAISED` draws `V`. **No screen shake, ever** (spec §6.1 — shake is
  indistinguishable from sway and would corrupt the only signal the player reads).
- **CREATE** `src/render/scene/photoTextures.ts` — plate + pose texture loading (mirror
  `bossTextures.ts`). Paths come from the manifest helper Lane C authors; this file never
  hardcodes one.
- **CREATE** `src/render/ui/photo/PhotoHud.tsx` + `.module.css` — the diegetic dress (film dial
  with its numeral, suspicion needle, `300 mm` label), CSS Modules + print tokens per ADR-0046
  (use the `hud-css` skill). **A7: no numeral for suspicion, sway or the hold timer, anywhere.**
- **CREATE** `src/render/ui/photo/ContactSheet.tsx` + `.module.css` — 2×3 grid, three verdict
  stamps, and the **R2-5 CTA shape, verbatim**: master branch = **exactly one** `[ CONTINUER ]`;
  no-master branch = **two peer controls**, same row, identical visual weight (same size, same
  treatment, same type scale, **neither styled primary**), both ≥ 44×44 CSS px with visible
  spacing, **initial keyboard/gamepad focus on `[ RECOMMENCER ]`**, `[ LAISSER TOMBER ]` one
  press away at all times, never nested, never behind a confirmation, never on a second screen.
  Shipped strings are Yasmine's (C-3) — `Continuer`/`Réessayer`/`Décliner` are **role names**.
- **CREATE** `src/render/ui/controls/PhotoRaiseButton.tsx` — mobile only, tap-to-toggle, ≥ 56 px,
  two code-drawn icon states (ADR-0020 precedent), writes `PhotoControlChannel.raiseToggle`.
- **CREATE** `src/render/ui/photo/PhotoBriefing.tsx` — the `BRIEFING` phase's lines (D-G), reusing
  the shipped narrative widget vocabulary, skippable in one press.
- **MODIFY** `src/render/scene/GameScene.tsx` — create the `PhotoControlChannel` ref, pass it to
  `useGameLoop` and the controls, mount `<PhotoQteView>`, extend the edge-scroll guard (§3.3
  site 3).
- **MODIFY** `src/render/ui/hud/types.ts` + `HUD.tsx` — the `HudPhotoQte` projection (§3.4).
- **MODIFY** `src/render/scene/App.tsx` — `handlePlay` seeds `LevelParams.photoLeverage` from
  `loadPhotoLeverage()`; a new effect persists `recordPhotoLeverage(hudData.photoOutcome)` when
  it appears (mirror of the funnel write, same idempotence guard).

**Honor:** **the render decides nothing.** No containment test, no fill computation, no verdict,
no device fork, no second subject-box source. The bracket state is read, not derived. Reduced
motion is already in the tick's numbers (spec §3.4) — the render must **not** add a second
reduced-motion branch to the sway. **Verify:** `/verify` for A1–A15 (+ A3bis, A7bis, A14bis) at
both device classes; grayscale captures for A6/A13.

### Lane C — `dev-tooling-assets` (owns `src/game/levels/levelArt.json`, `src/game/systems/assetManifest.ts`, `scripts/**`)

**Named exception to "Lane A owns `src/game/**`":** `assetManifest.ts` is asset-pipeline
plumbing with no game rule, and it is Lane C's file **for the duration of this story**. One file,
one owner. Lane A does not touch it.

**Rev.3 — what the relocation does and does not cost this lane.** Lane C never had a level to
build (Stalingrad is a shipped row; the lane's deliverables were always the art entries, the
manifest wiring and the CI script), so **no deliverable is deleted**: the dedicated telephoto
plate, the key-pose sprites and the contact sheet all stand. Two things genuinely change, one
cheaper and one more expensive:

- **Cheaper — the art brief stops inventing a place and starts re-framing one.** The plate is now
  a plunging view of a location the player has panned a hundred times: the passage mouth
  (`x_norm 0,372–0,408`), the boulangerie in amorce (`0,340`), the feu tricolore (`0,388`), the
  tagged shutters. `concept-artist` starts from a **crop of the shipped `street-wide.png`** as
  reference input rather than from a blank brief, and the `lead-art` gate gains a criterion it did
  not have: **continuity with the shipped décor**, not just house style. Recognisable-at-a-glance
  is now a pass/fail, and it is cheaper to hit than invention was.
- **More expensive — the preload lands on the FIRST-PLAY path.** `manifestFor("stalingrad")` becomes
  `manifestFor("belliard")`, and Belliard's manifest is what a brand-new player downloads before
  their first frame (`FIRST_PLAYABLE_LEVEL`, `assetManifest.ts`). Dropping a 1280×768-class plate
  plus ≤ 6 pose sprites into the core roster taxes **time-to-first-play** for every player,
  including the ones who never reach the set-piece.

- **MODIFY** `levelArt.json` — the set-piece plate + key-pose entries (asset list = fiction §6),
  prompts authored by `concept-artist` under the `lead-art` gate (E-6). Must pass
  `scripts/check-art-prompts.mjs`.
- **MODIFY** `src/game/systems/assetManifest.ts` — `photoAssetPaths(levelId)`, wired to
  **Belliard**. The plate must be **warm before the trigger** (a texture fetched lazily mid-level
  would pop the set-piece open on a blank plate) **without** riding the cold-boot roster.
  **Decision (Rev.3): a named preload GROUP, not a core roster entry** — the shape
  `assetManifest.ts` already uses for `edge-scroll` and `boss-finale-switch`, warmed on level
  entry rather than at first paint. Same guarantee at the trigger, zero cost on time-to-first-play.
  Measured at `verify` (§11, `gpu-specialist` + `qa-lead`).
- **CREATE** `scripts/check-photo-subject-boxes.mjs` — **the F12(1)(b) enforcement.** Compares
  each delivered sprite's **opaque-pixel AABB** against the authored keyframe box at each of the
  9 keyframes, within `SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 %)` per edge; non-zero exit on a
  breach. Same family as `check-sprite-integrity.mjs` / `check-sprite-style.mjs`, wired into CI.
  **This is what makes "the art and the keyframe table are ONE deliverable" (E-6(3), gated décor
  aim-honesty ruling) enforceable in CI instead of at a gate**, and it is the only mechanism that
  catches a 4 % sprite shrink silently re-breaching F5a (R2-1's stated fear).

**Honor:** no game rule in `scripts/`; the tolerance constant is **imported from the game
module**, never re-typed in the script.

---

## 7. Build order and dependencies

```
        A0 (seam types + channel)        ── releases ──┬──────────────┐
             │                                         │              │
        A1 (hash kernel, golden test first)            │              │
             │                                         │              │
        A2 (photo machine, TDD)                   Lane B (render)  Lane C (assets + CI script)
             │                                    starts on DOM   FULLY INDEPENDENT from A0
        A3 (boss lever + carry)                   surfaces now    (can start at t=0 in practice)
             │                                         │              │
        A4 (bridge + input)  ────────── consumed by ───┘              │
             │                                                        │
             └──────────── verify needs A+B+C ────────────────────────┘
```

**Ordering constraints, and only these:**

1. **A0 before B.** B needs the types and the channel to compile. A0 is small and lands first.
2. **A1 before A2.** The photo sway must consume the extracted kernel, not fork a third copy.
3. **A4 after A2/A3.** The bridge assembles an input the machine must already accept.
4. **C is independent of A and B** and should start immediately — the art request (E-6) is the
   longest pole in the story, and the CI script can be written against the authored table before
   a single sprite exists.
5. **A2 and A3 are the SAME lane and must be sequenced**, not parallelised: both touch
   `types/gameState.ts` and `levels.data.ts`. Two agents on those files is a merge conflict
   dressed as parallelism.

**Rev.3 — does the relocation move the critical path? No. Verdict re-affirmed.** Checked
deliberately rather than assumed:

- **Lane C is still the longest pole, and still starts at t = 0.** Art turnaround dominates; the
  brief got easier (re-frame, don't invent) but not shorter, and the CI script is unchanged.
- **Lane A grows by roughly one unit of work, inside A2** — the D-K trigger guard, the §2.7
  ordering invariant and the A-T12 coexistence suite. All of it lands in files A2 already owns
  (`stateMachine.ts`, `validateLevel.ts`, `levels.data.ts`), so it adds no edge to the graph.
- **Lane B is untouched.** The surfaces are the same; only the pixels behind them moved.
- **One new sequencing note, not a constraint:** the Belliard row is edited by A2 (the `photoQte`)
  and by A3 (nothing — the tiers are on the Niveau Final row). Still one lane, still sequential,
  still no shared file across lanes.
- **The one edge that DID disappear:** under Rev.2 the plate's preload had to land in Stalingrad's
  roster before any end-to-end verify could see the set-piece at all. With the named preload group
  (§6 Lane C) the verify path no longer waits on a manifest decision — B and C converge later, not
  earlier. Net: **build order unchanged, critical path unchanged, one dependency softened.**

**Parallel-safety verdict: PARALLEL-SAFE with constraint (1).** File sets are disjoint —
A = `src/game/**` (minus `assetManifest.ts`) + `src/hooks/**`; B = `src/render/**`;
C = `levelArt.json` + `assetManifest.ts` + `scripts/**`. The only coupling is the seam
(`PhotoQteSpec`, `PhotoQte`, `PhotoControlChannel`, `HudPhotoQte`, the `tickGameState` optional
param), all authored by Lane A in A0. The new `tickGameState` parameter is **optional with a
neutral default**, so nothing breaks between A0 and A4.

---

## 8. The seven E-4 asks — answered, in one table

| Ask                                                  | Answer                                                                                                                                                                                                                                                                                                                                                                                                                                             | Where         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **(a)** tick-gate on `paused`                        | **Free by construction.** `useFrame` returns on `paused` (`useGameLoop.ts:327`); the set-piece is a block of `tickGameState`, so every gauge freezes. Asserted (A-T1), never assumed. A design running beside the loop is rejected.                                                                                                                                                                                                                | D-A, §2.6     |
| **(b)** validity and role as two independent fields  | `PhotoComposition` (mechanical, live) vs `PhotoFrameRecord[]` (semantic, sealed). **Enforced by the projection types**: `photoSceneView` has no field able to express a verdict; `photoSheetView` returns `null` before `CONTACT_SHEET`.                                                                                                                                                                                                           | D-D, §2.1     |
| **(c)** `photoQteSpec === null` byte-identity        | Same additive-and-optional law as `bossQteSpec`/`lootSpec`: null spec ⇒ trigger false ⇒ block skipped ⇒ tick-identical. **Rev.3: Belliard is the host and is therefore NOT byte-identical — it gains the spec.** The guarantee is that the spec is the only thing it gains, and it is asserted in three parts (every spec-less level vs `main`; Belliard-minus-the-field vs `main`; Belliard across the set-piece vs `main` at equal level-clock). | §2.6, A-T7    |
| **(d)** `subjectTrack` shape + one call site         | `readonly SubjectKeyframe[]` = `{t,cx,cy,w,h}`, sorted, linear on all four, totality asserted at construction (F12(3)). **One evaluator**, result carried on `photoQte.subjectBox`; the brackets read that carried value. F12(1a) holds because there is no second place that _can_ compute it.                                                                                                                                                    | D-C, §2.1/2.3 |
| **(e)** run-scoped **Belliard** → Niveau Final carry | Persisted, monotone, `muf_leverage`, object blob, pure algebra in `src/game` + I/O in `src/hooks` (ADR-0076 D4 posture). 3-valued today; the `hasPlaque` upgrade is an added field, not a migration, and its price is written down. **New decision ⇒ ADR-0080.** **Rev.3: source level only — the mechanism is untouched, and the longer gap (two intervening levels, arbitrary reloads) strengthens every clause of it.**                         | §5, ADR-0080  |
| **(f)** `rewardMultiplier`                           | Authored **tiers** on the Niveau Final `bossQteSpec` row (absent ⇒ ×1.00), resolved once into `BossQte.rewardMultiplier`, applied through **one** helper at the three lull sites, **phases 1-2 only**, ordered multiplier → cut → clamp, compound floor asserted **non-strict `≥`** with ε = 0.35 quoted from ADR-0060. Plus the derived proof that the clamp is unreachable at any legal `m`.                                                     | §4            |
| **(g)** decline exits without a level reload         | **Free by construction.** The level state was never destroyed — it rode `...state` with the clock frozen. The exit clears the sub-record; the next tick resumes. "Retry from checkpoint" = re-entering the set-piece, not a level checkpoint.                                                                                                                                                                                                      | D-A           |

## 8bis. Open questions — two, both cheap, neither blocking the build

- **Q-1 → `game-designer` + `ux-designer` (one line each).** D-I rate-limits the desktop
  viewfinder to `PAN_RATE_MAX`, where UX §1.1 says absolute mouse mapping. Taken literally,
  absolute makes F5c vacuous and AC6c a mobile-only criterion — two fairness models for one
  gated tuning. **Recommendation: rate-limit both devices** (at 251 mm, 12 su/s ≈ 86 % of the
  frame width per second — imperceptible at human speeds). Lane A builds the rate-limited form;
  reverting to pure-absolute is one branch if design rules otherwise.
- **Q-2 → `pm` (rides with E-5). STILL OPEN — Rev.3 changes its argument, not its status.**
  ADR-0080 persists the leverage **at the set-piece's exit**, not at **Belliard**'s clear, so the
  reward is not contingent on surviving the level. That is the reading consistent with "bonus,
  never gate"; it also means the leverage is banked permanently once obtained. On level 1, with
  the beat firing in the first ten seconds, "bank at level clear" would mean most first-time
  photographers lose the proof they just took — which is why I still recommend the exit-write.
  Confirm or overrule: it is one predicate.
- **Q-3 → `pm` (new, Rev.3). Does the set-piece fire on the player's FIRST Belliard run?**
  Fiction §2.4 frames it as "une nuit de **retour** rue Belliard, pas la nuit du tutoriel" and
  explicitly leaves the progression placement to `pm`. Today a `photoQteSpec` is unconditional
  authored data on a row: author it and it fires every run, including the very first. **If `pm`
  wants it gated on progression, it must NOT become a second storage read inside the pure layer.**
  The architecturally clean route is the existing seam: `App.tsx handlePlay` already computes
  `LevelParams` from persisted state, so a boolean (`photoQteEnabled`, derived from `muf_progress`
  or the funnel) threads through the same path as `photoLeverage`, and the pure layer keeps seeing
  authored data only. Cost: one `LevelParams` field, one predicate in `handlePlay`, **no new key,
  no new ADR**. V1 recommendation: **unconditional**, and let "retour" read as narrative framing.
- **Q-4 → `pm` + `game-designer` (new, Rev.3). The proof is now farmable, and that is a design
  question, not an architecture one.** Belliard is always unlocked, `[ RECOMMENCER ]` re-enters a
  byte-identical scene (AC10), and the merge is monotone (ADR-0080 D1) — so any patient player
  banks `master-bonus` on level 1 and meets the final boss at ×0.80 by default. Under Rev.2 the
  proof sat one level before its payoff; under Rev.3 it sits three, with unlimited retries in
  between. **No architectural change is proposed:** the retry, the monotone merge and the
  exit-write are each gated design decisions, and undoing any of them to make the reward scarce
  would re-open R2-4, AC10 or K-4. If design wants scarcity, the honest lever is **tuning**
  (the tiers on the Niveau Final row), not the carry.
- **Non-blocking, to `game-designer`:** mechanic §1.1's phase table omits **`BRIEFING`**, which
  F13 counts and §1.3 makes skippable. This plan builds it as a phase of the machine (D-G); the
  spec should say so on its next editorial pass.

## 9. Does ADR-0077 suffice? — **No. ADR-0080 is written.**

ADR-0077 fixes the **frame** (D1–D9) and explicitly defers "lane split and contracts" to
stage 3, saying nothing about cross-level state. Six of the seven E-4 asks land inside shipped,
already-decided patterns (the frozen-scene block, the additive-and-optional law, the authored-row
discipline, ADR-0046's HUD dress) and need **no** new ADR — they are tech-plan detail and this
document is their record.

The seventh does not. The carry is:

1. **the first state in muf that travels between levels** other than the unlock set — the code
   says a run is one attempt on one level (ADR-0076 F1) and there is no session spanning them;
2. **a sixth `muf_*` storage key**, i.e. a persistence decision with a compatibility surface;
3. **a re-application of ADR-0076 D4's pure/impure split** to a second feature, which either
   confirms that precedent or quietly forks it;
4. **a new coupling between two levels' data** — one level's outcome parameterises another
   level's authored tuning — which a future contributor must not re-litigate or break by
   accident.

That is the ADR test, four times over. Written as
**`docs/adr/0080-photo-leverage-cross-level-carry.md`** (Proposed).

**Number caveat, flagged to `producer`:** 0080 is allocated by `senior-architect` at stage 3
because no `producer` is in this loop, exactly as ADR-0077's own §Number records for itself.
Verified against the local branch, `origin/main` and all 107 fetched remote refs (max visible =
0077, itself claimed **three** times on different unmerged branches); 0078/0079 are reported
taken on a branch not fetched here. **`producer` owns the merge-time re-check for both 0077 and
0080, per the adr-new guard.** The ADR index (`docs/adr/README.md`) is regenerated with
`scripts/gen-adr-index.mjs` so the CI freshness gate stays green.

## 10. Residues and amendments — assigned

| Item                                                                                                          | Owner                                                | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Amendment A1** → `spec-boss-shield-break-tempo-shot.md`                                                     | **`game-designer` (Sacha)** — she authors both specs | Transcribe the 5-point block of `spec-photo-qte-paparazzi.md` §D7.2 **verbatim** into that spec (its own amendment series, A1). Verbatim ⇒ **no re-gate**. §4 of this plan is its implementation and must not diverge from it.                                                                                                                                                                                                                                                                                                          |
| **C-1** fiction §4.4 cites the withdrawn ×0.75                                                                | `narrative-designer` (Yasmine)                       | Correct to **×0.80**, and prefer citing the mechanism over the number.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **C-2** mechanic §1.2 "held on-screen button on mobile"                                                       | `game-designer` (Sacha)                              | Correct to the **device fork** (hold on desktop, tap-to-toggle on mobile), cross-referencing UX §1.4. This plan's D-B already builds the fork.                                                                                                                                                                                                                                                                                                                                                                                          |
| **C-3** naming pin                                                                                            | `game-designer` + `ux-designer`                      | Mark `Continuer`/`Réessayer`/`Décliner` as **role names** in both specs; the shipped strings are `[ CONTINUER ]` / `[ RECOMMENCER ]` / `[ LAISSER TOMBER ]`.                                                                                                                                                                                                                                                                                                                                                                            |
| Gate §4 transcriptions (AC14, F5b's row, `SWAY_AMP_X ≤ 2.10`, the R2-5 CTA shape, the `hasPlaque` derivation) | their three authoring lanes                          | Housekeeping, no fourth gate pass — may run **in parallel** with the build.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Doc↔code coherence bug found here**                                                                         | **`tech-writer` (Otis)**                             | `spec-boss-shield-break-tempo-shot.md`'s header still reads _"Status: DRAFT (Rev. 2) — needs `lead-game-designer` PASS before it reaches `senior-architect` and any dev implements it"_, while lever 6 is **shipped in `bossQteSystem.ts`** (`SHIELD_BREAK_LULL_CUT`, the floor margin, the clamp) and the photo gate cites the spec as **GATED (ADR-0060)**. The status line is stale and must be corrected **before** A1 is transcribed onto it — an amendment onto a "DRAFT, do not implement" header is a trap for the next reader. |
| ADR-0077 + ADR-0080 number re-check                                                                           | `producer` (Marion)                                  | Merge-time, per the adr-new guard (§9).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## 11. Routed notes to the other lanes

1. **`qa-lead` (Inès).** The e2e surface is new and device-forked: A3bis (max simultaneous
   `touches.length` ≤ 2 across a full frame attempt), A7bis (pixel-diff of the bracket region:
   `locked` on `NO_SUBJECT` vs `locked` on master must be **identical**), A9 (pause/resume ⇒
   posture `LOWERED`, gauges unmoved, focal retained), A14bis (decline in **one** input, boss at
   ×1.00, no confirmation, no second screen). AC13(b) is a **wall-clock** measurement, not an
   assert — it needs a scripted first-play capture. **Behavioural delta for the regression
   suite:** none on any level without a `photoQte` (that is A-T7), and the Niveau Final's phase-3
   timeline is unchanged at every tier (that is the §4.3 test). **Rev.3 adds two surfaces to your
   plan:** (i) **Belliard's existing regression suite is now a host-level suite** — the hostage
   duel, the truck delivery at 20 s and the boss finale at 90 s must be re-verified _through_ a
   played set-piece, not only around it (A-T12(b)); (ii) **AC13(b)'s wall-clock first-play
   measurement now measures the game's real cold-boot path**, since the host level is the first
   thing a new player loads. With the named preload group (§6 Lane C) the expected delta is zero —
   which is exactly why it must be measured rather than assumed.
2. **`tech-writer` (Otis) — Rev.3.** `docs/game-design/README.md` and any story/handoff shard still
   describing the set-piece as a Stalingrad beat are now stale. The relocation is a Bertrand
   decision of 2026-08-02 overriding gate ruling R-10; the fiction carries it in §2 and §9.0, this
   plan in its Rev.3 amendment, and ADR-0080 in its Context. Doc↔code coherence sweep is yours.
3. **`gpu-specialist` (Ben).** Low risk, **no perf gate requested**: one full-screen plate
   texture plus ≤ 6 key-pose sprites, the world simulation frozen, no new per-frame allocation,
   no new material per frame. Two things to watch at `verify`: the plate must be **preloaded**
   (Lane C, §6) and the viewfinder crop must not re-create a material each frame. Escalate only
   if the composite shows a hitch on the trigger tick. **Rev.3 — one number I do want from you:**
   the plate now lives on **Belliard**, the first-play level. Confirm the named preload group
   keeps **time-to-first-frame on Belliard unchanged** versus `main`, and that the group is warm
   before the trigger at ~5 s. That is a memory/bandwidth read, not a frame-budget verdict.
4. **`sound-designer` (Malik).** The cover windows are **game state**, already in the pure layer
   (`inCover(t)`), and the render/audio lane reads them — it never re-derives the cadence.
   **Rev.3, and please read D-J before writing the brief:** the fiction hangs the cover on the
   traffic light, and that light **exists in code** (`trafficSignal.ts`) on a **13.5 s wall-clock**
   cycle that neither pauses nor rewinds. It is decor, it stays decor, and it is **not** your
   cadence. Your loop is driven by `inCover(spec.cover, sceneClock, …)` — 21 s period, 7 s cover,
   1.8 s tell — the same booleans the visuals read. Exact values remain `game-designer`'s.
   `PhotoQteTickResult.exposed.focusHeld` is the **sole** signal for the crisp-vs-dull click; it
   is a boolean produced by the tick, so the audio channel and the visual flash cannot disagree.
5. **`lead-art` (Nico).** E-6's four constraints are unchanged by this plan, and one of them now
   has teeth: F12(1) ("the drawn subject and the keyframe table are ONE deliverable") is enforced
   by `scripts/check-photo-subject-boxes.mjs` in CI (§6 Lane C), against
   `SUBJECT_BOX_TOLERANCE = max(0.40 su, 5 %)` imported from the game module. The two
   non-drifting hold poses (K2→K3, K4→K5) are checked by the same script at their keyframes.
   **Rev.3 adds a fifth constraint, and it is a gate criterion, not a style note:** the plate is a
   **re-framing of a shipped décor**, not a new place. It must read as the same street as
   `assets/levels/belliard/street-wide.png` at first glance — passage mouth (`x_norm 0,372–0,408`),
   boulangerie in amorce (`0,340`), feu tricolore (`0,388`), tagged shutters. Recommend handing
   `concept-artist` a **crop of the shipped file** as reference input, and judging continuity at
   the gate alongside style.
6. **`pm` (John).** Q-2 above rides with E-5; the E-5 price for un-deferring the `PARIS-MINUIT`
   UNE variant is quantified in §5.3.

## 12. Sign-off

**APPROVED for build.** Three lanes, one ordering constraint (A0 first), one typed seam, no
shared file between lanes. The boundary law holds by construction: every rule of this feature is
a pure function of `(PhotoQteSpec, PhotoQte, PhotoInput, delta)` in `src/game`; the render draws
the result and decides nothing; the device fork and all browser I/O stay in `src/hooks`.

Cross-cutting sign-off (>1 layer) is recorded here and in
`docs/handoffs/story-qte-photo-paparazzi.md`. Stage-5 `verify` is `qa-lead`'s to orchestrate;
design acceptance against AC1–AC14 is `lead-game-designer`'s (gate §6.4). Stage 6 is the
mandatory `review-panel`; its triage is mine.

**Rev.3 sign-off (2026-08-02) — STILL APPROVED for build, with two additions.** Bertrand's
relocation to Belliard costs one new decision (**D-K**, set-piece serialisation), corrects one
mis-stated guarantee (**§2.6 E-4(c)**), withdraws one invariant that would have rejected the host
row (**§2.7**), and pins one boundary that the shipped décor made tempting to cross (**D-J**: the
traffic light is decor, not a clock). The carry mechanism, the lane split, the build order and the
critical path are **unchanged**. Nothing here re-opens a gated design decision, and nothing here
needs a fourth gate pass — the fiction (Rev.3 §9.0) routes the design-side consequences to their
own lanes.

_Winston — `senior-architect`, 2026-08-01, stage 3 · amended Rev.3, 2026-08-02._
