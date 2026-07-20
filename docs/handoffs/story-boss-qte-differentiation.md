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

## 8. PERF VERDICT (pre-build) — gpu-specialist (Ben) — 2026-07-20 — smoke technique + phase-3 worst-case composite

- claim: the two-question pre-build perf verdict the TECH PLAN (§7) gates the render lane's SMOKE
  technique on. Scope is EXACTLY those two questions — nothing else in the render lane is gated on me
  (§7 is explicit). Measured against the REAL composite: `CrtPass.tsx` (ADR-0031, the 4-pass CRT
  graph), `crtParams.ts` (per-tier `resScale` full=0.5 / lite=0.25), `BossQteSprite.tsx` (the mesh
  idiom the new reads extend), `GameScene.tsx` (mount order; CRT `tier = isMobile ? "lite" : "full"`).
- **BUDGET GAP FLAGGED (honesty first):** `docs/perf-budget.md` does **NOT exist**. Per my activation
  rule a verdict against no budget is an opinion, so I state the WORKING budget I verdict against and
  make authoring the budget line my first deliverable (proposed below, needs Bertrand ratification):
  - Working frame budgets: **desktop 60 fps = 16.6 ms**; **mobile 30 fps floor = 33.3 ms** (mobile
    runs `MOBILE_ZOOM 1.7` + CRT `lite`; 30 is the realistic browser-R3F mobile floor — RATIFY or
    correct me).
  - Proposed per-system line for THIS effect: **smoke degraded-telegraph treatment ≤ ~1.5 ms marginal
    on the mobile reference device, and MUST add ZERO render targets and ZERO fullscreen passes.**

### How the composite actually works (the load-bearing measurement)

`CrtPass` (mounted only when `crt` pref ON) takes over the frame and runs, per frame:
(1) world layer-0 → `sceneRT` (FULL drawing-buffer res, RGBA8+depth); (2) bright-pass → `bright`
(resScale: lite **0.25**); (3+4) separable blur H/V at that scaled res; (5) composite → screen (FULL
res, samples `sceneRT` full + `blur` scaled + scanline/grain/vignette); (6) crosshair overlay draw.
On mobile the frame is ALREADY fill-bound: one full-res scene draw + one full-res composite pass +
a 0.25²-res 3-pass chain. **The dominant mobile cost is the CRT composite itself — which the smoke
must not touch.**

**Decisive architectural fact:** any smoke drawn as world-space geometry on **layer 0** (the same
idiom as every `BossQteSprite` mesh) is rendered INSIDE pass 1 (world→sceneRT). It rides the existing
composite for FREE — no new render target, no new fullscreen pass, no `CrtPass.tsx` edit — and gets
the tube/bloom/scanline treatment applied automatically (no compositing seam). It costs only extra
draw calls + overdraw within the already-happening world render. A fullscreen post-process smoke, a
noise-RT, or any CRT-graph edit ADDS a full-res pass on top of the 5-pass mobile chain = the exact
mobile bandwidth cliff. A particle cloud = unbounded transparent overdraw stacked UNDER the full-res
composite = the exact fill-rate cliff.

### Q1 — SMOKE TECHNIQUE RECOMMENDATION (BINDING, render lane unblocked NOW)

**RECOMMEND: a small set of animated alpha-blended textured quads — a local "smoke veil" — drawn in
world space on layer 0, in front of the boss/telegraph region.** NOT a particle system, NOT a
fullscreen/noise shader, NOT a post-process, NOT anything touching a render target or the CRT pass.
Fallback (if even this is over on the weakest target — see cheap-out levers): drop to a single static
veil quad, then to modulating the existing telegraph's own contrast/alpha (no separate smoke layer).

Bounds (hard, for `dev-r3f-render` to build to; these are the stage-5 pass gates):

