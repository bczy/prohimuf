---
name: verify
description: Build, launch and drive muf in a headless browser to verify a change end-to-end (screenshots as evidence).
---

# Verifying muf changes at runtime

## Build & launch

Yarn 4 via corepack; the default yarnpkg mirror may be proxy-blocked — route
corepack through npm:

```bash
export COREPACK_NPM_REGISTRY=https://registry.npmjs.org
yarn install
yarn vite --port 5173 --strictPort   # serve; app lives at /prohimuf/
```

App URL: `http://localhost:5173/prohimuf/` (vite `base` is `/prohimuf/`).

## Drive it (Playwright, pre-installed Chromium)

Global playwright is requirable with `NODE_PATH=/opt/node22/lib/node_modules`
from a **CommonJS** script (ESM ignores NODE_PATH). Launch with
`chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })`.

- Mobile emulation: `newContext({ viewport, userAgent: <iPhone UA>, hasTouch: true, isMobile: true })`.
  Mobile mode is decided from the UA at load (ADR-0003) — set it before `goto`.
- Orientation: portrait vs landscape is just the viewport aspect
  (`matchMedia("(orientation: portrait)")`); `setViewportSize` mid-session
  flips the rotate overlay.
- Multi-touch (swipes, two-finger taps): Playwright's `touchscreen.tap` is
  single-touch only — use CDP:
  `ctx.newCDPSession(page)` then `Input.dispatchTouchEvent` with
  `touchPoints: [{x, y, id}, …]` (`touchStart`/`touchMove`/`touchEnd`).

## Flows worth driving

- TITLE cover (cold load) → a single action (click, or press `Enter`) enters the
  MENU → tap/click the level flyer (text `BELLIARD`) → narrative screen →
  `Passer` button → PLAYING canvas (wait ~2.5s for Suspense/art).
- Overlay assertion: `page.getByText("TOURNEZ VOTRE APPAREIL")`.
- Pan/inertia evidence: screenshot before drag, right after `touchEnd`, and
  ~700ms later — the facade must keep sliding between the last two.
- Desktop regression: crosshair follows mouse; `mouse.move` to the right edge
  scrolls the camera after ~1s.

## Gotchas

- `yarn dev` opens a browser (`open: true`); prefer `yarn vite --port … --strictPort`.
- Collect `page.on("pageerror")` — the canvas renders even when React blows up
  in an effect.
- HUD timer (`TEMPS`) ticking down between screenshots is a cheap "game is
  actually running / not paused" signal.
