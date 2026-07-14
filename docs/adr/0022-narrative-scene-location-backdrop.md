# 0022 — Optional per-scene location décor behind the NarrativeScreen transcript

- **Status:** Accepted
- **Date:** 2026-07-14
- **Amends:** [ADR-0021](./0021-pre-game-print-system-and-title-phase.md) D5 (the
  `NarrativeScreen` visual-frame freeze — this is the one sanctioned extension to that frame)
- **Related:** [ADR-0012](./0012-optional-scripted-tutorial-stage.md) D5 (the additive
  `NarrativeLine.image` channel + `BASE_URL` interpolation this mirrors at scene scope),
  [ADR-0011](./0011-render-side-neon-rim.md) (la loi du glow), `docs/art-direction.md` §2bis
  (zero glow on pre-game surfaces), `docs/architecture.md` (game↔render boundary).

## Context

The pre/post-level briefings render through `NarrativeScreen` on a newsprint print ground
(ADR-0021). Design wants each briefing to carry a **sense of place** — the facade of the
level being briefed, sitting as a full-bleed décor behind the fax/répondeur transcript.

`NarrativeLine.image` (ADR-0012 D5) already proves the additive pattern: a game-side path
string, consumed by the render lane which prefixes `import.meta.env.BASE_URL`. But `image`
is a **per-line** illustration in a dedicated slot; a location décor is **one per scene**,
behind everything, for the whole scene. It therefore needs a field at **scene** scope, not
line scope.

Two forces shape the decision:

1. **ADR-0021 D5 froze the `NarrativeScreen` frame**, allowing only its *visual frame* to
   join the print system. A full-bleed background is a visual-frame change and crosses the
   game↔render contract (a new field on a `src/game` type consumed by render), so it must be
   recorded rather than slipped in under the freeze.
2. **The shipped facade art is the wrong medium as-is.** Per-level facades already exist at
   `public/assets/levels/{belliard,stalingrad,vitry}/facade.png`, but they are 16-bit
   **night-neon colour** art (`levelArt.json` style: "warm orange window light, magenta cyan
   neon accents"). Dropped raw behind the transcript they would (a) reintroduce glow-adjacent
   neon on a pre-game surface — an automatic §2bis FAIL (ADR-0021) — and (b) fight the black
   ink for contrast. The "halftone B&W" the brief asks for is a **render treatment**, not a
   new asset.

## Decision

### D1 — `NarrativeScene` gains an optional `readonly backdrop?: string`

Pure data in `src/game/systems/narrativeSystem.ts`, structurally identical to
`NarrativeLine.image`: a path under `public/assets/` **without** a leading slash. The render
lane prefixes `import.meta.env.BASE_URL` (GitHub Pages, ADR-0001). Absent ⇒ no décor; the
panel renders exactly as today. The scene carries an explicit path (rather than the render
deriving one from a level id) because narrative scenes are **not** keyed by level id — scene
ids are `belliard_pre` / `tutorial_desktop` etc., and the tutorial scenes have no facade —
so "which facade decorates this scene" is authoring intent that belongs in the game data,
while "how to halftone it" belongs to render. Pre/post scenes point at their level's
`assets/levels/<id>/facade.png`; both tutorial variants **omit** `backdrop` (no dwell, no
place to sell — behaviour byte-unchanged).

### D2 — Halftone is a render-side treatment over the existing facade, no new asset

The render lane renders `scene.backdrop` as a **full-bleed background behind the transcript**
and applies the print/halftone look with **CSS only** (grayscale + contrast, reusing the
ADR-0021 D3 print dot-screen grain), exactly as ADR-0021 kept the whole pre-game reskin to
CSS + inline-SVG. **No new PNG, no `gen-level-art.mjs` run, no CI render-farm run, no
lead-art gate** — the décor reuses `assets/levels/<id>/facade.png` and desaturates it at
draw time. Commissioning dedicated halftone facade assets is the **rejected alternative**: it
would drag the whole change back into the asset pipeline + art gate for content the CSS
treatment already delivers.

### D3 — What this ADR does **not** change

The ADR-0021 D5 freeze otherwise holds: the transcript content, typewriter (`CHAR_DELAY_MS`),
`advance`, progress dots, `Passer`, the `image`/`gesture` illustration slot, and the three
call sites are **untouched**. The décor is strictly a new layer **behind** existing content;
remove `backdrop` from a scene and the panel is byte-identical to before.

## Consequences

**Positive**
- Boundary preserved: game owns a path string (pure data); render owns the halftone. No React/
  Three leaks into `src/game`; no game rule enters render.
- Purely additive & optional — like `kind?` / `image?` before it. Every existing scene, the
  tutorial, and all invariant tests are unaffected until a `backdrop` is authored.
- Zero asset-pipeline cost: no generation, no art gate (D2).

**Negative / costs**
- Colour facade art shown desaturated is a compromise vs. a purpose-drawn B&W facade; revisit
  only if the CSS halftone reads poorly at the design gate.
- One more presentation concern layered on `NarrativeScreen`; contrast must be re-checked (see
  Gotchas).

**Gotchas to watch**
- **Z-order.** The backdrop must be the **first child** of the transcript column, absolutely
  positioned (`inset: 0`), painted **behind** the masthead, progress dots, illustration slot
  and transcript (all already positioned, so DOM order alone puts them on top — do not give the
  backdrop a `z-index` that lifts it over content).
- **Do not reuse `imageError`.** That state is per-line for `NarrativeLine.image`; the backdrop
  is decorative and scene-scoped. Prefer a CSS `background-image` (a 404 shows nothing, never a
  broken-image glyph and no coupling to `imageError`); if an `<img>` is used instead, give it
  its **own** error state.
- **Readability / §2bis.** The halftone wash must stay low-contrast enough that `INK.black`
  transcript text keeps ≥ AA on the newsprint ground (ADR-0021 contrast law), and must carry
  **zero glow** — grep the render diff for `text-shadow`/`box-shadow`-as-glow at the design
  gate. Neon in the source facade must be flattened by the desaturation, not preserved.
- **Path survives `BASE_URL`** — use the same interpolation as `image`, never an absolute path.
