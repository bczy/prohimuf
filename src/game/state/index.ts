export type { GameState, Phase } from "@game/types/gameState";
export {
  createInitialState,
  tickGameState,
  LEVEL_TIME_SECONDS,
  ENEMIES_TO_WIN,
} from "@game/systems/stateMachine";
