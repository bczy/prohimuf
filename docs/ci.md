# CI / CD — muf

How the GitHub Actions workflows and GitHub Pages deployment fit together.
All workflows live in `.github/workflows/`. Asset-generation internals are in
[asset-pipeline.md](./asset-pipeline.md) and [HARNESS.md](../HARNESS.md).

---

## Workflows at a glance

| Workflow                     | File                      | Trigger                                 | What it does                                                               |
| ---------------------------- | ------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| **CI**                       | `ci.yml`                  | push to `main`, every PR                | Typecheck · Lint · Format check · Tests + coverage                         |
| **Deploy to GitHub Pages**   | `deploy.yml`              | push to `main`, manual                  | Builds the app and publishes it to `gh-pages` root → the live site         |
| **Deploy branch preview**    | `deploy-preview.yml`      | push to `claude/*` (auto), manual       | Builds any branch and publishes it under `preview/<branch>/` on `gh-pages` |
| **Style B Preview**          | `preview.yml`             | push to a specific style branch, manual | Generates level art, renders screenshots, uploads a contact sheet artifact |
| **Generate enemy sprites**   | `gen-sprites.yml`         | manual, or dispatch marker              | Regenerates missing enemy sprites and commits them                         |
| **Generate vehicle sprites** | `gen-vehicle-sprites.yml` | manual, or dispatch marker              | Regenerates truck/car/moto sprites (FORCE=1) and commits them              |

`pages-build-deployment` also appears in the Actions tab — that one is
**GitHub's own internal Pages build**, not a workflow in this repo. It runs
automatically whenever the `gh-pages` branch changes.

---

## The deployment chain (live site)

The live game is at **https://bczy.github.io/prohimuf/**. Nothing is run by
hand for a normal release:

1. You push (or merge) to `main`.
2. `deploy.yml` runs `yarn build`, adds an SPA `404.html` fallback, and pushes
   the compiled `dist/` to the **`gh-pages`** branch root.
3. GitHub's internal `pages-build-deployment` picks up the `gh-pages` change and
   serves it via the CDN (propagation usually takes < 2 min).

So: **you don't launch the build — pushing to `main` does.**

```
push main ──▶ deploy.yml ──▶ gh-pages (built dist/) ──▶ Pages CDN ──▶ live site
```

### Base path

Vite is configured with `base: "/prohimuf/"` (see `vite.config.ts`) because the
site is served from a repo sub-path, not a domain root. Branch previews override
this at build time with `VITE_BASE=/prohimuf/preview/<branch>/`. If a built page
ever references assets from `/` instead of `/prohimuf/`, the base is wrong.

---

## ⚠️ Critical setting: Pages must serve `gh-pages`, not `main`

**Settings → Pages → Source must be "Deploy from a branch" → `gh-pages` / `/ (root)`.**

This is a one-time repo setting, but it is the single thing that silently breaks
the whole site if wrong. Symptom seen in June 2026: a black screen with a console
error like

```
Loading module from "https://bczy.github.io/src/main.tsx" was blocked
because of a disallowed MIME type ("text/html").
```

That happens when Pages is pointed at the **`main`** branch — it serves the raw
source `index.html` (which references `/src/main.tsx`, a file Vite only resolves
during a build) instead of the compiled bundle on `gh-pages`. The code and the
workflows are all fine; only the source branch is misconfigured.

**Fix / verify via the API:**

```bash
# Check current source
gh api repos/bczy/prohimuf/pages --jq '.source'
# Expected: { "branch": "gh-pages", "path": "/" }

# Correct it if it points at main
gh api -X PUT repos/bczy/prohimuf/pages --input - <<'EOF'
{"source":{"branch":"gh-pages","path":"/"}}
EOF

# Changing the source via API does NOT auto-rebuild — trigger one:
gh api -X POST repos/bczy/prohimuf/pages/builds

# Wait for it, then confirm the live HTML references the built bundle:
curl -s https://bczy.github.io/prohimuf/ | grep script
# Good:  <script ... src="/prohimuf/assets/index-XXXX.js">
# Bad:   <script ... src="/src/main.tsx">
```

