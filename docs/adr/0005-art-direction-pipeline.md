# 0005 — Art-direction pipeline: gated prompts, seeded generation, CI style gates

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

Generated sprite quality was inconsistent: FLUX ignored negation-heavy prompts
(sedans instead of hatchbacks, photoreal drift, white grounds), sets lacked family
consistency, and nothing reviewed prompts or outputs systematically. Three vehicle
batches were needed to reach an acceptable set, each caught only by ad-hoc human
review.

## Decision

A staffed and tooled art pipeline (documented in `docs/art-direction.md`):

- **Roles** (`.claude/agents/`): `concept-artist` authors all prompts (FLUX-aware,
  positive shape language); `lead-art` gates every prompt change and every generated
  asset against the bible; `art-advisor` grounds both in period references. Gate
  verdicts are logged in `docs/agent-handoffs.md`.
- **Prompt assembly** (`scripts/gen-vehicle-sprites.mjs`): four slots —
  `opening` (medium+view, front-loaded) + per-type subject + `neonPhrase`
  (`{neon}`/`{hex}` template, hue from data) + shared verbatim `style` block.
  Per-type **pinned seeds** + `enhance=false` + `private=true` make rolls
  reproducible and reviewable (`REROLL=1` bypasses pins).
- **CI gates**: `scripts/check-art-prompts.mjs` lints the ASSEMBLED prompt contract
  on every PR (`ci.yml`); `scripts/check-sprite-style.mjs` (pixel analysis:
  dark/keyed ground, assigned-hue neon rim share, silhouette bounds) runs inside
  `gen-vehicle-sprites.yml` with a bounded delete-and-regen retry (2 extra
  attempts) before any commit-back.

## Consequences

- Prompts can no longer merge unreviewed or off-contract; broken rolls fail the
  generation job loudly instead of landing on the branch.
- Pinned seeds mean a retry reproduces the reviewed art; escaping a bad pinned
  seed is an explicit human act (`REROLL=1`), not silent chance.
- Mechanical gates are calibrated on the currently accepted vehicle set; enemy
  sprites and level art are not yet covered (follow-ups in the bible §7), and
  aspect bounds are a weak sedan-vs-one-box signal — bbox metrics are the lever
  for future tightening.
- The lead-art taste gate remains above the mechanical gate: pixels passing
  thresholds does not imply acceptance.
