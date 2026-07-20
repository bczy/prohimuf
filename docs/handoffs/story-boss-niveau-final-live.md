# Handoffs — "Le Commandant" ships live: minimal Niveau Final level (STORY-BOSS-NIVEAU-FINAL-LIVE)

Story slug: `story-boss-niveau-final-live` · opened by `pm` (John), 2026-07-20.
Feature: the long-reserved follow-up named by both `story-boss-encounter-qte.md` (ADR-0051
K2 ratification) and `story-boss-qte-differentiation.md` (AC8) — ship the already-built,
already-differentiated boss system live, canon, player-facing, on a new minimal Niveau
Final level. Triggered by Bertrand's direct intake: _"OK N'OUBLIE PAS D'INCLURE LE BOSS
DANS LE STAGE — CELA FAIT PARTIE D'UNE STORY APPAREMMENT."_

## 1. INTAKE + PRODUCT — pm (John) — 2026-07-20

- claim: turn Bertrand's direct instruction into a scoped story for the reserved
  Niveau-Final live-ship follow-up, without reopening ADR-0051/ADR-0052, without touching
  the in-flight `story-boss-qte-differentiation` files/code, and without silently assuming
  Bertrand's message is sign-off on the new venue canon it did not explicitly address.
- release: `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md`. Headlines:
  - **Why now:** Bertrand's message is read as satisfying the differentiation story's own
    advisory ("differentiate before the live-ship follow-up opens") — the differentiation
    pack is design-gated and in BUILD/heading into stage-5 VERIFY on this same branch. This
    story is scoped honestly as building **after** ADR-0052 clears its stage-6 review
    panel on `main` (AC8) — not immediately, on top of an unreviewed diff.
  - **Cahier des charges:** the boss-as-extension test was already run and RATIFIED
    (ADR-0051) — not re-litigated here. What is new is the LIVE surface (first
    player-facing footprint) and the Niveau Final level itself (already-committed roadmap
    content, `PROJECT_GUIDELINES.md` §7/§10, no extension test owed for building a level
    per se).
  - **Scope — minimal live level, system UNCHANGED:** one new shipped `LevelConfig`
    (real facade/roster/delivery/quota + a non-null `bossQteSpec` re-anchored/re-seeded
    from the existing tuned values), placed after Vitry in `LEVELS` (auto-unlocks via the
    existing index-based unlock chain, no new unlock code), the already-gated
    `final_pre`/`final_post` scripts wired to the new level's id. Explicitly **no** new
    fields/constants/branches in `bossQteSystem.ts`/`types/bossQte.ts` (AC5) — any tuning
    drift found here is a correct-course, not a silent edit to ADR-0052.
  - **Art recommendation (not a decision):** ship on the already-proven
    procedural/placeholder boss visuals (cop fallback + procedural rings/parry/decor/
    smoke/renfort, all already stage-5-verified on the dev-harness), generate only the new
    venue backdrop (a genuinely new environment — the squatted grand disused hall — not
    reuse of an existing tileset). The 9 deferred canon art asks (4 V1 `commander_*` poses
    - 5 differentiation-story reads) stay deferred per both ADRs' "N2: no run ahead of
      need," unless Open Question 3 is resolved to open that lane now. Flagged as a real
      trade-off (velocity vs. "the finale's one true reveal reading finished"), not picked.
  - **Open questions (5):** level pacing/quota/difficulty (1–2), art-lane timing (3), the
    canon-venue confirmation `pm`'s own prior AC7 review already asked for from Bertrand
    before this exact opening (4 — flagged, not assumed satisfied by the intake message),
    and the BUILD-vs-ADR-0052-merge sequencing (5).
  - **AC8 (sequencing gate):** dev lanes touching `levels.ts`/`bossQteSystem.ts` do not
    start until `producer` confirms ADR-0052's stage-6 panel MERGE-cleared on `main`, or an
    explicit logged decision to compress that.
  - **Relationship to both prior stories:** extends, does not reopen. ADR-0051's system and
    ADR-0052's 5 levers ship **unchanged**; this story is data (one `LevelConfig`) +
    narrative wiring + one new backdrop asset, not a system-design pass.
- handoff → `game-designer` (Sacha): level pacing/quota/difficulty (Open Questions 1–2).
- handoff → `narrative-designer` (Yasmine): venue-canon confirmation routing to Bertrand
  (Open Question 4) + wiring the already-gated `final_pre`/`final_post` scripts to the new
  level id (AC7).
- handoff → `ux-designer` (Tony): fresh-eyes legibility pass — first time a player reaches
  the boss beat inside a full level, without dev-harness familiarity.
- handoff → `lead-game-designer` (Karim): design gate once the above land, covering the
  Open Questions and the art-lane timing call (Open Question 3) jointly with `pm` +
  `senior-architect`.
- handoff → `senior-architect` (Winston): TECH PLAN once gated — treat as data + narrative
  wiring against the frozen ADR-0051/ADR-0052 contract (Architecture directive in the
  story), confirm AC1–AC5 against real code, rule on Open Question 5 (sequencing) if
  Bertrand wants it compressed.
- handoff → `producer` (Marion): open stage tracking for this new shard; allocate the ADR
  number at DESIGN stage (AC6, not self-allocated); **own the AC8 dependency gate** — chase
  and confirm ADR-0052's stage-6 review panel MERGE status on `main` before green-lighting
  any dev lane here that touches `levels.ts`/`bossQteSystem.ts`; index this shard in
  `docs/agent-handoffs.md` (done in this same pass, see File List).
- Not yet logged as a `VERDICT:` line — no gate has run yet; this entry is INTAKE/PRODUCT
  only.
- File List:
  - `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md` (NEW)
  - `docs/handoffs/story-boss-niveau-final-live.md` (NEW — this file)
  - `docs/agent-handoffs.md` (index row added)

## 2. DESIGN LOOP — narrative-designer (Yasmine) — 2026-07-20

- claim: harden the Bertrand-CONFIRMED venue canon for the Niveau Final and wire the
  already-gated `final_pre`/`final_post` scripts to the new level (Open Question 4 + AC7),
  without rewriting one word of the gated copy and without deciding any mechanic, level id,
  or surface.
- release: `docs/game-design/spec-niveau-final-fiction.md`. Headlines:
  - **Venue hardened — the hall is named `l'Éden` (ancien dancing).** Bertrand confirmed the
    squatted grand hall as HARD canon (2026-07-20), lifting the differentiation spec's
    loose-form flag 1. History fixed in one paragraph: an inter-war dancing / salle de bal,
    single heavy chandelier, shuttered for decades, requisitioned by the sound systems for
    `la teuf du siècle` on 31 déc 1999. Proper noun is fictional/legal-safe (same principle
    as `commandant Ferrand` / `08 36`); the venue _type_ is Bertrand-confirmed and does not
    depend on the name — gate may rename. Location left loose (an old dancing at the edge of
    Paris) for the art/backdrop pass to pin.
  - **AC7 — gated scripts reused AS-IS.** `final_pre`/`final_post` (encounter spec §4) ship
    byte-for-byte. **No canon copy rewritten.** The venue is set up player-facing via three
    surfaces that are NOT the gated dialogue: the level-select title, the l'Éden interior
    backdrop behind the (frozen) briefing, and the mission itself.
  - **Two wiring drift flags (neither a copy change — both the "light adaptation" AC7
    anticipated):**
    - **A — keys/ids follow the level id.** The gated placeholder ids `final_pre`/`final_post`
      become `niveau-final_pre`/`niveau-final_post` (map key = level id; `narrativeSystem.test.ts`
      A2 enforces `scene.id === "<key>_pre/_post"`). French lines unchanged; only the id string.
    - **B — a `backdrop` is MANDATORY.** Test A5 requires every PRE/POST scene to carry
      `backdrop: "assets/levels/<key>/facade.png"` (ADR-0023); the gated §4 scripts specified
      none (predate the level). Wiring must add `assets/levels/niveau-final/facade.png` to both
      scenes — this is the new venue-interior art `dev-tooling-assets` generates. Required
      addition, not a copy change.
  - **Two questions to the gate (would touch gated copy — NOT resolved silently):**
    - **Q1** — name l'Éden inside the briefing dialogue? Recommendation: **no** (title +
      backdrop carry it; keep `final_pre` frozen at 8 lines). If the gate wants it spoken,
      that is a conscious amendment for a fresh PASS.
    - **Q2** — confirmed no other gated-copy drift: no gated line names or contradicts the
      hall, so hardening l'Éden needs zero rewrite.
  - **One-shot reveal discipline restated:** the `boss-harness` stays non-canon and out of
    `LEVELS` (ADR-0051 D4); the Commandant's name/embodiment/defeat and l'Éden appear on NO
    prior level (verified against shipped copy) — the reserved reveal is unspent. Reveal beats
    ordered on this single level (destination named → stakes+name → rule → embodiment →
    downbeat). Reveal line stays imageless until the Commandant sprite lands (Open Q3).
  - **Level-select words for `ux-designer` (words mine, surface his):** title `L'Éden`;
    subtitle `31 décembre 1999 · le dernier son du siècle`; one-field fallback
    `L'Éden — 31 déc. 1999` (mirrors the "Vitry — 94" convention). No other new player-facing
    string authored (AC7).
  - **Recommended level id `niveau-final`** (story's own example) — but the id is
    `senior-architect`/`dev-gameplay`'s call at TECH PLAN; the §5 keying follows it mechanically.
- Not decided (out of my lane): level id, pacing/quota/difficulty (Open Q1–2, `game-designer`),
  art-lane timing (Open Q3, `pm`+`lead`+`architect`), all mechanics/HUD/surfaces.
- handoff → `lead-game-designer` (Karim): design-gate PASS on §1 (venue) + §5 (wiring); rule
  Q1 (name in-dialogue? — I recommend no) + confirm Q2; ratify/amend the proper noun `l'Éden`;
  route the l'Éden interior backdrop request to the art flow when Open Q3 is resolved.
- handoff → `ux-designer` (Tony): level-select title/subtitle words (§4) — the surface is his.
- handoff → `game-designer` (Sacha): shared-terrain note — the venue name l'Éden and the
  §1.3 prop identities (lustre/enceintes/fumée, unchanged from the differentiation spec) are
  the canon the décor lever dresses; on conçoit ensemble, on livre séparément.
- Not yet a `VERDICT:` line — awaiting Karim's gate.
- File List:
  - `docs/game-design/spec-niveau-final-fiction.md` (NEW)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry appended)

## 2. DESIGN LOOP — ux-designer (Tony) — 2026-07-20

- claim: fresh-eyes UX pass on the Niveau Final live-ship — the level-select
  progression/unlock surface for the new flyer, the finale's onboarding (fairness vs.
  spoiler discipline for the boss reveal), accessibility carry-over onto the new level's
  surfaces, and the failure/retry loop on the hardest level. Explicitly did NOT respec
  the boss QTE's own on-screen legibility (`ux/spec-boss-qte-hp-read.md`,
  `ux/spec-boss-qte-differentiation-ux.md`) — both ship unchanged per the story's
  instruction.
