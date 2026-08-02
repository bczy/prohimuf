export interface KeyboardState {
  restart: boolean;
  /**
   * Space held — the DESKTOP half of the photo set-piece's posture fork (UX §1.4, T-2).
   * A LEVEL, not an edge: `LOWERED` is the resting state, so releasing lowers. The bridge
   * turns it (and the mobile toggle latch) into ONE device-neutral `raiseIntent`, and
   * `src/game` never learns that a key exists.
   */
  raise: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function createKeyboardState(): KeyboardState {
  return { restart: false, raise: false, up: false, down: false, left: false, right: false };
}
