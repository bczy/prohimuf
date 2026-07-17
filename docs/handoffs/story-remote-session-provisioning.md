# story-remote-session-provisioning

Remote Claude Code (web) sessions provisioned with yarn deps + **rtk** + **codegraph**
via a repo-committed SessionStart hook (PR #70). Normative outcome: ADR-0033 (number
re-allocated from a self-picked 0031 during rebase — collision with main's 0031/0032,
exactly the failure rule #9 exists for; flagged to `producer`). Entry migrated from
the pre-shard monolithic log during rebase onto the sharded format.

## 0. INTAKE — Bertrand — 2026-07-17

- claim: "Penses-tu que graphify me ferait économiser des tokens ?" → analysis:
  graphify duplicates codegraph (already in `.mcp.json`), and neither codegraph nor
  rtk was actually installed in remote containers. Bertrand ruled: "2 go oui installe
  ça dans l'environnement remote aussi" — make the existing tools operational remotely,
  no graphify.

## 2-5. BUILD + VERIFY — orchestrator (tooling lane, session-start-hook skill) — 2026-07-17

- claim: remote-only idempotent SessionStart hook / release: File List —
  `.claude/hooks/session-start.sh` (new), `.claude/settings.json` (registration).
  Constraints honored: `CLAUDE_CODE_REMOTE` gate, WARN-and-continue per tool step
  (fallbacks yarn/grep), rtk built from source (remote proxy 403s GitHub release
  assets; git access works). Verified in the real container: rtk 0.42.4 built
  (3 m 14 s, then cached), codegraph 1.4.1 + index (200 files, 2 145 nodes,
  5 416 edges), `yarn typecheck` / `yarn test` (34 files, 406 tests) / `yarn lint`
  all green; codegraph MCP server connects in-session.

## 6. REVIEW — panel ×4 + doc fact-check triage — 2026-07-17

- VERDICT: PASS — code-review panel (orchestrator triage)
- VERDICT: PASS — senior-architect integration sign-off (Winston)

4 parallel reviewers (`code-review` high, `bmad-code-review`,
`bmad-review-edge-case-hunter`, `security-review`), 25 raw findings, heavy overlap.
REFUTED by doc fact-check: "default 60s hook timeout kills the cargo build" —
command-hook default is 600 s (measured provisioning ≈ 4 min fits). CONFIRMED &
FIXED — (1) hook stdout (yarn/npm/codegraph logs) injected verbatim into Claude's
context each session start → all step output to stderr, one-line stdout status;
(2) unguarded `yarn install` under `set -e` aborted the hook, skipping the
independent rtk/codegraph steps → WARN-and-continue; (3) no matcher (re-ran on
clear/compact) → `startup|resume`; (4) explicit `timeout: 900`; (5) `~/.cargo/bin`
not guaranteed on PATH (perpetual-rebuild risk) → exported in-hook + persisted via
`$CLAUDE_ENV_FILE`; (6) unpinned supply chain (cargo git HEAD, npm latest; security
panel: minor, provenance verified canonical, 1.4.1 scriptless) → rtk pinned to
validated rev `5d32d073` (v0.42.4), `codegraph@1.4.1 --ignore-scripts`; (7)
half-built `.codegraph` store never self-healed → index failure wipes and re-inits.
ACCEPTED (documented, not fixed): first cold session may spawn the `.mcp.json`
codegraph stdio server before the hook installs the binary (spawn ordering
undocumented, stdio servers not retried; self-heals next session); no re-entrancy
lock (marginal with sync hook + matcher); pre-existing invalid control char in
`settings.json` permissions (on main, out of scope). Architect notes: zero `src/**`
changes, game/render/hooks boundary untouched; ADR recommended (tooling precedent
0009/0018), delivered.

## 7. ACCEPT — pm (John) — 2026-07-17

- VERDICT: PASS — pm acceptance

Dev-environment tooling: the "cahier des charges Prohibition" gate does not apply
(no gameplay/fiction surface). Delivery matches the intake ruling exactly — no
graphify duplicate, existing tools made operational, `yarn install` a justified
prerequisite, zero scope creep. Shippable.
