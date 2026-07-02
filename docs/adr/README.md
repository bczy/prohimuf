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

| ADR                                              | Title                                         | Status   |
| ------------------------------------------------ | --------------------------------------------- | -------- |
| [0001](./0001-github-pages-deployment.md)        | GitHub Pages deployment via `gh-pages` branch | Accepted |
| [0002](./0002-cargo-delivery-core-loop-state.md) | Cargo delivery in core game state             | Accepted |
