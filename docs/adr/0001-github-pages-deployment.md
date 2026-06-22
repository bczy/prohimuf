# 0001 — GitHub Pages deployment via `gh-pages` branch

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

muf is a static client-side build (Vite) that needs free public hosting for a
playable demo. The site is served from a repo sub-path, **not** a domain root:
`https://bczy.github.io/prohimuf/`. We also want to preview unmerged branches
live without affecting the main site.

GitHub Pages can serve either from a branch ("Deploy from a branch") or from a
GitHub Actions artifact. Two branch layouts are possible: serve the source repo
directly, or serve a separate branch holding only the compiled output.

## Decision

- Build on every push to `main` via `.github/workflows/deploy.yml` (`yarn build`)
  and publish the compiled `dist/` to the **`gh-pages`** branch **root**.
- **GitHub Pages source = branch `gh-pages`, path `/ (root)`.** Pages must serve
  `gh-pages`, never `main`.
- Vite is configured with `base: "/prohimuf/"` (`vite.config.ts`) to match the
  sub-path. Branch previews override it at build time with
  `VITE_BASE=/prohimuf/preview/<branch>/` and publish under `preview/<branch>/`
  on the same `gh-pages` branch (`deploy-preview.yml`, manual dispatch).
- An SPA `404.html` fallback is added so deep links resolve.

## Consequences

- Pushing to `main` is the only action needed to ship — no manual build.
- Source and build artifacts stay cleanly separated: `main` never contains
  `dist/`, `gh-pages` contains only built output + previews.
- **Critical gotcha:** if the Pages source is ever set to `main`, the site serves
  the _raw_ source `index.html` (which references `/src/main.tsx`, resolved only
  during a Vite build) and shows a black screen with a console error:
  `Loading module from ".../src/main.tsx" was blocked because of a disallowed
MIME type ("text/html")`. The code and workflows are fine in that case — only
  the source branch is wrong. This actually happened on 2026-06-22.
- Changing the Pages source via the API does **not** auto-rebuild; a build must
  be triggered explicitly. Repair commands and verification steps are documented
  in [../ci.md](../ci.md#-critical-setting-pages-must-serve-gh-pages-not-main).
