# 0060 — Boss QTE lever 6 "cran de sûreté" (shield-break tempo shot): a third per-window read, extends ADR-0052 in place

- **Status:** Accepted
- **Date:** 2026-07-21
- **Number:** 0060. Renumbered twice across successive rebase-onto-main cycles as `main` claimed each
  number first: originally 0057 at TECH PLAN, moved 0057 → 0059 when `main` shipped
  `0057-single-wide-backdrop-belliard`, then moved again 0059 → 0060 when `main` shipped
  `0058-grille-overlay-single-wide.md` (which pushed the sibling Belliard-boss ADR 0058 → 0059,
  freeing this one up to 0060) — the `adr-new` duplicate-number guard, applied at each rebase.
- **Extends (does NOT supersede):**
  [ADR-0052](./0052-boss-qte-differentiation-levers.md) — the 5-lever boss differentiation pack.
  This ADR is to ADR-0052 exactly what ADR-0052 is to [ADR-0051](./0051-boss-qte-encounter-system.md):
  it adds a **sixth lever** to the boss system, **entirely within the boss files**, and states what
  is reused vs. newly authored per the same revision-log discipline. ADR-0051 and ADR-0052 stay
  Accepted and are **not amended, retuned, or re-litigated** — every frozen constant, phase, stance
  and floor they set ships here byte-for-byte.
- **Converges with:** [ADR-0059](./0059-belliard-boss-gated-shipped-level.md) (the Belliard
  placement / D4 reversal). The two changes land together on the same boss "le Commandant"; lever 6
  is exercised by phases 2-3 of the Belliard/Niveau-Final duel, and its shield **cover prop** is one
  of the canon assets that gate ADR-0059's flip-on. Neither ADR depends on the other's _decision_;
  they share a merge and an art gate.
