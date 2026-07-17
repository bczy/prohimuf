# 0033 — Remote session provisioning via SessionStart hook (pinned rtk + codegraph)

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

The project standardizes on two token-saving tools for AI agent sessions
(CLAUDE.md): **rtk** (compressed `tsc`/`vitest`/`grep`/`git` output) and
**codegraph** (local code knowledge graph served over MCP, declared in
`.mcp.json`). Both were provisioned by hand on local machines only. Remote
Claude Code (web) sessions start from a fresh container: no `node_modules`,
no `rtk`, no `codegraph` — the `.mcp.json` server failed to spawn and agents
fell back to grep and raw command output, without the token savings the
tooling exists for. Adopting graphify (an equivalent knowledge-graph tool)
was considered and rejected as a duplicate of codegraph.

Two remote-environment constraints shaped the mechanism:

- The remote proxy returns 403 on GitHub release-asset downloads, so rtk
  cannot use its install script or prebuilt binaries; git access works, so
  it is built from source once (~3 min) and cached with the container state.
- SessionStart hook stdout is injected into the model context, so
  provisioning output must not leak there.

## Decision

Provision remote sessions from a repo-committed **SessionStart hook**
(`.claude/hooks/session-start.sh`, registered in `.claude/settings.json`
with `matcher: startup|resume`, `timeout: 900`), gated on
`CLAUDE_CODE_REMOTE=true` and idempotent:

1. `corepack` + `yarn install` (JS deps);
2. `cargo install --git` **rtk pinned to the validated rev**
   (`5d32d073…`, v0.42.4);
3. `npm install -g --ignore-scripts` **codegraph pinned to 1.4.1**, then
   `codegraph init`/`index` (self-healing: a failed refresh wipes and
   re-inits the gitignored `.codegraph/` store).

Every tool step is WARN-and-continue (fallbacks: `yarn` commands, grep) so
provisioning never blocks a session; all step output goes to stderr with a
one-line stdout status. Version bumps are deliberate, via PR.

## Consequences

- Remote sessions get the same rtk/codegraph workflow as local ones; the
  `.mcp.json` codegraph server actually connects in the cloud.
- Supply chain is pinned (reviewed panel finding): no moving git HEAD or
  npm `latest` executed at session start. Bumping rtk/codegraph now
  requires editing the hook.
- Nothing downstream is load-bearing on these tools (graceful degradation),
  which keeps this reversible: deleting the hook restores the previous
  behavior.
- Known residual edge: on the first cold session, Claude Code may spawn the
  `.mcp.json` codegraph stdio server before the hook has installed the
  binary (spawn ordering is undocumented; stdio servers are not retried).
  It self-heals on the next session; agents degrade to grep meanwhile.
- Diffs touching `.claude/hooks/` or `.claude/settings.json` are
  security-sensitive (code auto-executed at session start) and warrant the
  full review panel — as applied to this change (PR #70, see
  `docs/handoffs/story-remote-session-provisioning.md`).
