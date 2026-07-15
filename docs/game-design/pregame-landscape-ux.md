# Pre-game landscape (short-height) layout spec — TITLE + MENU

**Feature:** Landscape-first reflow of the pre-game entry surfaces (title cover + level-select menu)
**Author:** `game-designer` (Sacha) · **Gate:** `lead-game-designer` (Karim) — PASS required before architect
**Scope anchor:** amends `docs/game-design/pre-game-experience-ux.md` §5 (Mobile landscape) with a concrete
short-height layout. `PROJECT_GUIDELINES.md` + ADR-0021 remain law. **Layout only** — no new mechanic,
no new copy, no data touch, no change to `AppPhase`, `Prefs`, `levels.ts`, or the print-token module's
_values_ (a new landscape breakpoint token is additive).
**Date:** 2026-07-15 · **Status:** DRAFT — awaiting design gate

> **What this fixes (Bertrand, verbatim):** the accueil + level-select are _surchargé_ in mobile
> landscape; "on ne dirait pas un écran d'accueil de jeu vidéo"; the top bar's usefulness is in doubt;
> "on sent que c'est une SPA"; even fullscreen there is no room. This spec is the answer, element by
> element.

---

## 0. The measured problem (why it reads as an SPA, not a game)

Mobile landscape is **not blocked** — only portrait is (`App.tsx:125`, `rotateBlocked = IS_MOBILE &&
isPortrait`). So TITLE and MENU render at a viewport height of **~360–430 px**. Against that budget:

**TITLE** is a centered vertical stack of ~11 elements inside `PaperSheet`, which is
`overflow: hidden` (`PaperSheet.tsx:51`). Summing the shipped `TitleScreen.tsx` at ~360 px height:

| Block                                                    | Approx height |
| -------------------------------------------------------- | ------------- |
| content padding (48 px ×2)                               | 96            |
| MUF wordmark `clamp(80,14vw,160)`                        | ~81           |
| issue label + subtitle + year tag                        | ~50           |
| hero image `clamp(88,17vh,150)` (floors at 88) + margins | ~106          |
| divider + margins                                        | ~46           |
| 3 teaser lines @ 1.9 line-height                         | ~68           |
| infoline row + CTA + microcopy + margins                 | ~120          |
| **total**                                                | **≈ 567 px**  |

**≈ 567 px of content in a ≈ 360 px hidden-overflow frame ⇒ the bottom ~200 px is clipped — and the
bottom is where the CTA `[ COMPOSE L'INFO-LINE ]` and its cursor live.** The single load-bearing action
is literally below the fold in landscape. That is the bug, and it is why the screen feels like a
document you can't finish reading.

**MENU** stacks **two full-width chrome rows** before any content: the running-masthead bar
(`MainMenu.tsx:70`, ~46 px) + the sommaire tablist (~60 px) ≈ **106 px of chrome ≈ 30 % of a 360 px
viewport**. The remaining ~250 px must hold `FlyerWall`, whose flyers are `minHeight: 72px` +
`marginBottom: 22px` ≈ 130 px each ⇒ **fewer than two flyers visible**, the rest reached by vertical
page-scroll. Chrome dominates; the choosable content is a scrolling column. That is the SPA feel.

**Design verdict:** the pre-game screens were authored for a **tall** viewport and merely _survive_
landscape by scrolling/clipping. Landscape needs its own composition — a horizontal one — not a
squeezed portrait. This spec authors it.

---

## 1. The responsive rule (one breakpoint, no regression)

### 1.1 The switch

Add ONE additive layout mode, keyed on **short height in landscape**:

```
SHORT-LANDSCAPE  ⇔  @media (orientation: landscape) and (max-height: 480px)
```

