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
