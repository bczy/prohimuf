// One takedown's effect, surfaced for transient on-screen feedback (floating
// "+5s" / "-1 ♥" labels). Carried on the per-tick GameState.
export interface HitEvent {
  readonly slotIndex: number;
  readonly scoreDelta: number;
  readonly livesDelta: number;
  readonly timeDelta: number;
}
