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
