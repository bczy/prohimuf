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
 * Two families, per the art direction:
 *  - `warm` — the réverbère's sodium head (#FFA500), the one non-acid light in the
 *    street; it reads as a real lamp, not as rave signage.
 *  - `acid` — the fanzine neon triad, MIXED along the street: consecutive emitters
 *    take consecutive hues, so no two neighbours share a colour and a street never
 *    reads monochrome. Deterministic in the prop's stable index — never random —
 *    so a re-render/parallax pass can't reshuffle the street's colours.
 *
 * Intensities are deliberately low and CONSTANT: no day/night and no combat-phase
 * signal exists anywhere in `src/game` (checked: `GameState`/`stateMachine` carry
 * phase = PLAYING/GAME_OVER/LEVEL_COMPLETE only), and inventing one would be a
 * game-rule change outside the render lane. See the branch summary.
 */
import type { NearForegroundKind } from "@game/levels/levelArt";

/** Sodium-lamp warm, the réverbère head. */
export const LAMP_WARM = "#FFA500";

/** The acid triad (fanzine neon), cycled across emitters so a street reads mixed. */
export const ACID_HUES: readonly string[] = ["#00FF64", "#FF32B4", "#9664FF"];

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
 * Which near-foreground props emit, and where on their plane. `trafficLight` is
 * absent on purpose: it already carries its own animated lit-lens overlay
 * (`nearForegroundTextures.updateTrafficLightSignal`) and a second glow would
 * double the signal it exists to read out.
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
  // The sign panel itself — the street's acid read.
  streetSign: { family: "acid", x: 0, y: 0.24, size: 0.36, opacity: 0.4 },
  // Metal/rebut: barely there. A hint of colour caught on a chrome edge.
  parkingMeter: { family: "acid", x: 0, y: 0.26, size: 0.24, opacity: 0.14 },
  bollard: { family: "acid", x: 0, y: 0.1, size: 0.4, opacity: 0.12 },
  scooter: { family: "acid", x: 0, y: 0, size: 0.45, opacity: 0.12 },
};

/**
 * Ceiling on the "rebut/métal" family's opacity — the subtlety contract. Asserted
 * in the spec so a future tuning pass can't quietly promote a bollard into a sign.
 */
export const SUBTLE_OPACITY_MAX = 0.2;

/**
 * Resolve the emitter for a prop, or `null` when the kind does not emit.
 *
 * @param kind  The near-foreground prop kind.
 * @param index The prop's stable index in its level layer — the ONLY input to the
 *              acid hue choice, so the street's colour mix is deterministic.
 */
export function neonSignageFor(kind: NearForegroundKind, index: number): NeonSignage | null {
  const e = EMITTERS[kind];
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
