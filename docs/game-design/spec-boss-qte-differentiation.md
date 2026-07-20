# Spec — Boss QTE differentiation pack (5 levers: mechanic + tuning)

**Feature:** the 5-lever differentiation pack that makes "le Commandant" read as **not** the
hostage duel — a direct response to Bertrand's playtest verdict on the ADR-0051 V1 harness:
**"c'est limite au même gameplay que l'otage sans l'otage."**
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-20
**Status:** DRAFT — **needs `lead-game-designer` (Karim) design-gate PASS** before it reaches
`senior-architect` (TECH PLAN) and any dev implements it. This spec is the AC1 deliverable of
`_bmad-output/planning-artifacts/story-boss-qte-differentiation.md`: it explicitly answers the
Open Questions I own — **1-A/B/C, 2-A/B, 3-A/B/C, 5-A/B** — and — following
`senior-architect`'s 4-C freeze-law ruling (landed 2026-07-20, shard §3: option (b), no
exception; renfort lives inside the boss state machine, folds into Wave 2) — tunes **lever 4**
in this same pass within the ruling's four binding constraints.
**Design source (DECIDED, not re-opened here):** the story above (Wave 1 / Wave 2 / lever-4
carve-out sequencing), the gated V1 spec `docs/game-design/spec-boss-qte-encounter.md` and its
ADR `docs/adr/0051-boss-qte-encounter-system.md` (the contract this EXTENDS in place), the shape
this must DIVERGE from — the hostage duel `docs/adr/0034-hostage-qte-duel-porte-cochere.md`
(single wandering ring, single "shoot-when-exposed" verb) — and the veille it draws from
(`docs/game-design/veille-concurrentielle-shooters.md` §3, Tier S #2 parade, Tier A #6 boss /
#7 décor interactif).
**Constants this spec is written against (real, from `src/game/systems/bossQteSystem.ts` +
`types/bossQte.ts`):** `BOSS_PHASE_TABLE` (phase 1/2/3 → EXPOSED 1.6/1.3/1.0 s, SHIELDED lull
2.0/1.6/1.2 s, telegraph 0.45/0.40/0.35 s, wander 1.0/1.3/1.6 u/s, drain −5/−6/−8), `bossHp 24`
(thresholds 16/8), `phaseCount 3`, `maxBlownWindows 10`, `RING_HIT_RADIUS 0.30`,
`BOSS_DAMAGE_VITAL 2` / `BOSS_DAMAGE_LIMB 1`, `PEEK_EXPOSURE_FLOOR 0.5`,
`BOSS_TELEGRAPH_LEAD_FLOOR 0.35`, `PHASE_BREAK_SECONDS 1.0`, `QTE_BOSS_REFILL +50`,
`QTE_PANIC_SHOT −6`, `QTE_BODY_HIT −5`, `QTE_ZOOM_SECONDS 2.0`, `QTE_RESULT_HOLD 2.2`, the
anatomy bands (`BOSS_VITAL_*` head, `BOSS_TORSO_*` + shoulders limb, everything else off), and
the only input the tick receives — `fire: boolean` + `impactPoint: Vec2` (see `tickBossQte`;
this is load-bearing for 3-A).
**Cahier des charges verdict:** **[EXTENSION]** — a refinement of the already-RATIFIED boss
extension (ADR-0051; Prohibition ST had no boss). Core loop `Récupérer → Livrer → Éviter`
untouched (levers 1/2/3/5 refine the `Livrer`-gate duel; lever 4 is the only one that risks
`Éviter` and is carved out for the freeze-law ruling). Each lever adds new tells / inputs /
failure surfaces, so each is held to §5.6 ("jamais de mort bullshit") below.

This is a design spec, not code. Every value is a **game-designer default (tunable)**,
transcribed into `src/game/**` by `dev-gameplay` (pure, TDD). Nothing here holds render/art
style, HUD layout, or audio character — those are `dev-r3f-render` / `ux-designer` / `lead-art` /
`sound-designer` (seams flagged §6). I spec the **read** ("the player must identify X at a
glance"), not the look.

---

## 0. The differentiation thesis (why these five, and the load-bearing move)

The V1 duel and the hostage duel share one **verb** ("track the wandering ring, shoot it while
he's exposed") and one **decision** ("is the ring green enough to fire?"). Re-skinning the
fiction does not change what the mouse does, so the fight reads as sameness (Bertrand's finding,
ADR-0051 D1's own admission). Differentiation therefore has to change **the verb or the
decision**, not the dressing. Each lever is measured against that bar:

| Lever                            | What it changes vs. the hostage duel                                                                            | New verb?       | New decision?                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------- |
| **1 — points faibles multiples** | one ring → a **choice between two live targets**                                                                | no              | **yes** (which weak point, risk/reward) |
| **3 — parade**                   | one offensive verb → a **second, defensive, reactive verb**                                                     | **yes** (parry) | yes (shoot vs. parry this beat)         |
| **2 — décor interactif**         | dead SHIELDED downtime → an **optional offensive play** + a second sensory tell channel                         | no              | yes (spend the gap on the prop?)        |
| **5 — coup de grâce**            | abrupt `bossHp→0 → WON` → a **ceremonial finisher beat**                                                        | no (a flourish) | no (ceremonial)                         |
| **4 — renfort**                  | a lone-you-and-him duel → a **telegraphed, in-economy pressure surge** (the fight feels besieged at its climax) | no              | yes (perform under raised stakes)       |

**The unifying design move (answers Bertrand directly): the fight STARTS as the familiar
hostage-shaped read, then progressively becomes something the hostage never is.** The new
mechanics are **introduced on phase transitions** — each already a telegraphed, damage-free
`PHASE_BREAK_SECONDS` beat, so the player is never ambushed by a new pattern (§5.6). Phase 1 is
the onboarding (single ring, V1 exactly); phase 2 reveals the targeting choice; phase 3 reveals
the parry and the full kit. This respects the one-variable-per-phase discipline the V1 escalation
table already uses, and it means the answer to "c'est le même gameplay que l'otage" is mechanical:
it is the same for ~8 HP, then it diverges hard and stays diverged.

**AC3 note (no silent additions):** exactly the five named levers are specced. No other veille
Tier S/A idea (tir-sur-le-beat, quitte-ou-double, temps-mouvement, ricochet, économie de
munitions…) is folded in.

---

# WAVE 1 — the two levers that redefine the moment-to-moment loop

## LEVER 1 — Points faibles multiples (tête / corps)

### 1-A — DECIDED: a SECOND SIMULTANEOUS target (asymmetric), not continuous re-colour, not discrete alternation

The three candidate systems and my ruling:

- **(a) CONTINUOUS (status quo):** one ring wanders the full anatomy, colour = `bossRingZoneAt`
  under its centre. **This IS the hostage model.** Rejected — it is the sameness Bertrand named.
- **(b) DISCRETE alternation:** the ring commits to a head-window or body-window for a stretch;
  the player reads which is live. Rejected as a **weak** differentiator: the verb is still "read
  the one live thing, shoot it" — a re-timed single-target duel, not a choice.
- **(c) SECOND SIMULTANEOUS target — CHOSEN.** During EXPOSED the boss presents **two rings at
  once**, each with a **fixed anatomical identity and its own risk/reward**, and the player
  chooses which to answer. This is the only option that turns the decision from "is it green?"
  into "which do I commit this window to?" — the "choix de ciblage sous pression" Bertrand asked
  for, a decision the single-ring hostage duel structurally cannot pose.

The two rings (during a two-ring EXPOSED window):

| Ring                | Anatomy band it wanders within         | Chip                                  | Wander speed                                    | Read                               |
| ------------------- | -------------------------------------- | ------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| **VITAL — la tête** | head band (`BOSS_VITAL_*`, dy 0.6–1.0) | **2 HP** (`BOSS_DAMAGE_VITAL`, reuse) | phase `wanderSpeed × 1.0` (fast, hard to track) | high risk / high reward            |
| **LIMB — le corps** | torso+shoulders band (`BOSS_TORSO_*`)  | **1 HP** (`BOSS_DAMAGE_LIMB`, reuse)  | phase `wanderSpeed × 0.6` (slow, easy)          | low risk / low reward — the "bank" |

Each ring keeps `RING_HIT_RADIUS 0.30` (reuse). One `fire` is tested against **both** ring
centres; a hit within radius of a ring scores **that ring's fixed chip** (identity = zone; no
`bossRingZoneAt` re-read needed for the two-ring case — see reuse map). If a shot is within
radius of **both** (overlap), it scores the **higher** chip (vital) — the player is rewarded for
the harder-to-earn read on a tie; deterministic, never ambiguous.

**Colour-honesty preserved.** Each ring's wander box is asserted ⊂ its anatomy band, so the
ring's drawn colour (render maps identity → green/yellow) equals the anatomy it sits over equals
the chip it scores — the same aim-honesty discipline ADR-0034 Rev. 4 established.

### 1-B — DECIDED: both live together; one shared danger clock (no double jeopardy)

"Exposing one shields the other" collapses (c) back into (b) — no simultaneous choice. So **both
rings are live for the whole window.** The choice is **purely offensive**; the **danger surface
is unchanged from V1**: `windowChipped` stays a **single boolean** — a chip from **either** ring
answers the window. A window that closes with **0 HP chipped from either ring** is a blown window
(one `blownWindows++`, one phase drain −5/−6/−8), exactly as today. The player is **never
double-charged** for two targets. This keeps the telegraph budget and the §5.6 failure model
identical to the gated V1 (one blown-window = one attributable drain).

**Attributable failure (§5.6):** the two rings ARE the tell — both are drawn, both within the
framed tableau, both ≥ the EXPOSED floor. A blown window = "I saw two openings and hit neither"
or "I over-committed to the fast head ring and whiffed." The greedy-vital line is the intended
skill expression: chase 2 HP and risk the whole window, or bank the safe 1 HP. Never unreadable.

### 1-C — DECIDED: phase-escalation, single ring in phase 1 (the choice raises the ceiling, not the floor)

Bertrand's framing ("force un choix… sous pression," raise the ceiling not the floor) and the
story's explicit worry ("worth checking it doesn't just make phase 1 harder to read") both point
one way: **the multiple-weak-points mechanic is a phase-2 escalation, not the phase-1 baseline.**

| Phase              | HP band | Targeting model                                                                                                        |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| **1 — onboarding** | 24 → 16 | **single ring, `bossRingZoneAt` colour-by-position — V1 EXACTLY.** The familiar read; the fight opens on known ground. |
| **2 — the choice** | 16 → 8  | the ring **splits into the two simultaneous rings** (vital + limb). One new variable.                                  |
| **3 — full kit**   | 8 → 0   | two rings persist; windows tighten per the existing `BOSS_PHASE_TABLE` row (unchanged).                                |

The split is **introduced at the phase-1→2 break** — already a damage-free, telegraphed
`PHASE_BREAK_SECONDS 1.0 s` beat — so the new two-ring pattern opens only _after_ a transition the
player saw. No mid-shot ambush (§5.6 / ADR-0051's phase-break guarantee holds verbatim).

### 1 — Reuse map (AC2: extends in place vs. newly authored)

**Extends `bossQteSystem.ts` in place:** the EXPOSED stance, `windowChipped` (stays a single
bool), `RING_HIT_RADIUS`, `BOSS_DAMAGE_VITAL/LIMB`, the seeded `bossWander` closed-form (called a
**second time** with a distinct salt for ring B — see below), the phase-break beat as the
introduction gate. Phase 1 is byte-behaviour-identical to V1 (single ring, `bossRingZoneAt`).
**Newly authored (boss-only):** a second ring on the runtime — `targetOffsetB: Vec2` + a fixed
`ringB` identity (limb) — populated only when `phaseIndex ≥ 1`; per-ring wander sub-boxes
`BOSS_VITAL_WANDER_{CENTRE,AMP_X,AMP_Y}` (head band) and `BOSS_LIMB_WANDER_{CENTRE,AMP_X,AMP_Y}`
(torso band), asserted ⊂ their anatomy bands; a per-ring wander-speed multiplier (vital ×1.0,
limb ×0.6); ring B's wander salt (e.g. `windowOrdinal` XOR a fixed large odd constant, or
`targetSeed` offset) so the two paths are decorrelated and never coincide. `dev-gameplay`'s call
on the exact salt; the determinism law (pure fn of seed + sim state, no `Math.random`) is
unchanged.

### 1 — Tuning defaults (game-designer defaults, tunable)

| Field                          | Default                        | Rationale                                                            |
| ------------------------------ | ------------------------------ | -------------------------------------------------------------------- |
| VITAL ring wander centre / amp | `(0, 0.80)` / `x 0.16, y 0.16` | stays inside head band (dy 0.6–1.0); small + fast = the risky read   |
| LIMB ring wander centre / amp  | `(0, 0.25)` / `x 0.28, y 0.28` | stays inside torso band (dy −0.1–0.6); larger + slow = the safe bank |
| VITAL wander-speed multiplier  | `1.0`                          | full phase speed                                                     |
| LIMB wander-speed multiplier   | `0.6`                          | easier to track (the low-risk option must be genuinely easier)       |
| overlap tie-break              | score **vital**                | reward the harder read; deterministic                                |
| phase-1 model                  | single ring, unchanged         | onboarding                                                           |

---

## LEVER 3 — Parade façon Sekiro

### 3-A — DECIDED, STATED PLAINLY: the SAME fire-click, reinterpreted by a distinct telegraphed PARRY window. NO new input channel. NO `src/hooks` change.

This is the ruling that decides scope. The tick receives **only** `fire: boolean` +
`impactPoint: Vec2` (verified in `tickBossQte` / `useGameLoop.ts`). A **genuinely new input** (a
modifier key, a second mouse button) would (a) require threading a new param through
`useGameLoop → tickBossQte` (a `src/hooks` + contract change) AND (b) demand a **new mobile
gesture** on top of ADR-0003's swipe-camera + two-finger-fire scheme — and it fights
`PROJECT_GUIDELINES.md` §5 rule 5 ("déplacement + **une action**").

**Ruling: the parry is the existing fire-click, made newly meaningful during a window that
previously did nothing.** A `fire` whose `impactPoint` lands on the boss's **raised-weapon parry
point** during a distinct, telegraphed **CHARGED window** = a parry. (Narrative read, gated in
parallel — `spec-boss-differentiation-fiction.md` §lever 3: Muf shoots **the pistol, not the
man** — a precise shot on the sidearm as it comes up knocks the shot wide, « une balle suffit ».
The parry point IS the rising sidearm; my mechanic and that read are the same event.) The whole decode lives inside
`bossQteSystem.ts`'s existing tick against the existing input. **This consciously takes the
story's second 3-A option** (not a new verb-input, a newly-meaningful window) — chosen for
controller-parity (desktop and mobile use the identical single action) and §5-rule-5 compliance.
It still delivers a **new verb in feel**: a _defensive, reactive, timing-gated_ read that the
purely-offensive hostage duel never has.

### 3-B — DECIDED: parry reward = chip + stagger bonus window; whiff cost = a heavier, attributable charged-shot drain

On a **CHARGED window** the boss winds up a heavy shot (distinct telegraph, 3-C). It **replaces**
a normal EXPOSED window on a cadence (below). The player must click the **parry point** within
the parry window:

| Outcome                                                               | Effect                                                                                                                                                                                                                                         | Rationale                                                                                                                                                                     |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Parry success** (fire on parry point, within window)                | **chip 2 HP** (`QTE_PARRY_CHIP`, = vital magnitude) **+ STAGGER**: the boss is briefly staggered damage-free, then **immediately opens a bonus EXPOSED window** at the phase's `exposedSeconds` (a free offensive beat, two-ring in phase 2/3) | the parry is the **highest-DPS line** (chip + a bonus window) — mastery is rewarded, the tempo flips from defense to offense (the Sekiro reward the hostage duel can't offer) |
| **Charged shot unanswered** (window closes, no valid parry)           | **−10 energy** (`QTE_CHARGED_WHIFF`) **+ counts as ONE blown window** (`blownWindows++`) — not double: the −10 **replaces** the phase drain on that close                                                                                      | the boss's big swing lands; heavier than the worst normal drain (−8), but a single charge                                                                                     |
| **Panic click during the charged window that misses the parry point** | **−6** (`QTE_PANIC_SHOT`, reuse); **non-consuming** — the window stays open, a valid parry can still land before it closes                                                                                                                     | "don't spray when you should parry"; one bad swipe is not an instant loss (§5.6 forgivable)                                                                                   |

Severity ledger stays strictly monotonic: `QTE_BODY_HIT −5 ≤ QTE_PANIC_SHOT −6 ≤ phase drain
−5/−6/−8 ≤ QTE_CHARGED_WHIFF −10`.

**Attributable failure (§5.6 — the story's explicit extension of OQ1's "every point of pressure
attributable to a window you saw"):** a whiffed parry is preceded by the distinct charged tell
(3-C) with a ≥-floor lead, and the parry window itself is ≥ the reaction floor. A missed parry is
"I saw the charged wind-up and failed the timing," never a hidden punishment. The panic-click cost
is likewise self-inflicted (you fired when the tell said parry).

### 3-C — DECIDED, REQUIRED (not optional): a distinct parry telegraph, sized against `BOSS_TELEGRAPH_LEAD_FLOOR`

Given the floor discipline the existing telegraph carries (`BOSS_TELEGRAPH_LEAD_FLOOR 0.35`, the
`lull > lead` assert), a second, **distinguishable** tell type is **required**: the player must
read "this is a PARRY beat (charged shot incoming — click the weapon)" vs. "this is a SHOOT beat
(window opening — track the ring)" **before committing**. A shared tell = a bullshit whiff.

New authored per-phase field **`parryLeadSeconds`**, with its **own asserted floor ≥
`BOSS_TELEGRAPH_LEAD_FLOOR 0.35`** and asserted **< that phase's SHIELDED lull** (same `lull >
lead` shape as the normal tell). It is set **longer** than the normal telegraph because the parry
is a harder reactive read. The **channel must be categorically distinct** from the normal tell —
that distinctness is a render/UX/art READ requirement I spec here and hand to `ux-designer` +
`lead-art` (§6): I do not choose the visual.

New authored **`parryWindowSeconds`**, asserted **≥ `PEEK_EXPOSURE_FLOOR 0.5`** — the parry stays
answerable within human reaction time, same guarantee as an EXPOSED window.

### 3 — Cadence & phase mapping (the introduction, mirroring lever 1's onboarding)

| Phase | Parry presence                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | none (onboarding — single ring, no new verb)                                                                                                  |
| **2** | **exactly one** charged/parry window, near the phase end, with the **longest** tell (`parryLeadSeconds` 0.8) — a single safe "teach" instance |
| **3** | charged windows on cadence — **every other** EXPOSED window is charged (`parryLeadSeconds` 0.6) — the full-kit climax                         |

Introducing the parry only from phase 2 (one variable at a time, after the phase-1→2 break the
player saw) keeps every phase readable. **The exact phase-3 cadence (every-other vs. every-third)
is a stage-5 `verify` tunable** — I flag it as the most likely tuning correction once played.

### 3 — Reuse map (AC2)

**Extends in place:** the `fire` + `impactPoint` input (NO `src/hooks` change — 3-A), the
telegraph discipline and its floors, `RING_HIT_RADIUS 0.30` (reused as the parry-point catch
radius), `QTE_PANIC_SHOT −6`, the deterministic "fire resolves before the loss check" tie-break.
**Newly authored:** a `chargedWindow` flag + a `parryPoint: Vec2` (fixed, anchor-relative — the
raised gun-arm, default `(−0.40, 0.30)`, aligned with the `BOSS_L_SHOULDER` band) on the runtime;
`parryLeadSeconds` + `parryWindowSeconds` per applicable phase (asserted against the floors); a
**STAGGER sub-state** (damage-free, then opens a bonus EXPOSED window — structurally a cousin of
the phase-break sub-state, but it opens a window instead of re-SHIELDing); `QTE_PARRY_CHIP +2`
(HP), `QTE_CHARGED_WHIFF −10` (energy). The charged-window cadence is a system constant for V1
(promotable to spec fields under the ADR-0035 F3 seam if a curve ever needs it).

### 3 — Tuning defaults

| Field                                        | Default                                 | Rationale                                                                                                              |
| -------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `parryLeadSeconds` (phase 2 teach / phase 3) | **0.8 / 0.6 s**                         | ≥ 0.35 floor, < the phase lull (2.0 / 1.2); longer than the normal tell (harder reactive read); teach instance longest |
| `parryWindowSeconds` (phase 2 / phase 3)     | **0.7 / 0.6 s**                         | ≥ 0.5 reaction floor; answerable                                                                                       |
| `parryPoint`                                 | `(−0.40, 0.30)` anchor-relative         | the raised gun-arm; catch radius `RING_HIT_RADIUS 0.30`                                                                |
| `QTE_PARRY_CHIP`                             | **+2 HP**                               | equals a vital hit — the harder read earns the top chip                                                                |
| `QTE_CHARGED_WHIFF`                          | **−10 energy**                          | the boss's big swing; > worst normal drain (−8), single charge                                                         |
| STAGGER → bonus window                       | opens EXPOSED at phase `exposedSeconds` | the tempo-flip reward (two-ring in phase 2/3)                                                                          |
| phase-3 charged cadence                      | every other window                      | felt but not overwhelming — **verify tunable**                                                                         |

---

# WAVE 2 — pacing / texture (additive once Wave 1's targeting shape is frozen)

> Wave 2 depends only on Wave 1's **shape** (what "EXPOSED / shootable" means), now settled
> above (two rings phase 2+, parry phase 2+). Values below assume that shape.

## LEVER 2 — Décor interactif

### 2-A — DECIDED: data-driven SHAPE, single authored instance (the phaseCount-as-data precedent, minimally)

Mirror ADR-0051 C4 (phaseCount/bossHp were architected as data from day one) **without**
over-building (YAGNI — only one canon venue, the Niveau Final, and V1 is a non-shipped harness).

**Ruling: one OPTIONAL authored prop on `BossQteSpec` (`decorProp?: { position: Vec2;
armPhaseIndex: number } | null`), its behaviour a system constant.** V1 authors **exactly one**
prop on the harness (an enceinte stack / lustre), armed in phase 2. This is data-driven (a later
venue authors its own position/phase) but minimal (one prop, one behaviour, `null` = no prop = the
additive-and-optional law holds: a boss with no decor is byte-behaviour-identical). **Not** a
bespoke hardcoded object (that would violate the data-from-day-one precedent), **not** a full
generic multi-prop "interactive decor system" with a behaviour taxonomy (that is speculative — a
single field suffices). Promotion to a `decorProps[]` array is the deferred F3-style seam, opened
only if a second venue ever needs two props.

### 2-B — DECIDED: PLAYER-TRIGGERED, but sited in the SHIELDED gap — not a third ring during EXPOSED

The veille idea (#7, "lustre/enceintes à faire tomber") is inherently player-triggered; scripted-
automatic would be pure spectacle and would not change any decision. But a player-triggered prop
that competed **during EXPOSED** would be a **third** thing to aim at, compounding lever 1's two
rings + lever 3's parry into an unreadable EXPOSED beat.

**Ruling: the prop is a player-triggered target that arms during a SHIELDED lull — the "dead
time" the player currently just waits through.** During its armed, telegraphed window (in
`armPhaseIndex`), shooting the prop **drops it on the boss for a fixed 3-HP burst**
(`BOSS_DECOR_DAMAGE`), **single-use** (`decorConsumed`), then it is spent for the rest of the
encounter. This turns downtime into an optional offensive play, and it **does not overload** the
EXPOSED read (it lives in the SHIELDED gap, when there are no rings).

**Attributable failure (§5.6): the prop is PURE UPSIDE — missing it costs nothing.** It never
fires back, never drains energy, never counts toward the loss clock. A player who ignores it or
whiffs it simply doesn't get the burst. This is the safest possible §5.6 profile (no new failure
surface), which is why the prop half needs no floor beyond "its armed window is telegraphed and ≥
`PEEK_EXPOSURE_FLOOR 0.5` so it's answerable."

### 2-C — the smoke / audio-tell half: MECHANIC stated, ACCESSIBILITY RULING deferred (seam)

The "double tranchant" (double-edge) of the veille idea is the **smoke** that degrades the
telegraph and shifts the tell "vers l'audio." \*\*The accessibility ruling on this is `ux-designer`

- `sound-designer`'s, running in parallel — I do NOT rule it here.** I state the **mechanic
  boundary\*\* their ruling must land within, as an incoming constraint on my system:

* The game exposes a scripted **`smokeActive`** flag on a phase cadence (default: a stretch of
  phase 3 — the frenzy). While active, the **visual** telegraph is **degraded** (reduced salience)
  but **NEVER removed**: even at max smoke it retains **≥ the full `BOSS_TELEGRAPH_LEAD_FLOOR
0.35 s` lead** and a minimum salience. The audio tell is a **REDUNDANT ADDED channel**, never a
  **replacement**.
* **Hard constraint I am setting for §5.6 / not-colour-alone-on-the-audio-axis:** a deaf /
  hard-of-hearing player must still have a present (degraded) visual telegraph ≥ the floor during
  smoke — an audio-**only** tell would be an un-telegraphed window on the audio axis, the exact
  failure the story's 2-C flags.
* **What I defer to `ux-designer` + `sound-designer` (seam):** the exact audio character, the
  exact visual-degradation floor (how faint is "degraded but present"), and whether smoke is worth
  shipping in V1 at all vs. deferring to the live encounter. If their ruling is "audio tell can't
  be made redundant-and-fair in V1," the smoke half is **cut** and lever 2 ships as the stagger
  prop alone — the prop half stands independently. I mark this a gate-visible dependency.
* **Convergence (parallel specs, landed 2026-07-20):** both `ux-designer`
  (`spec-boss-qte-differentiation-ux.md` §1.1) and `sound-designer`
  (`spec-boss-qte-differentiation-audio.md`, lever 2) independently ruled **ADD, not REPLACE** —
  the audio tell is a redundant channel over a still-present (degraded) visual telegraph that
  holds the full lead time. That matches my mechanic constraint exactly; the smoke half is on
  track. (If sound had landed REPLACE it would be a seam for Karim; it did not.) Narrative frames
  the smoke as the party's own smoke machine nobody switched off — "the room fights on Muf's side"
  (`spec-boss-differentiation-fiction.md` §lever 2).

### 2 — Reuse map (AC2)

**Extends in place:** the SHIELDED lull (the prop arms within it), the telegraph discipline,
`RING_HIT_RADIUS 0.30` (prop catch radius), the additive-and-optional law (`decorProp === null` ⇒
unchanged). **Newly authored:** optional `BossQteSpec.decorProp`; runtime `decorArmed` /
`decorConsumed`; a prop hit-test; `BOSS_DECOR_DAMAGE 3`; a scripted `smokeActive` flag (game-side
minimal — the degradation is render/UX). The smoke's visual degradation + audio tell are almost
entirely `dev-r3f-render` / `ux-designer` / `sound-designer` work; the game layer only owns the
`smokeActive` boolean and the floor guarantee.

### 2 — Tuning defaults

| Field                       | Default                     | Rationale                                                                                           |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| `decorProp.armPhaseIndex`   | **1** (phase 2)             | armed once the player knows the base loop; a mid-fight power play                                   |
| decor armed-window duration | **≥ 0.5 s**, telegraphed    | answerable; pure-upside so no tighter floor needed                                                  |
| `BOSS_DECOR_DAMAGE`         | **3 HP**                    | a chunk ("faire tomber sur un groupe"); ⅛ of `bossHp 24`, single-use — meaningful, not trivialising |
| single-use                  | yes (`decorConsumed`)       | one prop, one payoff                                                                                |
| `smokeActive` cadence       | a phase-3 stretch (default) | frenzy texture; **cut if ux+sound rule the audio tell un-fair in V1**                               |

---

## LEVER 5 — Coup de grâce cinématique

### 5-A — DECIDED: a dedicated FINISHER sub-state that PRECEDES `QTE_RESULT_HOLD` (does not replace it)

The mission brief ("un clic final façon porte cochère") and the ADR-0034 execution-click precedent
both point to a dedicated hold, not an instant transition.

**Ruling: crossing `bossHp ≤ 0` opens a `FINISHER` beat BEFORE `WON`.** The sequence becomes:

```
last depleting chip → FINISHER (boss on his knees, a final "coup de grâce" prompt, awaits click)
    → WON (+QTE_BOSS_REFILL +50) → QTE_RESULT_HOLD 2.2 s breather → DONE
```

The FINISHER **PRECEDES** the existing `QTE_RESULT_HOLD` breather — it does **not** replace it.
`QTE_RESULT_HOLD` still plays its 2.2 s WON hold after the finisher fires. This mirrors the
porte-cochère execution-click adapted to a victory finisher. Cleanest as a **new sub-state on the
depleting transition** (the tick currently returns `WON` directly on the depleting hit — that
return becomes `FINISHER` instead). `senior-architect` may prefer a new top-level phase
(`ZOOMING → ACTIVE → FINISHER → WON → DONE`) vs. an ACTIVE sub-state; either keeps the camera
driver unchanged (the ortho zoom is fully in through ACTIVE/FINISHER). I flag the shape choice to
the tech plan; it changes no value here.

### 5-B — DECIDED: CEREMONIAL, guaranteed-success, auto-resolving — zero failure surface

I agree with the story's lean: a new failure surface bolted onto the moment of victory would be an
odd place to introduce bullshit-death risk.

**Ruling: the finisher CANNOT be failed.**

- A **click** during the FINISHER window fires the coup de grâce immediately (the satisfying,
  agency-giving beat).
- **No click** within `FINISHER_HOLD_SECONDS` → it **auto-resolves** to the finisher anyway (the
  boss goes down regardless) → `WON`.
- The FINISHER is **damage-free** (the boss is at 0 HP, defeated posture): no counter-fire, no
  blown-window clock, no energy cost, no way to lose after dropping him to 0. Consistent with
  `QTE_BOSS_REFILL` being "mostly ceremonial on a finale."

The click is a **reward flourish**, not a test. §5.6 is trivially satisfied (no failure surface).

**Narrative read (gated in parallel — `spec-boss-differentiation-fiction.md` §lever 5):** the
beat is the Commandant down-but-not-finished, one hand still reaching for the radio/whistle to
have the son cut; the finisher **stops that reach** — delivery, not execution (no gore, no
kill-word, mute-QTE law upheld). Optional on-screen action prompt « LIVRE LE SON » — surface
owned by `ux-designer` (§3), which also rules that the FINISHER hold must read as visually
distinct from the passive `QTE_RESULT_HOLD` breather so the player knows it's an active-input
beat. Aftermath reuses the already-gated `final_post` unchanged. I spec the mechanic; the prompt
copy and its placement are `narrative-designer` + `ux-designer`.

### 5 — Reuse map (AC2)

**Extends in place:** the depleting-hit transition (today `→ WON`; becomes `→ FINISHER`),
`QTE_BOSS_REFILL +50` (still paid on the WON that follows), `QTE_RESULT_HOLD 2.2` (unchanged,
plays after), the forward-only phase machine. **Newly authored:** the `FINISHER` phase/sub-state

- `finisherRemaining` timer + `FINISHER_HOLD_SECONDS`; the finisher-click decode (reuses the same
  `fire` input — any `fire` during FINISHER resolves it; no aim precision required, it's ceremonial).

### 5 — Tuning defaults

| Field                    | Default                               | Rationale                                                                                                                |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `FINISHER_HOLD_SECONDS`  | **1.5 s**                             | generous — long enough to click deliberately, short enough that a passive player isn't stalled; auto-resolves on timeout |
| finisher click precision | none (any `fire`)                     | ceremonial; agency without a skill test                                                                                  |
| energy on finisher       | 0 (refill paid on the subsequent WON) | no double-refill, no cost                                                                                                |

---

## LEVER 4 — Renfort mi-combat (in-tableau pressure surge — Wave 2, per the 4-C ruling)

**4-C ruling (senior-architect, shard §3, landed 2026-07-20): option (b).** The freeze law
(ADR-0030 D3 / ADR-0051 D2) is **NOT amended, no exception.** Renfort lives **entirely inside the
boss QTE's own state machine** as scripted, seeded, telegraphed in-tableau pressure — of the same
family as the wandering ring — priced in the **existing** energy ledger, never touching
`enemies`/`spawnWave`/`couriers`/`bullets`/`lives`/`elapsedSeconds` or `qteSystem.ts`. Real roster
enemies are REJECTED. Lever 4 **folds into Wave 2** (no story split). My tuning below is bounded by
the ruling's four constraints; violating any = design-gate FAIL.

### 4-A — RESOLVED (as constrained): a telegraphed, seeded PRESSURE SURGE, no shootable body

The in-tableau interpretation, made concrete. The renfort is **not a target and not a threat that
fires** — it is a **scripted, telegraphed stretch during which the stakes of the boss's own
windows rise.** During a surge, frame-edge silhouettes sweep past (the read is carried by
frame-edge motion + audio — `sound-designer`'s low ambient pressure bed + `ux-designer`'s
frame-edge cue; I own only the game-state flag and the pricing). There is **no CRS body to shoot**
(consistent with the narrative 4-D read below), **no travelling bullet, no `lives`.** The player
"answers" the surge by doing what they are already doing — landing chips on the boss during it.

**Narrative read (4-D RULED by `narrative-designer`, `spec-boss-differentiation-fiction.md`
§lever 4):** the renfort is **NOT his men — a lost CRS section swept in by the millennium chaos**,
a different corps he neither called nor commands, that in the smoke doesn't even pick him out.
This **preserves and sharpens** « il n'a plus personne pour le couvrir » (his own brigade arriving
would give him cover = canon contradiction, refused). The mechanic must READ as "pas ses hommes" —
chaos that taxes Muf, not a squad reinforcing the boss. No 4th faction, no live shootable entity;
reuses the shipped CRS silhouette (`enemy_riot`) as frame-edge motion only.

### 4-B — DECIDED (in-economy pricing, no double jeopardy): the surge MODULATES the existing blown-window drain, adds no second clock

The freeze-law ruling's constraint (ii) is the answer to double jeopardy: price the pressure in
the **existing energy/window ledger**, do not bolt on a second HP/lives clock. So the surge does
**not** add a new charge event or a new target — it **raises the energy magnitude of the boss's
own blown-window event** on the windows it flags:

- During a surge, each flagged window that is **BLOWN** (closes with 0 HP chipped) drains
  **`QTE_RENFORT_DRAIN −12`** _instead of_ the phase-3 −8 — a single charge per window, the SAME
  blown-window event at a higher magnitude, **not** a second charge stacked on it. No double
  jeopardy: one blown window = one energy charge, just heavier under the surge.
- **The surge NEVER touches the loss clock.** A renfort-blown window still counts as exactly
  **one** `blownWindows++` — the same as any blown window. The surge makes a miss _hurt more in
  energy_, never _accelerate `maxBlownWindows`_ — there is no hidden second pressure on the sole
  failure clock. (And energy is clamp-only with no death at 0 in the tableau, so the tax is felt
  as resource attrition carried out of the fight, exactly like every other drain — consistent with
  the whole boss economy.)
- A flagged window the player **ANSWERS** (lands any chip) costs nothing extra — you held the
  line, the section moves on ("pas pour lui").

Severity ledger stays strictly monotonic and unbroken:
`QTE_BODY_HIT −5 ≤ QTE_PANIC_SHOT −6 ≤ phase drain −5/−6/−8 ≤ QTE_CHARGED_WHIFF −10 ≤
QTE_RENFORT_DRAIN −12` (the surge is the peak-pressure beat, so it sits at the top).

**Attributable failure (§5.6):** the heavier drain only lands on a **BLOWN** window inside a
**TELEGRAPHED** surge (distinct onset tell ≥ the floor). "I blew a window I was warned was under
renfort pressure" — never a stray anything, never an un-signalled magnitude change. The surge
onset is itself introduced only within phase 3 (after two phase breaks the player saw), and its
tell is its own distinct channel (frame-edge motion + audio riser) — flagged to `ux-designer` /
`sound-designer` / `lead-art` for the READ, spec'd here as a requirement, not a look.

### 4 — Placement, cadence, duration (concrete tuning)

| Field                  | Default                                                                                                                                                                                                                  | Rationale                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| surge phase            | **phase 3 only**                                                                                                                                                                                                         | the frenzy climax — "millennium chaos peaks"; keeps phases 1–2 clean for the lever-1/3 introductions (one new variable per phase)    |
| surges per encounter   | **1** (V1)                                                                                                                                                                                                               | one besieged beat; a second is a verify-tunable if phase 3 has room. **verify tunable**                                              |
| surge onset            | a fixed, seeded window ordinal in phase 3 (default: the 2nd phase-3 window)                                                                                                                                              | deterministic (seeded/scripted, no `Math.random`), so it's replay-stable and the seed pin can guarantee it lands after a phase break |
| surge duration         | **2 consecutive EXPOSED windows**                                                                                                                                                                                        | long enough to read as a "wave," short enough not to dominate the ~5-6-window phase 3                                                |
| surge onset tell lead  | **≥ `BOSS_TELEGRAPH_LEAD_FLOOR 0.35 s`**, distinct channel                                                                                                                                                               | the surge is telegraphed like everything else; a new pressure state never opens un-warned (§5.6)                                     |
| `QTE_RENFORT_DRAIN`    | **−12 energy**                                                                                                                                                                                                           | a blown window under the surge; > worst normal/charged drain, single charge, loss-clock-neutral                                      |
| interaction with parry | a charged/parry window MAY fall inside a surge; if so, a whiffed parry charges `QTE_CHARGED_WHIFF −10` OR the surge drain, **whichever is greater (−12)** — never both (no stacking; the window has one blown-magnitude) | keeps the "one blown window = one charge" invariant even when levers 3 and 4 overlap                                                 |

### 4 — Reuse map (AC2)

**Extends `bossQteSystem.ts` in place:** the SHIELDED↔EXPOSED window machine, the blown-window
drain event (magnitude modulated under the surge), the telegraph discipline + floors, the
seeded-pure determinism law (the surge onset is a seeded/scripted window ordinal, no
`Math.random`), the energy ledger, `maxBlownWindows` (untouched — the surge never adds counts).
**Newly authored (all inside `bossQteSystem.ts` / `types/bossQte.ts`, per the ruling):** a
`renfortSurge` scripted descriptor (onset window ordinal + duration in windows) as a system
constant for V1; a runtime flag deriving "is this window under the surge" from `windowOrdinal`;
`QTE_RENFORT_DRAIN −12`; the surge onset tell flag. **Constraint compliance (asserted at review):**
the lever-4 logic reads/mutates ONLY boss-QTE runtime fields — it does **not** read or write
`enemies`, `spawnWave`, `couriers`, `bullets`, or `elapsedSeconds`, and does **not** touch
`qteSystem.ts`/`hostageQte.ts`. The structural early-return freeze (`stateMachine.ts:160-197`)
stays literally unchanged.

---

## Winnability envelope (re-stated; a stage-5 `verify` re-pin obligation)

The V1 math (24 HP, ~1.5 dmg/window realistic, `maxBlownWindows 10`, ~55–62 % window efficiency
to clear, ~60–75 s) is the base. These levers **raise the offensive ceiling** (the greedy-vital
line at 2 HP, the parry chip +2 + a bonus window, the decor +3 one-shot) while leaving the
**floor** roughly where V1 set it — exactly the "raise the ceiling not the floor" intent (1-C).
Net: a player who masters the new tools clears **faster / with more blown-window margin**; a player
who doesn't is no worse off than V1 on the danger side (the danger surface — one blown-window per
missed window — is unchanged; parry adds one heavier failure state but only on charged windows the
player was told about).

**I am NOT re-tuning `bossHp 24` or `maxBlownWindows 10` on paper** — the gated V1 base stands
until playtest evidence says otherwise. **Stage-5 obligation (K-5 discipline, restated):** with
the pinned harness `targetSeed`, confirm each phase-2/3 window presents **≥ 1 landable
vital-or-limb decelerating waypoint on EACH ring**, each charged window presents a landable parry,
and the decor arm-window is landable — or re-pin the seed. Two decorrelated ring paths + parry
timing make the seed pin harder than V1's single ring; this is the most likely correction at
`verify`.

---

## Design VERIFY acceptance criteria (stage 5 — Sacha playtests `verify` vs. these)

- **AC-D1 — Differentiation reads.** By phase 2 the fight poses a visible targeting **choice**
  (two live rings) and by phase 3 a **parry** beat, both introduced on a telegraphed phase break;
  a playtester describes a different moment-to-moment than the hostage duel. (The whole point.)
- **AC-D2 — Lever 1.** Phase 1 = single ring (V1). Phase 2+ = two simultaneous rings, vital 2 HP /
  limb 1 HP, both live, one shared `windowChipped` (a chip from either answers the window; overlap
  scores vital). No double-drain.
- **AC-D3 — Lever 3.** Parry decoded from the SAME `fire`+`impactPoint` (no `src/hooks` change);
  distinct `parryLeadSeconds` tell ≥ 0.35 and < the lull; `parryWindowSeconds` ≥ 0.5; success =
  +2 HP + stagger bonus window; whiff = −10 + one blown window (single charge); panic-click during
  the window = −6, non-consuming.
- **AC-D4 — Lever 2.** Decor prop is a SHIELDED-gap, single-use, pure-upside target (+3 HP, no
  failure surface). Smoke (if shipped) degrades but never removes the visual tell (≥ floor lead
  retained), audio is redundant — per the ux+sound ruling.
- **AC-D5 — Lever 5.** `bossHp≤0` opens FINISHER before `QTE_RESULT_HOLD`; a click OR a 1.5 s
  timeout resolves it to WON; no way to lose during it.
- **AC-D6 — Lever 4.** A phase-3 surge is telegraphed (distinct onset tell ≥ floor); a blown
  window under it drains −12 (single charge, replacing −8); it counts as exactly ONE `blownWindows`
  (no loss-clock acceleration); an answered flagged window costs nothing extra; the surge reads as
  "pas ses hommes" (frame-edge motion, no shootable body); the lever-4 logic touches no
  `enemies`/`spawnWave`/`couriers`/`bullets`/`elapsedSeconds` and no `qteSystem.ts`.
- **AC-D7 — §5.6 throughout.** Every new failure (blown two-ring window, whiffed parry, renfort-
  blown window) traces to a tell the player saw and a window ≥ the reaction floor; the decor and
  finisher add no failure surface. No un-telegraphed pattern change (all introduced on phase
  breaks).
- **AC-D8 — Boundary / determinism.** All-new logic is pure `src/game` (two-ring wander, parry
  decode, decor, finisher, renfort surge), seeded-pure (no `Math.random`), and additive-and-optional
  (a boss with no decor / no surge / a phase-1-only fight is unchanged). The structural
  early-return freeze stays untouched.

Sacha reports PASS/deviations to `lead-game-designer` before `senior-architect`'s integration
review (pipeline stage-5).

---

## 6. Seams & hand-offs (explicitly NOT my lane)

- **`ux-designer` (Tony) + `sound-designer` (Malik) — 2-C accessibility ruling (BLOCKING for the
  smoke half):** the audio-tell-under-smoke. My mechanic sets the constraint (visual tell degraded
  **not** removed, ≥ `BOSS_TELEGRAPH_LEAD_FLOOR` lead retained; audio is a redundant ADD). They
  rule the audio character, the visual-degradation floor, and whether the smoke half ships in V1.
  If un-fair in V1, smoke is cut and lever 2 ships as the stagger prop alone.
- **`ux-designer` + `lead-art` (Maud) — the parry telegraph READ (3-C):** the charged/parry tell
  must read as **categorically distinct** from the normal window tell, at a glance, before the
  player commits. I spec the read requirement; they own the visual. Also: the finisher prompt read
  (5), the two-ring read (both rings + their green/yellow identity distinguishable), and the decor
  armed-window read.
- **`narrative-designer` (Yasmine) — fiction (4-D + décor + finisher):** the reinforcement's
  in-fiction justification (must not contradict "il n'a plus personne pour le couvrir"), the decor
  set-dressing, the coup-de-grâce beat. Traces to `spec-boss-encounter-fiction.md`; I write no
  fiction.
- **`senior-architect` (Winston) — 4-C freeze-law ruling LANDED** (shard §3, option (b): renfort
  in-tableau, energy-priced, freeze law unchanged; lever 4 folds into Wave 2, no split) — lever 4
  is tuned above within its four constraints. **Still owed at TECH PLAN:** the 5-A finisher shape
  (new phase vs. ACTIVE sub-state); the AC5 ADR (amend ADR-0051 or new extending ADR — ADR-0052
  allocated); and a review-time assert that the lever-4 logic touches no
  `enemies`/`spawnWave`/`couriers`/`bullets`/`elapsedSeconds`.
- **`lead-game-designer` (Karim) — design gate:** requesting a `VERDICT:` (PASS /
  PASS-WITH-CORRECTIONS / FAIL) covering Wave 1 / Wave 2 / the lever-4 carve-out, before this
  reaches `senior-architect`. **AC1** (every Open Question I own answered: 1-A/B/C, 2-A/B,
  3-A/B/C, 5-A/B, plus 4-A/B now that 4-C landed) and **AC4** (lever 4 tuned only after the 4-C
  freeze-law ruling, within its four constraints — not before) are both met above. AC3 (exactly the
  five levers, no silent veille additions) holds.
