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
      }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      const kb = keyboardRef.current;
      switch (e.key) {
        case "r":
        case "R":
          kb.restart = false;
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
