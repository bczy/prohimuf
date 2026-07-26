# Spec — "Protéger la camionnette": the delivery assault (arbitration of ADR-0069's free objective)

**Feature:** the damage rule of the `Livrer` pillar — what makes the `DELIVERING` window a real
objective now that ADR-0069 freezes off-screen enemies. Replaces the camera-filtered
`shootingCount` (`stateMachine.ts:497-499`) with a **directed assault, seated next to the vehicle at
its arrival, whose damage rule contains no camera term**.
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-26 · **Revision: Rev.2**
**Status:** DRAFT Rev.2 — **needs `lead-game-designer` (Karim) design-gate re-check** (round 1 of 2
consumed) before `senior-architect` plans it and `dev-gameplay` implements it.
**Trigger:** merge-gate panel verdict NO-MERGE on `claude/offscreen-enemies-cannot-shoot`
(`docs/handoffs/story-offscreen-enemies-frozen.md`, MAJEUR #2 — 4/4 reviewers CONFIRMED), and
ADR-0069 §Négatif's own explicit request: _"mérite un arbitrage `game-designer` plutôt qu'un choix
implicite"_.
**Lane surface:** `src/game/**` ONLY (deliverySystem + stateMachine + enemySystem call site + their
tests). No render, no art, no audio, no `levels.ts` data change. See §8.

---

## Revision history

| Rev.      | Date       | What changed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rev.1     | 2026-07-26 | Initial arbitration. Verdict `PASS WITH CORRECTIONS` (Karim): spine RATIFIED, 4 blocking corrections K-1…K-4 (+ K-6 wording).                                                                                                                                                                                                                                                                                                                                                                                           |
| **Rev.2** | 2026-07-26 | **K-1** AC2 replaced by the three true properties (a/b/c) + §0/D1 wording fixed. **K-2** §4.2/§4.3 recomputed against the real per-archetype duty cycle, `D` re-tuned, lockstep ruled on. **K-3** deterministic seating guarantee (slot reservation) replaces "seat as many as available"; AC12 now pins the SEATED count. **K-4** identity discriminator named. **K-6** `lead-art` read requirement reframed (double read). Advisories A1-A5 ruled. **Plus one AMENDMENT to a ratified decision — see the box below.** |

> ### ⚠ AMENDMENT to a RATIFIED decision — needs Karim's explicit re-ratification
>
> Karim ratified **D1** with its `targetable` predicate ("the best idea in the spec"). Working K-1
> and K-2 I measured the predicate against **moving** cameras, not just the two constant ones, and it
> does not survive: freezing both assailants **while they are ducked** (`HIDDEN`) suspends the damage
> entirely, and it is reachable by an ordinary edge-scroll. Measured over a full sweep of pan-start
> times at 8 u/s (the real edge-scroll speed), **0.4 % – 26 % of pan timings end the window with the
> full bonus and zero player shots** — the panel's blocker, reopened through the same door
> (§7, row "targetable predicate"). No value of `D` closes it: the exploit's damage floor is **0**.
>
> **Rev.2 therefore amends D1: the damage counts assault enemies that are ALIVE, not
> `targetable`.** The consequences are strictly better on every axis K-1 and K-2 care about (the
> damage rule now has no camera term AND no pop-up-state term, so `t_fail` is a single number per
> level, provable rather than tabulated, and **0 of 8 904 camera trajectories** survive the ignore
> case on Belliard — 0 of ~8 400-9 200 on each other level). The cost is the loss of the shared
> `resolvePlayerShot` predicate and of the strict per-tick form of "you only ever lose integrity to
> something you could have shot"; §D1 restates the invariant in the per-beat form that is still true,
> and §7 records the two variants I measured and rejected (`targetable` as ratified, and
> `max(1, targetable)`).
>
> If Karim prefers to keep the ratified predicate, the one-line overrule is available: the
> `max(1, targetable)` variant with `D = 13` also seals every trajectory — but it fails the
> slow-mobile reference player on Vitry and Niveau Final (measured, §7), so I do not recommend it.

---

## 0. Decision in one line

**The vehicle is chipped by its own scripted assault — 2 enemies seated at two reserved window slots
next to the stop position when the van starts rolling in, bleeding the gauge for as long as they are
alive — and by nothing else.**

**There is no camera term in the damage rule** (and, since Rev.2, no pop-up-state term either).
Proximity stops being a _filter_ on the ambient wave (measured below: that filter is a no-op) and
becomes a _seating_ rule that guarantees the threat exists. Note the precise claim: the rule does not
read the camera. That is what is true and what is sufficient — Rev.1's stronger phrasing
("integrity is camera-independent") was an over-claim under a `targetable` predicate, and is now
true only because the rule no longer reads any freezable state (K-1, final paragraph).

---

## 1. What the build actually does today (measured, not argued) — RATIFIED, unchanged

Probe: the real `tickGameState` driven at 60 Hz on the shipped levels, hostage QTE disabled to
isolate the delivery beat, player never fires, camera parked at a fixed x for the whole window.
(Throwaway harness, not committed; numbers reproducible from the values in §4.)

| Level      | camera x       | integrity at window end | phase   | score |
| ---------- | -------------- | ----------------------- | ------- | ----- |
| belliard   | **0 (on van)** | **100 / 100**           | SUCCESS | +500  |
| belliard   | +18            | **100 / 100**           | SUCCESS | +500  |
| belliard   | −18            | 86 / 100                | SUCCESS | +500  |
| stalingrad | −2 (on van)    | **80 / 80**             | SUCCESS | +400  |
| stalingrad | +25            | **80 / 80**             | SUCCESS | +400  |
| vitry      | +2 (on van)    | **60 / 60**             | SUCCESS | +300  |
| vitry      | −25            | 47.6 / 60               | SUCCESS | +300  |

Three facts fall out, and they are worse than "the objective is free":

1. **The objective is free** — 7/7 runs return `SUCCESS` + full bonus with the player doing nothing.
2. **The incentive is INVERTED.** Damage only ever appeared in the runs where the camera was
   pointed **away** from the van (−18, −25): those are the frames where enemies unfreeze, reach
   `SHOOTING`, and are counted. Looking at the van (camera 0 / −2 / +2) yielded **exactly 0
   damage**. The rule currently reads: _"the van is hurt in proportion to how much the player
   engages the fight somewhere else"_. Optimal play during `DELIVERING` is to stop playing.
3. **The damage is non-local.** On belliard the van at x=0 lost 14 integrity to shooters 18 world
   units away, off-frame from the van, that the player could not have been "protecting it" from.

## 2. Why ADR-0069's own suggested fix (option a) is rejected — RATIFIED, unchanged

> ADR-0069 §Négatif: _"Une piste : faire dépendre le grignotage de la proximité du tireur au
> véhicule plutôt que de la caméra."_

Measured counterfactually on the same 7 trajectories, with R = 9 world units (half a viewport):

| candidate damage rule                                 | damage over the whole window, all 7 runs |
| ----------------------------------------------------- | ---------------------------------------- |
| `SHOOTING` anywhere (pre-ADR-0069)                    | 0.0 – 14.1                               |
| `SHOOTING` **and** within R of the van (**option a**) | **0.0 in 7/7 runs**                      |
| targetable **and** within R of the van (option a+)    | **0.0 in 7/7 runs**                      |

Option (a) is not a weak fix, it is a **no-op**, for two compounding reasons:

- **The freeze eats it.** `SHOOTING` is only ever _entered_ on screen (ADR-0069). An enemy near the
  van, off-screen, is frozen and never becomes a shooter — so a proximity filter has nothing to
  count. The only way an off-screen enemy is in `SHOOTING` is if the player framed it and panned
  away inside its 0.5 s shot; and that case is precisely the "frozen shooter chips the gauge
  forever" bug the camera filter was added to kill. Option (a) therefore **removes a guard and adds
  no stake**.
- **The lottery eats what's left.** `spawnWave` seats `1 + wave` enemies over the whole facade by a
  deterministic shuffle; the slots within R of the van are a small minority (measured, R = 7:
  **10/54** belliard, 7/48 stalingrad, 28/152 vitry, 2/16 niveau-final). Whether an objective
  succeeds would be decided by a wave-seeded shuffle the player cannot influence — predetermined,
  zero agency. That is not a harder objective, it is a coin the game flips for you.

**Conclusion: any rule that derives the van's threat from the ambient wave is structurally broken
here.** The threat has to be _directed_. That is the whole decision.

---

## 3. Decisions

### D1 — Damage source: this delivery's assault, alive, no camera term **[AMENDED in Rev.2]**

During `DELIVERING`, integrity loss per second is

```
DAMAGE_PER_ASSAILANT_PER_SECOND × (number of THIS delivery's assault enemies that are ALIVE)
```

where **alive** = `state !== "DEAD"` — the same "still in play" test `allDead` and `tickLoot` already
use (`stateMachine.ts:367`, `lootSystem.ts:127`), so no new predicate enters the codebase.

- **No camera term.** `isOnScreen` / `cameraOffsetX` / `cameraOffsetY` are not read by the delivery
  selection path at all any more. This is asserted **structurally** (the selection helper takes no
  camera argument), not by comparing two runs — see AC2(b).
- **No freezable term either.** ADR-0069's freeze acts on `state` and `timer`. The count reads
  neither, so the freeze cannot move the gauge in either direction. Consequence: `t_fail` is one
  number per level (`integrity / (N·D)`), identical for every camera trajectory — a _provable_
  property, which is why §4.2 no longer needs a per-case table.
- **No ambient contribution.** A wave enemy standing 1 unit from the van chips nothing (§4.3 shows
  an ambient term is now even more unbalanceable than in Rev.1: each alive ambient enemy would add
  `D·W` = 54 damage against Vitry's 60-point gauge, and the shuffle decides how many there are —
  measured 0 to 4 candidates occupied).

**The fairness invariant, restated honestly.** Rev.1 claimed "you only ever lose integrity to
something you could have shot **this tick**", enforced by sharing `resolvePlayerShot`'s eligibility
set. Rev.2 gives that up (the amendment box says why) and asserts the **per-beat** form, which is
what actually protects the player:

> Every point of integrity lost is attributable to an assailant the player has a shooting
> opportunity on **inside the same beat**: it is framed with the van (§4.1's one-frame guarantee), it
> is exposed at least 70 % of the time, its longest un-shootable stretch is **1.7 s**
> (`riot.hiddenDuration`, the worst archetype), and the beat opens with a **4.4-5.8 s** roll-in
> during which killing it costs the gauge nothing (D2). A 0-damage window is always attainable, by
> shooting.

The read this buys: **the van bleeds while the ambush lives.** A ducked cop has not stopped pinning
the van; he has stopped being shootable _for 1.7 s_. That is a clock the player can beat, and unlike
Rev.1's rule it cannot be turned off by looking away.

### D2 — The assault: seated at the van's arrival (this is what makes D1 mean anything)

**Ratified in Rev.1 and unchanged: D2.1 (where), D2.2 (free), D2.4 (state at seating), D2.5 (kind),
D2.7 (ordinary enemies in every other respect). D2.3 is REPLACED (K-3); D2.4 gains the lockstep
ruling (K-2); D2.6 gains the identity ruling (K-4); D2.8 is new (K-3).**

On the tick the vehicle enters **`INCOMING`** (i.e. at the scripted `triggerAtElapsedSeconds`, one
roll-in before the damage window opens), seat `DELIVERY_ASSAILANTS = 2` enemies:

1. **Where** — the level's **reserved assault slots** (D2.8): the `DELIVERY_ASSAILANTS` slots whose
   `screenPosition.x` is nearest `spec.stopPosition.x`, taken nearest-first, **within
   `ASSAULT_RADIUS = 7` world units**. Exact ties → lower `slotIndex` first. Measured, per shipped
   level: belliard `#23 @ 0.99` then `#42 @ 0.99`; stalingrad `#19 @ −5.06` then `#23 @ −5.09`;
   vitry `#107 @ 2.98` then `#102 @ 3.11`; niveau-final `#7 @ −2.76` then `#8 @ 3.33`.
2. **Free** — guaranteed by the reservation (D2.8), **and still checked**: a slot is seatable iff no
   entry of `state.enemies` occupies it in ANY state (`DEAD` included) and it is not the live loot
   crate's slot. The `DEAD` clause is load-bearing, not defensive: `EnemySprite` resolves its
   occupant with `enemies.find(e => e.slotIndex === slotIndex)` (first match), so seating an
   assailant on a slot that already holds a corpse renders **nothing** — an invisible source of
   damage. With D2.8 in place this check must never fire on a shipped level; AC12 asserts exactly
   that. (Shipped levels have no duplicate slot positions — verified, 54/48/152/16 slots, 0
   duplicate groups — so slot-index exclusion is sufficient.)
3. **[REPLACED — K-3] Always exactly `DELIVERY_ASSAILANTS`.** Rev.1's "seat as many as are
   available" re-imported the lottery §2 rejects: measured on the real `spawnWave`, **niveau-final
   loses a candidate in 6 of the first 10 waves and BOTH in 3 of them** (free candidates by wave, R
   = 7: `w1:2 w2:2 w3:1 w4:0 w5:2 w6:2 w7:1 w8:1 w9:0 w10:0`), i.e. a third of runs would arrive at
   the 18 s trigger with 1 or 0 assailants — the objective free again, decided by a shuffle, and in
   direct contradiction with the already-gated monotonic curve of
   `spec-boss-niveau-final-level.md` §1.6 (the finale would be _easier_ than Vitry). Widening `R` is
   **not** the fix and is not attempted: at R = 7.5 or 7.9 niveau-final still drops to 1 free
   candidate at `w9`/`w10`, and 7.9 is the hard ceiling of §4.1's one-frame guarantee. The
   reservation (D2.8) is the fix; with it the seating is unconditional, and the "fewer than 2
   candidates" branch becomes an unreachable authoring error (AC12 pins the geometry so a
   window-zone retouch fails CI instead of silently gutting the objective).
4. **State at seating: `VISIBLE`**, timer = `ARCHETYPES[kind].visibleDuration × (1 + i × 0.3)`.
   - The `VISIBLE` choice is Rev.1's, unchanged and re-ratified: an assailant the player never looks
     at freezes exposed (ADR-0069) and an assailant the player does look at is immediately shootable
     and will cycle into `SHOOTING` and fire back. Seating in `HIDDEN` would freeze the threat away;
     seating in `APPEARING` would leave half-unfolded sprites frozen in the windows (bad read).
     Under D1-Rev.2 the seating state no longer changes the _damage_, so this is now purely a
     read/threat decision — which is what it always should have been.
   - **[RULING — K-2] The timers are staggered, with `spawnWave`'s own factor `(1 + i · 0.3)`**
     (`enemySystem.ts:130`), applied to `visibleDuration` instead of `hiddenDuration` because that
     is the state we seat in. DRY with the house precedent, and same intent: two identical kinds
     seated in lockstep pop and duck in perfect synchrony, which reads as one scripted animation
     rather than two men, and leaves the player with **nothing to shoot** during the shared duck.
     Measured effect on the engaged player (ALIVE rule, D = 9, worst kind pair, gauge left at window
     end): belliard desktop 73 % staggered vs 56 % in lockstep, mobile 53 % vs 40 %; elsewhere it is
     a wash (±6 pts). It no longer affects the ignore case at all — that is the point of D1-Rev.2.
5. **Kind** — `pickKindFor(seed, pool)` where `pool` = the level's active window pool
   (`windowPoolFor(roster)`, default `WEIGHTED` when absent) **filtered to
   `ARCHETYPES[k].shoots === true`**. Only a shooter can be shooting at a van; and staying inside
   the level's own pool guarantees **no new asset path** (preload/manifest untouched). Deterministic
   seed of the same shape as `spawnWave`'s (`ASSAULT_SEED_BASE + slotIndex·7 + i·17`) — replayable.
   The kinds this draws are **not load-bearing**: §4.2/§4.4 validate all six seatable pairs, so the
   exact seed constant is the architect's/dev's call.
6. **Ids and identity — [RULING — K-4].** Ids come from a disjoint space,
   `DELIVERY_ASSAULT_ID_BASE = 900000 + i` (`spawnWave` mints `wave·100 + i`, so no collision is
   reachable: it would need 9 000 waves). **The discriminator I assume is the id range**: an entry
   of `state.enemies` is one of this delivery's assailants iff `id >= DELIVERY_ASSAULT_ID_BASE`.
   Rationale — (i) **zero new state**: no field on `Enemy`, no list to keep in sync with the array,
   nothing extra to serialise, and no way for the discriminator to drift out of step with the
   entities it describes (a parallel id list can; a range cannot); (ii) the range is already the
   thing that makes ids collision-free, so it carries no new invariant; (iii) `Enemy` is consumed by
   `src/render` (`EnemySprite`) — adding a field there widens the game→render contract for a fact
   the renderer must not care about (an assailant renders exactly like any window cop, D2.7);
   (iv) exactly one delivery is live at a time (`deliveries[0]`, ADR-0002) and D3 retires the
   assault with the set-piece, so "THIS delivery's" needs no per-delivery tag. Cost, disclosed: an
   id range is a _convention_, enforced by tests rather than by the type system, and a future
   multi-delivery level would need a second range or a real tag. **`senior-architect` may overrule
   this for a typed field if he judges the convention too weak** — it is a one-line change to the
   predicate and does not move any value in §4; but the decision is now stated, not left to the TDD
   lane to guess.
7. Seated assailants are **ordinary window enemies** in every other respect: they are shot, scored,
   counted toward `enemiesToWin`, and **they shoot the player** — aimed, per ADR-0065, a `riot`
   round costing a full heart — through the existing paths. No new entity type, no new render
   surface. (See A2 in §9: this is why the objective also costs lives, and why §6 now captures them.)
8. **[NEW — K-3] Reserved assault slots.** A level that authors a delivery reserves its
   `DELIVERY_ASSAILANTS` assault slots (the two of D2.1, computed from the facade + `stopPosition.x`
   — pure geometry, no authored data) **for the whole level**: they are excluded from
   - `spawnWave` (which already takes `excludeSlots` — the ADR-0055 D5 crate precedent), and
   - the loot-crate spawn (`lootSystem`'s eligibility predicate, which today only excludes slots
     held by a **non-`DEAD`** enemy, so a crate could sit on a reserved slot before the delivery
     arms; `CRATE_DELIVERY_GAP_X = 2.0` only guards the `INCOMING | DELIVERING` phases).

   Measured on the real `spawnWave`, waves 1-30, all four levels: **without** the exclusion, wave
   enemies land on a reserved slot 21 / 16 / 11 / 48 times; **with** it, **0**. That is the
   deterministic guarantee K-3 asks for.

   Costs, disclosed and accepted:
   - **Two windows near the drop point never hold a wave cop.** 2/54, 2/48, 2/152 — invisible; but
     2/16 on niveau-final (12.5 %) is noticeable. I rule this a **feature, not a cost**: those two
     windows are the ambush windows, conspicuously empty until the van rolls in, then occupied. It
     is a free, diegetic telegraph and it supports the `ux-designer` work (K-5).
   - **`spawnWave`'s output changes for delivery levels.** Byte-identical for the tutorial and the
     boss harness (no delivery ⇒ empty `excludeSlots` ⇒ the legacy path). Pinned stateMachine tests
     on belliard/stalingrad/vitry/niveau-final wave contents will move; that is a test update, not a
     behaviour regression, and `spawnWave`'s own unit tests (called directly) are untouched.
   - **Cohort cap.** `spawnWave` takes `min(1 + wave, slots.length)` **after** filtering, so on
     niveau-final (16 slots) a wave ≥ 14 seats 14 instead of 15-16. Measured; unreachable in a 3-5
     min level (the finale's boss fires long before), and it degrades gracefully (no throw, no empty
     wave — AC16).

**Why `INCOMING` and not `DELIVERING`:** the roll-in (measured **4.36 s** belliard, **5.75 s**
stalingrad, **5.75 s** vitry, **5.50 s** niveau-final — Rev.1 said 4.37/5.77, corrected here from
`(halfWidth + VEHICLE_MARGIN ± stopX) / VEHICLE_SPEED` on the real layouts) becomes a real telegraph
— cops take position in the windows above the van _before_ the gauge can drop. A player who is
present can clear the assault **pre-emptively** and buy a damage-free window. That is the skill
expression this objective was missing, and it costs nothing: damage is phase-gated to `DELIVERING`
(§D1), so an early seating can never chip.

### D3 — The assault retires with the set-piece — RATIFIED, unchanged (+ A4 disclosure)

On the `DELIVERING → SUCCESS | FAILED` transition, every surviving assault enemy becomes `DEAD`
with **no score, no kill credit, no quota credit** — the escort leaves when the van leaves.
Rationale: the set-piece owns its actors; without this, 2 permanently-frozen enemies would sit in
the wave array and block `allDead` (ADR-0069's wave-rollover cost) for the rest of the level, in a
zone the player may never revisit.

**Disclosure (A4):** while the assailants live, `allDead` is false, so the **wave rollover pauses**
for the duration of the set-piece (roll-in + window ≤ 13.4 s worst case, belliard). Accepted and
intended: the delivery is a set-piece beat, and freezing the ambient escalation while it runs makes
it read as one. D3's retirement guarantees the pause ends with the beat.

### D4 — What does NOT change

- `tickDelivery`'s shape: still `(vehicle, spec, elapsed, count, field, delta)`, still pure, still
  camera-agnostic. The **selection** of who chips is the stateMachine's job (it owns the facade); the
  **arithmetic** stays in `deliverySystem`. Only the parameter's name and the constant's name/value
  change (`shootingCount` → `assailantCount`, `DAMAGE_PER_SHOOTER_PER_SECOND` →
  `DAMAGE_PER_ASSAILANT_PER_SECOND`, 8 → 9).
- The phase machine `IDLE → INCOMING → DELIVERING → SUCCESS|FAILED → GONE`, the one-shot bonus,
  `FAILED` costing no life and no points, and the per-level `integrity` / `windowSeconds` / `bonus`
  authored in `levels.ts` — **all unchanged**.
- **ADR-0069 is untouched and needs no exception.** This is _stronger_ in Rev.2 than in Rev.1: the
  damage rule no longer reads any state the freeze can touch, so there is no interaction left to
  reason about, in either direction. A frozen assailant is a threat to the _vehicle_ (a gauge in the
  HUD) and never to the _player_ (it cannot enter `SHOOTING` off-screen, so it cannot spawn a
  bullet). Bertrand's rule — "an enemy off screen cannot shoot" — holds literally.
- No new field on `DeliverySpec`, `LevelConfig`, **or `Enemy`** (K-4 / AC15).

### D5 — Companion reads owed by other lanes

- `ux-designer` — **BLOCKING for stage-5 design acceptance and for the merge, per Karim's K-5**
  (not for the dev lane: `src/game` only, the two run in parallel on non-overlapping paths).
  Telegraph the objective at `INCOMING`, not only at `DELIVERING` (`DeliveryIntegrityBanner` renders
  solely on `phase === "DELIVERING"` today), plus an off-screen direction cue toward the van while
  `INCOMING | DELIVERING`. Fairness arithmetic, updated to Rev.2's values: edge-scroll tops out at
  **8 u/s** over up to ~31 u of street (3.1-3.9 s of travel) against a `t_fail` of **3.33 s** on
  Vitry and Niveau Final; without a pre-window warning the objective is lost for reasons the player
  could not perceive, on the two hardest levels. Commissioned separately (K-5), not re-specified here.
  **Pre-declared design-lane fallback if UX slips:** `DAMAGE_PER_ASSAILANT_PER_SECOND` 9 → **8**
  (measured: `t_fail` 6.25 / 5.00 / 3.75 / 3.75 s, ignore-case margin still 22-38 %, i.e. still above
  Karim's 20 % floor, and +25 % more reaction time on the two 6 s windows). One variable, stated in
  advance, nothing stalls.
- `lead-art` — **[REFRAMED — K-6]** read requirement only; style is lead-art's call. Rev.1 asked for
  "firing **down at the vehicle**, not at him", which is mechanically **false** and would manufacture
  a dangerous false affordance: by D2.7 these are ordinary window shooters and since ADR-0065 their
  rounds are **aimed at the player** (a `riot` round costs a full heart of 3). The read is a **double
  read, not an exclusive one**:
  1. they must read as **pinning the van** — that is why the gauge is dropping, and the player must
     connect the two without being told;
  2. they must **stay legible as live, dangerous shooters who will fire at the player** the moment he
     frames them — nothing that reads as "busy elsewhere", "occupied", or "not a threat to me".
     Also route A3 as a note: ADR-0069's accepted muzzle-flash cosmetic (an enemy frozen
     mid-`SHOOTING` holds its flash) will now happen **next to the van, in the player's focus**.
     Known-cosmetic, not a blocker.
- `narrative-designer`: one line of fiction on who ambushes the delivery (same faction as the window
  roster? a tip-off?). Fiction, not mechanic.

---

## 4. Tuning table

### 4.1 New / changed values

| Constant                          | Value       | Where                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | ----------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DAMAGE_PER_ASSAILANT_PER_SECOND` | **9**       | `deliverySystem.ts`         | Was 8. **The single tuned number** (one variable at a time). Lower bound: the ignore case must fail with ≥ 20 % of the window to spare on every level ⇒ `D ≥ I / (1.6·N·W)` ⇒ `D ≥ 7.81` (belliard binds). Upper bound: the slow-mobile reference player must still win ⇒ `D ≤ 9` (measured: at 10 he loses Vitry and Niveau Final against `riot+riot`). 9 is the top of the feasible band, i.e. maximum pressure on the exploit the panel found, with the player still winning. §4.2, §4.4. Fallback 8 pre-declared in D5. |
| `DELIVERY_ASSAILANTS` (N)         | **2**       | `deliverySystem.ts`         | 1 makes ignoring survivable on the 60/6 levels (`t_fail` 6.67 s > 6 s window at D = 9 — literally free). 3 exceeds niveau-final's candidate supply (2 slots within R) and turns the window into a spray. 2 is the smallest count that is decisive everywhere. Constant, NOT a per-level field (YAGNI — `integrity`/`windowSeconds` already give per-level control).                                                                                                                                                         |
| `ASSAULT_RADIUS` (R)              | **7**       | `deliverySystem.ts`         | Half a viewport is 9 (`VIEW_W = 18`); an enemy plane is ≈ 2.1 wide (ADR-0069). 7 guarantees **the van and every assailant fit in one frame, uncropped**, with ≈ 0.95 u of margin, when the camera is centred on the stop position. Hard ceiling 7.9 — not approached (K-3 is solved by the reservation, not by widening R). Verified ≥ N candidates on all four shipped levels (10 / 7 / 28 / 2).                                                                                                                           |
| `DELIVERY_ASSAULT_ID_BASE`        | 900000      | `deliverySystem.ts`         | Disjoint from `spawnWave`'s `wave·100 + i` (would need 9 000 waves to collide). Also the identity discriminator — D2.6.                                                                                                                                                                                                                                                                                                                                                                                                     |
| seating timer factor              | `1 + i·0.3` | `stateMachine.ts` (seating) | `spawnWave`'s own stagger factor (`enemySystem.ts:130`), DRY. Read + shooting-rhythm decision only — D2.4.                                                                                                                                                                                                                                                                                                                                                                                                                  |

### 4.2 Per-level consequences (authored data unchanged) — RETABLED FOR K-2

Under D1-Rev.2 the damage rule reads neither the camera nor the pop-up state, so there is **one**
`t_fail` per level rather than a frozen/on-screen pair:

```
t_fail = integrity / (N × D) = integrity / 18          budget = integrity / D assailant-seconds
```

| Level        | integrity | window | bonus | roll-in | `t_fail`   | % of window | **margin** | budget (assailant-s) |
| ------------ | --------- | ------ | ----- | ------- | ---------- | ----------- | ---------- | -------------------- |
| belliard     | 100       | 8 s    | 500   | 4.36 s  | **5.56 s** | 69 %        | **31 %**   | 11.11                |
| stalingrad   | 80        | 7 s    | 400   | 5.75 s  | **4.44 s** | 63 %        | **37 %**   | 8.89                 |
| vitry        | 60        | 6 s    | 300   | 5.75 s  | **3.33 s** | 56 %        | **44 %**   | 6.67                 |
| niveau-final | 60        | 6 s    | 300   | 5.50 s  | **3.33 s** | 56 %        | **44 %**   | 6.67                 |

**K-2's required statement of margin, and what it covers.** Karim's floor is ≥ 20 % of the window on
all four levels × every seatable kind pair × both camera cases. Rev.2 clears it at **31-44 %**, and
covers strictly more than was asked:

- **every seatable kind pair** — all 6 (`normal|riot|biker` × 2, unordered): the count doesn't read
  `kind`, so the six pairs are the same number. (Rev.1's table was the one that varied, because
  Rev.1 counted exposure.)
- **both camera cases** — and every camera case in between: verified by exhaustive sweep rather than
  by argument. Camera held on the van, camera held away, and **every** pan-start time (1/60 s
  granularity) in either direction at the real 8 u/s edge-scroll: **0 of 8 904 trajectories survive
  the ignore case on belliard**, 0 of 9 180 on stalingrad, 0 of 8 460 on vitry, 0 of 8 280 on
  niveau-final. Worst observed `t_fail` = 5.56 / 4.45 / 3.35 / 3.35 s, i.e. the margin above is a
  _worst case_, not an average.
- **what Rev.1 got wrong, for the record (K-2).** Rev.1's table (`5.0 / 4.0 / 3.0 / 3.0 s`) was
  computed at 100 % exposure and was therefore only true for the player who is _not_ looking. The
  real per-archetype duty cycles are, re-derived from `ARCHETYPES` + `enemySystem`
  (`APPEARING_DURATION 0.3`, `SHOOTING_DURATION 0.5`) and confirming Karim's figures to the digit:
  **normal 4.0/5.5 = 72.7 %**, **riot 4.4/6.1 = 72.1 %**, **biker 2.8/4.0 = 70 %**. Under Rev.1's
  `targetable` rule the honest on-screen `t_fail` was ≈ 7.4-7.9 s on belliard and `riot+riot`
  **survived the window outright** (96.3 damage vs a 100 gauge) — exactly the coin-flip Karim's
  discrete walk found. That table is not repaired in Rev.2; it is **superseded**, because the rule it
  measured is superseded.

### 4.3 Feasibility algebra (why the ambient term is out) — RECOMPUTED FOR K-2

With `A` = alive-assailant-seconds a player spends before clearing the assault, and `h` = the gauge
fraction he should have left, the window is designable iff

```
I / (1.6·N·W)  ≤  D  ≤  (1 − h)·I / A        ⇔        A  ≤  1.6·N·W·(1 − h)
```

- N = 2 ⇒ `A ≤ 3.2·W·(1 − h)`. Vitry (W = 6, h = 0): `A ≤ 19.2`. Measured worst reference-player
  cost on Vitry: `A = 6.13` (slow mobile, `riot+riot`) ✓ — comfortable, with the binding constraint
  being the _upper_ bound on `D` (the mobile player), not the algebra.
- Vitry **with** an ambient term: each _alive_ wave enemy inside R would add `D·W = 54` damage
  against a **60**-point gauge, and the shuffle decides how many there are — measured 0 to 4 of
  Vitry's 28 candidate slots occupied by the live cohort (0-3 belliard, 0-2 stalingrad, 0-2
  niveau-final). One unlucky rollover ⇒ the objective is unwinnable; a lucky one ⇒ unchanged.
  **Structurally unbalanceable — and worse under D1-Rev.2 than under Rev.1**, because an ambient
  enemy no longer has to be exposed to count. Hence D1's "and by nothing else".

### 4.4 Reference-player costs (measured, ALIVE rule, D = 9, staggered seating)

Discrete 60 Hz simulation of the real `tickEnemy`/`hitEnemy` state machines: the player arrives at
the window opening after `reaction`, fires at `rate` shots/s at the lowest-indexed **targetable**
assailant (a ducked one cannot be shot), and pays `switch` seconds of re-aim when his target dies or
ducks. Cell = gauge left at window end, worst of the 6 kind pairs.

| Reference player                                        | belliard        | stalingrad      | vitry           | niveau-final    | verdict                           |
| ------------------------------------------------------- | --------------- | --------------- | --------------- | --------------- | --------------------------------- |
| Pre-empts during `INCOMING`                             | 100 %           | 100 %           | 100 %           | 100 %           | SUCCESS, gauge untouched          |
| Desktop — 3.0 shots/s, 0.2 s reaction, 0.15 s switch    | 73 %            | 70 %            | 60 %            | 55 %            | SUCCESS, comfortable              |
| Desktop — 2.0 shots/s, 0.4 s, 0.3 s                     | 63 %            | 46 %            | 29 %            | 30 %            | SUCCESS                           |
| **Mobile** (ADR-0015) — 1.5 taps/s, 0.5 s, 0.6 s        | 53 %            | 46 %            | 28 %            | 24 %            | SUCCESS — the tuning target       |
| **Slow mobile (stress row)** — 1.2 taps/s, 0.8 s, 0.8 s | 23 %            | 31 %            | **8 %**         | **8 %**         | SUCCESS — thin, by design         |
| Late arrival — 2.0 s reaction, 1.5 taps/s               | 23 %            | 4 %             | **FAILED**      | **FAILED**      | intended: the objective has teeth |
| **Ignores the window** (any camera)                     | FAILED @ 5.56 s | FAILED @ 4.44 s | FAILED @ 3.33 s | FAILED @ 3.33 s | **0 score, the blocker closed**   |

The stress row is what sets `D ≤ 9`: at D = 10 it FAILS Vitry and Niveau Final on `riot+riot`, at
D = 9 it survives at 8 %. If stage-5 verify (§6) shows the stress row is the _representative_ mobile
player rather than the tail, the pre-declared fallback is `D = 9 → 8` (ignore-case margin 22-38 %,
stress row 18 %).

---

## 5. Acceptance criteria (`dev-gameplay`, TDD)

Damage / selection

- **AC1** `tickDelivery` in `DELIVERING` with `assailantCount = 2`, `delta = 1`, integrity 100 →
  integrity **82**. (`DAMAGE_PER_ASSAILANT_PER_SECOND === 9`.)
- **AC2 — [REPLACED, K-1] the panel's blocker, pinned as three properties that are true.**
  Rev.1's AC2 ("identical integrity series at `cameraOffsetX` 0 vs 25") is **deleted**: it was
  falsifiable under a `targetable` rule and would have handed the TDD lane a test that is red for a
  correct implementation. In its place:
  - **(a) No free camera position.** The ignore case (player never fires) ends the window
    `FAILED` with `scoreDelta === 0` for **every** camera x in `{0, ±9, ±18, 25}` — a set spanning
    on-van and far-off-van — on all four shipped levels.
  - **(b) Structural, asserted by construction.** The delivery damage count is a pure function of
    the enemy array: the selection helper **takes no camera argument** (verifiable by reading its
    signature), and no `isOnScreen` / `cameraOffsetX` / `cameraOffsetY` is read anywhere in the
    delivery selection path. Assert the signature, not a comparison of series.
  - **(c) Orientation, not equality.** `damage(camera on the van) ≤ damage(camera anywhere else)`,
    for the same inputs. Engaging must never punish the van — this is the exact reversal of the
    inversion §1.2 measured.
  - **(d) [bonus, available only because of the D1 amendment]** For the ignore case specifically
    (player never fires), the integrity series is **identical** for `cameraOffsetX` 0 and 25,
    tick for tick. This is Karim's original intuition, now true — the count reads no freezable
    state. Optional but cheap, and it is the sharpest possible statement of (b).
  - This AC **replaces the whole `describe("frozen mid-SHOOTING")` block**
    (`stateMachine.test.ts:1441-1499`): its two cases — _"chips no delivery integrity while off
    screen"_ (line 1492) and _"still chips it once the camera pans onto it"_ (line 1496) — pin
    respectively the free objective and the inverted incentive as expected behaviour. Both must go;
    what survives from that block is its `frozen mid-SHOOTING` intent, now covered by AC14.
- **AC3 — [VALUE FIXED, K-2]** Ignore case, **belliard**, configuration stated: both assailants
  seated and alive at the window opening, player never fires, camera held at a **fixed** x (assert
  for at least `x = 0` "on the van" and `x = 25` "far away") → `FAILED` at **t = 5.56 s ± one tick**
  after the window opens (`= integrity / (N·D) = 100/18`), `scoreDelta === 0`, no life lost, and the
  vehicle then departs to `GONE`. Sister values, same configuration: stalingrad **4.44 s**, vitry
  **3.33 s**, niveau-final **3.33 s**.
- **AC4** Engaged case, belliard: both assailants killed at t = 2.0 s and t = 4.0 s → 6.0
  alive-assailant-seconds → integrity **46** at window end, `SUCCESS`, `scoreDelta === 500` exactly
  once.
- **AC5 — [DISCRIMINATOR NAMED, K-4]** Walk all six `EnemyState`s through the count for an entry
  with `id >= DELIVERY_ASSAULT_ID_BASE`: `DEAD` contributes **0**; `HIDDEN`, `APPEARING`, `VISIBLE`,
  `SHOOTING`, `HIT` each contribute **9/s**. (Rev.1's AC5 asserted the opposite for `HIDDEN` — it
  belonged to the superseded rule.)
- **AC6 — [DISCRIMINATOR NAMED, K-4]** A wave enemy (`id < DELIVERY_ASSAULT_ID_BASE`, i.e. minted by
  `spawnWave`), in any state, seated 1 unit from `stopPosition.x` and alive, contributes **0**
  damage.

Seating

- **AC7** On the `IDLE → INCOMING` tick, exactly `DELIVERY_ASSAILANTS = 2` enemies are appended, ids
  900000/900001, state `VISIBLE`, timers `visibleDuration × 1.0` and `visibleDuration × 1.3`, on the
  level's two reserved slots, nearest-first with lower-`slotIndex` tie-break (belliard: `#23` then
  `#42`; stalingrad `#19`/`#23`; vitry `#107`/`#102`; niveau-final `#7`/`#8`).
- **AC8** The occupancy check is present and correct: a slot occupied by an existing entry of
  `state.enemies` — **including a `DEAD` one** — or by the live loot crate is not seated on. (Unit-
  testable by injecting an occupant; with D2.8 it must never fire on a shipped level — AC12.)
- **AC9** Only shooting kinds are seated (`ARCHETYPES[kind].shoots === true`) and only from the
  level's own pool; two identical runs produce identical kinds, slots and ids (determinism).
- **AC10** Damage is 0 during `INCOMING` even with both assailants alive (phase gate), and killing
  them during `INCOMING` scores/credits normally and leaves the window damage-free.

Boundaries / regressions

- **AC11** On the `DELIVERING → SUCCESS|FAILED` tick, surviving assault enemies become `DEAD` with
  `scoreDelta`/`kills`/`livesDelta` unchanged by the retirement, and `allDead` becomes reachable
  again (A4).
- **AC12 — [SEATED COUNT UNDER OCCUPANCY, K-3]** Three assertions, in this order:
  1. **Geometry (the authoring guard):** for every shipped level authoring a delivery, the count of
     slots within `ASSAULT_RADIUS` of `stopPosition.x` is **≥ `DELIVERY_ASSAILANTS`** (measured
     today: 10 / 7 / 28 / **2**). Niveau-final is at the floor — this is the test that makes a
     window-zone retouch fail CI instead of silently gutting the objective.
  2. **Reservation holds:** for every shipped level authoring a delivery and for waves 1..20,
     `spawnWave(wave, facade, pool, reservedSlots)` seats **0** enemies on a reserved slot (measured
     today: 21 / 16 / 11 / 48 collisions **without** the exclusion, 0 **with**), and the loot-crate
     spawn never selects a reserved slot.
  3. **Really seated, under occupancy:** driving a full level to the `INCOMING` trigger seats
     **exactly `DELIVERY_ASSAILANTS` = 2** assailants — asserted on **niveau-final at a wave where
     the unreserved run would have collided** (`w4` and `w9` both lose _both_ candidates without the
     reservation), and with a corpse, a wave enemy and a loot crate present elsewhere on the facade.
     This is the count that matters; the geometric candidate count of (1) is not sufficient
     evidence.
- **AC13** A level with `deliveries: []` (the tutorial, the boss harness) is byte-for-byte
  unchanged: no reservation, empty `excludeSlots`, no assault, no new enemy, no extra tick cost.
- **AC14** ADR-0069 invariants still hold with the assault live: an off-screen assault enemy stays
  in `VISIBLE` (frozen, timer unchanged) and **spawns no bullet** (`state.bullets` length unchanged
  across the whole ignore-case window), while still bleeding the gauge.
- **AC15 — [MADE EXPLICIT, K-4]** `src/game` purity untouched (no React/Three import),
  `tickDelivery` still takes a plain `number`, and **no new field is added to `DeliverySpec`,
  `LevelConfig`, or `Enemy`** — the assault's identity is the id range (D2.6), so the
  game→render `Enemy` contract is byte-identical and `EnemySprite` needs no change.
- **AC16 — [NEW, disclosed edge]** With 2 slots reserved, `spawnWave` never throws and never returns
  an empty wave: it returns `min(1 + wave, slots.length − DELIVERY_ASSAILANTS)` enemies (niveau-final
  caps at 14 from wave 14 — unreachable in a shipped run, asserted so it stays graceful).

## 6. Design acceptance (stage 5, mine)

Once implemented I playtest with the `verify` skill and report PASS/deviations to
`lead-game-designer` before the architect's integration review.

1. Belliard, ignore the van entirely → `LIVRAISON PERDUE` at ~5.6 s, no bonus (screenshot of the
   gauge crossing 50 % at ~2.8 s). Repeat with the camera parked **on** the van and **far from** it:
   the two runs must fail at the same time (AC2 a/d, the blocker).
2. Belliard, arrive at the window and clear both assailants → `LIVRAISON SÉCURISÉE`, gauge visibly
   dented (expected 50-75 % left), +500.
3. Belliard, pre-empt during `INCOMING` → gauge untouched at 100 %.
4. The two assailants are **in the same frame as the van** when the camera is centred on it
   (§4.1's one-frame guarantee, screenshot), and their two windows read as **empty before the
   van arrives** (D2.8's diegetic telegraph — screenshot both states).
5. **Niveau-final, at a late wave**: exactly 2 assailants seated, with corpses on the facade
   (AC12.3 in the real build, not just in a unit test).
6. Mobile emulation (ADR-0015 scheme), runs 1-3: the mobile reference row must still win. If it does
   not, the tuned value that moves is `DAMAGE_PER_ASSAILANT_PER_SECOND` (9 → 8), nothing else.
7. **[A2] Capture lives lost during the window**, desktop and mobile, in every run above. §4 prices
   integrity only; by D2.7 the two assailants also shoot **at the player** (aimed, ADR-0065; a
   `riot` round costs 1 of 3 hearts). If the objective routinely costs a heart on mobile, that is a
   Rev.3 tuning item (candidate levers, in order: seat at most one `riot`; or `D` down and `N` up —
   **not** a freeze exception).

## 7. Rejected alternatives

| Option                                                                                                     | Why rejected                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a) ADR-0069's own suggestion**: proximity filter on the ambient wave                                    | Measured **no-op** (0 damage in 7/7 runs) and it re-opens the frozen-shooter-chips-forever hole. §2.                                                                                                                                                                                                                                                                                                                                                                          |
| **[NEW] Rev.1's `targetable` predicate** (`APPEARING\|VISIBLE\|SHOOTING`, shared with `resolvePlayerShot`) | Elegant and DRY, but **camera-gameable in outcome**: freezing both assailants while `HIDDEN` suspends the damage. Exhaustive pan-start sweep at the real 8 u/s edge-scroll, D = 12, staggered: **254-382 of 1 484 pan timings survive the window with the full bonus and zero shots on belliard** (17-26 %), 6-144 of ~1 400 on the other three, minimum damage **0.0** in most pairs. No `D` closes a hole whose floor is 0. Superseded by D1-Rev.2 — see the amendment box. |
| **[NEW] `max(1, targetableCount)`** (keep the predicate, floor the drain at one assailant)                 | Seals every trajectory **only** at `D ≥ 13` (the bound is `D·W ≥ integrity`: belliard 13×8 = 104 ≥ 100 — verified, 0/1 484 survivors). But at D = 13 the slow-mobile reference row **FAILS** Vitry and Niveau Final, and at D = 12 belliard is still exploitable (minimum damage 96.2 vs a 100 gauge). The band is empty. Also two rate concepts in one rule (0 exposed → 13/s, 1 exposed → 13/s) is a worse read than "alive". Kept as Karim's overrule option.              |
| **Revert to the pre-ADR-0069 global count**                                                                | Keeps the inverted incentive (engaging the fight elsewhere hurts the van) and lets a frozen shooter chip forever. §1.2.                                                                                                                                                                                                                                                                                                                                                       |
| **[NEW] Widen `ASSAULT_RADIUS` to buy candidate supply on niveau-final** (K-3 alternative)                 | Doesn't work and breaks §4.1: R = 7.5 or 7.9 lifts niveau-final from 2 to 4 candidates, but the live cohort still leaves only **1** free at `w9`/`w10` — no guarantee, just a longer lottery. 7.9 is also the hard ceiling of the one-frame guarantee. The reservation (D2.8) is deterministic and costs no framing.                                                                                                                                                          |
| **[NEW] Relocate the ambient occupant instead of reserving** (K-3 alternative)                             | A live wave enemy would have to teleport out of a reserved window mid-level — visible when it is `VISIBLE`, and it perturbs kill/quota bookkeeping for a case the reservation prevents outright. Pruning only the **corpses** would fix the corpse case but not the live-enemy case (measured: both occur).                                                                                                                                                                   |
| **Accept the safe spot, rework the scoring** (bonus scaled by framing time, or by remaining integrity)     | Rewards holding a camera still rather than shooting — a new attention-metric mechanic Prohibition never had, for less stake. And a bonus scaled on a gauge nothing can dent is still free.                                                                                                                                                                                                                                                                                    |
| **Exempt the delivery neighbourhood from the freeze**                                                      | Would work, but needs a muzzle guard on the bullet spawn and breaks ADR-0069's "no transition off-screen ⇒ no guard needed" invariant — more code, weaker rule. D1-Rev.2 gets a stronger guarantee for free by not reading state at all.                                                                                                                                                                                                                                      |
| **Pin the assault `VISIBLE` for the whole beat** (no duck ⇒ `targetable == alive`)                         | Would preserve the shared predicate, but the assailants would never reach `SHOOTING`, so they would never fire at the player (D2.7 and K-6's threat read both die), and two sprites frozen in a pose for 12 s reads as broken. Also needs a special case inside `tickEnemy` — the assault stops being an ordinary enemy.                                                                                                                                                      |
| **Per-level `assailantCount` in `DeliverySpec`**                                                           | YAGNI: the tuning table needs 2 everywhere, and `integrity`/`windowSeconds` already give per-level control.                                                                                                                                                                                                                                                                                                                                                                   |
| **Bias `spawnWave` toward the van during a delivery**                                                      | No guarantee (a rollover may never occur inside the window) and it perturbs the heavily-pinned `spawnWave` determinism far more than D2.8's `excludeSlots` (an argument `spawnWave` already accepts).                                                                                                                                                                                                                                                                         |
| **Set `bonus: 0` until a proper objective ships**                                                          | Honest but it retires a core-loop pillar and ships a "LIVRAISON SÉCURISÉE" that pays nothing. Only fallback if `pm` refuses §8's scope — explicitly **not** recommended. (`pm` has since ruled: in this story.)                                                                                                                                                                                                                                                               |

## 8. Cahier des charges test, and the scope call — REFRAMED (A5)

**Did Prohibition (Atari ST, 1987) have it?** The _delivery_ objective: **no** — the `Livrer` pillar
is muf's own documented extension of the shooting gallery. The _assault_: **yes, in grammar** —
pop-up shooters at windows that you must hit before they hit what you protect is Prohibition's
entire vocabulary. This spec adds **no new mechanic**: it changes _which slots_ a threat occupies and
_when_, and one damage constant. No new entity type, no new state, no new authored field, no new
asset.

**[REFRAMED per A5] This is the repair of a mandated pillar, not a feature addition.**
`Récupérer → Livrer → Éviter` is the _"boucle de gameplay core (intouchable)"_ of
`PROJECT_GUIDELINES` §1. An objective on that pillar that is provably free — and measurably
**inverted** (§1.2) — is a **regression against the guidelines**, not a missing nice-to-have. Rev.1's
§8 was too modest in framing it as scope; Karim's gate and `pm`'s scope call both landed on the same
conclusion:

- **`pm` (John) has RULED: D1-D4 stays in this story** (logged in
  `docs/handoffs/story-offscreen-enemies-frozen.md` §"Scope call"). There is no honest minimal
  version — §2 _measures_ that the "neutral" alternative is a no-op — and the surface is
  `src/game/**` only, one lane, no render/art/audio/dependency/boundary change, no `levels.ts` data
  change.
- **`pm` ruled D5 non-blocking**; **Karim's K-5 overrules that for the `ux-designer` telegraph
  specifically**, making it blocking for stage-5 design acceptance and for the merge (not for the
  dev lane). Both are recorded; D5 carries the pre-declared `D` fallback so the dev lane never
  stalls on it.

## 9. Advisories from the gate — my rulings

| Advisory                                                                                                                                                                     | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A1** — assault kills are quota-eligible (`countsAsTarget`), so clearing the assault can cross `enemiesToWin` and end the level mid-window, voiding the bonus being earned. | **ACCEPT + disclose**, explicitly. Excluding them would make two identical-looking cops score differently from their neighbours — an invisible rule the player cannot learn, and it would need a `countsAsTarget` override keyed on the id range (more surface than the defect). The cost is bounded: it needs the player to be within 2 kills of the quota _and_ to clear the assault _inside_ the window, and the outcome (LEVEL_COMPLETE) is the better one. On the finale it cannot happen at all — a boss level's quota never completes the level (`stateMachine.ts:291`). Disclosed here; **not** an AC. |
| **A2** — the objective also costs **lives** (each on-screen assailant fires once per cycle, aimed; `riot` = 1 heart of 3), which §4 does not price.                          | **ADOPTED into §6.7** as a stage-5 capture on both device classes, with the Rev.3 levers named in advance. Not a Rev.2 tuning change: I will not price a cost I have not measured in the real build.                                                                                                                                                                                                                                                                                                                                                                                                           |
| **A3** — ADR-0069's accepted muzzle-flash cosmetic (frozen mid-`SHOOTING` = held flash) will now occur next to the van, in focus.                                            | **Routed to `lead-art` / `dev-r3f-render`** as a note inside D5's reframed read requirement. Known-cosmetic, not a blocker, no gameplay effect (a frozen enemy spawns no bullet — AC14).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **A4** — while assailants live, `allDead` is false ⇒ the wave rollover pauses for the set-piece.                                                                             | **DISCLOSED in D3**, and re-read as intended: freezing the ambient escalation while a set-piece runs makes it read as a set-piece. Bounded by D3's retirement (≤ 13.4 s worst case, belliard).                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **A5** — §8 should be re-framed as the repair of a mandated pillar.                                                                                                          | **ADOPTED**, §8 rewritten.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**Hand-offs:** `lead-game-designer` (round-2 re-check, including the explicit re-ratification of the
D1 amendment), `ux-designer` (K-5 telegraph, commissioned separately), `lead-art` (K-6-reframed
double read + A3 note), `narrative-designer` (D5 fiction), `senior-architect` (plan; K-4's
discriminator is stated but overrulable, K-3's `excludeSlots` seam touches `spawnWave` + `lootSystem`
call sites, and the ADR call), `tech-writer` (ADR-0069 §Négatif's van bullet is resolved by this
spec — the ADR's rule itself stands unamended). All logged in
`docs/handoffs/story-offscreen-enemies-frozen.md`.
