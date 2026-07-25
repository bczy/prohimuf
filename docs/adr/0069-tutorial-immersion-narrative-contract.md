# 0069 — Tutorial immersion narrative contract (decor context + mechanic cue diagrams)

- **Status:** Proposed
- **Date:** 2026-07-25
- **Number:** 0069, allocated by `producer` (Marion) at story opening in
  `docs/handoffs/story-tutorial-immersion-overhaul.md` (stage 0, 2026-07-25), to be re-checked at merge.
- **Amends:** [ADR-0012](./0012-optional-scripted-tutorial-stage.md) (tutorial informative surface),
  [ADR-0015](./0015-device-forked-tutorial-script.md) (fork-only controls invariant),
  [ADR-0020](./0020-code-drawn-gesture-icons.md) (gesture channel),
  [ADR-0023](./0023-narrative-scene-location-backdrop.md) (scene-scoped backdrop channel).

## Context

The current tutorial contract is intentionally simple:

- scene décor channel: `NarrativeScene.backdrop?`;
- one primary panel cue at line scope: `image? | gesture? | diagram?`;
- render-only drawing in `NarrativeScreen`, with game data remaining pure in `src/game`.

The immersion overhaul now needs richer teaching without boundary leaks:

1. tutorial panels should be allowed to carry décor context (today tests pin tutorial backdrop as absent);
2. tutorial must teach active threat reads, including projectile/bullet perception, crate/weapon flow,
   threat priority, and boss-finale switch, via visual cues;
3. existing pre/post narrative scenes must remain backward compatible and unchanged by default.

The lane law remains strict: no React/Three in `src/game`, no gameplay rules in `src/render`.

## Decision

Keep the existing narrative channel model and extend it additively.

### D1 — Reuse scene-level backdrop channel for tutorial context

`NarrativeScene.backdrop?` stays the only décor-context channel and is now valid on tutorial scenes too.
No new décor field is introduced.

### D2 — Extend the existing diagram channel for active threat teaching

`DiagramKind` is extended with immersive tutorial mechanic cues (render-side drawings only):

- `shot-read-player-vs-enemy-bullet`
- `weapon-crate-loop`
- `threat-hierarchy-ladder`
- `boss-finale-switch`

`hostage-ring` remains unchanged.

Each value remains a pure token in `src/game`; render maps tokens exhaustively to code-drawn diagrams.

### D3 — Keep one primary cue per panel; add optional text reinforcement channel

Primary cue exclusivity remains: each line uses at most one of `image` / `gesture` / `diagram`.
To support short risk/action reminders, `NarrativeLine` gains an optional additive text-reinforcement field:

```ts
readonly teachingBullets?: readonly string[];
```

Contract rule: max 2 bullet lines per panel (enforced by tests/spec), absent by default.

### D4 — Preserve fork-only-on-controls structure and selection seam

Desktop/mobile divergence remains restricted to control panels (`gesture` lines), selected in `App.tsx`
via the existing once-at-load `TUTORIAL_SCENE` branch. New immersive gameplay-teaching panels are shared by
reference between variants.

### D5 — Preserve backward compatibility

- Existing `PRE_LEVEL_NARRATIVE` / `POST_LEVEL_NARRATIVE` data remains valid with no required edits.
- Existing tutorial lines without new fields render exactly as before.
- Asset-preload behavior remains explicit: diagram cues are code-drawn; if tutorial backdrops are authored,
  tutorial manifest inclusion is updated in `assetManifest.ts`.

## Consequences

### Positive

- Immersion goals are met by extending existing channels, not by ad-hoc render props.
- Boundary law stays intact: game declares intent tokens + text, render owns pixels and motion.
- Existing narrative content remains compatible; migration is incremental panel-by-panel.

### Negative / costs

- New token values and `teachingBullets` add invariant surface (tests must be expanded).
- Tutorial preloader may need updates when tutorial backdrops differ from current warmed assets.
- Render lane must maintain an exhaustive diagram map as the union grows.

### Gotchas

- Do not encode visual implementation details (timings, colors, coordinates) in game data.
- Do not stack multiple primary cue channels on one panel.
- Keep tutorial optional/skippable and persistence-inert (no progress/score side effects).
