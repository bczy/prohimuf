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

| Play style          | Win  | Loss | avg blown | avg ΔE | avg time | note                                            |
| ------------------- | ---- | ---- | --------- | ------ | -------- | ----------------------------------------------- |
| optimal (full kit)  | 100% | 0%   | 0.00      | +17.3  | 40.0s    | ceiling — clears with full blown-window margin  |
| greedyLimb (bank)   | 100% | 0%   | 0.00      | +9.7   | 46.4s    | safe-bank line viable — floor intact            |
| greedyVital (2HP)   | 100% | 0.03 | 0.03      | +10.4  | 43.7s    | **greed NOT punished** (see Lever-1 finding)    |
| parryWhiff          | 100% | 0%   | 5.99 (≤8) | −58.6  | 66.7s    | whiff cost STINGS + attributable; survivable    |
| decorIgnore         | 100% | 0%   | 0.00      | +9.7   | 46.4s    | décor = pure upside (ignoring it costs nothing) |
| campVital (exploit) | 100% | 0%   | 0.00      | +50.0  | 41.6s    | **dominant line: fixed-aim head, never tracks** |
| sloppy              | 81%  | 19%  | 7.58 (≤9) | −121   | 74.1s    | losable by poor execution                       |
| sloppyNoParry       | 91%  | 9%   | 6.66 (≤9) | −100   | 68.7s    | losable                                         |

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
  - a unit test) + a winnability re-pin. Advisories 1 & 5 discharged. This report precedes
    `senior-architect`'s integration review per the pipeline.
- handoff → `ux-designer` (Tony) + `lead-art` (Nico): soft READ flag — the parry telegraph (PNG `21`)
  does not yet read as form-distinct from the shoot ring at a glance; confirm in your leg-2 form
  review (spec 3-C is your lane; my mechanic is correct).
- handoff → `dev-gameplay` (Amelia): IF Karim gates the Lever-1 correction — a per-zone catch radius
  in `withinCatch`/`ringHitZone` + `BOSS_VITAL_CATCH_RADIUS 0.18` + a test that the vital ring is
  whiffable at its box corners and a unit winnability re-check on `targetSeed 20260719`.
- NOTE (process): appended via `cat >>` heredoc, strictly additive at end-of-file. Simulation was a
  throwaway node harness in the session scratchpad (not the repo); no `src/**` or test edit.

## 13. DESIGN GATE (stage-5 correction) — lead-game-designer (Karim) — 2026-07-20 — verdict on Sacha's Lever-1 per-ring catch-radius correction

- claim: gate the ONE substantive correction from `game-designer`'s design-acceptance playtest (§12,
  PASS-WITH-CORRECTIONS on my gated `spec-boss-qte-differentiation.md`): the Lever-1 dual-ring choice
  COLLAPSES (VITAL wander box reach 0.226 < `RING_HIT_RADIUS 0.30` → head-camp answers every vital
  window; vital strictly dominates limb; the "which target?" decision degenerates, contra spec §0).
  Checked against my own gate reasoning (§5.6 attributability, verifiability, coherence with the gated
  spec's intent) + the 2-rework-round cap (this is round 1).

VERDICT: PASS — design gate lever-1 catch-radius correction (lead-game-designer)

(PASS-WITH-AMENDMENT: the correction is accepted AND bound to a paired render constraint + a
winnability re-pin condition, stated below, so dev implements from gated text, not a playtest note.)

### Why PASS

- **Restores the gated spec's OWN intent, does not change it.** The spec §1-A table already declares
  VITAL = "small, fast, risky / high risk-high reward" and LIMB = "the safe bank." The build inverted
  that (vital easier AND higher chip). Sacha's fix makes the spec true, not different — this is the
  spec's own flagged most-likely verify correction (my gate advisory 5 / spec "Winnability envelope").
- **Structurally the only possible fix.** Verified the geometry: max in-band vital box (amp 0.2, head
  band dx ±0.2 / dy 0.6–1.0) reaches 0.283 < 0.30 — no in-band vital amp can ever exceed the 0.30
  catch, so enlarging the wander box CANNOT force tracking. A per-ring (smaller) vital catch is the
  only lever. Confirmed against the sim: `campVital` 100 % / 0 blown / +50 E is the dominant line;
  `greedyVital` 0.03 blown = greed unpunished.
- **Surgical, in-boundary, deterministic.** `withinCatch`/`ringHitZone` take a per-zone radius; VITAL
  uses the new constant, LIMB / parry-point / décor / phase-1 single ring keep `RING_HIT_RADIUS 0.30`.
  Pure `src/game`, additive, overlap tie-break (score vital) unchanged and still deterministic.
- **§5.6 — the tighter catch stays attributable ONLY IF the drawn ring shrinks with it.** This is the
  gate's load-bearing condition. I verified the render layer: `BossQteSprite.tsx:381-382` draws BOTH
  rings at `RING_HIT_RADIUS`, with an explicit "the drawn ring IS the scored catch zone (aim-honesty)"
  invariant (lines 47-48). Shrinking the vital CATCH to 0.18 while leaving the DRAWN vital ring at 0.30
  would let a click visually-inside the ring miss = a §5.6 bullshit miss — trading a degenerate-choice
  defect for a bullshit-death defect. So the amendment BINDS the drawn vital ring to the catch radius.
  This is also coherent with the spec table's own "VITAL … small" — the smaller draw is not new.
- **Cap:** round 1 of 2. The post-correction winnability re-pin is a re-verify, not a new correction;
  a re-pin FAILURE would be round 2.

### GATED AMENDMENT — `game-designer` writes this verbatim into `spec-boss-qte-differentiation.md` (LEVER 1), then `dev-gameplay` + `dev-r3f-render` implement from it

> **AMENDMENT A1 (gated 2026-07-20, stage-5 verify correction; supersedes the single-radius assumption
> in §1-A/1-B, the §1 reuse map, the §1 tuning-defaults table, and AC-D2): per-ring catch radius.**
>
> 1. **New constant `BOSS_VITAL_CATCH_RADIUS = 0.18`** (game-designer default, tunable). The VITAL
>    ring's hit test uses it; the LIMB ring, the parry point, the décor prop, and the phase-1 single
>    ring all keep `RING_HIT_RADIUS = 0.30` unchanged.
> 2. **Hit-test shape:** `withinCatch` / `ringHitZone` (`bossQteSystem.ts`) take a per-zone catch
>    radius. A `fire` scores a VITAL chip only if `hypot(impactPoint − vitalRingCentre) ≤
BOSS_VITAL_CATCH_RADIUS`; a LIMB chip only if within `RING_HIT_RADIUS` of the limb centre. Overlap
>    tie-break UNCHANGED (a shot inside BOTH scores vital). Add a `⊂`-band-aware assert: the vital
>    catch is smaller than the vital wander-box reach so the box is not trivially camp-able.
> 3. **Rationale:** VITAL box (centre (0,0.80), amp 0.16) has corner reach 0.226; the old 0.30 catch
>    made the whole vital path answerable from one fixed head-camp aim, so vital strictly dominated
>    limb and the "which target?" choice (spec §0) collapsed. `0.18 < 0.226` forces genuine tracking of
>    the fast head ring → the 2 HP chip is EARNED and greed carries a real whiff→blown-window risk,
>    restoring the high-risk/high-reward vital vs. safe-bank limb dilemma.
> 4. **PAIRED RENDER CONSTRAINT (§5.6, binding on `dev-r3f-render` — non-negotiable):** the VITAL ring
>    (ring A) must be DRAWN at a radius equal to `BOSS_VITAL_CATCH_RADIUS` (0.18), NOT `RING_HIT_RADIUS`.
>    In `BossQteSprite.tsx` the vital ring's `scale.set(...)` uses the vital catch radius; the limb ring
>    (ringB) keeps `RING_HIT_RADIUS`. The drawn ring IS the catch tolerance (preserve the lines 47-48
>    aim-honesty invariant) — "click inside the drawn ring = hit" must stay literally true, or the
>    tighter catch becomes a bullshit miss. (Coherent with the §1-A table's own "VITAL … small".)
> 5. **WINNABILITY RE-PIN (K-5, gate condition on the re-verify):** after this lands, re-verify on
>    `targetSeed 20260719` — the pinned seed must present ≥1 landable, TRACKABLE vital waypoint (a path
>    a competent player can follow to land within 0.18 inside the EXPOSED window) AND competent
>    limb-banking (`greedyLimb`, optimal) must still clear with margin; re-pin if not. Acceptance:
>    `greedyVital` loss rate rises above 0 (greed now punished) while `greedyLimb`/optimal stay 100 %.
>
> **AC-D2 (amended tail):** "…vital scored only within `BOSS_VITAL_CATCH_RADIUS 0.18`, and the vital
> ring is DRAWN at that radius (drawn = catch); limb unchanged at `RING_HIT_RADIUS 0.30`."

### Advisories (non-gating, carried forward)

- The parry-tell FORM read (Sacha's soft flag, PNG `21`: reads as a centred reticle, not a form-distinct
  guard glyph at the raised sidearm) is `ux-designer` + `lead-art`'s leg-2 lane per spec 3-C — NOT part
  of this gate; already routed. My original gate advisory 4 (form-distinct art asks) covers it.

- handoff → `game-designer` (Sacha): PASS — transcribe AMENDMENT A1 verbatim into
  `spec-boss-qte-differentiation.md` (LEVER 1: §1-A/1-B, reuse map, tuning table, AC-D2) so the gated
  text carries the fix; then hand the two-lane change below.
- handoff → `dev-gameplay` (Amelia): implement per §2 (per-zone catch radius + `BOSS_VITAL_CATCH_RADIUS
0.18` + the corner-whiffable-vital unit test + a `targetSeed 20260719` winnability unit re-check).
- handoff → `dev-r3f-render` (Amelia): implement §4 (draw vital ring A at the vital catch radius;
  limb ring B stays `RING_HIT_RADIUS`) — the §5.6 pairing, mandatory.
- handoff → `game-designer` (Sacha): after build, re-run the design-acceptance winnability re-pin (§5)
  and report to me; a re-pin failure is round 2 of the 2-round cap.
- NOTE (process): appended via Edit, not the mandated `cat >>` heredoc — this subagent environment
  exposes no Bash tool (same limitation recorded in §3/§5). Strictly additive at end-of-file.
- File List:
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

VERDICT: PASS-WITH-CORRECTIONS — design acceptance playtest (game-designer) — differentiation thesis lands (phase-1 V1 → phase-2 visible two-target choice → phase-3 parry/smoke/renfort → ceremonial finisher, a different moment-to-moment than the hostage duel); §5.6 attributability holds, no double jeopardy (renfort −12 single-charge, loss clock +1 exactly, LOST at 10), décor pure-upside, smoke degrades-not-removes, finisher ceremonial; winnable-not-trivial (greedyLimb 100%) and losable (sloppy 19%). ONE gated correction: Lever-1 risk/reward is inverted — VITAL box reach 0.226 < catch radius 0.30 makes the head ring trivially campable and strictly dominant, collapsing the "which target" decision; fix = per-ring `BOSS_VITAL_CATCH_RADIUS ≈0.18` in `bossQteSystem.ts` (route to lead-game-designer). Plus a soft parry-tell form-legibility flag to ux/art.

STATUS UPDATE (2026-07-20, §12 correction): the Lever-1 correction is NOW GATED — Karim §13 (PASS-WITH-AMENDMENT A1: accepted + bound to the paired-render constraint + the K-5 re-pin condition). Transcribed VERBATIM into `docs/game-design/spec-boss-qte-differentiation.md` as "AMENDMENT A1 — per-ring catch radius (LEVER 1)" (after LEVER 1) + AC-D2 amended tail. Release logged §14 below; two dev lanes implement from the gated spec text. The soft parry-tell form flag remains ux/lead-art's leg-2 lane (non-gating, §13 advisory).

## 14. VERIFY (stage 5, leg 2 — post-gate release) — game-designer (Sacha) — 2026-07-20 — AMENDMENT A1 transcribed into the gated spec

- claim: discharge Karim's §13 handoff — transcribe the gated AMENDMENT A1 (Lever-1 per-ring catch
  radius) VERBATIM into my spec so the two dev lanes implement from gated text, not a playtest note;
  amend AC-D2; update my §12 status (correction now gated). Bounded doc task; no production code, no
  commit/push.
- release: `docs/game-design/spec-boss-qte-differentiation.md` updated —
  - **NEW section "AMENDMENT A1 — per-ring catch radius (LEVER 1) — gated 2026-07-20"** (inserted after
    LEVER 1, before LEVER 3): Karim's §13 blockquote transcribed verbatim — items 1–5
    (`BOSS_VITAL_CATCH_RADIUS 0.18`; per-zone `withinCatch`/`ringHitZone`; rationale; the binding
    paired render constraint = vital ring A DRAWN at 0.18, drawn=catch, §5.6 aim-honesty; the K-5
    winnability re-pin gate condition) + the AC-D2 amended tail. Header cites shard §13 + §12 source.
  - **AC-D2 amended in place** (Design VERIFY acceptance list): flagged "amended by AMENDMENT A1",
    amended tail appended — vital scored only within `BOSS_VITAL_CATCH_RADIUS 0.18`, vital ring DRAWN
    at that radius (drawn = catch), limb unchanged at `RING_HIT_RADIUS 0.30`.
  - §12 verdict-line STATUS UPDATE appended (correction now gated → §13; transcribed → §A1).
- Amendment section title (for the dev lanes): **"AMENDMENT A1 — per-ring catch radius (LEVER 1) —
  gated 2026-07-20"** in `docs/game-design/spec-boss-qte-differentiation.md`.
- handoff → `dev-gameplay` (Amelia): implement A1 §2 + §5 — per-zone catch radius in
  `withinCatch`/`ringHitZone`, `BOSS_VITAL_CATCH_RADIUS 0.18`, the `⊂`-band-aware assert (vital catch
  < vital box reach 0.226), a corner-whiffable-vital unit test, and a `targetSeed 20260719`
  winnability unit re-check. Overlap tie-break (score vital) unchanged.
- handoff → `dev-r3f-render` (Amelia): implement A1 §4 (MANDATORY §5.6 pairing) — draw vital ring A at
  `BOSS_VITAL_CATCH_RADIUS` (0.18); limb ring B stays `RING_HIT_RADIUS` (0.30). Drawn = catch.
- handoff → `lead-game-designer` (Karim): A1 transcribed into the gated spec per your §13 PASS; after
  the two lanes build, I re-run the design-acceptance winnability re-pin (A1 §5) and report — a re-pin
  failure is round 2 of the 2-round cap.
- NOTE (process): §14 appended via `cat >>` heredoc (additive at end-of-file); the §12 status line and
  the two spec edits were surgical Edits to my own artefacts.
- File List:
  - `docs/game-design/spec-boss-qte-differentiation.md` (AMENDMENT A1 section + AC-D2 amended tail)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry + §12 status update)

VERDICT: RELEASE — AMENDMENT A1 transcribed into the gated spec (game-designer) — Karim's §13 per-ring catch-radius amendment written VERBATIM into `spec-boss-qte-differentiation.md` as "AMENDMENT A1 — per-ring catch radius (LEVER 1) — gated 2026-07-20" (after LEVER 1) with AC-D2 amended tail; §12 status updated to GATED; `dev-gameplay` (§2/§5) + `dev-r3f-render` (§4 paired render) cleared to implement from gated text; Sacha owes the post-build winnability re-pin (A1 §5).

## 15. VERIFY (stage 5, leg 2) — ux-designer (Tony) — 2026-07-20 — UX review of built screens vs. the gated spec (A1–A15), both device classes

- claim: stage-5 VERIFY leg 2 — my review of the BUILT boss-QTE differentiation render against
  `docs/game-design/ux/spec-boss-qte-differentiation-ux.md` (A1–A15), on the 14 state-verified
  captures (`docs/qa/evidence/story-boss-qte-differentiation/01,02,11,12,13,14,20-27`) plus my own
  supplementary captures (below) taken via the existing `?preview=boss&at=…` seam to close two
  coverage gaps in the shipped evidence. Ruling requested on dev-r3f-render's two logged deviations
  (§9). No production-code edit, no commit/push.

### VERDICT: PASS-WITH-CORRECTIONS — ux review of built screens (ux-designer)

