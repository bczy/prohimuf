# Spec — Niveau Final level design (pacing + live `bossQteSpec` data)

**Feature:** the LEVEL that ships "le Commandant" live — a minimal, canon, progression-gated
**Niveau Final** placed after Vitry, whose terminal beat is the already-built ADR-0051/0052 boss
system triggered by the **real quota crossing** (finale, not ambush).
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-20
**Status:** DRAFT — **needs `lead-game-designer` (Karim) design-gate PASS** before it reaches
`pm` re-review (AC9) and `senior-architect` (TECH PLAN). This spec is the design-loop deliverable
for the Open Questions I own on `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md`:
**OQ1** (level length / quota shape before the boss) and **OQ2** (difficulty placement), plus the
live `bossQteSpec` **data** authoring the story reserves to the design loop.

**Bertrand DECIDED (intake, 2026-07-20), and this spec is written on those decisions:**

1. **OQ4 canon venue CONFIRMED** = the squatted grand disused hall of
   `docs/game-design/spec-boss-differentiation-fiction.md` §1.1 (a former ballroom/dancing shell,
   the millennium teuf, an old chandelier, the crew's speaker stacks, the smoke machine nobody
   cut). This spec anchors the boss tableau and the décor prop in that room.
2. **OQ3 → FULL ART LANE OPENS NOW** (9 canon assets). This spec therefore **assumes canon art
   will exist** (venue backdrop + boss poses + the differentiation reads) and specifies the
   **procedural/placeholder fallbacks** to ship behind until generation lands — it does not block
   on art.

**What this spec is NOT.** It authors **data + pacing**, not mechanics. The ADR-0051/0052 boss
system ships **byte-untouched** (story AC5): I re-use `phaseCount`, `bossHp`, `maxBlownWindows`,
the per-phase escalation table, every §5.6 floor and every differentiation lever **exactly as
tuned** — I do not retune, re-gate, or re-open any of it. Where I am _tempted_ to change a system
value, I log it as a **correct-course flag** (§4), never as a spec line. Constants read from the
real code: `src/game/types/bossQte.ts` (`BossQteSpec`), `src/game/levels/levels.ts` (the three
shipped levels + `BOSS_QTE_DEV_HARNESS_LEVEL`), `src/game/types/enemyTypes.ts` (`ARCHETYPES`
weights), `src/game/systems/bossQteSystem.ts` (`BOSS_PHASE_TABLE`, the floors).

**Cahier des charges:** the boss-as-boss test was run and RATIFIED as an `[EXTENSION]` under
ADR-0051; **building a level** owes no new test (already-committed roadmap content,
`PROJECT_GUIDELINES.md` §7/§10 "Niveau Final — 31 décembre 1999… flics débordés"). Core loop
`Récupérer → Livrer → Éviter` untouched: the pre-boss section plays the loop normally; the boss
stays the terminal beat on `Livrer` (ADR-0051 D3), folded into nothing.

---

## 0. The design thesis (one sentence, everything hangs off it)

**The pre-boss section is the APPROACH RAMP to the finale, not a second full mission: it escalates
monotonically past Vitry so the level reads as "the hardest," but the difficulty _budget_ is spent
on the boss — the ramp must never grind the player out (lives) or run out the clock (timer) before
the boss triggers, because a finale you lose _before it starts_ is exactly the "ambush" AC4 forbids
and the "mort bullshit" §5.6 rule 6 forbids.**

Two facts make this the correct shape, not a soft one:

- The boss's own per-phase escalation table (EXPOSED 1.6→1.0 s, lull 2.0→1.2 s, tell 0.45→0.35 s,
  wander 1.0→1.6 u/s, drain −5/−6/−8) + the phase-2/3 lever kit (two rings, parry, renfort surge)
  **already carries most of the difficulty ramp** — OQ2 says so explicitly. Stacking every street
  axis to its maximum on top of that would double-count the climax.
- The boss encounter **freezes the rest of the level** (structural early-return,
  `stateMachine.ts:160-197`): `enemies`/`spawnWave`/`bullets`/`lives`/`elapsedSeconds` all halt
  while the QTE holds. So the street timer governs **only the pre-boss phase**, and the boss's own
  failure clock is `blownWindows` (energy is clamp-only, no death at 0 in the tableau — ADR-0052
  §4-B). The two difficulty economies are **disjoint**; the ramp cannot "spend" the boss's
  margin, and vice-versa. That is why the ramp should pressure but not execute.