- release: `docs/game-design/ux/spec-niveau-final-ux.md`. Headlines:
  - **Level-select (§1):** zero new UI. The niveau-final flyer is the 4th playable
    flyer through the already-gated `LevelFlyer`/`FlyerWall` (`flyer-wall-format.md`
    PASS 2026-07-19) — locked/unlocked states, touch target, device classes all
    inherited unchanged. Ruled OUT: any new "finale" badge/stamp/boss-reveal on the
    flyer itself (D3) — both a minimal-surface discipline call and a spoiler-discipline
    call (the reveal belongs inside the level, not on the menu a player skims first).
  - **Finale onboarding ruling (§2, the gate-critical call):** the already-gated
    `final_pre` narrative scene (`spec-boss-encounter-fiction.md` §4.1) IS the fairness
    mechanism required by `PROJECT_GUIDELINES.md` §5.6 (no ambush), and is sufficient
    AS WRITTEN — no new onboarding surface needed. Its line 6 already teaches the
    vulnerability rule diegetically ("il tire le premier, c'est là qu'il est à
    découvert") without naming the mechanic (no HP bar/phase/QTE vocabulary), reconciling
    the one-shot narrative reveal (line 4, the name) with the anti-bullshit fairness
    floor. A second, already-existing lead-time buffer (the boss's 2 s `ZOOMING`
    transition, unchanged) reinforces this for a player who skipped/skimmed the
    cutscene. Ruled OUT: any boss sprite/HP-bar preview/mechanic vocabulary before the
    encounter itself (menu, `final_pre` imagery, HUD-at-rest) — confirmed absent in the
    already-gated script.
  - **Accessibility carry-over (§3):** no new decision — every discipline (touch
    target, reduced-motion, keyboard roving focus, ADR-0015 device wording, not-colour-
    alone) already applies via reused components. Named a level-specific stage-5
    checklist (5 items) whose single most important entry is re-verifying the already-
    gated boss-QTE legibility acceptance captures (A1-A15 of
    `ux/spec-boss-qte-differentiation-ux.md`) against the NEW venue backdrop/anchor —
    a legibility guarantee proven on the harness's backdrop is not automatically true
    on the live level's.
  - **Failure/retry loop (§4):** reused pattern, unchanged — a boss loss renders the
    same generic `EndScreen` (`GAME_OVER` phase) every other level failure already uses;
    no boss-specific failure copy. No mid-level checkpoint at the boss (falls out of
    ADR-0051 D3, confirmed not reopened) — a lost fight means a full level replay from
    the top, bounded by the standing 3-5 min mission ceiling like any other level.
    Flagged (not decided) to `game-designer`: the felt retry cost scales with however
    long Open Question 1's pre-boss quota lands.
- Not yet logged as a `VERDICT:` line — awaiting `lead-game-designer` design gate
  alongside `game-designer`'s pacing spec and `narrative-designer`'s venue/script
  wiring, per the story's Definition of Done.
- handoff → `lead-game-designer` (Karim): design gate on this spec jointly with the
  parallel `game-designer`/`narrative-designer` specs.
- handoff → `narrative-designer` (Yasmine): the `PLAYABLE_COPY` entry for the
  niveau-final flyer (crew/slogan/date/zone/rv/info lines) and confirmation that
  `final_pre`/`final_post` need no adaptation beyond the concrete id/anchor (AC7) and
  introduce no input-instruction copy (ADR-0015 check, §3).
- handoff → `game-designer` (Sacha): D11 flag — pre-boss quota/pacing (Open Q1-2)
  determines the retry loop's felt cost; numbers are his, the no-checkpoint floor is
  confirmed reused here.
- release (self, closing this claim): no further UX work pending on this spec until
  the design gate; will review the built screens (flyer, onboarding flow, retry loop)
  against this spec's acceptance criteria at stage-5 `verify` on both device classes.
- File List:
  - `docs/game-design/ux/spec-niveau-final-ux.md` (NEW)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry, appended)

---

## Pre-ruling — Commandant headgear / plainclothes register (lead-art, Nico) · 2026-07-20

**Decision: OPTION (1)** — period-correct plainclothes-BAC swap. Drop the tall peaked
officer's cap; the Commandant is **bare-headed**. This is shared DNA across all 7
human-figure prompts.

**Reasoning (anchored in the bible, not taste):**

1. **Silhouette-first (§2 law 3) FAVOURS the swap, it does not resist it.** The n°1 "chef"
   tell is already the **long knee-length overcoat** — no other roster member has it
   (mook = hip jacket, `enemy_riot` = armour/shield/helmet, `enemy_biker` = crash helmet).
   The peaked cap is a _weak, colliding_ secondary tell: at game size a flat mook cap and a
   peaked officer's cap both read as the same "capped-head bump" — the draft's own
   differentiator ("distincte par sa hauteur/rigidité") is a fine detail that does NOT
   survive silhouette-first. A **bare head is a STRONGER differentiator**: the Commandant
   becomes the _only_ uncovered head in a roster that is otherwise uniformly capped or
   helmeted. Bare head + long coat contrasts harder against the whole cop-family than
   cap + long coat. Silhouette clarity is _gained_ by (1), not spent.

