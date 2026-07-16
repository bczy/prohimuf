import type { Vec2 } from "@game/types/vector";

// One takedown's effect, surfaced for transient on-screen feedback (floating
// "+5s" / "-1 ♥" labels). Carried on the per-tick GameState.
export interface HitEvent {
  readonly slotIndex: number;
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  // Continuous-energy change for this takedown (ADR-0004 D5 / ADR-0030). Optional
  // and additive: absent ⇒ 0, so every existing emitter (cops, bonus) is
  // unchanged. Only the hostage-taker outcomes set it.
  readonly energyDelta?: number;
}

// Like HitEvent but anchored to an explicit world position rather than a window
// slot — used for street NPCs (the courier) that have no slot.
export interface PointHitEvent {
  readonly x: number;
  readonly y: number;
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
  // Continuous-energy change, anchored to a world position (street hostage
  // outcomes). Optional and additive: absent ⇒ 0, so the courier emitter is
  // unchanged. See HitEvent.energyDelta.
  readonly energyDelta?: number;
}

// One resolved player shot, surfaced for transient render effects (explosion,
// wall mark). Cosmetic-only: carries facts, no rule. At most one per tick.
// Consumed per-frame by the hooks bridge — never persisted.
export interface ImpactEvent {
  readonly classification: "hit" | "miss";
  // World point the shot struck (IMPACT_POINT). Wall-mark anchor for BOTH
  // hit and miss; explosion anchor on a MISS. From crosshairToWorld at fire time.
  readonly impactPoint: Vec2;
  // Present only when classification === "hit". slotPosition is the struck
  // slot's screenPosition (a fact the game already holds); render anchors the
  // HIT explosion at slotPosition.y − TARGET_BASE_DROP (drop is a RENDER const).
  readonly hit?: {
    readonly enemyId: number;
    readonly slotIndex: number;
    readonly slotPosition: Vec2;
  };
}
