# Story: Pre-game screens read as a video game on mobile landscape (not a scrolling SPA)

**Type:** Presentation / responsive-layout polish of existing pre-game screens — no new
mechanic, no redesign of the visual language ·
**Status:** ready-for-design (hands to the DESIGN LOOP: `game-designer` layout/IA +
`lead-game-designer` design gate → `senior-architect` for the render lane) ·
**Date:** 2026-07-15 · **PM:** John · **Follows:** ADR-0021 + the shipped pre-game print
system (`story-pre-game-experience-redesign.md`) ·
**Surfaces:** `src/render/ui/TitleScreen.tsx`, `src/render/ui/MainMenu.tsx`,
`src/render/ui/menu/FlyerWall.tsx` (+ possibly `menu/LevelFlyer.tsx`), token/motion source
`src/render/ui/print/tokens.ts`; flow context `src/render/scene/App.tsx`. No `src/game/**`.

## Why (product value)

Bertrand, verbatim (FR): the accueil and the level-select menu are _"surchargé"_ on mobile
landscape; _"on ne dirait pas un écran d'accueil de jeu vidéo"_; _"je doute de l'utilité de la
barre du haut"_; _"on sent que c'est une SPA, ça ne fait pas du tout jeux vidéo."_ Even at
full screen, in landscape there are too many elements with no room to appear.

Two real mobile-landscape screenshots (user-supplied) show the concrete failures this story
must eliminate:

- **TITLE (landscape):** the giant MUF wordmark is **clipped by the top black masthead strip**
  (only letter-bottoms show); the halftone hero has no room and is **not visible**; the primary
  action `[ COMPOSE L'INFO-LINE ]` and its microcopy are **below the fold — completely
  invisible**; a large **dead empty band** sits in the middle of the layout.
- **MENU / level-select (landscape):** the masthead band (MUF + `UNDERGROUND PARIS · FANZINE
  CLANDESTIN · 1998`) plus the NIVEAUX/SCORES/OPTIONS tab band together consume **> 50% of the
  viewport height**; only a **sliver of the first flyer** shows, cut off; you must scroll to
  reach any level.

The root cause is verified, not aesthetic taste:

- The rotate overlay only blocks mobile **portrait** (`App.tsx:125` —
  `rotateBlocked = IS_MOBILE && isPortrait`). So a mobile phone held in **landscape** (the
  intended play orientation) renders the **full** `TitleScreen` and `MainMenu`, both authored
  as **tall vertical zine layouts** for a portrait-ish column.
- `TitleScreen` is a centered vertical stack of ~11 elements (issue label → MUF wordmark
  `clamp(80px,14vw,160px)` → subtitle → year tag → halftone hero → rule → 3 teasers → info-line
  → CTA → microcopy) with **no scroll container**. On a ~360-430px-tall landscape viewport the
  top and bottom clip — including, intermittently, the primary CTA the player must reach.
- `MainMenu` stacks **three fixed horizontal bands** before any content: a running masthead
  (MUF 32px + masthead string), then the sommaire tablist, then the scrolling rubrique surface.
  On a short viewport those two chrome bands eat the height that the flyer wall (level select)
  needs, so `FlyerWall` — itself a vertical flyer stack — is squeezed into a thin scroller.

This is the game's **first impression** and, per the guidelines, its first piece of fiction.
It currently reads as a scrolling web app because it is laid out like one. Making it read as a
title card / arcade select on the phone-in-hand orientation is the highest-leverage, lowest-
risk polish left on the pre-game surfaces — and it touches zero game rules.

## Cahier des charges test — verdict: FAITHFUL (no new scope)

> _"Est-ce que Prohibition Atari ST avait ça ?"_ — Prohibition shipped a title screen and a
> level/menu front-end. This story adds **no** feature, mode, level, setting, or mechanic. It
> re-**lays-out** already-shipped screens so they fit the mobile-landscape viewport and read as
> a game screen instead of a scrolling document. The fanzine/print visual language (ADR-0021,
> `docs/art-direction.md`) is **preserved, not redesigned** — same stocks, ink, halftone,
> marker focus, zero glow. Net scope surface unchanged; fit + first-impression improve.

## In scope

- Responsive re-layout of `TitleScreen` and `MainMenu` (incl. the `FlyerWall` level select) so
  they fit a short landscape viewport (target height band ~360-430px) **without clipping and
  without requiring a scroll to reach the primary action** — while remaining responsive so
  desktop / tall viewports keep (or improve on) today's composition.
