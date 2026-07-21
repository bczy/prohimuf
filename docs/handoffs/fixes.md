# Fix-lane log (rolling)

One line per fix-lane cycle (COLLABORATION.md §fix lane). Newest first.

```
- <date> · <branch/PR> · <owning lane> · <one-line what> · checks: tsc/vitest/lint [+verify] · review: code-review(high) CLEAR|findings→fixed
```

---

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