---

## 1. Level pacing — the pre-boss section (OQ1 + OQ2 answered)

### 1.1 The headline numbers, against the shipped curve

| Level            | `enemySpeedMultiplier` | `enemiesToWin` | `timeSeconds` | s/kill budget | note                      |
| ---------------- | ---------------------- | -------------- | ------------- | ------------- | ------------------------- |
| belliard         | 1.0                    | 10             | 90            | 9.0           | teaching                  |
| stalingrad       | 1.3                    | 12             | 80            | 6.7           | —                         |
| vitry            | 1.6                    | 15             | 70            | 4.7           | current hardest street    |
| **niveau-final** | **1.8**                | **16**         | **70**        | **4.4**       | **hardest + boss finale** |

Every axis is **monotonic vs. Vitry** (speed ↑, quota ↑, s/kill tighter, time not looser), so the
level reads as the hardest — but each step is **deliberately modest**, and the descent patterns are
**consciously broken** where continuing them would clock-ambush the finale. Decisions, one at a
time:

### 1.2 `enemySpeedMultiplier: 1.8` — continue the curve, but +0.2 not +0.3 (OQ2)

The shipped step is exactly **+0.3** (1.0 → 1.3 → 1.6). Continuing it gives 1.9; I set **1.8**.

- **Why still escalate at all (not hold at Vitry's 1.6):** OQ2 offers "hold at Vitry since the boss
  is the escalation." Rejected — if the pre-boss street ran at Vitry's exact speed, the ramp would
  be _difficulty-identical_ to the level before it, and "hardest level" would be carried by the
  boss alone. The approach must itself read as a step up.
- **Why +0.2 not the mechanical +0.3:** at 1.8, cop reveal/return-fire timers are faster than Vitry
  but not the level's peak — the peak is the boss. The full +0.3 to 1.9, _combined with_ more kills
  and the boss, over-stacks return-fire on the `lives` clock and risks a game-over on the approach
  (the §5.6 / AC4 failure above). One-variable discipline: the boss owns the climax; the street
  speed rises one honest notch, no more.

### 1.3 `enemiesToWin: 16` — one notch over Vitry, NOT a proportional jump (OQ1)

The shipped quota step is +2, +3 (10 → 12 → 15); a proportional continuation is 17–20. I set **16**.

- **Why a real, non-trivial quota (OQ1 "short ramp vs. full mission"):** it must be a **real
  mission**, not a token ramp — the boss must _arrive earned_, after the player has cleared a
  genuine gallery, so the finale lands as a payoff. 16 counted kills at speed 1.8 is a substantive
  street phase. It is emphatically **not** the harness's `enemiesToWin: 0` instant-trigger shortcut
  (**AC4**): the boss fires on the **real quota crossing** (`kills >= 16`), replacing the abrupt
  "quota met → `LEVEL_COMPLETE`" with the duel (ADR-0051 D3).
- **Why only +1 over Vitry, not +3:** the level's payload and length budget is the **boss** (~60–75
  s, §2.4). A Vitry-scale-plus street (18–20 kills) _and_ a ~70 s boss blows past KISS's "une
  mission = 3–5 min" cap (`PROJECT_GUIDELINES.md` §5). 16 keeps the total in budget (§2.4) while
  still being the largest street quota in the game.

### 1.4 `timeSeconds: 70` — hold Vitry's timer, break the −10 descent (OQ1)

The shipped step is **−10** (90 → 80 → 70); continuing it gives 60. I **hold at 70**.

- 16 kills in 70 s is **4.4 s/kill** — tighter than Vitry's 4.7 (15/70), so the timer axis is still
  monotonically harder. The pressure rises via _more kills in the same window_, not a shorter
  window.
- **Why not 60:** 16 kills at speed 1.8 in 60 s (16 × 3.75 s) triple-stacks speed × quota × clock
  and turns the approach into a **time-out lottery** — losing the level to the clock _before the
  boss triggers_ is the "ambush" AC4 forbids in spirit and a "mort bullshit" the §5.6 floor forbids.
  The clock pressures; it must not execute. Holding 70 is the one-variable move: escalate quota and
  speed, hold the timer.

