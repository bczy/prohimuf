# Handoffs — Boss / mini-boss encounter, cinematic QTE (STORY-BOSS-ENCOUNTER-QTE)

Story slug: `story-boss-encounter-qte` · opened by `pm` (John), 2026-07-19.
Feature: a boss/mini-boss set-piece as a dedicated cinematic QTE, extending the
ADR-0030/ADR-0034 hostage-QTE architecture with a sequenced-vulnerability duel. Origin:
Bertrand direct-build request, grounded in the competitive veille
(`docs/game-design/veille-concurrentielle-shooters.md` §3 Tier A idea #6). Jumped ahead of
normal roadmap sequencing on Bertrand's explicit instruction.

## 1. INTAKE + PRODUCT — pm (John) — 2026-07-19

- claim: turn Bertrand's "boss QTE, look at the veille" intent into a scoped, actionable
  story ahead of the design loop.
- release: `_bmad-output/planning-artifacts/story-boss-encounter-qte.md`. Headlines:
  - **Cahier des charges: CONSCIOUS EXTENSION** (Prohibition had no boss — veille §1
    confirms). Same documentation standard as ADR-0030's hostage QTE.
  - **Scope IN (V1):** one boss archetype, one scripted encounter, reusing the ADR-0030/34
    freeze + zoom + phase-machine shell wholesale; a sequenced-vulnerability duel
    (narratively distinct from the hostage's peek-duel, free to reuse its state-machine
    shape if `game-designer` judges it fits); a graded multi-hit HP resolution (unlike the
    now-binary hostage duel — a deliberate divergence, not an oversight).
  - **Scope OUT (V1, explicitly deferred):** the "fuyard" variant from the same veille
    entry (different mechanic shape — street-escape clock, not a frozen duel); a distinct
    mini-boss tier / any total-encounter count; any new HUD surface beyond the shell; no
    re-tuning of the hostage QTE.
  - **6 open questions handed whole to the design loop, not pre-decided:** (1) required
    core-loop gate vs. optional side set-piece — pm leans "required, tied to `Livrer`" but
    does not decide it; (2) the exact vulnerability-window mechanic; (3) boss-vs-mini-boss
    count/placement; (4) Belliard-first (precedent) vs. the finale level (PROJECT_GUIDELINES
    §7's already-scoped "Niveau Final", narratively correct home) — pm defaults to
    Belliard-first absent a strong narrative counter-argument; (5) fiction of "le chef de
    brigade" — must extend the existing antagonist roster (§7), not fork a new faction; (6)
    HP read — HUD bar or diegetic, a fresh call, not inherited from ADR-0034 Rev.4's
    hostage ruling.
  - **Architecture directive (binding on tech plan):** `senior-architect` must treat
    ADR-0030/0034 as load-bearing precedent — expect a new `bossQteSystem.ts` or an
    extension of `qteSystem.ts`; reinventing the freeze/zoom/phase-machine primitive from
    scratch is an explicit scope violation.
- handoff → `game-designer` + `narrative-designer` (+ `ux-designer` if an HP-read surface
  is proposed): design loop, non-overlapping deliverables, answer Open Questions 1–6.
- handoff → `lead-game-designer`: design gate once specs land.
- handoff → `senior-architect`: TECH PLAN once gated — ADR, lane cut, confirm ADR-0030/0034
  shell reuse (binding directive above).
- Not yet logged as a `VERDICT:` line — no gate has run yet; this entry is INTAKE/PRODUCT
  only. `producer` to track stage progression from here.

## 2. DESIGN LOOP — game-designer (Sacha) — 2026-07-19

- claim: mechanic + tuning + 3C (camera) side of the design loop — answer Open Questions
  1, 2, 3 and post tuning magnitudes. NOT fiction (OQ5, `narrative-designer`), NOT the
  HP-read surface (OQ6, `ux-designer`).
- release: `docs/game-design/spec-boss-qte-encounter.md` (DRAFT — needs gate PASS).
  Headlines:
  - **OQ1 DECIDED — required gate on `Livrer`.** The boss is the delivery's climactic
    obstacle; the level cannot complete until he is down; he is NOT in the kill quota;
    failure = level fails via the blown-window clock (only telegraphed windows can hurt
    you → non-bullshit, §5.6). The required-vs-optional asymmetry vs. the hostage is made
    mechanical (ignore the boss ⇒ fail in ≈ 34 s; ignore the hostage ⇒ lose a bonus).
  - **OQ2 DECIDED — reuse the `COVERED↔PEEKING` exposed-window skeleton + the ADR-0034
    spatial-colour wandering ring, re-themed `SHIELDED↔EXPOSED`, PLUS a 3-phase HP
    sequencing** that re-parameterises the window per phase (the "sustained mastery"
    lever). G6 drops — no human shield. Anti-bullshit floors reused + asserted.
  - **OQ3 POSED (not decided) — 3 options with art/tuning/ADR cost** (A: one finale boss;
    B: one per zone/contact ×5; C: finale boss + cheap 1-phase mini-boss tier). Recommend
    **A in V1, architected so tier = data ⇒ C is a later data-only story**. Pick is
    Karim + John's.
  - **Tuning:** `bossHp 24` (3×8), ring dmg 2/1/0, `maxBlownWindows 10`, per-phase table
    (EXPOSED 1.6→1.0 s, lull 2.0→1.2 s, tell 0.45→0.35 s, wander 1.0→1.6 u/s, drain
    −5→−8), `PHASE_BREAK_SECONDS 1.0`, `QTE_BOSS_REFILL +50`, zoom 2.0 s. Winnability math
    - K-5-style seed-pin flagged as a stage-5 `verify` item.
- handoff → `lead-game-designer` (Karim): **design gate requested** — `VERDICT:` line
  before this reaches `senior-architect`. AC1 (spec answers OQ1–3) met.
- handoff → `ux-designer` (input, not a decision): **OQ6 HP-read surface** — flagged as
  gameplay-relevant (multi-hit + phased ⇒ stronger case for a visible read than the
  binary hostage) with the constraint that **phase transitions need their own strong
  read**; HUD-vs-diégétique deliberately NOT tranched by me.
- handoff → `narrative-designer` (Yasmine): dependency — OQ5 fiction, and the
  **human-shield scope question** (V1 assumes NO human shield; adding one re-imports the
  bavure penalty + G6 clamp = a scope addition to raise with pm/Karim).
- handoff → `senior-architect` (Winston, post-gate): §7 tech flags — trigger timing
  (recommend on-quota-completion), Belliard-required-gate interaction, per-phase table
  as constants vs. `bossQteSpec` fields, shared-vs-new-system.

## 3. ART LANE — concept-artist (Maud) — 2026-07-19

- claim: author the FLUX generation prompts for « le Commandant » (boss sprite family),
  4 mandated poses, per the fiche (`spec-boss-encounter-fiction.md` §2) and the QTE states
  (`spec-boss-qte-encounter.md` §OQ2). Prompt/style strings only — no code, no gameplay.
- release:
  - `src/game/levels/levelArt.json` — NEW `boss` block (sibling of `enemies`/`hostages`),
    4 pose entries: `commander_shielded` / `commander_exposed` / `commander_hit` /
    `commander_down` (seeds 4870-4873), shared `style` copied verbatim from the live roster.
  - `docs/art-direction/prompt-drafts/boss-commander.md` — draft + per-clause rationale +
    the structural decision + the 3 open questions for the gate (indexed in `prompt-drafts.md`).
  - Structural decision: the boss CANNOT go in `enemies.types` (levelArt.consistency
    "no orphan keys" forbids non-ARCHETYPES keys; an ARCHETYPE is dev-gameplay code + would
    make him pop from windows). Mirrored the `hostages` QTE-block precedent instead — inert,
    not ARCHETYPES-bound, not lint-gated. Structure (block name/keys/paths/size/seeds/muzzle)
    flagged PROVISIONAL, owned by `dev-tooling-assets` for the tech-plan wiring.
  - Silhouette DNA (chef readable <0.3s, no colour): long knee-length overcoat + tall peaked
    officer's cap + dominant stature; explicitly NO helmet/visor/shield/armor (not an
    `enemy_riot` reskin). SHIELDED-without-a-riot-shield reconciled toward the fiche (closed
    commanding posture, weapon holstered) — flagged for lead-art ratification.
  - `node scripts/check-art-prompts.mjs` → PASS (0 errors; 12 pre-existing warnings, none
    from the boss block). JSON valid; no consumer references the block yet (safe additive).
- handoff → `lead-art` (Nico): **PROMPT GATE requested** (mandatory before any commit of
  prompts / any generation). Decisions to ratify: (1) the 4 subjects + SHIELDED-no-shield
  reconciliation; (2) style-direction timing (SNES-live-now, migrate to pochoir in lockstep
  with the roster vs. other); (3) deferred optional poses (telegraph-windup, per-phase
  posture) proposed render-side rather than as distinct sprites — confirm with `ux-designer`
  (OQ6). NOT yet a `VERDICT:` line — awaiting the gate.
- handoff → `dev-tooling-assets`: on gate PASS, own the block's structure/keys/`asset`
  paths/`size`/pinned-seed ratification + the EXPOSED `muzzle` anchor, and the generator
  (`gen-boss-sprites.mjs` or an extension of `gen-hostage-sprites.mjs`).

## 3. DESIGN LOOP — narrative-designer (Yasmine) — 2026-07-19

- claim: fiction side of the design loop — answer OQ5 (who the boss is) + opinion on OQ4
  (where it lives first). NOT OQ1/2/3/6 (other lanes).
- release: `docs/game-design/spec-boss-encounter-fiction.md` (DRAFT — needs gate PASS).
  Headlines:
  - **OQ5 DECIDED (proposal) — "le Commandant"**, singular/named apex of the **BAC de
    nuit** (§7), node where BAC (visible arm) × RG (intel) × indics meet. **Extension of
    the §7 roster, NOT a 4th faction** (traces 1:1 to §7, §1.2 table). Underground calls
    him by grade only ("le Commandant"); the establishment tabloid `PARIS-MINUIT` prints
    "commandant **Ferrand**" (fictional name, legal-safe like the `08 36` numbers).
  - **Diegetic justification of "vulnerable only when he opens fire":** the Niveau Final
    (31 déc 1999, flics débordés, §7) — with his men swamped he descends to fire himself,
    with nobody to cover him. Opening fire = leaving his troops' cover = the sole window he
    is both reachable and dangerous (the ADR-0034 D3 bidirectional pivot, given a reason,
    not plaqué). DISPATCH pre-scene line 6 teaches the rule diegetically (names the _quand_,
    not the _comment_ — compatible with game-designer's OQ2 shape).
  - **OQ4 OPINION — Belliard-first with a NON-CANON placeholder** (generic chef de
    patrouille dev-harness, never presented to the player as a real defeat); **canon "le
    Commandant" reserved for the Niveau Final** (his only credible home). Scripts (pre/post)
    written + gated-now, held until the finale is built. Constraint flagged: finale not
    built ⇒ `pm`+`lead`+`architect` co-arbitration if the crew wants the boss canon in V1.
- handoff → `lead-game-designer` (Karim): design gate — PASS on fiction + scripts;
  ratify/amend the 7 flags (§5); co-arbitrate OQ4 §3.3 with `pm`/`architect`.
- handoff → art flow (via gate): open the Commandant sprite request (poses
  protégé/à-découvert/touché/à-terre) — `concept-artist` → `lead-art`.

## 4. DESIGN GATE — lead-game-designer (Karim) — 2026-07-19

- claim: gate both design deliverables (mechanic/tuning spec + fiction spec) before they
  reach `senior-architect`; reconcile the two lanes; decide OQ3 (with `pm`) and rule on
  whether OQ6 needs a dedicated `ux-designer` opinion before the verdict.
- release: verdict below + `docs/game-design/README.md` index updated (In flight / gated).

- **VERDICT: PASS — boss-encounter-qte design gate (lead-game-designer)**

  **(PASS-WITH-CORRECTIONS.** Both specs are individually gate-quality — declared
  extension, loop served, verifiable magnitudes, mechanic↔fiction coherent, roster-faithful,
  anti-bullshit floors genuinely reused. Two corrections (K1, K2) must be applied/closed
  before `senior-architect` cuts lanes; five conditions (C1–C5) bind downstream. Rework
  round 1 of 2.)

  ### What PASSes (substance ratified)
  1. **Scope / cahier des charges.** [EXTENSION] correctly declared in both specs
     (Prohibition ST had no boss — veille §1), same documented standard as ADR-0030/0034,
     Bertrand-requested, ADR to follow (AC5). Declared, not silent ⇒ passes the scope test.
  2. **Core loop served, not diluted.** OQ1's "required gate on `Livrer`" makes the boss the
     terminal obstacle on an _existing_ verb (delivery physically blocked), not a new verb,
     and gives §7's already-canon finale its mechanical climax. He is NOT in the kill quota
     (AC-safe). Winnability math ≈ 60–75 s climax sits inside "une mission = 3–5 min"
     (verify at stage 5). Coherent.
  3. **Mechanic ↔ fiction lock is seamless.** game-designer's SHIELDED↔EXPOSED "opens fire =
     sole shootable = sole dangerous (D3 fusion)" and narrative's "débordé ⇒ descend tirer
     lui-même ⇒ sort du couvert" describe the _same_ window from mechanic and fiction sides.
     Fiction names the _quand_, not the _comment_ (explicitly), leaving OQ2's form to
     game-designer. No visible seam. This is the reconciliation working as designed.
  4. **Anti-bullshit floors (§5.6 / ADR-0034 G4/G5) — reuse verified against shipped code.**
     `PEEK_EXPOSURE_FLOOR = 0.5` (`qteSystem.ts:35`) reused verbatim, correct value, asserted
     discipline preserved. Dropping G6 is SAFE, not a regression: G6 existed only to prevent a
     bavure on the human shield; with no hostage there is no bavure path, so removing it deletes
     a fairness risk rather than creating one — the only remaining spatial constraint
     (ring-on-frame at the boss zoom) is kept as a stage-5 verify item (ADR-0034 K-1 shape).
     The required-gate loss model (blown-window clock, re-key of `maxBlownPeeks`) reuses the
     exact structure `lead-game-designer` already blessed as §5.6-coherent at ADR-0034 Rev. 2
     (a legible telegraphed patience clock, not a stray-bullet HP death), and surfaces an
     explicit failure reason (§5.6 rule 4). Sufficient for a required gate — subject to K1.
  5. **Fiction faction fidelity (§7 / AC6) — CONFIRMED.** "le Commandant" extends the §7
     roster (BAC/RG/indics) into one named apex; it does NOT fork a 4th faction (§1.2 traces
     1:1). "BAC-not-RG-as-anchor" reasoning is sound and preserves RG's §7 characterisation
     (intel/tells, never frontal fire). Period authenticity (31 déc 1999 / bug 2000 / francs /
     PARIS-MINUIT) clean, matches §7 Niveau Final. Scripts (8+6 lines) inside the shipped
     scene bounds, skippable, mute-QTE-compatible.

  ### CORRECTIONS (blocking — apply before `senior-architect` cuts lanes)
  - **K1 — game-designer (verifiability).** The telegraph floor is misstated. The spec cites
    `TELEGRAPH_LEAD_SECONDS` as a "0.25 s floor" (§2.4 and §5 constants table) but as "0.35"
    in §0. The SHIPPED constant is **0.35** (`qteSystem.ts:39`), and in code it is the _tell-
    window duration_ asserted as `peekCadenceSeconds STRICTLY > TELEGRAPH_LEAD_SECONDS` — not
    a "≥ 0.25 minimum lead." Reconcile explicitly: (a) state the true reused value (0.35);
    (b) decide whether the boss's per-phase telegraph lead (0.45→0.40→0.35) is a NEW authored
    per-phase field — in which case it is NOT a reuse of the fixed 0.35 constant and needs its
    own named, numeric, asserted floor — or a fixed reuse of 0.35, in which case the
    0.45→0.40 ramp is contradicted. As written a dev cannot implement the anti-bullshit
    telegraph assert without guessing, and §5.6 rests on this floor being asserted correctly.
    Values, not adjectives.

  - **K2 — JOINT `lead-game-designer` + `pm` + `senior-architect` (coherence/scope).** The two
    specs are each internally coherent but leave one seam at their intersection that BOTH
    correctly flagged and neither closed — it must be closed here, not left to drift, because
    it determines the lane cut, the ADR content, and whether AC3 ("one encounter ships") is
    even met. The collision: OQ1 makes the boss a **required gate that FAILS the level**
    (inherently player-facing, stakes-bearing) while the fiction's OQ4 opinion puts a
    **non-canon throwaway placeholder** on Belliard ("jamais présenté au joueur comme une vraie
    défaite") and reserves the canon Commandant for the **unbuilt** Niveau Final. A required
    level-gating boss and a non-canon dev-harness are mutually exclusive as a _shipping_ config
    (you cannot force a throwaway placeholder onto a live, gated level as a mandatory
    level-failing obstacle) — though they are compatible as an _iteration_ config.
    **My recommendation, to be co-ratified by `pm` + `senior-architect` (the OQ4 + OQ1-sub-flag
    arbitration the story provisioned): decouple SHELL from SHIP.**
    (i) Iterate `bossQteSystem` on Belliard behind a **non-shipped dev-harness** placeholder
    that does NOT alter shipped Belliard's quota-win completion contract (engineering gets its
    Belliard-first velocity without spending the Commandant or forcing a placeholder required
    gate onto a live level);
    (ii) ship the **canon required-gate "le Commandant" in the Niveau Final**, as a **separate
    follow-up story** that builds the finale (where required-gate + "flics débordés"
    vulnerability + the ceremonial +50 refill all cohere) — fiction scripts §4 gated-now,
    held-until-then;
    (iii) therefore V1's shippable = **system + tuning + gated fiction + Belliard dev-harness**,
    canon player-facing encounter explicitly deferred. If `pm` wants a canon player-facing
    encounter IN V1, the honest route is narrative's option (b) — build a **minimal finale**
    inside this feature's scope — a `pm` scope call made explicitly (AC7), never by drift.
    This keeps required-gate (OQ1) intact as the stakes MODEL, keeps Option A (OQ3), honours
    the fiction's capstone argument (OQ4), and avoids the incoherent "required non-canon
    placeholder gate on a shipped level."

  ### CONDITIONS (tracked; do not block this PASS, bind downstream)
  - **C1 — OQ6 → `ux-designer` (REQUIRED before `dev-r3f-render` builds the HP read).** Ruling
    on the mission's question: **a dedicated `ux-designer` opinion IS necessary** (HUD-vs-
    diegetic is their gate, and the multi-hit + phased case genuinely differs from the binary
    hostage duel, so it CANNOT inherit ADR-0034 K-4) — **but it does NOT block this design
    gate or the tech plan**, because the game layer names phase + HP as state regardless of the
    surface, and no game value or contract depends on it. I do NOT tranche it myself (out of my
    lane). Route to `ux-designer` with two binding design inputs: (i) §6 "la musique est le seul
    indicateur de tension — pas de barre de stress" (a full HUD stress-bar for boss HP is in
    tension with this; likely resolves to diegetic pips per K-4 precedent — `ux` + `lead-art`
    reconcile); (ii) game-designer's "phase transitions must carry their own strong, distinct
    read". `ux-designer` gates the surface, `lead-art` the visual.

  - **C2 — fiction canon flags RATIFIED.** Flag 1 (net-new named canon "le Commandant") and
    flag 2 (`Ferrand` fictional, PARIS-MINUIT-only, legal-safe) RATIFIED as conscious
    documented extension; flag 3 (roster extension, no 4th faction) CONFIRMED. Fold both names
    into the future `narrative-bible.md` + `characters.md`, same treatment as the SPIRALE 23 /
    PARIS-MINUIT gated canon (README "Gated canon" list).

  - **C3 — → `lead-art` (coherence flag; I do NOT arbitrate visuals).** Fiction §2 specs the
    Commandant as a **plein-pied authority silhouette, explicitly NOT the CRS/`enemy_riot`
    anti-émeute look**, B&W photocopié + néon acide, "chef" readable by silhouette alone
    (bible §2 law 3 — consistent). Two art-flow items: (i) a **full-figure enemy is a NEW
    composition** vs. the existing buste-fenêtre enemy family — feasibility/house-style at
    `concept-artist` → `lead-art`; (ii) note for any FUTURE Option-C mini-boss: game-designer's
    cost-saving "re-posture the `riot`/CRS archetype" conflicts with the fiction's "pas la
    tenue CRS" for the Commandant HIMSELF — a lesser anonymous _chef de patrouille_ mini-boss
    may reuse CRS, the Commandant may not; recorded so the C-story assumes no forbidden reskin.

  - **C4 — OQ3 count (my joint call with `pm`): RATIFIED — Option A in V1, architected tier =
    data** (`phaseCount`/`bossHp` as spec fields from day one) so **C is a later data-only
    story**. Respects AC3 (one boss-tier encounter) + AC4 (no fuyard), cheapest V1, maximal
    future optionality, mirrors the proven hostage Belliard→curve rollout. `pm` confirms at the
    AC7 re-review. (A mini-boss tier in V1 = a `pm` scope-expansion call, NOT taken here.)

  - **C5 — → `senior-architect` (TECH PLAN):** carry game-designer §7 tech flags — trigger
    on-quota-completion vs. scripted; the Belliard required-gate completion-contract
    interaction (now reframed by K2); per-phase table as constants (recommended V1) vs.
    `bossQteSpec` fields; shared-vs-new system (`bossQteSystem.ts` vs. extend `qteSystem.ts`).
    AC5 ADR to document the extension + the OQ1/OQ2/OQ6 resolutions, ADR-0030/0034 revision-log
    discipline (reused-verbatim vs. newly-authored map).

