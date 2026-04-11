import type { TopdownInput, TopdownState } from "@game/types/topdownState";
import type { TopdownMap } from "@game/maps/topdown_test";
import { createPlayer } from "@game/types/player";
import { createCop } from "@game/types/cop";
import { movePlayer } from "@game/systems/playerSystem";
import { tickCop, detectPlayer, enterChase, isCopCatchingPlayer } from "@game/systems/copSystem";
import { checkPickup, checkDelivery } from "@game/systems/deliverySystem";

export { TopdownMap };

export function createTopdownInitialState(map: TopdownMap): TopdownState {
  const player = createPlayer(map.playerStart);
  const cops = map.copWaypoints.map((waypoints, i) => createCop(i, waypoints[0] ?? { x: 0, y: 0 }));
  const delivery = {
    pickup: { id: "pickup", position: map.pickupPosition, radius: 1.5 },
    delivery: { id: "delivery", position: map.deliveryPosition, radius: 1.5 },
    cargoPickedUp: false,
    cargoDelivered: false,
  };

  return {
    phase: "PLAYING",
    player,
    cops,
    delivery,
    detectionLevel: 0,
  };
}

export function tickTopdown(
  state: TopdownState,
  input: TopdownInput,
  delta: number,
  map: TopdownMap,
): TopdownState {
  if (state.phase === "GAME_OVER" || state.phase === "LEVEL_COMPLETE") {
    return state;
  }

  const chasing = state.detectionLevel >= 1.0;

  // 1. Move player within bounds
  const halfW = map.widthUnits / 2;
  const halfH = map.heightUnits / 2;
  const bounds = { minX: -halfW, maxX: halfW, minY: -halfH, maxY: halfH };
  const movedPlayer = movePlayer(state.player, input, delta, bounds, map.solidRects);

  // 2. Tick cops — chase or patrol
  const tickedCops = state.cops.map((cop, i) => {
    const waypoints = map.copWaypoints[i];
    if (waypoints === undefined) return cop;
    return tickCop(cop, waypoints, delta, chasing, movedPlayer.position);
  });

  // 3. If already chasing, switch all cops to CHASE state
  const chaseCops = chasing
    ? tickedCops.map((cop) => (cop.state !== "CHASE" ? enterChase(cop) : cop))
    : tickedCops;

  // 4. Detect player — update cop states and accumulate alert count (only when not chasing)
  let alertCount = 0;
  const detectedCops = chasing
    ? chaseCops
    : chaseCops.map((cop) => {
        const updated = detectPlayer(cop, movedPlayer.position);
        if (updated.state === "ALERT") alertCount++;
        return updated;
      });

  // 5. Update detectionLevel
  const rawDetection = chasing
    ? state.detectionLevel // stays at 1 during chase
    : state.detectionLevel +
      alertCount * 0.3 * delta -
      (detectedCops.length - alertCount) * 0.1 * delta;
  const detectionLevel = Math.max(0, Math.min(1, rawDetection));

  // 6. Check cop catch → GAME_OVER
  const caught = detectedCops.some((cop) => isCopCatchingPlayer(cop, movedPlayer.position));
  if (caught) {
    return {
      ...state,
      player: movedPlayer,
      cops: detectedCops,
      detectionLevel,
      phase: "GAME_OVER",
    };
  }

  // 7. Cargo pickup
  let delivery = checkPickup(movedPlayer, state.delivery);
  const playerWithCargo = delivery.cargoPickedUp ? { ...movedPlayer, hasCargo: true } : movedPlayer;

  // 8. Cargo delivery
  delivery = checkDelivery(playerWithCargo, delivery);

  // 9. Check LEVEL_COMPLETE
  const phase = delivery.cargoDelivered ? "LEVEL_COMPLETE" : "PLAYING";

  return {
    phase,
    player: playerWithCargo,
    cops: detectedCops,
    delivery,
    detectionLevel,
  };
}