### 1.5 Spawn cadence — what I actually control, stated honestly

There is **no per-level "spawn interval" field** in `LevelConfig` (verified: `spawnWave` derives
its count from the wave number and enemy `hiddenDuration`/`visibleDuration` from `ARCHETYPES`;
cadence is a **system** function, not authored per level). So "cadence" is tuned by the two levers I
_do_ own — and inventing a spawn-rate field would be a system change (→ §4, correct-course):

1. **`enemySpeedMultiplier` (1.8)** — scales how fast cops reveal, hold and return fire; the
   primary cadence lever.
2. **`roster.windowWeights`** — the **mix** of who fills the windows. For the finale I bias the pool
   toward the tougher and faster archetypes (the room "crawling with débordé cops / CRS"), while
   **keeping a bonus valve** so the tight timer stays fair:

| Kind                         | Default weight | **Niveau-final weight** | HP  | Effect of the shift                                                        |
| ---------------------------- | -------------- | ----------------------- | --- | -------------------------------------------------------------------------- |
| `normal`                     | 52             | **40**                  | 1   | still the backbone, but ceding share                                       |
| `riot`                       | 15             | **28**                  | 2   | **the CRS (`enemy_riot`) — 2 HP, thematic finale enemy**; the density lift |
| `biker`                      | 15             | **20**                  | 1   | fast reveal (1.2 s) / short window (2.0 s) — the twitch pressure           |
| `bonus`                      | 11             | **10**                  | 1   | +5 s time valve, kept near default so the 70 s clock stays fair            |
| `civilian` / `hostage_taker` | 0              | **0** (unchanged)       | —   | stay out of the pool (AC1: this level authors **no** `hostageQte`)         |

These weights are **game-designer defaults (tunable at stage-5 `verify`)**. The riot lift is the
load-bearing choice: 2-HP CRS cops are the thematic finale enemy (the same `enemy_riot` the boss's
renfort surge reads as, ADR-0052 §4-D) and the honest source of "harder without a new mechanic."
The `hostage_taker`/`civilian` weight-0 is **AC1 by construction** — no hostage anything on this
level.

### 1.6 Delivery — hold at Vitry's difficulty, do not stack (one delivery, MVP)

The shipped deliveries tighten with the curve (integrity 100→80→60, window 8→7→6 s). I **hold the
finale delivery at ≈ Vitry**, not tighter:

| Field                     | Value               | Rationale                                                                                               |
| ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| `vehicleType`             | `truck`             | the crew's sound-system rig — "livre le son" (narrative framing → Yasmine; mechanics are type-agnostic) |
| `triggerAtElapsedSeconds` | `18`                | early, so the `Livrer` beat resolves well before the quota fills and the boss triggers                  |
| `integrity`               | `60`                | held = Vitry — the delivery is **not** the escalation axis                                              |
| `windowSeconds`           | `6`                 | held = Vitry                                                                                            |
| `bonus`                   | `300`               | continues the shipped 500→400→300 series                                                                |
| `entrySide`               | `left`              | free choice (art/framing)                                                                               |
| `stopPosition`            | `{ x: 0, y: -4.5 }` | the shipped curb line every delivery uses                                                               |

