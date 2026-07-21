# 0053 — "Le Commandant" goes live: the Niveau Final level ships the frozen boss system as pure DATA

- **Status:** Accepted (built and shipped, PR #119, 2026-07-21 — the AC8 sequencing gate below
  cleared and all dev lanes landed; see "Revision 1" at the end of this ADR for the four
  amendments sanctioned en route and the resulting doc corrections)
- **Date:** 2026-07-20
- **Number:** 0053, **allocated by `producer` (Marion)** at DESIGN/TECH-PLAN stage and recorded in
  the story shard (`docs/handoffs/story-boss-niveau-final-live.md` §"STAGE 2 COMPLETE" +
  this TECH PLAN entry) — not self-allocated (the ADR-README rule; the guard against the
  duplicate-number bug).
- **Extends (does NOT supersede):**
  [ADR-0051](./0051-boss-qte-encounter-system.md) (the boss QTE encounter system, "le Commandant")
  and [ADR-0052](./0052-boss-qte-differentiation-levers.md) (the 5 differentiation levers). This ADR
  is to those two exactly what ADR-0052 was to ADR-0051: it EXTENDS the contract in place by
  authoring **one new `LevelConfig` + its narrative + flyer + backdrop data**, and states, per file,
  what is reused vs. newly authored. **Both prior ADRs stay Accepted and are NOT amended, retuned,
  or re-litigated — every constant, phase, floor and lever they froze ships here byte-for-byte.**
