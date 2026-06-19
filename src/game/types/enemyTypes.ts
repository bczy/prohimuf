import type { EnemyKind } from "@game/types/enemy";

// Per-archetype tuning. Durations are seconds spent in each shown state; the
// renderer keys sprite/tint off `spriteBase`, `variants` and `tint`.
export interface Archetype {
  readonly kind: EnemyKind;
  readonly hp: number;
  readonly hiddenDuration: number;
  readonly visibleDuration: number;
  readonly shoots: boolean;
  // Effects applied when the enemy is neutralised by a player bullet.
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  // Does neutralising it count toward the level's win target?
  readonly countsAsTarget: boolean;
  // Spawn weight (relative probability).
  readonly weight: number;
  // Rendering.
  readonly spriteBase: string; // e.g. "enemy_sprite", "enemy_riot"
  readonly variants: number; // number of visual variants (suffixes _2.._N)
  readonly tint: string; // neon color-multiply tint
  readonly aspect: number; // sprite plane width relative to its height
}

export const ARCHETYPES: Record<EnemyKind, Archetype> = {
  normal: {
    kind: "normal",
    hp: 1,
    hiddenDuration: 1.5,
    visibleDuration: 2.0,
    shoots: true,
    scoreDelta: 1,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: true,
    weight: 52,
    spriteBase: "enemy_sprite",
    variants: 3,
    tint: "#ffffff",
    aspect: 0.5,
  },
  riot: {
    kind: "riot",
    hp: 2,
    hiddenDuration: 1.7,
    visibleDuration: 2.6,
    shoots: true,
    scoreDelta: 2,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: true,
    weight: 15,
    spriteBase: "enemy_riot",
    variants: 1,
    tint: "#dbe9ff",
    aspect: 0.62,
  },
  biker: {
    kind: "biker",
    hp: 1,
    hiddenDuration: 1.2,
    visibleDuration: 0.9,
    shoots: true,
    scoreDelta: 1,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: true,
    weight: 15,
    spriteBase: "enemy_biker",
    variants: 1,
    tint: "#fff7e0",
    aspect: 0.5,
  },
  bonus: {
    kind: "bonus",
    hp: 1,
    hiddenDuration: 2.2,
    visibleDuration: 1.3,
    shoots: false,
    scoreDelta: 1,
    livesDelta: 0,
    timeDelta: 5,
    countsAsTarget: false,
    weight: 11,
    spriteBase: "enemy_bonus",
    variants: 1,
    tint: "#ffe9a8",
    aspect: 0.52,
  },
  civilian: {
    kind: "civilian",
    hp: 1,
    hiddenDuration: 1.6,
    visibleDuration: 2.0,
    shoots: false,
    // Shooting a civilian is a mistake: lose a life, lose a point.
    scoreDelta: -1,
    livesDelta: -1,
    timeDelta: 0,
    countsAsTarget: false,
    weight: 12,
    spriteBase: "enemy_civilian",
    variants: 1,
    tint: "#d8ffe2",
    aspect: 0.95,
  },
};

const WEIGHTED: readonly EnemyKind[] = (Object.keys(ARCHETYPES) as EnemyKind[]).flatMap((k) =>
  Array.from({ length: ARCHETYPES[k].weight }, () => k),
);

// Deterministic weighted pick so spawns are reproducible per (wave, index).
export function pickKind(seed: number): EnemyKind {
  const idx = Math.abs(Math.floor(seed)) % WEIGHTED.length;
  return WEIGHTED[idx] ?? "normal";
}
