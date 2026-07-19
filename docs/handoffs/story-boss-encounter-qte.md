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

## 7. ART PROMPT GATE — lead-art (Nico) — 2026-07-19

- claim: PROMPT GATE (bible Gate 1) on the `boss` block prompts/style authored by
  `concept-artist` (Maud) — `docs/art-direction/prompt-drafts/boss-commander.md` +
  `src/game/levels/levelArt.json` `boss` (4 poses). This gate judges the PROMPT STRINGS only
  (no PNG exists yet — the ASSET GATE (Gate 2) and, for the phase-break pulse, the COMPOSITE
  GATE (Gate 4) remain OWED on real output). Answered Maud's 3 explicit questions.

- **VERDICT: PASS-WITH-CORRECTIONS — boss `commander_*` prompt gate (lead-art).**
  All 4 subjects are on-direction, silhouette-first, family-consistent and honour the hard
  no-CRS constraint. Two blocking conditions on the GENERATION lane (N1, N2) and three
  pre-registered Gate-2 defect watch-items (W-a/b/c) must be carried before/at the CI run.
  Iteration budget: 0 of 2 batches burned (prompt gate only).

  ### What PASSes (ratified)
  1. **Family consistency §2 law 2 — style block byte-identical.** Verified: `boss.style`
     (levelArt.json:223) === `enemies.style` (:69) character-for-character (police roster uses
     "…limbs and **gear**"; correct for a capped/coated/holstered figure — not the hostages'
     "…limbs and **hair**"). The boss is a police-roster member and prints as one run with it.
  2. **Silhouette-first §2 law 3 — the four reads are distinct at a glance.** SHIELDED = closed
     upright authority, halt-palm + hand on hip; EXPOSED = open lunge, both arms thrust + coat
     flaring + muzzle flash; HIT = reeling backward, cap coming off, hand to chest; DOWN =
     horizontal sprawled heap. Standing×3 + prone×1 with clear inter-pose separation. The
     "chef" tell (knee-length overcoat + tall stiff peaked cap + dominant stature) reads
     authority in <0.3s without colour and is carried by garment SHAPE, not by any prop that
     dies at game size.
  3. **Hard fiction constraint HONOURED — NOT an `enemy_riot`/CRS reskin.** Zero helmet, visor,
     riot shield or body armour in any of the 4 subjects. Distinct commanding silhouette.
     Anachronism check: "service pistol" (generic, period-neutral), no modern named weapon, no
     smartphone-era item — clean.
  4. **Craft credit — hand-defect mitigation is deliberate across all 4 poses.** SHIELDED
     "gloved" hand hides finger-count; EXPOSED foreshortened gun-hands are masked by the muzzle
     flash (same trick the shipped `enemy_shooting` family uses); HIT hand is clutched against
     the chest; DOWN hand is relaxed/open. FLUX's worst zone (hands at the viewer) is defused by
     design, not left to luck.
  5. **Negation/word budgets in bounds.** 0 negations per subject; verbatim tail carries 2
     (`no text, no watermark`) ⇒ total ≤2 (§3.1). ~90–96 assembled words, warn band, every
     clause load-bearing for a NEW non-ambiguous authority figure (§3.3-justified). The `boss`
     block is not even reached by `check-art-prompts.mjs` — taste is the whole gate here.

  ### Answer to Maud's Q1 — SHIELDED-without-a-shield reconciliation: RATIFIED (bible ruling)

  ENDORSED as written. The mechanic's SHIELDED ("behind cover / riot shield", §OQ2) resolves on
  the FICTION side, never on a prop: for the `boss` family **SHIELDED is a POSTURE STATE (closed
  commanding stance, sidearm holstered), never a physical riot shield.** It is the
  `enemy_riot`(closed) ↔ `enemy_riot_shooting`(fires) couple re-themed onto ONE man via arm
  position — halt-palm+hip (closed) vs pistol-thrust+flash (open) — and it is diegetically 1:1
  with the fiction's "il sort du couvert de ses propres troupes" (§1.3). **New family rule
  (recorded so it cannot drift): no physical shield may ever be generated into a Commandant
  pose; the "shield" is his rank and his troops' cover, carried by silhouette closure alone.**

  ### CORRECTIONS — blocking on the GENERATION lane (→ `dev-tooling-assets`), not on the prompt
  - **N1 — cross-pose character identity must be TOOL-LOCKED, not left to text.** The 4 poses
    sit on 4 INDEPENDENT seeds (4870–4873). "the same … commander" as prose will NOT hold coat
    length, cap height, build and value rendering constant across 4 independent FLUX rolls — the
    bible made kontext img2img the PRIMARY consistency strategy (§4.1) precisely because
    independent rolls drift, and Maud's own rationale concedes the text is only "utile pour un
    futur kontext lock." Requirement: **generate SHIELDED first as the hero, then derive EXPOSED
    / HIT / DOWN via `kontext` from it** (mirroring the enemy flipbook), or a matched-seed pair
    as fallback. Text-only 4-up is NOT acceptable for "un seul personnage reconnaissable à
    travers les 4 poses" — it becomes a Gate-2 hard-fail driver and a wasted batch. Build the
    generator (`gen-boss-sprites.mjs`/extension) with kontext-from-hero BEFORE burning a run.
  - **N2 — do not burn a run ahead of need.** Per pm §5, V1 ships a NON-shipped Belliard
    dev-harness with a generic fallback; no render consumer references the `boss` block yet, and
    the canon live encounter is deferred to the follow-up Niveau-Final story. Generation is
    therefore prep, not urgent — sequence it AFTER N1's kontext tooling exists so the (bounded, 2
    per set) batch budget buys 4 consistent poses, not 4 drifting ones.

  ### Gate-2 defect watch-items — PRE-REGISTERED (bible §2 law 3 sweep, on real PNGs, contrasting bg)

  These poses INVITE the exact defects the bible calls automatic FAILs; flagging now so the
  ASSET GATE and Serge's technical pass check them explicitly (their mechanical PASS won't bind):
  - **W-a (EXPOSED):** lunge + knee-length coat "flaring open" over separated legs → the courier
    "legs-detached-from-hips" precedent: an enclosed region between legs/coat that the keyer can
    punch to a hole. Read on a contrasting bg; do not accept the auto-key.
  - **W-b (HIT):** "cap tipping off his head" risks a fully airborne DETACHED disc (a called-out
    defect) + a bg enclave between cap and scalp. Prefer a cap "sliding off, still just in
    contact" over free-floating; verify at game size.
  - **W-c (DOWN):** prone-on-black in a projection that BREAKS the roster's frontal "facing
    forward" view (the subject rightly drops that token) + no ground plane in the black-ground
    convention → highest perspective-incoherence + baked-ground/shadow risk of the four; confirm
    the "à terre" read survives at game size, no cast shadow bleeds into the key. Cap + dropped
    pistol are separate islands post-key — flavour, not silhouette-load-bearing; the load-bearing
    read is the sprawled long-coat heap.

  ### Answer to Maud's Q2 — style-direction timing: RATIFIED (SNES-live now, pochoir in lockstep)

  Copy the live tail verbatim NOW; migrate to the gated pochoir direction IN LOCKSTEP with the
  whole roster, never fork it for the boss alone. Correct per §2 law 2: the pochoir tail (PASS'd
  for enemies 2026-07-18) is blocked on keying/liseré and is NOT yet in levelArt.json for ANY
  roster member — a lone pochoir boss over a SNES roster = an off-family asset = FAIL of the set.
  The byte-identity I verified (N above) is what makes the lockstep mechanically clean: one
  find-replace across enemies/hostages/boss migrates all three together.

  ### Answer to Maud's Q3 — deferred optional poses: CONFIRM DEFER, but CORRECT the mechanism
  - **CONFIRM** deferral of `telegraph-windup` and `per-phase posture` for V1 — the 4 core poses
    are all V1's non-shipped harness needs (pm §5), no run should produce them now.
  - **CORRECT the proposed render-side mechanism for per-phase posture.** The UX spec
    (`docs/game-design/ux/spec-boss-qte-hp-read.md` D1.1/D1.3, acceptance A1) makes the
    phase-1→2→3 damage escalation a **greyscale-rankable, silhouette-only** legibility
    requirement ("not colour alone"). A render-side TINT does not change silhouette and dies in
    greyscale; SCALE does not read as "more damaged" — so **render tint/scale CANNOT satisfy the
    per-phase posture requirement.** When the live encounter ships (follow-up story), per-phase
    posture must be **distinct posture SPRITES** (torn clothing / more hunched / more strained),
    or the UX A1 requirement is renegotiated with `ux-designer`. Render-side IS the right home
    for (i) the D2.1 phase-break PULSE cue (a non-diegetic screen flash — UX already spec'd it
    render-side, subject to my Gate-4 §2.1 falloff check when it lands) and (ii) `telegraph-windup`
    timing for V1 — with the caveat that a live windup readable only via tint would fail
    "not colour alone" + the §5.6 anti-bullshit floor and likely wants its own pose eventually.
  - Route the per-phase-posture mechanism to a `lead-art` ↔ `ux-designer` ↔ `dev-r3f-render`
    reconciliation when the Niveau-Final follow-up story opens — NOT resolved by burning runs now.