- handoff → `game-designer` (Sacha): apply **K1** (telegraph floor value/reuse); participate
  in **K2** reconciliation.
- handoff → `pm` (John): **K2** co-arbitration (system-only V1 vs. minimal-finale V1) + **C4**
  OQ3 concurrence + AC7 re-review.
- handoff → `senior-architect` (Winston): **K2** co-arbitration + TECH PLAN (**C5**) — see the
  TECH PLAN hand-off block below. Do NOT cut lanes until K1 applied and K2 closed.
- handoff → `ux-designer` (Sally): **C1** OQ6 HP-read surface (blocking `dev-r3f-render` only).
- handoff → `lead-art` (Nico): **C3** Commandant sprite request + full-figure-enemy coherence.

## 5. UX — ux-designer (Tony) — 2026-07-19

- claim: close gate condition **C1** (OQ6, HP-read surface) — a fresh call, not inherited from
  ADR-0034 K-4's hostage ruling (multi-hit + phased boss is a different shape from the near-binary
  hostage duel).
- release: `docs/game-design/ux/spec-boss-qte-hp-read.md`. Headline ruling:
  - **No HUD element for boss HP — diegetic only, no bar (segmented or continuous), no per-hit pip
    stack.** §6 ("pas de barre de stress") applies to a boss-HP meter as the same _family_ of
    object as a stress bar (a persistent, quantified, continuously-ticking gauge), not just
    literally to player stress; 24 HP at ~12-16 landed hits is also the wrong _grain_ for pips
    (24 dots = a bar in disguise, not a simpler alternative). Continuous progress reads off the
    **already-budgeted** per-phase posture (ordered escalation requirement, D1) + per-hit reaction
    pose (D1.2) — zero new art cost beyond what `spec-boss-qte-encounter.md` §7 flag 9 already
    lists.
  - **The one genuinely new requirement: phase transitions need a dedicated, non-duration-dependent,
    non-text-dependent trigger cue** (screen-level pulse + a re-`SHIELDED` pose distinct from an
    ordinary lull), because **`PHASE_BREAK_SECONDS` (1.0 s) is not reliably distinguishable by
    duration from an ordinary `SHIELDED` lull** — phase-3's lull is 1.2 s, _longer_ than the break
    that precedes it, so "he's shielded a bit longer" is not a safe signal late in the fight, right
    where the transition matters most. Posture-swap-alone was also flagged as missable inside a
    1.0 s window. Audio stinger/tempo-shift recommended to `game-designer`/sound-designer as a
    legitimate, in-spirit _use_ of §6's music-as-tension rule (not a violation of it).
  - **No new `src/game` contract field expected:** `phase`/"progress within phase" is
    render-derivable from the already-planned `bossHp` + threshold constants (16/8) — flagged to
    `senior-architect` as an expectation, not a ruling.
  - Accessibility: reduced-motion (pulse degrades to a static, non-strobing cue, ≤3 Hz, mirrors
    the hostage-duel D4.1 precedent), not-colour-alone / not-text-alone, contrast, and a
    no-regression note on aria for any new textual stamp (mirrors the current OTAGE-banner
    baseline, does not block on closing that pre-existing gap).
