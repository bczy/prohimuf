# 0003 — Push-marker dispatch for manual workflows

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

The manual workflows (`gen-sprites.yml`, `gen-vehicle-sprites.yml`,
`deploy-preview.yml`) were `workflow_dispatch`-only. Dispatching them through
the REST API (`POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches`)
requires a token with the **`actions: write`** permission. The GitHub App
integration used by AI coding sessions has `contents: write` (it pushes
branches and reads Actions) but **not** `actions: write`, so every API dispatch
fails with `403 Resource not accessible by integration`. That permission lives
on the app installation — nothing in this repository can grant it.

The same integration *can* push, and pushes made by it do trigger workflows
(only `github-actions[bot]`'s own `GITHUB_TOKEN` pushes are suppressed by
GitHub — the limitation already documented in `preview.yml`).

## Decision

Each manual workflow gains a second, equally deliberate trigger — a `push`
filtered on a per-workflow marker file:

```yaml
on:
  workflow_dispatch:
  push:
    paths:
      - ".github/dispatch/<workflow-name>"
```

"Dispatching" without `actions: write` = touch the marker, commit, push. The
run executes on the pushed branch (push events read the workflow file from
that ref), exactly like choosing that ref in the Actions UI.

`preview.yml` is **excluded**: its `regenerate` boolean input cannot be
expressed through a push event; forcing a full regeneration still goes through
the Actions UI.

## Consequences

- Any actor with `contents: write` can dispatch these workflows; runs stay
  deliberate (a marker touch is an explicit commit, never a side effect of
  normal pushes).
- Runs are bound to the pushed branch — dispatching *on another ref* still
  requires the Actions UI or an `actions: write` token.
- `workflow_dispatch` inputs are not available via markers; workflows needing
  inputs keep the UI as their input-carrying path.
- Marker commits are noise in history; they are one-line `ci(dispatch):`
  commits touching only `.github/dispatch/`.