- handoff → `concept-artist` (Maud): PASS-WITH-CORRECTIONS. Prompt STRINGS are gated as-is (no
  rewrite required); the corrections are pipeline (N1/N2) and downstream-scope (Q3) items, not
  string edits. If you want to pre-empt W-b, a one-clause softening of `commander_hit`'s cap
  ("sliding off, still touching his head") is welcome and would come back for a trivial re-PASS.
- handoff → `dev-tooling-assets`: N1 (kontext-from-hero SHIELDED generator before any run) + N2
  (sequence generation after tooling, respect the 2-batch cap) + own the block structure/keys/
  paths/size/seeds + the EXPOSED `muzzle` anchor (tuned at Gate 2, as with enemies).
- handoff → `dev-tooling-assets` / `game-graphist` (Serge): carry W-a/W-b/W-c into the ASSET
  GATE + technical-pass sweep on the real PNGs (contrasting bg, game size) — mechanical
  `check-sprite-integrity.mjs` PASS does not bind my eye; ASSET GATE (Gate 2) still OWED.
- handoff → `ux-designer` (Tony) / `dev-r3f-render` (Amelia): Q3 per-phase-posture mechanism
  correction (distinct sprites, not tint/scale) for the follow-up live-encounter story; the
  phase-break pulse is a Gate-4 composite item (my §2.1 falloff verdict owed on real screenshots).
- NOTE — GATES STILL OWED (not covered by this PASS): ASSET GATE (Gate 2) on the keyed PNGs, and
  COMPOSITE GATE (Gate 4) on the render-side phase-break pulse. This gate covered PROMPTS only.

## 8. TECH PLAN — senior-architect (Winston) — 2026-07-19

- claim: TECH PLAN (C5) on the corrected premise (K1 closed §6, K2 closed by `pm` §5) —
  shared-vs-new-system ruling, the harness/ship split mechanism, the dev-lane cut, and the
  AC5 ADR. Read the full chain (story + K2 ratification + mechanic/fiction/UX specs +
  ADR-0030/0034 + the shipped `qteSystem.ts`/`hostageQte.ts`/`useGameLoop.ts`/`stateMachine.ts`/
  `qteCamera.ts`/`levels.ts`). Design/implement nothing — I cut lanes.
- release: **`docs/adr/0051-boss-qte-encounter-system.md`** (Accepted; indexed via
  `gen-adr-index.mjs --write`, registry fresh at 51 ADR). Number self-allocated via the
  collision-safe check (no `producer` number in the shard at TECH PLAN; re-check at merge).

### Rulings (the architect's calls the gate routed to me, C5)

- **Shared-vs-new system → NEW, separate `bossQteSystem.ts` + `types/bossQte.ts`, fully
  additive; the shipped `qteSystem.ts`/`hostageQte.ts` are NOT touched** (ADR-0051 D1). Reuse
  is at the SHELL, not the contract: camera `qteCamera.ts` reused VERBATIM (it is already
  QTE-agnostic — the boss runtime mirrors `{ anchor, phase, zoomRemaining, zoomSeconds }`); the
  forward-only phase machine SHAPE reproduced structurally; the seeded closed-form wander
  **copied and parameterised** for the per-phase wander speed (1.0→1.6 u/s) the hostage wander
  has no knob for — copying the proven closed-form FOLLOWS the ADR-0034 Rev. 3 precedent, a
  from-scratch sum-of-sines / per-tick PRNG would VIOLATE it. Rejected extending `HostageQte`
  (fattens a playtest-frozen, gated, LIVE contract for a NON-shipped feature) and rejected
  extracting the shared primitives in V1 (same shipped-disturbance objection — DEFERRED to the
  follow-up, ADR-0051 D6, not dropped). Full reused-verbatim-vs-newly-authored map: ADR-0051 D2.
- **Phase break is an `ACTIVE` SUB-STATE, not a new top-level phase** — so the top-level
  `ZOOMING → ACTIVE → (WON|LOST) → DONE` machine stays byte-shape-identical to the shell (AC2).
- **Trigger = on quota-completion** (ADR-0051 D3, `game-designer` §7 flag 3 taken): when
  `bossQteSpec !== null` and `kills >= enemiesToWin`, the boss REPLACES the abrupt
  `LEVEL_COMPLETE`; completion fires only on boss WON/DONE, boss LOST → level fail. Boss is NOT
  in `enemiesToWin` (AC-safe).
- **Harness/ship split (K2) → a SEPARATE dev-only level config carrying the only non-null
  `bossQteSpec`, excluded from the shipped `LEVELS` array, reachable only through a dev-only seam
  (`?preview=`-style query and/or `import.meta.env.DEV`, ADR-0005 harness-window discipline)**
  (ADR-0051 D4). Shipped `belliard` `LevelConfig` stays **byte-identical** (its `hostageQte`,
  `roster`, `enemiesToWin`, quota-win contract untouched); no shipped player reaches the boss
  branch. Guaranteed by additive-and-optional: `bossQteSpec === null` ⇒ the new `tickGameState`
  branch is a strict no-op (byte-identity test, exactly as the hostage guards `qteSpec === null`).
