# 0021 — Pre-game print system: a render-layer TITLE phase and a single-source print-token module

- **Status:** Accepted
- **Date:** 2026-07-14
- **Related:** [ADR-0003](./0003-mobile-touch-controls-and-camera-pan.md) (RotateOverlay covers
  every phase), [ADR-0008](./0008-two-axis-pan-and-fullscreen.md) (FullscreenButton chrome),
  [ADR-0012](./0012-optional-scripted-tutorial-stage.md) (the `AppPhase` union + preview
  harness this extends), [ADR-0011](./0011-render-side-neon-rim.md) (la loi du glow — in-game),
  `docs/architecture.md`, `docs/art-direction.md` §2bis / §2bis.1,
  `docs/game-design/pre-game-experience-ux.md`,
  `_bmad-output/planning-artifacts/plan-pre-game-experience-redesign.md`.

## Context

The pre-game experience (title → menu → briefing) is being redesigned from a prototype admin
panel into the fanzine world it promises (story `story-pre-game-experience-redesign.md`, design
gate PASS-with-conditions). The redesign is a **reskin + entry-flow** change confined to
`src/render/**`; it adds no mechanic and changes no game data. Two of its decisions are
cross-cutting enough to record so a future reader does not re-litigate them or break them by
accident:

1. **A new `TITLE` entry screen needs somewhere to live in the phase flow.** `App.tsx` routes
   the app through a local `AppPhase` `useState` union
   (`"MENU" | "NARRATIVE_PRE" | "PLAYING" | "NARRATIVE_POST" | "END" | "TUTORIAL"`,
   `src/render/scene/App.tsx:32`). There is also a **game** state machine
   (`src/game/systems/stateMachine.ts`) that AC4/AC7 freeze byte-for-byte. A naive reader can
   mistake "adding a phase" for "touching the game state machine" and file a false AC4
   violation — so the distinction must be documented, not just coded.

2. **The pre-game surfaces need one source of truth for the print palette + masthead
   strings.** Today four render files each re-declare their own neon hexes
   (`NEON_YELLOW = "#ffe600"` in `StartScreen`, `MainMenu`, `NarrativeScreen`, `RotateOverlay`)
   and three of them re-declare near-identical masthead strings with divergent punctuation. The
   art law (`docs/art-direction.md` §2bis) replaces every menu glow hex with **print tokens**
   (paper stocks, black ink, marker/stamp inks — §2bis.1) and mandates **zero glow** on menu
   surfaces. AC3 requires these tokens come from **one shared definition**. Where that
   definition lives is a boundary question: it must respect the game/render/hooks contract.

Forces from the code and the specs:

- `StartScreen.tsx` is **orphaned dead code** — nothing imports it; `App.tsx` boots cold
  straight into `MENU`. AC1 wants no orphaned pre-game component to remain.
- `renderAppShell(content, rotateBlocked)` (`App.tsx:49`) is the wrapper that appends
  `RotateOverlay` (ADR-0003) and `FullscreenButton` (ADR-0008) to every phase. Any new phase
  must route through it or it loses the mobile overlay + fullscreen chrome (AC6).
- `src/hooks/**` is documented (`architecture.md`) as **the single game↔R3F bridge**
  (`useGameLoop`, `useTopdownLoop`, `useAudio`, …). The redesign needs keyboard-nav state for
  the menu — pure view interaction that bridges nothing to game logic.
- The art treatment (halftone, stamps, marker ellipses, fold streaks) is **all CSS +
  inline-SVG** per §2bis.1 — **no generated PNG, no new font, no CI render-farm run, no
  lead-art gate**.
- `FullscreenButton` is deliberately neutral white chrome (it also overlays the glowing game
  world, where a neutral control is correct); it is not a menu artifact.

## Decision

### D1 — `TITLE` is a branch of the render-layer `AppPhase`, never the game `stateMachine`

`AppPhase` (the local `useState` union in `App.tsx`) gains `"TITLE"`. Cold load (no
`?preview`) boots `TITLE`; a single action (click / tap / printable key / Enter / Space /
Escape) advances to `MENU`. The `TITLE` branch renders through `renderAppShell` exactly like
`MENU`, so `RotateOverlay` and `FullscreenButton` wrap it (AC6). The orphaned
`StartScreen.tsx` is **replaced by a new `TitleScreen.tsx` and deleted** — no orphaned pre-game
component remains (AC1).

