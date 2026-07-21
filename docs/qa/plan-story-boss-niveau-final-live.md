# QA test plan — Niveau Final live-ship "l'Éden" (STORY-BOSS-NIVEAU-FINAL-LIVE, ADR-0053)

**Story:** `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md` (AC1–AC10) ·
**ADR:** `docs/adr/0053-niveau-final-live-boss-level.md` (extends ADR-0051/0052, data + wiring only) ·
**Specs:** `docs/game-design/spec-boss-niveau-final-level.md` (pacing/quota/seed/AC-L1..L6),
`docs/game-design/spec-niveau-final-fiction.md` (l'Éden canon, final_pre/post wiring),
`docs/game-design/ux/spec-niveau-final-ux.md` (flyer/briefing/legibility, §3.1 stage-5 list).
**Owner:** `qa-lead` (Inès) · **Stage:** 5 (VERIFY) — leg 1 · **Date:** 2026-07-21
**Verdict of record:** handoff shard §8 (`docs/handoffs/story-boss-niveau-final-live.md`).
**House style:** `docs/qa/plan-story-boss-qte-differentiation.md`.

This story is **data + narrative wiring only** against the FROZEN ADR-0051/0052 boss contract
(Architecture directive). It ships the already-built, already-differentiated boss system LIVE for
the first time on one new shipped level — `niveau-final` ("l'Éden — 31 déc. 1999"), placed after
vitry, unlocked by the existing index hop. The gate therefore verifies (a) the new level authors
correctly and reaches the boss via a REAL quota, and — above all — (b) the **additive-and-inert**
guarantee: the three shipped levels + tutorial byte-untouched, the boss system untouched save the
gated A2 décor fix, hostage untouched.

---

## 1. Per-AC verification matrix

| AC   | Claim                                                                                                                                                 | How proven (this leg)                                                                                                                                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1  | `niveau-final` authors `bossQteSpec`, NOT `hostageQte`; mutual-exclusion throw not tripped                                                            | **unit** (`niveauFinal.test.ts`: no hostageQte, roster civilian/hostage_taker weight-0) + **e2e** (level loads to PLAYING, no throw, 0 pageerror) — **VERIFIED**                                                                             |
| AC2  | tutorial/belliard/stalingrad/vitry `LevelConfig` byte-untouched                                                                                       | **git diff** `levels.ts` = pure append, ZERO deletions — **VERIFIED** (§7 R1)                                                                                                                                                                |
| AC3  | `BOSS_QTE_DEV_HARNESS_LEVEL` + its `LEVELS` exclusion unchanged                                                                                       | **git diff** (harness lines untouched in the append) + **inspect** — **VERIFIED**                                                                                                                                                            |
| AC4  | Boss triggers via REAL quota crossing (`enemiesToWin 16`, non-zero — not harness `0`)                                                                 | **unit** (`enemiesToWin 16 !== 0`; stateMachine routes non-null `bossQteSpec` past instant-complete) + **e2e** (live level runs at 16/70, `bossQteSpec` present in state) — **VERIFIED (mechanism); runtime boss-trigger DEFERRED, §4 hole** |
| AC5  | No change to `bossQteSystem.ts`/`types/bossQte.ts` save the gated A2 fix; live `bossQteSpec` = value-for-value copy + only seed/decorProp re-authored | **git diff**: `types/bossQte.ts` ZERO diff; `bossQteSystem.ts` = A2 décor AABB ONLY (§7 R3); `levels.ts` bossQteSpec byte-equal to harness except `targetSeed 19991231` + `decorProp {0.2,1.5}` — **VERIFIED**                               |
| AC6  | ADR-0053 documents the level, re-anchor/re-seed, byte-untouched confirmation, OQ resolutions                                                          | **inspect** (ADR-0053 Accepted, shard TECH PLAN) — **VERIFIED (doc)**                                                                                                                                                                        |
| AC7  | `final_pre`/`final_post` wired to the new id, verbatim, no new canon                                                                                  | **unit** (`narrativeSystem.test.ts` A1/A2/A5 + verbatim checks) + **e2e** (`03`: final_pre line 1 « 31 décembre. Tout Paris est dehors… » over the real backdrop, skippable) — **VERIFIED**                                                  |
| AC8  | Dev lanes started only after ADR-0052 MERGE-cleared (or logged compression)                                                                           | **shard** §3 (producer: ADR-0052 PR #114 merged; lanes launched after) — **VERIFIED (process)**                                                                                                                                              |
| AC9  | `pm` re-reviewed the gated spec (no drift to 2nd boss / mini-boss tier / hostage retune / new mechanic)                                               | **shard** (pm AC9 CLEARED FOR TECH PLAN) — **VERIFIED (process)**                                                                                                                                                                            |
| AC10 | fuyard / mini-boss tier / hostage retune remain out of scope                                                                                          | **git diff** (no such code) + **inspect** — **VERIFIED**                                                                                                                                                                                     |

---

## 2. Mechanical checks (run this leg — REAL results)

Corepack Yarn 4.12.0, `COREPACK_NPM_REGISTRY=https://registry.npmjs.org`; rtk absent → `yarn`.

| Check      | Command             | Result                                                    |
| ---------- | ------------------- | --------------------------------------------------------- |
| Typecheck  | `yarn typecheck`    | **EXIT 0**                                                |
| Unit suite | `yarn vitest run`   | **1003 / 1003 PASS**, 74 files, EXIT 0                    |
| Lint       | `yarn lint`         | **EXIT 0**                                                |
| Format     | `yarn format:check` | **EXIT 0** ("All matched files use Prettier code style!") |

## 3. Unit coverage (owned by `dev-gameplay`, verified here)

`src/game/levels/__tests__/niveauFinal.test.ts` (12 tests) covers: placement/unlock; **AC1**
(no `hostageQte`, roster weight-0 civilian/hostage_taker); **AC4** real-quota `16 !== 0`;
monotonic-hardest pacing (1.8/16/70 vs the shipped curve); delivery ≈Vitry; **AC5** value-for-value
`bossQteSpec` copy vs the harness (only seed + decorProp re-authored); narrative A1/A2/A5 +
verbatim-script + reveal-beat; and the **K-5 seed-winnability driver** (a competent rings+parry
player clears 24 HP before the blown-window clock on `targetSeed 19991231`). `narrativeSystem.test.ts`

- `levelArt.consistency.test.ts` + `stateMachine.test.ts` stay green. The gated **A2 décor** AABB
  catch is covered in `bossQteSystem.test.ts` (+83 lines: the drawn==catch AABB, corner cases, the
  `BOSS_DECOR_CATCH_HALF_W/H` positive-extent assert).

## 4. E2e scenarios & evidence (driven by me this leg)

Evidence dir: `docs/qa/evidence/story-boss-niveau-final-live/` (PNG, state-verified via the ADR-0005
`__MUF_STATE__` seam under `__MUF_PLAY__`; `__MUF_FREEZE_COPS__` for the frozen-cop gallery). Driven
headless via Playwright + `chromium_headless_shell-1194` (SwiftShader) against a `vite` dev server.
The REAL level path was driven (flyer wall → unlock → briefing → PLAYING), not the harness seam.

**Evidence inventory:**

| File                                          | Shows (state-verified)                                                                                                                                                | Serves                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `01-flyer-eden-locked-{desktop,mobile}.png`   | the l'Éden flyer LOCKED — « LIGNE FERMÉE / PAS ENCORE POUR TOI / La ligne ouvre quand la précédente est bouclée »                                                     | ux flyer locked state, both classes                           |
| `02-flyer-eden-unlocked-{desktop,mobile}.png` | the l'Éden flyer UNLOCKED — full copy: « L'ÉDEN — 31 DÉC. 1999 », crew SPIRALE 23·KANAL SYSTEM·NADIR 94, DIFFICILE · AMBIANCE : EN FUSION, « 70 s · 16 cibles »       | ux flyer unlocked, flyer wiring, pacing surface, both classes |
| `03-briefing-final_pre-{desktop,mobile}.png`  | `final_pre` line 1 « 31 décembre. Tout Paris est dehors. Le dernier son du siècle, Muf. » over the REAL l'Éden backdrop; PASSER button present                        | AC7 final_pre wired + over-backdrop + **skippable**           |
| `04-gallery-cops-desktop.png`                 | the 4-arch gallery over the l'Éden backdrop with the roster in the arches (biker, bonus, plainclothes, CRS riot+shield); HUD « L'Éden — 31 déc. 1999 », TEMPS ticking | in-level gallery + window-cops + riot-heavy roster live       |
| `05-ingame-gallery-{desktop,mobile}.png`      | live PLAYING over the real backdrop; HUD level name, TEMPS 69s ticking (live), crosshair, foreground railing                                                          | level ships + plays, both classes                             |

Boot/flow: ZERO `pageerror` across menu, flyer wall (locked+unlocked), briefing, and in-level
PLAYING — verified on repeated careful runs (a transient `errs:1` in one multi-context run was NOT
reproducible: two independent clean re-runs of the identical flow reported 0).

**BLOCKING HOLE — C-QA3 (boss over the l'Éden backdrop unreachable in sandbox; routed + deferred).**
The boss triggering + fighting **over the real l'Éden backdrop** could NOT be captured. Cause: it
requires crossing the REAL `enemiesToWin 16` mook quota, and at ~2 fps headless SwiftShader
synthetic clicks do NOT land mook kills — a 150 s aided-fire grind (state-verified) left `kills` at
**0**. The `?preview=boss&at=…` fast-forward seam (story-1) boots the NON-SHIPPED harness level
(belliard tableau), so it CANNOT render the boss over l'Éden. This is a harness/frame-rate
limitation, not a defect:

- **AC4 real-quota trigger** is **unit-verified** (`enemiesToWin 16 !== 0`; the stateMachine routing
  past instant-complete into `shouldTriggerBossQte`).
- **K-5 winnability** on `targetSeed 19991231` is **unit-verified** (the winnability driver clears
  the full kit before the blown clock).
- The **boss RENDER** (dual rings / parry / smoke / renfort / finisher) is proven on the harness in
  story-1 (evidence 20-39) — the identical procedural system; the live level differs only in the
  backdrop pixels behind the tableau and the re-anchored position.
  → **DEFERRED to leg 2 on a real-GPU build:** Sacha's design-acceptance playtest (N1 target-supply,
  K-5 empirical landability) and Tony's A1–A15 legibility re-verify on the REAL l'Éden backdrop +
  re-anchored position run the boss-over-l'Éden checks there (branch preview / local, 60 fps).
  Escalated to `producer` as CI-DEFERRED (CI Playwright hits the same SwiftShader wall). A
  niveau-final-specific state-seed seam (mirroring story-1's `at=` but for the live level) would make
  it e2e-automatable — specced to `dev-tooling-assets` for a future cycle, non-blocking.

## 5. Named stage-5 checks from the gated specs (leg-2 items, tracked here)

- **Tony (ux §3.1) — leg-2, on my evidence + real-GPU:** flyer both device classes + locked/unlocked
  (**this leg — captured 01/02**); final_pre/final_post wired + skippable (**this leg — 03, PASSER
  confirmed; final_post reachable only post-boss → leg-2**); **boss-QTE legibility A1–A15 RE-VERIFIED
  on the REAL l'Éden backdrop + re-anchored position** (leg-2, C-QA3); full finale flow at
  mobile-landscape (leg-2, C-QA3); retry felt-cost (D11) capture (leg-2, needs a boss loss).
- **Karim (N1) — leg-2 → Sacha:** target-supply watch on 4 window slots (`windowGrid.cols 5→4`) at
  16/70/1.8 — confirm the pre-boss gallery does NOT read target-STARVED; compensating lever is a
  `windowWeights` nudge, not re-adding an arch. Gallery populates correctly (`04`); density/feel is
  the playtest call.
- **Sacha (K-5) — leg-2 empirical:** on `targetSeed 19991231`, each phase-2/3 window presents a
  landable waypoint per ring, each charged window a landable parry, the décor arm-window landable —
  or re-pin. **Unit-verified winnable** (§3); empirical per-window landability is the real-GPU leg.
- **A2 décor AABB catch on the LIVE chandelier `{0.2,1.5}`:** the décor prop catch is now the
  drawn-silhouette AABB `±(BOSS_DECOR_CATCH_HALF_W 0.40, BOSS_DECOR_CATCH_HALF_H 0.525)` (gated
  AMENDMENT A2, drawn==catch). Confirm the arm-window is landable at the chandelier position `{0.2,1.5}`
  — unit-covered (`bossQteSystem.test.ts`); runtime landability is the C-QA3 leg-2 item.

## 6. Device matrix

| Class              | Flyer locked | Flyer unlocked | Briefing/backdrop | In-level gallery  | Boss over l'Éden |
| ------------------ | ------------ | -------------- | ----------------- | ----------------- | ---------------- |
| Desktop (1280×720) | GREEN (`01`) | GREEN (`02`)   | GREEN (`03`)      | GREEN (`04`,`05`) | **HELD — C-QA3** |
| Mobile (844×390)   | GREEN (`01`) | GREEN (`02`)   | GREEN (`03`)      | GREEN (`05`)      | **HELD — C-QA3** |

## 7. Regression specs (verified mechanically vs `origin/main`)

- **R1 (3 shipped levels + tutorial byte-untouched, GREEN):** `git diff origin/main…HEAD src/game/levels/levels.ts`
  = pure append (62/0), ZERO deletions — no tutorial/belliard/stalingrad/vitry config line changed (AC2).
- **R2 (shipped window-zones drift PRESERVED, GREEN):** `windowZones.generated.json` diff = pure
  append (ZERO deletions) — the PRE-EXISTING stalingrad/vitry zone drift (flagged by the tooling lane
  §7, unrelated to this story) stayed **byte-preserved**, only the `niveau-final` key added. The
  tooling lane deliberately did NOT machine-regenerate the shipped keys (would risk the ADR-0005
  golden-frame diff). **Standing finding (→ producer/tech-writer):** whether the shipped
  stalingrad/vitry committed zones match today's `gen-window-zones` output is a separate open item,
  NOT introduced or altered by this story.
- **R3 (differentiation system untouched save the gated A2, GREEN):** `bossQteSystem.ts` diff =
  **A2 décor AABB ONLY** — `BOSS_DECOR_CATCH_HALF_W 0.40` / `BOSS_DECOR_CATCH_HALF_H 0.525`, the
  `withinBox` drawn==catch décor test (replacing the 0.30 circle for the décor prop only), + the
  positive-extent assert. No ring/parry/renfort/finisher/phase/HP constant touched. `types/bossQte.ts`
  ZERO diff. `BossQteSprite.tsx` = the paired A2 render drift-guard (derive `DECOR_W/H` from the
  constants) only.
- **R4 (hostage QTE untouched, GREEN):** `qteSystem.ts` / `hostageQte.ts` / `types/hostageQte.ts` =
  ZERO diff. `stateMachine.ts` = ZERO diff (the mutual-exclusion invariant + freeze early-return
  literally unchanged).

## 8. Deliberately NOT covered (and why)

- **Canon boss/venue-prop art render-integration.** The 9 `commander_*`/`lustre`/`speaker_wall` PNGs
  exist on disk but `resolveBossTexture` still returns the `enemy_riot` fallback — canon-sprite
  render-integration is a **FOLLOW-UP pass** (ADR-0053 D6). The level ships on the
  already-stage-5-verified procedural fallbacks (boss = riot cop, décor = procedural placeholder). So
  the **`lustre` ASSET GATE FAIL** (shard §"ASSET GATE"; re-roll seed 4879) is an **art-lane
  follow-up item, NOT a leg-1 mechanical blocker** — it is not on screen this story. Boss-family asset
  completeness tracks in the art lane.
- **`final_post` runtime.** Reachable only after a boss WIN (unreachable in-sandbox, C-QA3) — wired +
  verbatim unit-verified (`narrativeSystem.test.ts`); runtime is leg-2 on real GPU.
- **Perf.** ADR-0053: ordinary level, no new render surface beyond a single-facade backdrop; the
  boss/smoke ship unchanged under their existing gpu verdicts — no perf gate this story.
- **`facade` prompt "5 arches" residual.** The `levelArt.json` facade prompt still reads "5 arches"
  after the gated `windowGrid.cols 5→4` amendment — flagged to concept-artist (Maud); prompt-string
  content, not a runtime/gameplay defect (the accepted art + grid + zones are all 4).