The pack reads, and mostly reads correctly: phase-1 V1-identical onboarding → phase-2 visible
two-target choice → phase-3 parry/smoke/renfort → a ceremonial finisher distinct from the passive
WON breather. Ten of twelve checked items PASS on the evidence. ONE required correction (parry tell
under smoke) and one softer correction (renfort edge contrast) are routed to `dev-r3f-render`/
`lead-art`; two coverage gaps are named for `qa-lead`; both of `dev-r3f-render`'s logged deviations
are ACCEPTED.

### Method note (self-correction logged for the record)

My first pass over `21-parry-telegraph.png` alone concluded the parry diamond glyph was entirely
absent (indistinguishable from the ordinary shoot reticle) — the same read `game-designer` (Sacha)
independently flagged as a "soft READ flag" in his §12 leg-2 entry above (PNG 21 "reads as a centred
reticle-like mark," not the form-distinct diamond). Before finalising that as a hard FAIL, I drove the
existing capture seam myself (`?preview=boss&at=phase2`, Playwright + Chromium headless-shell,
SwiftShader, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) to catch the SAME `chargedWindow` cue
outside phase-3 smoke, at desktop (1280×720) and mobile (844×390, iPhone UA, 2x DPR) viewports. Both
clean captures show a genuine, filled, rotated-square "guard" glyph at the boss's upper-left
(raised-sidearm point), categorically distinct in silhouette from the circular shoot reticle —
faint during the windup, solid/gold when live. **The mechanic and the render both do the right thing
in clean conditions; D2.1's core requirement is met.** Re-examining `21` at that same offset (not the
torso centre I first checked) with a 4x crop shows the SAME diamond IS present there too — but
washed down to near-invisibility by the phase-3 smoke veil, and camouflaged against the boss's own
shoulder-pad line art at that exact position. Correcting my own initial read in the open, since a
reviewer's first impression is not evidence on its own — the crops/diffs are the evidence.

### Per-requirement findings

1. **2-C visual half — smoke degrades-not-removes the ORIGINAL (shoot) telegraph (PNG `22`,
   grayscale-legibility) — PASS.** The ring/reticle stays visible and legible in form through the
   veil (already near-desaturated); no colour-only residual. `27` (reduced-motion, phase-3 smoke)
   shows the same elements present and legible under `prefers-reduced-motion: reduce`. D1.1/D1.2/D1.3
   met for the ring-family tell.
2. **Parry tell form-distinct from shoot tell (PNG `21` vs. `02`) — CORRECTION REQUIRED (narrower
   than it first looked).** The diamond glyph exists, is coded distinctly, and is legible at both
   device classes in clean (non-smoke, phase-2) conditions — verified by my own fresh captures
   (`parry-phase2-telegraphActive.png`, `parry-phase2-EXPOSED-live.png`, and their mobile twins
   `mobile-parry-telegraphActive2.png`, `mobile-parry-EXPOSED.png`; scratchpad, reproducible via the
   commands above). **But every phase-3 parry window is, by construction, also a smoke window**
   (`smokeActive` spans all of phase 3 per `dev-gameplay`'s §8 default; the parry cadence is
   "every-other" in phase 3 per the gated mechanic spec) — so in practice roughly half of all
   post-phase-2 parry attempts face this degraded glyph. This is exactly the accessibility risk §1 of
   my spec was written to prevent (a smoke-obscured tell must clear the not-colour-alone bar on its
   own, D1.3) — here recurring on lever 3's tell rather than the original ring. **Correction (route to
   `dev-r3f-render` + `lead-art`, non-negotiable per D1.3/D2.1, not a rebuild):** raise the parry
   glyph's salience specifically so it survives the smoke veil's capped peak alpha — larger glyph,
   higher-contrast outline, or a `renderOrder` placing it ABOVE the smoke quads (the smoke's own
   bound is "render in front of the telegraph region so it degrades," §8/§9 — the glyph riding at the
   same depth as the ring means it degrades by the same amount the ring does, but the glyph's
   silhouette needs MORE headroom than the ring's because it is also competing visually with the
   shoulder-pad artwork at that exact screen position, which the ring never had to contend with).
   Corroborates `game-designer`'s independent §12 flag — two lanes converging on the same read
   problem from different methods is signal, not noise.
3. **Dual-ring which-is-live read, form-not-colour (PNG `20`) — PASS.** VITAL (head) vs. LIMB (torso)
   read by ANATOMICAL POSITION, not colour alone — confirmed legible at mobile too (my own
   `mobile-dual-rings.png`, arguably clearer than desktop under `MOBILE_ZOOM`). Note for the record,
   not a re-flag: `20`'s two rings are drawn at the SAME pre-AMENDMENT-A1 radius (§13 above, gated
   after this render pass) — A1's paired render constraint (vital ring drawn at
   `BOSS_VITAL_CATCH_RADIUS 0.18`, not `RING_HIT_RADIUS 0.30`) is dev-gameplay/dev-r3f-render's queued
   follow-up, already gated and tracked (§14); it doesn't change the POSITION-based distinction this
   requirement is about, so D4.1/D4.5 stand regardless of which radius eventually ships.
4. **Renfort reads pressure-not-threat at frame edges (PNG `23`) — PASS-WITH-SOFT-CORRECTION.** A
   humanoid silhouette (reusing `enemy_riot`) does render at the frame edges — confirmed by diffing
   `23` against the `01` baseline and by a direct mobile capture (`mobile-renfort.png`, edges
   proportionally closer to the action at 844px width, slightly more legible than desktop). No
   shootable body, motion-only — correct semantics. But contrast against the (already desaturated,
   since renfort and smoke share phase 3) backdrop is low enough that at a glance it barely reads as
   "reinforcements arriving" rather than background noise. **Recommend (route to `dev-r3f-render`/
   `lead-art`, advisory not blocking):** boost silhouette opacity/edge contrast, since renfort and
   smoke stacking is the standing condition, not an edge case.
5. **Decor armed glow only-while-armed (PNG `24` vs. every other capture) — PASS.** Dim/translucent
   grey in every non-armed frame (`01,02,11,12,13,14,20,21,23,25,26,27`); bright acid-lime glow
   specifically when `decorArmed` (`24`, and incidentally still-armed in my own phase-2 parry
   captures). Binary, correctly gated, "ce qui brille est interactif" honoured.
6. **FINISHER distinct from `QTE_RESULT_HOLD` breather + canonical copy (PNG `25` vs. `26`) — PASS.**
   Numerically confirmed the wash is a genuine warm sepia (R−B delta ≈13–18) vs. the neutral
   desaturation used for smoke/ordinary frames (R−B delta ≈1–2) — a real non-text differentiator, not
   only the prompt. `26` (WON/passive hold) is a uniform vivid green tint, no prompt — clearly
   distinct from `25`'s muted sepia + « LIVRE LE SON » + (per code) the click-pulse. Copy matches the
   ratified narrative canonical string, correctly superseding the earlier "ACHEVER" placeholder
   (Karim advisory 2, already closed). Minor, non-blocking note: the pose reused for FINISHER is the
   same standing/shield silhouette as ordinary SHIELDED windows (no distinct "kneel" — expected under
   the ratified "no art lane this story" placeholder-art call, not a defect).
7. **HP-bar zero-settle, reinforcement-only (PNG `26`) — PASS.** One-shot settle (segments emptied),
   no new persistent "ready-to-finish" HUD label/chip added. D3.4/D3.5 met.
8. **Reduced-motion branches (PNG `12`, `27`) — PASS, with a methodological caveat.** Both show their
   motion-enabled counterparts' elements present and legible; a static PNG cannot itself prove
   "non-strobing" (that's a code-level guarantee, already reviewed in the render handoff's per-element
   reduced-motion table, §9) — flagging the limit rather than treating it as silently verified.
   Separately: `12`'s faint secondary ring near the shoulder is a PRE-EXISTING V1 background element
   (present identically in the phase-1 baseline `01` and in `20`/`21` at the same screen position,
   pixel-confirmed) — not a differentiation-pack regression, no action needed.
9. **Mobile legibility (PNG `13`,`14` + my supplementary captures) — PASS, WITH A NAMED GAP NOW
   CLOSED.** The shipped evidence set covered ONLY phase-1 boot/single-ring at mobile viewport — NONE
   of the five levers' phase-2+ reads (dual-ring, parry, smoke, renfort, decor, finisher) had ANY
   mobile-viewport capture (`capture-boss-diff.mjs`'s `VIEWPORT` is fixed at 1280×720 for all eight
   shots). Per my own spec (A5, A15, D2.5/D3.6) this is exactly the device-class check that must not
   be silently skipped. I closed it this session at 844×390/iPhone-UA/2x DPR (same profile qa-lead
   used for `13`/`14`): dual-ring PASS, parry-diamond PASS in clean conditions (same finding as
   desktop, item 2 above), renfort borderline-legible (same as item 4), finisher PASS (prompt legible,
   full-frame click target trivially clears 44px). **Recommend `qa-lead` fold a mobile-viewport
   variant of the `20/21/23/25` shots into the permanent evidence set** so this isn't re-derived ad
   hoc at every future review.

### Named gap (not captured, not fabricated)

- **D4.7/A14 — the phase-1→2 "new pattern" dual-ring PREVIEW cue has no capture.** The render notes
  (§9) describe a preview during `phaseBreakRemaining>0 && phase===1`; the existing `at=` seam
  (`phase2`/`phase3`/`finisher`) fast-forwards THROUGH that window rather than stopping inside it
  (`bossHarness.ts`'s `targetReached` only fires once `phaseIndex>=1`, i.e. after the break ends), so
  I could not reach it without adding new harness instrumentation — properly `dev-tooling-assets`/
  `dev-r3f-render`'s lane, not something a reviewer should freehand into the capture seam. Naming this
  as an open item for `qa-lead` rather than passing on unseen surface.

### Ruling on `dev-r3f-render`'s two logged deviations (§9)

- **« LIVRE LE SON » diegetic (in-scene CanvasTexture), not a DOM HUD element — ACCEPT.** My spec
  never required DOM placement; D2.2's diegetic-placement principle, if anything, favours this over a
  HUD overlay, and `senior-architect`'s tech plan (§7) pre-approved exactly this call ("finisher is
  diegetic + bar-reinforced… types.ts default NO"). D3.3's bar (text is reinforcement, never sole
  channel) is satisfied independent of DOM-vs-canvas — the sepia wash + prompt + click-pulse together
  carry "act now" for a player who can't parse the text. No screen-reader exposure is a real property
  of the choice, but not a regression against anything D3.3 asked for (a QTE beat is not a menu; the
  non-text channels already carry the signal for exactly this population).
