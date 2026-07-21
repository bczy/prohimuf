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

## Amendment — rebase-retry publish (2026-07-18)

The original publishes used `peaceiris/actions-gh-pages@v4` with a plain
`git push`. With several `claude/**` branch previews and the `main` deploy all
writing the single `gh-pages` ref, the loser of a concurrent push got
`! [rejected] (fetch first)` and the deploy failed (observed repeatedly on the
branch-preview farm). Both workflows now publish through the in-repo composite
action **`.github/actions/gh-pages-publish`**: each attempt re-clones
`gh-pages` fresh, applies only its own target (root overlay for `main`,
clean-replace of `preview/<slug>/` for branch previews — the rest of the branch
is always preserved, and `.nojekyll` is re-created on root publishes), then
pushes; a rejected push re-clones and retries with backoff + jitter. This
removes the `peaceiris/actions-gh-pages` dependency; everything else above
(branch layout, Pages source, sub-path bases, SPA fallback) is unchanged.

## Amendment — preview lifecycle cleanup (2026-07-18)

Branch previews had no end of life: `preview/<slug>/` subtrees accumulated on
`gh-pages` forever after their branches merged. **`cleanup-preview.yml`** now
removes a branch's preview when the branch is deleted or its PR merges (manual
dispatch prunes previews orphaned before the workflow existed). It reuses
`gh-pages-publish` unchanged: clean-replacing `preview/<slug>/` with an
**empty** publish dir deletes the subtree (git tracks no empty directories),
through the same rebase-retry loop — and it shares the branch's
`deploy-preview-*` concurrency group so a cleanup queues behind an in-flight
deploy of the same ref instead of interleaving with it. (One asymmetry: a new
push-deploy of a branch kept alive after merge may cancel a pending cleanup —
that branch's eventual delete event re-fires it.)

## Amendment — preview tied to PR lifetime (2026-07-21)

The cleanup above fired only when a PR **merged** (or its branch was deleted),
so a preview kept living after a PR was **closed without merging** until the
branch was eventually removed. A preview should exist only while its PR is
open, so `cleanup-preview.yml` now prunes `preview/<slug>/` on **any** close of
a same-repo PR into the default branch — merged **or** closed unmerged. The
`if` guard dropped its `pull_request.merged == true` clause; the `pull_request:
closed` trigger already fires for both outcomes, and deploy, concurrency and
the empty-publish delete mechanic are otherwise unchanged.

A one-time purge also cleared the ~60 previews that had accumulated on
`gh-pages` before the cleanup workflow existed (branches merged but never
deleted, so no event ever fired), keeping only the previews of still-open PRs.
