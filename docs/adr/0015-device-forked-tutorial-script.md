# 0015 — Device-forked tutorial script (desktop vs mobile controls)

- **Status:** Accepted
- **Date:** 2026-07-13
- **Amends:** [ADR-0012](./0012-optional-scripted-tutorial-stage.md) (D4 §2 — controls panel)
- **Amended by:** [ADR-0019](./0019-code-drawn-gesture-icons.md) (D3 — control panels gain
  code-drawn gesture icons; no longer text-only). NOTE: ADR-0019 also supersedes the
  **panel-count facts** stated in D1 below — the tutorial now runs **11 panels** per variant
  (not "8"), and the field segment is **×7** (not "×4"), after the bestiary grew from 2 to 5
  illustrated enemies. The reference-sharing / fork-only-on-controls **structure** D1 describes
  still holds; only the counts moved (shared indices `[0,1,4,5,6,7,8,9,10]`, fork `[2,3]`).
- **Related:** [ADR-0003](./0003-mobile-touch-controls-and-camera-pan.md) (UA detection,
  touch model), [ADR-0008](./0008-two-axis-pan-and-fullscreen.md) (two-axis swipe pan).

## Context

ADR-0012 D4 §2 specified a **single** controls panel pair meant to serve both input
schemes at once. As authored in `narrativeSystem.ts` (`TUTORIAL_NARRATIVE`, lines 49–55)
that copy is **factually wrong on both sides**:

- **Mobile.** "Pour tirer : clic ou tap sur la fenêtre" hides that shooting on mobile is a
  **two-finger tap at the midpoint** — one finger is a two-axis pan with flick inertia
  (`src/hooks/useTouchControls.ts`; ADR-0003 D3, ADR-0008). A player who taps once with one
  finger pans the camera and fires nothing; "tap" is a mis-instruction.
- **Desktop.** "Au bureau, bord ou glisser" describes a drag-pan that **does not exist** —
  desktop pans by edge-scroll only (`GameScene.tsx`, `EDGE_ZONE`); there is no drag handler.

A single mixed panel cannot be both terse (guidelines §5, §8) and accurate for two
disjoint schemes: the honest mixed copy would be long and hedged, and the terse mixed copy
is wrong, as shipped. Device is already known once-at-load in the render lane
(`IS_MOBILE = detectMobile()`, ADR-0003 D1); the tutorial can simply pick the right script.
This is an amendment to ADR-0012's controls panel only — every other decision there (the
`kind` discriminant, the `AppPhase`, the illustrated-where-shipped rule, non-goals) stands.

## Decision

Fork the tutorial into **two device-specific scenes** that differ **only** on the two
control panels; the other six panels (core loop, delivery vehicle, cops, courier, HUD,
outro) are **shared by reference**.

### D1 — Two exported scenes, reference-shared segments (game layer)

In `src/game/systems/narrativeSystem.ts`, compose the script from four private
`readonly NarrativeLine[]` segments — opening (×2), desktop controls (×2), mobile controls
(×2), field (×4) — spread into two exported scenes:

- `TUTORIAL_NARRATIVE_DESKTOP` — `id: "tutorial_desktop"`, `[...opening, ...desktopControls, ...field]`
- `TUTORIAL_NARRATIVE_MOBILE` — `id: "tutorial_mobile"`, `[...opening, ...mobileControls, ...field]`

The old single `TUTORIAL_NARRATIVE` export is **removed**. Both variants keep **8 panels**
(progress-dot parity). Shared segments exist **once** in the module, so equality is
reference equality — a test can assert `desktop.lines[0] === mobile.lines[0]` with `toBe`.
Ids follow the existing `<key>_<suffix>` convention; nothing reads `scene.id` at runtime, so
the ids are informational. `PRE_/POST_LEVEL_NARRATIVE` keys are untouched, so the
`levelArt.consistency` narrative-keys assertion (ADR-0012 Gotchas) is unaffected.

