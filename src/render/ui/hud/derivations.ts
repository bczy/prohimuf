import type { Phase } from "@game/types/gameState";
import { INK, MARK } from "@render/ui/print";

/*
 * HUD ramp / derivation functions — render-side view mapping (state → print-token
 * ink). They are NOT game rules and must never migrate into `src/game`; they are
 * NOT styling and must never migrate into a `.module.css` (ADR-0046). Kept in TS,
 * shared by the widgets in this folder.
 */

// Integrity gauge: print marker inks shift warm as the vehicle takes damage (no glow).
export function integrityColor(fill: number): string {
  if (fill > 0.6) return MARK.green;
  if (fill > 0.3) return MARK.orange;
  return MARK.pink;
}

// Energy gauge (0–100): print marker inks shift warm as the hostage penalties
// drain it (same semantic ink ramp as the integrity gauge — no neon, no glow).
export function energyColor(energy: number): string {
  if (energy > 60) return MARK.green;
  if (energy > 30) return MARK.orange;
  return MARK.pink;
}

// Timer ink: full-black until the clock runs low, then warms to orange then pink.
export function timeColor(timeRemaining: number): string {
  if (timeRemaining < 20) return MARK.pink;
  if (timeRemaining < 40) return MARK.orange;
  return INK.full;
}

// Lives ink: pink on the last life, full-black otherwise.
export function livesColor(lives: number): string {
  return lives <= 1 ? MARK.pink : INK.full;
}

export function phaseMessage(phase: Phase): { text: string; color: string } | null {
  switch (phase) {
    case "GAME_OVER":
      return { text: "— INTERPELLÉ —", color: MARK.pink };
    case "LEVEL_COMPLETE":
      return { text: "— LA RAVE A EU LIEU —", color: MARK.green };
    default:
      return null;
  }
}