- handoff → `lead-art` (Nico): posture-escalation ordering (D1.1) + phase-break pulse/pose
  treatment (D2.1/D2.4) — style is his, the read is spec'd.
- handoff → `narrative-designer` (Yasmine): optional phase-break banner copy (D2.2), reinforcement
  only, never the sole channel — her call whether to add one at all.
- handoff → `game-designer` (Sacha) / sound-designer: optional audio stinger/tempo-shift at each
  phase break (D2.3) — recommended, not mandated.
- handoff → `senior-architect` (Winston): confirm the render-derivable `phase` helper needs no new
  `src/game` field (§0.2/§4 of the spec); fold into the TECH PLAN alongside C5.
- handoff → `lead-game-designer` (Karim): **C1 closed** — spec delivered, ready to inform
  `dev-r3f-render` once TECH PLAN lands. Does not reopen the design-gate PASS-WITH-CORRECTIONS.

### TECH PLAN hand-off → `senior-architect` (prepared; gated, pending K1+K2)

Reuse map to state explicitly in the ADR (ADR-0030/0034 revision-log discipline, AC2):

- **Reused verbatim (do not re-derive):** the `ZOOMING → ACTIVE → (WON|LOST) → DONE`
  forward-only phase machine; the freeze-the-rest-of-the-level branch (ADR-0030 D3); the 2 s
  progressive zoom + result hold; the `COVERED↔PEEKING` two-stance skeleton (re-themed
  `SHIELDED↔EXPOSED`); the seeded, pure, closed-form wandering ring + `ringZoneAt` spatial
  colour + `RING_HIT_RADIUS 0.3` + damage 2/1/0; the `energy` outcome-currency ledger
  constants; `PEEK_EXPOSURE_FLOOR 0.5`; `TELEGRAPH_LEAD_SECONDS` (value per K1); the boundary
  law (additive-and-optional, `spec === null` byte-identical); the seeded-pure-PRNG
  determinism law (ADR-0034 Rev. 3 — no `Math.random`, no per-tick cursor).
