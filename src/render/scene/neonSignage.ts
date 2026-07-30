/**
 * Pure, DOM-free acid-neon signage table for the near-foreground street props.
 *
 * The CRT composite (ADR-0031) already owns the halo: its bright-pass keys on
 * saturation × brightness and the composite adds the blurred copy back. So this
 * module does NOT implement a glow — it declares WHICH props emit and in WHICH
 * hue, and `NearForeground` draws one additive quad per emitter so the emitted
 * core clears that gate and the CRT blooms it for free (no new pass, no new
 * render target, `CrtPass` untouched).
 *
 * ONLY objects that ARE a light in the fiction emit (art gate 2026-07-25, §2 law 1
 * « rien de décoratif ne brille » / proposed rule G1). Two families:
 *  - `warm` — the réverbière's sodium bulb (#FFA500), the one legal non-acid light
 *    in the street; it reads as a real lamp, not as rave signage.
 *  - `acid` — the bible's anchored accents (§2 law 1), cycled across emitters by
 *    their stable index. The cycle is DETERMINISTIC, never random, so a re-render
 *    or a parallax pass can never reshuffle the street's colours. Note the
 *    guarantee is exactly that — a fixed cycle over the prop index. Emitters are
 *    not necessarily consecutive in that index, so two on-screen neighbours MAY
 *    land on the same hue; what is ruled out is a monochrome street by default.
 *
 * Intensities are deliberately low and CONSTANT: no day/night and no combat-phase
 * signal exists anywhere in `src/game` (checked: `GameState`/`stateMachine` carry
 * phase = PLAYING/GAME_OVER/LEVEL_COMPLETE only), and inventing one would be a
 * game-rule change outside the render lane. See the branch summary.
 */
import type { NearForegroundKind } from "@game/levels/levelArt";

/** Sodium-lamp warm, the réverbère head. */
export const LAMP_WARM = "#FFA500";

/**
 * The acid triad, re-anchored on the bible's §2 law 1 hexes (art gate 2026-07-25):
 * green, magenta, cyan. The first cut used `#00FF64/#FF32B4/#9664FF` — near-misses
 * of the anchors, and `#9664FF` was a violet that exists nowhere in the palette, a
 * fourth colour family. Family consistency (§2 law 2) is a colour law.
 */
export const ACID_HUES: readonly string[] = ["#78FF3C", "#FF3CDC", "#28F0FF"];

export interface NeonSignage {
  /** Emitted hue, already resolved (warm constant, or the cycled acid hue). */
  readonly color: string;
  /** Glow centre offset from the prop plane's centre, as a fraction of plane WIDTH. */
  readonly x: number;
  /** Same, as a fraction of plane HEIGHT (positive = up). */
  readonly y: number;
  /** Glow disc diameter, as a fraction of the prop's plane HEIGHT. */
  readonly size: number;
  /** Additive opacity (0..1) — "très léger", the bloom does the rest. */
  readonly opacity: number;
}

type Family = "warm" | "acid";

interface Emitter {
  readonly family: Family;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly opacity: number;
}

/**
 * Which near-foreground props emit, and where on their plane. The list is
 * deliberately SHORT — every entry has to be a light source in the fiction.
 *
 * `trafficLight` is absent because it already carries its own animated lit-lens
 * overlay (`nearForegroundTextures.updateTrafficLightSignal`); a second glow would
 * double the signal it exists to read out.
 *
 * `parkingMeter` / `bollard` / `scooter` were emitters in the first cut and were
 * REMOVED at the art gate (Bertrand's ruling on escalation E1, 2026-07-25). They
 * emit no light in the fiction, so an additive disc centred on them spends the
 * « ce qui brille est interactif » contract for nothing; and `scooter` is the moto
 * silhouette, a delivery-vehicle class whose interaction signal IS a neon rim
 * (ADR-0011) — décor wearing a vehicle's badge (§2 law 3). If the "hint of colour
 * on chrome" is ever wanted it is a REFLECTION: a thin crescent on the prop's lit
 * side, keyed off the nearest emitter's hue, never a disc centred on the prop.
 *
 * `streetSign` stands in for the "enseigne boutique" of the brief: the level-art
 * shopfront signs are BAKED into the facade image, so there is no shopfront-sign
 * entity a render-side emitter could be attached to. See the branch summary.
 */
const EMITTERS: Partial<Record<NearForegroundKind, Emitter>> = {
  // The lantern BULB — it hangs off the crosier arm LEFT of the mast (the mast sits
  // right-of-centre in lamppost.png), so the glow is offset left and sits on the
  // luminous body, not on the arm joint (Bertrand-directed, 2026-07-25).
  lamppost: { family: "warm", x: -0.17, y: 0.32, size: 0.32, opacity: 0.55 },
  // An enseigne IS a lit object, so a halo on it is diegetic.
  streetSign: { family: "acid", x: 0, y: 0.24, size: 0.36, opacity: 0.4 },
};

/**
 * Resolve the emitter for a prop, or `null` when the kind does not emit.
 *
 * @param kind  The near-foreground prop kind.
 * @param index The prop's stable index in its level layer — the ONLY input to the
 *              acid hue choice, so the street's colour mix is deterministic.
 */
export function neonSignageFor(kind: string, index: number): NeonSignage | null {
  // Read through the wide key: a generated level's namespaced prop kind is a
  // legitimate caller (it renders from its own PNG) but never an emitter — the
  // partial lookup simply yields undefined, i.e. no neon, which is the C1-correct
  // default for décor whose art was not authored with an emitter anchor.
  const emitters: Partial<Record<string, Emitter>> = EMITTERS;
  const e = emitters[kind];
  if (e === undefined) return null;
  return {
    color: e.family === "warm" ? LAMP_WARM : acidHue(index),
    x: e.x,
    y: e.y,
    size: e.size,
    opacity: e.opacity,
  };
}

/**
 * The acid hue for a 0-based emitter index, cycling the triad. Negative and
 * fractional indices are folded back into range so a caller can never index out.
 */
export function acidHue(index: number): string {
  const n = ACID_HUES.length;
  const i = ((Math.trunc(index) % n) + n) % n;
  return ACID_HUES[i] ?? LAMP_WARM;
}
