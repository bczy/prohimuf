/**
 * Traffic-signal phase clock for the decorative near-foreground feu tricolore
 * (ADR-0045). Pure and deterministic — no React/Three — so it unit-tests cleanly
 * and NearForeground can drive the texture off `state.clock.elapsedTime`.
 *
 * Models a real French carrefour interlock between the vehicle head (rouge / orange
 * / vert) and the pedestrian head (rouge / vert): the pedestrian only walks during
 * part of the vehicle-red window, and there is an all-red clearance before the
 * vehicles get green again. So the two heads are NEVER both "go" at once — exactly
 * "si le feu véhicule est vert, le feu piéton est rouge".
 */

export type VehicleAspect = "green" | "amber" | "red";
export type PedAspect = "red" | "green";

export interface SignalState {
  readonly vehicle: VehicleAspect;
  readonly ped: PedAspect;
}

interface Phase extends SignalState {
  /** Phase duration in seconds. */
  readonly dur: number;
}

/** The default (and reduced-motion) resting aspect: vehicles go, pedestrians wait. */
export const DEFAULT_SIGNAL: SignalState = { vehicle: "green", ped: "red" };

/**
 * One full cycle, in order. Durations are stylised (a real carrefour is longer) but
 * keep the ratios legible: a long green, a short amber, a walk window, a short
 * all-red clearance.
 */
export const TRAFFIC_PHASES: readonly Phase[] = [
  { vehicle: "green", ped: "red", dur: 5.5 },
  { vehicle: "amber", ped: "red", dur: 2 },
  { vehicle: "red", ped: "green", dur: 4.5 },
  { vehicle: "red", ped: "red", dur: 1.5 },
];

const CYCLE = TRAFFIC_PHASES.reduce((sum, p) => sum + p.dur, 0);

/** Signal aspect at elapsed time `t` (seconds). Non-finite `t` ⇒ resting aspect. */
export function trafficSignalPhase(t: number): SignalState {
  if (!Number.isFinite(t)) return DEFAULT_SIGNAL;
  let x = ((t % CYCLE) + CYCLE) % CYCLE;
  for (const p of TRAFFIC_PHASES) {
    if (x < p.dur) return { vehicle: p.vehicle, ped: p.ped };
    x -= p.dur;
  }
  return DEFAULT_SIGNAL;
}

/** A stable key for a signal aspect, for cheap change-detection between frames. */
export function signalKey(s: SignalState): string {
  return `${s.vehicle}-${s.ped}`;
}
