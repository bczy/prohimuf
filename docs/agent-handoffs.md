# Agent Handoffs Log — index

**Do NOT append story entries to this file.** The log is SHARDED: one file per story
under [`docs/handoffs/`](./handoffs/). This file is the front door — the rules, the
template, and the index. `producer` (Marion) curates the index and chases missing
entries; an unlogged hand-off didn't happen (protocol rule #4,
`.claude/agents/COLLABORATION.md`).

## Where to write

- **Story work** (any pipeline stage, any gate verdict) →
  `docs/handoffs/story-<slug>.md`. The file is opened by `producer` at stage 0/1
  (or by the first agent to log, if Marion hasn't run yet — she reconciles).
- **Fix-lane work** (see COLLABORATION.md §fix lane) → one entry in the rolling
  shard `docs/handoffs/fixes.md`.
- **Closed stories** stay in place; Marion flips their index row to `closed`.
  Everything logged before 2026-07-17 lives in
  [`docs/handoffs/archive-2026-07.md`](./handoffs/archive-2026-07.md)
  (read-only history — grep it, don't extend it).

## Entry template (inside a story shard)

```
## <stage-n>. <STAGE> — <agent> (<persona>) — <date>
- claim: <what you take on> / release: <outcome + File List>
- VERDICT: PASS|FAIL — <gate name> (<agent>)     ← gates only, EXACTLY this format
```

The `VERDICT:` line is **machine-parsable on purpose** — one line per gate verdict,
uppercase PASS/FAIL, so Marion (or a script) can audit gate coverage with a grep.
Prose context goes below the line, never inside it.

## Index

| Story shard                                                                            | Status  | Notes                                   |
| -------------------------------------------------------------------------------------- | ------- | --------------------------------------- |
| [archive-2026-07](./handoffs/archive-2026-07.md)                                       | closed  | all pre-shard history (52 story blocks) |
| [story-agent-team-flow-optimization](./handoffs/story-agent-team-flow-optimization.md) | open    | process amendments (ADR-0032)           |
| [story-crew-extension](./handoffs/story-crew-extension.md)                             | closed  | +3 agents Tony/Ben/Otis (ADR-0037)      |
| [fixes](./handoffs/fixes.md)                                                           | rolling | fix-lane one-liners                     |
| [story-remote-session-provisioning](./handoffs/story-remote-session-provisioning.md)   | closed  | remote provisioning hook (ADR-0033)     |
