# Spec — Boss QTE encounter "Le chef de brigade" (mechanic + tuning)

**Feature:** the cinematic boss/mini-boss QTE set-piece — a "chef de brigade" à la
Time Crisis / House of the Dead: protected, vulnerable only when he opens fire, with a
multi-hit HP gauge (contrast the hostage duel, made binary in ADR-0034 Rev. 4).
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-19
**Status:** DRAFT — **needs `lead-game-designer` (Karim) design-gate PASS** before it goes to
`senior-architect` (TECH PLAN) and any dev implements it. This spec is the AC1 deliverable of
`_bmad-output/planning-artifacts/story-boss-encounter-qte.md`: it explicitly answers **Open
Questions 1, 2, 3** (mechanic side) and posts tuning magnitudes; it flags OQ6 as UX input and
leaves OQ4/OQ5 to `senior-architect`/`narrative-designer`.
**Design source (DECIDED, not re-opened here):** the story above (scope: exactly ONE boss-tier
encounter in V1, fuyard OUT, no new verb), plus the load-bearing precedent it names —
`docs/adr/0030-…` (freeze + zoom + phase-machine shell) and `docs/adr/0034-…` (the
sequenced-vulnerability duel, its seeded-pure-PRNG determinism law, the spatial-colour
wandering ring, the multi-hit `captorHp`, the energy ledger, the "diegetic read is the default"
convention). This spec **reuses** those primitives and specs only what DIVERGES for a boss.
**Reference:** `docs/game-design/spec-hostage-qte-duel-porte-cochere.md` (the sister QTE tuning
spec, whose value shape this mirrors), `_bmad-output/guidelines/enemy-bestiary.md` §3,
`docs/game-design/veille-concurrentielle-shooters.md` §3 Tier A idea #6 (the source idea).
**Cahier des charges verdict:** **[EXTENSION]** — conscious, documented. Prohibition (Atari ST, 1987) had **no boss** (veille §1 confirms it). Justified against the loop in §1 below, requested
by Bertrand, to be recorded in an ADR (story AC5) at the same standard as ADR-0030/0034. Core
loop `Récupérer → Livrer → Éviter` untouched — see §1.

This is a design spec, not code. Every value is a **game-designer default (tunable)**,
transcribed into `src/game/**` by `dev-gameplay` (pure, TDD). Nothing here holds render/art
style or HUD decisions — the render lane reads the state the tech plan defines and draws the
tableau; the exact HP-read surface is OQ6, flagged for `ux-designer` in §7.

---

## 0. World frame the numbers live in (read once)

Same shipping world the hostage QTE numbers are traced against (sister spec §0):

- Street plane `WORLD_HEIGHT = 12`; captor/boss tableau ≈ 2.0 u plane centred on `anchor`.
- Energy: continuous `[0, 100]`, `ENERGY_INITIAL = 100`, clamp-only, **no death at 0**
  (`energySystem.ts`). The QTE is the sole mover of energy in the frozen tableau.
- The **already-shipped** hostage-QTE primitives this spec reuses (do NOT re-derive them):
  the `ZOOMING → ACTIVE → (WON|LOST) → DONE` forward-only phase machine; the
  `COVERED ↔ PEEKING` two-stance skeleton; the seeded, pure, closed-form **wandering reticle
  ring** (`targetOffset`, `RING_HIT_RADIUS = 0.30`, seeded by `targetSeed`); the **spatial
  colour** anatomy read (`ringZoneAt → vital | limb | off`, damage `2 / 1 / 0`); the multi-hit
  `captorHp`; the **blown-peek loss clock** (`blownPeeks` / `maxBlownPeeks`); the energy ledger
  constants (`QTE_RESCUE_REFILL +40`, `QTE_UNANSWERED_PEEK −8`, `QTE_BODY_HIT −5`,
  `QTE_PANIC_SHOT −6`); the exposure floor `PEEK_EXPOSURE_FLOOR 0.5`; the FIXED tell-window
  duration `TELEGRAPH_LEAD_SECONDS 0.35` (`src/game/systems/qteSystem.ts:39` — the last 0.35 s
  of the COVERED beat carries the tell, asserted `peekCadenceSeconds > TELEGRAPH_LEAD_SECONDS`;
  it is a tell DURATION, **not** a "≥ 0.25 s lead minimum"); `QTE_ZOOM_SECONDS 2.0`,
  `QTE_RESULT_HOLD 2.2`.

The boss is, mechanically, **the spatial-colour ring duel MINUS the human shield, PLUS a bigger
phased HP pool and a per-phase escalation of the window parameters.** Everything below is either
a re-key of an existing rule or a boss-only value.

---

## OPEN QUESTION 1 — Required gate, tied to `Livrer` (DECIDED)

