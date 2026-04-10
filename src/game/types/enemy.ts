export type EnemyState = "HIDDEN" | "APPEARING" | "VISIBLE" | "SHOOTING" | "HIT" | "DEAD";

export interface Enemy {
  readonly id: number;
  readonly slotIndex: number;
  readonly state: EnemyState;
  readonly timer: number;
}
