# Fix-lane log (rolling)

One line per fix-lane cycle (COLLABORATION.md §fix lane). Newest first.

```
- <date> · <branch/PR> · <owning lane> · <one-line what> · checks: tsc/vitest/lint [+verify] · review: code-review(high) CLEAR|findings→fixed
```

---

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
