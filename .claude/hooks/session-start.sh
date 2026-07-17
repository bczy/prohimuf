#!/bin/bash
# SessionStart hook — prepares Claude Code on the web (remote) sessions:
# JS deps + the two token-saving tools CLAUDE.md relies on (rtk, codegraph).
set -euo pipefail

# Remote-only: local machines are provisioned by hand.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# --- JS dependencies (Yarn 4 via corepack) -----------------------------------
corepack enable >/dev/null 2>&1 || true
yarn install

# --- rtk (Rust Token Killer) — compressed tsc/vitest/grep/git output ---------
# The remote proxy 403s GitHub release downloads, so build from source via git
# (slow once, then cached with the container state).
if ! command -v rtk >/dev/null 2>&1; then
  cargo install --git https://github.com/rtk-ai/rtk \
    || echo "WARN: rtk install failed; agents will fall back to yarn commands" >&2
fi

# --- codegraph — local code knowledge graph served over MCP (.mcp.json) ------
if ! command -v codegraph >/dev/null 2>&1; then
  npm install -g @colbymchenry/codegraph \
    || echo "WARN: codegraph install failed; agents will fall back to grep" >&2
fi

# Build/refresh the local index (.codegraph/ is gitignored, rebuilt per machine).
if command -v codegraph >/dev/null 2>&1; then
  if [ -d .codegraph ]; then
    codegraph index || echo "WARN: codegraph index refresh failed" >&2
  else
    codegraph init || echo "WARN: codegraph init failed" >&2
  fi
fi
