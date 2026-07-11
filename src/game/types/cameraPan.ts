/**
 * Viewport pan state for the mobile swipe camera (ADR-0003).
 * `x` / `y` are the camera's world-space offsets (world units); `vx` / `vy`
 * their per-axis velocities (world units / second) while gliding on flick
 * inertia. Both axes are fully independent — each clamps and rests on its own.
 */
export interface CameraPan {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
