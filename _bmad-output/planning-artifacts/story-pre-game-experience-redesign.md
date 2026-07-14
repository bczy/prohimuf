# Story: Redesign the pre-game experience (title → menu → briefing)

**Type:** Presentation / UX redesign (fanzine UI compliance) — no new mechanic ·
**Status:** ready-for-design (hands to the DESIGN LOOP: `game-designer` + `narrative-designer`
→ `lead-game-designer` design gate → `senior-architect` for lanes) ·
**Date:** 2026-07-14 · **PM:** John · **Intake:** Bertrand — _"revoir totalement le menu de
lancement et tout ce que l'on peut trouver avant de jouer"_ ·
**Surfaces:** `src/render/ui/StartScreen.tsx`, `MainMenu.tsx`, `NarrativeScreen.tsx`,
`RotateOverlay.tsx`, `FullscreenButton.tsx`, flow in `src/render/scene/App.tsx`

## Why (product value)

The pre-game experience is the game's first impression and — per the guidelines — its first
piece of fiction. Today it reads as **a prototype, not the fanzine world it promises**:

- **There is no title moment.** `StartScreen.tsx` exists but is **orphaned dead code** —
  `App.tsx` boots cold straight into `MENU` and nothing imports `StartScreen`. The player
  lands on a functional admin panel with zero "you are entering the underground" beat.
