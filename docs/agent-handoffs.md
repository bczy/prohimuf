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

### story-live-neon-rim

- pm→arch: Story written (`_bmad-output/planning-artifacts/story-live-neon-rim.md`),
  branch `claude/art-pipeline-graphist`. WHAT: decouple neon from FLUX generation — vehicles
  ship as pure B&W xerox sprites, the loi du glow moves to `src/render` as an emissive
  alpha-edge neon rim, hue from `levelArt.json.vehicles.types.*.neon`. WHY: kills the FLUX
  body-flood at its source (the neon token), one shader/three hues makes family consistency
  structural, and a live rim enables pulse/flicker as real signals (both follow-ups).
  Scope test: conscious documented extension, already established by the bible's loi du glow —
  no new scope surface, only relocates where the signal is produced. AC1–AC7: B&W sprites
  load, rim renders in the type's hue (same hue→color as generation, no forked palette),
  rim visible at game size in the delivery beat, ZERO `src/game/**` changes, e2e-delivery
  green, art gates green, verified in-browser. OUT OF SCOPE: pulse/flicker animations,
  enemies rim (all follow-ups). HANDOFF to `senior-architect` (cross-cutting: `src/render`
  - shared hue source of truth + likely ADR): own lane partition, the boundary-clean
    alpha-edge rim approach, and the single hue→color source-of-truth decision (name→hex map
    currently lives ONLY in `scripts/gen-vehicle-sprites.mjs` `NEON_HEX` — do not fork it in
    render). No commits made by pm. (John / PM)

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

### epic-enemies-car-hostage — architecture sign-off (ADR-0004)

- arch: Cross-cutting epic touching game + render + hooks + scripts. Boundary verdict PASS
  (game stays pure, render stays logic-free, `useGameLoop.ts` is the only bridge,
  `HUD.tsx` stays type-only). Two open decisions ACTED in `docs/adr/0004-enemies-car-hostage-taker.md`
  (Status: Accepted): (1) `energy` — option **a**, a `readonly energy: number` 0–100 slice on
  `GameState`, hostage is the sole V1 consumer, pure clamp in `energySystem.ts`, HUD read-only;
  (2) car shooter-seat — bestiary §2.3 **confirmed** (shooter on the trailing seat per `dir`,
  muzzle flash + bullet origin on the trailing side, sprite mirrored, driver never fires).
  SHARED FILES requiring serialisation across S1/S2/S3: `stateMachine.ts`, `levels.ts`,
  `enemy.ts`, `enemyTypes.ts`, `feedback.ts`, `useGameLoop.ts`. Sequence gate: **S1 must land
  first** (it introduces the roster seam + `pickKindFor`); S2 and S3 then run in parallel on
  disjoint _new_ paths but coordinate their `stateMachine.ts` / `levels.ts` / `enemy.ts` edits
  serially (merge-order, not concurrent edit). (Winston / Senior Architect)

### story-level-roster-belliard (S1) — gate, must land first

