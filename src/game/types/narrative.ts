/**
 * Narrative authoring types (ADR-0012 / ADR-0015 / ADR-0020 / ADR-0023). Type-only, zero
 * runtime, and free of any `@game/systems` import — `types/` never depends on the
 * simulation layer (`types/level.ts`). Moved here verbatim from
 * `@game/systems/narrativeSystem`, which re-exports them so every existing consumer
 * keeps its import path.
 */

/**
 * Intent token for a code-drawn animated gesture illustration (ADR-0020). Pure data:
 * the four values map 1:1 to render-side icons in `src/render/ui/GestureIcon.tsx`. The
 * game layer never draws — it only names the gesture. Device-correctness is STRUCTURAL:
 * `mouse-click`/`edge-scroll` live only on the desktop control segment, `two-finger-tap`/
 * `swipe-pan` only on the mobile one (ADR-0015 D1/D2) — the game layer never sees the device.
 */
export type GestureKind = "mouse-click" | "edge-scroll" | "two-finger-tap" | "swipe-pan";

/**
 * Intent token for a code-drawn animated MECHANIC diagram (distinct from the control
 * `GestureKind`: a diagram teaches a game rule, not a device input, so it is NOT
 * device-forked). Pure data: each value maps 1:1 to a render-side illustration in
 * `src/render/ui/DiagramIcon.tsx`; the game layer only NAMES it, never draws. `hostage-ring`
 * = the spatial-colour reticle of the hostage QTE (the ring sweeps the captor and changes
 * colour by the anatomy under it — vital/limb/off); the render lane draws it in the exact
 * `hostageCue` hues so the tutorial teaches the true in-game colours.
 */
export type DiagramKind =
  | "shot-read-player-vs-enemy-bullet"
  | "weapon-crate-loop"
  | "threat-hierarchy-ladder"
  | "hostage-ring"
  | "boss-finale-switch";

export interface NarrativeLine {
  readonly speaker: string; // character name
  readonly text: string;
  /**
   * Optional illustration shown above the dialogue box (ADR-0012, D5). Path is
   * relative to `public/assets/` WITHOUT a leading slash (e.g. `"assets/enemy_bonus.png"`);
   * the render lane prefixes `import.meta.env.BASE_URL` for GitHub Pages. Only sprites
   * already shipped in `public/assets/` are referenced; text-only panels omit it, so
   * existing narrative scenes render exactly as before.
   */
  readonly image?: string;
  /**
   * Optional alt text for `image` (ADR-0012, D5 — accessibility). Short French
   * description of the informative sprite, consumed by the render lane as
   * `currentLine.imageAlt ?? ""`. Only meaningful alongside `image`.
   */
  readonly imageAlt?: string;
  /**
   * Optional code-drawn gesture icon shown in the same slot as `image` (ADR-0020).
   * MUTUALLY EXCLUSIVE with `image` — a panel sets one or the other, never both. The
   * render layer draws the matching animated SVG/CSS icon; no sprite is referenced, so
   * this triggers no asset generation (ADR-0012 D5 guarantee preserved).
   */
  readonly gesture?: GestureKind;
  /**
   * Accessible French label for `gesture`, parallel to `imageAlt` (ADR-0020). Consumed by
   * the render lane as `gestureAlt ?? ""`. Only meaningful alongside `gesture`.
   */
  readonly gestureAlt?: string;
  /**
   * Optional code-drawn animated MECHANIC diagram shown in the SAME slot as `image`/`gesture`.
   * MUTUALLY EXCLUSIVE with them — a panel sets at most one illustration channel. The render
   * layer draws the matching animated SVG; no sprite is referenced (no asset generation). Used
   * to teach a rule that has no shipped sprite (e.g. the hostage-QTE colour ring).
   */
  readonly diagram?: DiagramKind;
  /**
   * Accessible French label for `diagram`, parallel to `gestureAlt`. Consumed by the render
   * lane as `diagramAlt ?? ""`. Only meaningful alongside `diagram`.
   */
  readonly diagramAlt?: string;
  /**
   * Optional concise textual reinforcement bullets for a tutorial panel. Additive and
   * render-agnostic: at most 2 short non-empty strings when authored.
   */
  readonly teachingBullets?: readonly string[];
}

export interface NarrativeScene {
  readonly id: string;
  readonly lines: readonly NarrativeLine[];
  /**
   * Optional per-scene location décor (ADR-0023, amending ADR-0021 D5). A facade path
   * under `public/assets/` WITHOUT a leading slash (e.g. `"assets/levels/belliard/facade.png"`).
   * The render lane prefixes `import.meta.env.BASE_URL` and paints it as a full-bleed
   * halftone-B&W wash BEHIND the (unchanged) transcript — grayscale via `HalftoneHero`,
   * zero glow. Structural twin of `NarrativeLine.image`, lifted to scene scope. Absent ⇒ no
   * décor; authored tutorial/pre/post scenes may set it.
   */
  readonly backdrop?: string;
}
