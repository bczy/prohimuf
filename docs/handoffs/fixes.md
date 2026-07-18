# Fix-lane log (rolling)

One line per fix-lane cycle (COLLABORATION.md §fix lane). Newest first.

```
- <date> · <branch/PR> · <owning lane> · <one-line what> · checks: tsc/vitest/lint [+verify] · review: code-review(high) CLEAR|findings→fixed
```

---

- 2026-07-18 · claude/rtk-graph-savings-report-2a6t8o · dev-tooling-assets · capture the
  last two tooling-savings postes: (1) CLAUDE.md working rule steering code navigation to
  codegraph-first (callers/impact/search) before grep/Read dumps files; (2) install
  resilience — a `retry` helper (3 attempts, doubling backoff) around the network-flaky
  cargo/npm installs in both session-start.sh and setup-tooling.sh, so a transient proxy
  403 no longer leaves rtk/codegraph missing for the whole session. (True cross-session
  binary caching needs a persistent volume — out of repo scope; retry is the honest fix.)
  · checks: `bash -n` clean on both scripts, retry helper unit-tested (success + fail
  paths) · review: pending

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
  structure verified; tsc/vitest/lint N/A (no TS/source changed) · review: pending

- 2026-07-17 — story-crew-extension log closure: append Winston's §6g integration
  re-triage (PASS — written moments after Bertrand's merge, hence this follow-up),
  flip the story index row to closed. Docs-only, one shard + index. (orchestrator →
  single code-review waived by fix-lane tier: log-only diff; Marion may challenge.)
