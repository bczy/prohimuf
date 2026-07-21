# Spec — Boss QTE lever 6: "Cran de sûreté" (shield-break tempo shot)

**Feature:** a **6th differentiation lever** on "le Commandant" — a THIRD, per-window read added to
the phase-2+ NORMAL `EXPOSED` window: a **separate riot-shield COVER PROP** the Commandant hunkers
behind, presenting a **fixed** (non-wandering) hit point on its **lowered/vulnerable** edge during
each `EXPOSED` window. Shooting it chips modest HP AND **compresses the next `SHIELDED` lull**. It turns
each window from a pure damage-read into a **strategic choice of pace** (vital / limb / shield).
**Rev. 2 (2026-07-21) — lead-art canon ruling applied (Bertrand-decided):** the shootable shield is a
**standalone cover prop**, NOT armour baked onto the boss body. The Commandant's canon silhouette is
**bare-headed, no shield/helmet/armour** — that is his entire read-differentiation from the CRS
`enemy_riot` roster, so nothing shootable may be modelled ON him. The mechanic below is **unchanged**;
only the _target_ moved from "his lowered shield-arm/plate" to "a persistent cover prop he crouches
behind". See §0 and §6-A for the retarget; §7 for the decoupled-ship + art hand-off.
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-21
**Status:** DRAFT (Rev. 2) — **needs `lead-game-designer` (Karim) design-gate PASS** before it reaches
`senior-architect` (TECH PLAN) and any dev implements it. This spec is the AC1 deliverable of
`_bmad-output/planning-artifacts/story-boss-shield-tempo-shot.md`: it explicitly defines the shield
point's **placement/size, damage, lull-compression amount, and live phases/states** (story AC1),
holds the lull compression to the asserted floors (AC2), keeps the ignore-it-byte-identical law
(AC3), and makes the **interaction with the 5 existing levers explicit** (the one open call the story
delegated to me).
**Design source (DECIDED, not re-opened here):** the story above (single lever, no new verb, phase-2+
`EXPOSED` only, no retune of frozen constants), the contracts it EXTENDS in place —
`docs/adr/0051-boss-qte-encounter-system.md` (the boss shell + determinism law + anti-bullshit
floors), `docs/adr/0052-boss-qte-differentiation-levers.md` (the 5 levers this sits alongside),
`docs/adr/0053-niveau-final-live-boss-level.md` (the shipped, live, canon duel this refines), and the
sibling spec whose shape this mirrors, `docs/game-design/spec-boss-qte-differentiation.md`.
**Constants this spec is written against (real, from `src/game/systems/bossQteSystem.ts` +
`types/bossQte.ts`):** `BOSS_PHASE_TABLE` (phase 1/2/3 → EXPOSED 1.6/1.3/1.0 s, SHIELDED lull
2.0/1.6/1.2 s, telegraph 0.45/0.40/0.35 s, wander 1.0/1.3/1.6 u/s, drain −5/−6/−8; parry lead/window
—/0.8·0.7/0.6·0.6 s), `bossHp 24` (thresholds 16/8), `phaseCount 3`, `maxBlownWindows 10`,
`RING_HIT_RADIUS 0.30`, `BOSS_VITAL_CATCH_RADIUS 0.11`, `BOSS_DAMAGE_VITAL 2` / `BOSS_DAMAGE_LIMB 1`,
`BOSS_VITAL_WANDER_CENTRE {0,0.8}` amp 0.16, `BOSS_LIMB_WANDER_CENTRE {0,0.25}` amp 0.28,
`PEEK_EXPOSURE_FLOOR 0.5`, `BOSS_TELEGRAPH_LEAD_FLOOR 0.35`, `PHASE_BREAK_SECONDS 1.0`, the anatomy
bands (`BOSS_VITAL_*` head, `BOSS_TORSO_*`+shoulders limb, `BOSS_BODY_*` silhouette → off/body), and
the only input the tick receives — `fire: boolean` + `impactPoint: Vec2` (`tickBossQte`).
**Cahier des charges verdict:** **[EXTENSION]** — a conscious, incremental refinement of the
already-RATIFIED boss extension (ADR-0051/0052/0053; Prohibition ST had no boss). Does NOT reopen that
verdict. Core loop `Récupérer → Livrer → Éviter` untouched: the shield point lives **inside** an
existing frozen `EXPOSED` window at existing stakes — no new threat-discrimination rule (`Éviter`), no
change to the gate / win-loss / energy ledger shape (`Livrer`). Same documentation standard as the 5
levers (an ADR extending ADR-0052 in place — story AC5).