- **Quad count ≤ 6** alpha-blended quads for the veil (2–3 drifting layers already read as "smoke
  covers the duel"; 6 is the ceiling, not a target). This bounds worst-case overdraw to ≤6× over a
  FRACTION of the frame.
- **ZERO new render targets. ZERO new fullscreen passes. `CrtPass.tsx` unmodified.** (Stage-5
  in-sandbox check: `renderer.info.memory` RT count unchanged; the CRT graph still 4 passes.)
- **Shader complexity = MeshBasicMaterial-class:** a single texture fetch (one tiling smoke/alpha
  texture) + tint, animated by UV scroll + an opacity envelope. **NO per-pixel fbm / multi-octave
  procedural noise, no multi-tap.** `transparent:true`, `depthWrite:false` (exact existing mesh idiom).
- **Normal alpha blend, greyish/desaturated, NOT additive.** Additive bright smoke would trip the
  composite's saturation×brightness bloom gate (`bloomThreshold 0.25 / bloomBrightness 0.55`) and haze
  the neon halo; a desaturated alpha veil reads as "smoke-machine haze" AND keeps the telegraph
  "degraded not removed."
- **Reduced-motion (UX §2.3 / D3.1, non-strobing):** under `prefers-reduced-motion` the veil HOLDS —
  static opacity, no fast UV scroll, no opacity pulsing >3 Hz. This is the same freeze-the-clock branch
  `BossQteSprite` (pulse/brace) and `CrtPass` (grain/flicker) already implement; it doubles as cheap-out
  lever 2. Satisfies (a) degraded-not-removed, (b) mobile budget, (c) non-strobing degrade.
- **Opacity ceiling over the telegraph zone** must keep the ring/pose perceptible in grayscale (UX A1/
  A2, D1.1/D1.2 — degraded, never removed). Guidance peak alpha ≈ ≤0.5–0.6, but the EXACT salience
  threshold that passes the grayscale legibility capture is a verify-skill/composite-gate screenshot
  item + `lead-art`'s visual call — I price the technique, I do not pin the aesthetic opacity.

### Q2 — PHASE-3 WORST-CASE COMPOSITE (2 rings + parry cue + smoke + renfort frame-edge + finisher)

**Verdict: INSIDE budget on BOTH device classes WITH the recommended technique — subject to on-target
ms confirmation (deferred, below).**

- **Draw calls are NOT the risk.** Worst-case added meshes over the V1 baseline: boss(1) + ringA(1) +
  ringB(1) + parry cue(~1) + smoke veil(≤6) + renfort frame-edge quads(≤4) + finisher marker(1) ≈ **~15
  extra draw calls**, all layer 0, all riding pass 1. Three/R3F on mobile eats hundreds; ~15 is noise.
  (Note: FINISHER is post-combat — 0 HP, no windows/wander/telegraph per ADR-0052 D3 — so it does not
  truly co-occur with the 2-ring+parry+smoke frenzy; I counted it anyway for absolute worst case.)
- **The specific risk = transparent OVERDRAW / fill-rate**, because the mobile frame is already
  fill-bound by the CRT composite (full-res scene draw + full-res composite). Large overlapping
  transparent smoke quads multiply per-pixel shading over their region, and every one of those pixels
  is then resampled by the full-res composite. Overdraw stacked under a full-res composite is the mobile
  cliff. The ≤6-quad + capped-opacity + local-region bound keeps that a small multiple over a fraction
  of the frame — and the smoke adds NO pass and NO RT, so the dominant composite cost is untouched.
  That is why it fits.
- **Cheap-out levers if on-target says otherwise (ordered, cheapest first):**
  1. **Reduce smoke quad count / opacity / region size** — pure knob, linear overdraw reduction, the
     "degraded telegraph" read survives 2–3 quads. No design change. (Owner: `dev-r3f-render`.)
  2. **Tier the smoke like the CRT already tiers** — mobile/`lite` draws the static single-veil branch
     (= the reduced-motion path, already coded). No new code path. (Owner: `dev-r3f-render`.)
  3. **LAST RESORT — a DESIGN/VISUAL trade, NOT mine to pick:** achieve "smoke-obscured" by modulating
     the existing telegraph's own contrast/alpha (no separate smoke layer, zero added overdraw). This
     changes the LOOK → routes to `lead-art` (visual) via `senior-architect`; I only price it.

### What is verifiable in-sandbox (SwiftShader) vs. DEFERRED-ON-TARGET

- **In-sandbox at stage-5 (SwiftShader CAN):** draw-call count (`renderer.info.render.calls`), RT count
  unchanged (`renderer.info.memory` — smoke adds no RT), CRT graph still 4 passes, smoke material is
  MeshBasicMaterial-class (single fetch). These bound the technique to spec.
- **DEFERRED-ON-TARGET (SwiftShader CANNOT — no real GPU timing, no mobile fill/bandwidth):** the
  actual ms cost of the smoke overdraw stacked under the composite on a weak mobile GPU. `producer`
  chases; Bertrand runs. Protocol, ready-to-run:
  - **Build:** branch preview `https://bczy.github.io/prohimuf/preview/claude-yo-pmnyzr/` once the smoke
    lands; boss dev-harness route (`?preview=boss`, the one Bertrand playtested); **CRT pref ON, mobile
    mode**.
  - **Devices:** ≥1 weak-tier reference mobile (the class `lite` targets — mid/low Android or an
    iPhone-SE-class device) + 1 modern mobile as ceiling; real Safari (iOS) AND Chrome (Android) —
    different GL/ANGLE backends.
  - **Scenario:** drive to phase 3, trigger the smoke window; capture the worst-case frame (smoke +
    2 rings + parry cue + renfort surge). Then toggle smoke OFF on the same phase-3 frame to isolate the
    smoke's MARGINAL cost.
  - **Metrics:** median + p95 frame time (ms) over a 5 s window; and the marginal delta (smoke-on minus
    smoke-off) = the smoke's real cost.
  - **Thresholds (vs. the working budget, pending ratification):** PASS = median with smoke ≤ **33.3 ms**
    on the weak device (CRT lite ON) AND smoke marginal ≤ **~1.5 ms**. FAIL = sustained median > 33.3 ms
    during the smoke window OR marginal > ~1.5 ms (overdraw cliff) → apply cheap-out lever 1, re-measure.
  - **Tooling I need (spec → `dev-tooling-assets`, not built by me):** a frame-time probe (rAF-delta
    recorder exposing median/p95 over a rolling window on `window.__MUF_FRAMETIME__`) + a
    `renderer.info` dump hook (`window.__MUF_RENDERER_INFO__`: draw calls + RT count) reusable by the
    stage-5 e2e AND the on-target run.

VERDICT: PERF PASS (pre-build) — smoke = ≤6 alpha-blended layer-0 quads, MeshBasicMaterial-class (1 texture fetch), desaturated normal-alpha, ZERO new RT / ZERO new pass / CrtPass untouched, reduced-motion holds static; phase-3 worst case INSIDE budget both classes, risk = transparent overdraw not draw calls, cheap-out = drop quad count/opacity then tier-static (gpu-specialist)
VERDICT: DEFERRED-ON-TARGET — smoke marginal ms + phase-3 median frame time on weak mobile (CRT lite ON) unmeasurable in SwiftShader; protocol above, thresholds median ≤33.3 ms & marginal ≤~1.5 ms; producer chases, Bertrand runs (gpu-specialist)
BUDGET GAP: docs/perf-budget.md absent — working budgets (desktop 16.6 ms / mobile 33.3 ms) + the smoke per-system line above proposed for Bertrand ratification; authoring perf-budget.md is my first deliverable (gpu-specialist)

- handoff → `dev-r3f-render` (Amelia): render lane UNBLOCKED — build the smoke to the Q1 bounds
  (≤6 layer-0 alpha quads, single-fetch material, desaturated normal-alpha, no new RT/pass, CrtPass
  untouched, reduced-motion holds static). I re-verdict at stage-5 (in-sandbox `renderer.info` bounds +
  the deferred on-target protocol).
- handoff → `producer` (Marion): log the DEFERRED-ON-TARGET item (chase the on-target run against
  Niveau-Final or whenever a smoke build is preview-deployed) and queue the frame-time/`renderer.info`
  probe spec to `dev-tooling-assets`. Also: `docs/perf-budget.md` does not exist — flag for
  ratification of the working budgets above.
- handoff → `senior-architect` (Winston): perf-sensitivity gate answered — smoke recommendation is
  additive to the boss system, touches no boundary, needs no ADR change (the cheap-out last-resort, IF
  ever reached, is a visual trade routed to `lead-art` via you, not decided in a fix lane).
- File List:
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 9. BUILD (render lane) — dev-r3f-render (Amelia) — 2026-07-20 — the 5-lever render layer (procedural/placeholder)

- claim: stage-4 BUILD of the render layer for the 5 ADR-0052 differentiation levers, logic-free
  (renders pure state; no game rules). Files per the §7 lane partition (hard boundary):
  `src/render/scene/BossQteSprite.tsx` + `src/render/ui/hud/BossHpBar.tsx` (+ its module.css).
  `src/render/ui/hud/types.ts` NOT touched (architect default NO — see deviations; no justification
  needed, the finisher is diegetic + bar-reinforced, renfort diegetic; no new HUD field). Coded
  strictly against the ADR-0052 D2/D3 FROZEN field/constant names; `CrtPass.tsx`/`crtParams.ts`,
  `stateMachine.ts`, `src/hooks`, `levelArt.json` untouched; no new render target / fullscreen pass.
- What I rendered, per lever:
  - **L1 points faibles multiples** — a second (LIMB) ring mesh (`ringBRef`) drawn in phases 2+
    (`phaseIndexAt >= 1`) on `qte.targetOffsetB`; ring A becomes the fixed VITAL identity (head,
    green, brighter `ringZoneEmphasis`), ring B the fixed LIMB identity (torso, yellow, dimmer).
    "Which is which" reads from ANATOMY POSITION + brightness, not colour alone (UX D4.1/D4.5).
    Phase 1 = single ring, `bossRingZoneAt` colour-by-position — V1 byte-identical. The phase-1→2
    split gets a faint DUAL-RING PREVIEW during that break only (`phaseBreakRemaining>0 && phase===1`),
    the "new pattern" cue distinct from an ordinary phase break (UX D4.7; modest, verify-tunable —
    Karim advisory 1).
  - **L3 parade** — a FORM-distinct parry telegraph: a filled diamond "guard" glyph (`parryRef`,
    rotated 45°) at `BOSS_PARRY_POINT` (the raised sidearm) — categorically NOT the open shoot ring,
    so parry-vs-shoot reads by FORM in grayscale (UX D2.1). Faint during the wind-up
    (`telegraphActive && chargedWindow && !EXPOSED`), solid/brighter when the parry window is live
    (`EXPOSED && chargedWindow`). Shoot rings are suppressed during a charged window (it replaces a
    normal EXPOSED window). Parry SUCCESS = a cool "reeling" stagger tint while `staggerRemaining>0`
    (the bonus EXPOSED window then draws rings normally); parry WHIFF = a brief heavier-alarm flash
    (render-side edge: a live parry window closed with no stagger success).
  - **L2 décor** — a procedural PLACEHOLDER prop mesh (`decorRef`) at `bossQteSpec.decorProp.position`
    (anchor-relative), dim/inert by default, GLOWING (acid tint + pulse) only while
    `decorArmed && !decorConsumed` ("ce qui brille est interactif"); spent reads dimmer. The SMOKE
    VEIL built to the gpu-specialist BINDING bounds (§8): **4 alpha quads (≤6), one baked desaturated
    CanvasTexture (single fetch) + tint, UV scroll + per-quad opacity envelope + gentle world drift,
    world-space layer 0, renderOrder 10 (in FRONT of rings so it degrades — capped peak alpha 0.42
    so the telegraph stays grayscale-legible, never removed), NORMAL blend (never additive), ZERO new
    RT / ZERO new pass / CrtPass untouched.** Reduced-motion = static veil (no UV scroll, no drift).
  - **L4 renfort** — 4 frame-edge silhouette quads (`renfortRefs`) reusing the shipped `enemy_riot`
    idle texture, dark/desaturated, hugging the camera edges partially off-screen, swaying inward;
    MOTION ONLY — no shootable body, no travelling bullet, no lives (reads as "pas ses hommes").
    Smooth opacity envelope ramps in/out on `renfortActive` (render-side onset).
  - **L5 coup de grâce** — a FINISHER read on `qte.phase === "FINISHER"`: the commander drops to a
    defeated kneel (non-firing frame, desaturated), a one-shot ceremonial SEPIA wash (`finisherWashRef`,
    colour disjoint from the cool-white phase-break pulse / green WON / red LOST), and the
    « LIVRE LE SON » prompt (`finisherPromptRef`, a baked CanvasTexture plane, diegetic below the
    boss — canonical copy, NOT "ACHEVER"). The prompt's presence + a "click now" pulse positively
    distinguish this ACTIVE beat from the passive `QTE_RESULT_HOLD` breather (UX D3.2). Resolves on
    ANY `fire` (game 5-B) → the whole frame is the click zone, so the 44px touch floor is trivially
    and generously met (UX D3.6/A10). HUD: `BossHpBar` now settles once (a single `scaleY` nudge on
    the track) when `bossHp <= 0` (UX D3.4) — reinforcement only, NO new persistent "finisher pending"
    HUD state (UX D3.5); ADR-0046 CSS-Modules/tokens discipline held (keyframe in the module,
    `cx()` combiner, no hex/px literals).
- Reduced-motion coverage (UX D2.7/D3.1, every animated read has a branch): ring-tell pulse → steady
  opacity; split-preview pulse → steady; parry glyph pulse → steady; décor glow pulse → steady;
  smoke → fully static veil (no scroll/drift, per gpu Q1 non-strobing); renfort sway → dropped (held
  edge presence, envelope fade only); phase-break pulse & finisher wash → steady step (existing
  pattern); finisher prompt "click" pulse → steady; HUD settle → `animation:none` under the media
  query. All match the existing `BossQteSprite`/`CrtPass` reduced-motion idiom.
- VERIFICATION (corepack yarn 4.12.0, COREPACK_NPM_REGISTRY set; rtk not installed):
  - `yarn vitest run src/render` → **184/184 PASS** (my helpers are pure-tested; the R3F component
    renders via canvas, no direct unit test — consistent with the codebase).
  - `yarn eslint` on my two files → clean EXCEPT 6 errors at `BossQteSprite.tsx:527`, all
    `no-unsafe-*` on `state.bossQteSpec?.decorProp` — a direct consequence of the missing frozen
    type field below (the access is `any` until it lands).
  - `yarn typecheck` on my files → clean EXCEPT `TS2305 BOSS_PARRY_POINT has no exported member`.
  - **MISSING SYMBOLS (gameplay-lane dependency — I coded against the ADR-0052 frozen names; orchestrator
    re-runs after both lanes land):**
    1. `BOSS_PARRY_POINT: Vec2` — export from `src/game/systems/bossQteSystem.ts` (ADR-0052 D2 lever 3;
       §7 new-constants list). → clears the typecheck TS2305.
    2. `BossQteSpec.decorProp?: { position: Vec2; armPhaseIndex: number }` — type field in
       `src/game/types/bossQte.ts` (ADR-0052 D2 lever 2; §7 dev-gameplay types). → clears the 6
       BossQteSprite.tsx:527 lint errors (the `any` access).
    - Behavioural dependency (not a symbol): `isBossQteActive` must include `"FINISHER"` (ADR-0052 D3)
      or the render's active branch hides the finisher beat — I rely on the frozen contract.
    - All OTHER frozen runtime reads (`targetOffsetB`, `chargedWindow`, `staggerRemaining`,
      `decorArmed`, `decorConsumed`, `smokeActive`, `renfortActive`, `finisherRemaining`, phase
      `"FINISHER"`) already typecheck against my reads — the gameplay lane's type extension landed;
      only their `createBossQte`/`useGameLoop` FINISHER-mapping errors remain, which are THEIR lane.
- Deviations from the UX spec (justified):
  - The « LIVRE LE SON » prompt is DIEGETIC (in-scene CanvasTexture plane), not a DOM HUD element —
    honours the §7 "types.ts default NO / finisher is diegetic + bar-reinforced" directive, so
    `HudBossQte`/`types.ts` is untouched (no architect sign-off needed). Satisfies UX D3.3 (text is
    reinforcement; the wash + click pulse + defeated pose carry "act now" without reading text).
  - Finisher touch target (D3.6/A10): no drawn hitbox — the game resolves on ANY `fire`, so the click
    zone IS the full frame (maximally generous), which is the intended "no unearned failure" outcome.
  - NO audio wiring / no `playSfx` stubs (ADR-0052 §7 audio-wiring call — triggers land WITH assets in
    a later lane).
- File List:
  - `src/render/scene/BossQteSprite.tsx` (rewritten: +L1/L3/L2/L4/L5 reads, baked smoke/prompt textures)
  - `src/render/ui/hud/BossHpBar.tsx` (bossHp===0 one-shot settle class via `cx`)
  - `src/render/ui/hud/BossHpBar.module.css` (`.settled` keyframe + reduced-motion guard)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 8. BUILD (gameplay lane) — dev-gameplay (Amelia) — 2026-07-20 — the 5 levers in the pure game core (TDD)

- claim: stage-4 BUILD of the pure `src/game` half of ADR-0052 — all five differentiation
  levers authored inside `bossQteSystem.ts` / `types/bossQte.ts` (+ harness `decorProp` data),
  TDD, spec values verbatim, seeded-pure, boundary law held (zero React/Three; `stateMachine.ts`,
  `src/hooks`, `src/render`, `qteSystem.ts`/`hostageQte.ts`, every shipped `LevelConfig`
  byte-untouched). Built to ADR-0052 D2 reuse map, D3 finisher shape, D4 freeze-law constraints,
  D5 boundary/determinism; frozen field/constant names (D2/D3) used exactly so the render lane's
  parallel work binds.
- release (per lever):
  - **Lever 1 (dual rings, phase-escalated):** phase 1 = single V1 ring, byte-behaviour-identical
    (`bossWander` now delegates to a parameterised `bossWanderBox`, full-anatomy amps ⇒ identical
    output). Phase 2+ = two FIXED-identity rings — VITAL/tête (`BOSS_VITAL_WANDER_*`, ×1.0, 2 HP)
    - LIMB/corps (`BOSS_LIMB_WANDER_*`, ×0.6, 1 HP, ring B via a decorrelating seed salt
      `BOSS_RING_B_SALT`). One shot tested against both (`ringHitZone`), overlap → vital; ONE shared
      `windowChipped` (a chip from either answers the window — no double drain). ⊂-band containment
      asserted in `createBossQte`.
  - **Lever 3 (charged parry window, same fire-click):** `chargedWindow` decoded from the existing
    `fire`+`impactPoint` (no `src/hooks` change). Cadence `isChargedWindow`: none phase 1, one
    teach phase 2 (phase-window index 1 — separated from the split per Karim advisory 1), every
    other phase 3. Parry on `BOSS_PARRY_POINT` → `QTE_PARRY_CHIP +2` + STAGGER (`staggerRemaining`
    → bonus EXPOSED window, the tempo flip); whiff → `QTE_CHARGED_WHIFF −10` + one blown window
    (single charge, replaces the phase drain); panic click off the parry point → `QTE_PANIC_SHOT −6`,
    non-consuming. Distinct `parryLeadSeconds`/`parryWindowSeconds` per phase, each asserted vs. its
    floor (`≥ BOSS_TELEGRAPH_LEAD_FLOOR` & `< lull`; `≥ PEEK_EXPOSURE_FLOOR`).
  - **Lever 5 (FINISHER):** ADR-0052 D3 new TOP-LEVEL phase. Any depleting chip → `FINISHER`
    (energyDelta 0, `finisherRemaining = FINISHER_HOLD_SECONDS 1.5`); a `fire` OR timeout → `WON`
    (`QTE_BOSS_REFILL +50` paid there) → `QTE_RESULT_HOLD 2.2` → DONE. `isBossQteActive` extended to
    include `FINISHER` (freeze holds — unit-tested). Ceremonial, damage-free, zero failure surface.
  - **Lever 2 (décor prop):** optional `BossQteSpec.decorProp?` (`null`/absent ⇒ additive-and-optional,
    byte-behaviour-identical). Runtime `decorArmed`/`decorConsumed` (+ a runtime `decorProp` mirror so
    the tick hit-tests and the render draws the position). Player-triggered during a SHIELDED lull of
    `armPhaseIndex` → `BOSS_DECOR_DAMAGE 3`, single-use, PURE UPSIDE (missing costs nothing to the
    mechanic). `smokeActive` = phase-3 stretch (game owns only the boolean + the ≥-floor guarantee).
  - **Lever 4 (renfort surge):** in-tableau, seeded, telegraphed. `RENFORT_SURGE` descriptor (phase 3,
    onset window 1, 2 windows); `renfortActive` derived from `phaseWindowIndex` (`isRenfortWindow`).
    A BLOWN flagged window drains `QTE_RENFORT_DRAIN −12` INSTEAD of the phase drain (charged+surge
    overlap → the greater magnitude only, never stacked); still exactly ONE `blownWindows++`
    (`maxBlownWindows` never accelerated). Reads/mutates ONLY boss-QTE runtime state — encoded as the
    **D4 unit assertion** (source scan: no `enemies`/`spawnWave`/`couriers`/`bullets`/`lives`/
    `elapsedSeconds`/`qteSystem`/`hostageQte`).
- **Ambiguities resolved (spec left open; dev-authored per the reuse maps' latitude):**
  1. **STAGGER duration** — spec fixes the parry reward SHAPE but not the stagger duration →
     `STAGGER_SECONDS = 0.3` (a brief damage-free beat, asserted > 0), analogous to the ring-B salt
     being explicitly the dev's call.
  2. **Ring-B salt** — `BOSS_RING_B_SALT = 0x9E3779B1` (a fixed large odd constant XORed into the
     seed), decorrelating ring B from ring A; seeded-pure law unchanged.
  3. **Phase-2 "teach near the phase end"** — not robustly implementable under HP-gated phases (window
     count varies with skill), so implemented as a deterministic per-phase-window cadence: teach at
     `phaseWindowIndex === 1` (the 2nd phase-2 window, one step after the two-ring split — the Karim
     advisory-1 separation), phase-3 "every other" = odd `phaseWindowIndex`. The exact cadence is the
     spec's own designated verify-tunable.
  4. **`smokeActive` "a stretch of phase 3"** — defaulted to the whole phase 3 (`phaseIndex ≥ 2`); the
     exact sub-stretch is a render/UX tunable (game owns only the boolean + the floor guarantee).
  5. Added internal `phaseWindowIndex` (render-ignored) + runtime `decorProp`/`targetOffsetB` +
     constant `BOSS_RING_B_ZONE` to carry the cadence/positions deterministically; ring-B liveness is
     derived by render from the same EXPOSED/phase-≥1/non-charged condition the game uses.
- **V1 behaviour changes (logged, spec-driven):** (a) lever 5 — a depleting chip no longer returns
  `WON` directly; it opens `FINISHER` first (energyDelta 0), then `WON (+50)`. Two win/loss tests
  updated to assert the FINISHER interposition. (b) the winnability test now models the full kit
  (parries charged windows + resolves the finisher). No other V1 test changed.
- **Cross-lane seam (closed):** the ADR-0052 D3 `FINISHER` top-level phase is not assignable to the
  hostage-owned `QtePhase` param of the render camera driver (`qteCamera.ts qteZoomInProgress`, called
  from `useGameLoop.ts`) — the tech-plan's "camera driver unchanged" had a type gap. dev-r3f-render
  closed it in parallel (widened the param to `QtePhase | BossQtePhase` + pinned `FINISHER`, commit
  d4e0877) via the frozen `FINISHER` name, so the integrated typecheck is green. Flagged here for the
  merge-gate record; no `src/hooks`/`src/render` edit made by this lane.
- **Verification (all green):** `yarn typecheck` — EXIT 0 (whole repo). `yarn vitest run` — 843/843
  pass (full suite); the boss suite grew 35 → 62 tests (AC-D1..D8, the D4 boundary assertion, the
  FINISHER-holds-the-freeze test, ⊂-band containment, two-ring/parry/décor/renfort determinism). `yarn
lint` — EXIT 0.
- boundary check: `stateMachine.ts`, all of `src/hooks`, `src/render`, `qteSystem.ts`/`hostageQte.ts`
  and every shipped `LevelConfig` untouched by this lane; only the non-shipped harness gained a
  `decorProp`. Seeded-pure preserved (no `Math.random`/`Date.now`/per-tick cursor — asserted).
- stage-5 note (K-5, unchanged obligation): the harness `targetSeed 20260719` re-pin must confirm each
  phase-2/3 window presents ≥1 landable waypoint on EACH ring, each charged window a landable parry,
  and the `decorProp` arm-window landable — the two decorrelated ring paths + parry timing make this
  harder than V1's single ring (per the ADR-0052 gotcha). Structural stand-in green; empirical pin is a
  verify-leg item, not a contract blocker.
- handoff → `qa-lead` (Inès) / `game-designer` (Sacha): stage-5 verify — design-acceptance vs.
  AC-D1..D8, the seed re-pin, and the phase-3 parry cadence / renfort-surge-count verify-tunables.
- handoff → `senior-architect` (Winston): merge-gate record — the FINISHER↔camera type seam (above)
  was a tech-plan gap closed by dev-r3f-render in parallel; note it in the D3 narrowing review.
- NOTE (process): appended via `cat >>` heredoc, strictly additive at end-of-file (the render lane
  appends concurrently). NOT committed/pushed by this lane (the two `feat/test(game) … in-flight lane
snapshot` commits are environment snapshots of the types/levels/test scaffolding; `bossQteSystem.ts`
  - the final test refinements remain unstaged per the no-commit instruction).
- File List:
  - `src/game/types/bossQte.ts` (FINISHER phase + new runtime fields + `BossQteSpec.decorProp?`)
  - `src/game/systems/bossQteSystem.ts` (the 5 levers, new constants/helpers, `createBossQte` asserts)
  - `src/game/systems/__tests__/bossQteSystem.test.ts` (35 → 62 tests)
  - `src/game/levels/levels.ts` (harness `decorProp` data only — no shipped level touched)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 10. VERIFY (stage 5, leg 1) — qa-lead (Inès) — 2026-07-20 — test plan + mechanical gate + e2e evidence + V1 regression

- claim: stage-5 VERIFY first leg for STORY-BOSS-QTE-DIFFERENTIATION — author the per-story test
  plan, run the mechanical gate myself, produce state-verified e2e screenshots for the leg-2
  design-acceptance (Sacha) + UX review (Tony), discharge the three lane-flagged verify-leg
  obligations, and check the two V1-carryover regressions (seed winnability, harness persistence
  inertness). Commit `3c1bf8e`, branch `claude/yo-pmnyzr`. No commit/push.
- release: `docs/qa/plan-story-boss-qte-differentiation.md` (per-lever matrix, mechanical results,
  e2e holes, regression specs) + `docs/qa/evidence/story-boss-qte-differentiation/` (6 PNGs).
- **Mechanical gate — ALL GREEN** (corepack Yarn 4.12.0, `COREPACK_NPM_REGISTRY=…npmjs.org`; rtk
  absent → `yarn` fallbacks):
  - `yarn typecheck` → **EXIT 0** (whole repo).
  - `yarn vitest run` → **843/843 PASS**, 64 files, EXIT 0 (boss suite 62 tests).
  - `yarn lint` → **EXIT 0** (0 problems).
  - `yarn format:check` → **EXIT 0** ("All matched files use Prettier code style!").
  - `yarn build` → **EXIT 0** (dist emitted; reachability grep below).
- **E2e evidence (state-verified via the ADR-0005 `__MUF_STATE__` snapshot seam under
  `__MUF_PLAY__`; `?preview=boss` now boots straight to ACTIVE — harness `enemiesToWin: 0`, V1's
  C-QA1 mook-quota blocker gone):** ZERO `pageerror` on every run.
  - `01-phase1-single-ring.png` — ACTIVE phase-0 EXPOSED single green ring (**V1 regression baseline**).
  - `02-phase1-telegraph.png` — SHIELDED `telegraphActive` (shoot tell).
  - `11-lost.png` — phase LOST, `blownWindows 10`, HP still 20/24, ÉNERGIE ⚡0 (loss on the
    blown-window clock, NOT HP — the failure model reads correctly).
  - `12-reduced-motion-phase1.png` — phase-1 EXPOSED under `prefers-reduced-motion: reduce`.
  - `13-mobile-boot.png` / `14-mobile-phase1-ring.png` — iPhone UA 844×390, boss zoom, ring legible.
- **Three lane-flagged verify-leg obligations — DISCHARGED at the deterministic unit level** (the
  authoritative place for seeded-pure logic; runtime feel = leg 2 on real GPU):
  1. **K-5 seed winnability** — unit "competent player (rings+parry) clears 24 HP before the blown
     clock" on the pinned `targetSeed 20260719`. Seeded-pure ⇒ this IS the winnability proof.
  2. **Phase-2 teach cadence** — `isChargedWindow`: none phase 1, exactly ONE teach phase 2 (window
     index 1), every-other phase 3.
  3. **Renfort surge count** — `RENFORT_SURGE = {phaseIndex:2, onsetWindowIndex:1, durationWindows:2}`
     (exactly 1 surge, phase 3, 2 windows); blown-under-surge −12 as ONE blown window (no loss-clock
     accel); charged+surge overlap de-stacked to max(−10,−12)=−12; answered window costs nothing.
- **V1 regressions checked:** (a) phase-1 byte-identical (unit `bossWander`→`bossWanderBox` identical
  output + runtime `01`); (b) hostage QTE + every shipped `LevelConfig` + `stateMachine.ts` + `src/hooks`
  byte-untouched (ADR-0052 D1 boundary, unit suite); (c) **harness persistence inertness (f5bd0a0)** —
  runtime after boot→duel→LOST `localStorage` held only my injected `muf_prefs`: NO `muf_scores_*`,
  `muf_progress = null`; App.tsx L216-222 scopes writes to `LEVELS` membership, `boss-harness` excluded.
- **BLOCKING HOLE C-QA2 (CI-DEFERRED-BLOCKED, escalated → producer; only Bertrand waives):** the
  depletion-gated **differentiation reads** (phase-2 dual rings, parry telegraph, stagger, phase-3
  smoke, renfort edge, décor-armed, FINISHER, WON, HP-bar zero-settle) are UNREACHABLE in the sandbox
  — headless SwiftShader runs ~2 fps, so the blown-window LOST clock (10) trips before enough chips
  land to cross the first HP threshold (16); an honest ~90 s aided-fire attempt landed only 4 HP
  (24→20) → LOST at phase 1. Harness/frame-rate limitation, NOT a defect — the pure logic of every
  such read is fully unit-proven (62 tests, AC-D1..D8, D4 boundary assertion, FINISHER-holds-freeze).
  The **runtime render / UX legibility** of phase-2+ reads is therefore UNVERIFIED in-sandbox.
  → correction to `dev-tooling-assets` (+ small game/render assist): add a deterministic **state-seed
  seam** (`?preview=boss&at=phase2|phase3|finisher` or a `&blownImmune` capture flag) so these become
  e2e-automatable; regression `E2E-BOSS-DIFF` specced (plan §7 R5). Interim leg-2 path: Sacha's
  playtest + Tony's UX review of phase-2+ reads run on a **real-GPU build** (branch preview / local).
- handoff → `game-designer` (Sacha) + `ux-designer` (Tony): leg-2 verification — phase-1 / reduced-
  motion / mobile / LOST evidence is in `docs/qa/evidence/story-boss-qte-differentiation/`; the
  phase-2+ differentiation reads (AC-D1..D6 visual, UX A1/A2/A4/A5/A7/A12-A15 for phase-2+) are
  CI-DEFERRED under C-QA2 — run those on a real-GPU build until the state-seed seam lands.
- handoff → `producer` (Marion): CI-DEFERRED-BLOCKED item C-QA2 for the sprint board; chase the
  state-seed seam lane (`dev-tooling-assets`); only Bertrand waives the sandbox-runtime hole.
- handoff → `senior-architect` (Winston): mechanical gate + boundary regressions GREEN; the
  FINISHER↔`qteCamera.ts` type widening (shard §8) noted for the D3-narrowing merge review.

VERDICT: PASS — quality gate leg 1 (qa-lead) — mechanical gate GREEN (tsc/vitest 843·843/lint/format/build all EXIT 0); pure logic of all 5 levers unit-proven incl. the 3 flagged verify-leg obligations; V1 regressions (phase-1 byte-identical, hostage + Belliard + hooks untouched, harness persistence inert) hold; deterministically-reachable e2e evidence (boot both classes, phase-1 read, telegraph, reduced-motion, mobile, LOST) captured and real. NAMED HOLE: the phase-2+ differentiation RENDER/UX reads are UNVERIFIED in-sandbox (C-QA2, ~2 fps SwiftShader vs. the blown-window LOST clock) — CI-DEFERRED-BLOCKED, escalated to producer, leg-2 visual verification of those reads deferred to a real-GPU run; NOT a clean green on the runtime differentiation reads.

- File List:
  - `docs/qa/plan-story-boss-qte-differentiation.md` (NEW — this plan)
  - `docs/qa/evidence/story-boss-qte-differentiation/*.png` (NEW — 6 state-verified captures)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 11. VERIFY (stage 5) — dev-r3f-render (Amelia) — 2026-07-20 — correction C-QA2: deterministic state-seed capture seam + missing e2e evidence

- claim: discharge qa-lead's stage-5 correction C-QA2 (shard §10) — build the deterministic
  state-seed seam she requested on the EXISTING `?preview=boss` dev-harness so the
  depletion-gated ADR-0052 differentiation reads become e2e-screenshottable at ~2 fps
  SwiftShader, then USE it myself to capture the missing evidence PNGs, each state-verified via
  the `__MUF_STATE__` seam. Branch `claude/yo-pmnyzr`. No manual commit/push (an environment
  auto-snapshot hook committed an in-flight `wip` — not my doing; nothing pushed).
- **How the seam works (view-side only, NO `src/game` edit):**
  - `?preview=boss&at=phase2|phase3|finisher` boots the harness with the boss QTE already
    advanced to that beat. The advanced `BossQte` is CONSTRUCTED by driving the EXISTING pure
    API: `createBossQte(spec)` then a synchronous, fixed-step (`1/60`) `tickBossQte`
    fast-forward loop with SCRIPTED inputs — fire on the live ring (`targetOffset`, always the
    fixed-identity VITAL ring in phase 2+) during normal EXPOSED windows, on `BOSS_PARRY_POINT`
    during CHARGED windows, idle otherwise — so every window is answered (zero blown) until the
    target phaseIndex (1/2) or FINISHER is reached. Seeded-pure ⇒ deterministic. Lives entirely
    in NEW `src/render/scene/bossHarness.ts`.
  - Injection: `bossHarness.installBossCaptureSeam()` (called once at `App` module load,
    guarded so it no-ops unless `?preview=boss` AND a valid `at=`) installs a
    `window.__MUF_BOSS_BOOT__` factory. `useGameLoop` consumes it ONCE at init to seed the
    initial `bossQte` (double-guarded: factory present AND `bossQteSpec !== null` — true only on
    the excluded-from-`LEVELS` dev-harness). Mirrors the existing `__MUF_PLAY__`/`__MUF_STATE__`
    harness-global pattern already in `useGameLoop`; no game rule touched, no boundary crossed.
  - **`&blownImmune=1` — SHIPPED (view-side, pure-API re-seed).** `useGameLoop` re-invokes the
    same fast-forward factory the moment the boss transitions to `LOST` (the blown-window clock —
    the exact thing that made the reads unreachable), keeping an unattended capture pinned at its
    phase. Bounded to the `LOST` transition, uses only the pure API (no game-state field is
    hand-mutated, no `src/game` edit) — the pure-API re-seed option qa-lead named, so it is added
    rather than skipped. (Note: it proved un-needed in practice — at ~2 fps the clamped 0.1 s dt
    gives ~0.2 s sim/real-s, so with `blownWindows` fast-forwarded to 0 there is >2 min of
    real-time headroom before LOSS; every capture landed well inside it. Kept as insurance for
    unattended runs.)
  - Guard/reachability: identical discipline to `?preview=boss` — shipped players (no
    `?preview=boss`) never install the factory; LEVELS-exclusion + persistence-inertness
    (App.tsx L216-222) untouched and still holding. No `src/game/**` file changed; no
    `src/hooks` signature changed (globals-only, like the sibling seams).
- **Mechanical gate — ALL GREEN** (`COREPACK_NPM_REGISTRY=…npmjs.org`; rtk absent → `yarn`):
  - `yarn typecheck` → **EXIT 0**. `yarn vitest run` → **843/843 PASS, 64 files, EXIT 0** (no
    test churn — the seam is harness-only view code). `yarn lint` → **EXIT 0**.
    `yarn format:check` → **EXIT 0**. `yarn build` → **EXIT 0**.
- **New e2e evidence (Playwright headless, `chromium_headless_shell-1194` + SwiftShader args,
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; build + `vite preview`; `__MUF_PLAY__` seeded so
  `__MUF_STATE__` is live). Every shot STATE-VERIFIED against the page snapshot BEFORE the
  screenshot — the asserted phase/flags are logged below; ZERO `pageerror` on all 8 runs:**
  - `20-phase2-dual-rings.png` — `phaseIndex 1, EXPOSED, chargedWindow false`: the dual VITAL
    (head, green) + LIMB (torso) rings drawn simultaneously, HP bar at the phase-2 band. Proves
    lever 1 (AC-D2) renders — the read qa-lead could not reach.
  - `21-parry-telegraph.png` — `chargedWindow true, telegraphActive true, phaseIndex 2`: the
    CHARGED/parry window telegraph (no rings). Proves lever 3 (AC-D3) legibility.
  - `22-phase3-smoke-veil.png` — `phaseIndex 2, smokeActive true, EXPOSED`: the smoke veil
    overlaid, telegraph DEGRADED-not-removed (rings still legible under it). Proves lever 2 / 2-C.
  - `23-renfort-edge.png` — `renfortActive true, phaseIndex 2` (énergie already drained by the
    surge): the in-tableau renfort pressure read. Proves lever 4 (AC-D4).
  - `24-decor-armed-glow.png` — `decorArmed true, phaseIndex 1, SHIELDED`: the armed décor prop
    glow in the SHIELDED lull. Proves lever 2 décor (AC-D5).
  - `25-finisher-livre-le-son.png` — `phase FINISHER, bossHp 0`: the FINISHER reticle + the
    « LIVRE LE SON » prompt (narrative §3.3 canonical string). Proves lever 5 (AC-D6).
  - `26-hpbar-zero-settle.png` — `phase WON, bossHp 0`: the boss HP bar settled at 0 % on the
    WON verdict. Proves the HP-bar zero-state read.
  - `27-reduced-motion-phase3.png` — `phaseIndex 2, smokeActive true`, captured under
    `prefers-reduced-motion: reduce`: the phase-3 veil held/non-strobing. Proves the
    reduced-motion degrade branch.
- C-QA2 status: the CI-DEFERRED-BLOCKED hole is now CLOSED for automated capture — the phase-2+
  differentiation RENDER reads are state-verified and screenshotted in-sandbox. Leg-2 UX/design
  legibility judgement (Tony/Sacha, A1–A15 / AC-D1..D8) can now run on THESE PNGs instead of
  waiting for a real-GPU build. The `E2E-BOSS-DIFF` regression (plan §7 R5) is now implementable
  against the seam.
- handoff → `qa-lead` (Inès): C-QA2 seam delivered + the 8 missing evidence PNGs (20–27)
  captured and state-verified; fold into the quality gate / close the CI-DEFERRED item.
- handoff → `ux-designer` (Tony) + `game-designer` (Sacha): phase-2+ reads are now screenshot
  evidence (`docs/qa/evidence/story-boss-qte-differentiation/20–27`) — run the deferred leg-2
  legibility review on them.
- handoff → `producer` (Marion): C-QA2 (CI-DEFERRED-BLOCKED) can be cleared on the board.
- handoff → `senior-architect` (Winston): the seam is view-side only — new
  `src/render/scene/bossHarness.ts` + a globals-only consume in `src/hooks/useGameLoop.ts`
  (no signature change, no `src/game` edit, no boundary crossed); flagged for the merge review.

VERDICT: PASS — C-QA2 correction (dev-r3f-render) — deterministic `?preview=boss&at=…` (+`blownImmune=1`) state-seed capture seam built view-side (pure-API fast-forward, no `src/game` edit, reachability = `?preview=boss`); mechanical gate GREEN (tsc / vitest 843·843 / lint / format / build all EXIT 0); 8 previously-unreachable differentiation-read PNGs (20–27: dual rings, parry telegraph, smoke veil, renfort edge, décor glow, FINISHER, HP-bar zero-settle, reduced-motion phase-3) captured headless and STATE-VERIFIED via `__MUF_STATE__`, zero pageerror.

- File List:
  - `src/render/scene/bossHarness.ts` (NEW — the capture seam: fast-forward + install)
  - `src/render/scene/App.tsx` (install call + import, module-load, guarded)
  - `src/hooks/useGameLoop.ts` (consume `__MUF_BOSS_BOOT__` at boot + `__MUF_BOSS_IMMUNE__` re-seed on LOST; `BossQte` type import)
  - `docs/qa/evidence/story-boss-qte-differentiation/20-phase2-dual-rings.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/21-parry-telegraph.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/22-phase3-smoke-veil.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/23-renfort-edge.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/24-decor-armed-glow.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/25-finisher-livre-le-son.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/26-hpbar-zero-settle.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/27-reduced-motion-phase3.png` (NEW)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## STAGE 5 LEG 2 (VERIFY + UX REVIEW) — producer (Marion) — 2026-07-20

- **Claim:** stage tracking; log playtest + UX review leg currently running; cap status and next hand-off.
- **Status:** Story sits at stage 5 leg 2 in parallel (playtest by game-designer + ux-review on both device classes), evidence gathering. Design gate PASS + AC7 re-review PASS complete. Bounded-iteration cap: 2 verify↔build rework rounds — LEG 1 complete, LEG 2 running. Stage-6 merge-review panel queued next once leg-2 evidence closes.
- **No cap breached.** Stage-5 is the final verification leg; stage-6 is the mandatory 4-reviewer code-review panel.
- **AC8 dependency (story 2's gate):** ADR-0052 stage-6 MERGE-clear on `main` is the release condition for story-boss-niveau-final-live dev lanes (AC8 sequencing gate). Story 1's stage-5 evidence is complete; stage-6 panel entry is the next critical path. `producer` tracking for merge-clear and will signal story-2 dev-lane unblock upon MERGE.
- **Perf protocol note (DEFERRED-ON-TARGET from this story's own gates):** Ben's smoke effect measurement + Bertrand's on-device test run are on producer's chase list — flag to Bertrand if not executed before stage-6 panel convenes.
- **Handoff:** → `qa-lead` (Inès) once stage-5 evidence complete (definition of done per COLLABORATION.md); stage-6 code-review panel (4 reviewers, `senior-architect` triage).

## 12. VERIFY (stage 5, leg 2) — game-designer (Sacha) — 2026-07-20 — design-acceptance playtest vs. the gated spec (AC-D1..D8)

- claim: stage-5 VERIFY leg 2 — my design-acceptance playtest of the built 5-lever pack against
  `spec-boss-qte-differentiation.md` (AC-D1..D8) + Karim's gate advisories 1 & 5. Method: a
  SIMULATION playtest driving the REAL pure API (`createBossQte` + `tickBossQte`, esbuild-bundled
  from `src/game/systems/bossQteSystem.ts`, type-only imports stripped) through full fights on the
  pinned harness spec (`targetSeed 20260719`, 24 HP, `maxBlownWindows 10`, décorProp armed phase 2)
  across play-style archetypes with sim-side seeded aim noise (the GAME stays seeded-pure) —
  N=500 aim-trials/style — PLUS a VISUAL acceptance pass on the 14 state-verified evidence PNGs
  (`docs/qa/evidence/story-boss-qte-differentiation/`). No production-code edit; no commit/push.

### VERDICT: PASS-WITH-CORRECTIONS — design acceptance playtest (game-designer)

The differentiation THESIS lands: the fight opens as the familiar single-ring V1 read (phase 1),
becomes a visible two-target choice (phase 2), then a parry + smoke + renfort climax (phase 3),
capped by a ceremonial finisher — a demonstrably different moment-to-moment than the hostage duel
(AC-D1). §5.6 attributability holds, no double jeopardy, winnable-not-trivial and losable. ONE
substantive correction (Lever 1 risk/reward, below) + one soft cross-lane flag (parry-tell form).
None blocks the merge gate; the Lever-1 correction is a design/tuning change I route to Karim, not
a silent fix.

### Simulation results (seed 20260719, N=500 aim-trials/style)

| Play style        | Win  | Loss | avg blown | avg ΔE | avg time | note                                            |
| ----------------- | ---- | ---- | --------- | ------ | -------- | ----------------------------------------------- |
| optimal (full kit)| 100% | 0%   | 0.00      | +17.3  | 40.0s    | ceiling — clears with full blown-window margin  |
| greedyLimb (bank) | 100% | 0%   | 0.00      | +9.7   | 46.4s    | safe-bank line viable — floor intact            |
| greedyVital (2HP) | 100% | 0.03 | 0.03      | +10.4  | 43.7s    | **greed NOT punished** (see Lever-1 finding)    |
| parryWhiff        | 100% | 0%   | 5.99 (≤8) | −58.6  | 66.7s    | whiff cost STINGS + attributable; survivable    |
| decorIgnore       | 100% | 0%   | 0.00      | +9.7   | 46.4s    | décor = pure upside (ignoring it costs nothing) |
| campVital (exploit)| 100%| 0%   | 0.00      | +50.0  | 41.6s    | **dominant line: fixed-aim head, never tracks** |
| sloppy            | 81%  | 19%  | 7.58 (≤9) | −121   | 74.1s    | losable by poor execution                       |
| sloppyNoParry     | 91%  | 9%   | 6.66 (≤9) | −100   | 68.7s    | losable                                         |

Optimal single walk window-kinds on the seed: phase-1 6, phase-2 2 normal + charged, phase-3 3
normal + charged — every phase presents landable windows; two rings + parry + décor arm all landable.

### Per-lever findings

- **LEVER 1 — points faibles multiples — MECHANIC PASS / RISK-REWARD CORRECTION.** Phase 1 = single
  V1 ring (byte-identical); phase 2+ = two simultaneous rings, vital 2 HP (head) / limb 1 HP (torso),
  shared `windowChipped` (a chip from either answers; no double drain), overlap→vital. Visual (PNG
  `20`): two anatomically-distinct rings — the CHOICE is visible (AC-D2 met). **BUT the intended
  risk/reward is INVERTED and the "which target" decision degenerates.** Geometry: the VITAL wander
  box (centre (0,0.80), amp 0.16) has max corner distance **0.226 < `RING_HIT_RADIUS` 0.30**, so the
  ENTIRE vital ring path is answerable from ONE fixed aim at head-centre — the fast ×1.0 wander is
  cosmetic, tracking is unnecessary. Meanwhile the LIMB box (amp 0.28) reaches **0.396 > 0.30**, so
  the "safe bank" is actually the ring that can slip the reticle. Net: **vital strictly dominates**
  (higher chip AND easier) → the load-bearing "which do I commit to?" move (spec §0) collapses to
  "always camp vital for 2 HP" (sim: `campVital` 100% win / 0 blown / +50 E / 41.6 s is the dominant
  line; `greedyVital` 0.03 avg blown — greed is not punished). Structural: with catch radius 0.30 and
  the head band only 0.4×0.4 (dx ±0.2, dy 0.6–1.0), even the MAX in-band vital box (amp 0.2) reaches
  0.283 < 0.30 — vital can NEVER require tracking under the current radius. **CORRECTION (design/
  tuning — route to `lead-game-designer`, NOT fix-lane: hit-test shape + new constant + re-tune,
  needs design sign-off): introduce a per-ring catch radius; set `BOSS_VITAL_CATCH_RADIUS ≈ 0.18`
  (keep LIMB / parry-point / décor / phase-1 at `RING_HIT_RADIUS 0.30`).** File:
  `src/game/systems/bossQteSystem.ts` — `withinCatch`/`ringHitZone` take a per-zone radius; add the
  constant + a ⊂-band-aware assert. Why: 0.18 < vital reach 0.226 forces genuine tracking of the fast
  head ring, so the 2 HP chip is EARNED and greed carries real whiff→blown-window risk — restoring the
  dilemma the lever exists to create. Re-verify next playtest: `greedyVital` loss rate rises above 0
  while competent limb-banking still clears. (This is exactly the spec's own flagged most-likely
  verify correction — spec "Winnability envelope" / Karim advisory 5.)
- **LEVER 3 — parade — MECHANIC PASS / soft READ flag.** Same fire-click reinterpreted on charged
  windows; parry on `BOSS_PARRY_POINT` → +2 HP + STAGGER→bonus window; whiff → −10 + one blown window
  (single charge); off-point panic → −6 non-consuming. Cadence: none phase 1, one teach at phase-2
  window index 1 (the Karim-advisory-1 separation), every-other phase 3. Sim: parry styles win; the
  whiff cost STINGS and is attributable — `parryWhiff` drains −58.6 avg E and reaches 8/10 blown
  windows, each whiff = a telegraphed charged window failed (AC-D3, AC-D7 met). **Soft flag (route
  to `ux-designer`/`lead-art`, NOT a FAIL — visual form is their lane per spec 3-C):** in PNG `21`
  the parry telegraph reads as a centred reticle-like mark under the smoke veil; it does not clearly
  read as the form-distinct "diamond guard glyph at the raised sidearm" the spec/UX require for
  "parry-vs-shoot at a glance before commit." Mechanic is correct; the at-a-glance READ needs Tony's
  leg-2 UX judgment.
- **LEVER 2 — décor + smoke — PASS.** Décor: pure-upside armed prop in the SHIELDED gap, +3, single-
  use (PNG `24`: glowing prop offset from the boss during SHIELDED — reads interactive; sim
  `decorIgnore` 100% win confirms ignoring it costs nothing = pure upside, AC-D5 décor). Smoke: PNG
  `22` — the veil DEGRADES but does not REMOVE the rings/telegraph (still legible under it); PNG `27`
  — held static under reduced-motion. Degrades-not-removes confirmed (AC-D4).
- **LEVER 5 — coup de grâce — PASS.** `bossHp≤0` → FINISHER (damage-free, click OR 1.5 s timeout →
  WON +50) before `QTE_RESULT_HOLD`. PNG `25`: sepia wash + « LIVRE LE SON » (canonical copy, not
  "ACHEVER"), an active-input read distinct from the green WON state (PNG `26`) and the cool
  phase-break. Reads ceremonial, zero failure surface (AC-D5). Cosmetic: the harness placeholder
  sprite does not show the "defeated kneel" pose (Niveau-Final art item, non-blocking).
- **LEVER 4 — renfort — PASS.** Phase-3, telegraphed, in-tableau: PNG `23` shows desaturated
  frame-edge silhouettes (no shootable body, énergie already drained) — reads PRESSURE not THREAT
  ("pas ses hommes"). Deterministic check (chip to phase 3, then blow the surge windows): surge
  windows drain **−12 as a SINGLE charge**; the charged+surge OVERLAP window de-stacks to
  **max(−10,−12) = −12, never −22**; **every** blown window increments the loss clock by **exactly
  +1** (the surge never accelerates `maxBlownWindows`); LOST lands at exactly 10. No double jeopardy
  — the surge raises the ENERGY stakes only, the loss clock is untouched (AC-D6, AC-D7).

### Karim gate advisories (my named verify-leg items)

- **Advisory 1 (phase-2 double-introduction overload) — DISCHARGED, no correction.** Phase 2
  introduces the two-ring split (at the phase-1→2 break) and the single parry teach (phase-window
  index 1, one window later — the deliberate temporal separation). Sim: competent styles clear phase
  2 at 100% / 0 blown — the double-introduction does NOT overload competent play; the teach is one
  safe instance with the longest tell (`parryLeadSeconds` 0.8). I concur with the separation; no need
  to push the teach later. (Cognitive-load-at-the-table is ultimately a real-player feel item; the sim
  confirms the mechanical headroom, and the 1-window gap + the break's dual-ring preview cue suffice.)
- **Advisory 5 (seed winnability, full kit, K-5) — DISCHARGED, seed HOLDS, no re-pin.** On
  `targetSeed 20260719` every competent style clears with margin (optimal / greedyLimb / greedyVital
  / decorIgnore 100% win, 0 blown); each phase presents landable normal + charged windows and the
  décor arm-window is landable (optimal uses the full kit). `bossHp 24` / `maxBlownWindows 10` stand
  — not re-tuned. NOTE: this winnability is currently PROPPED UP by the Lever-1 geometry (vital is
  trivially campable); after the per-ring-catch-radius correction lands, RE-PIN/RE-VERIFY winnability
  (a tighter vital catch is the point — competent limb-banking must still clear on the seed).

### Winnability verdict (spec "Design VERIFY acceptance")

- Winnable with competent-not-perfect play: **PASS** (greedyLimb / decorIgnore 100%; even `sloppy`
  81%). Losable: **YES** (`sloppy` 19%, `sloppyNoParry` 9%). **DEVIATION:** losability comes from
  execution sloppiness + parry-whiffing, NOT from the targeting greed the Lever-1 spec intends
  ("chase 2 HP and risk the whole window") — because vital does not carry that risk (Lever-1
  finding). The primary difficulty axis is parry execution, not the targeting choice. The Lever-1
  correction restores the intended targeting risk.

- handoff → `lead-game-designer` (Karim): design-acceptance VERDICT = PASS-WITH-CORRECTIONS. ONE
  gated design correction (Lever-1 per-ring VITAL catch radius ≈0.18 to restore risk/reward + undo
  vital-camp dominance) — needs your PASS, then a small `dev-gameplay` change (per-zone catch radius
  + a unit test) + a winnability re-pin. Advisories 1 & 5 discharged. This report precedes
  `senior-architect`'s integration review per the pipeline.
- handoff → `ux-designer` (Tony) + `lead-art` (Nico): soft READ flag — the parry telegraph (PNG `21`)
  does not yet read as form-distinct from the shoot ring at a glance; confirm in your leg-2 form
  review (spec 3-C is your lane; my mechanic is correct).
- handoff → `dev-gameplay` (Amelia): IF Karim gates the Lever-1 correction — a per-zone catch radius
  in `withinCatch`/`ringHitZone` + `BOSS_VITAL_CATCH_RADIUS 0.18` + a test that the vital ring is
  whiffable at its box corners and a unit winnability re-check on `targetSeed 20260719`.
- NOTE (process): appended via `cat >>` heredoc, strictly additive at end-of-file. Simulation was a
  throwaway node harness in the session scratchpad (not the repo); no `src/**` or test edit.

VERDICT: PASS-WITH-CORRECTIONS — design acceptance playtest (game-designer) — differentiation thesis lands (phase-1 V1 → phase-2 visible two-target choice → phase-3 parry/smoke/renfort → ceremonial finisher, a different moment-to-moment than the hostage duel); §5.6 attributability holds, no double jeopardy (renfort −12 single-charge, loss clock +1 exactly, LOST at 10), décor pure-upside, smoke degrades-not-removes, finisher ceremonial; winnable-not-trivial (greedyLimb 100%) and losable (sloppy 19%). ONE gated correction: Lever-1 risk/reward is inverted — VITAL box reach 0.226 < catch radius 0.30 makes the head ring trivially campable and strictly dominant, collapsing the "which target" decision; fix = per-ring `BOSS_VITAL_CATCH_RADIUS ≈0.18` in `bossQteSystem.ts` (route to lead-game-designer). Plus a soft parry-tell form-legibility flag to ux/art.
