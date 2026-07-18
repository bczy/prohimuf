# Handoffs — Hostage QTE rework: "Le duel de la porte cochère" (ADR-0034)

Encodes **ADR-0034** (ACCEPTED, F1 tableau vivant + F2 règle du tir) and the `QteSpec`
tuning fields from **ADR-0035** (ACCEPTED, F3 per-level curve). No new ADR — see
"ADR note" below (§3) for the in-intent clarifications this contract locks.

**Reconciled shard** (`tech-writer`/Otis, 2026-07-17): this story was originally split
across two shards — `story-hostage-qte-rework.md` (opened by `ux-designer`, carrying the
DESIGN and DESIGN GATE stages) and this file (opened by `senior-architect`, carrying the
HOW and DEV stages). Merged into one per the design gate's reconcile note (now §5, below).
`story-hostage-qte-rework.md` is kept as a one-line redirect to this file.

## 2. DESIGN — ux-designer (Tony) — 2026-07-17

- claim: HUD & feedback readability for the ADR-0034 QTE rework (bounded — mechanic decided in
  the ADR; UX owns how the player READS it: HUD hierarchy, peek-tell legibility, head-vs-hostage
  spatial fairness, accessibility).
- release: UX spec `docs/game-design/ux/spec-hostage-qte-hud-readability.md` (new `ux/` folder).
  Key readability requirements handed to the render lane (`dev-r3f-render`):
  - §1: remove captor-HP bar + countdown bar from `HUD.tsx`; nothing replaces them (distance = the
    in-world diegetic clock, D1); OTAGE banner + WON/LOST stamp KEPT; door must stay in-frame.
  - §2: peek TELL must precede the peek, originate at the head location, read as a discrete "NOW"
    event, and carry motion/shape (not colour alone) — P3 "always 'I cracked', never unreadable".
  - §3 (G6): peeking head silhouette clears the hostage silhouette by a visible gap at all zooms /
    both DPRs; visible-head region == scored head-zone (aim honesty).
  - §4: reduced-motion degrades strobe→steady cue but keeps the signal; COVERED/PEEKING + tell
    distinguishable without hue; contrast-as-function.
- FLAGs raised in-spec: (a) `hostageHp` contract question (pips row) → `lead-game-designer` +
  `senior-architect`; (b) ambient-tension climb now that `windowRemaining` is gone →
  `game-designer`; (c) head-zone-vs-visible-head assertion → `dev-gameplay`/architect.
- NEEDS: `lead-game-designer` (Karim) DESIGN GATE PASS before `senior-architect`.
- VERDICT: PENDING — design gate (lead-game-designer)

## 3. HOW — senior-architect (Winston) — 2026-07-17

- claim: freeze the `src/game/types/hostageQte.ts` code contract that both dev lanes build
  against, assign non-overlapping lanes, and pin the safety invariants + tie-break rule.
- release: FROZEN interface below + lane plan + invariants. Contract is frozen FIRST
  (dev-gameplay writes the types file, no logic), then both lanes fan out in parallel.

### Frozen type surface — `src/game/types/hostageQte.ts`

This is the boundary. Field names/types below are LAW; both lanes code against them. Types
only — zero React/Three, zero functions (rules live in `qteSystem.ts`).

```ts
import type { Vec2 } from "@game/types/vector";

/** Top-level life-cycle. Forward-only: ZOOMING → ACTIVE → (WON | LOST) → DONE.
 *  DONE persists so the QTE fires exactly once per level. (KEPT from ADR-0030.) */
export type QtePhase = "ZOOMING" | "ACTIVE" | "WON" | "LOST" | "DONE";

/** Captor sub-state during ACTIVE (ADR-0034 D2). COVERED = dragging the hostage as a
 *  human shield, NOT shootable (no valid kill zone); PEEKING = brief telegraphed head
 *  exposure AND the captor's own shot (D3: the opening IS the danger window). */
export type CaptorStance = "COVERED" | "PEEKING";

/** What a shot resolves to (ADR-0034 D4/D6). "head" is returned ONLY while PEEKING; the
 *  classifier is stance-aware so head-during-peek is the sole kill route by construction,
 *  and the head band is spatially disjoint from the hostage band (G6). */
export type QteZone = "head" | "body" | "hostage" | "miss";

/** Authored per-level QTE data (`LevelConfig.hostageQte`). Deterministic, no randomness.
 *  Belliard-first (ADR-0035 D3); absent ⇒ no QTE, level stays byte-for-byte deterministic. */
export interface QteSpec {
  /** When the level's elapsed seconds cross this, the QTE fires (once). (KEPT.) */
  readonly triggerAtElapsedSeconds: number;
  /** Progressive-zoom duration, seconds; the "OTAGE" banner shows during it. (KEPT, D5.) */
  readonly zoomSeconds: number;
  /** Captor START world position (same space as bullets/crosshair). Live pos moves from here. */
  readonly anchor: Vec2;
  /** Porte-cochère world target. Captor reaching it = spatial fail → LOST (ADR-0034 D1). */
  readonly porteCochere: Vec2;
  /** Retreat speed, world units/s toward the door — the SOLE clock (ADR-0035 D1). */
  readonly retreatSpeed: number;
  /** COVERED interval between peeks, seconds (ADR-0035 D1). Must be ≥ TELEGRAPH_LEAD_SECONDS. */
  readonly peekCadenceSeconds: number;
  /** Authored PEEKING exposure, seconds (ADR-0035 D1). Clamped up to PEEK_MIN_SECONDS (G5). */
  readonly peekDurationSeconds: number;
}

/** Runtime state of the (single) QTE — a small live one-actor simulation while the rest of
 *  the scene is frozen. `null` until triggered; then persists through DONE. */
export interface HostageQte {
  readonly phase: QtePhase;
  /** Captor sub-state (ADR-0034 D2). Only meaningful during ACTIVE; COVERED otherwise. */
  readonly stance: CaptorStance;
  /** True during the last TELEGRAPH_LEAD_SECONDS of COVERED before a peek — the G4 tell.
   *  Structural (not an authored flag): the tick sets it so render can draw the pre-peek cue. */
  readonly telegraphActive: boolean;
  /** Seconds left in the current stance segment (COVERED: time-to-next-peek; PEEKING:
   *  exposure remaining). Drives the COVERED↔PEEKING sub-machine. */
  readonly stanceRemaining: number;
  /** LIVE captor position — the MOVING anchor (ADR-0034 D6), advanced each tick toward the
   *  door. Render draws the tableau here; the camera FOLLOWS it. */
  readonly anchor: Vec2;
  /** Retreat kinematics — the reused Courier {x,y,dir,speed} model (ADR-0034 D1). */
  readonly dir: 1 | -1;
  readonly speed: number;
  /** The porte-cochère world target (copied from spec): the spatial-fail point and the
   *  door render/camera-goal. Distance anchor→porteCochere is the diegetic timer (D1). */
  readonly porteCochere: Vec2;
  /** Seconds left of the zoom (zoomSeconds → 0 during ZOOMING). Drives the render lerp. (KEPT.) */
  readonly zoomRemaining: number;
  readonly zoomSeconds: number;
  /** Brief hold in WON/LOST before DONE so the verdict reads on screen. (KEPT, D6.) */
  readonly resultRemaining: number;
  /** The "OTAGE" warning is shown (true during ZOOMING). (KEPT, D6.) */
  readonly warning: boolean;
}
```

**REMOVED (per D6):** `QteBodyPart`, `captorHp`/`captorHpMax`, `windowSeconds`/
`windowRemaining`, `hostageHp`/`hostageHpMax`, `bonusScore`/`bonusEnergy` on `QteSpec`.
**ADDED:** `CaptorStance`, `stance`/`telegraphActive`/`stanceRemaining`, the moving
`anchor` + `dir`/`speed`, `porteCochere` (spec+runtime), and the stance-aware `QteZone`.
**KEPT:** scripted trigger, forward-only phase machine, WON/LOST hold, `anchor`, `warning`.

### `qteSystem.ts` contract deltas (dev-gameplay)

- **Classifier — FROZEN signature:** `qteZoneAt(dx: number, dy: number, stance: CaptorStance): QteZone`.
  Returns `"head"` ONLY when `stance === "PEEKING"`, in a band spatially disjoint from the
  `"hostage"` band (G6). COVERED ⇒ head band is closed (→ `"body"`/`"miss"`). Offsets are
  anchor-relative, so G6 holds under the moving tableau.
- **`QteTickResult` loses `scoreDelta`** — energy is the sole currency (D5). Only
  `{ qte, energyDelta }` remains. The `stateMachine` call site drops its `score:` fold.
- **Energy prices become system constants** (defaults, tunable — not per-level knobs, so
  they leave `QteSpec`): `RESCUE_REFILL` (WON, big +), `BODY_DRAIN` (small −),
  `HOSTAGE_PENALTY` (heavy −), `PANIC_PENALTY` (fire during ZOOMING, −),
  `UNANSWERED_PEEK_DRAIN` (−, charged ONCE per closed exposure). No passive per-second drain (D5).
- **`tickQte` ACTIVE** now: advance the moving anchor (`dir*speed*delta`); run the
  COVERED↔PEEKING sub-machine off `stanceRemaining`/cadence/duration; set `telegraphActive`;
  resolve `fire` via the stance-aware classifier (head→WON, body→drain, hostage→penalty);
  charge counter-fire once on a PEEKING→COVERED close that stayed ACTIVE (unanswered peek);
  LOST when the anchor reaches `porteCochere`.
- **`tickQte` ZOOMING** now charges `PANIC_PENALTY` on `fire` (D4).
- **Removed:** `CAPTOR_HP_MAX`, `HOSTAGE_HP_MAX`, `PART_DAMAGE`, `QTE_WINDOW_SECONDS`,
  `QTE_TIMEOUT_PENALTY`, the timeout-loss branch, `damageForPart`.

### Safety invariants — assert IN CODE, not trusted from data

- **G5 exposure floor:** `PEEK_MIN_SECONDS = 0.5`. Clamp the runtime exposure
  `max(PEEK_MIN_SECONDS, spec.peekDurationSeconds)` before it reaches the tick. Assert
  against the RUNTIME value the tick uses (ADR-0035 gotcha), not just the authored field.
- **G4 telegraph:** `TELEGRAPH_LEAD_SECONDS = 0.35`, structural to the COVERED→PEEKING
  transition (never an authored flag). Assert `peekCadenceSeconds ≥ TELEGRAPH_LEAD_SECONDS`
  so a tell always fits before every peek.
- **G6 spatial separation:** unit-test `qteZoneAt` — no `(dx,dy)` maps to both `head` and
  `hostage`, with a non-zero gap between the bands. Assert directly, not via draw order.
- **Unanswered-peek charge-once:** structural — the drain fires only on the
  PEEKING→COVERED transition tick while phase stays ACTIVE (mirrors the existing forward-only
  once-only pattern). Never per-tick during the exposure.
- **Deterministic tie-break:** resolve `fire` BEFORE the spatial-fail check. A same-tick
  winning head-shot beats the anchor reaching the door → WON (mirrors ADR-0030
  kill-vs-timeout precedent).

### Lane assignment — non-overlapping paths

| Lane               | Owns (writes)                                                                                                                                                                                                                       | Against the frozen contract                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **dev-gameplay**   | `src/game/types/hostageQte.ts`, `src/game/systems/qteSystem.ts`, `src/game/systems/stateMachine.ts` (QTE block ~L133–160 + drop the `score:` fold), `src/game/levels/levels.ts` (belliard `QteSpec`), `src/game/systems/__tests__/` | writes the pure contract + rules + invariant tests                    |
| **dev-r3f-render** | `src/render/scene/HostageQteSprite.tsx`, `src/render/scene/qteCamera.ts`, `src/render/scene/hostageCue.ts`, `src/render/ui/HUD.tsx` (+ its `HudHostageQte` slice), **`src/hooks/useGameLoop.ts`** (zoom driver ~L274–310)           | reads `HostageQte`, draws the moving tableau, camera FOLLOWS `anchor` |

**No shared-file contention.** `tickQte` is called inside `stateMachine.ts` (game lane);
`useGameLoop.ts` only _reads_ `gameStateRef.current.qte` for the camera (render lane) — the
two files never both get written. `isQteActive(qte)` signature is unchanged; the camera
follows the moving anchor largely for free because `qtePose(base, qte.anchor, p)` re-reads
the live anchor each frame (ACTIVE pin `p=1` → `camera.x = anchor.x`). Render's real job:
keep the follow smooth and restore base framing EXACTLY on DONE across the mobile-pan /
edge-scroll writers.

**Sequencing:** (1) dev-gameplay lands the FROZEN types file first (interface only, no
logic) → handoff. (2) Then both lanes fan out in parallel as concurrent Task calls on the
non-overlapping paths above. `HudHostageQte` (render-owned, in `HUD.tsx`) mirrors the new
runtime fields — render updates it once the types are frozen.

**Art = deferred CI art-lane dependency.** New drag / covered / peeking-with-gun-raised
sprites ship via the CI art lane (levelArt.json / dev-tooling-assets). The render lane MUST
NOT block on them: keep the `resolveEnemyTexture("hostage_taker", …)` cop fallback (per
ADR-0030/0034) behind a stance→texture-key indirection so landing the real art is a data
swap. The cop fallback will read wrong for a _moving_ captor — acceptable placeholder;
flag to lead-art.

### ADR note — no new ADR

ADR-0034 (F1/F2) + ADR-0035 (`QteSpec` tuning fields) fully cover this. Three encodings this
contract locks are clarifications WITHIN that intent, not new decisions — flagged for
pm/producer confirmation, reversible if Bertrand disagrees:

1. **`hostageHp` removed** — D4 makes the duel binary (headshot-or-nothing) and hostage-hit
   a flat heavy energy penalty, not a death/loss route; D5 makes energy the only currency.
   The sole LOST route is the spatial fail (door).
2. **`scoreDelta` removed from the QTE** — D5: "score is not the stake"; energy is the single
   currency. The ADR-0030 D4 rule (rescue never advances the kill quota) still holds.
3. **Energy prices are system constants, not `QteSpec` fields** — they are economy/anti-
   frustration invariants, not the per-level difficulty knobs ADR-0035 enumerates
   (retreat speed / peek cadence / peek duration). `bonusScore`/`bonusEnergy` leave `QteSpec`.

## 4. DEV (render lane) — dev-r3f-render (Amelia) — 2026-07-17

- claim: implement the RENDER + view-hook side of ADR-0034 F1+F2 against the FROZEN
  `hostageQte.ts` contract — moving-tableau draw, following camera, discrete peek tell,
  HUD gauge removal, reduced-motion a11y. No `src/game/**` touched.
- release: File List below. Verified by manual type/field review against the frozen
  contract (local toolchain unavailable — no `node_modules`, corepack/yarn download is
  proxy-blocked, so `tsc`/`vitest`/`lint` could not be run here; final integrated run is
  at merge, per architect note).

### File List (render + view-hook lane only)

- `src/hooks/useGameLoop.ts` — zoom driver now FOLLOWS the moving `qte.anchor`; framing
  target biased toward the door via `qteFollowTarget` so the diegetic captor→door clock
  stays in-frame (UX D1.4). Restore path unchanged ⇒ exact base-framing restore on DONE
  preserved; pinch/edge-scroll `isQteActive` gating unchanged.
- `src/render/scene/qteCamera.ts` — added `qteFollowTarget(anchor, porteCochere)` +
  `QTE_DOOR_LEAD` / `QTE_DOOR_LEAD_MAX`. `qteZoomInProgress` / `qtePose` unchanged
  (ACTIVE/WON/LOST still pinned at progress=1 while the camera pans with the anchor).
- `src/render/scene/HostageQteSprite.tsx` — draws the MOVING tableau at `qte.anchor`
  (captor + dragged hostage + peek cue). COVERED↔PEEKING by FORM (peek cue absent/present)
  keyed off `stance`; pre-peek tell keyed off `telegraphActive` (anticipation). Removed all
  `captorHp`/`hostageHp`/`window*` reads. Stance→texture indirection (`resolveCaptorTexture`)
  keeps the cop fallback behind a key so real drag/covered/peeking art is a later data swap.
- `src/render/scene/hostageCue.ts` — removed the `windowRemaining`-driven `hostageTension`
  ramp + `hostageColor`; added discrete `peekTellVisual` (step-change NOW, motion/shape
  carried, colour never sole), `captorTint`, `hostageAlarmColor` (steady under reduced
  motion). `energyFloater` kept (still used by `useGameLoop`).
- `src/render/ui/HUD.tsx` — removed the `preneur` (captor-HP), `compte à rebours`
  (countdown) gauges and the `otage ♥` pip row; `HudHostageQte` slimmed to `{ phase,
warning }`. Kept OTAGE banner + WON/LOST verdict + dim wash.
- `src/render/scene/__tests__/hostageCue.test.ts`,
  `src/render/scene/__tests__/qteCamera.test.ts` — rewritten/extended for the new API.

### Contract gaps flagged to dev-gameplay / senior-architect

- **No hostage-hit signal on `HostageQte`.** UX spec D3.4 wants the localised in-world
  "you hit HER" white flash KEPT, but the frozen contract exposes no per-shot outcome
  (no `hostageHp`, no `lastShotZone`/`hostageHitNonce`, and the frozen tick emits no
  feedback events). I dropped the white flash cleanly. To restore D3.4, the gameplay lane
  would need a transient hostage-hit signal (nonce or last-resolved-`QteZone`) on the
  runtime record, or a QTE feedback event surfaced through the frozen-tick path.
- **Head-zone vs visible-head alignment (G6 / UX D3.2) not yet reconcilable.** I placed the
  peek cue front-left of the captor (anchor + (−0.5, +0.7)), clear of the hostage
  (anchor + (+0.32, −0.3)). The new stance-aware `qteZoneAt` head band coords live in the
  gameplay lane; the visible-head-vs-hit-zone match must be reconciled at the composite
  gate against the real peeking art (ADR-0034 Gotchas). Constants are placeholders.
- **Art dependency (lead-art):** cop fallback reads wrong for a MOVING captor; drag /
  covered / peeking-with-gun-raised sprites land later via CI, swapped in at
  `resolveCaptorTexture`.

## 5. DESIGN GATE — lead-game-designer (Karim) — 2026-07-17

Gating BOTH design deliverables for the ADR-0034 F1+F2 rework as one set (they are
downstream of the same decision and must be mutually coherent):

- `docs/game-design/spec-hostage-qte-duel-porte-cochere.md` (Sacha — tuning defaults, AC1–AC7)
- `docs/game-design/ux/spec-hostage-qte-hud-readability.md` (Tony — HUD/readability, A1–A12)

Checked against ADR-0034 (source of truth, D1–D6 + G4/G5/G6), PROJECT_GUIDELINES (scope
guard, §5.6 no-bullshit-death, single core loop), the frozen contract in this shard's §3
(Winston), and each other.

**Scope / core loop / verifiability:** both PASS. Conscious documented extension
(ADR-0030/0034), side objective that never advances the kill quota (D4 preserved), core
loop untouched, 12 s duel fits inside a 3–5 min mission. Sacha's numbers carry tolerances
(±0.2 s, ≥4 peeks) and AC1–AC7; Tony's A1–A12 are device-class/DPR/grayscale/reduced-motion
checks — a dev can implement neither by guessing. Verifiable.

### VERDICT

- **Game-design spec (Sacha): PASS-WITH-CORRECTIONS** (1 correction, below — G-1).
- **UX spec (Tony): PASS-WITH-CONDITIONS** (1 condition, below — U-1).
- Plus one documentation correction (D-1) and one ratification flag (F-1), routed out.

### Decisions the gate was asked to make

