export type EnemyState = "HIDDEN" | "APPEARING" | "VISIBLE" | "SHOOTING" | "HIT" | "DEAD";

// Enemy archetypes. Cops are legitimate targets; the "livreur" (delivery
// civilian) must NOT be shot; the "bonus" rewards time when neutralised.
export type EnemyKind = "normal" | "riot" | "biker" | "civilian" | "bonus";

export interface Enemy {
  readonly id: number;
  readonly slotIndex: number;
  readonly state: EnemyState;
  readonly timer: number;
  readonly kind: EnemyKind;
  // Remaining hits before the enemy goes down (riot cops take two).
  readonly hp: number;
}