This is a design spec, not code. Every value is a **game-designer default (tunable)**, transcribed
into `src/game/**` by `dev-gameplay` (pure, TDD). Nothing here holds render/art style, HUD layout, or
audio character — I spec the **read** ("the player must identify the shield point at a glance"), not
the look. Seams flagged §7.

---

## 0. The design thesis — a per-window TRIANGLE of intent

Today a phase-2+ `EXPOSED` window offers a two-way **damage** read (lever 1): the VITAL ring (2 HP,
small `0.11` catch, fast) vs. the LIMB ring (1 HP, `0.30` catch, slow — the "bank"). Both are pure
damage choices; **neither lets the player choose the fight's PACE**, only its per-window value. The
shield point adds a third vertex that trades **recovery for tempo** — the first pacing lever in the
duel:

| Read                      | Chip     | Difficulty                           | Tempo effect                        | Archetype                                 |
| ------------------------- | -------- | ------------------------------------ | ----------------------------------- | ----------------------------------------- |
| **VITAL ring** — la tête  | **2 HP** | hardest (small `0.11` catch, fast)   | none                                | **Max DPS** — the greedy, skilful line    |
| **LIMB ring** — le corps  | **1 HP** | medium (`0.30` catch, wanders slow)  | none — **keeps FULL recovery**      | **Safe / defensive** — the "bank"         |
| **SHIELD prop** — le cran | **1 HP** | **easy (fixed point, `0.30` catch)** | **shortens the NEXT lull by 0.5 s** | **Aggressive** — trades recovery for pace |

**The shield is a SEPARATE cover prop with two reads (Rev. 2 — the canon retarget).** It is NOT part of
the boss body. It is a **persistent riot-shield cover prop** the Commandant hunkers behind, with two
mutually-exclusive states driven by the boss stance:

- **RAISED / intact** — while the boss is `SHIELDED` (behind cover, un-shootable). No hit point.
- **LOWERED / vulnerable** — while the boss is in a phase-2+ normal `EXPOSED` window (he has dropped
  his cover to fire). The lowered shield's exposed edge presents the **fixed hit point** (§6-A).

It is **NOT destroyed permanently.** The lowered read recurs every eligible `EXPOSED` window — each
window the cover comes back down and re-presents the same fixed point. There is no "shield gone" end
state; the prop persists for the whole duel. (This is the load-bearing difference from lever 2's décor
prop, which is single-use — see §0-bis.)

**The strategic axis this opens (the whole point):** a **patient line** (bank limb chips, ride full
lulls, slow safe clear) vs. an **aggressive line** (break the shield to compress lulls, flood windows,
race the HP down before the blown-window clock of 10). A **genuine gamble** — shorter lulls mean less
recovery and earlier pressure. The fight STARTS as the shipped vital/limb read; the shield point lets a
confident player **accelerate their own fight**. Ignore it and the fight plays byte-identically to
ADR-0052/0053 (§4, story AC3).

**Why "shield-break" reads diegetically (improved by the retarget):** the Commandant crouches behind a
riot-shield cover prop; to fire he must drop it (that IS the `EXPOSED` window). Shooting away his cover
— the low, boss's-side point — **knocks his shelter aside so he can't hunker back down as long**: the
next lull is shorter because you _denied him his cover_, not by fiat. Making the shield a separate prop
he shelters behind — rather than plate strapped to his arm — makes the tempo cut **motivated fiction**
("t'as dégommé son bouclier, il peut plus rester planqué") instead of an abstract debuff. It is not a
new verb: it is the same `fire` at a new point in the same window, now aimed at a distinct object.

---

## 0-bis. Not lever 2's décor prop — RECURRING with a tradeoff, not one-shot upside

The shield cover prop must not be conflated with **lever 2's `decorProp`**. They are different in kind:

| Axis         | Lever 2 `decorProp`                          | Lever 6 shield cover prop                                   |
| ------------ | -------------------------------------------- | ----------------------------------------------------------- |
| Lifetime     | **single-use** — consumed once, then gone    | **recurring** — re-presents its point every eligible window |
| Armed during | a `SHIELDED` lull (`armPhaseIndex`)          | every phase-2+ normal `EXPOSED` window (stance-driven)      |
| Payoff       | **pure upside** — a one-time burst of damage | a **tradeoff** — 1 HP chip AND a self-inflicted tempo cut   |
| Player pull  | grab-it-when-it-blinks                       | a per-window pace _choice_ against vital/limb               |
| End state    | `decorConsumed = true` (permanent)           | none — the prop persists the whole duel                     |