- **The menu is an admin panel, not a zine.** `MainMenu` is a generic tabbed settings UI
  (`NIVEAUX / SCORES / OPTIONS`): level select is a stack of bordered `<div>` cards, scores
  is an HTML `<table>`, options is sliders + number buttons. PROJECT_GUIDELINES §5 ("UI
  Fanzine") is explicit and currently **unmet**: _le menu principal est une couverture de
  zine · la sélection de niveau est une pile de flyers de raves · [le game over] une UNE de
  journal_. The current screens are the tab UI, not the artifact.
- **The screens don't feel like one object.** Every screen re-declares its own neon hex
  constants (`NEON_YELLOW` etc. duplicated in `StartScreen`, `MainMenu`, `NarrativeScreen`,
  `RotateOverlay`), reuses the same darkened `belliard/facade.png` as a placeholder wash,
  and hard-cuts between phases with no shared motif or Paper-Mario unfold. It looks
  assembled, not art-directed.

Redesigning these screens is **the highest-leverage, lowest-risk polish available**: it makes
the world legible before a single shot is fired, and it does not touch the core loop.

## Cahier des charges test — verdict: FAITHFUL IMPLEMENTATION (no new scope)

> _"Est-ce que Prohibition Atari ST avait ça ?"_ — Prohibition had a title screen, a
> level/menu front-end and a score display. A launch menu is **original feature surface**, not
> an invention. This story does not add a mechanic, a mode, a level, or a system — it brings
> the **presentation** of already-shipped screens into compliance with PROJECT_GUIDELINES §5
> ("UI Fanzine") and docs/art-direction.md, which already **mandate** the zine-cover menu,
> flyer-stack level select and journal score sheet. Net scope surface is unchanged; fidelity
> to the fanzine direction improves. **Any NEW pre-game feature** (extra modes, credits,
> how-to-play, language toggle, menu BGM) is explicitly OUT unless separately justified — see
> Out of scope.

## What — Acceptance Criteria (testable)

- **AC1 — A real entry/title moment, wired.** On a cold load (no `?preview=` param) the app
  shows a redesigned **zine-cover title/entry screen** before the menu; a single action
  (click / tap / key) enters the menu. No orphaned pre-game UI component remains: `StartScreen`
  is either wired into the `App` phase flow or replaced by the new entry screen — a
  grep for the component finds it rendered, not dead. _Verify:_ fresh load shows the title;
  one action → menu; `Grep StartScreen` (or its successor) shows a real import in `App.tsx`.
- **AC2 — The menu reads as a fanzine artifact, not an admin panel.** Per §5, the three
  surfaces are redesigned as in-universe artifacts: the menu shell reads as a **zine cover**;
  level select reads as a **pile of rave flyers** (not uniform bordered cards); the high-score
  view reads as a **fictional journal / UNE** page; OPTIONS reads as a form-in-a-zine. _Verify:_
  screenshots vs the gated design + art spec (lead-game-designer + lead-art sign-off).
- **AC3 — One cohesive visual system across all pre-game screens.** Title, menu, and the
  `NarrativeScreen` frame share one visual language (type scale, xerox grain, neon-accent
  usage from the art-direction.md hex palette — orange `#FF8C14`, cyan `#28F0FF`, magenta
  `#FF3CDC`, green `#78FF3C` — and a shared header/corner motif). The neon palette is sourced
  from **one shared definition**, not re-duplicated per component. _Verify:_ visual review +
  no per-file redeclaration of the palette hexes. _(Where the single source lives = architect
  call; likely a small shared style/token module read by the render lane.)_
- **AC4 — Reskin, not re-plumb: behavior & data unchanged.** Every existing pre-game flow
  still works identically — level-unlock gating, the `tutorial` card → `TUTORIAL` phase, play →
  optional `NARRATIVE_PRE` → `PLAYING`, prefs read/write (SFX/music/lives/difficulty), score
  display per level. **No change** to `Prefs` schema (`prefsSystem`), high-score schema
  (`highScoreSystem`), level data (`levels.ts`), or `stateMachine`. _Verify:_ existing Vitest
  suite green with no test edits to game systems; each flow reachable in the browser.
- **AC5 — UX non-negotiables (§5) hold.** Launch → gameplay for a returning player who clicks
  through stays **under the 10-second budget**; every pre-game screen advances/skips in **one
  action**; no screen traps the player (title, menu tabs, briefing, back-to-menu all
  reachable). _Verify:_ timed click-through + manual traversal.
- **AC6 — Mobile & overlays intact.** Redesigned screens stay landscape-first; `RotateOverlay`
  still covers **all** pre-game phases (ADR-0003); `FullscreenButton` still renders above them
  (ADR-0008); flyer/menu touch targets are usable at mobile size. _Verify:_ mobile emulation,
  portrait (overlay) + landscape (screens).
- **AC7 — No new game mechanics, systems, or levels.** The diff is confined to
  `src/render/ui/**` (+ view-side `src/hooks/**` and one shared style/token module if the
  architect approves it). **Zero** new files under `src/game/systems/**` or
  `src/game/levels/**`; the core loop `Récupérer → Livrer → Éviter` is untouched. _Verify:_
  `git diff` path audit + cahier-des-charges check at PM acceptance.
- **AC8 — Verified green + screenshot-capturable.** `rtk tsc` + `rtk vitest` + `rtk lint`
  clean; screens confirmed in-browser via the `verify` skill. The preview harness in `App.tsx`
  gains entries (e.g. `?preview=title` / `?preview=menu`) so title and menu are screenshot-
  capturable like the existing `narrative|end|tutorial`. An ADR is added if the render contract
  changes (new shared token module and/or a new `App` phase for the title). _Verify:_ green
  gates + preview screenshots attached.

## Design-loop brief (what the next stage owns — do NOT solve it here)

This story is the **WHAT/WHY**. The redesign itself is a design + art problem:

- **`game-designer` (Sacha):** menu 3C & information architecture — the navigation flow
  (title → menu → briefing → play/back), what a "flyer stack" affords vs. the current tab bar,
  readability and hierarchy of level cards-as-flyers, options ergonomics. No new mechanic.
- **`narrative-designer` (Yasmine):** **every player-facing French word** on these screens —
  the title tagline, flyer copy per level, the journal masthead/columns for scores, options
  labels, entry CTA. In-game text stays French (current strings are the baseline to elevate,
  e.g. `[ CLIQUER POUR ENTRER ]`, `UNDERGROUND PARIS — FANZINE CLANDESTIN`).
- **`lead-game-designer` (Karim):** design gate — PASS required before the architect assigns
  lanes.
- **`lead-art` (Nico):** the visual artifact treatment (zine cover / flyer / journal) lives in
  the art flow against docs/art-direction.md; the shared neon palette is already hex-anchored
  there (§2) and must be the single source AC3 points to.
- **`senior-architect` (Winston):** feasibility, lane partition (render lane, possible shared
  token module), and the ADR call for AC3/AC8 (new phase + palette source of truth).

## Out of scope (explicit)

- **No new pre-game features.** No credits screen, no how-to-play beyond the existing tutorial
  card, no settings beyond today's (SFX/music/lives/difficulty), no language toggle, no new
  game modes. Any of these = a separate story that must pass the cahier-des-charges test.
- **No new game mechanics, systems, tuning, or levels.** Presentation only.
- **No schema or state-machine changes** — `Prefs`, high scores, `levels.ts`, `stateMachine`
  stay byte-compatible; existing saves keep working.
- **In-game HUD, `PauseScreen`, and `EndScreen` are NOT in this story** — they are in/after
  play, not "avant de jouer." The shared visual system built here should be **reusable** so a
  later story can align them, but touching them now is out.
- **`NarrativeScreen` behavior is frozen** — typewriter, skip button, progress dots, and its
  three call sites (pre / post / tutorial) keep their current behavior and wiring. Only its
  **visual frame** joins the cohesive system (AC3).
- **Menu / ambient BGM is a follow-up**, not required here (keeps this render/UX-focused and
  avoids opening the audio lane). If desired, spin a separate audio-flow story.

---

_Next: `lead-game-designer` splits the design work (`game-designer` ∥ `narrative-designer`),
runs the DESIGN GATE, then `senior-architect` partitions lanes. Log the hand-off in
`docs/agent-handoffs.md`. Devs implement only the gated design._
