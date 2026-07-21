import type { JSX } from "react";
import type { WeaponKind } from "@game/types/weapon";
import styles from "./WeaponReadout.module.css";

/**
 * Code-drawn weapon pictograms for the HUD `arme` cell (Bertrand feedback, 2026-07-20:
 * "mets un icône pour signifier quelle arme il utilise"). Same doctrine as GestureIcon:
 * every pixel lives in the render layer — no sprite, no asset generation. Print-system
 * idiom (ADR-0021/ADR-0046): flat ink via `currentColor`, ZERO glow — the icon inherits
 * the readout cell's ink exactly like the A/B/C glyph beside it.
 *
 * The `Record<WeaponKind, …>` is exhaustive over the closed union: a fourth weapon
 * fails the build until its pictogram exists. Silhouettes are deliberately blocky
 * (fanzine stamp register, readable at ~1em):
 *  - base   → compact pistol, side view;
 *  - auto   → SMG: longer body, front magazine, stock nub;
 *  - spread → muzzle with a three-line fan (the éventail's three hitscans).
 */
const ICON_PATHS: Record<WeaponKind, JSX.Element> = {
  base: (
    // Compact pistol: slide bar, trigger notch, raked grip.
    <path d="M2 5 h24 v6 h-12 l-1.5 2.5 h-5 l1.5 -2.5 h-3 l-2.5 8 h-6 l3 -8 v-6 Z" />
  ),
  auto: (
    // SMG: long body, stock nub left, pistol grip and forward magazine.
    <>
      <path d="M0 7 h3 v4 h-3 Z" />
      <path d="M4 5 h27 v6 h-8 l-1 2 h-4 l-1.5 7 h-6 l2 -7 h-4 l-2 5 h-5 l3.5 -7 v-6 Z" />
    </>
  ),
  spread: (
    // Muzzle stub + three diverging shot lines (the 3-hitscan fan).
    <>
      <path d="M1 7 h9 v6 h-6 l-2 6 h-5 l3 -6 Z" />
      <path d="M13 9 l16 -6 l1 2.2 l-15.5 5.4 Z" />
      <path d="M13 9.6 h17 v2.4 h-17 Z" />
      <path d="M13 12.6 l15.5 5.4 l-1 2.2 l-16 -6 Z" />
    </>
  ),
};

export function WeaponIcon({ kind }: { kind: WeaponKind }): JSX.Element {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 32 21"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[kind]}
    </svg>
  );
}
