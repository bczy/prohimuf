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
