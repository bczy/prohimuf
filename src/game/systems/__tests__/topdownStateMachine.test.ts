import { describe, it, expect } from "vitest";
import { createTopdownInitialState, tickTopdown } from "@game/systems/topdownStateMachine";
import { TOPDOWN_TEST } from "@game/maps/topdown_test";
import type { TopdownInput } from "@game/types/topdownState";

const noInput: TopdownInput = { up: false, down: false, left: false, right: false };
const upInput: TopdownInput = { up: true, down: false, left: false, right: false };

describe("createTopdownInitialState", () => {
  it("phase = PLAYING", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    expect(state.phase).toBe("PLAYING");
  });

  it("player à playerStart", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    expect(state.player.position).toEqual(TOPDOWN_TEST.playerStart);
  });

  it("hasCargo = false", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    expect(state.player.hasCargo).toBe(false);
  });

  it("detectionLevel = 0", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    expect(state.detectionLevel).toBe(0);
  });

  it("cargoPickedUp = false, cargoDelivered = false", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    expect(state.delivery.cargoPickedUp).toBe(false);
    expect(state.delivery.cargoDelivered).toBe(false);
  });

  it("crée autant de cops que copWaypoints", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    expect(state.cops.length).toBe(TOPDOWN_TEST.copWaypoints.length);
  });
});

describe("tickTopdown — terminal phases", () => {
  it("no-op si GAME_OVER", () => {
    const state = { ...createTopdownInitialState(TOPDOWN_TEST), phase: "GAME_OVER" as const };
    const result = tickTopdown(state, upInput, 0.016, TOPDOWN_TEST);
    expect(result).toBe(state);
  });

  it("no-op si LEVEL_COMPLETE", () => {
    const state = {
      ...createTopdownInitialState(TOPDOWN_TEST),
      phase: "LEVEL_COMPLETE" as const,
    };
    const result = tickTopdown(state, upInput, 0.016, TOPDOWN_TEST);
    expect(result).toBe(state);
  });
});

describe("tickTopdown — mouvement joueur", () => {
  it("player se déplace avec input up", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    const result = tickTopdown(state, upInput, 1, TOPDOWN_TEST);
    // up moves player in negative y direction (playerSystem uses up → y++)
    expect(result.player.position).not.toEqual(state.player.position);
  });

  it("player reste dans les bounds de la carte", () => {
    let state = createTopdownInitialState(TOPDOWN_TEST);
    // Drive repeatedly upward to hit the boundary
    for (let i = 0; i < 100; i++) {
      state = tickTopdown(state, upInput, 1, TOPDOWN_TEST);
    }
    const halfH = TOPDOWN_TEST.heightUnits / 2;
    expect(Math.abs(state.player.position.y)).toBeLessThanOrEqual(halfH);
  });
});

describe("tickTopdown — cargo pickup", () => {
  it("cargoPickedUp passe à true quand player touche le pickup", () => {
    // Place player directly at pickupPosition
    const state = createTopdownInitialState(TOPDOWN_TEST);
    const atPickup = {
      ...state,
      player: {
        ...state.player,
        position: TOPDOWN_TEST.pickupPosition,
      },
    };
    const result = tickTopdown(atPickup, noInput, 0.016, TOPDOWN_TEST);
    expect(result.delivery.cargoPickedUp).toBe(true);
  });

  it("hasCargo reste false si loin du pickup", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    const result = tickTopdown(state, noInput, 0.016, TOPDOWN_TEST);
    expect(result.delivery.cargoPickedUp).toBe(false);
  });
});

describe("tickTopdown — cargo delivery", () => {
  it("phase passe à LEVEL_COMPLETE quand cargo livré au delivery point", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    const atDelivery = {
      ...state,
      player: {
        ...state.player,
        position: TOPDOWN_TEST.deliveryPosition,
        hasCargo: true,
      },
      delivery: {
        ...state.delivery,
        cargoPickedUp: true,
      },
    };
    const result = tickTopdown(atDelivery, noInput, 0.016, TOPDOWN_TEST);
    expect(result.phase).toBe("LEVEL_COMPLETE");
  });

  it("cargoDelivered ne change pas si hasCargo=false", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    const atDelivery = {
      ...state,
      player: {
        ...state.player,
        position: TOPDOWN_TEST.deliveryPosition,
        hasCargo: false,
      },
    };
    const result = tickTopdown(atDelivery, noInput, 0.016, TOPDOWN_TEST);
    expect(result.delivery.cargoDelivered).toBe(false);
  });
});

describe("tickTopdown — détection", () => {
  it("detectionLevel augmente si cop proche du joueur", () => {
    const state = createTopdownInitialState(TOPDOWN_TEST);
    // Place the player at the cop's starting position to trigger detection
    const copStart = TOPDOWN_TEST.copWaypoints[0]?.[0] ?? { x: 0, y: 0 };
    const nearCop = {
      ...state,
      player: { ...state.player, position: copStart },
    };
    const result = tickTopdown(nearCop, noInput, 0.016, TOPDOWN_TEST);
    expect(result.detectionLevel).toBeGreaterThan(0);
  });

  it("detectionLevel décroît si aucun cop proche", () => {
    const state = {
      ...createTopdownInitialState(TOPDOWN_TEST),
      detectionLevel: 0.5,
      // Player is at origin, cops are patrolling far away
      player: { ...createTopdownInitialState(TOPDOWN_TEST).player, position: { x: 0, y: 0 } },
    };
    const result = tickTopdown(state, noInput, 1, TOPDOWN_TEST);
    expect(result.detectionLevel).toBeLessThan(0.5);
  });

  it("detectionLevel clampé [0, 1]", () => {
    const lowState = {
      ...createTopdownInitialState(TOPDOWN_TEST),
      detectionLevel: 0,
    };
    const resultLow = tickTopdown(lowState, noInput, 1, TOPDOWN_TEST);
    expect(resultLow.detectionLevel).toBeGreaterThanOrEqual(0);

    const highState = {
      ...createTopdownInitialState(TOPDOWN_TEST),
      detectionLevel: 0.99,
      player: {
        ...createTopdownInitialState(TOPDOWN_TEST).player,
        position: TOPDOWN_TEST.copWaypoints[0]?.[0] ?? { x: 0, y: 0 },
      },
    };
    // Tick multiple times to push past 1.0
    let s = highState;
    for (let i = 0; i < 20; i++) {
      s = tickTopdown(s, noInput, 1, TOPDOWN_TEST);
    }
    expect(s.detectionLevel).toBeLessThanOrEqual(1);
  });

  it("phase passe à GAME_OVER si cop CHASE rattrape le joueur", () => {
    // detectionLevel already at 1 → cops enter CHASE
    // Place player exactly on cop position → cop catches immediately
    const copStart = TOPDOWN_TEST.copWaypoints[0]?.[0] ?? { x: 0, y: 0 };
    const state = {
      ...createTopdownInitialState(TOPDOWN_TEST),
      detectionLevel: 1.0,
      player: {
        ...createTopdownInitialState(TOPDOWN_TEST).player,
        position: copStart,
      },
    };
    const result = tickTopdown(state, noInput, 0.016, TOPDOWN_TEST);
    expect(result.phase).toBe("GAME_OVER");
  });
});
