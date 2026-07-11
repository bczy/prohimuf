# 0008 — Two-axis swipe pan and fullscreen toggle

- **Status:** Accepted
- **Date:** 2026-07-11

## Context

ADR-0003 made muf playable on phones: a blocking rotate overlay, a two-finger
tap-to-shoot / one-finger drag-to-pan touch model, and inertial camera pan as a
pure game system. Two gaps surfaced in on-device use, both anticipated by 0003:

- **Pan was X-only.** ADR-0003 D4 modelled `CameraPan { x, vx }` and only
  clamped/scrolled horizontally, matching the desktop edge-scroll it borrowed
  from. But the mobile framing multiplies zoom by `MOBILE_ZOOM_FACTOR` (D4),
  which crops the facade vertically as well as horizontally — targets near the
  top/bottom of the facade became unreachable. The facade is taller than the
  mobile viewport, so a vertical axis is needed, not optional.
- **Fullscreen was deferred.** ADR-0003 closed by listing "fullscreen +
  `screen.orientation.lock()` where supported" as optional progressive
  enhancement, explicitly rejected as the _primary_ landscape mechanism (the
  rotate overlay is that). Address-bar chrome and accidental portrait still
  degrade the mobile experience when the affordance is absent.

This ADR **extends ADR-0003** (it does not supersede it): the rotate overlay
remains the primary landscape guarantee; two-axis pan generalises D4; fullscreen
is adopted as a support-gated affordance, not a mechanism the game depends on.

A vertical-aim defect (WI-3) was found while extending pan: the fire pipeline
threaded only `cameraOffsetX`, so shots fired while panned vertically landed at
the wrong world Y. Fixing it is inseparable from adding the Y axis and ships
here.

## Decision

- **Two-axis pan.** `CameraPan` extends from `{ x, vx }` to a flat
  `{ x, y, vx, vy }` (kept flat, not nested, to preserve ADR-0002's cost
  reasoning — pan stays a ref in `useGameLoop`, never a `GameState` field). The
  pure `cameraPanSystem` (`applyDrag`/`releaseFlick`/`tickCameraPan`) gains the
  Y axis using the **same** `PAN_DAMPING` (λ) and `PAN_REST_EPSILON` constants,
  with **per-axis independent** clamp, velocity-kill on clamp, and rest below ε
  — X and Y do not couple. `rangeY = (facadeH − viewH)/2`, mirroring the
  existing `rangeX = (fullW − viewW)/2`.
- **Sign asymmetry (bridge-only).** Screen-space Y grows downward while world-Y
  grows upward, so the hook negates the Y drag/flick delta relative to X when
  converting normalized touch deltas to world units. This sign flip lives in the
  bridge (`useTouchControls` / `useGameLoop`), not in the pure system, which
  stays sign-agnostic.
- **Vertical aim fix (WI-3).** `cameraOffsetY` is threaded through
  `tickGameState → fireBullet → crosshairToWorld`/delivery-proximity exactly as
  `cameraOffsetX` already was (ADR-0002's single-source-of-truth invariant now
  holds on **both** axes: taps, bullets and delivery proximity all flow through
  `crosshairToWorld(viewW, viewH) + { cameraOffsetX, cameraOffsetY }`).
- **Fullscreen toggle as a support-gated affordance.** New `useFullscreen()`
  hook (bridge, view-side) and `FullscreenButton` (render/ui):
  - **Detection:** `document.fullscreenEnabled ?? webkitFullscreenEnabled`,
    computed once. iPhone Safari has no element fullscreen API (still true in 2026) ⇒ `isSupported` false ⇒ the button renders nothing.
  - **Enter:** `document.documentElement.requestFullscreen({ navigationUI:
"hide" })`, falling back to legacy `webkitRequestFullscreen()` (no options).
    After the promise resolves, **only on mobile** (`detectMobile()`), attempt
    `screen.orientation.lock("landscape")` — desktop Chrome throws
    `NotSupportedError` and Safari lacks `lock`, so the call is
    catch-swallowed; the rotate overlay remains the real landscape guarantee.
  - **State:** initialised from `document.fullscreenElement ??
webkitFullscreenElement` at mount (the button remounts across app phases and
    must stay correct), then updated **only** via `fullscreenchange` +
    `webkitfullscreenchange` document listeners. Esc/F11/system exits do not
    reach the page as a keydown when the browser consumes them, so events are
    the only reliable source.
  - **Errors swallowed everywhere.** Every fullscreen/orientation promise is
    `.catch(() => {})`; the affordance never throws into the render tree.
  - lib.dom lacks the webkit-prefixed members and dropped
    `ScreenOrientation.lock`; local narrow interfaces (`WebkitDoc`, `WebkitEl`,
    `LockableOrientation`) supply the types with no `any`/`as any`.
- **`data-muf-ui` convention.** Fixed DOM UI layered over the canvas carries a
  `data-muf-ui` attribute. The window-level game gesture handlers (touch lane)
  exempt any target matching `[data-muf-ui]` before calling `preventDefault`, so
  the control is tappable in-game on mobile. `FullscreenButton` is the first
  adopter; this is established as **the** convention for future overlay UI. The
  button sits at `zIndex: 300` (above `RotateOverlay` 200 and `PauseScreen`
  100).

## Consequences

Positive:

- Every target on the facade is now reachable on mobile; the pan model is
  symmetric and still fully deterministic/unit-testable per axis (the pure
  `cameraPanSystem` extension keeps ADR-0003's damping guarantees).
- Aiming's single source of truth is strengthened again: the ADR-0002 invariant
  now holds on both axes, and the WI-3 vertical-aim defect is closed.
- Fullscreen is opt-in, support-gated, and cannot break unsupported browsers —
  it hides itself rather than erroring.
- `data-muf-ui` gives every future overlay control a one-line contract for
  surviving the mobile gesture layer.

Negative / gotchas:

- **Testing asymmetry:** `useFullscreen` and `FullscreenButton` are
  browser-API/DOM-event plumbing (fullscreen, `screen.orientation`, remount
  state) — not unit-tested, verified in the browser, consistent with how
  ADR-0003 treated `useOrientation`/`useTouchControls`. The pure
  `cameraPanSystem` Y-axis extension stays under TDD.
- On iPadOS Safari a swipe-down from the top can exit fullscreen (system
  gesture); we cannot suppress it. Accepted — the rotate overlay and normal
  layout still function outside fullscreen.
- `orientation.lock` is best-effort: where it is unavailable the user may still
  land in portrait, which the ADR-0003 rotate overlay already handles.
- The vertical-aim fix (WI-3) ships coupled to this pan change; a regression in
  one axis of `cameraOffset*` threading would surface as mis-aimed shots on that
  axis only.
