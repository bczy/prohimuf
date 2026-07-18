# Fix-lane log (rolling)

One line per fix-lane cycle (COLLABORATION.md §fix lane). Newest first.

```
- <date> · <branch/PR> · <owning lane> · <one-line what> · checks: tsc/vitest/lint [+verify] · review: code-review(high) CLEAR|findings→fixed
```

---

- 2026-07-18 · claude/screen-edge-arrows-size-jlnmix · dev-r3f-render · enlarge the
  off-screen target edge arrows ×4 (Bertrand: too small, then "double again") — svg
  glyph 34→68→136 via CSS-owned size (.arrowCore 136px, svg width/height 100%, single
  owner), .arrowWrap 160px; keyline held at 2px across both bumps (strokeWidth
  2→1→0.5 viewBox units); golden baselines regenerated twice (ADR-0005 flow,
  eyeballed); anchors unchanged (tips keep hugging the edges, verified) · checks:
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
