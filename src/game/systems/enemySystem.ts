import type { Enemy, EnemyState } from "@game/types/enemy";
import type { FacadeMap } from "@game/types/map";
import { ARCHETYPES, pickKind } from "@game/types/enemyTypes";

const APPEARING_DURATION = 0.3;
const SHOOTING_DURATION = 0.5;
const HIT_DURATION = 0.2;

function durationFor(enemy: Enemy, state: EnemyState): number {
  const a = ARCHETYPES[enemy.kind];
  switch (state) {
    case "HIDDEN":
      return a.hiddenDuration;
    case "APPEARING":
      return APPEARING_DURATION;
    case "VISIBLE":
      return a.visibleDuration;
    case "SHOOTING":
      return SHOOTING_DURATION;
    case "HIT":
      return HIT_DURATION;
    default:
      return 0;
  }
}

function nextState(enemy: Enemy): EnemyState {
  const a = ARCHETYPES[enemy.kind];
  switch (enemy.state) {
    case "HIDDEN":
      return "APPEARING";
    case "APPEARING":
      return "VISIBLE";
    case "VISIBLE":
      return a.shoots ? "SHOOTING" : "HIDDEN";
    case "SHOOTING":
      return "HIDDEN";
    case "HIT":
      // Survives the hit (riot) → back up; otherwise goes down.
      return enemy.hp <= 0 ? "DEAD" : "VISIBLE";
    default:
      return "DEAD";
  }
}

export function tickEnemy(enemy: Enemy, delta: number): Enemy {
  if (enemy.state === "DEAD") return enemy;

  const newTimer = enemy.timer - delta;
  if (newTimer > 0) {
    return { ...enemy, timer: newTimer };
  }

  const ns = nextState(enemy);
  return { ...enemy, state: ns, timer: durationFor(enemy, ns) };
}

// Apply one bullet of damage. The enemy only goes down once hp reaches zero;
// until then it flashes (HIT) and pops back up.
export function hitEnemy(enemy: Enemy): Enemy {
  return { ...enemy, hp: enemy.hp - 1, state: "HIT", timer: HIT_DURATION };
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

  return indices.slice(0, count).map((slotIndex, i) => {
    const kind = pickKind(wave * 31 + i * 17 + slotIndex * 7);
    const archetype = ARCHETYPES[kind];
    return {
      id: wave * 100 + i,
      slotIndex,
      state: "HIDDEN" as const,
      timer: archetype.hiddenDuration * (1 + i * 0.3),
      kind,
      hp: archetype.hp,
    };
  });
}
