# Technical research — muf

The `tech-scout` lane's writable surface (Nadia 🔭). One report per investigation
(`research-<slug>.md`): a sourced feasibility survey — options compared on cost /
quality / integrability vs muf's constraints (budget ≈ 0€, no local GPU, CI GitHub
Actions, fanzine B&W + acid-neon style) — ending in a concrete recommendation for the
architect. Produced with the [`deep-research`](../../.claude/skills/deep-research)
harness (fan-out search → adversarial verification → cited synthesis).

These reports **inform** decisions; they do not make them. The decision that follows is
`senior-architect`'s and lands as an ADR (`docs/adr/`). See the lane definition in
[`.claude/agents/tech-scout.md`](../../.claude/agents/tech-scout.md) and its place in the
pipeline (TECH PLAN, stage 3) in
[`.claude/agents/COLLABORATION.md`](../../.claude/agents/COLLABORATION.md).

## Index

| Report | Question | Date | Confidence |
| --- | --- | --- | --- |
| [research-2d-sprite-animation](./research-2d-sprite-animation.md) | Proven ways to generate coherent 2D sprite animation by AI, fitting muf's free/no-GPU/CI pipeline | 2026-07-18 | Mixed (14 claims 3-vote confirmed; synthesis by hand) |
