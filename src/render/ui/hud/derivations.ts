import type { Phase } from "@game/types/gameState";
import type { WeaponKind } from "@game/types/weapon";
import { WEAPON_SPECS } from "@game/types/weapon";
// Import the leaf `print/tokens` module directly (not the `@render/ui/print` barrel):
// the barrel drags in print COMPONENTS that use the `@render` alias, which the vitest
// resolver does not carry (it has `@game`/`@hooks` only), so a barrel/alias import here
// breaks this folder's tests. Same convention as the tested `menu/derivations.ts`.
import { INK, MARK } from "../print/tokens";

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

// Fractional lives → glyph run. Enemy return fire costs between a quarter and a
// whole heart depending on the shooter's archetype, so the readout needs a count
// of solid ♥ plus the fill ratio (0..1) of one trailing partial heart. `partial`
// is 0 at integral health, which is what keeps a full 3-heart bar rendering as
// exactly "♥♥♥". Negative input is clamped (a dead player shows nothing).
export function splitHearts(lives: number): { full: number; partial: number } {
  const safe = Math.max(0, lives);
  const full = Math.floor(safe);
  return { full, partial: safe - full };
}

// Active-weapon glyph — the roster picto (design §1/§6.2 "A/B/C picto"): A = base
// (calibre), B = auto (sulfateuse), C = spread (éventail). Purely the render-side
// display letter for a weapon kind; carries no rule.
export function weaponGlyph(kind: WeaponKind): string {
  switch (kind) {
    case "base":
      return "A";
    case "auto":
      return "B";
    case "spread":
      return "C";
  }
}

// Fuel-gauge low-stock threshold (§6.2, W4/AC11): the last ~20 % of a SPECIAL stock
// blinks — a legibility warning, not a tension meter. The 0.2 ratio is a HUD-side
// presentation constant (the game never branches on it); the DENOMINATOR (start
// stock) is read from the game's `WEAPON_SPECS` data table, never copied here.
export const LOW_STOCK_FRACTION = 0.2;

// True when a SPECIAL weapon has entered its blink zone. `base` never warns (∞ stock,
// W4/AC11) and a non-finite/zero start stock is treated as "not low" (defensive).
export function isLowStock(kind: WeaponKind, stock: number): boolean {
  if (kind === "base") return false;
  const start = WEAPON_SPECS[kind].startStock;
  if (!Number.isFinite(start) || start <= 0) return false;
  return stock / start <= LOW_STOCK_FRACTION;
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
