# Dispatch markers

Committing a marker file here and pushing it dispatches the matching workflow
**on the pushed branch** — the file-based equivalent of the Actions "Run
workflow" button, usable by any actor with `contents: write` (API tokens
without `actions: write` get `403 Resource not accessible by integration` on the
dispatch endpoint). See `docs/adr/0009` and `docs/ci.md`.

To dispatch a workflow, write the marker and push it:

```sh
date > .github/dispatch/<name> && git add .github/dispatch/<name> && git commit -m "ci(dispatch): <name>" && git push
```

The `ci(dispatch):` commit-message prefix is **REQUIRED**: each workflow's job
is guarded by an `if:` that only fires a push-triggered run when the head commit
message starts with `ci(dispatch):`, so merge/rebase/revert pushes that happen
to touch a marker path do not trigger a paid run.

Markers are created on first dispatch (the rest come into existence the first
time they are pushed) — `gen-vehicle-sprites` and `gen-nearfg-sprites` exist
today (the latter pre-created so the road-props CI lane is dispatchable as
soon as the gated prompts land, see docs/handoffs/tech-plan-road-props.md).
The rows below list every marker path and the workflow it dispatches:

| Marker                | Workflow                                   |
| --------------------- | ------------------------------------------ |
| `gen-sprites`         | Generate enemy-type sprites                |
| `gen-vehicle-sprites` | Generate vehicle sprites                   |
| `gen-nearfg-sprites`  | Generate near-foreground road-prop sprites |
| `gen-hostage-sprites` | Generate hostage sprites                   |
| `gen-courier-sprites` | Generate courier sprites                   |
| `gen-boss-sprites`    | Generate boss sprites                      |
| `gen-level-art`       | Generate level art                         |

> Note: `deploy-preview.yml` no longer has a marker — it auto-deploys on every
> push to `claude/*` branches (other branches: Actions UI). `preview.yml`
> (Style B Preview) has no marker either — see `docs/adr/0009`; its
> `regenerate=true` path needs the Actions UI (`workflow_dispatch` input).
