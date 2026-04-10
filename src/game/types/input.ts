export interface KeyboardState {
  restart: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function createKeyboardState(): KeyboardState {
  return { restart: false, up: false, down: false, left: false, right: false };
}
