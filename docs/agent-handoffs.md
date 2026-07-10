# Agent Handoffs Log

Serial coordination log, written by the orchestrator only. Parallel devs must NOT
both edit this file (protocol rule #3). One block per story.

Template:

```
### <story-slug>
- arch: <lane assignment + parallel-safe verdict>   (Winston / Senior Architect)
- release: <dev outcome>                             (added serially after devs run)
```

---

### story-narrative-coverage

- arch: Boundary verdict PASS. Lane A → `dev-gameplay` owns `src/game/**` (new file
  `src/game/systems/__tests__/narrativeSystem.test.ts`, pure-logic test, no React/Three deps —
  existing `narrativeSystem.ts` confirmed import-free, exports `PRE_LEVEL_NARRATIVE` +
  `POST_LEVEL_NARRATIVE` only). Lane B → `dev-tooling-assets` owns tooling
  (`package.json` script entry + new file `scripts/test-affected.mjs`). File sets are
  disjoint — no path overlap between `src/game/**` and `scripts/**`/`package.json`.
  PARALLEL-SAFE: YES. Coordination file `docs/agent-handoffs.md` is shared and serialized
  by the orchestrator; devs must not edit it concurrently. (Winston / Senior Architect)
- release: Lane A + Lane B built CONCURRENTLY on disjoint paths; neither dev edited this
  log (serialization respected). Lane A (`dev-gameplay`) → new `src/game/systems/__tests__/narrativeSystem.test.ts`,
  5 tests covering A1–A4. Lane B (`dev-tooling-assets`) → new `scripts/test-affected.mjs`
  - `package.json` `test:affected` script. (Amelia ×2)
- review: PASS. Boundaries intact. Lane A executed for real (isolated vitest): 5/5 green.
  Lane B `node --check` OK; `codegraph affected src/game/systems/narrativeSystem.ts`
  correctly resolved the new test file — codegraph integration verified end-to-end.
  Accepted vs story acceptance criteria. (Winston review + John acceptance)

---

### story-ingame-render-gate

- release: `dev-tooling-assets` (tooling lane, `scripts/**` + `.github/**` only — no
  `src/` touched). Added a CI "in-game smoke" gate that boots the prod build, enters one
  level (belliard) for real, and blocks the gh-pages publish if the R3F/WebGL game scene
  fails to render. Complements `e2e-home.mjs`, which is pure-DOM and cannot see a broken
  game scene. File List: NEW `scripts/e2e-ingame.mjs`, NEW `.github/actions/e2e-ingame/action.yml`;
  MOD `.github/workflows/deploy.yml` (gating step + artifact upload, before publish),
  `scripts/SCRIPTS.md` (docs), `.gitignore` (`screenshots/e2e-ingame.png`). Verified with
  `node --check` + YAML parse; Playwright itself runs in CI (browser mismatch locally).
  (Amelia — Tooling & Assets)

---

### story-vehicle-delivery — Lane A (dev-gameplay, `src/game/**` only)

- done: Replaced abstract cargo with the scripted vehicle-delivery core loop (`Livrer` =
  protect the vehicle). Pure logic + TDD. START/FINISH same session.
- File List:
  - NEW `src/game/types/delivery.ts` (`VehicleType`, `DeliveryPhase`, `DeliverySpec`,
    `DeliveryVehicle`).
  - REWROTE `src/game/systems/deliverySystem.ts` (`tickDelivery` state machine +
    `seedDeliveryVehicle` + tuning consts).
  - REWROTE `src/game/systems/__tests__/deliverySystem.test.ts` (19 tests).
  - MOD `src/game/types/gameState.ts` (removed `cargo`; added `deliverySpec`,
    `deliveryVehicle`, `elapsedSeconds`, `kills`).
  - MOD `src/game/types/index.ts` (export delivery types, drop `Cargo`).
  - DELETED `src/game/types/cargo.ts`.
  - MOD `src/game/levels/levels.ts` (`deliveries` per level: belliard=truck,
    stalingrad=car, vitry=moto; removed `cargoPickup`/`cargoDepot`).
  - MOD `src/game/systems/stateMachine.ts` (seed + tick delivery, fold bonus into score,
    victory now gated on `kills >= enemiesToWin` NOT score).
  - MOD `src/game/systems/__tests__/stateMachine.test.ts`.
- verify: `vitest run` 123/123 green; `eslint src/game` clean; `tsc` clean for
  `src/game/**` + `src/hooks/**`.
- HANDOFF to Lane B (`dev-r3f-render`): `GameState.cargo` is GONE. Read
  `GameState.deliveryVehicle: DeliveryVehicle | null` instead (fields: `phase`, `position`
  world-space Vec2, `vehicleType`, `integrity`, `integrityMax`, `windowRemaining`). Draw
  only when `phase !== "IDLE" && phase !== "GONE"`; HUD gauge during `"DELIVERING"`. The
  render lane must also drop `CargoMarkers.tsx`, the `@game/types/cargo` imports, and map
  `LevelConfig.deliveries[0]` → `LevelParams.delivery` in `App.tsx`. tsc currently red ONLY
  in `src/render/**` for these — expected, owned by Lane B. (Amelia — Gameplay)

## dev-r3f-render (Amelia — Render) — story-vehicle-delivery Lane B — FINISH 2026-07-04

- Scope: `src/render/**` + forward in `App.tsx`. Renders `GameState.deliveryVehicle`
  only; zero game rules. START/FINISH same session.
- File List:
  - NEW `src/render/scene/DeliveryVehicleSprite.tsx` (pooled single mesh, `stateRef`-driven
    in `useFrame`, no per-frame React re-render; texture `assets/vehicles/${vehicleType}.png`
    lazily cached by type via `import.meta.env.BASE_URL`; visible only when
    `phase !== "IDLE" && phase !== "GONE"`; flips to face travel direction; fires
    `onHudChange` to the DOM HUD only on phase / rounded-integrity change).
  - DELETED `src/render/scene/CargoMarkers.tsx`.
  - MOD `src/render/scene/GameScene.tsx` (drop `CargoMarkers` + `@game/types/cargo`; mount
    `DeliveryVehicleSprite`; `onCargoStatus` prop → `onDelivery`).
  - MOD `src/render/ui/HUD.tsx` (drop `cargoStatus`/`CargoStatus`; add `HudDelivery`
    (`phase`/`integrity`/`integrityMax`); "LIVRAISON — PROTÉGEZ LE VÉHICULE !" banner +
    neon integrity gauge during `DELIVERING`; brief SUCCESS/FAILED feedback).
  - MOD `src/render/scene/App.tsx` (`buildLevelParams` maps `level.deliveries[0] ?? null`
    → `LevelParams.delivery`; HUD channel `onCargoStatus`→`onDelivery`, preserve
    `prev.delivery` across HUD refreshes).
- verify: `tsc -p tsconfig.json --noEmit` clean (0 errors, whole tree incl. render);
  `eslint src/render` clean; `prettier --check` clean on all touched/created files.
  (Amelia — Render)

---

### story-push-marker-dispatch (PR #27 — file-marker workflow dispatch)

- review-cycle: Cross-cutting change to the CI dispatch mechanism (touches
  `.github/**`, `docs/**`, and regenerated `public/assets/vehicles/*.png`). Reviewed
  by 5 reviewers; Scrum Master triaged all reports; a focused debate (Q1–Q5) resolved
  the open architecture/CI-cost calls; work then partitioned into parallel lanes on
  disjoint paths (DOCS ⟂ TOOLING/`.github` ⟂ QA/ci-e2e). Boundary verdict: PASS —
  nothing touches `src/game`/`src/render`/`src/hooks`; the game↔render↔hooks contract
  is untouched. (Winston / Senior Architect)
- confirmed fixes (in-PR): ADR bot-commit/no-CI consequence (A1); preview.yml
  exclusion reworded as "redundant, not impossible" (A3, Winston); concurrency-group
  collision fixed by renaming `deploy-preview.yml` group to
  `deploy-preview-${{ github.ref }}` (A5 — Winston's "out of scope" OVERRULED by SM,
  conceded: edge-case hunter showed a `deploy-preview` marker touch on the style
  branch drops both `deploy-preview.yml` and `preview.yml` into the same
  `cancel-in-progress` group); `branches-ignore: ["main"]` on all marker triggers
  (a merge would otherwise fire `gen-vehicle-sprites` FORCE=1 on `main`);
  `ci(dispatch):` head-commit-message job guard against merge/rebase/deletion
  propagation firings; **bounded 3-attempt** push retry-rebase in the gen workflows;
  branch-slug sanitization + env-quoting of branch-derived values (shell-injection
  sink); `noindex` meta on previews; `@napi-rs/canvas` npm pin. QA ships in-PR: new
  e2e job in `ci.yml`, 404 gate, e2e-assets sweep, menu assertions, vitest
  consistency test. (SM triage)
- debate resolutions (Winston's positions adopted):
  - Q1 (marker trigger scope): `branches-ignore: ["main"]` only — branch-prefix
    allowlist REJECTED for a two-actor repo (push triggers never fire from forked-PR
    contexts, so untrusted surface is already nil; an allowlist would silently no-op
    ad-hoc human branches). Revisit on first external contributor.
  - Q2 (delivery-loop e2e vs `deploy.yml`): land in-PR but `continue-on-error` for one
    soak cycle; promote to a hard release gate in a follow-up once it has clean green
    history — a first-appearance e2e must never block publishing the live site.
  - Q4 (game-over/score e2e): hook-free route — assert on the already-rendered DOM
    contract (HUD score in `src/render/ui/HUD.tsx`, `EndScreen.tsx`) driven by
    deterministic inputs, same pattern as the frozen-cops delivery smoke. A
    `window.__MUF_*` state seam is REJECTED as boundary erosion; if a state ever proves
    unobservable from the DOM, add a test-only bridge strictly in `src/hooks` under a
    new ADR — never importable from `src/game`.
  - (Q3/Q5 resolved by SM + other reviewers; captured in their triage records.)
- A6 hygiene (accepted, not fixed): the PR bundles the dispatch mechanism with its
  first output (the regenerated truck/car/moto FLUX PNGs). Mildly mixes "add the
  mechanism" with "run it once"; accepted as-is — correct `dev-tooling-assets` lane,
  no boundary impact.
- follow-up stories (8):
  1. promote `e2e-delivery` from `continue-on-error` soak to a hard `deploy.yml` gate.
  2. transitions / pause e2e coverage.
  3. hook-free game-over/score e2e (`window.__MUF_*` seams rejected; if ever needed, a
     bridge lives in `src/hooks` only, gated by its own ADR).
  4. preview cleanup job on branch deletion (reap `preview/<branch>/` on `gh-pages`).
  5. chroma-key improvements (glow-halo / shadow-box handling).
  6. narrative `?preview=` + prefs-persistence e2e.
  7. conditional sprite-prompt workshop — only if batch 2 fails the acceptance floor
     (neon glow on all three vehicles + car reads as a hatchback).
  8. revisit the branch-prefix allowlist on the first external contributor (Q1 trigger).
- LANE-DOCS release: `docs/adr/0004-push-marker-workflow-dispatch.md` (canonical idiom,
  `branches-ignore`, guard contract, marker-on-first-dispatch, preview.yml reword, new
  Consequences bullets + Security consequences subsection), `docs/ci.md` (dispatch
  section rewrite + quick-ref row `actions: write`), `docs/agent-handoffs.md` (this
  block). No `.github/**` or `scripts/**` touched — those are other lanes' live edits.
  (Winston / Senior Architect — DOCS lane)