This is a **render-layer** change. `src/game/systems/stateMachine.ts`, `prefsSystem.ts`
(`Prefs` schema), `highScoreSystem.ts` (`ScoreEntry` schema) and `levels.ts` (data) are
**byte-untouched** (AC4/AC7). Adding a render phase and preview params is explicitly permitted
by the story (AC7 allows `src/render/ui/**`; AC8 anticipates "a new `App` phase for the title
behind an ADR"). Recorded here so the `TITLE` phase is not mistaken for a game-state-machine
change at review.

### D2 — Preview harness gains `?preview=title|menu`; the existing three stay byte-identical

The `PREVIEW_SCREEN` ternary (`App.tsx`) gains `title → TITLE` and `menu → MENU`; the
`narrative | end | tutorial` seeds are unchanged. `menu` is kept explicit (even though cold
load also lands past TITLE into MENU) so the tool can target a deterministic menu capture. If
`scripts/screenshot-preview.mjs` hardcodes its capture list (as it does for `tutorial`,
ADR-0012 D3), adding the two calls there is a **`dev-tooling-assets` follow-up**, kept off the
render lanes' file sets so lane partitions stay disjoint.

### D3 — The single-source print tokens live in `src/render/ui/print/tokens.ts`

A new render-only module `src/render/ui/print/` holds the AC3 single source: `STOCK`, `INK`,
`MARK` (the §2bis.1 hexes verbatim), `MASTHEAD` strings, flyer geometry and `MOTION` tokens,
plus the reused print primitives (`PaperSheet`, `HalftoneHero`, `Stamp`, `MarkerCircle`,
`TapeCorner`) and the menu-nav helper (`useRovingIndex`).

It lives in the **render layer** because the tokens are **presentation truth** (the loi de
l'imprimé), consumed only by render surfaces:

- **Not** `src/game/` — that folder is pure game logic; style constants there would be a
  semantic boundary leak (the game layer must never own presentation truth), even though the
  values are "just strings".
- **Not** `src/hooks/` — that folder's one documented job is the game↔R3F bridge. Palette and
  masthead strings are not a bridge.

The boundary rule ("game never imports React/Three; render never holds rules") holds: this
module holds neither React nor a game rule; it is the render layer's own style source of truth.
Every pre-game surface reads its hexes and mastheads from here — no per-file re-declaration
(AC3). This satisfies the art law's **zero-glow-in-menus** mandate by construction: the tokens
are paper/ink, not glow hexes.

### D4 — Menu keyboard navigation stays in the render layer, not `src/hooks/`

The menu's keyboard nav (roving focus over flyers / editions / options, arrow rubrique cycling,
Escape-to-title) is **pure view interaction** — it bridges nothing to game logic. Its shared
helper (`useRovingIndex`) lives in `src/render/ui/print/`, colocated with the primitives it
serves, **not** in `src/hooks/`. Putting it in `src/hooks/` would dilute that folder's single
defined purpose (the game↔R3F bridge). This follows the shipped grain: `NarrativeScreen`
already owns its own `window` keydown listener as render-local state.

### D5 — What this ADR does **not** change

- `NarrativeScreen` **behaviour, scripts and three call sites are frozen** (typewriter,
  `Passer`, progress dots, `advance`, `CHAR_DELAY_MS`). Only its **visual frame** joins the
  print system (paper ground + ink rule + halftone — the gate's PRINT-frame ruling, on the
  menu side of the loi du glow).
- `FullscreenButton` stays **neutral white chrome** with `data-muf-ui` (ADR-0008). It is system
  chrome, not a menu artifact, and overlays the glowing game world too; it is **not** reskinned
  to ink. The TITLE single-action handler excludes events whose target is inside `[data-muf-ui]`
  so tapping fullscreen never skips into the menu.
- `HUD`, `PauseScreen`, `EndScreen` (in/after play) are out of scope; the print system is built
  reusable so a later story can align them.
- No generated asset, font, CI render-farm run or lead-art gate — the print treatment is CSS +
  inline-SVG only.

## Consequences

**Positive**

- The game↔render↔hooks contract is preserved and made explicit: `src/game/**` is
  byte-identical; all new code is render-only; the shared style module sits in `render`, the
  menu-nav hook stays out of the bridge folder.
- One source of truth kills four divergent palette re-declarations and three divergent
  mastheads; the AC3 "one cohesive visual system" is enforced structurally, not by review
  vigilance.
- The `TITLE` phase reuses `renderAppShell`, so it inherits the mobile overlay + fullscreen
  chrome for free (AC6); it extends ADR-0012's phase + preview pattern rather than inventing a
  new one.
- Deleting the orphaned `StartScreen.tsx` makes AC1 literally true.

**Negative / costs**

- Cold-load default moves from `MENU` to `TITLE` — one extra screen/action before the menu.
  This is inside the 10-second budget **only** because the title forces no dwell (entry fires
  immediately regardless of typewriter progress) and transitions are ≤ 280 ms; the stage-5
  playtest must time the 3-tap path as a hard checkpoint (design gate condition (a)).
- The pre-game render surfaces now depend on `src/render/ui/print/`; a missing token is a
  contract bug fixed in `tokens.ts`, not in a consuming surface.
- `src/render/ui/print/` establishes a render-side "style tokens + primitives" location that
  future UI stories will be expected to reuse (and extend for HUD/Pause/End alignment).

**Gotchas to watch**

- Reviewers may see "new phase" and reach for a false AC4 flag — D1 documents that `AppPhase`
  is the render-layer `useState`, not `src/game/systems/stateMachine.ts`.
- The menu-nav hook must **not** drift into `src/hooks/` in a later refactor — D4 fixes its home
  in the render layer; moving it would re-blur the bridge folder.
- Any `text-shadow: 0 0 …` glow, `box-shadow`-as-glow, `backdrop-filter: blur`, CRT scanline
  `repeating-linear-gradient`, or neon corner bracket reintroduced on a pre-game surface is an
  automatic FAIL against §2bis — grep the diff at the design-acceptance gate.
- `FullscreenButton` must stay neutral — reskinning it to ink would break its correctness over
  the glowing game world (ADR-0008).