- A **verdict + implementation on the "barre du haut"** (the `MainMenu` running masthead band):
  reclaim its vertical cost on short landscape viewports (collapse into the sommaire row / drop
  to a thin inline mark), keeping the fanzine masthead identity where there is room (tall /
  desktop). Do **not** delete the identity — relocate/condense it responsively.
- Reading the breakpoint/orientation signal from the **existing** hooks/consts (`IS_MOBILE`,
  `useOrientation`) — no new orientation system.

## Out of scope (explicit)

- **No rotate-overlay behavior change.** Portrait stays blocked by `RotateOverlay` (ADR-0003);
  this story does **not** start blocking landscape or add a new gate. Landscape must render and
  fit, not get an overlay.
- **No new visual language / redesign.** Stocks, ink, halftone hero, stamps, marker focus, zero
  glow (ADR-0021, art-direction §2bis) are the frame, not the target. No new fonts/assets, no
  CI render-farm run.
- **No content added or removed for its own sake.** Elements may be **reflowed, condensed, or
  responsively hidden** on short landscape, but this is not a copy rewrite — narrative-owned
  strings (copy deck §1/§5) keep their words. If any pre-game *string* is proposed for removal
  on small screens, the narrative-designer signs off; nothing is silently cut.
- **No behavior/data/schema change.** `Prefs`, high scores, `levels.ts`, `stateMachine`, the
  `AppPhase` flow, single-action title entry, tab/roving-focus semantics — all byte-behavior-
  identical. This is CSS/layout only.
- **In-game HUD, PauseScreen, EndScreen, and NarrativeScreen behavior** are not in this story
  (not "avant de jouer" surchargé feedback). NarrativeScreen may inherit a shared responsive
  helper if one is extracted, but its layout is not the subject here.
- **No new mechanics, systems, tuning, or levels.** Core loop `Récupérer → Livrer → Éviter`
  untouched.

## What — Acceptance Criteria (testable)

1. **Title: primary CTA fully visible, wordmark never clipped, no dead band.** At **667×375**
   (and again at **812×375**), with the app in mobile-landscape (`IS_MOBILE && !isPortrait`):
   (a) the primary entry affordance — the info-line CTA `[ COMPOSE L'INFO-LINE ]` marker **and
   its microcopy** — is **fully visible without any scrolling** (it is currently below the
   fold); (b) the **MUF wordmark is never clipped** by the top masthead strip (currently only
   letter-bottoms show); (c) **no content clips** at top or bottom and there is **no large empty
   dead band** in the middle. _Verify:_ `?preview=title` capture at 667×375 and 812×375; the
   CTA and microcopy bounding boxes lie fully inside the viewport; the MUF wordmark's top edge
   sits below the masthead strip; no vertical scrollbar; no clipped glyphs.

2. **Level select shows real flyers in landscape without scrolling.** At 667×375, the `MENU`
   NIVEAUX rubrique shows **at least the first 2 level flyers fully visible and actionable
   without scrolling** (currently only a cut-off sliver of the first flyer shows), and every
   flyer is reachable by roving focus; the level list is not squeezed into a thin band dominated
   by chrome. If the total flyer count exceeds the height, scroll is confined to the flyer
   surface (not the whole page) and playing the first unlocked flyer needs no scroll. _Verify:_
   `?preview=menu` at 667×375; the first two flyers are fully in-viewport and tappable; chrome
   bands do not exceed the AC4 budget.

3. **Top-bar verdict, implemented.** On short landscape viewports the standalone `MainMenu`
   running-masthead band (MUF 32px + masthead string, `MainMenu.tsx` ~ll.69-100) **no longer
   consumes a full dedicated horizontal band** — its branding is folded inline (into the
   sommaire row) or reduced to a thin mark, reclaiming that height for content. On desktop /
   tall viewports the masthead identity is preserved (the fanzine masthead is not deleted from
   the product). _Verify:_ measure the combined non-content chrome height (masthead + sommaire)
   at 667×375 vs today; it is materially reduced (see AC4) while the same view at ≥ 900px tall
   still shows the full masthead treatment.

