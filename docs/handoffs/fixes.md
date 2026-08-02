# Fix-lane log (rolling)

One line per fix-lane cycle (COLLABORATION.md §fix lane). Newest first.

```
- <date> · <branch/PR> · <owning lane> · <one-line what> · checks: tsc/vitest/lint [+verify] · review: code-review(high) CLEAR|findings→fixed
```

---

- 2026-07-30 · fix/delivery-boss-guard (PR #152) · dev-gameplay · authoring guard: a
  timed-finale boss can no longer orphan a delivery in flight (root cause: the `bossQte`
  branch of `tickGameState` early-returns before the delivery block and
  `shouldTriggerBossFinale` is blind to the delivery phase — panel PR #143 finding left
  open). `deliveryBossMarginIssue` in `validateLevel.ts` (ADR-0074 §3 shape, mirror of
  the hostage+boss guard), thrown by `createInitialState` with the real street half-width
  via a new optional `courierField` param · checks: tsc/vitest(1570)/lint · review:
  code-review(high) CLEAR (test-quality observation → covered in follow-up commit)

- 2026-07-20 · claude/missing-menus-ui-aa87gt (PR #116) · dev-gameplay+dev-r3f-render ·
  NAME_ENTRY live input ate internal spaces ("DJ MEHDI"→"DJMEHDI"): per-keystroke
  `sanitizeName` trims edges, so the just-typed space vanished. Added pure
  `sanitizeNameLive` (control-strip + ≤16 clamp, no trim; full trim stays at
  submit/save via `sanitizeName`), NameEntryScreen switched to it (+3 tests) ·
  checks: tsc/vitest(874)/lint · review: folded into the branch review panel
  (pre-merge gate on the full diff)

- 2026-07-20 · claude/rue-propos-pipelines-revision-r4g52z · dev-tooling-assets · fix a
  chroma-key defect on generated near-foreground sprites (Bertrand: two grey patches on
  `public/assets/nearfg/scooter.png`, under the body / between the wheels). Root cause:
  `keyAndDown`'s (`scripts/lib/gptimage.mjs`) edge-seeded flood fill only keys magenta
  CONNECTED to the canvas border, so a magenta pocket fully enclosed by opaque geometry
  (between wheels, under the floorboard) is never reached, then the luma-desaturation
  pass turns it into an opaque grey patch. Added an opt-in `globalKey` option to
  `keyAndDown`: after the flood fill but before desaturation, a global pass keys every
  remaining pixel within the flood fill's own colour-distance tolerance (`d2`/`tol2`,
  reused — no second tolerance) regardless of connectivity. Wired ON in
  `gen-nearfg-sprites.mjs` (this family is C1 strict-grey — no legit magenta can exist in
  the art); every other caller (`gen-gptimage-asset.mjs`, vehicles/couriers/hostages)
  defaults `globalKey: false`, unchanged behaviour. · checks: tsc clean, vitest 821/821
  (new: synthetic-PNG enclosed-magenta-pocket case in `gptimage.test.mjs` proving OPAQUE
  off / TRANSPARENT on; wiring test in `gen-nearfg-sprites.test.mjs` asserting
  `globalKey: true`), lint clean, `check-art-prompts.mjs --set nearForeground` PASSED (1
  pre-existing unrelated warning) · review: pending
- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred stage-6
  cleanups, not pre-merge blockers) · dev-gameplay + dev-r3f-render · appear-cadence
  constant (0.3s) hardcoded three times across `lootSystem.ts`/`stateMachine.ts` and a
  render-side consumer — fold into one shared constant. · owner: dev-gameplay +
  dev-r3f-render · checks: N/A (not yet actioned) · review: N/A

- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred) ·
  dev-gameplay · `WeaponSpec.kind` duplicates its own `WEAPON_SPECS` record key and is
  never read — trivial dead-field cleanup. · owner: dev-gameplay · checks: N/A (not yet
  actioned) · review: N/A

- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred) ·
  dev-gameplay · `createInitialState` inlines the base-weapon literal instead of calling
  the existing `baseWeaponState()` helper — DRY cleanup, may fold into the MAJEUR
  co-location fix PR. · owner: dev-gameplay · checks: N/A (not yet actioned) · review: N/A

- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred) ·
  dev-r3f-render · `LootCrate` ignores `paused` during its `APPEARING` unfold (unlike
  `CourierSprite`, which takes a `paused` prop) — crate keeps animating while the game is
  paused. · owner: dev-r3f-render · checks: N/A (not yet actioned) · review: N/A

- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred) ·
  dev-r3f-render · `.infinity` in `WeaponReadout.module.css` is byte-identical to
  `.glyph` — should `composes: glyph` instead of duplicating the rule. · owner:
  dev-r3f-render · checks: N/A (not yet actioned) · review: N/A

- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred — MINEUR-4
  from the stage-6 panel) · dev-gameplay · `weaponSystem.ts` dispatches firing mode on
  literal-string comparisons (`active === "auto"/"spread"`) instead of `WEAPON_SPECS`
  fields — no bug today (closed 3-kind union), but the D/tromblon fast-follow story
  should make dispatch data-driven (`burstRounds > 0`); log against that story, do not
  action now (YAGNI). · owner: dev-gameplay · checks: N/A (not yet actioned) · review: N/A

- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred — MINEUR-5
  from the stage-6 panel) · dev-gameplay · `TriggerResult.energyDelta` is a dead API
  surface: summed in `weaponSystem.ts` but never consumed (`stateMachine.ts` sets
  `newEnergy = state.energy` unconditionally — energy is boss-QTE-only, ADR-0051 D2).
  Harmless; remove opportunistically (churns `weaponSystem`/`bulletSystem` return types +
  tests, low priority). · owner: dev-gameplay · checks: N/A (not yet actioned) · review: N/A

- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (weapons pickup, deferred) ·
  dev-tooling-assets · vitest's resolver alias map is missing `@render` (only `@game`/
  `@hooks` are configured) — the stage-4 `hud/derivations.ts` leaf-import workaround
  (`../print/tokens` instead of the `@render/ui/print` barrel) is spreading to route
  around this gap. Add `@render` to the vitest alias config so the deep-import pattern
  stops propagating. · owner: dev-tooling-assets · checks: N/A (not yet actioned) ·
  review: N/A

- 2026-07-19 · claude/beliard-enemy-positioning-tool-6wo3vu · dev-tooling-assets ·
  Belliard cops badly seated (feet not on the sill, some drifted off the window bay,
  some in front of the wrought-iron grille). New sibling harness
  `scripts/align-troncon.mjs` (imports `align-windows.mjs`'s `detectOpenings`/
  `LEVEL_CFG`/`writeOverlay`/`measure`; adds an edge-density detector for the
  tronçon PNGs' ink/wash art via a new additive `LEVEL_CFG.buildMask` hook, plus a
  namespaced-id PNG decode path, `measure()`'s `panels` param and `writeOverlay`'s
  `panel` param — all backward-compatible, zero behaviour change for
  belliard/stalingrad/vitry). Corrects height/vertical seating (calibrated
  FILL/render-contract mapping, iterate-to-convergence) ONLY for zones flagged by a
  baseline measurement of the committed data — horizontal drift is snap-corrected
  only when detection is confident, else left as a non-gating audit finding.
  Post-push regression (caught by Bertrand: "les barrières ne sont pas bien
  positionnés sur le bâtiment bleu") — an earlier version of the FIX step rewrote
  EVERY zone's h/y unconditionally, drifting already-correct zones (troncon-a: 0
  baseline defects, still 31/31 rewritten) off their hand-placed position and
  visibly mis-registering the grille overlay drawn from the same data; root-caused
  and fixed by gating the rewrite on the baseline measurement. Corrected outcome:
  32/114 zones actually needed correction (troncon-a 10/31, troncon-b 12/33,
  troncon-c 10/50), converges to 0 OVERFLOW in 4 iterations, the other 82 zones now
  byte-identical to the original hand-placed art, confirmed idempotent. Separate
  follow-up (Bertrand, with a screenshot of the exact spot): `troncon-b` zones 0/1
  are two real windows only ~0.003 apart with a narrow stone mullion between them —
  their committed x-positions were accurate, but the haussmann rail-drawing
  geometry's fixed 10% width overshoot on each side consumed the whole gap,
  rendering as one merged bar. Horizontal drift is intentionally audit-only per
  point 4 above (never auto-corrected), so this pre-existing defect was never
  touched by any `--fix` run; hand-corrected these two zones' `w` only (0.0484→
  0.0426, 0.0558→0.0500, verified against the raw art and the rail-extent formula
  so a ~0.004 gap reopens) — `x`/`y`/`h` untouched, 0 OVERFLOW maintained, visually
  confirmed in a fresh render. Data-only:
  `src/game/levels/windowZones.generated.json`'s three `belliard/troncon-{a,b,c}`
  keys. ADR-0028 addendum (cross-linked from ADR-0048); `HARNESS.md`/`SCRIPTS.md`/
  `package.json` (`align:troncon[:check]`) updated. · checks: tsc clean, vitest
  771/771, lint clean on touched files (6 pre-existing unrelated errors elsewhere,
  confirmed present without this diff too) +verify (before/after in-game
  screenshots, `--check`↔`--fix` round-trip byte-identical) · review: pending

- 2026-07-19 · claude/mobile-game-zoom-start-pbaf4j · dev-r3f-render · mobile levels
  opened pinched all the way to the base zoom (ADR-0026's `MAX_ZOOM_FRACTION = 1`,
  1.7×, tuned for finger-sized targets), leaving no headroom to read the wider street
  without a manual pinch-out. Add `DEFAULT_ZOOM_FRACTION = 0.7` as the committed
  pinch fraction's starting value (`useTouchControls`), so a level opens showing more
  of the facade; a pinch-in still reaches the full 1.7× tightness. Bounds
  (`MIN_ZOOM_FRACTION`/`MAX_ZOOM_FRACTION`) and the pinch math are unchanged. ·
  checks: tsc/vitest(771)/lint/format green · review: code-review(high) CLEAR

- 2026-07-19 · claude/hostage-scene-bike-visibility-wekl3y · dev-r3f-render · the hostage
  QTE freezes couriers/the delivery vehicle in place (stateMachine early-returns while it
  holds the scene) instead of moving them off-stage, so a courier's bike or the delivery
  vehicle could freeze right next to the QTE anchor and dominate the zoomed-in captor/
  hostage frame (repro'd headless: courier froze 2.2 world units from the anchor,
  screenshot showed the bike squatting beside the tableau). Hide both sprites while
  `isQteActive`, same guard already used for camera edge-scroll and the QTE tableau
  itself; also gate the courier's flipbook clock on `qteActive` (mirrors the existing
  `paused` guard) so its pose doesn't pop to a new frame on reappear. · checks:
  tsc/vitest(771)/lint green + verify (headless-browser before/after screenshots via
  seedPlay + `__MUF_STATE__` polling, confirming the bug and the fix) · review:
  code-review(high) — 1 CONFIRMED fixed (flipbook clock kept advancing while hidden,
  contradicting the "resumes exactly where it froze" claim), 1 noted (no existing test
  file for either R3F sprite component — matches project convention, not a regression)