Because the shield is recurring and carries a tempo tradeoff (not a one-shot burst), it does **not** map
cleanly onto the `decorProp` data shape. See §4 + §7-flag-2 for the data-shape recommendation to the
architect (it needs its own minimal state — a stance-derived liveness flag + one pending-cut boolean —
**not** `decorProp`'s `armPhaseIndex` / `decorConsumed` single-use fields).

---

## LEVER 6 — Cran de sûreté (shield-break tempo shot)

### 6-A — DECIDED: a FIXED point on the separate cover prop's lowered edge, not a wandering ring, not a moving shield

The candidate shapes and my ruling:

- **(a) a fourth wandering ring** — rejected. Three simultaneous moving rings is read-overload and
  makes the shield indistinguishable in kind from vital/limb; it would blur the triangle instead of
  sharpening it, and it does not deliver the "easy" pole the tempo trade needs.
- **(b) a moving/tracking shield point** — rejected. The shield's design job is to be the **easy,
  reliable** vertex (the one you take when you want pace, not precision). Making it wander erases that
  contrast and re-imports a tracking test the vital ring already owns.
- **(c) a FIXED point on the lowered COVER PROP — CHOSEN.** A **single, static, anchor-relative** hit
  point on the **exposed edge of the lowered shield prop**, live only while that prop is down (i.e.
  during a phase-2+ normal `EXPOSED` window). Fixed = easy = the pacing vertex. Its distinctness (fixed,
  low, on the boss's side, on a _separate object_ from the two rings on his body) is exactly what lets
  the player read it at a glance as "the third option" and not confuse it with the two wandering rings
  (AC5).

**Rev. 2 — the point is the PROP's exposed edge, anchor-relative (not a body point).** It is still
expressed relative to the boss anchor so the render can place the prop and its point together as one
rig. **Value pinned: `BOSS_SHIELD_POINT = { x: 0.4, y: −0.32 }`** (anchor-relative), caught within
`RING_HIT_RADIUS 0.30` (reuse — the same generous catch as the limb ring / parry point / décor prop).

**Why the earlier `{0.4,−0.2}` moved down to `y −0.32`:** now that the shield is a _separate_ prop the
boss hunkers behind, the read must separate cleanly from BOTH the wandering rings on his body AND from
his silhouette. lead-art asked the point read low and on the boss's side; I earlier flagged a
`y ≈ −0.30…−0.35` nudge for disc-disjointness. Both point the same way, so I **pin `y = −0.32`** (the
midpoint of my flagged band). At `y −0.32` the shield **centre** sits outside the limb wander box —
nearest box point `(0.28,−0.03)` is `√(0.12²+0.29²) ≈ 0.314 > 0.30 = RING_HIT_RADIUS` away — so the
shield centre never falls inside a limb-ring catch disc, and a clean shot on it always resolves to the
shield (vs `≈0.21 < 0.30` at `y −0.2`, where a wandering limb ring could cover the shield centre).
NB: the two r-0.30 catch discs are not fully disjoint (that needs centres `> 0.60` apart) — they still
overlap in a thin band, but ring-precedence settles it deterministically. The point stays inside the body silhouette (`BOSS_BODY_*` x ±0.85,
y ±1.05 ✓) so a near-miss still falls through to `body`. See §4 for the disjointness invariant.

### 6-B — DECIDED: the trade — 1 HP chip (limb-equivalent) BUT −0.5 s off the NEXT lull

Firing on the live shield point:

1. **Chips `BOSS_SHIELD_DAMAGE = 1` HP** — a limb-equivalent chip. It flows through the **existing**
   chip path: `windowChipped = true` (the window is answered → not blown), and the chip can cross a
   phase threshold (→ the damage-free `PHASE_BREAK`) or land the kill (→ the `FINISHER`) exactly like a
   ring hit. **No new win/loss surface** (§5, self-balancing).
2. **Arms a one-shot lull cut:** the NEXT `SHIELDED` lull that opens when THIS window closes is
   shortened by `SHIELD_BREAK_LULL_CUT = 0.5 s`. Diegetically (Rev. 2): you knocked his cover aside, so
   he can't stay hunkered as long — the shorter lull is _motivated_, not an abstract debuff.

The cut is **next-lull-only, non-cumulative, and floored:**

- **Next-lull-only** — it affects the single ordinary `EXPOSED→SHIELDED` lull that follows the window
  in which the shield was broken. It never reaches beyond that one lull.
- **Non-cumulative** — breaking the shield twice in one window (or re-arming while a cut is already
  pending) yields **one** 0.5 s cut, never 1.0 s. Model it as a boolean pending flag, consumed at the
  next lull open (§4 state note).
- **Floored (AC2, load-bearing):** the shortened lull is clamped so it stays **STRICTLY greater than
  that phase's `telegraphLeadSeconds`** — the existing `shieldedLull > telegraphLead` invariant
  (asserted in `createBossQte`) MUST survive the cut. This keeps the window tell from ever being
  swallowed (anti-"mort bullshit", §5.6). The floor is asserted **against the runtime row in code, not
  trusted** from authored data (mirrors every prior boss-lever floor).
- **Cleared by any non-ordinary transition** — a `PHASE_BREAK`, a parry `STAGGER`, the `FINISHER`, or a
  `LOST` **discards** any pending cut. The cut only ever shortens an ordinary within-phase lull; it
  **never** shortens the fixed `PHASE_BREAK_SECONDS` beat (that beat is the unmissable phase-change
  read — it must not be compressed) nor a stagger's bonus-window setup.

**At the shipped table values the floor never binds** (comfortable headroom), so the cut is a clean
−0.5 s in both live phases:

| Phase            | Lull (shipped) | Tell (shipped) | Lull after −0.5 s cut | Headroom over tell |
| ---------------- | -------------- | -------------- | --------------------- | ------------------ |
| **2 — pressure** | 1.6 s          | 0.40 s         | **1.1 s**             | 0.70 s ✓           |
| **3 — frenzy**   | 1.2 s          | 0.35 s         | **0.7 s**             | 0.35 s ✓           |

The tell still fits inside the shortened lull in both phases (0.35 s tell < 0.7 s lull), so the shield
never buys a blind window. The floor exists to protect any FUTURE re-tune, not the shipped numbers.

### 6-C — DECIDED: live in phase 2+ NORMAL `EXPOSED` windows ONLY

The shield prop's point is present and shootable (prop in its **lowered/vulnerable** read) **iff** the
boss is in a normal (non-charged) `EXPOSED` window of phase index ≥ 1 (phase 2+), and **not** breaking /
staggering / in the finisher. Otherwise the prop is in its **raised/intact** read (no hit point).
Concretely, the render-facing liveness flag is:

`shieldPointLive = (stance === "EXPOSED") && (phaseIndex ≥ 1) && !chargedWindow && phaseBreakRemaining ≤ 0 && staggerRemaining ≤ 0`

The same flag drives the prop's two-read swap for the render lane: `shieldPointLive` → lowered/vulnerable;
else → raised/intact. It is a logic-free derived read (no new state).

Rationale, point by point:

- **Phase 2+ only** — phase 1 stays the single-ring V1 onboarding (the lever-1 discipline: introduce
  one new read per phase transition, never ambush phase 1). The triangle appears exactly when the
  two-ring choice does, so the player learns "two rings" and "a third fixed option" together at the
  phase-1→2 break, not blind.
- **Normal windows only** — a CHARGED / parry window (lever 3) presents **no rings and no shield
  point**; its sole valid read is the parry point. This is deliberate and load-bearing (§5): it keeps
  the parry skill-check intact and structurally prevents a low-skill "shield-grind" from bypassing the
  parry demand (phase 3 charges every other window).
- **Not during breaks / staggers / finisher / zoom** — those are damage-free, unreadable, or
  ceremonial frames; a `fire` there is already a `QTE_PANIC_SHOT −6` (unchanged). The shield does not
  exist as a target in any of them (the shield is UP while `SHIELDED`).

### 6-D — DECIDED: interaction with the 5 existing levers (the call the story delegated to me)

The story left "does the shield point coexist with the two-ring lever, does renfort modulate its tempo
discount" explicitly to the design gate. My rulings:

1. **Lever 1 (dual vital/limb rings):** the shield point **coexists** — during a phase-2+ normal window
   the player sees VITAL ring + LIMB ring + SHIELD point (the full triangle). Resolution is
   **deterministic by hit-test order** (§4): the two rings are tested first (`ringHitZone`), the shield
   point second (in the ring-missed branch), body/miss last. Rings always win a tie; the shield point
   is spatially disjoint from both ring **centres** (§4 invariant), so a clean shot at the shield reads
   as the shield.
2. **Lever 3 (parade / charged windows):** **mutually exclusive** by 6-C — no shield point during a
   charged window. No interaction to resolve.
3. **Lever 2 (décor prop):** **mutually exclusive in time** — the décor prop arms during a `SHIELDED`
   lull; the shield point lives during `EXPOSED`. They are never both shootable in the same instant.
   No interaction.
4. **Lever 4 (renfort surge):** the surge modulates only the **blown-window drain** (−12 instead of the
   phase drain). A shield-broken window is **answered** (`windowChipped = true`) → **never blown** → the
   renfort drain never applies to it. So **renfort does NOT modulate the tempo discount**, and the
   shield-break does not touch the renfort drain. They are orthogonal. (If anything, breaking the
   shield under a renfort surge is a smart defensive play — it answers the window and denies the −12.)
5. **Lever 5 (coup de grâce / finisher):** a shield-break chip that depletes `bossHp` to 0 routes into
   the `FINISHER` exactly like a ring or parry kill (§4). No special-casing.

No other veille idea is folded in (story scope: exactly this one lever).

---

## 1. Reuse map (AC2/AC5 — extends in place vs. newly authored)

| Element                        | Reuse or new   | Note                                                                                                                                                                                                                              |
| ------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catch test / radius            | **reuse**      | `RING_HIT_RADIUS 0.30` + `withinCatch` — the shield uses the same generous catch as limb/parry/décor.                                                                                                                             |
| Chip application path          | **reuse**      | `bossHp − dmg`, `windowChipped = true`, `applyPhaseBreakIfCrossed`, `toFinisher` — no new HP plumbing.                                                                                                                            |
| Body/miss fallthrough          | **reuse**      | A shot that misses rings AND shield falls through to `bossQteZoneAt` (body −5 / miss 0) unchanged.                                                                                                                                |
| Anti-bullshit lull floor       | **reuse**      | The `shieldedLull > telegraphLead` assert in `createBossQte`; the cut is clamped to preserve it.                                                                                                                                  |
| Energy ledger                  | **reuse**      | A shield-break moves **no energy** (like a ring hit). Severity order untouched.                                                                                                                                                   |
| `BOSS_SHIELD_POINT` (fixed pt) | **new**        | `{ x: 0.4, y: −0.32 }` anchor-relative — the cover prop's lowered edge. System constant (F3-promotable), not per-level authored.                                                                                                  |
| `BOSS_SHIELD_DAMAGE`           | **new**        | `1` HP. System constant.                                                                                                                                                                                                          |
| `SHIELD_BREAK_LULL_CUT`        | **new**        | `0.5 s`. System constant.                                                                                                                                                                                                         |
| Pending-cut state              | **new**        | A boolean `BossQte` field (e.g. `shieldBreakPending`) — set on a shield-break, consumed at next lull.                                                                                                                             |
| `shieldPointLive` render flag  | **new**        | Derived per §6-C. Logic-free read; also drives the prop's raised↔lowered two-read swap.                                                                                                                                           |
| `decorProp` data shape         | **not reused** | Rev. 2: the shield prop is RECURRING w/ a tradeoff, not lever 2's single-use `{position,armPhaseIndex}` + `decorConsumed`. Needs no per-level authored field (system constant + one pending-cut boolean). See §0-bis + §7-flag-2. |

Same "extends in place, does not reopen" discipline as ADR-0052 D1: no frozen ADR-0051/0052 constant is
retuned (story OUT-of-scope), no new phase / stance / top-level state, decoded from the same
`fire`+`impactPoint` surface.

---

## 2. Tuning defaults (the deliverable — game-designer defaults, tunable)

| Constant                | Default                                     | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BOSS_SHIELD_POINT`     | `{ x: 0.4, y: −0.32 }`                      | **Anchor-relative, low, on the boss's (screen-)right — the lowered cover-prop edge.** Inside the body silhouette (`BOSS_BODY_*`: x ±0.85, y ±1.05 ✓) so a near-miss still reads `body`. Outside every scoring band, and at y −0.32 its **centre** is ≈ 0.314 > 0.30 from the nearest limb wander-box point (see §6-A), so it never falls inside a limb-ring catch disc → a clean shot on it always reads shield (the discs overlap in a thin band, settled by ring-precedence). Visually and semantically distinct from both rings. |
| `BOSS_SHIELD_DAMAGE`    | **1 HP**                                    | Limb-equivalent — the shield is an EASY target, so it must NOT out-value the hard-earned limb chip (that would make it dominant). 1 HP keeps vital (2 HP) the max-DPS line; the shield's edge is tempo, never raw damage.                                                                                                                                                                                                                                                                                                           |
| shield catch radius     | **0.30** (`RING_HIT_RADIUS`, reuse)         | Generous, fixed target = the "easy" pole of the triangle. Same catch as limb/parry/décor for consistency; no new radius constant.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `SHIELD_BREAK_LULL_CUT` | **0.5 s**                                   | Big enough to be **felt** (a 0.5 s bite off a 1.6/1.2 s lull is 31 %/42 % less recovery — a real pace change), small enough to stay above the tell floor in both live phases (§6-B table). One clean magnitude, non-cumulative, next-lull-only.                                                                                                                                                                                                                                                                                     |
| lull floor after cut    | **strictly > phase `telegraphLeadSeconds`** | AC2 hard boundary. Asserted in code against the runtime row. At shipped values it never binds (0.7 s > 0.35 s); it protects future re-tunes.                                                                                                                                                                                                                                                                                                                                                                                        |
| availability            | **phase 2+, normal `EXPOSED` only**         | §6-C. Phase-1 onboarding preserved; charged/break/stagger/finisher/zoom excluded.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**No per-level `BossQteSpec` field.** Like the phase table and the lever cadences, the shield lever is a
system constant for V1 (one live encounter). The additive-and-optional guarantee (AC3) is satisfied by
the lever being **player-optional** (never firing at the shield ⇒ byte-identical trajectory), not by a
level toggle — so no spec field is needed. F3 may promote to a `BossQteSpec` flag if a later
multi-encounter curve wants some bosses without it.

---

## 3. Winnability re-check (K-5 discipline — stage-5 `verify`, on the pinned `targetSeed`)

The shield lever adds a 3rd damage opportunity per window AND compresses tempo, so the shipped
~55 %→62 % window-efficiency-to-clear math (spec-boss-qte-encounter §4.2) **must be re-validated on the
pinned Belliard/Niveau-Final `targetSeed`** before this ships. Three properties to confirm:

- **W1 — the aggressive line stays winnable, not a death-spiral.** Breaking shields floods windows with
  less recovery; the vital ring still WANDERS, so compressed lulls give less time to re-acquire it.
  Confirm a competent aggressive player clears with margin and the tell never gets swallowed (the floor
  guarantees `lull > tell`, so the compression is a self-inflicted, telegraphed, seeded-pure pressure —
  **not** bullshit). The blown-window COUNT is unchanged (10); only wall-clock tempo compresses.
- **W2 — the shield is not DOMINANT.** Pure shield-grind = 24 windows @ 1 HP, **slower** than the ~12
  windows a vital-focused line takes. Confirm no line beats the vital line on speed by spamming the
  easy shield. (It shouldn't: 1 HP easy < 2 HP hard per window.)
- **W3 — the shield is not a ZERO-SKILL auto-win.** A patient shield-grind is safe only where windows
  are normal; **phase 3 charges every other window** (lever 3), which present **no shield point** and
  demand a parry — so shield-grind cannot carry phase 3. Confirm the parry skill-check is intact and a
  passive shield-spammer still loses to the blown-window clock on the charged windows they whiff.

If W1/W2/W3 hold on the pinned seed, the lever adds a ceiling without lowering the floor or the bar.
Flag to `qa-lead` for the stage-5 gate.

---

## 4. Implementation seams for `dev-gameplay` (values + reads, NOT code)

Named so the tech plan and dev lane share my model; the RULES are mine, the CODE is theirs.

- **Fire resolution order (deterministic):** during a normal `EXPOSED` window, keep the current
  order — (1) `ringHitZone` (vital/limb rings, phase-2+ two-ring), then in the **ring-missed branch**
  insert (2) a shield-point catch test (`withinCatch(impact, anchor, BOSS_SHIELD_POINT, RING_HIT_RADIUS)`
  gated on `phaseIndex ≥ 1`), then (3) `bossQteZoneAt` body/miss. Rings win any tie; the shield is
  disjoint from both ring centres so a clean shield shot is unambiguous.
- **Disjointness invariant (assert, colour/read honesty):** `BOSS_SHIELD_POINT`'s centre must lie
  **outside** both ring wander sub-boxes (it does: vital box y 0.64–0.96, limb box x −0.28…0.28 /
  y −0.03…0.53; the shield centre is x 0.4, y −0.32 — outside both, so it never falls inside a ring
  catch disc; overlaps of the r-0.30 discs resolve by ring-precedence).
  Assert it in `createBossQte`
  alongside the lever-1 `boxInBand` checks, so a future re-position can't silently overlap a ring.
- **Pending-cut state:** a boolean on `BossQte` set true when a shield-break lands; when the sub-machine
  next opens a `SHIELDED` lull on an ordinary window close, if the flag is set, size the lull to
  `max(shieldedLull − SHIELD_BREAK_LULL_CUT, floor)` where `floor` keeps it strictly > the phase's
  `telegraphLeadSeconds`, then clear the flag. Clear the flag WITHOUT applying on any
  break/stagger/finisher/LOST transition.
- **No energy delta** on a shield-break (like a ring hit). The severity ledger is untouched.
- **Depletion / threshold crossing:** a shield-break chip reuses `toFinisher` (if `bossHp ≤ 0`) and
  `applyPhaseBreakIfCrossed` (if it crosses 16/8) verbatim — carry the pending-cut clear through the
  early `FINISHER` return, and note that a crossing chip's cut is discarded (a `PHASE_BREAK` follows,
  not an ordinary lull).

---

## 5. Anti-"mort bullshit" guardrails (§5.6, mirror ADR-0051/0052, asserted not trusted)

| Guardrail                    | Floor / rule                                                                                                           | Rationale                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Shortened lull vs. tell      | shortened lull **strictly > phase `telegraphLeadSeconds`** (asserted vs. runtime row)                                  | The window tell is never swallowed by a self-inflicted compression. AC2, AC6.                                                         |
| Phase break never compressed | the cut is **discarded** on a phase-crossing chip; `PHASE_BREAK_SECONDS` is fixed                                      | The phase-change read stays the unmissable 1.0 s beat — a new pattern never opens un-warned.                                          |
| No new failure surface       | a shield-break **answers** the window (`windowChipped`); it can only WIN faster or trigger the existing break/finisher | The player can never LOSE by engaging the shield — the loss clock (`maxBlownWindows`) and drains are byte-identical (self-balancing). |
| Legibility parity (AC6)      | the shield point is a **fixed, telegraphed-by-presence, seeded-pure** read, drawn as readably as the rings             | No hidden fourth rule to discover blind — it appears with the two rings at the phase-2 break and stays put.                           |
| Additive-and-optional (AC3)  | never firing the shield ⇒ **byte-identical** game-state trajectory to ADR-0052/0053                                    | Preserve until re-tuned — the lever is pure ceiling.                                                                                  |

---

## 6. Acceptance criteria (design VERIFY, stage 5 — Sacha playtests `verify` vs. these)

- **AC1 — Third read defined.** Placement (`{0.4,−0.32}`), size (`RING_HIT_RADIUS 0.30`), damage (1 HP),
  lull cut (0.5 s next-lull-only non-cumulative floored), and live states (phase 2+ normal `EXPOSED`
  only) are all specified above — no silence (story AC1).
- **AC2 — Floor holds.** No shield-break can drive a `SHIELDED` lull to ≤ that phase's
  `telegraphLeadSeconds`; asserted in code against the runtime row (unit test), not trusted. The
  `PHASE_BREAK_SECONDS` beat is never compressed.
- **AC3 — Additive-and-optional.** A run that never fires on the shield point is byte-behaviour-identical
  to the ADR-0052/0053-shipped duel (unit test / seeded replay).
- **AC4 — Tempo actually compresses.** Firing the shield shortens the next lull: phase-2 lull 1.6 s →
  **1.1 s**; phase-3 lull 1.2 s → **0.7 s** (observable in the tick state and felt in play).
  Non-cumulative: a double-break in one window still cuts one 0.5 s.
- **AC5 — Triangle reads.** In a phase-2+ normal window the player can distinguish, at a glance, VITAL
  ring vs. LIMB ring vs. SHIELD point, and the shield sits low on the boss's side (K-1-style framing
  check both device classes — the shield point must be on-frame at the boss zoom).
- **AC6 — Interactions hold.** No shield point during a charged/parry window, a break, a stagger, the
  finisher, or phase 1. A shield-break chip that crosses 16/8 triggers the normal phase break (cut
  discarded); one that hits 0 routes to the `FINISHER` (+50 paid once). Renfort drain never applies to a
  shield-answered window.
- **AC7 — Winnability re-validated (K-5).** On the pinned `targetSeed`, W1/W2/W3 (§3) all hold: the
  aggressive line is winnable-not-spiral, the shield is neither dominant nor a zero-skill auto-win.

Sacha reports PASS/deviations to `lead-game-designer` before `senior-architect`'s integration review
(pipeline stage-5 contract).

---

## 7. Open flags for the gate / other lanes (explicitly NOT decided here)

**For `lead-game-designer` (gate):**

1. The `BOSS_SHIELD_POINT` is pinned at `{0.4,−0.32}` — the disjointness nudge is **taken**, not left
   open: at y −0.32 the catch disc (r 0.30) is cleanly disjoint from the limb ring's wander box
   (nearest-point distance ≈ 0.314 > 0.30), so the shield read never collides with a ring even before
   the deterministic ring-precedence order (§4) is consulted. Remaining latitude for the gate: the exact
   y within −0.30…−0.35 is tunable if the stage-5 `verify` read wants it lower; −0.32 is the pinned
   default.

**For `senior-architect` (TECH PLAN / AC4/AC5):**

2. Whether the pending-cut lives as a boolean `BossQte` field vs. a pre-sized `nextLullSeconds` is a
   data-shape call. I recommend the **boolean** (non-cumulative falls out for free; the floor clamp
   stays at the lull-open site next to the existing assert). Same F3-promotion seam as the phase table.
3. The ADR **extends ADR-0052 in place** (story AC5) — a lever-6 reuse map + the disjointness/floor
   asserts. Not amending ADR-0051/0052.

**For `ux-designer` (only if a tempo-read surface is proposed — story DoD):**

4. The shield point needs a glance-legible READ distinct from the two rings (AC5). A **compressed-lull
   cue** (the player should feel/see that the next window is coming sooner after a shield-break) is
   optional gameplay-relevant polish — my input, not a decision: if surfaced, it must not add a new
   HUD stress bar (ADR-0034 audio-tension ruling). Whether any tempo read is worth a surface is your
   call.

**For `lead-art` (read spec, not style):**

5. The player must, at a glance, read the **lowered riot shield** as a fixed, low, boss's-side hit
   point that is **not** one of the two wandering rings — a third, static affordance that appears in
   phase 2+. Pose/read need (indicative): the shield-down `EXPOSED` posture should present the shield
   plate/arm as the shootable low point. Style is yours; the read is the spec.

---

## Hand-off — `lead-game-designer` (Karim), design gate

**Decisions taken in this spec (mechanic + tuning + interactions, my lane):**

- **6-A — DECIDED:** a FIXED third hit point on the separate cover prop (not a 4th wandering ring, not a
  moving shield) — `BOSS_SHIELD_POINT {0.4,−0.32}`, caught within `RING_HIT_RADIUS 0.30`, catch disc
  cleanly disjoint from both ring boxes.
- **6-B — DECIDED:** the trade — chips `BOSS_SHIELD_DAMAGE 1` HP (limb-equivalent, flows through the
  existing chip path) AND shortens the NEXT `SHIELDED` lull by `SHIELD_BREAK_LULL_CUT 0.5 s`
  (next-lull-only, non-cumulative, floored strictly > the phase tell, cleared by any
  break/stagger/finisher/loss).
- **6-C — DECIDED:** live in phase 2+ NORMAL `EXPOSED` windows only (phase-1 onboarding preserved;
  charged/break/stagger/finisher/zoom excluded).
- **6-D — DECIDED (the call the story delegated):** coexists with lever 1 (deterministic ring-precedence
  order); mutually exclusive with lever 3 (no shield in a charged window — preserves the parry
  skill-check) and lever 2 (distinct in time); orthogonal to lever 4 (a shield-answered window is never
  blown, so renfort never touches it); routes into lever 5's finisher on a kill.
- **Tuning (§2) + winnability re-check (§3) + anti-bullshit floors (§5)** specified with rationale, all
  asserted-not-trusted; the ignore-it-byte-identical law (AC3) and the AC2 floor held.

**Points I explicitly left OPEN (§7):** the exact shield-point y within −0.30…−0.35 (pinned −0.32, a
stage-5 verify read-tune, no longer a disjointness risk); the pending-cut data shape + the extends-in-place ADR
(`senior-architect`); a compressed-lull read surface (`ux-designer`, only if proposed); the
shield-down pose read (`lead-art`).

**Requesting:** design-gate `VERDICT:` (PASS / PASS-WITH-CORRECTIONS / FAIL), explicitly covering story
AC1 (all four values defined), AC2 (floor), and AC6 (legibility parity), before this reaches `pm`
re-review (story AC7) and `senior-architect`.
