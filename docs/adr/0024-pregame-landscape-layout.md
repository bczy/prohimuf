# 0024 — Responsive pre-game layout for mobile landscape (short-height reflow)

- **Status:** Proposed
- **Date:** 2026-07-15
- **Related:** [ADR-0021](./0021-pre-game-print-system-and-title-phase.md) (the TITLE/MENU
  print surfaces this reflows, the `src/render/ui/print/tokens.ts` single-source, and D4's
  "pure view state stays out of `src/hooks/`" principle), [ADR-0003](./0003-mobile-touch-controls-and-camera-pan.md)
  (mobile detection, `useOrientation`, the portrait `RotateOverlay` block — all left intact),
  [ADR-0008](./0008-two-axis-pan-and-fullscreen.md) (`FullscreenButton` chrome the shell appends),
  `docs/architecture.md` (the game ↔ render ↔ hooks boundary law),
  `docs/game-design/pregame-landscape-ux.md` (the pixel-level layout intent — authored
  separately; **this ADR owns the mechanism, that doc owns the pixels**).

## Context

ADR-0003 D2 blocks only **portrait** on mobile: `rotateBlocked = IS_MOBILE && isPortrait`
(`src/render/scene/App.tsx:125`) mounts `RotateOverlay` when `useOrientation()` reports
portrait. Mobile **landscape** is intentionally *not* blocked — the game facade is a wide
horizontal surface and landscape is the intended play orientation (ADR-0003 forces users
toward it). But the pre-game print surfaces built in ADR-0021 were laid out for a tall
desktop viewport and never re-checked against a **short** landscape viewport (phone landscape
is typically ~320–430 px tall). ADR-0003 itself flagged this: its "Not in this ADR" list
names *"Responsive HUD/menu layout for small landscape screens"* as a deferred follow-up.
This ADR is that follow-up for the pre-game screens.

Confirmed on real device screenshots:

- **TITLE** (`src/render/ui/TitleScreen.tsx`) — the interactive cover is a flex **column**
  with `justifyContent: "center"` over a stack of ~9 blocks (issue label → `MUF` wordmark at
  `clamp(80px, 14vw, 160px)` → subtitle → year → halftone hero `clamp(88px, 17vh, 150px)` →
  rule → teasers → info-line → CTA → microcopy). On a short viewport the centred column is
  taller than the frame, so it overflows **both** ends: the absolutely-positioned masthead
  ink strip (`top:0`) **clips the `MUF` wordmark**, and the primary CTA (`[ COMPOSE
  L'INFO-LINE ]`) falls **below the fold and is invisible** — the one affordance the whole
  screen exists to present.
- **MENU** (`src/render/ui/MainMenu.tsx`) — a flex column of three `flexShrink: 0` chrome
  bands (running masthead with a 32 px `MUF`, then the *sommaire* tab row with `minHeight:
  44px` tabs) above a `flex: 1` rubrique surface. On a short viewport the two fixed chrome
  bands eat **>50 % of height**, leaving only a sliver of the first level flyer
  (`menu/FlyerWall.tsx`) visible even though that surface already has `overflowY: auto`.

Forces from the code and the boundary law:

- The pre-game surfaces are **inline-styled** React (`style={{…}}`), not stylesheets. Two of
  them already inject a scoped `<style>` block for keyframes (`TitleScreen.tsx` `@keyframes
  mufTitleBlink`; `App.tsx` `mufRedFlash`) and `PaperSheet` composes background layers in CSS
  — so **injecting a scoped `<style>` block with a media query is an established, boundary-local
  pattern**, not a new capability.
- CLAUDE.md law: `src/hooks/**` is *the only* game ↔ R3F bridge. ADR-0021 D4 already ruled
  that **pure view state does not belong in `src/hooks/`** (it kept the menu-nav hook in the
  render layer for exactly this reason). "The viewport is short" is pure view state that
  bridges nothing to game logic.
- `useOrientation` exists (ADR-0003) because the portrait case drives a **conditional mount**
  (`RotateOverlay` appears/disappears) — React genuinely must know. A short-landscape reflow
  is **not** a mount/unmount; it is the *same* DOM tree needing different spacing and sizes.
  CSS reflows that for free; React does not need to know.
- Inline `style=` declarations beat plain stylesheet rules in the cascade, so a media-query
  rule that merely names a class will **not** override an existing inline property — the
  delivery mechanism has to account for this or it silently no-ops.
- `src/render/ui/print/tokens.ts` (ADR-0021 D3) is the render layer's single source for
  presentation constants; a breakpoint threshold is presentation truth of the same kind.
- Regression guard is a hard requirement: desktop and portrait must stay **byte-stable**
  except the intended reflow, and the ADR-0003 portrait `RotateOverlay` block is unrelated
  and must be left exactly as-is.

## Decision

### D1 — Detection is **CSS-first**: a scoped short-landscape `@media` query, **no new JS, no hook**

