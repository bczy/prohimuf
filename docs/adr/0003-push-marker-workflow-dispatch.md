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

The same integration _can_ push, and pushes made by it do trigger workflows
(only `github-actions[bot]`'s own `GITHUB_TOKEN` pushes are suppressed by
GitHub — the limitation already documented in `preview.yml`).

## Decision

Each manual workflow gains a second, equally deliberate trigger — a `push`
filtered on a per-workflow marker file, with `main` excluded so a merge can
never fire the mechanism on the default branch:

```yaml
on:
  workflow_dispatch:
  push:
    branches-ignore: ["main"]
    paths:
      - ".github/dispatch/<workflow-name>"
```

"Dispatching" without `actions: write` = write the marker, commit with a
`ci(dispatch):` message, push:

```bash
date > .github/dispatch/<name> && git add .github/dispatch/<name> && git commit -m "ci(dispatch): <name>" && git push
```

Use `date >` (or any content write), never bare `touch`: `touch` alters only
the mtime, produces no diff, and the `paths` filter never fires. The run
executes on the pushed branch (push events read the workflow file from that
ref), exactly like choosing that ref in the Actions UI.

The `ci(dispatch):` prefix is **required**, not cosmetic: a job-level guard
gates each workflow on the head commit message, so only a real marker-dispatch
commit runs it (see Consequences). Marker files are **created on first
dispatch** — they need not pre-exist, since creating the file is itself a diff
matching the filter. Only `.github/dispatch/gen-vehicle-sprites` exists today;
the `gen-sprites` and `deploy-preview` markers spring into being the first time
each is dispatched.

`preview.yml` is **excluded** — no marker is added — because it would be
redundant, not because push can't reach it: `preview.yml` already has its own
`push` trigger, so a plain push already runs its default (`regenerate=false`)
path. Only `regenerate=true` (a full art regeneration) needs the boolean input,
which a push event cannot carry, so that one path stays on the Actions UI.

## Consequences

- Any actor with `contents: write` can dispatch these workflows.
- Runs are bound to the pushed branch — dispatching _on another ref_ still
  requires the Actions UI or an `actions: write` token.
- `workflow_dispatch` inputs are not available via markers; workflows needing
  inputs keep the UI as their input-carrying path.
- The `paths` filter is **not** self-limiting to deliberate dispatches: a
  merge, a rebase, or a branch **deletion** push can also touch
  `.github/dispatch/**` and match the filter. The enforcing contract is the
  **`ci(dispatch):` head-commit guard** each workflow runs as its first job
  step — it proceeds only when the head commit message starts with
  `ci(dispatch):`, so incidental pushes that happen to carry a marker path are
  skipped. Marker commits are one-line `ci(dispatch):` commits touching only
  `.github/dispatch/`.
- Marker-dispatching a **committing** workflow (`gen-sprites`,
  `gen-vehicle-sprites`) on a PR branch moves the PR head to a
  `github-actions[bot]` commit that carries **no CI run** — GitHub does not run
  workflows on `GITHUB_TOKEN` pushes (the same limitation the `preview.yml`
  header comment documents about `GITHUB_TOKEN` pushes, and why it went
  artifact-only). Mitigation: after the bot's asset commit lands, push a real
  (non-`GITHUB_TOKEN`) commit before merge so the PR head carries a green CI
  status.
- When regenerating assets **and** deploying a preview, dispatch the `gen-*`
  markers **first** and push the `deploy-preview` marker in a **separate, later
  push**: a single push that touches both markers deploys the pre-generation
  SHA (the preview build starts from the commit before the bot's asset commit).

## Security consequences

- The dispatch capability is exactly `contents: write` — any credential that
  can push can trigger these runs, **including review-free publication of a
  branch preview to the public GitHub Pages site** via the `deploy-preview`
  marker. Mitigations: `branches-ignore: ["main"]` keeps the mechanism off the
  default branch, and previews carry a `noindex` meta tag so they are not
  search-indexed.
- A branch-prefix **allowlist** (e.g. `branches: ["claude/**", …]`) was
  considered and **rejected** for this two-actor repo (Bertrand + AI sessions):
  push triggers never fire from forked-PR contexts, so the untrusted surface is
  already nil, while an allowlist turns marker dispatch into a silent no-op on
  ad-hoc human branches. **Revisit on the first external contributor.**
- Branch-derived values (slug, base path) are a shell-injection sink; they are
  passed via env / sanitized slug rather than interpolated into shell, so a
  hostile branch name cannot inject.
- Runtime Pollinations downloads during generation are an **accepted risk**
  (third-party art fetched at run time); `@napi-rs/canvas` is version-pinned to
  keep the chroma-key toolchain reproducible.