- arch: Single-lane → `dev-gameplay` only. No `src/render/**`, no asset script (pure scaffolding).
  Claimed files: `src/game/levels/levels.ts` (add optional `roster` on `LevelConfig` +
  `belliard.roster = { streetSpawns: ["courier"] }`), `src/game/types/enemyTypes.ts` (add
  `buildWeighted` + `pickKindFor(seed, weights)` siblings — **do NOT mutate** `pickKind`/`WEIGHTED`),
  `src/game/systems/enemySystem.ts` (`spawnWave` gains optional weights arg, defaults to `pickKind`),
  `src/game/systems/stateMachine.ts` (thread `roster` via the level-params/options object into
  step-7b street block + `spawnWave`; **owns the shared-file edit first**),
  `src/hooks/useGameLoop.ts` (pass active level's `roster` into `tickGameState`),
  new `src/game/systems/__tests__/levelRoster.test.ts` (AC1 byte-for-byte snapshot, AC2–AC4).
  PARALLEL-SAFE: N/A (single lane, blocks S2/S3). Released: see below.
- release: RELEASED (dev-gameplay / Amelia). TDD: 15 new tests written RED first, then GREEN.
  AC1 (byte-for-byte) — `pickKindFor(seed, buildWeightedFrom(defaults)) === pickKind(seed)` over
  500 seeds + `spawnWave` legacy-vs-default equality over 8 waves + frozen-sequence inline snapshot.
  AC2 — override merges `{ ...defaults, ...windowWeights }`, `weight:0` drops the kind, no mutation
  of `WEIGHTED`. AC3 — `streetSpawnsCourier(["courier" | ...])` / `undefined` ⇒ true. AC4 — `[]` /
  courier-omitted ⇒ false, never throws. Files:
  • `src/game/types/enemyTypes.ts` — `export WEIGHTED` + new `buildWeightedFrom` + `pickKindFor`
  (`pickKind`/`WEIGHTED` logic unchanged; `EnemyKind` union untouched).
  • `src/game/levels/levels.ts` — new `LevelRoster` interface + optional `roster?` on `LevelConfig`;
  `belliard.roster = { streetSpawns: ["courier"] }`. `stalingrad`/`vitry` UNCHANGED (no roster).
  • `src/game/systems/enemySystem.ts` — `spawnWave(wave, facade, weights?)`; absent ⇒ `pickKind`.
  • `src/game/systems/courierSystem.ts` — new pure `streetSpawnsCourier(streetSpawns?)` gate.
  • `src/game/systems/stateMachine.ts` — thread optional `roster` into `createInitialState` +
  `tickGameState`; `windowPoolFor(roster)` feeds both `spawnWave` sites; courier spawn gated by
  `streetSpawnsCourier(roster?.streetSpawns)`.
  • `src/hooks/useGameLoop.ts` — optional `roster` param plumbed into the state machine (bridge seam).
  • `src/render/scene/GameScene.tsx` — resolve `roster` from `levelId` via `LEVELS`, pass to hook.
  • new `src/game/systems/__tests__/levelRoster.test.ts` — AC1–AC4, 15 tests.
  Verification: `rtk vitest` 107 PASS / 0 FAIL · `rtk tsc` no errors · `rtk lint` no issues.
  Boundary: zero React/Three under `src/game`. S2/S3 unblocked. (Amelia / dev-gameplay)

### story-car-drive-by (S2) — requires S1

- arch: Three lanes, disjoint on NEW paths; shared files coordinated post-S1.
  `dev-gameplay`: new `src/game/types/car.ts`, new `src/game/systems/carSystem.ts`
  (`spawnCar`/`tickCars`/`carSpawnInterval`/`checkCarHits`, pure, modelled on `courierSystem.ts`),
  new `src/game/systems/__tests__/carSystem.test.ts`; SHARED-serial: `enemy.ts` (+`"car"`),
  `enemyTypes.ts` (`ARCHETYPES.car`, excluded from `WEIGHTED`), `levels.ts`
  (`belliard.roster.streetSpawns += "car"`), `stateMachine.ts` (add `cars` to `GameState` +
  `createInitialState`, tick gated by `streetSpawns.includes("car")`).
  `dev-r3f-render`: new `src/render/scene/CarSprite.tsx` (mirror on `dir`, muzzle flash on
  trailing side per ADR table — logic-free); SHARED-serial seam: `useGameLoop.ts` (car field
  plumb if needed). `dev-tooling-assets`: new `scripts/gen-car-enemies.mjs`,
  `scripts/cutout-enemies.mjs` (extend), `src/render/scene/enemyTextures.ts` (register `car_*`).
  PARALLEL-SAFE: YES across the three lanes on new paths; the five shared files are serialised
  (S2 takes them after S1 releases). Render runs before assets exist (cop fallback). Released: pending.

### story-hostage-taker (S3) — requires S1, independent of S2

- arch: Three lanes. `dev-gameplay`: new `src/game/types/hostage.ts` (street entity +
  double-hitbox shape), new `src/game/systems/energySystem.ts` (pure clamp), new
  `src/game/systems/hostageSystem.ts` (window+street spawn, `EXECUTES` extension, hostage-precedence
  resolver), new `__tests__/hostageSystem.test.ts` + `__tests__/energySystem.test.ts`;
  SHARED-serial: `enemy.ts` (+`"hostage_taker"`, +`EXECUTES` state), `enemyTypes.ts`
  (`ARCHETYPES.hostage_taker`), `feedback.ts` (optional `energyDelta`, default 0),
  `enemySystem.ts` (timeout→`EXECUTES` route, other kinds byte-identical), `stateMachine.ts`
  (`energy: 100` init + `hostageTakers` array + energy aggregation), `levels.ts`
  (`belliard.roster` += windowWeights.hostage*taker≈8 + streetSpawns).
  `dev-r3f-render`: new `src/render/scene/HostageTaker*.tsx`(kidnapper + foreground hostage,
  rising-tension countdown, execution beat, mirror on`dir`); SHARED-serial: `src/render/ui/HUD.tsx`
  (+`HudData.energy?`, read-only energy display), `useGameLoop.ts` (`floaterFor`energy label +
 `onHudUpdate`energy plumb — coordinate with S2 on this file).`dev-tooling-assets`: new
  `scripts/gen-hostage-enemies.mjs`, `cutout-enemies.mjs`(extend),`enemyTextures.ts`  (register`hostage\*\*`). PARALLEL-SAFE: YES across lanes on new paths; shared files serialised;
**`useGameLoop.ts` is the one file S2 and S3 both touch — serialise S2 then S3 on it.\*\*
  Released: pending.

### mobile-two-axis-pan + fullscreen-toggle (WI-1 / WI-2, PR #29 `claude/mobile-landscape-adr-awjl8z`)

- arch: TWO lanes, ZERO file overlap, both branches typecheck in isolation → fully parallel, no sequencing.
  **Lane G (dev-gameplay)** owns the pan contract end-to-end: `src/game/types/cameraPan.ts`
  (`{x,y,vx,vy}` flat), `src/game/systems/cameraPanSystem.ts` (2D signatures — see plan),
  `src/game/systems/__tests__/cameraPanSystem.test.ts` (Y + cross-axis coverage, TDD),
  `src/hooks/useTouchControls.ts` (+`panDeltaY`/`flickVelocityY` + `data-muf-ui` preventDefault
  exemption), `src/hooks/useGameLoop.ts` (`MobileControls.halfWorldHeight`, 2-axis pan applied to
  `camera.position.x`+`.y`), and the ONE render line `src/render/scene/GameScene.tsx`
  (`halfWorldHeight: facadeH/2` added to the `mobileControls` object — moved into Lane G to keep
  the interface + its call site in one branch and dodge the object-literal excess-property compile
  hazard). **Lane R (dev-r3f-render)** owns fullscreen + shell: new `src/hooks/useFullscreen.ts`,
  new `src/render/ui/FullscreenButton.tsx` (renders null when unsupported, `data-muf-ui`, zIndex 300),
  `src/render/scene/App.tsx` (rename `withRotateGuard`→`renderAppShell`, append `<FullscreenButton/>`
  to every branch), new `docs/adr/0008-two-axis-pan-and-fullscreen.md` + `docs/adr/README.md` index row.
  Lane R does NOT touch GameScene or useGameLoop. PARALLEL-SAFE: YES (disjoint file sets).
  ADR: new ADR-0008 (extends ADR-0003 D4 to Y; realizes the fullscreen item deferred in 0003) —
  0003 stays immutable, NOT edited. HIGH RISK flagged to PM: vertical pan has no `cameraOffsetY`
  in the shot path (`fireBullet`/`crosshairToWorld` ignore camera.y) → taps after a vertical pan
  land at the wrong world-Y; pan-only scope leaves aiming broken on panned windows. Needs a PM
  ruling (fast-follow WI-3 aim fix, or ship documented). (Winston / Senior Architect)
- release: pending.

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
- LANE-DOCS release: `docs/adr/0009-push-marker-workflow-dispatch.md` (canonical idiom,
  `branches-ignore`, guard contract, marker-on-first-dispatch, preview.yml reword, new
  Consequences bullets + Security consequences subsection), `docs/ci.md` (dispatch
  section rewrite + quick-ref row `actions: write`), `docs/agent-handoffs.md` (this
  block). No `.github/**` or `scripts/**` touched — those are other lanes' live edits.
  (Winston / Senior Architect — DOCS lane)

---

### story-sprite-prompt-workshop (follow-up 7) — PROMPT GATE

- gate: **PASS (with reservations)** on the `vehicles` prompt rework (Maud, drafts in
  `docs/art-direction/prompt-drafts.md`). Assembled prompts obey the bible §3: **zero
  negations** (the headline fix — old set carried 6-7), medium+view front-loaded (§3.2),
  hex-bound colours (§3.5), one xerox primary style (§3.4), `neonPhrase` carries the law
  of glow with hue from the `neon` field (§2.1, no hardcoded hues), shared `opening`/
  `neonPhrase`/`style` are byte-identical by construction so family consistency (§2.2) is
  structural. Car sedan-FAIL fix endorsed: "one-box monospace city car" + "hood and
  windshield in one continuous slope" is the correct anchor — I REJECTED adding a
  "hatchback" class noun (a hatchback is two-box, would fight the one-box slope; §3.7 trap).
  No prompt clause needs rework; Maud does NOT iterate. (Nico / Lead-Art)
- BLOCKER (not Maud's — `dev-tooling-assets`): `scripts/check-art-prompts.mjs` hard-fails
  these correct prompts with 3 ERRORs and will red CI. It lints `STYLE_TOKENS` against the
  `vehicles.style` field alone, but the §4 four-slot split legitimately moved side-view →
  `opening` and neon → `neonPhrase`, and §3.1 forbade the anti-photoreal _negation_ the
  linter still REQUIRES. Fix before merge: lint the ASSEMBLED prompt across all four slots,
  and let the anti-photoreal token accept positive phrasing ("flat 2D video game sprite",
  "photocopied fanzine illustration", "black and white") instead of demanding "not photoreal".
- bible: amended §3.3 word ceiling 80 → 90 (assembled), reconciling the four-slot reality;
  every added clause verified load-bearing, no filler found. (Nico / Lead-Art bible gate)
- watch at ASSET gate: (1) xerox/halftone treatment sits at words ~56-89 (weak attention
  tail) — verify it did not wash out; the set will drift _together_ so §2.2 holds even if
  §1 fidelity softens. (2) "black and white except the neon" vs stray colour in the body
  (toner-tint OK, full colour FAIL). (3) moto is a §5-verbatim chimera (Booster fat wheels +
  103 exposed frame) — accept if it reads as skeletal moped + top-box; re-anchor to one bike
  if it renders confused. (4) car "corner-mounted wheels" — if wheel placement reads wrong,
  swap to §5 verbatim "wheels pushed to the corners" next iteration. (Nico / Lead-Art)

---

### story-sprite-prompt-workshop (follow-up 7) — ASSET GATE

- verdict: **ITERATE — 3/3 FAIL, set fails family (§2.2). Over the 2-batch cap
  (seed-reroll was batch 2), so this is NOT a self-authorized reroll → options to
  Bertrand.** Mechanical pre-check does not bind; taste FAILs where the machine passed.
- truck (seed 1337): **FAIL** — §1 identity + §2.1. Body is a solid ORANGE fill, not
  B&W xerox with an orange edge-rim (mechanical neon 37.3% confirms the flood). This is
  exactly watch-item (2): full colour in body = FAIL. No high-contrast B&W read survives.
- car (seed 42): **FAIL** — §2.1 (nothing decorative glows): a neon-cyan skyscraper
  SKYLINE glows behind the car — decorative glow, and it breaks the §3.5 flat matte-black
  ground the sprite is chroma-keyed on. Corner-sampling mechanical missed it (cityscape
  sits inside the frame → "grounds 100% clean" is a false pass — textbook why the machine
  doesn't bind). Secondary: reads low/long fastback, not the tall one-box glasshouse
  city-car of §5 (proportion miss, not a class miss). NB body treatment (black + cyan
  rim, glowing wheels per neonPhrase) is the ONLY on-direction one of the three.
- moto (seed 8128): **FAIL** — §1 + §2.1, same body flood as truck (magenta panels, not
  B&W + rim). Cleared watch-item (3): reads as a coherent skeletal moped + top-box, NOT a
  chimera. Cleared (4): wheels read fine. Fails only on the colour flood.
- root causes are TWO, not one → no single-variable reroll fixes the set: (a) truck+moto
  body-flood traces to `neonPhrase` "glowing along the whole silhouette" — FLUX reads
  "whole silhouette" as fill the body; (b) car has a decorative background + proportion.
- vs previously PM-accepted set: mixed, not yet better to ship — WIN: right seeds, moto
  chimera cleared, car finally shows the correct black-body + neon-rim treatment (the
  actual direction). LOSS: two bodies regressed to full colour, car smuggled a glowing
  skyline. Not a family-consistent, shippable run.
- options for Bertrand (all exceed the 2-batch cap → your call): (1) spend batch 3 with
  two coordinated prompt edits — reword `neonPhrase` to "thin outline edge-rim only, body
  pure B&W xerox" (fixes truck+moto flood) + harden car ground/proportion; I re-gate the
  prompts first. (2) kontext style-lock (§3.12/§7): fix the car, make its black-body+rim
  the family hero, derive truck+moto image-to-image from it — strongest §2.2 guarantee,
  no fresh prompt batches. (3) override + ship as-is (only you may override a FAIL).
  (Nico / Lead-Art — asset gate)

---

### story-sprite-prompt-workshop (batch 3) — TECHNICAL PASS (Serge / game-graphist)

- scope: metered the batch-3 PNGs (commit a20a2c5) at real in-game scale. Mechanical
  `check-sprite-style.mjs` re-verified PASS 3/3 (but see flood note — the gate is blind to it).
- alpha: **hard-binary on all three (0.00% semi-transparent)** — no soft feathered fringe,
  nothing to alpha-harden. "crisp cutout edges" already holds on the alpha channel.
- keyed edge (boundary-ring dark+saturated glow remnant, my [S4] metric): **truck 54%**
  (dark-orange), **car 74%** (dark green-cyan), **moto 9%** (borderline-neutral → clean).
  Hot isolated pixels (disconnected strays): truck 6px/5 islands, car 18px/14, moto 26px/17
  — all <0.2% of opaque, trivial.
- body treatment (the blocker, gate-blind): **truck ORANGE FLOOD** (neon-band 44% of content),
  **moto MAGENTA FLOOD** (pink panels, band 8%) — both §1/§2.1, NOT B&W xerox + rim. **car**
  black body + cyan rim is ON-DIRECTION but carries a large **connected** glowing cyan
  cabin/cityscape mid-frame (§2.1 decorative glow / [S7] glasshouse over-read; it is part of
  vehicle component #0, box spans it → NOT a removable stray). truck silhouette low (38%
  canvas height) reads generic van, not tall-cargo ([S5] confirmed).
- retouch decision: **NONE — deferred.** Every sprite is blocked by a DIRECTION failure
  outside the retouch remit: body flood (repaint = artistic alteration) and the car's
  connected cabin (content removal = artistic alteration) — both force **regeneration**. The
  edge halo, though real, is invisible against the flooded bodies (truck orange-on-orange) or
  dwarfed by the car cabin; retouching sprites that must be regenerated = gratuitous
  processing. Retouch is deferred to the corrected (de-flooded) batch, where the edge shows
  against a B&W body and will not be thrown away. Deterministic op spec recorded in
  `prompt-drafts.md` (batch-3 technical-pass note) so it lands in one sitting next pass.
- verdict: **0/3 technically shippable — NOT on edge hygiene (edges are sound) but on body
  flood (truck/moto) + decorative cabin & low/long proportion (car).** The batch-3 "body
  staying pure black-and-white xerox" prompt edit did not hold against FLUX. Recommend another
  anti-flood iteration or the kontext hero-lock (§3.12) before any retouch pass. Nico's ASSET
  GATE owns the taste verdict; my technical read (edges clean, flood/cabin are the blockers)
  is advisory and his gate wins. (Serge — game-graphist, technical pass)

---

### story-decoupled-bw-vehicles — TECHNICAL PASS (Serge / game-graphist)

- scope: metered the first decoupled B&W batch (commit 42095d1, magenta chroma-key ground per
  my [S1]). Mechanical `check-sprite-style.mjs` PASS 3/3 (bw mode) — but a FALSE pass on the
  car, see gate gap.
- **[S1] magenta-key VALIDATED (the silhouette half):** alpha hard-binary on all three
  (0.00% semi), boundary ring ~0% magenta (truck 0 / moto 0 / car 12%), black ink linework
  preserved, interior whites survived, and — my key concern — **the moto tube frame survived
  intact** (black-on-black ground would have flood-eaten it; on magenta it keys clean). No
  eaten contours. The eaten-silhouette risk of the decouple is solved.
- **NEW defect — magenta COLOR CAST bleeds into the B&W render (deep interior, not fringe):**
  strong-colored (S>0.40) share = truck 22% / moto 27% (+42% faint) / **car 54% (meanSat
  0.41 — body-wide pink)**; hue is a consistent crimson/magenta 330-360° across all three
  seeds → it is GROUND SPILL, not design. Violates §1 "fully black and white". The car is the
  low-contrast render that soaked up the most. This is a GENERATION-pipeline contamination:
  the pipeline keys the ground but never forces the sprite back to B&W.
- **retouch decision: NONE.** The cast is a body-wide tonal problem, not edge hygiene — my
  remit (fringe/halo/alpha/quantize) and my documented spec (stray + boundary-clamp + alpha)
  do not cover a global desaturation, which would also be a tonal alteration and would leave
  the low-contrast car muddy. Strays are trivial (truck 4px / car 46px / moto 37px). Cleaning
  them now is throwaway: the set must be re-processed at source to kill the cast, which
  regenerates every pixel. Alpha already hard-binary → nothing to harden.
- **SOURCE FIX (dev-tooling-assets + Maud, not retouch):** add a **grayscale / force-B&W step
  AFTER the magenta key** in `gen-vehicle-sprites.mjs`. Key on the colour image first (clean
  silhouette, proven here), THEN desaturate the keyed sprite → neutralises the ground spill in
  the body while keeping the clean cut. This is the missing companion to my [S1] ground change
  (flagged then as a coordinated tooling change). Rim bake (ADR 0011) is unaffected either way
  (it reads alpha, not colour), but the visible sprite must be true B&W.
- **GATE GAP (flag for tooling):** the bw-mode flood-kill counts only high-sat AND high-val
  pixels in ONE hue band (≤18%). The car reads **12.39% magenta → PASS** while being 54%
  strong-coloured to the eye, because the pink cast is medium-value. The gate green-lights a
  pink sprite. Recommend a mean-saturation ceiling or a medium-val saturated-pixel count so a
  body-wide cast trips it.
- silhouette reads at game size: **[S5] truck improved** — boxy tall-cargo roofline (43% canvas
  height vs batch-3's 38% low van; front cab/hood steps down, cargo box tall), acceptable, final
  taste to Nico. **[S7] car** — got the tall rear phone-booth glasshouse but overall reads long
  wagon/estate (aspect 3.3), not the short tall one-box city car of §5; silhouette taste concern
  for Nico on top of the cast. **moto** coherent skeletal moped + top-box, frame intact.
- verdict: **0/3 technically clean — but for a NEW, narrower reason (magenta cast) and the
  decouple's core risk (eaten silhouette / colour flood) is now SOLVED.** One source step
  (grayscale-after-key) + a gate tightening away from a clean set; then a fringe/stray retouch
  pass from me if needed. Per sprite: truck CLOSEST (cast mostly enclosed window crimson,
  B&W-ish body) — likely clean after the source fix; moto coherent but pink-cast; car WORST
  (severe body-wide cast + long-wagon silhouette + falsely gate-passed). Back to
  dev-tooling-assets/Maud for the B&W step; Nico's asset gate owns the silhouette taste calls.
  (Serge — game-graphist, technical pass)

---

### story-sprite-prompt-workshop (follow-up 7) — PROMPT re-GATE (batch 3b)

- verdict: **PASS — dispatch batch 3b on `claude/art-pipeline-graphist`.** Both
  Bertrand-authorised option-1 edits land correctly on the two root causes; Serge's one
  blocker (rim over-correction) is resolved in 3b. New link Serge (game-graphist) noted.
- neonPhrase rim ([S1]/[S2] fix): **PASS** — "a bright, crisp {neon} ({hex}) acid neon
  rim light, a clean band a few pixels thick tracing only the outer edge and wheel rims,
  body staying pure black-and-white xerox." Brightness-led + thickness FLOOR is the right
  call (value survives the in-lane downscale, stroke-area doesn't); "only the outer edge"
  keeps the anti-flood limiter that fixed my §1/§2.1 body-flood FAIL; positive B&W body in
  the strong zone; {neon}/{hex} stay data-bound (§2.1); zero negations ("only"/"a few" are
  limiters); "acid neon rim light" keeps the loi-du-glow lint token. Good.
- car subject: **PASS** — "completely alone, empty surroundings" is the positive antidote
  to the smuggled cyan skyline (§2.1/§3.5, no scenery negation); "tall upright phone-booth-
  shaped glasshouse cabin" is proportion language with no class noun, the direct fix for
  the low-fastback (§5); "wheels pushed to the corners" is §5-verbatim, clearing my old
  reservation (4); my three endorsed anchors kept verbatim. Good.
- coarse-halftone (shared `style`, §2.2 family change, [S3]): **PASS/approved** — byte-
  identical across the set so family holds structurally; consistent with §1 "degraded
  xerox halftone" / §3.4 (an intensification of the xerox law, not a drift); aids downscale
  - edge-key. No bible change needed for it.
- BIBLE GATE (mine): reconciled §3.3 — bible said "30-90 assembled words," the crew was
  citing a 120 lint ceiling not in the bible. Amended §3.3 to "30-90 target; 120 hard
  ceiling (lint errors >120, warns >90)," 90-120 tolerated ONLY for load-bearing FAIL-fix
  clauses justified in prompt-drafts. 102/113/102 all fit; I verified no filler to cut —
  every word past 90 fixes a specific asset-gate FAIL. The car's 113 is watched (below).
- asset-gate watch list (mine, next gate): (W1) **truck [S5] — the live risk.** Serge
  metered the reject at 36% canvas height, cargo roof ~level with cab = low/generic van,
  NOT §5 "cargo body taller than the cab line"; the flood was masking it. Subject clause is
  already §5-verbatim and the changed tail (neonPhrase+coarse-halftone) alters the fixed-
  seed roll, so improvement is possible but NOT guaranteed. CONTINGENCY (pre-registered, so
  we don't dither): if the truck reproduces low/generic, the remedy is a truck-subject step-
  up-roofline strengthening (+ possible seed reroll) escalated to Bertrand as a scoped
  follow-up — NOT folded in now (outside authorised option-1 scope; better to measure with
  data than pile a speculative 3rd variable onto the one authorised shot). (W2) car [S6] —
  "body staying pure B&W xerox" + "crisp cutout edges" sit at ~word 85-113 (weakest zone);
  car was the one that did NOT flood, so lowest risk where deepest, but verify the B&W body
  held. (W3) car [S7] — phone-booth clause must not over-read into a small van/box. (W4)
  moto — smallest canvas (256), verify the "few pixels thick" rim floor didn't vanish and
  chimera stays cleared. (W5) [S4] glow-halo boundary fringe (truck 39/car 64/moto 29% on
  the reject) is Serge's TECHNICAL-pass retouch, not a prompt blocker — confirm cleaned.
  (Nico / Lead-Art — prompt re-gate)

---

### story-sprite-prompt-workshop (follow-up 7) — ASSET GATE, batch 3 (commit a20a2c5)

- verdict: **ITERATE — 0/3 FAIL. I concur with Serge's advisory read.** This was the
  Bertrand-authorised shot; per instruction I do NOT self-authorise another batch —
  options + recommendation below go to Bertrand. Prompt-only has now plateaued on the
  flood across two batches — that is the §3.12 kontext trigger condition, stated in law.
- truck (seed 1337): **FAIL, double** — §1/§2.1 the orange BODY FLOOD recurred (Serge
  neon-band 44%, up from 37.3%) despite "body staying pure black-and-white xerox" + "black
  and white except the neon"; the positive B&W clause did NOT overcome FLUX-schnell's fill
  tendency. AND §2.3 silhouette: watch-item W1/[S5] confirmed — a long, LOW, stretched van,
  cargo roof ~level with the cab, not "cargo body taller than the cab line" (§5). Worst of
  the three.
- car (seed 42): **FAIL** — §2.1 REGRESSED: last batch's cyan skyline was a detachable
  background; now it is a CONNECTED glowing cyan cabin/greenhouse fused into the vehicle
  blob (Serge component analysis: part of the sprite, not removable by retouch). "completely
  alone / empty surroundings" did not starve it. §2.3: still low/long, the phone-booth clause
  ([S7]) under-read. Body treatment no longer the clean hero it was in batch 2.
- moto (seed 8128): **FAIL** — §1/§2.1 magenta panel flood recurred, same root as the truck.
  Silhouette PASSES (coherent moped + top-box, chimera stays cleared); fails only on flood.
- family §2.2: FAIL as a set — two flooded bodies + one fused-cyan car; not one printing run.
- edges: Serge confirms technically sound (binary alpha; [S4] halo deferred to his pass) —
  NOT the blocker. The blocker is generation content (flood + silhouette), not keying.
- TOOLING FOLLOW-UP (for the record, `dev-tooling-assets`): `check-sprite-style.mjs` has no
  NEON UPPER BOUND — it is flood-blind, passed truck at 37.3% (b2) and 44% (b3). Add a
  ceiling (a body-flood FAIL above ~15-20% neon area) so a flood auto-rejects mechanically.

**Options for Bertrand (I will not self-authorise a batch):**

- **(A) Revert to the previously PM-accepted set** — safe, ships now, unblocks the delivery
  beat. Known-good. Downside: off the current prompt direction, but on-screen and accepted.
- **(B) Decouple neon from the body [MY RECOMMENDATION]** — the flood's root cause is the
  neon token itself: FLUX-schnell reads "acid neon rim" on a monochrome vehicle as "paint
  the vehicle neon," and two batches of positive B&W clauses cannot beat it. Fix: FLUX
  generates the vehicles as PURE B&W xerox with NO neon token at all (removes the trigger →
  no flood, and the low-van silhouette can then be fought on a clean plate), and the neon
  rim becomes a RENDER-SIDE emissive outline in `src/render` keyed off the sprite alpha.
  This is MORE on-direction, not a compromise: §2.1 "what glows is interactive" is better
  served by a live glow than a baked one (it can respond/pulse as a real signal). Scope: pm
  - senior-architect + dev-r3f-render (render effect, boundary-clean, needs an ADR).
- **(C) kontext hero-lock (§3.12)** — the eventual fallback if a fully-baked pipeline is
  mandated. Caveat: we have NO clean hero. The batch-2 car body was a good TREATMENT ref
  but bad on silhouette+background; a clean B&W hero must be generated FIRST, then truck/
  moto derived image-to-image. Real work, unproven pipeline (§7 follow-up, not yet wired).
- **(D) One more same-lever prompt iteration — I REJECT this.** Prompt-only has plateaued
  on the exact failure twice; a third word-tweak against the flood is low expected value and
  burns the shot.

**Recommendation: (A) now to unblock, (B) as the real fix.** Revert to the accepted set so
the delivery beat is not held hostage to art, and commission the decouple (clean B&W sprite

- render-side neon rim) as the correct long-term solution — it kills the flood at its source
  and upgrades the loi du glow from baked to live. (C) only if product mandates fully-baked
  sprites. (Nico / Lead-Art — asset gate, batch 3)

---

### story-sprite-prompt-workshop (follow-up 7) — PROMPT GATE, decoupled B&W (ADR 0011)

- verdict: **PASS — dispatch the B&W generation**, with ONE dispatch-ordering condition on
  the chroma-key ground (below). The flood era is over by construction, not by wording.
- prompt contract (§3): **clean.** `neonPhrase` retired to `""` (no neon/glow token
  anywhere — the ADR 0011 inverse rule); `style` = "…coarse halftone dots, fully black and
  white, on a uniform matte black background (#000000)…" with my KEEP-clauses intact;
  subjects unchanged from 3b; 71/82/71 words (back inside the 30-90 band, so the §3.3
  tail-washout pressure is gone); zero negations; hex-bound ground (§3.5); shared style
  byte-identical (§2.2 structural). Nothing to rework in the contract.
- §2.1 loi du glow: now satisfied by the RENDERER (additive emissive silhouette, hue from
  the `neon` data field, flood impossible by construction per ADR 0011). BIBLE amended:
  §2.1 now states the law governs the on-screen result not the method, vehicles carry a
  render-side rim and ship as pure B&W (a baked rim on a vehicle sprite is now itself
  off-spec); §6 pipeline/gate note updated (neon check flips to an upper-bound flood-kill
  for the vehicle set; prompt lint forbids neon tokens in vehicle prompts).
- KEYING WATCH (Serge's parallel pre-prod concern — I SHARE it, but it is not a contract
  rework): with the bright neon rim gone, the vehicle's dark ink OUTLINE now sits on the
  #000000 ground; the cutout is `cutout-enemies.mjs`'s conservative border FLOOD-FILL
  (threshold 24, preserves interior dark), NOT a global black key — so a mostly-light B&W
  van is far safer than the `foreground` SOLID-black ironwork that needs a magenta key. The
  only vulnerable pixels are contour ink within ~24 of pure black (high-contrast xerox can
  push ink to true black → leak/nibble). CONDITION on dispatch: bind the ground to Serge's
  parallel keying pass. If his metering shows a clean cut on #000000 (threshold/edge-
  quantize handles it, his technical pass, no regen) → ship as-is. If the outline is
  eaten/ragged and unrecoverable in retouch → switch the generation ground to a bright
  chroma-key mirroring the in-file `foreground` magenta detour ("solid flat uniform bright
  magenta chroma-key background") — that is a prompt change so it must land BEFORE the
  generation, not after. Decide from Serge's result before committing the batch; do not
  regenerate twice.
- SILHOUETTE watch (unchanged subjects → carried to the asset gate, NOT blocking here): W1
  truck [S5] low/generic van (§5 taller-than-cab); W3 car [S7] phone-booth over/under-read.
  Removing the neon token changes the fixed-seed roll, so these may shift — measure at the
  asset gate; if the truck still reads low, THEN strengthen its subject (a scoped, isolated
  change), not now (keep subjects fixed to isolate the decouple variable).
  (Nico / Lead-Art — prompt gate, decoupled B&W)

---

### story-sprite-prompt-workshop (follow-up 7) — ASSET GATE, final decoupled set

- verdict: **SHIP.** 2/3 clean PASS; the car FAILS the silhouette-archetype law but does
  NOT block ship — it rides as a scoped follow-up. This set + the render-side rim is what
  ships. §1 satisfied on all three: fully B&W xerox, crimson cast gone (grayscale-after-key
  Rec.601 worked, meanSat 0.000) — the magenta-key detour + grayscale step was the right
  call. Judged as pure B&W; the neon rim comes live in-game (§2.1 render-side, ADR 0011).
- truck (seed 1337): **PASS.** W1/[S5] resolved — the cargo body now reads clearly TALLER
  than the cab line (Serge 43% vs 38%), boxy tall-roof delivery volume, clean high-contrast
  xerox. Reads unambiguously as the truck class (§2.3) — biggest, boxiest, longest. Minor
  fidelity note (not a FAIL, optional future roll): it carries a long hood so it reads
  estate/panel-wagon rather than flat-nosed forward-control (§5) — class is right, the nose
  detail is soft. Ships.
- moto (seed 8128): **PASS.** Coherent skeletal moped, exposed tube frame intact, fat small
  wheels, round headlamp, top-box crate — the delivery read lands. Chimera stays cleared.
  Cleanest B&W of the three. Ships.
- car (seed 42): **FAIL (§2.3 / §5 archetype), ship-unblocking — scoped follow-up.** The
  phone-booth clause over-read ([S7]): the tall glasshouse landed as a tall boxy volume
  grafted onto the REAR of a low long body → reads "long wagon/estate/hearse," not the
  short one-box city car (Twingo/AX charm). By the letter of the silhouette law that is a
  FAIL. BUT it does not block ship: it still reads as a four-wheeled civilian CAR-class
  vehicle (not moto, and distinguishable from the truck by its low front + overall
  size), and the live cyan rim seals the class read in-lane. The delivery beat has been
  blocked across four generation cycles; holding the whole feature on a proportion/charm
  miss (right class, wrong archetype) is not worth it when truck+moto are clean and the car
  is functional. FOLLOW-UP (scoped, one asset): iterate the car subject to a SHORT one-box —
  the fix is to kill the long rear-box read, e.g. drop "phone-booth-shaped rear cabin"
  language, steer "short overall length, minimal front and rear overhang, tall cabin set
  well forward over a stubby body," reroll seed 42 if composition stays long. Not a blocker;
  a polish pass.
- overall: SHIP truck + moto + car now with the runtime rim; open a scoped follow-up story
  for the car silhouette iteration. (Nico / Lead-Art — asset gate, final set)

---

### story-render-side-neon-rim — decouple vehicle glow from baked art (ADR-0011)

- arch: Boundary verdict PASS. Decision recorded in `docs/adr/0011-render-side-neon-rim.md`
  (Accepted): vehicles generate PURE B&W; the loi du glow moves to `src/render` as a runtime
  emissive rim. Technique = CPU-baked neon silhouette (opaque pixels → assigned hue via source
  alpha) drawn behind the sprite with `AdditiveBlending`, scaled out by a uniform world-space
  margin. Rejected post-processing (SwiftShader/e2e cost + new dep) and a custom edge-detect
  shader (overkill, GLSL risk on software GL). Chosen path adds ZERO new GL surface — stock
  `MeshBasicMaterial`+`CanvasTexture`+`AdditiveBlending`, already exercised by `EnemySprite`.
  Data contract: `GameState.deliveryVehicle.vehicleType` already reaches render; neon NAME
  stays authored in `levelArt.json` `vehicles.types[*].neon`; name→hex is a render-side
  constant anchored to art-direction §2.1. Game logic (`delivery.ts`, `deliverySystem.ts`,
  `GameState`, `levelArt.ts` loader) UNTOUCHED — the hue never enters game state.
- lanes (three disjoint path sets, PARALLEL-SAFE: YES):
  - **dev-r3f-render** — `src/render/**` ONLY. NEW `src/render/scene/vehicleNeon.ts`
    (`getVehicleNeonHex(type)` reading `levelArt.json` data + render-side `NEON_HEX` anchored
    to §2.1; `buildNeonSilhouette(image, hex)` CanvasTexture bake, nearest filter). MOD
    `DeliveryVehicleSprite.tsx`: cache a baked silhouette per type in the load callback; add a
    second `rimRef` mesh (renderOrder 6, z = VEHICLE_Z − 0.01, MeshBasicMaterial transparent /
    depthWrite:false / AdditiveBlending); per-frame same position, per-axis scale
    `x=facing·(worldW+2T)`, `y=worldH+2T`, `T≈0.06·VEHICLE_H`; `rim.visible = onStage &&
silhouetteTex!==null`. No game/scripts edits.
  - **dev-tooling-assets** — `scripts/**` ONLY. `check-art-prompts.mjs`: inverse rule for the
    vehicles set — assembled vehicle prompt must contain NO neon/glow token. `check-sprite-style.mjs`:
    flip vehicle NEON check to UPPER-BOUND flood-kill (≤ ~15–20% of content in any saturated
    hue band, all modes) and REMOVE the lower bound for B&W vehicles (expected-low); recalibrate
    table against regenerated B&W PNGs. `gen-vehicle-sprites.mjs`: defensive only (assembly already
    tolerates an empty `neonPhrase`). Keep the `neon` NAME field — it is now render metadata, not
    a prompt token. No `levelArt.json` string edits, no `src/**`.
  - **concept-artist** — `levelArt.json` STRING fields + `prompt-drafts.md` ONLY (sole writer of
    levelArt.json here → no file overlap). Remove every neon/glow/acid/hue token from the vehicle
    prompt: empty `neonPhrase`, rewrite `style` to pure B&W xerox (drop "except the neon" / "acid
    neon"), keep matte-black bg for keying and all silhouette/medium/view language. Retain per-type
    `neon` NAME. Document the decouple rationale (FLUX floods on the neon token) for the prompt gate.
- serialization note: `levelArt.json` is written ONLY by concept-artist in this story (all edits
  are string content); tooling stays in `scripts/**`, render only READS the JSON. `docs/agent-handoffs.md`
  serialized by the orchestrator. (Winston / Senior Architect)

---

### adr-tutorial — crew adversarial review of ADR-0012 (optional scripted tutorial stage)

Cycle: 4 parallel read-only review lanes → architect arbitration + in-place amendment →
pm acceptance. ADR stays **Proposed**; final acceptance = Bertrand merging the PR. No `src/`
changes in this cycle — the ADR is design-only; implementation is a separate story.

- pm (John), scope lane: **GO-AVEC-AMENDEMENTS** — mécanisme scope-compliant
  (optionnel/skippable/non-gating/additif, boucle intouchée), mais 2 MAJEURS avant PR : D4
  enseigne des ennemis (car/hostage/`energy`) absents du seul niveau jouable Belliard
  (courier-only, YAGNI), et la revendication « même registre narratif » est fausse et frôle
  le §8 « dialogue élaboré » — plus 3 MINEURS (justification desktop gonflée → recentrer
  mobile, friction première-carte vs UX §5.1, exactitude/sur-énumération contrôles).
- dev-gameplay, `src/game` lane: **GO-AVEC-AMENDEMENTS** — 2 bloquants avant impl : (1)
  `stateMachine.test.ts:87-96` itère tout `LEVELS` avec `deliveries.length>0` et cassera sur
  l'entrée tutorial (test oublié par l'ADR, à filtrer sur `kind!=="tutorial"`) ; (2) l'entrée
  inerte spécifiée ne type-check pas (`name/district/year/enemySpeedMultiplier` requis
  manquants, et `name/district/year` affichés par `LevelCard` donc non inertes). Reste
  (unlock id-based, citations de lignes, remèdes consistance, `kind?`/`image?` additifs)
  confirmé exact.
- dev-r3f-render, `src/render` lane: **GO-AVEC-AMENDEMENTS** — toutes citations render
  exactes (App/MainMenu/NarrativeScreen). D2/D5 faisables sans refonte (branchement `kind`
  interne à `LevelCard`, `NarrativeLine.image?` additif). Amender D3 : l'effet de tension
  `App.tsx:136-139` divise par `selectedLevel.timeSeconds` sans garde de phase → la branche
  tutorial ne doit pas `setSelectedLevel` sur l'entrée `timeSeconds:0` et le seed doit passer
  par `FIRST_PLAYABLE_LEVEL`. Mineurs : filtre `kind` Scores redondant (défense en
  profondeur) ; `GameScene.tsx:83` consommateur `LEVELS` non listé mais sûr (par id).
- dev-tooling-assets, pipeline/CI lane: **GO-AVEC-AMENDEMENTS** — pipeline/CI/
  `?preview=tutorial`/BASE*URL confirmés sans risque (aucun script n'itère le module
  `LEVELS` ; tous lisent `levelArt.json` seul), mais D5 doit être amendé : sprites drive-by
  `car*\_`et`hostage\_\_`+ assets HUD **non livrés**, donc « illustré avec les assets
existants seulement » n'est vrai aujourd'hui que pour cops/livreur/bonus. Le harnais
preview a deux moitiés :`App.tsx:74-76`ET`scripts/screenshot-preview.mjs:167-169`.
- arch (Winston), arbitration: ADR-0012 — adversarial-review amendments arbitrated,
  **16/16 findings ACCEPTED, 0 rejected**. ADR amended in place (Context + D1–D5 +
  Consequences/Gotchas): scope descoped to shipped content (window cops + courier + loop +
  base HUD; car/hostage/`energy` deferred to S2/S3 alongside the roster that introduces
  them), `NaN`-divisor and `LEVELS[0]`-consumer hazards documented (`App.tsx:136-139`,
  `stateMachine.test.ts:87-96`), asset claims corrected to the real `public/assets/`
  inventory, distinct briefing register assumed (short of §8). README index labels
  0009/0010/0011 fixed. Status stays **Proposed** — cleared for pm acceptance; devs must
  not implement until Accepted.
- pm (John) → Bertrand, acceptance: ADR-0012 amendé **accepté produit** (2e passe, lecture
  seule). Les 5 points de la 1re review (2 MAJEURS, 3 MINEURS) sont tous traités et cités ;
  scope confirmé optionnel/skippable/non-bloquant/zéro-règle/cutscene-simple, aucune
  régression introduite par les amendements techniques. Statut ADR reste Proposed —
  acceptation finale = merge PR par Bertrand.

---

### story-tutorial-stage — implementation of ADR-0012 (3 parallel lanes, PR #34)

Bertrand's "Go" = product green light to implement. Three dev lanes fanned out on disjoint
path sets (PARALLEL-SAFE: YES — `src/game/**` / `src/render/**` + diagram / `scripts/**`),
coded against a shared interface contract (`FIRST_PLAYABLE_LEVEL`, `TUTORIAL_NARRATIVE`,
`LevelConfig.kind?`, `NarrativeLine.image?`).

- release Lane A (`dev-gameplay`, `src/game/**`, TDD): `LevelConfig.kind?` +
  complete tutorial entry prepended to `LEVELS` (diegetic `name/district/year`, inert
  gameplay fields) ; `FIRST_PLAYABLE_LEVEL` non-undefined via module-load invariant (double
  casts retired) ; `NarrativeLine.image?` additif ; `TUTORIAL_NARRATIVE` en constante
  séparée, registre briefing DISPATCH/KENZA, 8 panneaux limités au livré ; tests
  `stateMachine`/`levelArt.consistency` filtrés sur `kind`, NEW
  `tutorialInvariants.test.ts` (index 0, belliard premier jouable, exclusion unlock,
  isolation clés narratives, existence des sprites). vitest 175→180, eslint clean. (Amelia
  — Gameplay)
- release Lane B (`dev-r3f-render`, `src/render/**`): `AppPhase` + `"TUTORIAL"` ;
  `handlePlay` branche sur `kind` en premier, sans `setSelectedLevel` (piège NaN du
  diviseur de tension évité), fin/skip → MENU, rien d'écrit ; seeds/fallback via
  `FIRST_PLAYABLE_LEVEL` ; `?preview=tutorial` ; badge statique `TUTORIEL` (néon jaune,
  hors échelle de difficulté), stats/MEILLEUR masqués, Scores défaut premier jouable +
  filtre défensif ; `NarrativeScreen` rend `image?` au-dessus du dialogue (BASE_URL) ;
  `docs/diagrams/app-phase-flow.md` rafraîchi. tsc + eslint clean. (Amelia — Render)
- release Lane C (`dev-tooling-assets`, `scripts/**`): capture explicite
  `?preview=tutorial` → `02_tutorial.png` dans `screenshot-preview.mjs` + insertion contact
  sheet (la boucle par niveau lit `levelArt.json` et n'atteint jamais le tutorial) ;
  dégradation gracieuse si la phase manque. `node --check` OK. (Amelia — Tooling)
- verify (orchestrateur): tsc clean, eslint clean, vitest **180/180**, prettier clean ;
  navigateur headless (Playwright/Chromium) **8/8 PASS**, 0 pageerror — carte TUTORIEL
  première du menu (Belliard garde badge FACILE et reste le défaut Scores), briefing rendu
  avec sprite véhicule, clic carte → briefing, « Passer » → retour menu.
- arch (Winston), integration sign-off: ADR-0012 tutorial integration **APPROVED**.
  Boundary law + D1–D6 all PASS across the 3 lanes (game/render/scripts, non-overlapping).
  NaN-tension trap avoided (no `setSelectedLevel` on tutorial branch), no `levelArt.json`
  entry, no art gate. **ADR flipped to Accepted** ; PR #34 merge seals. No corrections
  required.
- pm (John) → PR #34, acceptance: **ACCEPTÉ** le tutoriel ADR-0012. D2/D4/D6 + guidelines
  §1/§5/§8 conformes (registre briefing terse, contenu limité au livré, non-goals
  respectés, zéro art généré, skippable un bouton). Follow-up cosmétique non-bloquant :
  wording du district « Prise en main » (une variante plus diégétique façon flyer pourrait
  coller mieux — à considérer plus tard).

---

### code-review panel — PR #34 (tutorial ADR-0012) — first run of the mandatory merge gate

Demande de Bertrand : review de code par une équipe de plusieurs architectes aux skills de
review distincts, désormais **gate obligatoire avant tout merge sur main** (encodé dans
COLLABORATION.md §code-review panel, CLAUDE.md, le hook crew-reminder et le PR template).

- Architecte A (`code-review`, effort high): 0 bloquant/majeur. 3 MINEURS — libellé
  `[ JOUER ]` trompeur en fin de tutoriel ; `loadScores` lu inutilement pour la carte
  tutorial ; assertion tautologique dans `tutorialInvariants.test.ts`.
- Architecte B (`bmad-code-review`, couches Blind Hunter / Edge Case Hunter / Acceptance
  Auditor): 0 bloquant/majeur. 4 MINEURS — `district: "Prise en main"` non diégétique
  (viole D1/D4) ; `[ JOUER ]` (doublon A) ; `alt=""` sur des sprites informatifs (a11y) ;
  rognage possible de l'image en paysage mobile court.
- Architecte C (`bmad-review-edge-case-hunter`): 1 MAJEUR — `<img>` sans `key` React :
  sur deux panneaux illustrés consécutifs (flic → livreur), le navigateur garde l'ancien
  sprite affiché jusqu'au décodage du suivant (modèle current/pending request), donc le
  sprite du FLIC peut rester visible pendant « le livreur, tu le touches JAMAIS ». 3
  MINEURS — pas d'`onError` sur 404 ; pas de préchargement ; `findIndex === -1` →
  `unlockLevel("tutorial")` théorique.
- Architecte D (`security-review`): **aucun finding** — `image` non attaquant-contrôlé,
  `?preview=` en égalités strictes jamais rendu au DOM, parsers localStorage durcis
  (pas de merge d'objet → pas de prototype pollution), script preview sans entrée externe.
- Vérification adversariale (skeptique): C1 (img sans key) **CONFIRMÉ** — séquence idx 4→5
  de `TUTORIAL_NARRATIVE` vérifiée, comportement navigateur conforme spec, le typewriter
  aggrave la fenêtre. C4 (unlock "tutorial") **RÉFUTÉ** — `currentIdx === -1` prouvé
  inatteignable : toutes les écritures de `selectedLevel` sont contraintes à des membres
  de `LEVELS` et la branche tutorial de `handlePlay` return avant `setSelectedLevel`.
- Triage + correctifs (2 lanes parallèles, chemins disjoints):
  - render: `key={currentLine.image}` (C1) ; `onError` + reset par ligne (C2) ;
    `alt={currentLine.imageAlt ?? ""}` (B3) ; conteneur image rétrécissable
    `minHeight:0/flexShrink:1/objectFit:contain` (B4) ; prop `doneLabel` (défaut
    `"JOUER"`), la phase TUTORIAL passe `"TERMINER"` (A1/B2) ; `loadScores` gaté par
    `!isTutorial` (A2).
  - game: `NarrativeLine.imageAlt?` + 3 alts français authorés (B3) ;
    `district: "Repérage"` (B1, suggestion pm) ; assertion tautologique remplacée par
    `LEVELS.slice(1).every(l => l.kind !== "tutorial")` (A3).
  - REJETÉ avec motif: C3 (préchargement des images) — avec le fix `key`, un bref blanc
    pendant le décodage d'un asset local minuscule est acceptable ; complexité non
    justifiée. C4 — réfuté (voir ci-dessus), garde défensive non requise aujourd'hui.
- verify (orchestrateur): `tsc` clean, `eslint` clean, `vitest` **180/180**, prettier
  clean. Zéro finding CONFIRMÉ bloquant/majeur restant → gate PASS, PR #34 mergeable.

---

### story-halo-alpha-composite-gate — INCIDENT + Gate 4 (Nico / Lead-Art)

- incident: The ADR-0011 render-side vehicle neon rim shipped in the play-test build as a
  **hard-edged solid neon plate — binary alpha, no falloff** (the runtime rim bake is
  binary-alpha, scaled out ~6%). On-screen it reads as a flat neon aplat around the vehicle,
  not a glow. Bertrand's play-test verdict: disappointing render.
- why the chain missed it — **NOT a taste failure, a chain failure.** The neon rim exists
  ONLY at render time (decoupled from the sprite, ADR-0011); the delivered PNGs are pure
  B&W. My asset gate correctly judged the source sprites as pure B&W with the rim "coming
  live in-game" (this log, final-decoupled-set verdict / follow-up 7). But NO gate —
  mechanical or human — ever saw the in-game COMPOSITE: the asset gate judges the source
  PNG, and the runtime rim was never part of any PNG. Runtime-composed visuals simply had
  no acceptance surface. A binary-alpha rim could ship because nobody, by design, looked at
  the composited result.
- fix (three parts, parallel lanes): (1) RENDER — distance-based alpha-falloff bake so the
  rim decreases from the sprite edge to zero at the outer margin (`src/render`, architect
  amends ADR-0011 — not my lane). (2) MECHANICAL — a gradient check added to the e2e
  delivery gate so a flat/binary-alpha glow trips automatically (`scripts/**` — not my lane).
  (3) PROCESS — my lane, done this session:
  - BIBLE (§2.1, loi du glow): added the measurable rule **« un halo est un dégradé, jamais
    un aplat »** — every glow/halo, baked or render-side, MUST carry an alpha falloff
    decreasing from the sprite edge to zero at the outer margin; alpha sampled edge→margin
    must be monotonically non-increasing and terminate at 0; a flat binary-alpha glow is an
    automatic FAIL.
  - GATE 4 (`lead-art.md`): new **in-game composite gate** — any change to a runtime-composed
    visual (rims, glows, additive/emissive effects, anything not fully in the delivered PNGs)
    needs my verdict on REAL in-game screenshots before merge; an asset-gate PASS explicitly
    does NOT cover runtime composition.
  - FLOW (`COLLABORATION.md`): `dev-r3f-render` delivers in-game screenshots with any visual
    change; `game-graphist`'s TECHNICAL pass inspects the composite at real in-game size; the
    orchestrator routes those screenshots to me. No screenshots = ungated = no merge.
- composite verdict on the new falloff-baked halo — **GATE 4, first real pass: PASS 3/3.**
  Read on real in-game composites (`screenshots/preview-vehicle-{truck,car,moto}.png` +
  `-closeup.png`), belliard/stalingrad/vitry. The incident condition (hard-edged binary-alpha
  aplat) is GONE on all three: the chamfer-distance quadratic falloff (margin 0.06×sprite
  height/side) now reads as a true halo — brightest at the sprite edge, monotonically fading
  outward to zero at the outer margin, no opaque step, no cut edge. « Un halo est un dégradé,
  jamais un aplat » (§2.1) is satisfied in the composite. Per vehicle:
  - **truck (belliard, orange #FF8C14): PASS.** Falloff present and monotonic; hue correct;
    rim thickness readable at game size. Weakest of the three on background contrast —
    orange-rim-on-orange-storefront (belliard's warm shop lights) is the hardest read of the
    set — but the vehicle sits against the darker shopfront band and the silhouette + glow
    still read clearly. Not a FAIL; noted as the family's low-contrast case to watch if
    belliard's palette ever warms further.
  - **car (stalingrad, cyan #28F0FF): PASS (composite).** Best-reading glow of the set —
    cyan against the cool dark-blue/red night street pops cleanly, falloff soft and correct,
    hue correct. NB: the car's long-wagon/estate silhouette-archetype FAIL is the SEPARATE,
    pre-existing asset-gate follow-up (final-decoupled-set verdict above) and is NOT reopened
    here — Gate 4 judges the runtime composite (the glow/falloff), not the source silhouette.
    The glow passes; the silhouette follow-up stands as previously logged.
  - **moto (vitry, magenta #FF3CDC): PASS.** Falloff present and monotonic, hue correct,
    reads strongly against vitry's cooler tower-block backdrop. Most prominent halo of the
    three because the sprite is the smallest (256 canvas) so a per-side 0.06×height margin
    is proportionally the most generous, and the top-box crate outline makes the wrap read
    large — this is within family (identical falloff law + margin ratio across the set), not
    a defect. If it ever reads as bloom rather than rim, tune the margin CONSTANT, not the
    law.
  - **family consistency (§2.2): PASS.** One treatment across all three — same quadratic
    chamfer falloff, same 0.06×height margin ratio, hue-per-assignment from the `neon` data
    field. The three read as one printing run with three accent inks. This is the loi du glow
    working as designed, now live and gradient.
  - PRECEDENT NOTE (this entry is the Gate 4 template): a runtime-composed visual is gated
    ONLY on composites Read here; Gate 4 verdicts the composition (falloff/hue/read), while
    silhouette/archetype/body defects remain the asset gate's jurisdiction and are not
    re-litigated or absolved by a Gate 4 PASS. No bible/agent rule fix forced — the falloff
    rule held on first contact with real screenshots. (Nico / Lead-Art — Gate 4, first pass)
- arch review (PR #32, `claude/halo-alpha-transparency-review-uez37y`, 0a0cad0..85d581b):
  **BOUNDARY + TECHNIQUE PASS.** Boundary law upheld: **zero `src/game/**`changes** (diff
empty), every`src/**`change confined to`src/render/**`. New `haloFalloff.ts`is pure and
DOM-free (no React/Three import);`vehicleNeon.ts`/`DeliveryVehicleSprite.tsx`hold no game
rules — they read`deliveryVehicle`phase/position/integrity from state and render, hue stays
render-side data and never enters`GameState`. **Stock materials only** (`MeshBasicMaterial`
  - `CanvasTexture` + `AdditiveBlending`); no `ShaderMaterial` / `onBeforeCompile` /
    `EffectComposer` / GLSL introduced → SwiftShader gate safe. **Scripts stay outside `src`**
    (no script imports from `src`; only `playwright` + node built-ins + lazy CI-only
    `@napi-rs/canvas`). **No new deps in `package.json`** (diff empty; `@napi-rs/canvas@1.0.2`
    installed CI-only via `--no-save`, same pin as gen-sprites / gen-vehicle-sprites — PnP
    lockfile untouched). Verified green here: `yarn typecheck` exit 0; `haloFalloff.test.ts`
    9/9. ADR-0011 amended (Amendment 2026-07-11: solid rim → chamfer-distance quadratic gradient;
    consequences updated for the frame-diff e2e gate + Gate 4 composite gate). No code changed by
    the architect. (Winston / Senior Architect)