"Short landscape" is detected by a CSS media query, not by JavaScript. Each pre-game surface
injects a scoped `<style>` block (the shipped keyframes pattern) whose reflow rules live
behind:

```css
@media (orientation: landscape) and (max-height: <SHORT_LANDSCAPE_MAX_H>) and (pointer: coarse) { … }
```

- `orientation: landscape` + `max-height` is the actual condition that causes overflow
  (a short *landscape* viewport), expressed in the one language that already models it.
- `pointer: coarse` scopes the query to touch devices, which makes the **desktop
  byte-stable guarantee (D3) hold by construction** — a mouse desktop never matches
  regardless of window size — without any UA sniffing. This is a deliberately *different*
  signal from `App.tsx`'s `IS_MOBILE` (UA-based, ADR-0003): the reflow is a pure presentation
  concern that CSS media features describe more robustly and honestly than a UA regex, and the
  two signals are allowed to be independent because they answer different questions ("do we
  mount the block?" vs "does the paint need to reflow?").

**Rejected alternatives:**

- **(a) A JS `useViewport`/`useLayout` hook exposing `{isPortrait, isLandscape, isShort,
  isMobile}`.** Rejected. It adds a `resize`/`matchMedia` listener and re-renders on every
  breakpoint crossing to do what CSS does for free with zero JS. It also has nowhere clean to
  live: `src/hooks/` is the game↔R3F bridge and this bridges nothing (CLAUDE.md law; ADR-0021
  D4), and putting it there would re-blur the bridge folder. If a hook were ever genuinely
  required it would belong in the render layer, not `src/hooks/` — but it is **not** required,
  so we add none. `useOrientation` stays a boolean serving the mount/unmount case it was built
  for; it is deliberately **not** widened here.
- **(c) A mix.** Rejected as unnecessary: there is no mount/unmount decision in this change,
  so there is no part that needs JS. Pure CSS covers the whole reflow.

CSS-first is the simplest thing that removes the overflow, needs no hook, and crosses no layer
boundary — so it is the recommended and chosen approach.

### D2 — Layout logic lives entirely in the render layer; delivery is via CSS custom properties

All new code is confined to `src/render/ui/**`. `src/game/**` and `src/hooks/**` are
**byte-untouched** — the boundary law holds trivially because nothing outside render changes.

Because inline `style=` beats plain stylesheet rules, the media query does not try to *name*
and override inline properties. Instead each responsive property is authored as a **CSS custom
property with the current value as its `var()` fallback**, e.g. the wordmark becomes
`fontSize: "var(--muf-title-wordmark, clamp(80px, 14vw, 160px))"`, and the scoped `<style>`
block *declares* the override custom property on the surface's **container class** only inside
the short-landscape media query. Delivery then works with the cascade instead of against it:

- **Desktop / portrait / tall landscape:** the media query does not match, the container never
  defines the custom property, `var()` resolves to its fallback → the pixel output is
  **identical to today** (D3).
- **Short landscape (touch):** the container class picks up the overridden custom properties
  and the existing inline `var(…)` consumers reflow — a smaller `MUF`, tightened vertical
  rhythm, a shorter hero, compacted MENU chrome (thinner masthead, hidden running-string,
  shorter tabs) so the CTA and the first flyer come back above the fold.

This avoids `!important` and any specificity fight; the inline base style *is* the fallback,
so it cannot drift from the desktop truth. The **single-source breakpoint** threshold
`SHORT_LANDSCAPE_MAX_H` is added to `src/render/ui/print/tokens.ts` (ADR-0021 D3's render-only
style source — it holds no React and no game rule, and a breakpoint is presentation truth of
the same family as `MOTION`/geometry) and interpolated into each surface's `<style>` template
so TITLE and MENU cannot disagree on where "short" begins. The **specific values** each
custom property takes at the breakpoint (sizes, gaps, what hides) are **pixel-layout intent
owned by `docs/game-design/pregame-landscape-ux.md`**, not by this ADR.

### D3 — Regression guard: desktop, portrait, and tall landscape are byte-stable; the ADR-0003 block is untouched

- The media query is gated on `(orientation: landscape) and (max-height: …) and (pointer:
  coarse)`; nothing else in the render tree changes, so any viewport that does not match all
  three predicates renders **byte-for-byte as today** — including every desktop window and
  every portrait phone. The `var(…, fallback)` delivery (D2) guarantees the unmatched path
  equals the current inline value.
- The portrait block from ADR-0003 (`rotateBlocked = IS_MOBILE && isPortrait` →
  `RotateOverlay` over every phase; and the in-game orientation-pause) is **unrelated to this
  change and is left exactly as written**. This ADR does **not** block landscape and does
  **not** touch `useOrientation`, `rotateBlocked`, `RotateOverlay`, or `IS_MOBILE`.
- Because `pointer: coarse` (not a height threshold alone) scopes the reflow, a rare short
  desktop *mouse* window keeps the current layout, satisfying "desktop byte-stable" strictly.
  A touchscreen laptop dragged to a short landscape window would reflow — that is correct,
  harmless, and preserves the fanzine identity (spacing only).

### D4 — This is re-layout, not a redesign, and stays inside the print system

The change reflows the existing ADR-0021 print surfaces; it introduces **no new visual
identity, no glow, no generated asset, no font, no CI render-farm run, and no lead-art gate**.
The loi de l'imprimé (art-direction §2bis) holds by construction: stocks, ink, mastheads,
stamps and marker rings are unchanged — only their size and spacing respond to the breakpoint.
Any `text-shadow`/`box-shadow` glow, `backdrop-filter: blur`, or neon reintroduced while
reflowing is an automatic FAIL against §2bis (grep the diff at the design-acceptance gate, per
ADR-0021's gotcha).

### D5 — Lane assignment: a single `dev-r3f-render` lane; no parallel lanes, no cross-layer sign-off

Every touched file is in `src/render/ui/**`:

- `src/render/ui/TitleScreen.tsx`, `src/render/ui/MainMenu.tsx` (the two overflowing surfaces),
- their MENU sub-surfaces if their internal rhythm also overflows at the breakpoint
  (`src/render/ui/menu/FlyerWall.tsx`, `menu/LevelFlyer.tsx`, `menu/ScoresUne.tsx`,
  `menu/OptionsColophon.tsx`),
- `src/render/ui/print/tokens.ts` (add the single-source `SHORT_LANDSCAPE_MAX_H` breakpoint).

This is a **single seam in a single layer**, so it is **one `dev-r3f-render` lane**. There are
no non-overlapping paths to parallelise — inventing a second lane here would only create a
false partition over the same file set. Because the change is confined to one layer it is not
a cross-cutting change under the COLLABORATION.md rule (which requires architect sign-off only
when a change touches **>1** layer); this ADR records the mechanism decision, and the lane
proceeds after the game-designer's `pregame-landscape-ux.md` pins the pixel values.

## Consequences

**Positive**

- The overflow is removed with **zero new JavaScript, zero new hook, and zero boundary
  crossing**: `src/game/**` and `src/hooks/**` are byte-untouched, so the game ↔ render ↔ hooks
  contract holds trivially. CSS models "short landscape" in its native language.
- The `var(…, fallback)` delivery makes the desktop/portrait/tall-landscape paths **byte-stable
  by construction** — the regression guard is satisfied structurally, not by review vigilance,
  because the base inline style literally *is* the fallback and cannot drift.
- The breakpoint is single-sourced in `tokens.ts`, extending ADR-0021 D3's one-source
  discipline; TITLE and MENU cannot disagree on where "short" begins.
- `pointer: coarse` gives a clean, UA-sniff-free guarantee that mouse desktops never reflow.
- Scope stays tiny and single-lane; the print identity is preserved (re-layout, not redesign).

**Negative / costs**

- Every responsive property must be authored as `var(--token, fallback)` rather than a bare
  literal — slightly more verbose inline styles on the reflowed elements, and a reviewer must
  confirm the fallback equals the prior literal (the byte-stable guarantee depends on that
  equality).
- CSS-only means there is **no JS signal** that the layout is in short-landscape mode; if a
  future feature ever needs to branch React logic on short-landscape (not just paint), it will
  have to introduce a render-layer view-state hook then — explicitly **not** in `src/hooks/`
  (ADR-0021 D4) — and this ADR should be revisited rather than silently widened.
- The exact `SHORT_LANDSCAPE_MAX_H` threshold and the per-property values are tuning that needs
  an on-device pass; a poorly chosen threshold either misses real short phones or fires on
  tablets that did not need it.

**Gotchas to watch**

- **Specificity trap:** do not "fix" this later by adding a class-named media rule that tries
  to override an inline property directly — it will silently no-op because inline wins. The
  custom-property-via-`var()` indirection (D2) is the reason it works; keep it.
- **Do not widen `useOrientation` or add a layout hook in `src/hooks/`** in a later refactor —
  D1 fixes detection in CSS and D2 keeps all state in the render layer; a hook here would
  re-blur the bridge folder (the same drift ADR-0021 D4 guards against).
- **Do not touch `rotateBlocked` / `RotateOverlay` / `IS_MOBILE`** while doing this — the
  ADR-0003 portrait block is orthogonal; changing it would conflate "block portrait" with
  "reflow landscape" and risk regressing the mobile play-orientation contract.
- **Loi du glow:** grep the diff for any `text-shadow`/`box-shadow`-as-glow or `backdrop-filter`
  reintroduced while compacting chrome (ADR-0021 §2bis gate).
- **Verify on device, both axes:** the fix must be checked in real phone landscape (CTA and
  first flyer above the fold) *and* re-checked in phone portrait + desktop (unchanged), since
  the whole value of the change is that only the matched viewport moves.
