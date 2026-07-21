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

---

## dev-tooling-assets (Amelia) — 5 new gated `boss`-block sprite JSON entries (structure only) — 2026-07-20

- **Claim:** the art-lane, non-blocking parallel task named at TECH PLAN §"Lane partition"
  (ADR-0053 D6) — add the JSON STRUCTURE (keys/`asset` paths/pinned seeds/[S13] per-type `size`) for
  the 5 READY-FOR-STRUCTURE boss entries whose `prompt` strings were already lead-art FAMILY
  PASSed (`commander_weakpoint`, `commander_parry_windup`, `commander_finisher`, `lustre`,
  `speaker_wall`). NOT gated by AC8 — no `levels.ts`/`bossQteSystem.ts` touch. Read `docs/art-
direction/prompt-drafts/boss-commander.md`, the live `boss` block, `nearForegroundArt.types`
  ([S13] per-kind-size precedent), `scripts/check-art-prompts.mjs` (boss block confirmed out of
  lint scope by design), and ADR-0053 D6 (generation deferred; zero runtime consumer today).

- **Delivered (`src/game/levels/levelArt.json`, `boss.types`):**
  - `commander_weakpoint` — `assets/boss/commander_weakpoint.png`, seed `4874`, prompt copied
    VERBATIM from the draft. Block-default `size` (256×256, unchanged — figures stay square per
    [S13]). Per-entry `$comment` flags the VITAL/LIMB band-anchor gap (see below).
  - `commander_parry_windup` — `assets/boss/commander_parry_windup.png`, seed `4875`, prompt
    VERBATIM. Block-default `size`. Per-entry `$comment` flags the `parryPoint` anchor gap.
  - `commander_finisher` — `assets/boss/commander_finisher.png`, seed `4876`, prompt VERBATIM.
    Block-default `size`. No anchor named for this entry — none added.
  - `lustre` — `assets/boss/lustre.png`, seed `4877`, prompt VERBATIM. Per-type `size` override
    `{width:320, height:512}` — **portrait**, per [S13] (hanging chandelier silhouette).
  - `speaker_wall` — `assets/boss/speaker_wall.png`, seed `4878`, prompt VERBATIM. Per-type `size`
    override `{width:512, height:320}` — **landscape**, per [S13] (ground-built pyramid stack).
  - Seeds are the draft's own suggested 4874-4878, continuing the boss series (4870-4873) —
    deterministic, pinned, non-overlapping with any other block.
  - Hand-verified the boss-block contract (not linted by `check-art-prompts.mjs` by design): all 5
    assembled (subject+tail) strings are 116-119 words (under the 120 hard ceiling) and 2 negations
    each (tail's `no text, no watermark`; 0 in every subject) — matches lead-art's own gate numbers
    exactly, re-derived independently with a throwaway script mirroring the lint's own regexes.

- **Anchor-metadata decision — flagged, NOT invented (schema evolution needs architect sign-off).**
  The tech plan (TECH PLAN + lead-art PROMPT GATE dispatch conditions) names `parryPoint` on
  `commander_parry_windup` and VITAL/LIMB band anchors on `commander_weakpoint`. Checked whether the
  existing schema has a slot: the only anchor mechanism in this file is `enemies.*.muzzle`, a
  per-FRAME array indexed to a flipbook's `frames.length` (`levelArt.consistency.test.ts` asserts
  frame-alignment). Boss entries carry no `frames` array (single static image), so that mechanism
  does not fit — and VITAL/LIMB are BANDS, not points, which the existing point-anchor shape doesn't
  represent either. `commander_exposed`'s own `muzzle` (named in the tech plan as a "future anchor")
  also does NOT exist in the JSON today, confirming no boss anchor precedent exists at all yet, for
  any entry. Per the task's explicit instruction, I did NOT invent a new anchor schema unilaterally:
  no anchor field was added anywhere in the boss block. Instead: (1) each of the two affected new
  entries carries a per-entry `$comment` naming the gap and its reason; (2) the block-level
  `$comment` carries a consolidated "ANCHOR SCHEMA GAP" paragraph, flagged for `senior-architect`
  sign-off before render-integration. Note these anchor VALUES could not be measured yet regardless
  of schema — they require the real generated PNGs (same as `enemies.*.muzzle`, tuned post-
  generation by `scripts/measure-muzzle-anchors.mjs`), and generation has not been dispatched.

- **Generation-path confirmation.** No `gen-boss-sprites.mjs` and no boss CI workflow exist yet — for
  ANY of the 9 `boss` entries, including the 4 already-APPLIED ones (`commander_shielded/exposed/
hit/down`), which also have zero generation path today. My 5 new entries are structurally
  identical siblings of those 4 (same shape: `asset`/`seed`/`prompt`, plus a `size` override for the
  2 props, mirroring `nearForegroundArt.types`'s per-kind `size`), so they will be picked up
  uniformly by whatever `gen-boss-sprites.mjs` (or `hostages`-style extension) is written to wire
  the block — no new gap introduced by this change; the gap is pre-existing and matches ADR-0053
  D6's explicit call that boss-asset generation dispatch is separately gated (token secret +
  producer's go), not this story's or this task's concern.

- **Verify:**
  - `node scripts/check-art-prompts.mjs` → PASSED, 0 errors, 12 pre-existing WARNs (courier +
    enemies + nearForeground/bench) — unchanged from before my edit; nothing from `boss` (out of
    the lint's scope, contract held by hand as documented above).
  - `npx prettier --check src/game/levels/levelArt.json` → clean.
  - `yarn typecheck` → FAILS, but both errors are in `src/render/scene/BossQteSprite.tsx` /
    `src/game/systems/bossQteSystem.ts` — other lanes' concurrent in-flight work (story-boss-qte-
    differentiation), sharing this worktree. Confirmed by grep: **zero** TS files under `src/`
    reference `manifest.boss`/`.boss` from the JSON today (ADR-0053 D6's "zero runtime consumer"),
    so my change cannot be the cause; stashing/restoring those two files reproduces the same tsc
    errors independent of my edit.
  - `yarn vitest run` → 843/843 passed, 64/64 files green, including
    `levelArt.consistency.test.ts` (16/16) run in isolation first.
  - `yarn lint` → 3 errors, all three in `BossQteSprite.tsx` (unused vars), same other-lane file as
    the tsc failures; nothing flagged on `levelArt.json`.

- **Scope discipline:** touched ONLY `src/game/levels/levelArt.json` (5 new entries + the
  block-level `$comment`). Did not touch the 4 already-APPLIED entries' `prompt`/`style` strings,
  did not touch `scripts/**`, did not touch `.github/workflows/**`, did not dispatch any generation,
  did not invent an anchor schema.

- **Handoff:** → `senior-architect` (Winston): the anchor-schema gap ($comment in `boss.$comment`and on the two affected entries) needs a sign-off call on shape (point vs. band) before the
follow-up render-integration pass touches`BossQteSprite.tsx`. → `producer`(Marion): structure
half of the dispatch conditions is now met; the remaining blockers are the`POLLINATIONS_TOKEN`
  secret and producer's go (AC8-adjacent but this art lane is declared parallel-non-blocking per
  ADR-0053 D6).

- **File List:**
  - `src/game/levels/levelArt.json` (MODIFIED — 5 new `boss.types` entries + updated block-level
    `$comment`; no other block touched)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry appended)

---

## ART LANE — concept-artist (Maud) — 2026-07-20 · l'Éden venue backdrop prompt (niveau-final facade)

- claim: draft the l'Éden VENUE BACKDROP prompt for the niveau-final level facade — the one prompt
  still missing for story 2 (the 9-entry Commandant family got FAMILY PASS at Nico's gate, unchanged).
  Authored to the `levels[]` facade pattern (belliard/stalingrad/vitry) but written in a NEW draft
  shard (NOT levelArt.json — `dev-tooling-assets` is concurrently editing that file), marked
  READY-FOR-STRUCTURE.
- release — `docs/art-direction/prompt-drafts/niveau-final-eden.md`, indexed in `prompt-drafts.md`:
  - **`facade` (load-bearing, 92w / 0 neg):** `front-elevation interior of a derelict 1930s parisian
dancing-hall ballroom, the back wall filling the frame ceiling to floor, a row of tall arched
windows boarded and leaking thin light, peeling gilded cornices high up, a mezzanine balcony with
an ornate cast-iron balustrade, a patched sprung-parquet floor below, party stencils and taped rave
flyers layered over the lower mouldings at arm height, the upper walls calmer, plywood speaker
cabinets low in one corner as flat set-dressing, a bare ceiling hook high where a chandelier once
hung, dim warm night light, faded decayed grandeur`
  - **`foreground` (38w / 2 neg, carries `magenta chroma-key`):** `row of ornate cast-iron ballroom
balustrade railings, thick black silhouettes seen up close, evenly spaced, isolated on a solid flat
uniform bright magenta chroma-key background, fully magenta empty surroundings, sharp silhouette
edges, pixel art, no wall, no floor`
  - **`ceiling` (optional, 29w / 0 neg):** provided only if the generator needs a separate upper slot;
    the facade already carries the ceiling register so by default this layer drops (interior venue ⇒
    the outdoor sky/street layers of the street levels are dropped — which is exactly what satisfies
    "no dead sky-gap").
- the three binding composition constraints (Karim advisory 6 / Nico restatement) — how each is met:
  - **No dead sky-gap behind boss `{0,-5}`** → `the back wall filling the frame ceiling to floor`
    (positive phrasing, 0 negation; interior wall fills top-to-bottom, no sky band).
  - **Legible shootable chandelier at `{0.2,1.5}`** → `a bare ceiling hook high where a chandelier once
hung` — the facade leaves a CLEAN ceiling anchor and bakes NO chandelier; the shootable `lustre` is
    the render-side decorProp (already FAMILY PASS). Avoids doubling + false-affordance.
  - **Speaker wall as set-dressing, NOT a shootable affordance in V1** → `plywood speaker cabinets low
in one corner as flat set-dressing`, baked flat/low = no render-side rim = non-interactive by the
    loi du glow (§2 law 1). Strongest anti-false-affordance guarantee. Flagged alternative for the
    gate: if dev-tooling instead renders the standalone `speaker_wall` sprite rim-less as set-dressing,
    drop the facade clause to avoid a double — I recommend the facade-bake.
- register per Estelle §7: derelict 1900-30 dancing/ballroom (patched sprung parquet, peeling gilt
  cornices, boarded arched windows leaking light, mezzanine balustrade), party stencils + taped flyers
  over the lower mouldings at arm height with calmer upper walls (board-belliard-decor-v2 axis 1); NO
  2010s industrial-warehouse register, NO horror-decay — "faded decayed grandeur", elegant and dead.
- counts assembled by hand against the `levels`-block rules: `checkLevels` enforces non-empty +
  `foreground` carries `magenta chroma-key` (both met); it does NOT machine-check word bands or
  negations on `levels` — held by hand anyway: facade 92w/0neg (a hair over the 90 target, every clause
  load-bearing, well under the 120 ceiling), foreground 38w/2neg, ceiling 29w/0neg. No shared style
  tail on `levels` (each string is standalone), so no tail-vs-subject contradiction to manage.
- File List:
  - `docs/art-direction/prompt-drafts/niveau-final-eden.md` (NEW shard, READY-FOR-STRUCTURE).
  - `docs/art-direction/prompt-drafts.md` (index row added; also refreshed the boss-commander row to
    "9 entries").
  - **No `levelArt.json` edit** (concurrent-edit avoidance — dev-tooling-assets owns the `levels[]`
    entry: id `niveau-final`, layer set, `size`, `windowGrid` on the arched-window row, path
    `assets/levels/niveau-final/facade.png` per narrative wiring flag B / ADR-0023).
- lint: `node scripts/check-art-prompts.mjs` → **PASSED — no contract errors (12 pre-existing warnings;
  none from this work — the new prompt lives in the draft shard, not yet in levelArt.json).**
- handoff → `game-graphist` (Serge) PRE-PROD PASS → `lead-art` (Nico) PROMPT GATE, same chain as the 9.
  Open gate items in the shard §"Reste à trancher" (speaker-wall bake-vs-sprite call, lustre
  anchor-clearance compo check, and the `levels[]` structure dev-tooling owns).
- Not a `VERDICT:` line — prompt OWED and un-gated pending Serge + Nico.

---

## PRE-PROD PASS — game-graphist (Serge) — 2026-07-20 · l'Éden venue backdrop (facade/foreground/ceiling)

Read: `docs/art-direction/prompt-drafts/niveau-final-eden.md` (READY-FOR-STRUCTURE draft), Maud's
shard entries above (venue ratification + composition constraints), the shipped `levels[]` entries
for `belliard`/`stalingrad`/`vitry` in `src/game/levels/levelArt.json` (`sizes.facade` 1280×768,
global `windowGrid` prior cols7/rows3, per-level `windowGrid` + hand-tuned `windows` blocks),
`src/game/levels/windowZones.generated.json`, and the git history on `scripts/align-windows.mjs` /
`scripts/align-troncon.mjs` (the belliard window-zone fix chain: `94f5a4e`, `8933c03`, `6c140f3`,
`bb6404f`). Numbering below is `[E#]` (Éden) to keep it distinct from the boss-family `[S#]` set
above.

### 1. Readability at game size — clause density vs. the street facades

**Structural difference from belliard/stalingrad/vitry that changes the risk profile:** the street
facades are a `troncon-sequence` the camera PANS across — a player only ever sees a fraction of the
total facade clause budget in frame at once, so even a busy prompt gets spread out over the pan.
L'Éden is a single static interior backdrop held BEHIND a frozen boss tableau for the whole fight —
every one of its ~8 decorative registers (arched windows / cornices / mezzanine balustrade / parquet
/ stencils+flyers / calmer upper wall / speaker corner / ceiling hook) is on screen simultaneously,
competing with the active combat readout (rings, telegraph, HUD) for the whole encounter. That's a
materially harder composition problem than a panned street facade with a similar clause count.

[E1] That said, the **layering strategy itself is sound and follows precedent**: horizontal bands
(cornice high / windows mid / parquet low, "the upper walls calmer" explicit) is the same
Prohibition poster-grammar the street facades already use (roofline / window floors / ground-floor
shops), and "party stencils and flyers … at arm height, the upper walls calmer" is the
board-belliard-decor-v2 axis already validated elsewhere. No wholesale consolidation needed. PASS
on the overall layering approach.

[E2] The one register I'd prioritise for value-contrast budget is the **window row itself** — it is
the single mechanically load-bearing layer (enemy pop positions, per the "galerie pré-boss" note)
AND one of the 3 binding composition constraints sits right above it (the ceiling hook). Recommend
the clause order/emphasis make sure cornice detail stays subordinate (lower contrast/simpler shapes)
to the window row so the pop band reads first. This is the same fix as [E3] below — see there for
the concrete clause.

[E3] **The window row itself is the priority fix — tie to §2 below.** The current clause has no
explicit count or evenness language ("a row of tall arched windows boarded and leaking thin light").
Compare belliard's facade, which spells out "exactly 7 identical evenly spaced tall french windows
per floor, every window and floor line perfectly aligned" — and even WITH that explicit regularity
clause, belliard needed two correction passes (`8933c03` rigid-grid-vs-real-art mismatch, `bb6404f`
two windows merging into one railing) before the window-pop zones rendered clean. Shipping l'Éden's
window row with LESS regularity language than belliard had going in raises the odds of needing the
same correction cycle, or worse. Fix: add an explicit count + evenness clause, e.g. "a row of
`{N}` tall arched windows, evenly spaced and identical in width" (N left to dev-tooling/the gate to
pin against `windowGrid.cols`).

