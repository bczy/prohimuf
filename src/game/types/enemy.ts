export type EnemyState = "HIDDEN" | "APPEARING" | "VISIBLE" | "SHOOTING" | "HIT" | "DEAD";

// Enemy archetypes. Cops are legitimate targets; the "livreur" (delivery
// civilian) must NOT be shot; the "bonus" rewards time when neutralised. The
// "hostage_taker" is NOT a window pop-up: it triggers the cinematic QTE (ADR-0030,
// qteSystem) and is kept here only as a weight-0 art descriptor for its sprite.
export type CoreEnemyKind = "normal" | "riot" | "biker" | "civilian" | "bonus" | "hostage_taker";

/**
 * An archetype declared by a generated level (spec-level-harness-sp1 §4.1).
 * Always namespaced `<levelId>:<name>`: the `:` is absent from the 6 core ids, so
 * the two id spaces are disjoint by construction and the merged lookup can never
 * shadow a core kind.
 */
export type GeneratedEnemyKind = `${string}:${string}`;

export type EnemyKind = CoreEnemyKind | GeneratedEnemyKind;

export interface Enemy {
  readonly id: number;
  readonly slotIndex: number;
  readonly state: EnemyState;
  readonly timer: number;
  readonly kind: EnemyKind;
  // Remaining hits before the enemy goes down (riot cops take two).
  readonly hp: number;
}
