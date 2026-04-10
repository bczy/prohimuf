import type { GameState } from "@game/types/gameState";
import type { Enemy } from "@game/types/enemy";
import type { Bullet } from "@game/types/bullet";
import type { FacadeMap } from "@game/types/map";
import { tickTimer } from "@game/systems/timer";
import { moveCrosshair } from "@game/systems/crosshairSystem";
import { spawnWave, tickEnemy } from "@game/systems/enemySystem";
import { fireBullet, tickBullets, checkBulletHits, BULLET_SPEED } from "@game/systems/bulletSystem";

export const LEVEL_TIME_SECONDS = 90;
export const ENEMIES_TO_WIN = 10;

const PLAYER_HIT_RADIUS = 1.0;

let _nextBulletId = 1;

export function createInitialState(facade: FacadeMap): GameState {
  return {
    phase: "PLAYING",
    crosshair: { position: { x: 0.5, y: 0.5 } },
    enemies: spawnWave(1, facade),
    bullets: [],
    score: 0,
    lives: 3,
    timeRemaining: LEVEL_TIME_SECONDS,
    wave: 1,
  };
}

export function tickGameState(
  state: GameState,
  fire: boolean,
  mouseX: number,
  mouseY: number,
  delta: number,
  facade: FacadeMap,
  cameraOffsetX = 0,
  viewW = 18,
  viewH = 12,
): GameState {
  if (state.phase === "GAME_OVER" || state.phase === "LEVEL_COMPLETE") {
    return state;
  }

  if (state.score >= ENEMIES_TO_WIN) {
    return { ...state, phase: "LEVEL_COMPLETE" };
  }

  // 1. Update crosshair
  const crosshair = moveCrosshair(mouseX, mouseY);

  // 2. Tick enemies
  const tickedEnemies = state.enemies.map((e) => tickEnemy(e, delta));

  // 3. Spawn new wave if all enemies dead
  const allDead = tickedEnemies.every((e) => e.state === "DEAD");
  const newWave = allDead ? state.wave + 1 : state.wave;
  const activeEnemies: readonly Enemy[] = allDead ? spawnWave(newWave, facade) : tickedEnemies;

  // 4. Player fires bullet
  let bullets: readonly Bullet[] = state.bullets;
  if (fire) {
    _nextBulletId++;
    bullets = [...bullets, fireBullet(crosshair, true, _nextBulletId, cameraOffsetX, viewW, viewH)];
  }

  // 5. SHOOTING enemies fire at player
  const shootingEnemies = activeEnemies.filter((e) => e.state === "SHOOTING");
  for (const enemy of shootingEnemies) {
    const slot = facade.slots[enemy.slotIndex];
    if (slot === undefined) continue;
    _nextBulletId++;
    bullets = [
      ...bullets,
      {
        id: _nextBulletId,
        position: { x: slot.screenPosition.x, y: slot.screenPosition.y },
        velocity: { x: 0, y: -BULLET_SPEED },
        fromPlayer: false,
      },
    ];
  }

  // 6. Tick bullets
  const movedBullets = tickBullets(bullets, delta);

  // 7. Player bullet hits on enemies
  const hitResult = checkBulletHits(movedBullets, activeEnemies, facade);
  const newScore = state.score + hitResult.hits;

  // 8. Enemy bullet hits player (near screen center y=0)
  const hitBulletIds = new Set<number>();
  let playerHit = false;
  for (const b of hitResult.bullets) {
    if (b.fromPlayer) continue;
    if (Math.sqrt(b.position.x * b.position.x + b.position.y * b.position.y) <= PLAYER_HIT_RADIUS) {
      hitBulletIds.add(b.id);
      playerHit = true;
    }
  }
  const finalBullets = hitResult.bullets.filter((b) => !hitBulletIds.has(b.id));

  const newLives = playerHit ? state.lives - 1 : state.lives;

  if (newLives <= 0) {
    return {
      ...state,
      crosshair,
      enemies: hitResult.enemies,
      bullets: finalBullets,
      lives: 0,
      score: newScore,
      wave: newWave,
      phase: "GAME_OVER",
    };
  }

  // 9. Tick timer
  const timeRemaining = tickTimer(state.timeRemaining, delta);
  if (timeRemaining === 0) {
    return {
      ...state,
      crosshair,
      enemies: hitResult.enemies,
      bullets: finalBullets,
      lives: newLives,
      score: newScore,
      wave: newWave,
      timeRemaining: 0,
      phase: "GAME_OVER",
    };
  }

  const finalPhase = newScore >= ENEMIES_TO_WIN ? "LEVEL_COMPLETE" : "PLAYING";

  return {
    phase: finalPhase,
    crosshair,
    enemies: hitResult.enemies,
    bullets: finalBullets,
    score: newScore,
    lives: newLives,
    timeRemaining,
    wave: newWave,
  };
}
