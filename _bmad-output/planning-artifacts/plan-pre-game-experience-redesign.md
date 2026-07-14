# Technical plan — pre-game experience redesign (stage 4: HOW + lanes)

**Architect:** `senior-architect` (Winston) · **Date:** 2026-07-14 ·
**Story:** `_bmad-output/planning-artifacts/story-pre-game-experience-redesign.md` ·
**Design gate:** PASS WITH CONDITIONS (`docs/game-design/pre-game-design-gate.md`) —
conditions are additive spec amendments, none touching feasibility or the render-only lane
assignment.
**Inputs:** UX spec `docs/game-design/pre-game-experience-ux.md` · copy deck
`docs/game-design/pregame-copy-deck.md` · art law + tokens `docs/art-direction.md`
§2bis / §2bis.1 · current code `src/render/ui/*`, `src/render/scene/App.tsx`.
**ADR:** `docs/adr/0020-pre-game-print-system-and-title-phase.md` (written with this plan).

> **This is the HOW.** It turns the gated design into a buildable, boundary-safe,
> parallel-partitioned dev plan. It invents no mechanic, changes no game data, and confines
> the entire diff to `src/render/**` (+ the deletion of one orphaned file). `src/game/**` is
> **byte-identical** at the end of this story.

---

## 0. Rulings carried in from the design gate (do not relitigate)

Locked upstream; this plan implements them, it does not reopen them:

- New **TITLE** phase is a branch of the render-layer `AppPhase` union in `App.tsx` local
  `useState` — **not** the game `stateMachine` (`src/game/systems/stateMachine.ts` is
  byte-untouched). (gate (b))
- `StartScreen.tsx` is **replaced by a new `TitleScreen` and deleted** — no orphaned pre-game
  component remains (AC1; UX §7.1).
- All pre-game surfaces are reskinned as **print artifacts** using the §2bis.1 tokens; **zero
  glow** on menu surfaces (art-direction §2bis; UX §0).
- `NarrativeScreen` **visual frame** joins the print system; its **behaviour, scripts and
  three call sites are frozen** (gate (d) — PRINT frame ruling).
- A **single source** for palette tokens + masthead strings (home = architect's call, ruled
  below in §2).
- `?preview=title|menu` preview hooks added; the three existing params
  (`narrative|end|tutorial`) stay byte-identical (UX §6).
- CSS / inline-SVG only. **No new generated assets, no new fonts, no CI render-farm run, no
  lead-art gate** (the halftone/stamp/marker treatment is all CSS + inline-SVG per §2bis.1).

---

## 1. Component breakdown (all under `src/render/`)

### 1.1 New shared print module — `src/render/ui/print/`

A new folder groups the single-source tokens and the reused print primitives. Everything here
is **pure presentation** (plain data + dumb view components); it imports **no** `src/game`
symbol and holds **no** game rule.

| File                                  | Kind                | Responsibility                                                                                     |
| ------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `print/tokens.ts`                     | constants (no JSX)  | **The AC3 single source**: `STOCK`, `INK`, `MARK`, `MASTHEAD`, flyer geometry + `MOTION` tokens.   |
| `print/PaperSheet.tsx`                | primitive           | The print ground: solid stock + dot-screen overlay + toner speckle + fold streaks. Zero glow.      |
| `print/HalftoneHero.tsx`              | primitive           | A facade PNG rephotocopied to pure B&W (`grayscale(1) contrast(2.2) brightness(1.1)`) + hero dots. |
| `print/Stamp.tsx`                     | primitive           | Rubber-stamp / ballot mark (box · oval · diagonal shapes), optional struck-through.                |
| `print/MarkerCircle.tsx`              | primitive           | Always-visible inked focus/selection ellipse (keyboard focus never invisible, §2bis).              |
| `print/TapeCorner.tsx`                | primitive           | Tape-pin corners for the front / selected flyer.                                                    |
| `print/useRovingIndex.ts`             | render-layer hook   | Roving keyboard focus (arrows + Enter) for the list surfaces. **Not** a game↔R3F bridge (§4).      |
| `print/index.ts`                      | barrel              | Re-exports the above so surfaces import from `@render/ui/print`.                                     |

`prefers-reduced-motion` is honoured inside `PaperSheet`/primitives (they read the media query
and drop tweens to 0; the typewriter cursor is content, not decoration, and survives — UX §2.0).