Control-copy contents (fixed here so the two devs stay in sync):

- **Desktop controls** — shooting is `clic` with the `souris`; camera reaches the rest of
  the street by pushing the pointer to the screen edge (edge-scroll). No drag, no "glisser".
- **Mobile controls** — shooting is a **two-finger tap** ("deux doigts") on the window; one
  finger **balaie** (swipes) in all four directions to pan. No "clic", no "souris".

Rejected alternative — a `getTutorialNarrative(device)` function — would push a device
vocabulary type into `src/game`, which nothing else there needs (YAGNI); the file's idiom
is exported data constants, and selection belongs in the render lane that already owns the
device flag.

### D2 — Selection in the render lane (boundary law upheld)

`App.tsx` picks the scene at module scope, beside the existing `IS_MOBILE`:

```ts
const TUTORIAL_SCENE = IS_MOBILE ? TUTORIAL_NARRATIVE_MOBILE : TUTORIAL_NARRATIVE_DESKTOP;
```

Same once-at-load, never-flips-mid-session semantics as ADR-0003 D1. The game layer never
sees the device; `src/utils/platform.ts` stays render/hooks-only. `NarrativeScreen` is
unchanged — it renders whatever `NarrativeScene` it is handed and is device-agnostic.

### D3 — Copy constraints carried over from ADR-0012 D4

Unchanged and still enforced: **no pause copy** (`Escape` advances the narrative screen,
`NarrativeScreen.tsx`), **no fullscreen copy** (accessory), and **no rotate/landscape copy**
— `RotateOverlay` already covers the `TUTORIAL` phase, so a mobile reader is in landscape by
construction. Control panels stay **text-only**: no control-scheme sprite ships (consistent
with ADR-0012 D5), so this fork triggers **no** art generation.

## Consequences

**Positive**

- Each player reads controls that are true for their device: mobile learns the two-finger
  tap it cannot otherwise discover (the reason the stage exists, ADR-0012 Context); desktop
  is no longer told about a drag-pan that does not exist.
- Boundary law holds: the fork is pure data in `src/game`, selection is one render-lane
  line, no new bridge. Shared panels stay single-sourced (reference-shared), so the six
  common panels cannot drift between variants.
- The `?preview=tutorial` capture point (ADR-0012 D3) extends cleanly: a second Playwright
  context with a mobile UA flips `detectMobile()` with zero app changes.

**Negative / costs**

- Control copy is now maintained in **two** places: when a scheme changes, both the desktop
  and mobile control segments must be updated (extends ADR-0012's "tutorial copy duplicates
  knowledge that lives in systems" cost). The device-accurate copy test (below) is the
  guard rail.

**Gotchas to watch**

- **iPadOS Safari presents a desktop UA**, so iPads get the desktop script and its
  edge-scroll instructions — the same accepted UA-sniffing limitation as ADR-0003 D1.
- Mode is fixed at load: devtools emulation or a hybrid device toggled mid-session needs a
  **refresh** to switch scripts (ADR-0003, once-at-load).

## Verification

- **Harness** — `scripts/screenshot-preview.mjs` renames `02_tutorial.png` →
  `02_tutorial_desktop.png` and adds a second Playwright context with a mobile UA capturing
  `03_tutorial_mobile.png`; both land in the contact sheet.
- **Tests** — `tutorialInvariants.test.ts` runs its existing checks (ids, `image` paths
  exist under `public/assets/`, ≥1 illustrated panel) against **both** variants, plus two new
  invariants: (a) **fork-only-on-control-panels** — reference equality (`toBe`) of the shared
  opening/field segments, differing control texts, and panel-count parity (8 each); (b)
  **device-accurate copy** — regex pins: mobile mentions `deux doigts` and never
  `clic`/`souris`; desktop mentions `souris` and `clic` and never `doigt`/`balay`.
  `narrativeSystem.test.ts` includes both variants in its non-empty-lines / speaker / text
  checks.
