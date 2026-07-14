# QA — index

Quality assurance artifacts for **muf**, kept by `qa-lead` (Inès). Protocol:
`.claude/agents/COLLABORATION.md` §production pipeline, stage 5 (VERIFY).

## What lives here

| Artifact               | Purpose                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `plan-<story-slug>.md` | Per-story test plan, written BEFORE the build lands              |
| `regressions.md`       | Every escaped bug → its regression-test spec and owning dev lane |

Rules of the folder:

- Plans and verdicts only — **no test implementation**. E2e scripts are implemented by
  `dev-tooling-assets` (in `scripts/`), unit specs by `dev-gameplay` (in
  `src/game/systems/__tests__/`), both from the specs written here.
- The QUALITY GATE verdict (PASS/FAIL + evidence) for each story is logged in
  `docs/agent-handoffs.md`.

## Current verification surface (baseline, 2026-07-14)

- Unit: 14 Vitest suites on `src/game` systems, coverage thresholds 80% (lines,
  functions, branches, statements) enforced in CI.
- E2e: `scripts/e2e-home/ingame/delivery/assets.mjs` (Playwright, screenshots
  archived in CI), local replay via the `verify` skill.
- Asset QA: `check-art-prompts`, `check-sprite-style`, `check-sprite-integrity`,
  `check-halo-gradient` (mechanical, non-binding for the art gates).
- Known e2e holes to burn down: tutorial flow, mobile controls (ADR-0015 fork),
  narrative scenes, high-score persistence.