- 2026-07-19 · claude/ui-adjustments-cyclist-animation-wfpm52 · dev-r3f-render · four
  Bertrand tuning calls in one lane: (1) window enemies 0.8×→1.3× window height
  (shared `ENEMY_PLANE_SCALE`/`ENEMY_BODY_LIFT` consts, feet kept at the sill; the
  align-windows plane-box gate re-modelled to FEET SEATING since the plane now
  overshoots the opening by design, goldens regenerated + diff ceiling recalibrated
  5%→12% for the 2.6× silhouettes); (2) off-screen edge arrows ×0.75 (102px desktop
  / 51px short-landscape); (3) `TUBE CATHODIQUE` OUI/NON ballot row in the OURS
  colophon wired to the existing `Prefs.crt`; (4) courier flipbook rebuilt via
  retouch-courier-spokes.mjs — the shipped frames were six DIFFERENT raw FLUX
  generations strobing at 48 fps; all six now derive from the frame-1 base with
  only the spokes rotating. · checks: tsc/vitest(684)/lint green + verify
  (Playwright screenshots: options row, CRT on/off, in-game arrows, stable
  cyclist) · review: code-review(high) 8 findings → 6 fixed (harness gate+docs,
  golden ceiling, fallback-branch slip, stale comments), 1 refuted (frames
  "identical" — a Pillow getbbox alpha-only artefact; md5/numpy prove the spoke
  rotation), 1 accepted-risk (stacked-window quad overlap: draw order is stable,
  opaque pixels rarely reach the plane top)

- 2026-07-19 · claude/tapecorner-static-fill · dev-r3f-render · fold TapeCorner's static
  masking-tape fill `rgba(236,231,218,0.72)` from inline into the co-located `.tape` class,
  closing the one static-inline consistency gap the #104 stage-6 panel (bmad) flagged vs the
  PaperSheet precedent; inline `style` now carries only the prop-driven CORNER_STYLE offset/
  rotation. Pixel-identical (same rgba, no cascade competitor). · checks: tsc/vitest(637)/lint/
  format green · review: code-review(high) CLEAR

- 2026-07-18 · claude/screen-edge-arrows-size-jlnmix · dev-r3f-render · enlarge the
  off-screen target edge arrows ×4 (Bertrand: too small, then "double again") — svg
  glyph 34→68→136 desktop, 68 on short-landscape phones (ADR-0024
  SHORT_LANDSCAPE_MEDIA scoped-style + var() fallbacks, CSS-owned size: .arrowCore
  136px/68px, svg width/height 100%, .arrowWrap 160px/80px); keyline held at 2px at
  every size via vector-effect non-scaling-stroke; golden baselines regenerated
  twice (ADR-0005 flow, eyeballed desktop + coarse-pointer 800×360 capture);
  anchors unchanged (tips keep hugging the edges, verified); arrow ring hidden for
  the whole hostage-QTE set-piece (shared isQteSetPieceVisible predicate, back when
  the verdict clears — Bertrand); post-rebase golden re-gen (main's new enemy art +
  the big arrows) · checks:
  tsc/vitest(637)/lint · review: code-review(high, 8-angle) — 2 CONFIRMED fixed
  (up-arrow overprinted the LIVRAISON banner track → indicator now renders BEFORE
  the banner so delivery readout paints on top; size literal triplicated across
  tsx+css → svg 100%), 1 PLAUSIBLE fixed on Bertrand's call (keyline kept at the 2px
  ink-rule weight: strokeWidth 2→1 viewBox units under the ×2 scale), 4 REFUTED
  (scale-1.12 clipping, short-landscape collision, repaint cost, fill swallowed
  at tip)

