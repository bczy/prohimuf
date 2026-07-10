/**
 * Viewport pan state for the mobile swipe camera (ADR-0003).
 * `x` is the camera's horizontal offset in world units, `vx` its velocity
 * (world units / second) while gliding on flick inertia.
 */
export interface CameraPan {
  x: number;
  vx: number;
}
