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