- **Related:** `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md` (the story, AC1–AC10,
  the binding Architecture directive); the three gated design specs —
  `docs/game-design/spec-boss-niveau-final-level.md` (pacing + live `bossQteSpec` data),
  `docs/game-design/spec-niveau-final-fiction.md` (l'Éden venue canon + script wiring),
  `docs/game-design/ux/spec-niveau-final-ux.md` (zero-new-UI, onboarding, retry loop);
  `src/game/levels/levels.ts`, `src/game/levels/levelArt.json`,
  `src/game/systems/narrativeSystem.ts` (+ `__tests__/narrativeSystem.test.ts`),
  `src/render/ui/menu/LevelFlyer.tsx`, `src/render/ui/menu/FlyerWall.tsx`, `src/render/scene/App.tsx`;
  [ADR-0023](./0023-narrative-scene-location-backdrop.md) (the per-scene backdrop path convention
  test A5 enforces), [ADR-0012](./0012-optional-scripted-tutorial-stage.md) (the pre/post narrative
  keying), [ADR-0004](./0004-enemies-car-hostage-taker.md) (the per-level roster `windowWeights`),
  [ADR-0010](./0010-art-direction-pipeline.md) (the gated-prompt / seeded-generation pipeline the
  new backdrop rides).

## Context

`story-boss-niveau-final-live` (opened on Bertrand's direct instruction, "n'oublie pas d'inclure le
boss dans le stage") ships the ADR-0051/0052 boss system LIVE for the first time — canon,
menu-visible, progression-gated — on a new minimal **Niveau Final** level (l'Éden, 31 déc. 1999). The
design loop gated PASS (`lead-game-designer`, shard) and `pm` cleared scope (AC9, "CLEARED FOR TECH
PLAN"). The story's binding Architecture directive: treat this as **data + narrative wiring only**
against the **frozen** boss contract — not a system-design pass.

Forces read from the **real code** at TECH PLAN (verified independently, not on the specs' word):

- **`LevelConfig`/`BossQteSpec` already carry every field the live level needs** (`levels.ts:19–56`;
  `BossQteSpec` = `zoomSeconds, anchor, phaseCount, bossHp, maxBlownWindows, targetSeed, decorProp?`).
  The non-shipped `BOSS_QTE_DEV_HARNESS_LEVEL` (`levels.ts:221–248`) already exercises this exact
  shape. The live level is a re-anchored / re-seeded / décor-re-sited **copy of tuned data into an
  existing shape** — no new field ⇒ no `types/bossQte.ts` change.
- **The whole shell is data-driven and needs no code change.** `App.tsx` keys everything off level
  id/index: the unlock hop `LEVELS[shippedIdx + 1]` on `LEVEL_COMPLETE` (`App.tsx:232–246`), the
  narrative gates `PRE_/POST_LEVEL_NARRATIVE[selectedLevel.id]` (`App.tsx:251, 275, 359, 375`), and
  `FlyerWall`'s `LEVELS.map` (`FlyerWall.tsx:60, 151`). Appending a level + its narrative keys + a
  flyer-copy entry flows through **with zero `App.tsx`/`FlyerWall.tsx`/state-machine change** — the
  same mechanism every prior level addition used.
- **The boss triggers on the real quota crossing (AC4).** `stateMachine.ts` routes
  `kills >= enemiesToWin` to `LEVEL_COMPLETE` only when `bossQteSpec === null`; a non-null
  `bossQteSpec` suppresses the instant complete and hands the crossing to `shouldTriggerBossQte`.
  `enemiesToWin: 16` (real, non-zero — not the harness `0` instant-trigger) makes the duel the
  earned terminal beat.
- **The hostage/boss mutual exclusion is a load-time throw** (`stateMachine.ts`, verified at Karim's
  gate): a level authoring both `hostageQte` and `bossQteSpec` throws. The live level authors **no**
  `hostageQte`; `windowWeights {normal 40, riot 28, biker 20, bonus 10}` merges over defaults, so
  `civilian`/`hostage_taker` keep default `weight 0` and stay out of the pool (AC1 by construction).
- **The narrative layer has test-enforced invariants** (`narrativeSystem.test.ts`): A1 (PRE and POST
  cover the identical key set), A2 (`scene.id === "<key>_pre"/"_post"`), A5 (every PRE/POST scene
  carries `backdrop: "assets/levels/<key>/facade.png"`, ADR-0023). These force the two wiring
  adaptations the fiction spec flagged (below), and are the correctness gate for them.
- **No canon boss art is consumed by any render path today.** The render draws every boss read
  **procedurally on the `enemy_riot`/cop fallback** (ADR-0052 Context); the `boss` block in
  `levelArt.json` carries prompts only, with no `gen-boss-sprites.mjs` and no render-side
  registration yet (its `$comment` marks structure provisional, owned by dev-tooling-assets).

## Decision

### D1 — The boss goes LIVE via pure DATA authored into frozen shapes. No system, no shell, no boundary change.

The live-ship is **one appended `LevelConfig`** (`levels.ts`) carrying a non-null `bossQteSpec` +
its **narrative scenes** (`narrativeSystem.ts`) + its **backdrop art block** (`levelArt.json`) + its
**flyer copy** (`LevelFlyer.tsx`). The game↔render bridge (`useGameLoop.ts`), the state machine, the
freeze law, the unlock chain, the narrative machinery, and both boss-system files are **untouched**.
Cross-boundary surface added by this story = **zero**. Canonical level id, fixed here so every lane
keys off one string: **`niveau-final`**.

### D2 — The touch map, per file (this IS the lane partition)

| File                                                                | Lane                               | Change                                                                                                                                                                                                                                                                                                                                                                       | AC8-gated?         |
| ------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `src/game/levels/levels.ts`                                         | **dev-gameplay**                   | APPEND one `LevelConfig` `niveau-final` after `vitry` (`enemySpeedMultiplier 1.8`, `enemiesToWin 16`, `timeSeconds 70`, one `truck` delivery ≈Vitry, `roster.windowWeights {normal 40, riot 28, biker 20, bonus 10}`, `bossQteSpec` per D4). No `hostageQte`. Tutorial/belliard/stalingrad/vitry + `BOSS_QTE_DEV_HARNESS_LEVEL` byte-untouched.                              | **YES**            |
| `src/game/systems/narrativeSystem.ts` (+ `__tests__`)               | **dev-gameplay**                   | ADD `niveau-final` keys to BOTH `PRE_LEVEL_NARRATIVE` and `POST_LEVEL_NARRATIVE` (A1), scene ids `niveau-final_pre`/`_post` (A2, flag A), each with `backdrop: "assets/levels/niveau-final/facade.png"` (A5, flag B). French lines **verbatim** from `spec-boss-encounter-fiction.md` §4 — only the id/key/backdrop strings are new.                                         | no (but same lane) |
| `src/game/levels/levelArt.json`                                     | **dev-tooling-assets**             | ADD a `levels[]` `niveau-final` block (single-facade mode, like vitry/stalingrad): `prompts.facade` = l'Éden hall interior + `windowGrid`/`parallax`/`sky`/`street`/`foreground`. Generates `assets/levels/niveau-final/facade.png` via `gen-level-art.mjs`. Separately (open art lane, non-blocking): the 5 new `boss`-block sprite JSON entries (structure only) — see D6. | no                 |
| `src/render/ui/menu/LevelFlyer.tsx`                                 | **dev-r3f-render**                 | ADD one `PLAYABLE_COPY["niveau-final"]` entry (crew/slogan/date/zone/rv/info) transcribed from `spec-niveau-final-fiction.md` §4.1. Frozen `LevelFlyer`/`FlyerWall`/`LOCKED_COPY` otherwise untouched.                                                                                                                                                                       | no                 |
| `docs/adr/0053-*.md`, `docs/adr/README.md`, `public/adr/index.html` | **senior-architect / tech-writer** | This ADR + the regenerated index (`gen-adr-index.mjs --write`).                                                                                                                                                                                                                                                                                                              | no                 |

**`App.tsx`, `FlyerWall.tsx`, `stateMachine.ts`, `useGameLoop.ts`, `bossQteSystem.ts`,
`types/bossQte.ts` — ZERO lines. Confirmed data-driven / frozen.** Every lane works a
**non-overlapping** path; the one cross-lane contract is the id string `niveau-final` (fixed above)
and the backdrop path convention `assets/levels/niveau-final/facade.png` (dev-tooling generates the
asset from its `levels[]` block; dev-gameplay references the path string in flag B — the string is
valid before the PNG exists).

### D3 — What is FORBIDDEN to change (AC5), and the review-assert that enforces it

`src/game/systems/bossQteSystem.ts` and `src/game/types/bossQte.ts` are **byte-untouched**: no new
field, constant, branch, phase, floor or lever. The live `bossQteSpec` is authored **only** into the
existing `BossQteSpec` shape. Any tuning gap found at this story's own stage-5 playtest (boss reads
short/long slotted after Vitry, phase pacing, charged cadence, renfort count, a 2nd décor prop, a
spawn-interval field) is a **logged correct-course against THIS story** — decided by
`lead-game-designer` + `pm` — **never** a silent edit to the ADR-0052 contract, and never a quiet
value smuggled into the level data. The `decorProps[]` array promotion (2nd prop) and any per-level
spawn-interval field remain deferred F3 seams.

**Review-assert (mine, at the stage-6 panel triage):** `git diff origin/main...HEAD` shows **zero
changed lines** in `src/game/systems/bossQteSystem.ts` and `src/game/types/bossQte.ts`, and zero
changed lines in the `tutorial`/`belliard`/`stalingrad`/`vitry` `LevelConfig` objects and in
`BOSS_QTE_DEV_HARNESS_LEVEL` (AC2/AC3/AC5). Any hit is a blocking finding.

### D4 — The live `bossQteSpec` values + seed / K-5 re-pin discipline

Authored per `spec-boss-niveau-final-level.md` §2, into the frozen shape:

- **Unchanged (verbatim from the tuned contract):** `zoomSeconds 2`, `phaseCount 3`, `bossHp 24`,
  `maxBlownWindows 10`.
- **Re-anchored (permitted per the story's own directive):** `anchor { x: 0, y: -5 }` (centred hall
  tableau). `x` **may nudge once the backdrop lands** to avoid a dead-gap behind the boss — the exact
  Vitry `x: 9.9` sky-gap precedent — an art/framing seam resolved at stage-5, still pure data, not a
  system change.
- **Décor re-sited:** `decorProp { position: { x: 0.2, y: 1.5 }, armPhaseIndex: 1 }` — the hall
  chandelier, overhead, pure-upside +3 burst (single optional prop; the `mur d'enceintes` is the
  reserved F3 second prop, not authored).
- **Seed re-pinned, PROVISIONAL `19991231`:** a **pinned, winnable, stage-5-re-verified** seed —
  **never** per-run/random (runtime randomness is architecturally illegal under the determinism law,
  ADR-0051/0052 D5, and cannot carry the §5.6 winnability guarantee). K-5 obligation, owned by
  `game-designer` at stage-5: confirm on the pinned seed that every phase-2/3 window presents ≥1
  landable decelerating waypoint on **each** ring, every charged window a landable parry, and the
  phase-2 décor arm-window is landable — **or re-pin the seed** (a data change to THIS level, per
  precedent belliard `20260718` / vitry `19940715`). The two decorrelated rings + parry make the pin
  harder than V1's single ring; a re-pin at stage-5 is the pre-declared most-likely correction and is
  **not** a system change.

### D5 — The dev-harness continues to exist, untouched (AC3)

`BOSS_QTE_DEV_HARNESS_LEVEL` stays byte-identical, stays **excluded** from the shipped `LEVELS`
array (ADR-0051 D4), and stays reachable only via the dev-only `?preview=boss` seam. This story does
**not** repurpose, delete, or migrate the harness — the live level is a **distinct, separately
authored** `LevelConfig`. The harness remains the team's iteration surface; the live level is the
player's one canon meeting with le Commandant (the one-shot reveal, fiction §3).

### D6 — Art-dependency shape: backdrop IN this story; canon-sprite render-integration is a FOLLOW-UP pass

Two art surfaces, decided separately and explicitly:

1. **The l'Éden backdrop `facade.png` — IN this story (mandatory).** Every level needs a facade; test
   A5 requires the path. It is generated through the **existing** `levelArt.json` → `gen-level-art.mjs`
   → CI pipeline (ADR-0010), from the new `levels[]` block's `prompts.facade` — the standard per-level
   art cost, here painting the hall interior instead of a street. The same generated `facade.png`
   serves both the in-game facade plane and the narrative-scene backdrop (flag B).

2. **The 9 canon boss assets (7 figures + 2 hall props) — GENERATION is the open art lane; RENDER
   INTEGRATION is a deferred follow-up pass, NOT in this story's dev lanes.** The call, explicitly:
   - **In this story (dev-tooling-assets, `levelArt.json` `boss` block):** ADD the 5 new sprite JSON
     entries (`commander_weakpoint`, `commander_parry_windup`, `commander_finisher`, `lustre`,
     `speaker_wall`) as **prompt-carrying structure** — keys, `asset` paths, seeds, and **per-type
     `size`/aspect per game-graphist [S13]**: the 7 figures keep the block's square 256×256, but
     `lustre` takes a **portrait** canvas and `speaker_wall` a **landscape** one (the
     `nearForegroundArt` per-type-size precedent, pinned by a consistency test). This carries the
     already-drafted prompts so the OQ3-opened art lane can generate in CI. It has **zero runtime
     effect** today (no render consumer of the boss block exists) and PNGs may be absent (committed
     PNGs may lag generation).
   - **Follow-up integration pass (NOT this story):** the render-side consumption of the generated
     canon commander PNGs onto `BossQteSprite.tsx` — mapping the six poses to the QTE phase/sub-states
     in place of the procedural fallback. Deferred because (a) the PNGs do not exist yet — the prompts
     are un-gated (lead-art PROMPT GATE owed) then face CI generation + `game-graphist` technical pass
     - asset gate + composite gate, a full art cycle; (b) **the level ships on the already-stage-5-
       verified procedural fallbacks** — no mechanic, gameplay, or gate blocks on canon art (every prior
       QTE shipped this way); (c) pose-mapping is a genuine **render-lane change** to `BossQteSprite`
       needing its own boundary review, and coupling it to this story's stage-6 merge would gate the
       **mechanical** live-ship (does the required gate read right at the end of a real level) on an art
       pipeline it does not need to answer its own question. Refines the design gate's OQ3 ruling: asset
       **generation** is the parallel non-blocking art lane (targeting before this story's stage-6);
       asset **render-integration** is separable and follows once the art clears its gates.

The reveal beats (`final_pre` #4 "…le Commandant", the embodiment) stay **imageless** until that
follow-up lands — exactly as Vitry's monologue carries on the facade alone (fiction §3.2).

## Consequences

**Positive**

- The merge gate reviews **appended data** in `levels.ts` + `narrativeSystem.ts`, an art block in
  `levelArt.json`, and one flyer-copy entry — **not** a `stateMachine.ts`/`useGameLoop.ts`/boss-system/
  shell change. The three dev lanes are non-overlapping (game / tooling / render) and run in parallel
  safely; the only serialization point is the shared id string `niveau-final`, fixed in D1/D2.
- The mechanical live-ship — the actual product question — ships and gets playtested on proven
  procedural fallbacks without waiting on a 9-asset art cycle (D6), while that art lane runs in
  parallel and the finished-reveal integration follows cleanly.
- AC1–AC5 hold by construction and are code-verified (D1/D3/D4); AC2/AC3/AC5 are enforced by a
  concrete byte-diff review-assert, not trust.

**Negative / costs**

- The canon finale does not _look_ finished on first ship (a cop-fallback stands in for le Commandant
  at the climax) — the accepted trade (velocity + a de-risked mechanical ship now; the one-true-reveal
  reading finished in the follow-up integration). Flagged plainly, chosen consciously (D6).
- A boss-tuning problem discovered at stage-5 cannot be fixed by editing the frozen system; it must
  route through a logged correct-course (D3) — deliberate friction that protects the ADR-0052 contract.
- The seed pin (D4) is provisional and the single most likely stage-5 correction; the K-5 re-verify on
  the re-anchored two-ring geometry is a real, owned pre-ship item.

**Gotchas**

- **AC8 sequencing gate (binding, `producer`-owned):** no dev lane touching `levels.ts` /
  `bossQteSystem.ts` starts until `producer` confirms **ADR-0052's stage-6 panel MERGE-cleared on
  `main`** (or an explicit logged compression from Bertrand/`pm`). This TECH PLAN + ADR are authorized
  now; the **dev lanes are planned, not launched.** Practically: dev-gameplay (`levels.ts`) is the
  gated lane; `narrativeSystem.ts`, `levelArt.json` and `LevelFlyer.tsx` do not name the gated files,
  but launch together with dev-gameplay under the same gate to keep the id contract coherent.
- **Narrative A1 is a paired invariant:** adding only the PRE (or only the POST) `niveau-final` key
  fails the test suite — both land in the same dev-gameplay change.
- **`anchor.x` / backdrop framing** is an art-dependency resolved at stage-5, not a system change —
  track it, do not pre-solve it.
- **Follow-up sprite integration will marginally change the render surface** (textured sampling vs.
  procedural quads); the perf check for that belongs to the follow-up pass, not this story (which adds
  no new render technique — see the story's perf call).

## Revision 1 — 2026-07-21: stage-6 sanctioned amendments landed + doc-coherence corrections (PR #119 triage MAJEUR-1, senior-architect)

Triggered by the stage-6 4-reviewer merge-gate triage (`senior-architect`, shard
`docs/handoffs/story-boss-niveau-final-live.md` §"STAGE 6 — TRIAGE + INTEGRATION REVIEW",
finding MAJEUR-1: "ADR-0053 contradicts its own build PR"). Status flipped `Accepted — pending
build` → `Accepted` (the build shipped, PR #119). Four data-only amendments were sanctioned at
their owning gates during stage-5 build/verify; they are recorded here, dated, per the
ADR-0052 revision-log discipline. D2/D3/D4's original text above is left as written — it was
accurate at TECH PLAN — this revision records what has changed since and the ruling that
authorised each change. Filed by `tech-writer` (Otis); none of the four reopens the frozen
ADR-0051/0052 boss-system contract they each explicitly reference, and the integration review
confirms the boundary law still holds (shard, same triage, "Integration review — boundary law
verdict: CLEAN").

### The four sanctioned amendments (dated, with owning gate)

1. **AMENDMENT A2 — décor catch = drawn-silhouette AABB** (2026-07-20). Gated at
   `lead-game-designer`'s (Karim) stage-5 panel follow-up #5 (shard §"DESIGN GATE (stage-5
   blocker) — lead-game-designer (Karim) — 2026-07-20 — panel follow-up #5, décor aim-honesty"),
   transcribed verbatim into `spec-boss-qte-differentiation.md` §2 LEVER 2 by `game-designer`
   (Sacha, shard §"SPEC TRANSCRIPTION (stage-5 follow-ups #5 + #9)"). Replaces the décor
   hit-test's reused `RING_HIT_RADIUS` circle with a rectangular AABB matching the drawn
   silhouette: **`BOSS_DECOR_CATCH_HALF_W = 0.40`** / **`BOSS_DECOR_CATCH_HALF_H = 0.525`**
   (= half the drawn `DECOR_W 0.80 × DECOR_H 1.05` plane) in
   `src/game/systems/bossQteSystem.ts`, with the paired render-side derivation
   (`DECOR_W = 2 * BOSS_DECOR_CATCH_HALF_W`, `DECOR_H = 2 * BOSS_DECOR_CATCH_HALF_H`) in
   `BossQteSprite.tsx` — drift-guarded, zero pixel change. This is the ONE sanctioned touch to
   `bossQteSystem.ts` (see the D2/D3 correction below).
2. **K-5 seed re-pin, `targetSeed` `19991231` → `19991232`** (2026-07-20). Owned by
   `game-designer` (Sacha)'s stage-5 design-acceptance leg-2 gate (shard §"VERIFY (stage 5, leg
   2) — game-designer (Sacha) — 2026-07-20 — design-acceptance"): the diegetic seed `19991231`
   **FAILED** K-5 acceptance criterion (a) — camp-vital dominant at the tightened
   `BOSS_VITAL_CATCH_RADIUS 0.11` catch (ADR-0052 Revision 2, AMENDMENT A1-R2) — an
   N=500-verified, data-only re-pin to `19991232` (nearest clean seed) resolved it; re-verified
   FINAL PASS on the landed code (shard §"VERIFY (stage 5, leg 2 — FINAL confirm)"). D4's
   PROVISIONAL `19991231` is corrected by this amendment (see the D4 correction below).
3. **`windowGrid.cols` 5 → 4** (2026-07-21). Bertrand's escalation ruling (shard §"DÉCISIONS
   BERTRAND — backdrop escalation", Finding 1: accept the batch-2 l'Éden facade at 4 arches) +
   `lead-game-designer` (Karim)'s express design gate (shard §"DESIGN GATE (express) —
   lead-game-designer (Karim) — 2026-07-21 — windowGrid.cols 5→4"), PASS. Supersedes the
   originally-gated [E3] count of 5 in `levelArt.json`'s `niveau-final` block; the [E3] intent
   (even spacing, occupiable window-cop slots, [E5] merge mitigation) is served equally at 4.
   Pre-boss STREET facade layout only — no `bossQteSpec`/§5.6 surface touched.
4. **`lustre` sprite seed re-roll, `4877` → `4879`** (2026-07-21). `lead-art` (Nico)'s asset-gate
   FAIL on the round-1 `lustre.png` (shard §"ASSET GATE (Gate 2) — lead-art (Nico) —
   2026-07-21" — composition defect, flanking column/bracket masses break the single
   hung-chandelier one-read silhouette) invoked Nico's own §3.10 rule ("re-roll seeds only when
   composition is wrong"): a single-variable seed re-roll, prompt string byte-unchanged. PASS on
   re-roll (shard §"ASSET GATE (re-roll) — lead-art (Nico) — 2026-07-21 · `lustre.png` seed
   4877→4879"). Applied in `levelArt.json`'s `boss.types.lustre.seed`; Bertrand-approved at the
   same escalation as amendment 3.

### D2/D3 correction — `bossQteSystem.ts` and `App.tsx` are no longer "ZERO lines"

D2's bold line above ("`App.tsx`, `FlyerWall.tsx`, `stateMachine.ts`, `useGameLoop.ts`,
`bossQteSystem.ts`, `types/bossQte.ts` — ZERO lines") and D3's review-assert ("`git diff
origin/main...HEAD` shows zero changed lines in `src/game/systems/bossQteSystem.ts` and
`src/game/types/bossQte.ts` … Any hit is a blocking finding") were both true at TECH PLAN and
are now stale for two of the six named files, per the stage-6 integration review (shard
§"STAGE 6 — TRIAGE + INTEGRATION REVIEW", "Integration review — boundary law verdict: CLEAN").
The accurate reuse map, per file:

- **`src/game/systems/bossQteSystem.ts` — ONE sanctioned touch: AMENDMENT A2** (above). Pure
  `src/game` logic, no React/Three import, unit-tested, `assertPositiveScalar`-guarded. A
  2-layer coordinated change (game constant ↔ render draw) needing architect sign-off per
  COLLABORATION.md — **granted at the stage-6 triage.**
- **`src/render/scene/App.tsx` — the C-QA3 capture seam + its persistence double-guard**, both
  view-side, architect-ruled clean at the same stage-6 triage: `resolveBossPreviewLevel`/
  `isBossSeamShippedLevel` (`bossHarness.ts` + `App.tsx`) let the dev-only `?preview=boss&level=
  niveau-final` seam boot the SHIPPED `niveau-final` level's real `bossQteSpec` over its own
  backdrop for capture (qa-lead C-QA3, shard §"9. FIX (stage 5, C-QA3 correction)");
  `BOSS_SEAM_SHIPPED_LEVEL` folds into the `LEVEL_COMPLETE` unlock/save guard as an independent
  second guard behind the pre-existing `PREVIEW_SCREEN !== null` early-return, so a seam-booted
  shipped level can never write `muf_scores_*`/`muf_progress`. The resolver is pure (search
  string → `LevelConfig`, no `window` read), reads `@game` data only (allowed direction) — no
  game→render leak.
- **`src/game/types/bossQte.ts`, `src/render/ui/menu/FlyerWall.tsx`,
  `src/game/systems/stateMachine.ts` — still ZERO lines**, confirmed at the same stage-6
  integration review. **`src/hooks/useGameLoop.ts`** gains wording-only JSDoc corrections in
  this same pre-merge pass (stage-6 triage finding #4, `tech-writer`) — zero logic.
- **The tutorial/belliard/stalingrad/vitry `LevelConfig` objects and
  `BOSS_QTE_DEV_HARNESS_LEVEL` — still byte-untouched**, per D3's review-assert, confirmed at
  the same stage-6 close (AC2/AC3/AC5 hold).

### D4 correction — the seed is no longer PROVISIONAL

D4 above reads, "**Re-pinned, PROVISIONAL `19991231`**." Amendment 2 above (the K-5 re-pin)
supersedes this: the shipped, FINAL-PASS value is **`targetSeed: 19991232`**
(`src/game/levels/levels.ts`). `decorProp { position: { x: 0.2, y: 1.5 }, armPhaseIndex: 1 }` is
unchanged from D4's original text.
