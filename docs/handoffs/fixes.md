# Fix-lane log (rolling)

One line per fix-lane cycle (COLLABORATION.md §fix lane). Newest first.

```
- <date> · <branch/PR> · <owning lane> · <one-line what> · checks: tsc/vitest/lint [+verify] · review: code-review(high) CLEAR|findings→fixed
```

---

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
