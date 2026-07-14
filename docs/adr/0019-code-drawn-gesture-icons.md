# 0019 — Code-drawn animated gesture icons on the tutorial control panels

- **Status:** Accepted
- **Date:** 2026-07-14
- **Amends:** [ADR-0015](./0015-device-forked-tutorial-script.md) (D3 — reopens
  "control panels stay text-only")
- **Extends:** [ADR-0012](./0012-optional-scripted-tutorial-stage.md) (D5 — adds a second
  optional illustration channel to `NarrativeLine`, preserving the "no generation" guarantee)
- **Related:** [ADR-0003](./0003-mobile-touch-controls-and-camera-pan.md) (two-finger tap,
  swipe pan), [ADR-0008](./0008-two-axis-pan-and-fullscreen.md) (edge-scroll / swipe pan),
  `docs/game-design/tutorial-visual-gestures.md` (icon spec),
  `docs/game-design/tutorial-script-visual-gestures.md` (copy),
  `_bmad-output/planning-artifacts/story-tutorial-visual-gestures.md`.

## Context

The tutorial stage exists **because the controls — above all the mobile gestures — are not
discoverable** (ADR-0012 Context). Yet ADR-0015 **D3** locked the two control panels
**text-only** ("no control-scheme sprite ships"), so today a player learns a motor skill from
pure prose ("Clic gauche", "deux doigts", "un doigt pour balayer") with **no picture of the
gesture** — the weakest possible teaching for a motor skill (Bertrand feedback, 2026-07-14).

D3's text-only rule was chosen to guarantee the fork triggers **no art generation** (no
FLUX/Pollinations, no CI render-farm, no `lead-art` asset gate) — the same "no generation"
guarantee ADR-0012 **D5** rests on. That guarantee is the constraint to preserve; "text-only"
was only the means. A **code-drawn** icon (SVG/CSS in the render layer) satisfies the ask
_and_ the guarantee: it is drawn by the browser at runtime, commissions no sprite, and never
touches the asset pipeline.

The design loop gated (Karim PASS, `docs/agent-handoffs.md`) a spec of **four** animated
gesture icons — one per control panel — and a bestiary expansion from 2 to 5 illustrated
enemies (all sprites already on disk, no new art). The remaining open call was the
**data-model shape** of the gesture selector and the boundary partition, both owned here.

Forces from reading the code:

- `NarrativeLine` (`src/game/systems/narrativeSystem.ts:1-18`) already carries one optional
  illustration channel (`image?`/`imageAlt?`, ADR-0012 D5). `NarrativeScreen`
  (`src/render/ui/NarrativeScreen.tsx:185-219`) renders it in a single centred slot above the
  dialogue box (`maxHeight: 38vh`, `objectFit: contain`), with an `onError` fallback that
  degrades to text-only.
- The device fork is **structural, not a runtime device read** in the game layer: desktop and
  mobile control segments are distinct `NarrativeLine[]`s already (ADR-0015 D1); `App.tsx`
  picks the variant once at load (ADR-0015 D2). So a gesture value placed on a forked panel is
  device-correct _by position_ — the render layer needs no extra device branch.
- The boundary law: `src/game` is pure data (zero React/Three); all drawing lives in
  `src/render`. `narrativeSystem.ts` is import-free and must stay so.

## Decision

Reopen ADR-0015 D3: the two control panels gain a **code-drawn, animated gesture illustration**
selected by a new **optional, pure-data** discriminant on `NarrativeLine`. Enemy panels keep
using `image` (already-shipped sprites). No FLUX, no CI render-farm, no `lead-art` asset gate —
ADR-0012 D5's "no generation" guarantee is **preserved**, because the icon is drawn in code.

### D1 — `NarrativeLine` gains an optional `gesture` intent token (game layer)

In `src/game/systems/narrativeSystem.ts`, add a named, exported string-literal union and two
optional fields:

```ts
/**
 * Intent token for a code-drawn animated gesture illustration (ADR-0019). Pure data:
 * the four values map 1:1 to render-side icons in `src/render/ui/GestureIcon.tsx`. The
 * game layer never draws — it only names the gesture. Device-correctness is STRUCTURAL:
 * `mouse-click`/`edge-scroll` live only on the desktop control segment, `two-finger-tap`/
 * `swipe-pan` only on the mobile one (ADR-0015 D1/D2) — the game layer never sees the device.
 */
export type GestureKind = "mouse-click" | "edge-scroll" | "two-finger-tap" | "swipe-pan";
```

added to `NarrativeLine`:

```ts
  /**
   * Optional code-drawn gesture icon shown in the same slot as `image` (ADR-0019).
   * MUTUALLY EXCLUSIVE with `image` — a panel sets one or the other, never both. The
   * render layer draws the matching animated SVG/CSS icon; no sprite is referenced, so
   * this triggers no asset generation (ADR-0012 D5 guarantee preserved).
   */
  readonly gesture?: GestureKind;
  /**
   * Accessible French label for `gesture`, parallel to `imageAlt`. Consumed by the render
   * lane as `gestureAlt ?? ""`. Only meaningful alongside `gesture`.
   */
  readonly gestureAlt?: string;
```

