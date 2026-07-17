# 0041 — Generated ADR registry with a CI freshness gate

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

The ADR index (`## Index` in `docs/adr/README.md`) was maintained entirely by
hand. That drift is exactly what produced the two bugs fixed just before this
ADR: a duplicate ADR number (two `0020` files) and an ADR that was never added to
the index at all (`0040`, ex-`0020`). The README itself already documented the
duplicate as a known hazard of parallel lanes self-allocating numbers.

We want the registry to update **as soon as an ADR file lands** — including a
`Proposed` draft (brouillon) — and we want a duplicate number to be impossible to
merge unnoticed. The repo already has the pattern for this: a pure-node
"freshness gate" in CI (`check-agents-infographic.mjs`) that fails a PR when a
generated/authored artifact drifts from its sources.

## Decision

- **`scripts/gen-adr-index.mjs`** owns two artifacts, both derived purely from the
  `docs/adr/NNNN-*.md` files:
  - the `## Index` table in `docs/adr/README.md`, rewritten between
    `<!-- ADR-INDEX:START -->` / `END` markers;
  - the deployed registry page `public/adr/index.html`, served (via the existing
    `deploy.yml` → `dist/` → gh-pages, like `public/team.html`) at
    `https://bczy.github.io/prohimuf/adr/`.
- Only **honestly derivable** fields are used: canonical number (from the
  filename), title (from the H1), status (from the `Status:` line — `Proposed`
  reads as a draft), and a one-line summary (first sentence of `## Context`).
  Implementation-status and hand-written blurbs are deliberately **out of scope** —
  they are point-in-time audits that would rot the instant they were frozen.
- The script **hard-fails on any duplicate ADR number**, naming the colliding
  files, so the next contributor is told to renumber.
- **CI gate** (`ci.yml`): `node scripts/gen-adr-index.mjs --check` runs pure-node,
  before install, next to the agents-infographic gate. `--write` regenerates.
- Both generated files are **prettier-ignored** so the generator has byte-exact
  ownership of their formatting and `--check` can compare verbatim.

## Consequences

- A PR that adds/edits/renames an ADR must regenerate the registry in the same PR
  (CI is red otherwise); `main` is therefore always in sync, with no post-merge
  workflow that commits back to the branch.
- A `Proposed` ADR appears in the registry the moment its file is committed — the
  requirement that motivated this ADR.
- The auto-generated index loses the previous hand-crafted status richness (e.g.
  linked "Superseded by [0030]"), trading it for guaranteed freshness; the
  normalizer still surfaces `Superseded by 0030`, `Accepted (amended)`, etc.
- Contributors run `node scripts/gen-adr-index.mjs --write` after touching an ADR;
  a husky pre-commit auto-write could remove that step later (not done here to keep
  the change small).
