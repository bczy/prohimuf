export interface KeyboardState {
  restart: boolean;
}

export function createKeyboardState(): KeyboardState {
  return { restart: false };
}
