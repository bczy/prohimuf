import type { Enemy, EnemyState } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";

const HIDDEN_DURATION = 1.5;
const APPEARING_DURATION = 0.3;
const VISIBLE_DURATION = 2.0;
const HIT_DURATION = 0.2;
const SHOOTING_DURATION = 0.5;

const NEXT_STATE: Partial<Record<EnemyState, EnemyState>> = {
  HIDDEN: "APPEARING",
  APPEARING: "VISIBLE",
  VISIBLE: "SHOOTING",
  SHOOTING: "HIDDEN",
  HIT: "DEAD",
};

const NEXT_TIMER: Partial<Record<EnemyState, number>> = {
  APPEARING: APPEARING_DURATION,
  VISIBLE: VISIBLE_DURATION,
  SHOOTING: SHOOTING_DURATION,
  HIDDEN: HIDDEN_DURATION,
  DEAD: 0,
};

export function tickEnemy(enemy: Enemy, delta: number): Enemy {
  if (enemy.state === "DEAD") return enemy;

  const newTimer = enemy.timer - delta;
  if (newTimer > 0) {
    return { ...enemy, timer: newTimer };
  }

  const nextState = NEXT_STATE[enemy.state] ?? "DEAD";
  const nextTimer = NEXT_TIMER[nextState] ?? 0;
  return { ...enemy, state: nextState, timer: nextTimer };
}

export function hitEnemy(enemy: Enemy): Enemy {
  return { ...enemy, state: "HIT", timer: HIT_DURATION };
}

export function spawnWave(wave: number, facade: FacadeMap): readonly Enemy[] {
  const count = Math.min(2 + wave, facade.slots.length);
  // Shuffled slot indices using a deterministic seed per wave
  const indices = Array.from({ length: facade.slots.length }, (_, i) => i);
  // Simple deterministic shuffle (wave as seed)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = (i * 7 + wave * 13) % (i + 1);
    const tmp = indices[i];
    const swapTarget = indices[j];
    if (tmp !== undefined && swapTarget !== undefined) {
      indices[i] = swapTarget;
      indices[j] = tmp;
    }
  }

  return indices.slice(0, count).map((slotIndex, i) => ({
    id: wave * 100 + i,
    slotIndex,
    state: "HIDDEN" as const,
    timer: HIDDEN_DURATION * (1 + i * 0.3),
  }));
}
