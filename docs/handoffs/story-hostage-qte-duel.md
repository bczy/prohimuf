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