**Why a named exported `GestureKind` and not an inline union:** the render layer imports it to
build an **exhaustive** `Record<GestureKind, …>` icon map, so adding a fifth value fails the
render build until its icon exists — a compile-time completeness guarantee across the boundary.

**Why `gesture` + `gestureAlt`, not reuse of `imageAlt`:** `gesture` and `image` are mutually
exclusive, but keeping their labels in distinct fields keeps each channel self-describing and
avoids an "imageAlt on a panel with no image" semantic wart. Additive and optional: every
existing line (all narrative scenes, the bestiary panels) is byte-for-byte unchanged.

**Mutual exclusivity is a convention enforced by tests, not the type.** A union type
(`{image}|{gesture}`) would force narrowing on every `NarrativeLine` consumer for one stage;
instead the `tutorialInvariants` test asserts no panel carries both (mirrors ADR-0012 D1's
rejection of a discriminated union for the `kind?` field).

### D2 — All drawing in `src/render`; a new `GestureIcon` component (render layer)

A new `src/render/ui/GestureIcon.tsx` (sibling to `NarrativeScreen.tsx`) owns **all** pixels:
the four animated B&W-line-art + acid-neon icons per `docs/game-design/tutorial-visual-gestures.md`
§1 (mouse-click, edge-scroll, two-finger-tap, swipe-pan). It exposes
`GestureIcon({ kind: GestureKind })` and selects the drawing via an exhaustive
`Record<GestureKind, …>` (or `switch` with a `never` default). The accessible **label is not a
prop of `GestureIcon`**: the caller (`NarrativeScreen`) owns the slot semantics, wrapping the
icon in a `role="img"` element carrying `aria-label={currentLine.gestureAlt ?? ""}`, so the
component draws only pixels and the label stays with the panel data.

`NarrativeScreen.tsx` renders `GestureIcon` in the **same illustration slot** `image` uses
today (`:185-219`), when `currentLine.gesture` is present and `image` is absent — one slot, one
of the two channels. Completeness is guaranteed at **compile time**, not by a runtime fallback:
`GestureKind` is a **closed** string-literal union and the render map is an exhaustive
`Record<GestureKind, …>`, so every value the type permits already resolves to an icon (adding a
fifth value fails the render build until its icon exists). The "never a broken slot" property
comes from the caller's **absent-gesture** gate (`gesture === undefined` → text-only panel), not
from degrading an _unknown_ value: because the union is closed, no unknown value can reach the map
through the type. A rogue out-of-union value forced past the type at runtime would throw rather
than render silently — an accepted trade for the compile-time completeness guarantee (the type is
the guard). `NarrativeScreen` stays device-agnostic (ADR-0015 D2): it draws whatever line it is
handed.

### D3 — No generation; boundary law upheld

The icons are runtime SVG/CSS. This stage still triggers **no** Pollinations/FLUX run, **no**
CI render-farm, **no** `lead-art` asset gate (final glow hue is a render-side CSS constant,
`lead-art`'s call at the composite gate — not a generated asset). ADR-0012 D5's "no generation"
guarantee therefore holds unchanged. `narrativeSystem.ts` stays import-free (pure data); every
pixel lives in `src/render`.

## Consequences

**Positive**

- The control panels finally **show** the gesture they teach — the stage's whole reason to
  exist (ADR-0012 Context) — without commissioning a single sprite.
- Boundary law intact: the game layer names an intent (`GestureKind`), the render layer draws
  it; the exhaustive `Record<GestureKind, …>` makes "every value has an icon" a compile error
  if violated.
- Additive and optional (`gesture?`, `gestureAlt?`): existing narrative scenes and the bestiary
  panels are unchanged; device-correctness stays structural (ADR-0015 D1/D2), no runtime device
  branch in either layer.
- ADR-0012 D5's "no generation" guarantee is preserved verbatim — D3 is reopened on its
  _means_ (text-only), not its _end_ (no asset pipeline).

**Negative / costs**

- The tutorial now teaches control mappings in **three** places that can drift: the systems
  that implement them, the forked control copy (ADR-0015 cost), and now the icon drawings. The
  `tutorialInvariants` gesture pins are the guard rail.
- A gesture icon is code, not data — a visual regression is caught by the `verify`/composite
  gate on real screenshots, not by a unit test (only the _selection_ is unit-testable).

**Gotchas to watch**

- **Mutual exclusivity is test-enforced, not type-enforced.** A panel that sets both `image`
  and `gesture` type-checks; `tutorialInvariants.test.ts` must fail it.
- **`gesture` lives only on the forked control panels (indices 2, 3).** A gesture value on a
  shared panel would break device-correctness (the same value would show on both variants). The
  invariant pins gesture to the fork indices.
- **Panel count moved 8 → 11** (3 new bestiary panels, all in the _shared_ field segment). The
  `tutorialInvariants` reference-equality index list widens to `[0,1,4,5,6,7,8,9,10]`; the fork
  stays `[2,3]`. `scripts/screenshot-preview.mjs` is **unaffected** — it captures the tutorial's
  first (opening) panel, not a per-panel loop, and the progress dots render from
  `scene.lines.map` (`NarrativeScreen.tsx:169`), so a longer scene needs no harness edit. The
  four icons + fuller bestiary are verified by driving through the panels via the `verify` skill
  on both `?preview=tutorial` contexts (ADR-0015 harness), not by the static contact sheet.
