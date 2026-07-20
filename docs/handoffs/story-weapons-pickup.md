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