- **Related:** `_bmad-output/planning-artifacts/story-boss-shield-tempo-shot.md` (the story, AC1–AC7),
  `docs/game-design/spec-boss-shield-break-tempo-shot.md` (gated mechanic/tuning — the build contract
  this ADR ratifies, Rev. 2), `docs/handoffs/story-boss-shield-tempo-shot.md` (stage history),
  [ADR-0035](./0035-hostage-qte-difficulty-curve.md) (the F3 "promote a constant to a spec field when
  a curve needs it" seam this lever keeps deferred),
  `src/game/systems/bossQteSystem.ts`, `src/game/types/bossQte.ts`,
  `src/render/scene/BossQteSprite.tsx`.

## Context

The differentiation pack (ADR-0052) added five levers; the game-designer then scoped a **sixth**
(story `story-boss-shield-tempo-shot`, design-gated spec Rev. 2): a **shield-break tempo shot**. During
a phase-2+ NORMAL `EXPOSED` window the Commandant hunkers behind a **separate riot-shield cover prop**
(canon lead-art ruling: nothing shootable is modelled ON his bare-headed body — the prop is a distinct
object he shelters behind). While that prop is **lowered** (he has dropped cover to fire) it presents a
**fixed** hit point on its low, boss's-side edge. Shooting it chips 1 HP AND **compresses the next
`SHIELDED` lull by 0.5 s** — turning each window from a two-way damage read (vital ring vs. limb ring)
into a **triangle of intent** (max-DPS vital / safe limb-bank / aggressive shield-for-tempo). It is the
first _pacing_ lever in the duel: trade recovery for pressure.

Forces read from the real code at TECH PLAN (verified, not assumed):

- The boss tick decodes from **only** `fire: boolean` + `impactPoint: Vec2` + `delta`
  (`tickBossQte`). Any lever that needs a new input forces a `src/hooks` / cross-boundary change —
  this one does not (§D2).
- The chip path is a single well-defined surface: a ring hit sets `windowChipped`, applies
  `applyPhaseBreakIfCrossed` (16/8 thresholds), and routes to the `FINISHER` via `toFinisher` on
  depletion. A shield chip must flow through it verbatim so no new win/loss surface appears.
- The lull floor is asserted-not-trusted in `createBossQte` (`shieldedLull` strictly > that phase's
  `telegraphLeadSeconds`). Any compression of a lull must preserve this invariant.
- `bossQteSpec === null` byte-identity is the standing safety law; a phase-1-only, ring-only fight is
  byte-behaviour-identical to ADR-0051 V1 (ADR-0052 D5).

Two calls were delegated to `senior-architect` (spec §7 flags 2–3): the **pending-cut data shape**
and the **ADR form** (extend ADR-0052 vs. amend). This ADR answers both and pins the seams the three
touched lanes (mechanic / render / art) build against.

## Decision

### D1 — A sixth lever, authored ENTIRELY within the boss files; ADR-0052's isolation holds

Lever 6 is authored in `src/game/systems/bossQteSystem.ts` + `src/game/types/bossQte.ts` (pure, TDD)
and reflected in the logic-free view `src/render/scene/BossQteSprite.tsx`. The ADR-0051 D1 /
ADR-0052 D1 "separate, additive boss system" property is preserved:

- **`src/game/systems/stateMachine.ts` and `src/hooks/useGameLoop.ts` are byte-untouched** — the lever
  decodes from the existing `fire`+`impactPoint` surface inside `tickBossQte`. No cross-boundary seam,
  no shipped `LevelConfig` change (this ADR authors no level data; placement is ADR-0059's lane).
- `qteSystem.ts` / `hostageQte.ts` (the frozen shipped hostage contract) are **not** touched.
- **No new top-level phase and no new stance.** Unlike ADR-0052 D3's `FINISHER`, this lever adds
  neither. It adds exactly **one boolean runtime field** and **one derived exported helper** (§D3/D4).
  `bossQteSpec === null` byte-identity is untouched.

### D2 — Reuse map (extends-in-place vs. newly authored), AC2/AC5

Ratifies the game-designer spec §1 reuse map against the verified code.

**Reused verbatim (do not re-derive):**

| Element                  | Reuse                                                                                                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catch test / radius      | `RING_HIT_RADIUS 0.30` + the existing catch helper — the shield uses the **same generous catch** as the limb ring / parry point / décor prop (the "easy" pole). No new radius constant. |
| Chip application path    | `bossHp − dmg`, `windowChipped = true`, `applyPhaseBreakIfCrossed`, `toFinisher` — verbatim. No new HP plumbing, **no new win/loss surface**.                                           |
| Body/miss fallthrough    | a shot missing both rings AND the shield falls through to the existing body (−5) / miss (0) zoning, unchanged.                                                                          |
| Anti-bullshit lull floor | the `shieldedLull > telegraphLead` assert in `createBossQte`; the cut is clamped to preserve it (§D5).                                                                                  |
| Energy ledger            | a shield-break moves **no energy** (like a ring hit). Severity order untouched.                                                                                                         |
| Determinism law          | the shield point is **fixed** (anchor-relative), not seeded/wandering — trivially deterministic; no new `Math.random`/`Date.now`/per-tick cursor.                                       |

**Newly authored (all boss-only system constants, F3-promotable — no per-level `BossQteSpec` field):**

| Constant / field           | Value                                | Note                                                                                                                          |
| -------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `BOSS_SHIELD_POINT`        | `{ x: 0.4, y: −0.32 }`               | Anchor-relative, low, on the boss's screen-right — the lowered cover-prop's exposed edge.                                     |
| `BOSS_SHIELD_DAMAGE`       | `1` HP                               | Limb-equivalent. The shield is EASY, so it must not out-value the hard-earned limb chip; vital (2 HP) stays the max-DPS line. |
| `SHIELD_BREAK_LULL_CUT`    | `0.5` s                              | The next-lull compression. Felt (31 %/42 % off the phase-2/3 lull) yet above the tell floor in both live phases.              |
| `shieldBreakPending`       | `boolean` runtime field on `BossQte` | The pending-cut state (§D3). Set on a shield-break, consumed at the next ordinary lull open.                                  |
| `bossShieldPointLive(...)` | derived, exported pure helper        | The §D4 liveness predicate. Logic-free read; also drives the render prop's raised↔lowered two-read swap.                      |

Same "extends in place, does not reopen" discipline as ADR-0052 D2: **no frozen ADR-0051/0052 constant
is retuned**, no new phase/stance/top-level state, decoded from the same `fire`+`impactPoint` surface,
additive-and-optional (a run that never fires on the shield point is byte-behaviour-identical to the
ADR-0052/0053 duel — story AC3).

### D3 — The pending-cut data shape: a boolean `shieldBreakPending` field (the spec's recommendation — CONFIRMED)

The delegated call (spec §7 flag 2): a **boolean `shieldBreakPending` field** on the `BossQte` runtime,
**not** a pre-sized `nextLullSeconds`. I **confirm the boolean**. Rationale:

- **Non-cumulative falls out for free.** Setting a boolean twice in one window (or re-arming while a cut
  is already pending) is idempotent — one 0.5 s cut, never 1.0 s (spec §6-B, AC4). A pre-sized-seconds
  field would have to guard against double-subtraction explicitly.
- **The floor clamp stays at ONE site.** The clamp lives at the lull-open site, next to the existing
  `shieldedLull > telegraphLead` assert, sizing the lull to
  `max(shieldedLull − SHIELD_BREAK_LULL_CUT, floor)` where `floor` keeps it **strictly greater than**
  that phase's `telegraphLeadSeconds`, then clearing the flag. The floor is derived from the runtime
  phase row (asserted-not-trusted), never from authored data. A pre-sized field would move floor logic
  to the set site and duplicate the phase-row lookup.
- **Same F3-promotion seam as the phase table** — a boolean is the minimal state; if a later
  multi-encounter curve wants per-boss opt-out, promote to a `BossQteSpec` flag then (not now).

**Cut lifecycle (mechanic-lane contract, dev-gameplay):**

- **Set** true when a shield-break lands (in the ring-missed branch, §D4).
- **Consumed** the next time the sub-machine opens an **ordinary** within-phase `SHIELDED` lull on a
  window close: apply the clamped cut, then clear.
- **Cleared WITHOUT applying** on any non-ordinary transition — a `PHASE_BREAK` (phase-crossing chip),
  a parry `STAGGER`, the `FINISHER`, or `LOST`. The cut **never** shortens the fixed
  `PHASE_BREAK_SECONDS` beat (the unmissable phase-change read) nor a stagger's bonus-window setup.
  Carry the clear through the early `FINISHER` return.

### D4 — Fire-resolution order + the `bossShieldPointLive` derived read (boundary law)

**Deterministic hit order** during a normal `EXPOSED` window (mechanic lane): (1) `ringHitZone`
(vital/limb rings, phase-2+ two-ring) first; then in the **ring-missed branch** (2) a shield-point
catch test gated on the liveness predicate; then (3) body/miss zoning last. **Rings win any tie.** The
shield centre is spatially disjoint from both ring wander sub-boxes (§D5), so a clean shield shot is
unambiguous.

**Liveness is a derived, logic-free read** — the boss layer owns it, the render layer _calls_ it (the
same `phaseIndexAt` precedent from ADR-0051 D2; the game names the state, the render maps it to a pose).
Exported pure helper `bossShieldPointLive`, per spec §6-C:

```
bossShieldPointLive = stance === "EXPOSED"
  && phaseIndex >= 1            // phase 2+ only (phase-1 onboarding preserved)
  && !chargedWindow             // no shield in a lever-3 parry window (parry skill-check intact)
  && phaseBreakRemaining <= 0
  && staggerRemaining <= 0
```

The same predicate drives `BossQteSprite`'s prop two-read swap: `true` → lowered/vulnerable (hit point
present); `false` → raised/intact (no hit point). **No new `src/game` HUD field, no new render rule** —
the boundary law holds.

### D5 — Asserted floors + disjointness (anti-"mort bullshit" §5.6, asserted not trusted)

New/reused asserts in `createBossQte`, against the constant/runtime data (never trusted):

- **Shortened-lull floor (reuse, load-bearing):** every shield-compressed lull stays **strictly greater
  than** that phase's `telegraphLeadSeconds` — the existing `shieldedLull > telegraphLead` invariant
  survives the cut. At shipped values it never binds (phase-2 1.6→1.1 s, phase-3 1.2→0.7 s; both > the
  0.40/0.35 s tell); the floor protects future re-tunes. The window tell can never be swallowed by a
  self-inflicted compression (AC2).
- **`PHASE_BREAK_SECONDS` is never compressed** — the cut is discarded on a phase-crossing chip (§D3).
- **Disjointness invariant (new assert):** `BOSS_SHIELD_POINT`'s centre lies **outside** both ring
  wander sub-boxes (vital box y 0.64–0.96; limb box x −0.28…0.28 / y −0.03…0.53; shield centre
  x 0.4, y −0.32 — outside both; the nearest limb-box point is ≈ 0.314 away, > `RING_HIT_RADIUS` 0.30,
  so the shield centre never sits inside a limb-ring catch disc → a clean shot on it always resolves to
  the shield. NB: the two r-0.30 catch discs are NOT geometrically disjoint — that needs centres > 0.60
  apart — they overlap in a thin band, settled deterministically by ring-precedence, `else if` after
  `ringHitZone`) AND **inside** the body silhouette (`BOSS_BODY_*` x ±0.85, y ±1.05) so a near-miss
  still reads `body`. Asserted alongside the lever-1 `boxInBand` checks, so a future re-position can't
  silently move the shield centre into a ring box or leave the silhouette.
- **No new failure surface** — a shield-break **answers** the window (`windowChipped`); the loss clock
  (`maxBlownWindows 10`) and every drain are byte-identical. The player can only win faster or trigger
  the existing break/finisher — never lose by engaging the shield (self-balancing, AC3).

### D6 — Interaction rulings & scope (ratifies the game-designer §6-D calls)

Coexists with lever 1 (deterministic ring-precedence, §D4); mutually exclusive with lever 3 (no shield
in a charged window — preserves the parry skill-check) and lever 2 (distinct in time — décor arms in a
`SHIELDED` lull, the shield lives in `EXPOSED`); orthogonal to lever 4 (a shield-answered window is
never blown, so the renfort drain never touches it); routes into lever 5's `FINISHER` on a depleting
chip. No per-level `BossQteSpec` field — a system constant for V1 (the additive-and-optional guarantee
is satisfied by the lever being player-optional, not by a level toggle).

## Consequences

**Positive**

- The lever is 100 % additive inside one already-separate system: the merge gate reviews new
  constants + one boolean field + one derived helper + a hit-test branch in `bossQteSystem.ts` and one
  view swap in `BossQteSprite.tsx` — **not** a `stateMachine.ts` / `useGameLoop.ts` / hostage / shipped-
  level change. Cross-boundary surface = zero.
- The boolean data shape keeps non-cumulativity and the floor clamp free and co-located with the
  existing assert (§D3); the F3-promotion seam matches the phase table.
- Phase-1 onboarding stays V1-identical; the triangle appears exactly when the two-ring read does.

**Negative / costs**

- The `tickBossQte` `ACTIVE` case grows one more branch (the shield hit-test) on the system's most
  safety-critical function; the TDD suite grows with it (AC1–AC7, the disjointness + floor asserts).
- The shield **cover prop** needs canon art; until then `BossQteSprite` draws it procedurally (same
  fallback posture as every V1 boss read). Its render-integration rides ADR-0059's flip-on art gate.

**Gotchas**

- **Winnability re-check (K-5, stage-5):** the lever adds a 3rd damage opportunity AND compresses
  tempo — re-validate W1/W2/W3 (aggressive line winnable-not-spiral; shield not dominant; shield not a
  zero-skill auto-win, phase-3 charges deny a shield-grind) on the pinned `targetSeed`. Not a contract
  blocker; a stage-5 `qa-lead` item.
- **Pending-cut clear on every non-ordinary exit** — miss any of PHASE_BREAK / STAGGER / FINISHER /
  LOST and a stale cut could shorten a beat it must not. Covered by unit tests, not review alone.
- **Determinism** — the shield point is fixed, but the surrounding chip/finisher/phase-break paths it
  reuses stay seeded-pure; a stray `Math.random` anywhere reopens the replay-determinism class.
