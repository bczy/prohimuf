# CI / CD — muf

How the GitHub Actions workflows and GitHub Pages deployment fit together.
All workflows live in `.github/workflows/`. Asset-generation internals are in
[asset-pipeline.md](./asset-pipeline.md) and [HARNESS.md](../HARNESS.md).

---

## Workflows at a glance

| Workflow                   | File                 | Trigger                                 | What it does                                                               |
| -------------------------- | -------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| **CI**                     | `ci.yml`             | push to `main`, every PR                | Typecheck · Lint · Format check · Tests + coverage                         |
| **Deploy to GitHub Pages** | `deploy.yml`         | push to `main`, manual                  | Builds the app and publishes it to `gh-pages` root → the live site         |
| **Deploy branch preview**  | `deploy-preview.yml` | manual only (`workflow_dispatch`)       | Builds any branch and publishes it under `preview/<branch>/` on `gh-pages` |
| **Style B Preview**        | `preview.yml`        | push to a specific style branch, manual | Generates level art, renders screenshots, uploads a contact sheet artifact |
| **Generate enemy sprites** | `gen-sprites.yml`    | manual only                             | Regenerates missing enemy sprites and commits them                         |

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

## Branch previews

To try a branch live without merging to `main`:

- **Playable preview** — run **Deploy branch preview** manually (Actions → pick
  the ref). Lands at `https://bczy.github.io/prohimuf/preview/<branch>/`. It uses
  `keep_files: true` so it never wipes `main`'s root or other previews.
- **Visual contact sheet** — **Style B Preview** renders level screenshots and
  uploads them as a downloadable artifact (`style-b-screenshots`), not committed
  back to the branch.

---

## Quick reference

| Need to…                       | Do this                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| Ship to the live site          | Push / merge to `main` (automatic)                            |
| Preview a branch live          | Actions → Deploy branch preview → pick ref                    |
| See why the live site is blank | Check Pages source is `gh-pages` (above)                      |
| Regenerate enemy sprites       | Actions → Generate enemy-type sprites                         |
| Run checks locally before push | `yarn typecheck && yarn lint && yarn test` (mirrors `ci.yml`) |