- **OQ6/HP read (C1) confirmed:** no new `src/game` HUD contract field. The current phase is a
  pure exported `phaseIndexAt(bossHp)` helper the render calls (keeps the 16/8 thresholds in the
  game layer); the render derives posture/pulse/colour from it. Boundary intact.
- **Per-phase escalation table = system constants for V1** (one encounter, no curve), promoted
  to `BossQteSpec` fields only when a multi-encounter curve story needs them (the ADR-0035 F3
  seam). `phaseCount`/`bossHp` ARE spec fields from day one (C4 tier-as-data).

### Lane cut (non-overlapping paths; the story file map was indicative — this is the real cut)

- **`dev-gameplay` (pure `src/game`, TDD — the critical path, owns the whole contract):**
  1. `src/game/types/bossQte.ts` (NEW, types-only, zero functions): `BossQtePhase` (shell
     shape), `SHIELDED|EXPOSED` stance + phase-break sub-state, `BossQteSpec`
     (`triggerAtElapsedSeconds`|on-quota, `zoomSeconds`, `anchor`, `phaseCount`, `bossHp`,
     `maxBlownWindows`, `targetSeed`), `BossQte` runtime, `RingZone` reuse.
  2. `src/game/systems/bossQteSystem.ts` (NEW): the constants (per ADR-0051 D2 / spec §4–§5),
     boss anatomy bands `bossRingZoneAt` (full-figure, **G6 clamp DROPPED**), the copied
     parameterised seeded wander, `phaseIndexAt`, `createBossQte` (ALL safety asserts — integers
     ≥1, EXPOSED ≥ `PEEK_EXPOSURE_FLOOR`, per-phase `telegraphLeadSeconds` ≥
     `BOSS_TELEGRAPH_LEAD_FLOOR 0.35` AND strictly < that phase's lull, phase-break damage-free
     ≥ `PHASE_BREAK_SECONDS 1.0`, C6 finite guards), `tickBossQte` (fire-before-loss tie-break,
     HP chip, blown-window clock, phase-break sequencing, phase-scaled drain charged once per
     CLOSED window), `isBossQteActive`, `shouldTriggerBossQte`.
  3. `src/game/systems/__tests__/bossQteSystem.test.ts` (NEW): design AC1–AC8 + invariants +
     determinism (no `Math.random`/`Date.now`) + `bossQteSpec === null` byte-identity.
  4. **SHARED FILES (serialise — the only cross-boundary touch):** `src/game/types/gameState.ts`
     (+`bossQteSpec`/`bossQte`, additive, `null` on every shipped level) and
     `src/game/systems/stateMachine.ts` (the freeze branch + quota-completion interception,
     provably inert when `bossQteSpec === null`). `src/game/levels/levels.ts` — the dev-harness
     level config's `bossQteSpec` data.
- **`dev-r3f-render` (`src/render` + the bridge):**
  1. `src/render/scene/BossQteSprite.tsx` (NEW): tableau, SHIELDED/EXPOSED/hit/defeated poses
     (cop/provisional fallback until art gated), the wandering ring (colour by `ringZone`, follow
     `targetOffset` — reuse the hostage ring render vocabulary), per-phase posture escalation
     (UX D1.1 — NOTE lead-art §7 CORRECTION: live per-phase posture needs distinct SPRITES not
     tint/scale; V1 harness uses the fallback), per-hit reaction (D1.2), telegraph tell.
  2. The **phase-break cue** (UX D2): screen-level pulse (reduced-motion ≤3 Hz, D3.1), distinct
     re-`SHIELDED` motion (D2.4); derive phase via `phaseIndexAt` (no new game field).
  3. **SHARED FILE (serialise):** `src/hooks/useGameLoop.ts` — generalise the QTE zoom driver to
     drive on EITHER QTE active (reads the common `{anchor,phase,zoomRemaining,zoomSeconds}`
     shape); keep minimal. `src/render/scene/qteCamera.ts` reused VERBATIM (no change expected).
  4. The dev-only harness reachability seam (query-param / `import.meta.env.DEV`) in `App.tsx`,
     shared with `dev-tooling-assets` — production carries no menu path to it.
- **`dev-tooling-assets` (BLOCKED on the lead-art ASSET GATE — parallel, NOT critical path):**
  the `boss` block in `levelArt.json` (ratify provisional structure/keys/paths/size/seeds +
  EXPOSED `muzzle`), `gen-boss-sprites.mjs` with **kontext-from-hero SHIELDED** (lead-art N1),
  sequenced after tooling (N2, 2-batch cap), `bossTextures.ts` render registration. The V1
  harness runs on the cop fallback, so this does NOT gate the system+tuning+harness build.

### Parallel-safety / serialisation

`dev-gameplay` and `dev-r3f-render` run in parallel on non-overlapping trees EXCEPT the two
shared bridge files: `stateMachine.ts`+`gameState.ts` (dev-gameplay authors the additive fields

- branch first; land + byte-identity-green before render wires the driver) and `useGameLoop.ts`
  (dev-r3f-render, after the game fields exist). `qteSystem.ts`/`hostageQte.ts` are **NOT** touched
  by any boss lane (D1) — no contention with any concurrent hostage work. Art lane is fully
  disjoint (assets/scripts) and gated.

* handoff → `dev-gameplay` (Amelia): lanes 1–4 above — the pure contract + the guarded
  `stateMachine`/`gameState` additive branch (byte-identity test is a merge-gate must). Owns the
  harness `bossQteSpec` data + the K-5-style `targetSeed` pin (stage-5).
* handoff → `dev-r3f-render` (Amelia): the tableau + phase-break pulse + the `useGameLoop` driver
  generalisation + the dev-only reachability seam; consume `phaseIndexAt`, no new game field.
* handoff → `dev-tooling-assets`: gated on lead-art Gate 2 (N1/N2) — generator + `levelArt.json`
  `boss` ratification + `bossTextures.ts`; off the critical path (cop fallback carries V1).
* handoff → `qa-lead` (stage-5 verify): ring-on-frame at the boss zoom (G6 dropped ⇒ wider roam,
  both device classes), the K-5 seed pin (≥1 landable vital/limb window per exposure per phase),
  the phase-break read (UX A3–A7), and the `bossQteSpec === null` byte-identity regression.
* handoff → `producer` (Marion): ADR-0051 self-allocated at TECH PLAN (no shard number was
  pre-allocated) — please record/adopt in the index and confirm at merge (collision re-check).
* NOTE: this is a TECH PLAN, not a gate — no `VERDICT:` line. Lanes are ready to launch;
  Bertrand launches `dev-gameplay` + `dev-r3f-render` in parallel per the standing policy.

## 9. DEV LANE — dev-gameplay (Amelia) — 2026-07-19

**STATUS: pure game-core lane DONE — all three checks green.** Implemented ADR-0051 D1/D2/D3/D7
in `src/game` only; `qteSystem.ts` / `hostageQte.ts` UNTOUCHED (D1 fully honoured). TDD: specs
written then implemented to green.