- **Rationale for 480 px.** Phones in landscape sit at height **360–430 px** (iPhone SE 375, iPhone
  Pro Max ~430, small Android ~360) — all caught. The smallest laptop is ~640–800 px tall and a tablet
  in landscape (iPad ~768) is ~768 px tall — none caught, so they keep the current comfortable layout.
  480 px is the clean gap between "phone on its side" and "everything with room". **Height, not width,
  is the constraint** — the SPA feel is a vertical-space problem, so the query gates on `max-height`.
- Implementation home: a single exported token in `src/render/ui/print/tokens.ts`
  (`SHORT_LANDSCAPE = "(orientation: landscape) and (max-height: 480px)"`) so both surfaces read one
  source of truth (mirrors ADR-0021 D3's single-source discipline). Consumed via a small render-local
  `useMediaQuery`-style hook or a CSS `@media` block — **`dev-r3f-render`'s implementation call**; this
  spec fixes the _breakpoint and the layout_, not the mechanism.

### 1.2 What must NOT regress (everything above the breakpoint)

**Portrait (any height) and landscape taller than 480 px (tablet / desktop) keep the shipped layout
byte-for-byte:** TITLE stays the centered vertical cover (it fits when tall), MENU keeps its
two-row masthead + sommaire and the **vertical** jittered flyer stack (UX §3.2). The short-landscape
rules in §2–§3 are **additive overrides inside the media query only.** Design acceptance must confirm
the tall layouts are visually unchanged.

---

## 2. TITLE in short-landscape — two-column cover (identity left, action right)

**Decision: two-column, not compressed single-column.** Landscape is _wide_; a horizontal split uses
the aspect ratio natively and lets the one action live in its own always-visible zone. A compressed
single column would still be a top-to-bottom stack — the same SPA gesture, just shorter. Two columns
read as a **poster with a "press start"**: cover identity on the left, the single call-to-action framed
on the right, both fully on-screen with zero scroll.

```
 ┌───────────────────────────────────────────────────────────────┐
 │  UNDERGROUND PARIS · FANZINE CLANDESTIN · N°23 · NE SE VEND PAS│  ← masthead strip (full width, ~16px)
 ├──────────────────────────────────┬────────────────────────────┤
 │                                  │                            │
 │            M U F                 │    ☎ 08 36 23 98 23        │
 │   UN SON · UNE NUIT · PAS        │                            │
 │        D'ADRESSE                 │   ╭──────────────────────╮ │
 │   ┌──────────────────────┐       │   │ [ COMPOSE L'INFO-    │ │
 │   │   halftone facade     │      │   │   LINE ] ▍            │ │
 │   │      (hero)           │      │   ╰──────────────────────╯ │
 │   └──────────────────────┘       │      (marker circle +      │
 │                                  │       blinking cursor)     │
 │   LEFT ≈ 56% (identity)          │    RIGHT ≈ 44% (the action)│
 └──────────────────────────────────┴────────────────────────────┘
        keep 44px clear of the bottom-right (FullscreenButton, ADR-0008)
```

### 2.0 Ground-truth failures this layout must kill (from real landscape screenshots)

| Observed failure (landscape)                                 | Root cause in shipped `TitleScreen.tsx`                                                                                          | Fix in this layout                                                                                                                                                                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MUF wordmark **clipped behind the top black masthead strip** | masthead is `position: absolute; top:0` **overlaying** a `justify-content:center` column, so at short height MUF slides under it | In short-landscape the two columns are sized to fit with top clearance so **MUF can never sit under the strip** (impl kept the masthead `position:absolute` — see §2.1 note — rather than de-overlaying, which would overflow `PaperSheet`'s hidden height). |
| Hero halftone **entirely off-screen**                        | column overflows the hidden-overflow sheet                                                                                       | Hero moves into the **left column**, shrunk to `clamp(72px,26vh,130px)`, inside the ~248 px budget — always on-screen.                                                                                                                                       |
| CTA + microcopy **below the fold**                           | ~567 px stack in a ~360 px frame; CTA is last                                                                                    | CTA moves to the **right column, vertically centered** — first-class, never below a fold.                                                                                                                                                                    |
| **Dead empty band** mid-screen (divider → teasers)           | fixed 44 px divider margins + `justify-content:center` gaps stretch open at short height                                         | Divider **CUT**, teasers **CUT**, two-column framing removes the vertical dead band entirely.                                                                                                                                                                |

**Explicit teaser/hero verdict for short-landscape:** **teasers CUT, hero KEPT (shrunk).** The hero is
the "this is a game" image and earns its space; the teasers are the scrollable article bulk that creates
the dead band — they go.

### 2.1 Element fate table (short-landscape only)

| Element (shipped `TitleScreen.tsx`)             | Fate              | Landscape treatment / rationale                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Masthead strip (`MASTHEAD.full`)                | **KEEP**          | Thin full-width ink bar at top, ~16 px. _Implementation note (dev):_ kept `position:absolute` (de-overlay would overflow `PaperSheet`'s hidden height and risk the portrait cover); instead the two centered columns are sized to fit with top clearance, so **MUF is never clipped behind the strip**. Carries N°23 identity. |
| `MUF` wordmark                                  | **KEEP + SHRINK** | Left column anchor. `clamp(80,14vw,160)` → **`clamp(48px, 11vh, 84px)`** — height-driven so it can never blow the budget. Still the biggest type on screen.                                                                                                                                                                    |
| `SUBTITLE` "UN SON · UNE NUIT · PAS D'ADRESSE"  | **KEEP**          | The load-bearing tagline; one line under the wordmark.                                                                                                                                                                                                                                                                         |
| Hero image (belliard halftone)                  | **KEEP + SHRINK** | Left column, under the tagline. Height **`clamp(72px, 26vh, 130px)`**, remove the `min` floor that forces 88 px. This is the "this is a game, not a form" visual — never cut.                                                                                                                                                  |
| `ISSUE_LABEL` "★ HIVER 1998 ★"                  | **KEEP**          | Design-gate + narrative correction: `MASTHEAD.full` carries **no year**, so this is the **sole 1998/era anchor** on the short-landscape cover. Kept visible (16 chars, season + year). Left column, above the wordmark.                                                                                                        |
| `YEAR_TAG` "1998 · PÉRIPHÉRIE…"                 | **CUT**           | The redundant year carrier: its geography (`PÉRIPHÉRIE & ARRONDISSEMENTS`) is already carried by `UNDERGROUND PARIS` + the flyer districts, and the year survives via `ISSUE_LABEL`. Safe to hide at short height.                                                                                                             |
| Divider rule (2 px, 44 px margins)              | **CUT**           | Pure vertical spend; the column gap does its job.                                                                                                                                                                                                                                                                              |
| 3 teaser lines (`► …`)                          | **CUT**           | This is the bulk that makes the cover read as a scrolling article. Gone in landscape. **(copy-hide — flag to narrative, §5)**                                                                                                                                                                                                  |
| `INFOLINE_ROW` "☎ 08 36 23 98 23"               | **KEEP + REFLOW** | Moves to the **right column**, directly above the CTA — the number you "call" sits with the action it labels.                                                                                                                                                                                                                  |
| CTA `[ COMPOSE L'INFO-LINE ]` + cursor          | **KEEP + REFLOW** | **Right column, vertically centered — the guaranteed-visible primary action.** Marker circle + blinking cursor unchanged. Mount focus stays here.                                                                                                                                                                              |
| `MICROCOPY` "le répondeur donne le point de RV" | **CUT**           | Nice-to-have; the CTA + number + cursor already say "act here". **(copy-hide — flag to narrative, §5)**                                                                                                                                                                                                                        |

### 2.2 Behaviour preserved

- **Whole surface stays the single hit target** (ADR-0021 D1) — the two columns are visual framing, not
  two buttons. Click/tap/key anywhere → `onEnter()`, excluding `[data-muf-ui]`. The right-column CTA is
  the _visible affordance_, exactly as today.
- **Mount focus** rests on the CTA so the marker ring shows the one action.
- **Height budget check (target 360 px):** masthead 16 + padding ~24 + MUF ~72 + subtitle ~16 + hero
  ~120 = **≈ 248 px** in the left column; the right column (number ~16 + CTA ~48, centered) fits in the
  same band. **Nothing clipped, CTA always visible.** Design acceptance measures this at 360 px height.
- **Keep 44 px clear of the bottom-right corner** so the right-column CTA never collides with the
  FullscreenButton (ADR-0008 / UX §5).

---

## 3. MENU / level-select in short-landscape — collapse the chrome, let the flyers be the wall

### 3.0 Ground-truth failures this layout must kill (from real landscape screenshots)

| Observed failure (landscape)                                             | Root cause                                                             | Fix in this layout                                                                                                                                |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masthead band + tab band together **eat > 50 % of height**               | two stacked full-width chrome rows (~106 px) on a ~360 px viewport     | Collapse to **one ~44 px strip** (§3.1): `MUF` mark + three tabs share one row; the descriptive masthead string is dropped. Chrome ~30 % → ~12 %. |
| Only a **sliver of the first flyer (Tutoriel)** visible; rest off-screen | vertical stack, each flyer ~130 px, under 106 px of chrome             | Horizontal **flyer rack** (§3.2): flyer cards fill the ~300 px content band, **2–3 fully visible at once**, remainder one horizontal scroll-snap. |
| "Top bar is useless"                                                     | descriptive masthead string is pure decoration one tap after the title | The string is **CUT**; only a functional `MUF` home/Escape-back mark survives.                                                                    |

### 3.1 The top bar (Bertrand's doubt, adjudicated)

**Fate of the running-masthead bar: COLLAPSE, don't keep, don't fully remove.** The full descriptive
masthead string (`MASTHEAD.running` — "UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998") is exactly the
"SPA header" that triggers the complaint, and it is **redundant** one tap after the title cover. In
short-landscape:

- **CUT** the standalone masthead _row_ and its descriptive string.
- **KEEP** a single small **`MUF`** wordmark (~20 px) as the home/identity anchor and the visual "back
  to cover" cue (Escape → TITLE still works, `App.tsx:150`).
- **MERGE** that `MUF` mark into the **same strip** as the sommaire tabs.

**Fate of the sommaire tabs (NIVEAUX / SCORES / OPTIONS): KEEP, compacted.** They are the only way to
reach Scores and Options — non-negotiable navigation, not decoration. But they move into the shared
compact strip and lose nothing but height.

**Result: two chrome rows (~106 px) → one compact strip (~44 px).** ~62 px of height handed back to the
content. Chrome drops from ~30 % of the viewport to ~12 %.

```
 ┌───────────────────────────────────────────────────────────────┐
 │ MUF            [ NIVEAUX ]   SCORES    OPTIONS                 │  ← one 44px strip (chrome ≤12%)
 ├───────────────────────────────────────────────────────────────┤
 │  ╭─────────╮  ╭─────────╮  ╭─────────╮   →  ╭ (scroll/snap)    │
 │  │ SPIRALE │  │ KANAL   │  │ NADIR   │      │                  │
 │  │  23     │  │ SYSTEM  │  │  94     │      │                  │
 │  │ Belliard│  │Stalingr.│  │ Vitry 94│      │                  │
 │  │ …flyer… │  │ …flyer… │  │ …flyer… │      │                  │
 │  ╰─────────╯  ╰─────────╯  ╰─────────╯      ╰                  │
 │        HORIZONTAL flyer rack — the choosable content dominates  │
 └───────────────────────────────────────────────────────────────┘
```

### 3.2 The flyer wall becomes HORIZONTAL in landscape

**Decision: yes — a horizontal flyer rack with scroll-snap, not a vertical scroll.** Rationale:

1. It fixes the "document you scroll" feel: a **horizontal rack reads as a game level-select / gallery**,
   not a web page. Vertical scrolling is the single strongest SPA tell; kill it here.
2. It is **more faithful to §5's "wall of taped-up rave flyers"** — a wall is horizontal. This is a
   conscious reading of the existing (already-extension-approved) flyer-wall spec, not a new mechanic;
   the _read_ §5 asks for is better served side-by-side.
3. With 4 flyers (tutorial + belliard + stalingrad + vitry), **2–3 fit across** a landscape width at
   once; the remainder is one horizontal scroll-snap gesture — a deliberate rack slide, not a page.

### 3.3 Element fate table (MENU, short-landscape only)

| Element (shipped `MainMenu.tsx` / `FlyerWall.tsx`) | Fate                      | Landscape treatment / rationale                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Running-masthead row + `MASTHEAD.running` string   | **CUT**                   | The SPA header; redundant after the title. **(copy-hide — flag to narrative, §5)**                                                                                                                                                                                                                                                                    |
| `MUF` wordmark (header)                            | **KEEP + SHRINK + MERGE** | ~20 px, left end of the single chrome strip; identity + Escape-back cue.                                                                                                                                                                                                                                                                              |
| Sommaire tablist (NIVEAUX/SCORES/OPTIONS)          | **KEEP + MERGE**          | Same 44 px strip, right of the MUF mark. Active rubrique marker-circled as today; tabs stay ≥ 44 px tall (touch floor, UX §3.4).                                                                                                                                                                                                                      |
| `FlyerWall` container                              | **REFLOW**                | `flexDirection: column` → **`row`** with `overflow-x: auto` + CSS scroll-snap (`scroll-snap-type: x mandatory`, each flyer `scroll-snap-align: start`). Remove vertical `overflow-y`.                                                                                                                                                                 |
| Each `LevelFlyer`                                  | **RESHAPE**               | Fixed-width card **~240–280 px wide**, height **fills the content band (~300 px of a 360 px viewport, `height: calc(100% - gap)`)**. At this size the full ~8-line flyer (UX §4.1) reads at rest — pull-to-front becomes an emphasis, not a requirement to read data.                                                                                 |
| Flyer rest rotation / jitter / tape / pull         | **KEEP**                  | Unchanged tokens (`FLYER_REST_ROTATION_DEG`, `FLYER_JITTER_PX`, ±3° cap, `flyerPull`). A rack of slightly-tilted taped flyers is the intended read in either orientation.                                                                                                                                                                             |
| Roving keyboard focus                              | **REFLOW**                | `useRovingIndex` axis `vertical` → **`horizontal`** in short-landscape (arrows `←/→` move across the rack). Wrap stays `false`. Enter/locked-shake unchanged.                                                                                                                                                                                         |
| Mount focus                                        | **KEEP**                  | Lands on the first flyer so the marker ring shows "this is choosable", not a document.                                                                                                                                                                                                                                                                |
| SCORES (`ScoresUne`)                               | **KEEP + GUARD**          | Under the collapsed chrome it has ~62 px more room. The classement may scroll _within its own column_ (reads as reading an article, acceptable) — but the masthead + top entry must be above the fold. If it still overflows at 360 px, reflow to two columns (masthead/lead left, classement right). Detailed pass owed only if acceptance flags it. |
| OPTIONS (`OptionsColophon`)                        | **KEEP + GUARD**          | Original spec (UX §5) says it fits without scroll at mobile height; the collapsed chrome only helps. Verify at 360 px; if the colophon block + controls overflow, drop the static 5-line colophon body to a 2-line credit in short-landscape (**copy-hide — flag to narrative**) rather than scroll.                                                  |

### 3.4 Height budget check (MENU, target 360 px)

Chrome strip 44 + content band ~300 (flyer cards) + gaps ≈ 356. **Flyers own ~84 % of the viewport; no
vertical page scroll.** The only scroll is the horizontal rack slide when a 4th flyer is off-screen.

---

## 4. "Feels like a game, not an SPA" checklist (the acceptance signals)

A short-landscape build reads as a game front-end when **all** hold (each is verifiable at 360 px
height):

1. **One frame, no page scroll.** Neither TITLE nor MENU scrolls vertically. The _only_ permitted scroll
   is the horizontal flyer rack (a deliberate gallery gesture). No element is clipped by
   `PaperSheet`'s `overflow: hidden`.
2. **The one action is always on-screen.** TITLE's CTA sits in the right column, never below a fold;
   MENU's flyers are the largest thing in view. The player never scrolls to find "how do I start".
3. **Content dominates chrome.** Mastheads + tabs occupy **≤ 15 %** of viewport height (title masthead
   ~16 px; menu chrome one ~44 px strip). Currently the menu spends ~30 % — this is the headline fix.
4. **Composed like a poster, not a form.** Full-bleed paper stock, content framed/centered (two-column
   cover; horizontal rack), not a left-aligned top-to-bottom text flow.
5. **Input has an obvious home.** Mount focus lands on the CTA (title) / first flyer (menu); the marker
   ring says "a thing is waiting for you", the way a title screen says PRESS START — not "here is a
   document".
6. **Nothing surchargé.** Every non-load-bearing line (teasers, year tag, issue label, microcopy, the
   descriptive running masthead) is hidden at short height. What remains is: identity, one image, one
   action (TITLE); identity mark, three tabs, the flyers (MENU). Nothing else competes.

---

## 5. Hand-offs & flags

- **`narrative-designer` (Yasmine) — copy-hides to confirm.** Short-landscape _hides_ (does not delete
  from canon) these player-facing strings: TITLE teaser lines ×3, `YEAR_TAG`, `ISSUE_LABEL`, `MICROCOPY`;
  MENU `MASTHEAD.running` descriptive string; (conditional) OPTIONS 5-line colophon body → 2-line credit.
  I have **not** rewritten any word — these are visibility cuts at one breakpoint. Please confirm the
  cover still reads with subtitle-only, and the menu with a bare `MUF` mark. If any of these must stay
  visible for fiction reasons, that is your call and I reflow around it.
- **`lead-art` (Nico) — the READ, not the style.** In short-landscape the flyer must read as an ~8-line
  taped flyer at ~240–280 px wide / ~300 px tall _at rest_ (crew, title, difficulty stamp, AMBIANCE
  glanceable without pull-to-front). Two-column TITLE hero at `clamp(72,26vh,130)` must still read as a
  degraded xerox facade. No new asset implied.
- **`senior-architect` (Winston).** The `SHORT_LANDSCAPE` media-query token is additive in
  `src/render/ui/print/tokens.ts` (ADR-0021 D3 home); the axis flip in `useRovingIndex` and the
  `FlyerWall` row/column switch are render-only. No `AppPhase` / `Prefs` / `levels.ts` / game-state
  touch — same boundary posture as ADR-0021. An ADR addendum may be warranted for the landscape mode;
  your call.
- **`dev-r3f-render` (Amelia).** Implementation owns the media-query mechanism (hook vs CSS), exact final
  px within the ceilings here, and scroll-snap wiring. This spec fixes breakpoint, composition, and
  element fate — not the code.
- **Design acceptance (stage 5).** Playtest at **360 px height** landscape via the `verify` skill against
  §4's six signals + the two height budgets (§2.2, §3.4). Report PASS/deviations to `lead-game-designer`
  before architect review. Log this hand-off in `docs/agent-handoffs.md`.

---

## 6. Cahier des charges note

Prohibition (Atari ST, 1987) had no mobile-landscape entry flow — the whole pre-game fanzine experience
is an already-approved, documented extension (ADR-0021, UX spec). This spec adds **no mechanic and no
copy**: it is a responsive _layout_ of that approved extension for a viewport the original never faced.
The horizontal flyer rack is a layout reading of §5's "wall of flyers", not a new system. Core loop
`Récupérer → Livrer → Éviter` untouched.
