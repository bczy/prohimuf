import { describe, it, expect } from "vitest";
import {
  movePlayer,
  collidesWithRect,
  resolveCollision,
  PLAYER_SPEED,
} from "@game/systems/playerSystem";
import { createPlayer } from "@game/types/player";
import type { SolidRect } from "@game/maps/topdown_test";

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

  it("bloqué par un mur solide (ne traverse pas)", () => {
    const wall: SolidRect = { x: 2, y: 0, w: 1, h: 2 };
    // Player just to the left of the wall, small delta so it doesn't jump past
    const player = createPlayer({ x: 0.5, y: 0 });
    const result = movePlayer(player, { ...noInput, right: true }, 0.016, BOUNDS, [wall]);
    // Should not enter the wall collision zone
    expect(collidesWithRect(result.position.x, result.position.y, wall)).toBe(false);
  });

  it("glisse le long du mur horizontalement (slide Y)", () => {
    const wall: SolidRect = { x: 2, y: 0, w: 1, h: 5 };
    // Player moving right+up, wall blocks X — should be able to slide up
    const player = createPlayer({ x: 0, y: -3 });
    const result = movePlayer(player, { ...noInput, right: true, up: true }, 5, BOUNDS, [wall]);
    // Y should increase (slide along wall), X should be blocked
    expect(result.position.y).toBeGreaterThan(-3);
  });
});

describe("collidesWithRect", () => {
  const rect: SolidRect = { x: 0, y: 0, w: 2, h: 2 };

  it("détecte collision au centre", () => {
    expect(collidesWithRect(0, 0, rect)).toBe(true);
  });

  it("pas de collision loin du rect", () => {
    expect(collidesWithRect(10, 10, rect)).toBe(false);
  });

  it("collision sur le bord", () => {
    expect(collidesWithRect(2.3, 0, rect)).toBe(true); // within PLAYER_RADIUS
  });
});

describe("resolveCollision", () => {
  const wall: SolidRect = { x: 5, y: 0, w: 1, h: 3 };

  it("pas de collision → position inchangée", () => {
    const result = resolveCollision(0, 0, 0, 0, [wall]);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("collision frontale → revient à la position précédente", () => {
    const result = resolveCollision(5, 0, -1, 0, [wall]);
    expect(result.x).toBe(-1);
    expect(result.y).toBe(0);
  });
});