**Ruling: the boss is a REQUIRED gate on `Livrer` — the level cannot be completed until he is
down.** This is the deliberate fork from the hostage QTE (an _optional_ side objective that never
advances anything). I am tranchant on this, per story AC1.

**Mapping onto the core loop (the justification §5.6 and the guidelines demand).**

- The shooting gallery is the `Éviter` beat (discriminate threats, survive the run). The kill
  quota (`enemiesToWin`) is its proxy win condition.
- The boss is the **climactic obstacle on the `Livrer` beat**: you have `Récupéré` the goods, run
  the `Éviter` gauntlet, and the delivery is physically blocked by the chef de brigade. **Beating
  him = the delivery lands = the level clears.** He is not a new loop verb; he is the final
  obstacle on an existing one. This is the veille's exact "boss de livraison" reading (§3 #6).
- **A delivery you can skip is not a delivery** → the gate is _required_, not optional. This is
  precisely what an optional boss could never give the finale (story "why": "currently a mood,
  not a mechanical climax"). An optional capstone is a contradiction; the gate model resolves it.

**He is NOT in the kill quota (AC-safe).** The boss does not inflate `enemiesToWin` and is not a
"new skill to learn" (story). Mechanically he is the level's **terminal beat**: he triggers once
the quota is satisfied (the faithful Time Crisis "clear the mooks → stage boss → stage clear"
shape), _replacing_ the abrupt "quota met → win" with a duel. So he gates completion **without**
touching the quota number. (The exact trigger — on quota-completion vs. a scripted
`triggerAtElapsedSeconds` like the hostage — is a small integration choice; I recommend
**on quota-completion** for the faithful stage-boss read, and flag it for `senior-architect` in
§7. It does not change any value below.)

**Failure model (the anti-"mort bullshit" contract, §5.6 + UX rules 4 & 6).** Because the gate is
required, it needs a real loss route — but a _legible_ one:

- The boss only endangers the courier during his **telegraphed EXPOSED windows** (§OQ2): the
  window that opens him to your fire is the same window he fires back (the ADR-0034 D3 fusion). So
  every point of pressure is attributable to a window you saw and failed to answer — **no stray
  bullet, no unreadable death.**
- The loss clock is the **blown-window count** (a re-key of the hostage's `maxBlownPeeks`,
  §OQ2/§4): after `maxBlownWindows` un-answered exposures the brigade overwhelms the courier →
  `LOST` → **the level fails** (explicit reason surfaced: _"La brigade t'a submergé — trop
  d'ouvertures manquées"_, UX rule 4). Retry.
- **This asymmetry IS the required-vs-optional distinction, made mechanical.** Ignore the hostage
  → lose a bonus, continue. Ignore the boss → every window blows, the budget empties in ≈ 34 s,
  you fail the level. You cannot skip a required gate; the mechanic enforces it without a hidden
  rule.

**Open sub-flag for the gate (not mine to close):** on **Belliard-first** placement (OQ4, the
engineering precedent), making the encounter _required_ changes that level's completion contract
(today: quota met → win). `senior-architect` must vet the interaction (boss as terminal beat vs.
existing quota-win). The stakes MODEL is "required gate"; WHERE it first lands (Belliard vs.
finale) stays OQ4 (`narrative-designer` + `senior-architect`).

---

## OPEN QUESTION 2 — The vulnerability window: reuse the exposed-window shape, phase-sequenced (DECIDED)

**Ruling: reuse the `COVERED ↔ PEEKING` two-stance skeleton AND the spatial-colour wandering ring
wholesale, re-themed and re-keyed — then add a PHASE INDEX that sequences the HP gauge into
discrete attack patterns.** Not a literal reskin, not a from-scratch primitive: a
_phase-sequenced_ version of the proven exposed-window duel. This is `game-designer`'s call per
story scope, and I judge the shape fits strongly — it already solves "un point faible qui se
déplace" (the wander) and "phases d'attaque séquencées" (the phase index) that Bertrand named.

### 2.1 The stance skeleton, re-themed (structurally shared with the hostage)

| Hostage (ADR-0034) | Boss (this spec) | Meaning                                                                                                                                    |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `COVERED`          | **`SHIELDED`**   | Behind cover / riot shield. **Not shootable, not firing.** Telegraphs the next attack.                                                     |
| `PEEKING`          | **`EXPOSED`**    | He **opens fire on the courier** — and in doing so drops cover. The **sole** shootable moment = the **sole** dangerous moment (D3 fusion). |

`senior-architect` may literally share the state-machine code (the story invites it). The
_names_ diverge (a chef de brigade, not a kidnapper); the shape is identical.

**Time Crisis "crisis flash" (veille §2.2) = the G4 telegraph.** Every `EXPOSED` window is
preceded by a readable tell in the last stretch of `SHIELDED` (the boss winds up / the shield
lowers). No un-telegraphed exposure ever ships — asserted in code against level data, not trusted
(ADR-0034 gotcha discipline).

### 2.2 The weak point that moves — reuse the spatial-colour ring VERBATIM

Bertrand's OQ2 phrase "un point faible qui se déplace" is **already built**: the seeded,
closed-form **wandering reticle ring** (ADR-0034 Rev. 3–5). Reuse it wholesale:

- During `EXPOSED` the ring wanders over the boss silhouette (seeded pure function of
  `targetSeed`, the window ordinal, and window-elapsed time — the ADR-0034 Rev. 3 determinism
  law; **no `Math.random`, no per-tick PRNG cursor**).
- Its colour is a pure function of the anatomy under its centre (`ringZoneAt`): **vital** (head)
  → big chip, **limb** (torso/shoulders) → small chip, **off** (arms/legs/air) → 0. The game names
  the anatomy zone; the render maps it to vert/jaune/rouge (boundary preserved).
- **Simplification vs. the hostage: there is NO human shield, so G6 is MOOT.** The whole point of
  the hostage's `clampTargetOffsetG6` was to keep the ring off the hostage silhouette so a kill
  never risks a bavure. The boss has no hostage to protect → **the wander box may cover the full
  boss anatomy freely.** The only spatial constraint that remains is **on-frame visibility** (the
  ring must stay framed at the boss zoom — a stage-5 `verify` item, mirroring ADR-0034 K-1). One
  fewer constraint than the sister QTE; call this out to the tech plan.

### 2.3 The new lever — PHASE sequencing (the "sustained mastery" the story asks for)

This is the one genuinely-new mechanic (everything above is reuse). The boss HP gauge is split
into **3 phases** (House of the Dead classic). Crossing an HP threshold triggers a **phase
break** and re-parameterises the exposed-window duel — the fight gets tighter, not just longer:

- **Phase break (the legible transition beat):** when HP crosses a threshold the boss forcibly
  re-`SHIELDED`s for a **distinct, longer telegraph** (`PHASE_BREAK_SECONDS`, §4) — he re-postures
  into the next pattern. **No damage dealt or taken during the break.** This guarantees the player
  is never ambushed by a new attack pattern mid-shot (anti-bullshit) and gives the phase change
  its own unmissable read (a breather, in the spirit of the WON/LOST `QTE_RESULT_HOLD`). _What_
  that read looks like — enraged posture, new shield stance, diegetic pips vs. HUD — is art/UX
  (OQ6, §7); the mechanic only guarantees the beat exists and is telegraphed.
- Per phase, exactly the escalation levers move: **EXPOSED duration ↓** (tighter window), **wander
  speed ↑** (harder tracking), **SHIELDED lull ↓** (less recovery), **boss shot drain ↑** (missing
  costs more). One variable per phase per the one-variable discipline — the values are §4.

### 2.4 Anti-"mort bullshit" guardrails (mirror ADR-0034 G4/G5, asserted not trusted)

| Guardrail                                                                      | Floor                                                                                                                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EXPOSED duration** (window)                                                  | **≥ 0.5 s** even in the final phase (`PEEK_EXPOSURE_FLOOR`, reused)                                                         | A window must stay answerable within human reaction time. The phase-3 default (1.0 s) never approaches it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Telegraph lead** (NEW per-phase authored field `telegraphLeadSeconds`, §4.3) | **≥ `BOSS_TELEGRAPH_LEAD_FLOOR` = 0.35 s** in every phase, **AND** each phase's SHIELDED lull STRICTLY > its telegraph lead | This is a NEW authored per-phase field (0.45→0.40→0.35), **NOT** a reuse of the fixed `TELEGRAPH_LEAD_SECONDS` constant (a fixed constant cannot vary per phase). Its asserted floor value (0.35) is deliberately the shipped hostage tell (`qteSystem.ts:39`) — the boss tell never drops below the proven hostage read; phase 3 sits exactly on the floor. The `lull > lead` assert mirrors the hostage's `peekCadenceSeconds > TELEGRAPH_LEAD_SECONDS`, so the tell is a discrete wind-up, not the whole SHIELDED beat. No blind memorisation — the story's explicit garde-fou. |
| **Phase break**                                                                | **telegraphed, ≥ `PHASE_BREAK_SECONDS`, damage-free**                                                                       | A new attack pattern never opens on the player un-warned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Ring on-frame**                                                              | asserted at the boss zoom                                                                                                   | The moving weak point never leaves the framed tableau (no "shoot what you can't see"). Stage-5 `verify`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

These are **system invariants asserted against level data in code**, exactly as ADR-0034 asserts
its floors — never trusted from the authored spec (incl. any future difficulty curve).

---

## OPEN QUESTION 3 — How many encounters: options with production cost (POSED, not decided)

Per story AC3 and the mission brief, **V1 ships exactly ONE boss-tier encounter.** The count
_beyond_ V1 is a joint `lead-game-designer` + `pm` pacing/cost call — my job is to pose credible
options, not impose. The design below makes **tier a pure DATA parameter** (`phaseCount` + `bossHp`

- the per-phase window table), so whichever option is chosen later is a _data-only_ rollout
  against the same contract — the exact discipline that let the hostage QTE grow Belliard→ADR-0035
  without a new system.

| Option                                                               | What ships                                                              | Art cost                                                                                                                       | Tuning cost                                                                           | ADR cost                                | Risk / verdict                                                                                                                                                                 |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A — One finale boss only**                                         | 1 scripted encounter, the §7 finale climax                              | **1 boss sprite family** (shielded / exposed / hit / phase-2+3 posture / defeated ≈ 5 poses)                                   | 1 encounter, 1 seed to pin, 1 difficulty point                                        | 1 (the AC5 contract ADR)                | **Lowest.** But the verb appears exactly once → high build-cost per minute, no ramp for the player.                                                                            |
| **B — One boss per zone / recruitable contact** (up to 5, §7 roster) | 5 encounters, one per contact zone                                      | **5 boss families** (or 1 template + 5 reskins — still 5 legible reads) — expensive                                            | 5 encounters + a cross-level curve (a new ADR-0035-style curve doc), 5 seeds          | 1 contract ADR + 1 curve ADR            | **Highest** art + tuning load. Gives the mechanic a real arc, but 5× the sprite + balance work.                                                                                |
| **C — One finale boss + a cheaper recurring mini-boss tier**         | full 3-phase boss at the finale; **1-phase** mini-boss pop-ins mid-game | **2 families** — full boss + a mini-boss that can re-posture the existing `riot`/CRS archetype ("brigade chief") to stay cheap | 2 tiers (mini = `phaseCount 1`, small `bossHp`; boss = `phaseCount 3`) + a light ramp | 1 ADR covering both tiers (tier = data) | **Medium.** Best pacing (introduces the verb cheaply mid-game, pays it off at the finale) at moderate cost. The mini-boss is _literally the same system_ with `phaseCount: 1`. |

**My recommendation (an option, not a decree):** **ship V1 as Option A** (one encounter,
satisfies AC3 and AC4), **architected so C is a later data-only story** (`phaseCount`/`bossHp` as
`QteSpec` fields from day one). This is the cheapest V1 with the most future optionality, and it
mirrors the proven hostage rollout (one level first → curve ADR later). If Karim/PM want a
mid-game presence sooner, **C** is the natural next step; **B** only if the finale-arc is worth 5×
the art. Karim + John own the pick.

---

## 4. Tuning magnitudes (the deliverable — game-designer defaults, tunable)

Same magnitude discipline as ADR-0030 (`captorHp 4`, `window 5 s`, …) and the bestiary: every
value carries its rationale. Values **reused** from the hostage QTE are marked _(reuse)_;
boss-only values are marked _(new)_. Specs are allowed to diverge (story scope) — where a value
diverges from the hostage, the reason is stated.

### 4.1 Encounter frame

| Field             | Default           | Kind                       | Rationale                                                                                                                                                                                             |
| ----------------- | ----------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zoomSeconds`     | **2.0 s**         | reuse (`QTE_ZOOM_SECONDS`) | Same establishing hold as the hostage; firing during it is a panic penalty (§4.4). _Optional flag §7: a 2.5 s "grander boss establish" if art/UX want it — a one-line value change, no logic impact._ |
| `anchor`          | `{ x: 0, y: −5 }` | reuse                      | Centre-street tableau, feet on the ground line. Art scales the boss figure (larger silhouette).                                                                                                       |
| `QTE_RESULT_HOLD` | **2.2 s**         | reuse                      | The WON/LOST breather before `DONE`.                                                                                                                                                                  |
| `phaseCount`      | **3**             | **new**                    | House of the Dead classic. The tier lever (mini-boss = 1). Integer ≥ 1, asserted.                                                                                                                     |

### 4.2 HP gauge (multi-hit — the deliberate divergence from the binary hostage)

| Field                           | Default                 | Kind                               | Rationale                                                                                                                                              |
| ------------------------------- | ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bossHp`                        | **24**                  | **new**                            | 3 phases × 8 HP. The hostage's `captorHp 3` is a near-binary duel; a finale boss wants weight (HotD reference, story call). Integer ≥ 1, asserted.     |
| Phase thresholds                | HP ≤ **16**, HP ≤ **8** | **new (derived)**                  | Clean 3×8 split. Crossing each = a phase break (§2.3).                                                                                                 |
| Ring damage: vital / limb / off | **2 / 1 / 0**           | reuse (`CAPTOR_DAMAGE_VITAL/LIMB`) | The spatial-colour chip model verbatim. A clean vital hit = 2; a limb hit = 1; off = a wasted shot. Precision is rewarded without a new damage system. |
| `RING_HIT_RADIUS`               | **0.30**                | reuse                              | The ring hit test verbatim.                                                                                                                            |

**Winnability math (spec's own sanity check — must be verified in playtest, §6).** A skilled
player lands ≈ 1 clean vital (2 dmg) per window; mixed play ≈ 1.5 dmg/window. To clear 24 HP:
≈ 12 windows optimal, ≈ 16 realistic. With `maxBlownWindows = 10` (§4.3) the fight is winnable at
**≈ 55 % (optimal) → 62 % (realistic) window efficiency** — a real finale skill bar, achievable.
Total windows ≤ 26 ⇒ a **≈ 60–75 s** climax (within the 3–5 min mission budget, UX rule 2). This
coupling is delicate; **pin the Belliard `targetSeed` and confirm each phase presents ≥ 1 landable
vital-or-limb window per exposure** at stage-5 `verify` (the ADR-0034 K-5 discipline, restated in
§6).

### 4.3 Per-phase escalation table (the §OQ2.3 sequencing — one lever per phase)

Floors respected at every row (EXPOSED ≥ 0.5 s = `PEEK_EXPOSURE_FLOOR`; telegraph ≥ 0.35 s =
`BOSS_TELEGRAPH_LEAD_FLOOR`; and each phase's SHIELDED lull STRICTLY > that phase's telegraph lead):

| Phase            | HP band | EXPOSED (window) | SHIELDED lull | telegraph lead | wander speed | boss shot drain |
| ---------------- | ------- | ---------------- | ------------- | -------------- | ------------ | --------------- |
| **1 — opening**  | 24 → 16 | **1.6 s**        | **2.0 s**     | **0.45 s**     | **1.0 u/s**  | **−5**          |
| **2 — pressure** | 16 → 8  | **1.3 s**        | **1.6 s**     | **0.40 s**     | **1.3 u/s**  | **−6**          |
| **3 — frenzy**   | 8 → 0   | **1.0 s**        | **1.2 s**     | **0.35 s**     | **1.6 u/s**  | **−8**          |

- **EXPOSED ↓ 1.6 → 1.0 s**: the window tightens; still 2× the 0.5 s floor at its worst.
- **SHIELDED lull ↓ 2.0 → 1.2 s**: less recovery between openings — the frenzy phase crowds you.
- **telegraph lead ↓ 0.45 → 0.35 s** — a **NEW per-phase authored field `telegraphLeadSeconds`**,
  NOT a reuse of the fixed `TELEGRAPH_LEAD_SECONDS` constant (a fixed constant could not ramp
  0.45→0.40→0.35): never below the `BOSS_TELEGRAPH_LEAD_FLOOR` = 0.35 s floor (phase 3 sits exactly
  ON it); the tell stays readable, it just demands quicker acquisition. Floor value 0.35 = the
  shipped hostage tell so the boss is never LESS readable than the proven duel.
- **wander speed ↑ 1.0 → 1.6 u/s** — a **NEW per-phase authored field**; the hostage has **no**
  wander-speed knob (its speed is implicit at ≈ 1.8 u/s peak, derived from `LEG_DURATION 0.38`
  - `MAX_LEG_DISPLACEMENT 0.45`, `qteSystem.ts:123`). The boss caps at 1.6 u/s, staying UNDER the
    proven hostage peak; the moving weak point gets harder to track (the story's "point faible qui se
    déplace" as the difficulty ramp).
- **boss shot drain ↑ −5 → −8**: a missed window in the frenzy hurts most (attrition pressure).

`PHASE_BREAK_SECONDS` = **1.0 s** (new) — the damage-free, re-posture telegraph between phases
(§2.3). Longer than an in-phase telegraph so the pattern change is unmissable.

### 4.4 Energy ledger + loss clock

Reuses the hostage constants for DRY; boss-only rules noted. Severity stays strictly monotonic.

| Outcome                                                     | `energyDelta`                     | Kind                                                                 | Charge rule / rationale                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Boss defeated** (`bossHp → 0`)                            | **+50**                           | **new** (`QTE_BOSS_REFILL`)                                          | The gate's reward. Sized above the hostage `+40` (a harder, required fight). On a finale it is mostly ceremonial (level ends); on Belliard-first it refuels. Once, terminal.                                                                                                                                                                   |
| **Un-answered EXPOSED window** (his shot lands)             | **−5 / −6 / −8** per phase (§4.3) | **new** (phase-scaled; the hostage's flat `−8` is the phase-3 value) | The D3 counter-fire, re-keyed. Charged **once per CLOSED window** (never per tick — the ADR-0034 over-billing gotcha). Phase-scaled because the boss IS escalation.                                                                                                                                                                            |
| **Panic shot** (fired during the 2 s zoom or a phase break) | **−6**                            | reuse (`QTE_PANIC_SHOT`)                                             | "Don't shoot what you can't read" — extended to cover the damage-free phase break, which is also an unreadable frame.                                                                                                                                                                                                                          |
| **Off-anatomy / body shot during a window**                 | **−5**                            | reuse (`QTE_BODY_HIT`)                                               | Spraying the shield / off-ring body bleeds you; the smallest deliberate cost. Closes the safe-DPS loophole — only ring vital/limb chips HP.                                                                                                                                                                                                    |
| **Miss** (empty space)                                      | **0**                             | reuse                                                                | No penalty for a clean miss into the air.                                                                                                                                                                                                                                                                                                      |
| ~~Hostage bavure~~                                          | ~~−30~~                           | **removed**                                                          | **No human shield in V1** → the heaviest hostage penalty (`QTE_HOSTAGE_HIT`) does not apply. This keeps the boss distinct from the hostage QTE and avoids re-importing bavure risk. _(If narrative wants the boss to use a raver as a shield, that RE-INTRODUCES the bavure penalty and the G6 clamp — a scope addition, flagged §7, not V1.)_ |

**Loss clock — the blown-window count (re-key of `maxBlownPeeks`):**

| Field             | Default | Kind                              | Rationale                                                                                                                                                                                                                                                                                        |
| ----------------- | ------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `maxBlownWindows` | **10**  | **new** (mirrors `maxBlownPeeks`) | A "blown window" = an `EXPOSED` that CLOSES having chipped **0** HP (you failed to land vital/limb during it). Reaching 10 → the brigade overwhelms the courier → `LOST` → **level fails** (§OQ1). Sized against the winnability math (§4.2): ≈ 62 % efficiency to clear. Integer ≥ 1, asserted. |

**Deterministic tie-break (reuse the ADR-0030/0034 precedent):** on a same-tick collision, `fire`
resolves **before** the loss check — a depleting ring hit that takes `bossHp` to 0 on the same
tick a fatal blown window would fire → **WON**. A chipping-but-not-depleting hit does not save a
fatal window.

**Score.** Energy-only, matching the hostage QTE's gate-ruled single-currency model (ADR-0034 D5
/ G-1). No score bonus on defeat in V1. _If `pm` wants a score climax for the finale, that is a
`QteTickResult` contract question for the tech plan — flagged §7, not decided here (score is
partly `pm`'s WHAT)._

---

## 5. Consolidated value table (the deliverable)

**Per-encounter `bossQteSpec` (authored per level — a later curve story ramps these):**

| Key                    | Default                                                                 | Kind                                                |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| trigger                | **on quota-completion** (recommended; or `triggerAtElapsedSeconds`, §7) | new/integration                                     |
| `zoomSeconds`          | 2.0 s                                                                   | reuse                                               |
| `anchor`               | `{ x: 0, y: −5 }`                                                       | reuse                                               |
| `phaseCount`           | 3                                                                       | new (tier lever)                                    |
| `bossHp`               | 24                                                                      | new                                                 |
| `maxBlownWindows`      | 10                                                                      | new                                                 |
| `targetSeed`           | pinned at stage-5 `verify` (§6)                                         | reuse                                               |
| per-phase window table | §4.3 (EXPOSED / lull / tell / wander / drain × 3)                       | new — **candidate for game-wide constants**, per §7 |

**Game-wide constants (`bossQteSystem.ts` or shared — `senior-architect`'s call, not per level):**

| Constant                                                                             | Default                     | Kind                                                       |
| ------------------------------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------- |
| `QTE_BOSS_REFILL`                                                                    | **+50**                     | new                                                        |
| boss shot drain (phase 1/2/3)                                                        | **−5 / −6 / −8**            | new                                                        |
| `QTE_PANIC_SHOT`                                                                     | −6                          | reuse                                                      |
| `QTE_BODY_HIT`                                                                       | −5                          | reuse                                                      |
| ring damage vital/limb/off                                                           | 2 / 1 / 0                   | reuse                                                      |
| `RING_HIT_RADIUS`                                                                    | 0.30                        | reuse                                                      |
| `PHASE_BREAK_SECONDS`                                                                | 1.0 s                       | new                                                        |
| `PEEK_EXPOSURE_FLOOR`                                                                | 0.5 s                       | reuse (assert)                                             |
| `TELEGRAPH_LEAD_SECONDS` (hostage fixed tell-window, `qteSystem.ts:39`)              | 0.35 s                      | reference only — **NOT** the boss floor                    |
| `BOSS_TELEGRAPH_LEAD_FLOOR` (asserted floor on the per-phase `telegraphLeadSeconds`) | 0.35 s                      | new (assert)                                               |
| `telegraphLeadSeconds` (per phase)                                                   | 0.45 / 0.40 / 0.35 s (§4.3) | new — authored per phase (assert ≥ floor, and lull > lead) |
| `QTE_ZOOM_SECONDS`                                                                   | 2.0 s                       | reuse                                                      |
| `QTE_RESULT_HOLD`                                                                    | 2.2 s                       | reuse                                                      |

Whether the per-phase window table is authored per-level or lives as constants (Belliard-first,
like the hostage's wander amplitude) is a data-shape call for `senior-architect` — I recommend
**constants for V1** (one encounter, no curve yet), promoted to `bossQteSpec` fields when a
multi-encounter curve story (Option B/C) needs them. Same F3-promotion seam as ADR-0034.

---

## 6. Acceptance criteria (design VERIFY, stage 5 — Sacha playtests `verify` vs. these)

- **AC1 — Gate.** The level cannot complete until `bossHp → 0`. A passive player (never fires)
  blows every window and reaches `maxBlownWindows` in ≈ 34 s → `LOST` → level fails with an
  explicit on-screen reason. Ignoring the boss is NOT viable (contrast the hostage).
- **AC2 — Sequenced vulnerability.** The boss is shootable (chips HP) **only** during `EXPOSED`;
  a ring hit while `SHIELDED` or during a phase break does 0 and costs the body/panic penalty.
- **AC3 — Telegraph floors (anti-bullshit).** Every `EXPOSED` is preceded by a perceptible tell of
  the phase's `telegraphLeadSeconds`, which is asserted **≥ `BOSS_TELEGRAPH_LEAD_FLOOR` = 0.35 s**
  in every phase AND STRICTLY < that phase's SHIELDED lull (so the tell is a discrete wind-up, not
  the whole beat); every `EXPOSED` duration ≥ 0.5 s even in phase 3; every phase break is
  damage-free and ≥ 1.0 s. Asserted in code against the authored spec (unit test), not just
  observed.
- **AC4 — Phases escalate, legibly.** HP crossing 16 and 8 triggers a phase break; phases 2 and 3
  read as tighter (shorter window, faster wander, shorter lull) and the transition is an
  unmissable beat (not just a number ticking).
- **AC5 — Multi-hit + spatial colour.** Depleting `bossHp` via ring vital/limb chips (2/1) is the
  sole win; off/body/miss never win. The wandering weak point is visible/trackable and on-frame at
  the boss zoom throughout (K-1-style framing check on both device classes).
- **AC6 — Winnability (K-5 discipline).** With the pinned Belliard `targetSeed`, **each of the
  windows across all 3 phases presents ≥ 1 landable vital-or-limb decelerating waypoint** — a
  competent player clears with margin; a sloppy one loses to the blown-window clock. Confirm by
  structural assert or empirical `verify`-playtest with the pinned seed.
- **AC7 — Energy ledger.** Defeat = +50 (clamped); un-answered window = −5/−6/−8 by phase, charged
  once per closed window; panic (zoom/break) = −6; body/off = −5; miss/hostage = n/a. Severity
  order holds. No score moved.
- **AC8 — Determinism / boundary.** `bossQteSpec === null` levels are byte-for-byte unchanged
  (additive-and-optional, the ADR-0030/0034 law). The wander is a pure closed-form function of the
  seed — no `Math.random`, no per-tick PRNG cursor (the ADR-0034 Rev. 3 precedent).

Sacha reports PASS/deviations to `lead-game-designer` before `senior-architect`'s integration
review, per the pipeline stage-5 contract.

---

## 7. Open flags for the gate / other lanes (explicitly NOT decided here)

**For `lead-game-designer` (gate) + `pm`:**

1. **OQ3 count** — the pick between Options A / B / C (§OQ3) is Karim + John's. I recommend **A in
   V1, architected for C later**; awaiting the joint call.
2. **Score climax** — the boss is energy-only for consistency with the hostage's single-currency
   ruling. If `pm` wants a score payout on a required finale gate, that reopens the
   `QteTickResult` contract — a `pm` + `senior-architect` call, not mine.

**For `senior-architect` (TECH PLAN / OQ1 sub-flag / OQ4):**

3. **Trigger timing** — I recommend **on quota-completion** (faithful stage-boss). Confirm vs. a
   scripted `triggerAtElapsedSeconds` (the hostage's shape). No value below depends on it.
4. **Belliard-first required-gate interaction** — making the encounter _required_ changes
   Belliard's completion contract (§OQ1 sub-flag). Architect to vet; interacts with OQ4 (where it
   lands first — `narrative-designer` + `senior-architect`).
5. **Per-phase table: constants vs. `bossQteSpec` fields** — I recommend constants for V1 (§5).
6. **Shared vs. new system** — the story invites sharing the `COVERED↔PEEKING` skeleton and the
   wandering-ring code; §2 confirms the shapes are close enough to share. Architect's call on
   `bossQteSystem.ts` vs. extending `qteSystem.ts`.

**For `ux-designer` (OQ6 — flagged, NOT decided by me):**

7. **HP read surface.** The boss keeps a **multi-hit, phased** HP gauge — a _stronger_ case for a
   visible read than the hostage's near-binary duel, because the player makes pacing decisions on
   remaining HP and the current phase. But §6 audio rule ("la musique est le seul indicateur de
   tension — pas de barre de stress") and ADR-0034 Rev. 4's diegetic-pips ruling (K-4) push the
   other way. **This is `ux-designer`'s call, made fresh (story OQ6), not inherited from the
   hostage.** My gameplay input, not a decision: whatever surface you pick, **phase transitions
   must have their own strong, distinct read** (a new attack pattern the player can't anticipate =
   bullshit) — the mechanic guarantees the damage-free `PHASE_BREAK_SECONDS` beat exists; the
   _read_ of it is yours + `lead-art`'s.

**For `narrative-designer` (OQ5 — not my lane, dependency noted):**

8. Who "le chef de brigade" is, and whether V1 keeps him **without a human shield** (my V1
   assumption — see §4.4). If fiction wants a raver-as-shield, that RE-INTRODUCES the bavure
   penalty + G6 clamp and is a **scope addition** to raise with `pm`/Karim, not a silent V1 change.

**For `lead-art` (read spec, not style):**

9. The player must, at a glance, distinguish **SHIELDED** (safe, no shot) from **EXPOSED**
   (shootable + firing), read the **telegraph** before each window, and read the **phase break**
   as a distinct beat. Poses needed (indicative): shielded / telegraph-windup / exposed-firing /
   hit / per-phase posture / defeated. Style is yours; the _read_ is the spec.

---

## Hand-off — `lead-game-designer` (Karim), design gate

**Decisions taken in this spec (mechanic + tuning + 3C, my lane):**

- **OQ1 — DECIDED: required gate on `Livrer`.** The boss is the delivery's climactic obstacle;
  the level cannot complete until he is down; he is NOT in the kill quota; failure = level fails
  with an explicit, non-bullshit reason (loss only via blown telegraphed windows). Justified
  against the loop in §OQ1.
- **OQ2 — DECIDED: reuse the `COVERED↔PEEKING` exposed-window skeleton + the spatial-colour
  wandering ring, re-themed `SHIELDED↔EXPOSED`, PLUS a 3-phase HP sequencing that re-parameterises
  the window per phase.** G6 drops (no human shield). Anti-bullshit floors reused/asserted (§2.4).
- **OQ3 — POSED (not decided, per story): three options with production cost (§OQ3).** Recommend
  A-in-V1-architected-for-C; the pick is yours + `pm`'s.
- **Tuning magnitudes — specified with rationale (§4/§5):** `bossHp 24` (3×8), ring damage 2/1/0,
  `maxBlownWindows 10`, per-phase window table (EXPOSED 1.6→1.0 s, lull 2.0→1.2 s, tell 0.45→0.35 s,
  wander 1.0→1.6 u/s, drain −5→−8), `PHASE_BREAK_SECONDS 1.0`, `QTE_BOSS_REFILL +50`, zoom 2.0 s.
  Winnability math + K-5-style seed-pin flagged as a stage-5 `verify` item (§4.2, §6).

**Points I explicitly left OPEN for you / other lanes (§7):** the OQ3 count pick (you + `pm`);
score-vs-energy for the gate (`pm`); trigger timing + Belliard-required-gate interaction +
shared-vs-new-system (`senior-architect`); **OQ6 HP-read surface (`ux-designer` — I flagged it as
gameplay-relevant and gave input, but did NOT tranche HUD-vs-diégétique)**; OQ5 fiction and the
human-shield scope question (`narrative-designer` + you/`pm`).

**Requesting:** design-gate `VERDICT:` (PASS / PASS-WITH-CORRECTIONS / FAIL) before this reaches
`senior-architect`. AC1 of the story ("spec explicitly answers OQ1–3") is met above.
