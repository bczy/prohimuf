# Handoffs — Boss QTE differentiation pack (STORY-BOSS-QTE-DIFFERENTIATION)

Story slug: `story-boss-qte-differentiation` · opened by `pm` (John), 2026-07-19.
Feature: 5 differentiation levers on top of the ADR-0051 boss QTE system, triggered by
Bertrand's direct playtest feedback on the `?preview=boss` dev-harness ("c'est limite au
même gameplay que l'otage sans l'otage"), PR #112 (V1) still finishing its stage-6 review
panel — **not reopened, not blocked by this story.** Levers sourced from the same
competitive veille that grounded V1 (`docs/game-design/veille-concurrentielle-shooters.md`
§3 Tier S/A), from a 10-item proposal `pm` drafted in response to the feedback, of which
Bertrand selected 5 as one pack.

## 1. INTAKE + PRODUCT — pm (John) — 2026-07-19

- claim: turn Bertrand's playtest feedback + his 5 selected differentiation levers into a
  scoped, sequenced follow-up story, without reopening or blocking the in-flight V1
  story/PR #112.
- release: `_bmad-output/planning-artifacts/story-boss-qte-differentiation.md`.
  Headlines:
  - **Why:** V1's `SHIELDED↔EXPOSED` + single wandering ring is, by ADR-0051 D1's own
    admission, a shared _shape_ with the hostage `COVERED↔PEEKING` duel — Bertrand's
    feedback confirms that shape reads as sameness at the table, regardless of the
    fiction re-skin.
  - **Scope structure — ONE story, not five, but explicitly sequenced, not a blob:**
    - **Wave 1 (build+verify together, highest design load):** lever 1 (points faibles
      multiples — reshapes the base targeting model everything else sits on) + lever 3
      (parade Sekiro — reopens the V1 "no new player verb" OUT-of-scope line, on
      Bertrand's direct request, flagged as a conscious reversal not drift).
    - **Wave 2 (additive once Wave 1's targeting shape is frozen):** lever 2 (décor
      interactif — stagger + audio-tell-under-smoke) + lever 5 (coup de grâce
      cinématique, mirrors the ADR-0034 porte-cochère execution-click precedent).
    - **Risk carve-out, tuning BLOCKED pending an architecture ruling:** lever 4
      (renfort mi-combat) — risks being the first exception to the "freeze the rest of
      the level" invariant every QTE revision has held since ADR-0030 D3. AC4 blocks
      `game-designer` tuning it until `senior-architect` rules on the freeze-law
      interaction (Open Question 4-C); if the ruling is invasive, lever 4 splits into
      its own follow-up story rather than drag the other four into a boundary fight.
  - **14 open questions** (1-A/B/C, 2-A/B/C, 3-A/B/C, 4-A/B/C/D, 5-A/B) handed to the
    design loop, not pre-decided — including a genuine accessibility flag (2-C: an
    audio-only tell under the smoke effect would fail the same "not colour-alone"
    principle already applied elsewhere, on the audio axis, for deaf/hard-of-hearing
    players — `ux-designer` + `sound-designer` must rule before build).
  - **Relationship to the still-unopened Niveau-Final live-ship follow-up:** this story
    stays inside the same non-shipped-harness boundary as V1 (ADR-0051 D4 unchanged).
    Advisory (not decided): differentiate before that follow-up opens, so the finale's
    one-shot reveal isn't spent on a fight that still reads as the hostage duel.
  - **AC5:** an ADR change is required — amendment to ADR-0051 or a new, explicitly
    extending ADR — `senior-architect`'s call which, same choice ADR-0051 itself faced
    re: ADR-0030/0034.
- handoff → `senior-architect` (Winston): **rule on Open Question 4-C FIRST** (freeze-law
  interaction for lever 4), ahead of the rest of the design loop's gate — this sequencing
  is itself part of AC4, not a suggestion.
- handoff → `game-designer` (Sacha) + `narrative-designer` (Yasmine) + `ux-designer`
  (Tony): design loop on levers 1/2/3/5 (mechanic/tuning, fiction, audio-tell +
  parry/finisher legibility respectively) — lever 4 mechanic/tuning explicitly BLOCKED
  behind the architect ruling above (AC4).
- handoff → `lead-game-designer` (Karim): design gate once specs land, explicitly
  covering the Wave 1 / Wave 2 / lever-4-carve-out structure, not just the 5 mechanics
  individually.
- Not yet logged as a `VERDICT:` line — no gate has run yet; this entry is
  INTAKE/PRODUCT only. `producer` to track stage progression from here.

## 2. DESIGN — producer (Marion) — 2026-07-20

- claim: open stage tracking; allocate ADR number for tech plan (AC5); log stage entry + cap boundaries
- release: `ADR-0052` allocated for tech plan (amendment to ADR-0051 or new extending ADR, senior-architect's choice at TECH PLAN stage); story enters DESIGN stage with 5 agents in parallel (game-designer, narrative-designer, ux-designer + senior-architect's freeze-law ruling on AC4, lead-game-designer gate owner); bounded caps: 2 rework rounds per spec, 2 verify↔build rounds per story; orchestrator launching all agents in parallel; stage 3 preview (4-C architect freeze-law ruling) sequenced ahead of full design gate per AC4
- Hands to `game-designer` (Sacha) + `narrative-designer` (Yasmine) + `ux-designer` (Tony) (design loop on levers 1/2/3/5, lever 4 mechanic/tuning BLOCKED pending 4-C) + `senior-architect` (Winston) (freeze-law ruling on Open Question 4-C, ahead of rest of design loop) + `sound-designer` (Malik) (audio-tell accessibility on lever 2-C, accessibility gate) + `lead-game-designer` (Karim) (design gate owner, Wave 1/Wave 2/carve-out structure).

## 3. DESIGN (preview) — senior-architect (Winston) — 2026-07-20 — OQ 4-C freeze-law ruling (gates AC4)

**Scope:** ONLY the Open Question 4-C freeze-law ruling, sequenced ahead of the design
gate per AC4. NOT the TECH PLAN (that follows the gate + pm re-review). No lanes cut, no
ADR written (producer allocated ADR-0052 for the tech plan).

### How the freeze is ACTUALLY enforced (code-level, not by convention)

The "freeze the rest of the level" invariant (ADR-0030 D3 → ADR-0051 D2) is not a flag
that spawn/enemy systems consult. It is enforced **structurally, by early-return
placement**:

- `src/game/systems/stateMachine.ts:160-197` — the boss block sits at the TOP of
  `tickGameState`. When `state.bossQteSpec !== null` and `isBossQteActive(bossQte)` is
  true (line 165), the tick **returns early** (lines 169-180) carrying the entire rest of
  `state` through `...state`. The predicate is `isBossQteActive`
  (`src/game/systems/bossQteSystem.ts:356-364`).
- Everything that could produce roster pressure lives BELOW that return and is therefore
  simply **never executed** during the freeze: `tickEnemy` (line 242), `spawnWave`
  (line 248), enemy fire → new bullets (lines 272-290), `tickBullets` + player-hit +
  `lives` loss (lines 361-401). There is no `if (!bossActive) spawn(...)` anywhere — the
  spawn/roster/bullet pipeline is syntactically unreachable while the boss holds the scene.
- The hostage QTE enforces its freeze the identical way (`stateMachine.ts:211-239`), and
  the same file already carries a load-bearing guard (lines 100-107) that FORBIDS a level
  authoring both a hostage QTE and a boss QTE, precisely because two cinematic beats that
  read/freeze the shared clock do not compose.

### Why option (a) — real roster enemies live during the QTE — is genuinely invasive

Letting `riot`/`normal` live and shootable mid-fight requires running the enemy pipeline
DURING the freeze, which breaks four things at once, two of them non-negotiable:

1. **It destroys the single cleanest safety property** — the structural early return and
   its `bossQteSpec === null` byte-identity guarantee (ADR-0051 D4). The enemy/bullet
   pipeline would have to run conditionally inside the frozen branch.
2. **Two competing shot-resolution pipelines on ONE `fire`.** During the boss the click is
   consumed by `tickBossQte(...fire...)` (`stateMachine.ts:168`); normal play routes the
   same click through `resolvePlayerShot` (`stateMachine.ts:255-265`). These never coexist
   today. Live flics mean one click must arbitrate against BOTH the boss ring and enemy
   hitscan — one-shot-one-target (D1.5) breaks or needs new priority arbitration.
3. **It reintroduces stray-bullet / lives-based death** — the exact thing OQ1 forbids:
   "failure is the telegraphed blown-window clock, never a stray bullet" (ADR-0051,
   OQ1/D3). The boss's outcome currency is `energy` and its sole failure clock is
   `maxBlownWindows`; it never touches `lives`. Real BAC fire travelling and hitting the
   player (the skipped lines 361-401) is "mort bullshit" (§5.6) by construction — a
   DESIGN-LAW violation, not merely an architecture cost.
4. **It widens the determinism surface** — the boss sim is seeded-pure
   (`bossQteSystem.ts:211-219`); folding the general spawn pipeline into the freeze mixes
   it with the enemy-spawn state and reopens the interleave class the guard at lines
   100-107 exists to prevent.

### RULING

**(b) — Reframe. "Renfort mi-combat" lives ENTIRELY inside the boss QTE's own state
machine.** The freeze law (ADR-0030 D3 / ADR-0051 D2) is **NOT amended** and gets **no
exception**. The reinforcement is authored as scripted, seeded (`targetSeed`), pure,
telegraphed in-tableau pressure shapes inside `bossQteSystem.ts` / `types/bossQte.ts` — of
the same family as the wandering ring — that NEVER touch `enemies`/`spawnWave`/`couriers`/
`bullets`/`lives`. Option (a) is rejected on the grounds above.

This is not a boundary change: it is additive to the already-separate boss system (D1),
keeps the structural early-return freeze literally untouched, keeps energy as the sole
outcome currency, and keeps the seeded-pure + telegraph anti-bullshit discipline.

**Binding constraints on `game-designer`'s lever-4 tuning (these answer 4-C, and bound
4-A/4-B):**

