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

# Retry a network-flaky step: retry <attempts> <first-backoff-s> <cmd...>.
# The proxy intermittently 403s downloads, so a transient failure shouldn't
# leave a tool missing for the whole session. Backoff doubles each attempt.
retry() {
  local attempts=$1 delay=$2 n=1
  shift 2
  until "$@"; do
    [ "$n" -ge "$attempts" ] && return 1
    warn "attempt $n/$attempts failed — retrying in ${delay}s"
    sleep "$delay"
    n=$((n + 1))
    delay=$((delay * 2))
  done
}

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
# commit (v0.42.4); bump deliberately via PR — and keep the pin in sync with
# scripts/setup-tooling.sh (the local by-hand equivalent of this block).
if ! command -v rtk >/dev/null 2>&1; then
  retry 3 10 cargo install --git https://github.com/rtk-ai/rtk \
    --rev 5d32d0736f686b69d1e8b9dc45c007d4eb77a0a2 >&2 2>&1 \
    || warn "rtk install failed after retries; agents will fall back to yarn commands"
fi

# --- codegraph — local code knowledge graph served over MCP (.mcp.json) ------
# Pinned version, verified free of lifecycle scripts; bump deliberately via PR.
if ! command -v codegraph >/dev/null 2>&1; then
  retry 3 10 npm install -g --ignore-scripts @colbymchenry/codegraph@1.4.1 >&2 2>&1 \
    || warn "codegraph install failed after retries; agents will fall back to grep"
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
