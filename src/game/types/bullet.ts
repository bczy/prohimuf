import type { Vec2 } from "@game/types/vector";

export interface Bullet {
  readonly id: number;
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly fromPlayer: boolean;
  // Hearts removed from the player when this bullet crosses the hit disc, in
  // quarter-heart steps (see ARCHETYPES[kind].bulletDamage). Carried per bullet
  // rather than read back from the shooter so the damage survives the shooter's
  // death — the bullet is already in flight and the archetype is a spawn-time fact.
  readonly damage: number;
}