- 4-A resolves to the **in-tableau scripted-pressure** interpretation. The "real roster
  `riot`/`normal` enemies" interpretation is ruled OUT on architecture grounds.
- Any lever-4 pressure MUST be priced in the boss's **existing energy/window ledger** — no
  `lives`-based and no travelling-bullet threat may be introduced (this is what keeps 4-B's
  double-jeopardy question answerable inside the current economy rather than by bolting on
  a second HP/lives clock).
- It MUST be telegraphed and seeded-pure (same law as the wander), never `Math.random`/
  `Date.now`/per-tick cursor.
- It MUST NOT read or mutate `enemies`, `spawnWave`, `couriers`, `bullets`, or
  `elapsedSeconds` (frozen), and MUST NOT touch `qteSystem.ts`/`hostageQte.ts`.

### (c) Disposition of lever 4: **FOLD INTO WAVE 2**

Because ruling (b) keeps lever 4 in the SAME files, under the SAME determinism + freeze +
energy discipline as levers 1/2/3/5, there is no boundary fight and no cross-layer change —
the story's conditional-split trigger ("if the freeze-law exception is genuinely invasive")
is NOT met. Lever 4 does NOT split into its own follow-up story; it folds into Wave 2 as a
normal in-tableau pressure element, additive on top of Wave 1's frozen targeting model.

**Consequence for the TECH PLAN / ADR-0052 (later, not now):** since there is no freeze-law
exception, lever 4's ADR treatment is the ordinary reuse-map paragraph alongside 1/2/3/5 —
the story's "must not be silently folded into the same paragraph" caveat (Architecture
directive) is satisfied by recording that the freeze law was reviewed and held UNCHANGED
(this ruling), rather than by carving out a separate exception decision. There is no
boundary change to document because there is none.

**AC4 status:** UNBLOCKED for `game-designer` to tune lever 4 — within the four constraints
above. A lever-4 spec proposing real roster enemies, a lives/bullet threat, or anything
that runs the enemy pipeline during the freeze is a design-gate FAIL against this ruling.

RULING: 4-C = option (b) reframe — renfort lives inside the boss QTE state machine as seeded/telegraphed in-tableau pressure priced in the energy ledger; freeze law UNCHANGED (no exception); lever 4 FOLDS INTO WAVE 2, no split (senior-architect)

## 3. DESIGN LOOP — narrative-designer (Yasmine) — 2026-07-20

- claim: fiction side of the design loop (AC6) — décor set-dressing (lever 2), renfort
  in-world justification incl. the Open Question 4-D ruling (lever 4), coup de grâce
  (lever 5), and a one-line diegetic anchor for the parade (lever 3). NOT mechanics/tuning
  (`game-designer`), NOT HUD/audio surfaces (`ux-designer`/`sound-designer`), NOT visuals
  (art flow). Lever 1 needs no new fiction (already carried by the gated « il ouvre le feu »
  window).
