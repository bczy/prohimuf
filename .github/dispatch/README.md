# Dispatch markers

Committing a marker file here and pushing it dispatches the matching workflow
**on the pushed branch** — the file-based equivalent of the Actions "Run
workflow" button, usable by any actor with `contents: write` (API tokens
without `actions: write` get `403 Resource not accessible by integration` on the
dispatch endpoint). See `docs/adr/0003` and `docs/ci.md`.

To dispatch a workflow, write the marker and push it:

```sh
date > .github/dispatch/<name> && git add .github/dispatch/<name> && git commit -m "ci(dispatch): <name>" && git push
```

The `ci(dispatch):` commit-message prefix is **REQUIRED**: each workflow's job
is guarded by an `if:` that only fires a push-triggered run when the head commit
message starts with `ci(dispatch):`, so merge/rebase/revert pushes that happen
to touch a marker path do not trigger a paid run.

Markers are created on first dispatch, so only `gen-vehicle-sprites` exists
today. The rows below list every marker path and the workflow it dispatches:

| Marker                | Workflow                    |
| --------------------- | --------------------------- |
| `gen-sprites`         | Generate enemy-type sprites |
| `gen-vehicle-sprites` | Generate vehicle sprites    |
| `deploy-preview`      | Deploy branch preview       |

> Note: `preview.yml` (Style B Preview) has no marker — see `docs/adr/0003`; its
> `regenerate=true` path needs the Actions UI (`workflow_dispatch` input).
