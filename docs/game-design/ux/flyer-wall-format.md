# UX spec — NIVEAUX flyer-wall FORMAT (proportion + width cap, not stock/texture)

**Surface:** MENU shell, rubrique NIVEAUX — `FlyerWall.tsx` + `FlyerWall.module.css`,
`LevelFlyer.tsx` + `.module.css`. **Author:** `ux-designer` (Tony) · **Date:** 2026-07-19.
**Status:** PASSED — `lead-game-designer` (Karim) design gate 2026-07-19.
`FLYER_MAX_WIDTH_PX = 280` ratified as the single shared width; reconciles
`art-direction.md` §2bis.2 pt5 (was "~300–340 px") down to 280. The dense-overlap /
wider-rotation pile re-tuning in art §2bis.2 pt5 is deferred out of this story — the
desktop wall is the wrap-grid defined in §2 below.
**Amends:** `pre-game-experience-ux.md` §3.2 ("near-full-width" stack) and §3.4 (flyer
min-height) for the format axis only. Everything else in §2.3/§3.2/§4.1 (tilt/jitter
tokens, tape corners, unlock predicate, 8-line copy budget) is unchanged.
**Not this spec's lane:** the paper texture/grain/shader itself is `lead-art` (Nico) —
this spec fixes the box shape only.
**Verified on real runs** (Playwright, `verify` skill, 2026-07-19): desktop 1440×900 —
one flyer spans the full 1440 px canvas width (the reported "bandes horizontales").
Narrow viewport 390×844, desktop UA — flyer reads ~358×230 px, wider than tall.
**Finding to flag, not re-decide here:** a true mobile device held portrait never
reaches this screen — `App.tsx` `rotateBlocked = IS_MOBILE && isPortrait` (ADR-0003)
locks every phase, MENU included, behind "TOURNEZ VOTRE APPAREIL" until landscape
(confirmed live: mobile UA + 390×844 portrait shows only the rotate overlay). So the
narrow/"portrait-shaped" case below is reached via a **narrow browser window** (any
pointer) or, if ADR-0003 ever loosens, a portrait tablet/phone — not literal mobile
portrait play. Breakpoints below are therefore **width-based**, not pointer/UA-based.

## 1. Proportion: A5 portrait, enforced as a target ratio, not a min-height

`aspect-ratio: 148 / 210` on `.flyer` (replaces the current no-cap flex column). This
is a **target**, not a hard clip: `min-height` stays `auto` (the CSS default), so if a
flyer's content ever needs more room than the ratio gives, the box grows taller — it
never scales, clips, or scrolls the text. Checked against real copy: at the 280 px
width below, ratio height ≈ 397 px; measured content height is ≈ 264 px (playable, the
tallest of the three: crew+name+record ~60, difficulty stamp+AMBIANCE ~44, slogan ~37,
4 info lines ~66, stats ~25, padding 32) — tutorial and locked bodies are shorter. All
three fit with ≈130 px to spare; the leftover space at rest is a **lead-art** call
(texture/torn edge/extra stamp), not this spec's.

## 2. Wide layout (row/wrap — fixes the horizontal bands)

Activates at **wall width ≥ 640 px** (any pointer — this is what fixes desktop). Layout:
`flex-wrap: wrap; justify-content: center; gap: 24px` (`SPACE.xxl`), each flyer
**`max-width: 280px`** (reuses the value already shipped for the short-landscape rack —
promote it to one shared token, e.g. `FLYER_MAX_WIDTH_PX = 280`, instead of two
hardcoded 280s). At 1440 px this fits 4 across with room; at 640 px exactly 2 across
(280+24+280 = 584 ≤ 608 px content width after 16 px padding). No flyer ever stretches
past 280 px — the "bande" reading is structurally impossible.

**Roving axis flips to horizontal at this breakpoint** (mirrors the precedent already
set for the short-landscape rack in `pregame-landscape-ux.md` §3.2): Left/Right cycle
flyers in **list order** (tutorial, belliard, stalingrad, vitry — unchanged, no
reorder), `wrap: false`. Below 640 px the axis stays **vertical** (unchanged).

## 3. Narrow / single-column (< 640 px, not short-landscape)

Same `aspect-ratio`, same `FLYER_MAX_WIDTH_PX = 280` cap, **`width: min(100%, 280px)`,
centered** (not stretched to the container). On a 390 px window this leaves small side
gutters (pinned-on-a-wall read, not full-bleed); on a 320 px window the flyer is
effectively full-width. Column stack, axis vertical — unchanged.

## 4. Short-landscape rack (ADR-0024, `pointer:coarse`, unchanged, not reopened)

Keeps its existing fixed **280 px** slot width — now the _same_ named constant as §2/§3,
one source of truth. **Ratio is explicitly waived here**: the rack's content band is
budgeted at ~300 px tall (`pregame-landscape-ux.md` §3.2); A5 at 280 px wide needs
~397 px, which the breakpoint cannot afford. Slots keep filling the available column
height as today. This is the only surface still allowed to horizontal-scroll.

## 5. Accessibility

- **Touch target ≥ 44 px:** inherited, not re-derived — every flyer box is ≥ 280×300 px
  in all four states, far above the floor.
- **Focus marker circle:** unaffected — `MarkerCircle` wraps the full card in every
  layout, so it traces whichever box is active; no change needed.
- **Reduced motion:** unaffected — the rest-state tilt/translate is a static transform,
  not an animation; `aspect-ratio` introduces no new motion.
- **No horizontal scroll on desktop or the narrow column:** §2 uses `flex-wrap: wrap`
  (never `nowrap` + `overflow-x`); §3 caps width ≤ container. Only §4 (short-landscape,
  pointer:coarse) scrolls, by existing design.

## Acceptance criteria (screenshot-verifiable, both device classes)

1. At ≥640 px width: flyers wrap in a centered row, each ≤280 px wide, none spans the
   full container width.
2. At <640 px, non-short-landscape: single column, each flyer `min(100%,280px)`,
   centered, not edge-to-edge.
3. All three flyer bodies (playable/tutorial/locked) render with zero clipped/cut text
   in every breakpoint above.
4. Short-landscape rack (`pointer:coarse`, height ≤480, landscape) is pixel-unchanged
   except sharing the `FLYER_MAX_WIDTH_PX` constant.
5. Keyboard: Left/Right cycles flyers in list order at ≥640 px; Up/Down does the same
   below 640 px; no dead focus state.
6. No horizontal scrollbar/overflow at desktop or narrow-column widths.