Holding the delivery at Vitry's tuning is deliberate one-variable discipline: the escalation is
already carried by speed (1.8) + quota (16) + the boss; tightening the delivery too would stack a
fourth axis for no design reason. The **vehicle type + diegetic framing** ("delivering the last
son of the century to the hall") is a **narrative call** — flagged to Yasmine (§6); mechanically
any type works.

---

## 2. The live `bossQteSpec` — DATA, re-anchored & re-seeded (not redesigned)

The `BossQteSpec` shape is frozen (`types/bossQte.ts`): `zoomSeconds`, `anchor`, `phaseCount`,
`bossHp`, `maxBlownWindows`, `targetSeed`, optional `decorProp`. I author **data into that shape** —
re-anchored to the hall, re-seeded per the K-5 discipline, décor re-sited to the chandelier. The
tuned combat values ship **unchanged**.

### 2.1 The values

| Field             | Value                                                | Source / decision                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `zoomSeconds`     | `2`                                                  | **unchanged** — every QTE uses the 2 s establishing zoom                                                                                                                                                                                                                                                                                               |
| `anchor`          | `{ x: 0, y: -5 }`                                    | **re-anchored** to the hall: centred tableau (two rings + parry-point + overhead chandelier all frame symmetrically). `y: -5` is the shipped tableau-centre height (feet on the ground line at −6). **`x` may need a nudge once the hall backdrop lands** (exactly Vitry's `x: 9.9` sky-gap fix) — a render/art framing seam (§6), not a system change |
| `phaseCount`      | `3`                                                  | **unchanged** (ADR-0051/0052 tuned value — House-of-the-Dead 3-phase)                                                                                                                                                                                                                                                                                  |
| `bossHp`          | `24`                                                 | **unchanged** (3 × 8; thresholds 16/8) — carried verbatim; any change is a correct-course (§4)                                                                                                                                                                                                                                                         |
| `maxBlownWindows` | `10`                                                 | **unchanged** — the sole failure clock, carried verbatim                                                                                                                                                                                                                                                                                               |
| `targetSeed`      | `19991231` **(PROVISIONAL)**                         | **re-pinned** per K-5 — see §2.3 (seed policy)                                                                                                                                                                                                                                                                                                         |
| `decorProp`       | `{ position: { x: 0.2, y: 1.5 }, armPhaseIndex: 1 }` | **re-sited** to the hall's chandelier — see §2.2                                                                                                                                                                                                                                                                                                       |

Everything not in this table (the per-phase escalation table, all lever constants, all floors) is a
**system constant** in `bossQteSystem.ts` and is **not authored here** — it ships exactly as
ADR-0052 gated it. That is the whole point: the live level is a re-anchored/re-seeded copy of tuned
data, not a tuning pass.

### 2.2 `decorProp` — the chandelier (the one prop the type allows)

`BossQteSpec.decorProp` is a **single** optional prop (`{ position; armPhaseIndex }`); the array
form is the deferred F3 seam. The canon hall (fiction §1.2) has **two** candidate objects — the
**lustre** (the dead building's chandelier) and the **mur d'enceintes** (the crew's speaker stacks).
I author **the chandelier**:

- **`position: { x: 0.2, y: 1.5 }`** — anchor-relative, **overhead** (well above the head band, dy
  0.6–1.0, and above the VITAL ring centre at dy 0.80). Rationale: a drop-burst mechanic reads
  cleanest with an **overhead** object that visibly _falls on him_ — exactly the fiction's "faire
  tomber l'ancien monde sur le flic." The high, off-column position also keeps the prop's silhouette
  clear of the two rings and the parry point (no read collision during the SHIELDED-gap arm window).
- **`armPhaseIndex: 1`** — phase 2, **unchanged** from the differentiation default (armed once the
  player knows the base loop; a mid-fight pure-upside +3 HP burst, `BOSS_DECOR_DAMAGE 3`, single-use,
  **no failure surface** — the safest §5.6 profile).
- **The `mur d'enceintes` is the reserved second prop** — but authoring a _second_ prop needs the
  `decorProps[]` array promotion, which is a **type/system change** → **§4 correct-course flag, not
  a spec line here.** One prop, one payoff, per YAGNI and the frozen shape.

Décor arming is **timing-based** (a SHIELDED lull of `armPhaseIndex`), **not** seed-dependent, so
re-siting the prop from the harness's `{1.4, 0.2}` speaker-stack to the chandelier does **not**
perturb the seed pin — only the ring-wander landability does (§2.3).

### 2.3 Seed policy — a PINNED, WINNABLE, RE-VERIFIED seed (not per-run)

**Decision: a single authored, pinned, stage-5-verified seed. NOT a per-run / random seed.**
Provisional value **`19991231`** (the level's diegetic date), flagged **PROVISIONAL** pending the
K-5 re-verify — exactly as the harness's `20260719` and Vitry's `19940715` were pinned-then-verified.

Justification vs. the V1 / differentiation precedent and the alternatives:

- **Every shipped QTE pins its seed** (belliard `20260718`, vitry `19940715`, harness `20260719`).
  The `targetSeed` field exists _because_ the wander is seeded-pure; a **per-run seed is
  architecturally illegal** — it needs runtime randomness the determinism law forbids (`no
Math.random/Date.now`, ADR-0051/0052 D5) and it breaks replay stability.
- **A per-run seed cannot carry the §5.6 winnability guarantee.** The floors (`PEEK_EXPOSURE_FLOOR
0.5`, `BOSS_TELEGRAPH_LEAD_FLOOR 0.35`, wander-box ⊂ anatomy) guarantee _answerability_ only
  against a seed the designer has **verified presents a landable window**. A random seed can deal an
  un-landable phase-2/3 window (no on-anatomy decelerating waypoint on a ring) = the exact
  "mort bullshit" the whole floor discipline exists to prevent. The finale is the **worst** place to
  gamble that.
- **K-5 re-verify obligation (mine, stage-5).** This level re-pins its **own** seed against **this
  level's** re-anchored geometry and the **full lever kit** — the differentiation ADR's own gotcha:
  two decorrelated rings + parry timing make the pin harder than V1's single ring. At `verify` I
  confirm, on `19991231` (or a re-pin): **every** phase-2/3 window presents ≥ 1 landable
  vital-or-limb decelerating waypoint **on each ring**; **every** charged window presents a landable
  parry point; the phase-2 décor arm-window is landable. If any fails → re-pin the seed (a data
  change to _this level_), **never** a phase-table edit (→ §4).

---

## 3. Difficulty placement & carried-over anti-bullshit floors

### 3.1 Placement in the unlock chain

Appended to `LEVELS` **after** Vitry (`belliard → stalingrad → vitry → niveau-final`). It
auto-unlocks on clearing Vitry via the **existing** index-based unlock hop
(`App.tsx`'s `LEVELS[shippedIdx + 1]` on `LEVEL_COMPLETE`) — **no new unlock-logic code** (the same
mechanism every prior level used). The unlock **surface** (how it presents on the flyer-stack level
select, the "final" framing) is a `ux-designer` seam (§6).

### 3.2 Carried-over §5.6 floors — nothing new invented

The level introduces **zero new failure surface**. Every anti-"mort bullshit" guarantee is inherited
by **reusing the frozen systems unchanged**:

- **Pre-boss street** — the shipped, gated street rules (visible cops, coherent return fire, the
  explicit death-reason HUD). §5.6 rule 6 ("règles des flics visibles et cohérentes") holds because
  the rules ARE the shipped ones. The only tuning is speed 1.8 + the roster mix — no new rule.
- **Boss encounter** — every ADR-0051/0052 floor rides along, asserted in `createBossQte` against
  the authored data: `PEEK_EXPOSURE_FLOOR 0.5`, `BOSS_TELEGRAPH_LEAD_FLOOR 0.35`, `lull > lead`, the
  per-ring wander-box ⊂ anatomy assertions, `parryLeadSeconds ≥ floor ∧ < lull`, `parryWindowSeconds
≥ 0.5`, décor pure-upside, finisher zero-failure-surface, the phase-break telegraph guarantee (no
  new pattern un-telegraphed). All new patterns are introduced on **telegraphed phase breaks** — I
  author none of this; I author data the asserts validate.
- **The two economies stay disjoint** (§0): the street `lives`/`timer` clock and the boss
  `blownWindows` clock never bleed into each other (the freeze). So "cleared the street, then lost
  a fair boss on `blownWindows`" and "never reached the boss" are the only failure shapes, both
  attributable.

---

## 4. AC5 — system-tuning temptations = correct-course flags, NOT spec lines

The story freezes `bossQteSystem.ts` / `types/bossQte.ts` (AC5). These are the changes I can foresee
_wanting_ after the live playtest, logged **here as correct-course triggers** so they are never made
as a silent edit or a quiet spec line:

1. **Boss reads too short/long slotted after Vitry** → tempting to bump `bossHp 24` /
   `maxBlownWindows 10`. Even though these are _data_ fields (legal to change without touching the
   system), the story ships ADR-0052's tuned values **unchanged** — so any change is a **logged
   correct-course against THIS story**, decided by Karim + pm, **not** a quiet re-tune in the level
   data.
2. **Phase pacing reads wrong on the new anchor** (EXPOSED/lull/tell/wander/drain) → these are the
   **`BOSS_PHASE_TABLE` system constants**. Changing them is a `bossQteSystem.ts` edit = **AC5
   violation** = correct-course, full stop.
3. **Phase-3 charged cadence** (every-other) or **renfort surge count** (1) feel wrong → both are
   **system constants**, not spec fields (ADR-0052 flagged them "verify tunables" but they live in
   the system). Tuning them = AC5 violation = correct-course.
4. **Want a second décor prop** (the speaker stack alongside the chandelier) → needs the
   `decorProps[]` **type promotion** = system change = correct-course (the deferred F3 seam), not a
   spec addition.
5. **Want a per-level spawn-interval field** to shape cadence beyond speed+mix (§1.5) → new
   `LevelConfig` field = system change = correct-course.

The seed is the **one** value I _do_ re-author freely (§2.3) — it is authored per level **by
design** (the K-5 discipline), so re-pinning it is not a system change.

---

## 5. Design VERIFY acceptance criteria (stage-5 — Sacha playtests `verify` vs. these)

- **AC-L1 — Finale, not ambush (AC4).** The boss triggers on the **real** quota crossing (`kills >=
16`), after a genuine street phase — never the harness `enemiesToWin: 0` shortcut. A playtester
  clears real mooks first, then the duel arrives as the terminal beat.
- **AC-L2 — Monotonic hardest.** The pre-boss street reads as harder than Vitry (speed 1.8, 16
  kills, riot-heavy mix) without a time-out or lives-out **before** the boss triggers on a
  competent run (the §0 disjoint-economy guarantee holds in play).
- **AC-L3 — Length budget.** Street (~70 s) + boss (~60–75 s) + zoom/holds/breaks/narrative stays
  within KISS "une mission = 3–5 min" — the finale is the longest level but not over budget.
- **AC-L4 — `bossQteSpec` data lands the differentiation unchanged.** On the live level the boss
  presents the same phase-1 single-ring onboarding → phase-2 two-ring choice → phase-3 full kit
  (parry, décor, renfort, finisher) as the gated harness — re-anchored, not retuned. The chandelier
  arms in phase 2 as a pure-upside +3 overhead drop.
- **AC-L5 — Seed winnability (K-5).** On the pinned seed, every phase-2/3 window presents ≥ 1
  landable waypoint on each ring, every charged window a landable parry, and the phase-2 décor
  arm-window is landable — or the seed is re-pinned (§2.3). **Most likely correction at `verify`.**
- **AC-L6 — No new failure surface / boundary.** Only the frozen street + boss rules run; AC1 (no
  `hostageQte`), AC2 (existing levels byte-untouched), AC3 (harness untouched), AC5 (no
  `bossQteSystem.ts`/`types/bossQte.ts` edit) all hold by construction. Any tuning gap → §4
  correct-course, logged, never a silent edit.

Sacha reports PASS/deviations to `lead-game-designer` **before** `senior-architect`'s integration
review (pipeline stage-5), mirroring the differentiation spec's design-VERIFY discipline.

---

## 6. Open items & seams — named, explicitly NOT my lane

- **`lead-art` (Maud) + `concept-artist` — venue backdrop art (art lane, now open per Bertrand's
  OQ3 decision).** The **squatted grand disused hall** backdrop is a genuinely new environment (not
  a reuse of the Belliard/Stalingrad/Vitry street tilesets) — the standard per-level `levelArt.json`
  - FLUX cost. **I spec the READ, not the look:** (a) the boss tableau must frame cleanly at the
    `anchor { x: 0, y: -5 }` with the overhead **chandelier** décor prop legible at `{ 0.2, 1.5 }`
    (anchor-relative) as a _shootable, distinct-from-the-boss-silhouette_ object; (b) the hall's
    window/opening "slots" must host the shooting-gallery cops (the same window-pop mechanic, re-skinned
    to balconies/openings of the hall). **Framing dependency I own back:** once the backdrop lands,
    confirm the `anchor.x` needs no nudge to avoid a dead-gap behind the boss (Vitry's `x: 9.9` fix
    precedent). The 9 canon assets (venue + 4 `commander_*` poses + 5 differentiation reads) are the
    art lane's work order; the level ships behind the **already-stage-5-verified procedural fallbacks**
    (cop-fallback boss sprite, procedural rings/parry-glyph/décor/smoke/renfort) until they land — no
    gameplay blocks on art.
- **`narrative-designer` (Yasmine) — narrative wiring (AC7).** Wire the **already-gated**
  `final_pre`/`final_post` scripts (`spec-boss-encounter-fiction.md` §4) to this level's concrete id
  in `PRE_LEVEL_NARRATIVE`/`POST_LEVEL_NARRATIVE`; confirm they apply as-written or need light
  adaptation for the concrete id/anchor. **Also the delivery framing:** the finale delivery's
  vehicle type + diegetic read (§1.6 — "livre le son to the hall") is your call; I authored the
  mechanical values type-agnostically. Optional renfort cue copy (« …Pas pour lui. ») and the finisher
  prompt (« LIVRE LE SON ») are already gated in the fiction spec — placement is `ux-designer`.
- **`ux-designer` (Tony) — unlock surface + fresh-eyes legibility.** How the finale presents on the
  flyer-stack level select (the "final / 31 déc 1999" framing) — the unlock **surface**, not the
  unlock **logic** (which reuses the existing index hop, §3.1). Plus the story's own ask: a
  fresh-eyes legibility pass of the boss beat inside a **full level** (the first time a player
  reaches it without dev-harness familiarity), on both device classes.
- **`lead-game-designer` (Karim) — design gate.** Requesting a `VERDICT:` (PASS /
  PASS-WITH-CORRECTIONS / FAIL) on OQ1/OQ2 (§1), the live `bossQteSpec` data + seed policy (§2), the
  difficulty placement (§3), and the AC5 correct-course discipline (§4) — before this reaches `pm`
  re-review (AC9) and `senior-architect` TECH PLAN.
- **`senior-architect` (Winston) — TECH PLAN.** Treat as **data + narrative wiring** against the
  frozen ADR-0051/0052 contract (the story's binding Architecture directive); confirm AC1–AC5
  against real code; the AC8 sequencing gate (dev lanes wait for ADR-0052's stage-6 merge, or an
  explicit compress decision) is `producer`'s to confirm.

---

## Appendix — reference `LevelConfig` data (illustrative; `dev-gameplay` authors the real entry)

Not production code — the concrete values above, assembled in the frozen `LevelConfig` /
`BossQteSpec` shapes so a reviewer can see the spec resolves to a single appended array entry
(`BOSS_QTE_DEV_HARNESS_LEVEL` and the four shipped levels stay byte-untouched, AC2/AC3):

```ts
// appended to LEVELS after `vitry` — auto-unlocks via the existing index hop
{
  id: "niveau-final",
  name: "Niveau Final",            // diegetic copy → narrative-designer
  district: "Paris",               // → narrative-designer
  year: "1999",
  enemySpeedMultiplier: 1.8,
  enemiesToWin: 16,                 // real quota — NOT 0 (AC4)
  timeSeconds: 70,
  unlocked: false,                 // unlocked by clearing Vitry (index hop)
  deliveries: [
    {
      vehicleType: "truck",
      triggerAtElapsedSeconds: 18,
      integrity: 60,
      windowSeconds: 6,
      bonus: 300,
      entrySide: "left",
      stopPosition: { x: 0, y: -4.5 },
    },
  ],
  roster: {
    streetSpawns: ["courier"],
    windowWeights: { normal: 40, riot: 28, biker: 20, bonus: 10 },
  },
  // NO hostageQte (AC1) — mutual-exclusion invariant respected by construction
  bossQteSpec: {
    zoomSeconds: 2,
    anchor: { x: 0, y: -5 },        // x may nudge once the hall backdrop lands (§6)
    phaseCount: 3,                  // unchanged
    bossHp: 24,                     // unchanged
    maxBlownWindows: 10,            // unchanged
    targetSeed: 19991231,           // PROVISIONAL — stage-5 K-5 re-pin (§2.3)
    decorProp: { position: { x: 0.2, y: 1.5 }, armPhaseIndex: 1 }, // the chandelier
  },
}
```
