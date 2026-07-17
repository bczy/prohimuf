#!/bin/bash
# SessionStart hook — provisions Claude Code on the web (remote) sessions:
# JS deps + the two token-saving tools CLAUDE.md relies on (rtk, codegraph).
# Step output goes to stderr — SessionStart stdout is injected into Claude's
# context, so stdout carries a one-line status only.
set -euo pipefail

# Remote-only: local machines are provisioned by hand.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
warn() { echo "WARN: $*" >&2; }

# cargo installs land in ~/.cargo/bin; make sure both this hook and the agent
# shell can see it, or rtk would be rebuilt from scratch every session.
export PATH="$HOME/.cargo/bin:$PATH"
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export PATH="$HOME/.cargo/bin:$PATH"' >>"$CLAUDE_ENV_FILE"
fi

# --- JS dependencies (Yarn 4 via corepack) -----------------------------------
corepack enable >&2 2>&1 || true
yarn install >&2 2>&1 || warn "yarn install failed; run 'yarn install' before tests/lint"

# --- rtk (Rust Token Killer) — compressed tsc/vitest/grep/git output ---------
# The remote proxy 403s GitHub release downloads, so build from source via git
# (slow once, then cached with the container state). Pinned to the validated
# commit (v0.42.4); bump deliberately via PR.
if ! command -v rtk >/dev/null 2>&1; then
  cargo install --git https://github.com/rtk-ai/rtk \
    --rev 5d32d0736f686b69d1e8b9dc45c007d4eb77a0a2 >&2 2>&1 \
    || warn "rtk install failed; agents will fall back to yarn commands"
fi

# --- codegraph — local code knowledge graph served over MCP (.mcp.json) ------
# Pinned version, verified free of lifecycle scripts; bump deliberately via PR.
if ! command -v codegraph >/dev/null 2>&1; then
  npm install -g --ignore-scripts @colbymchenry/codegraph@1.4.1 >&2 2>&1 \
    || warn "codegraph install failed; agents will fall back to grep"
fi

# Build/refresh the local index (.codegraph/ is gitignored, rebuilt per machine).
# A failed refresh usually means a half-built store (interrupted first run):
# start over rather than stay broken forever.
if command -v codegraph >/dev/null 2>&1; then
  if [ -d .codegraph ]; then
    codegraph index >&2 2>&1 \
      || { rm -rf .codegraph && codegraph init >&2 2>&1; } \
      || warn "codegraph index failed"
  else
    codegraph init >&2 2>&1 || warn "codegraph init failed"
  fi
fi

echo "session-start: remote provisioning done (rtk: $(command -v rtk >/dev/null 2>&1 && echo ok || echo missing), codegraph: $(command -v codegraph >/dev/null 2>&1 && echo ok || echo missing))"
