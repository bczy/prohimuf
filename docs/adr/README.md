# Architecture Decision Records — muf

This directory records **significant, hard-to-reverse decisions** about how muf
is built: module boundaries, deployment, dependencies, the game/render/hooks
contract. Each ADR captures _why_ a choice was made so a future reader (human or
agent) doesn't re-litigate it or break it by accident.

## When to write one

Add an ADR when a change:

- alters module boundaries or the **game ↔ render ↔ hooks** contract
  (see [architecture.md](../architecture.md)),
- introduces or removes a runtime dependency,
- changes how the project is built, deployed, or served,
- or makes any other call that future contributors would benefit from
  understanding the reasoning behind.

Trivial or easily-reversed choices don't need one.

## Format

One file per decision, named `NNNN-kebab-title.md` (zero-padded, incrementing).
Lightweight [Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
style:

```markdown
# NNNN — Title

- **Status:** Proposed | Accepted | Superseded by ADR-XXXX
- **Date:** YYYY-MM-DD

## Context

What forces are at play — the problem, constraints, prior state.

## Decision

What we decided to do.

## Consequences

What follows — positive, negative, and any gotchas to watch for.
```

ADRs are immutable once Accepted: to change a decision, write a new ADR and mark
the old one `Superseded by ADR-XXXX`.

## Index

| ADR                                                        | Title                                                                                    | Status   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- |
| [0001](./0001-github-pages-deployment.md)                  | GitHub Pages deployment via `gh-pages` branch                                            | Accepted |
| [0002](./0002-cargo-delivery-core-loop-state.md)           | Cargo delivery in core game state                                                        | Accepted |
| [0003](./0003-mobile-touch-controls-and-camera-pan.md)     | Mobile support: touch controls, forced landscape, inertial camera pan                    | Accepted |
| [0004](./0004-enemies-car-hostage-taker.md)                | New enemy entities: drive-by car, hostage taker, per-level roster, and the `energy` stat | Accepted |
| [0005](./0005-dynamic-verification-harness.md)             | Dynamic & interactive verification harness (evolve the render farm)                      | Proposed |
| [0006](./0006-directional-sprite-generation.md)            | Directional, mirrored multi-pose sprite generation for car & hostage entities            | Proposed |
| [0007](./0007-shared-harness-library.md)                   | Shared harness library, and rejection of a "harness that creates harnesses"              | Proposed |
| [0008](./0008-two-axis-pan-and-fullscreen.md)              | Two-axis swipe pan and fullscreen toggle                                                 | Accepted |
| [0009](./0009-push-marker-workflow-dispatch.md)            | Push-marker dispatch for manual workflows                                                | Accepted |
| [0010](./0010-art-direction-pipeline.md)                   | Art-direction pipeline: gated prompts, seeded generation, CI gates                       | Accepted |
| [0011](./0011-render-side-neon-rim.md)                     | Render-side emissive neon rim for vehicles (decouple from baked art)                     | Accepted |
| [0012](./0012-optional-scripted-tutorial-stage.md)         | Optional scripted tutorial stage before Rue Belliard                                     | Accepted |
| [0013](./0013-enclosed-island-cutout-pass.md)              | Enclosed-island pass in the shared sprite keyer                                          | Accepted |
| [0014](./0014-sprite-integrity-gate-and-retouch.md)        | Post-cutout sprite-integrity gate and deterministic per-sprite retouch                   | Accepted |
| [0015](./0015-device-forked-tutorial-script.md)            | Device-forked tutorial script (desktop vs mobile controls)                               | Accepted |
| [0016](./0016-flipbook-frame-files.md)                     | Enemy sprite flipbook as separate `_f<N>` frame files + `enemies` manifest block         | Accepted |
| [0017](./0017-layered-courier-flipbook-strip-and-slice.md) | Layered courier flipbook (bike + rider), per-frame generation, atomic per layer          | Accepted |
| [0018](./0018-staffed-production-pipeline.md)              | Staffed production pipeline: design, production, audio and QA lanes with blocking gates  | Accepted |
| [0019](./0019-flash-halo-background-remnant-cleanup.md)    | Flash-halo background-remnant cleanup on the enemy shooting sprites                      | Accepted |
| [0020](./0020-code-drawn-gesture-icons.md)                 | Code-drawn animated gesture icons on the tutorial control panels (reopens ADR-0015 D3)   | Accepted |
| [0021](./0021-pre-game-print-system-and-title-phase.md)    | Pre-game print system: render-layer TITLE phase + single-source print-token module       | Accepted |
