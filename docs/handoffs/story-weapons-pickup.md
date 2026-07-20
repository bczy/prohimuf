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