2. **Family/fiction coherence — the cap imports the wrong DNA.** The gated fiction
   (spec-boss-encounter-fiction.md §1.1, §2) makes him the apex of the **BAC de nuit**
   (plainclothes) and _hard-forbids_ the CRS register ("PAS de CRS", "pas la tenue
   anti-émeute"). A ceremonial peaked cap + grande-tenue is commissaire/CRS-parade
   iconography — it pulls his silhouette toward `enemy_riot`'s register, blurring the exact
   contrast the fiche demands. Period grounding (La Haine 1995 BAC: blouson/trench,
   brassard POLICE, bare-headed) is culturally correct for 1998 Paris night-plainclothes.

3. **Villain-iconography (option 2's case) does not survive.** The "iconic apex villain"
   read is fully carried by the towering stature + squared shoulders + long flaring coat;
   the cap is redundant to it and actively costs the two things above. The Prohibition-ST
   "iconic not accurate" licence buys nothing here because the icon is the coat, not the
   headgear.

**The bible decides this — no Bertrand escalation.** §2 law 3 (silhouette) and §2 law 2
(family) + the gated fiche converge; this is not the pure-taste case that would defer.

**Consequence — regeneration cost is ZERO.** The 4 V1 poses are committed to
`levelArt.json` (`boss` block) but **never generated** — `public/assets/boss/` does not
exist, no PNG has ever landed the asset gate. So the 4 V1 prompts get **redrafted in the
same batch** as the 5 differentiation reads with zero throwaway. All 7 figures carry the
shared bare-headed plainclothes-BAC DNA.

**Redraft directives for concept-artist (Maud) — mandatory in the redraft, NOT authored here:**

- Register per figure: dark **blouson OR trench/gabardine** (long-coat silhouette is
  correct and preserved — only the _cap_ is wrong), **bare-headed**, **brassard** over the
  sleeve, reversible-lining **POLICE** reflective lettering as the plainclothes tell.
  Sidearm stays a generic boxy period pistol (no named/modern weapon, §3.7).
- **Shoulder-clipped radio/mic bump** on every pose — it is the finisher-reach set-up and
  it replaces the cap as the authority micro-tell.
- **`commander_hit` / `commander_down` must NOT key their defeat beat off a flying cap**
  (there is no cap now). Re-key the "authority defeated" beat onto: the **brassard torn
  loose**, the **shoulder radio/mic knocked free**, and the **dropped pistol** (already in
  the down pose). This is a real redraft requirement, not cosmetic.
- Style tail unchanged (still the live roster tail per §2 law 2); this ruling is about the
  subject clause's headgear/register only, not the style-migration timing question (that
  stays open at the prompt gate).

Prompts remain OWED and un-gated: this is a pre-ruling to prevent a rework round, NOT a
prompt-gate PASS. Maud drafts the 7 subject clauses on this DNA; they come back to me at
the prompt gate.

RULING: (1) — commandant headgear (lead-art)

---

## `game-designer` (Sacha) — DESIGN LOOP: level pacing + live `bossQteSpec` data (OQ1/OQ2 + seed)

- **When:** 2026-07-20 · **Stage:** 1 (DESIGN LOOP) · **Claim → Release** in one pass.
- **CLAIM:** the level-design Open Questions this story hands me — **OQ1** (level length / quota
  shape before the boss) and **OQ2** (difficulty placement) — plus the live `bossQteSpec` **data**
  the story reserves to the design loop (values, décor prop siting, seed policy). Written on
  Bertrand's two intake DECISIONS: **OQ4 venue CONFIRMED** = the squatted grand hall
  (`spec-boss-differentiation-fiction.md`), and **OQ3 → full art lane opens now** (spec assumes
  canon art will exist, ships behind procedural fallbacks until generation lands).
- **DELIVERED:** `docs/game-design/spec-boss-niveau-final-level.md` (DRAFT — needs Karim PASS).
  Headline numbers and rulings:
  - **Pre-boss pacing (OQ1/OQ2), vs. the shipped curve** (belliard 1.0/10/90 · stalingrad
    1.3/12/80 · vitry 1.6/15/70): **`enemySpeedMultiplier: 1.8`** (continue the curve but +0.2 not
    the mechanical +0.3 — the boss carries the climax, don't over-grind lives on the approach),
    **`enemiesToWin: 16`** (one notch over Vitry, a REAL quota — **not** the harness `0`
    instant-trigger — so the boss fires on the real quota crossing, **AC4**; only +1 because the
    boss is the length payload, KISS 3–5 min), **`timeSeconds: 70`** (HOLD Vitry's timer, break the
    −10 descent — 16/70 = 4.4 s/kill is still tighter than Vitry's 4.7, but 60 s would clock-ambush
    the finale before it triggers, §5.6/AC4). Monotonically the hardest level on every axis, each
    step deliberately modest.
  - **Spawn cadence:** no per-level spawn-interval field exists (cadence is a system function of
    speed + wave); I tune the **mix** via `roster.windowWeights` — `{ normal 40, riot 28, biker 20,
bonus 10 }` (riot-heavy: 2-HP CRS `enemy_riot` is the thematic finale enemy and the honest
    source of "harder without a new mechanic"; bonus kept as the time valve). `hostage_taker`/
    `civilian` stay weight-0 → **AC1** (no hostage anything) by construction.
  - **Delivery:** one delivery, HELD at ≈ Vitry (truck, integrity 60, window 6 s, bonus 300, trigger
    18 s) — not tightened (one-variable discipline; escalation is elsewhere). Vehicle type / diegetic
    framing → Yasmine.
  - **Live `bossQteSpec` DATA** (re-anchored/re-seeded copy of the ADR-0051/0052 tuned values, NOT a
    retune): `zoomSeconds 2` · `anchor {0,-5}` (centred hall tableau; `x` may nudge once the backdrop
    lands, Vitry `x:9.9` precedent) · **`phaseCount 3` / `bossHp 24` / `maxBlownWindows 10` — all
    UNCHANGED** · **`decorProp` re-sited to the hall CHANDELIER** `{ position {0.2,1.5}, armPhaseIndex
1 }` (overhead drop-burst read; the mur d'enceintes is the reserved 2nd prop — authoring two needs
    the `decorProps[]` type promotion = correct-course, not now).
  - **Seed policy:** a **PINNED, WINNABLE, stage-5-RE-VERIFIED** seed — provisional **`19991231`**
    (the level's diegetic date), NOT per-run. Justified vs. precedent: every shipped QTE pins its seed;
    a per-run seed is architecturally illegal (needs runtime randomness the determinism law forbids)
    AND cannot carry the §5.6 winnability guarantee (a random seed can deal an un-landable window =
    mort bullshit). K-5 obligation: re-verify landability on each ring / each charged window / the décor
    arm-window at `verify`, or re-pin — **most likely correction at stage-5**.
  - **AC5 correct-course discipline:** listed every system-tuning temptation (bump bossHp/maxBlownWindows,
    touch the phase table, retune charged cadence/renfort count, add a 2nd décor prop, add a spawn-interval
    field) as a **correct-course flag, not a spec line** — only the seed is re-authored freely by design.
- **RELEASE.** Handoffs from this deliverable:
  - → `lead-game-designer` (Karim): DESIGN GATE — `VERDICT:` on OQ1/OQ2 (§1), the `bossQteSpec` data +
    seed policy (§2), difficulty placement (§3), AC5 discipline (§4), before pm re-review (AC9) + TECH PLAN.
  - → `narrative-designer` (Yasmine): AC7 wiring of the gated `final_pre`/`final_post` to the level id;
    the finale delivery's vehicle type + diegetic framing ("livre le son to the hall").
  - → `ux-designer` (Tony): unlock SURFACE (flyer-stack "final" framing; logic reuses the index hop) +
    fresh-eyes legibility of the boss beat inside a full level, both device classes.
  - → `lead-art` (Maud) / `concept-artist`: venue backdrop art (new environment, per Bertrand's OQ3) —
    I spec the READ (clean boss tableau at `anchor {0,-5}`, legible shootable overhead chandelier at
    `{0.2,1.5}`, hall openings host the window-cops); ship behind procedural fallbacks until the 9
    canon assets land. Framing dependency I own back: confirm `anchor.x` needs no nudge once the
    backdrop lands.
  - → `senior-architect` (Winston): TECH PLAN — data + narrative wiring only, confirm AC1–AC5 vs. real code.
- **No `VERDICT:` line yet** — this is the DESIGN deliverable; Karim's gate is pending.
- **File List:**
  - `docs/game-design/spec-boss-niveau-final-level.md` (NEW — this deliverable)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry appended)

---

## DESIGN GATE — lead-game-designer (Karim) — 2026-07-20

- **Claim:** gate the three parallel design-loop deliverables for STORY-BOSS-NIVEAU-FINAL-LIVE
  (`spec-boss-niveau-final-level.md` / `spec-niveau-final-fiction.md` / `ux/spec-niveau-final-ux.md`)
  against the story's 10 ACs, the gated ADR-0051/0052 boss contract, `PROJECT_GUIDELINES.md`
  (curve law, 3-5 min ceiling, §5.6), and my own gated `spec-boss-qte-differentiation.md`.
  Verified the load-bearing claims against **real code** (`levels.ts`, `stateMachine.ts`,
  `enemyTypes.ts`), not on the specs' word.

### Verified against real code (adversarial leg)

- **AC5 — value-for-value copy CONFIRMED.** Harness `BOSS_QTE_DEV_HARNESS_LEVEL.bossQteSpec`
  (`levels.ts:234-247`) = `{ zoomSeconds 2, anchor {0,-5}, phaseCount 3, bossHp 24,
maxBlownWindows 10, targetSeed 20260719, decorProp {1.4,0.2} armPhaseIndex 1 }`. The
  niveau-final spec authors the **identical combat block** — zoom/phase/HP/maxBlown/anchor all
  byte-equal — changing **only** `targetSeed → 19991231` (K-5 re-pin) and `decorProp → {0.2,1.5}`
  (chandelier re-site, `armPhaseIndex 1` unchanged). These are exactly the two re-authorings AC5
  permits; **no system value smuggled in as data.** PASS.
- **AC1 — mutual exclusion by construction CONFIRMED.** `stateMachine.ts:100-104` throws at load
  if a level authors both `hostageQte` and `bossQteSpec`. The niveau-final entry authors **no**
  `hostageQte`. `windowWeights {normal 40, riot 28, biker 20, bonus 10}` merges as
  `{...defaults, ...overrides}`; `civilian`/`hostage_taker` carry default `weight 0`
  (`enemyTypes.ts:110,139`) and are not overridden, so they stay out of the pool. PASS.
- **AC4 — real quota-crossing trigger CONFIRMED.** `enemiesToWin: 16` (non-zero, not the harness
  `0` instant-trigger). `stateMachine.ts:439` shows `newKills >= enemiesToWin && bossQteSpec ===
null ? LEVEL_COMPLETE : PLAYING` — a non-null `bossQteSpec` suppresses the instant complete and
  routes the quota crossing into `shouldTriggerBossQte`. The boss fires as the terminal beat on a
  real gallery, not an ambush. PASS.
- **Curve coherence CONFIRMED.** Shipped `levels.ts`: belliard 1.0/10/90, stalingrad 1.3/12/80,
  vitry 1.6/15/70. Sacha's 1.8/16/70 is monotonic-hardest on every axis (speed ↑, quota ↑,
  4.4 s/kill tighter than Vitry's 4.7, timer not looser).

### Per-deliverable verdicts

**1. `spec-boss-niveau-final-level.md` (Sacha) — PASS.**

- Scope: no undeclared extension. The level is already-committed roadmap (§7/§10, no test owed);
  the boss going live is the ratified ADR-0051 K2 extension; `windowWeights` + `decorProp` re-site
  are existing additive/optional fields re-authored per venue, not new mechanics. Core loop served
  (pre-boss plays the loop; boss stays terminal on `Livrer`, folded into nothing).
- The +0.2 (not +0.3) speed step and the **broken −10 timer descent (70 held vs. 60)** are
  JUSTIFIED, not oversights: 16 kills at 1.8 in 60 s would clock-ambush the finale before it
  triggers — the exact §5.6/AC4 failure. The disjoint-economy thesis (§0: street `lives`/`timer`
  vs. boss `blownWindows`, decoupled by the freeze) is sound and grounds the whole pacing shape.
- `decorProp` chandelier re-site {0.2,1.5} overhead is spatially coherent with fiction §1.3
  ("faire tomber l'ancien monde sur le flic") and clears the two rings + parry point. The
  `mur d'enceintes`-as-reserved-2nd-prop → `decorProps[]` promotion held correctly as a
  correct-course (§4), not smuggled in. AC5 §4 discipline is exemplary — every system-tuning
  temptation logged as a correct-course flag, only the seed re-authored freely (by K-5 design).
- Verifiability: stage-5 AC-L1..L6 are concrete for qa-lead; the K-5 seed re-verify (AC-L5) is the
  sharpest, with a real precedent (Vitry 19940714→15).
- Advisories (non-blocking): (a) preamble over-reads OQ3 (art-lane timing) as "Bertrand DECIDED" —
  it was NOT (Bertrand's intake named the boss-in-stage, not the 9-asset lane; the story reserves
  OQ3 as a pm+lead+architect joint call). Changes **no** design value (the level ships on
  procedural fallbacks regardless), so non-blocking — reword the preamble; I resolve OQ3 below.
  (b) `anchor.x` nudge = tracked art-dependency at verify (Vitry x:9.9 precedent). (c) riot-density
  × 4.4 s/kill is the sharpest stage-5 playtest risk (2-HP CRS density can bite harder than the raw
  s/kill implies). (d) provisional seed `19991231` = pre-declared most-likely stage-5 correction.

**2. `spec-niveau-final-fiction.md` (Yasmine) — PASS.**

- `final_pre`/`final_post` reused **byte-for-byte** — the frozen-copy / one-shot-reveal discipline
  is held. Venue hardened coherently (l'Éden, one paragraph of history, period-authentic). Wiring
  flags A (id rename `final_pre`→`niveau-final_pre`, req'd by test A2) and B (mandatory `backdrop`
  path, req'd by test A5) are correctly classified as the "light adaptation" AC7 anticipated —
  **BUILD work, not copy drift.** Flyer copy (SPIRALE 23 · KANAL SYSTEM · NADIR 94 / LE DERNIER SON
  DU SIÈCLE / L'ÉDEN · ANCIEN DANCING) is spoiler-clean (names the teuf + venue, never the boss),
  coherent with ux's no-badge D3.
- **RULINGS delivered** (below): Q1 = NO; Q2 = confirmed; l'Éden RATIFIED.
- No corrections.

**3. `ux/spec-niveau-final-ux.md` (Tony) — PASS.**

- Zero new UI (4th flyer through the gated `LevelFlyer`/`FlyerWall`, index-hop unlock reused). The
  D5 ruling — the already-gated `final_pre` IS the §5.6 fairness mechanism (plays at level start,
  line 6 teaches the vulnerability window diegetically without mechanic vocab, + the 2 s `ZOOMING`
  buffer) — is sound and reconciles the one-shot reveal with the anti-ambush floor. D3 no-badge is
  both a minimal-surface and a spoiler-discipline call, coherent with the fiction. Retry loop =
  reused `EndScreen` + no boss checkpoint (falls out of ADR-0051 D3, not reopened).
- Stage-5 checklist (§3.1, 5 items) is concrete for qa-lead; the **legibility re-verify on the NEW
  backdrop** (re-run A1-A15 of the differentiation-ux captures against the l'Éden backdrop +
  re-anchored position) is the correctly-identified highest-value level-specific check.
- Advisory (non-blocking): make the **boss-loss→retry FELT cost** an explicit verify-leg capture
  (D11) — the ~70 s street replay before each boss retry is the single biggest frustration risk and
  is only answerable in playtest.

### Rulings (gate owner)

- **Q1 — name l'Éden inside the briefing dialogue? RULED: NO (uphold Yasmine's recommendation).**
  `final_pre` is frozen gated copy already at 8 lines (top of the 5-9 bound); the venue is carried
  player-facing by three non-dialogue surfaces (level-select title `L'Éden`, flyer zoneLine, and
  the interior backdrop the scene plays over). Speaking the name would (i) require a conscious
  amendment to gated copy + a fresh PASS + a rework round, (ii) violate the zine rule "name it,
  don't narrate it" (§1.1) by pointing at the Éden/ruin irony the scene deliberately leaves for the
  player to catch, and (iii) spend budget for zero fairness gain (§5.6 is satisfied by #6's
  vulnerability line, which is untouched). Keep `final_pre` frozen.
- **Q2 — other gated-copy drift? CONFIRMED none.** No gated line names or contradicts the hall;
  hardening l'Éden needs zero rewrite.
- **Proper noun `l'Éden` — RATIFIED.** Legal-safe (generic inter-war dancing name, same principle
  as commandant Ferrand / `08 36`); the venue TYPE is the Bertrand-confirmed canon and is
  independent of the name (renamable later without cost).
- **OQ3 (art-lane timing) — design-half RULED, timing routed to the joint call.** Sacha's
  preamble over-attributed this to Bertrand; it is a pm+lead+architect joint call. My design-side
  ruling: **decouple.** The venue **backdrop** is MANDATORY regardless of OQ3 (every level needs a
  facade; test A5 requires the `facade.png` path) — it opens by necessity, not as an OQ3 outcome.
  The **9 canon boss assets** (4 `commander_*` poses + 5 differentiation reads, already batched
  under Nico's headgear pre-ruling at zero regen cost) should open as a **PARALLEL, non-blocking**
  art lane landing before this story's stage-6 panel, NOT before dev starts — the level ships on
  the already-stage-5-verified procedural fallbacks meanwhile. Routing the velocity-vs-"finished
  finale" trade-off to `pm` + `senior-architect` for ratification; my recommendation is
  parallel-non-blocking. No design value depends on the outcome.
- **OQ4 (venue) — CLOSED, ratified via Yasmine's routing** (Bertrand-confirmed squatted grand hall;
  chandelier-hall was already RATIFIED as a loose extension at the differentiation gate). OQ5
  (BUILD-vs-ADR-0052-merge sequencing, AC8) is **not** a design decision — it stays `producer`'s
  dependency gate / `senior-architect`'s compress call; the design gate does not block on it.

### Cross-lane coherence flags (forward, not arbitrated here)

- → `lead-art` (prompt gate): (i) the l'Éden backdrop must frame a clean centred tableau at
  `anchor {0,-5}` with **no dead sky-gap behind the boss** (Vitry x:9.9 precedent) AND a legible,
  shootable, boss-distinct **chandelier** at `{0.2,1.5}` anchor-relative; (ii) the **mur
  d'enceintes** is canon set-dressing but the RESERVED 2nd décor prop — it must NOT read as a
  shootable/interactive false-affordance in V1 (same class as the ADR-0045 C2 car-roofline
  condition). These are prompt-gate coherence constraints, not visual arbitration.
- Riot-heavy street ↔ CRS renfort ↔ BAC boss: coherent and SHARPENING — the CRS-heavy gallery +
  CRS renfort that "doesn't cover him" reinforces « il n'a plus personne pour le couvrir »; the
  plainclothes BAC apex stays distinct (headgear ruling upheld).

### Overall

**Design gate PASS on the set** — the three specs are mutually coherent, in-scope, verifiable, and
AC1/AC4/AC5-clean against real code. **No blocking corrections.** Advisories are verify-leg /
art-flow / joint-call items tracked above. Downstream unblocked: `pm` re-review (AC9) → TECH PLAN
(`senior-architect`, data + narrative wiring only, confirm AC1-AC5 vs. real code) → `producer`'s
AC8 sequencing gate before dev lanes touch `levels.ts`/`bossQteSystem.ts`.

VERDICT: PASS — design gate spec-boss-niveau-final-level (lead-game-designer)
VERDICT: PASS — design gate spec-niveau-final-fiction (lead-game-designer)
VERDICT: PASS — design gate ux/spec-niveau-final-ux (lead-game-designer)

- **File List:**
  - `docs/game-design/README.md` (index — three new specs recorded under In flight / gated)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this gate entry appended)

---

## ART LANE — concept-artist (Maud) — 2026-07-20 · canon boss 9-asset prompt family (REDRAFT + 5 new)

- claim: author the FULL 9-asset canon prompt family for « le Commandant » + the two Niveau-Final
  hall props, on lead-art RULING (1) (bare-headed plainclothes-BAC, no peaked cap, defeat re-keyed
  off brassard/radio/pistol) and art-advisor Estelle's advisory (relayed in the boss art-lane
  brief). I own ONLY the `prompt` + `style` strings; structure/ids/paths/seeds/anchors are
  `dev-tooling-assets`.
- release — the 9 entries (one-line silhouette read each):
  1. `commander_shielded` (V1 redraft, APPLIED) — bare head, long coat, brassard + shoulder radio,
     halt-hand up + hand on holstered boxy sidearm: closed, commanding, arm not presented = untouchable.
  2. `commander_exposed` (V1 redraft, APPLIED) — lunging one stride out, both arms thrust forward
     presenting the pistol + muzzle flash, coat flaring: EXPOSED phase-1 single-ring window.
  3. `commander_hit` (V1 redraft, APPLIED) — staggered back, brassard torn loose + shoulder radio
     knocked spinning off + pistol arm falling loose: authority-defeated re-keyed off the tells, NOT a cap.
  4. `commander_down` (V1 redraft, APPLIED) — sprawled on his back, coat splayed, torn brassard +
     knocked-loose radio + dropped pistol beside him: motionless, already vaincu.
  5. `commander_weakpoint` (NEW, READY-FOR-STRUCTURE) — square, still, frontal, chin up, torso squared
     flat, arms held wide, pistol low & clear of the chest: BOTH anatomy bands clean for the phase-2+
     two-ring callout (render rings do the callout; the sprite only keeps the bands clean).
  6. `commander_parry_windup` (NEW, READY-FOR-STRUCTURE) — coiled a beat earlier than exposed, elbows
     bent + arms drawn IN, pistol angled steeply up mid-raise (still short of aim), shoulders hunched:
     the categorically-distinct charged/parry tell (arms-IN vs exposed's arms-EXTENDED).
  7. `commander_finisher` (NEW, READY-FOR-STRUCTURE) — down on one knee, coat pooling, upright from
     the waist, head UP, one free hand reaching up for the shoulder radio: still-trying, NOT dead
     (distinct from `down`); tone guardrail held (no blood/grimace/weapon-at-him).
  8. `lustre` (NEW prop, READY-FOR-STRUCTURE) — multi-tier cone/umbrella crystal chandelier HUNG from
     a chain, wrought-iron/brass armature w/ suggested spokes, one drop missing + tilted + dusty:
     reads « au bâtiment / ancien monde », asymmetric damage not rubble, not a mirror-ball.
  9. `speaker_wall` (NEW prop, READY-FOR-STRUCTURE) — hand-built teknival pyramid of mismatched
     plywood bass-bins + horn cabinets on a scaffold/pallet rig, gaffered cables, a sprayed pochoir
     spiral mark: reads BUILT « au crew / le son », not a line-array/DJ-booth/guitar-amp.
- File List:
  - `src/game/levels/levelArt.json` (boss block: 4 V1 `prompt` strings redrafted to bare-headed +
    brassard/radio defeat keys; `$comment` silhouette-DNA clause corrected cap→bare-headed + poses
    note; `style` tail UNCHANGED — factored once, verbatim from the live roster).
  - `docs/art-direction/prompt-drafts/boss-commander.md` (full redraft: RULING + Estelle advisory
    integrated; shared style tail factored once; 9 entries with per-clause rationale; the 5 new ones
    marked READY-FOR-STRUCTURE for `dev-tooling-assets`).
- lint: `node scripts/check-art-prompts.mjs` → **PASSED — no contract errors (12 pre-existing warnings,
  courier + nearForeground/bench; none from the boss block, which is out of the lint's scope so its
  contract — ≤2 negations, positive shape language, subject-only, no baked colour — is held by hand:
  every subject 0 negations, assembled 2, all 9 assembled under the 120-word hard ceiling, 109-115w).**
- Deviations from Estelle's advisory (flagged for the gate):
  1. **« POLICE » reflective lettering → rendered as a reflective armband/panel SHAPE, not glyphs.**
     The shared tail carries `no text` (house law §3.8) and FLUX-schnell garbles text at 256px
     (a generation defect = set FAIL, §2 law 3). The brassard + reflective panel carry the
     plainclothes-cop read by silhouette; the literal word would not survive game-size anyway.
     Confirm at the gate, or consciously amend `no text` to attempt lettering.
  2. **Props share the boss `style` tail verbatim** (which says « figure's limbs and gear ») rather
     than a prop-specific tail — forking would break Family consistency (§2 law 2: the tableau is one
     printing). The « figure » wording is inert for FLUX (it keys on black ground + pixel medium +
     grey/white/pale-neon tones + centered, all valid for an object). If lead-art wants « figure » →
     « figure or object », that is a roster-wide tail change, not a local fork — flagged to the gate.
- handoff → `game-graphist` (PRE-PROD PASS: readability at game size, keying soundness) →
  `lead-art` (Nico) PROMPT GATE. Open items for the gate listed in the draft shard §"Reste à trancher"
  (the 2 deviations above + style-migration timing + the render-side anchors dev-tooling owns:
  `muzzle` on exposed, `parryPoint` on parry_windup, VITAL/LIMB rings on weakpoint).
- Not a `VERDICT:` line — prompts remain OWED and un-gated; this is the concept-artist draft, gated next.

---

## AC9 RE-REVIEW — pm (John) — 2026-07-20

- **claim:** the story's own AC9 scope re-check (mirroring both prior stories' AC7 pattern) on
  the three design-gate-PASSed deliverables (`spec-boss-niveau-final-level.md`,
  `spec-niveau-final-fiction.md`, `ux/spec-niveau-final-ux.md`), before `senior-architect` cuts
  dev lanes at TECH PLAN. Read all three gated specs, the story's 10 ACs, and Karim's design-gate
  entry (verified against real code) in full.

### Scope-drift check — CLEAR

No drift into a second boss, a mini-boss tier, hostage retuning, or new boss mechanics/tuning.
All three specs stay minimal-level + data-only + zero-new-UI:

- **Level spec:** authors only `LevelConfig` data into the frozen `BossQteSpec` shape
  (re-anchor/re-seed/re-site the chandelier); every system-tuning temptation is explicitly logged
  as a correct-course flag, never a spec line (§4). `windowWeights` civilian/hostage_taker stay
  weight-0 by construction (AC1).
- **Fiction spec:** `final_pre`/`final_post` reused byte-for-byte; the only additions are one
  paragraph of venue history (fiction, not mechanic, already gate-ratified) and pure wiring (id
  key, mandatory backdrop path).
- **UX spec:** zero new UI — D3 explicitly rules out a "finale" badge, D5 rules the existing
  `final_pre` sufficient without a new onboarding surface, D9/D10 reuse `EndScreen`/no checkpoint
  verbatim.

Karim's gate independently verified AC1/AC4/AC5 against real code (`levels.ts`, `stateMachine.ts`,
`enemyTypes.ts`) rather than taking the specs' word — concur with that verification on inspection.

### AC1–AC8 coverage in the gated specs

AC1 (mutual exclusion), AC3 (harness untouched), AC4 (real quota-crossing trigger), AC5 (no
`bossQteSystem.ts`/`types/bossQte.ts` touch) — fully covered and code-verified. AC2 (existing
levels byte-untouched) — implicit-but-present, stated in the level spec's Appendix note. AC7
(narrative wiring) — fully covered: flags A/B ruled wiring not copy drift (test-invariant-driven
id rename + mandatory `backdrop` path), Q1 ruled NO, Q2 confirmed no drift, l'Éden ratified. AC6
(ADR) and AC8 (sequencing gate) are correctly **not** resolved by the design specs — that is
`senior-architect`'s (TECH PLAN) and `producer`'s job respectively, not a design-loop gap.

### l'Éden naming + flyer copy — spoiler-clean, confirmed inside AC7's "light adaptation" line

Flyer copy (fiction spec §4.1) names the teuf and the venue, never le Commandant — confirmed
against `ux` D3's independent no-boss-reveal-on-the-menu ruling. Yasmine's flags A (scene-key
rename to `niveau-final_pre`/`_post`, required by `narrativeSystem.test.ts` A2) and B (mandatory
`backdrop` path, required by test A5) are mechanical wiring forced by existing test invariants —
not one French line of the gated `final_pre`/`final_post` copy changes. Confirmed: wiring, not
copy drift.

### Advisory routing — 6 items, none became silent scope

1. **Preamble over-read of OQ3 (Karim's advisory a).** This advisory is itself factually off —
   see Record correction, below. Routed as a correction to the story record; zero design-value
   impact either way (the level ships on procedural fallbacks regardless, per Karim's own note).
2. **`anchor.x` nudge** (Vitry `x:9.9` precedent) — tracked art-dependency, routed to stage-5
   verify + `lead-art`/`game-designer`. Within the already-authorized re-anchor discretion
   (AC5 permits re-authoring `anchor`).
3. **Riot-density × 4.4 s/kill playtest risk** — routed to Sacha's own stage-5 playtest
   (AC-L2/AC-L5). `windowWeights` explicitly marked "tunable at verify," not a system change.
4. **Provisional seed `19991231`** — routed to the K-5 re-verify at stage-5 (§2.3); re-pinning a
   seed is explicitly the one value authored freely by design (not a correct-course).
5. **D11 — boss-loss retry felt-cost** — routed to a stage-5 verify-leg capture; no new decision,
   the no-checkpoint floor stands as reused (D10).
6. **Cross-lane coherence flags to `lead-art`'s prompt gate** (backdrop framing/chandelier
   legibility at `anchor {0,-5}`; the mur d'enceintes must NOT read as a shootable false
   affordance) — these are prompt-gate constraints that actively guard AGAINST scope creep
   (they keep the reserved 2nd décor prop from smuggling in as interactive without the
   `decorProps[]` type promotion), not new scope themselves.

None of the six became silent scope: each routes to a named owner and a named stage (mostly
stage-5 verify), consistent with AC5's correct-course discipline.

### Record correction — Karim's advisory (a) was itself mistaken

Karim's gate flagged the level spec's preamble ("Bertrand DECIDED... OQ3 → FULL ART LANE OPENS
NOW") as an over-read of the intake message, non-blocking. **That characterization is wrong.**
Bertrand made two explicit decisions during the same intake session, not one inference stretched
across two questions: he confirmed the venue (OQ4) **and**, via a direct question put to him
separately, decided "Lane art complète maintenant" — opening the full 9-asset art lane now, in
parallel (not before dev starts) — which is OQ3. Both are real INTAKE decisions. `game-designer`'s
spec was correctly written on them; the design-gate advisory that called this an over-read is the
one that needs correcting, not the spec. This does not reopen or downgrade Karim's PASS verdicts
(the design content is unaffected either way, as Karim himself noted) — it corrects the shard's
record of _why_ OQ3/OQ4 read as resolved.

### Story amendment (my artifact)

The story file (`_bmad-output/planning-artifacts/story-boss-niveau-final-live.md`) still framed
Open Questions 3 and 4 as open/undecided, which was accurate at the time of writing but stale now
that both were resolved at intake. Appended a one-line **RESOLVED** note to each open question
(surgical addition, original reasoning left intact for the record):

- **OQ3 (art-lane timing):** RESOLVED — Bertrand's direct-question decision, "Lane art complète
  maintenant," full 9-asset lane open now, in parallel. Also notes the correction to Karim's
  advisory (a), above.
- **OQ4 (canon-venue confirmation):** RESOLVED — Bertrand confirmed the squatted grand hall as
  canon in the same intake session; `narrative-designer` has since hardened it as l'Éden,
  design-gate ratified.

### AC8 sequencing gate — reaffirmed, still the operative constraint

Per the standing dependency gate: `story-boss-qte-differentiation` is deep in its own stage-5
(leg-1 PASS, evidence complete, leg-2 running) — **not yet MERGE-cleared through its stage-6
review panel on `main`.** AC8 is unaffected by this AC9 pass and remains binding: `senior-architect`
may run TECH PLAN itself (architecture/lane-cutting work, ADR drafting) now, but **no dev lane
touching `levels.ts`/`bossQteSystem.ts` may start** until `producer` confirms ADR-0052's stage-6
panel has MERGE-cleared on `main`, or an explicit, logged compression decision from Bertrand/`pm`.

### Verdict

**CLEARED FOR TECH PLAN.** No blocking violations found: scope holds, AC1–AC5/AC7 are covered and
code-verified, AC6/AC8 are correctly deferred (not gaps), l'Éden + flyer copy are spoiler-clean and
inside AC7's light-adaptation line, and all 6 gate advisories route to a named owner without
becoming silent scope. Two amendments logged against the story's own record (OQ3/OQ4 RESOLVED
notes) and one correction logged against the gate's record (advisory (a)). `senior-architect` may
proceed to TECH PLAN; the AC8 dev-lane gate stays open pending `producer`'s ADR-0052 merge chase.

VERDICT: CLEARED FOR TECH PLAN — AC9 re-review (pm)

- handoff → `senior-architect` (Winston): TECH PLAN — architecture directive holds (data +
  narrative wiring only against the frozen ADR-0051/0052 contract); confirm AC1–AC5 against real
  code independently of Karim's read; draft the new ADR (AC6); **do not green-light dev lanes on
  `levels.ts`/`bossQteSystem.ts`** until `producer` confirms the AC8 gate.
- handoff → `producer` (Marion): AC8 dependency-gate chase continues — ADR-0052 stage-5 leg-2 is
  running, stage-6 panel not yet started; allocate the new ADR number at TECH PLAN per the
  standing rule (not self-allocated).
- File List:
  - `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md` (AMENDED — two RESOLVED
    notes appended to Open Questions 3 and 4)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this AC9 entry appended)

---

## PRE-PROD PASS — game-graphist (Serge) — 2026-07-20 · boss-commander 9-asset prompt family

Read: `docs/art-direction/prompt-drafts/boss-commander.md` (full redraft), the boss block landed in
`src/game/levels/levelArt.json` (4 applied prompts, shared `size` 256×256 for the whole block),
`src/render/scene/BossQteSprite.tsx` (`BOSS_W`/`BOSS_H` = 2.2 world units, a touch bigger than the
hostage captor's 2.0 — this is a cinematic zoom-and-hold tableau, NOT the small window-pop size of
a mook; still, a generated 256px canvas gets downscaled/held at whatever the zoom settles to, so
interior linework stays ornamental and silhouette/value stays load-bearing exactly as for every
other set), and `docs/art-direction.md` §2 laws 1-3 (keying discipline, the hole-audit trap named
explicitly: "dark clothing eaten by the near-black key").

**Structural note before the per-entry pass:** every one of the 7 figures repeats "dark overcoat" /
"long knee-length dark overcoat" in the subject clause while the shared `style` tail asserts "light
grey white and pale neon tones figure." That is a direct value contradiction FLUX will resolve
unpredictably — and it is _exactly_ the dark-clothing-vs-near-black-key trap the hole-audit exists
for. None of the 7 subject clauses currently steers the coat's rendered value away from key-black on
its own; they all lean on the generic tail alone. This is [S1], flagged once, applying to all 7.

### READABILITY AT GAME SIZE + KEYING SOUNDNESS — per entry

**`commander_shielded`** (APPLIED) — closed stance, coat shut, sidearm holstered: a closed, blocky
silhouette that reads fine at small size; brassard/radio are minor accent detail, not the primary
read, so they can mush without breaking the pose. PASS-WITH-CORRECTION: apply [S1].

**`commander_exposed`** (APPLIED) — [S2] "the long coat flaring open" opens the torso interior. If
the flap's underside/lining isn't explicitly value-locked lighter than the black backdrop, an open
dark flap against a near-black ground is the torso-sized version of the courier's keyed-through hip:
a large interior wedge the keyer reads as background. Fix: add a lining/value clause ("the coat's
open lining a pale contrasting grey") so the flap reads as a value-separated shape, not a hole. The
muzzle-flash + arms-thrust-forward envelope itself reads well at game size (wide, open, bright
accent) — PASS-WITH-CORRECTION: [S1] + [S2].

**`commander_hit`** (APPLIED) — [S4] the two RULING-mandated defeat tells ("brassard torn loose and
flapping," "radio knocked spinning off its clip") are small, dynamic, and detached-by-design. At
downscale they risk either mushing into an unreadable blur or reading as a disconnected floating
fleck rather than "torn from the sleeve." Recommend keeping a visible tether/strap stroke linking
each tell back to the body so it reads as "coming loose FROM him," not stray debris (also keeps the
defect-sweep from mis-flagging it as a floating-object anatomy break). PASS-WITH-CORRECTION: [S1] +
[S4].

**`commander_down`** (APPLIED) — [S3] highest hole-risk of the 4 applied: the coat "splayed out
around him" flat on the ground is the single largest continuous dark mass in the set, lying directly
against the black key ground with no vertical edge to catch a rim. This is the pose whose entire job
is "a readable heap on the floor" — if the coat's value sits too close to key-black it can get
swallowed almost whole, defeating the pose's one purpose. Fix: an explicit rim/value clause — coat
fabric a mid-grey clearly lighter than the pitch-black ground, silhouette traced by a thin pale
contour. PASS-WITH-CORRECTION: [S1] + [S3], this one is the priority fix of the 4 applied.

**`commander_weakpoint`** (READY) — [S5] structurally sound: the bare head naturally value-separates
from the coat (skin/pale vs. coat mass), which reinforces the two-band VITAL/LIMB read Estelle
wants without extra clauses — good bet, no readability fix needed on the band-separation strategy
itself. Same [S1] tail-vs-coat contradiction applies here too, and it matters MORE on this entry
because the render-side rings will sit directly over these values — an ambiguous coat value under
the LIMB ring is worse than under a static pose. PASS-WITH-CORRECTION: [S1].

**`commander_parry_windup`** (READY) — one of the two highest-risk reads per brief. [S6] The
structural bet (arms drawn in tight/hunched/compact vs. exposed's arms-extended/lunging/open) IS a
genuine silhouette-envelope difference that should survive downscale — good. But the windup prompt
never states the coat's silhouette state. If FLUX defaults it toward the same "flaring open" look
it associates with the neighbouring `overcoat`+`firing` vocabulary in `exposed`, the two poses could
converge toward a similar open envelope and kill exactly the sub-half-second contrast lever 3 needs.
Fix: add "the long coat still hanging closed around him" to lock the silhouette contrast IN the
prompt, not just hope the pose carries it. PASS-WITH-CORRECTION: [S1] + [S6], high priority — this
is mechanic-critical (§3-C "a shared tell = a bullshit whiff").

**`commander_finisher`** (READY) — the other highest-risk read per brief. [S7] Two compounding
risks on the reaching arm: (a) ANATOMY — a raised, bent, reaching arm toward a small object is the
textbook FLUX "limb not rooted at the joint" failure the defect sweep exists for; (b) KEYING — a
thin bent arm silhouette against black backdrop can partially vanish at scale, and any enclosed gap
between the reaching hand and the radio is precisely the "between fingers" hole-class the sweep
flags as a suspected generation hole, not background. Fix: add "the coat sleeve fully covering the
reaching arm from shoulder to wrist" (keeps the limb visually thick and continuous, cuts both the
anatomy-break risk and the thin-limb vanish risk) and "the hand closed around the radio" (removes
the ambiguous finger-gap). This entry gets the MANDATORY post-generation anatomy sweep at my
TECHNICAL pass regardless of this fix — flagging now so it isn't a surprise re-roll later (regen
still counts against the 2-batches/cycle cap). PASS-WITH-CORRECTION: [S1] + [S7], high priority.

### PROPS — the transparency/fringe trap (lustre) and the large-flat-mass trap (speaker_wall)

**`lustre`** — [S8] "strings of faceted glass droplets" is the classic transparency/fringe trap
named in the brief: if FLUX renders true shadowed/dark facets, those interior dark values fall into
the near-black key range, and against the solid black background the keyer treats them as
background — punching accidental gaps indistinguishable from the ONE intentional "drop broken off"
damage read, and undermining the whole asymmetric-damage story. Fix: replace/augment with a solid
positive value clause — "each crystal drop a solid pale grey-white faceted shape with a bright rim
highlight" — so no facet sits at a keyable dark value. [S9] Separately: "one drop broken off on one
side" may be too subtle a silhouette delta to register once downscaled from the 256px canvas to
in-game size; recommend widening the notch (e.g., two adjacent drops missing together) so the
asymmetric-damage read survives at game size, not just at full res. Interior tier/ring linework and
the "suggested radiating arms" are correctly treated as ornamental in the draft (the read leans on
cone silhouette + top-chain + tilt + dust) — that strategy is sound, PASS-AS-IS on that point.
Overall: PASS-WITH-CORRECTION: [S8] + [S9].

**`speaker_wall`** — [S10] the largest continuous-dark-area risk in the whole 9-entry set: "a rough
pyramid of mismatched plywood bass-bin boxes and flared horn cabinets wedged together" filling most
of the frame, sitting on the ground plane at the very base of a black-background canvas. In this
grey/ink-leaning house style, "raw plywood" tends to render mid-to-dark grey, and a mass this large
touching the key-black ground on multiple edges is a bigger hole risk than even `commander_down`'s
coat. Fix: explicit value + contour clause — "each cabinet face a flat pale-to-mid grey panel with
bold black contour lines separating adjoining boxes, the whole stack clearly lighter than the pure
black backdrop." [S11] "thick cables snaking down" as dark linework against a dark backdrop is the
inverse problem — a thin near-black line on a near-black ground can vanish outright rather than hole
through, losing the teknival tell entirely. Fix: "cables shown as a pale grey line, gaffer tape a
lighter grey wrap." [S12] the sprayed stencil spiral crew mark is fine, textured detail that will
mush to a soft smudge at game size — but it isn't load-bearing (BUILT-vs-HUNG is carried by the
pyramid/pallet-rig shape, not the mark), so PASS-AS-IS on that specific clause; just don't expect the
spiral to read past a texture accent. Overall: PASS-WITH-CORRECTION: [S10] + [S11].

### SET MECHANICS — canvas size across the 9

[S13] The whole `boss` block currently shares ONE `size` (256×256, square) for all types. That's a
sound default for the 7 humanoid figures (roughly square bounding box). It is the WRONG default for
the 2 props once dev-tooling wires them in: `lustre` is a tall hanging silhouette (chain-to-drops,
naturally portrait) and `speaker_wall` is a wide ground-built pyramid (naturally landscape or at
least much wider than tall). Forcing both into the shared square canvas either shrinks the actual
silhouette inside a mostly-empty frame (wasted resolution — worse readability at final game size) or
invites FLUX to crop/distort to fill the square. Precedent already exists in this same file for doing
it right: `nearForegroundArt.types` assigns a DIFFERENT `size`/aspect per kind (`lamppost` 256×512
portrait, `trafficLight` 225×512, etc.), pinned against the render-side aspect by its own consistency
test. Recommend dev-tooling assign per-prop canvas sizes matching natural aspect for `lustre`
(portrait) and `speaker_wall` (landscape or square-but-wide) rather than inheriting the figure
block's square default — a structural call for dev-tooling, flagged here because it's a readability-
at-game-size concern I own.

### Maud's two flagged deviations — my call

1. **POLICE lettering rendered as a reflective shape, not glyphs — CONFIRM, no reservation.** Text is
   FLUX-schnell's single weakest capability, weaker even than anatomy; at 256px it garbles into
   noise, and noise-as-generation-defect is an automatic set FAIL under §2 law 3 regardless of
   in-game scale. The brassard-as-luminous-shape carries the "flic en civil" read by silhouette,
   which is exactly what survives downscale. Full agreement with Maud's production reasoning.

2. **Shared style tail keeps "figure"/"tones figure" wording for the 2 props — CONFIRM as workable,
   with one conditional flag.** No hard technical grounds to force a fork now; forking a prop-only
   tail would cost Family consistency for a wording risk that is probabilistic, not certain. But
   "figure" recurring twice in the tail is a non-trivial diffusion-prior token, and on two
   prop-only generations (thinner training signal than a repeated humanoid template) there is a
   real, if modest, risk FLUX bleeds an incidental human silhouette into either prop. I'm folding
   this into my TECHNICAL-pass defect sweep as an explicit prop-specific check: if EITHER prop's
   first-batch generation shows any incidental human silhouette/limb, that is the trigger for
   Maud's own flagged fallback (roster-wide "figure" → "figure or object" tail amendment) — not a
   local prop fork, and not something to pre-empt before seeing a generation.

### Verdict summary

| Entry                    | Verdict                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `commander_shielded`     | PASS-WITH-CORRECTION — [S1]                                          |
| `commander_exposed`      | PASS-WITH-CORRECTION — [S1] [S2]                                     |
| `commander_hit`          | PASS-WITH-CORRECTION — [S1] [S4]                                     |
| `commander_down`         | PASS-WITH-CORRECTION — [S1] [S3] (priority)                          |
| `commander_weakpoint`    | PASS-WITH-CORRECTION — [S1]                                          |
| `commander_parry_windup` | PASS-WITH-CORRECTION — [S1] [S6] (priority, mechanic-critical)       |
| `commander_finisher`     | PASS-WITH-CORRECTION — [S1] [S7] (priority, anatomy+keying compound) |
| `lustre`                 | PASS-WITH-CORRECTION — [S8] [S9]                                     |
| `speaker_wall`           | PASS-WITH-CORRECTION — [S10] [S11]                                   |

No entry is a straight PASS-AS-IS end to end (the [S1] coat-value gap runs through all 7 figures),
but several individual strategies within entries ARE sound as drafted and called out above as
PASS-AS-IS on that specific point (weakpoint's band-separation-by-bare-head strategy, parry_windup's
pose-envelope strategy, down's motionless-heap concept, speaker_wall's pochoir clause, lustre's cone-
silhouette + top-chain strategy). None of my corrections change subject/silhouette intent — they are
value-language and continuity clauses Maud can fold into the existing strings without touching the
poses themselves. Route back to `concept-artist` (Maud) for integration, then `lead-art` (Nico)
PROMPT GATE.

Not a `VERDICT:` line (PRE-PROD annotations only, per the game-graphist role — the gate verdict is
Nico's).

- **File List:** `docs/handoffs/story-boss-niveau-final-live.md` (this PRE-PROD PASS appended).

---

## STAGE 2 (DESIGN LOOP) COMPLETE — producer (Marion) — 2026-07-20

- **Claim:** open stage tracking, allocate ADR number for TECH PLAN, log stage completion and next hand-off.
- **Release:** ADR-0053 allocated for this story's TECH PLAN (amendment to ADR-0051 or new extending ADR per AC6; `senior-architect` to decide which at TECH PLAN stage). All design-loop deliverables (level spec, fiction, UX) landed and gated PASSed via Karim. AC9 re-review PASS; pre-prod pass complete.
- **Status:** Story enters TECH PLAN (stage 3); AC8 sequencing gate ACTIVE — dev lanes touching `levels.ts`/`bossQteSystem.ts` held until ADR-0052 (story 1) merges on `main` (stage-6 panel currently running on story 1, not yet MERGE-cleared). `senior-architect` may proceed to TECH PLAN architecture/ADR work now; `producer` chasing ADR-0052 merge status for AC8 gate release.
- **Blockers:** AC8 dependency on story 1's stage-6 panel merge (non-blocking for TECH PLAN opening, blocking for dev-lane start).
- **Note:** CI env issue flagged — art generation workflow may fail silently if POLLINATIONS_TOKEN repo secret not set by Bertrand BEFORE dispatch. Escalate if dispatch runs without that env var.
- **Handoff:** → `senior-architect` (Winston) TECH PLAN (ADR-0053 allocation, data + narrative wiring architecture review).

---

## ART LANE — concept-artist (Maud) — 2026-07-20 · PRE-PROD corrections integrated (Serge's 9/9)

- claim: integrate game-graphist Serge's PRE-PROD annotations [S1]-[S13] (9/9 PASS-WITH-CORRECTION)
  into all 9 boss prompts — both the 4 applied `levelArt.json` boss-block strings and the draft shard
  — keeping the contract green (≤2 negations assembled, positive shape language, subject-only, ≤120
  words). All corrections are value-language + continuity clauses; **no pose/silhouette intent changed.**
- release — what changed per entry:
  - **[S1] all 7 figures** — coat re-steered from "dark overcoat" (contradicted the "light grey …
    tones" tail, the near-black-key hole trap) to a keyable mid-value stated IN the subject:
    `charcoal-grey … lighter than the black backdrop` (+ pale edge highlights on shielded). Phrased
    POSITIVELY ("lighter than", never "not near-black") → 0 negation.
  - **`commander_exposed` [S2]** — open flap value-locked: `flaring open to reveal a pale contrasting
grey lining` (kills the torso keyed-hole risk on the open coat).
  - **`commander_hit` [S4]** — tether: `both still tethered to him by a strap and cord` (torn
    brassard/spinning radio read as coming loose FROM him, not floating debris → no defect-sweep
    false-positive).
  - **`commander_down` [S3] (priority)** — largest hole-risk of the set: `mid-grey fabric lighter than
the pitch-black ground and traced by a thin pale contour` on the sprawled coat mass.
  - **`commander_weakpoint` [S1]** — coat value matters MORE here (render rings sit directly over it);
    bare head naturally value-separates from the coat, reinforcing the two-band read.
  - **`commander_parry_windup` [S6] (priority, mechanic-critical)** — `the long coat still hanging
closed` locks the silhouette contrast IN the prompt so it can't converge with exposed's flared
    envelope (§3-C "a shared tell = a bullshit whiff").
  - **`commander_finisher` [S7] (priority)** — `the coat sleeve covering it to the wrist` (thick
    continuous limb: cuts limb-detach + thin-limb-vanish risk) + `the closed hand on the shoulder
radio` (removes the finger-gap hole-class). Serge flags a mandatory anatomy sweep at his TECHNICAL
    pass on this entry regardless.
  - **`lustre` [S8]/[S9]** — `solid pale grey-white faceted crystal drops, each with a bright rim
highlight` (no dark facets to key-hole against the black ground) + widened damage notch `two
adjacent drops missing on one side, a wide notch` (asymmetric-damage read survives downscale).
  - **`speaker_wall` [S10]/[S11]** — `cabinet faces flat pale grey panels with black contours, the
stack lighter than the black backdrop` (value/contour lock on the biggest dark mass of the set) +
    `cables as pale grey lines with lighter gaffer wraps` (a near-black line on near-black ground
    vanishes otherwise).
  - **[S13] recorded for `dev-tooling-assets` (structure)** — the 2 props must NOT inherit the figure
    block's square 256×256 `size`: `lustre` = portrait, `speaker_wall` = landscape (precedent:
    `nearForegroundArt.types` per-kind aspect). Structural call theirs; recorded in the draft shard,
    not invented in JSON here.
  - **Maud's two deviations** — CONFIRMED by Serge, kept as-is (POLICE-as-shape; props keep the shared
    "figure" tail, now a prop-specific check in Serge's defect-sweep — an incidental human silhouette
    in either prop triggers the roster-wide "figure"→"figure or object" fallback, not a local fork).
- budgets after integration: every subject 0 negations, assembled 2; all 9 assembled 116-119 words,
  under the 120 hard ceiling (re-trimmed the subjects to absorb the added value/continuity clauses).
- File List:
  - `src/game/levels/levelArt.json` (boss block: 4 applied `prompt` strings updated with the [S1]-[S4]
    value/tether clauses; `$comment` + `style` UNCHANGED this round).
  - `docs/art-direction/prompt-drafts/boss-commander.md` (PRE-PROD corrections block added; all 9
    blockquotes + per-clause rationale updated with [S1]-[S13]; budgets note refreshed).
- lint: `node scripts/check-art-prompts.mjs` → **PASSED — no contract errors (12 pre-existing warnings,
  courier + nearForeground/bench; none from the boss block).**
- handoff → `lead-art` (Nico) PROMPT GATE. Serge's PRE-PROD is integrated; the open gate items remain
  the 2 confirmed deviations (POLICE-as-shape, props "figure" tail), the style-migration timing, and
  the render-side anchors + per-prop `size` aspect [S13] that `dev-tooling-assets` owns.
- Not a `VERDICT:` line — prompts remain OWED and un-gated pending Nico's PROMPT GATE.

---

## TECH PLAN — senior-architect (Winston) — 2026-07-20

- **Claim:** the TECH PLAN this story reserves to me — draft **ADR-0053** (number allocated by
  `producer`, not self-allocated), cut the dev lanes, confirm AC1–AC5 against **real code**
  independently of Karim's read, and rule the art-dependency shape / sprite-integration timing. Read
  in full: the three gated specs, the story's 10 ACs, ADR-0051/0052, and — for the touch surface —
  `levels.ts`, `narrativeSystem.ts` + `narrativeSystem.test.ts`, `App.tsx`, `FlyerWall.tsx`,
  `LevelFlyer.tsx`, `levelArt.json`, `gen-level-art.mjs`, `gen-adr-index.mjs`.

### Delivered

- **ADR-0053** — `docs/adr/0053-niveau-final-live-boss-level.md` (Accepted; extends, does not
  supersede, ADR-0051/0052). Records: the data-only live-ship decision (D1), the per-file touch map
  = lane partition (D2), the FORBIDDEN changes + the byte-diff review-assert (D3), the seed/K-5 re-pin
  discipline (D4), the harness's continued untouched existence (D5), and the art-dependency shape:
  backdrop IN, canon-sprite render-integration a FOLLOW-UP pass (D6). ADR index regenerated
  (`node scripts/gen-adr-index.mjs --write` → 53 ADR, `--check` FRESH); `docs/adr/README.md` +
  `public/adr/index.html` in sync.

### AC1–AC5 confirmed against real code (independent of Karim's leg)

- **AC1** — `LevelConfig` authors `bossQteSpec`, no `hostageQte`; `windowWeights {normal 40, riot 28,
biker 20, bonus 10}` merges `{...defaults, ...overrides}` (`levels.ts:12–13`), so `civilian`/
  `hostage_taker` keep default `weight 0` and stay out of the pool. The `stateMachine.ts` both-QTE
  throw is a safety net respected by construction. **PASS.**
- **AC2** — the change is an APPEND (new `LEVELS` entry + new narrative keys); the four shipped
  `LevelConfig`s stay byte-untouched. Enforced by the D3 review-assert. **PASS by construction.**
- **AC3** — `BOSS_QTE_DEV_HARNESS_LEVEL` (`levels.ts:221–248`) unmodified, stays excluded from
  `LEVELS`. **PASS.**
- **AC4** — `enemiesToWin: 16` (real, non-zero — not the harness `0`); a non-null `bossQteSpec`
  suppresses the instant `LEVEL_COMPLETE` and routes the quota crossing into `shouldTriggerBossQte`.
  **PASS.**
- **AC5** — the live `bossQteSpec` authors **only** the existing `BossQteSpec` fields the harness
  already exercises (`levels.ts:234–247`: zoom/anchor/phaseCount/bossHp/maxBlownWindows/targetSeed/
  decorProp) — no new field ⇒ no `types/bossQte.ts` change; no system value smuggled as data. The
  review-assert (D3) enforces zero changed lines in `bossQteSystem.ts` / `types/bossQte.ts`. **PASS.**

### Lane partition (PLANNED now, LAUNCHED post-AC8-clear)

Non-overlapping paths; the one cross-lane contract is the id string **`niveau-final`** (fixed in the
ADR) and the backdrop path `assets/levels/niveau-final/facade.png`. No two lanes share a file.

- **dev-gameplay** (the AC8-gated lane — it owns `levels.ts`):
  - `src/game/levels/levels.ts` — APPEND the `niveau-final` `LevelConfig` after `vitry` (speed 1.8,
    quota 16, timer 70, one `truck` delivery ≈Vitry, riot-heavy `windowWeights`, `bossQteSpec` per
    ADR D4, seed `19991231` PROVISIONAL, chandelier `decorProp {0.2,1.5}`). NO `hostageQte`. Shipped
    levels + harness byte-untouched.
  - `src/game/systems/narrativeSystem.ts` (+ `__tests__/narrativeSystem.test.ts` stays green) — ADD
    `niveau-final` to BOTH `PRE_` and `POST_LEVEL_NARRATIVE` (test A1), ids `niveau-final_pre`/`_post`
    (A2, flag A), each with `backdrop: "assets/levels/niveau-final/facade.png"` (A5, flag B). French
    lines VERBATIM from `spec-boss-encounter-fiction.md` §4 — only id/key/backdrop strings are new.
  - Boundary reminder: pure `src/game`, zero React/Three; TDD; the scene-id rename + backdrop path are
    **data/id-only** — no gated French copy changes (confirms Q1=NO upheld).
- **dev-tooling-assets** (`levelArt.json` — NOT AC8-named, can start in parallel):
  - REQUIRED: ADD a `levels[]` `niveau-final` block (single-facade mode, vitry/stalingrad pattern):
    `prompts.facade` = l'Éden hall interior + `windowGrid`/`parallax`/`sky`/`street`/`foreground`.
    `gen-level-art.mjs` produces `assets/levels/niveau-final/facade.png` (serves in-game facade + the
    narrative backdrop of flag B).
  - PARALLEL / NON-BLOCKING (open art lane, OQ3): ADD the 5 new `boss`-block sprite JSON entries as
    prompt-carrying structure (keys/asset/seed) with **per-type [S13] aspect** — figures square
    256×256, `lustre` portrait, `speaker_wall` landscape (the `nearForegroundArt` per-type-size
    precedent). Zero runtime effect today; PNGs may be absent. Structure is dev-tooling's.
  - Boundary reminder: `levelArt.json` + `scripts/**` only; owns keys/paths/seeds/sizes, NOT prompt
    strings (concept-artist) and NOT render registration.
- **dev-r3f-render** (minimal — NOT zero):
  - `src/render/ui/menu/LevelFlyer.tsx` — ADD one `PLAYABLE_COPY["niveau-final"]` entry
    (crew/slogan/date/zone/rv/info) transcribed from `spec-niveau-final-fiction.md` §4.1. Frozen
    `LevelFlyer`/`FlyerWall`/`LOCKED_COPY` untouched. `FlyerWall.tsx`'s `LEVELS.map` auto-renders the
    4th flyer; `App.tsx` is fully data-driven (`LEVELS[shippedIdx+1]` unlock hop,
    `PRE_/POST_LEVEL_NARRATIVE[id]`) → **zero `App.tsx`/`FlyerWall.tsx` change**. Zero-new-UI (ux D1/D3)
    holds at the code level.
  - Boundary reminder: render-layer DATA entry only; no new component, CSS, or game rule.

### Perf call — NOT perf-sensitive; no `gpu-specialist` verdict required

This story adds **no new render surface beyond an ordinary level's**: one more single-facade backdrop
(halftone wash, identical to vitry/stalingrad) and the SAME ADR-0051/0052 boss system on its already-
stage-5-perf-verified procedural fallbacks. No new shader, no new draw-call class, no new technique.
The one perf-sensitive item in the boss family — ADR-0052's smoke compositing — ships **unchanged**
(already cleared under its own gpu verdict); this story adds nothing to it. Verdict: **ordinary
level, no perf gate** — the stage-5 checks are legibility (ux A1–A15 re-verify on the new backdrop),
not frame-budget. Forward flag: the FOLLOW-UP canon-sprite integration (D6) swaps procedural quads
for textured sampling — its perf check belongs to that pass, not this one.

### Wiring flags A/B — lane confirmation

Both land in **dev-gameplay** (`narrativeSystem.ts`), NOT render: the scene DATA lives in the game
layer; `App.tsx` only reads it by id. Flag A (id rename `final_pre`→`niveau-final_pre`/`_post`, test
A2) and flag B (mandatory `backdrop` path, test A5) are **data/id-only** — no gated French line
changes. Confirmed: scene-id rename touches only ids/keys, not copy.

### AC8 — reaffirmed, still binding

TECH PLAN + ADR-0053 are complete and authorized now. The dev lanes above are **planned, not
launched.** No dev lane touching `levels.ts`/`bossQteSystem.ts` starts until `producer` confirms
ADR-0052's stage-6 panel MERGE-cleared on `main` (or a logged compression). All three lanes launch
together under that gate to keep the `niveau-final` id contract coherent.

VERDICT: TECH PLAN COMPLETE — ADR-0053 drafted, lanes cut, AC1–AC5 code-confirmed (senior-architect)

- **Handoffs:**
  - → `producer` (Marion): AC8 gate is now the sole blocker to dev-lane launch — chase ADR-0052's
    stage-6 merge; release the three lanes together when it clears. ADR-0053 index re-pinned.
  - → dev lanes (on AC8 release): the D2 touch map is the build contract; hold the D3 review-assert.
  - → `lead-art` (Nico): the OQ3 art lane (backdrop + 9 canon assets) runs in parallel per D6;
    render-integration of the boss sprites is a follow-up pass, not this story's stage-6.
- **File List:**
  - `docs/adr/0053-niveau-final-live-boss-level.md` (NEW)
  - `docs/adr/README.md` (index regenerated — ADR-0053 row)
  - `public/adr/index.html` (index regenerated)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this TECH PLAN entry appended)

---

## PROMPT GATE — lead-art (Nico) — 2026-07-20 · boss-commander 9-asset prompt family

Read in full before verdict: `docs/art-direction/prompt-drafts/boss-commander.md` (9 blockquotes +
per-clause rationale + Serge S1-S13 integration + budgets + the two Maud deviations + the [S13]
per-prop aspect note), the 4 APPLIED boss-block strings in `src/game/levels/levelArt.json`
(shielded/exposed/hit/down — confirmed byte-verbatim against the draft blockquotes), my own bible
`docs/art-direction.md` (§1 identity, §2 laws 1-3, §3 FLUX rules), and this shard's prior entries
(my headgear RULING (1), Estelle's advisory relay, Sacha/Karim design gate, Serge's PRE-PROD 9/9,
Maud's two release entries).

**Mechanical pre-check (ran it myself — verify, don't trust):**

- `node scripts/check-art-prompts.mjs` → PASSED, 0 contract errors (12 pre-existing warnings:
  courier + enemies + nearForeground/bench; NONE from the boss block, which is out of the lint's
  scope by design — its contract is held by hand).
- Hand-held contract, independently re-counted on all 9 assembled strings (subject + verbatim
  58-word tail): every subject **0 negations**; tail **2** (`no text`, `no watermark`) → total
  assembled **2**, inside §3.1 budget. Assembled length **116-119 words**, all under the **120**
  hard ceiling. Maud's "116-119w / 0-subject-neg / assembled-2" claim is CONFIRMED exact.
- No baked neon-accent hue in any of the 9 (ADR-0011 render-side-rim convention). Palette tokens
  scrutinised and CLEARED as value/material language inside the tail's declared "light grey white
  and pale neon tones" palette, not hue-bakes: `charcoal-grey`/`mid-grey`/`pale grey-white`
  (values), `wrought-iron`/`brass`/`plywood` (material nouns monochromed by the tail, steering
  silhouette not colour), `big bright muzzle flash`/`bright rim highlight` (luminance, white burst,
  high-contrast xerox — not a neon accent). Contract held.

**The mid-grey-mush question (the meatiest gate call).** The launcher's sharpest challenge: did
Serge's value-locks [S1/S3/S8/S10] — steering surfaces off near-black to a keyable mid-value —
drift the family into mid-grey mush and kill the xerox high-contrast? **No, and the reason is
load-bearing:** every value-lock pairs the mid-value with an EXPLICIT high-contrast EDGE tell —
`pale edge highlights` (shielded), `traced by a thin pale contour` (down), `flat pale grey panels
with black contours` (speaker_wall), `bright rim highlight` (lustre). High-contrast xerox does NOT
mean pure-black/pure-white only; the tail itself declares a grey/white/pale palette and renders
midtones as halftone. `charcoal-grey` is a DARK grey lifted off key-black, not a mid-grey — the
contrast lives at the SILHOUETTE EDGE, which is exactly where silhouette-first reads. This is the
CORRECT resolution of the §2-law-3 near-black-key hole trap (the trap the bible names explicitly)
WITHOUT surrendering contrast. **PASS on house-style — with an asset-gate WATCH carried forward
(Gate 2, not decided here): if any of these renders as a flat even-grey fill WITHOUT the promised
pale-edge / pale-contour / black-contour / bright-rim separation, THAT is mush and it FAILS at the
asset gate.** The prompt does its job; the render must deliver the edge. `commander_down` is the
priority mush-watch (largest continuous mass, flat on the key ground — the pale contour is its
make-or-break).

**Style-tail / migration-timing — ratified as drafted.** The 9 share the byte-identical LIVE
roster tail (`16-bit … retro snes style`), NOT the gated fanzine-pochoir direction of bible §1.
This is CORRECT under §2 law 2: the roster hasn't migrated (blocked on keying); forking a fanzine
tail for the boss alone would break the one-printing-run law. Boss migrates to pochoir IN LOCKSTEP
with the whole roster, never forked alone. The house-style question at THIS gate is consistency
WITH THE LIVE ROSTER's current tail — held byte-verbatim. RATIFIED.

### The two deviations — explicit verdict

1. **POLICE lettering → reflective SHAPE, not glyphs — RATIFIED (no reservation).** Grounds are
   bible-anchored, not taste: (a) the shared tail carries `no text` (§3 rule 8 / house law) —
   rendering "POLICE" glyphs would CONTRADICT the tail's own no-text clause and be self-defeating;
   (b) FLUX-schnell garbles text at 256px, and garbled text is a generation defect = automatic set
   FAIL under §2 law 3; (c) the plainclothes-cop read is carried by the brassard + reflective panel
   SILHOUETTE, which survives downscale where glyphs never would. Estelle's "POLICE lettering"
   advisory is INPUT; my verdict is that the literal word is off-spec against my own no-text law.
   **I do NOT amend `no text` to attempt lettering.** Confirmed: none of the 9 strings contains the
   word "POLICE" as text-to-render. RATIFIED as drafted.

2. **Props share the "figure"/"tones figure" tail verbatim — RATIFIED, with Serge's conditional
   fallback exactly as wired.** Grounds: (a) §2 law 2 — the tableau is ONE printing run; forking a
   prop-only tail for a probabilistic (not certain) wording risk breaks family consistency; (b) the
   "figure" tokens are functionally inert for a prop generation — FLUX keys on black-ground + pixel
   medium + grey/white/pale tones + centered, all valid for an object. The residual risk (repeated
   "figure" prior bleeding an incidental human silhouette into a prop) is real but modest and is
   correctly folded into Serge's TECHNICAL-pass defect sweep as a prop-specific check: IF either
   prop's first-batch generation shows any incidental human silhouette/limb, THAT triggers the
   **roster-wide** `figure` → `figure or object` tail amendment — NOT a local prop fork, and NOT a
   pre-emptive change before seeing a generation. RATIFIED exactly on those terms.

### Per-entry verdicts (silhouette-first · RULING (1) · roster-contrast · defect-risk read)

- **`commander_shielded`** (APPLIED) — closed guarded upright stance, coat shut, halt-palm up +
  hand on holstered sidearm. Blocky closed silhouette, reads "commanding / not firing," categorically
  distinct from exposed's open lunge. Bare head + long coat = chef tell. RULING (1) held. **PASS.**
- **`commander_exposed`** (APPLIED) — lunging one stride, both arms thrust forward presenting the
  pistol + muzzle flash, coat flaring open (pale-lined [S2] so the open flap is not a keyed torso
  hole). Open aggressive envelope, distinct from shielded (closed) AND parry_windup (arms IN).
  Muzzle flash is a bright white burst, not a neon bake. **PASS.**
- **`commander_hit`** (APPLIED) — staggered back, brassard torn loose + radio knocked spinning off,
  both TETHERED by strap/cord [S4], pistol arm falling. Defeat re-keyed off brassard+radio per
  RULING (1), never a flying cap. Reads "touché." Asset-gate WATCH (Gate 2): this is the entry with
  the most small dynamic near-detached elements — scrutinise for the detached-element / floating-fleck
  generation defect; the tether clause is the mitigation, whether FLUX honours it is a render read.
  Prompt-side correctly constructed. **PASS.**
- **`commander_down`** (APPLIED) — sprawled on back, coat splayed mid-grey + pale contour [S3],
  torn brassard + knocked-loose radio + dropped pistol beside him, motionless heap. Distinct from
  finisher (kneeling / upright / head up / still trying). Priority mush-watch at the asset gate (the
  pale contour is load-bearing). RULING (1) held. **PASS.**
- **`commander_weakpoint`** (READY-FOR-STRUCTURE) — square, still, frontal, chin up, torso squared
  flat, arms wide, pistol low & clear of chest: BOTH anatomy bands clean for the phase-2+ two-ring
  render callout (the sprite keeps the bands clean; the render rings do the callout). Bare head
  value-separates from the coat [S5], reinforcing the two-band read — a genuinely good bet. Static
  frontal, distinct from exposed's lunge. **PASS.**
- **`commander_parry_windup`** (READY-FOR-STRUCTURE) — the MECHANIC-CRITICAL one. Coiled a beat
  EARLIER than exposed, elbows drawn IN tight, pistol two-handed angled steeply up mid-raise (short
  of firing level), coat STILL HANGING CLOSED [S6], hunched wound-up crouch. The closed-coat +
  arms-IN lock is a real silhouette-envelope difference vs exposed's flaring-open + arms-EXTENDED —
  the sub-0.5s categorical read §3-C demands, LOCKED in text not left to hope. I explicitly bless the
  closed-coat clause as the load-bearing differentiator. Firearm silhouette kept throughout (never a
  melee tell). Also checked non-convergence with shielded (holstered+halt-palm+upright vs
  drawn+raised+two-handed+crouch — distinct envelopes, and they occur in different states, never
  side-by-side). **PASS.**
- **`commander_finisher`** (READY-FOR-STRUCTURE) — down on one knee, coat pooling, upright from the
  waist, head UP, one arm reaching up for the shoulder radio (sleeve covering it to the wrist [S7],
  closed hand), other on knee, straining. Reads "down-but-still-trying," distinct from down
  (flat/motionless). Tone guardrail (no blood/grimace/weapon-at-him) intrinsically held by the
  mono-figure frame. **PASS — with a MANDATORY anatomy defect-sweep reaffirmed at MY asset gate
  (Gate 2):** the raised bent reaching arm is the textbook FLUX limb-detach / thin-limb-vanish /
  finger-gap-hole risk; the [S7] sleeve-continuity + closed-hand clauses are the correct prompt-side
  mitigations, but this entry is the single highest anatomy-defect risk of the 9 and the asset gate
  is where a broken reach is caught (a re-roll there still counts against the 2-batch cap).
- **`lustre`** (READY-FOR-STRUCTURE prop) — multi-tier cone/umbrella crystal chandelier HUNG from a
  chain, wrought-iron/brass armature with suggested arms, pale grey-white faceted drops + bright
  rim [S8], two adjacent drops missing / wide notch [S9], tilted + dusty. Reads HUNG = "au
  bâtiment / ancien monde"; cone form excludes the mirror-ball by shape; asymmetric damage not
  rubble. **PASS.**
- **`speaker_wall`** (READY-FOR-STRUCTURE prop) — hand-built teknival pyramid of mismatched plywood
  bass-bins + horn cabinets on a scaffold/pallet rig, pale grey panels with BLACK CONTOURS [S10]
  (on-style ink linework), gaffered pale cables [S11], sprayed pochoir spiral (texture accent, not
  load-bearing). Reads BUILT = "au crew / le son"; pyramid + pallet-rig excludes line-array / DJ
  booth / guitar amp by form. **PASS.**

### Family consistency + roster contrast — PASS

Byte-identical tail across all 9 (one printing run). All 7 figures share the bare-headed + long
knee-length coat + brassard + shoulder-radio DNA, with `the same … commander` continuity recolling
the poses. Roster contrast at a glance is the STRONGEST possible: the Commandant is the ONLY bare
head in an otherwise uniformly capped/helmeted roster (mook = flat cap, `enemy_riot` =
helmet+shield+armour, `enemy_biker` = full crash helmet) AND the ONLY long-coat silhouette — my
RULING (1) reasoning holds (bare head out-differentiates a peaked cap, which would have collided
with the mook's capped-head bump at game size).

### Venue backdrop is NOT gated here — confirmed + Karim's constraint 6 restated forward

This family is the `boss` block ONLY: 7 figures + 2 hall décor PROPS (lustre, speaker_wall). The
**l'Éden interior BACKDROP** (`assets/levels/niveau-final/facade.png`) is a SEPARATE level block,
generated by the level/dev-tooling lane, and is NOT gated by this verdict. I confirm nothing in
these 9 prompts pretends to be or gate that backdrop — the two props are set-dressing objects,
distinct from the facade. It comes to me separately (asset gate + composite gate). Karim's
cross-lane advisory constraint restated as BINDING-WHEN-THE-BACKDROP-COMES (not gated now): (i)
frame a clean centred tableau at **anchor {0,-5}** with NO dead sky-gap behind the boss (Vitry
x:9.9 precedent); (ii) a legible, shootable, boss-distinct **chandelier at {0.2,1.5}**
anchor-relative; (iii) the **mur d'enceintes must NOT read as a shootable/interactive false
affordance in V1** — loi du glow, `ce qui brille est interactif`: the speaker wall is décor and
must carry NO luminous rim (same class as the ADR-0045 C2 car-roofline condition).

### Scope of this PASS (what it does and does NOT cover)

PASS covers the prompt STRINGS only: gate-ready, silhouette-first, positive shape language,
subject-only, no baked neon, contract held by hand, house-style-consistent with the live roster
tail, RULING (1) applied, both deviations ratified. It does NOT cover: (a) the generated PNGs —
Gate 2 asset gate, where the mush-watch (down/speaker_wall/lustre edge-separation), the hit's
detached-tell sweep, the finisher's mandatory anatomy sweep, and the props' incidental-human-bleed
check all land, my eye binding over any mechanical pre-check; (b) the render-side neon rims/glows —
Gate 4 composite gate, judged on real in-game screenshots against §2.1 (`un halo est un dégradé,
jamais un aplat`). NOTE the two props carry OPPOSITE glow verdicts at Gate 4: the **lustre** is the
interactive shootable `decorProp` → it MUST glow (render-side rim with falloff); the
**speaker_wall** is the reserved non-interactive 2nd prop → it MUST NOT glow (an accidental rim on
it is a composite-gate FAIL). Both sprites correctly ship pure-B&W-no-neon-token at the prompt
level (ADR-0011). (c) the venue backdrop — separate, later.

### Dispatch conditions (family PASS)

No FAIL on any of the 9 → no iteration instruction owed to Maud; **no batch consumed** (the first
generation batch is clean to dispatch under the 2-batches/cycle cap). Generation may be dispatched
ONCE **both** hold: (1) `dev-tooling-assets` adds the **5 new JSON structures** for the
READY-FOR-STRUCTURE entries (weakpoint, parry_windup, finisher, lustre, speaker_wall) —
keys/asset paths/pinned seeds/sizes, INCLUDING the **[S13] per-prop aspect** (lustre = **portrait**,
speaker_wall = **landscape**, NOT the figure block's 256×256 square) + the render-side anchors
`muzzle` (exposed), `parryPoint` (parry_windup), VITAL/LIMB rings (weakpoint); AND (2) the
**`POLLINATIONS_TOKEN` repo secret is set by Bertrand** before dispatch — producer (Marion) flagged
the CI workflow will fail SILENTLY without it. Dispatch also remains subject to producer's AC8
dependency gate (art lane declared parallel-non-blocking, coordinated by producer — not a prompt-gate
concern).

VERDICT: PASS — prompt gate commander_shielded (lead-art)
VERDICT: PASS — prompt gate commander_exposed (lead-art)
VERDICT: PASS — prompt gate commander_hit (lead-art)
VERDICT: PASS — prompt gate commander_down (lead-art)
VERDICT: PASS — prompt gate commander_weakpoint (lead-art)
VERDICT: PASS — prompt gate commander_parry_windup (lead-art)
VERDICT: PASS — prompt gate commander_finisher (lead-art)
VERDICT: PASS — prompt gate lustre (lead-art)
VERDICT: PASS — prompt gate speaker_wall (lead-art)
VERDICT: PASS — prompt gate family (lead-art)

- **File List:** `docs/handoffs/story-boss-niveau-final-live.md` (this PROMPT GATE entry appended).