- 2026-07-18 · claude/preview-deletion-after-merge-dt20co (PR #101) · dev-tooling-assets ·
  add `cleanup-preview.yml`: remove `preview/<slug>/` from gh-pages on branch delete /
  PR merge (+ manual dispatch for orphaned previews) by publishing an EMPTY dir through
  the existing gh-pages-publish clean-replace (same rebase-retry loop; delete semantic
  now stated in the action's publish_dir contract); shares the branch's deploy-preview
  concurrency group; ci.md + ADR-0001 amendment · checks: prettier/tsc/vitest/lint ·
  review: code-review(high, 8-angle) — 2 CONFIRMED fixed (workflow_dispatch fallback
  never reached inputs.branch — event.ref is truthy on dispatch; newline in dispatch
  input line-injects GITHUB_OUTPUT past the empty-slug guard → could wipe preview/),
  4 hardened (fork-PR + stacked-PR guards, '.'/'..' slug reject, wrong "inert until
  merged" comment, sparse checkout), rest accepted as documented limitations (slug
  collision = same as deploy; merged-PR double-fire = cheap serialized no-op)

- 2026-07-18 · claude/render-css-design-system (42ff2c7) · dev-r3f-render · in-game HUD
  legibility (labels 9→11 / niveau 12→16px; strip → IBM Plex Mono, labels 400 / readouts
  600; stamps keep Rubik) · VERDICT: PASS — art-direction HUD gate (lead-art/Nico), on the
  real before/after strips. Plex Mono accepted as the in-game instrument face (HUD is the
  game-world layer, not a §2bis print surface; bible was silent — rule proposed below).
  Recommendation on the open readout-face question: KEEP readouts on Plex 600, do NOT
  revert to Rubik — Rubik Mono One stays reserved for stamps/headlines (OTAGE/LIVRAISON/
  phase chips), which preserves its punch. Sizes/weights PASS as shipped. Not a Gate-4
  composite matter: no runtime-composed glow/rim changed, judged on the delivered strips.
  Proposed bible addition (§2bis-adjacent): "In-game HUD strip = IBM Plex Mono instrument
  face; Rubik Mono One and Courier Prime stay reserved for print surfaces and set-piece
  stamps." · checks: N/A to art gate (dev lane ran tsc/vitest/lint) · review: advisory to
  Bertrand's eye on the readout face

- 2026-07-18 · claude/rtk-graph-savings-report-2a6t8o · dev-tooling-assets · capture the
  last two tooling-savings postes: (1) CLAUDE.md working rule steering code navigation to
  codegraph-first (callers/impact/search) before grep/Read dumps files; (2) install
  resilience — a `retry` helper (3 attempts, doubling backoff) around the network-flaky
  cargo/npm installs in both session-start.sh and setup-tooling.sh, so a transient proxy
  403 no longer leaves rtk/codegraph missing for the whole session. (True cross-session
  binary caching needs a persistent volume — out of repo scope; retry is the honest fix.)
  · checks: `bash -n` clean on both scripts, retry helper unit-tested (success + fail
  paths) · review: code-review(high) — 2 findings, 1 fixed (updatedInput preserves original Bash fields), 1 accepted (retry worst-case latency, low-risk)

- 2026-07-18 · claude/rtk-graph-savings-report-2a6t8o · dev-tooling-assets · add
  `scripts/setup-tooling.sh`: one-command, idempotent local (by-hand) provisioning of
  rtk + codegraph, mirroring the SessionStart hook's install/index logic (which is
  remote-only). Pins cross-referenced in both files to prevent drift; CLAUDE.md tooling
  section points to it. Standalone by design — session-start.sh behaviour untouched.
  · checks: `bash -n` clean; logic mirrors the proven hook (installs not run locally) ·
  review: pending

- 2026-07-18 · claude/rtk-graph-savings-report-2a6t8o · dev-tooling-assets · add the
  PreToolUse(Bash) hook CLAUDE.md already promises: `rewrite-rtk.sh` transparently
  rewrites the exact raw fallbacks (`yarn test`→`rtk vitest`, `yarn typecheck`→`rtk tsc`,
  `yarn lint`→`rtk lint`, `npm test`→`rtk vitest`) to their token-compressed rtk forms,
  guarded by `command -v rtk` (rtk absent ⇒ passthrough, fallback preserved) and
  exact-match-only (never `test:coverage`/`lint:fix`/flagged/chained). Config-only, no
  src touched. · checks: hook behavioural suite 12/12 (rewrite + passthrough), settings.json
  structure verified; tsc/vitest/lint N/A (no TS/source changed) · review: code-review(high) — 2 findings, 1 fixed (updatedInput preserves original Bash fields), 1 accepted (retry worst-case latency, low-risk)

- 2026-07-17 — story-crew-extension log closure: append Winston's §6g integration
  re-triage (PASS — written moments after Bertrand's merge, hence this follow-up),
  flip the story index row to closed. Docs-only, one shard + index. (orchestrator →
  single code-review waived by fix-lane tier: log-only diff; Marion may challenge.)

- 2026-07-18 · claude/fix-gh-pages-deploy-race · dev-tooling-assets · replace the
  plain-push peaceiris gh-pages publishes (deploy-preview.yml + deploy.yml) with a
  shared rebase-retry composite action (.github/actions/gh-pages-publish): re-clone
  per attempt, subtree clean-replace / root overlay (previews preserved, .nojekyll
  re-created), backoff+jitter on rejection — ends the cross-branch
  '! [rejected] (fetch first)' deploy races (runs 475/476/480). ADR-0001 amended
  (deployment mechanism + dependency removal). · checks: YAML+bash -n, empirical
  git harness (subtree isolation, root overlay, orphan init, simulated mid-publish
  race, shallow push, ls-remote rc 0/2/128, dest-guard cases); tsc/vitest N/A (no
  src) · review: code-review(high) — 1 MAJEUR + 4 MINEUR + 4 NIT, ALL fixed
  (ls-remote branch-existence gate + retryable clones, stderr surfaced on final
  failure, .nojekyll parity, ADR-0001 amendment, ci.md + workflow comment refresh,
  dest guard hardened vs ./.git, no post-final-attempt sleep, max_attempts
  validated)
- 2026-07-20 · docs · CLAUDE.md slug rule said per-CHARACTER but deploy-preview.yml sanitizes per-BYTE (`tr -c`): UTF-8 é → `--`; CLAUDE.md wording fixed in-branch, decide later whether the workflow should sanitize per-character instead (dev-tooling-assets)
- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (post-merge follow-up) · tech-writer/orchestrator · stale H1 numbers in renumbered ADR-0055/0056 files (still said 0052/0053; QA finding during the aborted verify) · checks: gen-adr-index green · review: micro-edit fix lane
- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (PR #120) · dev-r3f-render · soften LOOT crate green rim (pulse 0.4±0.12, blink peak 0.72, 2 blur passes) — Bertrand playtest feedback · checks: tsc/vitest(984)/lint + runtime screenshot · review: pending PR #120 review
- 2026-07-20 · claude/features-a-implémenter-ehw9q4 (PR #120) · dev-r3f-render · weapon pictogram in the HUD arme cell (code-drawn SVG per WeaponKind, ink/currentColor, GestureIcon doctrine) — Bertrand feedback; ∞/stock display already shipped · checks: tsc/vitest(984)/lint + runtime screenshot · review: pending PR #120 review
- 2026-07-21 · style(docs) `0afca3b` — prettier-format des 5 docs de la story belliard single-wide (CI format:check rouge → vert) · lane: tech-writer/tooling · CI run 29863605472 vert
- 2026-07-21 · claude/belliard-decor-v3-clean · dev-r3f-render · near-foreground props flottaient (le rendu ancre le bas de la TEXTURE au trottoir, pas le bas du dessin ; chaque PNG généré a du vide sous les pieds) → `footPadFrac` par-kind mesuré sur les PNG committés (banc 0.305, scooter 0.201, fontaine/bollard 0.170, panneau 0.162, lampadaire 0.072, horodateur 0.057, feu 0.029), plan descendu de footPad×planeH — Bertrand feedback « scooter/fontaine trop haut » · checks: tsc/vitest(148 render+levels)/lint · review: skip demandé par Bertrand (branche déjà MERGE-gatée `2d51d62`)
- 2026-07-25 · bczy-cuddly-succotash · docs/orientation (Copilot CLI session) · les agents spécialisés n'étaient jamais délégués sous Copilot : `.github/copilot-instructions.md` interdisait `.claude/agents/**` (règle écrite pour le Coding Agent, sans `Task`) alors que le Copilot CLI/app charge bien la crew et les skills → overlay scindé par runtime (tableau d'identification + auto-test, politique d'orchestration + table de routage lane pour le CLI, boucle solo inchangée pour le Coding Agent), AGENTS.md/docs/index.md alignés, ADR-0064 rédigé · checks: `gen-adr-index --check` vert + prettier (docs-only, zéro fichier source) · review: panel CI sur la PR
- 2026-07-25 · bczy-cache-lint-prettier-tests · dev-tooling-assets · caches lint/format/test sous `node_modules/.cache` : `--cache --cache-location … --cache-strategy content` sur eslint (`lint`/`lint:fix`), `--cache` sur prettier (`format`/`format:check`), `cacheDir` Vitest ; cache CI en une seule entrée `node_modules/.cache`, sans fallback per-OS large (le cache ESLint ne mémorise pas la config qui a produit le résultat : un restore à travers un changement de config déclarerait propre un fichier violant une règle nouvellement ajoutée ; coût assumé, Prettier+Vitest repartent froids eux aussi quand une config bouge). lint-staged laissé sans `--cache` (liste de fichiers explicite ⇒ cache partiel). Gains locaux : lint 7,30 s → 1,25 s, format:check 8,63 s → 2,70 s, test inchangé (Vitest 3 ne cache pas les résultats) · checks: tsc/vitest(1052)/lint/format:check verts + vérif anti-masquage (violation `no-explicit-any` + violation de format, sur fichier neuf ET sur fichier déjà caché propre : détectées dans les deux cas) · review: panel CI sur la PR
- 2026-07-25 · bczy-claude-courier-between-prop-rows · dev-r3f-render · le cycliste (courier) était dessiné devant tout le décor de rue (renderOrder 6, z 0.701) alors que Bertrand le veut EN PROFONDEUR entre les deux rangées de props → nouvelle table de profondeur partagée `src/render/scene/streetDepth.ts` (farRow 4/0.60 → facadeOverlay 5/0.50 → courier 5.5/0.65 → nearRow 5.75/0.70 → vehicleRim 6/0.71 → vehicle 7/0.72), `ForegroundFrames`/`WindowGrilles` câblés sur la table (littéraux 5/0.5 supprimés), commentaires périmés alignés (EnemySprite, HostageQteSprite, DeliveryVehicleSprite, ImpactEffects, docs/render-layer.md). Renverse le finding #8 d'ADR-0047 pour la SEULE rangée NEAR (amendement daté dans l'ADR) ; la rangée FAR et les ferronneries de façade ne masquent jamais le courier. Signalé hors périmètre : farRow (4) reste sous les ferronneries (5) — pré-existant sur main, décor uniquement, arbitrage Bertrand/senior-architect · checks: tsc/vitest(1060, dont 8 nouveaux tests de profondeur validés par mutation)/lint verts · review: code-review(high) — 1 MAJEUR (courier passé sous les ferronneries de façade en 4.5 : dalle CONCRETE de vitry en travers du torse/tête) + 2 MINEUR (tests non-mordants, commentaires périmés), tous corrigés
- 2026-07-25 · bczy-claude-courier-between-prop-rows · dev-r3f-render · suite directe : Bertrand « le cycliste devrait être aussi devant le camion, là il passe derrière » → le camion de livraison descend sous le courier dans `STREET_DEPTH` (farRow 4/0.60 → facadeOverlay 5/0.50 → vehicleRim 5.2/0.61 → vehicle 5.25/0.62 → courier 5.5/0.65 → nearRow 5.75/0.70), `DeliveryVehicleSprite` câblé sur la table (littéraux `renderOrder={6}`/`{7}` et `VEHICLE_Z = 0.72` supprimés, z du rim lu depuis `vehicleRim.z` — même écart relatif : un slot sous le corps, z − 0.01). Conséquence assumée et documentée : `vehicle < courier < nearRow` implique que la rangée NEAR masque désormais partiellement les DEUX cibles « Livrer » (vélo ET camion) ; le camion reste devant la rangée FAR et devant les ferronneries de façade (acteur de rue, pas élément de façade). Tout le stack rue tient maintenant entre 5 et 6 : QTE otage (6..8), FX d'impact (7.9/8/8.1) et viseur inchangés. Commentaires alignés (NearForeground, CourierSprite, DeliveryVehicleSprite, EnemySprite, HostageQteSprite, ImpactEffects, docs/render-layer.md), amendement daté d'ADR-0047 étendu (table finale à deux colonnes d'occlusion) + note datée dans ADR-0011 (le rim neon garde sa géométrie relative, seuls les slots absolus bougent) · checks: typecheck/test(1062, 10 tests de profondeur)/lint/format:check verts · tests validés par 6 mutations (camion remis devant en order+z → 5 rouges ; z seul remis devant → 3 rouges ; courier devant la rangée near → 3 rouges ; rim décollé de son corps → 2 rouges ; littéraux 6/7 réintroduits dans le composant → 1 rouge ; z du rim recalculé en local → 1 rouge) · review: pending
- 2026-07-25 · bczy-claude-courier-between-prop-rows · dev-tooling-assets · Bertrand « on ne voit plus le panneau Paris », puis après revue en jeu « il y a trois panneaux paris maintenant, ne garde qu'un seul panneau, celui de droite » → cause établie à l'écran (probe Playwright, screenshots/probe/) : le filtre de densité mobile de `NearForeground.tsx` (`.filter((_, i) => i % 2 === 0)` sur l'ORDRE DE LISTE de la rangée, aveugle au kind) supprimait le `streetSign` UNIQUE de belliard (index near 3, impair) ⇒ ZÉRO panneau PARIS sur UA mobile ; secondairement, depuis le repositionnement ADR-0057 (commit `5bbbbe5`) toute la moitié droite de la rue n'avait plus de panneau ⇒ pan droit complet sans PARIS. Aucune occlusion (feu 0.388 et lampadaire 0.495 effleurent la plaque sans la couvrir, vérifié en capture). État FINAL après l'arbitrage de Bertrand, correctif DATA seul (`levelArt.json`) : belliard garde UN SEUL `streetSign`, x=0.885 (les ajouts intermédiaires 0.66 et l'historique 0.46 supprimés, prop count revenu à 13), listé AVANT le lampadaire x=0.8 — x volontairement désordonné là et là seulement — pour prendre l'index near 6, PAIR, donc dessiné sur mobile ; en ordre x il retomberait sur l'index 7 (impair) et disparaîtrait, soit le bug d'origine réintroduit. Le lampadaire 0.495 est remis en ordre x pur (son swap ne servait qu'à donner un index pair au panneau 0.46, désormais supprimé). Rangée near dessinée : desktop x=[0.16,0.34,0.388,0.495,0.6,0.72,0.885,0.8], mobile x=[0.16,0.388,0.6,0.885] ; dégagement du panneau 0.085 (voisin 0.8) en desktop, 0.285 en mobile, ≥0.06 dans les deux cas. Même bug latent corrigé sur stalingrad et INCHANGÉ par cet arbitrage (panneau 0.38 listé avant l'horodateur 0.27, ses 2 panneaux restent). Ordre de liste LOAD-BEARING, documenté dans les deux `$comment` et épinglé par `src/game/levels/__tests__/nearForegroundDensity.test.ts` (survie au filtre mobile + dégagement ≥0.06 sur la rangée RÉELLEMENT dessinée + couverture moitié droite désormais exigée DESSINÉE dans les deux modes, plus seulement déclarée) · renvoyé à dev-r3f-render (hors périmètre, non édité) : (a) le filtre de parité est aveugle au kind — une règle « ne jamais supprimer la dernière instance d'un kind » le rendrait robuste par construction, (b) sur mobile la rangée near est quasi hors-cadre en bas au repos : le panneau ne se lit qu'après un swipe · checks: typecheck/test(1081)/format:check verts, check-art-prompts + check-nearfg-style verts ; `yarn lint` et `yarn format:check` globaux échouent UNIQUEMENT sur des fichiers non suivis d'une autre lane en cours (`src/render/scene/__tests__/nearForegroundSizing.test.ts`, `scripts/tmp-lamppost-measure.ts`) — mes fichiers passent eslint/prettier · mutation : panneau remis en ordre x (index impair) ⇒ 3 tests rouges (parité, dégagement, couverture droite) · captures: screenshots/probe/trim-{desktop-rest,desktop-pan-right,mobile-rest,mobile-pan-right}.png (artefacts jetables non suivis, non commités) · review: pending
- 2026-07-25 · bczy-claude-courier-between-prop-rows · dev-r3f-render · Bertrand (capture en jeu) « essaie de réhausser ce lampadaire, il devrait être plus haut » : la lanterne du réverbère haussmannien arrivait au niveau de la CABINE du camion (lanterne −3.93…−5.18, toit du camion −3.30). Cause mesurée : c'est `believableCap = MAX_PROP_WORLD_H × rowScale` (4.5 × 1.3 = 5.85 u) qui mordait, PAS la bande de non-occlusion (`maxH` 8.26 desktop / 7.66 mobile sur belliard), alors que la spec demande 0.62 × facadeH × 1.3 ≈ 9.67 u → tout le sprite rétrécissait, mât et lanterne. Correctif sans dérogation : plafond PAR KIND (`KIND_MAX_WORLD_H = { lamppost: 7.0 }`, défaut 4.5 inchangé pour les 12 autres props — hauteurs vérifiées identiques kind par kind) + fonction pure `nearPropPlaneHeight()` qui plafonne le SOMMET VISIBLE (`bandCap = bandMaxH / (1 − footPadFrac)`) au lieu de la boîte brute, l'ancien clamp jetant ~0.6 u de mou. Résultat : planeH 5.85 → 8.90 (belliard desktop), bas de lanterne −3.07 soit au-dessus du toit du camion, marge sous la première rangée de flics 0.97 u desktop / 1.56 u mobile sur belliard ET stalingrad ; le prop reste ancré au trottoir (footPadFrac inchangé), la dérogation `trafficLight` intacte · checks: tsc/vitest(1081, dont 13 nouveaux tests de dimensionnement validés par 3 mutations : ancien plafond global → 7 rouges, ancien clamp sans foot-pad → 5 rouges, bande desserrée ×1.3 → 5 rouges dont les 4 de non-occlusion)/lint/format:check verts + captures avant/après en jeu (probes jetables supprimées) · review: panel CI sur la PR #136. Arbitrage laissé à Bertrand : desktop, le BAS de la lanterne ne dépasse le toit du camion que de ~0.2 u (le haut de ~2.1 u) — c'est le maximum atteignable sans entamer la marge de 0.8 u sous les fenêtres.
- 2026-07-26 · claude/street-graphics-effects-q8p59k (PR #142, delta panel C7 findings D1/D3/D4) · dev-r3f-render · trois corrections cosmétiques signalées par le triage `senior-architect` sur le delta `1fc6c7c...HEAD` : (D1) commentaire de `TitleScreen.tsx` se contredisait lui-même — décrivait un masque halftone sur le conteneur du nuage `.smoke` alors que ce masque (le bug du "carré" vu par Bertrand) avait été supprimé en `9517c48`, réécrit pour dire que le conteneur ne fait que positionner et que le grain vit sur chaque puff ; (D3) commentaire de test disait "six lignes" pour une passe de peinture alors que `TITLE_PAINT_LINES = 4` ; (D4) le rétro-lien de commentaire entre `SMOKE_INK` (tokens.ts) et `SMOKE_TINT` (smokeParticles.ts) n'existait que d'un côté, casse divergente (`#9a9a9a` vs `#9A9A9A`) — commentaire ajouté côté scène, casse unifiée · checks: tsc/vitest(307 render+scene)/lint/prettier verts · review: fix-lane, zéro changement de comportement
- 2026-07-26 · claude/street-graphics-effects-q8p59k (PR #142) · dev-r3f-render · Bertrand « sur mobile on voit pas le lampadaire » → même classe de bug que le panneau Paris (2026-07-25, ci-dessus), jamais corrigée pour le lampadaire : le filtre de densité mobile de `NearForeground.tsx` (`.filter((_, i) => i % 2 === 0)` sur l'ordre de liste de la rangée near, aveugle au kind) tombait sur les DEUX instances de lampadaire des deux niveaux — belliard (x=0.495 index near 3, x=0.8 index near 7) et stalingrad (x=0.16 index near 3, x=0.6 index near 7) — toutes impaires, donc AUCUN lampadaire dessiné sur mobile UA, sur aucun des deux niveaux. Correctif DATA seul (`levelArt.json`), mirroir exact du fix streetSign : un lampadaire par niveau déplacé sur un index pair par simple permutation de deux entrées adjacentes (aucune position `x` modifiée) — belliard : lampadaire x=0.495 listé avant le banc x=0.6 (le banc x=0.16 restant visible sur mobile) ; stalingrad : lampadaire x=0.16 listé avant le feu tricolore x=0.05 (2 des 3 feux du niveau restent visibles sur mobile). Zéro impact sur les teintes acid néon (le lampadaire garde toujours la teinte chaude `LAMP_WARM` quel que soit son index ; banc et feu tricolore ne sont pas des émetteurs). L'autre instance de lampadaire par niveau reste sur index impair (disparaît sur mobile, comme pour le panneau — un seul suffit). `$comment` des deux blocs `nearForeground` mis à jour ; `nearForegroundDensity.test.ts` étendu avec le mirroir exact des assertions streetSign (survie mobile + dégagement ≥0.06) appliquées au lampadaire · checks: tsc/vitest(1244, dont 4 nouveaux tests de survie mobile du lampadaire)/lint/format:check verts · review: fix-lane
- 2026-08-01 · docs/cap3-concurrency-scope · dev-tooling-assets · MINEUR livré avec le verdict PASS du panel sur la PR #153 (arrivé après merge) : le concurrency group de `gen-plan-backdrop.yml` (plan SP2 T3, point 1) était scopé au `level_id` seul alors que le cap-3 est par level/PR — deux branches dispatchant le même level partageaient un slot d'exécution sans partager de budget, une tentative légitime pouvait attendre derrière le run d'une autre branche. Groupe re-scopé `gen-plan-backdrop-<level_id>-${{ github.ref }}` (forme pleine imposée : `head_ref` est vide en workflow_dispatch, `ref_name` collisionne branche/tag), cohérent avec la lecture du compteur sur `origin/main..HEAD` (les runs d'une même ref restent strictement sérialisés — la protection anti-race du point 2 est intacte) · checks: docs-only, hook pre-commit vert · review: pending (panel CI de la PR #157 — le check `panel-verdict` fait autorité).
- 2026-08-02 · claude/focused-wozniak-lomy3e · dev-tooling-assets · couverture tsc/eslint de `scripts/` câblée (constat senior-architect, tech plan figma-tokens-pipeline) : ignore eslint `scripts/**` retiré — bloc `scripts/**/*.mjs` (globals Node, type-aware off faute de projet tsconfig, `explicit-module-boundary-types` off car insatisfiable en JS pur) + bloc `scripts/**/*.ts` type-aware sur `tsconfig.node.json` ; `yarn typecheck` enchaîne désormais `tsconfig.json` puis `tsconfig.node.json` (le second réutilisé, plus orphelin) ; lint-staged étendu à `*.mjs` ; `@types/node@^24` en devDep explicite (avant : transitif v26 via happy-dom — critère fix-lane « zéro dépendance » entamé par cette devDep types-only, assumé : le typecheck Node la requiert) ; les 35 violations surfacées corrigées (generate-assets.ts : réponse Gemini typée, 2 blocs morts Vertex AI supprimés ; 9 one-liners .mjs : identifiants morts `_`-préfixés, 2 boucles CRC en for-of, rest-omit `_id`, import `fluxUrl` retiré du template) ; `vitest.config.ts` inchangé (`scripts/**/*.test.mjs` déjà inclus, cohérent) · checks: typecheck (2 projets)/vitest(1663)/`eslint . --no-cache`/format:check verts · review: code-review(high) — 1 MINEUR latent (lint-staged `*.mjs` est repo-wide mais seuls les .mjs de `scripts/` sont couverts par un bloc eslint : un .mjs stagé ailleurs échouerait au parse projectService ; zéro fichier concerné aujourd'hui, prouvé par probe) → traité par commentaire garde-fou dans eslint.config.ts ; tout le reste PASS adversarial (rest-omit `_id` et CRC for-of prouvés équivalents par exécution, blocs Vertex AI vérifiés morts, `--print-config` confirme le merge parserOptions sans fuite, couverture validée par mutation — 104 fichiers lintés, re-run typecheck/eslint/vitest scripts (239) exit 0)
- 2026-08-02 · claude/focused-wozniak-lomy3e (PR #161) · dev-tooling-assets · suite directe : panel CI FAIL sur `9c30a60` (1 BLOQUANT + 2 MINEUR), les trois findings traités dans la PR : (BLOQUANT, bmad-review) dépendance ajoutée sans ADR alors que le tier course-express l'admettait — voie « écrire l'ADR dans la même PR » retenue → **ADR-0077** (couverture tsc/eslint de scripts/, devDep `@types/node@^24` explicite, double résolution v24 directe/v26 transitive acceptée et bornée), index régénéré via gen-adr-index ; (MINEUR, code-review) helper mort `_rich` de gen-adr-index.mjs supprimé au lieu d'être `_`-préfixé (dupliquait le `rich` client-side inliné dans le HTML émis — indépendance prouvée par grep en review) ; (MINEUR, security-review) `yarn npm audit --recursive` exécuté et tracé : ZÉRO advisory sur `@types/node` 24.13.3/26.1.1 et `undici-types` 7.18.2/8.3.0 ; les 7 advisories remontées (brace-expansion ×3 high, playwright high, glob/tar/git-raw-commits moderate) sont toutes pré-existantes sur main, hors périmètre du diff · checks: gen-adr-index --check « fresh — 77 ADR » · review: re-run du panel CI sur le push suivant — `panel-verdict` fait autorité
- 2026-08-02 · claude/focused-wozniak-lomy3e (PR #161) · dev-tooling-assets · 2e round de panel (DEGRADED sur le head intermédiaire `39f4150`, job code-review non terminé — re-run attendu sur le head courant) : (BLOQUANT, répétition du round 1 sur un head antérieur à l'ADR) déjà traité — ADR-0077 ship dans la PR depuis `7b34447` ; (MAJEUR, traçabilité) le « tech plan figma-tokens-pipeline » cité comme autorité n'existait nulle part dans le repo (document de travail resté dans la session locale de Bertrand) → retro-logué dans `docs/handoffs/tech-plan-figma-tokens-pipeline.md` (extrait constat outillage exécuté par cette PR, marqué retro-log, lié à ADR-0077 et à fixes.md) comme le suggested fix le propose. Au passage : CI « Lint · Typecheck · Test » rouge sur `7b34447` (helper `esc` devenu orphelin après la suppression de `_rich`) → `esc` supprimé aussi ; cause du passage entre les mailles : le hook pre-commit husky n'était pas activé dans ce clone (prepare non exécuté à l'install) — hook activé, les commits suivants passent lint-staged + lint + format:check pour de vrai · checks: eslint fichier + gen-adr-index --check verts en local, hook pre-commit actif · review: panel CI re-run sur le head courant — `panel-verdict` fait autorité
- 2026-08-02 · claude/sharp-cerf-cm1ik0 (PR #160) · tech-writer · `docs/agent-handoffs.md` portait une duplication accidentelle de la table d'index des story shards (second header de table à la ligne 67, suivi de lignes largement redondantes mais divergentes) : fusion en UNE seule table, union des lignes, version la plus récente/complète retenue sur chaque conflit après recoupement avec les shards eux-mêmes — `story-loot-crate-sidewalk` gardé en ADR-0056/amende ADR-0055 (l'ADR réservé §stage-0 et le tech plan §stage-3 du shard ; la copie ADR-0053/0052 était périmée, ADR-0053 étant `0053-niveau-final-live-boss-level.md`), `story-boss-qte-differentiation` gardé `closed` (SHIPPED PR #114) plutôt qu'`open` au stage-5, `story-boss-niveau-final-live` gardé en round-2 du 2026-07-21 plutôt qu'en INTAKE du 2026-07-20 ; `story-street-graphics-effects` (unique à la 1re copie) et les 12 lignes uniques à la 2e (shield-tempo-shot → run-stats-system) conservées. 41 lignes uniques, aucune perdue — union des slugs `./handoffs/*` diffée avant/après, zéro doublon résiduel · checks: docs-only, hook pre-commit vert ; `format:check` d'abord ROUGE en CI (la réécriture du fichier avait mangé le newline final, que le hook n'a pas rattrapé) → corrigé en `343b64a`, prettier --check vert · review: panel CI PR #160 — PASS (0 BLOQUANT / 0 MAJEUR), 1 MINEUR = cette ligne manquante, corrigé ici
- 2026-08-02 · claude/focused-wozniak-lomy3e (post-merge follow-up de la PR #161, mergée par Bertrand — décision humaine valant arbitrage du BLOQUANT tier et du MAJEUR allocation ADR du panel r3) · dev-tooling-assets · les 2 MINEUR CONFIRMÉS du panel r3, traités mais non poussés avant le merge, livrés en PR séparée : (MINEUR, code-review) les globals navigateur du bloc eslint de base fuyaient dans les blocs scripts (flat config MERGE les globals) → `scriptsNodeGlobals` les éteint un par un puis ré-active node+es2022 ; exception explicite fichier-par-fichier pour les 5 harness Playwright dont les callbacks `page.evaluate`/`addInitScript` s'exécutent dans la page (align-grilles/-troncon/-windows, e2e-lib, screenshot-preview — liste établie empiriquement : purge appliquée puis eslint rejoué, seul screenshot-preview.mjs a flaggué en plus des 4 connus) ; un script Node qui référence `window` par erreur casse désormais no-undef · (MINEUR, security-review) preuve d'audit committée : sortie verbatim de `yarn npm audit --recursive --json` dans le shard tech-plan-figma-tokens-pipeline.md (zéro advisory sur @types/node 24.13.3/26.1.1 et undici-types 7.18.2/8.3.0, les 7 advisories listées pré-existent sur main) · au passage : §Decision 2 d'ADR-0077 réparé — prettier avait mangé le markdown (gras fermé juste après `scripts/**`), paragraphe réécrit prettier-stable + purge des globals documentée · checks: typecheck (2 projets)/eslint . (exit 0)/vitest scripts verts, hook pre-commit actif · review: panel CI sur la nouvelle PR
