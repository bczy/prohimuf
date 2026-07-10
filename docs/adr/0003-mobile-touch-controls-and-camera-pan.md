# 0003 — Mobile support: touch controls, forced landscape, inertial camera pan

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

muf ships as a static GitHub Pages demo (ADR-0001), and a meaningful share of
visitors arrive on phones. Today they get an unplayable half-experience:

- `src/hooks/useMouse.ts` carries naive `touchstart`/`touchmove` handlers —
  any touch instantly fires a shot **and** moves the crosshair. They were a
  stopgap, never a designed input model, are registered `{ passive: true }`
  (so they can't suppress browser gestures), and are untested.
- There is no orientation handling: the game is a wide horizontal facade, and
  portrait framing makes it illegible.
- The desktop cover framing renders targets too small to hit with a finger.

`_bmad-output/guidelines/PROJECT_GUIDELINES.md` §8 listed
`Mobile-first (desktop browser)` as out of scope. This ADR is paired with an
amendment to §8 **in the same PR**: mobile becomes a _supported_ target while
desktop remains the primary one. The chosen touch scheme respects §5 UX rule 5
("déplacement + une action, appris en 10 secondes"): one finger = move (pan),
two fingers = the one action (shoot).

Prior state of the input/camera model, stated precisely because the decision
leans on it:

- `useMouse` → `MouseState { x, y, pendingShots }`, normalized `[0..1]` from
  the canvas rect; consumed by `useGameLoop` inside `useFrame`; the pure
  entry point is
  `tickGameState(state, fire, mouseX, mouseY, delta, facade, cameraOffsetX, viewW, viewH, …)`.
- `crosshairToWorld` (`src/game/systems/crosshairSystem.ts`) is the single
  source of truth for pointer→world (ADR-0002). It already takes live
  `viewW`/`viewH`, and `useGameLoop` already passes `camera.position.x` as
  `cameraOffsetX` — `VIEW_W = 18` / `VIEW_H = 12` are only defaults.
- **The camera already pans on desktop**: `GameScene.tsx` edge-scrolls
  `camera.position.x/y` imperatively in `useFrame` (`EDGE_ZONE = 0.12`,
  `SCROLL_SPEED = 6`), clamped to `rangeX = (fullW − viewW)/2`, and the zoom
  is dynamic cover framing (`zoom = max(size.width/panelW, size.height/facadeH)`).
  That pan is stateless render-lane code with no velocity — fine for
  edge-scroll, but inertia (velocity + damping + clamping, behaviour the
  player relies on) is rule-like math that per the boundary law belongs in
  `src/game/**` under TDD.
- No damping/inertia primitive exists anywhere (`vec2.ts` has
  add/scale/distance/normalize only).

So mobile does **not** need a new pointer→world mapping — the
`(viewW, viewH, cameraOffsetX)` contract already generalizes. The genuinely
new pure piece is the inertial pan system.

Forced landscape alternatives rejected: `screen.orientation.lock()` requires
fullscreen and is unsupported on iOS Safari; CSS-rotating the page 90° breaks
the `getBoundingClientRect` pointer math and canvas sizing. A blocking
overlay is the robust option.

## Decision

- **D1 — Mobile detection: UA sniffing in a platform util.** New leaf module
  `src/utils/platform.ts` — neither `game` (touches `navigator`) nor `render`
  (no R3F); importable by `render` and `hooks`, never by `game`. Contract: a
  pure, Vitest-testable `isMobileUA(ua: string): boolean` (regex over the
  usual mobile tokens — exact regex is an implementation detail) plus a thin
  `detectMobile(): boolean` reading `navigator.userAgent`. The mode is
  **decided once at app load** in `App.tsx` and never switches mid-session
  (devtools emulation or hybrid devices need a refresh). Known accepted
  limitation: iPadOS Safari presents a desktop UA ⇒ iPads get desktop mode.
- **D2 — Forced landscape via blocking overlay + pause.** New
  `src/render/ui/RotateOverlay.tsx`, same absolutely-positioned DOM pattern
  as `PauseScreen.tsx`; French copy («&nbsp;Tournez votre appareil&nbsp;»),
  fanzine B&W + acid-neon aesthetic. Detection through a new
  `src/hooks/useOrientation.ts` wrapping
  `matchMedia("(orientation: portrait)")` with a `change` listener — this is
  render-driving state, not per-frame, so React state is correct there. The
  overlay shows whenever `isMobile && isPortrait`, across **all** app phases
  (menus included). Effective pause becomes
  `paused || (isMobile && isPortrait)` through the existing `paused` plumbing
  (`App.tsx` → `GameScene` → `useGameLoop`, whose `useFrame` early-returns);
  `PauseScreen` is **not** shown for orientation-pause — the overlay replaces
  it. No timers, no logic outside `useFrame`.
- **D3 — Touch input model: one new hook, superseding `useMouse`'s touch
  handlers.** New `src/hooks/useTouchControls.ts` (bridge lane), mounted only
  on mobile. It exposes a **ref** (no per-frame re-render):
  - `panDeltaX` — accumulated one-finger horizontal drag since last frame,
    normalized to canvas width; consumed/zeroed each frame by the game loop;
  - `flickVelocityX` — normalized velocity captured at `touchend` from recent
    touch history; consumed once;
  - `pendingTaps: Array<{x, y}>` — normalized canvas coords of two-finger tap
    **midpoints**, queued and consumed one per frame (mirrors today's
    `pendingShots`).

  Gesture rules: one finger down = pan, never fires; a two-finger touch that
  ends within a tap threshold (short duration, small movement — thresholds
  are implementation constants) = one shot at the midpoint. Listeners attach
  to the canvas with `{ passive: false }` + `preventDefault`, and the canvas
  gets `touch-action: none`, so two-finger taps don't trigger pinch-zoom /
  double-tap zoom. The naive `onTouchStart`/`onTouchMove` handlers in
  `useMouse.ts` are **removed** — `useMouse` becomes mouse-only. They fight
  the new model (any touch fires) and would double-fire on mobile; this is
  the only behaviour change to existing code.

- **D4 — Camera pan with inertia as a pure game system.** New
  `src/game/systems/cameraPanSystem.ts` + type `CameraPan { x, vx }` in
  `src/game/types/` — zero React/Three imports, TDD mandatory. Contracts:
  - `applyDrag(pan, worldDeltaX, rangeX)` — direct follow while a finger is
    down, `x` clamped;
  - `releaseFlick(pan, worldVelocityX)` — seeds inertia on `touchend`;
  - `tickCameraPan(pan, dt, rangeX)` — exponential damping, chosen for
    frame-rate independence: `vx' = vx·e^(−λ·dt)`;
    `x' = clamp(x + vx'·dt, −rangeX, +rangeX)`; hitting a clamp bound zeroes
    `vx'`; `|vx'| < ε ⇒ vx' = 0` (deterministic rest). λ (≈ 3–6 s⁻¹) and ε
    are exported tuned constants. `rangeX = (fullW − viewW)/2` — the same
    clamp the desktop edge-scroll already uses, so level bounds hold by
    construction.

  **Ownership:** `CameraPan` lives in a ref inside `useGameLoop` (bridge),
  **not** in `GameState`. Pan is viewport state, not a game rule — shots
  already receive the camera as `cameraOffsetX`; and ADR-0002 documented the
  cost of required `GameState` fields (every constructor must seed them) —
  not worth paying here. Rejected alternative: a
  `GameState.viewport {centerX, zoomFactor}` field. The hook converts
  normalized touch deltas to world units (`× viewW`) and calls the pure
  functions; render applies `pan.x` to `camera.position.x` on mobile.

  **Mobile framing:** `GameScene.tsx`'s framing effect multiplies the cover
  zoom by a `MOBILE_ZOOM_FACTOR` (> 1, ~1.7 — tuned later) when mobile. That
  shrinks `viewW`, which enlarges targets and grows `rangeX` with **no game
  code change**. Zoom choice is a render concern; the constant lives in
  render.

- **D5 — Two-finger tap → shot at midpoint through the existing pipeline.**
  Per frame, the mobile branch of `useGameLoop` dequeues at most one entry
  from `pendingTaps` and calls the **unchanged**
  `tickGameState(prev, /*fire*/ true, tap.x, tap.y, …, cameraOffsetX = pan.x, viewW, viewH, …)`
  — the midpoint is fed in as `mouseX`/`mouseY`, the crosshair jumps there,
  and the existing `fireBullet` → `crosshairToWorld + cameraOffsetX` path
  produces the correct world position under any pan/zoom. Zero new mapping
  code, zero signature change — that is the point. Mobile crosshair
  presentation (persistent vs flash-on-shot) is a render/UX detail deferred
  to the implementation story.
- **D6 — Desktop unchanged.** Mouse aiming, click-to-fire, edge-scroll,
  cover framing (full facade visible), HUD, Escape pause — all
  behaviour-identical. `useTouchControls`, `RotateOverlay`,
  `MOBILE_ZOOM_FACTOR` and the pan system are dormant on desktop. (Unifying
  desktop edge-scroll onto `tickCameraPan` is a follow-up, not done here.)

## Consequences

Positive:

- Mobile becomes genuinely playable (bigger targets + pan to reach the rest
  of the facade) without touching a single game rule; the boundary law holds
  — the only new `src/game` code (`cameraPanSystem`) is pure and TDD'd.
- Aiming keeps a single source of truth: taps, bullets and delivery proximity
  all flow through `crosshairToWorld(viewW, viewH) + cameraOffsetX` — the
  ADR-0002 invariant is strengthened, not weakened.
- The exponential damping model is deterministic and unit-testable
  (half-life `= ln2/λ`, clamp kills velocity, rest below ε, independence
  from `dt` slicing).
- Removing `useMouse`'s naive touch handlers deletes an untested, undesigned
  input path.

Negative / gotchas:

- **UA sniffing is brittle**: UA strings are frozen/reduced and spoofable,
  and iPadOS Safari reports a desktop UA ⇒ iPads get desktop controls.
  Accepted for now; a `navigator.maxTouchPoints` refinement is a follow-up.
- Mode is fixed at load: rotating a hybrid device or toggling devtools
  emulation mid-session won't switch modes without a refresh.
- **Behaviour change**: a one-finger touch no longer fires — anyone "playing"
  by tapping today gets new semantics.
- Two-finger gestures collide with browser/OS gestures; the mitigation
  (`touch-action: none`, non-passive `preventDefault`) must be verified on
  iOS Safari and Android Chrome specifically; iOS `100vh`/address-bar quirks
  may affect the overlay and HUD (`dvh` hardening is follow-up material).
- Tap-vs-swipe thresholds are heuristic; bad tuning reads as "dropped shots"
  — needs on-device tuning, not unit tests.
- Testing asymmetry: `cameraPanSystem` and `isMobileUA` are fully
  unit-testable; the gesture hook and orientation overlay are DOM-event
  plumbing, covered by manual on-device passes (Playwright touch emulation
  later), consistent with `useMouse` today.
- HUD and menus were designed for desktop; small-landscape legibility is a
  known gap deferred to a follow-up story.
- Guidelines §8 must ship amended in the same PR, or this ADR contradicts a
  non-negotiable document.

Not in this ADR (follow-up stories):

- Responsive HUD/menu layout for small landscape screens.
- Mobile shot feedback presentation (flash at tap point, hit markers).
- Unify desktop edge-scroll onto `tickCameraPan`.
- `maxTouchPoints`-based detection refinement for iPadOS.
- iOS viewport-unit hardening (`dvh` / `visualViewport`).
- Mobile GPU performance pass (device-pixel-ratio cap, texture budget).
- E2E touch tests (Playwright mobile emulation) and on-device QA checklist.
- Optional progressive enhancement: fullscreen + `screen.orientation.lock()`
  where supported (rejected as the primary mechanism).
