import type { Phase } from "@game/types/gameState";
import type { Player } from "@game/types/player";
import type { Cop } from "@game/types/cop";
import type { DeliveryState } from "@game/types/delivery";

export interface TopdownInput {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
}

export interface TopdownState {
  readonly phase: Phase;
  readonly player: Player;
  readonly cops: readonly Cop[];
  readonly delivery: DeliveryState;
  readonly detectionLevel: number;
}
