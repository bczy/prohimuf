import { useEffect, useRef } from "react";
import { createKeyboardState } from "@game/types/input";
import type { KeyboardState } from "@game/types/input";

export function useKeyboard(): React.RefObject<KeyboardState> {
  const keyboardRef = useRef<KeyboardState>(createKeyboardState());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const kb = keyboardRef.current;
      switch (e.key) {
        case "r":
        case "R":
          kb.restart = true;
          break;
        case "w":
        case "W":
        case "ArrowUp":
          kb.up = true;
          break;
        case "s":
        case "S":
        case "ArrowDown":
          kb.down = true;
          break;
        case "a":
        case "A":
        case "ArrowLeft":
          kb.left = true;
          break;
        case "d":
        case "D":
        case "ArrowRight":
          kb.right = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      const kb = keyboardRef.current;
      switch (e.key) {
        case "r":
        case "R":
          kb.restart = false;
          break;
        case "w":
        case "W":
        case "ArrowUp":
          kb.up = false;
          break;
        case "s":
        case "S":
        case "ArrowDown":
          kb.down = false;
          break;
        case "a":
        case "A":
        case "ArrowLeft":
          kb.left = false;
          break;
        case "d":
        case "D":
        case "ArrowRight":
          kb.right = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return keyboardRef;
}