### 1.2 New TITLE surface — `src/render/ui/TitleScreen.tsx`

Replaces the orphaned `StartScreen.tsx`. Zine-cover artifact on `STOCK.jaune`, single-action
entry (the diegetic "compose l'info-line" CTA), whole-screen hit target, blinking typewriter
cursor (the one allowed pulse). Copy verbatim from copy-deck §1. Fires `onEnter()` immediately
on first click / tap / printable key / Enter / Space / Escape, regardless of typewriter
progress (no dwell — AC5). Excludes events whose target is inside `[data-muf-ui]` (mirror the
`NarrativeScreen` skip `stopPropagation` pattern) so tapping the fullscreen button never skips
into the menu (UX §5).

### 1.3 Reskinned MENU surfaces — `src/render/ui/MainMenu.tsx` (+ extracted `menu/`)

`MainMenu` becomes the zine-interior shell (running masthead + a hand-inked **sommaire**
replacing the glowing yellow `TabBar`). The three rubriques are extracted into their own files
so the surfaces stay small and the flyer/UNE/colophon read as distinct artifacts:

| File                                | Was                             | Becomes                                                                     |
| ----------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `src/render/ui/MainMenu.tsx`        | shell + TabBar + 3 inline tabs  | zine shell + sommaire nav; composes the three surfaces below.               |
| `src/render/ui/menu/FlyerWall.tsx`  | `LevelCard` map (bordered divs) | NIVEAUX — jittered ±3° vertical stack of `LevelFlyer`s (UX §2.3, §3.2).      |
| `src/render/ui/menu/LevelFlyer.tsx` | `LevelCard`                     | one flyer per level, own fluo stock, stamps, tape, locked treatment.        |
| `src/render/ui/menu/ScoresUne.tsx`  | `ScoresTab` (`<table>`)         | SCORES — `PARIS-MINUIT` journal _UNE_ (masthead + classement, not a table). |
| `src/render/ui/menu/OptionsColophon.tsx` | `PrefsTab` + `Slider`      | OPTIONS — `OURS` colophon: inked VU meters + ballot boxes.                   |
| `src/render/ui/menu/derivations.ts` | inline in `LevelCard`           | pure `difficultyMark()` + `bestScore` selection (render-side, unit-tested).  |

> **Extraction rationale (surgical):** `MainMenu.tsx` currently inlines five components in
> one 456-line file. The reskin rewrites every one of them; splitting the three rubrique
> surfaces + the flyer into `menu/` keeps each artifact legible and lets the difficulty
> derivation become a **pure, testable helper** (repo pattern: `haloFalloff`, `muzzleFor`,
> `flipbook` are pure `.test.ts`-covered render helpers). This is a rewrite the story
> mandates, not gratuitous refactoring of untouched code.

### 1.4 Reskinned frame surfaces (behaviour frozen)

| File                                   | Change                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/render/ui/NarrativeScreen.tsx`    | **Frame only**: facade wash → `PaperSheet(paper-newsprint)`; scanlines → halftone; neon `#ffe600` rule → `ink-black` rule; glowing green `[ JOUER ]` → inked hint + typewriter cursor. Typewriter, `Passer`, progress dots, `advance`, `CHAR_DELAY_MS`, all three call sites **unchanged**. Header string → `MASTHEAD.running`. |
| `src/render/ui/RotateOverlay.tsx`      | Reskin: kill scanlines; 📱 emoji → inked phone/rotate glyph; black ground → paper stock + `ink-black`. Behaviour (portrait-only, pauses underneath, ADR-0003) unchanged. |

### 1.5 Explicitly UNTOUCHED

- `src/game/**` — **byte-identical**. `stateMachine.ts`, `prefsSystem.ts` (`Prefs` schema),
  `highScoreSystem.ts` (`ScoreEntry` schema), `levels.ts` (data + `enemySpeedMultiplier`),
  `narrativeSystem.ts` (scripts). Zero new files under `src/game/systems/**` or
  `src/game/levels/**` (AC7).
- `src/hooks/**` — untouched. The menu-nav hook lives in `src/render/ui/print/`, **not** here
  (§4 boundary ruling).
- `src/render/ui/FullscreenButton.tsx` — **stays neutral white chrome** with `data-muf-ui`
  (ADR-0008). It overlays the glowing game world too, where a neutral control is correct; it
  is system chrome, not a menu artifact (UX §5). **Do not** reskin it to ink.
