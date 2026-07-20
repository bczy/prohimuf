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
