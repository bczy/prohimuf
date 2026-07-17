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
PROJECT_GUIDELINES §5.6 "jamais de mort bullshit" than an instant one-stray-bullet
hostage-death would be. The only laggard is ADR-0034 D6's removed-fields _prose_, which
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