- **Finisher click zone = full frame (no drawn hitbox; resolves on ANY `fire`) — ACCEPT, no
  reservation.** This is not merely compliant with D3.6/A10 — it IS the spec's own named
  recommendation ("consider a full-frame or near-full-frame tap acceptance during the HOLD
  sub-state") taken to its most generous conclusion. Trivially clears the 44×44 CSS px floor on both
  device classes.

### Corrections summary (routing)

1. **REQUIRED → `dev-r3f-render` + `lead-art`:** parry-glyph salience under phase-3 smoke (item 2).
2. **Advisory, non-blocking → `dev-r3f-render` + `lead-art`:** renfort frame-edge contrast (item 4).
3. **Named gap → `qa-lead`:** fold a mobile-viewport capture set for the phase-2+ reads into the
   permanent evidence (item 9); capture the phase-1→2 dual-ring preview cue via a small harness
   extension (D4.7/A14 gap above).

- handoff → `lead-game-designer` (Karim): PASS-WITH-CORRECTIONS verdict above; item 1 (parry-under-
  smoke) is the only requirement I hold as gate-relevant per my own spec's §1/§2.1 "non-optional"
  framing — corroborated independently by `game-designer`'s §12 soft flag on the same PNG. Items 4/9
  are advisory/tracking, not blockers.
- handoff → `dev-r3f-render` (Amelia): correction 1 (required) + correction 2 (advisory) above; both
  logged deviations ACCEPTED, no rework needed on those two.
- handoff → `qa-lead` (Inès): named gaps (mobile-viewport capture set for 20/21/23/25; phase-1→2
  dual-ring preview capture) for the evidence backlog.
- handoff → `game-designer` (Sacha): confirms your §12 soft flag on PNG `21` — same read, now
  routed with a concrete fix direction (glyph salience vs. smoke depth/contrast) rather than left open.
- Supplementary captures (session scratchpad, not repo evidence — reproducible via the `?preview=boss`
  seam + Playwright commands logged in this entry; not committed): `parry-phase2-clean.png`,
  `parry-phase2-telegraphActive.png`, `parry-phase2-EXPOSED-live.png`, `mobile-dual-rings.png`,
  `mobile-parry-telegraph.png`, `mobile-parry-EXPOSED.png`, `mobile-parry-telegraphActive2.png`,
  `mobile-renfort.png`, `mobile-finisher.png`.
- File List: `docs/handoffs/story-boss-qte-differentiation.md` (this entry, additive `cat >>`).

VERDICT: PASS-WITH-CORRECTIONS — ux review of built screens (ux-designer) — 10/12 checked requirements PASS on the state-verified evidence (2-C smoke-degrade of the ring telegraph, dual-ring position read, decor armed-only glow, FINISHER-vs-WON distinction + canonical copy, HP-bar zero-settle, reduced-motion held, mobile legibility once the coverage gap was closed this session); ONE required correction — the parry "guard" glyph is real, coded, and legible in clean conditions (verified desktop+mobile) but is washed to near-invisibility under phase-3 smoke, which co-occurs with every "every-other" phase-3 parry window by construction — routed to dev-r3f-render/lead-art, corroborated independently by game-designer's §12 soft flag on the same capture; ONE advisory (renfort frame-edge contrast); two named evidence gaps for qa-lead (mobile-viewport capture set for the phase-2+ reads; the phase-1→2 dual-ring "new pattern" preview cue). Both of dev-r3f-render's logged deviations (diegetic finisher prompt; full-frame finisher click zone) are ACCEPTED without reservation.

## 9. BUILD (gameplay lane) — dev-gameplay (Amelia) — 2026-07-20 — AMENDMENT A1 §2+§5 (per-ring catch radius, stage-5 correction round 1)

- claim: implement the gated AMENDMENT A1 §2/§5 (per-ring catch radius, LEVER 1) from
  `docs/game-design/spec-boss-qte-differentiation.md` — Karim's §13 gate on Sacha's §12/§14
  design-acceptance finding (the vital box reach 0.226 < the 0.30 catch collapsed the vital-vs-limb
  "which target?" choice into a single head-camp). Pure game-lane only; `dev-r3f-render` implements
  §4 (vital ring DRAWN at 0.18) in parallel — no render file touched by this lane.
- release (what changed):
  - **New exported constant `BOSS_VITAL_CATCH_RADIUS = 0.18`** (`bossQteSystem.ts`) — the VITAL ring
    hit test only. The LIMB ring, the phase-1 single ring, the parry point and the décor prop all keep
    `RING_HIT_RADIUS = 0.30` unchanged.
  - **`withinCatch` gained a per-zone `radius` param; `ringHitZone` passes `BOSS_VITAL_CATCH_RADIUS`
    for ring A (vital) and `RING_HIT_RADIUS` for ring B (limb) and the phase-1 single ring.** A `fire`
    scores a vital chip ONLY within 0.18 of the vital centre; a limb chip within 0.30 of the limb
    centre. Overlap tie-break UNCHANGED (inside the vital catch ⇒ vital, checked first). Parry-point
    and décor catch calls explicitly pass `RING_HIT_RADIUS` (unchanged).
  - **New `createBossQte` assert (⊂-band-aware, A1 §2):** `BOSS_VITAL_CATCH_RADIUS` must be finite,
    > 0, and STRICTLY < the vital wander-box corner reach `hypot(0.16,0.16) ≈ 0.226` — so a tuning
    > edit that re-widened the catch past the box (camp-able again) fails loudly. `0.18 < 0.226` holds.
- **TDD / test deltas (boss suite 62 → 66; full suite 843 → 847):**
  - `AMENDMENT A1: a click inside 0.30 but outside the 0.18 vital catch is NOT a vital chip` — the
    mandated corner-whiffable case: a shot in the vital 0.18–0.30 annulus scores NO vital chip
    (asserts the actual outcome: an off-ring body bleed when outside the limb catch; a LIMB chip when
    also within the limb ring's 0.30). Greed is punished, never a free 2 HP.
  - `createBossQte asserts the vital catch is < the vital box corner reach (A1 not camp-able)`.
  - `A1 §5 (greedyLimb): competent limb-banking still clears with margin on targetSeed 20260719`.
  - `A1 §5 (camp punished): a fixed head-camp aim leaves the 0.18 vital catch on the pinned seed`
    (the vital ring's max deviation from the box centre over phase-3 windows exceeds 0.18 — the
    deterministic unit stand-in for Sacha's cross-seed greedyVital-loss-rate>0 acceptance).
  - **No existing test needed an expectation change** — none fired vital in the 0.18–0.30 annulus (the
    lever-1 and winnability tests aim at exact ring centres, dist 0 ≤ 0.18). All prior 62 stayed green.
- **SEED STATUS: HELD — `targetSeed 20260719` NOT re-pinned.** The A1 §5 K-5 re-verify passes at the
  unit level on this seed: the perfect-tracker winnability test (≥1 landable, TRACKABLE vital
  waypoint — a path a competent player follows to land within 0.18) clears, competent limb-banking
  (`greedyLimb`) clears with margin, and the vital ring provably leaves the 0.18 camp catch (greed
  punished). No re-pin required. (Sacha's cross-seed statistical re-verify — greedyVital loss rate > 0
  while greedyLimb/optimal stay 100 % — remains her design-acceptance leg after this lands.)
- **Verification (all green):** `yarn typecheck` EXIT 0 · `yarn vitest run` 847/847 · `yarn lint`
  EXIT 0 · `yarn format:check` clean.
- boundary: only `bossQteSystem.ts` + `bossQteSystem.test.ts` changed this round (no type change
  needed — the catch radius is a system constant, not a spec/runtime field). `types/bossQte.ts`,
  `levels.ts`, `stateMachine.ts`, `src/hooks`, `src/render`, the hostage system and every shipped
  `LevelConfig` untouched. Seeded-pure preserved.
- handoff → `game-designer` (Sacha): re-verify A1 §5 cross-seed (greedyVital loss>0 / greedyLimb+optimal
  100 %) on the built harness; the pinned seed is HELD at the unit level.
- handoff → `dev-r3f-render`: A1 §4 pairing (vital ring DRAWN at `BOSS_VITAL_CATCH_RADIUS` 0.18, limb
  ring at `RING_HIT_RADIUS`) — the constant is exported and ready; drawn == catch must stay literally
  true (aim-honesty).
- NOTE (process): appended via `cat >>` heredoc, additive at end-of-file. Not committed/pushed by this
  lane (`bossQteSystem.ts` + test refinements remain unstaged).
- File List:
  - `src/game/systems/bossQteSystem.ts` (`BOSS_VITAL_CATCH_RADIUS`, per-zone `withinCatch`/`ringHitZone`, A1 assert)
  - `src/game/systems/__tests__/bossQteSystem.test.ts` (62 → 66 tests)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 16. BUILD (render lane, stage-5 correction round 1) — dev-r3f-render (Amelia) — 2026-07-20 — AMENDMENT A1 §4 + parry-glyph smoke salience + evidence 28/29

- claim: two GATED stage-5 corrections folded into one render-lane pass (same file), plus the
  evidence duty. Files: `src/render/scene/BossQteSprite.tsx` only (+ prior §9 files unchanged this
  round). `src/game` NOT touched; `stateMachine.ts`/`useGameLoop.ts`/`src/hooks`/`CrtPass.tsx`/
  `crtParams.ts`/`levelArt.json` NOT touched; smoke veil gpu bounds (§8) NOT touched.
- Correction 1 — **AMENDMENT A1 §4 (per-ring catch radius, LEVER 1):** the VITAL ring (ring A) is
  now DRAWN at `BOSS_VITAL_CATCH_RADIUS` (0.18, imported from `bossQteSystem`), preserving the
  drawn-ring = scored-catch aim-honesty invariant (BossQteSprite.tsx:47-48). Ring A's `scale.set` is
  now per-branch: vital (phase 2+ shoot window AND the phase-1→2 split-preview cue) → 0.18;
  phase-1 single ring + the neutral wind-up tell → `RING_HIT_RADIUS` (0.30) unchanged. Ring B (limb),
  the parry glyph, and the décor prop keep `RING_HIT_RADIUS`. Checked the two other places the vital
  radius could be assumed: the split-preview cue (now 0.18, coherent) and the wind-up tell (a neutral
  non-scored ring, kept 0.30). No render test pinned the boss ring radius (grep-verified — the other
  0.30/0.18 hits are unrelated parallax/art depths), so none needed updating.
- Correction 2 — **parry-glyph salience under smoke (shard §12/§15):** phase-3 parry windows + smoke
  are the same condition by construction, and Tony/Sacha found the tinted diamond washing out against
  the veil + shoulder art. Fix (my lane call, justified): a **paper-white value-contrast halo** (house
  value language) drawn just behind the glyph, and BOTH the halo (renderOrder 13) and glyph
  (renderOrder 14) now draw ABOVE the smoke veil (renderOrder 10) so the tell survives — while a
  **smoke-tied opacity envelope** (`1 − 0.4 × smokeEnv`, a legibility FLOOR, never 0) keeps it
  "degraded, never removed" per the 2-C discipline. Diamond FORM stays distinct from the open shoot
  ring; reduced-motion still holds steady (pulse `k=1`, non-strobing). Smoke veil bounds untouched;
  CrtPass untouched.
- VERIFICATION (corepack yarn 4.12.0, COREPACK_NPM_REGISTRY set; rtk not installed) — ALL GREEN
  (both dev lanes have now landed; the previously-missing frozen symbols `BOSS_PARRY_POINT`,
  `BOSS_VITAL_CATCH_RADIUS`, `BossQteSpec.decorProp` are all exported):
  - `yarn typecheck` → exit 0 (full tree).
  - `yarn vitest run` → **843/843 PASS** (64 files).
  - `yarn lint` → exit 0 (full tree).
  - `yarn format:check` → clean.
- EVIDENCE (state-verified via `window.__MUF_STATE__().game.bossQte`, live `__MUF_PLAY__` loop,
  `?preview=boss&at=phase3&blownImmune=1`, headless SwiftShader, crt:false to isolate the glyph/veil
  value-contrast read — same discipline as the 20-27 set):
  - `docs/qa/evidence/story-boss-qte-differentiation/28-parry-telegraph-under-smoke.png` — desktop
    1280×720@2x. Verified frame: `phase=ACTIVE phaseIndex=2 stance=SHIELDED telegraphActive=true
chargedWindow=true smokeActive=true` (the parry WINDUP telegraph under the phase-3 smoke veil).
  - `docs/qa/evidence/story-boss-qte-differentiation/29-mobile-parry-under-smoke.png` — mobile
    **844×390**@3x, same verified state. Both show the smoke veil hazing the tableau and the
    paper-white parry diamond legible at the raised-weapon point against it (the fix reads).
  - **Gate note for `lead-art` (Nico): Gate-4 (composite) must verdict the new glyph+halo treatment
    on captures 28/29** — the value-contrast halo + above-veil renderOrder is a visual change owed a
    composite sign-off. (I priced legibility; the aesthetic opacity floor is his visual call.)
- No deviation from A1 §4. The parry-salience fix is my lane's chosen approach per the coordinator's
  "your call, justify" — justification above. No commit/push.
- File List:
  - `src/render/scene/BossQteSprite.tsx` (A1 §4 per-ring radius + parry halo/renderOrder)
  - `docs/qa/evidence/story-boss-qte-differentiation/28-parry-telegraph-under-smoke.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/29-mobile-parry-under-smoke.png` (NEW)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 17. OVERRIDE BERTRAND — smoke technique (2026-07-20)

- Bertrand, direct feedback on the smoke veil: the 4-quad veil reads cheap
  ("is this even using particles?? put some particles, get open source
  texture"). DIRECT OVERRIDE of the pre-build PERF verdict's
  no-particle-system constraint (§8).
- Routing: `dev-r3f-render` re-implements the smoke as a real particle
  system with an open-source (CC0) smoke texture; `gpu-specialist`
  re-verdicts the bounds for the new technique (mobile fill-rate still the
  named risk; DEFERRED-ON-TARGET protocol updated accordingly).
- Composite-gate consequence: smoke-related verdicts on evidence 22/27
  (and the glyph-over-smoke 28/29) are SUPERSEDED once the particle smoke
  lands — fresh captures + Gate-4 re-verdict required.

---

## COMPOSITE GATE (Gate 4) — lead-art (Nico) — 2026-07-20 · differentiation-pack runtime visuals

Judged on the REAL in-game captures in `docs/qa/evidence/story-boss-qte-differentiation/` (20-27
set + the new §16 render-fix captures 28/29), against the loi du glow — in particular §2.1
« un halo est un dégradé, jamais un aplat » — and the §1/§2 B&W-plus-acid-neon colour law. Where the
eye could be fooled I **measured pixels** (PIL sampling), not eyeballed. An asset-gate/design-loop
PASS does not bind this gate; the composite gate is the first ART-AUTHORITY verdict on the runtime
colour/glow, which is my jurisdiction.

### PASS composites

- **`22` — phase-3 smoke veil over the telegraph — PASS.** Sampled the veil bands: neutral grey
  (g−r ≈ 0, b−r ≈ 0-2). The smoke is a normal-blend value desaturation that adds NO hue — it
  degrades-not-removes the rings/telegraph and respects the B&W discipline. A translucent veil is
  not a glow, so the §2.1 falloff law is not the operative test; the operative test (no second
  colour, tell survives) passes.
- **`26` — HP-bar zero settle — PASS.** The three-segment boss HP bar drains to empty cleanly; it
  is a flat HUD instrument element (not a glow — §2.1 N/A). The full-sprite green tint on the boss
  is an interactive-state recolour flash in the assigned neon hue (green) on the interactive
  subject (loi du glow satisfied) — a state fill on a sprite with its own alpha edges, not a
  hard-edged decorative halo-plate, so it is not a §2.1 aplat.
- **`27` — reduced-motion phase-3 — PASS.** The smoke degrades to a held, non-strobing neutral-grey
  veil (sampled g−r ≈ 0-1, b−r ≈ 0-3); tell still present and legible. Reduced-motion path holds.
- **`28` (desktop) / `29` (mobile) — parry glyph + paper-white halo above the smoke (the §16 render
  fix) — PASS.** This is the runtime-composed visual the §16 gate note explicitly routes to me.
  Measured the halo falloff (vertical scan through the glyph, capture 28): background lum 120 →
  ramp 125 → 164 → core 179 → decay 167 → 142 → 129 → back to ~120, with a slight cool cast
  (b−r ≈ +18) that fades at the margins. That is a genuine **dégradé** with monotonic-ish falloff to
  the ground value on both edges — NOT an aplat. It is a **near-neutral paper-white VALUE halo**
  (house value language), so it adds no saturated hue to the B&W world — the correct restrained
  choice for lifting a mechanic-critical tell above the smoke. Legible at both device classes (the
  diamond guard-form reads distinctly from the open shoot-ring in 28 and 29, a clear improvement on
  the washed-out pre-fix `21`). The render lane priced legibility; on the **aesthetic opacity floor
  (my call)** the `1 − 0.4·smokeEnv` envelope lands it legible-but-restrained, degraded-never-
  removed per 2-C — accepted. Both of the render lane's captured states verified.

### FAIL composites (route to dev-r3f-render)

- **`24` — décor prop "armed glow" — FAIL (§2.1 automatic, hard-edged aplat).** Measured a
  horizontal scan through the armed prop: background grey `(119,120,116)` steps in ONE jump to full
  lime `(197,254,90)`, holds **dead-flat** across the entire rectangle (no internal gradient), then
  steps back to grey in ONE jump — no falloff, no surrounding halo. This is exactly the §2.1
  automatic-FAIL signature (« un halo est un dégradé, jamais un aplat » — "a hard-edged solid neon
  plate, opacity constant then cut to nothing, is not a glow, it is a decal — automatic FAIL"), and
  the very failure mode §2.1 was written for (the ADR-0011 runtime rim shipping hard-edged). The loi
  du glow requires the armed (interactive) décor prop to glow; §2.1 requires that glow to fall off.
  It does not.
  - **Concrete fix (dev-r3f-render):** the décor armed-state affordance must be a neon rim/halo with
    an **alpha falloff that decreases from the prop edge outward and reaches 0 at the outer margin**
    (measurable: sample edge→margin, monotonically non-increasing, terminate at 0), NOT a flat
    constant-alpha fill. This applies to the procedural fallback AND to the eventual `lustre` sprite
    rim. If the intent is that the falloff-bearing rim only lands on the generated sprite, then the
    décor-glow composite is simply **not yet gateable** and must be re-captured once a falloff-
    bearing treatment is on screen — either way PASS is withheld until a dégradé is visible in a
    capture I can Read.
- **`25` — FINISHER sepia wash — FAIL (colour law; hue added to the B&W world).** Measured a uniform
  **R−B ≈ +14-15 warm cast across the whole game world** (concrete ground 300,430 → r−b +14; 1000,430
  → +15; lower 640,600 → +14), i.e. paper/neutral-value world pixels no longer sample neutral —
  corroborating game-designer's §13 "genuine warm sepia (R−B ≈ 13-18)" measurement. The single most
  load-bearing rule of the whole art direction is §1: **the only colour is acid neon, reserved for
  what matters.** A full-frame warm-amber wash puts a decorative, non-neon, saturated-leaning hue on
  the entire B&W world — the exact thing §8.4.4/P2 makes an automatic FAIL for world post-processing
  ("No hue added to the B&W layer. White pixels stay neutral"), and §8.1 lists OUT ("adding a second
  colour to a B&W world"). Sepia is also an off-identity MEDIUM metaphor — warm photographic aging,
  not cold xerox toner (§1 is photocopied-fanzine B&W). This composite arrives at my gate as the
  first colour-law verdict on it (game-designer/ux-designer observed it without owning the colour
  law); it does not survive that verdict.
  - **Concrete fix (dev-r3f-render):** keep a DISTINCT FINISHER visual beat (the ADR-0052 FINISHER
    state rightly needs to read differently from WON) but stay INSIDE the B&W + acid-neon identity —
    e.g. a **monochrome** punctuation (high-contrast value-crush / brief inverted flash / deep
    feathered vignette hold) and/or a **hue-preserving neon bloom pulse** on the already-neon
    elements (the crosshair / « LIVRE LE SON » prompt). **No warm second-colour wash on the
    decorative world**; sampled world/paper-value pixels must stay neutral (R−B ≈ 0). The «LIVRE LE
    SON» prompt copy and the finisher's mechanical distinctness are unaffected — only the colour
    grade changes.

### Bible gap noted (proposed rule — routed for a bible-gate amendment, not asserted unilaterally)

The bible is silent on a discrete **cinematic finisher/kill-beat treatment**. To close the gap that
let a sepia wash reach runtime, I propose adding to §2/§8 (through the bible gate): _a momentary
cinematic beat (finisher, transition) may shift TONE — value, contrast, vignette, hue-preserving
neon bloom — but may never introduce a saturated non-neon hue to the world; sampled world/paper-value
pixels stay neutral, same footing as the CRT §8.4.4/P2 test._ Logged here as a proposal; I will carry
it into `art-direction.md` via the bible gate if ratified.

### Overall

**COMPOSITE GATE: FAIL** — 5 of 7 composites PASS (22, 26, 27, 28, 29), **2 FAIL** (24 décor-glow
aplat §2.1; 25 finisher sepia colour-law). The pack cannot merge on the runtime-visual axis until
`24` and `25` are reworked and **re-captured** for a fresh composite verdict (an asset/design PASS
does not cover them). Both FAILs route to `dev-r3f-render` with the concrete fixes above. Bertrand is
the only one who may override a FAIL.

VERDICT: PASS — composite gate 22-smoke-veil (lead-art)
VERDICT: FAIL — composite gate 24-decor-armed-glow (lead-art)
VERDICT: FAIL — composite gate 25-finisher-sepia-wash (lead-art)
VERDICT: PASS — composite gate 26-hpbar-zero-settle (lead-art)
VERDICT: PASS — composite gate 27-reduced-motion-smoke (lead-art)
VERDICT: PASS — composite gate 28-parry-glyph-halo-desktop (lead-art)
VERDICT: PASS — composite gate 29-parry-glyph-halo-mobile (lead-art)
VERDICT: FAIL — composite gate differentiation-runtime-visuals (lead-art)

- **File List:** `docs/handoffs/story-boss-qte-differentiation.md` (this composite-gate entry appended).

## 18. PERF RE-VERDICT (particle smoke) — gpu-specialist (Ben) — 2026-07-20 — bounds for Bertrand's particle override (§17)

- claim: re-verdict the BOUNDS after Bertrand's §17 override of the smoke LOOK (4-quad veil → real
  particle system + CC0 texture). The look is his call and out of my lane — I do not re-litigate it;
  I price the technique so the particle implementation `dev-r3f-render` is building RIGHT NOW stays
  inside the mobile fill-bound frame the §8 verdict defended (33.3 ms mobile / 16.6 ms desktop working
  budget; CRT `lite` already eats most of the mobile frame; smoke rides pass 1, adds NO pass/NO RT).
- **Honest delta vs. §8:** a particle system is the exact "unbounded transparent overdraw stacked under
  the full-res composite" I named as the fill-rate cliff (§8, line "A particle cloud = …"). It is NOT
  disqualified — it is BOUNDABLE — but the marginal budget is now the BINDING gate with little slack,
  and the DEFERRED-ON-TARGET silicon measurement is now genuinely load-bearing, not a formality. A
  4-quad veil I could near-certify by reasoning; a particle cloud MUST be measured on device.

### (1) Binding caps — the RIGHT budget for the fill-bound mobile frame

`dev-r3f-render`'s interim self-bounds are in the right ballpark; I RATIFY the counts and blend, and
add the two caps that actually govern fill (raw count alone has a loophole: N huge quads = fullscreen
wash). **The binding constraint is cumulative screen coverage (overdraw), not particle count** — count
and size are the levers to stay under it.

- **CAP-A — Max particle count per tier: desktop ≤ 64, mobile ≤ 32.** RATIFIED as the count ceiling
  (target ~24 on mobile to keep headroom). Subordinate to CAP-C — whichever is hit first binds.
- **CAP-B — Max per-particle size ≤ 1/3 of min(viewport W, H).** Closes the "few huge billboards"
  loophole; no single particle may be a stealth fullscreen wash. Small-to-mid is correct; this is the
  hard ceiling on "mid."
- **CAP-C — Cumulative coverage / overdraw heuristic (THE binding cap): Σ(live particle screen
  areas, counting overlap) ≤ 3× viewport area on mobile, ≤ 6× on desktop.** Device- and dpr-
  independent (a fraction of the frame), maps directly to fill cost. This is the number to instrument
  and defend; CAP-A/CAP-B exist to keep it satisfied. (Sanity: 32 mobile particles at ~0.3×0.3 viewport
  = ~2.9× — under 3×. Consistent with the self-imposed bounds; the cloud must not drift past it as
  particles cluster.)
- **CAP-D — Texture: single texture, ONE fetch, ≤ 256² (CC0 smoke).** A soft puff needs no more; 256²
  is sampler-cache-friendly on mobile. 512² is the absolute ceiling only if art insists; 256² is the
  binding recommendation. No second texture, no lookup/noise map.
- **CAP-E — ADDITIVE BLEND PROHIBITED (retained hard).** Normal desaturated alpha only. Additive over
  many overlapping particles both trips the composite bloom gate (`bloomThreshold 0.25 /
bloomBrightness 0.55` → neon haze) AND is the worst-case fill blend. Desaturated keeps the puffs out
  of the bloom saturation gate.
- **RETAINED from §8:** ZERO new render targets, ZERO new fullscreen passes, `CrtPass.tsx` untouched
  (particles are layer-0 scene geometry riding pass 1); renderOrder UNDER the parry glyph + telegraph
  (the ring/pose stays on top = degraded-not-removed, UX D1.1/D1.2); reduced-motion = frozen
  positions + opacity, no strobe (CAP-C still applies to the frozen frame).
- **Portability note (perf, not aesthetic):** prefer instanced/merged textured billboards over raw
  `gl.POINTS` if point-sprite size clamping bites — many mobile GL drivers cap `gl_PointSize`
  (~64–256 px) inconsistently, which would silently break CAP-B/CAP-C control. Either is fine if the
  coverage cap holds; billboards give predictable size control. No determinism constraint (smoke is a
  render visual, not game state — like the CRT grain; the game owns only the `smokeActive` boolean).

### (2) DEFERRED-ON-TARGET protocol — updated thresholds for the particle version

Build / devices / CRT-lite-ON / `?preview=boss` / phase-3 scenario / smoke-on-minus-smoke-off marginal
isolation — all UNCHANGED from §8. Particle-specific updates:

- **Capture at PEAK coverage, not average** — the frame where the cloud fills the most screen (mobile
  `MOBILE_ZOOM 1.7` pulls the puffs closer = more coverage). Particle fill is coverage-driven, so the
  worst frame is the gate, not the mean.
- **Metrics add instrumented coverage:** alongside frame time, dump `renderer.info.render.calls` and —
  if the probe can — an overdraw proxy (Σ particle area / viewport area) to check CAP-C empirically on
  device, not just by eye.
- **Thresholds (vs. working budget, pending ratification):**
  - **Mobile smoke marginal ≤ ~1.5 ms — HELD** (the §8 number; it is the defensible headroom under the
    33.3 ms mobile frame the CRT already fills). This is now the BINDING gate — particles will run
    closer to it than the veil did.
  - **Mobile phase-3 median (smoke active) ≤ 33.3 ms (30 fps).** HELD.
  - **NEW mobile p95 ≤ ~40 ms** (no single-frame stall worse than ~25 fps) — particle overdraw spikes
    as puffs cluster/overlap; a passing median with a hitching p95 still fails the feel.
  - **Desktop smoke marginal ≤ ~1.5 ms; desktop phase-3 median ≤ 16.6 ms (60 fps).**
  - **FAIL on any** → descend the cheap-out ladder (3), re-measure.

### (3) Cheap-out ladder for the particle version (ordered, least-visible change first)

1. **Count tier down** — mobile 32 → 24 → 16 (desktop 64 → 48). Pure knob, linear fill reduction; the
   "smoke cloud" read survives a lower count. Owner: `dev-r3f-render`.
2. **Size / coverage down** — tighten CAP-C (mobile 3× → 2×) and/or per-particle size. Fill scales with
   area, so this is the strongest single lever. Owner: `dev-r3f-render`.
3. **Texture down** — 256² → 128² if the on-device profile shows sampler/bandwidth bound rather than
   overdraw bound (usually secondary to 1–2). Owner: `dev-r3f-render`.
4. **Static-veil fallback on MOBILE ONLY (LAST RESORT)** — if even a minimal particle count blows the
   weak-mobile budget, mobile falls back to the §8 ≤6-quad static veil while desktop keeps the particle
   cloud (a quality tier-split, the same philosophy as CRT `full`/`lite`). NOTE: this reverts the LOOK
   on mobile, which is Bertrand's §17 call — so reaching lever 4 routes BACK to Bertrand / `lead-art`
   via `senior-architect`, never decided unilaterally in the render or a fix lane. I price it; the
   mobile-look trade is theirs.

VERDICT: PERF PASS (particle smoke, pre-close) — CC0 particle system OK within: ≤64 desktop/≤32 mobile particles (CAP-A), per-particle ≤1/3 min-viewport (CAP-B), cumulative coverage ≤3× mobile/≤6× desktop = the BINDING cap (CAP-C), single ≤256² texture 1 fetch (CAP-D), additive PROHIBITED normal-desaturated-alpha (CAP-E), zero new RT/pass, CrtPass untouched, renderOrder under glyph, reduced-motion frozen; look override is Bertrand's, bounds are mine (gpu-specialist)
VERDICT: DEFERRED-ON-TARGET (particle smoke) — marginal ≤~1.5 ms mobile HELD (now binding), phase-3 median ≤33.3 ms mobile / ≤16.6 ms desktop, NEW p95 ≤~40 ms mobile; capture at PEAK coverage; particle overdraw genuinely needs silicon — producer chases, Bertrand runs; cheap-out = count↓ → size/coverage↓ → texture↓ → mobile-only static-veil (routes back to Bertrand) (gpu-specialist)

- handoff → `dev-r3f-render` (Amelia): build to CAP-A..E above; your interim bounds are ratified with
  CAP-B (size) + CAP-C (coverage) added as the real governors and CAP-E (additive prohibited) retained.
  I re-verdict at stage-5 (in-sandbox `renderer.info`: draw calls + RT count unchanged + coverage proxy)
  and the DEFERRED on-target run confirms the ms.
- handoff → `producer` (Marion): the DEFERRED-ON-TARGET item is now MORE load-bearing (particle overdraw
  unmeasurable in SwiftShader) — keep it on the chase list ahead of / at stage-6 as §16 already flagged;
  fresh Gate-4 captures for evidence 22/27/28/29 are superseded per §17.
- handoff → `senior-architect` (Winston): bounds are additive to the boss render, no boundary/ADR change;
  the only decision that could escalate to you is cheap-out lever 4 (mobile-only look revert), which is
  Bertrand's call, not a fix-lane one.
- File List:
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 15. VERIFY (stage 5, leg 2 — A1 re-verify) — game-designer (Sacha) — 2026-07-20 — statistical winnability re-pin on the landed BOSS_VITAL_CATCH_RADIUS 0.18

- claim: my owed A1 §5 re-verify — re-ran the scratchpad simulation harness (N=500/style, seed 20260719) against the CURRENT code (rebundled `bossQteSystem.ts`: `BOSS_VITAL_CATCH_RADIUS 0.18`,
  per-zone `withinCatch`, sub-band assert confirmed present) and checked the gated acceptance
  (`greedyVital`/`campVital` loss > 0 while `greedyLimb`/optimal stay 100%). Also closed my §12
  parry-read soft flag against evidence `28`/`29`.

### VERDICT: FAIL — A1 winnability re-pin (game-designer)

The gated acceptance is NOT met and — more importantly — the correction's PURPOSE (break the
camp-vital dominance my §12 finding named) is NOT achieved at 0.18. The mechanism (per-ring catch
radius) is the right lever, but **the value 0.18 is too loose** (it excludes only the ~8 % corner
sliver of the vital box) AND **the acceptance metric "loss > 0" is structurally unreachable by
catch-radius tuning** (evidence below). This is round 1 of the 2-round cap failing its re-verify →
round 2: concrete re-tune + a corrected acceptance metric, for Karim to re-gate.

### Re-run at the landed value (BOSS_VITAL_CATCH_RADIUS 0.18, current code, seed 20260719, N=500)

| Style         | Win   | Loss   | avg blown | avg ΔE    | avg time | note                                                                                    |
| ------------- | ----- | ------ | --------- | --------- | -------- | --------------------------------------------------------------------------------------- |
| optimal       | 100%  | 0%     | 0.00      | +13.1     | 41.7s    | must stay 100 ✓                                                                         |
| greedyLimb    | 100%  | 0%     | 0.00      | +3.6      | 49.3s    | must stay 100 ✓ — safe bank                                                             |
| greedyVital   | 100%  | **0%** | 0.43 (≤3) | −8.3      | 44.9s    | **loss 0% — FAILS "loss > 0"** (punished, not lost)                                     |
| parryWhiff    | 99.8% | 0.2%   | 7.45 (≤9) | −91.1     | 76.0s    | whiff cost bites (unchanged axis)                                                       |
| decorIgnore   | 100%  | 0%     | 0.00      | +3.6      | 49.3s    | décor pure-upside                                                                       |
| **campVital** | 100%  | **0%** | **0.00**  | **+45.0** | 41.6s    | **FAILS — still the SINGLE BEST line (+45 E, fastest, 0 blown); camp dominance intact** |
| campLimb      | 100%  | 0%     | 0.00      | +45.0     | 52.9s    | reference                                                                               |
| sloppy        | 46.4% | 53.6%  | 9.06      | −177      | 81.1s    | losable by execution                                                                    |
| sloppyNoParry | 23.4% | 76.6%  | 9.44      | −190      | 74.1s    | losable                                                                                 |

- **greedyVital loss = 0.0 % and campVital loss = 0.0 %** — both required > 0. FAIL on the letter.
- **campVital net +45 E is the MAX of any style** (barely down from +50 pre-A1) and clears fastest
  (41.6 s) with 0 blown → head-camping is STILL strictly dominant. The §12 exploit is essentially
  untouched: at 0.18 a fixed-centre spammer hits **94 %/shot and blows 0/18 vital windows** (kinematic
  reconstruction off the real `bossWanderBox`, seed 20260719). 0.18 only excludes the box corners
  (reach 0.226), ~8 % of positions — too little to matter.

### Why "loss > 0" is structurally unreachable by catch-radius tuning (root-cause evidence)

Full-sim sweep (rebundled scratchpad copy at each radius — NO repo edit; real tick logic):

| Vital catch r | campVital ΔE | campVital blown | greedyVital ΔE | greedyVital blown | greedyVital loss | greedyLimb/optimal |
| ------------- | ------------ | --------------- | -------------- | ----------------- | ---------------- | ------------------ |
| 0.18 (landed) | **+45.0**    | 0.00            | −8.3           | 0.43              | 0%               | 100% / 100%        |
| 0.13          | +20.0        | 0.00            | −32.4          | 1.41 (≤6)         | 0%               | 100% / 100%        |
| 0.12          | +5.0         | 0.00            | −37.9          | 1.63 (≤6)         | 0%               | 100% / 100%        |
| **0.11**      | **−5.0**     | 0.00            | −44.7          | 1.92 (≤7)         | 0%               | 100% / 100%        |
| 0.10          | −10.0        | 0.00            | −53.7          | 2.33 (≤8)         | 0%               | 100% / 100%        |

Even at 0.10 both greedyVital and campVital stay **0 % loss** — the loss clock needs 10 FULLY-blown
windows, but (i) multi-shot spam answers a window with a single hit, (ii) the ring decelerates to
zero velocity at each waypoint (built-in stillness → a tracker/spammer lands ≥1/window), and (iii)
energy-bleed is NOT a death in the boss tableau (clamp-only, carried out — by design, ADR-0051). So
the catch radius controls per-shot hit rate → ENERGY BLEED and clear-time, NOT the loss clock. "Loss

> 0" cannot be produced by this lever for realistic (spamming) play. The metric is ill-posed.

### ROUND-2 RE-TUNE PROPOSAL (concrete — for Karim to re-gate)

1. **Value: `BOSS_VITAL_CATCH_RADIUS 0.18 → 0.11`** (`src/game/systems/bossQteSystem.ts`). 0.11 is the
   threshold where **campVital net energy first goes NEGATIVE (−5)** — below `greedyLimb` (+1.7) and
   optimal (+12.8) — so head-camping is no longer the dominant line: you may still camp for speed
   (42.9 s) but you PAY for it in energy, vs. camp-limb +45 / bank-limb +1.7 / track-vital +12.8. The
   dilemma is restored. A decelerating-waypoint tracker keeps ≥1 hit/window (vital stays viable &
   winnable); `greedyLimb`/optimal stay 100 % (limb/parry/décor/phase-1 untouched at 0.30).
   (0.10 is a more decisive alternative — campVital −10 — if a bigger margin is wanted.)
2. **Reframed acceptance metric (replace "loss > 0", which is structurally unreachable — evidence
   above):** camp-vital is no longer dominant — **campVital net energy < optimal AND < greedyLimb**
   (at 0.11: −5 < +12.8 and < +1.7 ✓), AND greedyVital carries material cost (**energy clearly
   negative, blown-windows ≫ greedyLimb's 0** — at 0.11: −44.7 E, 1.92 blown ✓), while
   greedyLimb/optimal stay 100 % win and the seed stays winnable (re-pin if not). This measures the
   real design goal (earned 2 HP / camp-no-longer-dominant) instead of an unachievable loss rate.
   (If literal loss > 0 is required, it needs a DIFFERENT mechanism — a per-window vital shot budget,
   or vital-off-ring-miss counting toward the blown clock — a larger change than a value tweak; I
   recommend the reframed metric over that.)
3. **Paired render + K-5 re-pin gate carry over unchanged:** vital ring A DRAWN at the new catch
   radius (drawn = catch, §5.6) — flag to `ux-designer`/`lead-art`: a 0.11-world-unit ring is small,
   so it must stay legible (bright/high-contrast) especially on mobile; the drawn=catch invariant
   forbids drawing it bigger than 0.11. Re-pin seed 20260719 if a landable trackable vital waypoint
   or competent limb-banking clears is not present at 0.11.

### §12 parry-read soft flag — CLOSED

Evidence `28-parry-telegraph-under-smoke.png` (desktop) + `29-mobile-parry-under-smoke.png` (mobile):
the parry telegraph now carries a FORM-distinct pale rotated-diamond "guard" glyph at the raised
sidearm (up-left of the round shoot reticle), reading ABOVE the smoke veil on both device classes —
parry-vs-shoot now reads by FORM, not colour/position alone. My §12 soft flag is addressed; final
A-item legibility sign-off remains `ux-designer` (Tony)'s leg-2 lane (spec 3-C).

- handoff → `lead-game-designer` (Karim): A1 re-verify = FAIL (round 1's re-verify). The mechanism is
  right; the VALUE (0.18) is too loose and the METRIC (loss > 0) is ill-posed. Round-2 proposal above:
  re-tune to 0.11 + reframe acceptance to "camp non-dominant / greed energy-negative." Please re-gate
  (a value change + the reframed metric); a further re-verify failure would hit the 2-round cap →
  Bertrand. I stand ready to re-run the sim the moment `dev-gameplay` lands the new value.
- handoff → `dev-gameplay` (Amelia): pending Karim's re-gate — `BOSS_VITAL_CATCH_RADIUS 0.18 → 0.11`
  (sub-band assert still holds: 0.11 < vital reach 0.226); update the winnability unit re-check.
- handoff → `dev-r3f-render` (Amelia) + `ux-designer`/`lead-art`: pending re-gate — vital ring A DRAWN
  at 0.11 (drawn = catch), with a legibility treatment for the smaller ring (mobile especially).
- NOTE (process): §15 appended via `cat >>` heredoc (additive, end-of-file). Simulation + radius sweep
  ran on throwaway scratchpad bundles/copies (esbuild + sed of the bundle only) — NO `src/**`, test,
  or repo edit; no commit/push.
- File List:
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

VERDICT: FAIL — A1 winnability re-pin (game-designer) — on the landed BOSS_VITAL_CATCH_RADIUS 0.18 the gated acceptance is unmet: greedyVital loss 0.0% and campVital loss 0.0% (both required > 0), and campVital remains the single BEST line (+45 E, fastest 41.6s, 0 blown — a fixed head-camp still hits 94%/shot, blows 0/18 vital windows), so the §12 camp-dominance is essentially intact. Root cause (full-sim radius sweep 0.18→0.10): "loss > 0" is structurally unreachable by catch-radius tuning (multi-shot spam answers a window with one hit + waypoint stillness + energy-is-not-death), so the radius controls energy-bleed, not the loss clock. Round-2 re-tune: BOSS_VITAL_CATCH_RADIUS → 0.11 (campVital net energy goes NEGATIVE −5 < greedyLimb +1.7 < optimal +12.8 → camp no longer dominant; greedyVital −44.7 E / 1.92 blown; greedyLimb & optimal stay 100%), PLUS reframe the acceptance to "camp-vital non-dominant + greedyVital energy-negative" (loss>0 is ill-posed). §12 parry-read soft flag CLOSED by evidence 28/29 (form-distinct diamond guard glyph above the smoke, desktop + mobile). Round-1 re-verify failed → round 2, Karim to re-gate.

## 17. DESIGN GATE (stage-5 correction ROUND 2) — lead-game-designer (Karim) — 2026-07-20 — re-gate on Sacha's A1-R2 re-tune (0.11 + reframed acceptance)

- claim: re-gate the round-2 proposal after A1's re-verify FAILED (§15): the per-ring catch mechanism
  is right, but the landed VALUE 0.18 is too loose (campVital still +45 E / dominant) AND my round-1
  ACCEPTANCE metric ("greedyVital loss > 0") is structurally unreachable by radius tuning. This is
  round 2 of the 2-round cap; a further re-verify failure escalates to Bertrand.

VERDICT: PASS — design gate lever-1 catch-radius correction ROUND 2 / A1-R2 (lead-game-designer)

### Gate-owner accountability (stated plainly)

My round-1 acceptance criterion was **ill-posed, and that is my miss, not Sacha's.** His root-cause
evidence is sound and I verify the mechanism against the shipped design: the loss clock needs 10
FULLY-blown windows, but (i) multi-shot spam answers a window with a single hit, (ii) the ring
decelerates to zero velocity at each waypoint (built-in stillness → a tracker/spammer lands ≥1/window),
and (iii) energy is **clamp-only, not death** in the boss tableau (ADR-0051, by design — energy-bleed
is carried out of the fight, `maxBlownWindows` is the sole death surface). So the catch radius moves
ENERGY economics, never the loss rate. "loss > 0" cannot be produced by this lever. The reframed metric
below measures the ACTUAL design goal (§0's "which target?" dilemma: the 2 HP vital chip must be EARNED
by tracking; camping it must stop being free) — which is what the correction was always for.

### Why PASS (round 2)

- **0.11 is the measured minimal-sufficient value, and minimal-sufficient is the fairness-optimal
  choice.** The full-sim sweep (§15) shows camp-vital net energy: 0.18 → +45, 0.13 → +20, 0.12 → +5,
  **0.11 → −5**, 0.10 → −10. 0.11 is the threshold where camping first goes NEGATIVE (below greedyLimb
  +1.7 and optimal +12.8) → the dilemma is restored. Because a smaller catch = a smaller drawn ring =
  harder to aim on mobile, **the LARGEST catch that breaks camp dominance is the right pick** — 0.11,
  not a gratuitously tighter value. This is the §5.6-FEEL-conscious choice.
- **§5.6 both ways, checked.** Too big (0.18/0.13/0.12) = the dilemma collapses (proven, camp still
  dominant/positive) — rejected. Too small = a frustration-miss risk on mobile: attributability is
  intact (drawn = catch, every miss is "I clicked outside the visible ring", no bullshit death), but
  FEEL/fairness (§5.4/§5.5, the 44-px-world mobile aim-ability) still matters — hence the binding
  legibility condition below. 0.11 balances both.
- **Honest play clears, the dilemma is genuine.** At 0.11: optimal 100 % / +12.8 E (the best line — a
  vital tracker is REWARDED), greedyLimb 100 % / +1.7 (the safe bank holds), campVital −5 (camping now
  PAYS), greedyVital −44.7 / 1.92 blown (greed is materially punished in energy). Exactly the
  high-risk/high-reward vital vs. safe-bank limb read spec §1-A declares.
- **Reframed metric is well-posed and coherent with the whole boss economy.** It scores energy
  dominance (the axis the lever actually controls) and keeps `maxBlownWindows` as the untouched sole
  death surface (ADR-0051). No §5.6 regression.
- **Cap discipline:** this is round 2. To avoid a spurious escalation on a thin-margin near-miss, I
  pre-clear a narrow same-lever contingency (0.11 → 0.10) WITHIN this gate — see A1-R2 §1. A genuinely
  DIFFERENT failure mode (0.11 not legibly aim-able on mobile) is routed as a render-scale/boss-zoom
  question to `lead-art` + `senior-architect`, explicitly NOT counted as a third radius round.

### GATED AMENDMENT — A1-R2 (`game-designer` writes verbatim into `spec-boss-qte-differentiation.md`, LEVER 1; supersedes A1's value + acceptance metric — the per-ring-catch MECHANISM and the paired-render pairing carry over from A1)

> **AMENDMENT A1-R2 (gated 2026-07-20, stage-5 correction ROUND 2).**
>
> 1. **Value: `BOSS_VITAL_CATCH_RADIUS = 0.11`** (was 0.18). `RING_HIT_RADIUS = 0.30` unchanged for
>    LIMB / parry-point / décor / phase-1 single ring. 0.11 is the measured threshold at which
>    head-camping the vital ring stops being dominant (campVital net energy −5, below greedyLimb +1.7
>    and optimal +12.8; §15 sweep). The sub-band assert (`BOSS_VITAL_CATCH_RADIUS < vital wander-box
reach 0.226`) still holds. **Pre-cleared contingency, SAME lever, NOT a new round:** if the
>    re-verify shows campVital net energy is not cleanly below BOTH greedyLimb and optimal with
>    separation beyond sim-noise, `dev-gameplay` may drop to **0.10** (campVital −10, wider margin)
>    under this same gate.
> 2. **REFRAMED ACCEPTANCE — replaces A1 §5's "greedyVital loss > 0"** (structurally unreachable by
>    catch-radius tuning: multi-shot spam answers a window with one hit; the ring decelerates to
>    stillness at each waypoint; energy is clamp-only not death in the tableau, ADR-0051 — so the
>    radius governs ENERGY, not the loss clock). **The A1 correction is ACCEPTED at re-verify iff, on
>    `targetSeed 20260719`, N ≥ 500/style:**
>    - **(a) camp non-dominant:** campVital net energy **< optimal AND < greedyLimb**;
>    - **(b) greed materially punished:** greedyVital net energy **clearly negative** and avg
>      blown-windows **≫ greedyLimb's** (~0);
>    - **(c) honest play clears:** greedyLimb AND optimal stay **100 % win** with margin;
>    - **(d) seed holds:** the pinned seed presents ≥1 landable, trackable vital waypoint AND competent
>      limb-banking clears — else re-pin.
> 3. **PAIRED RENDER (carries from A1 §4, value updated — binding on `dev-r3f-render`):** the VITAL
>    ring A is DRAWN at a radius equal to `BOSS_VITAL_CATCH_RADIUS` (0.11); drawn = catch, the
>    aim-honesty invariant (`BossQteSprite.tsx` lines 47-48). It may NOT be drawn larger than the catch.
> 4. **NEW BINDING CONDITION — small-ring legibility (§5.6 FEEL axis; `ux-designer` + `lead-art`, the
>    same weight as the render pairing):** a 0.11-world-unit vital ring is small and drawn=catch forbids
>    enlarging it. `ux-designer` + `lead-art` owe a legibility treatment (bright / high-contrast /
>    thick-stroke, distinct from the smoke veil), and `ux-designer`'s leg-2 sign-off MUST confirm the
>    0.11 vital ring is clearly perceivable AND honestly aim-able on BOTH device classes at the boss
>    zoom — mobile-landscape especially. Too-small-to-aim = a frustration-miss (attributable, so not a
>    §5.6 bullshit death, but a §5.4/§5.5 feel/fairness FAIL). **If leg-2 finds 0.11 not legibly
>    aim-able on mobile at the boss zoom, that is a render-scale / boss-zoom question for `lead-art` +
>    `senior-architect` — NOT a re-tune of the radius (which is mechanically pinned by the dominance
>    threshold) and NOT a third round of this cap.**

### Handoffs

- handoff → `game-designer` (Sacha): PASS — transcribe A1-R2 verbatim into
  `spec-boss-qte-differentiation.md` (LEVER 1: value, reuse map, tuning table, and REPLACE the A1 §5
  acceptance with the reframed metric). Then re-run the design-acceptance re-verify against the reframed
  (a)-(d) once `dev-gameplay` lands 0.11. A re-verify failure on the REFRAMED metric is the 2-round-cap
  breach → Bertrand; a 0.11-legibility failure on mobile is NOT (it routes to lead-art/architect, above).
- handoff → `dev-gameplay` (Amelia): `BOSS_VITAL_CATCH_RADIUS 0.18 → 0.11` (sub-band assert holds:
  0.11 < 0.226); pre-cleared 0.10 contingency per §1; update the winnability unit re-check.
- handoff → `dev-r3f-render` (Amelia): draw vital ring A at 0.11 (drawn = catch); limb ring B stays 0.30.
- handoff → `ux-designer` (Tony) + `lead-art` (Nico): BINDING — the small-ring legibility treatment +
  leg-2 aim-ability sign-off on both device classes (A1-R2 §4). This is a gate condition, not advisory.
- handoff → `producer` (Marion): cap status — this is round 2 of 2 on the Lever-1 correction. Next
  radius/acceptance failure escalates to Bertrand; the legibility branch is tracked separately.
- NOTE (process): appended via Edit, not `cat >>` heredoc — no Bash tool in this subagent context
  (same limitation logged in §3/§5/§13). Strictly additive at end-of-file.
- File List:
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 19. VERIFY (stage 5, leg 2 — A1-R2 final re-verify) — game-designer (Sacha) — 2026-07-20 — reframed-metric re-verify on the landed BOSS_VITAL_CATCH_RADIUS 0.11

- claim: two tasks off Karim's §17 re-gate. (1) Transcribed AMENDMENT A1-R2 VERBATIM into
  `spec-boss-qte-differentiation.md` (new "AMENDMENT A1-R2" section under A1: value 0.11 + pre-cleared
  0.10 contingency, the reframed (a)-(d) energy acceptance REPLACING A1 §5's "loss > 0", paired render
  at 0.11, the new small-ring legibility condition; AC-D2 re-amended tail). (2) Final design-acceptance
  re-verify of the LANDED 0.11 code against the reframed metric.
- landed-state check before running (the §17 "wait for the dev release" guard): `bossQteSystem.ts`
  `BOSS_VITAL_CATCH_RADIUS = 0.11`; `yarn vitest run bossQteSystem.test.ts` = **66/66 PASS** (incl.
  `toBe(0.11)`, the sub-band assert `0.11 < 0.226`, and the seed-20260719 winnability re-check) — the
  implementation is complete + green. NOTE for `producer`/Karim: `dev-gameplay`'s formal A1-R2 release
  shard entry was not yet posted at my run time; I measured against the committed 0.11 source with the
  green boss suite as the landed-state proof, so the result stands. (Ordering nit, not a correctness
  issue — reconcile the entry order.)

### VERDICT: PASS — A1-R2 winnability re-verify (game-designer)

The reframed (a)-(d) acceptance is fully met at 0.11. Camp-vital dominance is broken, the vital-vs-limb
dilemma (spec §1-A high-risk/high-reward vs. safe bank) is genuine, honest play clears, the seed holds.
0.11 stands — the pre-cleared 0.10 contingency is NOT needed (campVital cleanly negative, deterministic
separation beyond sim-noise). No cap breach, no escalation.

### Re-verify table (landed 0.11 code, seed 20260719, N=500/style)

| Style         | Win   | Loss  | avg blown | avg ΔE    | avg time | reframed-metric read                                                    |
| ------------- | ----- | ----- | --------- | --------- | -------- | ----------------------------------------------------------------------- |
| optimal       | 100%  | 0%    | 0.00      | +12.8     | 41.8s    | (c) best line — skilled tracker REWARDED                                |
| greedyLimb    | 100%  | 0%    | 0.00      | +1.7      | 50.6s    | (c) safe bank holds, 100 %                                              |
| **campVital** | 100%  | 0%    | 0.00      | **−5.0**  | 42.9s    | **(a) NEGATIVE, < greedyLimb +1.7 & optimal +12.8 → camp NON-dominant** |
| greedyVital   | 100%  | 0%    | 1.92 (≤7) | **−44.7** | 49.1s    | **(b) clearly negative, blown 1.92 ≫ greedyLimb 0 → greed punished**    |
| decorIgnore   | 100%  | 0%    | 0.00      | +1.7      | 50.6s    | décor still pure-upside                                                 |
| campLimb      | 100%  | 0%    | 0.00      | +45.0     | 52.9s    | limb bank campable (1 HP → slow) — fine, by design                      |
| parryWhiff    | 100%  | 0%    | 7.84 (≤9) | −101.5    | 79.0s    | parry axis unchanged                                                    |
| sloppy        | 28.8% | 71.2% | 9.52      | −200.9    | 83.6s    | losable by execution                                                    |
| sloppyNoParry | 1.4%  | 98.6% | 9.97      | −222.3    | 74.2s    | losable                                                                 |

### Reframed acceptance (A1-R2 §2 (a)-(d)) — line by line

- **(a) camp non-dominant — PASS.** campVital net **−5.0 E** < optimal **+12.8** AND < greedyLimb
  **+1.7**. A sign flip (camping now COSTS energy) + a 6.7-unit gap below greedyLimb. campVital aims
  deterministically (sigma-0) → −5.0 is flat across all 500 trials (zero variance), so the separation
  is clean, well beyond sim-noise. Camping the head is no longer the best line (it was +45 at 0.18).
- **(b) greed materially punished — PASS.** greedyVital net **−44.7 E** (clearly negative) with avg
  **1.92** blown windows (max 7) vs. greedyLimb's **0** — greed is heavily taxed in energy and blows
  windows, though it still wins (loss clock untouched by design).
- **(c) honest play clears with margin — PASS.** greedyLimb AND optimal both **100 % / 0 blown** —
  full margin against the 10-window loss budget. A skilled vital-tracker (optimal) is the single best
  line (+12.8) — vital is REWARDED, not dead.
- **(d) seed holds — PASS, no re-pin.** Landable windows present (P1 6, P2 2 + charged, P3 3 + charged);
  optimal single-walk clears (bossHp 0, 0 blown); greedyVital (a tracking vital-chaser) still wins
  100 % → ≥1 landable, TRACKABLE vital waypoint per window exists; competent limb-banking (greedyLimb)
  clears 100 %. Corroborated by the green unit winnability re-check on `targetSeed 20260719`.

### The dilemma now reads right (qualitative)

- **track vital (optimal):** +12.8 E, the best line — skill rewarded (2 HP EARNED by tracking the tight ring).
- **bank limb (greedyLimb):** +1.7 E, slower (50.6 s) — the safe, modest line, viable.
- **camp head (campVital):** −5 E, fast (42.9 s) but now PAYS energy — camping trades energy for speed, no longer free/dominant.
- **reckless vital-chase (greedyVital):** −44.7 E / 1.92 blown — materially punished, still clears (vital viable for the skilled).

Exactly the spec §1-A "VITAL = high-risk/high-reward, tracked" vs. "LIMB = safe bank" read. §0's
"which target?" decision is restored.

### Outstanding (NOT part of this re-verify)

- **A1-R2 §4 small-ring legibility** (0.11 vital ring drawn=catch, perceivable + aim-able on both
  device classes) is `ux-designer` (Tony) + `lead-art` (Nico)'s BINDING leg-2 condition — not my lane;
  per §17 a legibility failure routes to lead-art/`senior-architect` as a render-scale/boss-zoom
  question, explicitly NOT a third radius round.

- handoff → `lead-game-designer` (Karim): A1-R2 re-verify = PASS on the reframed (a)-(d) metric at the
  landed 0.11; the Lever-1 correction is design-accepted. 0.11 stands (0.10 contingency not needed).
  No cap breach. The camp-dominance defect from §12/§15 is resolved; the vital-vs-limb dilemma is real.
- handoff → `ux-designer` (Tony) + `lead-art` (Nico): the small-ring legibility sign-off (A1-R2 §4)
  remains yours — the mechanic is settled at 0.11; confirm the drawn=catch 0.11 vital ring is aim-able
  on mobile-landscape at the boss zoom.
- handoff → `producer` (Marion): Lever-1 correction closed at round 2 (PASS) — no escalation. Reconcile
  the shard entry order (my re-verify ran against the green landed 0.11 source ahead of dev-gameplay's
  formal A1-R2 release entry).
- NOTE (process): §19 appended via `cat >>` heredoc (additive, end-of-file). Re-verify ran on a
  throwaway scratchpad bundle of the LANDED source (esbuild, value 0.11 confirmed) — NO `src/**`, test,
  or repo edit by me; the 0.10 contingency (unused) would be `dev-gameplay`'s to apply. No commit/push.
- File List:
  - `docs/game-design/spec-boss-qte-differentiation.md` (AMENDMENT A1-R2 section + AC-D2 re-amended tail)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

VERDICT: PASS — A1-R2 winnability re-verify (game-designer) — on the landed BOSS_VITAL_CATCH_RADIUS 0.11 (boss suite 66/66 green) the reframed (a)-(d) acceptance is fully met: (a) campVital net −5.0 E < greedyLimb +1.7 AND < optimal +12.8 (sign-flip, deterministic, clean beyond noise → camp NON-dominant, was +45 at 0.18); (b) greedyVital −44.7 E / 1.92 blown ≫ greedyLimb 0 (greed punished); (c) greedyLimb + optimal 100 % / 0 blown (honest play clears with full margin); (d) seed 20260719 holds (landable trackable vital waypoints, limb-banking + vital-tracking both clear — no re-pin). 0.11 stands, pre-cleared 0.10 contingency NOT needed; the vital-vs-limb dilemma (spec §1-A) is restored, §12/§15 camp-dominance resolved. No cap breach. Outstanding: the A1-R2 §4 small-ring legibility sign-off is ux/lead-art's leg-2 lane (a legibility failure routes to lead-art/architect, not a radius round).

## 10. BUILD (gameplay lane) — dev-gameplay (Amelia) — 2026-07-20 — AMENDMENT A1-R2 (vital catch 0.18 → 0.11)

- claim: apply Karim's A1 round-2 gate (shard §17, PASS): tighten `BOSS_VITAL_CATCH_RADIUS`
  from 0.18 to **0.11** in `bossQteSystem.ts`, updating the unit tests that encode the old value.
  Everything else untouched. `dev-r3f-render` re-draws the vital ring at 0.11 (§4) in parallel.
- release (diff summary):
  - `bossQteSystem.ts`: `BOSS_VITAL_CATCH_RADIUS = 0.18` → `0.11` (one-line value change + doc). The
    ⊂-band-aware A1 assert (`BOSS_VITAL_CATCH_RADIUS < hypot(0.16,0.16) ≈ 0.226`) still holds and
    still fires correctly — `0.11 < 0.226`, so `createBossQte` does not spuriously throw (unit-tested).
    No other logic changed; the hit-test shape (per-zone `withinCatch`/`ringHitZone`) is unchanged.
  - `bossQteSystem.test.ts`: updated the two tests encoding the old value/annulus —
    - corner-whiffable: `expect(BOSS_VITAL_CATCH_RADIUS).toBe(0.11)`; the probe tightened to **0.15
      from the vital centre** (was a vital chip under the round-1 0.18 catch, now a whiff), so the
      annulus test genuinely binds to 0.11 (0.11–0.30); the also-limb probe moved to 0.15-from-vital /
      0.03-from-limb → still a LIMB chip, never vital.
    - camp-punished: added the R2 stronger property — a fixed camp aim at the box centre catches the
      vital ring for a **minority** of the window (`inCatch / samples < 0.5` over 12 phase-3 windows on
      `targetSeed 20260719`), cheaply assertable at the unit level. `maxDev > catch` retained.
- **SEED STATUS: still HELD — `targetSeed 20260719` not re-pinned.** greedyLimb still clears with
  margin and the perfect tracker still lands the vital ring at 0.11 (both winnability tests green); the
  tighter catch only raises the vital ceiling. Sacha's cross-seed greedyVital-loss-rate re-verify
  remains her acceptance leg.
- **Verification — MY LANE GREEN; one CROSS-LANE red flagged (not mine):**
  - `yarn vitest run` — **847/847** (boss suite 66/66, incl. the two updated A1 tests).
  - `yarn eslint` on `bossQteSystem.ts` + the test — **EXIT 0**; `prettier --check` on all four
    gameplay-lane files — **clean**.
  - `yarn typecheck` (repo-wide) is RED, but **only** in `src/render/scene/BossQteSprite.tsx`
    (`TS2304: Cannot find name 'RepeatWrapping'`, lines 210-211) — `dev-r3f-render`'s in-flight A1 §4
    render work (missing a `three` import); the pure game layer compiles clean. `yarn lint`'s 13
    errors are all in that same render file; `yarn format:check` flags that file + the gated design
    doc `docs/game-design/spec-boss-qte-differentiation.md` — none in this lane, none touchable by me
    (src/render forbidden). Flagged to `dev-r3f-render` to import `RepeatWrapping` from `three` and
    lint/format the file so the shared gate goes green.
- boundary: only `bossQteSystem.ts` + `bossQteSystem.test.ts` changed this round; seeded-pure preserved.
- handoff → `dev-r3f-render`: fix `BossQteSprite.tsx` (`import { RepeatWrapping } from "three"` or the
  namespaced form) + lint/format; the `BOSS_VITAL_CATCH_RADIUS 0.11` constant is exported and ready
  for the drawn-== -catch (0.11) vital ring.
- handoff → `producer`/`qa-lead`: the repo-wide typecheck/lint/format gate is blocked ONLY by the
  render lane's in-flight `BossQteSprite.tsx`, not the game lane — serialise the two lanes' green.
- NOTE (process): appended via `cat >>` heredoc, additive at end-of-file. Not committed/pushed.
- File List:
  - `src/game/systems/bossQteSystem.ts` (`BOSS_VITAL_CATCH_RADIUS` 0.18 → 0.11)
  - `src/game/systems/__tests__/bossQteSystem.test.ts` (two A1 tests updated; 66 tests)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

## 18. BUILD (render lane, stage-5 correction round 2) — dev-r3f-render (Amelia) — 2026-07-20 — particle smoke (§17) + décor dégradé + finisher B&W + A1-R2 radius

- claim: three gated corrections folded into one render pass — (1) Bertrand's §17 direct order
  (real particle smoke), (2) composite-gate §2.1 FAIL (décor glow aplat → dégradé), (3)
  composite-gate colour-law FAIL (finisher sepia → B&W + acid-neon) — plus picking up the A1-R2
  radius bump (0.11) which landed mid-pass (§10). Files: `src/render/scene/BossQteSprite.tsx` +
  NEW `src/render/scene/smokeParticles.ts` (a "sibling render-only module", explicitly allowed by
  the order) + NEW asset `public/assets/fx/smoke.png` + `public/assets/fx/LICENSES.md`. `src/game`
  NOT touched; `stateMachine.ts`/`useGameLoop.ts`/`src/hooks`/`CrtPass.tsx`/`crtParams.ts`/
  `levelArt.json` NOT touched; NO new render target / fullscreen pass.
- **Texture source + licence:** `public/assets/fx/smoke.png` — a soft-puff smoke sprite (512×512,
  white-on-alpha). Downloaded (open-source route, per the order — Kenney GitHub mirrors 404'd,
  GitHub code-search is repo-scoped) from `mrdoob/three.js` `examples/textures/opengameart/smoke1.png`
  (`https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/opengameart/smoke1.png`),
  three.js's OpenGameArt-sourced example texture set — **CC0 (public domain)**. Recorded in
  `public/assets/fx/LICENSES.md`. Committed byte-for-byte (renamed only). (A phaser-examples puff was
  also fetched but rejected — unclear asset licence; the CC0 three.js one honours the provenance
  discipline.)
- **Particle architecture (`smokeParticles.ts`):** a pooled field of billboard meshes (shared
  `PlaneGeometry`, per-particle `MeshBasicMaterial` so each puff fades independently). Lifecycle:
  spawn low → drift up+sideways → expand → fade in-then-out (`sin(lifeT·π)`) → respawn; randomized
  per-particle scale / rotation / velocity / opacity / lifetime (Math.random at mount — pure
  cosmetics, per the order). ONE shared texture fetch (hidden until it loads → no untextured square).
  Added to the scene via `<primitive object={smokeField.group}/>`; billboards positioned in world
  space around the boss anchor each frame; disposed on unmount. Reduced-motion: frozen at a scattered
  static arrangement, opacity held (no drift/rotation/strobe).
- **Bounds used (self-imposed, pending Ben's re-verdict):** particle count **≤64 desktop / ≤32
  mobile** (device tier via `detectMobile()`, like CRT lite/full); soft small-to-mid quads; NormalBlending
  desaturated (`#9a9a9a`, never additive); world-space layer 0 (rides the CRT composite pass 1 for
  free — **zero new RT, zero new pass, `CrtPass` untouched**); renderOrder 10 (below the parry
  halo/glyph 13/14 — the §16 legibility fix stays intact). Old 4-quad veil code REMOVED (my now-dead code).
- **Décor glow dégradé (§2.1 FAIL fix):** the prop is now a DIM GREY placeholder at all times (B&W
  value only); the "armed" read is a separate acid GLOW-HALO whose alpha falls MONOTONICALLY to 0 at
  the rim (a baked radial-gradient `CanvasTexture`, `buildRadialGlowTexture`) — a genuine dégradé,
  never a flat lime aplat. « Un halo est un dégradé, jamais un aplat. »
- **Finisher B&W (colour-law FAIL fix):** the sepia world-wash is GONE. The FINISHER beat is now
  MONOCHROME on world pixels — a brief WHITE inverted onset flash (value) + a held BLACK vignette
  value-crush (a baked radial `buildVignetteTexture`, clear centre → black rim). Colour lives ONLY on
  the acid-neon « LIVRE LE SON » prompt (`#39ff14` — the game's neon language). No warm hue on any
  world pixel; the R−B world cast is eliminated. Copy/mechanics untouched; still distinct from the
  passive `QTE_RESULT_HOLD` breather (prompt presence) and resolves on any fire (full-frame click zone).
- **A1-R2 (vital catch 0.11) picked up:** the render imports `BOSS_VITAL_CATCH_RADIUS`, so the vital
  ring now draws at 0.11 automatically (drawn == catch, no literal). Stale `0.18` comments updated to
  0.11. No functional change needed on my side.
- VERIFICATION — ALL GREEN (corepack yarn 4.12.0, COREPACK_NPM_REGISTRY set):
  - `yarn typecheck` → exit 0. `yarn lint` → exit 0. `yarn format:check` → clean.
  - `yarn vitest run` → **847/847 PASS** (both lanes landed).
- EVIDENCE (state-verified via `__MUF_STATE__().game.bossQte`, live `__MUF_PLAY__`, headless
  SwiftShader, crt:false to isolate the reads; replaces the 22/27/28/29 smoke aspects + 24/25):
  - `30-smoke-particles-desktop.png` — desktop 1280×720@2x, phase 3, `smokeActive` (drifting puff field).
  - `31-smoke-particles-mobile.png` — mobile **844×390**@3x, phase 3, `smokeActive`.
  - `32-smoke-reduced-motion.png` — desktop, `prefers-reduced-motion: reduce`, phase 3, `smokeActive`
    (frozen static scatter).
  - `33-parry-under-smoke.png` — desktop, `telegraphActive && chargedWindow && smokeActive` (the §16
    parry halo/glyph survives ABOVE the new particle smoke — re-verified).
  - `34-decor-glow-falloff.png` — desktop, phase 2, `decorArmed && !decorConsumed` (the acid dégradé
    halo wrapping the grey prop, monotonic falloff — no aplat).
  - `35-finisher-bw.png` — desktop, `phase === "FINISHER"` (cold B&W world + acid-neon « LIVRE LE SON »,
    no warm cast).
  - **Composite gate (Gate-4, `lead-art` Nico): please RE-VERDICT on 30-35** — the particle smoke, the
    décor dégradé, and the B&W finisher supersede the smoke/glow/finisher aspects of 22/24/25/27/28/29.
- Deviations: none from the corrections as specced. The particle count caps are self-imposed pending
  `gpu-specialist` (Ben)'s parallel re-verdict of the particle technique (his pre-build no-particles
  constraint was overridden by Bertrand §17). No commit/push.
- File List:
  - `src/render/scene/BossQteSprite.tsx` (particle field wiring; décor dégradé halo; finisher B&W;
    A1-R2 comment sync; old 4-quad veil removed)
  - `src/render/scene/smokeParticles.ts` (NEW — the particle field module)
  - `public/assets/fx/smoke.png` (NEW — CC0 three.js/OpenGameArt smoke sprite)
  - `public/assets/fx/LICENSES.md` (NEW — provenance)
  - `docs/qa/evidence/story-boss-qte-differentiation/30..35-*.png` (NEW — 6 state-verified captures)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

---

## COMPOSITE GATE (Gate 4) — RE-VERDICT — lead-art (Nico) — 2026-07-20 · corrected runtime visuals (evidence 30-35)

Re-verdict on the reworked runtime visuals (shard §17-§18), superseding the smoke/glow/finisher
aspects of my prior FAILs (24 aplat, 25 sepia) and the quad-veil captures (22/27/28/29). Bertrand
OVERRODE the quad-veil → real pooled particle smoke (CC0 puff billboards, normal desaturated blend,
under the §18 GPU coverage caps). Measured pixels on every load-bearing item; the standing PASS on
26 (HP-bar zero-settle) is NOT re-litigated.

### Measured re-verdicts

- **`30` particle smoke (desktop) — PASS.** House-style check: the textured puff field reads as
  **desaturated grey** — the dense plume samples near-black `(0,0,0)`; the translucent right-edge
  puffs `(134,136,138)`/`(97,104,109)` carry only a faint cool lean (g−r +2/+7, b−r +4/+12), well
  short of a saturated hue — inside the photocopied-B&W register. No neon, no colour flood. The
  particle field degrades-not-removes the tableau.
- **`31` particle smoke (mobile) — PASS.** Right-billboard puffs `(132,136,139)`/`(125,130,133)`,
  g−r +4/+5, b−r +7/+8 — same desaturated-grey read at mobile resolution.
- **`32` reduced-motion frozen scatter — PASS.** A held, non-animated puff scatter (plume near-black
  `(18,18,18)`, puff `(126,131,134)` b−r +8) — still-distinguishable, non-strobing, desaturated. The
  reduced-motion discipline holds on the particle path.
- **`33` parry glyph + paper-white halo above the particle smoke (§16-class check) — PASS.** Vertical
  scan through the glyph: background lum 121 → ramp 139 → 172 → core 179-180 → decay 176 → 150 →
  137 back toward ground. A genuine value-halo **dégradé** with falloff both sides, near-neutral
  (b−r +18 at the core only, 0 elsewhere — a pale value lift, no saturated hue), legible ABOVE the
  new particle smoke (the §16 treatment survives the medium change from quad-veil to particles). The
  diamond guard-form stays distinct from the open shoot-ring. Consistent with my prior 28/29 PASS.
- **`34` décor armed glow — radial-gradient halo — PASS (my prior FAIL on 24 is LIFTED).** Horizontal
  scan outward from the armed prop: green strength g−r **+33 → +26 → +21 → +14 → +8 → +1 → 0**,
  reaching neutral background (`~136,137,132`, g−r ≈ 0) at the outer margin. A **monotonically
  non-increasing alpha falloff terminating at 0** — precisely what §2.1 requires (« un halo est un
  dégradé, jamais un aplat »). The hard-edged single-step lime plate of capture 24 is gone; this is a
  real glow. The loi du glow (interactive décor prop glows) is now satisfied WITH falloff.
- **`35` finisher — B&W + neon-only — PASS (my prior FAIL on 25 is LIFTED).** Colour-law check:
  world/ground pixels sample **neutral** (400,750 → r−b +3; 2100,760 → +4; mid → 0) — the +14-15
  warm sepia cast of capture 25 is GONE. The finisher is now a held **black vignette value-crush**
  (corners `(25,27,30)`/`(16,16,15)`, neutral dark) over a B&W world, and the ONLY saturated colour
  in the frame is the acid-neon « LIVRE LE SON » prompt (brightest text px `(66,241,32)`, g−r 175 /
  g−b 209 = neon green). This satisfies §1 (only neon is colour, reserved for what matters) and the
  §8.4.4/P2 test (no hue added to the B&W layer; world/paper pixels stay neutral). The distinct
  FINISHER beat (ADR-0052) is preserved without a second-colour wash. (The white inverted onset
  flash is a transient not in this held still; a neutral-white flash is inherently colour-law-safe.)

### Overall

**COMPOSITE GATE: PASS.** All six corrected composites (30-35) clear Gate 4; my two prior FAILs are
resolved — 24→34 (aplat replaced by a measured radial dégradé to 0) and 25→35 (sepia replaced by a
neutral B&W value-crush with neon reserved to the prompt). Combined with the standing PASS items (26
HP-bar; and the 28/29 parry-halo treatment, re-confirmed above the new smoke as 33), the
differentiation pack's runtime visuals now pass the composite gate. No FAIL routed. The bible-gap
proposal from my prior entry (a bounded cinematic-finisher rule) stands for the bible gate — the
shipped fix is already inside it (value/vignette + hue-preserving neon, no second-colour hue).

VERDICT: PASS — composite gate 30-particle-smoke-desktop (lead-art)
VERDICT: PASS — composite gate 31-particle-smoke-mobile (lead-art)
VERDICT: PASS — composite gate 32-smoke-reduced-motion (lead-art)
VERDICT: PASS — composite gate 33-parry-glyph-halo-particle-smoke (lead-art)
VERDICT: PASS — composite gate 34-decor-armed-radial-halo (lead-art)
VERDICT: PASS — composite gate 35-finisher-bw-neon-only (lead-art)
VERDICT: PASS — composite gate differentiation-runtime-visuals-REVERIFY (lead-art)

- **File List:** `docs/handoffs/story-boss-qte-differentiation.md` (this re-verdict entry appended).

## 20. VERIFY (stage 5, leg 2 — A1-R2 §4 BINDING sign-off) — ux-designer (Tony) — 2026-07-20 — small-ring (0.11) legibility on both device classes at the boss zoom

- claim: discharge Karim's §17 GATED AMENDMENT A1-R2 §4 binding condition — confirm whether the
  drawn=catch VITAL ring at `BOSS_VITAL_CATCH_RADIUS 0.11` is clearly perceivable, distinguishable
  from the 0.30 LIMB ring, and honestly aim-able on BOTH device classes at the boss zoom, mobile
  especially. Built + captured fresh evidence via the existing dev-harness seam (`bossHarness.ts`,
  `?preview=boss&at=phase2`), state-verified via `window.__MUF_STATE__()` (not eyeballed), judged on
  the real captures at real size — no zoomed crops used for the verdict itself (crops below are
  measurement AIDS, logged alongside the full-frame evidence).
- Build: `yarn build` (COREPACK_NPM_REGISTRY=https://registry.npmjs.org) → clean production build;
  `vite preview --port 4321`. Playwright (Chromium, `/opt/pw-browsers/chromium`,
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`), `window.__MUF_PLAY__=true` seeded pre-navigation (the
  `__MUF_STATE__` seam only installs under `__MUF_PLAY__`, per `useGameLoop.ts`), navigated to
  `?preview=boss&at=phase2&blownImmune=1`, polled `__MUF_STATE__().game.bossQte` until
  `phase==="ACTIVE" && phaseIndex>=1 && stance==="EXPOSED"` (both rings live) before each screenshot.
- **Evidence (state-verified, both confirm `phaseIndex:1, stance:"EXPOSED"`):**
  - `docs/qa/evidence/story-boss-qte-differentiation/36-vital-ring-011-desktop.png` — desktop
    1280×720, DPR 2.
  - `docs/qa/evidence/story-boss-qte-differentiation/37-vital-ring-011-mobile.png` — mobile
    **844×390**, DPR 3, iPhone UA.

### VERDICT: FAIL — A1-R2 §4 small-ring legibility (ux-designer) — mobile

### Desktop — PASS (marginal, note attached)

Measured directly on `36` (2560×1440 raw = 2× the 1280×720 CSS viewport): the vital ring's drawn
outer diameter is **≈35 raw px ≈ 17.5 CSS px** (annulus stroke ≈5 CSS px, hollow interior ≈3.5 CSS px
radius) — small, but: (a) clearly PERCEIVABLE — bright acid green (`#39ff14`) at full emphasis
(opacity 0.5) against the boss's desaturated-orange torso, a comfortable ≈2 boss-head-heights of
clear black background separates it from the "LE COMMANDANT" HUD bar (no occlusion risk on this
device class); (b) distinguishable from the LIMB ring **by THREE independent channels, not colour
alone** — position (head vs. torso), size (vital ≈2.7× smaller than limb, since both share the same
`RING_INNER 0.78`/`RING_OUTER 1.0` geometry scaled by their own radius — limb draws ≈48 CSS px
diameter, close to the project's standing 44 px reference), and emphasis (vital opacity 1.0 vs. limb
0.6); (c) honestly aim-able — `game-designer`'s own sweep (shard §15/§19) already demonstrates a
scripted perfect tracker lands it every window, and 17.5 CSS px is tight-but-workable for continuous
mouse tracking (a fundamentally different task than a discrete tap — WCAG's 44×44/24×24 tap-target
floors are not the literal bar here, they are context for how small is small). **Soft note, not a
blocker:** 17.5 CSS px is close to the floor of what a moving mouse-tracked target can comfortably
read as "a ring" rather than "a dot" at a glance — worth the same thickness treatment recommended
below for mobile, as a shared, cheap desktop polish, but I do not hold desktop as failing.

### Mobile-landscape — FAIL (the binding condition's own named risk, confirmed)

`37` shows the vital ring **not clearly perceivable at all** — captured mid-frame with the head (and
therefore the entire vital wander band) rendering **directly behind the fixed "LE COMMANDANT"
name-plate + HP-bar HUD overlay**. Pixel-measured (raw 2532×1170 @ DPR 3): scanning vertically through
the boss's head column, the HP-bar's green fill and black border run to raw y≈341, then only a
**≈18 raw px (≈6 CSS px) sliver** of green-tinted, desaturated skin shows before the pure boss-orange
skin tone resumes at y≈362 — no legible ring OUTLINE, just a smeared olive-green colour wash under the
bar's bottom edge (horizontal scan at that row shows two faint green clusters, not a closed circle).
**This is not incidental framing luck, it is structural:** the vital wander band is fixed at
`BOSS_VITAL_WANDER_CENTRE.y = 0.8` ± a small amplitude (world units, unaffected by device or zoom),
and `MOBILE_ZOOM_FACTOR = 1.7` (`GameScene.tsx`) pushes the whole tableau larger on a mobile-landscape
canvas whose HUD bar is a **DOM overlay with a fixed CSS footprint, not scaled with camera zoom**
(`BossHpBar.tsx`) — so the head/vital-ring band and the bar's fixed screen rectangle collide on every
mobile capture, not just this one. **The LIMB ring is fine** (visible, bright, at the torso, clear of
the bar) — this is squarely the VITAL ring's problem, and specifically the compounding of (i) its
fixed near-top wander height (unchanged since A1) with (ii) its NEW, much smaller 0.11 footprint: the
old 0.30 ring (still visible in the shipped `14-mobile-phase1-ring.png` phase-1 evidence) was big
enough to poke a visible arc out from behind the same bar at the same screen height; the new 0.11 ring
is small enough to fit ENTIRELY inside the occluded band, with no poke-out margin left. Since the DOM
HUD bar renders in front of the WebGL canvas by construction (a DOM-stacking fact, not a `renderOrder`
one — no in-canvas trick, like the parry-glyph-above-smoke fix in §16, can put a Three.js mesh above a
DOM element), no in-canvas fix (bigger stroke, extra halo, brighter tint) can restore visibility once
the ring's screen position falls inside the bar's rectangle. A player cannot perceive, and therefore
cannot honestly aim at, a ring that is not there to see.

### Split-preview cue (D4.7, the phase-1→2 "new pattern" cue) — same risk, not captured (code-inspected)

Per `BossQteSprite.tsx:570` the split-preview vital ring is ALSO drawn at `BOSS_VITAL_CATCH_RADIUS`
(0.11) at `qte.anchor.y + 0.75` — the same head-adjacent height — at an even FAINTER pulsing opacity
(0.15–0.25) than the live ring. I could not reach this window with the existing `at=` harness seam
(it fast-forwards THROUGH the phase-1→2 break rather than stopping inside it — the same gap I logged
in my own §15 entry, D4.7/A14). By inspection it will suffer the identical mobile occlusion, likely
worse (lower opacity, same position) — flagged as the same defect family, not a second one, so no new
capture is owed before routing this.

### Ruling per Karim's own §17 routing (verbatim: "a render-scale/boss-zoom question… NOT a re-tune

of the radius… NOT a third round of this cap")

This IS that scenario. `BOSS_VITAL_CATCH_RADIUS` stays mechanically pinned at 0.11 (game-designer's
gated dominance threshold, §15/§17/§19 — not mine to reopen). The defect is compositional: the fixed
mobile HUD bar's screen footprint was never re-checked against the vital ring's fixed wander height
when the ring shrank from 0.30/0.18 → 0.11. Concrete treatment I'd spec (routed to `lead-art` +
`senior-architect`, per Karim's routing, for the render-scale/boss-zoom call):

1. **Primary — reframe, not re-zoom.** NOT a "zoom bump during vital windows": zooming IN on the
   existing boss-centred anchor would push the head further UP toward/behind the fixed bar, making
   occlusion WORSE, not better. The fix is a **camera-anchor / vertical-framing correction on
   mobile** — give the boss tableau more headroom above the HUD bar specifically at
   `MOBILE_ZOOM_FACTOR 1.7` (e.g., anchor the boss lower in the mobile-landscape frame, or reduce the
   effective height the "LE COMMANDANT" name-plate + HP-bar block occupies on mobile) so the ENTIRE
   vital wander band (`BOSS_VITAL_WANDER_CENTRE.y = 0.8` ± amplitude) clears the bar's bottom edge
   with a comfortable margin — the same margin the phase-1 0.30 ring used to get "for free" by being
   big enough to poke out.
2. **Secondary, complementary — thickness/emphasis within drawn=catch (safe to do regardless of #1,
   improves desktop's soft note too).** The vital ring's stroke is `RING_OUTER(1.0) − RING_INNER(0.78)`
   of its own radius — a fixed 22%-of-radius band that shrinks in lockstep with the radius. Tightening
   `RING_INNER` for the VITAL ring specifically (e.g., 0.78 → ~0.55, `RING_OUTER` unchanged at 1.0) makes
   the SAME 0.11 catch boundary read as a visually bolder, chunkier band without moving the outer/catch
   edge one unit — the aim-honesty invariant (drawn radius = catch radius = 0.11) is untouched, only the
   hole in the middle narrows. This does not fix the mobile occlusion (a thicker ring behind an opaque
   HUD bar is still invisible) but is a legitimate, low-risk perceivability boost worth doing alongside
   #1, and closes my desktop soft note for free.
3. **Rejected option — a non-scored outer "locator" affordance marker drawn in the canvas.** Would not
   help on mobile: it lives in the SAME WebGL layer as the ring, so it hits the identical DOM-stacking
   ceiling (nothing in-canvas can render above the fixed HUD bar). Only worth considering if paired
   with #1's reframe (once the band is clear of the bar) as a discoverability nicety, not as the fix.

### Acceptance against my own gated spec (`spec-boss-qte-differentiation-ux.md` A12/A15, D4.1/D4.5/D4.8)

- **D4.1/D4.5 (form/position, not colour-alone) — PASS, both device classes.** Position (head vs.
  torso) + size (≈2.7× ratio) + emphasis (1.0 vs. 0.6) triple-code the vital/limb distinction; colour
  is reinforcement only, consistent with the rest of this pack.
- **A15/D4.8 ("legible at mobile-landscape viewport… no device-specific exception… a `verify`-stage
  finding to raise, not something to silently accept") — this IS that finding, raised, not accepted.**
- **New binding condition (A1-R2 §4) — FAIL on mobile,** per the routing Karim pre-cleared: to
  `lead-art` (Nico) + `senior-architect` (Winston), NOT a third radius round, NOT `dev-gameplay`'s or
  `game-designer`'s lane.

- handoff → `lead-game-designer` (Karim): A1-R2 §4 binding leg-2 sign-off = **FAIL, mobile-landscape**
  (desktop PASS-with-a-soft-note). Per your own §17 pre-clearance this routes to `lead-art` +
  `senior-architect` as a render-scale/boss-zoom problem, explicitly NOT a re-tune of
  `BOSS_VITAL_CATCH_RADIUS` (which stays gated at 0.11, game-designer's A1-R2 win stands untouched)
  and explicitly NOT a third round of the 2-round cap.
- handoff → `lead-art` (Nico) + `senior-architect` (Winston): concrete treatment above — (1) primary:
  a mobile camera-anchor/framing correction so the fixed vital wander band (`y=0.8`±amplitude) clears
  the fixed-footprint "LE COMMANDANT" HUD bar at `MOBILE_ZOOM_FACTOR 1.7` (NOT a zoom increase, which
  would worsen it); (2) secondary, low-risk, do-anyway: tighten `RING_INNER` for the vital ring only
  (drawn=catch outer radius unchanged) for a bolder stroke at the same 0.11 footprint, closing my
  desktop soft note too. Re-capture `36`/`37` once landed; I re-review.
- handoff → `game-designer` (Sacha): no action — `BOSS_VITAL_CATCH_RADIUS 0.11` is untouched by this
  finding; your A1-R2 dominance win (§19) stands independent of the render-scale fix above.
  Split-preview cue (D4.7) will need its own quick re-check once #1 lands (same fix should cover it,
  since it shares the same head-adjacent y-position).
- handoff → `producer` (Marion): this is a NEW finding routed outside the 2-round radius cap per
  Karim's own §17 pre-clearance — track as a render-scale/boss-zoom item, not a cap-count item.
- NOTE (process): appended via `cat >>` heredoc (additive, end-of-file). Build + Playwright capture
  ran against a throwaway local `vite preview` (port 4321) of the current committed source — no
  `src/**` edit, no commit/push. Pixel measurements taken with `@napi-rs/canvas` decode of the
  captured PNGs (already a project-standard tool, `scripts/e2e-lib.mjs`'s `decodePng` family) — no new
  dependency added.
- File List:
  - `docs/qa/evidence/story-boss-qte-differentiation/36-vital-ring-011-desktop.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/37-vital-ring-011-mobile.png` (NEW)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)

VERDICT: FAIL — A1-R2 small-ring legibility (ux-designer) — the 0.11 VITAL ring is clearly perceivable, well-distinguished from the 0.30 LIMB ring (position + size + emphasis, not colour-alone), and honestly aim-able on DESKTOP (measured ≈17.5 CSS px drawn diameter, marginal but workable for continuous mouse tracking — soft note, not blocking). On MOBILE-LANDSCAPE it FAILS outright: the fixed vital wander band (world y=0.8±amplitude) renders almost entirely BEHIND the fixed-footprint "LE COMMANDANT" name+HP-bar DOM overlay at `MOBILE_ZOOM_FACTOR 1.7` — measured evidence (`37-vital-ring-011-mobile.png`) shows only a ≈6 CSS px smeared, non-circular colour sliver, no legible ring at all; this is structural (the old bigger 0.18/0.30 ring used to poke a visible arc past the same bar at the same screen height — the smaller 0.11 ring no longer does) and will recur on every mobile phase-2+ vital window, not this capture alone. Per Karim's §17 pre-clearance this is a render-scale/boss-zoom problem, NOT a radius re-tune and NOT a third cap round — routed to `lead-art` + `senior-architect` with a concrete treatment: (1) primary — a mobile camera-anchor/framing correction giving the vital band clearance under the fixed HUD bar (NOT a zoom increase, which would worsen the collision), (2) secondary/low-risk — tighten the vital ring's `RING_INNER` for a bolder stroke at the same pinned 0.11 catch radius (aim-honesty untouched), closing the desktop soft note too. `BOSS_VITAL_CATCH_RADIUS = 0.11` itself is untouched and stays gated.

## 21. RENDER-SCALE RULING (stage 5) — senior-architect (Winston) — 2026-07-20 — mobile boss-zoom framing collision (routed by Karim §17 + ux-designer §20)

**Scope:** ONE bounded mechanism ruling on the mobile boss-zoom framing collision (§20,
evidence 36/37). NOT a catch-radius round (`BOSS_VITAL_CATCH_RADIUS 0.11` stays gated,
§15/§17/§19 — untouched). NOT reopening the HUD bar's existence (Bertrand's OQ6 override,
`story-boss-encounter-qte.md` §"HUD BOSS-HP BAR" — the bar STAYS; hiding/removing it on
mobile would contradict a Bertrand decision and is explicitly OUT of this ruling). I rule
the WHERE + SHAPE of the framing correction and confirm the do-anyway; dev-r3f-render
implements.

### Root cause (confirmed against code, not just the capture)

The QTE camera centres on `qte.anchor` and holds (`useGameLoop.ts:399-407` → `qtePose`,
`qteCamera.ts:64`). The vital band sits ABOVE the anchor (live ring `qte.anchor.y +
targetOffset.y`, `BossQteSprite.tsx:539`; wander centre `BOSS_VITAL_WANDER_CENTRE.y=0.8`,
anchor-relative). On mobile the effective boss zoom is `baseZoom(×MOBILE_ZOOM_FACTOR 1.7) ×
QTE_ZOOM_FACTOR 2.4`, so that fixed world offset maps to MORE screen px → the head rides up
under the fixed-CSS-footprint `BossHpBar` (`top:58px`, DOM, not zoom-scaled). Structural,
recurs every mobile phase-2+ vital window + the split-preview (`BossQteSprite.tsx:570-571`).
A DOM overlay cannot be drawn under by any in-canvas trick (ux-designer is correct: this is
a DOM-stacking ceiling, not a `renderOrder` one).

### (a) WHERE the correction lives — render side, at the qtePose call site in useGameLoop's boss branch

The framing correction is a **render-owned vertical offset applied to the boss anchor the
camera consumes**, NOT a game value and NOT a qteCamera signature change. Boundary law holds
(ADR-0030/0051 precedent: the game owns NO camera values; `qte.anchor` is level DATA the
render camera consumes, and camera-framing constants live in `render/scene/qteCamera.ts`
alongside `QTE_ZOOM_FACTOR`). The three candidate homes and why I pick the middle one:

- ~~qtePose pure-maths param~~ — REJECTED: broadens the generic pose API + the hostage
  caller for a mobile-boss-only concern; would touch the hostage QTE path and qtePose's unit
  tests for no reason.
- **Anchor-offset applied in `useGameLoop`'s boss branch — CHOSEN.** Most surgical; qtePose
  stays generic (hostage path byte-unchanged); no game edit; the game/render/hooks contract
  (`{anchor, phase, zoomRemaining, zoomSeconds}`) is consumed UNCHANGED.
- ~~per-device anchor adjust in GameScene~~ — REJECTED: GameScene doesn't drive the boss
  camera; the driver is `useGameLoop`.

### (b) EXACT shape (pick ONE — this is it)

1. Add a render constant in **`src/render/scene/qteCamera.ts`** next to `QTE_ZOOM_FACTOR`,
   e.g. `BOSS_MOBILE_FRAME_LIFT` (world units, POSITIVE). Home = qteCamera because it is a
   camera-framing constant; it is only ever APPLIED by the driver.
2. In **`src/hooks/useGameLoop.ts`**, in the QTE-camera block (around line 402-403), when
   the live QTE is the BOSS **and** mobile (`mobileControls !== undefined`), pass qtePose a
   locally-lifted anchor instead of `camQte.anchor`:
   `{ x: camQte.anchor.x, y: camQte.anchor.y + BOSS_MOBILE_FRAME_LIFT }`.
   Gate strictly on the boss (e.g. `camQte === bossQte`) so the hostage QTE is never shifted.
   Leave the desktop path and `qteBaseRef` (restore target) untouched — restore still returns
   to the true pre-QTE pose, no regression.

- **Sign convention (binding):** POSITIVE lift = camera target raised ABOVE the boss anchor
  ⇒ the whole tableau shifts DOWN on screen ⇒ the head/vital band drops clear of the top HUD
  bar. (Ortho: increasing `camera.position.y` moves a fixed world point DOWN in y-down screen
  space. This is the "reframe down", NOT a zoom bump — zooming in would push the head further
  UP/behind the bar, worsening it, exactly as ux-designer warned.)
- **Magnitude:** the tuned number is the lane's, calibrated against captures 36/37. Bound it:
  enough that the FULL vital band (`0.8 ± amplitude` + the 0.11 ring's drawn radius) clears the
  bar's bottom edge (bar `top:58px` + height, ≈114 CSS px on the 37 capture) with margin — the
  same clearance the old 0.30 ring got "for free"; but NOT so much that the LIMB ring (torso)
  or the boss's lower body falls off the bottom of the mobile-landscape frame. Re-capture
  36/37, ux-designer re-reviews (his §20 handoff).

### (c) RING_INNER stroke tightening (do-anyway) — CONFIRMED, with two constraints

Approved as an independent, low-risk perceivability boost. Constraints from my side:

- **`RING_OUTER` stays 1.0** — the drawn outer edge = catch radius = 0.11 aim-honesty
  invariant (gated §15/§17/§19) must NOT move. Only the inner hole narrows.
- **VITAL ring ONLY.** The vital (`ring`) and limb (`ringB`) meshes are already SEPARATE
  geometries (`BossQteSprite.tsx:792`/`796`) but both currently read the single `RING_INNER
0.78`. Introduce a dedicated `RING_INNER_VITAL` (~0.55) on the vital ring's geometry; leave
  the limb ring at 0.78. Apply it to BOTH vital instances — the live EXPOSED vital ring AND
  the split-preview vital ring (`:570`) — so they stay consistent. Do NOT touch the shared
  constant globally (that would fatten the limb ring too).
- Note: (c) does NOT fix the mobile occlusion on its own (a bolder ring behind an opaque bar
  is still invisible) — it rides ON TOP of (a)/(b) and closes ux-designer's desktop soft note.

### (d) Boundary + ADR

- **This is a pure RENDER-LANE fix. No game/hooks CONTRACT change crosses.** Files:
  `src/render/scene/qteCamera.ts` (new render constant), `src/hooks/useGameLoop.ts` (apply
  offset in the boss branch — internal to the bridge, the `{anchor,…}` data contract is
  consumed unchanged), `src/render/scene/BossQteSprite.tsx` (vital-only inner). All owned by
  `dev-r3f-render` (src/render + view hooks). No `src/game/**` edit, no qtePose signature
  change, no hostage-path change, no new dependency, no boundary move. Single non-overlapping
  lane — no cross-lane serialisation needed.
- **ADR-0052 revision: NOT REQUIRED (judgement).** No module boundary, deployment, dependency,
  or game/render/hooks contract changes — the fix operates ENTIRELY within the standing
  ADR-0030/0051 decision (camera framing is render-owned; game owns no camera values), so it
  does not clear the ADR bar. RECOMMENDED (not blocking, tech-writer/producer when ADR-0052 is
  written for the tech plan): a one-line note in ADR-0052 recording that the mobile boss
  framing carries a render-side vertical lift coupled to the `BossHpBar` fixed footprint — so
  the constant is not mistaken for a magic number and the HUD-bar-position ↔ boss-framing
  coupling is documented for whoever next touches `MOBILE_ZOOM_FACTOR`, the bar's `top`, or the
  anchor. ADR numbers stay `producer`'s to allocate; this is an in-place note, no new number.
- **Process read (producer's call, not mine to force):** single-lane, render-only, no
  boundary/design/asset/dependency change → fits the **fix lane** (dev-r3f-render →
  tsc/vitest/lint + `verify` re-capture 36/37 → ONE `code-review` high → Bertrand merges;
  logged in `docs/handoffs/fixes.md`). The split-preview cue (D4.7) is covered by the same
  (a)/(b) lift — no separate fix.

- handoff → `dev-r3f-render` (Amelia): implement (a)/(b) + (c) per the file/function targets
  above; re-capture `36`/`37`; hand to `ux-designer` for the §20 re-review.
- handoff → `producer` (Marion): fix-lane vs. full-pipeline routing call + optional one-line
  ADR-0052 note (above); track outside the 2-round radius cap per Karim's §17 pre-clearance.
- handoff → `ux-designer` (Tony): re-review owed once 36/37 re-captured.

RULING: mobile boss-zoom framing collision = render-lane fix, no game/hooks-contract change. (a/b) PRIMARY — a POSITIVE render-owned vertical LIFT `BOSS_MOBILE_FRAME_LIFT` defined in `qteCamera.ts`, applied to the boss anchor's y at the `qtePose` call site in `useGameLoop.ts`'s boss branch (mobile-only, boss-only), raising the camera target above the anchor so the tableau drops on screen and the full vital band (`y=0.8±amp`) clears the fixed `BossHpBar` bottom edge — NOT a zoom bump (which worsens it); magnitude calibrated by the lane against captures 36/37, bounded to keep the limb ring/lower body on-frame. `qtePose` signature UNCHANGED, hostage path untouched. (c) SECONDARY do-anyway CONFIRMED — a vital-only `RING_INNER_VITAL ~0.55` on the vital ring's own geometry (live + split-preview), `RING_OUTER` staying 1.0 so drawn=catch=0.11 aim-honesty is untouched; limb ring's 0.78 unchanged. ADR-0052 revision NOT required (no boundary/contract change — operates within ADR-0030/0051); a one-line HUD-coupling note recommended, not gated. Single dev-r3f-render lane; qualifies for the fix lane. (senior-architect)

## 22. BUILD (render lane, stage-5 final correction) — dev-r3f-render (Amelia) — 2026-07-20 — mobile boss-zoom frame lift + vital ring stroke (§21 ruling, fixes ux §20)

- claim: implement senior-architect ruling §21 (a/b/c) fixing ux-designer's §20 mobile FAIL (the
  boss head/vital band riding up UNDER the fixed-footprint `BossHpBar` at the mobile boss zoom).
  §21 explicitly scopes this as a pure RENDER-LANE fix owned by dev-r3f-render (src/render + view
  hooks), no game/hooks-CONTRACT change — so the `useGameLoop.ts` boss-branch edit is authorised.
  Files: `src/render/scene/qteCamera.ts`, `src/hooks/useGameLoop.ts`, `src/render/scene/BossQteSprite.tsx`.
  `src/game/**` untouched; `qtePose` signature UNCHANGED; hostage path + desktop path + `qteBaseRef`
  restore untouched; `RING_OUTER` (drawn == catch == 0.11) inviolate.
- (a/b) **Mobile frame lift:** new render constant **`BOSS_MOBILE_FRAME_LIFT = 0.7`** (world units,
  POSITIVE) in `qteCamera.ts` next to `QTE_ZOOM_FACTOR`. In `useGameLoop.ts`'s QTE-camera block, when
  the live QTE is the BOSS (`camQte === bossQte`) AND mobile (`mobileControls !== undefined`), the
  `qtePose` target is a locally-lifted anchor `{ x: anchor.x, y: anchor.y + BOSS_MOBILE_FRAME_LIFT }`
  — raising the camera target above the anchor so the tableau drops on screen and the vital band
  clears the bar. Desktop / hostage / restore paths byte-unchanged.
  - **Calibration (how I validated 0.7):** measured the bar's DOM rect on the 844×390 capture —
    `bottom = 114 CSS px` (confirmed `getBoundingClientRect`). Then drove phase-2 to the vital ring's
    WORST-CASE wander height (`targetOffset.y = 0.92`, near its 0.96 max) and confirmed the full bold
    vital ring clears the bar bottom by **~44 CSS px** margin, WHILE the limb (torso) ring and the
    boss's lower body / feet stay on the short mobile-landscape frame. 0.7 is the max that keeps the
    feet on-frame; smaller values thin the worst-case clearance, larger clips the feet — 0.7 is the
    calibrated balance. (Sign convention per §21: positive lift = target up = tableau down = head
    clears the bar; NOT a zoom bump.)
- (c) **Vital ring stroke:** dedicated **`RING_INNER_VITAL = 0.55`** applied to the VITAL ring's own
  geometry ONLY, via a per-branch geometry swap (`ringGeoVital` vs `ringGeoNormal`, both memoized +
  disposed) on ring A in its two vital instances — the live phase-2+ EXPOSED vital ring AND the
  split-preview vital ring. The phase-1 single ring and the neutral wind-up tell keep `RING_INNER 0.78`;
  the limb ring (`ringB`) keeps 0.78 via its own declarative geometry. `RING_OUTER` stays 1.0 → the
  drawn outer edge = catch radius (0.11) aim-honesty is untouched. The tiny 0.11 vital ring now reads
  as a chunky, perceivable annulus at the boss zoom.
- VERIFICATION — ALL GREEN (corepack yarn 4.12.0, COREPACK_NPM_REGISTRY set):
  - `yarn typecheck` → exit 0. `yarn lint` → exit 0. `yarn format:check` → clean.
  - `yarn vitest run` → **847/847 PASS** (incl. `qteCamera.test.ts` 12/12 — the added constant does
    not change `qtePose`'s signature or behaviour).
- EVIDENCE (state-verified via `__MUF_STATE__().game.bossQte`, live `__MUF_PLAY__`, headless
  SwiftShader, crt:false):
  - `38-vital-ring-mobile-lifted.png` — **844×390**, phase-2 EXPOSED, BOTH rings live
    (`phaseIndex=1, stance=EXPOSED, !chargedWindow, targetOffset.y≈0.81`). The bold vital ring is
    fully legible BELOW the `BossHpBar`; limb ring + feet on-frame. (Worst-case `ty=0.92` also
    verified clearing during calibration.)
  - `39-vital-ring-desktop-stroke.png` — desktop 1280×720@2x, same state — the bolder vital stroke
    renders (small but perceivable); no lift applied (desktop path unchanged).
  - **Note for `ux-designer` (Tony): the §20 FAIL re-verdict runs on 38/39.**
- Routing: §21 says this qualifies for the FIX LANE (single render lane, no boundary/design/asset/
  dependency change). ADR-0052 revision NOT required (§21 (d)); a one-line HUD-coupling note is
  recommended (not gated) — the `BOSS_MOBILE_FRAME_LIFT` doc comment records the coupling to
  `BossHpBar`'s fixed footprint + `MOBILE_ZOOM_FACTOR` for whoever next touches them. No commit/push.
- File List:
  - `src/render/scene/qteCamera.ts` (`BOSS_MOBILE_FRAME_LIFT` render constant)
  - `src/hooks/useGameLoop.ts` (boss-branch mobile lift at the `qtePose` call site — internal to the
    bridge; the `{anchor,…}` data contract consumed unchanged)
  - `src/render/scene/BossQteSprite.tsx` (`RING_INNER_VITAL` vital-only geometry swap)
  - `docs/qa/evidence/story-boss-qte-differentiation/38-vital-ring-mobile-lifted.png` (NEW)
  - `docs/qa/evidence/story-boss-qte-differentiation/39-vital-ring-desktop-stroke.png` (NEW)
  - `docs/handoffs/story-boss-qte-differentiation.md` (this entry)