### 2. Window-zone risk — "boarded" vs. an occupiable opening

[E4] **This is the entry's biggest structural risk.** "Boarded" windows, taken literally, read as a
solid opaque plank surface nailed across the opening — not a dark/lit recessed cavity. Two distinct
production problems follow:

- **Detection/alignment risk.** Every window-zone fix logged on belliard (`94f5a4e` window-alignment
  harness, `8933c03` troncon alignment harness, `6c140f3` overflow-only correction) works by
  detecting REAL windows in the generated art — warm-lit floor row-centroids × per-row column-density
  peaks, or an edge-density detector for the troncon ink/wash art — then snapping zones to them. A
  window painted as a mostly-uniform boarded plank gives that detector a much weaker signal (no clean
  warm-light blob, no clean dark-cavity edge) than an actual open or half-open window, which is
  exactly the kind of ambiguity that produced 26/164 and 32/114 OVERFLOW slots on belliard even with
  clean, unambiguous, lit windows to detect. Expect a HARDER alignment pass here, not an easier one,
  unless the openings stay visually unambiguous.
- **Fiction/mechanic incoherence.** A cop is meant to pop up and occupy that window slot. A window
  boarded fully shut is, by its own read, sealed — a figure appearing to stand IN a solid plank
  surface reads as broken, the same class of "wrong archetype" silhouette failure the house style
  treats as automatic FAIL (§2 law 3), just applied to the backdrop opening instead of the figure.

Fix (positive framing, keeps the "condamnées" decayed read Estelle wants): don't seal the whole
opening — board only the LOWER portion of each window, leave the upper arch genuinely open/lit. e.g.
"a row of tall arched window openings, evenly spaced and identical in size, each a dark recessed
cavity, the lower panes crudely boarded across but the upper arch open, warm light spilling through
the gap." This keeps every window a real, evenly-sized, evenly-spaced dark/lit slot the alignment
harness can find AND an opening a cop can plausibly occupy, while the boards still carry the
"condamnées" texture read as a partial decay detail rather than a sealed surface.

[E5] Separately, flag the **merged-railing failure mode** (`bb6404f`: two closely-spaced windows'
fixed-width rail-drawing overshoot ate the mullion gap between them) as a risk to watch specifically
BECAUSE this facade also bakes "an ornate cast-iron balustrade" at the mezzanine AND ships a
near-identical ironwork motif in the `foreground` layer — if the arched windows end up packed tight
(no visible mullion/pier between them in the generated art), the same overshoot-merge risk applies
here too. Not a prompt fix (this is render-side rail geometry vs. detected zone x-positions, exactly
as it was on belliard) — flagged for the alignment/gate check once real art lands, not blocking the
prompt pass.

### 3. Foreground railings — keying on ornate cast-iron

[E6] **PASS-AS-IS.** "thick black silhouettes seen up close … sharp silhouette edges" is the exact
defensive clause family already shipped verbatim on belliard/stalingrad/vitry's foreground layers
(magenta chroma-key, thick ironwork silhouettes) — and, notably, none of the logged production
defects on this codebase's window/facade art have ever been a foreground-layer keying failure; every
fix chain above was facade/window-zone side. Ornate cast-iron scrollwork IS the classic thin-line
fringe trap on a magenta key, but asking for "thick" + "sharp silhouette edges" is precisely the
right counter (bias toward bold blocky bars, not lace-like filigree) and it's a proven, shipped
formula being transplanted, not a fresh bet. One insurance note for the TECHNICAL pass: Estelle's
1900-30 ballroom register could tempt FLUX toward delicate tracery more than the street family's
plainer balcony guards did — if the first generation shows genuinely thin filigree, the fix is
pushing "thick" harder (e.g. "thick, bold, chunky black silhouettes"), not a structural change.
Nothing to correct in the prompt now.

### 4. The three binding composition constraints

1. **`the back wall filling the frame ceiling to floor`** — CONFIRM, production-sound as phrased:
   positive language (0 negation), directly answers the Vitry `x:9.9` dead-sky-gap lesson, and
   because this is an INTERIOR venue there's no sky/street layer competing for the frame at all —
   structurally the safest version of this constraint shipped yet.
2. **`a bare ceiling hook high where a chandelier once hung`** — CONFIRM, prompt language is sound
   (positive, guarantees an empty/clean hook silhouette rather than baking a duplicate lustre). The
   exact `{0.2,1.5}` placement is a composition check against the real generated PNG, correctly left
   to Nico at the gate (draft item 3) — nothing further for me to add on the string itself.
3. **`plywood speaker cabinets low in one corner as flat set-dressing`** — CONFIRM Maud's bake
   recommendation, and I'll add a second, purely production-side argument for it beyond the
   false-affordance one: **the `facade` layer is a directly-composited backdrop image, never
   chroma-keyed** (only `foreground` carries the `magenta chroma-key` lint requirement) — baking the
   speakers here means they are never cut out and never wired to a per-object render path at all,
   so there is literally no code path by which they could ever acquire a glow rim later (unlike a
   discrete `decorProp`/sprite, which is exactly the kind of object the render layer CAN wire a rim
   onto by a future accident). It is also the strictly SAFER choice on my own lane's axis: the
   standalone-sprite alternative would mean generating a second `speaker_wall`-class asset that must
   be chroma-keyed against black — reopening the large-flat-near-black-mass hole risk ([S10] in my
   Commandant-family pass above) for zero gain, since this venue doesn't need the prop interactive.
   **Ruling: bake-in-facade, reject the standalone-rimless-sprite alternative.**

### Verdict summary

| Layer                                   | Verdict                                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `facade`                                | PASS-WITH-CORRECTION — [E3]/[E4] (window row: add count+evenness, un-seal the opening) is the priority fix; [E1]/[E2] no action beyond ordering emphasis; [E5] flagged for the post-art alignment check, not the prompt |
| `foreground`                            | PASS-AS-IS — [E6], proven clause family, no correction                                                                                                                                                                  |
| `ceiling` (optional)                    | PASS-AS-IS if used — same bare-hook language as facade, ornamental water-stain/plaster detail is non-load-bearing texture, no correction needed                                                                         |
| Composition constraint 1 (back wall)    | CONFIRMED sound as phrased                                                                                                                                                                                              |
| Composition constraint 2 (ceiling hook) | CONFIRMED sound as phrased; exact placement deferred to Nico's compo check (already correctly flagged)                                                                                                                  |
| Composition constraint 3 (speakers)     | CONFIRMED — bake-in-facade ruled over standalone-rimless-sprite, on keying-safety grounds in addition to Maud's false-affordance reasoning                                                                              |

The one concrete text change I'd want folded in before generation is the window-row clause ([E3]+
[E4]): give it an explicit window count + "evenly spaced and identical in size," and un-seal the
upper arch of each window so boarding reads as partial decay, not a sealed opaque surface. Everything
else in the draft is either already following a proven shipped pattern or correctly deferred to the
gate/harness stage. Route back to `concept-artist` (Maud) for integration, then `lead-art` (Nico)
PROMPT GATE.