(The same is doable in the UI: Settings → Pages → Source → branch `gh-pages` →
`/ (root)` → Save.)

---

## Dispatching a workflow without `actions: write`

The REST dispatch endpoint
(`POST /repos/bczy/prohimuf/actions/workflows/{id}/dispatches`) requires a
token with the **`actions: write`** permission. Tokens that lack it — notably
the GitHub App integration used by AI coding sessions — get
**`403 Resource not accessible by integration`**. That permission is set on
the app installation, not in this repo.

The workaround (see [ADR 0009](./adr/0009-push-marker-workflow-dispatch.md)):
each manual workflow also triggers on a **push touching its marker file** in
`.github/dispatch/` (with `main` excluded via `branches-ignore`). Any actor
that can push can therefore dispatch:

```bash
date > .github/dispatch/<name> && git add .github/dispatch/<name> && git commit -m "ci(dispatch): <name>" && git push
```

For example, `<name>` = `gen-vehicle-sprites`. Two rules that make it work:

- Write content (`date >`), **never bare `touch`** — `touch` only bumps the
  mtime, produces no diff, and the `paths` filter never fires.
- Keep the **`ci(dispatch):` commit-message prefix** — it is required, not
  cosmetic. Each workflow guards on the head commit message, so only a real
  `ci(dispatch):` commit runs it; merge, rebase, and deletion pushes that
  happen to touch a marker path are skipped.

The run executes **on the pushed branch**, exactly like picking that ref in
the Actions UI. Marker files are **created on first dispatch** — they need not
pre-exist (creating the file is itself the diff). Only
`.github/dispatch/gen-vehicle-sprites` exists today; `gen-sprites` appears the
first time it is dispatched. `deploy-preview.yml` no longer uses a marker: it
auto-deploys on every push to `claude/*` branches (other branches via the
Actions UI).

`preview.yml` deliberately has **no marker** — it would be redundant, not
impossible: `preview.yml` already has its own push trigger, so a plain push
already runs its default (`regenerate=false`) path. Only `regenerate=true`, a
full art regeneration, needs the boolean input a push can't carry — use the
Actions UI for that one.

When you both regenerate assets and want a fresh preview on a `claude/*`
branch, push the `gen-*` marker first: the generation's bot commit-back does
not retrigger workflows, so push any real commit afterwards to get the
post-generation preview.

---

## Branch previews

To try a branch live without merging to `main`:

- **Playable preview** — run **Deploy branch preview** manually (Actions → pick
  the ref). Lands at `https://bczy.github.io/prohimuf/preview/<branch>/`. The
  publish (`.github/actions/gh-pages-publish`) clean-replaces only its own
  `preview/<slug>/` subtree and never wipes `main`'s root or other previews;
  it re-clones + retries on a concurrent-push race instead of failing.
- **Visual contact sheet** — **Style B Preview** renders level screenshots and
  uploads them as a downloadable artifact (`style-b-screenshots`), not committed
  back to the branch.

---

## Quick reference

| Need to…                                     | Do this                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Ship to the live site                        | Push / merge to `main` (automatic)                                                                |
| Preview a branch live                        | Actions → Deploy branch preview → pick ref                                                        |
| See why the live site is blank               | Check Pages source is `gh-pages` (above)                                                          |
| Regenerate enemy sprites                     | Actions → Generate enemy-type sprites                                                             |
| Dispatch a workflow without `actions: write` | `date > .github/dispatch/<name> && git add … && git commit -m "ci(dispatch): <name>" && git push` |
| Run checks locally before push               | `yarn typecheck && yarn lint && yarn test` (mirrors `ci.yml`)                                     |
