#!/usr/bin/env bash
# Local, by-hand provisioning of muf's two token-saving tools — rtk & codegraph.
#
# The SessionStart hook (.claude/hooks/session-start.sh) installs these
# automatically, but ONLY in remote "Claude Code on the web" sessions — it exits
# early when CLAUDE_CODE_REMOTE != true. On a local machine the tools are
# "provisioned by hand"; this script IS that hand, in one command:
#
#     ./scripts/setup-tooling.sh
#
# Idempotent: whatever is already installed is skipped, so it is safe to re-run.
#
# IMPORTANT: the pinned versions below MUST stay in sync with
# .claude/hooks/session-start.sh — bump both together, deliberately, in one PR.
set -euo pipefail

# --- pinned tool versions (keep in sync with session-start.sh) ---------------
RTK_GIT="https://github.com/rtk-ai/rtk"
RTK_REV="5d32d0736f686b69d1e8b9dc45c007d4eb77a0a2" # v0.42.4
CODEGRAPH_PKG="@colbymchenry/codegraph@1.4.1"

cd "$(dirname "$0")/.." # repo root (this script lives in scripts/)

say() { printf '\n▸ %s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }

# cargo installs land in ~/.cargo/bin — make it reachable for this run.
export PATH="$HOME/.cargo/bin:$PATH"

# --- rtk (Rust Token Killer) — compresses tsc/vitest/lint/git/grep output ----
if command -v rtk >/dev/null 2>&1; then
  say "rtk already installed ($(command -v rtk)) — skipping"
elif ! command -v cargo >/dev/null 2>&1; then
  warn "cargo not found — install Rust (https://rustup.rs), then re-run for rtk"
else
  say "installing rtk from source (pinned ${RTK_REV:0:12}, slow once)…"
  cargo install --git "$RTK_GIT" --rev "$RTK_REV" \
    || warn "rtk install failed; agents will fall back to yarn commands"
fi

# --- codegraph — local code knowledge graph served over MCP (.mcp.json) ------
if command -v codegraph >/dev/null 2>&1; then
  say "codegraph already installed ($(command -v codegraph)) — skipping"
elif ! command -v npm >/dev/null 2>&1; then
  warn "npm not found — install Node.js, then re-run for codegraph"
else
  say "installing codegraph ($CODEGRAPH_PKG)…"
  npm install -g --ignore-scripts "$CODEGRAPH_PKG" \
    || warn "codegraph install failed; agents will fall back to grep"
fi

# --- codegraph index (.codegraph/ is gitignored, rebuilt per machine) --------
# A failed refresh usually means a half-built store: start over rather than
# stay broken forever. Mirrors the recovery logic in session-start.sh.
if command -v codegraph >/dev/null 2>&1; then
  say "building/refreshing the local codegraph index…"
  if [ -d .codegraph ]; then
    codegraph index \
      || { rm -rf .codegraph && codegraph init; } \
      || warn "codegraph index failed"
  else
    codegraph init || warn "codegraph init failed"
  fi
fi

# --- summary -----------------------------------------------------------------
rtk_state=$(command -v rtk >/dev/null 2>&1 && echo ok || echo missing)
cg_state=$(command -v codegraph >/dev/null 2>&1 && echo ok || echo missing)
say "done — rtk: $rtk_state, codegraph: $cg_state"
printf 'If a fresh shell cannot find rtk, add this to your shell profile:\n  export PATH="$HOME/.cargo/bin:$PATH"\n'
