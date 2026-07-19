# 0049 — Flyer occlusion-shadow exception & breakpoint-dependent roving axis

- **Status:** Proposed
- **Date:** 2026-07-19
- **Related:** [ADR-0021](./0021-pre-game-print-system-and-title-phase.md) D3/D4 (the
  `src/render/ui/print/tokens.ts` single-source and "pure view interaction stays out of
  `src/hooks/`" principle), [ADR-0024](./0024-pregame-landscape-layout.md) (the
  short-landscape rack `pointer: coarse`, `max-height: 480px` media guard this ADR must
  not double-match), [ADR-0046](./0046-render-css-modules-and-token-bridge.md) (CSS
  Modules + tokens.ts→CSS-var bridge), `docs/art-direction.md` §2bis.2 (Matérialité du
  flyer), `docs/game-design/ux/flyer-wall-format.md` (PASSED design gate 2026-07-19),
  `docs/handoffs/story-flyer-paper-materiality.md`.

## Context

Story `flyer-paper-materiality` (Bertrand: the NIVEAUX flyers read as flat colour
squares, and the desktop layout renders as full-width horizontal bands instead of an
A5 portrait sheet; the tape reads as drawn lines, not stuck-on tape). Two of its
decisions are cross-cutting enough to record:

1. **Art direction** (`docs/art-direction.md` §2bis.2 pt3) specifies a guillotine-cut
   `clip-path` silhouette plus a soft, neutral **ink-black occlusion shadow**
   (`rgba(20,18,16,0.35)`, ~2px y offset, ~6px blur) anchoring the sheet to the wall —
   an explicit, narrowly-scoped exception to §2bis's zero-glow law, which bans
   `box-shadow` only because it is normally used to fake **coloured light with
   falloff**. A neutral ink-black contact shadow is the opposite: it removes light,
   it does not emit it.
2. **UX spec** `docs/game-design/ux/flyer-wall-format.md` (PASSED, `lead-game-designer`
   design gate 2026-07-19) §2 fixes the desktop "bandes horizontales" bug with a
   `flex-wrap` grid activating at wall width **≥ 640px**, each flyer capped at
   `FLYER_MAX_WIDTH_PX = 280`. At that same breakpoint, keyboard roving focus over the
   flyers flips from vertical (Up/Down, list order, single column) to horizontal
   (Left/Right, list order, `wrap: false`) to match the row-wrap visual order — "mirrors
   the precedent already set for the short-landscape rack" (§2).

Forces from the code:

- `clip-path` on an element clips everything painted on that element, including a
  `box-shadow` — the shadow gets cut away with the corners it was meant to sit outside
  of. `filter: drop-shadow(...)`, by contrast, is computed from the element's alpha
  silhouette **after** clipping, so it follows the cut edge instead of being erased by
  it — the physically correct behaviour for a shadow cast by a guillotine-cut sheet.
- `LevelFlyer.tsx` (`src/render/ui/menu/LevelFlyer.tsx`) currently renders one `.flyer`
  div holding both the card content and a sibling `<TapeCorner />`; `LevelFlyer.module.css`
  ships `box-shadow: none` on `.flyer` today. Introducing `clip-path` directly on that
  div would also clip `TapeCorner`, which must overhang the cut edge to read as tape
  stuck across a seam — clipping it would silently erase the "stuck on" read §2bis.2
  pt6 is written for.
- `useRovingIndex` (`src/render/ui/print/useRovingIndex.ts`, ADR-0021 D3/D4) takes its
  `axis` as a **static** prop at call time (`"vertical" | "horizontal"`); nothing in the
  render layer currently re-derives it as the viewport crosses a breakpoint.
- The short-landscape rack (ADR-0024) already occupies the `(orientation: landscape)
and (max-height: 480px) and (pointer: coarse)` media condition and keeps **vertical**
  roving inside its scrollable column; a naive "flip to horizontal above 640px width"
  rule must not also fire inside that rack's own footprint, or the two roving-axis
  rules double-match and disagree.
- `src/hooks/**` is documented (CLAUDE.md, ADR-0021 D4) as the sole game↔R3F bridge;
  breakpoint detection for a menu-only keyboard-nav axis is pure view interaction, not
  a bridge concern, and belongs in the render layer for the same reason ADR-0021 D4 and
  ADR-0024 D1 gave for the print tokens and the CSS-first short-landscape reflow.

## Decision

### D1 — The occlusion shadow ships as `filter: drop-shadow(...)`, never `box-shadow`, via a DOM restructure that isolates the clip

`§2bis.2`'s occlusion shadow is implemented as `filter: drop-shadow(1px 3px 6px
rgba(20,18,16,.35))` on the clipped element, not as `box-shadow`. `drop-shadow` is
computed from the post-clip alpha silhouette, so it hugs the guillotine-cut edge
instead of being clipped away with it — more physically correct for a sheet with a
non-rectangular cut, and the only mechanism that survives `clip-path` at all.

The flyer DOM is restructured to give the clip a home that does not also swallow the
elements that must overhang it:

```
.flyer            (unclipped wrapper — hosts layout, transform/tilt/jitter, TapeCorner)
 ├─ .paper         (clipped: clip-path guillotine polygon + drop-shadow filter + content)
 ├─ <cut-line svg> (sibling of .paper — the 1px blade-crushed edge line, §2bis.2 pt2)
 └─ <TapeCorner />  (sibling of .paper — must overhang the cut edge, never itself clipped)
