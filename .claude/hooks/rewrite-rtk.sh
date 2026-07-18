#!/usr/bin/env bash
# PreToolUse(Bash) hook — transparently rewrite the raw yarn/npm dev commands to
# their `rtk` equivalents so their verbose output is token-compressed. This is the
# hook CLAUDE.md refers to ("A PreToolUse hook rewrites bash commands automatically
# once installed"); it captures the savings otherwise lost when an agent reaches for
# `yarn test` instead of `rtk vitest`.
#
# Safety contract (why this can't break a session):
#   1. If `rtk` is NOT on PATH, do nothing — this preserves the documented
#      "fall back to yarn if rtk is unavailable" behaviour. (rtk is built from
#      source at session start and can legitimately be missing.)
#   2. Only EXACT command forms are rewritten. `yarn test:coverage`, `yarn lint:fix`,
#      or anything with extra flags/chaining passes through untouched, so no args
#      are ever dropped and no mutating script is redirected.
#   3. On any parsing doubt, pass through (exit 0, no output). The hook never denies.
set -euo pipefail

# Guard 1 — rtk absent ⇒ zero behaviour change (keep the yarn fallback intact).
command -v rtk >/dev/null 2>&1 || exit 0

# Read the tool call; bail out quietly if jq or the payload misbehaves.
payload="$(cat)"
command_str="$(printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null)" || exit 0
[ -n "$command_str" ] || exit 0

# Guard 2 — exact match only. Trim surrounding whitespace, then compare literally.
trimmed="${command_str#"${command_str%%[![:space:]]*}"}"
trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"

case "$trimmed" in
  "yarn test"      | "yarn run test")      rtk_cmd="rtk vitest" ;;
  "yarn typecheck" | "yarn run typecheck") rtk_cmd="rtk tsc" ;;
  "yarn lint"      | "yarn run lint")      rtk_cmd="rtk lint" ;;
  "npm test"       | "npm run test")       rtk_cmd="rtk vitest" ;;
  *) exit 0 ;;  # not an exact raw-fallback form ⇒ leave it alone
esac

# Emit the rewrite. `updatedInput` replaces tool_input; the rewritten command is
# itself allowlisted, so normal permissions still apply to it.
jq -n --arg cmd "$rtk_cmd" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    updatedInput: { command: $cmd },
    permissionDecisionReason: ("rtk-rewrite: token-compressed proxy → " + $cmd)
  }
}'
exit 0
