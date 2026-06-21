// One takedown's effect, surfaced for transient on-screen feedback (floating
// "+5s" / "-1 ♥" labels). Carried on the per-tick GameState.
export interface HitEvent {
  readonly slotIndex: number;
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
}

// Like HitEvent but anchored to an explicit world position rather than a window
// slot — used for street NPCs (the courier) that have no slot.
export interface PointHitEvent {
  readonly x: number;
  readonly y: number;
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
}
