import type { EnemyKind } from "@game/types/enemy";

// Per-archetype tuning. Durations are seconds spent in each shown state; the
// renderer keys sprite/tint off `spriteBase`, `variants` and `tint`.
export interface Archetype {
  readonly kind: EnemyKind;
  readonly hp: number;
  // Hearts this archetype's return fire removes from the player, in quarter-heart
  // steps. Only meaningful when `shoots` is true; non-shooters declare 0.
  readonly bulletDamage: number;
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
  readonly aspect: number; // sprite plane width relative to its height (1 = the square gptimage textures render undistorted; pre-gptimage art used tuned sub-1 squashes)
  // The kind's window sprite files were deleted from the repo (ADR-0029): its
  // spriteBase must never reach a load path again. Guarded by tests (a level
  // roster resurrecting the kind fails CI), not filtered at runtime — the
  // manifest must keep mirroring the real spawn pool.
  readonly artRetired?: boolean;
}

/**
 * The 6 core archetypes — the exhaustive, shipped table. Keyed by the closed
 * union, so adding a core kind is a TypeScript error here until it is authored.
 * It is the ONLY table `WEIGHTED` and the per-level default weights are built
 * from: level-authored archetypes live outside it (see `archetype()`), which is
 * what keeps the frozen spawn pool frozen (spec-level-harness-sp1 §4.1/§4.2).
 */
export const CORE_ARCHETYPES: Record<EnemyKind, Archetype> = {
  normal: {
    kind: "normal",
    hp: 1,
    bulletDamage: 0.25,
    hiddenDuration: 1.5,
    visibleDuration: 3.2,
    shoots: true,
    scoreDelta: 1,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: true,
    weight: 52,
    spriteBase: "enemy_sprite",
    variants: 3,
    tint: "#ffffff",
    aspect: 1,
  },
  riot: {
    kind: "riot",
    hp: 2,
    bulletDamage: 1,
    hiddenDuration: 1.7,
    visibleDuration: 3.6,
    shoots: true,
    scoreDelta: 2,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: true,
    weight: 15,
    spriteBase: "enemy_riot",
    variants: 1,
    tint: "#dbe9ff",
    aspect: 1,
  },
  biker: {
    kind: "biker",
    hp: 1,
    bulletDamage: 0.5,
    hiddenDuration: 1.2,
    visibleDuration: 2.0,
    shoots: true,
    scoreDelta: 1,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: true,
    weight: 15,
    spriteBase: "enemy_biker",
    variants: 1,
    tint: "#fff7e0",
    aspect: 1,
  },
  bonus: {
    kind: "bonus",
    hp: 1,
    bulletDamage: 0,
    hiddenDuration: 2.2,
    visibleDuration: 2.0,
    shoots: false,
    scoreDelta: 1,
    livesDelta: 0,
    timeDelta: 5,
    countsAsTarget: false,
    weight: 11,
    spriteBase: "enemy_bonus",
    variants: 1,
    tint: "#ffe9a8",
    aspect: 1,
  },
  civilian: {
    kind: "civilian",
    hp: 1,
    bulletDamage: 0,
    hiddenDuration: 1.6,
    visibleDuration: 2.6,
    shoots: false,
    // Shooting a civilian is a mistake: lose a life, lose a point.
    scoreDelta: -1,
    livesDelta: -1,
    timeDelta: 0,
    countsAsTarget: false,
    // weight 0: the civilian (livreur) is no longer a window pop-up — it rides
    // the street as a courier (see courierSystem). Kept here for its shoot-penalty
    // effects, which the courier reuses.
    weight: 0,
    // Art retired (ADR-0029): enemy_civilian.png was deleted — the courier renders
    // from the rider flipbook. This spriteBase remains only because the field is
    // structurally required; no preload/load path builds an enemy_civilian path
    // anymore (weight 0 ⇒ windowPoolKinds/enemyAssetPathsFor never emit it).
    spriteBase: "enemy_civilian",
    variants: 1,
    tint: "#d8ffe2",
    aspect: 1,
    artRetired: true,
  },
  // Hostage taker (ADR-0030). NOT a window pop-up anymore: it drives the
  // cinematic QTE, whose rules and magnitudes live entirely in `qteSystem`. This
  // entry is kept as a weight-0 ART DESCRIPTOR only (spriteBase/tint/aspect key
  // the `enemy_hostage` texture the QTE captor renders with) — the exact
  // precedent set by `civilian` above ("kept here for its sprite"). The gameplay
  // fields are inert: weight 0 keeps it out of every window pool, so the generic
  // shot path never reads them. Declared LAST so the frozen `WEIGHTED` order
  // (and thus `pickKind` determinism) holds.
  hostage_taker: {
    kind: "hostage_taker",
    hp: 1,
    bulletDamage: 0,
    hiddenDuration: 1.6,
    visibleDuration: 3.5,
    shoots: false,
    scoreDelta: 0,
    livesDelta: 0,
    timeDelta: 0,
    countsAsTarget: false,
    weight: 0,
    spriteBase: "enemy_hostage",
    variants: 1,
    tint: "#ff8ad8",
    aspect: 1,
  },
};

/**
 * The archetype of a kind — the single resolution point every reader goes
 * through. Direct table indexing is deliberately not the public path: a kind is
 * not always a core kind (level-authored archetypes are registered separately),
 * and this is where that lookup is resolved.
 */
export function archetype(kind: EnemyKind): Archetype {
  return CORE_ARCHETYPES[kind];
}

// The frozen default window pool: one entry per unit of `weight`, in archetype
// declaration order. `pickKind` / `WEIGHTED` are the legacy default path and must
// NOT change (window-spawn determinism is guaranteed against this constant) —
// hence CORE_ARCHETYPES, never a table a level can extend.
export const WEIGHTED: readonly EnemyKind[] = (Object.keys(CORE_ARCHETYPES) as EnemyKind[]).flatMap(
  (k) => Array.from({ length: CORE_ARCHETYPES[k].weight }, () => k),
);

// Deterministic weighted pick so spawns are reproducible per (wave, index).
export function pickKind(seed: number): EnemyKind {
  const idx = Math.abs(Math.floor(seed)) % WEIGHTED.length;
  return WEIGHTED[idx] ?? "normal";
}

// Build a weighted pool from an override map WITHOUT mutating `WEIGHTED`. Each
// kind contributes `weight` copies in declaration order (so passing the default
// weights reproduces `WEIGHTED` byte-for-byte); `weight: 0` drops the kind. Per
// the level-roster gate, call sites merge `{ ...defaultWeights, ...override }`.
export function buildWeightedFrom(
  overrides: Partial<Record<EnemyKind, number>>,
): readonly EnemyKind[] {
  return (Object.keys(CORE_ARCHETYPES) as EnemyKind[]).flatMap((k) => {
    const weight = overrides[k] ?? CORE_ARCHETYPES[k].weight;
    return Array.from({ length: Math.max(0, weight) }, () => k);
  });
}

// Deterministic weighted pick over an explicit pool, mirroring `pickKind`'s
// indexing exactly. With the default-built pool it is identical to `pickKind`.
export function pickKindFor(seed: number, weights: readonly EnemyKind[]): EnemyKind {
  if (weights.length === 0) return "normal";
  const idx = Math.abs(Math.floor(seed)) % weights.length;
  return weights[idx] ?? "normal";
}