**D1 — scoreDelta (KEEP +8 vs REMOVE).** RULING: **REMOVE** — correction **G-1**. The
orchestrator's provisional "keep flat +8" is _defensible_ (D5's letter rejects
multipliers / magnified-failure / score-as-stake, arguably not a flat non-load-bearing
side bonus), but it FAILS the coherence leg of the gate: Sacha §3/§5 keeps +8 while
Winston's already-FROZEN contract removes it (`QteTickResult = { qte, energyDelta }`,
`stateMachine` drops the `score:` fold) and the dev lanes are building against that
contract _now_. One of the two must yield, and removal wins on every axis: (a) it is what
the frozen downstream contract already encodes → requiring removal = ZERO dev churn;
requiring keep = reopening a frozen contract for a value Sacha himself calls
"non-load-bearing"; (b) D5's header — "Energy is outcome currency only" — reads cleaner
with a single currency; (c) removal is mildly PRO-intent (rescue for the fuel, not for
points) and costs the design nothing (KISS/YAGNI, guidelines §2); (d) the whole-QTE
re-pricing under ADR-0034 (which supersedes ADR-0030's QTE) is the documented umbrella that
covers dropping the vestigial +8 — not silent drift. This is a design ruling I own; it
ratifies Winston's provisional removal and corrects Sacha's spec.

**D2 — §1.1 clock start.** RULING: **CONFIRM THE DEFAULT** — retreat begins at `ACTIVE`
onset, distance-to-door **7.2 u**, answerable budget 12.0 s of ACTIVE time. No change to
Sacha's spec. Rationale: (a) the 2 s zoom is an _establishing hold_ where firing is a panic
penalty (D4/D5) and no peek can be answered — starting the door-clock then would create
"shoot before he escapes" pressure during a phase the design penalises firing in, a P3
fairness snag; (b) it minimises the highest-risk camera coupling — during ZOOMING the
anchor is STATIC, so the camera merely zooms to a fixed point, then follows at ACTIVE,
rather than a compound zoom+pan; (c) decisively, the FROZEN contract advances the anchor
ONLY inside `tickQte` ACTIVE — the 8.4 u "whole-QTE" reading would require advancing the
anchor during ZOOMING too, contradicting the frozen contract. Default 7.2 u is the reading
consistent across all three artifacts. D1's "for the whole QTE" = the continuous ACTIVE
retreat, not a literal claim on the establishing zoom.

**D3 — hostage killable? (hostageHp removed).** RULING: **CONFIRM the intended design** —
hostage NOT killable, hostage hit = flat **−30 energy** (non-fatal; energy has no death-at-0,
Sacha §0), sole LOST route = door reached. This is unambiguously the intent across the two
lanes that matter: Sacha §4 already lists `hostageHp` among Belliard-removed fields, and
Winston's frozen contract + ADR-note #1 lock it removed. It is coherent with D4's sanction
hierarchy ("hostage = big cost, nothing else counts" — a _cost_, not a death/loss route),
with D1 (single clock, single fail), and it is _actively more_ coherent with
PROJECT*GUIDELINES §5.6 "jamais de mort bullshit" than an instant one-stray-bullet
hostage-death would be. The only laggard is ADR-0034 D6's removed-fields \_prose*, which
omits `hostageHp` (an incompleteness, resolved by D4's flat-penalty rule) — see D-1.
Per the orchestrator's steer I do NOT silently override: I confirm the design as coherent
AND raise **F-1** so pm/Bertrand consciously ratify that ADR-0030's hostage-death loss
route is retired (matching Winston's own "reversible if Bertrand disagrees"). Not a block.

**D4 — severity order + "no HUD surrogate" vs P1–P4.** Energy ledger
`body −5 < panic −6 < unanswered peek −8 ≪ hostage −30, rescue +40`: **PASS as-is.**
Strictly monotonic, each gap tied to a decision (body = smallest deliberate cost / D4
loophole; panic > body because you fired at a frame you were told you can't read / D4;
unanswered peek > panic because the captor's shot LANDED / D3; hostage ≫ all = bavure;
rescue +40 → 72-pt swing vs full ignore ⇒ P1 stakes-first satisfied, "ignoring is
near-optimal" closed). Single bavure (−30) ≈ ignoring the whole duel (−32) is coherent:
catastrophic-per-event vs catastrophic-cumulative; the atomic sharpness of −30 holds.
The UX "no HUD surrogate for distance-to-door" (D1.3) serves D1 directly and is coherent
with P1–P4 **provided** two load-bearing constraints hold → **U-1** + the D1.4 framing
constraint (door always in-frame during ACTIVE, captor→door gap legible at all tracked
zooms/DPRs, A3/A8) — both correctly handed to the scene/camera lane; confirmed load-bearing.

### Required corrections (gate conditions — game-designer/dev apply; I do NOT edit numbers)

- **G-1 (Sacha, blocking the spec's PASS):** delete the +8 rescue score bonus — the "Score"
  paragraph in §3 and the "rescue score bonus +8" row in §5's game-wide constants table.
  Energy is the sole QTE currency (D5); align to the frozen `QteTickResult = { qte,
energyDelta }`. No other number in the spec changes.
- **U-1 (Tony, condition on the UX spec's PASS):** make explicit that D1.3 empties only the
  QTE-specific bottom-centre bars (captor-HP + countdown), and the **standing global energy
  readout MUST remain visible during the QTE** — energy is the sole stake (P1); if it were
  hidden with the removed bars, the stake becomes invisible in the moment. Add to the §1
  acceptance (A1 currently asserts the region is empty — clarify "empty of the two removed
  QTE bars", energy stat stays). **Applied** — see
  `docs/game-design/ux/spec-hostage-qte-hud-readability.md` §1 (D1.3bis, A1).
- **D-1 (documentation, → `senior-architect` + `tech-writer`):** amend ADR-0034 **D6**
  removed-fields list to explicitly name `hostageHp`/`hostageHpMax` (closes the D1.6 seam
  the UX spec flagged; both design and arch lanes already treat it removed). **Applied** —
  see `docs/adr/0034-hostage-qte-duel-porte-cochere.md` D6 (amendment note, dated
  2026-07-17).

### Flag routed (NOT a block)

- **F-1 (→ `pm` + Bertrand):** conscious ratification that ADR-0034 retires ADR-0030's
  hostage-death loss route (sole LOST = door). Design is coherent and I PASS it; this is a
  for-the-record confirmation of a superseded-scope change, per Winston's "reversible if
  Bertrand disagrees." Tie-break only if Bertrand wants the death route kept — then re-gate.

### Reconcile notes (→ `producer`, actioned by `tech-writer`)

- **This story was split across two shards** — `story-hostage-qte-rework.md` (UX-opened) and
  `story-hostage-qte-duel.md` (architect HOW, this file). Same story. **Merged 2026-07-17**
  (`tech-writer`/Otis) into this single shard; the `docs/game-design/README.md` index rows
  and the `docs/agent-handoffs.md` index row now point here. This gate verdict is the
  canonical one; it covers both former shards.
- **Telegraph lead:** the frozen contract fixes `TELEGRAPH_LEAD_SECONDS = 0.35` as a
  structural constant (no per-level tell field on `QteSpec`). Sacha's §2.2 authorable-tell +
  0.25 floor is therefore _informational_ for F1/F2 (0.35 fixed trivially satisfies ≥0.25).
  Whether F3 wants to CURVE the tell per level is an **ADR-0035 lane question**, out of this
  gate's scope. For F1+F2 the fixed-0.35 reading is confirmed and satisfies G4.
- **Energy constant naming** (Sacha `QTE_RESCUE_REFILL`… vs Winston `RESCUE_REFILL`…) is a
  dev-lane reconcile; the VALUES in Sacha §5 are canonical, Winston's contract defers
  magnitudes to the spec — no value conflict.

Rework rounds used: 0 of 2. Corrections G-1/U-1 are single-line applies, not redesigns —
apply and proceed to `senior-architect`; no re-gate needed unless a value beyond G-1/U-1
moves. Design acceptance (stage 5) will re-verdict Sacha's playtest vs AC1–AC7 + Tony's
review vs A1–A12 post-BUILD.

- VERDICT: **PASS-WITH-CORRECTIONS** (game-design: apply G-1 · UX: apply U-1 · docs: D-1 ·
  ratify: F-1). Cleared to `senior-architect` once G-1/U-1 are applied.

## 6. STATUS — implementation complete — 2026-07-17

- Implementation is **DONE and verified**: `tsc` clean, `vitest` green (447 tests),
  `eslint` clean. Rebased on `main`, pushed to branch
  `claude/harness-1er-adr-otages-rcay2h` (PR #79).
- Doc lane (`tech-writer`/Otis, this pass): applied U-1 to the UX spec, applied D-1 to
  ADR-0034, merged this shard, and fixed the cross-refs in `docs/agent-handoffs.md` and
  `docs/game-design/README.md`. G-1 (the +8 score-bonus removal in Sacha's spec) remains
  outstanding for `game-designer` — not a docs-lane edit.
  - **Superseded by §7 below (2026-07-18):** the stage-6 code-review panel re-triaged G-1
    (finding B1) as a doc-realignment — the spec text was contradicting already-shipped,
    already-decided code (no value to author, no design choice left open) — and routed it
    to `tech-writer`. Applied; see §7.

## 7. VERIFY — stage-6 code-review panel — 2026-07-18

- claim: mandatory 4-reviewer merge-gate panel on PR #79
  (`claude/harness-1er-adr-otages-rcay2h`), diff `git diff origin/main...HEAD`.
- reviewers run in parallel: `code-review` (high), `bmad-code-review`,
  `bmad-review-edge-case-hunter`, `security-review`.
- findings adversarially verified; triaged by `senior-architect` (Winston).
- **verdict: NO CONFIRMED BLOQUANT/MAJEUR finding → MERGE**, gated on a fix-lane
  hardening pass (single dev-lane diff, no re-review needed beyond the fix-lane rule):
  - `dev-gameplay` applies: bounded stance-toggle loop (**C1**), `porteCochere.y` assert
    (**C3**), strict G4 cadence > tell (**C4**), finiteness guards (**C6**), an
    intended-double-charge comment (**C2**), and the real-level-data AC3 test.
  - `tech-writer` applies: the G-1 spec reconcile (**B1**) — done, see the spec edit
    logged above and in `docs/game-design/spec-hostage-qte-duel-porte-cochere.md` §3/§5.
- **Consciously DEFERRED (not blockers):**
  - **(a) C5** — pre-existing camera restore-vs-pan interaction during the `DONE` phase;
    not introduced by this diff, left for a separate pass.
  - **(b) NIT** — `TELEGRAPH_LEAD_SECONDS` is a global constant, not a per-level `QteSpec`
    field; ADR-0035/F3 will need a contract note if it wants to curve the tell toward the
    0.25 s floor (see this shard §3, "Telegraph lead" reconcile note).

## 8. PM ACCEPTANCE — pm (John) — 2026-07-18

- claim: final pipeline stage — accept or reject ADR-0034 F1+F2 (PR #79,
  `claude/harness-1er-adr-otages-rcay2h`) against scope, the story's AC1–AC16, and rule on
  flag **F-1**. Not a re-review: leaning on the stage-6 panel's MERGE verdict and the
  runtime-verify evidence already gathered.

### 1. Scope (cahier des charges)

**HOLDS.** The cinematic hostage QTE itself was already gated as a conscious, documented
extension under ADR-0030 (Prohibition Atari ST had no such set-piece); ADR-0034 does not
reopen that gate, it reworks the tuning of an already-accepted extension (static tableau →
duel of patience). Checked against every guardrail:

- **Core loop untouched.** `Récupérer → Livrer → Éviter` — the QTE is a scripted,
  once-per-level side beat that freezes the rest of the level; it doesn't touch delivery,
  recruitment, or the base récupérer/livrer/éviter mechanics.
- **Side objective, never advances the kill quota.** Confirmed unchanged (AC4, D4) — a
  rescue pays `energy` only; `kills` is untouched.
- **Mission length.** No change to the 3–5 min mission envelope (§2 KISS budget); the QTE
  is a ≤ ~14 s beat inside a level, not a new mode.
- **"Jamais de mort bullshit" (guideline §5.6).** The rework is a net improvement on this
  guardrail, not a risk — see F-1 below.

Design gate (`lead-game-designer`) independently confirmed conscious-extension + scope +
core-loop + verifiability as PASS. No open scope question.

### 2. Acceptance criteria

Leaning on the stage-6 panel's audit (§7) and the runtime-verify evidence in the brief, not
re-deriving: AC1–AC16 (story) map 1:1 to the frozen contract and are unit-tested (451
vitest green, including the fix-lane AC3 real-level-data test added post-panel); `tsc` +
`eslint` + `prettier` clean; boundary law holds (`qteSystem.ts`/`types/hostageQte.ts` zero
React/Three). Runtime evidence (headless browser) matches the spec's behavioural claims:
trigger at ~12 s, freeze+zoom+OTAGE banner, dragged-hostage tableau, HUD stripped of
captor-HP/countdown bars with only the global energy readout left (per UX gate condition
U-1 — the stake stays visible), duel resolves, energy drains as the sole outcome currency
(100→10 on a LOST run matches the ledger in spec §3: four unanswered peeks ≈ −32). No
pageerrors. **AC1–AC16: MET.**

### 3. F-1 — ratify retiring ADR-0030's hostage-death loss route

**Recommendation: RATIFY.** The hostage should stay non-killable; the sole LOST route
should remain the captor reaching the porte cochère. Reasoning, for Bertrand's one-line
accept:

- **Guideline §5.6 alignment, not violation.** "Jamais de mort bullshit — les règles des
  flics sont visibles et cohérentes" reads AGAINST an instant hostage-death-on-stray-bullet
  route, not for it: in a fast QTE with a moving target and counter-fire pressure, one bad
  bullet ending the run on a hidden HP pool is exactly the kind of arbitrary-feeling failure
  the guideline warns off. A flat, heavy, non-fatal `-30` penalty (the sharpest atomic cost
  in the ledger) keeps the stake severe and legible without a coin-flip death.
- **Stakes are preserved, not softened.** Spec §3's stake check stands: full clean rescue
  vs. full ignore-to-door is a 72-point energy swing on a 100 scale, and a single bavure
  (−30) is the worst single mistake in the level. P1 ("stakes first") is satisfied by the
  energy ledger alone; a second, HP-based death route would be a redundant clock stacked on
  top of the single-clock decision (D1), which the ADR explicitly rejected doing with
  `windowSeconds`.
- **One failure condition reads cleaner than two.** A single spatial LOST condition (door
  reached) is easier for the player to model than "door reached OR hostage HP depleted" —
  directly serves P3 ("always 'I cracked', never unreadable").
- **Already the shipped, tested, panel-cleared reality.** The frozen contract, the spec, and
  code have had `hostageHp` removed since the types freeze; retiring it is formalizing
  what's already built and gated, not proposing new work. Reverting would be net-new scope
  (re-adding an HP pool, a health-bar HUD element already removed per U-1, and a second
  failure branch) with no design or player-value case in this brief for doing so.
- **Reversibility preserved.** Both `senior-architect` and `lead-game-designer` explicitly
  flagged this as reversible if Bertrand disagrees — nothing forecloses reopening it later
  as a separate change if playtesting surfaces a reason to.

**pm recommends Bertrand ratify F-1 as written: hostage non-killable, sole LOST = door
reached.**

### VERDICT: **ACCEPT-WITH-NOTES**

- Scope: HOLDS (conscious extension, core loop intact, side-objective rule intact).
- AC1–AC16: MET (per panel audit + runtime verify).
- Note (non-blocking, per design gate's own "not a block" framing): **F-1 awaits
  Bertrand's one-line ratification** — pm recommends RATIFY (see rationale above). Story is
  otherwise accepted for merge; no further pm-lane rework required.

## 9. REVISION — static duel + blown-peeks loss clock — senior-architect (Winston) — 2026-07-18

**Bertrand REJECTED ADR-0034 D1** (captor retreating to the porte cochère; distance-as-clock).
Product-owner decision: the duel is now **STATIC** (no captor movement) and the distance clock
is replaced by a **"blown-peeks" loss clock** — the captor executes the hostage after N
closed-without-headshot peeks. The peek-duel, the stance-aware hitboxes, and the energy economy
are KEPT. This section is the FROZEN contract delta both lanes rebuild against; it supersedes
§3's moving-anchor contract wherever they conflict.

`game-designer` (Sacha) writes the tuning spec (the `maxBlownPeeks` default and any peek-cadence
retune) in parallel; the architect owns the CODE contract (field names/types) below.

### Frozen delta — `src/game/types/hostageQte.ts`

**`QteSpec`**

- **REMOVE:** `porteCochere`, `retreatSpeed`.
- **KEEP:** `triggerAtElapsedSeconds`, `zoomSeconds`, `anchor` (NOW a static establishing
  point — the captor never leaves it), `peekCadenceSeconds`, `peekDurationSeconds`.
- **ADD:** `readonly maxBlownPeeks: number;` — per-level cap: the count of closed-without-headshot
  peeks that triggers the execution (→ `LOST`). Integer ≥ 1 (asserted; must be reachable).
  DEFAULT VALUE is game-designer's; the field name/type is LAW.

**`HostageQte` (runtime)**

- **REMOVE:** `dir`, `speed`, `porteCochere`, and the moving-anchor advance. `anchor` becomes
  STATIC — copied once at `createQte` from `spec.anchor` and NEVER mutated by the tick.
- **ADD:** `readonly blownPeeks: number;` — counter, starts 0, increments once per PEEKING→COVERED
  close that was NOT a win.
- **ADD (runtime mirror):** `readonly maxBlownPeeks: number;` — copied from spec at `createQte`
  (same pattern as the `peekCadenceSeconds`/`peekDurationSeconds` mirrors: the tick reads only
  the runtime record and needs the cap to compare `blownPeeks`).
- **KEEP:** `phase`, `stance`, `telegraphActive`, `stanceRemaining`, `anchor` (static),
  `peekCadenceSeconds`, `peekDurationSeconds`, `zoomRemaining`, `zoomSeconds`, `resultRemaining`,
  `warning`.

### Frozen delta — `src/game/systems/qteSystem.ts` (dev-gameplay)

- **`createQte`:** drop the retreat kinematics (`dir = sign(door−start)`, `speed`, `porteCochere`)
  and the D1 asserts (`porteCochere.y === anchor.y` (C3), `porteCochere.x !== anchor.x`,
  `retreatSpeed > 0`). Remove `porteCochere.{x,y}` and `retreatSpeed` from the C6 finiteness list;
  ADD `maxBlownPeeks` to it. ADD an assert `maxBlownPeeks >= 1` (integer, positive — a loss must be
  reachable). Seed `anchor: spec.anchor` (static), `blownPeeks: 0`, `maxBlownPeeks`. KEEP the G5
  exposure-floor clamp and the G4 `peekCadenceSeconds > TELEGRAPH_LEAD_SECONDS` assert.
- **`tickQte` ACTIVE — DROP the retreat/door-reached branch entirely** (no anchor advance, no
  `dir*(anchor.x − porteCochere.x) >= 0` loss check). The new loss route lives INSIDE the
  COVERED↔PEEKING sub-machine loop: on each PEEKING→COVERED **close** that stayed ACTIVE, increment
  `blownPeeks` AND charge `QTE_UNANSWERED_PEEK` (−8) exactly as today; then if
  `blownPeeks >= maxBlownPeeks` the captor executes her → return `LOST` (carry the energy
  accumulated so far this tick, including that close's −8; the execution adds NO extra charge). The
  loop stays bounded (each iteration subtracts a strictly-positive stance duration); a large delta
  crossing several closes must stop at the FATAL close, not overshoot past `LOST`.
- **KEEP:** fire resolved FIRST via the stance-aware classifier; head-during-PEEKING → `WON`;
  `body`/`hostage`/`panic` energy penalties; unanswered-peek −8 on close; G4/G5 asserts; the
  `qteSpec === null` skip; the WON/LOST → DONE hold.
- **Deterministic tie-break preserved:** `fire` is resolved before the loss check, so a same-tick
  winning head-shot beats a same-tick fatal blown-peek → `WON`. (Reuses the existing "fire first"
  ordering; the door-reached tie-break is simply replaced by the cap-reached tie-break.)
- The stance-aware classifier (`qteZoneAt`) and the hitbox bands are UNCHANGED — offsets are
  anchor-relative and G6 still holds; they now apply to a static anchor, which only makes them
  more stable. Energy constants UNCHANGED.
- **`stateMachine.ts`:** the `tickQte(qte, fire, impactPoint, delta)` signature and the
  `{ qte, energyDelta }` result are UNCHANGED, so the call site needs no logic edit. (Verify: no
  reference to removed fields.)
- **`levels.ts` (belliard `QteSpec`):** delete `porteCochere`/`retreatSpeed`, add `maxBlownPeeks`
  (game-designer's value). Update the authoring comment (no more "7.2 u / 0.6 u·s⁻¹ = 12 s" retreat
  budget; the budget is now `maxBlownPeeks × peekCadence`).

**F-1 REVERSAL (record for pm/tech-writer):** this reverses the prior F-1 ruling. The hostage is
**killable again** — the captor executing her on the Nth blown peek is now the **sole** LOST route.
The ADR-0030 "hostage-death loss route" that F-1 retired is effectively reinstated, but re-keyed:
loss is not a stray-bullet HP death (still no `hostageHp`, no per-bullet death — guideline §5.6
holds), it is a _legible, telegraphed patience clock_ (miss N peeks → she dies). A hostage-band
hit stays a flat −30 energy penalty, NOT a loss.

### Frozen delta — render + view-hook (dev-r3f-render)

- **`qteCamera.ts`:** REMOVE `qteFollowTarget`, `QTE_DOOR_LEAD`, `QTE_DOOR_LEAD_MAX`. Revert to the
  ADR-0030 static-zoom shape: `qtePose(base, anchor, p)` targets the STATIC `qte.anchor` directly;
  `qteZoomInProgress`, `qtePose`, `qteRestorePose` otherwise unchanged.
- **`useGameLoop.ts`** (QTE driver ~L274–317): zoom to the static point — `qtePose(base, qte.anchor, p)`
  (drop the `qteFollowTarget(qte.anchor, qte.porteCochere)` lead). Restore-on-DONE path unchanged
  (simpler than the follow version). Pinch/edge-scroll `isQteActive` gating unchanged.
- **`HostageQteSprite.tsx`:** draw a STATIC tableau at the fixed `qte.anchor` (no moving-captor
  framing/comments). KEEP the peek tell + hitbox-aligned zones (captor/hostage/cue offsets). The
  LOST strobe now reads as the execution-on-blown-peeks; wording of comments updated off "retreat".
- **`hostageCue.ts`:** keeps the discrete peek tell + `captorTint` + `hostageAlarmColor` +
  `energyFloater`. Logic unchanged; drop any residual "retreat/distance-clock" prose.
- **`HUD.tsx`:** UNCHANGED. Still no captor-HP/countdown bars; `HudHostageQte = { phase, warning }`
  stays. `blownPeeks` is **diegetic** (read in-world via the tell/execution), NOT a HUD bar. OPEN
  QUESTION routed to `game-designer`/`ux-designer`: whether any minimal read of "peeks left before
  she's shot" is warranted (e.g. a subtle in-world tally) — do NOT add a HUD bar without their call;
  default is diegetic-only.

### Lane assignment — non-overlapping paths

| Lane               | Owns (writes)                                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dev-gameplay**   | `src/game/types/hostageQte.ts`, `src/game/systems/qteSystem.ts`, `src/game/levels/levels.ts` (belliard `QteSpec`), `src/game/systems/__tests__/` (+ `stateMachine.ts` only if a removed-field reference surfaces — expected none) |
| **dev-r3f-render** | `src/render/scene/qteCamera.ts`, `src/render/scene/HostageQteSprite.tsx`, `src/render/scene/hostageCue.ts`, `src/render/ui/HUD.tsx`, **`src/hooks/useGameLoop.ts`**, `src/render/scene/__tests__/`                                |

**No shared-file contention.** `qteCamera.ts` and its `useGameLoop.ts` importer are BOTH in the
render lane. `tickQte` is called from `stateMachine.ts` (game lane); `useGameLoop.ts` only _reads_
`gameStateRef.current.qte`. The two lanes never both write a file.

**Sequencing:** (1) dev-gameplay lands the FROZEN `hostageQte.ts` types file first (interface only,
no logic) → handoff. (2) Both lanes then fan out in parallel as concurrent Task calls on the
non-overlapping paths above. Render's `qteCamera.ts` edit (deleting `qteFollowTarget`) and its
`useGameLoop.ts` consumer must land together in the same lane pass so no dangling import.

### ADR impact — ADR-0034 D1 REVERSED (→ tech-writer / producer)

`producer` (Marion) allocates the ADR number — I do not self-allocate. **tech-writer** must
supersede/amend ADR-0034: its **D1** (distance-as-sole-clock / retreat to porte cochère) is
REVERSED by the product owner. Record the new decision — **static duel + blown-peeks loss clock**
— either as a NEW ADR that supersedes ADR-0034 D1, or as a dated amendment to ADR-0034 (Marion's
call on number/form). The record must also note: (a) `maxBlownPeeks` replaces
`retreatSpeed`/`porteCochere` as the per-level difficulty knob (ADR-0035 curve lane must retune
its enumerated knobs); (b) **F-1 is reversed** — the hostage is killable again via the execution
clock; the sole LOST route is `blownPeeks >= maxBlownPeeks`; (c) D5's `QTE_UNANSWERED_PEEK` now
does double duty (energy drain AND the loss counter's increment event).

- VERDICT: **CONTRACT FROZEN.** dev-gameplay → types file first; then both lanes parallel.
  tech-writer to revise ADR-0034 D1 (number from producer). Awaiting game-designer's `maxBlownPeeks`
  default + any cadence retune.

## 10. DESIGN GATE — static-duel revision — lead-game-designer (Karim) — 2026-07-18

Gating the game-designer (Sacha) revision spec
`docs/game-design/spec-hostage-qte-static-duel.md` — the deliverable triggered by
Bertrand's playtest rejection of ADR-0034 D1 (captor retreat / sliding-on-the-floor /
pointless porte-cochère envolée). Checked against the frozen contract delta in §9 above
(Winston, LAW), ADR-0034 D1–D6 + P1–P4/G4–G6, PROJECT_GUIDELINES (scope guard, §5.6
no-bullshit-death, single core loop, §6 no stress bar), and the prior gate (§5) it
partially supersedes.

**Scope / core loop / verifiability:** all PASS. The revision REDUCES scope (removes the
moving-captor mechanic + its art dependency, reverts to the ADR-0030 static-tableau
precedent) — no new undeclared extension. ~10.8 s ACTIVE inside a once-per-level side beat
that never advances the kill quota; core loop untouched; fits the 3–5 min envelope.
AC1–AC7 carry numbers, tolerances and named code asserts — a dev can implement without
guessing.

### The five gated decisions

1. **Static captor (zoom-and-hold). CONFIRM.** Kills both defects Bertrand named: nothing
   advances the anchor (no floor-slide), no door (no envolée). Coherent with P1–P3: P2
   ("motion breeds sang-froid — passing openings, temptation to fire too early") is served
   in **substance** by the KEPT COVERED↔PEEKING peek cadence — the "motion" that generates
   sang-froid is the head appearing/vanishing in the opening, NOT the lateral drag. The
   retreat was only ever the CLOCK, never the source of the temptation-to-fire; removing it
   does not dilute P2. Peek-duel, `qteZoneAt` hitbox bands and the energy ledger kept
   verbatim; G6 spatial disjointness now holds trivially on a fixed anchor. PASS.

2. **N = 4 blown peeks → execution → LOST (Belliard default, F3-curvable). CONFIRM.**
   Readable and fair (P3): each of the 4 openings is telegraphed (G4, 0.35 s ≥ 0.25 s) and
   ≥ 0.5 s exposed (G5) — every failure reads "I cracked", never "unreadable". N = 4 is the
   right default: it reproduces the old ≈ 4-clean-peek door budget (10.8 s vs old 12.0 s —
   a disclosed, negligible tempo delta) and 4 × −8 = −32 leaves the passive-ignore energy
   figure identical, so the economy is undisturbed. Heavier LOST consequence (death vs
   door-escape) raises P1 stakes without touching P3 readability. Enforced integer ≥ 1,
   authoring guidance N ≥ 2 (no single-blown-peek execution) — sound.

3. **No second clock / no HUD bar — `blownPeeks` (0→N) sole diegetic clock. CONFIRM.**
   Honours the single-clock decision ADR-0034 D1 fought for (now a static clock instead of
   a spatial one) and PROJECT*GUIDELINES §6 ("pas de barre de stress"). The counter advances
   only on a discrete, already-telegraphed event; gameplay exposes only `blownPeeks`/N. PASS
   — subject to Flag B (the \_read* has no committed owner-answer yet).

4. **F-1 reversal — hostage killable again (execution at N blown peeks = sole LOST route).
   CONFIRM coherence (product call, not re-litigated).** This supersedes the §5 gate's F-1
   "hostage non-killable" AND pm John's §8 ratify-recommendation — both were tied to the
   now-deleted door and are overridden by Bertrand's product decision. Coherent with
   §5.6 "jamais de mort bullshit": the death is NOT a stray-bullet HP death (a hostage-band
   hit stays a flat −30 energy penalty, non-fatal, no `hostageHp`) — it is a legible,
   telegraphed patience clock (miss 4 readable openings → she is executed). That is exactly
   the _visible, coherent cop rule_ §5.6 demands, and it sharpens P1. Recorded as F-1
   **superseded**, matching §9's "F-1 REVERSAL".

5. **Field-name reconciliation. CORRECTION C-1 (doc, not design).** The architect owns the
   frozen contract (§9) → `maxBlownPeeks` is LAW. The spec's `blownPeeksToLose` (§3.1 table,
   §5 "Enters the contract") must read `maxBlownPeeks` for consistency. Single-line rename,
   zero design change — routed to `tech-writer`/`game-designer`, not a re-gate.

### Corrections & routed flags

- **C-1 (doc → tech-writer / game-designer, blocking a clean PASS only as a rename):**
  `blownPeeksToLose` → `maxBlownPeeks` throughout `spec-hostage-qte-static-duel.md` to match
  the frozen contract. No value or design changes.
- **Flag A (→ producer / tech-writer):** the ADR record. ADR-0034 D1 is REVERSED
  (static duel + blown-peeks clock) and F-1 is reversed (hostage killable via execution
  clock). This gate RATIFIES that decision content as coherent; `producer` allocates the
  number, `tech-writer` writes the superseder/amendment (already scoped in §9 "ADR impact"
  and spec open-flag #1). ADR-0035's F3 curve lane must retune its enumerated knob:
  `maxBlownPeeks` replaces `retreatSpeed`/`porteCochere`.
- **Flag B (→ ux-designer Tony + lead-art Nico, condition on the stage-5 read, NOT a block
  on this gameplay deliverable):** the diegetic read of "how close is the captor to
  executing her" is an unresolved _distress-escalation vs discrete-pips_ OR with no
  committed owner-answer. "Player must sense proximity to execution" is load-bearing for
  P1/P3, and the existing `ux/spec-hostage-qte-hud-readability.md` was authored for the
  now-deleted distance clock — it needs a delta for the blown-peeks read. Gameplay exposes
  `blownPeeks`/N (verifiable); the _read_ is UX+art's to specify. No HUD bar (single-clock,
  §6). Must be closed before the stage-5 design-acceptance verdict.

Rework rounds used: 0 of 2. C-1 is a single-line rename, not a redesign — apply and
proceed to `senior-architect`/dev; no re-gate needed unless a value moves. Design
acceptance (stage 5) re-verdicts Sacha's playtest vs AC1–AC7 (and Flag B's resolved read)
post-BUILD.

- VERDICT: **PASS-WITH-CORRECTIONS** (design substance PASSES · apply C-1 field rename ·
  route Flag A ADR record to producer/tech-writer · route Flag B blown-peeks read to
  ux-designer/lead-art). Static captor, N = 4, single diegetic clock and the F-1 reversal
  are all CONFIRMED coherent. Cleared to `senior-architect` / dev once C-1 is applied.

## 11. DOCS — tech-writer (Otis) — 2026-07-18

- claim: apply the two doc-lane corrections routed by the §10 design gate — **C-1** (field
  rename) and **Flag A** (ADR record) — plus keep the indexes coherent with the revision.
- release:
  - **C-1 applied** — `blownPeeksToLose` → `maxBlownPeeks` throughout
    `docs/game-design/spec-hostage-qte-static-duel.md` (§3.1 table, §5 contract delta, and
    the matching AC5 reference in §6 — same field, left in sync). No value or design change.
  - **Flag A applied** — `docs/adr/0034-hostage-qte-duel-porte-cochere.md` gets a new
    **"Revision 2 — 2026-07-18: static duel (D1 reversed)"** section recording: D1 reversed
    (static captor, zoom-and-hold, per §9's frozen delta and Bertrand's verbatim playtest
    rejection); the blown-peeks execution clock replacing the door clock; the F-1 reversal
    (hostage killable again via the telegraphed execution clock, not a stray-bullet HP
    death); and the full `QteSpec`/`HostageQte` contract delta. Status line updated to
    `Accepted (amended 2026-07-18 — D1 reversed, see Revision 2)` per the ADR-0003/0028
    dated-amendment convention (no other Status-line change). ADR number NOT reallocated —
    per the story's own §9 "ADR impact" note, this is a dated amendment to ADR-0034, not a
    new ADR (`producer` was not asked to allocate a number for this pass; flag if a
    standalone superseder ADR is wanted instead).
  - **Registry regenerated**: `node scripts/gen-adr-index.mjs --write` then `--check` —
    fresh (41 ADR; ADR-0034's registry row now reads `Accepted (amended)`).
  - **Indexes kept coherent**: `docs/agent-handoffs.md` index row flipped from
    `pm-accepted` to `open` (the story is back in-flight on the revision; PR #79's original
    §8 pm ACCEPT-WITH-NOTES was for the retreat/porte-cochère build, now superseded) and
    reworded to name the static-duel revision and the F-1 reversal.
    `docs/game-design/README.md`'s `spec-hostage-qte-static-duel.md` row updated to mark
    C-1 and Flag A **applied** (was "route to tech-writer"); Flag B (blown-peeks read, →
    ux-designer/lead-art) is left open — not a docs-lane edit.
- verify: `npx --yes prettier@3.8.2 --check` on every markdown file touched — clean (see
  below). No code or tuning numbers touched.
- VERDICT: not a gate — doc realignment, traced to §10 findings C-1 and Flag A.

## 12. VERIFY — static-duel build: playtest + stage-6 code-review panel — 2026-07-18

- claim: verify the built static-duel revision (implementing §9's architect frozen delta +
  §10's design-gate corrections) end-to-end, and run the mandatory 4-reviewer merge-gate
  panel on the diff. This is the build that **replaced** the playtest-rejected retreat/
  porte-cochère version pm accepted-with-notes at §8 — that acceptance is superseded by
  this one.
- release:
  - **Bertrand playtested the built static duel and ACCEPTED it.** Browser verify confirms
    the spec's behavioural claims: static tableau (captor fixed at the zoom anchor, camera
    zoom-and-hold, **no** lateral slide — both defects he named in the Revision 2 rejection
    are gone), energy drains per blown peek matching the ledger (§3 of the spec), HUD clean
    (no captor-HP/countdown bars, no stress bar, per PROJECT_GUIDELINES §6). He deferred the
    peek-tell's final visual read to the art pass — **Flag B** (→ ux-designer/lead-art, the
    real peeking sprite + distress-escalation-vs-pips read) — a conscious, non-blocking
    deferral, not a build defect.
  - **Stage-6 code-review panel** (4 reviewers run in parallel: `code-review` high,
    `bmad-code-review`, `bmad-review-edge-case-hunter`, `security-review`) on
    `git diff origin/main...HEAD` — **NO CONFIRMED BLOQUANT/MAJEUR finding → MERGE**.
    Fix-lane hardening applied (single dev-lane diff, no re-review needed beyond the
    fix-lane rule): peek cue/tint no longer reads danger-red during the WON result hold;
    a stale score comment fixed. Loop-termination proof holds (the bounded blown-peeks
    sub-machine loop terminates on the fatal close, does not overshoot past `LOST`);
    determinism + the boundary law are clean (`qteSystem.ts` / `types/hostageQte.ts` remain
    zero React/Three).
  - Toolchain: `tsc` clean, `vitest` green (480 tests), `eslint` clean, `prettier` (3.8.2)
    clean. CI green on `claude/harness-1er-adr-otages-rcay2h` (PR #79).
- verdict: MERGE-CLEARED (panel + playtest) — proceeds to pm acceptance, §13.

## 13. PM ACCEPTANCE — pm (John) — 2026-07-18

- claim: final pipeline stage — accept or reject the static-duel STATIC-DUEL rework (PR #79,
  branch `claude/harness-1er-adr-otages-rcay2h`) against scope and the spec's AC1–AC7, and
  record the two consciously-deferred items. Not a re-review: leaning on the §10 design
  gate, Bertrand's playtest acceptance, and the §12 stage-6 panel's MERGE verdict.

### 1. Scope (cahier des charges)

**HOLDS.** This is a further-reduced-scope revision of an already scope-gated extension
(ADR-0030's static-tableau precedent → ADR-0034's F1/F2 duel-of-patience rework → this
Revision 2). The static-duel spec explicitly **removes** the moving-captor mechanic and its
art dependency rather than adding new scope, reverting to the ADR-0030 shape the guardrail
already cleared. Checked against every guardrail:

- **Core loop untouched.** `Récupérer → Livrer → Éviter` — the QTE remains a scripted,
  once-per-level side beat that freezes the rest of the level; it never touches delivery,
  recruitment, or the base récupérer/livrer/éviter mechanics.
- **Side objective, never advances the kill quota.** Unchanged (spec §3.2, ADR-0030 D4) — a
  rescue still pays `energy` only; `kills` is untouched. The blown-peeks loss clock is a new
  _fail_ route, not a new _scoring_ route — it does not touch the quota either.
- **Mission length.** No change to the ~10.8 s ACTIVE beat inside the 3–5 min mission
  envelope (guideline §2 KISS budget).
- **"Jamais de mort bullshit" (guideline §5.6).** The F-1 reversal (hostage killable again
  via the execution clock) is coherent, not a violation: no `hostageHp`, no per-bullet
  death, no coin-flip — it is a legible, fully telegraphed patience clock (G4 tell ≥ 0.35 s,
  G5 exposure ≥ 0.5 s, N = 4 readable openings). A hostage-band hit stays a flat, non-fatal
  −30. The design gate (§10, point 4) independently confirmed this reading; this is the
  product decision Bertrand himself steered via the playtest rejection, so no separate
  ratification is outstanding the way the original F-1 needed one at §8 — it is settled by
  this build being the one he accepted.

Design gate (`lead-game-designer`, §10) independently confirmed conscious-extension +
scope + core-loop + verifiability as PASS, noting the revision **reduces** scope. No open
scope question.

### 2. Acceptance criteria

Leaning on the design gate's AC1–AC7 audit (§10) and the §12 playtest + panel evidence, not
re-deriving: AC1 (static captor, no slide) — confirmed by Bertrand's browser playtest. AC2
(blown-peeks loss, N=4, ≈10.8 s ACTIVE) — matches spec §3.1/§6 tempo math, unit-tested. AC3
(head-during-`PEEKING` sole win route) — unchanged from the F1/F2 base, hitboxes kept
byte-for-byte (Bertrand likes them, spec §2). AC4 (energy ledger: rescue +40, hostage −30,
blown peek −8 once per close, panic −6, body −5; passive-ignore = −32 and `LOST`) — matches
playtest evidence (energy drains per blown peek, HUD clean). AC5 (G4/G5 floors +
`maxBlownPeeks` integer ≥ 1 asserted in code) — confirmed via the fix-lane's real-level-data
tests and the stage-6 panel's determinism/boundary check. AC6 (`qteZoneAt` bands unchanged)
— confirmed, no band value changes per spec §2. AC7 (deterministic when `qteSpec === null`)
— unaffected by this revision, boundary law holds per panel. `tsc` + `vitest` (480) +
`eslint` + `prettier` (3.8.2) green; CI green. **AC1–AC7: MET.**

### 3. Consciously-deferred, non-blocking items

- **Flag B — the peek-tell's art/UX read** (→ `ux-designer` Tony + `lead-art` Nico). The
  diegetic "how close is the captor to executing her" read (distress-escalation vs discrete
  pips) and the real peeking sprite (replacing the moving-captor cop-fallback placeholder)
  are not yet committed. Bertrand explicitly deferred this to the art pass during his
  playtest accept. No HUD bar — stays diegetic per PROJECT_GUIDELINES §6 and the design
  gate's point 3. Not a merge blocker; tracked for the next art-lane pass.
- **G4 no-margin NIT** (ADR-0035 tell-curve territory, stage-6 panel deferred item, §7(b)).
  `TELEGRAPH_LEAD_SECONDS` is a global constant (0.35 s), not a per-level `QteSpec` field.
  If ADR-0035/F3's per-level curve later wants to tighten the tell toward the 0.25 s floor,
  it will need a contract note to make the tell curvable. Not introduced by this revision,
  not a blocker — flagged forward to the ADR-0035 curve lane.

### VERDICT: **ACCEPT-WITH-NOTES**

- Scope: HOLDS (conscious, scope-_reducing_ revision of an already-gated extension; core
  loop intact; side-objective rule intact; F-1 reversal coherent with §5.6 and settled by
  this accepted build).
- AC1–AC7: MET (per design gate audit + Bertrand's playtest + stage-6 panel MERGE verdict).
- Notes (both non-blocking, consciously deferred, not re-opening this acceptance): **Flag B**
  (peek-tell art/UX read → ux-designer/lead-art) and the **G4 no-margin NIT**
  (TELEGRAPH_LEAD_SECONDS curvability → ADR-0035 F3 lane).
- This acceptance **supersedes** the §8 pm acceptance, which was for the playtest-rejected
  retreat/porte-cochère build. Story is accepted for merge; no further pm-lane rework
  required.

## 14. REVISION — wandering peek target (moving head-zone) — senior-architect (Winston) — 2026-07-18

**Bertrand wants a mechanic tweak on the accepted static duel.** The PEEK TARGET — the head
kill-zone / cue ring the player shoots during `PEEKING` — must now **MOVE** with a
random-feeling wander (a moving-target tracking test). **The captor stays static** (Revision 2
holds); only the **head zone** wanders, and only **while PEEKING**. Everything else in §9's
frozen delta is unchanged. This section is the FROZEN contract delta both lanes build against;
it supersedes §9 only where the head zone is now offset.

`game-designer` (Sacha) writes the feel/bounds/rebalance spec (wander amplitude, speed, and
whether they curve per level) in parallel; I own the CODE contract (field names/types) and the
DETERMINISM approach below.

### HARD CONSTRAINT — `src/game` stays replay-deterministic

No `Math.random`, no `Date.now`. The wander is a **seeded, PURE function** — deterministic
given an authored seed and the deterministic sim state. The stage-6 panel verified "no
randomness in `src/game`"; a seeded PRNG advanced deterministically **preserves** that (a
deterministic function is not randomness). Two determinism rules are LAW:

1. **The wander is a pure function of accumulated peek-time, NOT a per-tick stepped PRNG.**
   A per-tick random-walk step would be frame-count-dependent (variable `delta` → different
   result) — a replay landmine. A pure `wander(seed, peekIndex, t)` of the continuous
   peek-elapsed `t` is framerate-independent and robust to delta re-chunking. FROZEN: pure
   function, no carried mutable PRNG cursor.
2. **No `rngState` field is added.** All wander inputs already live in deterministic state
   (authored `targetSeed`, `blownPeeks`, and `stanceRemaining`). `targetOffset` is a stored
   DERIVED cache (render reads it + fire classifies against it), not a PRNG cursor.

### Frozen delta — `src/game/types/hostageQte.ts`

**`QteSpec`**

- **ADD:** `readonly targetSeed: number;` — authored deterministic seed for the head-zone
  wander. Finite (added to the C6 finiteness list). Field name/type is LAW; the VALUE is
  game-designer's. Different levels → different seed → different-feeling wander path.
- **Wander params (amplitude/speed): DEFAULT = system constants, NOT `QteSpec` fields.** They
  are seeded-feel/anti-frustration knobs, kept as constants in `qteSystem.ts`
  (`WANDER_AMP_X/Y`, wander angular speeds) alongside the energy/telegraph constants. **SEAM
  (single dependency on game-designer's spec):** if the F3 curve needs per-level wander
  difficulty, promote them to `QteSpec` (`readonly wanderAmplitude: Vec2; readonly
wanderSpeed: number;`) as an ADDITIVE change in the same dev-gameplay pass — otherwise leave
  them as constants. Freeze the DEFAULT as constants so the contract is buildable now.
- **Everything else unchanged** (§9 delta holds: `triggerAtElapsedSeconds`, `zoomSeconds`,
  static `anchor`, `maxBlownPeeks`, `peekCadenceSeconds`, `peekDurationSeconds`).

**`HostageQte` (runtime)**

- **ADD:** `readonly targetOffset: Vec2;` — the CURRENT head-zone centre, **anchor-relative**.
  Updated every tick. During `PEEKING`: `clampTargetOffsetG6(HEAD_NEUTRAL + wander(...))`.
  During `COVERED`/`ZOOMING`: the **NEUTRAL** head-zone centre `HEAD_NEUTRAL` (wander term = 0)
  — NOT literal `(0,0)`, so the telegraph wind-up ring draws at the head's resting spot, not on
  the captor's chest. Reset to `HEAD_NEUTRAL` on every peek close.
- **NO other new field.** No `rngState`, no peek-elapsed field: `tSincePeekOpen` is DERIVED
  (below), `peekIndex` is `blownPeeks` (below).
- **KEEP everything else** from §9 verbatim.

### Determinism approach — the exact shapes (LAW; dev-gameplay finalises values + tests)

- **Peek-elapsed (no new field):** `tSincePeekOpen = qte.peekDurationSeconds -
qte.stanceRemaining` while `PEEKING`. `peekDurationSeconds` is already the G5-clamped runtime
  exposure, so `t ∈ [0, peekDurationSeconds]`; at open `stanceRemaining = peekDurationSeconds`
  → `t = 0`. Both operands are deterministic sim state → `t` is deterministic and
  framerate-independent.
- **Per-peek index (no new field):** `peekIndex = qte.blownPeeks`. `blownPeeks` increments
  only on a `PEEKING → COVERED` close, so during the k-th exposure (1-indexed) `blownPeeks =
k − 1` — a stable ordinal for the CURRENT open peek. Feeding it into the wander decorrelates
  successive peeks so each of the N openings traces a different-feeling path (the
  "random-feeling" the tweak asks for), while staying fully deterministic.
- **Pure wander (system module `src/game/systems/`):**
  `wander(seed: number, peekIndex: number, t: number): Vec2` — a bounded sum-of-sines
  displacement centred on 0 (smooth + trackable, NOT jittery noise), per-peek phases derived
  from a cheap integer hash of `(seed, peekIndex)`. Bounded by construction (Σ sine amplitudes
  = the amp), so the amp box is the feel bound and the G6 clamp is the SAFETY net. Pure,
  deterministic, framerate-independent, unit-testable without a canvas.
- **`HEAD_NEUTRAL: Vec2`** — the head band centre, a system constant derived from the head
  band bounds (currently `((HEAD_DX_MIN+HEAD_DX_MAX)/2, (HEAD_DY_MIN+HEAD_DY_MAX)/2) =
(−0.35, 0.75)`). `targetOffset = clampTargetOffsetG6(HEAD_NEUTRAL + wander(...))`.

### Frozen delta — `qteZoneAt` signature change (dev-gameplay)

- **FROZEN new signature:** `qteZoneAt(dx: number, dy: number, stance: CaptorStance,
targetOffset: Vec2): QteZone`. The `head` band is now the head rectangle **centred on
  `targetOffset`** (i.e. tested as `|dx − targetOffset.x| ≤ HEAD_HALF_W && |dy − targetOffset.y|
≤ HEAD_HALF_H`, refactoring the head band from absolute `HEAD_D*_MIN/MAX` to
  centre±half-extent). Returned ONLY while `PEEKING`, exactly as today.
- **`hostage` / `body` / `miss` bands are UNCHANGED** — still anchor-relative (`targetOffset`
  does not move them). Precedence UNCHANGED: `hostage` checked first, then offset `head`
  (PEEKING only), then `body`, then `miss`.
- **G6 — ASSERTED invariant, not trusted from tuning.** The wander bounds must keep the head
  band DISJOINT from the hostage band at EVERY offset. FROZEN clamp guarantees it on the Y
  axis for ANY x (two rectangles disjoint on one axis ⇒ disjoint): `clampTargetOffsetG6`
  forces `centre.y ≥ HOSTAGE_DY_MAX + G6_MARGIN + HEAD_HALF_H` (head bottom stays above the
  hostage top by a non-zero margin regardless of x). Belt-and-suspenders: (a) runtime clamp on
  every computed `targetOffset`, AND (b) a unit test that across the full wander amp box the
  head band never intersects the hostage band (non-zero gap). Do NOT rely on the amp values
  being small enough — clamp AND test.

### Frozen delta — `tickQte` (dev-gameplay)

- **`ZOOMING`:** unchanged. `targetOffset` is `HEAD_NEUTRAL` (no wander pre-ACTIVE).
- **`ACTIVE` (order preserved):** (1) resolve `fire` FIRST against
  `qteZoneAt(dx, dy, qte.stance, qte.targetOffset)` — the STORED offset, i.e. exactly what
  render drew last frame → tightest aim-honesty (the ring the player shot at IS the scored
  zone). `head → WON`. (2) advance the COVERED↔PEEKING sub-machine — **UNCHANGED** (blown
  peeks / energy / the `maxBlownPeeks` fatal-close tie-break / bounded loop all verbatim from
  §9). (3) compute the OUTGOING `targetOffset` from the RESULTING stance: `PEEKING` →
  `clampTargetOffsetG6(HEAD_NEUTRAL + wander(qte.targetSeed, blownPeeks, tSincePeekOpen))`;
  `COVERED` → `HEAD_NEUTRAL`. Store it on the returned `qte`.
- **Reset on close:** falls out of step (3) — a `PEEKING → COVERED` close yields `COVERED` →
  `targetOffset = HEAD_NEUTRAL`.
- **Deterministic tie-break preserved:** `fire` resolved before the sub-machine (a same-tick
  winning headshot still beats the same-tick fatal blown-peek → WON). Energy constants,
  blown-peeks logic, WON/LOST hold: all unchanged.
- **`createQte`:** add `targetSeed` to the C6 finiteness guard; seed `targetOffset:
HEAD_NEUTRAL`. No other change.
- **`levels.ts` (belliard `QteSpec`):** add `targetSeed` (game-designer's value). No other
  field changes.
- **`stateMachine.ts`:** `tickQte(qte, fire, impactPoint, delta)` signature and
  `{ qte, energyDelta }` result UNCHANGED — call site needs no edit.

### Frozen delta — render + view-hook (dev-r3f-render)

- **`HostageQteSprite.tsx`:** the peek cue ring position is now `anchor + qte.targetOffset`,
  **written each frame** (during ACTIVE) instead of the fixed `CUE_DX/CUE_DY` one-time place.
  The captor + hostage meshes STAY positioned once (they do not move). Only the `peekCue` mesh
  gets a per-frame `position.set(anchor.x + qte.targetOffset.x, anchor.y + qte.targetOffset.y,
CUE_Z)` — one mesh, acceptable (the component already writes per-frame tints/pulse). Retire
  the `CUE_DX/CUE_DY` constants (their intent is now `HEAD_NEUTRAL` on the game side, and the
  ring follows `targetOffset`). This also CLOSES the long-standing "visible-head ==
  scored-head-zone" aim-honesty seam: the ring is now drawn at exactly the scored head-zone
  centre. Camera stays static-zoom — `useGameLoop.ts` / `qteCamera.ts` UNCHANGED.
- **`hostageCue.ts` / `HUD.tsx`:** UNCHANGED (the tell FORM/tint logic and the HUD are
  agnostic to where the ring sits). No new field surfaced to the DOM HUD.

### Lane assignment — non-overlapping paths

| Lane               | Owns (writes)                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dev-gameplay**   | `src/game/types/hostageQte.ts` (`targetSeed` on spec, `targetOffset` on runtime), `src/game/systems/qteSystem.ts` (pure `wander` + `HEAD_NEUTRAL`/`clampTargetOffsetG6` + new `qteZoneAt` sig + `tickQte`/`createQte`), `src/game/levels/levels.ts` (belliard `targetSeed`), `src/game/systems/__tests__/` (wander determinism + G6 clamp + moving-target classification tests) |
| **dev-r3f-render** | `src/render/scene/HostageQteSprite.tsx` only (ring follows `qte.targetOffset` per frame). No `src/game/**`, no camera/HUD change.                                                                                                                                                                                                                                               |

**No shared-file contention.** dev-gameplay owns all of `src/game/**`; dev-r3f-render touches
one render file and only READS `qte.targetOffset`. `useGameLoop.ts` / `qteCamera.ts` /
`hostageCue.ts` / `HUD.tsx` are untouched this pass.

**Sequencing:** (1) dev-gameplay lands the FROZEN `hostageQte.ts` field additions first
(`targetSeed`, `targetOffset`) → handoff. (2) Both lanes fan out in parallel as concurrent Task
calls on the non-overlapping paths above. Render only needs the `targetOffset` field to exist to
build against; the wander VALUES it draws come from the game lane at runtime.

### ADR impact (→ tech-writer / producer — number from producer, NOT self-allocated)

This is a **further amendment to ADR-0034** on top of Revision 2. Two records:

1. **The target MOVES — a deliberate reversal of the Revision-2 implication** that "the only
   motion is the peek exposure" (Revision 2 removed captor motion; this re-introduces motion,
   but LOCALISED to the head kill-zone, not the captor's body — the captor stays static). Record
   as a dated amendment (or superseder — Marion's call on number/form).
2. **New architecture decision worth recording: a seeded-PRNG-in-`src/game` precedent.** This
   INTRODUCES the first deliberate deterministic-pseudo-random source inside the pure game layer.
   The decision to record: seeded pure PRNG (pure function of authored seed + deterministic sim
   state, no `Math.random`/`Date.now`, no per-tick stepped cursor) is PERMITTED in `src/game`
   and PRESERVES replay determinism + the boundary law. Future randomness-flavoured mechanics
   should follow this shape (authored seed + pure function of accumulated sim time). Flag to
   `producer` for the ADR number and `tech-writer` to write it.

- VERDICT: **CONTRACT FROZEN.** dev-gameplay → `hostageQte.ts` field additions first; then both
  lanes parallel. tech-writer/producer: ADR amendment + seeded-PRNG precedent record. Awaiting
  game-designer's `targetSeed` value + wander amplitude/speed defaults (and their per-level-or-
  constant call, which triggers the additive `QteSpec` seam above only if per-level).

## 14. DESIGN — game-designer (Sacha) — 2026-07-18 — wander addendum → design gate

New Bertrand steer on the already-accepted static duel (PR #79):
_"il faudrait faire bouger le rond dans lequel il faut tirer / cela doit être des mouvements
aléatoires."_ The **head kill-zone + its reticle ring WANDER during PEEKING** — aiming
becomes a tracking-a-moving-target test. Captor stays static; §§1–7 inherited verbatim.

- **Deliverable:** `docs/game-design/spec-hostage-qte-static-duel.md` **§8** (addendum) —
  D-W1 what/when, D-W2 feel, D-W3 bounds, D-W4 difficulty, §8.6 AC8–AC11, §8.7 flags.
- **Key decisions:**
  - Feel: **seeded-waypoint wander** (per-QTE `wanderSeed` → pure PRNG advanced by the tick;
    NO `Math.random`/`Date.now` — replay-deterministic), ease-in/out per leg (deceleration =
    fairness firing window), min leg 0.15 u. Rejected Lissajous (periodic → learnable).
  - Speed: **`wanderSpeed` = 1.2 u/s** (Belliard, peak mid-leg). Trackable, not teleporting.
  - Zone: **0.5 × 0.5** (unchanged size — difficulty from motion, not shrink).
  - Bounds (centre, anchor-relative): dx **−0.70…−0.35**, dy **+0.60…+0.85** → head-box
    occupancy dx [−0.95, −0.10], dy [+0.35, +1.10]. **G6 holds on BOTH axes**: right edge
    −0.10 < hostage 0.0 (dx margin ≥ 0.10, = today's `HEAD_DX_MAX`, boundary preserved) AND
    bottom +0.35 > hostage top 0.15 (dy margin ≥ 0.20). No bavure ever required.
  - Belliard rebalance: **`peekDurationSeconds` 1.2 → 1.4 s** (acquire+track cushion, ≫ G5
    floor); **N = 4 unchanged**; cadence 1.5 s unchanged. Passive loss ≈ 11.6 s.
  - Contract: +`wanderSeed`/`wanderSpeed` on `QteSpec`, +`peekTargetOffset` (+wander
    bookkeeping) on runtime, `qteZoneAt` head test recentred on `peekTargetOffset`; region↔G6
    disjointness asserted in `createQte`. Render ring follows `peekTargetOffset`.
- **Status:** DRAFT — **needs `lead-game-designer` (Karim) PASS** before `senior-architect`
  and any dev. Flags to gate: §8.7 (ADR-0034 superseder touch; model choice; ring-follows read
  → lead-art/composite gate).

## 15. DESIGN GATE — wandering peek target — lead-game-designer (Karim) — 2026-07-18

Gating the `game-designer` (Sacha) wander addendum
`docs/game-design/spec-hostage-qte-static-duel.md` **§8** (D-W1…D-W4, AC8–AC11), the
deliverable triggered by Bertrand's steer _"faire bouger le rond dans lequel il faut tirer /
cela doit être des mouvements aléatoires."_ Checked against the architect's FROZEN contract
delta §14 above (Winston, LAW), ADR-0034 (D2–D6, P1–P4, G4–G6, Revision 2 static duel),
PROJECT_GUIDELINES (scope guard, §5.6 no-bullshit-death, §6 no stress bar, single core loop),
and the prior gates (§5, §10) this layers on.

**Scope / core loop / verifiability:** all PASS. Conscious, documented extension layered on
the already-extension QTE (§8 declares it explicitly); deepens the `Éviter`/aim-under-pressure
axis, adds **no new loop verb**. Core loop untouched — still a scripted once-per-level side
beat that never advances the kill quota (D4 inherited). ~11.6 s ACTIVE inside the 3–5 min
envelope. AC8–AC11 carry numbers, bounds, named code asserts and a `verify` playtest gate — a
dev can implement without guessing. This is product-owner-driven iteration (Revision 3), not
undeclared creep; the ADR record is routed (Flag Y).

### THE WANDER-MODEL RULING (the crux — explicit, so dev implements exactly one)

**RULING: the WAYPOINT model ships** — a seeded, eased **hashed-waypoint** wander — **NOT**
the architect's illustrative sum-of-sines. **Under the non-negotiable constraint it MUST be a
pure closed-form function of `t`** (Winston §14 determinism LAW stands, unchanged): the
waypoint model is written as `waypoint[k] = hash(targetSeed, peekIndex, k)` mapped into the
bounds box, `k = floor(tSincePeekOpen / legDuration)`, smoothstep-eased between `waypoint[k]`
and `waypoint[k+1]`. This is **signature-identical** to Winston's frozen
`wander(targetSeed, peekIndex, t): Vec2` (pure, bounded, framerate-independent, hash-derived
phases, wrapped by `clampTargetOffsetG6`) — so the ruling **fills the one internal Winston left
to design/dev, it does NOT reopen his frozen contract.** Sum-of-sines was his illustrative
sketch ("dev finalises"), not contractual.

Three design reasons the waypoint model wins on the axis that is mine (feel/coherence);
determinism is satisfied either way:

1. **Serves Bertrand's verbatim intent best.** _"cela doit être des mouvements aléatoires."_
   A bounded sum-of-sines with few terms is quasi-periodic → visibly a smooth looping figure →
   **learnable**. Sacha's rejection of Lissajous (§8.2, D-W2) is sound and anchored directly to
   the steer. Hashed, decorrelated-per-peek legs read as genuinely erratic.
2. **The deceleration-into-waypoint is a load-bearing FAIRNESS affordance (P3).** Ease-in/out
   per leg gives an explicit "the target is arriving and slowing → shoot NOW" window every leg —
   a designed firing opportunity that serves P3 ("always 'I cracked', never unreadable") and
   G5-fairness under motion. Sum-of-sines has velocity minima too, but at muddier phase points
   with no discrete "heading there" read.
3. **The tuning and the model are coherent only as a SET under waypoints.** Sacha's §8.4
   rebalance (peek 1.2→1.4 s, `wanderSpeed` 1.2 u/s) was computed **assuming the
   deceleration-into-waypoint firing windows exist** (§8.2: "the deceleration at each waypoint
   is the fairness feature"). Shipping waypoints keeps that assumption valid. Shipping
   sum-of-sines would silently invalidate the fairness budget the 1.4 s cushion was sized
   against — a coherence break. Decisive.

The stateful part of Sacha's §8.2 is the only thing that FAILS — see W-1: his "PRNG state lives
in the runtime and is advanced in `tickQte`" + "on arrival, draw the next" is exactly the
per-tick stepped cursor Winston §14 forbids. That is an implementation realignment (the FEEL is
unchanged), not a design reversal.

### The three sub-validations

- **Difficulty / fairness (peek 1.2→1.4 s, N=4, 0.5-wide zone, 1.2 u/s): PASS.** +0.2 s to
  acquire→track→fire a moving reticle, still ≫ G5 floor 0.5 s; reaction ~0.3–0.5 s leaves
  ~0.9 s tracking + a waypoint ease as a firing window. 1.2 u/s over the small 0.35×0.25 region
  is followable, not a coin-flip. **Clean single-variable discipline:** difficulty comes from
  motion (zone stays 0.5), and the 1.4 s is the _compensating rebalance_ for it, not a stacked
  second difficulty lever — disclosed. N=4 keeps the four-honest-chances tempo and the −32
  passive-ignore economy intact; ≈11.6 s vs 10.8 s is a disclosed, within-tolerance delta.
  Belliard sits at the gentle end of every knob (level-1 approachable). The human-trackability
  claim is correctly deferred to the stage-5 `verify` playtest (AC11) — the right place to
  confirm it empirically.
- **G6 (bounds box vs hostage): PASS, coherent.** Sacha's box keeps the head-box disjoint on
  BOTH axes (dx margin ≥0.10 with the right edge pinned at today's `HEAD_DX_MAX` −0.10; dy
  margin ≥0.20). Winston §14 enforces the SAFETY net on the **Y axis** (`clampTargetOffsetG6`:
  head bottom ≥ `HOSTAGE_DY_MAX + G6_MARGIN + HEAD_HALF_H`, disjoint for ANY x) plus a
  full-amp-box unit test. These are consistent and the clamp is a _superset_ of Sacha's design
  (Y-disjoint ⇒ disjoint regardless of x). One clarification for dev (not a defect): **the
  asserted-in-code G6 net is Winston's Y clamp**; Sacha's dx right-edge margin is a feel /
  on-frame / no-bavure bound and a second test-verified margin. AC9 asserting BOTH margins via
  the box test is fine and stricter. No bavure is ever required to reach the head. Holds.
- **Scope: PASS.** Conscious extension, side objective, core loop intact (see above). The
  seeded-PRNG-in-`src/game` first (Winston §14 ADR-impact #2) is an architecture record, his
  lane, coherent with the boundary law (pure function, deterministic) — not a design blocker.

### Corrections (realignments to the frozen contract — apply, no re-gate unless a VALUE moves)

- **W-1 (blocks a clean PASS — the crux realignment → `game-designer` / `tech-writer`).**
  Re-express §8.2 and §8.5 to the **pure closed-form waypoint** model above: DROP "the wander
  state (…, current waypoint, PRNG state) lives in the `HostageQte` runtime and is advanced in
  `tickQte`" and "on arrival, draw the next" — these violate Winston §14 LAW #1/#2. Replace with
  `waypoint[k] = hash(targetSeed, peekIndex, k)` in-bounds, `k = floor(tSincePeekOpen /
legDuration)`, smoothstep-eased; runtime stores **only** the DERIVED `targetOffset` cache —
  **no `rngState`, no waypoint-cursor field** (`peekIndex = blownPeeks`,
  `tSincePeekOpen = peekDurationSeconds − stanceRemaining`, per §14). The `wanderSpeed = 1.2 u/s`
  peak is PRESERVED as the feel target, realized via `legDuration` tuned against the bounds box.
  The §8.2 min-leg 0.15 u anti-jitter floor is a KEPT design intent — dev honours it inside the
  closed form (min-distance constraint on the hash mapping / re-hash). This is a
  spec-vs-frozen-contract realignment (like G-1/C-1 before), the FEEL is unchanged, not a
  redesign.
- **W-2 (doc reconcile → `game-designer` / `tech-writer`).** Rename to the frozen field names:
  `wanderSeed` → **`targetSeed`**, `peekTargetOffset` → **`targetOffset`** throughout §8 (§8.2,
  §8.3, §8.5, §8.6, AC10). And reconcile the `wanderSpeed`/amplitude PLACEMENT with §14: for
  **Belliard-first they are system constants in `qteSystem.ts`**, NOT `QteSpec` fields (§14).
  Sacha's §8.4 F3 note (later districts curve `wanderSpeed`/region) is a genuine future need →
  it is the **additive `QteSpec` promotion seam** Winston pre-authorized (`wanderAmplitude`,
  `wanderSpeed` on `QteSpec`) — flag to `senior-architect` to land additively **when F3
  arrives**, not now. No value change; only `targetSeed` enters `QteSpec` for Belliard.

### Flags routed (not blocks)

- **Flag X (→ `senior-architect` Winston, sync — low risk).** Confirm the eased-hashed-waypoint
  internal is accepted within your frozen `wander(targetSeed, peekIndex, t): Vec2` signature — it
  is signature- and determinism-identical to your sum-of-sines sketch, wrapped by the same
  `clampTargetOffsetG6`. Your LAW is unchanged; only the internal shape is now specified (the
  design lane's call on feel). Expected: rubber-stamp; raise only if the hash/leg scheme has a
  determinism wrinkle I've missed.
- **Flag Y (→ `producer` / `tech-writer`).** ADR record: the further ADR-0034 amendment (target
  MOVES — localised to the head zone, captor still static) + the seeded-PRNG-in-`src/game`
  precedent (§14 ADR-impact). This gate RATIFIES the decision content as coherent; number from
  `producer`, record by `tech-writer`. Note the model ruling (waypoint, closed-form) so the ADR
  reflects what ships, not the sines sketch.
- **Flag Z (→ `ux-designer` Tony / `lead-art` Nico, composite gate — condition on stage-5, not
  a block on this deliverable).** §8.7 #6 ring-follows-target read: confirm the moving ring still
  reads as "shoot HERE" and its alignment to the (now-recentred) kill-box holds across the
  wander. Reinforced by §14: the ring now draws at exactly the scored `targetOffset` centre —
  this CLOSES the long-standing visible-head-vs-scored-zone aim-honesty seam. Reconcile at the
  composite gate against the real peeking art. This nests with the still-open **Flag B** (peek
  distress-escalation read) from §10.

Rework rounds used: 0 of 2. W-1/W-2 are realignments of spec prose to Winston's already-frozen
§14 contract + a field rename — apply and proceed to dev; **no re-gate** unless a tuning VALUE
(peek 1.4 s, N=4, `wanderSpeed` 1.2 u/s, the bounds box) moves. Stage-5 design acceptance
re-verdicts Sacha's `verify` playtest vs AC8–AC11 (plus inherited AC1–AC7) post-BUILD, with the
AC11 trackability claim and Flag Z read as the load-bearing checks.

- VERDICT: **PASS-WITH-CORRECTIONS.** Wander-model ruling: **the closed-form hashed-WAYPOINT
  model ships** (NOT sum-of-sines), as a pure function of `t` per Winston §14 (his determinism
  LAW unchanged). Apply W-1 (waypoint→closed-form realignment) + W-2 (field-name/placement
  reconcile); route Flag X (architect sync), Flag Y (ADR), Flag Z (art/UX composite). Difficulty,
  G6 and scope all PASS. Cleared to `senior-architect` / dev once W-1/W-2 are applied.

## 16. DOCS — tech-writer (Otis) — 2026-07-18

- claim: apply the two doc-lane corrections routed by the §15 design gate — **W-1**
  (closed-form waypoint model realignment) and **W-2** (field-name/placement reconcile) — to
  `docs/game-design/spec-hostage-qte-static-duel.md` §8, plus record **Flag Y** (the ADR
  amendment: the target moves + the seeded-pure-PRNG-in-`src/game` precedent).
- release:
  - **W-1 applied** — §8.2 re-expressed from the stateful draft ("the wander state
    (`peekTargetOffset`, current waypoint, PRNG state) lives in the `HostageQte` runtime and
    is advanced in `tickQte`" + "on arrival, draw the next" — exactly the per-tick stepped
    cursor `senior-architect` §14 LAW #1/#2 forbids) to the gated **closed-form hashed-
    waypoint model, a PURE function of `t`**: `waypoint[k] = hash(targetSeed, peekIndex, k)`
    mapped into the wander region, `k = floor(t / legDuration)`, smoothstep-eased between
    consecutive waypoints. The runtime stores ONLY the derived `targetOffset` cache — no
    `rngState` field, no waypoint-cursor field (`peekIndex`/`t` are both already-derived sim
    state, per §14). Feel targets preserved **verbatim** (`wanderSpeed` ≈ 1.2 u/s peak
    realised via `legDuration`; the 0.15 u min-leg anti-jitter floor enforced as a
    min-distance constraint on the hash mapping; deceleration-into-waypoint = the fairness
    firing window). No tuning value changed — realignment, not a redesign.
  - **W-2 applied** — renamed `wanderSeed` → `targetSeed` and `peekTargetOffset` →
    `targetOffset` throughout §8 (§8.1, §8.2, §8.5, §8.6, §8.7 — draft names kept, in
    prose, only where citing "was X in the draft" for traceability). §8.2/§8.4/§8.5 now
    state `wanderSpeed` and the wander amplitude are Belliard-first **SYSTEM CONSTANTS** in
    `qteSystem.ts`, NOT `QteSpec` fields — only `targetSeed` enters `QteSpec` today; the
    per-level promotion of speed/amplitude is flagged as the additive `QteSpec` seam that
    lands **when F3/ADR-0035 arrives**, not now. §8's own Status line flipped from DRAFT to
    PASS-WITH-CORRECTIONS (corrections applied, cleared to `senior-architect`/dev per §15's
    verdict).
  - **Flag Y applied** — `docs/adr/0034-hostage-qte-duel-porte-cochere.md` gets a new
    **"Revision 3 — 2026-07-18: wandering peek target"** section recording: the head
    kill-zone / reticle now **MOVES** during `PEEKING` (a moving-target tracking test) while
    the **captor stays static** — a deliberate, localised re-introduction of motion; the
    closed-form hashed-waypoint model ruling (over the illustrative sum-of-sines sketch);
    the contract delta (`QteSpec.targetSeed`, `HostageQte.targetOffset`, `qteZoneAt` gains a
    `targetOffset` arg, Belliard `peekDurationSeconds` 1.2 → 1.4 s); and a new **architecture
    precedent** — a seeded **PURE** PRNG (an authored seed + a pure function of deterministic
    sim state — peek ordinal + peek-elapsed `t` — no `Math.random`/`Date.now`, no per-tick
    stepped cursor) is **PERMITTED** in `src/game` and preserves replay-determinism + the
    boundary law; future randomness-flavoured mechanics follow this shape. Status line's
    amendment note updated to name Revision 3 (no other Status-line change). ADR number NOT
    reallocated — a further dated amendment to ADR-0034, per the story's own §14 "ADR impact"
    note (`producer` was not asked for a standalone superseder number for this pass).
  - **Registry regenerated**: `node scripts/gen-adr-index.mjs --write` then `--check` —
    fresh (41 ADR; ADR-0034's registry row still reads `Accepted (amended)`, the normalized
    label is unaffected by the added Revision-3 clause in the Status line).
- verify: `npx --yes prettier@3.8.2 --check` on every markdown file touched (this shard, the
  ADR, the spec) — clean (see below). No code or tuning numbers touched.
- VERDICT: not a gate — doc realignment, traced to §15 findings **W-1**, **W-2**, and
  **Flag Y**.

## 17. REVISION — captor HP + colour-timed ring damage — senior-architect (Winston) — 2026-07-18

**Bertrand's confirmed product call REVERSES ADR-0034 D4** (the binary "one headshot = kill,
no captor HP"). New resolution model for the hostage-QTE:

- the captor has an **HP bar** again;
- the wandering peek ring **CYCLES rouge→jaune→vert** as a timing meter;
- a `head` shot aligned with the ring removes captor HP **by colour**: green = big, yellow =
  small, red = 0 (wasted);
- **depleting captor HP → `WON`**;
- **loss is UNCHANGED**: the execution-after-N-blown-peeks clock (`blownPeeks >= maxBlownPeeks`
  → `LOST`) stays the sole failure route;
- the wander becomes **WIDER + FASTER**.

`game-designer` (Sacha) writes the numbers (captorHp default, cycle period, per-colour damage,
the wider/faster wander constants) in parallel; the architect owns the CODE contract + the
determinism below. This section is FROZEN LAW both lanes rebuild against; it supersedes the
binary-kill wording of prior sections wherever they conflict.

### HARD CONSTRAINTS (unchanged, restated as they bind this delta)

- `src/game/**` stays **React/Three-free AND replay-deterministic** — no `Math.random`, no
  `Date.now`.
- The colour cycle, **like the wander**, is a **PURE function of the peek-elapsed `t`**
  (`t = peekDurationSeconds − stanceRemaining`, clamped ≥ 0 — the SAME `t` the wander uses).
  No per-tick stepped/mutated state; re-chunking the same total `t` yields the same colour →
  framerate-independent, replay-deterministic.

### Frozen delta — `src/game/types/hostageQte.ts`

**`QteSpec` — ADD**

- `readonly captorHp: number;` — authored per-level captor health. **Integer ≥ 1** (asserted in
  `createQte`, and added to the C6 finiteness list). DEFAULT VALUE is game-designer's; the
  field name/type is LAW. **F3 seam:** only `captorHp` is authored — the cycle period and the
  per-colour damage amounts stay **SYSTEM CONSTANTS** in `qteSystem.ts` (Belliard-first, same
  precedent as the wander amplitudes / energy prices); ADR-0035/F3 may promote them to additive
  `QteSpec` fields later, not now.
- **UNCHANGED:** `targetSeed`, `maxBlownPeeks`, `peekCadenceSeconds`, `peekDurationSeconds`,
  `triggerAtElapsedSeconds`, `zoomSeconds`, `anchor`.

**`HostageQte` (runtime) — ADD**

- `readonly captorHp: number;` — CURRENT captor health. Copied from `spec.captorHp` at
  `createQte` (starts = spec value, same mirror pattern as `maxBlownPeeks`). Decremented by
  colour-timed head hits; never below 0.
- `readonly ringPhase: number;` — **DERIVED cache**, `[0,1)`, `= cyclePhase(t)` — the ring's
  cycle position for the **last-drawn** peek state. **FROZEN CHOICE: store it** (do NOT let
  render recompute). Rationale: this is the exact analogue of `targetOffset` — a derived value
  cached on the runtime so (a) render reads the colour band without recomputing, and (b) the
  tick resolves a shot against the **last-drawn** colour by reading one canonical field, closing
  the colour-honesty seam the same way `targetOffset` closed the aim-honesty seam. Computed at
  the END of each ACTIVE tick alongside `targetOffset`, from the **identical** `t`, so colour
  and position always describe the same drawn frame. Rests at `0` while COVERED/ZOOMING.
- **UNCHANGED:** `targetOffset`, `targetSeed`, `blownPeeks`, `maxBlownPeeks`, `stance`,
  `telegraphActive`, `stanceRemaining`, `anchor` (static), `peekCadenceSeconds`,
  `peekDurationSeconds`, `zoomRemaining`, `zoomSeconds`, `resultRemaining`, `warning`.

### Colour cycle — the pure determinism shape (LAW)

Pure functions in `qteSystem.ts`, functions of `t` ALONE (no seed, no peekIndex — the cycle
restarts at red at each peek open because `t` resets per peek; simpler than the wander):

```ts
export type RingColour = "red" | "yellow" | "green";

// System constants (game-designer's values):
export const RING_CYCLE_SECONDS: number; // one full rouge→jaune→vert period, > 0
// Three CONTIGUOUS slices over [0,1), in cycle order red → yellow → green, summing to 1.
// Expressed as two cumulative phase thresholds (game-designer picks the split):
export const RING_RED_UNTIL: number; // 0 < RING_RED_UNTIL <= RING_YELLOW_UNTIL < 1
export const RING_YELLOW_UNTIL: number; // green = [RING_YELLOW_UNTIL, 1)
// Integer captor damage per colour (keeps captorHp integer under subtraction):
export const CAPTOR_DAMAGE_GREEN: number; // big,  integer >= 1
export const CAPTOR_DAMAGE_YELLOW: number; // small, integer >= 1
// red damage is 0 (implicit — a wasted, no-HP-removed head hit).

/** Pure cycle position [0,1) of the ring at peek-elapsed t. (t % P)/P — framerate-free. */
export function cyclePhase(t: number): number {
  return (Math.max(0, t) % RING_CYCLE_SECONDS) / RING_CYCLE_SECONDS;
}

/** The colour band for a phase in [0,1): ordered red → yellow → green. */
export function ringBandOfPhase(phase: number): RingColour {
  if (phase < RING_RED_UNTIL) return "red";
  if (phase < RING_YELLOW_UNTIL) return "yellow";
  return "green";
}

/** Convenience: the ring colour at peek-elapsed t (pure). */
export function ringColourAt(t: number): RingColour {
  return ringBandOfPhase(cyclePhase(t));
}

/** Captor HP removed by a head hit landed on colour c (red → 0). */
export function colourDamage(c: RingColour): number {
  return c === "green" ? CAPTOR_DAMAGE_GREEN : c === "yellow" ? CAPTOR_DAMAGE_YELLOW : 0;
}
```

Render consumes the SAME `ringBandOfPhase(qte.ringPhase)` (or maps the phase to its own colour
constants) — one shared band function, no divergence between the drawn colour and the scored
colour.

### Frozen delta — `src/game/systems/qteSystem.ts` (dev-gameplay)

- **`createQte`:** add `spec.captorHp` to the C6 finiteness numerics list; assert
  `Number.isInteger(spec.captorHp) && spec.captorHp >= 1` (a win must be reachable). Seed
  `captorHp: spec.captorHp`, `ringPhase: 0`. Everything else (G5 clamp, G4 assert,
  `maxBlownPeeks` assert, `blownPeeks: 0`, static `anchor`) UNCHANGED.

- **`tickQte` ACTIVE — resolution rework (ORDER STILL MATTERS):**
  1. **Resolve `fire` FIRST** (preserves the deterministic tie-break). Classify with today's
     stance-aware `qteZoneAt(impact − anchor, qte.stance, qte.targetOffset)` — aim resolved
     against the **last-drawn** `qte.targetOffset` (unchanged). On `zone === "head"`:
     - `const dmg = colourDamage(ringBandOfPhase(qte.ringPhase));` — colour resolved against the
       **last-drawn** `qte.ringPhase` (colour-honesty: the player is judged on the colour the
       ring showed when they fired, exactly as the aim is judged on the offset they saw). A red
       ring ⇒ `dmg = 0` (wasted, no HP removed).
     - `const captorHp = qte.captorHp - dmg;`
     - if `captorHp <= 0` → **return `WON`** (`{ ...qte, phase: "WON", captorHp: 0 }`,
       `energyDelta: QTE_RESCUE_REFILL`) — this is the SAME early-return the binary head-kill
       used, now gated on depletion.
     - else (a chip that did not kill): **record `captorHp` and FALL THROUGH** to the
       sub-machine (do NOT early-return — the captor is alive, the peek must keep ticking).
     - `zone === "body"` → `+= QTE_BODY_HIT`, `zone === "hostage"` → `+= QTE_HOSTAGE_HIT`,
       `miss` → nothing. **Body/hostage/miss deal NO captor damage** (unchanged energy penalties).
  2. **Sub-machine loop UNCHANGED in structure.** On each PEEKING→COVERED **close** while the
     captor is still alive (we only reach a close if fire did not deplete HP): `blownPeeks += 1`
     and `energyDelta += QTE_UNANSWERED_PEEK`, exactly as today (these remain the same single
     event); then `blownPeeks >= maxBlownPeeks` → **`LOST`** (execution; no extra charge; HALT at
     the fatal close, bounded loop preserved — each iteration subtracts a strictly-positive
     stance duration).
  3. **Compute the OUTGOING `targetOffset` AND `ringPhase` from the same `t`:**
     ```ts
     if (stance === "PEEKING") {
       const t = Math.max(0, qte.peekDurationSeconds - stanceRemaining);
       targetOffset = clampTargetOffsetG6({ x: HEAD_NEUTRAL.x + wander(...).x, y: ... });
       ringPhase = cyclePhase(t);          // SAME t as the wander
     } else {
       targetOffset = HEAD_NEUTRAL;
       ringPhase = 0;
     }
     ```
     Carry `captorHp` (post-chip) and `ringPhase` on every returned record.

- **Tie-break preserved:** fire is resolved before the loss check, so a head hit that **depletes
  HP** on the fatal peek → `WON`; a head hit that only **chips** on the fatal peek does NOT save
  the run — the loop reaches the fatal close → `LOST` (only a KILLING shot wins the tie).

- **UNCHANGED:** `qteZoneAt` and all hitbox bands (offsets anchor-relative, static anchor,
  G6 holds); the energy constants; the ZOOMING panic charge; the WON/LOST → DONE hold; the
  `tickQte(qte, fire, impactPoint, delta)` signature and `{ qte, energyDelta }` result — so
  `stateMachine.ts` needs **no logic edit** (verify: no reference to removed fields).

- **`levels.ts` (belliard `QteSpec`):** add `captorHp` (game-designer's value); update the
  wander-tuning comment for the wider/faster amplitudes. No other field changes.

### Wander — WIDER + FASTER (system constants; dev-gameplay)

- `WANDER_AMP_X` / `WANDER_AMP_Y` (bigger box) and the peak-speed knob (`LEG_DURATION` smaller
  and/or bigger amplitude) take **game-designer's new values** — these are the existing SYSTEM
  CONSTANTS, so a **pure value change**, no type-contract change.
- **G6 stays.** `clampTargetOffsetG6` is a **Y-axis floor** (head-band bottom ≥
  `HOSTAGE_DY_MAX + G6_MARGIN + HEAD_HALF_H`), which makes the two bands Y-disjoint ⇒ disjoint
  for ANY x — so it **still holds for a wider box, unchanged**. Action: the G6 property test
  MUST be re-swept over the NEW wider amplitude box.
- **If the design needs an ASYMMETRIC box** ("right edge pinned at the hostage-clear edge; only
  left/up grow"): a symmetric `WANDER_AMP_X` increase grows the box rightward too. Keeping the
  right edge pinned is a wander-**internal** change to `rawWaypoint`'s mapping (map the hash into
  per-edge bounds `[loX,hiX]×[loY,hiY]` instead of `[−AMP,+AMP]²`) — still pure, still seeded,
  still `clampTargetOffsetG6`-wrapped, **no TYPE-contract field change**. Confirmed:
  `clampTargetOffsetG6` needs no edit either way (Y-disjointness is box-shape-independent);
  only the G6 test sweep updates. dev-gameplay picks symmetric-value vs asymmetric-mapping to
  match Sacha's box.

### Frozen delta — render + view-hook (dev-r3f-render)

- **`HostageQteSprite.tsx`:** the peek ring's colour now reflects `ringBandOfPhase(qte.ringPhase)`
  — the rouge→jaune→vert cycle — **replacing** the old stance-tell tint (`peekTellVisual`'s
  `TELL`/`ALARM` colour on the ring). The ring's FORM two-beat signal (radius/opacity for
  COVERED wind-up vs PEEKING open window, reduced-motion steady degrade) is KEPT — colour is
  the new timing channel layered on the same form, still never the SOLE channel (a11y). The ring
  still FOLLOWS `qte.targetOffset` (aim-honesty). ADD a minimal captor-HP read (pips?) — form/
  placement is **ux-designer/game-designer's call**; DEFAULT is an **in-world** read on the
  captor sprite, NOT a HUD bar.
- **`hostageCue.ts`:** may gain a phase→ring-colour helper (or import `ringBandOfPhase` +ring
  colour constants) so the colour maths stays unit-testable off-canvas. `captorTint` (the captor
  SPRITE tint) and `hostageAlarmColor`/`energyFloater` unchanged.
- **`HUD.tsx`:** UNCHANGED by default. `HudHostageQte = { phase, warning }` stays; the captor-HP
  read is in-world. **FLAG:** re-introducing captor HP reverses the ADR-0034 U-1 "no captor-HP
  HUD bar" — if ux-designer rules a HUD element returns, that touches `HudHostageQte` + `HUD.tsx`
  and must be logged here before either lane builds it.
- **`qteCamera.ts` / `useGameLoop.ts`:** UNCHANGED (static zoom).

### Lane assignment — non-overlapping paths

| Lane               | Owns (writes)                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dev-gameplay**   | `src/game/types/hostageQte.ts` (`captorHp` + `ringPhase`), `src/game/systems/qteSystem.ts` (`captorHp`/`ringPhase`/`cyclePhase`/`ringBandOfPhase`/`ringColourAt`/`colourDamage` + damage resolution + wider/faster wander constants), `src/game/levels/levels.ts` (belliard `captorHp`), `src/game/systems/__tests__/` |
| **dev-r3f-render** | `src/render/scene/HostageQteSprite.tsx` (ring colour = `ringPhase` cycle + captor-HP read), `src/render/scene/hostageCue.ts` (phase→colour helper), `src/render/scene/__tests__/` — and `src/render/ui/HUD.tsx` ONLY if a HUD captor-HP read is approved (flagged above)                                               |

**No shared-file contention.** `ringBandOfPhase` is game-owned (pure, in `qteSystem.ts`); render
imports it read-only or mirrors the band with its own colour constants. `tickQte` is called from
`stateMachine.ts` (game lane); render only READS `qte.captorHp`/`qte.ringPhase`/`qte.targetOffset`.
**Sequencing:** (1) dev-gameplay lands the FROZEN types (interface only, `captorHp` + `ringPhase`)
first → handoff. (2) Both lanes fan out in parallel on the non-overlapping paths above.

### ADR impact — ADR-0034 D4 REVERSED (→ tech-writer / producer)

`producer` (Marion) allocates the ADR number — I do NOT self-allocate. **tech-writer** records a
new dated amendment to ADR-0034 — **Revision 4 — 2026-07-18: captor HP + colour-timed ring
damage** — capturing:

- (a) **D4 is REVERSED** — the duel is no longer binary "one headshot = kill"; the captor has
  graded HP (`QteSpec.captorHp` / `HostageQte.captorHp`) depleted by **colour-timed head
  damage** (green big / yellow small / red 0), and depleting it is the `WON` route;
- (b) the **loss route is UNCHANGED** — `blownPeeks >= maxBlownPeeks` execution stays the sole
  `LOST`; `QTE_UNANSWERED_PEEK` still does double duty (energy drain + blown-peeks increment);
- (c) the **colour cycle joins the wander under the seeded/deterministic-pure-fn precedent**
  (Revision 3 / §14): the ring colour is a PURE function of peek-elapsed `t` (`cyclePhase(t)`),
  no `Math.random`/`Date.now`, no per-tick stepped state — same architecture precedent;
- (d) `captorHp` is the newly-authored per-level knob; the cycle period + per-colour damage are
  Belliard-first SYSTEM CONSTANTS (F3 promotion seam), matching the wander-amplitude precedent.

### Open questions routed to game-designer (numbers, not contract)

- **Energy-economy interaction:** does a peek on which the player LANDED damaging head HP (but
  did not kill) still charge the −8 `QTE_UNANSWERED_PEEK` on close? **Frozen structural
  DEFAULT = YES, unchanged** (blownPeeks++ and −8 remain the same close event; the HP chip is an
  independent effect). Waiving the −8 on a "damaged this peek" would need a per-peek `damaged`
  flag (new state) — additive, game-designer's call; do NOT build without their ruling.
- captorHp value, RING_CYCLE_SECONDS, RING_RED_UNTIL / RING_YELLOW_UNTIL split, CAPTOR_DAMAGE_GREEN
  / CAPTOR_DAMAGE_YELLOW, and the wider/faster wander numbers — all game-designer's (integers for
  captorHp + damages, so HP arithmetic stays integer).

- VERDICT: **CONTRACT FROZEN.** dev-gameplay → types file first (`captorHp` + `ringPhase`); then
  both lanes parallel on the non-overlapping paths. tech-writer to record ADR-0034 **Revision 4**
  (number/form from producer). Awaiting game-designer's captorHp / cycle / damage / wander values.

---

### game-designer → lead-game-designer (Sacha, 2026-07-18): integrated HP + colour + wider/faster values

Spec addendum written: `docs/game-design/spec-hostage-qte-static-duel.md` §9 (DRAFT, needs Karim PASS).
Answers the frozen contract's open numbers:

- **captorHp = 3** (QteSpec field, integer ≥ 1). Damage **green 2 / yellow 1 / red 0** (system consts).
- **Colour = ripening RAMP, period == peekDuration** (one r→y→g per peek, no snap-back). Slices
  **red 40% / yellow 35% / green 25%** of the peek. Thresholds as FRACTIONS: `RING_YELLOW_AT 0.40`,
  `RING_GREEN_AT 0.75`. Pure fn `ringColourAt(t, peekDuration)` — no separate `RING_CYCLE_SECONDS`.
  **RECONCILE for architect:** the frozen `RING_CYCLE_SECONDS`/`RING_RED_UNTIL`/`RING_YELLOW_UNTIL`
  (seconds) can either be dropped (period is peekDuration) OR set = 0.60 s / 1.125 s at Belliard 1.5 s.
  My ruling ties the period to the peek so it self-scales with G5; flag if the contract needs the
  seconds form kept.
- **Wander WIDER+FASTER:** box **dx −0.95..−0.35 / dy +0.60..+0.95** (right & bottom PINNED for G6);
  `WANDER_AMP_X 0.30`, `WANDER_AMP_Y 0.175`, `HEAD_NEUTRAL (−0.65,0.775)`; peak **~1.8 u/s** via
  `LEG_DURATION 0.35→0.28`. `peekDurationSeconds 1.4→1.5`. **N = 4 unchanged.**
- **−8 per closed peek CONFIRMED unchanged** (matches the frozen DEFAULT=YES). Blown peek redefined =
  "peek closes with captorHp > 0". Energy layer kept, not folded.
- Flags: D4 reversal → ADR-0034 revision; captor-HP read (pips/stagger) → `ux`; ring-colour + on-frame
  → `lead-art`/composite gate.

## 18. REVISION — SPATIAL colour (ring-over-anatomy) — SUPERSEDES Revision 4 — senior-architect (Winston) — 2026-07-18

**Bertrand REFRAMED the colour from TEMPORAL to SPATIAL.** Revision 4 (§17) made the ring
cycle rouge→jaune→vert over TIME (`cyclePhase(t)`/`ringPhase`). That is **superseded and
withdrawn.** The ring's colour is now a function of the **anatomy under the ring centre**:

- **RED** = ring over **empty space** (not the captor) — `off`;
- **YELLOW** = over a **non-lethal part** (arm/leg) — `limb`;
- **GREEN** = over a **lethal zone** (torso/face) — `vital`.

A shot that **hits the ring** chips captor HP by that colour (**green big / yellow small /
red none**); depleting captor HP → **WON**. The ring roams **WIDER** over/around the captor.
`captorHp` STAYS (as in Rev 4); ADR-0034 **D4 is still reversed** (graded HP, not binary
one-headshot-kill). The loss route is **UNCHANGED** (execution after N blown peeks).

This section is FROZEN LAW. It supersedes §17 wherever they conflict; the KEEP list from §14
(wander) still holds. **Baseline for the dev lanes is the COMMITTED Rev-3 code** — Rev 4 was a
draft only, never committed (verified: `git`-clean `src/` has no `ringPhase`/`cyclePhase`/
`RingColour`/`captorHp`). So there is **no temporal-colour code to unwind** — the SPATIAL model
is added directly onto the committed wander code.

`game-designer` (Sacha) owns the anatomy bands / roam box / balance numbers (in parallel); the
architect owns the CODE contract + determinism below.

### HARD CONSTRAINTS (unchanged, restated)

- `src/game/**` stays **React/Three-free AND replay-deterministic** — no `Math.random`, no `Date.now`.
- The wander stays the **seeded pure fn of `t`** (§14, unchanged). The colour is now **SPATIAL**:
  `ringZone = ringZoneAt(targetOffset)`, a PURE function of the ring position. Since the position is
  itself a pure fn of `t` (the wander), the colour remains transitively a deterministic pure fn of `t`
  — but expressed as position, so **drawn colour == scored colour == ring position**. No temporal
  seed/period, no `ringPhase`, no `cyclePhase`, no per-tick stepped state.

### Frozen delta — `src/game/types/hostageQte.ts`

**NEW type**

- `export type RingZone = "vital" | "limb" | "off";` — the anatomy under the ring centre. This is a
  **semantic zone owned by the game lane**; the render lane maps it to a COLOUR (`vital`→green,
  `limb`→yellow, `off`→red). Cleaner boundary than Rev 4's `RingColour` — the game never names a colour.

**`QteZone` — RETIRE `"head"`**

- `export type QteZone = "body" | "hostage" | "miss";` — the `"head"` kill-zone member is REMOVED.
  Captor damage no longer flows through a head band; it flows through the ring hit (below). `qteZoneAt`
  now classifies the **ENERGY** layer only (bavure / body drain / miss). A returned zone that no longer
  kills would be a footgun — retire it.

**`QteSpec` — ADD** (identical to Rev 4)

- `readonly captorHp: number;` — authored per-level captor health. **Integer ≥ 1** (asserted in
  `createQte`; added to the C6 finiteness list). Default is game-designer's; field name/type is LAW.
  **F3 seam:** only `captorHp` is authored; the anatomy bands + per-zone damage amounts stay **SYSTEM
  CONSTANTS** in `qteSystem.ts` (Belliard-first, same precedent as wander amplitudes / energy prices).
- **UNCHANGED:** `targetSeed`, `maxBlownPeeks`, `peekCadenceSeconds`, `peekDurationSeconds`,
  `triggerAtElapsedSeconds`, `zoomSeconds`, `anchor`. **NO temporal `RING_CYCLE_SECONDS` field.**

**`HostageQte` (runtime) — ADD**

- `readonly captorHp: number;` — CURRENT captor health. Copied from `spec.captorHp` at `createQte`
  (mirror pattern). Decremented by ring-hit chips; never below 0.
- `readonly ringZone: RingZone;` — **FROZEN CHOICE: STORE it** (do NOT let render recompute). It is the
  exact analogue of `targetOffset`: a **DERIVED value cached on the runtime**, computed at the END of
  each ACTIVE tick as `ringZoneAt(targetOffset)` from the **same last-drawn `targetOffset`**. Two payoffs,
  both the same guarantees `targetOffset` already gives:
  (a) render reads one canonical field for the ring colour — no recompute, no divergence;
  (b) the tick scores a shot against the **last-drawn** `ringZone`, closing the **colour-honesty** seam
  exactly as `targetOffset` closed the aim-honesty seam — the player is judged on the colour the ring
  showed when they fired. **NO temporal `ringPhase`.** Rests at `ringZoneAt(HEAD_NEUTRAL)` while
  COVERED/ZOOMING (never scored there — ring-hit damage is PEEKING-gated).
- **UNCHANGED:** `targetOffset`, `targetSeed`, `blownPeeks`, `maxBlownPeeks`, `stance`, `telegraphActive`,
  `stanceRemaining`, `anchor` (static), `peekCadenceSeconds`, `peekDurationSeconds`, `zoomRemaining`,
  `zoomSeconds`, `resultRemaining`, `warning`.

### Anatomy classifier + damage — the pure shapes (LAW), `qteSystem.ts`

Pure, deterministic, functions of position ALONE (no `t`, no seed, no cycle):

```ts
// System constants (game-designer's anatomy bands — vital = head+torso box, limb = arm/leg boxes;
// anchor-relative offsets, authored disjoint; classified by the RING CENTRE):
export const VITAL_* / LIMB_* : number;          // band bounds (game-designer's values)
// Integer captor damage per zone (keeps captorHp integer under subtraction):
export const CAPTOR_DAMAGE_VITAL: number;        // big,   integer >= 1
export const CAPTOR_DAMAGE_LIMB: number;         // small, integer >= 1
// off (empty space / red) damage is 0 — implicit, a wasted ring hit.
// The reticle hit radius — a shot must land within this of the ring centre to be a ring hit:
export const RING_HIT_RADIUS: number;            // > 0 (see reconciliation note)

/** The anatomy under the ring CENTRE (anchor-relative). Precedence: vital box, then limb boxes,
 *  else off. Pure. `offset` is the ring centre (= the stored targetOffset). */
export function ringZoneAt(offset: Vec2): RingZone {
  if (inVitalBand(offset.x, offset.y)) return "vital";
  if (inLimbBand(offset.x, offset.y)) return "limb";
  return "off";
}

/** Captor HP removed by a ring hit whose ring centre sits over zone z (off → 0). */
export function colourDamage(z: RingZone): number {
  return z === "vital" ? CAPTOR_DAMAGE_VITAL : z === "limb" ? CAPTOR_DAMAGE_LIMB : 0;
}
```

Render maps `qte.ringZone` → its own colour constants (`vital`→green, `limb`→yellow, `off`→red). The
game lane never imports a colour; the render lane never imports the anatomy bands. Clean boundary.

### Shot resolution in `tickQte` ACTIVE — the ring-hit path (LAW)

**Resolve `fire` FIRST** (preserves the deterministic tie-break), in this order:

1. **RING HIT test (the CAPTOR-DAMAGE path):** a ring hit is
   `stance === "PEEKING"` **AND** `Math.hypot(impact.x − (anchor.x + qte.targetOffset.x),
impact.y − (anchor.y + qte.targetOffset.y)) <= RING_HIT_RADIUS`.
   (The ring only exists / is shootable during PEEKING — the exposure; COVERED shows only a faint
   wind-up tell and deals no damage.) On a ring hit:
   - `const dmg = colourDamage(qte.ringZone);` — the **last-drawn** zone (colour-honesty). An `off`/red
     ring ⇒ `dmg = 0` (wasted, no HP removed).
   - `const captorHp = qte.captorHp - dmg;`
   - `captorHp <= 0` → **return `WON`** (`{ ...qte, phase: "WON", captorHp: 0 }`,
     `energyDelta: QTE_RESCUE_REFILL` +40) — same early-return the head-kill used, now gated on depletion.
   - else (a chip that did not kill, or a red 0-chip): **record `captorHp` (post-chip), charge NO energy,
     do NOT classify further, FALL THROUGH** to the sub-machine (the captor is alive; the peek keeps
     ticking). A ring hit **consumes** the shot's captor-damage semantics; it never also incurs a
     body/hostage energy penalty (the G6 reshape below guarantees a ring hit can never overlap the hostage).
2. **NOT a ring hit → the ENERGY path** via `qteZoneAt(impact.x − anchor.x, impact.y − anchor.y)`:
   `hostage` → `+= QTE_HOSTAGE_HIT` (−30 **bavure kept**, so direct hostage shots stay punished);
   `body` → `+= QTE_BODY_HIT` (−5); `miss` → nothing. **No captor damage on this path.**
3. **Sub-machine loop UNCHANGED** (§9/§14): each PEEKING→COVERED **close** while the captor is alive →
   `blownPeeks += 1`, `energyDelta += QTE_UNANSWERED_PEEK` (−8); `blownPeeks >= maxBlownPeeks` → **`LOST`**
   (execution; no extra charge; HALT at the fatal close; bounded loop preserved).
4. **Compute the outgoing `targetOffset` (wander, G6-clamped) AND `ringZone`** from the same state:
   ```ts
   if (stance === "PEEKING") {
     const t = Math.max(0, qte.peekDurationSeconds - stanceRemaining);
     targetOffset = clampTargetOffsetG6({ x: HEAD_NEUTRAL.x + wander(...).x, y: HEAD_NEUTRAL.y + wander(...).y });
   } else {
     targetOffset = HEAD_NEUTRAL;
   }
   const ringZone = ringZoneAt(targetOffset);   // SAME last-drawn offset → drawn colour == scored colour
   ```
   Carry `captorHp` (post-chip) and `ringZone` on every returned record.

**Tie-break (LAW, preserved):** fire is resolved before the loss check, so a ring hit that **depletes HP**
on the fatal peek → **WON**; a ring hit that only **chips** on the fatal peek does NOT save the run — the
loop reaches the fatal close → **LOST**. Only a KILLING shot wins the tie.

### `createQte` + `levels.ts` (dev-gameplay)

- **`createQte`:** add `spec.captorHp` to the C6 finiteness list; assert
  `Number.isInteger(spec.captorHp) && spec.captorHp >= 1` (a win must be reachable). Seed
  `captorHp: spec.captorHp`, `ringZone: ringZoneAt(HEAD_NEUTRAL)`. G5 clamp, G4 assert, `maxBlownPeeks`
  assert, `blownPeeks: 0`, static `anchor` all UNCHANGED.
- **`levels.ts` (belliard `QteSpec`):** add `captorHp` (game-designer's value); update the wander-tuning
  comment for the wider roam box. **No `RING_CYCLE_SECONDS`** (it never existed in code).
- **`stateMachine.ts`:** `tickQte(qte, fire, impactPoint, delta)` signature and `{ qte, energyDelta }`
  result UNCHANGED → no logic edit (verify: no reference to the retired `"head"` zone anywhere).

### Wander WIDER + the G6 CLAMP reshape (dev-gameplay) — RULED: X-DISJOINT

**RULING (2026-07-18, addressing game-designer §10/§19 + coordinator flag).** Replace the Y-floor I
first froze with an **X-DISJOINT (hostage-facing-edge) clamp** — the asymmetric variant §17 flagged as
"still applies." The Y-floor was **wrong for the FULL-anatomy spatial model.** It presumed vertical
stacking (head band ABOVE the hostage) — true in the old head-only model, FALSE now: the anatomy has a
LOW `limb` (leg) zone (dy down ≈ −0.45) and the roam box spans **dy [−0.50, +1.10]**, which overlaps the
hostage's vertical span. A Y-floor at `minY ≈ 0.55` would flatten the ENTIRE lower half of the intended
roam (the leg zone + the low `off`/red air), deleting a zone Bertrand's model requires. The correct
separation is on **X**: the hostage is the front-RIGHT shield; the ring roams the captor's exposed LEFT
side; keep the whole ring circle LEFT of her.

- The roam box + speed take **game-designer's bigger values** — SYSTEM CONSTANTS, pure value change, no
  type-contract change. The box lives on the captor's **exposed (non-hostage) LEFT side**.
- **`clampTargetOffsetG6` becomes an X-CEILING** — clamp the ring centre's x down so the ring's right
  extent stays left of the hostage by `G6_MARGIN`; **y untouched** (the low leg survives):
  ```
  clampTargetOffsetG6(offset).x = Math.min(offset.x, HOSTAGE_DX_MIN − RING_HIT_RADIUS − G6_MARGIN)
  clampTargetOffsetG6(offset).y = offset.y
  ```
- **Disjoint on X for ANY y (confirmed).** A circle whose rightmost point (`centre.x + RING_HIT_RADIUS`)
  lies left of the vertical line `x = HOSTAGE_DX_MIN − G6_MARGIN` is disjoint from the hostage band
  (which occupies `x ≥ HOSTAGE_DX_MIN`) **regardless of dy** — X-separation ⇒ disjoint everywhere,
  independent of y. The low leg zone is preserved.
- game-designer's values: `HOSTAGE_DX_MIN 0.0`, `RING_HIT_RADIUS 0.30`, `G6_MARGIN 0.10` → ceiling
  **−0.40**; roam `dx_max −0.45 ≤ −0.40`, so **the authored box already satisfies the clamp** — the clamp
  is the **asserted SAFETY NET**, not an active distorter (ring right extent ≤ −0.15 ⇒ ≥ 0.15 u gap to
  the hostage for any dy, leg included). The earlier Y-floor "clamp eats the roam" reconciliation is
  **RETIRED** — resolved by moving the separation to X. (`RING_HIT_RADIUS` is now 0.30, not the ≈0.46 I
  guessed; it must still match the drawn PEEKING ring radius — aim/colour-honesty seam, reconciled at the
  composite gate.)
- **Assert it; the G6 property test MUST re-sweep the NEW wider box under THIS X-disjoint clamp** — no
  (dx, dy) in the clamped roam maps within `RING_HIT_RADIUS + G6_MARGIN` of the hostage band, for ANY y.
- **Fallback if the X-clamp is ever rejected** (recorded, NOT chosen): game-designer's Y-floor fallback =
  drop the leg zone and raise the roam to dy ≥ 0.55. I do NOT take it — it deletes an anatomy zone
  Bertrand's model calls for; the X-disjoint clamp keeps the full anatomy at zero cost (the authored box
  already satisfies it).

### Render + view-hook (dev-r3f-render)

- **`HostageQteSprite.tsx`:** the peek ring's colour = the game band for `qte.ringZone`
  (`vital`→green, `limb`→yellow, `off`→red), **replacing** the stance-tell tint on the ring. The ring's
  two-beat FORM signal (radius/opacity: COVERED wind-up vs PEEKING open window; reduced-motion steady
  degrade) is KEPT — colour is the new SPATIAL channel layered on the same form, never the SOLE channel
  (a11y). The ring still FOLLOWS `anchor + qte.targetOffset` (aim-honesty). ADD **diegetic captor-HP pips**
  — an **in-world** read on/near the captor sprite, **NO HUD bar** (holds ADR-0034 U-1). Form/placement of
  the pips is ux-designer/game-designer's call.
- **`hostageCue.ts`:** gains a `RingZone → colour` helper (render-owned colour constants) so the colour
  map stays unit-testable off-canvas. `captorTint`/`hostageAlarmColor`/`energyFloater` unchanged.
- **`HUD.tsx`:** UNCHANGED. `HudHostageQte = { phase, warning }` stays; captor HP is in-world (pips), not a
  HUD bar. If ux-designer later rules a HUD element returns, that reverses U-1 and must be logged here first.
- **`qteCamera.ts` / `useGameLoop.ts`:** UNCHANGED (static zoom-and-hold).

### Lane assignment — non-overlapping paths

| Lane               | Owns (writes)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dev-gameplay**   | `src/game/types/hostageQte.ts` (`captorHp` + `ringZone`; add `RingZone`; RETIRE `"head"` from `QteZone`), `src/game/systems/qteSystem.ts` (`ringZoneAt`/`colourDamage`/`RING_HIT_RADIUS` + anatomy-band consts, ring-hit resolution, `captorHp`, reshaped `clampTargetOffsetG6`, wider wander consts, `qteZoneAt` → `(dx,dy) => body/hostage/miss`), `src/game/levels/levels.ts` (belliard `captorHp`), `src/game/systems/__tests__/` |
| **dev-r3f-render** | `src/render/scene/HostageQteSprite.tsx` (ring colour from `qte.ringZone` + HP pips), `src/render/scene/hostageCue.ts` (`RingZone`→colour helper), `src/render/scene/__tests__/` — **`HUD.tsx` untouched** unless a HUD captor-HP read is separately approved                                                                                                                                                                          |

**No shared-file contention.** `RingZone`/`ringZoneAt`/`colourDamage` are game-owned (pure, in
`qteSystem.ts`); render imports the enum read-only and maps it to its own colour constants. `tickQte` is
called from `stateMachine.ts` (game lane); render only READS `qte.captorHp`/`qte.ringZone`/`qte.targetOffset`.
`qteCamera.ts`/`useGameLoop.ts` are both render-lane and UNCHANGED.

**Sequencing:** (1) dev-gameplay lands the FROZEN types first (interface only — `captorHp` + `ringZone` +
`RingZone`, and the `QteZone` `"head"` retirement) → handoff. (2) Both lanes then fan out in parallel on the
non-overlapping paths above.

### ADR impact — SUPERSEDES the temporal Revision 4 (→ tech-writer / producer)

`producer` (Marion) allocates the ADR number — I do NOT self-allocate. **tech-writer** must fold the
**SPATIAL colour** into the ADR-0034 amendment **in place of the time-ramp** Revision 4:

- **Revision 4 (temporal `cyclePhase(t)`/`ringPhase` colour) is WITHDRAWN and superseded** before it
  shipped (it was a draft only — never committed).
- The colour is **SPATIAL** — `ringZone = ringZoneAt(ring centre)`, red/off, yellow/limb, green/vital.
- **`captorHp` STAYS**; ADR-0034 **D4 remains reversed** (graded HP depleted by ring hits; depletion → WON).
- The **loss route is UNCHANGED** — `blownPeeks >= maxBlownPeeks` execution stays the sole `LOST`;
  `QTE_UNANSWERED_PEEK` still does double duty (energy drain + blown-peeks increment).
- `captorHp` is the newly-authored per-level knob; anatomy bands + per-zone damage + `RING_HIT_RADIUS`
  are Belliard-first SYSTEM CONSTANTS (F3 promotion seam), matching the wander-amplitude precedent.

### Open questions routed to game-designer (numbers, not contract)

- `captorHp` value; the vital/limb anatomy band bounds; `CAPTOR_DAMAGE_VITAL`/`CAPTOR_DAMAGE_LIMB`
  (integers); `RING_HIT_RADIUS`; the wider roam-box values — all game-designer's, subject to the G6
  clamp-satisfaction constraint above. Keep the vital/limb anatomy coherent with `qteZoneAt`'s body band
  (the anatomy sits over the captor silhouette) — reconciled with the real art at the composite gate.
- **−8 on a peek the player DAMAGED (chip, no kill):** frozen structural DEFAULT = **YES, unchanged** (the
  close still charges −8 and increments `blownPeeks`; the HP chip is an independent effect). Waiving it
  would need a per-peek `damaged` flag (new state) — additive, game-designer's call; do NOT build without it.

- VERDICT: **CONTRACT FROZEN.** dev-gameplay → types file first (`captorHp` + `ringZone` + `RingZone`;
  retire `"head"`); then both lanes parallel on the non-overlapping paths. tech-writer to fold **SPATIAL
  colour** into the ADR-0034 amendment (superseding the temporal Revision 4; number/form from producer).
  Awaiting game-designer's anatomy bands / damage / `RING_HIT_RADIUS` / captorHp / roam-box values.

## 19. VALUES — spatial-colour anatomy + roam + balance — game-designer (Sacha) — 2026-07-18

- claim: Bertrand's reframe (colour = anatomy under the wandering ring; "plus d'ampleur"). / release:
  respec landed as **§10** of `docs/game-design/spec-hostage-qte-static-duel.md` (§9's colour TIME-ramp
  marked SUPERSEDED; §9.1 HP / §9.3 damages / §9.5 loss+energy carry forward). Names aligned to Winston's
  §18 frozen contract (`RingZone`, `ringZoneAt`, `colourDamage`, `RING_HIT_RADIUS`, `"head"` retired).
  **Needs `lead-game-designer` (Karim) PASS.**

**The numbers Winston is waiting on (§19 answers the §18 open questions):**

| Knob                                    | Value                                                                                         | Where   |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | ------- |
| `captorHp` (belliard `QteSpec`)         | **3**                                                                                         | §10.E   |
| `CAPTOR_DAMAGE_VITAL` / `_LIMB` / off   | **2 / 1 / 0**                                                                                 | §10.A/D |
| `RING_HIT_RADIUS`                       | **0.30**                                                                                      | §10.B   |
| VITAL band (green, ring-centre)         | dx **[−0.80, −0.45]**, dy **[+0.05, +0.90]**                                                  | §10.A   |
| LIMB `ARM` (yellow)                     | dx **[−1.20, −0.80]**, dy **[+0.25, +0.65]**                                                  | §10.A   |
| LIMB `LEG` (yellow)                     | dx **[−0.80, −0.45]**, dy **[−0.45, +0.05]**                                                  | §10.A   |
| OFF (red)                               | roam − vital − limb (≈47 % of roam)                                                           | §10.A   |
| Roam box (`WANDER_AMP`/`HEAD_NEUTRAL`)  | dx **[−1.20, −0.45]**, dy **[−0.50, +1.10]**; AMP_X 0.375, AMP_Y 0.80, centre (−0.825, +0.30) | §10.B   |
| `LEG_DURATION` / `MAX_LEG_DISPLACEMENT` | **0.38 / 0.45** (peak ≈1.8 u/s; box grew, speed held)                                         | §10.B   |
| Split vital / limb / off                | **~25 % / ~28 % / ~47 %** (vital = scarce payoff)                                             | §10.A   |
| N, peekDuration, cadence                | **4 / 1.5 s / 1.5 s** (unchanged; HP carries the difficulty)                                  | §10.E   |

Precedence VITAL > LIMB > OFF. `-8` on a damaged-but-not-killed peek: I **accept Winston's frozen
default (YES, unchanged)** — no `damaged` flag. Zone split mirrors the dead temporal 40/35/25 in spirit
(red largest, green smallest). Approachable: yellow-only path (fire while ring is on him) wins by peek 3;
2-green path wins by peek 2; N=4 gives a spare.

**⚠ BLOCKING — G6 CLAMP MECHANISM (→ senior-architect, before dev-gameplay builds the wander/clamp):**
Your §18 clamp is a **Y-floor** (`minY = HOSTAGE_DY_MAX + G6_MARGIN + RING_HIT_RADIUS = 0.55`). Bertrand's
brief adds a **LEG** (a LOW zone, dy −0.45…+0.05) and frames G6 as "off is on the **non-hostage side**"
(the hostage is front-RIGHT ⇒ keep the ring **LEFT**). A Y-floor of 0.55 would flatten the whole lower
roam and make the leg unreachable. **I'm requesting your §17 X-disjoint / hostage-facing-edge clamp
variant IN PLACE OF the §18 Y-floor** — pin `centre.x ≤ ROAM_DX_MAX (−0.45)`; asserted bound
`ROAM_DX_MAX + RING_HIT_RADIUS + G6_MARGIN = −0.45 + 0.30 + 0.10 = −0.05 ≤ HOSTAGE_DX_MIN (0.0)`
⇒ ring right extent −0.15, a 0.15 u X-gap from the hostage for **any** dy. **Fallback if you keep the
Y-floor:** drop the leg, `LIMB` = arm only, raise the roam to dy ≥ 0.55 (§10.C) — ships on your frozen
clamp but loses Bertrand's leg + vertical ampleur. The clamp FORMULA is your LAW; I supply the values +
the intent (a low leg must be reachable) that select the X variant. **Please rule.**

**Flags routed (§10.H):** (12) on-frame — the ~5.7× box reaches ring extents left −1.50 / top +1.40 /
bottom −0.80, beyond §8.3 safe occupancy → **composite gate MUST confirm framing at the zoom** (fallback
tighten AMP_Y→0.65 / AMP_X→0.325; unbuilt, my highest-risk value). (14) ring-colour tint + captor-HP
pips (NO HUD bar, U-1) → `ux` + `lead-art`.

- VERDICT: **VALUES DELIVERED — awaiting `lead-game-designer` PASS**, then `senior-architect` to rule the
  G6 clamp mechanism (X-disjoint requested vs Y-floor fallback) before dev-gameplay lands the wander/clamp.
  Not a gate verdict (design values); the design gate is Karim's next.

## 20. DESIGN GATE — spatial-colour reframe — lead-game-designer (Karim) — 2026-07-18

Gating the game-designer (Sacha) respec `docs/game-design/spec-hostage-qte-static-duel.md`
**§10** (colour = anatomy under the wandering ring; roam ~5.7× wider), triggered by
Bertrand's confirmed reframe (RED = ring over empty space / YELLOW = non-lethal limb /
GREEN = lethal vital; a ring hit chips captor HP by that colour; deplete HP → WON; ring
roams WIDER). Checked against the architect's **§18** FROZEN spatial-colour contract (LAW),
the §19 values, ADR-0034 D1–D6 + P1–P4 / G4–G6, PROJECT_GUIDELINES (scope guard, §5.6
no-bullshit-death, single core loop, §6 no stress bar), and the prior gates (§10, §15) it
supersedes in part.

### Scope / core loop / verifiability — all PASS

Conscious documented extension layered on the already-extension QTE (Prohibition ST had no
hostage duel / roaming reticle / anatomy colour) — declared in the spec's cahier-des-charges
paragraph and carried into the ADR revisions. No new loop verb; `Récupérer → Livrer →
Éviter` untouched; ~11–12 s ACTIVE, once per level, freezing the rest — inside the 3–5 min
envelope; the rescue still never advances the kill quota (side objective). AC12′–AC17′ carry
explicit values, bands, tolerances and named unit/`verify` asserts — a dev implements
without guessing. **The load-bearing numbers reconcile** (independently recomputed): roam
1.20 u² (5.7×); VITAL 24.8 % / LIMB 27.9 % / OFF 47.3 %; G6 X-gap 0.15 u for any dy; peak
1.78 u/s; floor = 3 limbs with a spare opening; ceiling = 2 vitals → win peek 1–2. Verifiable.

### The four sub-verdicts asked of the gate

1. **Fairness / approachable on level 1 — PASS.** captorHp 3 with vital −2 / limb −1 over
   N = 4 telegraphed (G4) ≥ 1.5 s (≫ G5) openings gives a clean gradient: the **floor**
   (limb-only path, 3× −1) makes quota with one opening to spare, and the **ceiling** (2
   vitals, or two vital chips in one peek → win on peek 1) is genuinely rewarding — finish in
   1–2 openings AND eat fewer −8 counter-fire charges (double reward). VITAL only ~25 % of the
   roam means you must both track the ring AND wait for it to cross a lethal zone — the
   intended skill demand, with yellow (≥ 1 dmg available ~53 % of positions) as the
   approachable fallback. Multi-shot-per-peek (chip falls through, peek keeps ticking) is
   intended, not a loophole — it is the mastery ceiling; AC17′ playtests it is not TOO easy.
   **This PASS is contingent on the leg surviving** — see K-2.

2. **Coherence with the guidelines — PASS.** No "mort bullshit" (§5.6): the hostage is
   killable ONLY via the legible, telegraphed N-blown-peeks execution clock; a hostage-band
   hit stays a flat non-fatal −30 energy bavure (no `hostageHp`, no stray-bullet death) —
   unchanged from the gated Rev-2 model. Core loop + side-objective rule intact. Energy ledger
   unchanged (+40 / −30 / −8 / −6 / −5; chips & misses 0; passive ignore −32 → LOST). Captor
   HP returns as **diegetic pips, NO HUD bar** (holds U-1 and §6 "pas de barre de stress");
   the blown-peeks clock stays diegetic. Coherent with the §18 frozen contract (names aligned:
   `RingZone` / `ringZoneAt` / `colourDamage` / `RING_HIT_RADIUS`; `"head"` retired) — no
   C-1-style rename needed this round. **Watch-item (not a block):** HP + roam + anatomy colour
   - blown-peeks + energy ledger is a lot of systems on one 12 s beat — stage-5 must confirm it
     still READS as one legible duel (KISS/P3). Mitigant: spatial colour is inherently simpler to
     parse than the dead §9.2 temporal ramp (you SEE the ring leave his body and go red).

3. **WYSIWYG / readability (P3) — PASS, stronger than §9.** The ring shows where it is
   (position = `targetOffset`, render draws it there); its single colour = the anatomy under
   the centre (`ringZone` stored, drawn colour == scored colour via the last-drawn zone). You
   see it, you shoot that colour, you are judged on that colour. Tying colour to VISIBLE
   position over the visible captor is more readable than a hidden time ramp — a net P3
   improvement. The one subtlety (colour keyed to the centre while the 0.30 catch disc may
   straddle a band edge) is honest: the ring is drawn as ONE colour and you shoot that colour
   (§10.D) — WYSIWYG holds.

4. **Wander framing (~5.7× box) — STAGE-5 / composite watch-item WITH a committed fallback,
   NOT a smaller box now.** See K-1. Deferring costs nothing (the fallback is a constant tweak
   that never touches the G6 X-pin); shrinking pre-emptively would under-deliver Bertrand's
   "plus d'ampleur" with no evidence it clips. But framing is load-bearing for P3 (you cannot
   fairly track a ring you cannot see), so it is a HARD pre-ship condition, not a soft flag.

### G6 clamp — the two DESIGN needs the architect's parallel ruling depends on (K-3)

I do NOT rule the clamp form (Y-floor vs X-disjoint) — that is `senior-architect`'s §18/§17
call, in flight. I CONFIRM the two design facts that select it:

- **(a) The design genuinely NEEDS the low LEG zone.** Bertrand's verbatim reframe names
  "jambe" as a yellow zone and "plus d'ampleur" explicitly wants the vertical range; the LEG
  (dy −0.45…+0.05) is the low-dy limb a Y-floor of 0.55 would obliterate. So the clamp must
  NOT be a Y-floor that flattens dy < 0.55. Design preference: the **X-disjoint** variant.
- **(b) OFF/red is entirely on the non-hostage (LEFT) side.** Ring right extent ≤ −0.15,
  ≥ 0.15 u clear of the hostage for any dy — every OFF/limb/vital cell is left of her, so
  **tracking the ring can never induce a bavure** (the only way to hit her is a deliberate
  off-ring shot right, into her band — the −30 energy path). This is exactly Bertrand's
  "never risk a bavure" rule and it holds. Confirmed.

The formula is the architect's LAW; the design need selects X-disjoint. The Y-floor fallback
(drop the leg, arm-only LIMB, raise roam to dy ≥ 0.55) is a safe degrade — but it costs the
leg + vertical ampleur AND shifts LIMB ~28 % → ~18 %, which changes the floor → triggers K-2.

### Corrections / conditions

- **K-1 (condition on ship — → `lead-art` / composite gate + stage-5 `verify`; HIGHEST
  RISK).** The roam reaches ring extents left −1.50 / top +1.40 / bottom −0.80 (centre ±
  0.30), well beyond §8.3's proven safe occupancy. On-frame framing at the QTE zoom is
  UNVERIFIED (box unbuilt). Hard pre-ship gate: the composite gate + stage-5 MUST confirm the
  ring stays framed and trackable at the zoom on both device classes. If it clips, apply
  Sacha's defined fallback (`WANDER_AMP_Y → 0.65`, dy top +0.95; and/or `WANDER_AMP_X →
0.325`, dx left −1.15) — a value tweak that never touches the G6 X-pin. I do not arbitrate
  the visual; routed to Nico's lane.

- **K-2 (spec-coherence correction — → `game-designer`, one-line).** §10.E / §10.A present
  the 25 / 28 / 47 split and the "yellow-only wins by peek 3" floor as final, but they are
  contingent on the LEG surviving (i.e. on the architect adopting the X-disjoint clamp).
  Condition the shipped balance in the spec: **if the §18 Y-floor is kept and the §10.C
  arm-only fallback ships, LIMB drops ~28 % → ~18 %, the floor (limb-only path) hardens, and
  Sacha MUST re-tune the arm-only bands and re-verify the floor before build** — a named
  dependency, not a silent drift. Single-line note; not a redesign.

- **K-3 (design confirmation — → `senior-architect`).** The two design needs above (leg
  required; off/red non-hostage-side) — supplied so the parallel clamp ruling can land.

- **K-4 (reads — → `ux-designer` + `lead-art`, composite gate).** Ring colour tint
  (vital → vert / limb → jaune / off → rouge) and captor-HP pips (diegetic, NO HUD bar — U-1
  holds; form is `ux`'s call). Composite gate confirms zone ↔ colour ↔ damage alignment over
  the moving ring, AND that `RING_HIT_RADIUS 0.30` matches the drawn PEEKING ring radius (the
  aim/colour-honesty seam, per §18). Not my arbitration.

- **K-5 (fairness verifiability correction — → `game-designer`; the one real hole).** The
  balance (§10.E "yellow-only wins by peek 3") ASSUMES each of the N = 4 openings presents a
  landable limb-or-better window. But the wander only visits ~4–5 hash-derived waypoints per
  1.5 s peek (`LEG_DURATION 0.38`) — it does NOT sweep the 1.20 u² box, and VITAL + LIMB is
  only ~53 % of it. Nothing in §10 guarantees a given peek's waypoint path DECELERATES over a
  lethal/limb cell — the "deceleration-into-waypoint = the fair firing window" affordance
  (§8.2, the whole reason the model was chosen over sines) only pays off when a waypoint lands
  ON the captor; a peek whose waypoints all fall in OFF offers only fast mid-leg crossings (a
  coin-flip shot), which is exactly the "unreadable, I didn't crack — it never gave me a shot"
  outcome P3 forbids. Two things the spec must nail before this is verifiably fair on level 1:
  (a) **pin the Belliard `targetSeed`** — §10/§19 leave it unspecified, yet it deterministically
  authors every peek's path and thus the entire played experience; and (b) **assert or
  playtest-confirm a minimum on-captor decelerating window per peek** for that seed (a
  structural constraint on the hash-to-waypoint mapping — e.g. ≥ 1 waypoint per peek inside
  VITAL∪LIMB — or an empirical AC17′ check with the pinned seed). Without (a)+(b) the "floor"
  is an assumption, not a guarantee. This does not block the concept — it is a named
  verifiability gap the stage-5 `verify` MUST close with the real seed; flag a preference on
  the structural-assert vs playtest-pin route.

### VERDICT

- **Game-design spec §10 (Sacha): PASS-WITH-CORRECTIONS.** Scope, core loop, verifiability,
  fairness (floor + ceiling), coherence (§5.6 / §6 / U-1) and WYSIWYG/P3 all PASS; the numbers
  reconcile. Apply **K-2** (condition the balance on the clamp ruling) and **K-5** (pin the
  Belliard `targetSeed` + guarantee a per-peek on-captor window — the one real fairness hole);
  satisfy **K-1** (on-frame framing) at the composite gate / stage-5 before ship with the
  defined fallback; route **K-3** (design confirmation for the architect's clamp ruling) and
  **K-4** (art/UX reads). Cleared to `senior-architect`: rule the G6 clamp (X-disjoint
  requested — the leg is a confirmed design need), then dev-gameplay lands the wander/clamp.
- Rework rounds used: **1 of 2** (K-2 + K-5 are spec applies). K-2 is a one-line conditioning
  note; K-5 is a value-pin + one assert/AC; K-1/K-3/K-4 are routed conditions/confirmations,
  not redesigns. No re-gate unless a tuning value moves OR the architect forces the arm-only
  fallback (then Sacha re-verifies the floor per K-2). K-5's seed-pin + per-peek-window
  guarantee is the load-bearing item stage-5 must close with the real build.
- Stage-5 design acceptance re-verdicts Sacha's `verify` playtest vs AC12′–AC17′ (+ inherited
  AC1–AC11, AC15/16) post-BUILD — the AC17′ approachability claim, the AC14′ G6/no-bavure
  sweep, and the K-1 framing check are the load-bearing checks.

## 21. DOCS — tech-writer (Otis) — 2026-07-18

- claim: record the SPATIAL-colour model (`senior-architect`'s §18 frozen contract + X-disjoint
  G6 clamp ruling, `game-designer`'s §19 values, `lead-game-designer`'s §20
  PASS-WITH-CORRECTIONS) as ADR-0034 **Revision 4**, and clean up a doc-lane artifact flagged
  by `game-designer`. Not a gate — doc realignment, traced to §18/§19/§20.
- release:
  - **ADR-0034 amended** — new **"Revision 4 — 2026-07-18: graded captor HP +
    spatial-colour reticle"** section in
    `docs/adr/0034-hostage-qte-duel-porte-cochere.md`, recording: D4 reversed AGAIN (the
    captor gets graded `captorHp`, Belliard 3; the `"head"` kill-band retires from `QteZone`
    → `"body" | "hostage" | "miss"`); the spatial colour model (`RingZone =
"vital"|"limb"|"off"` as a pure function of the ring's CENTRE POSITION via `ringZoneAt`,
    not time — joining Revision 3's seeded/deterministic-pure-fn precedent; a ring hit within
    `RING_HIT_RADIUS` during PEEKING chips HP by zone — vital −2 / limb −1 / off 0 — depleting
    → WON; a miss-the-ring shot falls to `qteZoneAt`, hostage −30 kept; colour-honesty via the
    stored last-drawn `HostageQte.ringZone`, same discipline as `targetOffset`'s aim-honesty);
    the loss route UNCHANGED (`blownPeeks >= maxBlownPeeks` execution stays sole `LOST`,
    "blown peek" re-keyed to "closes with `captorHp > 0`", `QTE_UNANSWERED_PEEK` −8 still
    doing double duty); the wander widened ~5.7× (roam `dx [−1.20,−0.45]` / `dy
[−0.50,+1.10]`) with the G6 clamp **reshaped from Revision 3's Y-floor to X-disjoint**
    (`clampTargetOffsetG6`: `offset.x ≤ HOSTAGE_DX_MIN − RING_HIT_RADIUS − G6_MARGIN`, `y`
    untouched — the Y-floor would have flattened the low leg zone the anatomy model needs);
    the captor-HP read staying **diegetic pips, no HUD bar** (K-4, holds Revision 2's U-1);
    and the two open pre-ship conditions **K-1** (wide-box on-frame framing at the composite
    gate/stage-5, fallback `WANDER_AMP_Y → 0.65` / `WANDER_AMP_X → 0.325`, G6 X-pin untouched)
    and **K-5** (pin the Belliard `targetSeed` + assert/verify ≥ 1 on-captor decelerating
    window per peek). One traceability sentence notes an interim TEMPORAL colour-ramp draft
    (`cyclePhase(t)`/`ringPhase`) was superseded and withdrawn **before any code landed** —
    explicitly NOT presented as shipped; the shipped/recorded model is spatial only, matching
    `git`-clean `src/` (no `ringPhase`/`cyclePhase`/`RingColour` ever committed). Status line
    updated to note Revision 4 (no other Status-line change) — no ADR number reallocated, a
    further dated amendment per the story's own §18 "ADR impact" note (`producer` not asked
    for a standalone superseder number this pass).
  - **Registry regenerated**: `node scripts/gen-adr-index.mjs --write` then `--check` — fresh
    (41 ADR; ADR-0034's registry row still reads `Accepted (amended)`, unaffected by the added
    Revision-4 clause in the Status line).
  - **Spec artifact removed** — `docs/game-design/spec-hostage-qte-static-duel.md` had a
    stray malformed `</content>` / `</invoke>` tool-call-wrapper leak at true EOF (after §10.H,
    following the section's trailing `---` separator — a leftover from a prior Write, not
    real content). Confirmed via grep it was the sole occurrence in the file and that the
    document's `---` separator convention (11 uses, one per section) made the preceding `---`
    itself legitimate house style, not part of the artifact. Removed only the two stray tag
    lines; the `---` separator and all real content (§10.H's flags list) untouched.
- verify: `npx --yes prettier@3.8.2 --check` on every markdown file touched (this shard, the
  ADR, the spec) — clean (see below). No code or tuning numbers touched; no game/render source
  edited this pass (the artifact removed was in a design-spec markdown file, not source).
- VERDICT: not a gate — doc realignment, traced to §18 (contract + X-disjoint clamp ruling),
  §19 (values), §20 (PASS-WITH-CORRECTIONS, K-1/K-4/K-5), and the `game-designer`-flagged EOF
  artifact.

## 22. REVISION — BOX-disjoint clamp + anatomy hitbox map — senior-architect (Winston) — 2026-07-18

**Bertrand supplied a HITBOX DIAGRAM on the captor sprite; it changes the geometry and
SUPERSEDES the X-disjoint clamp of §18/§20.** The ring must roam the captor's UPPER BODY and
colour by anatomy: GREEN = head/face, YELLOW = torso + shoulders, RED = arms + legs (+ empty
air). Head (GREEN) and torso (YELLOW) are CENTRE — over the hostage's x-span — so the ring MUST
be able to reach the captor's centre/upper region ABOVE the kneeling hostage. The §18 X-disjoint
clamp (`offset.x ≤ HOSTAGE_DX_MIN − RING_HIT_RADIUS − G6_MARGIN` = ≤ −0.40) confines the ring to
his LEFT flank (arm + empty), so head/torso are unreachable and GREEN wrongly fires over his arm.
That X-only law is the bug. Replace it with a BOX-disjoint push-out.

- claim: own the CLAMP MECHANISM + determinism (the load-bearing change). `game-designer` (Sacha)
  sets the anatomy band VALUES + roam box VALUES in parallel (§19-style); I freeze the clamp form,
  confirm bounds/determinism, and confirm the type contract stays stable.
- release: FROZEN box-disjoint clamp below + lane plan + the reachability constraint the bands
  must respect. Supersedes the §18 X-disjoint `clampTargetOffsetG6`.

### FROZEN — box-disjoint `clampTargetOffsetG6` (LAW; body is dev-gameplay's, FORM is mine)

Keep the whole ring CIRCLE (centre ± `RING_HIT_RADIUS`) OUT of the hostage AABB by `G6_MARGIN`,
but ALLOW the centre-top region ABOVE the hostage (so the head is reachable). Model it as a
POINT-vs-INFLATED-BOX push-out: inflate the hostage box by `RING_HIT_RADIUS + G6_MARGIN` on every
side; if the ring centre lands inside that forbidden box, push it to the nearest hostage-CLEARING
edge — LEFT (off his flank) or UP (above her head) — whichever is the minimal move.

```ts
/** Inflation pad: the ring circle stays this far off the hostage AABB on every side.
 *  = RING_HIT_RADIUS + G6_MARGIN = 0.40. Point-vs-(box⊕pad) is a CONSERVATIVE superset of
 *  circle-vs-(box⊕disk): outside the padded BOX ⇒ outside the rounded rect ⇒ centre-to-box
 *  distance ≥ pad ⇒ ring circle disjoint from the hostage box with gap ≥ G6_MARGIN. */
export const G6_PAD = RING_HIT_RADIUS + G6_MARGIN;

export function clampTargetOffsetG6(offset: Vec2): Vec2 {
  const fxMin = HOSTAGE_DX_MIN - G6_PAD; // -0.40  left edge of the forbidden box
  const fxMax = HOSTAGE_DX_MAX + G6_PAD; //  1.15
  const fyMin = HOSTAGE_DY_MIN - G6_PAD; // -1.45
  const fyMax = HOSTAGE_DY_MAX + G6_PAD; //  0.55  top edge of the forbidden box
  const inside = offset.x > fxMin && offset.x < fxMax && offset.y > fyMin && offset.y < fyMax;
  if (!inside) return offset; // already clear (idempotent on its own output)
  // Two hostage-CLEARING escapes only: LEFT (off his flank) or UP (above her head).
  // Minimal move wins; each lands the centre ON the forbidden-box boundary → provably out.
  const costLeft = offset.x - fxMin; // > 0
  const costUp = fyMax - offset.y; // > 0
  return costLeft <= costUp ? { x: fxMin, y: offset.y } : { x: offset.x, y: fyMax };
}
```

**Why it is provably safe (the G6 invariant, for EVERY offset).** After the clamp the centre is
outside the OPEN forbidden box, i.e. `x ≤ fxMin ∨ x ≥ fxMax ∨ y ≤ fyMin ∨ y ≥ fyMax`. The set of
points within `pad` of the hostage box (Minkowski ⊕ disk of radius `pad`, a rounded rectangle) is a
SUBSET of the forbidden (⊕ box) region, so "outside forbidden box" ⇒ "distance to hostage box ≥
`pad` = `RING_HIT_RADIUS + G6_MARGIN`" ⇒ the ring circle (radius `RING_HIT_RADIUS`) is disjoint
from the hostage box with a gap ≥ `G6_MARGIN`. LEFT push → x = −0.40, horizontal gap to her left
edge (0.0) is 0.40 for ANY y; UP push → y = 0.55, vertical gap to her top (0.15) is 0.40 for ANY x.
Pure, deterministic (function of `offset` alone — no `Math.random`/`Date.now`), idempotent.

**Reachability (what the bands/roam must respect — hands to `game-designer` K-5).** The reachable
region is "everything except the forbidden box": the LEFT flank column `x ≤ −0.40` at ANY y (the
gun-arm), AND the centre-top strip `y ≥ 0.55` across the whole width (head, then torso just below
head). CONSEQUENCE Sacha must design within: to hit a CENTRE band (over the hostage's x-span), the
ring centre must be at `y ≥ 0.55` — the captor's centre body is only exposed ABOVE her head, which
is the honest sprite truth (she kneels at his waist, front-right). Anatomy bands (per Bertrand's
hitbox map): GREEN/`vital` = head only (centre-top); YELLOW/`limb` = torso + shoulders (centre just
below head + flank shoulders, all in the reachable region); RED/`off` = arms + legs + empty. Band
VALUES are Sacha's; they must lie in the reachable region to fire on-captor windows.

**Continuity caveat (flag → `game-designer` + `dev-r3f-render`).** The safe region is L-shaped, so
nearest-edge projection is discontinuous along the reentrant diagonal from the interior corner
`(−0.40, 0.55)` (where `costLeft == costUp`): a wander path that crosses DEEP into the forbidden box
can snap between the left wall and the top wall. SAFETY is invariant; C1-continuity across that seam
is NOT. Mitigation (recommended, mirrors §18's "authored box already satisfies the clamp"): Sacha
authors the roam box to live MOSTLY in the reachable region so the clamp is a rarely-firing asserted
floor and any snap is shallow. The render already eases the drawn reticle. No clamp change needed.

### Contract — STABLE, dev-gameplay does NOT touch `hostageQte.ts` (structural)

- `QteSpec` / `HostageQte` fields UNCHANGED: `targetOffset: Vec2`, `ringZone: RingZone`,
  `captorHp: number` all stay. No field added/removed/retyped.
- `RingZone` stays the 3-value enum `"vital" | "limb" | "off"` — it SUFFICES (3 damage tiers).
  The mapping is RE-LABELLED, not widened: `vital`(GREEN)=head=big, `limb`(YELLOW)=torso+shoulders=
  medium, `off`(RED)=arms+legs+empty=0. Arms/legs move from `limb` to `off` (now 0 chip); torso
  moves from `vital` to `limb`. This is entirely inside `ringZoneAt`'s BANDS (in `qteSystem.ts`) —
  the enum VALUES and `colourDamage`'s SHAPE (`vital`→VITAL, `limb`→LIMB, `off`→0) are unchanged.
- ONE doc-coherence item: the `RingZone` DOCSTRING in `hostageQte.ts` ("vital = head/face + torso;
  limb = arm/leg") becomes stale under the remap. To keep dev-gameplay OFF the type file entirely,
  the docstring refresh is assigned to `tech-writer` in the Revision-5 ADR-doc PR (DOCS lane owns
  doc↔code coherence). Structural contract stays frozen.

### Lane plan

- **dev-gameplay (Amelia)** — `src/game/systems/qteSystem.ts` + `__tests__/qteSystem.test.ts` ONLY:
  (1) swap `clampTargetOffsetG6` to the box-disjoint FORM above (add `G6_PAD`); (2) re-band
  `ringZoneAt` to Sacha's §NEXT anatomy VALUES (vital=head, limb=torso+shoulders, off=arms+legs+
  empty); (3) reshape `WANDER_CENTRE`/`WANDER_AMP_*` to Sacha's roam box; (4) damage constants keep
  their shape (VITAL/LIMB magnitudes are Sacha's tuning); (5) UPDATE the G6 property test — it
  already computes true closest-point circle-vs-AABB distance (test lines ~250-270), so RE-SWEEP the
  NEW roam under the NEW clamp and assert min gap ≥ `G6_MARGIN` for every swept centre AND a dense
  raw-offset grid; RETIRE the X-only assertions (`clamped.x === cap`, `y untouched`,
  `targetOffset.x + RING_HIT_RADIUS < HOSTAGE_DX_MIN`) and replace with the box-disjoint + head-
  reachable assertions (a centre-top offset like `{x:0, y:0.8}` passes UNCLAMPED). Determinism tests
  unchanged. TDD, 100% green.
- **dev-r3f-render (Amelia)** — NO change required. It already colours by `ringZone` (vital→green,
  limb→yellow, off→red) and follows `targetOffset`; the ring simply roams a different region and
  arms/legs now read RED via `off` — all driven by the game-owned zone. Confirm no render edit.
- **dev-tooling-assets** — not in this delta.

### ADR impact (→ tech-writer / producer)

Refines the spatial-colour amendment: **box-disjoint clamp REPLACES the X-disjoint clamp**, and
**anatomy = head / torso / shoulders / arms / legs per Bertrand's hitbox map** (head=big, torso=
medium, arms+legs=0). This is the next dated amendment to ADR-0034 (Revision 5 — supersedes the
X-disjoint clause of the Revision-4 spatial-colour section). ADR number/label from `producer`
(Marion) — NOT self-allocated. `tech-writer` records it + refreshes the `RingZone` docstring.

- NEEDS: `game-designer` (Sacha) anatomy-band + roam-box VALUES in the reachable region (K-5
  on-captor windows); `tech-writer` ADR Revision 5 + docstring; `producer` ADR number.
- VERDICT: FROZEN geometry delta — clamp FORM + determinism + contract stability are LAW; band/roam
  VALUES are Sacha's, to be authored within the reachable region above.
