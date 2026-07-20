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