**Verification (local; deps installed via corepack routed through `registry.npmjs.org` — note the
sandbox's `repo.yarnpkg.com` is proxy-blocked, so use `COREPACK_NPM_REGISTRY=https://registry.npmjs.org`):**

- `yarn typecheck` (tsc, strict) → **exit 0**, clean.
- `yarn test` (vitest, full suite) → **813 passed / 64 files, 0 failures.** New: `bossQteSystem.test.ts`
  (34) + 8 boss-integration cases appended to `stateMachine.test.ts` (file now 50).
- `yarn lint` (eslint) → **clean, 0 problems.**

**Delivered (File List):**

- `src/game/types/bossQte.ts` (NEW, types-only, zero functions): `BossQteSpec` (authored:
  `zoomSeconds`/`anchor`/`phaseCount`/`bossHp`/`maxBlownWindows`/`targetSeed` — per-phase table is
  NOT authored, it's a system constant per D2), `BossQte` (runtime), `BossQtePhase`
  (`ZOOMING→ACTIVE→(WON|LOST)→DONE`), `BossStance` (`SHIELDED|EXPOSED`), `BossRingZone`, `BossQteZone`
  (no `hostage` bavure — G6 dropped). Phase break is the `phaseBreakRemaining` sub-state field of
  `ACTIVE`, NOT a top-level phase (AC2).
- `src/game/systems/bossQteSystem.ts` (NEW, pure, SEPARATE from `qteSystem.ts`): constants
  (`QTE_BOSS_REFILL +50`, `PHASE_BREAK_SECONDS 1.0`, `BOSS_TELEGRAPH_LEAD_FLOOR 0.35`, reused
  `PEEK_EXPOSURE_FLOOR`/`RING_HIT_RADIUS`/`QTE_PANIC_SHOT`/`QTE_BODY_HIT`/`QTE_ZOOM_SECONDS`/
  `QTE_RESULT_HOLD`); `BOSS_PHASE_TABLE` (EXPOSED 1.6→1.0 / lull 2.0→1.2 / tell 0.45→0.35 / wander
  1.0→1.6 / drain −5/−6/−8); boss anatomy bands + `bossRingZoneAt` (full-figure, no G6 clamp) +
  `bossQteZoneAt`; the COPIED-and-PARAMETERISED seeded wander (`bossWander` + `bossWanderLegDuration`
  — per-phase speed knob the hostage lacks, NO `Math.random`/`Date.now`); `phaseIndexAt(currentHp,
maxHp, phaseCount)` (exported pure helper — render derives phase without re-encoding 16/8);
  `createBossQte` (ALL D7 safety asserts vs. authored spec — integers ≥1, `phaseCount` ≤ table len,
  per-phase EXPOSED ≥ floor, tell ≥ `BOSS_TELEGRAPH_LEAD_FLOOR` AND strictly < that phase's lull,
  break ≥ phase tell, C6 finite guards); `tickBossQte` (fire-resolves-first tie-break, ring chip,
  phase-break sequencing on threshold cross, blown-window drain charged ONCE per CLOSED 0-chip
  window, `LOST` on `maxBlownWindows`); `isBossQteActive`, `shouldTriggerBossQte`.
- `src/game/systems/__tests__/bossQteSystem.test.ts` (NEW, 34 tests): helpers, `phaseIndexAt`,
  every invariant assert, ZOOMING/window machine/telegraph, spatial-colour scoring, phase break
  (damage-free + panic-during-break + break-ends-into-new-lull), WON/LOST + BOTH tie-break
  directions, seeded-pure determinism (replay-identity + source scan for forbidden APIs),
  winnability on the harness seed (K-5 structural stand-in — a competent player clears 24 HP before
  the blown-window clock).
- **SHARED BRIDGE FILES (additive, guarded — landed green, safe for `dev-r3f-render` to wire):**
  - `src/game/types/gameState.ts`: `+bossQteSpec: BossQteSpec | null`, `+bossQte: BossQte | null`.
  - `src/game/systems/stateMachine.ts`: `LevelParams.bossQte?`, `createInitialState` seeds
    `bossQteSpec`/`bossQte`, and the **boss gate branch** (placed BEFORE the quota→LEVEL_COMPLETE
    check, `bossQteSpec !== null`-guarded): triggers on `kills >= enemiesToWin`, freezes the level
    while active, `LEVEL_COMPLETE` only on boss WON (DONE + `bossHp <= 0`), `GAME_OVER` on boss
    LOST. `bossQteSpec === null` ⇒ strict no-op (D4 identity test proves it: quota still wins
    directly, byte-identical to before).
- `src/game/levels/levels.ts`: `LevelConfig.bossQteSpec?` (additive, absent on ALL shipped levels)
  - `BOSS_QTE_DEV_HARNESS_LEVEL` — the NON-SHIPPED harness config (D4), **excluded from `LEVELS`**,
    `enemiesToWin: 3` (quick reach), 3×8/24 HP defaults, provisional `targetSeed 20260719` (winnable —
    the winnability test confirms landable windows per phase; stage-5 K-5 pin still owed).

**FOR `dev-r3f-render` (what I expose — no new game field needed beyond these):**

- Camera driver: `BossQte` exposes the SAME `{ anchor, phase, zoomRemaining, zoomSeconds }` names the
  hostage does → generalise the `useGameLoop` zoom writer to drive on EITHER QTE active; `qteCamera.ts`
  reused verbatim.
- Tableau/poses read: `stance` (`SHIELDED`/`EXPOSED`), `telegraphActive` (window tell), `targetOffset`
  - `ringZone` (draw the wandering ring, colour by zone — same vocabulary as the hostage ring),
    `bossHp`/`bossHpMax`.
- **Phase read (D5, no new game field):** derive posture from `bossHp` via the exported
  `phaseIndexAt(bossHp, bossHpMax, phaseCount)` (all three on the runtime record) OR read
  `bossQte.phaseIndex` directly (they always agree). **Phase-break cue keys on
  `phaseBreakRemaining > 0`** (a break is shorter than phase-3's lull → not distinguishable by
  duration; needs its own non-text/non-duration read, ≤3 Hz reduced-motion-safe).
- Harness reachability seam (`?preview=`-style / `import.meta.env.DEV`) + the `LevelConfig →
LevelParams` mapping (`level.bossQteSpec → params.bossQte`) are YOURS/`dev-tooling-assets`' — I
  provide the harness `LevelConfig` (`BOSS_QTE_DEV_HARNESS_LEVEL`) only, not the access point.

**Owed at stage-5 (not contract blockers, per ADR gotchas):** the empirical K-5 `targetSeed` pin
(harness seed is provisional but proven winnable structurally); ring-on-frame at the boss zoom (G6
dropped ⇒ wider roam — the render/verify lanes' framing check on both device classes).

## 10. DEV LANE — dev-r3f-render (Amelia) — 2026-07-19

**STATUS: render lane DONE — all three checks green.** Wired the boss QTE tableau, generalised the
shared QTE camera driver, added the phase-break cue and the dev-only harness seam. Consumed
`dev-gameplay`'s §9 contract verbatim (no new `src/game` field; phase DERIVED via `phaseIndexAt`).
`src/game` UNTOUCHED — the render lane holds no boss rule (boundary law).

**Verification (local; deps installed, `yarn` fallback — `rtk` unavailable in sandbox):**

- `yarn typecheck` (tsc, strict + `exactOptionalPropertyTypes`) → **exit 0**, clean.
- `yarn test` (vitest, full suite) → **813 passed / 64 files, 0 failures** (no regression; render lane
  adds no new game test — the pure contract is `dev-gameplay`'s, already green).
- `yarn lint` (eslint) → **exit 0**, clean.

**Delivered (File List):**

- `src/render/scene/BossQteSprite.tsx` (NEW): the boss tableau drawn at the static `qte.anchor`
  the camera holds. Runs on the **cop fallback sprite** (`resolveEnemyTexture("riot", …)`, gun-raised
  shooting frame for EXPOSED) via a stance→texture indirection — the real 4-pose Commandant art is a
  pure data swap at that one seam when the FLUX generator lands (lead-art §7 N1/N2 still blocking).
  Reads consumed: `phase`/`stance`/`telegraphActive`/`phaseBreakRemaining`/`targetOffset`+`ringZone`/
  `bossHp`+`bossHpMax`+`phaseCount`. Draws: the wandering weak-point RING (reuses the hostage
  `ringZoneColour`/`ringZoneEmphasis` vocabulary — colour by anatomy zone + non-colour emphasis;
  faint wind-up ring at `BOSS_WANDER_CENTRE` while `telegraphActive`); the per-hit reaction (recoil +
  whiten keyed off a `bossHp` DROP only — off/miss 0-damage shots never fire it, UX D1.2); the
  provisional per-phase hunch (UX D1.1 — flagged PROVISIONAL: lead-art §7 ruled the true
  greyscale-rankable read needs distinct SPRITES, deferred to the live-encounter follow-up; the cop
  fallback carries only an ordered stand-in).
- **Phase-break cue (UX D2, the one genuinely-new render requirement):** a screen-level, non-diegetic
  **pulse quad** (cool white, distinct from the alarm-red LOST strobe / green WON) pegged to the camera
  and scaled to cover the view, fired ONE-SHOT at each break ONSET (rising edge on
  `phaseBreakRemaining > 0`) — a cue that needs neither text nor duration-reading (the 1.0 s break is
  SHORTER than phase-3's 1.2 s lull, D5). PLUS the distinct re-`SHIELDED` **brace** motion (D2.4): a
  single dip-and-rise under motion, a held braced-lower posture under reduced motion. Reduced-motion
  (`prefers-reduced-motion`) degrades pulse + brace to a steady, non-strobing step (≤ 3 Hz, WCAG 2.3.1
  / D3.1) — mirrors the HostageQteSprite matchMedia precedent.
- `src/hooks/useGameLoop.ts` (the SOLE game↔render bridge): generalised the QTE zoom driver to drive
  on **EITHER** QTE active (`isQteActive(qte) || isBossQteActive(bossQte)`), reading the common
  `{ anchor, phase, zoomRemaining, zoomSeconds }` shape — the boss exposes it identically, so
  `qteCamera.ts` (`qtePose`/`qteZoomInProgress`) is reused **VERBATIM** (no change). Both freeze pans
  (mobile inertial + pinch) are now gated on either QTE, exactly as they already were for the hostage.
- `src/render/scene/GameScene.tsx`: mounts `<BossQteSprite>`; the desktop edge-scroll freeze now gates
  on either QTE active too.
- `src/render/scene/App.tsx`: the **dev-only harness reachability seam** (ADR-0051 D4) — `?preview=boss`
  behind `import.meta.env.DEV` boots straight into `BOSS_QTE_DEV_HARNESS_LEVEL`. Production
  (`DEV === false`) tree-shakes the branch ⇒ **no shipped menu path, no shipped player reaches the
  required gate** (mirrors the ADR-0005 harness-window discipline). Also threaded
  `bossQte: level.bossQteSpec ?? null` through `buildLevelParams` (additive; `null`/byte-identical on
  every shipped level).

**Boundary / discipline:** `HUD.tsx` UNTOUCHED (no boss HUD surface — UX §0 ruled diegetic-only; the
pulse is an in-scene camera-space quad, so no new DOM/HUD channel was threaded). No game rule in the
render; the only bridge remains `useGameLoop.ts`; phase is derived, never re-encoded (`phaseIndexAt`).

**Owed at stage-5 (qa-lead / composite gate, per ADR gotchas — NOT my contract blockers):**
ring-on-frame at the boss zoom on both device classes (G6 dropped ⇒ wider roam); the UX A1–A7 review
of the built screens (A1 provisional on the fallback — real per-phase posture sprites are the
follow-up story); lead-art's Gate-4 falloff verdict on the phase-break pulse on real screenshots.

- handoff → `qa-lead` (Inès): stage-5 `verify` on `?preview=boss` (dev build) — ring framing + the
  phase-break read (A3–A7) on desktop + mobile; the `bossQteSpec === null` byte-identity regression.
- handoff → `lead-art` (Nico): the phase-break pulse is live render-side (Gate-4 §2.1 falloff owed on
  real screenshots); per-phase posture is the provisional stand-in pending distinct sprites (§7 Q3).
- handoff → `senior-architect` (Winston): render lane ready for the merge-gate panel — additive, one
  bridge file touched (`useGameLoop.ts`), `src/game` untouched.

## 11. VERIFY (stage 5) — qa-lead (Inès) — 2026-07-19

- claim: orchestrate stage-5 VERIFY — mechanical gates, runtime drive of the `?preview=boss`
  harness, the "no shipped level affected" safety proof, and the owed-at-stage-5 items
  (ring-on-frame at boss zoom, phase-break pulse, UX A1–A7, WON/LOST). Test plan:
  `docs/qa/plan-story-boss-encounter-qte.md` (written from the story ACs + gated specs).
- release: verdict below + the plan. Evidence in
  `docs/qa/plan-story-boss-encounter-qte.md` §Evidence pointers and this entry.

- **VERDICT: PASS-WITH-CORRECTIONS — boss-encounter-qte quality gate (qa-lead)**

  The buildable / logic / **safety** surface PASSES and I re-ran it myself (not trusted from
  §9/§10). The runtime RENDER acceptance items (the explicit "owed at stage-5" list) are
  **UNVERIFIED HOLES** — I could not drive the encounter to trigger in the sandbox. Per the
  iron rule an unrun check is a hole, never a PASS; the gate does not deadlock, it escalates
  (C-QA1). The additive, inert V1 code is mergeable behind the merge-gate panel; the held
  render items MUST be closed before the follow-up player-facing story ships the boss live.

  ### VERIFIED (evidence in hand)
  1. **Mechanical (re-run, not trusted):** `yarn typecheck` exit 0; `yarn test` **813/813**
     (64 files, incl. `bossQteSystem.test.ts` 34 + `stateMachine.test.ts` 50); `yarn lint`
     exit 0; `yarn test:coverage` all-files 97.03 %, `bossQteSystem.ts` 93.67 % stmts /
     88.23 % branch / 100 % funcs — over the 80 % `src/game` gate. `yarn build` exit 0.
  2. **Harness boots (BOTH device classes):** `?preview=boss` boots straight into the
     non-shipped `boss-harness` ("Le Commandant (harness)"), HUD renders, no `pageerror` —
     verified desktop 1280×720 AND mobile (iPhone UA, 844×390 landscape, ADR-0003/0015).
  3. **Spec wired + inert until quota:** via the ADR-0005 `__MUF_STATE__` read seam the live
     state carries `bossQteSpec {zoomSeconds 2, anchor {0,−5}, phaseCount 3, bossHp 24,
maxBlownWindows 10, targetSeed 20260719}` with `bossQte: null` (no-op) pre-quota.
  4. **NO shipped player reaches the gate (the load-bearing safety claim) — CONFIRMED at the
     ARTIFACT level.** Production `yarn build`: the harness level is TREE-SHAKEN OUT — the
     shipped bundle contains **0** occurrences of `boss-harness` and **0** of `Le Commandant`
     (the only non-null `bossQteSpec` lives on that DEV-only, `import.meta.env.DEV`-gated,
     `LEVELS`-excluded config). The boss _system_ code ships but is INERT (guarded by
     `bossQteSpec === null`, which every shipped level is). Belliard's live quota-win
     contract is untouched (code-read + the `stateMachine` byte-identity unit test).
  5. **Logic (unit + integration):** the pure system + the guarded `tickGameState` branch are
     exhaustively covered (§3 of the plan): phases, ring 2/1/0, WON/LOST, both tie-break
     directions, blown-window-charged-once, telegraph/EXPOSED floors asserted in code,
     seeded-pure determinism, and the `bossQteSpec === null` byte-identity no-op.

  ### CORRECTIONS / HOLES (routed; escalated — do not silently pass)
  - **C-QA1 (BLOCKING the owed render items; → `dev-tooling-assets` + `dev-r3f-render`;
    escalated to `producer` as CI-DEFERRED-BLOCKED).** The runtime render acceptance items —
    **ring-on-frame at the boss zoom on both device classes** (G6 dropped ⇒ wider roam),
    the **phase-break pulse** + reduced-motion degrade (UX A3/A6), **UX A1–A7**, the
    **WON/LOST verdict** visuals, and `lead-art`'s **Gate-4 falloff** verdict — are
    **UNVERIFIED**. Root cause: `?preview=boss` has NO deterministic boss-trigger seam; the
    encounter only fires after clearing a 3-mook quota, and headless Playwright input cannot
    clear it reliably (rAF throttled ~7 fps; synthetic `MouseEvent` does not register as
    fire; real clicks ~1 shot/sec against fixed-slot enemies with hp > 1 ⇒ ~1 landed hit /
    90 s; enemies also spawn off the default view). This is a HARNESS/INPUT limitation, not a
    product defect — but the items cannot be certified without it. **Fix:** add a
    deterministic trigger seam (e.g. harness `enemiesToWin: 0` / auto-trigger, or
    `?preview=boss&at=active` seeding the boss ACTIVE at the pinned K-5 seed) so E2E-BOSS-3
    (plan §4) and the composite/UX items become automatable in `verify` AND CI. Only Bertrand
    may waive these holes; otherwise they are closed in this story's next cycle or, at latest,
    the follow-up player-facing story's stage-5 (before any live ship).
  - **REG-2 (OBSERVATION; → `dev-gameplay`; non-blocking).** With the pre-existing
    `__MUF_FREEZE_COPS__` dev harness enabled ON TOP of `?preview=boss`, the level completed
    via the quota path ("LA RAVE A EU LIEU", score 4) instead of triggering the boss (no zoom
    observed). Dev-only seam combination (freeze is neither a shipped nor a boss scenario), so
    NOT a shipped-path concern — but please root-cause / add a guard or document the
    incompatibility so the two ADR-0005-style seams don't silently mask each other. Filed as
    REG-2 in the plan.

  ### Still owed by OTHER gate-holders at stage 5 (not mine to close)
  - `game-designer` (Sacha) design-acceptance playtest vs spec §6 (does it play as designed) —
    same trigger-seam blocker applies; flagging so it isn't mistaken as covered by this gate.
  - `lead-art` (Nico) Gate-4 phase-break-pulse falloff on real screenshots (§7 NOTE) —
    blocked on C-QA1's trigger seam.

- handoff → `dev-tooling-assets` (Serge) + `dev-r3f-render` (Amelia): **C-QA1** — a
  deterministic boss-trigger seam in the `?preview=boss` harness (spec E2E-BOSS-3, plan §4),
  then implement E2E-BOSS-1/2 (already automatable) on `e2e-lib.mjs`.
- handoff → `dev-gameplay` (Amelia): **REG-2** freeze+boss observation — root-cause / guard.
- handoff → `producer` (Marion): the render acceptance items are **CI-DEFERRED-BLOCKED**
  pending the C-QA1 seam (Playwright hits the same input wall in CI); track and surface to
  Bertrand — the additive/inert V1 code can proceed to the merge-gate panel, but the held
  items are not waived, only escalated.
- handoff → `senior-architect` (Winston): quality gate RAN — additive/inert surface PASSES
  and the "no shipped level affected" guarantee is artifact-confirmed; the integration review
  can proceed on the code, with C-QA1's runtime holes on record (not a clean green).

## HUD BOSS-HP BAR (Bertrand override of OQ6) — dev-r3f-render (Amelia) — 2026-07-19

- trigger: Bertrand, after playtesting the `?preview=boss` harness, found the diegetic-only
  boss-HP read illegible ("gênant de ne pas voir l'énergie du boss") and asked directly for a
  HUD health bar. Recorded as the §0 OVERRIDDEN ruling in
  `docs/game-design/ux/spec-boss-qte-hp-read.md` (product-owner call, outranks §6/no-HUD).
  Scope: add the bar ONLY; D1-D3 (diegetic posture escalation + phase-break pulse) UNCHANGED.
- claim: a HUD boss-HP bar visible only while the boss QTE holds the scene, coherent with the
  existing print-system HUD (énergie/integrity vocabulary). Zero `src/game` change — reads the
  already-exposed `bossHp`/`bossHpMax`/`phaseCount` on `state.bossQte` (boundary law respected;
  no rule in the HUD, view-mapping only via the shared `integrityColor` ramp).
- release / File List:
  - `src/render/ui/hud/types.ts` — new `HudBossQte { bossHp, bossHpMax, phaseCount }`;
    `HudData.bossQte?` field.
  - `src/render/ui/hud/BossHpBar.tsx` — new widget (renders null when `bossQte === undefined`;
    fill %/hue inline custom props, warm ramp reused from `integrityColor`, phase dividers
    derived purely from `phaseCount`).
  - `src/render/ui/hud/BossHpBar.module.css` — co-located CSS Module (ADR-0046); centred paper
    call-out matching `DeliveryIntegrityBanner` (chip label + keylined track + segment ticks),
    tokens-only, no hex/font/px re-declared.
  - `src/render/ui/HUD.tsx` — mount `<BossHpBar>`, re-export `HudBossQte`.
  - `src/render/scene/BossQteSprite.tsx` — new `onBossQte` callback + bounded change-detection
    (mirrors `HostageQteSprite`); emits the HUD slice on HP change, `null` when inactive.
  - `src/render/scene/GameScene.tsx` — `onBossQte` prop threaded to `<BossQteSprite>`.
  - `src/render/scene/App.tsx` — merge `onBossQte` into `hudData` (kept across `onHudUpdate`
    refreshes like `hostageQte`/`delivery`).
- verify: `yarn typecheck` (0), `yarn lint` (0), `yarn test` (813 passed). Visual — Playwright
  `?preview=boss` + `__MUF_PLAY__` seam (ADR-0005): bar present at 24/24 (green, 2 dividers,
  300px track), and after draining to 10/24 the fill goes orange (warm ramp) at ~42 % past the
  first divider; absent on `?preview=menu` (no orphan HUD). Screenshots captured, temp scripts
  removed (not committed).
- notes / seams left intact: `BossQteSprite`'s diegetic reads (ring, posture hunch/brace,
  per-hit reaction, phase-break pulse, reduced-motion branches) untouched — the bar is additive.
  The `__MUF_STATE__` `hud.bossQte` snapshot stays `null` during the boss QTE because that seam
  caches only `useGameLoop`'s emitted `HudData`; `bossQte` is merged App-side via `setHudData`
  (same as `hostageQte`/`delivery`) — the DOM bar is the source of truth, confirmed present.
- handoff → `ux-designer` (Tony): stage-5 review of the built bar against the overridden ruling
  (bar + D1-D3 co-exist) on both device classes. → `senior-architect` (Winston): integration
  review; the change is render-lane-only, no boundary/dependency/ADR-contract change.

## Fix — BLOCKING same-tick quota-crossing skips the boss — dev-gameplay (Amelia) — 2026-07-19

- finding: code-review panel (stage-6, PR #112, ADR-0051) confirmed a BLOCKING bug with repro,
  independently re-verified by Bertrand. In `src/game/systems/stateMachine.ts` the boss trigger
  check sits at the TOP of `tickGameState` and reads `state.kills` (pre-tick), while normal
  level-completion sat at the BOTTOM and read `newKills` (post-tick) WITHOUT any `bossQteSpec`
  guard: `const finalPhase = newKills >= enemiesToWin ? "LEVEL_COMPLETE" : "PLAYING";`.
- impact: the ordinary case — the shot that kills the last required enemy — crosses the quota
  in ONE tick. `state.kills` is still < quota at the top (boss not triggered), but `newKills`
  reaches quota at the bottom → `LEVEL_COMPLETE` posted directly, `bossQteSpec` ignored. The
  boss NEVER appears; the next tick short-circuits on the terminal-phase guard, so there is no
  second chance. Masked in practice only because the sole boss-bearing level
  (`BOSS_QTE_DEV_HARNESS_LEVEL`) authors `enemiesToWin: 0`, so `state.kills (0) >= 0` is already
  true on tick 1 and the top check fires before the crossing path is ever exercised. This is the
  true root cause of `qa-lead`'s REG-2 (`docs/qa/plan-story-boss-encounter-qte.md`), previously
  mis-attributed to a dev-seam interaction.
- fix (surgical, one line + guard comment): the bottom completion now yields to the boss —
  `newKills >= enemiesToWin && state.bossQteSpec === null ? "LEVEL_COMPLETE" : "PLAYING"`. When a
  boss is authored, victory-by-quota stays `PLAYING` with `kills` at/over quota so the top-of-
  tick boss block opens the duel on the NEXT tick via `shouldTriggerBossQte`. The two GAME_OVER
  branches above (lives ≤ 0, timer ≤ 0) are deliberately NOT changed: a defeat must stay
  immediate — only VICTORY cedes to the boss. The top-of-tick victory branch (line ~184, reading
  `state.kills`) needs no change: when `bossQteSpec !== null` and `state.kills >= quota`, the boss
  block above always intercepts (triggers ZOOMING and returns, or resolves a DONE boss), so that
  branch is only reached with `state.kills < quota` under an authored boss — provably safe.
- test: new permanent regression in `src/game/systems/__tests__/stateMachine.test.ts` ("the kill
  that CROSSES the quota this tick hands off to the boss") — `kills = QUOTA − 1`, `enemiesToWin =
QUOTA` (= 3, NOT the 0-quota harness), one VISIBLE hp-1 enemy; the kill-shot this tick leaves
  the level `PLAYING` at quota with `bossQte === null`, and the next tick opens `bossQte.phase
=== "ZOOMING"` (never `LEVEL_COMPLETE`). Confirmed RED without the fix (`expected 'LEVEL_COMPLETE'
to be 'PLAYING'`), GREEN with it. The existing IDENTITY test (boss-less level unchanged) and the
  0-quota harness path both stay green — the guard collapses to the old expression when
  `bossQteSpec === null`.
- verify: `yarn typecheck` (0), `yarn lint` (0), `yarn test` (814 passed, was 813 + 1 new).
- File List:
  - `src/game/systems/stateMachine.ts` — boss-aware completion guard (bottom of `tickGameState`).
  - `src/game/systems/__tests__/stateMachine.test.ts` — +1 regression test.
- handoff → `senior-architect` (Winston): re-triage on PR #112; the reviewer's repro is resolved,
  fix is game-lane-only, no boundary/dependency/ADR-contract change.

## Fix — boss harness must not persist score/unlock side effects — dev-r3f-render (Amelia) — 2026-07-19

- finding: code-review panel (stage-6, PR #112, ADR-0051) CONFIRMED finding, live-verified by two
  independent reviewers (split MINEUR — "not exploitable as progression abuse" — vs MAJEUR — "real
  save corruption"; the project blocks merge on any unresolved BLOCKING/MAJEUR, so this is fixed).
  In `src/render/scene/App.tsx` the end-of-level effect (was ~lines 214-226) ran persistence
  side-effects keyed off `selectedLevel` WITHOUT checking the level is actually shipped.
- impact: `BOSS_QTE_DEV_HARNESS_LEVEL` (`id: "boss-harness"`) is deliberately EXCLUDED from the
  `LEVELS` array (ADR-0051 D4, "Belliard live contract untouched"), so `LEVELS.findIndex(l => l.id
=== selectedLevel.id)` returned `-1`; the old unlock hop then read `LEVELS[currentIdx + 1]` →
  `LEVELS[-1 + 1]` → `LEVELS[0]` (the tutorial), and `unlockLevel(LEVELS[0].id)` persisted
  `"tutorial"` into the real player-progress key `muf_progress`. In parallel, `saveScore(
selectedLevel.id, …)` ran unconditionally on GAME_OVER / LEVEL_COMPLETE, writing a phantom
  `muf_scores_boss-harness` high-score entry. Since `?preview=boss` is now reachable on
  branch-preview builds (commit 9a49edf), anyone opening the link and finishing/losing the duel
  corrupted their own localStorage — the harness is contractually supposed to be fully inert.
- fix (surgical, render-lane only): gate BOTH persistence writes (`saveScore` AND the next-level
  `unlockLevel`) behind an explicit `isShippedLevel = LEVELS.findIndex(...) !== -1` membership
  check — not merely correcting the `-1 + 1` index arithmetic — so a non-shipped level writes
  NOTHING regardless of whether it is won (LEVEL_COMPLETE) or lost (GAME_OVER). The reused
  `shippedIdx` also feeds the next-level lookup, killing the `LEVELS[-1+1]` root cause outright.
  The `setTimeout` UI transition to END stays unconditional (it is pure view state, no persistence),
  so the harness still ends gracefully. No game rule touched; `src/game` untouched.
- verify: `yarn typecheck` (0), `yarn lint` (0), `yarn test` (814 passed, 64 files). Live
  Playwright (`executablePath: "/opt/pw-browsers/chromium"`, `--headless=new`) on
  `?preview=boss`: instrumented `Storage.prototype.setItem/removeItem/clear` before app boot,
  cleared storage, then drove the duel to an end state. Passive run (never fire → blown-window
  clock → LOST → GAME_OVER, the exact phase that previously called `saveScore`): effect fired,
  `__lsWrites` = `[]`, final `localStorage` = `{}`, `muf_progress` = `null`,
  `muf_scores_boss-harness` = `null`. Aggressive spam-click run reached the same clean end state.
  Confirms the guard evaluates `isShippedLevel === false` at end-of-duel and skips every write;
  the LEVEL_COMPLETE `unlockLevel` branch is nested inside that same false guard. Temp Playwright
  script removed (not committed).
- note: branch HEAD already carries this as commit `2c09253` (a parallel pass converged on the
  identical guard); this dev pass independently reproduced the byte-identical fix and re-verified
  it live — working tree == HEAD, no residual diff. This handoff entry closes the previously
  missing log for the finding.
- File List:
  - `src/render/scene/App.tsx` — end-of-level effect: `isShippedLevel` (LEVELS-membership) guard
    around `saveScore` + the next-level `unlockLevel` hop; `shippedIdx` reused for the lookup.
- handoff → `senior-architect` (Winston): re-triage on PR #112; the MAJEUR finding's repro is
  resolved, fix is render-lane-only, no boundary/dependency/ADR-contract change.

## Code-review panel fixes (PR #112, stage 6) — dev-gameplay (Amelia) — 2026-07-19

Two CONFIRMED MAJOR findings from the mandatory stage-6 code-review panel (verified live by the
reviewer) on PR #112 (boss QTE, ADR-0051). Project law blocks the merge on any unresolved
CONFIRMED blocking/major finding (COLLABORATION.md). Both fixed, surgically, in the game lane only.

### Fix 1 (MAJOR) — `phaseBreakRemaining` never decremented tick-by-tick → brace pulse never played

- finding: in `tickBossQte` (ACTIVE), only `stanceRemaining` counted down on a non-crossing tick;
  `phaseBreakRemaining` was set to `PHASE_BREAK_SECONDS` (1.0) at trigger and only ever forced to 0
  by a WHOLE-segment crossing in one tick. The real loop clamps delta to `MAX_DELTA` 0.1
  (`useGameLoop`), so a 1.0 s break is never crossed whole in one tick — `phaseBreakRemaining`
  stayed pinned at 1.0 across every real frame, then snapped to 0 the same frame `breakActive`
  flips false. `BossQteSprite.tsx` (~L240) computes the brace dip as
  `p = clamp01(1 − phaseBreakRemaining / PHASE_BREAK_SECONDS)`, so `p` stayed 0 the whole break and
  the dip-and-rise never rendered. The old unit test masked it by ticking `delta =
PHASE_BREAK_SECONDS` in one shot (unrepresentative of per-frame calls).
- fix: `src/game/systems/bossQteSystem.ts`, non-crossing branch (was `if (!crossed) stanceRemaining
-= remaining;`) now also counts the break down in lockstep with its SHIELDED hold:
  `if (inBreakAtStart && phaseBreakRemaining > 0) phaseBreakRemaining = Math.max(0,
phaseBreakRemaining − remaining);`. Gated on `inBreakAtStart` (already computed at the top of the
  ACTIVE case) so the tick that TRIGGERS a break still reports the full `PHASE_BREAK_SECONDS` — only
  a break already open at tick start decrements. No render/boundary change.
- test: `src/game/systems/__tests__/bossQteSystem.test.ts` — new "counts phaseBreakRemaining DOWN
  tick-by-tick under real clamped per-frame deltas": open a break (VITAL chip 17→15 crossing 16),
  assert full duration on the trigger tick, then drive 0.1 s frames and assert `phaseBreakRemaining`
  strictly decreases EVERY frame (no plateau) over >5 frames until it reaches exactly 0. Confirmed
  RED without the fix (value pinned at 1.0). The existing "break ends into a fresh SHIELDED lull"
  test (delta = `PHASE_BREAK_SECONDS` in one shot) and the "crossing forces a re-SHIELD break" test
  (`toBeCloseTo(PHASE_BREAK_SECONDS)` on the trigger tick) both stay green — the `inBreakAtStart`
  gate is exactly what preserves the trigger-tick value.

### Fix 2 (MAJOR) — a co-authored boss + hostage QTE would silently drop the hostage QTE

- finding: in `tickGameState`, the boss QTE block can `return` early with `elapsedSeconds` frozen,
  and never checks for a pending/active hostage QTE. A level authoring BOTH `hostageQte` (trigger on
  `elapsedSeconds`) and `bossQteSpec` (`enemiesToWin: 0`) triggers the boss at tick 0, then every
  tick returns early with the clock frozen, so the hostage's temporal trigger never fires — the
  hostage QTE is silently LOST for the rest of the level. Generalises beyond the extreme 0-quota
  case: any level whose kill quota is met before the scripted hostage trigger drops it. NOT
  reachable in V1 (no shipped level co-authors both; the dev harness authors only the boss) — a
  latent footgun for a future story.
- scope: per the review directive, NOT implementing full QTE interleaving (out of scope). Added a
  minimal, surgical guard instead.
- fix: `src/game/systems/stateMachine.ts`, `createInitialState` — if `params.hostageQte` and
  `params.bossQte` are BOTH non-null, throw a clear error explaining the two cinematics do not
  interleave yet (the boss freezes the clock the hostage trigger reads) and to split them across
  levels / await the QTE-interleave follow-up story. Fails LOUD at level load, so a future level
  author sees it immediately instead of a silent drop. The existing `?? null` on each spec is
  hoisted into locals reused by the return (no behaviour change when only one spec is authored).
- test: `src/game/systems/__tests__/stateMachine.test.ts` — new "GUARD: refuses a level authoring
  BOTH a hostage QTE and a boss QTE": `createInitialState` with both specs throws `/cannot author
BOTH/`; each spec alone still loads without throwing.

### Verification

- `yarn typecheck` — 0 errors.
- `yarn test` — 816 passed (64 files), was 814 + 2 new. The IDENTITY test ("a boss-less level is
  byte-for-byte unchanged") stays green.
- `yarn lint` — 0 errors.

### File List

- `src/game/systems/bossQteSystem.ts` — Fix 1 (phase-break lockstep decrement).
- `src/game/systems/stateMachine.ts` — Fix 2 (co-authored-QTE load-time guard).
- `src/game/systems/__tests__/bossQteSystem.test.ts` — +1 regression test (Fix 1).
- `src/game/systems/__tests__/stateMachine.test.ts` — +1 regression test (Fix 2).

- handoff → `senior-architect` (Winston): re-triage both MAJOR findings on PR #112. Both fixes are
  game-lane-only (no React/Three, no boundary/dependency/ADR-contract change); Fix 2 is a defensive
  load-time guard, not the deferred interleaving work.
