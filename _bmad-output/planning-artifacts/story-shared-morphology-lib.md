# Story: Extract shared image-morphology lib for asset scripts

**Type:** Tooling refactor (`scripts/` only) — no behaviour change, no game/render/asset-byte change · **PM:** John · **Date:** 2026-07-14
**Origin:** PR #40 review panel follow-up · recorded in ADR-0019 and the PR body · greenlit by Bertrand
**Scope guard:** PROJECT_GUIDELINES §2 (DRY — "extraire en système réutilisable dès la 2ème occurrence"). §2 KISS/YAGNI apply.

## Why (product value)

Not player-facing. It protects the pipeline that ships player-facing sprites. `retouch-flash-halos.mjs` copies ~135 lines verbatim from `fill-sprite-holes.mjs` (`diskOffsets/dilate/erode/fillHoles/largestComponent/solidBodyMask` + `CLOSE_R/ERODE_R/SEAL_MARGIN/OPAQUE`) with a "Re-sync if that script's morphology changes" comment. Its correctness contract is "mirrors fill-sprite-holes PASS-A byte-for-byte", enforced only by human discipline: a one-sided tune silently desyncs them and PNGs get rewritten wrongly **before any gate turns red**. Three more scripts (`measure-muzzle-anchors`, `check-sprite-integrity` hand-rolled labeling; `cutout-enemies` border flood) plus newer `restore-figure-bites`/`fill-bust-hem` re-implement the same primitives. One source of truth removes the desync class entirely.

## Cahier des charges test — N/A (stated explicitly)

The "did Prohibition Atari ST have it?" test governs **game features**, not build tooling. This is an internal refactor of the asset pipeline with zero gameplay/schema surface, so the test does not apply. DRY (§2) is the governing principle instead.

## Acceptance Criteria

- **AC1 (one module):** `scripts/lib/morphology.mjs` holds the single implementation (disk offsets, dilate, erode, fill-holes, connected-component labeling, largest-component, solid-body-mask, border-seeded flood). All duplicated/hand-rolled copies deleted; every consumer (`fill-sprite-holes`, `retouch-flash-halos`, `measure-muzzle-anchors`, `check-sprite-integrity`, `cutout-enemies`, `restore-figure-bites`, `fill-bust-hem`) imports it.
- **AC2 (behaviour FROZEN — deterministic proof):** On the current 22 enemy PNGs, all asset gates pass in fixpoint (re-run = no-op): `fill-sprite-holes --check`, `retouch-flash-halos --check`, `restore-figure-bites --check` (if present), `fill-bust-hem --check`, and `check-sprite-integrity` baseline unchanged. `measure-muzzle-anchors` re-run leaves `src/game/levels/levelArt.json` **byte-identical**. Zero PNG bytes change.
- **AC3 (connectivity explicit):** 4-conn vs 8-conn is an explicit parameter on labeling/flood/mask APIs — no baked default that hides intent. Each call site carries a comment stating which it uses and why (must match today's de-facto behaviour exactly; this is documentation, not a tuning change).
- **AC4 (unit tests):** Pure functions get unit tests. `scripts/` has no test harness today — decide and state where: a Vitest suite importing the `.mjs` pure fns (e.g. `scripts/lib/__tests__/morphology.test.ts`) wired into the existing `yarn test` run. Cover both connectivities, holes, disk radii, border seeding on small fixtures.
- **AC5 (docs):** `scripts/SCRIPTS.md` updated (note the shared lib + which scripts consume it); every "Re-sync if that script's morphology changes" comment removed and replaced by the import.
- **AC6 (verified):** `rtk tsc` + `rtk vitest` + `rtk lint` green.
- **AC7 (merge gate):** Full code-review panel before merge (per COLLABORATION.md).

## Lanes (architect owns final partition)

`scripts/` is one lane (`dev-tooling-assets`). No `src/game`/`src/render`/`src/hooks` touched, so **no cross-lane split** — but hand to `senior-architect` first because it adds `scripts/lib/` (a new tooling boundary) and wires script tests into Vitest. Log the hand-off in `docs/agent-handoffs.md`.

## Out of scope

Any threshold/behaviour tuning · any PNG byte change · the magenta-background generation lever (separate story) · any change to game/render/hooks code · adding new morphology capabilities beyond what the scripts already use (YAGNI).