- release: `docs/game-design/spec-boss-differentiation-fiction.md` (DRAFT — needs gate PASS).
  Headlines:
  - **Lever 2 (décor):** venue = a **squatted grand disused hall** (former ballroom/dancing)
    for the millennium teuf. The three objects are the two bodies sharing the room —
    **lustre** = the dead building (the old world falling on the cop), **mur d'enceintes** =
    the crew's own sound-system (the fête's body turned against the man who came to cut it),
    **fumée** = the party's smoke machine nobody switched off (covers Muf, drowns the
    Commandant). Through-line: the room fights on Muf's side without meaning to. Belliard
    harness gets non-canon placeholders; canon venue held for the Niveau Final (AC8).
    NEW-CANON flag (naming the finale building, even loosely) raised for Karim.
  - **Lever 4 — Open Question 4-D RULED:** the renfort is **NOT his men — a lost CRS section
    swept in by millennium chaos**, a different corps he neither called nor commands, that in
    the smoke does not even pick him out. This preserves « il n'a plus personne pour le
    couvrir » (encounter §1.3) exactly and SHARPENS his isolation rather than breaking it. His
    own brigade arriving = the one option refused (it would give him cover = canon
    contradiction). No 4th faction; reuses shipped CRS (`enemy_riot`) / §7. Written to survive
    BOTH architecture branches (real-enemies vs scripted-cue); consistent with the
    senior-architect 4-C ruling above, whose **option (b) selects the scripted-in-tableau
    variant** — the CRS read is carried by audio + frame-edge motion, no live shootable body,
    no lives/bullet threat. Optional cue copy provided (DISPATCH « …Ils débarquent. Pas pour
    lui. »).
  - **Lever 5 (coup de grâce):** the beat = the Commandant down-but-not-finished, one hand
    still reaching for the radio/whistle to have the son cut; the finisher stops that reach.
    Tone guardrail (traces ADR-0030): delivery, not execution — no gore, no kill-word. In-beat
    spoken line = NONE (mute-QTE law upheld); optional on-screen action prompt « LIVRE LE SON »
    (bookends the gated `final_pre` #8), surface owned by `ux-designer`. Aftermath **reuses the
    already-gated `final_post` unchanged** — no competing post-scene authored.
  - **Lever 3 (parade), one line:** diegetically Muf shoots the **pistol, not the man** — a
    precise shot on the sidearm as it comes up knocks the shot wide (« une balle suffit » on
    the gun). Not a melee/baton parry; he's BAC with a service pistol. Timing/reward/telegraph
    stay `game-designer` (3-A/B/C).
  - **AC6 / AC8 held:** all canon written-and-held for the Niveau Final; harness gets
    placeholders only; reserved-for-finale status untouched; nothing ships live.
- Prop/renfort request sheet (§5) prepared for the art flow (venue props + reuse shipped CRS
  - a possible « reaching » finisher pose) — routed to `lead-art` only when the Niveau-Final
    story opens, NOT now (ADR-0051 art-gate N2 "no run ahead of need").
- handoff → `lead-game-designer` (Karim): design gate — PASS on the four fiction beats
  (§1–§4); ratify/amend the 6 flags (§6), esp. flag 1 (new venue canon) + flag 2 (the 4-D
  ruling, the named AC6 ask).
- handoff → `game-designer` (Sacha): shared terrain — the parade must READ as « il tire sur
  l'arme » and the renfort must READ as « pas ses hommes »; on conçoit ensemble, on livre
  séparément.
- handoff → `ux-designer` (Tony) / `sound-designer` (Malik): I supply the WORDS not the
  surface — optional renfort cue copy (§2.5) + finisher prompt « LIVRE LE SON » (§3.3) for
  them to place (or not).
- NOTE (process): appended via Edit, not the heredoc — this subagent environment exposes no
  Bash tool. Kept strictly additive at end-of-file to minimise concurrent-append risk.
- File List:
  - `docs/game-design/spec-boss-differentiation-fiction.md` (NEW)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 4. DESIGN — ux-designer (Tony) — 2026-07-20 — UX/accessibility spec (parry, finisher, multi-target, 2-C ruling)

- claim: design-loop deliverable for `ux-designer`'s lane — the audio-tell accessibility
  ruling (Open Question 2-C, gate-critical), parry legibility (3-C UX side), finisher
  legibility (5-A UX side, incl. relationship to the overridden HUD boss-HP bar), and
  multi-target (lever 1) readability without colour-alone coding. No mechanics/tuning
  numbers (game-designer's parallel spec), no visual style (lead-art's law), no production
  code.
- release: `docs/game-design/ux/spec-boss-qte-differentiation-ux.md`. Headlines:
  - **2-C ruling (two sentences, §1.1):** during the smoke effect, the audio tell ADDS a
    redundant channel; it never REPLACES the visual telegraph. The visual telegraph must
    stay present — degraded in clarity by the smoke, never removed — for the full lead
    time, so a deaf/hard-of-hearing player clears the window on the visual channel alone,
    exactly like every other window in the fight. Stated as the accessibility CONSTRAINT
    (§1.3: lead-time floor unchanged, form-persists-clarity-drops, still not-colour-alone
    on its own); the audio tell's CHARACTER is left to `sound-designer` (Malik)'s parallel
    ruling.
  - **Parry (§2):** the parry tell must differ from the shoot (`EXPOSED`) tell in FORM
    (pose/motion), not colour alone; diegetic placement at the boss body, no HUD icon;
    same lead-time floor as the existing telegraph (`BOSS_TELEGRAPH_LEAD_FLOOR`), not a
    looser one; 44×44 CSS px touch-target floor on mobile if 3-A resolves to a new input
    hitbox (automatically satisfied if 3-A is a timing-reinterpretation of the existing
    click); ADR-0015 device wording (`clic`/`souris` vs. `deux doigts`) applies to any
    input copy; reduced-motion degrades to a held, non-strobing, still-distinguishable cue.
  - **Finisher (§3):** the finisher's visual state must be unmistakably different from an
    ordinary shoot/parry window — a one-shot event marker at `bossHp` → 0 (same family as
    the phase-break pulse), and if 5-A resolves to a dedicated HOLD sub-state, that HOLD
    must read as visually distinct from the existing passive `QTE_RESULT_HOLD` breather so
    a player doesn't sit through an active-input window thinking it's the passive one. The
    HUD HP bar settles/pulses once at 0% as reinforcement (not a new persistent
    "ready-to-finish" HUD state — would repeat the meter-family object `spec-boss-qte-hp-
read.md` §0.1 already argued against). Touch target: 44×44 px floor, recommended
    generous (ring-radius-or-larger, possibly near-full-frame during the HOLD) since a
    missed finisher due to touch precision rather than timing would be an unearned failure
    under §5.6.
  - **Multi-target (lever 1, §4):** "which point is live" must read from form/pose/
    position, never colour alone (restates ADR-0034 D2.4/D4.2 for the two-target case);
    diegetic on the boss body, no new HUD indicator. Covers both mechanic shapes
    `game-designer` might pick: discrete alternation needs its own mode-switch transition
    tell (not an instant silent flag flip); simultaneous dual-target likely doesn't need
    an extra separation marker (anatomically distinct zones, unlike the hostage duel's
    two-silhouette problem) but DOES need a form-based shielded/live state read per zone.
    If 1-C phase-gates the second target to phase 2/3, its first introduction needs its
    own "new pattern" cue, flagged as a possible confusable-with-phase-break risk.
- seam flagged, not resolved here: **2-C** — `sound-designer` (Malik) rules on the same
  Open Question from the audio side in parallel; if his ruling proposes audio as PRIMARY
  or SOLE during smoke (rather than additive to a still-present degraded visual), that
  directly conflicts with this ruling — routed to `lead-game-designer` (Karim) to
  reconcile before the design gate, not silently picked either way.
- other seams (not blocking, stated in the spec's own "Seams handed off" section):
  `game-designer` (all conditioned mechanic-shape decisions + numeric floors),
  `narrative-designer` (finisher/mode-switch/mobile-hint copy, ADR-0015 wording),
  `lead-art` (form/pose/motion execution for every not-colour-alone requirement),
  `dev-r3f-render` (everything drawn, all reduced-motion branches, HUD bar zero-state).
- Does NOT reopen `spec-boss-qte-hp-read.md`'s already-gated C1 ruling (D1-D3 unchanged)
  or the V1 design gate (ADR-0051).
- handoff → `lead-game-designer` (Karim): design gate, alongside `game-designer`'s and
  `narrative-designer`'s parallel specs for this story, per the Definition of Done. Please
  confirm the 2-C seam (above) is either concurred with by `sound-designer` or explicitly
  reconciled before PASS.
- File List: `docs/game-design/ux/spec-boss-qte-differentiation-ux.md` (new).

## 4. AUDIO SPEC — sound-designer (Malik) — 2026-07-20

- claim: audio-flow verdict on the specced audible behaviour BEFORE implementation
  (`COLLABORATION.md` §audio flow), running in parallel with `game-designer` /
  `narrative-designer` / `ux-designer` on this story's design loop. Drafted the audio
  bible (`docs/audio-direction.md`) first — it did not exist yet, my first-activation
  deliverable per the agent fiche — then the audio spec for the pack.
- release:
  - `docs/audio-direction.md` — **NEW**, the audio bible (did not exist before this
    pass). Identity (sonic twin of the fanzine B&W + acid neon art bible: 1998 Paris
    free-party, acidcore/tribe/hardtek, period-correct test), the law of sound (_ce qui
    sonne informe_ — tension tiers legible, every SFX maps 1:1 to one event), the
    mix-serves-the-loop rule, an honest inventory of the shipped system incl. two
    pre-existing gaps flagged (not fixed): `shoot.wav`'s unresolved-licence FAIL is
    already on record in `CREDITS.md`; newly noted here that `hit`/`death` are dead
    code paths (referenced by `audioSystem.ts`'s `playSfx` type, never called anywhere
    in `src/` — verified by grep), and §6's "10 tracks minimum" is not yet met (5
    shipped). Gate criteria stated (licence-first, period-correct, legible-function,
    mix-safe).
  - `docs/game-design/spec-boss-qte-differentiation-audio.md` — **NEW**, the audio spec
    for the 5-lever pack. Headlines:
    - **Lever 2 / OQ2-C (smoke audio tell) — MY POSITION: ADD, do not REPLACE.** A
      rising filtered riser (duration = phase `telegraphLeadSeconds`, 0.45→0.35s,
      time-compressing with phase like the bible's existing tempo-accelerates law) +
      a dry metallic downbeat at the `SHIELDED→EXPOSED` flip, layered ON TOP of the
      (merely degraded, not removed) visual tell — extends the game's "not colour
      alone" discipline to "not audio alone." Flagged as contingent on `ux-designer`
      (Tony)'s parallel ruling; if he lands on REPLACE instead, that is a real seam for
      `lead-game-designer` to arbitrate, not something I silently resolved myself.
    - **Lever 3 (parry) — 3 new cues specced by character, contingent on
      `game-designer`'s still-open 3-A/B/C mechanic rulings:** a dry single-transient
      parry-window tell (distinct texture family from the lever-2 sweep — sweep vs.
      ping, blind-distinguishable); a metallic success clang with a sound-system
      (vinyl-cut/fader) flavour, not a generic fantasy-parry sting; a quiet, diegetic,
      non-punitive whiff cue (explicitly not an arcade fail-buzzer — fails the
      period-correct test).
    - **Lever 5 (finisher) — frames, does not replace, the existing WON/
      `QTE_RESULT_HOLD` beat:** a BGM hush/duck (frozen tier-2 bed, §0) as the beat
      opens, one ceremonial impact stinger (same sonic family as the parry clang, a
      sound-system "kill-switch-and-slam-back" gesture) on the click, then the
      existing `bgm_win.mp3`/WON treatment resumes unchanged. Failure-mode audio
      explicitly left unspecced pending `game-designer`'s 5-B ruling (guaranteed-
      success vs. real failure surface) — not an oversight.
    - **Lever 4 (renfort) — informational SHAPE only, no tuning, per the
      `senior-architect` 4-C ruling (§3 of this shard: in-tableau, energy-ledger-priced,
      no real enemies).** A low ambient pressure bed, monotonic rise/resolve, needed
      because BGM tension is FROZEN for the whole encounter (`isBossQteActive`
      early-return holds whatever tier was live at trigger — almost certainly tier-2
      `bgm_danger.mp3` in practice, verified against `App.tsx`'s `setTension` wiring) —
      this cue is the only sonic channel available to carry that specific state.
      Binding mix constraint regardless of final tuning: must never mask the window
      telegraph or parry tell.
    - **New vs. reuse, consolidated (§5 of the spec):** 8 NEW one-shot/layer assets
      (smoke-tell riser + downbeat, parry tell + clang + whiff, finisher hush + impact,
      renfort pressure bed) — all future `dev-tooling-assets` sourcing/generation work,
      gated by me (licence-first) before landing in `public/assets/audio/`. 1 REUSE
      (existing `bgm_win.mp3`/`QTE_RESULT_HOLD` treatment for the finisher handoff,
      untouched).
    - **VERDICT: APPROVABLE FOR IMPLEMENTATION, with 3 open seams flagged, none
      blocking the sourcing lane from starting:** (1) lever 2-C ADD-vs-REPLACE pending
      reconciliation with `ux-designer`; (2) lever 3 character holds under either shape
      of `game-designer`'s 3-A ruling, wiring TBD; (3) lever 5 failure-mode audio and
      lever 4 magnitudes deliberately unspecced pending those lanes' open rulings.
      Automatic-FAIL triggers restated (sole-channel safety cue, non-period-correct
      polish, lever-4 cue loud enough to mask a window telegraph).
- handoff → `ux-designer` (Tony): reconcile lever 2-C ADD-vs-REPLACE position; escalate
  to `lead-game-designer` if we diverge.
- handoff → `game-designer` (Sacha): lever 3 (3-A/B/C) and lever 4 tuning rulings feed
  final cue wiring (character already specced, contingent notes flagged inline); lever 5
  5-A/5-B ruling feeds finisher wiring + whether a failure-mode cue is needed.
- handoff → `narrative-designer` (Yasmine): lever 4's diegetic dressing (whose approach
  the pressure bed represents — his men vs. a rival unit, OQ4-D) — I specced function
  only, not the diegetic object.
- handoff → `dev-tooling-assets`: 8 NEW assets queued for future sourcing/generation
  once the above seams close and the tech plan lands — not started yet (design-loop
  spec pass only, per the audio-flow contract).
- handoff → `lead-game-designer` (Karim): design gate — this spec is my AC1-adjacent
  input (OQ2-C answered from the audio side; OQ3-C/5-A informed but not tranched, those
  stay `game-designer`'s).

**File List:**

- `docs/audio-direction.md` (NEW)
- `docs/game-design/spec-boss-qte-differentiation-audio.md` (NEW)
- `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 4. DESIGN LOOP — game-designer (Sacha) — 2026-07-20 — mechanic + tuning spec (levers 1/2/3/4/5)

- claim: the mechanic/tuning half of the design loop — answer every Open Question I own
  (1-A/B/C, 2-A/B, 3-A/B/C, 5-A/B) with concrete numbers stated against the REAL constants in
  `bossQteSystem.ts`/`types/bossQte.ts`, structured by the story's Wave 1 / Wave 2 sequencing.
  Lever 4 was tuned IN THIS SAME PASS after `senior-architect`'s 4-C freeze-law ruling landed
  mid-run (§3, option (b)) — AC4 satisfied (tuned only after the ruling, within its four
  constraints). NOT fiction (`narrative-designer`), NOT HUD/accessibility surfaces
  (`ux-designer`), NOT audio character (`sound-designer`) — referenced where my mechanics depend
  on them.
- release: `docs/game-design/spec-boss-qte-differentiation.md` (DRAFT — needs Karim gate PASS).
  Answers to the Open Questions I own:
  - **1-A — a SECOND SIMULTANEOUS target** (not continuous re-colour = the hostage model; not
    discrete alternation = a weak differentiator). During EXPOSED, two rings at once: VITAL/tête
    (2 HP, small, fast, risky) + LIMB/corps (1 HP, larger, slow, the safe bank). One shot tested
    against both; overlap scores vital.
  - **1-B — both live together, one shared danger clock.** `windowChipped` stays a single bool
    (a chip from either answers the window); a blown window is one `blownWindows++` + one phase
    drain — no double jeopardy. The choice is purely offensive.
  - **1-C — phase-escalation: phase 1 single ring (V1 exactly, onboarding); split introduced at
    the phase-1→2 break; phases 2-3 two rings.** Raises the ceiling, keeps phase 1 legible.
  - **3-A — STATED PLAINLY: the SAME fire-click reinterpreted by a distinct telegraphed CHARGED
    window. NO new input channel, NO `src/hooks` change.** Decoded inside `tickBossQte` from the
    existing `fire`+`impactPoint` (verified: that's the only input the tick receives). Chosen for
    controller-parity (desktop/mobile one action) + §5-rule-5 compliance. Narrative concurs: Muf
    shoots the pistol as it rises ("il tire sur l'arme").
  - **3-B — success = +2 HP chip + STAGGER (bonus EXPOSED window, tempo flip); whiff (charged shot
    unanswered) = −10 + ONE blown window (single charge, not double); panic click during the
    window = −6, non-consuming.** Severity ledger monotonic.
  - **3-C — REQUIRED distinct tell: `parryLeadSeconds` (0.8 teach / 0.6) ≥ `BOSS_TELEGRAPH_LEAD_
FLOOR 0.35` and < the phase lull; `parryWindowSeconds` (0.7/0.6) ≥ `PEEK_EXPOSURE_FLOOR 0.5`.**
    Channel-distinct from the shoot tell (UX/art own the look; concurs with UX §2 form-not-colour).
    Cadence: 1 teach in phase 2, every-other window in phase 3 (verify-tunable).
  - **2-A — data-driven SHAPE, single authored instance.** One optional `BossQteSpec.decorProp`
    (position + arm phase), behaviour a system constant; `null` = unchanged. Not bespoke-hardcoded,
    not a generic multi-prop system (YAGNI). Array-promotion is the deferred F3 seam.
  - **2-B — PLAYER-TRIGGERED, sited in the SHIELDED gap (not a third EXPOSED ring).** Shoot the
    armed prop during the lull → +3 HP burst (`BOSS_DECOR_DAMAGE`), single-use, PURE UPSIDE
    (missing costs nothing → no §5.6 failure surface). Smoke/audio-tell half (2-C) deferred to
    ux+sound — my constraint: visual tell degraded-NOT-removed (≥ floor lead), audio is a redundant
    ADD. Both UX §1.1 and sound (lever 2) independently landed ADD-not-REPLACE — converged, on
    track.
  - **5-A — a dedicated FINISHER beat that PRECEDES `QTE_RESULT_HOLD` (does not replace it).**
    `bossHp≤0` → FINISHER (awaits a final click) → WON (+50) → `QTE_RESULT_HOLD 2.2` → DONE.
    Mirrors the porte-cochère execution-click. Narrative: the reach for the radio, stopped;
    optional prompt « LIVRE LE SON » (ux-owned).
  - **5-B — CEREMONIAL, guaranteed-success, auto-resolving.** Click OR a 1.5 s timeout resolves it;
    damage-free; zero failure surface. Agreed with the story's lean — no bullshit-death at victory.
  - **4-A/4-B (tuned after 4-C, option (b) constraints):** an in-tableau, seeded, telegraphed
    PRESSURE SURGE — no shootable body, no bullets, no lives (reads as "pas ses hommes" = a lost
    CRS section, per narrative 4-D). In-economy pricing (4-B, no double jeopardy): the surge
    MODULATES the boss's own blown-window drain to `QTE_RENFORT_DRAIN −12` on flagged windows
    (single charge, NEVER a second clock, NEVER accelerates `maxBlownWindows` — one blown window =
    one count, just heavier energy). Phase 3, 1 surge, 2 windows, onset tell ≥ floor. Touches no
    `enemies`/`spawnWave`/`couriers`/`bullets`/`elapsedSeconds`, no `qteSystem.ts`. Folds into
    Wave 2 per the ruling.
  - Per-lever AC2 reuse maps (extends-in-place vs. newly-authored) + design-VERIFY acceptance
    (AC-D1..D8) stated. Winnability: `bossHp 24`/`maxBlownWindows 10` NOT re-tuned on paper;
    stage-5 seed-repin obligation flagged (two decorrelated ring paths + parry timing make it
    harder than V1's single ring).
- seams flagged (mechanics depend on, do not decide):
  - `ux-designer` + `sound-designer` — 2-C (converged ADD-not-REPLACE ✓); parry tell form (3-C);
    finisher-hold-distinct-from-`QTE_RESULT_HOLD` read; two-ring form-not-colour read; renfort
    frame-edge + audio pressure read.
  - `narrative-designer` — parade « il tire sur l'arme », renfort « pas ses hommes »/lost CRS,
    finisher reach-for-radio + « LIVRE LE SON », décor set-dressing. All reads referenced.
  - `senior-architect` (TECH PLAN, not now) — 5-A finisher shape (new phase vs. ACTIVE sub-state);
    ADR-0052; review-assert lever-4 boundary compliance.
- handoff → `lead-game-designer` (Karim): design gate — requesting `VERDICT:` (PASS /
  PASS-WITH-CORRECTIONS / FAIL) covering Wave 1 / Wave 2 (levers 2, 5, 4-folded) / and the AC4
  discipline (lever 4 tuned only post-4-C). Most likely correction sites I flag myself: the
  phase-3 parry cadence and the number of renfort surges (both verify-tunables), and the
  lever-1/lever-3 phase-introduction ordering.
- File List:
  - `docs/game-design/spec-boss-qte-differentiation.md` (NEW — this spec)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 5. DESIGN GATE — lead-game-designer (Karim) — 2026-07-20 — design gate on the 4 design-loop deliverables

- claim: gate verdict on the full stage-2 design loop for STORY-BOSS-QTE-DIFFERENTIATION —
  `game-designer` mechanics (`spec-boss-qte-differentiation.md`), `narrative-designer` fiction
  (`spec-boss-differentiation-fiction.md`), `ux-designer` UX/accessibility
  (`ux/spec-boss-qte-differentiation-ux.md`), `sound-designer` audio
  (`spec-boss-qte-differentiation-audio.md` + the new `docs/audio-direction.md` bible) — checked
  against AC1/AC3/AC4, §5.6, the ADR-0051/spec-boss-qte-encounter.md V1 contract, the 4-C ruling
  (shard §3), and cross-spec coherence. Constants cross-checked against real code
  (`bossQteSystem.ts`: `BOSS_DAMAGE_VITAL 2`/`BOSS_DAMAGE_LIMB 1`, anatomy bands, tick signature
  `(qte, fire, impactPoint, dt)`, floors) — spec is written against the shipped names, band-⊂
  containment for the two ring wander-boxes checks out arithmetically, all telegraph/exposure
  floors respected and asserted-at-review.

VERDICT: PASS — design gate mechanics (lead-game-designer)
VERDICT: PASS — design gate fiction (lead-game-designer)
VERDICT: PASS — design gate ux (lead-game-designer)
VERDICT: PASS — design gate audio (lead-game-designer)
VERDICT: PASS — design gate overall / boss-qte-differentiation pack (lead-game-designer)

### Why PASS (the adversarial checklist, logged)

- **AC1 (every OQ answered) — MET.** 1-A/B/C, 2-A/B (mechanics); 2-C (ux §1.1 + sound §1, both
  ADD-not-REPLACE); 3-A/B/C, 5-A/B (mechanics); 4-A/B (mechanics, post-ruling); 4-C (architect
  shard §3, option b); 4-D (fiction §2, lost CRS section). None silent, none merely implied.
- **AC3 (exactly 5 levers, no silent veille add) — MET.** Mechanics §0 AC3-note explicit; sound
  §0 refused to spec the adjacent phase-break-audio / hit-death-deadcode gaps to avoid scope creep.
- **AC4 (lever 4 tuned only AFTER 4-C, within its 4 constraints) — MET.** Sequencing honoured
  (tuned mid-run after the ruling landed). All four constraints held: in-tableau (frame-edge
  silhouettes, no shootable body), energy-ledger-only (`QTE_RENFORT_DRAIN −12` MODULATES the
  existing blown-window drain, no 2nd clock, never accelerates `maxBlownWindows`, no lives/bullets),
  telegraphed seeded-pure (seeded window ordinal, onset tell ≥ 0.35 floor), touches no
  `enemies`/`spawnWave`/`couriers`/`bullets`/`elapsedSeconds` and no `qteSystem.ts` (reuse-map §4
  asserts this at review). Parry×surge overlap explicitly de-stacked (max, never both).
- **Wave 1 / Wave 2 / lever-4-fold sequencing — PRESERVED, no blob.** Spec is structured Wave 1
  (levers 1,3) / Wave 2 (levers 2,5,4-folded); Wave 2 depends only on Wave 1's _shape_. Lever 4
  folds into Wave 2 per the 4-C ruling (no split — conditional-split trigger not met).
- **3-A reversal (story AC7 concern) — VISIBLE & CONSCIOUS.** §3-A names the reopened V1
  "no-new-verb" OUT line and states plainly it takes the _conservative_ option: the SAME fire-click
  reinterpreted by a distinct CHARGED window, NO new input channel, NO `src/hooks` change — a new
  verb _in feel_, not a new verb-_input_. The reversal is therefore minimal and explicit, not drift.
  (Flagged to `pm` for the AC7 re-review: this is the least-invasive reading of the reopened line.)
- **§5.6 — every new failure surface attributable.** Two-ring window = single `windowChipped` bool,
  one blown-window/one drain (no double jeopardy). Parry whiff = −10 + one blown window (single
  charge), telegraphed by a distinct `parryLeadSeconds` ≥ 0.35 & < lull; `parryWindowSeconds` ≥ 0.5.
  Decor prop = pure upside (zero failure surface). Finisher = ceremonial, guaranteed, zero failure
  surface. Renfort heavier drain lands only on a BLOWN window inside a TELEGRAPHED surge. Severity
  ledger monotonic in magnitude (5≤6≤8≤10≤12).
- **Cross-spec coherence — HOLDS.** Parade: fiction "il tire sur l'arme" ⇄ mechanic (same-click
  CHARGED window, parryPoint = rising sidearm) ⇄ ux (form-not-colour raised-weapon pose) — one
  event, three lanes agree. Finisher: fiction "LIVRE LE SON / delivery-not-execution" ⇄ mechanic
  (ceremonial FINISHER precedes `QTE_RESULT_HOLD`, auto-resolve) ⇄ ux (D3.2 HOLD visually distinct
  from the passive breather) — agree. Renfort: fiction (lost CRS section, "pas ses hommes",
  sharpens isolation) ⇄ 4-C (no shootable bodies, in-tableau) ⇄ audio (low ambient pressure bed,
  mix-subordinate) — agree.
- **2-C seam — CONVERGED, no arbitration needed.** ux §1.1 and sound §1 BOTH independently landed
  ADD-not-REPLACE (redundant audio over a degraded-not-removed visual telegraph holding the full
  ≥-floor lead). This satisfies ux A3 / sound seam #1 (they asked me to confirm convergence or
  reconcile) — I confirm convergence; the smoke half is on track.
- **Audio open seams — now closable.** Of sound's 3 flagged seams: (1) 2-C converged (above);
  (2) lever-3 wiring — mechanics 3-A resolved to same-click-reinterpreted, so the parry-tell/clang/
  whiff character holds and wiring is known; (3) 5-B resolved to guaranteed-success, so NO finisher
  failure-mode cue is needed, and lever-4 magnitudes are now posted. Audio is clean to proceed to
  the ASSET GATE (licence-first still applies to every sourced asset).
- **Verifiability — qa-lead can write a plan.** Mechanics values concrete vs. real constants +
  AC-D1..D8 + asserted floors; ux A1–A15 are screenshot/e2e-checkable; audio via ASSET+mix gate.
  Two flagged verify-tunables (phase-3 parry cadence, renfort surge count) are playtest-tuned, not
  untestable. `game-designer` design-acceptance (2nd gate leg) will re-verify vs. this spec @ stage 5.

### REQUIRED corrections: NONE (nothing blocks dev). Advisories below are logged, not gated.

Per the bounded-iteration rule, I do not spend a rework round on the following — they are verify-leg
or art-flow items, several deferred to the (unopened) Niveau-Final story, none of which stop
`senior-architect` from cutting lanes or a dev from building:

1. **[verify-leg → `game-designer`]** Phase-2 double-introduction. Phase 2 introduces BOTH the
   two-ring split (at the phase-1→2 break) AND the first parry "teach" (near phase-2 end) — mildly
   straining the spec's own "one-variable-per-phase" claim (ux D4.7 flags the same risk). The
   temporal separation is deliberate; the design-acceptance verify leg must confirm it reads cleanly,
   with authority to push the parry teach to phase-2-end/phase-3-start if cognitive load is too high.
   Sacha already flagged this ordering as a likely correction site — no pre-build rework needed.
2. **[copy → `narrative-designer` owns; note to `ux-designer`/`dev`]** Finisher prompt copy: the
   canonical string is fiction §3.3 « LIVRE LE SON » (or « LIVRE. ») — delivery, not execution, per
   the tone guardrail. UX §3.3 D3.3's "ACHEVER" is an _illustrative placeholder only_ and is
   SUPERSEDED (an execution verb would break the fiction's no-kill-word guardrail). Dev/art use the
   narrative string.
3. **[design↔art seam → `lead-art` (peer flag, I don't arbitrate visuals)]** The decor prop
   (lustre/enceintes) is a player-triggered SHOOTABLE target during its armed window, so per the
   bible "ce qui brille est interactif" it must read as interactive (glow) WHEN armed — yet the
   fiction frames the lustre as "the grey old world / le vieux monde". Reconcilable (it glows only
   during its armed window = exactly when it is interactive), but flag it to `lead-art` now so it
   doesn't surprise at composite. Harness uses placeholder decor (AC8), so non-blocking today.
4. **[art-flow → `lead-art`, when Niveau Final opens — NOT now, ADR-0051 N2]** Form-distinct art
   asks the specs raise: parry tell categorically distinct in form from the shoot tell; two-ring
   form-not-colour live/shielded read; finisher distinct pose; smoke-degraded telegraph retaining
   ≥-floor salience; new-venue props (lustre/enceintes/fumée). Routed via narrative's §5 request
   sheet only when the Niveau-Final story opens.
5. **[verify-leg → `game-designer`]** Seed-repin obligation (K-5). `bossHp 24`/`maxBlownWindows 10`
   NOT re-tuned on paper (correct — gated V1 base stands). Two decorrelated ring paths + parry timing
   make the pinned-seed winnability check harder than V1's single ring; confirm each phase-2/3 window
   presents ≥1 landable waypoint on EACH ring, each charged window a landable parry, decor arm-window
   landable — or re-pin. Most likely `verify` correction.
6. **[nit → `game-designer`, non-blocking]** `parryPoint (−0.40, 0.30)` rationale says "aligned with
   the `BOSS_L_SHOULDER` band" but the band is dy 0.45–0.85; y=0.30 sits just below it (the 0.30
   catch radius does overlap into it). The value is unambiguous & implementable; only the rationale
   note is loose. Ensure the drawn raised-gun-arm pose visually coincides with the parryPoint at
   `verify` (already inside the ux/lead-art form-legibility ask).

### Fiction flags — ratified

- **Flag 1 (NEW canon — Niveau-Final venue, a squatted grand disused hall with an old chandelier):**
  RATIFIED as a conscious, loose-form extension (ADR-0030 "conscious/documented/justified" bar).
  Fold into the future `narrative-bible.md` alongside « le Commandant ». `art-advisor` (Estelle)
  consult for the chandelier-hall culture-grounding when the Niveau-Final story opens — not now.
- **Flag 2 (4-D — renfort = a lost CRS section, NOT his men):** RATIFIED. Traces 1:1 to §7 (CRS/BAC
  distinct corps) + shipped `enemy_riot`; no 4th faction (AC6); does NOT contradict « il n'a plus
  personne pour le couvrir » — it corroborates and sharpens the isolation. This is the AC6 ask the
  story named; closed. Note: fiction §2.4's "if real enemies" branch is now MOOT (4-C ruled option
  b) — harmless dead documentation, not a contradiction.
- **Flags 3–6 (coup de grâce = delivery-not-execution; parade = shot-on-the-weapon; AC8 held;
  fiction decides no mechanic/surface):** RATIFIED as consistent with the gated encounter fiction and
  the mute-QTE law.

### Audio bible

`docs/audio-direction.md` (NEW, sound-designer's first-activation deliverable) accepted as the audio
backbone (sister to `art-direction.md`). Its honest pre-existing-gap flags (`shoot.wav` licence FAIL
on record; `hit`/`death` dead code paths; §6 "10 tracks" not yet met) are correctly OUT of this
story's scope — routed to `producer` for backlog, NOT gated here.

- handoff → `pm` (John): AC7 re-review of the gated pack — Wave 1/Wave 2/lever-4-fold respected, no
  blob, 3-A reversal visible (the conservative same-click reading). All ACs I own are green.
- handoff → `senior-architect` (Winston): design gate PASS — cleared for TECH PLAN (ADR-0052:
  amend ADR-0051 or new extending ADR; the 5-A finisher shape new-phase-vs-ACTIVE-sub-state call;
  the review-time assert that lever-4 logic touches no `enemies`/`spawnWave`/`couriers`/`bullets`/
  `elapsedSeconds`). Gate runs AFTER `pm` AC7 re-review per the story DoD.
- handoff → `lead-art` (Nico): peer flags 3 & 4 above (decor glow-vs-grey seam now; form-distinct
  art asks + new-venue canon routed via narrative §5 when Niveau Final opens).
- handoff → `game-designer` / `narrative-designer` / `ux-designer` / `sound-designer`: PASS, no
  rework round consumed; advisories 1–6 tracked for the `verify` design-acceptance leg (2nd gate leg).
- NOTE (process): appended via Edit, not the mandated `cat >>` heredoc — this subagent environment
  exposes no Bash tool (same limitation `narrative-designer` recorded in §3). Kept strictly additive
  at end-of-file to minimise concurrent-append risk.
- File List:
  - `docs/game-design/README.md` (index updated — the 4-spec pack row added, In flight / gated)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 6. AC7 RE-REVIEW — pm (John) — 2026-07-20 — product/scope re-review of the gated pack

- claim: story-owner re-review (AC7) of the design-gate-PASSed pack — mechanics
  (`spec-boss-qte-differentiation.md`), fiction (`spec-boss-differentiation-fiction.md`),
  UX (`ux/spec-boss-qte-differentiation-ux.md`), audio
  (`spec-boss-qte-differentiation-audio.md`) — against this story's own scope decisions
  (Wave 1/2/carve-out sequencing, the 3-A reversal, AC3/AC5/AC6/AC8, the out-of-scope
  list) and against the product question the story exists to answer. This is a scope
  review, not a second design gate — Karim's PASS on adversarial mechanics/fiction/
  UX/audio correctness stands unrevisited here.

VERDICT: CLEARED FOR TECH PLAN — no blocking scope violations found (pm)

### Checklist findings

- **Wave 1 / Wave 2 / lever-4-fold — RESPECTED, no blob.** Mechanics spec is
  structurally split Wave 1 (levers 1, 3 — the two that redefine the moment-to-moment
  loop) / Wave 2 (levers 2, 5, and 4 folded in per the 4-C ruling), matching the story's
  sequencing exactly, each lever with its own reuse map, tuning table and phase-
  introduction slot (phase 1 = V1-identical onboarding; phase 2 = two-ring split + one
  parry teach; phase 3 = full kit + one renfort surge). No lever is silently merged into
  another's spec.
- **3-A reversal — VISIBLE, CONSCIOUS, and an acceptable resolution.** `game-designer`
  named the reopened OUT-of-scope line explicitly and took the conservative reading: the
  SAME `fire`+`impactPoint`, reinterpreted by a distinct telegraphed CHARGED window — no
  new input channel, no `src/hooks` change. Checked against the AC7 question directly:
  does it still read as a new BEAT without a new input channel? Yes — it has its own
  telegraph channel (`parryLeadSeconds`, categorically distinct form per UX D2.1), its
  own reward/cost ledger (chip+stagger vs. −10 whiff vs. −6 panic), its own fiction
  ("il tire sur l'arme," not a re-skinned shoot), and its own audio texture family (dry
  transient vs. the shoot-tell's sweep). Four independent lanes converge on the same
  event reading as functionally distinct from a shoot beat. This satisfies the reversal
  Bertrand asked for — it is minimal-input but not minimal-experience.
- **AC3 (exactly five levers, no sixth veille idea folded in) — HOLDS, two items
  reviewed and cleared as in-scope support, not additions:**
  - The decor prop (lever 2's stagger target) is not a sixth idea — it is 2-A/2-B of
    the story's own named lever 2, not a new mechanic.
  - The CRS-section fiction (4-D) is not a sixth idea — it is the story's own named
    Open Question 4-D, required by AC6 to justify lever 4 diegetically.
  - Mechanics spec self-audits (§0: "no other veille Tier S/A idea… is folded in") and
    audio spec self-audits (refuses to spec the adjacent phase-break-audio /
    `hit`/`death` dead-code gaps, routing them to `producer`'s backlog instead) — both
    checked and correct.
- **AC8 (non-shipped harness status unchanged) — HOLDS.** Fiction spec pins this twice
  (§0 "AC8 — nothing here ships live," §1.3 harness-vs-canon split) and ratifies it again
  in flag 5. No spec touches `belliard`'s live `LevelConfig` or proposes shipping
  anything live/canon. The Niveau-Final live-ship follow-up is referenced only as a
  future, not-yet-opened destination for held canon.
- **Out-of-scope list — INTACT.** No fuyard variant, no mini-boss tier, no hostage-QTE
  retune anywhere in the four specs; ADR-0034 is cited only as a structural precedent
  (parry point, execution-click shape), never as something being modified.
- **AC5/AC6 — ON TRACK.** ADR-0052 allocated by `producer` (§2), not yet drafted — correct
  sequencing, TECH PLAN is next after this review. Fiction traces 1:1 to the gated
  Commandant fiction and is checked line-by-line against « il n'a plus personne pour le
  couvrir » (§1.3/§2.3 of the fiction spec); Karim's gate ratified this as the AC6 ask,
  closed.
- **Product question — the pack, as specced, plausibly answers Bertrand's playtest
  verdict.** The differentiation thesis table (mechanics §0) shows a real verb/decision
  change on 4 of 5 levers (new decision on 1, new verb+decision on 3, new decision on 2,
  new decision on 4; only 5 is a pure flourish, correctly so — a victory beat should not
  add a decision). Phase 1 stays deliberately hostage-shaped (V1-identical, a conscious
  onboarding choice, not drift) but phases 2-3 — the majority of the fight's HP and
  duration — diverge hard: a two-target choice, a parry beat, and (phase 3) a pressure
  surge stack on top of each other. At the table this should no longer read as "l'otage
  sans l'otage." This is a design claim the spec argues coherently for, not something
  `pm` can independently verify pre-code — it is exactly what `game-designer`'s own
  AC-D1 ("a playtester describes a different moment-to-moment than the hostage duel")
  is built to test at stage-5 `verify`. Flagging that this is the load-bearing
  empirical check, not rubber-stamping it as already proven.

### Advisories (non-blocking, logged for tracking — not scope violations)

1. **`docs/audio-direction.md` (the new audio bible) is infrastructure, not a sixth
   lever.** It was drafted because it didn't exist yet (sound-designer's first-
   activation deliverable), not requested by this story. Correctly out of this story's
   scope either way (it documents an existing system + flags two pre-existing gaps,
   routed to `producer`'s backlog, not gated here) — no action needed, noting only that
   its existence should be indexed as a project artifact, not counted against this
   story's deliverable list.
2. **The new venue canon (flag 1, "a squatted grand disused hall" for the Niveau
   Final)** is a genuine first-time naming of the finale building, ratified by Karim as
   a conscious extension. It is correctly held (non-canon placeholders in the harness,
   loose form only) and doesn't ship here — but naming the finale venue is a
   worldbuilding call with more weight than a prop description. Recommend a one-line
   confirmation from Bertrand before it hardens further, whenever the Niveau-Final story
   is opened — not a gate for this story.
3. Karim's six logged advisories (phase-2 double-introduction, finisher-copy
   supersession, decor glow-vs-grey art seam, deferred art-flow asks, seed-repin
   obligation, parryPoint rationale nit) are verify-leg / art-flow items already
   correctly routed and non-blocking for TECH PLAN — re-confirmed here as within their
   owners' lanes, nothing re-opened.

- handoff → `senior-architect` (Winston): AC7 CLEARED — proceed to TECH PLAN (ADR-0052:
  amend ADR-0051 or new extending ADR; the 5-A finisher shape call; the lever-4
  boundary-compliance assert already specced against). No scope corrections requested.
- handoff → `producer` (Marion): track advisory 1 (audio bible indexing) and advisory 2
  (Bertrand confirmation on the new venue canon, timed to the Niveau-Final story
  opening, not this one) on the backlog; not blockers for this story's dev lanes.
- File List: `docs/handoffs/story-boss-qte-differentiation.md` (this entry — additive
  edit, end-of-file only).

## 7. TECH PLAN — senior-architect (Winston) — 2026-07-20 — ADR-0052 + lane partition + perf/art/audio calls

- claim: the full TECH PLAN after the design gate PASS (§5) and pm AC7 clearance (§6). Delivers
  ADR-0052 (AC2/AC5), the stage-4 BUILD lane partition, the perf-sensitivity call, the art-lane
  call, and the audio-wiring call. Contract surface verified against real code before writing the
  reuse map (`stateMachine.ts:160-197`, `bossQteSystem.ts` tick + `createBossQte`,
  `types/bossQte.ts`, `useGameLoop.ts:295`, `BossQteSprite.tsx`, `BossHpBar.tsx`,
  `levels.ts:221-242`) — the reuse map is written against shipped names, not assumed.

### ADR-0052 — EXTENDS ADR-0051 (does not supersede)

- release: `docs/adr/0052-boss-qte-differentiation-levers.md` (Accepted; number allocated by
  producer §2, not self-allocated); `docs/adr/README.md` index row added.
- **AMEND-vs-EXTEND call: EXTEND.** A new ADR that extends ADR-0051 in place, exactly as ADR-0051
  extended ADR-0030/0034 ("extends, does not supersede" — the story's binding precedent). ADR-0051
  stays Accepted, unamended. ADR-0052 records the ONE clause it narrows: ADR-0051 D1's "top-level
  phase machine byte-shape-identical to the shell" — lever 5 adds a `FINISHER` node — while D1's
  _isolation / additive-and-optional_ property (`bossQteSpec === null` ⇒ byte-for-byte identical)
  is untouched. The narrowing is recorded, not silent.
- **Finisher shape (5-A) — RATIFIED as a new top-level `FINISHER` phase, NOT an `ACTIVE`
  sub-state.** Rationale: the phase break is a modulation of the live duel (correctly an `ACTIVE`
  sub-state in ADR-0051); the finisher is post-combat (0 HP, no windows/wander/telegraph/drain), so
  folding it into `ACTIVE` would force every safety-critical branch to guard `if (!finisherPending)`.
  Insertion is surgical: the depleting-hit return (`bossQteSystem.ts:605-616`) sets
  `phase:"FINISHER"` (energyDelta 0) + seeds `finisherRemaining`; a new `case "FINISHER"` resolves
  on any `fire` OR a 1.5 s timeout → `WON` (+`QTE_BOSS_REFILL 50` paid there) → `QTE_RESULT_HOLD 2.2`
  → DONE. `BossQtePhase` and `isBossQteActive` gain `"FINISHER"` (freeze holds through the beat);
  `stateMachine.ts` needs NO edit (it _calls_ `isBossQteActive`). 5-B ratified: ceremonial,
  guaranteed-success, damage-free — zero failure surface.
- **4-C freeze-law ruling recorded as its OWN decision section (ADR-0052 D4), NOT folded into the
  reuse map** (the story Architecture directive). Law UNCHANGED, no exception; renfort reframed
  in-tableau; the four constraints (in-tableau only / energy-ledger-priced, no second clock, never
  accelerates `maxBlownWindows` / telegraphed seeded-pure / touches no
  `enemies`/`spawnWave`/`couriers`/`bullets`/`lives`/`elapsedSeconds` and no `qteSystem.ts`); the
  review-assert (mine at stage-6 + a TDD unit assertion) restated. Conditional-split trigger NOT
  met — lever 4 stays folded into Wave 2, no split, no boundary change to document.
- **Load-bearing finding:** the entire pack lives inside `bossQteSystem.ts` + `types/bossQte.ts` +
  the two view files. `stateMachine.ts`, `useGameLoop.ts` / all of `src/hooks`, the hostage system,
  and every shipped `LevelConfig` are **byte-untouched**. Cross-boundary merge surface = zero.

### Lane partition (stage 4 BUILD — non-overlapping, parallel-safe)

Both dev lanes code against the runtime field/constant NAMES frozen in ADR-0052 D2/D3, so they run
concurrently without a race (render reads named state; game authors it). New runtime fields (names
frozen): `targetOffsetB` + fixed `ringB` identity, `chargedWindow`, `staggerRemaining`,
`decorArmed`/`decorConsumed`, `smokeActive`, `renfortActive`, `finisherRemaining`; new constants
`BOSS_*_WANDER_*` sub-boxes + speed multipliers, `BOSS_PARRY_POINT`, per-phase
`parryLeadSeconds`/`parryWindowSeconds`, `QTE_PARRY_CHIP +2`, `QTE_CHARGED_WHIFF −10`,
`BOSS_DECOR_DAMAGE 3`, `FINISHER_HOLD_SECONDS 1.5`, `QTE_RENFORT_DRAIN −12`, `renfortSurge` descriptor;
new `BossQteSpec.decorProp?`.

- **`dev-gameplay`** (pure `src/game`, TDD, spec values verbatim — boundary law: zero React/Three,
  seeded-pure, no `Math.random`/`Date.now`):
  - `src/game/types/bossQte.ts` — add `"FINISHER"` to `BossQtePhase`; extend the `BossQte` runtime
    with the frozen new fields; add optional `BossQteSpec.decorProp?: { position: Vec2;
armPhaseIndex: number }`.
  - `src/game/systems/bossQteSystem.ts` — two-ring wander (2nd `bossWander` call + salt) + shared
    `windowChipped` + overlap tie-break; parry decode in `tickBossQte` (same `fire`+`impactPoint`)
    - STAGGER sub-state; decor hit-test + `smokeActive` flag + the floor guarantee; the `FINISHER`
      phase (insertion + new case) + `isBossQteActive` extension; renfort surge derivation +
      `QTE_RENFORT_DRAIN` modulation; all new constants; new `createBossQte` asserts (⊂-band, parry
      floors, finisher/renfort floors, finite guards).
  - `src/game/systems/__tests__/bossQteSystem.test.ts` — TDD for all of the above incl. AC-D1..D8,
    the **D4 lever-4 boundary-compliance assertion** (reads/writes only boss-QTE fields), the
    `FINISHER`-holds-the-freeze test, determinism, ⊂-band containment.
  - `src/game/levels/levels.ts` — author `BOSS_QTE_DEV_HARNESS_LEVEL.bossQteSpec.decorProp` (one
    prop, phase-2 armed); note the stage-5 K-5 seed re-pin obligation. **Harness only — no shipped
    level touched.**
- **`dev-r3f-render`** (`src/render` only, logic-free, reads pure state; all reduced-motion
  branches per UX D2.7/D3.1):
  - `src/render/scene/BossQteSprite.tsx` — 2nd ring mesh + form-distinct per-zone live/shielded
    read (UX D4.1/D4.5); parry telegraph cue form-distinct from the shoot tell (UX D2.1) + STAGGER
    bonus-window read; decor placeholder mesh + armed-window glow (existing rim/quad idiom); smoke
    degraded-telegraph treatment (**technique pending the GPU verdict below**); renfort frame-edge
    silhouette quads (reuse `enemy_riot` texture, motion-only, no shootable body); `FINISHER` cue —
    one-shot marker distinct from an ordinary window AND from the passive `QTE_RESULT_HOLD` breather
    (UX D3.1/D3.2), reusing the phase-break pulse-quad family.
  - `src/render/ui/hud/BossHpBar.tsx` — the `bossHp===0` one-shot settle/pulse (UX D3.4); NO new
    persistent "finisher pending" state (UX D3.5). Minimal.
  - `src/render/ui/hud/types.ts` (`HudBossQte`) — **only if strictly needed; default NO.** Finisher
    is diegetic + bar-reinforced, renfort is diegetic — neither needs a new HUD field. Adding one
    is a boundary decision that needs my sign-off first.
- **Seam rules (who may touch what):**
  - `stateMachine.ts` — **NObody touches it this story.** It is the cross-cutting freeze/quota seam;
    any needed edit means the freeze is being perturbed (the exact thing 4-C ruled out) → STOP and
    escalate to me. A PR that edits it fails my triage.
  - `useGameLoop.ts` / `src/hooks` — **untouched** (3-A resolved to same-click; the loop already
    passes `fire`+`impactPoint`, verified `stateMachine.ts:168` / `useGameLoop.ts:295`). Stated and
    closed.
  - `types/bossQte.ts` — **dev-gameplay owns; dev-r3f-render reads only** (never edits). Both build
    against the ADR-0052 D2/D3 frozen names → no shared-file contention.
  - `qteSystem.ts` / `hostageQte.ts` — untouched (separate system, ADR-0051 D1).

### Perf-sensitivity call — YES, narrowly scoped to the SMOKE effect

Per the pipeline definition (post-processing, shaders, particles, render targets, draw-call
growth): most new reads are NOT perf-sensitive — the 2nd ring, parry cue, decor glow, renfort
frame-edge quads, `FINISHER` marker and the HUD settle all reuse proven cheap idioms (extra meshes,
tints, the pulse-quad family, the existing neon-rim `ShaderMaterial`), a bounded handful of extra
draw calls. **The smoke effect IS perf-sensitive** and its technique is unbounded (particle system
/ noise shader / fullscreen post-process are all on the table; the UX spec constrains only the
_read_ — "degraded, not removed" — not the technique). It stacks on the existing CRT composite
(ADR-0031) during the phase-3 frenzy — the worst-case concurrent frame: two rings + a parry cue +
smoke + renfort frame-edge motion + (near the end) the finisher, on mobile.

- **Ruling: `gpu-specialist` (Ben) MUST give a frame-budget verdict on the SMOKE technique BEFORE
  the render lane locks its implementation.** Scope for Ben — exactly two questions: (1) a
  frame-cost budget for the smoke degraded-telegraph treatment on mobile (technique recommendation:
  cheap alpha-blended textured quad vs. shader vs. anything touching a render target / the CRT
  pass); (2) a concurrent worst-case check of the phase-3 frenzy stack (2 rings + parry cue + smoke
  - renfort frame-edge quads + finisher marker) over the CRT composite, both device classes.
- Everything else in the render lane proceeds immediately (not gated on Ben), with the standing
  frame budget respected and re-verified at stage-5 with Ben's usual perf verdict. This is a narrow,
  justified pre-gate on one open-ended effect, not a blanket stall of the lane.

### Art-lane call — NO art/tooling FLUX lane opens now (deferred to Niveau-Final, logged so producer chases it)

The harness runs on the `enemy_riot` cop fallback (verified `BossQteSprite.tsx`
`resolveBossTexture`), and V1 already draws every read procedurally on it. Per Karim advisory 4 +
narrative §5 + ADR-0051 art-gate N2 ("no run ahead of need"): the form-distinct canon art asks
(parry raised-weapon pose, two-ring form read, finisher "reach-for-radio" pose, smoke-degraded
telegraph salience, new-venue props lustre/enceintes/fumée) route to `lead-art` **only when the
Niveau-Final story opens — NOT now.** The differentiation harness builds on **placeholder /
procedural visuals**: the render lane draws the new reads with the fallback sprite's firing/
non-firing frames + code-driven motion/tint/quads (the decor prop is a procedural placeholder mesh,
not a FLUX asset). **`dev-tooling-assets` has NO lane in this story.**

- **Logged deferral (producer to track against Niveau-Final, never silently dropped):** the 5
  form-distinct art asks above are a Niveau-Final dependency, carried by narrative §5's request
  sheet. The harness ships procedurally in the interim (AC8 unchanged — nothing canon ships live).

### Audio-wiring call — wire NOTHING this story; land triggers WITH the assets in a later lane

The audio spec's 8 cues are specs for FUTURE, licence-gated assets (`sound-designer` handoff:
"queued for future sourcing once the tech plan lands — not started yet"). The pure game layer
already exposes every transition the cues key off (stance flip, `telegraphActive`,
`phaseBreakRemaining`, the parry outcome, `FINISHER` onset, `renfortActive`, `decorArmed`), so no
new game field is needed for audio and **dev-gameplay wires zero audio** (boundary law: game stays
pure). For the render lane: **do NOT add speculative no-op / console `playSfx` trigger points now**
— that is exactly the pattern that rotted into the dead `hit`/`death` audio paths the audio bible
just flagged (§4 sound-designer). Audio wiring is a SEPARATE later lane: `dev-tooling-assets`
sources + licence-gates the 8 assets → then `dev-r3f-render` wires the trigger points against the
now-real `SfxName`s in the same pass (triggers and assets land together, no dead paths). Logged so
producer sequences that lane after this harness lands (or once assets clear the licence gate) — not
dropped.

- handoff → `producer` (Marion): stage 4 BUILD ready — launch `dev-gameplay` + `dev-r3f-render` in
  parallel (non-overlapping per above); gate the render lane's SMOKE technique on a `gpu-specialist`
  verdict (scope above) before it locks that one effect. Track two deferred lanes: (a) Niveau-Final
  form-distinct art asks; (b) the audio asset-sourcing + wiring lane. No `dev-tooling-assets` lane
  this story.
- handoff → `dev-gameplay` + `dev-r3f-render`: build to ADR-0052 (reuse map D2, finisher shape D3,
  boundary law D5) + the gated specs; TDD spec values verbatim; seam rules above are hard.
- handoff → `gpu-specialist` (Ben): the smoke frame-budget + phase-3 concurrent-worst-case scope
  above, before the render lane locks the smoke technique.
- NOTE (process): TECH PLAN entry appended via `cat >>` heredoc (Bash available here), strictly
  additive at end-of-file.
- File List:
  - `docs/adr/0052-boss-qte-differentiation-levers.md` (NEW)
  - `docs/adr/README.md` (index row added)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)
