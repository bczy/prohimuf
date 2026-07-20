# Story: armement complet / multi-armes par pickup

**Status:** open  
**Branch:** `claude/features-a-implémenter-ehw9q4`  
**Greenlight:** Bertrand, 2026-07-20

---

## stage-0. INTAKE — producer (Marion) — 2026-07-20

- claim: story opening, ADR reservation, pipeline routing / release: shard opened, ADR-0052 reserved, design lane queued
- **Pipeline route:** design gate Karim (lead-game-designer) + pm scope (pm John) → senior-architect tech plan → dev lanes dev-gameplay ∥ dev-r3f-render (± art lane for crate glyph) → qa-lead verify → stage-6 review panel → pm accept
- **Reserved ADR:** ADR-0052 weapons pickup system (reserved; senior-architect to write post-design-gate)
- **Pre-spec:** `docs/game-design/pre-spec-weapons.md` (statut pre-gate, 2026-07-18, game-designer lane)
- **Scope note:** extension beyond Prohibition guidelines (multi-weapon roster); requires design gate + pm scope sign-off before dev entry

---

## stage-2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-20

- claim: design gate of `docs/game-design/pre-spec-weapons.md` (Bertrand-greenlit [EXTENSION], 2026-07-20) — coherence / completeness / compatibility, NOT "should it exist" / release: **PASS-WITH-CORRECTIONS** — 6 blocking (B1–B6) must land in the formalized `weapons.md` before senior-architect lane assignment; 3 non-blocking (N1–N3); W1–W8 anti-frustration guardrails to be baked in as acceptance criteria (equivalent of the QTE's G-rules). Extension honesty PASS (§1 truthful, Wild Guns canonical grounding strong). Core loop + 3–5 min PASS (specials serve `Éviter`, forced base-return recreates Prohibition ammo tension, no meta-layer).
- VERDICT: PASS — design gate: weapons pre-spec (lead-game-designer)

**PASS-WITH-CORRECTIONS.** Verdict is PASS (advances to formalization + architect) conditioned on the blocking set landing in `weapons.md`; not a clean PASS because structural holes below force a dev/architect to guess. Not a FAIL: the core model (one-weapon / no-switch / crate-fire acquisition / auto-return / A–D roles) is coherent and buildable once the holes are named, and the extension is greenlit.

### BLOCKING (resolve in `weapons.md` before senior-architect lane assignment)

- **B1 — Discrimination-under-spread (Q2, the sharp one; pillar = veille §2.1 PILIER).** Multi-hit weapons (B sulfateuse cone, C éventail, D tromblon) must state that **every projectile landing on an innocent (courier/civilian) incurs the full existing innocent penalty** — the spread grants NO discrimination amnesty. Silent = spray dilutes the moral pillar (a held sulfateuse sweeping a window row past innocents). This is what keeps `Éviter` honest.
- **B2 — Spread vs the ONE-SHOT-ONE-TARGET hitscan model (ADR-0040).** Shipped `resolvePlayerShot` is **instant hitscan at a single crosshair world point** — "No travelling player projectile", window-hit priority, "only a MISS can hit a courier — the nearest single one (one shot = one target, D1.5)". The pre-spec describes weapons in projectile terms ("comment le projectile part du viseur", "dispersion ±2-3°"). Specify each weapon as **N hitscan resolutions at defined offset points**, and state how they interact with the window-hit-priority / courier-only-on-miss precedence. Undefined = dev guesses the core resolution.
- **B3 — "Portée réduite" (tromblon D) has no meaning in the current model.** Hitscan resolves at the crosshair world point; there is no depth/range axis on player fire. Either define a concrete range mechanic in the facade model or **remove the attribute**.
- **B4 — Full-auto "auto maintenu" (sulfateuse B) has no mobile expression (ADR-0003, controller contract).** Mobile fire is a **discrete** two-finger tap / one-finger double-tap queued one-per-frame (ADR-0003 D3/D5/D7) — there is no hold gesture, and §5.2.1 itself forbids a new binding. Specify the full-auto model for BOTH device classes without adding a binding (recommend **per-trigger burst**, not hold-auto), or the "zero new binding" claim is false. Also fix the citation: the controller contract is **ADR-0003**, not ADR-0015 (which is the device-forked tutorial script).
- **B5 — Weapon behavior during the cinematic QTEs is unspecified (coherence with two GATED specs: ADR-0034 hostage QTE, ADR-0051 boss QTE).** Those resolve shots via their own ring/zone classifiers (`tickQte` / `tickBossQte`), NOT `resolvePlayerShot`. State explicitly — recommended: **cinematic QTEs are weapon-agnostic / base-only; specials do not carry in and their stock is untouched (frozen) during the freeze.** Silent drift here is exactly what this gate exists to prevent.
- **B6 — Crate read contract (Q1): sound in principle, incomplete as an implementation contract.** A non-human OBJECT silhouette sits outside the human menace/innocent binary (art §2 law 3), so `LOOT ≠ ENEMY` is a valid READ claim. Before build the spec must pin: (a) loot is a **non-human silhouette in its own perceptual channel**, never confusable with a human innocent/menace; (b) resolve whether loot **shares the window-slot pop-up channel** with innocents/enemies — if it does, the discrimination pillar's < 0.3 s triage must be re-measured with loot present (competing "shoot / don't-shoot" read under pressure). Note the shipped discriminant is `EnemyKind` (already carries `civilian`/`bonus`) — architect decides new kind vs new entity. Hand the read to `lead-art` (§5.1) — do not arbitrate visuals.

### NON-BLOCKING (resolve in spec; do not block architect)

- **N1 — No-switch / auto-return (Q3, §5.2–5.3): coherent and well-grounded (Wild Guns/Metal Slug precedent), serves the loop.** Two pins: (a) §5.3.3 loss-on-death → confirm with `pm` against the lives system (recommend YES, Metal-Slug-consistent); (b) the "stock perdu on replace" trap needs a **measurable spawn-placement rule** (see W2), not "idéalement pas pile devant le viseur".
- **N2 — Ammo HUD vs guideline §6 ("la musique est le seul indicateur de tension").** The counter + 20 %-blink (§5.4.3) is a **resource readout, not a stress gauge** — same footing as the shipped timer/lives/score HUD, so no violation. State this explicitly so the blink stays a fuel gauge, never a tension surrogate.
- **N3 — Bombe E correctly YAGNI-deferred.** Carry the flag: "clears a row" most threatens the telegraph-duel fairness (erases telegraphed menaces wholesale) — a risk to price when/if revisited, not now.

### W-guardrails — anti-frustration ACs for `weapons.md` (the G-rule equivalent, Q4)

- **W1 — Glyph-before-fire:** the crate carries the weapon glyph legibly at reticle distance BEFORE the collecting shot (no blind pickup).
- **W2 — No accidental-loss trap:** crate spawn placement must not sit under the reticle path of an active engagement (measurable exclusion rule, not an adjective) — the Contra-capsule mitigation, made testable.
- **W3 — Empty-return feedback:** on stock→0, an audible (culasse à vide) + visible (HUD flash) cue fires the **same frame** as the auto-return; the player never discovers the return via a failed shot.
- **W4 — Base weapon never anxiety-metered:** ∞ symbol, no depleting counter, no red/blink on the base weapon.
- **W5 — Discrimination integrity under spread (= B1):** a spread projectile on an innocent incurs the full innocent penalty; no amnesty.
- **W6 — Telegraph fairness preserved (veille §2.2):** enemy telegraph timing (SHOOTING state → riposte) is **weapon-independent**; specials clear faster but never remove the duel's readable danger window.
- **W7 — Bounded special uptime:** ≤ 30–40 % mission time under a special (§4.2) — a **measured** `verify`-playtest AC, not a hope.
- **W8 — No new binding, both device classes (= B4):** acquisition and firing use only the existing fire gesture on desktop AND mobile (ADR-0003); no weapon requires a gesture mobile cannot express.

### If GO downstream

Formalize `docs/game-design/weapons.md` with B1–B6 resolved and W1–W8 as ACs (owner: `game-designer`/Sacha; re-gate here). Hand-offs stand: `pm` scope (A–D vs A–B–C; loss-on-death) · `lead-art` crate + glyph read (B6) · `ux-designer` HUD + mobile full-auto input (B4) · `narrative-designer` weapon names (fiction, not lore-locked). Round 1 of 2.

---

## stage-1b. SCOPE AMENDMENT ACK — pm (John) — 2026-07-20

- claim: P3 from design re-gate round 2 / release: AC A4 amended in `_bmad-output/planning-artifacts/story-weapons-pickup.md` — B (`auto`) stock decrements per burst-ROUND (consequence of the B4 per-trigger burst model), C (`spread`) stays per-press; pm ack logged inline, 2026-07-20. (Entry logged by orchestrator — shard write-race avoidance.)

---

## stage-1. SCOPE — pm (John) — 2026-07-20

- claim: V1 scope cut + story authoring (parallel to design gate; logged by orchestrator to avoid shard write race) / release: story written at `_bmad-output/planning-artifacts/story-weapons-pickup.md`, 4 rulings below
- VERDICT: PASS — pm scope: weapons V1 (pm)

**Rulings:**

1. **Roster V1 = A-B-C** (cuts the pre-spec's A-B-C-D recommendation). Bertrand's brief names two special fire types and says "1-2 spéciales"; shipping B+C+D at once breaks the pre-spec's own "one variable at a time" guardrail. Architecture reinforces the cut: shipped fire is instant hitscan (ADR-0040) — `auto` (B) is a trivial extension, `spread` (C) is one new unknown (multi-target resolution), `tromblon` (D) adds a second (range axis that doesn't exist). **D = fast-follow**, not killed. E stays YAGNI.
2. **Loss-on-death: NO for V1.** muf's lives model has no respawn (a hit decrements `lives`, run continues) — coupling weapon-loss to the same event stacks two penalties with zero playtest data, and couples otherwise-independent systems. Explicit regression AC (A7): a hit never touches `weapon.active`/`weapon.stock`. Revisit only if playtest shows special hoarding. (Overrides Karim's N1(a) lean — pm's call per gate protocol.)
3. **Rollout: Belliard-first, confirmed.** Crate is a generic spawn, not per-level scripted data.
4. **Out of V1:** sliding-container crate variant, weapon E, final weapon names/lore (placeholders fine), and **no FLUX art lane** — a drawn glyph placeholder (existing `GestureIcon`/`DiagramIcon` pattern) suffices unless lead-art's B6 read judges it illegible (then small fast-follow, not blocker).

**Flagged to senior-architect (not resolved here):** `spread`'s 3-simultaneous-target resolution vs the current "0-or-1 `impactEvents` per tick" invariant; `LOOT` pickup must stay outside the `ARCHETYPES`/score-lives path (a crate hit never produces stray score/life deltas).

---

## stage-2. FORMALIZE SPEC — game-designer (Sacha) — 2026-07-20

- claim: formalize the gated pre-spec into `docs/game-design/weapons.md` (round-2 prep) — B1–B6 resolved, W1–W8 baked as ACs, bound to pm rulings #1–#4 / release: spec written; awaiting `lead-game-designer` round-2 gate (no VERDICT line — I hold no gate)
- **Files:** `docs/game-design/weapons.md` (new). Read-only inputs: `docs/game-design/pre-spec-weapons.md`, `_bmad-output/planning-artifacts/story-weapons-pickup.md`, `src/game/systems/stateMachine.ts` / `bulletSystem.ts` / `courierSystem.ts` / `maps/facade01.ts`, ADR-0003/0034/0040/0051. No pre-spec/shard/code edits.
- **B1–B6 resolved:** B1 full innocent penalty per resolution, no spread amnesty (§3/AC5). B2 each weapon = N hitscan resolutions at deterministic offsets, window-priority + courier-only-on-miss per point (§2). B3 resolved-by-descope (D out of V1; re-answer if D ships). B4 per-trigger burst for B (no hold, identical desktop/mobile, zero binding) + ADR-0015→**ADR-0003** citation fix (§2.3). B5 QTEs weapon-agnostic/base-only, special stock frozen (§4/AC6). B6 LOOT own non-human channel + glyph-before-fire + testable spawn-exclusion `|loot.col−a.col|≥2` + off score/lives path, read to lead-art (§5).
- **Flags:** C's multi-`impactEvents` widening + LOOT-off-score-path → senior-architect (ADR-0052). B-stock-unit (round vs press) refines pm story AC A4 for `auto` as a B4 consequence — within the A-B-C envelope, flagged for pm/architect visibility. Hand-offs stand: lead-art (crate/glyph read), ux-designer (HUD desktop+mobile), narrative-designer (weapon names).

---

## stage-2. DESIGN GATE ROUND 2 — lead-game-designer (Karim) — 2026-07-20

- claim: round-2 (final, bounded-iteration cap) re-gate of `docs/game-design/weapons.md` — verify B1–B6 genuinely resolved (not hand-waved), W1–W8 baked as verifiable ACs, pm rulings #1–#4 respected, no scope creep beyond A-B-C, burst/stock-unit refinement sound; resolution-model claims cross-checked against `bulletSystem.ts`/`stateMachine.ts` + ADR-0040/0003/0034/0051 / release: **PASS** with 3 pinned corrections (P1–P3) the senior-architect/dev/pm must honour; advances to senior-architect lane assignment + ADR-0052.
- VERDICT: PASS — design gate round 2: weapons.md formalized spec (lead-game-designer)

**PASS (final round).** Clean enough to advance: the six blocking corrections are genuinely resolved (not restated), the eight guardrails are numbered verifiable ACs, and every pm ruling is honoured. Residual holes are small and pinned as corrections downstream must honour — none structural, so no escalation packet.

**Blocking set — verified genuinely resolved (not hand-waved):**

- **B1** ✓ — §3 + AC5: full civilian penalty computed **per resolution** through the unchanged `resolveCourierShot`; a low burst charges up to `BURST_ROUNDS` penalties, a low éventail press up to 3. No amnesty rule anywhere. Keeps `Éviter` honest.
- **B2** ✓ — §2: each weapon = N independent hitscan resolutions at deterministic offsets, each running window-priority **then** courier-only-on-miss individually. Grounded verbatim on ADR-0040; cross-checked against `resolvePlayerShot` (nearest-eligible-within-`HIT_RADIUS=0.8`, tie→lowest `slotIndex`) — accurate.
- **B3** ✓ — resolved-by-descope (D out of V1, pm #1); no depth/range axis invented. Flag correctly carried: re-answer only if D ships. This is exactly the round-1 "remove the attribute" branch.
- **B4** ✓ — §2.3 per-trigger burst: one tap = one burst, no hold gesture, identical desktop/mobile, zero new binding (**W8**). Citation fixed ADR-0015→**ADR-0003** throughout. Expressible under the discrete-tap model.
- **B5** ✓ — §4 + AC6: QTEs weapon-agnostic/base-only, `weapon.active`/`weapon.stock` frozen. Verified against `stateMachine.ts`: both QTE branches early-return via `...state` through their own `tickQte`/`tickBossQte` classifiers — the weapon fields ride `...state` untouched. Accurate.
- **B6** ✓ — §5 + AC7-loot/AC8/AC9: LOOT = non-human silhouette in its own channel (R1), glyph-before-fire (R2/W1), **shares** the window channel with an explicit <0.3 s triage re-measure (R4), testable spawn-exclusion `∀ active slot a: |loot.col−a.col| ≥ 2` (W2), off the `ARCHETYPES`/score-lives path. Read handed to `lead-art`, not arbitrated. Column-pitch grounding (2.0 u = `col*2-18`) verified against `facade01.ts`.

**W1–W8 as verifiable ACs:** W1→AC8, W2→AC9, W3→AC10, W4→AC11, W5→AC5(=B1), W6→AC12, W7→AC13, W8→AC3. All eight present and testable. ✓

**pm rulings:** #1 A-B-C only (D fast-follow, E YAGNI) — roster §1 holds, no fourth weapon. #2 NO loss-on-death → AC14/A7 regression (my round-1 N1(a) lean stands overridden — accepted). #3 Belliard-first — §7 measures there. #4 no FLUX, drawn glyph placeholder — §5.1. All respected. ✓

**Scope:** no creep beyond A-B-C. C's up-to-3-`impactEvents`/tick is an in-scope consequence of `spread` existing (already flagged to architect), not a new feature. No switch, no inventory, no meta-layer. ✓

**Burst/stock-unit refinement:** SOUND. Once B4 makes B a burst weapon, the atomic consumable is the round (per-press would just indirect through "6 rounds/press" and falsify "burns fast"). C correctly stays per-press. It is a downstream consequence of MY gate-mandated B4, not designer overreach — legitimate. But it does edit a pm-authored AC (A4), hence P3.

### PINNED CORRECTIONS (PASS is conditioned on these; honour downstream, no re-gate)

- **P1 (→ senior-architect, ADR-0052).** §8's summary line "courier resolution … inherited unchanged" **understates C**: per §2.4/AC5, C invokes courier-only-on-miss **per-offset — up to 3× per tick** at 3 distinct world points, whereas shipped `stateMachine.ts` runs it **once** on the single shot's miss (lines 319–325). Architect must price the courier-resolution loop-widening **alongside** the `impactEvents` widening in ADR-0052, not just the latter. Design intent is unambiguous in §2.4; only §8's rollup is loose.
- **P2 (→ senior-architect + dev-gameplay).** Mid-burst / multi-resolution **crate-equip ordering is unspecified.** §5.2 ("equip takes effect from the next trigger") assumes a single-resolution trigger; it is silent on a **burst round or éventail barrel that lands on a `VISIBLE` crate**. Pin: a resolution that equips a crate takes effect immediately and **aborts any remaining burst rounds that tick** (the old special's in-flight burst stops; equip cannot be undone). If the dev prefers "burst completes on the old weapon, equip from next trigger," that is acceptable **only if chosen explicitly** in ADR-0052 — never left to guess. Narrow (spawn-exclusion §5.4 makes it rare), so a pin, not a FAIL.
- **P3 (→ pm, one-line ack, not a re-gate).** The B stock-unit change (round, not press) **amends pm story AC A4.** It is a legitimate consequence of the gate-mandated B4 burst model — A4 was written under the superseded "faster-cooldown base" reading — but it edits a pm-authored AC, so pm gets an explicit one-line acknowledgment before the story text is treated as final. No design content is in question.

**Hand-offs stand (unchanged from round-1 formalize):** `lead-art` (crate R1–R4 + A/B/C glyphs), `ux-designer` (HUD desktop+mobile, ADR-0003), `narrative-designer` (weapon names — placeholders, not lore-locked), `senior-architect` (ADR-0052 + §8 contract delta, now incl. P1/P2). Round 2 of 2 — cap reached, gate closed PASS.

---

## stage-3. TECH PLAN + ADR — senior-architect (Winston) — 2026-07-20

- claim: TECH PLAN + ADR-0052 (number reserved by producer), boundary/contract analysis, lane cut for dev-gameplay ∥ dev-r3f-render / release: **ADR-0052 written** (`docs/adr/0052-weapons-pickup-system.md`, Accepted); lanes assigned below; PARALLEL-SAFE after the type seam lands. **No escalation** — the gated spec is buildable within the boundary law; no contract analysis surfaced a contradiction with `weapons.md`.
- VERDICT: PASS — tech plan: weapons pickup system (senior-architect)

**ADR-0052 decisions (summary):** D1 `weapon: WeaponState` + transient `weaponEmpty?` on GameState; `WEAPON_SPECS` data table in `types/weapon.ts` (ARCHETYPES precedent). D2 N-resolution via new pure `weaponSystem.resolveTrigger` folding 1..3 resolutions sequentially (left→centre→right, threading enemies + couriers), reusing the extended `resolvePlayerShot` primitive. **P1 priced:** courier-on-miss moves into the per-offset fold → up to 3 `resolveCourierShot`/tick (was 1), threaded so no courier is double-hit. D3 `impactEvents` invariant widened 0-or-1 → 0-to-3 — **render is already N-safe** (bridge loops; `ImpactEffects` drains the queue into pools of 12), so **zero render-consumer change** for multi-impact. D4 B = per-trigger burst as pure tick state (timer-accumulator, ≤1 round/tick, no `pendingShots` coupling, no new binding). **D5 LOOT = NEW ENTITY, not a weight-0 `EnemyKind`** — structurally off the `ARCHETYPES`/score-lives path (AC7-loot cannot regress); own `lootSystem` + §5.4 spawn-exclusion predicate. **P2 decided:** an equipping resolution takes effect immediately and aborts remaining burst rounds that tick; within a C press, multiple crate hits → right-most (last-resolved) wins; equip from next trigger. D7 QTE freeze satisfied by construction (`weapon` rides `...state`). D8 Belliard-first via optional `LevelConfig.loot` (absent ⇒ every shipped level byte-identical).

### LANE ASSIGNMENT (claim/release format; run in parallel AFTER the type seam)

**Shared seam (Lane A writes FIRST, then both fan out):** the type contract —
`src/game/types/weapon.ts` (NEW: `WeaponKind`, `WeaponSpec`, `WeaponState`, `WEAPON_SPECS`),
`src/game/types/loot.ts` (NEW: `LootCrate`, `LootState`, `LootSpec`), and the `GameState` field
additions in `src/game/types/gameState.ts` (`readonly weapon: WeaponState`, `readonly loot:
LootCrate | null`, `readonly weaponEmpty?: boolean`, widen the `impactEvents` comment). These are
all `src/game/` files → **owned by Lane A**. Lane B only _imports_ the types (read-only). Rule:
**Lane A lands the seam (types + field defaults, tsc green) before Lane B consumes the names.**
No file is edited by both lanes — the seam is a types-first handshake, not a shared file.

**Lane A — `dev-gameplay` (`src/game/**` only, TDD):\*\*

- `src/game/types/weapon.ts` (NEW) — seam.
- `src/game/types/loot.ts` (NEW) — seam.
- `src/game/types/gameState.ts` (EDIT) — seam fields + `impactEvents` comment widening.
- `src/game/systems/weaponSystem.ts` (NEW) — `resolveTrigger`: offset list per weapon, sequential
  fold threading enemies+couriers, burst scheduling (D4), stock decrement, auto-return +
  `weaponEmpty` on 0 (§6.1), equip-on-loot ordering (P2 / D6).
- `src/game/systems/lootSystem.ts` (NEW) — pure crate spawn (§5.4 exclusion predicate) + tick.
- `src/game/systems/bulletSystem.ts` (EDIT) — extend `resolvePlayerShot` to a single-point
  primitive over enemies ∪ {VISIBLE crate}, discriminated outcome (`enemy-hit`|`loot-hit`|`miss`);
  return `impacts` list shape.
- `src/game/systems/stateMachine.ts` (EDIT) — seed `weapon`+`loot` in `createInitialState`
  (from `LevelParams.loot`); replace step-4 shot + step-7b courier resolution with a single
  `weaponSystem.resolveTrigger` call; loot spawn/tick wiring; `LevelParams.loot` gate.
- `src/game/levels/levels.ts` (EDIT) — optional `LevelConfig.loot?: LootSpec`; Belliard opts in.
- `src/game/systems/__tests__/{weaponSystem,lootSystem}.test.ts` (NEW) +
  `stateMachine.test.ts` (EDIT: AC1-AC15 regressions — esp. AC7-loot no score/lives, AC14 hit
  never touches weapon, AC9 spawn-exclusion, AC10 same-tick auto-return + one `weaponEmpty`).

**Lane B — `dev-r3f-render` (`src/render/**` + view bridge only):\*\*

- `src/render/scene/LootCrate.tsx` (NEW) — crate in its window slot: **drawn glyph placeholder**
  (`GestureIcon`/`DiagramIcon` DOM pattern, no FLUX), glow while `VISIBLE`; reads `GameState.loot`.
- `src/render/scene/GameScene.tsx` (EDIT) — mount `LootCrate`, pass `loot` state.
- `src/render/ui/HUD.tsx` (EDIT) — active-weapon glyph, special stock counter/pips, ∞ for base
  (no counter/red/blink ever, AC11), last-~20% blink, `weaponEmpty` flash. All derived from
  `GameState.weapon` + `weaponEmpty` — no game rule in render.
- `src/hooks/useGameLoop.ts` (EDIT) — drain the new transient `weaponEmpty` per-frame (like
  `impactEvents`) to a HUD/audio channel; wire the empty-return SFX cue (reuse an existing SFX,
  no new asset). **NB: the multi-impact path needs NO change (D3).**

**Parallel-safe verdict:** Lane A = `src/game/**` (+`levels.ts`); Lane B = `src/render/**` +
`src/hooks/useGameLoop.ts`. Disjoint. The only cross-lane dependency is Lane B importing the new
types. **Sequencing:** (1) Lane A publishes the type seam (files above with default field values,
tsc green); (2) Lanes A and B run fully in parallel. Not parallel-safe _before_ the seam lands
(Lane B has no type names to import).

**Downstream (unchanged):** `ux-designer` HUD layout (desktop+mobile, ADR-0003) reconciled before
ship; `lead-art` crate/glyph read (R1-R4) — fast-follow if placeholder illegible, not a V1 blocker;
`narrative-designer` weapon names. P3 (B stock-unit) is pm-owned and already ack'd in the story.

---

## stage-4. DEV LANE A — dev-gameplay (Amelia) — 2026-07-20

- claim: Lane A (`src/game/**`) — implement the pure weapon+loot core per ADR-0052 (D1-D8),
  TDD / release: **DONE, all green** (tsc 0, lint 0, vitest 856 passed — 816 baseline + 40 new).
  No deviation from ADR-0052; every frozen decision (D1-D8, P1/P2) built as written.
- VERDICT: PASS — dev-gameplay: weapon+loot pure core (Lane A)
- **Branch:** `claude/features-a-implémenter-ehw9q4` (3 commits; orchestrator pushes).
- **Commits:** (1) `feat(game): weapon+loot type seam (ADR-0052 D1)` — types + GameState fields,
  tsc green, byte-identical passthrough. (2) `feat(game): weaponSystem + lootSystem, N-resolution
hitscan (ADR-0052 D2-D6)` — pure systems + unit tests. (3) `feat(game): wire weapon+loot into
tickGameState, Belliard opts in (ADR-0052 D7/D8)` — integration + levels + AC regressions.
- **Decisions as-built:** D1 `weapon: WeaponState` + `loot`/`lootSpec`/`lootTimer` + transient
  `weaponEmpty?` on GameState; `WEAPON_SPECS` (§7) in `types/weapon.ts`. Added `lootSpec`+`lootTimer`
  GameState fields (beyond the ADR's enumerated seam) — the necessary spawn-cadence bookkeeping,
  strictly parallel to the shipped `deliverySpec`/`courierTimer` precedent (NOT a semantic
  deviation). D2 `resolveTrigger` folds 1..3 resolutions L→C→R threading enemies+couriers, reusing
  the extended `resolvePlayerShot` (discriminated `enemy-hit|loot-hit|miss`). D3 `impactEvents`
  0-to-3 (comment widened; loot-hit emits NO impact — its own render channel). D4 burst =
  timer-accumulator tick state, threshold-based (≤1 round/tick; first round on the first
  ≥`BURST_INTERVAL_MS` crossing, matching the ADR wording). D5 LOOT = new entity, off
  ARCHETYPES/score-lives by construction. D6/P2 mid-burst equip aborts the burst, right-most crate
  wins (single-crate model ⇒ ≤1 loot-hit/press in practice). D7 QTE freeze by construction
  (weapon/loot ride `...state`; `weaponEmpty` cleared in every early-return). D8 Belliard-first via
  optional `LevelConfig.loot` (shipped no-loot levels byte-identical; asserted).
- **AC coverage (Vitest):** AC1/2 (base ∞, 1@0), AC3 (burst, no new binding, further-fire ignored,
  refractory), AC4 (3@±2, per-press stock), AC5 (per-resolution courier penalty ×N, no amnesty +
  courier threading no-double-hit), AC6 (QTE freeze — weapon ref-identical, no crate), AC7-loot
  (equip, zero score/life/kills), AC8 (equip next-trigger), AC9 (`|Δcol|≥2` predicate + defer),
  AC10 (same-tick auto-return + one `weaponEmpty`, cleared next tick), AC14/A7 (a hit never touches
  weapon), AC15 (pure, no React/Three). Tuning values (§7) all traced in code comments.
- **File List:** `src/game/types/weapon.ts` (NEW), `src/game/types/loot.ts` (NEW),
  `src/game/types/gameState.ts`, `src/game/systems/weaponSystem.ts` (NEW),
  `src/game/systems/lootSystem.ts` (NEW), `src/game/systems/bulletSystem.ts`,
  `src/game/systems/stateMachine.ts`, `src/game/levels/levels.ts`,
  `src/game/systems/__tests__/{weaponSystem,lootSystem,bulletSystem,stateMachine}.test.ts`.
- **Lane B handshake:** the type seam is live — `WeaponState`/`WeaponKind`/`LootCrate`/`LootState`
  are importable; `GameState.weapon`/`.loot`/`.weaponEmpty` populated each tick. Lane B still owns
  the `weaponEmpty` per-frame bridge drain in `useGameLoop.ts` and the `LevelConfig.loot →
LevelParams.loot` mapping in `App.tsx buildLevelParams` (App.tsx is render lane; not touched here).

---

## stage-4. DEV LANE B — dev-r3f-render (Amelia) — 2026-07-20

- claim: Lane B (`src/render/**` + view bridge) — render the weapon+loot core per ADR-0052 D8
  (crate visual, HUD glyph/stock/blink/flash, `weaponEmpty` bridge drain, `LevelConfig.loot`
  mapping) / release: **DONE, all green** (tsc 0, lint 0, `format:check` clean, vitest 860 passed
  — 856 baseline + 4 new render-derivation cases). No deviation from ADR-0052 / the gated spec.
- VERDICT: PASS — dev-r3f-render: weapon HUD + LOOT crate + bridge (Lane B)
- **Branch:** `claude/features-a-implémenter-ehw9q4` (2 commits; orchestrator pushes).
- **Commits:** (1) `feat(render): weapon HUD readout + LOOT crate + weaponEmpty bridge (ADR-0052)`
  — the crate scene sprite, the HUD weapon readout, the bridge drain + `LevelConfig.loot` mapping.
  (2) `docs(handoff): log dev-r3f-render stage-4 lane (weapons pickup)`.
- **What the crate looks like (D5/§5.1, W1/R1-R3):** a code-drawn glyph PLACEHOLDER (no FLUX, pm
  ruling #4) — a boxy ammo crate (non-human OBJECT silhouette: rounded-rect body + lid band +
  diagonal cross-brace) drawn onto a `CanvasTexture` on a plane, seated in its window slot
  (`loot.slotIndex`). Dark body, thick **neon-yellow outline** = "ce qui brille est interactif"
  (R3), with a **big neon A/B/C glyph** baked centre (R2/W1 — legible at reticle distance BEFORE
  the collecting shot). Paper-Mario unfold on APPEARING (scale-Y 0→1, matching the enemy pop-up),
  a pulsing additive halo behind it while VISIBLE. renderOrder 4 (window-occupant), depthWrite off
  like every other transparent quad. One crate ever (`loot` is single|null) ⇒ mounted once in
  `GameScene`, hides on `null`/`HIDDEN`.
- **What the HUD looks like (§6.2, W3/W4/AC10/AC11):** a new `WeaponReadout` cell on the ticker
  strip (thin-composition widget, ADR-0046) — a print-idiom (ink, ZERO glow) `arme` cell showing
  the **A/B/C glyph** + stock. `base` renders the **∞** symbol, full-black ink, **no counter, no
  red, no blink, ever** (W4/AC11). A special renders its numeric stock; the **last ~20 % blinks**
  in pink marker ink (`isLowStock` reads the start-stock denominator from the game's `WEAPON_SPECS`
  — never a hardcoded rule copy; the 0.2 ratio is a HUD legibility constant). On the empty tick a
  one-shot **marker-ink empty-flash** washes the cell the SAME frame as the auto-return (W3/AC10),
  re-keyed off the drained `weaponEmpty` nonce (mirrors App's lifeFlash pattern). Both animations
  freeze under `prefers-reduced-motion`.
- **Bridge (`useGameLoop.ts`):** drains the transient `weaponEmpty` per frame → bumps a monotonic
  HUD `weaponEmptyNonce` (same-frame flash) AND fires the audible culasse-à-vide cue; the weapon
  glyph/stock flow into `HudData.weapon`, added to the change-detection (equip / burst-round
  decrement / auto-return all push). Multi-impact path unchanged (D3 — already N-safe).
- **AUDIO — missing asset noted (CI-side):** the culasse-à-vide cue reuses the shipped **`death`
  SFX slot** for V1 (spec §6.1 explicitly permits an existing SFX). Reason: adding a dedicated
  `empty` slot would require editing `src/game/systems/audioSystem.ts` (Lane A / off-limits to this
  lane) — the SFX name union lives there. **Fast-follow:** a dedicated `assets/audio/empty.*`
  culasse-à-vide asset + a one-line `"empty"` slot in `audioSystem.ts` (owner: sound-designer +
  dev-gameplay). The same-frame HUD flash (fully in-lane) is the primary, unmistakable cue, so W3
  holds today; the audio is reinforcement.
- **DEVIATION note (minor, in-lane, no frozen decision touched):** `hud/derivations.ts` — the
  `INK,MARK` import was switched from the `@render/ui/print` barrel to the leaf `../print/tokens`
  module. The vitest resolver carries `@game`/`@hooks` but NOT `@render`, and the barrel drags in
  print COMPONENTS that use the alias — so a barrel/alias import broke this folder's new tests. Now
  matches the tested `menu/derivations.ts` convention (relative leaf import). App build unaffected
  (vite has `@render`). No behaviour change.
- **File List:** `src/render/scene/LootCrate.tsx` (NEW), `src/render/scene/GameScene.tsx` (mount),
  `src/render/ui/hud/WeaponReadout.tsx` (NEW), `src/render/ui/hud/WeaponReadout.module.css` (NEW),
  `src/render/ui/hud/types.ts` (`HudWeapon` + `weapon`/`weaponEmptyNonce`), `src/render/ui/hud/derivations.ts`
  (`weaponGlyph`/`isLowStock`/`LOW_STOCK_FRACTION` + leaf-import fix), `src/render/ui/HUD.tsx` (mount),
  `src/hooks/useGameLoop.ts` (bridge drain + HUD weapon fields), `src/render/scene/App.tsx`
  (`LevelConfig.loot → LevelParams.loot`, initial-HUD weapon seed),
  `src/render/ui/hud/__tests__/derivations.test.ts` (NEW).
- **Downstream:** `ux-designer` HUD-layout reconcile (desktop+mobile) + `lead-art` crate/glyph read
  (R1-R4) stand as gated fast-follows if the placeholder reads poorly — not V1 blockers.

---

## stage-5. QUALITY GATE — qa-lead (Inès) — 2026-07-20

- claim: stage-5 VERIFY / quality gate — static gate (tsc/vitest/lint/format) + AC sweep of
  weapons.md §9 (AC1–AC15) mapped to named tests + runtime evidence on Belliard (headless
  Chromium, SwiftShader, `__MUF_PLAY__` seam) + regression hunt (no-loot byte-identity, QTE
  freeze, `impactEvents` 0-to-3 render consumers, P1 courier loop-widening, LOOT off score-path)
  / release: **PASS**. Test plan + full verdict at `docs/qa/plan-story-weapons-pickup.md`;
  evidence PNGs at `docs/qa/evidence/weapons-pickup/`. No production code touched (iron rule).
- VERDICT: PASS — quality gate (qa-lead)
- **Static gate:** tsc 0 errors · vitest **860 passed / 67 files / 0 failed / 0 unexpected-skip**
  (read, not asserted) · lint clean · `format:check` clean.
- **AC coverage:** 13 VERIFIED-BY-TEST (AC1–AC11, AC14, AC15; 5 also carry runtime evidence:
  AC1/AC7-loot/AC8/AC9/AC11) · 1 VERIFIED-BY-INSPECTION (AC12 — `enemySystem.ts` has zero weapon
  references, so the telegraph cadence is weapon-independent by construction) · 1
  MANUAL-PLAYTEST-NEEDED (AC13 / W7 ≤40 % special uptime — `game-designer`'s measured playtest,
  stock is `verify`-tunable/not gated; escalated via producer, does NOT block this gate).
- **Runtime evidence (Belliard, no page errors):** `a-hud-base-infinity.png` (HUD "A ∞",
  weapon=base/∞) · `b-loot-crate-visible.png` (VISIBLE crate, neon box + legible "C" glyph BEFORE
  the shot — W1/R1/R3) · `c-hud-special-equipped.png` (HUD "C 30" post-pickup, SCORE 0000 / ♥♥♥ —
  crate hit = zero score/lives, AC7-loot confirmed at runtime).
- **Regression:** no-loot byte-identity (D8) PASS · QTE freeze (D7) PASS · `impactEvents`
  0-to-3 render consumers (D3) PASS with **zero** render change (bridge drains a list loop;
  ImpactEffects splices into pools of 12) · `weaponEmpty` bridge drain PASS · P1 courier
  loop-widening (≤3/tick, threaded, `courierField` short-circuit intact) PASS · LOOT off
  `ARCHETYPES`/score-lives (D5) PASS.
- **Non-blocking observations (documented V1 concessions, owners named — NOT gate failures):**
  Obs-1 culasse-à-vide reuses the `death` SFX slot (spec §6.1 permits; HUD flash is the primary
  cue so W3/AC10 hold) — dedicated `empty` asset/slot fast-follow, owner `sound-designer` +
  `dev-gameplay`; audibly identical to the death cue is a minor UX note. Obs-2 crate is a
  code-drawn placeholder (pm ruling #4) — `lead-art` R1–R4 read is a gated fast-follow.
- **No FAIL cases.** Sibling verdicts still required at stage 5: `game-designer` conformity
  playtest (incl. AC13 uptime measure), `ux-designer` HUD reconcile (desktop+mobile), `lead-art`
  crate/glyph read.
- **Files (mine only, under docs/qa/):** `docs/qa/plan-story-weapons-pickup.md` (NEW),
  `docs/qa/evidence/weapons-pickup/{a-hud-base-infinity,b-loot-crate-visible,c-hud-special-equipped}.png`
  (NEW).

---

## stage-5. VISUAL READ (crate R1–R4) — lead-art (Nico) — 2026-07-20

- claim: stage-5 visual gate of the LOOT-crate read contract (R1–R4) for V1 — the code-drawn
  placeholder `src/render/scene/LootCrate.tsx`, judged on the runtime composite
  (`docs/qa/evidence/weapons-pickup/b-loot-crate-visible.png`), against `docs/art-direction.md`
  §2 (three laws) + §2.1 (loi du glow, « un halo est un dégradé, jamais un aplat ») + Gate 4
  (composite). pm ruling #4 honoured: I gate the READ, not the render technique; no code touched.
- VERDICT: PASS — lead-art crate read (lead-art)

**PASS on the crate READ — with ONE BLOCKING composite correction on R3's glow (owner
`dev-r3f-render`) that must land before merge, and two fast-follows.** The placeholder does its
V1 design job: at game size (verified on a 4×/8× crop of the VISIBLE-state evidence) the crate is
an unmistakable non-human object carrying a legible weapon glyph, and it does not degrade the
menace/innocent triage. It is NOT a V1 read blocker (pm #4). But the runtime GLOW as shipped is an
aplat, and §2.1 is a law I own at Gate 4 — so the composite sign-off is withheld until the falloff
halo is evidenced. Ruling per requirement:

- **R1 — PASS (§2 law 3, own channel).** The silhouette is a squat rounded-rect box with a lid
  band + diagonal cross-brace: categorically a non-human OBJECT, sitting outside the human
  menace/innocent binary. In the same slot row it is instantly separable from the two human
  enemy figures beside it (shape is the dominant, <0.3 s separator). Confirmed at game size.
- **R2 — PASS (W1, glyph-before-fire).** The "C" is large, centred, high-contrast bright glyph
  over the dark body with a dark keyline — legible at reticle distance BEFORE the collecting
  shot, both in the native frame and the crop. No blind pickup.
- **R4 — PASS (shared window channel, triage survives).** Because the box read is
  shape-categorical, the third read (loot = shoot-to-equip) does not collide with the
  human-silhouette menace/innocent triage; the object channel is distinct. (The instrumented
  <0.3 s re-measure with loot present is qa/`game-designer`'s composite-gate measurement; my
  visual read says the channel separation holds.)
- **R3 — reads interactive (PASS as READ), BUT composite glow FAILS §2.1 — BLOCKING.** The crate
  does read as interactive: it carries a neon rim, so "ce qui brille est interactif" is
  satisfied at the read level. However, on the real VISIBLE-state screenshot the ONLY glow that
  lands is the hard-edged baked yellow OUTLINE — a constant-opacity band cut to nothing, i.e. an
  **aplat / decal**, exactly the §2.1 automatic-FAIL mode. The coded additive falloff halo
  (radial gradient, `0.7→0.28→0`, pulsing) does **not** read in the evidence: a horizontal +
  vertical pixel scan around the crate shows no monotonic yellow falloff bleeding outward — into
  the dark region below the crate the values stay cool (B ≥ R,G), i.e. no additive-yellow halo,
  and against the bright facade any contribution is at best a marginal warm tint, nowhere near a
  luminous dégradé. Contrast the enemy orange rims in the same frame, which bloom with visible
  falloff. Per Gate 4 (« if the composed visual never lands in a screenshot you can Read, it has
  NOT been gated — withhold PASS until it does ») and the ADR-0011 precedent this gate exists to
  close, I **withhold the composite sign-off**. Fix (owner `dev-r3f-render`, single-lane): make
  the halo actually read as a monotonic falloff-to-zero over the crate edge in-game (raise its
  additive contribution / gate it so it survives a bright facade, and/or give the rim itself a
  falloff instead of a flat stroke), then re-shoot a VISIBLE-state screenshot for my composite
  verdict. Blocking, not fast-follow: §2.1 aplat is an automatic FAIL on the same footing as a
  menu that glows.

**Fast-follows (NOT blocking V1):**

1. **Hue — `#ffe600` yellow is off the §2.1 palette (owner `concept-artist`/`lead-art`, art-quality
   pass).** The four hex-anchored in-world accents are orange/cyan/magenta/green; yellow is not
   among them, and it collides with the crosshair/control yellow already on screen (aim
   affordance vs world pickup). The shape read carries V1, but the art-quality pass should move
   the crate onto a sanctioned/deliberately-reserved loot hue — distinct from both the enemy
   orange and the reticle yellow — and anchor it in data, not a hardcoded literal.
2. **Art-quality FLUX pass (owner `concept-artist`, fast-follow per pm #4).** The code-drawn box
   is a legible placeholder; the on-direction xerox/fanzine crate sprite is the deferred quality
   pass. Not a V1 blocker.

- **Evidence read:** `docs/qa/evidence/weapons-pickup/b-loot-crate-visible.png` (VISIBLE crate +
  two orange-rimmed enemies same row). **Source inspected (read-only):**
  `src/render/scene/LootCrate.tsx`. No code or `levelArt.json` touched.

---

## stage-5. DESIGN CONFORMITY PLAYTEST — game-designer (Sacha) — 2026-07-20

- claim: stage-5 conformity verification of the BUILD against my gated spec `docs/game-design/weapons.md` — the six conformity checks (tuning traceability, burst model, éventail offsets, spawn-exclusion, penalty routing, AC13/W7 analytic bound) traced through `types/weapon.ts` / `weaponSystem.ts` / `lootSystem.ts` / `levels.ts` + cross-read against qa-lead's runtime evidence (Belliard, `__MUF_PLAY__` seam) / release: **PASS** — zero silent value drift, all four structural mechanics built as specced; AC13 analytic bound recorded below (the human uptime measure stays escalated to Bertrand).
- VERDICT: PASS — design conformity playtest (game-designer)

**Checks (all conform):**

1. **Tuning traceability — EXACT, no drift.** Every `WEAPON_SPECS` constant matches weapons.md §7 byte-for-byte: `base` {stock ∞, offsets [0], no cooldown}; `auto` {stock **120**, burstRounds **6**, burstIntervalMs **90**, refractoryMs **150**, offsets [0]}; `spread` {stock **30**, offsets **[-2,0,2]**, refractoryMs **300**}. Runtime evid `c` shows "C 30" = spread startStock 30 confirmed on the built HUD.
2. **Burst model — conform.** `weaponSystem.ts` L73-87/L161-178: trigger arms `burstRemaining=6`; rounds fire on `burstTimerMs>=90` interval crossings, **≤1 round/tick** (single `if`, timer decremented once, not a while-drain); **stock −1 per round** (per-round, not per-press — the B4 refinement); post-burst `refractoryMs=150` blocks re-trigger; further fire mid-burst ignored; empty-mid-burst ends burst + auto-returns to base + `weaponEmpty` same tick. Matches §2.3/AC3.
3. **Éventail offsets — conform.** `[-2,0,2]` = façade column pitch (`col*2-18`), 3 adjacent columns; disc radius 0.8, inter-offset gap 2.0 > 1.6 ⇒ no self-overlap (no double-billing). Matches §2.4 "2-3 fenêtres" intent at the real pitch.
4. **Spawn-exclusion — conform.** `canSpawnLootAt` = `activeCols.every(a => |col−a| >= LOOT_SPAWN_MIN_COL_GAP)` with `LOOT_SPAWN_MIN_COL_GAP=2`; `activeEnemyCols` filters exactly APPEARING∪VISIBLE∪SHOOTING; unsatisfiable ⇒ deferred (never force-placed). Exactly §5.4/AC9.
5. **Penalty routing — conform, no amnesty.** `weaponSystem.ts` L133-142: on each MISS in the offset fold, `resolveCourierShot` runs at THAT offset's impact point and its `scoreDelta`/`livesDelta` are **summed** (not capped/reduced) — up to 3 full civilian penalties per spread press, up to BURST_ROUNDS per burst. Unchanged `resolveCourierShot`. Matches §3/AC5.

**AC13 / W7 analytic bound (≤30-40 % special uptime) — the stage-5 record:**

Belliard mission = **90 s**; crate spawn cadence = **15 s** (`levels.ts` `loot.spawnIntervalSeconds`); pool `[auto,spread]`. Wall-clock to empty a stock at max fire rate: **B ≈ 13.8 s** (20 bursts × [6×90 ms fire + 150 ms refractory] = 20×690 ms; "10.8 s of fire" excl. refractory, per §7), **C ≈ 9 s** (30 presses × 300 ms cooldown floor). First crate reachable ~t=15 (16.7 % of the mission is necessarily base-only up front), leaving ~75 s with ~5 collectable crates at the 15 s cadence.

**Verdict: >40 % uptime IS structurally possible** with the current tuning — the 15 s spawn cadence is SHORTER than a continuously-fired burn (B 13.8 s / C 9 s), so an aggressive collector who burns each crate immediately reaches ≈50 % (C-only) to ≈76 % (B-only) of a 90 s run under a special. The numbers do **not** guarantee W7; the ≤40 % bound relies entirely on **collection friction that is NOT in the tuning table**: §5.4 pushes crates to façade edges away from centre engagement, only one crate exists at a time, and the VISIBLE pickup window is 4.0 s — so realistic uptime is materially below the structural ceiling (qa-lead's runtime capture needed a deliberate edge camera-pan to collect a single crate). **This is a tuning-risk flag, not a conformity defect** — §7 states the values are `verify` starting points, not gated, and W7's remedy is "tune stock down". If the human Belliard measure (escalated to Bertrand) reads >40 %, the one-variable lever is `auto` stock 120→lower and/or `spread` stock 30→lower and/or `loot.spawnIntervalSeconds` 15→higher. No spec change required.

- **Read-only inputs:** `docs/game-design/weapons.md`, `docs/qa/plan-story-weapons-pickup.md` + evidence PNGs, this shard's stage-4 lanes, `src/game/types/weapon.ts`, `src/game/systems/{weaponSystem,lootSystem}.ts`, `src/game/levels/levels.ts`. No code or spec modified (iron rule). Reported to `lead-game-designer` (Karim) ahead of the architect integration review.

---

## stage-5. UX REVIEW — ux-designer (Tony) — 2026-07-20

- claim: stage-5 UX review of the built weapon HUD (`arme` ticker cell) + LOOT crate read, on
  **both device classes**, against `docs/game-design/weapons.md` §6.2/AC10-AC11, ADR-0046 (CSS
  tokens), ADR-0003 (mobile/touch contract), and the QA plan's explicit HUD-on-mobile deferral
  (`docs/qa/plan-story-weapons-pickup.md` §"Device matrix" — "HUD-layout-on-mobile is
  ux-designer's reconcile"). Played the built branch live (desktop 1280×720 evidence + fresh
  mobile-landscape 667×375 and short-landscape 568×320 captures via the `verify` skill /
  `__MUF_PLAY__` seam, read-only driving, zero code touched).
- VERDICT: PASS — ux review (ux-designer)

**HUD ergonomics — PASS, no regression, on desktop AND mobile-landscape.**

- **Placement/legibility.** `arme` is the rightmost ticker cell (`HUD.tsx` mount order after
  `EnergyGauge`), same vertical readout-cell pattern (`composes: item/label from
shared.module.css`) as every sibling — no bespoke layout, no special-casing. On desktop
  (1280×720, evid `a`/`c`) it reads cleanly: "A ∞" / "C 30" at `--font-size-xxl` (22px), ample
  gap to ÉNERGIE.
- **Mobile-landscape (667×375, iPhone-SE-class) — captured live, no overlap.** Full HUD strip
  renders correctly through the real MENU→narrative→PLAYING flow (mobile UA, `hasTouch`,
  `isMobile`), "ARME A ∞" fits with clear margin at the right edge.
- **Short-landscape stress test (568×320, below the ADR-0024 `SHORT_LANDSCAPE_MAX_H=480`
  threshold) — captured live, still no overlap/wrap.** Cropped/zoomed the ÉNERGIE↔ARME boundary:
  the two cells stay legibly separated (~15-20px gap at 1x), well short of colliding. **Named
  gap, not a regression:** `HUD.module.css` never references `SHORT_LANDSCAPE_MEDIA` — the
  in-game ticker has zero responsive reflow, unlike `FlyerWall`/`OffscreenArrowIndicator`/menus
  which do use that breakpoint. This is the **pre-existing** gap ADR-0003 already names ("HUD and
  menus were designed for desktop; small-landscape legibility is a known gap deferred to a
  follow-up story") — the weapon cell inherits it but does not worsen it; it is one more
  fixed-size cell in an already non-reflowing strip, and it empirically still fits at the
  narrowest tested viewport. Not a blocker for this story; out of scope per ADR-0003's own
  deferral.
- **Fast-follow, non-blocking (owner: `dev-r3f-render` or `qa-lead`'s next `verify` pass) —
  widest-case not directly evidenced.** The widest possible `arme` text is **"B 120"** (3-digit
  `auto` start stock) vs the "A ∞" / "C 30" I could reach live. By font metrics (mono glyph +
  4px gap + 3 digits at `--font-size-lg`/18px) it computes to only ~13px wider than "A ∞", inside
  the ~15-20px margin measured at 568×320 — I could not land a live "B 120" capture at the
  narrowest viewport within this pass's time-box (reaching a specific special-equipped state
  requires panning to an off-centre crate column, per the spawn-exclusion rule, §5.4). Recommend
  one screenshot of `auto` freshly equipped at ≤568×320 to close this out with certainty; not
  expected to fail given the measured margin.
- **Touch-target non-regression — N/A by construction, confirmed.** `arme` is a read-only
  display cell, not a control: `HUD.module.css` `.hud { pointer-events: none }` (inherited,
  unchanged), no `onClick`/button anywhere in `WeaponReadout.tsx`. No new tappable surface is
  introduced, so there is nothing to measure against the 44px minimum. Pickup happens purely
  through the existing fire gesture at the crate's world position (§5.2), never a HUD tap.
- **W8 (no new binding) — confirmed at the render/hook layer.** `git diff origin/main...HEAD`
  touches zero files under `src/hooks/useTouchControls.ts`, `useMouse.ts`,
  `src/game/systems/tapGestureSystem.ts`, or any input path — the only render-lane additions are
  `LootCrate.tsx` (a passive scene mesh) and the HUD widget. Pickup is exactly "the fire gesture
  lands on a crate slot instead of an enemy slot" — desktop click / mobile two-finger-tap /
  one-finger double-tap, unchanged (ADR-0003 D3/D5/D7).

**Blink / reduced motion (W4/AC11, W3/AC10) — PASS, verified in the SHIPPED CSS, not just source.**

- Read `WeaponReadout.module.css`: `.stockLow` (last ~20% blink, `weaponStockBlink`
  step-start 0.6s infinite) and `.emptyFlash` (one-shot `weaponEmptyFlash` 0.45s) both sit under
  `@media (prefers-reduced-motion: reduce) { animation: none !important }` — the exact
  `GestureIcon`/`DiagramIcon` precedent (confirmed 15 files in `src/render` share this pattern).
- **Did not trust the source alone:** built + served the branch and inspected
  `document.styleSheets` in a live page for the compiled rule. Confirmed present verbatim:
  `._stockLow_…, ._emptyFlash_… { animation: … none !important; }` under the
  `prefers-reduced-motion` media query in the actual bundled CSS. The reduced-motion behaviour
  ships, it is not just commented intent.
- **W4 — base weapon never blinks, never warns, ever.** Code-confirmed: `isLowStock()`
  (`hud/derivations.ts`) hard-returns `false` for `kind === "base"` before touching the
  start-stock ratio; `.infinity` in the CSS carries zero animation/colour-ramp rules — there is
  no code path that could make ∞ blink. Matches AC11 exactly: a resource readout, never a
  tension gauge.

**Aria/accessibility of the new cell — matches existing convention (no regression); a
cross-cutting, non-blocking gap named for the record.**

- `WeaponReadout.tsx` exposes **zero** `aria-*`/`role` on its label/glyph/stock text — but this
  is **identical** to every sibling ticker cell (`ScoreReadout`, `LivesReadout`, `TimerReadout`,
  `WaveReadout`, the inline `niveau` item in `HUD.tsx`): none of them carry accessible text
  either. So the new cell is consistent with, not worse than, the shipped pattern — no
  story-scoped regression.
- The one new decorative element, `.emptyFlash`, correctly carries `aria-hidden="true"` (a
  one-shot visual pulse with no informational content of its own — the same event is already
  paired with an audible cue per §6.1) — this is _better_ practice than several siblings show.
- **Named, not blocking:** the whole in-game HUD ticker today exposes no text to assistive tech
  (no `aria-live` region, no per-cell label) — a pre-existing, cross-cutting gap that predates
  this story and isn't weapon-specific. Flagging for a future holistic pass over `HUD.tsx`
  (owner: `ux-designer` + `dev-r3f-render`), not a fast-follow scoped to this story.

**Crate glyph readability at reticle distance on a small screen (R2/W1) — PASS by desktop
evidence + structural reasoning; live mobile capture inconclusive within time-box.**

- Cropped/zoomed `docs/qa/evidence/weapons-pickup/b-loot-crate-visible.png` at 5×: the "C" glyph
  is unambiguous even though the on-screen crate is only ~45×50px at 1280×720 cover framing.
  `LootCrate.tsx` bakes the glyph at a fixed 60/128 (~47%) proportion of its own canvas texture,
  so legibility scales 1:1 with however large the crate's window slot renders on screen — it is
  not a fixed pixel size that could shrink to unreadable independently of the slot.
  `ctx.strokeText` dark keyline under the neon fill keeps contrast even over a bright façade
  (confirmed in the crop).
- **Structural mobile argument (not just assumed):** ADR-0003 D4's `MOBILE_ZOOM_FACTOR` (~1.7)
  shrinks `viewW` on mobile specifically to _enlarge_ every on-screen target for touch — this
  applies uniformly to every window slot, including a LOOT slot. So the crate (and its glyph)
  should read at **least** as legibly on mobile as on the desktop evidence, by construction, not
  a hope.
- **Attempted live confirmation:** drove the mobile build (667×375) via the `__MUF_STATE__`
  seam, detected a real `VISIBLE` crate (`slotIndex 1, weapon "spread"`) mid-session, but it fell
  outside the panned camera framing before I could land it in a screenshot (the same "requires a
  deliberate edge pan" friction qa-lead's plan already notes for §5.4's spawn-exclusion). Not a
  finding against the build — a time-boxed capture limitation on my side. **Fast-follow (owner:
  `lead-art`/`qa-lead`, already tracked as QA's Obs-2):** grab one live mobile-viewport
  screenshot of the VISIBLE crate during the next art/QA pass to close this with direct evidence
  instead of extrapolation.

**Verdict rationale.** Every check I own (HUD placement/legibility on both device classes,
touch-target non-regression, W8 no-new-binding, W4/AC11 base-never-blinks, W3/AC10 reduced-motion
honoured in the shipped CSS, aria convention-match, R2 crate legibility) passes. Three items are
logged as **named, non-blocking fast-follows** (the "B 120" widest-case screenshot, the
cross-cutting HUD aria gap, and a live mobile crate screenshot) — none block V1, none are
regressions introduced by this story, all have a named owner.

- **Read-only inputs:** `docs/game-design/weapons.md` §6.2/§9, ADR-0046, ADR-0003, ADR-0024 (via
  `print/tokens.ts` `SHORT_LANDSCAPE_MEDIA`), `docs/qa/plan-story-weapons-pickup.md` + its
  evidence PNGs, `src/render/ui/hud/{WeaponReadout.tsx,WeaponReadout.module.css,derivations.ts,
shared.module.css}`, `src/render/ui/{HUD.tsx,HUD.module.css}`, `src/render/scene/LootCrate.tsx`.
  Built + drove the branch live via the `verify` skill (Playwright + pre-installed Chromium,
  `__MUF_PLAY__`/`__MUF_STATE__` read-only seam) for fresh mobile-landscape (667×375) and
  short-landscape (568×320) evidence, plus a live DOM/CSS check of the shipped
  `prefers-reduced-motion` rule. No production code, spec, or evidence file modified (iron rule).
  Reported to `lead-game-designer` (Karim) ahead of the architect integration review.
