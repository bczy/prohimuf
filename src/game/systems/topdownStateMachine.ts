import type { TopdownInput, TopdownState } from "@game/types/topdownState";
import type { TopdownMap } from "@game/maps/topdown_test";
import { createPlayer } from "@game/types/player";
import { createCop } from "@game/types/cop";
import { movePlayer } from "@game/systems/playerSystem";
import { tickCop, detectPlayer } from "@game/systems/copSystem";
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

  // 1. Move player within bounds
  const halfW = map.widthUnits / 2;
  const halfH = map.heightUnits / 2;
  const bounds = { minX: -halfW, maxX: halfW, minY: -halfH, maxY: halfH };
  const movedPlayer = movePlayer(state.player, input, delta, bounds, map.solidRects);

  // 2. Tick cops
  const tickedCops = state.cops.map((cop, i) => {
    const waypoints = map.copWaypoints[i];
    if (waypoints === undefined) return cop;
    return tickCop(cop, waypoints, delta);
  });

  // 3. Detect player — update cop states and accumulate alert count
  let alertCount = 0;
  const detectedCops = tickedCops.map((cop) => {
    const updated = detectPlayer(cop, movedPlayer.position);
    if (updated.state === "ALERT") alertCount++;
    return updated;
  });

  // 4. Update detectionLevel: +0.3*delta per ALERT cop, -0.1*delta otherwise
  const alertCops = alertCount;
  const nonAlertCops = detectedCops.length - alertCops;
  const rawDetection = state.detectionLevel + alertCops * 0.3 * delta - nonAlertCops * 0.1 * delta;
  const detectionLevel = Math.max(0, Math.min(1, rawDetection));

  // 5. Check GAME_OVER
  if (detectionLevel >= 1.0) {
    return {
      ...state,
      player: movedPlayer,
      cops: detectedCops,
      detectionLevel,
      phase: "GAME_OVER",
    };
  }

  // 6. Cargo pickup
  let delivery = checkPickup(movedPlayer, state.delivery);
  const playerWithCargo = delivery.cargoPickedUp ? { ...movedPlayer, hasCargo: true } : movedPlayer;

  // 7. Cargo delivery
  delivery = checkDelivery(playerWithCargo, delivery);

  // 8. Check LEVEL_COMPLETE
  const phase = delivery.cargoDelivered ? "LEVEL_COMPLETE" : "PLAYING";

  return {
    phase,
    player: playerWithCargo,
    cops: detectedCops,
    delivery,
    detectionLevel,
  };
}