4. **Chrome height budget on short landscape.** At 667×375, the fixed pre-`content` chrome of
   `MainMenu` (masthead + sommaire — everything above the active rubrique surface) occupies
   **no more than ~30% of the viewport height** (≈ ≤ 112px at 375px tall), down from the current
   **> 50%**, leaving the majority for the actual selectable content. _Verify:_ computed layout
   measurement of the chrome region vs. viewport height at 667×375.

5. **Reads as a game screen, not a scrolling document.** On the target landscape viewport,
   neither pre-game screen presents as a page you scroll through: the title composes as a single
   title card (no page scroll), and the menu's outer shell does not scroll as a document (any
   scroll is contained to the rubrique content per AC2). This is a design-gate/playtest verdict
   against the "SPA feel" complaint, not just a pixel check. _Verify:_ `game-designer` /
   `lead-game-designer` playtest sign-off on the 667×375 and 812×375 captures: "reads as a
   video-game accueil / select, not a scrolling SPA."

6. **Fanzine identity survives — re-layout, not redesign.** The reworked screens still use the
   ADR-0021 print system: `STOCK.*` grounds, `INK.*`, the halftone hero, marker-circle focus,
   and **zero glow** (no `text-shadow: 0 0`, no glow `box-shadow`, no `backdrop-filter: blur`,
   no CRT scanline `repeating-linear-gradient`). Palette/motion values are still read from
   `src/render/ui/print/tokens.ts` — **no new per-file hex or magic layout constant that
   belongs in the token source**. _Verify:_ grep the diff for the forbidden glow/scanline
   patterns (absent) and for re-declared palette hexes (none); visual review vs art-direction.

7. **Portrait and desktop do not regress.** In mobile **portrait**, `RotateOverlay` still
   covers all pre-game phases (unchanged, ADR-0003). On **desktop / wide-tall** viewports
   (e.g. 1280×800 and 1024×1366), both screens render at least as well as today — no new empty
   voids, no shrunken-to-mobile look on large screens, full masthead present per AC3. _Verify:_
   `?preview=title|menu` captures at 1280×800 and portrait emulation with the overlay shown;
   compare against pre-change baseline — no regression.

8. **Interaction contract intact.** Single-action title entry still fires on one
   click/tap/printable-key/Enter/Space/Escape (excluding `[data-muf-ui]` chrome); the sommaire
   tablist keeps roving horizontal focus + keyboard entry; the flyer wall keeps vertical roving
   focus, the mount click-through lockout (`data-flyers-armed`), and locked-flyer shake; all
   touch targets stay **≥ 44px**. `Escape` from MENU still backs to TITLE. _Verify:_ keyboard
   traversal + tap on both screens at 667×375; existing behaviors reproduce; touch-target audit.

9. **Verified green + screenshot-capturable.** `rtk tsc` + `rtk vitest` + `rtk lint` clean;
   `src/game/**` byte-identical (no game-system test edited). New captures added/observed via the
   `verify` skill at the landscape reference sizes; the existing `?preview=title|menu|narrative|
   end|tutorial` params still work. If the responsive strategy changes the render contract
   (e.g. a shared responsive helper in `print/`), an ADR update accompanies the PR. _Verify:_
   green gates + attached landscape captures + `git diff` path audit (render-only).

## Design-loop brief (what the next stage owns — do NOT solve it here)

This story is the **WHAT/WHY**. The responsive composition is a design problem:

- **`game-designer` (Sacha):** the landscape information architecture — how the title's ~11
  elements collapse into a title-card composition at short height (what condenses, what may
  responsively hide, hierarchy toward the single CTA); how the menu chrome folds so the flyer
  wall breathes; the top-bar treatment per AC3. No new mechanic, no copy rewrite.
- **`narrative-designer` (Yasmine):** sign-off if any French pre-game **string** is proposed for
  responsive hiding on small screens (nothing silently cut).
- **`lead-game-designer` (Karim):** design gate — PASS required (incl. the AC5 "reads as a game,
  not an SPA" verdict) before the architect assigns the lane.
- **`senior-architect` (Winston):** the breakpoint strategy and its boundary (read `IS_MOBILE`
  /`useOrientation`; any shared responsive helper lives in `src/render/ui/print/`, never in
  `src/hooks/`), and whether an ADR-0021 addendum is needed.

---

_Next: `lead-game-designer` runs the DESIGN GATE on the landscape composition, then
`senior-architect` partitions the (single) render lane. Log the hand-off in
`docs/agent-handoffs.md`. Devs implement only the gated design._
