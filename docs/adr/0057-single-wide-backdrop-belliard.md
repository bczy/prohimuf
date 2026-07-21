# 0057 — Single-wide backdrop mode (belliard décor image unique)

- **Status:** Proposed
- **Date:** 2026-07-21
- **Number:** 0057, allocated by `producer` (Marion) at story opening (recorded in
  `docs/handoffs/story-belliard-decor-single-image.md`), re-checked at merge.
- **Amends:** ADR-0048 (tronçon-sequence backdrop mode).

## Context

Rue Belliard's décor was planned as three variable-width tronçons (a, b, c) per ADR-0048,
tiling side-by-side with a separate parallax sky showing through rooflines and inter-building
gaps. Art direction has since validated a validated single wide-format image
(`street-wide.png`, 6656×1248, aspect ≈5.333, generated via `scripts/gen-street-paid.mjs` +
`scripts/stitch-belliard-street.mjs`, PR #122, branch `claude/belliard-decor-v3-clean`) as a
simpler, opaque replacement.

**Belliard's gameplay scope remains unchanged:** `enemiesToWin: 10`, `timeSeconds: 90`,
courier street, hostage QTE anchor at `(9.9, 3.5)`, scripted delivery, 13 near-foreground
props (ADR-0047) re-positioned for the new ≈27%-narrower world (≈87.4 → ≈64 world units
`fullW`). **Design gate** (game-designer playtest, AC4–AC6 in the story spec) re-validates
window pop zones, prop placement, and difficulty on the narrower backdrop before dev lanes ship.

**Render coupling:** `LevelBackdrop.tsx` / `GameScene.tsx` branch on `layout.mode` to dispatch
the backdrop strategy; window-zone detector (`backdropLayout.test.ts` frozen contract per
ADR-0048) must be amended to handle single-tile layout with one opaque image and no
transparent sky gaps.

**API change surface:** `BackdropLayout` type (from ADR-0048) remains the abstraction; the
single-wide mode is a third variant alongside `single-facade` and `troncon-sequence`.

## Decision

_To be authored by `senior-architect` (Winston). Scaffolded by Marion._

## Consequences

_To be authored by `senior-architect` (Winston). Scaffolded by Marion._

## References

- ADR-0048 (backdrop layout abstraction, troncon-sequence mode)
- ADR-0047 (near-foreground props)
- Story spec: `docs/handoffs/story-belliard-decor-single-image.md` (§1–2 design read,
  repositioning spec §3–4)
- Design spec: `docs/game-design/spec-belliard-street-wide-repositioning.md` (windows §1,
  barrières props §2, difficulty §3, coherence §4, exclusion zones)
- Art asset: `public/assets/levels/belliard/street-wide.png` (6656×1248, non-standard
  pipeline; see story notes for regeneration guard)
- Render: `src/render/scene/LevelBackdrop.tsx`, `src/render/scene/GameScene.tsx`,
  `src/render/scene/ForegroundFrames.tsx`
- Game data: `src/game/levels/levelArt.ts` (BackdropLayout contract), `src/game/levels/levels.ts`
  (belliard level config), `backdropLayout.test.ts` (frozen contract, to be amended AC8)