```

`.flyer` stays the unclipped positioning/transform root (rotation, jitter, pull
transform stay exactly where they are today); `.paper` is the new inner element that
carries `clip-path` and the `drop-shadow` filter together, so the shadow silhouette and
the clip silhouette are always the same shape by construction. Tape and the cut-line
mark are **siblings** of `.paper`, not children — they are drawn on top of the wall,
not through the clipped card, so they are never accidentally clipped.

**Do not** revert to `box-shadow` on any clipped flyer element — it will be silently
erased by the clip. **Do not** move `TapeCorner` (or the cut-line svg) inside `.paper`
— it will be clipped and lose the "stuck on across the seam" read §2bis.2 pt6 exists
for.

### D2 — Roving-focus axis becomes breakpoint-dependent via a new render-layer `useMediaQuery` hook

The flyer wall's `useRovingIndex` axis flips **vertical → horizontal** at the same
`≥ 640px` wall-width breakpoint the wrap-grid activates at
(`docs/game-design/ux/flyer-wall-format.md` §2), so keyboard order always matches
visual order. The query is additionally guarded with `min-height: 481px` — one pixel
above ADR-0024's `SHORT_LANDSCAPE_MAX_H = 480`, so the two breakpoints are disjoint by
construction and the short-landscape rack (which keeps **vertical** roving inside its
scrollable column, unchanged) can never double-match the horizontal rule:

```
(min-width: 640px) and (min-height: 481px)
```

The list order the axis walks is unchanged (tutorial, belliard, stalingrad, vitry);
only the arrow-key mapping and `wrap` follow the breakpoint.

This is delivered by a new, SSR-safe `useMediaQuery(query: string): boolean` hook
living in `src/render/ui/print/`, colocated with `useRovingIndex` and the other print
primitives — **not** `src/hooks/**`. This is the same placement rationale ADR-0021 D4
gave for `useRovingIndex` itself: the query answers "what should the menu's keyboard
navigation do", which bridges nothing to game logic, so putting it in `src/hooks/`
would dilute that folder's one documented job (the game↔R3F bridge). "SSR-safe" means
the hook guards `window.matchMedia` behind a `typeof window !== "undefined"` check so
it does not throw during any non-browser test environment; it is standard
`matchMedia`-and-`change`-listener wiring, no polyfill.

## Consequences

**Positive**

- The occlusion shadow renders correctly on a non-rectangular clip without any
  specificity fight or duplicated silhouette — `.paper`'s `clip-path` and its
  `drop-shadow` filter are computed from the same element, so they cannot drift apart.
- `TapeCorner` and the cut-line mark keep overhanging the cut edge exactly as
  §2bis.2 pt2/pt6 intend, because the DOM restructure makes "never clip the tape"
  structural rather than a rule a future edit could silently violate by moving a `<div>`.
- Keyboard order matches visual order at every breakpoint by construction: the same
  `640px` threshold drives both the CSS wrap-grid (design lane) and the roving axis
  (this ADR), so the two cannot disagree.
- The `min-height: 481px` guard makes "the short-landscape rack keeps vertical roving"
  true by construction, not by review vigilance — the two media conditions are
  mutually exclusive.

**Negative / costs**

- One more DOM level (`.flyer > .paper`) on every flyer card; any future style or test
  that assumed `.flyer` was the outermost _and_ the only styled box must be re-checked
  against which element now owns which concern (transform/tilt lives on `.flyer`; clip
  - shadow + content live on `.paper`).
- A new hook (`useMediaQuery`) is added to the render layer's public surface; it must
  stay a thin `matchMedia` listener and must not grow into a general "viewport info"
  hook that tempts a future author to reach for it in `src/hooks/**` instead (the same
  drift ADR-0021 D4 and ADR-0024's D1 "gotcha" already guard against for `useRovingIndex`
  and `useOrientation` respectively).
- This amends ADR-0021 (the print-token/print-primitive contract gains a shadow
  mechanism and a new hook) and ADR-0046 (the CSS Modules + tokens bridge gains a
  `drop-shadow` filter value and a `clip-path` rule that must reference the same
  deterministic per-flyer geometry table, not `Math.random`) — it does not supersede
  either.

**Gotchas to watch**

- **Do not put `box-shadow` back on a clipped flyer element** — `clip-path` erases it;
  only `filter: drop-shadow(...)` on `.paper` survives the clip.
- **Do not move `TapeCorner` or the cut-line svg inside `.paper`** — they must stay
  siblings so the clip never touches them.
- **Do not widen `useMediaQuery` into `src/hooks/**`** in a later refactor — it is pure
view interaction, same rationale as `useRovingIndex` (ADR-0021 D4).
- Deterministic per-flyer geometry (the guillotine-edge `clip-path` vertex table, the
  tape fray/crease tables) is seeded like `FLYER_REST_ROTATION_DEG` — indexed by list
  position, never `Math.random` — and lives in `src/render/ui/print/tokens.ts`
  alongside it, per ADR-0021 D3's single-source discipline.
- The multiply-blend toner grain (§2bis.2 pt1) tuned to keep black ink at AA contrast
  (≥4.5:1) on rose/orange is a visual regression risk the screenshot/composite gate
  must cover, not something this ADR's mechanism decisions can guarantee by themselves.
