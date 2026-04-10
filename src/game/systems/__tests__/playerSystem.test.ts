import { describe, it, expect } from "vitest";
import { movePlayer, PLAYER_SPEED } from "@game/systems/playerSystem";
import { createPlayer } from "@game/types/player";

const BOUNDS = { minX: -15, maxX: 15, minY: -10, maxY: 10 };
const noInput = { up: false, down: false, left: false, right: false };

describe("movePlayer", () => {
  it("ne se déplace pas si aucune touche", () => {
    const player = createPlayer({ x: 0, y: 0 });
    const result = movePlayer(player, noInput, 1, BOUNDS);
    expect(result.position).toEqual({ x: 0, y: 0 });
  });

  it("se déplace vers le haut avec up=true", () => {
    const player = createPlayer({ x: 0, y: 0 });
    const result = movePlayer(player, { ...noInput, up: true }, 1, BOUNDS);
    expect(result.position.y).toBeGreaterThan(0);
  });

  it("se déplace vers le bas avec down=true", () => {
    const player = createPlayer({ x: 0, y: 0 });
    const result = movePlayer(player, { ...noInput, down: true }, 1, BOUNDS);
    expect(result.position.y).toBeLessThan(0);
  });

  it("se déplace à gauche avec left=true", () => {
    const player = createPlayer({ x: 0, y: 0 });
    const result = movePlayer(player, { ...noInput, left: true }, 1, BOUNDS);
    expect(result.position.x).toBeLessThan(0);
  });

  it("se déplace à droite avec right=true", () => {
    const player = createPlayer({ x: 0, y: 0 });
    const result = movePlayer(player, { ...noInput, right: true }, 1, BOUNDS);
    expect(result.position.x).toBeGreaterThan(0);
  });

  it("normalise la diagonale (up+right : magnitude == PLAYER_SPEED)", () => {
    const player = createPlayer({ x: 0, y: 0 });
    const result = movePlayer(player, { ...noInput, up: true, right: true }, 1, BOUNDS);
    const dx = result.position.x - 0;
    const dy = result.position.y - 0;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    expect(magnitude).toBeCloseTo(PLAYER_SPEED);
  });

  it("clamp position dans les bounds (bord droit)", () => {
    const player = createPlayer({ x: 14.9, y: 0 });
    const result = movePlayer(player, { ...noInput, right: true }, 1, BOUNDS);
    expect(result.position.x).toBeLessThanOrEqual(BOUNDS.maxX);
  });

  it("clamp position dans les bounds (bord gauche)", () => {
    const player = createPlayer({ x: -14.9, y: 0 });
    const result = movePlayer(player, { ...noInput, left: true }, 1, BOUNDS);
    expect(result.position.x).toBeGreaterThanOrEqual(BOUNDS.minX);
  });

  it("préserve hasCargo lors du déplacement", () => {
    const player = { ...createPlayer({ x: 0, y: 0 }), hasCargo: true };
    const result = movePlayer(player, { ...noInput, up: true }, 1, BOUNDS);
    expect(result.hasCargo).toBe(true);
  });

  it("déplacement proportionnel à delta", () => {
    const player = createPlayer({ x: 0, y: 0 });
    const resultHalf = movePlayer(player, { ...noInput, right: true }, 0.5, BOUNDS);
    const resultFull = movePlayer(player, { ...noInput, right: true }, 1, BOUNDS);
    expect(resultFull.position.x).toBeCloseTo(resultHalf.position.x * 2);
  });
});