- **Newly authored (boss-only):** `phaseCount` (tier lever) + `bossHp` (24 = 3×8) + phase
  thresholds; the per-phase escalation table (EXPOSED 1.6→1.0 s, lull 2.0→1.2 s, telegraph
  0.45→0.35 s [K1], wander 1.0→1.6 u/s, drain −5→−8); `PHASE_BREAK_SECONDS 1.0` damage-free
  telegraphed break; `maxBlownWindows 10`; `QTE_BOSS_REFILL +50`; the phase-index sequencing.
  G6 clamp is DROPPED (no human shield); the sole remaining spatial constraint is
  ring-on-frame at the boss zoom (stage-5 verify).
- **Architect's calls (C5):** `bossQteSystem.ts` vs. extending `qteSystem.ts`; trigger
  on-quota-completion vs. scripted; per-phase table as constants vs. `bossQteSpec` fields;
  the K2 Belliard-completion-contract interaction. Reinventing the freeze/zoom/phase-machine
  primitive is a story-level scope violation (story Architecture directive) — not on the table.

## 5. PM RATIFICATION (K2) — pm (John) — 2026-07-19

- claim: rule on **K2** (JOINT `lead-game-designer` + `pm` + `senior-architect`, §4) —
  the OQ1-required-gate vs. OQ4-non-canon-placeholder collision — under this story's own
  AC7 mandate; concur/dissent on **C4** (OQ3 count); prepare the `senior-architect` TECH
  PLAN hand-off.