- `src/render/ui/HUD.tsx`, `PauseScreen.tsx`, `EndScreen.tsx` — in/after play, out of this
  story (story "Out of scope"). The print system is built reusable so a later story can align
  them, but they are not touched now.

---

## 2. Where the single-source token module lives (boundary decision)

**Ruling: `src/render/ui/print/tokens.ts` — inside the render layer.**

The tokens are **presentation constants** (paper/ink/marker hexes, masthead strings, motion
durations, flyer geometry). They are consumed **only** by render components and encode a
**render decision** (the loi de l'imprimé), not a game rule. Therefore:

- They must **not** live in `src/game/**` — that folder is pure game logic and these are style
  facts, even though they are "just strings". Placing style in `src/game` would be a semantic
  boundary leak (the game layer would carry presentation truth it must never own).
- They must **not** live in `src/hooks/**` — that folder has one documented job: the game↔R3F
  bridge (`useGameLoop`, `useTopdownLoop`, `useAudio`, …). Menu palette is not a bridge.
- `src/render/ui/print/` is the correct home: render-only, imported by render surfaces,
  invisible to `src/game` and `src/hooks`. The boundary rule ("game never imports React/Three;
  render never holds rules") is satisfied — this module holds neither React nor a rule; it is
  the render layer's own style source of truth.

This is the AC3 single source: every hex the surfaces use is read from `print/tokens.ts`; no
component re-declares `NEON_YELLOW` / `#ffe600` / stock hexes. The masthead strings likewise
come from `MASTHEAD` (copy-deck §5.1), killing the three divergent per-file mastheads.

---

## 3. How `App.tsx` wires the TITLE phase

Four surgical edits to `src/render/scene/App.tsx` (Lane A owns them):

1. **Union:** `type AppPhase = "TITLE" | "MENU" | "NARRATIVE_PRE" | "PLAYING" |
   "NARRATIVE_POST" | "END" | "TUTORIAL";`

2. **Initial-state ternary (`useState<AppPhase>`):** cold load (no `?preview`) now boots
   **`TITLE`** (was `MENU`). Add `PREVIEW_SCREEN === "menu" → "MENU"` and
   `PREVIEW_SCREEN === "title" → "TITLE"`. Keep the `narrative | end | tutorial` branches
   byte-identical. `title` and the cold-load default collapse to the same `"TITLE"` tail; keep
   `menu` explicit so `?preview=menu` is a documented, tool-targetable capture (UX §6).

3. **Render branch** (before the `MENU` branch), routed through `renderAppShell` exactly like
   `MENU` so `RotateOverlay` (ADR-0003) and `FullscreenButton` (ADR-0008) wrap it (AC6):

   ```tsx
   if (appPhase === "TITLE") {
     return renderAppShell(
       <TitleScreen onEnter={() => setAppPhase("MENU")} />,
       rotateBlocked,
     );
   }
   ```

4. **Delete** `src/render/ui/StartScreen.tsx` (already orphaned — no import exists; grep
   confirms). AC1 "no orphaned pre-game UI component remains" becomes literally true.

No other `App.tsx` logic changes: `handlePlay`, `handleBackToMenu`, the audio-tension effect,
the score/unlock effect, `buildLevelParams`, the `PLAYING` path all keep their current wiring
(AC4). END still returns to MENU (unchanged); TITLE is only reachable on cold load / back
(`Escape` from the menu shell → TITLE, per UX §2.2 — a render-local handler in `MainMenu`).

---

## 4. Keyboard navigation approach

**Local render-layer state, with one small shared roving-focus helper — colocated in
`src/render/ui/print/`, NOT in `src/hooks/`.**

Rationale (boundary): `src/hooks/**` is documented as *the game↔R3F bridge* (architecture.md).
Menu keyboard nav bridges nothing to game logic — it is pure view interaction. Putting a
`useMenuNav` in `src/hooks/` would dilute that folder's single defined purpose. It belongs in
the render layer, colocated with the print primitives it serves. (The existing shipped pattern
is already component-local: `NarrativeScreen` owns its own `window` keydown listener; we follow
that grain.)

Design:

- **TITLE** and **rubrique switching** are simple enough for a component-local
  `useEffect(keydown)` (any key → enter; `←/→` cycle rubriques; `Escape` → TITLE). No hook
  needed — mirrors `NarrativeScreen`.
- **The three list surfaces** (flyer wall, scores edition switch, options rows) share a
  `useRovingIndex(count, opts)` helper (arrows move focus, Enter activates, always-visible
  `MarkerCircle` focus). Three consumers ≥ the repo's "3+ use cases" bar for a shared helper,
  and it keeps focus logic uniform and testable. Each surface wires its own semantics
  (vertical vs horizontal axis, what Enter does) around the shared index.

No `tabindex`-soup, no global focus manager — roving focus per active surface only, so keyboard
nav is never invisible (§2bis "focus = inked marker ellipse, always visible").

---

## 5. Lane partition (parallel-safe, non-overlapping file sets)

Two lanes. **File sets are disjoint** → git-parallel safe. The only coupling is that Lane B's
surfaces `import` from Lane A's `print/` module; that coupling is a **frozen API contract**
(§6), not a shared file. Both lanes code against the contract; they integrate only at the merge
panel. To keep typecheck green while running truly in parallel, **Lane A lands
`print/tokens.ts` + `print/index.ts` (with the real exports) as its first commit**; Lane B
builds on the published module. If sequencing is preferred over strict parallelism, run Lane A
to green first, then Lane B — but the disjoint sets mean parallel is safe.

### Lane A — `dev-r3f-render` (primary): print foundation + TITLE + wiring

Owns, exclusively:

- `src/render/ui/print/tokens.ts`
- `src/render/ui/print/PaperSheet.tsx`
- `src/render/ui/print/HalftoneHero.tsx`
- `src/render/ui/print/Stamp.tsx`
- `src/render/ui/print/MarkerCircle.tsx`
- `src/render/ui/print/TapeCorner.tsx`
- `src/render/ui/print/useRovingIndex.ts`
- `src/render/ui/print/index.ts`
- `src/render/ui/TitleScreen.tsx` (new)
- `src/render/scene/App.tsx` (§3 wiring)
- **Delete** `src/render/ui/StartScreen.tsx`
- New render-helper test: `src/render/ui/print/__tests__/useRovingIndex.test.ts` (§7)

**Deliverable order:** publish `print/tokens.ts` + `print/index.ts` first (unblocks Lane B),
then primitives, then `TitleScreen` + `App.tsx` wiring + delete.

### Lane B — second dev lane (`dev-r3f-render` #2 or `dev-tooling-assets` if idle): menu + frame surfaces

Owns, exclusively (codes against the §6 contract):

- `src/render/ui/MainMenu.tsx` (zine shell + sommaire nav; composes the three below)
- `src/render/ui/menu/FlyerWall.tsx` (new)
- `src/render/ui/menu/LevelFlyer.tsx` (new)
- `src/render/ui/menu/ScoresUne.tsx` (new)
- `src/render/ui/menu/OptionsColophon.tsx` (new)
- `src/render/ui/menu/derivations.ts` (new — pure `difficultyMark()`, incl. the gate-f2
  `MOYEN → NORMAL` label fix)
- `src/render/ui/NarrativeScreen.tsx` (frame reskin only, behaviour frozen)
- `src/render/ui/RotateOverlay.tsx` (reskin)
- New render-helper test: `src/render/ui/menu/__tests__/derivations.test.ts` (§7)

**Collision audit:** Lane A = `print/*`, `TitleScreen.tsx`, `App.tsx`, delete `StartScreen.tsx`.
Lane B = `MainMenu.tsx`, `menu/*`, `NarrativeScreen.tsx`, `RotateOverlay.tsx`. **No shared
file.** ✅ Safe to run concurrently.

### Serialised / flagged files

- `src/render/scene/App.tsx` — **Lane A only.** No other lane touches it this story.
- `src/render/ui/print/tokens.ts` — **Lane A only**, consumed read-only by Lane B via the
  contract. If a token is missing at build time, that is a contract bug (add to §6), not a
  Lane B edit.

---

## 6. Token / primitive API contract (both lanes code against this)

`print/tokens.ts` — hexes are the **exact** §2bis.1 anchors:

```ts
export const STOCK = {
  jaune: "#F1EC1F",     // TITLE cover only
  rose: "#FF4FA3",      // flyer Belliard (playable idx 0); UNE masthead accent
  vert: "#B7F32B",      // flyer Stalingrad (playable idx 1)
  orange: "#F5762A",    // flyer Vitry (playable idx 2); OPTIONS colophon
  manila: "#ECE7DA",    // tutorial "mode d'emploi" sheet
  newsprint: "#E9E3D2", // SCORES UNE ground; narrative/briefing ground
  shell: "#D7D2C6",     // NIVEAUX flyer-wall backing
} as const;

export const INK = {
  black: "#141210",     // body, Courier blocks, rules, keylines
  full: "#000000",      // display/ransom headlines + stamp fills
} as const;

export const MARK = {
  green: "#2FA84F",     // FACILE · record / rank-1 circle
  orange: "#E8641E",    // NORMAL (middle tier)
  pink: "#D62A7A",      // DIFFICILE
} as const;

export const MASTHEAD = {
  full: "UNDERGROUND PARIS · FANZINE CLANDESTIN · N°23 · NE SE VEND PAS", // cover
  running: "UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998",               // menu/narrative header
} as const;

// Flyer stock rotation by PLAYABLE index (tutorial uses STOCK.manila, not this rotation).
export const FLYER_STOCK_BY_PLAYABLE_INDEX = [STOCK.rose, STOCK.vert, STOCK.orange] as const;

// Deterministic pile geometry (UX §3.2) — indexed by list position, NEVER Math.random.
export const FLYER_REST_ROTATION_DEG = [-3, 2, -1.5, 3, -2] as const;
export const FLYER_JITTER_PX = [-8, 8, -4, 6, -6] as const;
export const MAX_TILT_DEG = 3;

// Motion tokens (ms) — all forced to 0 under prefers-reduced-motion except the typewriter.
export const MOTION = {
  titleToMenu: 280,
  flyerPull: 140,
  rubriqueSwitch: 200,
  markerDraw: 90,
  charDelayMs: 28,      // reuse the shipped NarrativeScreen value (consistency)
  cursorBlinkMs: 850,
  lockedShakeMs: 180,
} as const;
```

`print/index.ts` re-exports `tokens` + the primitives + `useRovingIndex`.

Primitive signatures (props are the contract; internals are Lane A's):

```ts
// PaperSheet — the print ground for any surface. Zero glow; no backdrop-filter.
interface PaperSheetProps {
  stock: string;                 // a STOCK.* value
  fullBleed?: boolean;           // fixed inset:0 (default) vs contained block
  children: React.ReactNode;
  style?: React.CSSProperties;
}

// HalftoneHero — a facade PNG rephotocopied to pure B&W. grayscale(1) is mandatory.
interface HalftoneHeroProps {
  src: string;                   // BASE_URL-prefixed path
  pitch?: number;                // hero dot pitch 8–12px (default 10)
  style?: React.CSSProperties;
}

// Stamp — rubber-stamp / ballot mark with a distinct shape per semantic.
interface StampProps {
  label: string;
  ink: string;                   // INK.* or MARK.*
  shape?: "box" | "oval" | "diagonal"; // default "box"
  struck?: boolean;              // struck-through (e.g. locked info-line)
}

// MarkerCircle — always-visible inked focus/selection ellipse.
interface MarkerCircleProps {
  active: boolean;               // draw the ink when focused/selected
  ink?: string;                  // default INK.black
  children: React.ReactNode;
}

// TapeCorner — tape-pin corners for the front/selected flyer.
interface TapeCornerProps {
  corners?: ReadonlyArray<"tl" | "tr" | "bl" | "br">; // default all four
}

// useRovingIndex — roving keyboard focus for one list surface.
function useRovingIndex(
  count: number,
  opts?: {
    axis?: "vertical" | "horizontal"; // arrows: up/down (default) vs left/right
    wrap?: boolean;                    // default false
    onActivate?: (index: number) => void; // Enter on the focused item
  },
): {
  index: number;
  setIndex: (i: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void; // arrows + Enter
};
```

`menu/derivations.ts` (Lane B) — pure, unit-tested, thresholds/labels match shipped `LevelCard`
exactly (gate-f2 turns the middle-tier word `MOYEN → NORMAL`; this is a render-label change, no
data touch):

```ts
export interface DifficultyMark { label: "FACILE" | "NORMAL" | "DIFFICILE"; ink: string; }
export function difficultyMark(enemySpeedMultiplier: number): DifficultyMark;
// >1.2 → DIFFICILE (MARK.pink); >1.0 → NORMAL (MARK.orange); else FACILE (MARK.green).
```

---

## 7. Test / verify expectations

### 7.1 Must stay green, unedited (regression floor)

- The **entire `src/game/systems/__tests__/**` Vitest suite** — untouched, all green. Because
  `src/game/**` has **zero diff**, no game-system test may be edited (AC4). If any game test
  needs a change, the boundary has been crossed — **stop and escalate to the architect.**
- `src/render/scene/__tests__/{flipbook,muzzleFor,haloFalloff}.test.ts` — unaffected (this
  story touches none of their sources).
- `levelArt.consistency.test.ts` — unaffected: no `levels.ts` / `levelArt.json` change.

### 7.2 New tests (render-layer, repo-appropriate)

The repo tests **pure render helpers** as `.test.ts` (e.g. `haloFalloff`, `muzzleFor`), not
full component renders (happy-dom is configured, but there are no `.test.tsx` component tests
and this story should not introduce that heavier pattern). Follow that grain — two small pure
tests:

- `src/render/ui/menu/__tests__/derivations.test.ts` — `difficultyMark()` returns the correct
  `{label, ink}` at the exact shipped thresholds: `1.0 → FACILE/green`, `1.3 → DIFFICILE/pink`,
  `1.6 → DIFFICILE/pink` (locks the gate's "Stalingrad stamps DIFFICILE" finding), and a
  `1.1/1.2` boundary case → `NORMAL/orange` (locks the f2 label word even though no shipped
  level renders the middle tier). This is the guard that the reskin preserved the derivation.
- `src/render/ui/print/__tests__/useRovingIndex.test.ts` — pure reducer-style assertions on the
  index transition given a synthetic key event (Down/Up/Left/Right/Enter, wrap on/off). Keeps
  keyboard-nav correctness from silently regressing.

No component-render tests, no snapshot tests — visual correctness is a screenshot/playtest
gate (§7.4), not a unit assertion.

### 7.3 Gates (AC8)

`rtk tsc` + `rtk vitest` + `rtk lint` clean. Strict TS, no `any`. Conventional Commits.

### 7.4 Preview / e2e verification (`?preview=`)

Capture via the `verify` skill / render farm:

- `?preview=title` → TITLE renders; one action → MENU.
- `?preview=menu` → MENU (default rubrique NIVEAUX).
- Cold load (no param) → TITLE (the new default).
- `?preview=narrative | end | tutorial` → **byte-identical** to today (regression check —
  confirm the three existing captures still match).

Design-acceptance playtest (stage 5, from UX §8, timed as a hard checkpoint): 3-tap
returning-player path (title → flyer → Passer) completes **< 10 s** with transitions ≤ 280 ms;
no menu surface glows on a dark ground (grep the diff for `text-shadow: 0 0`, `box-shadow`
glow, `backdrop-filter: blur`, CRT `repeating-linear-gradient` scanlines, neon corner
brackets — all must be absent from the pre-game diff); keyboard nav shows an always-visible
marker-circle focus and no screen traps the player; RotateOverlay covers TITLE; FullscreenButton
above and not skip-triggering; touch targets ≥ 44 px.

If `scripts/screenshot-preview.mjs` hardcodes the capture list (as it does for `tutorial`,
ADR-0012 D3), add `?preview=title` and `?preview=menu` calls there — **but that file is
`dev-tooling-assets` territory**; flag it as a small tooling follow-up, not part of the
render lanes' file sets (keeps lane sets disjoint). If Lane B or a tooling lane picks it up,
it is a third, non-overlapping file (`scripts/screenshot-preview.mjs`).

---

## 8. Boundary sign-off (architect gate for this cross-cutting change)

This change touches >1 concern (new render phase + shared module + 8 surfaces) → architect
sign-off required and recorded. Sign-off conditions, all satisfied by this plan:

- `src/game/**` byte-identical; no game-system test edited. ✅ (design + lane constraints)
- New state lives in the render-layer `AppPhase` union only; game `stateMachine` untouched. ✅
- Shared tokens live in `src/render/ui/print/`, imported only by render. ✅
- Menu-nav hook stays out of `src/hooks/` (that folder = game↔R3F bridge only). ✅
- No new generated asset / font / CI render-farm run / lead-art gate. ✅
- ADR-0020 records the phase + token-source + boundary rulings. ✅

Hand-off to `producer` for lane dispatch; the cross-cutting sign-off is logged in
`docs/agent-handoffs.md` by the producer/architect (not edited here — parallel writers).