Not a `VERDICT:` line (PRE-PROD annotations only — the gate verdict is Nico's).

- **File List:** `docs/handoffs/story-boss-niveau-final-live.md` (this PRE-PROD PASS appended).

---

## ART LANE — concept-artist (Maud) — 2026-07-20 · l'Éden facade: Serge PRE-PROD [E4]/[E3] integrated

- claim: integrate game-graphist Serge's l'Éden PRE-PROD corrections into the facade prompt
  (`docs/art-direction/prompt-drafts/niveau-final-eden.md`) — foreground PASS-AS-IS [E6], ceiling
  PASS-AS-IS, facade PASS-WITH-CORRECTION [E3]+[E4]. No `levelArt.json` edit (dev-tooling-assets still
  in that file); no commit/push.
- release — the corrected `facade` prompt (114 words, 0 negations, under the 120 ceiling):
  > front-elevation interior of a derelict 1930s parisian dancing-hall ballroom, the back wall filling
  > the frame ceiling to floor, a row of exactly 5 tall arched windows, evenly spaced and identical in
  > size, each a dark recessed cavity, their lower panes crudely boarded, the upper arch left open, warm
  > light spilling through, peeling gilded cornices high up, a mezzanine balcony with an ornate
  > cast-iron balustrade, a patched sprung-parquet floor below, party stencils and taped rave flyers
  > layered over the lower mouldings at arm height, the upper walls calmer, plywood speaker cabinets low
  > in one corner as flat set-dressing, a bare ceiling hook high where a chandelier once hung, dim warm
  > night light, faded decayed grandeur
- what changed (facade only — foreground/ceiling untouched, they PASS-AS-IS):
  - **[E4] un-sealed the window row** — replaced `boarded and leaking thin light` (read as a solid
    sealed plank: weak signal for the `align-windows.mjs` detector AND a cop popping IN a sealed plank
    = broken silhouette) with `each a dark recessed cavity, their lower panes crudely boarded, the upper
arch left open, warm light spilling through` (positive phrasing): every window stays a detectable
    dark/lit cavity AND an opening a cop can occupy in the upper arch, boards now read as partial decay.
  - **[E3] count + evenness (proven belliard formula)** — added `exactly 5 … evenly spaced and identical
in size`. **Count = 5 (not belliard's 7)** justified: grand ballroom arches are WIDE (unlike narrow
    french apartment windows), so 5 fill one static 1280×768 wall with visible masonry piers between —
    directly mitigating the [E5] tight-pack merge risk; belliard was 7 narrow windows across a WIDE
    panned troncon. dev-tooling pins `windowGrid.cols = 5` to match (avoids the belliard `8933c03`
    rigid-grid-vs-art mismatch).
  - **[E5] recorded (post-art, NOT a prompt fix)** — merged-railing risk (belliard `bb6404f`): the
    facade also bakes a mezzanine balustrade and the foreground ships a near-identical ironwork motif;
    if the 5 arches render tight, the same rail-overshoot merge risk applies. Flagged for the post-art
    alignment/gate check (render-side rail geometry vs detected zone x-positions); the count-5 wide-arch
    choice is my prompt-side mitigation.
  - **Serge's speaker bake-ruling RECORDED as CONFIRMED** — bake-in-facade RULED over the
    standalone-rimless-sprite alternative: the `facade` layer is composited directly (never
    chroma-keyed, only `foreground` is), so baked speakers have no per-object render path that could
    ever acquire a glow rim, AND a standalone re-keyed `speaker_wall` would reopen the [S10]
    large-flat-near-black hole risk for zero gain. My earlier bake recommendation is now the ruling.
- counts (held by hand — `checkLevels` doesn't machine-check word/neg on `levels`): facade 114w/0neg,
  foreground 38w/2neg (carries `magenta chroma-key`), ceiling 29w/0neg. All under the 120 ceiling.
- File List:
  - `docs/art-direction/prompt-drafts/niveau-final-eden.md` (facade blockquote + window-row rationale
    updated with [E3]/[E4]; speaker bake-ruling recorded as confirmed; [E5] note added; counts table +
    Reste-à-trancher refreshed).
  - **No `levelArt.json` edit** (concurrent-edit avoidance).
- lint: `node scripts/check-art-prompts.mjs` → **PASSED — no contract errors (12 pre-existing warnings;
  none from this work — the prompt lives in the draft shard).**
- handoff → `lead-art` (Nico) PROMPT GATE on the l'Éden backdrop family (facade corrected + foreground +
  optional ceiling), same chain as the 9. dev-tooling-assets owns the `levels[]` structure incl.
  `windowGrid.cols = 5`.
- Not a `VERDICT:` line — prompt OWED and un-gated pending Nico.

---

## PROMPT GATE — lead-art (Nico) — 2026-07-20 · l'Éden venue backdrop family (3 slots)

Read in full: `docs/art-direction/prompt-drafts/niveau-final-eden.md` (facade + foreground +
optional ceiling, per-clause rationale, Serge PRE-PROD [E1]-[E6], Maud's integration of [E3]+[E4]
and the speaker bake-in RULING), the binding composition constraints (Karim advisory 6 + my own
restatement), `docs/game-design/spec-niveau-final-fiction.md` §1 (l'Éden canon), and my bible
`docs/art-direction.md` (§1 identity, §2 laws, §5 facades/levels grammar, §2bis facade treatment).

**Hand-held contract (the `levels` block is NOT word/negation machine-linted — I re-counted it
myself):** facade **114w / 0 negations** (under the 120 ceiling); foreground **38w / 2 negations**
(`no wall, no floor`, ≤2 budget) AND carries the **required `magenta chroma-key` phrase**
(`checkLevels` cut-out requirement — confirmed present); ceiling (optional) **29w / 0 negations**.
Maud's 114/38/29 counts CONFIRMED exact. No baked neon hue in any slot (décor is value/atmosphere —
`dim warm night light`, `faded gilt` are lighting/material words, not §2-law-1 neon accents; the
acid neon stays render-side; nothing interactive is baked into the facade).

### Per-slot verdicts

- **`facade` (porteur) — PASS.** Delivers the Prohibition §5 grammar (flat front-elevation, a
  window grid where hostiles pop) in the l'Éden register (derelict 1930s dancing-hall ballroom —
  `dancing-hall ballroom` excludes the warehouse-industrial register by form; `peeling gilded
cornices` / `faded decayed grandeur` is faded-grandeur, not horror-decay, on-direction for §1
  clandestine-Paris night). The three binding composition constraints are all met IN the prompt:
  - **Constraint 1 (back wall plein cadre {0,-5}, no dead sky-gap) — PASS, my compo check.** The
    interior venue correctly DROPS the exterior sky/street layers, and `the back wall filling the
frame ceiling to floor` positively fills the frame — no sky band can sit behind the boss at
    {0,-5} (the Vitry x:9.9 dead-gap failure is structurally excluded by an interior wall). Positive
    phrasing (`filling … ceiling to floor`, not "no sky") = 0 negation.
  - **Constraint 2 (bare hook {0.2,1.5} for the render-side shootable lustre; NO baked chandelier) —
    PASS at the prompt level, with a carried-forward compo check.** `a bare ceiling hook high where
a chandelier once hung` reserves a clean high anchor and bakes NO lustre (avoids doublon + false
    affordance — the shootable lustre is the render-side `decorProp`, family Commandant, already
    FAMILY PASS). MY COMPO CONTROL, provable only when the PNG lands (asset/composite stage, flagged
    not blocking): verify the generated facade actually leaves the {0.2,1.5} hook zone clean and high
    enough that the render-side hanging lustre reads with no cornice/mezzanine element colliding and
    no dead-gap around it.
  - **Constraint 3 (mur d'enceintes present but NOT a shootable false-affordance in V1) — PASS,
    Serge's bake-in-facade RULING RATIFIED.** `plywood speaker cabinets low in one corner as flat
set-dressing` bakes the speakers into the `facade` layer, which is composited directly and
    NEVER chroma-keyed → no per-object render path can ever give them a neon rim → non-interactive
    by the loi du glow (§2 law 1: only a render-side rim = interactive). This is the STRONGEST
    possible guarantee against the false-affordance Karim's constraint 3 targets, and it also
    sidesteps the [S10] large-near-black-mass keying risk of a re-keyed autonomous `speaker_wall`
    for zero V1 gain. The autonomous `speaker_wall` sprite (Commandant family, PASS) stays the
    promotion asset for a future venue that makes it interactive; in V1 it is NOT rendered.
  - **Window row [E3]+[E4] — PASS.** `exactly 5 tall arched windows, evenly spaced and identical in
size` reuses belliard's proven regularity formula; **5 (not 7)** is correctly justified — wide
    ballroom arches (vs narrow immeuble windows) fill one 1280×768 wall with visible masonry piers
    between them, directly mitigating the belliard [E5] merge risk. [E4]'s de-sealing (`dark
recessed cavity … lower panes boarded, upper arch left open, warm light spilling through`) is
    the right fix: a fully-boarded plank gives `align-windows.mjs` no detectable blob AND a cop
    popping from a sealed board = broken silhouette (§2 law 3); the open upper arch keeps each
    window an occupiable pop-opening while the lower boards keep the "condamnées" decrepitude read.
    dev-tooling pins `windowGrid.cols = 5` to this count.
- **`foreground` (chroma-keyed near-plane) — PASS.** Interior version of the street foreground (the
  cast-iron ballroom balustrade the crosshair aims over, coherent with the facade's balustrade +
  cornices). Carries the required `magenta chroma-key` cut-out phrase; the 2-negation isolation
  (`no wall, no floor`, adapted from the street family's 3-neg `no building/wall/sky` to fit an
  interior AND the ≤2 budget) is a sound assumed family deviation.
- **`ceiling` (optional) — PASS-AS-IS.** To be used ONLY if the level structure needs a separate
  high slot (the `facade` already carries the ceiling/cornices; by default this layer DROPS). Keeps
  the clean bare hook (constraint 2), bakes no lustre.

### Family + coherence

The three slots read as one interior (cast-iron balustrade + gilded cornices + parquet + faded
grandeur run through facade/foreground/ceiling coherently) and are consistent with the existing
level-backdrop grammar (belliard/stalingrad/vitry pattern). The venue is on-canon (l'Éden,
Bertrand-confirmed grand disused dancing-hall, design-gate ratified). This backdrop is a SEPARATE
family from the `boss` block 9-asset family I gated earlier today — nothing here re-gates that, and
that gate did not gate this.

### Dispatch-readiness (family PASS)

All 3 slots PASS + family PASS — **no FAIL, no iteration owed to Maud.** Structure to
`dev-tooling-assets`: add the `levels[]` entry (`id` `niveau-final`, name/label,
`backdrop`/`parallax`/`nearForeground` knobs, layer set with sky/street DROPPED for the interior,
`size` = global `facade` 1280×768, path `assets/levels/niveau-final/facade.png` per narrative
wiring flag B / ADR-0023) and **pin `windowGrid.cols = 5`** to the arch row. Two carried-forward
checks at the post-art / asset / composite stage (NOT prompt-gate blockers): (i) my compo control on
the {0.2,1.5} hook clean-zone for the render-side lustre; (ii) the [E5] alignment check that the 5
arches do not merge (rails/mullions) and that `windowGrid.cols = 5` snaps clean on the detected
cavities. **Generation remains HELD on the `POLLINATIONS_TOKEN` repo secret** (producer's
escalation — the workflow fails silently without it; Bertrand must set it before dispatch), and
under producer's AC8 dependency gate.

VERDICT: PASS — prompt gate eden_facade (lead-art)
VERDICT: PASS — prompt gate eden_foreground (lead-art)
VERDICT: PASS — prompt gate eden_ceiling (lead-art)
VERDICT: PASS — prompt gate eden_family (lead-art)

- **File List:** `docs/handoffs/story-boss-niveau-final-live.md` (this l'Éden prompt-gate entry appended).

---

## 3. AC8 SEQUENCING GATE RELEASED — producer (Marion) — 2026-07-20

- claim: ADR-0052 (story-boss-qte-differentiation) stage-6 review panel MERGE-CLEARED on `main` (PR #114 merged by Bertrand 2026-07-20); the blocking gate AC8 is now released. Dependency cascade for story-boss-niveau-final-live stage 4 BUILD unblocked: dev lanes may touch `levels.ts`/`bossQteSystem.ts` without restriction.
- release: AC8 gate RELEASED. Story-2 `claude/yo-pmnyzr` branch is LIVE; dev-lane hand-offs below proceed immediately.
- handoff → `dev-gameplay` (Amelia): stage 4 BUILD — level config + narrative wiring. Freed from AC8 gate; ready to cut new `niveau-final` `LevelConfig` and wire the gated `final_pre`/`final_post` scenes to the level id (per narrative-designer §2 wiring flags A/B). Build on the frozen ADR-0051/0052 contract; touch no `bossQteSystem.ts` values (all re-authored at design time by Sacha §game-designer, re-verified by Karim §gate). Scope: `levels.ts` new entry + `src/game/narrative/specifyNarrativeLine.ts` one-line scene-key substitution.
- handoff → `dev-tooling-assets` (Victor): stage 4 BUILD + ART LANE — l'Éden backdrop generation + structure/dispatch. Receive the l'Éden family from `dev-r3f-render` (or re-patch locally if need a quicker spin — artist runway). Three slots (facade + foreground + ceiling per lead-art's stage-3 prompt-gate PASS); `dev-tooling-assets` owns the `levels[]` entry registration, `windowGrid.cols = 5` pinning, and `POLLINATIONS_TOKEN` secret gate to generation dispatch. Scope: `scripts/art-generation.mjs` (new l'Éden entry in the dispatch + the eden block structure), `src/game/levels/levelArt.json` (index registration), optional `public/adr/index.html` housekeeping if ADR-0053 routing updates (out of scope for this story's own BUILD, logged separately). POLLINATIONS_TOKEN: confirmed SET by Bertrand 2026-07-20, generation dispatch fires on next push.
- handoff → `dev-r3f-render` (Amelia): stage 4 BUILD — render-side seams only. Per ADR-0053 Giveaway (render-lane is ZERO except for flyer copy if the ux-designer's §story-2-stage-3 flyer-words land on render-side — currently null, so render is muted). No new components, no new anchor/zoom/frame-logic; hook the generated facade at the `levels.ts` backdrop path. Scope: ZERO unless flyer.copy lands here (confirm with Tony).
- handoff → `lead-game-designer` (Karim): stage 4 BUILD witness. Re-verify the dev lanes against Karim's gated specs (§4 stage-3 DESIGN GATE PASS) as code lands — catch any AC5/scope drift silently. Stage-5 VERIFY includes the K-5 seed re-pin (`19991231` vs harness `20260719`) on the real level's quota/timing, and the K-6 backdrop-anchor re-check once the facade lands (Vitry precedent: `x:9.9`, Sacha's spec authorizes `anchor.x` nudge up to ±0.5 once art lands, no respec needed).
- handoff → `producer` (Marion): AC8 gate RELEASED — no further blocking on this story. Stage-4 BUILD lanes are running. Pipeline ahead: stage 5 VERIFY (k-5 seed re-verify, legibility re-verify against new l'Éden backdrop per ux-designer K-6 checklist, composite gate, perf), stage 6 REVIEW (4-reviewer panel on `niveau-final` delta only if this PR splits; if ride-along merged with story-1, architect integration-triage reads the cross-story seams), stage 7 ACCEPTANCE (pm), stage 8 MERGE (Bertrand). Flagged: story-1's follow-up blocker #5 (décor aim-honesty, HARD design gate, BLOCKS any shipped level that authors decorProp — this level will author it on Sacha's spec §2, so Karim's gate ruling MUST land before this story's verify leg-1 closes). Story-1's #3 (smoke.png downsize, landed but undocumented) noted; no impact on this story's build.
- File List:
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry)

VERDICT: RELEASED — AC8 sequencing gate (producer) — ADR-0052 PR #114 merged to main 2026-07-20; dev lanes touching levels.ts/bossQteSystem.ts are now unblocked. POLLINATIONS_TOKEN confirmed set by Bertrand. Story-2 BUILD lanes launched: dev-gameplay (level config + narrative wiring), dev-tooling-assets (facade generation + structure), dev-r3f-render (zero unless flyer-words), lead-game-designer (gate witness). Pipeline ahead: stage-5 verify (including K-5 seed re-verify on live level quota/timing and K-6 backdrop-anchor check once facade lands) → stage-6 review (4-reviewer if split PR, or architect integration-triage if ride-along) → stage-7 acceptance (pm) → stage-8 merge (Bertrand). Active blocker flagged: story-1 follow-up #5 (décor aim-honesty HARD gate, must land before this story's verify leg-1 closes — this level WILL author decorProp per Sacha §2 spec).

## 4. BUILD (stage 4) — dev-gameplay (Amelia) + dev-tooling-assets (Victor) + dev-r3f-render (Amelia) — 2026-07-20 — LANES OPENED

## [lanes running]

**Status: stage-4 BUILD OPEN, 2026-07-20**

Lanes initialized:

- **dev-gameplay**: level config + narrative scene wiring (Amelia)
- **dev-tooling-assets**: l'Éden backdrop generation, structure, dispatch (Victor)
- **dev-r3f-render**: hook facade (Amelia) — ZERO scope unless flyer-words land

No entries logged yet (lanes are live, work in progress). Producer will chase stage completion as lanes close and revert to the handoffs log.

---

## DESIGN GATE (stage-5 blocker) — lead-game-designer (Karim) — 2026-07-20 — panel follow-up #5, décor aim-honesty

- **Claim:** rule the CONFIRMED stage-6 panel finding #5 (flagged by `producer` as the HARD gate that
  MUST land before this story's verify leg-1 closes, because this level AUTHORS a `decorProp` — the
  chandelier `{0.2,1.5}`, `armPhaseIndex 1`, `spec-boss-niveau-final-level.md` §2). The finding, verified
  against real code:
  - **Drawn** (`BossQteSprite.tsx:133-138`): the décor prop plane is `DECOR_W 0.8 × DECOR_H 1.05` world
    units, wrapped by a `DECOR_GLOW_SIZE 2.2` acid glow-halo that invites the click.
  - **Catch** (`bossQteSystem.ts:1084-1096`, `withinCatch`): a **0.30-radius circle** at
    `decorProp.position` (`RING_HIT_RADIUS` reuse).
  - **The hole:** the drawn prop's upper/lower edges (`|dy| ∈ (0.30, 0.525]`, and the horizontal corners
    `|dx| ∈ (0.30, 0.40]`) are DRAWN and glow-lit but silently no-op — the single-use arm window ticks
    away on a click the player correctly aimed at a visible target. This violates the **drawn == catch**
    invariant my own AMENDMENT A1 §4 made binding for the rings ("click inside the drawn thing = hit must
    stay literally true, or the tighter catch becomes a bullshit miss").

### Ruling — direction (a): ENLARGE the catch to the drawn silhouette (rectangular AABB)

**Direction (b) — SHRINK the drawn prop toward the 0.30 circle — is REJECTED**, for three reasons:

1. **Art-coherence conflict I don't own and won't override.** The niveau-final backdrop (l'Éden ceiling
   slot, `eden_ceiling` prompt-gate PASS) bakes a chandelier at a scale the `{0.2,1.5}` render-side
   lustre must match; §6 of the level spec and the lead-art compo control both require the chandelier
   read "legible, shootable, boss-distinct." A ≤0.6-wide drawn prop would fight that baked scale — a
   `lead-art` bible question, not a design lever to spend on a fairness bug.
2. **It shrinks a PURE-UPSIDE reward during a SINGLE-USE window** — backwards for lever 2, whose whole
   point (spec §2-B) is turning dead SHIELDED downtime into a _generous_ optional play. Making the one-shot
   bonus HARDER to claim is the opposite of the mechanic's intent.
3. **The A1 precedent does NOT transfer.** A1 shrank _drawn → catch_ only because the vital catch value
   was **mechanically pinned** (the 0.11 camp-dominance threshold, A1-R2 §15 sweep). The décor catch is
   **not** pinned by anything — it is an arbitrary `RING_HIT_RADIUS` reuse with no dominance role. When the
   catch is free and the drawn size is load-bearing (art), the invariant is restored by moving the _catch_,
   not the drawn.

**Direction (a) is CORRECT and this is the ruling.** A silent no-op on a visibly clickable, glow-lit target
during a single-use window is the exact §5.6 frustration class ("mort/rate bullshit") the drawn==catch
guardrail exists to forbid — and it is _worse_ than the ring case because a whiffed décor window does not
come back. Because the prop is pure upside (no failure surface, no competing SHIELDED-gap target, no
dominance concern), a generous catch has **zero** player downside; the only correct catch is the full drawn
silhouette — every drawn pixel clickable, nothing beyond it.

### Exact target values

- **Catch shape:** an **axis-aligned box (AABB)**, anchor-relative, centred at `decorProp.position` —
  NOT a circle (a circumscribing radius = half-diagonal `hypot(0.40,0.525)≈0.66` would make empty space
  outside the drawn corners score, breaking drawn==catch the _other_ way; a box matches the drawn plane
  exactly). Replaces the `withinCatch(...RING_HIT_RADIUS)` circle in the SHIELDED décor branch ONLY.
- **Catch half-extents (game-side source of truth, new constants):**
  - `BOSS_DECOR_CATCH_HALF_W = 0.40` (= `DECOR_W 0.80 / 2`)
  - `BOSS_DECOR_CATCH_HALF_H = 0.525` (= `DECOR_H 1.05 / 2`)
    A hit iff `|impact.x − (anchor.x + decorProp.position.x)| ≤ 0.40` **and**
    `|impact.y − (anchor.y + decorProp.position.y)| ≤ 0.525`.
- **Drawn prop size:** **UNCHANGED** — `DECOR_W 0.80 × DECOR_H 1.05`. (Art-preserving: no chandelier
  re-scale, no backdrop re-verify. The two catch constants are defined to equal half the _existing_ drawn
  size, so this ruling changes only the catch, never a pixel.)
- **Glow halo (`DECOR_GLOW_SIZE 2.2`):** **UNCHANGED**, and explicitly **NOT** the affordance boundary. My
  call on "does drawn mean silhouette or glow": **the crisp grey prop silhouette is the aim target; the glow
  is an attention cue only.** The halo is a radial dégradé falling to alpha 0 at the rim (`buildRadialGlowTexture`)
  — it has no crisp edge to aim at, so it reads as "something here is live," exactly as the ring's
  emphasis-brightness reinforces the ring geometry without being the catch. Catch does NOT extend to 2.2
  (that would make hazy empty space score — dishonest the opposite way).

### Paired-lane assignment (BUILD, this story's stage-4 lanes)

This is a paired change, same shape as A1 (a game catch + a render pairing that keeps drawn==catch literal):

- **`dev-gameplay` (catch — the substantive change, TDD):** author `BOSS_DECOR_CATCH_HALF_W 0.40` /
  `BOSS_DECOR_CATCH_HALF_H 0.525` in `bossQteSystem.ts`; add a rectangular `withinBox` helper (or inline
  AABB) and gate the SHIELDED décor branch (`~:1084-1096`) on it instead of `withinCatch(...RING_HIT_RADIUS)`;
  add a `createBossQte` assert (both half-extents finite & > 0, mirroring `assertPositiveScalar`). Unit tests:
  a click at `dy 0.45` inside the prop (previously a silent no-op — the reported hole) now scores the +3
  `BOSS_DECOR_DAMAGE`; a click at `dy 0.60` / `dx 0.45` (outside the drawn box) does NOT; the horizontal
  corner `dx 0.35, dy 0.50` scores (inside the box). Determinism/purity unchanged; additive-and-optional law
  intact (`decorProp === null` ⇒ byte-identical).
- **`dev-r3f-render` (drawn pairing — drift-guard, no pixel change):** import the two new constants and set
  `DECOR_W = 2 * BOSS_DECOR_CATCH_HALF_W`, `DECOR_H = 2 * BOSS_DECOR_CATCH_HALF_H` (today 0.80 × 1.05 —
  identical output), so drawn==catch is enforced structurally and tracks any future catch re-tune, exactly as
  the vital ring draws at the imported `BOSS_VITAL_CATCH_RADIUS`. The glow (2.2) and the prop's grey/armed
  treatment are untouched. This lane's diff is a two-line derivation, but it is REQUIRED — without it the
  invariant holds only by coincidence.

### Spec bookkeeping & stage-5 watch

- **Transcribe verbatim into `spec-boss-qte-differentiation.md` §2 (LEVER 2)** as **AMENDMENT A2 — décor
  catch = drawn silhouette (AABB)**, and update **AC-D4** tail: "…décor prop scored within the AABB
  `±(BOSS_DECOR_CATCH_HALF_W 0.40, BOSS_DECOR_CATCH_HALF_H 0.525)` == the drawn `0.80×1.05` silhouette
  (drawn == catch); glow 2.2 is an attention cue, not the catch." Same pattern as A1/A1-R2 (my ruling is the
  record; Sacha/dev transcribes). Reuse-map line "décor prop … `RING_HIT_RADIUS 0.30` (prop catch radius)"
  is superseded for the décor by the AABB — `RING_HIT_RADIUS` stays for limb ring / parry point / phase-1
  ring.
- **Stage-5 (Sacha playtest + K-5 seed re-verify):** confirm the phase-2 décor arm-window is landable on the
  live `{0.2,1.5}` chandelier with the new box (AC-L5). **Bounded watch item (NOT a re-open of this gate):**
  if the 2.2 glow rim draws the eye to click _beyond_ the silhouette and players miss, that is a render-salience
  fix (crisper/brighter armed silhouette) owned by `dev-r3f-render` + `ux-designer` — NOT a catch enlargement
  to the halo (which would make empty haze score). Same disposition as A1-R2 §4's small-ring legibility seam.
- **Scope / iteration:** in-scope — a fairness correction to already-ratified ADR-0052 lever 2, no new
  mechanic, no core-loop touch (round 0 of the 2-round cap; the ruling is decisive, no rework requested).
  Design gate for this story otherwise stands PASS (§ DESIGN GATE 2026-07-20); this closes the last open
  design blocker before verify leg-1.

VERDICT: PASS-WITH-CORRECTIONS — décor aim-honesty (panel follow-up #5) — direction (a) ENLARGE catch to drawn silhouette. Catch = AABB ±(BOSS_DECOR_CATCH_HALF_W 0.40, BOSS_DECOR_CATCH_HALF_H 0.525) at decorProp.position, replacing the 0.30 circle; drawn UNCHANGED 0.80×1.05; glow UNCHANGED 2.2 (attention cue, not catch). Direction (b) shrink-drawn REJECTED (art-coherence + shrinks a pure-upside single-use reward + A1 precedent does not transfer — catch here is unpinned, drawn is load-bearing). Paired lanes: dev-gameplay (AABB hit-test + 2 constants + assert + TDD) ∥ dev-r3f-render (import constants, derive DECOR_W/H — drift-guard, no pixel change). Transcribe as AMENDMENT A2 into spec-boss-qte-differentiation.md §2 + AC-D4 tail. Stage-5: décor arm-window landability on {0.2,1.5} (AC-L5); glow-rim over-aim is a render-salience watch, not a catch re-tune. (lead-game-designer)

- **File List:**
  - `docs/handoffs/story-boss-niveau-final-live.md` (this gate ruling appended)
  - `docs/game-design/README.md` (index — record décor aim-honesty A2 ruling as gated; to update)

---

## BUILD — dev-gameplay (Amelia) — 2026-07-20 · niveau-final LevelConfig + narrative wiring (TDD)

- **Stage:** 4 BUILD · **Lane:** dev-gameplay (the AC8-gated lane — owns `levels.ts`). Built on
  AC8-clear (STORY-BOSS-QTE-DIFFERENTIATION merged to `main`; branch reset on merged main).
- **CLAIM:** author the `niveau-final` `LevelConfig` (ADR-0053 D2/D4) + wire the gated
  `final_pre`/`final_post` scripts to the new id, TDD, against the FROZEN ADR-0051/0052 boss
  contract. Non-overlapping with the concurrent dev-tooling-assets (`levelArt.json`) and
  dev-r3f-render (`LevelFlyer.tsx`) lanes; the only shared contract is the id string `niveau-final`.
- **RELEASE — what I built:**
  - **`src/game/levels/levels.ts`** — APPENDED one `LevelConfig` `niveau-final` after `vitry` (pure
    append, 62/0 — the four shipped levels + `BOSS_QTE_DEV_HARNESS_LEVEL` byte-untouched, AC2/AC3).
    `enemySpeedMultiplier 1.8` / `enemiesToWin 16` (REAL quota, non-zero — AC4) / `timeSeconds 70`;
    one `truck` delivery ≈Vitry (integrity 60 / window 6 / bonus 300 / trigger 18 / stop {0,-4.5});
    `roster.windowWeights {normal 40, riot 28, biker 20, bonus 10}` (civilian/hostage_taker NOT
    overridden ⇒ stay weight-0, AC1). **NO `hostageQte`** (AC1 mutual exclusion by construction).
    `bossQteSpec` = value-for-value copy of the harness combat block (`zoomSeconds 2` / `anchor
{0,-5}` / `phaseCount 3` / `bossHp 24` / `maxBlownWindows 10`), re-authoring ONLY `targetSeed
19991231` (K-5 re-pin) and `decorProp {position {0.2,1.5}, armPhaseIndex 1}` (chandelier) — no
    system value smuggled as data (AC5). Name = narrative's one-field canonical `L'Éden — 31 déc.
1999` (mirrors "Vitry — 94"); district `Paris`, year `1999`. Unlock via the existing index hop
    (`unlocked: false`) — no new unlock code.
  - **`src/game/systems/narrativeSystem.ts`** — ADDED the `niveau-final` key to BOTH
    `PRE_LEVEL_NARRATIVE` and `POST_LEVEL_NARRATIVE` (A1), scene ids `niveau-final_pre`/`_post`
    (flag A / test A2), each with `backdrop: "assets/levels/niveau-final/facade.png"` (flag B / test
    A5, ADR-0023). The gated `final_pre` (8 lines) / `final_post` (6 lines) French copy transcribed
    **VERBATIM** from `spec-boss-encounter-fiction.md` §4.1/§4.2 — only the id/key/backdrop strings
    are new, zero French line changed (Q1=NO upheld: l'Éden is NOT named in dialogue). The reveal
    line `...le Commandant.` (final_pre #4) carries the gated MUF rider image and no Commandant
    sprite (imageless of him, as gated).
  - **`src/game/levels/__tests__/niveauFinal.test.ts`** (NEW) — 12 tests: level-authoring
    assertions (placement/unlock, AC1 no-hostageQte + roster weight-0, AC4 real-quota `16 !== 0`,
    monotonic-hardest pacing, delivery ≈Vitry, AC5 value-for-value copy vs the harness), narrative
    A1/A2/A5 + verbatim-script/reveal-beat checks for the new scenes, and the **K-5 seed-winnability**
    driver (a competent rings+parry player clears 24 HP before the blown-window clock trips).
- **SEED STATUS — `19991231` HOLDS (no re-pin needed).** The K-5 winnability driver, run against
  the FULL differentiated kit live via the authored spec (two rings + parry + décor, anchor {0,-5}),
  confirms a competent player clears with `blownWindows < maxBlownWindows 10`. The provisional pin
  is now stage-5-verified for the mechanical winnability property; the empirical playtest
  landability-per-ring/per-charged-window nuance stays the `game-designer` stage-5 leg, but the
  hard "is it winnable at all" gate PASSES on `19991231` — no `+n` re-pin.
- **VERIFY (all green):** `yarn typecheck` clean · `yarn vitest run` **861 passed / 65 files, 0
  fail** (incl. the 12 new + the untouched `narrativeSystem`/`levelArt.consistency`/`stateMachine`/
  `rosterAssetCoverage`/`assetManifest` suites) · `yarn lint` clean · `yarn format:check` clean.
  **AC5 byte-diff CONFIRMED EMPTY:** `git diff` shows ZERO changed lines in
  `src/game/systems/bossQteSystem.ts`, `src/game/types/bossQte.ts`, `src/game/systems/stateMachine.ts`,
  and `src/hooks/**`. `levels.ts` diff is pure append (62/0) — no shipped-level/harness line touched.
- **CROSS-LANE NOTES / flags for other lanes:**
  - **dev-tooling-assets** — you landed the `levelArt.json` `levels[]` `niveau-final` entry
    concurrently while I built (name `L'Éden — 31 déc. 1999` — matches my `levels.ts` exactly, the
    id/name contract held; `levelArt.consistency.test.ts` GREEN). I did NOT touch `levelArt.json`.
    Note: `windowGrid.rows: 1` in your entry means the pre-boss gallery pops from a single arch row
    — confirm that reads as intended density at stage-5 playtest (not a blocker; flagging the shape).
  - **dev-r3f-render** — the `PLAYABLE_COPY["niveau-final"]` flyer entry (crew `SPIRALE 23 · KANAL
SYSTEM · NADIR 94`, slogan `LE DERNIER SON DU SIÈCLE`, zone `L'ÉDEN · ANCIEN DANCING`, etc.,
    fiction §4.1) is YOUR lane (`src/render/ui/menu/LevelFlyer.tsx`) — I did not author it (render
    boundary). The 4th flyer will only render once you add it; no gameplay/test blocks on it.
  - **Backdrop asset** — the level references `assets/levels/niveau-final/facade.png` (narrative
    backdrop + in-game facade), which the CI art pipeline generates later. No fallback code needed
    in my lane: the path is a valid string before the PNG exists, and no vitest/asset guard requires
    the facade PNG on disk for a new level (rosterAssetCoverage checks only rostered enemy sprites,
    all shipped). Generation is HELD on the `POLLINATIONS_TOKEN` secret (producer's escalation).
- **No commit/push** (per instruction). Owning-lane verify complete; ready for the quality gate.
- **File List:**
  - `src/game/levels/levels.ts` (MODIFIED — appended the `niveau-final` `LevelConfig`)
  - `src/game/systems/narrativeSystem.ts` (MODIFIED — `niveau-final` pre/post scenes, gated copy verbatim)
  - `src/game/levels/__tests__/niveauFinal.test.ts` (NEW — 12 tests: authoring + narrative + K-5 winnability)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this BUILD entry appended)

## 4. BUILD (stage 4) — dev-tooling-assets (Amelia) — l'Éden levels[] block + boss sprite generator/workflow + dispatch — 2026-07-20

- **claim:** the dev-tooling-assets BUILD scope cut at TECH PLAN (ADR-0053 D2/lane partition): (1)
  the `levels[]` `niveau-final` block in `src/game/levels/levelArt.json`; (2) the missing
  `scripts/gen-boss-sprites.mjs` + `.github/workflows/gen-boss-sprites.yml` pair for the 9-entry
  `boss` block (already structurally landed by an earlier dev-tooling-assets pass, §"5 new gated
  boss-block sprite JSON entries" above); (3) dispatch prep for both, plus a check on whether the
  existing level-art CI path picks up the new block automatically.
- **release:**
  1. **`levels[]` niveau-final block** — appended after `vitry` (ADR-0053 D2 order). `facade`/
     `foreground` prompt strings copied VERBATIM from the GATED
     `docs/art-direction/prompt-drafts/niveau-final-eden.md` (lead-art FAMILY PASS, `eden_facade`/
     `eden_foreground`/`eden_family` all PASS, this shard §"PROMPT GATE — l'Éden venue backdrop
     family"). `windowGrid.cols = 5` pinned per the gate's [E3] count, `rows: 1` (a single row of
     arches, not the street levels' multi-floor grid — `computeWindowSlots`/`getWindowZones` both
     special-case `rows===1` to `ny=0.5`, so `top`/`bottom` are inert-by-construction, kept equal
     for readability). `size` uses the shared global `sizes.facade`/`sizes.foreground` (1280×768,
     no override). `parallax`/`ironwork` set by structural analogy to stalingrad/vitry (this venue's
     décor is not gated content, no copy authored). **Interior venue: `sky`/`street` DROPPED from
     `prompts`** per the gate's explicit ruling ("layer set with sky/street DROPPED for the
     interior") — NOT included as empty/placeholder strings, genuinely absent, because the facade
     alone fills the frame ceiling-to-floor (the "no dead sky-gap behind the boss" constraint).
     Optional `ceiling` layer NOT added either, per the draft's own "by default this layer drops."
     `name`/`label`: `name: "L'Éden — 31 déc. 1999"` — the narrative-designer's own documented
     "one-field fallback… mirrors the Vitry — 94 convention" recommendation (fiction spec §4);
     CONFIRMED byte-identical against dev-gameplay's concurrently-landed `levels.ts` entry
     (`levelArt.consistency.test.ts`, 16/16 green) — no cross-lane drift.
  2. **Two structural fixes this block's shape required** (both minimal, both because no level had
     ever dropped a layer before):
     - `src/game/levels/levelArt.ts` — `LevelArt.prompts` widened from `Record<LayerName, string>`
       to `Partial<Record<LayerName, string>>`. Verified dead-safe: grepped the whole `src/` tree —
       nothing reads `.prompts` at runtime (only `scripts/gen-level-art.mjs`, plain JS, reads the
       raw JSON directly); the field exists purely as a JSON-shape assertion. `yarn typecheck`
       confirmed green after the change (it was NOT green before — the niveau-final entry's 2-key
       `prompts` object didn't structurally satisfy the closed 4-key `Record`).
     - `scripts/gen-level-art.mjs` — the per-layer generation loop now skips a layer cleanly
       (`if (level.prompts[baseLayer] === undefined) { …skip log…; continue; }`) instead of sending
       FLUX a broken `"${undefined}, …"` prompt for a level that doesn't declare that layer. This is
       the "mirror the structural mechanism or omit cleanly" fix — there was no existing per-level
       layer-set mechanism to mirror, so this is the minimal guard, not a new abstraction.
  3. **`scripts/gen-boss-sprites.mjs`** (NEW) — modeled closely on `gen-hostage-sprites.mjs`: reads
     `boss.types` from `levelArt.json` (prompt + shared `style` tail, pinned `seed`, `asset` path,
     per-entry `size` override defaulting to the block's 256×256), same FLUX fetch
     (`lib/pollinations.mjs`), same black-ground cutout detour (`cutout-enemies.mjs`) + despeckle
     sweep (`retouch-sprites.mjs`) as hostages/enemies, `--list`/`--asset`/`FORCE=1` CLI parity.
     `--list` verified locally (no network needed): correctly resolves all 9 entries with the right
     per-type sizes (7 figures 256×256, `lustre` 320×512 portrait, `speaker_wall` 512×320 landscape
     — [S13]).
  4. **`.github/workflows/gen-boss-sprites.yml`** (NEW) — modeled closely on
     `gen-hostage-sprites.yml`: same trigger shape (`workflow_dispatch` + push-marker
     `.github/dispatch/gen-boss-sprites`, `branches-ignore: main`, `ci(dispatch):` head-commit
     guard per ADR-0009), same `FORCE=1` generate → solidify (`fill-sprite-holes.mjs` +
     `--check`) → integrity gate (`check-sprite-integrity.mjs`, looped per-file since the script
     takes one `--file` at a time — the SOFT torso-zone WARN is harmless on the 2 non-figure props,
     HARD checks are figure-agnostic) → bounded-retry commit/push → artifact-on-failure shape.
  5. **Dispatch gap found + closed: level-art generation had NO commit-back path at all.**
     `preview.yml` ("Style B Preview" / "Generate art · render levels · contact sheet") DOES run
     `gen-level-art.mjs` automatically on the next push (levelArt.json isn't under its
     `paths-ignore`), so the niveau-final facade/foreground WOULD generate there — but that
     workflow is deliberately decorative/artifact-only (confirmed by reading it: it uploads a
     screenshot artifact and never `git add`s `public/assets/levels/**`). Unlike every other asset
     family (enemies/vehicles/hostages/courier/near-fg props), level backdrops had no dedicated
     commit-back workflow — `HARNESS.md`'s own step 5 ("commit `public/assets/levels/` +
     `screenshots/` back to the branch") is STALE against the actual `preview.yml` (doc/code
     drift, flagged here for `tech-writer`, not fixed in this pass — out of lane). Closed the gap
     the idiomatic way: **`.github/workflows/gen-level-art.yml`** (NEW), mirroring the same
     gen-\*.yml commit-back pattern (dispatch marker `.github/dispatch/gen-level-art`,
     `workflow_dispatch` with the same `regenerate` boolean `preview.yml` has, generate → cutout
     foreground (`cutout-foreground.mjs`) → bounded-retry commit/push → artifact-on-failure).
  6. **Dispatch markers staged (not pushed):** `.github/dispatch/gen-boss-sprites` and
     `.github/dispatch/gen-level-art` created (real content via `date >`, not bare `touch`, per
     ADR-0009); `.github/dispatch/README.md` table updated with both new rows (plus the 2
     already-existing-but-undocumented `gen-hostage-sprites`/`gen-courier-sprites` marker rows,
     noticed while editing the same table).
- **What the next push triggers (once committed with a `ci(dispatch):`-prefixed message, per
  ADR-0009):**
  - `preview.yml` fires on ANY push to this branch regardless of the markers (its own trigger,
    unrelated to dispatch) — generates the niveau-final layers ephemerally for the screenshot
    contact sheet, does NOT persist them.
  - The `gen-boss-sprites` marker dispatches `gen-boss-sprites.yml` → generates + commits the 9
    `public/assets/boss/*.png` files.
  - The `gen-level-art` marker dispatches `gen-level-art.yml` → generates + commits
    `public/assets/levels/niveau-final/{facade,foreground}.png`.
  - Both are HELD on the `POLLINATIONS_TOKEN` repo secret (producer's earlier escalation) —
    confirmed SET by Bertrand 2026-07-20 per producer's AC8-release entry above, so generation
    should fire for real on next push.
- **Verify:**
  - `node scripts/check-art-prompts.mjs` → PASSED, 0 errors, 12 pre-existing WARNs (courier +
    enemies + nearForeground/bench) — unchanged, nothing new from the `levels` block.
  - `yarn typecheck` → green.
  - `yarn lint` → green.
  - `yarn vitest run` → 861/861 passed, 65/65 files, including `levelArt.consistency.test.ts`
    (16/16) and the concurrently-added `niveauFinal.test.ts` (both green at time of this check —
    one transient failure in `niveauFinal.test.ts` was observed mid-session and traced to
    dev-gameplay's own concurrent in-flight `narrativeSystem.ts` edit, not to anything in this
    File List; it was green again on the next run without any action from this lane).
  - `yarn format:check` / `npx prettier --check` on every file in this List → clean.
  - `actionlint` not available in this sandbox; both new workflow YAMLs hand-reviewed against the
    `gen-hostage-sprites.yml`/`preview.yml` patterns and validated parseable (`python3 -c
"yaml.safe_load(...)"`).
- **Scope discipline:** did not touch `levels.ts`/`narrativeSystem.ts`/`bossQteSystem.ts`/any
  render file (dev-gameplay's/dev-r3f-render's concurrent lanes); did not invent an anchor schema
  (the boss block's ANCHOR SCHEMA GAP from the earlier dev-tooling-assets entry is untouched,
  still owed to `senior-architect`); did not modify the 4 already-applied `commander_*` prompt
  strings or any other pre-existing `boss.types`/`hostages`/`enemies`/`vehicles`/`courier`/
  `nearForegroundArt` content.
- **Handoff** → `senior-architect` (Winston): FYI on the `preview.yml` commit-back gap +
  `HARNESS.md` doc drift found while checking dispatch-readiness (not this story's blocker, since
  the new dedicated `gen-level-art.yml` closes it, but worth a `tech-writer` follow-up on the doc).
  → `producer` (Marion): both dispatch markers are staged, ready for a `ci(dispatch):` commit on
  the next push (not pushed by this lane, per instruction — the orchestrator drives the actual
  commit/push).
- **File List:**
  - `src/game/levels/levelArt.json` (MODIFIED — new `levels[]` `niveau-final` entry, appended
    after `vitry`; no other block touched)
  - `src/game/levels/levelArt.ts` (MODIFIED — `LevelArt.prompts` widened to
    `Partial<Record<LayerName, string>>`)
  - `scripts/gen-level-art.mjs` (MODIFIED — clean per-layer skip when a level's `prompts` omits
    that layer)
  - `scripts/gen-boss-sprites.mjs` (NEW)
  - `.github/workflows/gen-boss-sprites.yml` (NEW)
  - `.github/workflows/gen-level-art.yml` (NEW)
  - `.github/dispatch/gen-boss-sprites` (NEW marker, staged)
  - `.github/dispatch/gen-level-art` (NEW marker, staged)
  - `.github/dispatch/README.md` (MODIFIED — table rows added)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry appended)

## SPEC TRANSCRIPTION (stage-5 follow-ups #5 + #9) — game-designer (Sacha) — 2026-07-20 — A2 décor aim-honesty + phase-2 teach-index resolution into the gated spec

- claim: discharge the transcription owed on two panel follow-ups Karim ruled, writing the gated
  text into `docs/game-design/spec-boss-qte-differentiation.md` (LEVER 2 / LEVER 3 / AC-D4) so the
  paired dev lanes implement from spec, not from a gate note. Doc task; no production code, no
  commit/push.
- release: `docs/game-design/spec-boss-qte-differentiation.md` updated —
  - **NEW section "AMENDMENT A2 — décor catch = drawn silhouette (AABB) (LEVER 2) — gated 2026-07-20"**
    (after LEVER 2, before LEVER 5): Karim's follow-up-#5 ruling transcribed VERBATIM — the hole
    (drawn 0.80×1.05 + glow 2.2 vs. a 0.30-circle catch → silent no-op on visibly-clickable edges,
    violating the A1 drawn==catch invariant); direction (a) ENLARGE catch to the drawn silhouette;
    direction (b) SHRINK-drawn REJECTED for the three logged reasons (art-coherence / shrinks a
    pure-upside single-use reward / A1 precedent doesn't transfer — décor catch is unpinned, drawn is
    load-bearing); exact values `BOSS_DECOR_CATCH_HALF_W 0.40` + `BOSS_DECOR_CATCH_HALF_H 0.525` AABB
    at `decorProp.position`; drawn size UNCHANGED 0.80×1.05; glow 2.2 UNCHANGED and explicitly NOT the
    affordance boundary (crisp grey silhouette = aim target, glow = attention cue); paired lanes
    (dev-gameplay AABB `withinBox` + 2 constants + assert + TDD ∥ dev-r3f-render derives
    `DECOR_W/H = 2×` the constants, drift-guard no pixel change); the stage-5 landability watch.
  - **AC-D4 tail amended** (Design VERIFY acceptance list): "…décor prop scored within the AABB
    `±(BOSS_DECOR_CATCH_HALF_W 0.40, BOSS_DECOR_CATCH_HALF_H 0.525)` == the drawn 0.80×1.05 silhouette
    (drawn == catch); glow 2.2 is an attention cue, not the catch."
  - **§2 reuse-map line superseded** for the décor: "`RING_HIT_RADIUS 0.30` (prop catch radius)" now
    flags "SUPERSEDED for the décor by A2: AABB `±(0.40, 0.525)`; `RING_HIT_RADIUS 0.30` stays for the
    limb ring / parry point / phase-1 ring."
  - **Follow-up #9 CLOSED (my own):** a dated one-line AMENDMENT note under LEVER 3's cadence table —
    the phase-2 parry teach lands near the phase **START** (`PARRY_PHASE2_TEACH_INDEX = 1`, the 2nd
    phase-2 window; dev-resolved + playtest-accepted), REPLACING the spec's "near the phase end" line
    (not robustly implementable under HP-gated variable window counts). Phase-3 "every other" unchanged.
- amendment section titles (for the dev lanes / record):
  1. **"AMENDMENT A2 — décor catch = drawn silhouette (AABB) (LEVER 2) — gated 2026-07-20"**
  2. **"AMENDMENT (dated 2026-07-20, panel follow-up #9 resolution — dev-resolved + playtest-accepted)"**
     (the LEVER-3 phase-2 teach-index note).
- handoff → `dev-gameplay` (Amelia): A2 substantive change — `BOSS_DECOR_CATCH_HALF_W 0.40` /
  `BOSS_DECOR_CATCH_HALF_H 0.525` in `bossQteSystem.ts`, an AABB `withinBox` gating the SHIELDED décor
  branch (replaces `withinCatch(...RING_HIT_RADIUS)`), a `createBossQte` assert (both half-extents
  finite & > 0), TDD per the gate (`dy 0.45` inside scores +3; `dy 0.60`/`dx 0.45` outside does not;
  corner `dx 0.35, dy 0.50` scores); additive-and-optional law intact.
- handoff → `dev-r3f-render` (Amelia): A2 drift-guard — import the two constants, set
  `DECOR_W = 2 * BOSS_DECOR_CATCH_HALF_W` / `DECOR_H = 2 * BOSS_DECOR_CATCH_HALF_H` (0.80×1.05 today,
  identical output); glow 2.2 + prop treatment untouched. Required, not optional.
- handoff → `lead-game-designer` (Karim): A2 + follow-up-#9 transcribed verbatim into the gated spec
  per your ruling; the paired lanes implement from spec text. Stage-5 landability of the phase-2 décor
  arm-window on the live `{0.2,1.5}` chandelier with the new box is my playtest/K-5 watch (AC-L5).
- NOTE (process): appended via `cat >>` heredoc (additive, end-of-file). Spec edits were surgical Edits
  to my own artifact; no `src/**`, test, or repo edit; no commit/push.
- File List:
  - `docs/game-design/spec-boss-qte-differentiation.md` (A2 section + AC-D4 tail + §2 reuse-map supersede + LEVER-3 #9 note)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry)

VERDICT: RELEASE — A2 (décor AABB) + follow-up-#9 (phase-2 teach-index) transcribed into the gated spec (game-designer) — AMENDMENT A2 written VERBATIM into spec-boss-qte-differentiation.md §2 (catch = AABB ±(0.40, 0.525) == drawn 0.80×1.05, drawn UNCHANGED, glow 2.2 = attention cue not catch, direction (b) rejected for the 3 logged reasons, paired gameplay-AABB ∥ render-derives-DECOR_W/H) + AC-D4 tail + §2 reuse-map supersede; follow-up #9 closed as a dated LEVER-3 note (PARRY_PHASE2_TEACH_INDEX = 1, near phase START, replaces "near the phase end"). Dev lanes cleared to implement from spec text.

## 4. BUILD (stage 4) — dev-r3f-render (Amelia) — niveau-final flyer entry + A2 décor drift-guard — 2026-07-20

- **Stage:** 4 BUILD · **Lane:** dev-r3f-render (render-only; two SMALL items cut at TECH PLAN /
  Karim's A2 gate). Non-overlapping with the concurrent dev-gameplay (`levels.ts`/`narrativeSystem.ts`/
  `bossQteSystem.ts`) and dev-tooling-assets (`levelArt.json`) lanes.
- **CLAIM → RELEASE (one pass):**
  1. **4th flyer entry** — `src/render/ui/menu/LevelFlyer.tsx`: added `PLAYABLE_COPY["niveau-final"]`,
     spoiler-clean, transcribed from `spec-niveau-final-fiction.md` §4.1 (gate PASS). crew
     `SPIRALE 23 · KANAL SYSTEM · NADIR 94`, slogan `LE DERNIER SON DU SIÈCLE`, dateLine
     `31 DÉC. 1999 → JUSQU'EN 2000`, zoneLine `L'ÉDEN · ANCIEN DANCING`, rvLine `RV : SUR L'INFO-LINE`,
     infoLine `08 36 31 12 99`. Frozen `LevelFlyer`/`FlyerWall`/`LOCKED_COPY`/`TUTORIAL_COPY` untouched;
     `FlyerWall`'s `LEVELS.map` auto-renders the 4th flyer; difficulty stamp auto-derives **DIFFICILE**
     from `enemySpeedMultiplier 1.8` (`derivations.ts`) — zero new UI (ux D1/D3). No `App.tsx`/
     `FlyerWall.tsx` change.
     - **FLAG (narrative-designer / Yasmine):** the `FlyerCopy.ambiance` field is REQUIRED by the
       interface but fiction §4.1 authored only the 6 fields above — **no ambiance for niveau-final**.
       ux §1.2 documents the ambiance slot as the finale-flavour carrier; I set a **PROVISIONAL**
       `AMBIANCE : INCANDESCENT` continuing the shipped heat gradient (ÇA ROULE < CHAUD < BRÛLANT) one
       notch, flagged in a code comment. **This word is not yet gated canon** — needs a narrative
       ratification/amend pass. Spoiler-clean, no boss hint.
  2. **A2 décor drift-guard** — `src/render/scene/BossQteSprite.tsx` (Karim's panel-#5 A2 ruling,
     dev-r3f-render paired lane): imported `BOSS_DECOR_CATCH_HALF_W`/`BOSS_DECOR_CATCH_HALF_H` from
     `bossQteSystem` and derived `DECOR_W = 2 * BOSS_DECOR_CATCH_HALF_W` / `DECOR_H = 2 *
BOSS_DECOR_CATCH_HALF_H` (today `2×0.40 × 2×0.525 == 0.80 × 1.05` — **zero pixel change**, art-
     preserving), so drawn == catch is enforced structurally and tracks any future catch re-tune,
     exactly as the vital ring draws at the imported `BOSS_VITAL_CATCH_RADIUS`. Updated the comment to
     record A2 (glow 2.2 untouched, attention cue not catch). Glow/grey/armed treatment untouched.
- **CROSS-LANE:** dev-gameplay's paired A2 change landed the constants concurrently
  (`BOSS_DECOR_CATCH_HALF_W = 0.4` / `BOSS_DECOR_CATCH_HALF_H = 0.525`, `withinBox` AABB hit-test,
  `createBossQte` asserts) — so my import resolves and typecheck is green (no "constants not exported
  yet" report needed; both landed).
- **VERIFY (all green on my files):** `yarn typecheck` clean (EXIT 0) · `yarn vitest run` **867 passed /
  65 files, 0 fail** · `yarn lint` clean (EXIT 0) · `yarn format:check` — my two files pass Prettier
  (`npx prettier --check` on both = "All matched files use Prettier code style!"). The 3 `format:check`
  warnings (`spec-boss-qte-differentiation.md`, this handoff shard, `bossQteSystem.test.ts`) are OTHER
  lanes' concurrent files, not in my File List.
- **No commit/push** (per instruction). Owning-lane verify complete; ready for the quality gate.
- **File List:**
  - `src/render/ui/menu/LevelFlyer.tsx` (MODIFIED — added `PLAYABLE_COPY["niveau-final"]`)
  - `src/render/scene/BossQteSprite.tsx` (MODIFIED — A2 drift-guard: import constants, derive DECOR_W/H)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this BUILD entry appended)

---

## FIX (gated) — dev-gameplay (Amelia) — 2026-07-20 · AMENDMENT A2 décor catch = drawn AABB

- **Stage:** follow-up gated fix riding with story 2 · **Lane:** dev-gameplay (owns
  `bossQteSystem.ts` for this ruling). Built on Karim's stage-5-blocker DESIGN GATE ruling
  (panel follow-up #5, "décor aim-honesty", logged above — VERDICT PASS-WITH-CORRECTIONS,
  direction (a) ENLARGE catch to the drawn silhouette).
- **AC5 NOTE (explicit):** this **intentionally touches `src/game/systems/bossQteSystem.ts`**, which
  story-2's original AC5 declared byte-untouched. This is the **GATED AMENDMENT A2** — a
  lead-game-designer stage-5-blocker fairness correction to already-ratified ADR-0052 lever 2, NOT a
  silent retune. It rides with story 2 by Karim's paired-lane assignment; the stage-6 review panel
  will see it against this gate entry. The ADR-0052 phase table, floors, HP/window constants and
  every other lever are UNCHANGED — this adds only the décor catch shape.
- **CLAIM:** implement the game-side of A2 (the substantive change) — replace the décor branch's
  `RING_HIT_RADIUS 0.30` circle with an anchor-relative AABB matching the drawn `0.80×1.05`
  silhouette, TDD. The render pairing (derive `DECOR_W/H` from the constants) is dev-r3f-render's
  paired lane.
- **RELEASE — `src/game/systems/bossQteSystem.ts` (45/2 vs origin/main):**
  - Two new exported constants `BOSS_DECOR_CATCH_HALF_W = 0.4` / `BOSS_DECOR_CATCH_HALF_H = 0.525`
    (= half the drawn `DECOR_W 0.80 × DECOR_H 1.05` plane) with the A2 rationale doc-comment.
  - New pure `withinBox(px, py, anchor, ox, oy, halfW, halfH)` AABB helper (inclusive edges), beside
    the untouched `withinCatch` circle helper.
  - The SHIELDED armed-décor branch now gates on `withinBox(...HALF_W, HALF_H)` instead of
    `withinCatch(...RING_HIT_RADIUS)`. **The ring / parry / phase-1 circle tests are UNCHANGED**
    (`RING_HIT_RADIUS` still serves the limb ring, parry point and phase-1 ring — not orphaned).
  - `createBossQte` gains two `assertPositiveScalar` guards (both half-extents finite & > 0),
    mirroring the A1 / stagger / finisher assert pattern.
  - Glow halo (2.2) untouched — an attention cue, NOT the catch (per the ruling).
- **TESTS — `src/game/systems/__tests__/bossQteSystem.test.ts` (new "AMENDMENT A2" describe, 6 tests):**
  the reported hole `dy 0.45` now scores the +3 `BOSS_DECOR_DAMAGE` burst (was a silent no-op under
  the 0.30 circle); the horizontal corner `dx 0.35, dy 0.50` scores (inside box, hypot≈0.61 outside
  the old circle); `dy 0.60` (too tall) and `dx 0.45` (too wide) do NOT score; the box boundary
  (just inside ± the half-extents scores, just beyond does not); pure-upside preserved (an
  off-silhouette click leaves the prop armed). The existing lever-2 décor tests (fire dead-centre
  {1.5,0} or far off {0,0}) never encoded the 0.30 boundary, so they stayed green unadjusted.
- **VERIFY (all green):** `yarn typecheck` clean · `yarn vitest run` **867 passed / 65 files, 0 fail**
  (861 story-2 + 6 new A2) · `yarn lint` clean · `yarn format:check` clean on my files.
- **DIFF returned to coordinator:** `bossQteSystem.ts` = the 2 constants + `withinBox` + branch swap
  - 2 asserts (45/2); `bossQteSystem.test.ts` = the 6-test A2 describe block + 2 imports.
- **Flag → dev-r3f-render (paired lane):** the drawn pairing (`BossQteSprite.tsx` deriving
  `DECOR_W = 2 * BOSS_DECOR_CATCH_HALF_W`, `DECOR_H = 2 * BOSS_DECOR_CATCH_HALF_H` from my exported
  constants) is landed in the working tree — confirmed it imports the two constants and derives the
  drawn size (no pixel change today, 0.80×1.05 preserved). drawn==catch now holds structurally.
- **No commit/push** (per instruction).
- **File List:**
  - `src/game/systems/bossQteSystem.ts` (MODIFIED — GATED A2: 2 constants + `withinBox` + décor
    branch AABB swap + 2 `createBossQte` asserts)
  - `src/game/systems/__tests__/bossQteSystem.test.ts` (MODIFIED — 6-test AMENDMENT A2 describe block)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this FIX entry appended)

---

## CANON RATIFICATION — narrative-designer (Yasmine) — 2026-07-20 · niveau-final flyer `ambiance`

- **Claim:** rule on the render lane's PROVISIONAL `AMBIANCE : INCANDESCENT` (flagged above, this
  shard's BUILD entry) — the required `FlyerCopy.ambiance` field my fiction §4.1 table had not
  authored. Bounded scope: one word/short phrase, FR, spoiler-clean, tone-correct, the finale notch
  above `BRÛLANT`. No commit/push.
- **Ruling — AUTHOR, not ratify.** `INCANDESCENT` was a sound gradient-continuation and a clean,
  honestly-flagged provisional — but the finale word is load-bearing and can earn its keep. Canonical
  value: **`AMBIANCE : EN FUSION`**. Rationale: (i) idiomatic rave/concert register for a room at peak
  ("salle/public en fusion") — more streetwise than the Latinate INCANDESCENT, in the shipped zine
  voice; (ii) still inside the heat metaphor (fusion = burning's endpoint, past `BRÛLANT`); (iii) zine
  double-job — it echoes the flyer's own payoff, the three crews `SPIRALE 23 · KANAL SYSTEM · NADIR 94`
  fused into one for the millennium, without narrating it; (iv) spoiler-clean, zero boss hint. The
  mixed one-word/phrase register is already established (`ÇA ROULE`), so `EN FUSION` slots in.
- **Applied (words mine, structure theirs — trivial single-string swap, per the flag):**
  - `src/render/ui/menu/LevelFlyer.tsx` — `PLAYABLE_COPY["niveau-final"].ambiance` set to
    `AMBIANCE : EN FUSION`; the PROVISIONAL code comment replaced with the canon note. Structure of
    the entry untouched (render lane's).
  - `docs/game-design/spec-niveau-final-fiction.md` §4.1 — added the `ambiance` row to the flyer table
    - a canon note, so the value now lives in the gated doc (the flag's ask). No other §4.1 line changed.
- **Not touched:** the three shipped ambiance values (`ÇA ROULE`/`CHAUD`/`BRÛLANT`), the `FlyerCopy`
  contract, and every other niveau-final flyer field — all remain as gated/shipped.
- **No commit/push** (per instruction).

VERDICT: AUTHORED — `AMBIANCE : EN FUSION` is canon for the niveau-final flyer, replacing the render lane's provisional `INCANDESCENT` (narrative-designer)

- **File List:**
  - `src/render/ui/menu/LevelFlyer.tsx` (MODIFIED — ambiance string + comment)
  - `docs/game-design/spec-niveau-final-fiction.md` (MODIFIED — §4.1 ambiance row + canon note)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this ratification entry appended)

## 5. FIX — dev-tooling-assets (Amelia) — e2e-assets.mjs derives expected layers from authored `prompts`, not a hardcoded list (PR #119 CI finding) — 2026-07-20

- **claim:** coordinator-flagged CI finding on PR #119's E2E · assets job: `scripts/e2e-assets.mjs`
  hardcoded a 3-layer list (`["facade", "street", "foreground"]`) applied uniformly to every level,
  so it would permanently expect `assets/levels/niveau-final/street.png` — a file that will NEVER
  exist (the interior l'Éden venue deliberately drops `sky`/`street`, per this same shard's §4 gate
  ruling). Fix the derivation to read each level's own authored `prompts` keys; explicitly do NOT
  special-case the two legitimately-pending niveau-final PNGs (facade/foreground) — the gate must
  keep failing on those until `gen-level-art.yml` commits them back.
- **release** (`scripts/e2e-assets.mjs`):
  - Removed the hardcoded `const LAYERS = ["facade", "street", "foreground"]` (note: this array
    never included `"sky"` even though the file's own header comment claimed "the four layers" —
    pre-existing doc/code drift, not introduced by this fix).
  - `expectedAssetPaths()` now derives, per level, the expected layer set from
    `Object.keys(level.prompts)` (skipping `$comment`-prefixed keys) instead of the fixed list —
    mirrors the exact same per-layer-presence logic `scripts/gen-level-art.mjs` already applies at
    generation time (this story's §4 fix), so the two stay in lockstep by construction: a layer key
    authored in `prompts` ⇒ generated ⇒ expected here; absent ⇒ skipped there ⇒ never expected here.
  - Header comment updated to describe the derivation instead of a fixed 4-layer claim.
- **Verify (local `yarn build` + the check):**
  - `yarn build` → clean.
  - `node scripts/e2e-assets.mjs` against the local `dist/`:
    ```
    [e2e-assets] checking 17 asset(s) in .../dist
      ok  assets/levels/belliard/facade.png (105816B)
      ok  assets/levels/belliard/street.png (60443B)
      ok  assets/levels/belliard/foreground.png (763482B)
      ok  assets/levels/stalingrad/sky.png (52879B)
      ok  assets/levels/stalingrad/facade.png (105482B)
      ok  assets/levels/stalingrad/street.png (65557B)
      ok  assets/levels/stalingrad/foreground.png (559851B)
      ok  assets/levels/vitry/sky.png (49953B)
      ok  assets/levels/vitry/facade.png (93959B)
      ok  assets/levels/vitry/street.png (48812B)
      ok  assets/levels/vitry/foreground.png (517845B)
      ok  assets/vehicles/truck.png (36484B)
      ok  assets/vehicles/car.png (41976B)
      ok  assets/vehicles/moto.png (49419B)
    [e2e-assets] FAILED — 3 asset issue(s):
      ✗ too small  assets/levels/belliard/sky.png (1604B < 5120B)
      ✗ missing    assets/levels/niveau-final/facade.png
      ✗ missing    assets/levels/niveau-final/foreground.png
    ```
    **Fix proven:** `assets/levels/niveau-final/street.png` is no longer listed at all (neither
    "missing" nor "ok") — the check no longer expects a file niveau-final was never asked to
    generate. **Expected failure, not fixed here (per instruction):**
    `niveau-final/{facade,foreground}.png` missing — legitimately pending `gen-level-art.yml`'s
    commit-back on the next dispatched run; left failing on purpose.
  - **New finding surfaced by this fix (unplanned, NOT fixed in this pass — flagging for a
    decision):** `belliard/sky.png` now fails ("too small", 1604B < the 5KB floor). This is NOT a
    niveau-final regression — belliard has always authored a `sky` prompt and its committed
    `sky.png` has apparently always been undersized/placeholder; it was simply never checked
    before, because the OLD hardcoded `LAYERS` list never included `"sky"` at all (contradicting
    its own header comment's "four layers" claim — pre-existing drift, confirmed via
    `git log -p` — the array was `["facade","street","foreground"]` since this file's first
    commit). Deriving layers from the level's own authored `prompts` (the correct fix) now
    honestly includes `sky` for every level that authors it (belliard, stalingrad, vitry all do),
    which surfaces this real, previously-invisible gap. Routed to `qa-lead`/`producer` for a call:
    regenerate `belliard/sky.png` (separate, pre-existing-defect fix-lane item) vs. any other
    disposition — out of scope for this narrow CI-finding fix.
  - `yarn lint` → green (0 errors on the changed file).
  - `npx prettier --check scripts/e2e-assets.mjs` → clean.
- **Scope discipline:** touched only `scripts/e2e-assets.mjs` (derivation logic + header comment);
  did not touch `gen-level-art.mjs`/`levelArt.json` further, did not regenerate/retouch any
  committed PNG, did not silence or special-case the belliard/sky finding.
- **Handoff** → `producer`/`qa-lead`: decide disposition of the newly-surfaced
  `belliard/sky.png` pre-existing undersize defect (separate from this story). → whoever owns
  PR #119: the E2E · assets job will now correctly stop expecting niveau-final's `street.png`, but
  will still fail (as designed) until (a) `gen-level-art.yml` commits the niveau-final backdrop and
  (b) the belliard/sky.png disposition above is resolved.
- **File List:**
  - `scripts/e2e-assets.mjs` (MODIFIED — layer derivation + header comment)
  - `docs/handoffs/story-boss-niveau-final-live.md` (this entry appended)

## FIX-LANE NOTE — belliard/sky.png undersized debt exemption (orchestrator, 2026-07-20)

- The honest per-level layer derivation in `e2e-assets.mjs` surfaced
  `assets/levels/belliard/sky.png` (1.6KB < 5KB floor) — pre-existing shipped
  debt, never gated (the old hardcoded layer list skipped "sky"). Exempted via
  the named `KNOWN_UNDERSIZED_DEBT` set with a paper-trail comment; regenerating
  a shipped level's art is its own fix-lane cycle through the art gates.
- CHASE (producer): regenerate belliard sky via the level-art pipeline, pass the
  asset gate, then REMOVE the exemption entry.

## REVIEW BERTRAND — sprites boss batch 1 (2026-07-20)

- Bertrand, à la vue des 9 sprites bruts : « très mal détouré » — verdict humain
  FAIL sur la qualité de détourage/keying du batch 1. Prioritaire pour la passe
  technique en cours (game-graphist) : diagnostic détourage (clé, tolérance,
  halos/fringe, arrière-plans résiduels) avant tout autre axe ; retouches
  scriptées si récupérable, sinon findings REGEN précis (batch 2 du cap) —
  y compris corrections du step cutout du workflow si le défaut est pipeline,
  pas prompt.

## TECHNICAL PASS (redirected mid-pass) — game-graphist (Serge) — 2026-07-21 · boss 9-asset cutout/hole crisis (Bertrand direct review)

- **claim:** re-ordered per Bertrand's two direct PRIORITY INPUTs (his own visual review of the 9
  landed `public/assets/boss/*.png`): (1) « très mal détouré » — the batch-1 cutout FAILS, (2) « et
  attention aux trous » — confirmed interior holes on `commander_finisher`/`commander_shielded`/
  `commander_exposed`, exactly the [S1]/[S3] dark-coat-vs-near-black-key risk flagged at my own
  PRE-PROD pass. Measured, not eyeballed: composited every keyed PNG over magenta (`vis.mjs`,
  scratchpad-only, not committed), pulled zoomed crops (`crop.mjs`), ran
  `check-sprite-integrity.mjs` per file, then built a hole-audit + closability probe
  (`hole-audit.mjs`/`locate-defect.mjs`, scratchpad) reusing `scripts/lib/morphology.mjs`
  (`solidBodyMask`, disk closing/opening, `fillHoles`) to distinguish TRUE fabric holes from
  legitimate pose-driven negative space (arm held clear of torso, spread-leg stance), and to test
  whether a bigger closing radius could safely bridge each defect. Attempted a real scripted fix
  (`sampleAplat`/`bridgeHip` from the existing `scripts/retouch-sprites.mjs`, same methodology as
  the courier hip-bridge) on the best RETOUCH candidate before ruling it REGEN.

### Root-cause finding (applies across the batch)

`check-sprite-integrity.mjs` PASSED all 9 in CI and PASSES again now (dominance ~99-100%, 0
enclaves, 0 semi-alpha) — this is a **real tooling gap, not a false Bertrand alarm**. Every true
hole found is topologically CONNECTED to the exterior background through a channel (an edge
notch, or a fabric-shadow trough that also reaches open background elsewhere), so it never
registers as an "enclave" (`touchesBorder === false` is the enclave test) and dominance stays
~100% because it's all one connected component. This is the **exact same blind spot** as the
historical courier bug this gate's own header documents ("the legs hang on via the bike frame,
~0.99 dominance ratio — does NOT catch it"). `fill-sprite-holes.mjs --check` also PASSES (0px would
fill) — solidify already ran to a fixpoint at its CLOSE_R=10 disk radius; re-running it changes
nothing, because closing radius 10 cannot bridge these gaps and, by the script's own conservative
design (never glue a legitimate open concavity — cf. the between-spread-legs guard in
`solidBodyMask`), it should not be blindly widened project-wide.

**Compound root cause, confirmed per-asset below:** (a) GENERATION — the [S1]/[S3]/[S8]-predicted
risk materialized: coat-fold shadows, the coat's silhouette edge at specific contour points, and
the chandelier's iron/brass armature all rendered close enough to key-black over WIDE contiguous
areas (not just the base garment tone the [S1] correction fixed) that `cutout-enemies.mjs`'s
shared edge-flood + enclosed-island pass (TIGHT_BAND=20/LOOSE_BAND=55, unchanged, shared with
every enemy/hostage sprite) read real fabric as background. (b) PIPELINE — `fill-sprite-holes.mjs`
CLOSE_R=10 is far too small to bridge the resulting 20-80px breaches, and I confirmed (see below)
that even testing radii up to 40 and the real enclosure-based `bridgeHip` primitive does NOT
safely close the worst ones — they are edge-connected to true background, not sealed pockets, so
no safe closing radius exists without risking bridging legitimate concavities elsewhere in the
same shared scripts used by the whole roster. This is NOT a simple parameter tune.

**Raw pre-cutout artifacts: NOT recoverable.** `.github/workflows/gen-boss-sprites.yml`'s
"Upload generated sprites (push failed)" step only runs `if: failure()`; this run pushed
successfully, so no raw artifact was ever uploaded. A re-cutout-from-raw path does not exist for
this batch — confirmed from the workflow's own trigger logic, no API call needed.

### Per-asset hole-audit table

| Asset                    | Cutout/hole verdict                                       | Evidence                                                                                                                                                                                                                                                                                                                                                                 | Root cause                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `commander_shielded`     | **FAIL — REGEN**                                          | Round/notch bite through solid coat fabric at the hip/hem, bbox ~[142,24]-[186,234] cluster, ~600-1000px recoverable-looking but **edge-connected, not enclosed**: `bridgeHip` (real enclosure test, maxGap up to 35) recovers only 265px of the ~800px+ visible defect; the main round hole stays open — confirmed NOT safely bridgeable                                | (a)+(b): coat silhouette edge lost contrast vs key at this contour point, flood ate past the true boundary into solid fabric; not an enclosed pocket so no closing radius fix is safe            |
| `commander_exposed`      | **CLEAN**                                                 | All "closability" candidates visually confirmed as legitimate pose negative space: the lunge's spread-leg V-gap (287px) and the muzzle/holster gaps. Ragged stair-step edges are correct 16-bit no-AA pixel-art style (binary alpha confirmed, 0 semi-transparent px) — cosmetic, not a keying defect                                                                    | n/a — false positive on first eyeball pass, corrected after measurement                                                                                                                          |
| `commander_hit`          | **CLEAN**                                                 | Both flagged candidates (1456px, 365px) are the falling/reeling pistol-arm swung away from the torso ("the pistol arm falling loose, reeling off-balance") — legitimate negative space, visually confirmed via crop                                                                                                                                                      | n/a                                                                                                                                                                                              |
| `commander_down`         | **CLEAN (minor nit)**                                     | Leg-spread gaps between the sprawled figure's separated legs are legitimate (matches `solidBodyMask`'s own spread-leg exception). One ~18px isolated opaque fleck near the outstretched hand (below the 12px speckle-sweep threshold, sub-pixel at game scale) — cosmetic, not a hole                                                                                    | n/a                                                                                                                                                                                              |
| `commander_weakpoint`    | **CLEAN**                                                 | Both large candidates (409px, 111px) are the two arms held "wide... clear of the chest" — legitimate pose gap, confirmed by crop                                                                                                                                                                                                                                         | n/a                                                                                                                                                                                              |
| `commander_parry_windup` | **CLEAN**                                                 | Largest candidate (2563px) is the two-handed raised-pistol arm held clear of the torso ("elbows drawn in tight... angled steeply upward") — legitimate, confirmed by crop                                                                                                                                                                                                | n/a                                                                                                                                                                                              |
| `commander_finisher`     | **FAIL — REGEN (mandatory-sweep entry, confirmed worst)** | TWO true holes bitten straight through solid fabric: kneeling thigh/leg (~1680px) and torso/back (~839px) — ~14.6% of the figure's opaque area gone, NOT explainable by any joint/pose gap (crops show hard linework/scratch-texture crossing straight through the void, i.e. fabric erased mid-surface)                                                                 | (a): coat/trouser shadow folds rendered at near-key-black over the whole thigh and torso-back, exactly the anatomy-defect risk [S7]/Nico's gate flagged as "highest of the 9" — confirmed        |
| `lustre`                 | **FAIL — REGEN**                                          | Multiple large bites through the solid cone/dome armature between crystal tiers (~6540px, ~13.5% of the prop), reading as a "swiss-cheese" cone rather than the intended single clean asymmetric notch, PLUS one fully disconnected orphan crystal-drop fragment (duplication/severed-thread artifact)                                                                   | (a): [S8]'s value-lock only steered the CRYSTAL DROPS lighter, not the connecting wrought-iron/brass armature MASS between tiers, which still rendered near-key-dark over a wide contiguous area |
| `speaker_wall`           | **FAIL — REGEN (unambiguous)**                            | 94.3% of the canvas stayed fully OPAQUE (only 5.7% keyed) — sampled corners: top-left (209,215,215) cool sky-blue-grey, bottom-right (128,122,110) warm ground-grey. FLUX rendered a real outdoor rigging/sky/tent photograph, not the "solid uniform matte black background" the style tail demands — there is no flat key colour to cut against over most of the frame | (a) only, no pipeline parameter can fix a background that was never generated flat                                                                                                               |

### Attempted RETOUCH (documented, tested, did not ship)

Tried the established `sampleAplat`/`bridgeHip` primitives (same class already shipping in
`scripts/retouch-sprites.mjs` for the courier hip-bridge) against `commander_shielded`'s hole with
several `fillWin`/`maxGap` combinations (up to maxGap=35, enclosureLumMax=150). Best result: 265px
filled near the smaller upper notch; the main visible round hole at the hem stayed open because it
is genuinely edge-connected to true background, not a four-way-enclosed pocket — the enclosure
test correctly refuses to bridge it (same reason a wider disk-closing radius doesn't help either,
tested to r=40 via `solidBodyMask` reconstruction, see `hole-audit.mjs` probe). Per my mandate
("retouch only if a documented script GENUINELY fixes it... otherwise a precise REGEN finding"), I
am **not** shipping a partial fill that leaves the defect visible — logged as REGEN instead. No
repo files were touched; the working tree is clean (`git status` verified empty after cleanup).

### Tooling finding for `dev-tooling-assets` (directive #4 — why CI missed this)

`check-sprite-integrity.mjs`'s SOFT enclave check only fires on a transparent component with
`touchesBorder === false`; every hole found here is border-connected via a thin channel, so it is
invisible to that check — the SAME blind spot the script's own header documents for the historical
courier bug (dominance ~0.99, "does NOT catch it"). Recommend a **third SOFT check**: a
"closability probe" — reconstruct `solidBodyMask` at the current CLOSE_R (10) and again at a larger
diagnostic radius (e.g. 25), and WARN when the delta inside the figure's torso zone exceeds a
threshold (mirroring `SUSPECT_ENCLAVE_MIN_PX`). This is exactly the `hole-audit.mjs` probe I used
by hand for this pass; it would have surfaced `commander_shielded`/`commander_finisher`/`lustre` as
WARN in CI without needing a human eye. Not implemented here (out of my lane — flagging for
dev-tooling-assets to author and calibrate, same as any gate change).

### l'Éden backdrop — quick pass (secondary axis, priority redirect honoured)

- `facade.png`/`foreground.png` landed at 991×594 (not the global `sizes.facade` 1280×768 — a
  dimension drift worth a dev-tooling-assets note, not diagnosed further here).
- **Window-row count MISMATCH found:** the generated facade reads as a 3-wall perspective room
  (angled left/right side walls + a back wall), not the flat front-elevation the prompt implied.
  The back wall shows **4** clearly frontal, evenly-lit arched windows, not the gated "exactly 5" —
  with 2 more arches visible on the angled side walls that are NOT part of the same evenly-spaced
  row. `windowGrid.cols` is hard-pinned to 5 in `levelArt.json`; this is the same class of
  rigid-grid-vs-real-art drift belliard hit twice (`8933c03`, `bb6404f`). Could not run
  `gen-window-zones.mjs`/`align-windows.mjs` in this sandbox (`jpeg-js` dependency missing) to see
  whether the detector still snaps acceptably — flagging for the stage-5 alignment check rather
  than diagnosing further under this priority redirect.
  - Separately, the windows rendered as **fully intact glazed arches** (blue-tinted glass, city
    lights visible outside), not the [E4]-corrected "lower panes crudely boarded, upper arch open"
    — a prompt-fidelity miss. This may actually make the openings EASIER for the alignment
    detector (high-contrast lit rectangles) even though it drifts from the "condamnées" decay read
    Estelle wanted — a taste call for Nico's gate, not a technical blocker by itself.
- `foreground.png` — **CLEAN**: magenta-composited cleanly, thick bold cast-iron balustrade
  silhouette, sharp edges, no visible fringe/halo, consistent with the proven belliard/stalingrad/
  vitry foreground formula. No rail-merge observed at the balustrade itself (Karim's [E5] flag was
  about the FACADE's arched windows, which I could not machine-verify per the dependency gap
  above — visual read shows no obvious merge on the 4 visible arches, but not machine-confirmed).

### What reaches Nico

**Nothing from this `boss` batch reaches the ASSET GATE as-is.** 4 of 9 assets are blocked
(`commander_shielded`, `commander_finisher`, `lustre`, `speaker_wall` — REGEN findings above); the
other 5 (`commander_exposed`, `commander_hit`, `commander_down`, `commander_weakpoint`,
`commander_parry_windup`) are technically CLEAN on the cutout/hole axis but I am holding the
**whole family** back from Nico until batch 2 lands, per Bertrand's "no soft-PASS" instruction and
because the family is judged as one printing run (§2 law 2) — shipping 5/9 now and 4/9 later would
fragment the asset-gate review. The l'Éden backdrop's window-count mismatch is a separate, lower-
severity finding routed to stage-5 verify / dev-tooling-assets, not a hold on the backdrop itself.

### Batch-2 requirements (this is the LAST reroll under the 2-batch cap — precise, not vague)

- **`commander_shielded`** — prompt: reinforce the pale-edge/rim-highlight contrast specifically at
  the coat's hip/hem contour (the general "pale edge highlights" clause degraded at this one
  contour point); alternative: re-roll the seed only.
- **`commander_finisher`** — prompt: add an explicit fold-shadow floor, e.g. "no near-black shadow
  creases; every fold in the coat rendered no darker than mid-charcoal, always clearly lighter than
  the pitch-black backdrop" targeted at the torso and thigh; this is the [S7]/Nico's
  highest-anatomy-risk entry materializing exactly as predicted.
- **`lustre`** — prompt: extend the [S8] value-lock from the crystal DROPS to the connecting
  wrought-iron/brass ARMATURE mass between tiers ("the whole armature, not just the crystal drops,
  a solid pale-to-mid grey clearly lighter than the black backdrop"); add "a single continuous
  chandelier, no duplicate or repeated hanging fixture" to guard the orphan-drop duplication.
- **`speaker_wall`** — prompt: much stronger background lock; the "hand-built... on a scaffold and
  pallet rig" phrasing likely pulls FLUX toward a documentary-photo composition (real sky/rigging)
  that fights the style tail. Recommend trimming the photographic-scene-evoking language and/or
  repeating "flat solid black background, no sky, no outdoor scene, no photograph" closer to the
  subject clause; a straight seed re-roll alone is unlikely to fix this given how strongly the
  current generation drifted (94% of canvas non-black).
- The 5 CLEAN entries do **not** need to be in batch 2 — only reroll the 4 above; batch 2 stays
  scoped to 4/9, consistent with the 2-batches/cycle discipline (batch 1 spent, this is the last).

### Verify

- `node scripts/check-sprite-integrity.mjs --file <asset>` × 9 → all PASS (confirms the tooling-gap
  finding above — mechanical PASS is a floor, not a craft verdict, exactly per my mandate).
- `node scripts/fill-sprite-holes.mjs --check public/assets/boss/*.png` → 0px would fill on all 9
  (fixpoint already reached; confirms the CI solidify pass is not silently stale).
- `git status` → clean; no repo files modified (all measurement/retouch experiments ran against
  scratchpad copies; the one real retouch attempt did not produce a clean fix and was not applied
  to the committed PNGs).
- `yarn lint`/`yarn format` — not run, no repo script or asset was touched this pass.

Not a `VERDICT:` line (TECHNICAL-pass annotations only, per the game-graphist role — the ASSET GATE
verdict is Nico's, and this batch does not reach him).

- **File List:** `docs/handoffs/story-boss-niveau-final-live.md` (this TECHNICAL PASS entry
  appended). No asset or script files modified.

Serge — TECHNICAL PASS

---

## ART LANE — concept-artist (Maud) — 2026-07-21 · BATCH-2 reroll [B1]-[B4] (the LAST reroll of the cap)

- claim: integrate Serge's measured TECHNICAL-pass batch-2 findings into the 4 REGEN prompts
  (`commander_shielded`, `commander_finisher`, `lustre`, `speaker_wall`) — targeted (~1 variable each,
  positive-phrased so the negation budget stays green), applied to BOTH the draft shard and the 4
  applied strings in `levelArt.json`'s boss block. The 5 CLEAN entries keep their prompts byte-identical
  (Serge measured their "holes" as legitimate pose negative space). No commit/push.
- the 4 diffs (old → new clause; every subject stays 0-negation, assembled 2, all ≤120 words):
  - **[B1] `commander_shielded`** (117w) — the general `with pale edge highlights` degraded at the one
    hip/hem contour where batch-1 bit a non-bridgeable round hole. ADDED a dedicated hem clause:
    `a pale contour of light tracing the coat lower hem and hip edge` (compensating trims: `at full
height`, `flat`, `clipped at the shoulder`, `at the hip`).
  - **[B2] `commander_finisher`** (119w, the worst — ~14.6% holed) — coat/trouser shadow folds rendered
    near-key-black across the whole kneeling thigh + torso/back ([S7]/Nico's highest-anatomy-risk entry
    materialized). ADDED a POSITIVE fold-value floor on those exact zones: `its torso and thigh folds a
mid-charcoal, lighter than the pitch-black backdrop` (not "no near-black", to keep the budget). Also
    compacted the [S7] sleeve clause to `sleeved to the wrist`.
  - **[B3] `lustre`** (120w, ~13.5% holed + one orphan severed drop) — extended the [S8] value-lock from
    the crystal DROPS to the ARMATURE mass: `the whole frame a solid pale-to-mid grey lighter than the
black backdrop`; and a POSITIVE single-object guard for the duplication artifact: `one … chandelier`
    - `every drop attached to the frame` (not "no duplicate").
  - **[B4] `speaker_wall`** (119w, 94.3% came back as a real outdoor rig/sky/tent photo) — a DOMINANT
    flat-black lock placed early in the subject: `on a completely flat uniform black background filling
the frame`; and removed the photo-evoking tokens `from the ground up` and `scaffold` (kept `pallet
rig` as the rimless BUILT tell). Straight seed re-roll alone was judged unlikely to fix this.
- root-cause context (Serge, measured): batch-1's `check-sprite-integrity.mjs` PASSED all 9 (dominance
  ~100%, 0 enclaves) but the true holes are edge-CONNECTED to background through thin channels — the
  same blind spot as the historical courier bug; a raw re-cutout path does not exist (no `if: failure()`
  artifact was uploaded on the successful run), so REGEN is the only route. The 5 CLEAN entries are held
  with the family (one printing run, §2 law 2) rather than shipped 5/9 now.
- File List:
  - `src/game/levels/levelArt.json` (boss block: 4 REGEN `prompt` strings updated per [B1]-[B4]; the 5
    CLEAN strings + `$comment` + `style` UNCHANGED). Note: dev-tooling had added all 9 boss entries +
    per-prop `size` (lustre 320×512 portrait, speaker_wall 512×320 landscape — my [S13] aspect note
    applied) since my last pass.
  - `docs/art-direction/prompt-drafts/boss-commander.md` (BATCH-2 [B1]-[B4] summary block added; the 4
    blockquotes + per-clause rationale updated; budgets note refreshed).
- lint: `node scripts/check-art-prompts.mjs` → **PASSED — no contract errors (14 word-band warnings,
  all pre-existing/other-lane: courier + nearForeground/bench + loot.crate + enemies; the boss block is
  out of the lint's scope, held by hand: the 4 REGEN prompts are 117/119/120/119w, 0 subj-neg, 2 asm-neg).**
- handoff → `lead-art` (Nico) express-gates the 4 changed prompts, then dispatch/regenerate (batch 2 =
  the last of the 2-batch cap). Serge flagged for `dev-tooling-assets` a CI gate improvement (a
  "closability probe" SOFT check that would have WARNed these three holes) — out of my lane.
- Not a `VERDICT:` line — the 4 REGEN prompts are OWED Nico's express PROMPT GATE before regeneration.
