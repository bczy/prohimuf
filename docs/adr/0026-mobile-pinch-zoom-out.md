# 0026 — Mobile pinch-to-zoom-out (two-finger spread controls the framing)

- **Status:** Proposed
- **Date:** 2026-07-15
- **Related:** [ADR-0003](./0003-mobile-touch-controls-and-camera-pan.md) (mobile
  touch scheme — one finger pans, two-finger tap shoots; `MOBILE_ZOOM_FACTOR`
  cover framing; the pan clamp and its `viewW`/`viewH` extents), `docs/architecture.md`
  (the game ↔ render ↔ hooks boundary law).

## Context

ADR-0003 zooms the mobile camera **in** past the desktop cover framing
(`MOBILE_ZOOM_FACTOR = 1.7`) so targets stay finger-sized, and reaches the
resulting overflow with a one-finger inertial pan. That fixed framing is the
only framing: on a wide facade the player cannot pull back to see more of the
street at once, only pan across it a viewport at a time. On real devices this
makes it hard to read where the next threats are.

The two-finger gesture is already spent on the "tap = shoot" action
(ADR-0003), and a pinch keeps the midpoint roughly still — so a naive pinch
would have registered as a shot. Any zoom scheme has to coexist with that.

## Decision

- **D1 — A two-finger pinch drives a persistent zoom fraction.** The base
  (ADR-0003) framing becomes the **maximum** zoom; a pinch backs out from it
  down to **2×** (`MIN_ZOOM_FRACTION = 0.5`), and a spread zooms back in, capped
  at the base (`MAX_ZOOM_FRACTION = 1`). The committed fraction persists across
  gestures so the player stays where they left the framing. Mapping is the live
  spread ratio scaled onto the committed zoom, clamped — a pure, unit-tested
  helper `nextZoomFraction` in `src/hooks/useTouchControls.ts`.

- **D2 — The pinch disqualifies the tap.** `useTouchControls` tracks the
  normalized finger spread on the existing two-finger `mode`. Once the spread
  changes past a dead-zone (`PINCH_MIN_DELTA`), the gesture is marked as drifted
  — exactly like the midpoint-drift guard — so a zoom never also fires a shot.
  A still two-finger tap changes the spread by ~0, leaves the zoom untouched,
  and still shoots.

- **D3 — Zoom is applied in the bridge, before the pan clamp.** `useGameLoop`
  receives the base zoom via `MobileControls.baseZoom` and, each frame, sets
  `ortho.zoom = baseZoom × touch.zoom` **before** deriving `viewW`/`viewH`. This
  keeps the pan clamp coherent within the same frame: zooming out widens the
  view and shrinks the pan range. Because a pinch can shrink the range under a
  resting camera, the pan is re-clamped to range every frame (the inertial
  `tickCameraPan` only clamps while a glide is active).

- **D4 — Boundary.** Zoom is viewport state, not a game rule, so — like the pan
  (ADR-0003) — it lives in the hooks bridge, never in `GameState`. The
  clamp/ratio math is a pure function so it stays testable without a game rule
  leaking into `src/game/**` or React leaking into pure logic.

## Consequences

- Desktop is untouched: `baseZoom` is passed only when `isMobile`, and the
  desktop static-zoom `useEffect` still owns `ortho.zoom` there.
- `vitest.config.ts` now includes `src/hooks/**/*.test.ts` (+ an `@hooks` alias)
  so the pure gesture helper is covered.

## Scope note (cahier des charges)

Prohibition (Atari ST, 1987) had no zoom — this is a **conscious mobile-ergonomics
extension**, not a source-material mechanic. It is justified as an accessibility
affordance for small screens on a wide facade, in the same vein as ADR-0003's
mobile adaptation, and changes no gameplay rule (framing only).