- release: `_bmad-output/planning-artifacts/story-boss-encounter-qte.md` — new "Decisions
  post-gate" section (inserted before "Architecture directive"), AC3 amended in the
  Acceptance criteria table. Headlines:
  - **RATIFIED — Option 1, decouple SHELL from SHIP, taken as `lead-game-designer`
    recommended it, no amendment.** OQ1 (required gate) CONFIRMED as the stakes
    **model** — built and verified, but not shipped live to players in V1. OQ4 REVERSED
    from this story's own Belliard-first default, on the exact condition the story set
    for reversing it (a strong narrative counter-argument — satisfied by narrative's
    "descend tirer lui-même, débordé, plus personne pour le couvrir" being diegetically
    1:1 with the Niveau Final's already-canon "flics débordés" moment, §7). **V1 =
    system + tuning + gated fiction + a Belliard _dev-harness_, not shipped, not
    touching Belliard's live quota-win completion contract.** Canon "le Commandant"
    live encounter deferred to a **named follow-up story** that also builds a minimal
    Niveau Final — not bundled here.
  - **Option 2 (minimal finale in this story) considered, rejected for V1** — would
    compound two scope variables (new QTE system + new level) in one story, breaking the
    "one lever per revision" discipline this story already invoked for the fuyard
    deferral; the Niveau Final is a significant, already-promised beat (§7, MVP Sprint
    4+) that deserves its own design pass, not a stub.
  - **Option 3 (required gate live on Belliard now, non-canon placeholder identity)
    considered, rejected as not a real resolution of K2** — a required, level-failing,
    HP-phased, dispatch-scripted, ceremonially-refilled boss duel is a "real" weighted
    encounter regardless of the name on him; relabelling him non-canon launders the
    incoherence rather than closing it. The only genuinely coherent version of Option 3
    would be a distinct, lesser, _canon_ Belliard antagonist — i.e. the mini-boss tier
    (OQ3 option C) already RATIFIED OUT of V1 by C4. Not reopened under a different name.
  - **Trade-off surfaced explicitly, not silently absorbed:** V1 ships **no
    player-facing canon boss encounter** — a deliberate deviation from every prior QTE's
    live-Belliard-first rollout (hostage QTE included). Recommendation to Bertrand:
    sequence the Niveau-Final-boss follow-up story soon so this investment pays off in a
    real player-facing beat, not indefinitely shelved. If Bertrand wants a live V1
    encounter, that is Option 2, taken as a fresh explicit scope call — not granted here.
  - **AC3 amended:** "ships" in V1 now reads as "built + verified via the non-shipped
    dev-harness"; the canon live ship is out of V1, tracked as the named follow-up. Still
    exactly one boss-tier archetype (C4) — no silent multiplication.
  - **C4 concurrence — RATIFIED.** Option A in V1 (one finale-bound boss, tier = data
    from day one: `phaseCount`/`bossHp` as spec fields), Option C (cheap mini-boss tier)
    stays a later, explicitly-gated, data-only story.
  - **AC7 partially closed:** OQ1, OQ3(C4), OQ4 confirmed against this story's scope
    decisions. OQ2 still pending K1 (`game-designer`, telegraph-floor fix — design-loop
    item, does not block this ratification). OQ6 still pending C1 (`ux-designer`, does
    not block TECH PLAN either per the gate verdict).
  - **Scope-guard check (`PROJECT_GUIDELINES.md` §7/§8, "cahier des charges" test):** no
    drift. The [EXTENSION] declaration stands (gate §"What PASSes" item 1); this
    ratification narrows V1's shipped surface (a harness, not a live encounter) rather
    than widening it — the opposite of scope creep. The Niveau Final stays exactly what
    §7 already scoped ("31 décembre 1999 — bug de l'an 2000, Paris en délire, flics
    débordés"); this story does not silently build it early or shrink it into a stub.
- handoff → `senior-architect` (Winston): **TECH PLAN (C5)**, K2 co-ratification CLOSED
  on `pm`'s side — proceed on the corrected premise (non-shipped Belliard dev-harness,
  Belliard's live completion contract untouched, AC5 ADR must document the harness/ship
  split). **Do not start TECH PLAN until `game-designer` closes K1** (telegraph-floor
  value, blocking per the gate verdict — unaffected by this ratification).
- handoff → `game-designer` (Sacha): reminder K1 still open and blocking TECH PLAN.
- Not yet a `VERDICT:` line — this is a `pm` ratification of a JOINT call, not an
  independent gate. The gate verdict of record remains §4's
  `VERDICT: PASS — boss-encounter-qte design gate (lead-game-designer)`.

## 6. K1 CORRECTION APPLIED — game-designer (Sacha) — 2026-07-19

- claim: close **K1** (telegraph-floor value/reuse mis-citation) in
  `docs/game-design/spec-boss-qte-encounter.md`, as required before `senior-architect`
  cuts lanes.
- **K1 RESOLVED.** Corrected the spec against shipped code (`src/game/systems/qteSystem.ts`):
  - **True value stated:** `TELEGRAPH_LEAD_SECONDS = 0.35` (`qteSystem.ts:39`) is a FIXED
    _tell-window duration_ (the last 0.35 s of the COVERED beat carries the tell), asserted
    `peekCadenceSeconds > TELEGRAPH_LEAD_SECONDS` — **not** a "≥ 0.25 s lead minimum". Fixed
    §0, §2.4 table, §4.3 header + note, §5 constants table, §6 AC3 (every stale "0.25 s"
    citation removed).
  - **Ambiguity TRANCHÉE:** the per-phase telegraph lead (0.45→0.40→0.35) is a **NEW authored
    per-phase field `telegraphLeadSeconds`**, NOT a reuse of the fixed constant (a fixed
    constant cannot ramp). It gets its **own named, numeric, asserted floor
    `BOSS_TELEGRAPH_LEAD_FLOOR = 0.35 s`** (value deliberately = the shipped hostage tell, so
    the boss is never LESS readable than the proven duel; phase 3 sits exactly on it), PLUS a
    per-phase `lull STRICTLY > lead` assert mirroring the hostage's
    `peekCadenceSeconds > TELEGRAPH_LEAD_SECONDS`. Precedent for a distinct named constant
    rather than aliasing: `ACCOMPLICE_TELL_SECONDS` (`qteSystem.ts:69`), deliberately not
    aliased to `TELEGRAPH_LEAD_SECONDS`. §5.6 anti-bullshit garde-fou now rests on an assert a
    dev can implement without guessing.
  - **Second divergence caught + fixed while verifying:** §4.3 cited a hostage
    "`wanderSpeed ≈ 1.2` scale" — no such knob exists; hostage wander speed is implicit at
    ≈ 1.8 u/s peak (derived from `LEG_DURATION 0.38` + `MAX_LEG_DISPLACEMENT 0.45`,
    `qteSystem.ts:123`). Reworded: boss wander speed 1.0→1.6 u/s is a NEW per-phase field
    capped UNDER the proven hostage peak. All other reused constants re-verified against
    `qteSystem.ts` and unchanged (`PEEK_EXPOSURE_FLOOR 0.5`, `RING_HIT_RADIUS 0.3`,
    damage 2/1/0, `QTE_RESCUE_REFILL +40`, `QTE_UNANSWERED_PEEK −8`, `QTE_BODY_HIT −5`,
    `QTE_PANIC_SHOT −6`, `QTE_ZOOM_SECONDS 2.0`, `QTE_RESULT_HOLD 2.2` — all match).
  - No tuning MAGNITUDE moved: the per-phase table values (tell 0.45→0.35, wander 1.0→1.6)
    are unchanged; only the constant NAME, its reuse/new classification, and the asserted
    floor semantics were corrected.
- handoff → `lead-game-designer` (Karim): **K1 closed** — ready for your confirmation.
- handoff → `senior-architect` (Winston): TECH PLAN note — carry `BOSS_TELEGRAPH_LEAD_FLOOR`
  (new, 0.35) + `telegraphLeadSeconds` (new per-phase authored) into the ADR's newly-authored
  map; `TELEGRAPH_LEAD_SECONDS 0.35` is a _reference_, not reused verbatim by the boss (line
  294's "value per K1" now resolves to: hostage constant referenced, boss floor newly named).
