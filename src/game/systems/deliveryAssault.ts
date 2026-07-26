import type { Enemy, EnemyKind } from "@game/types/enemy";
import type { DeliverySpec } from "@game/types/delivery";
import type { FacadeMap } from "@game/types/map";
import { ARCHETYPES, WEIGHTED, pickKindFor } from "@game/types/enemyTypes";

/**
 * The delivery's own scripted assault — "protéger la camionnette"
 * (`docs/game-design/spec-delivery-van-assault.md` Rev.2, D1/D2).
 *
 * The vehicle is chipped by TWO enemies seated at two reserved window slots next
 * to its stop position when it starts rolling in, for as long as they are ALIVE,
 * and by nothing else. There is **no camera term** in any function here (and no
 * pop-up-state term either), which is what makes the objective's damage
 * independent of where the player looks — asserted by signature, since nothing in
 * this module takes a camera argument.
 *
 * Pure state-in / state-out, no randomness: the kind pick is a deterministic
 * function of the slot index, exactly like `spawnWave`'s.
 */

/**
 * How many assailants a delivery seats. A constant, NOT a per-level field: the
 * tuning needs 2 everywhere, and `integrity`/`windowSeconds` already give
 * per-level control (spec §4.1).
 */
export const DELIVERY_ASSAILANTS = 2;

/**
 * World-x radius around the stop position within which a slot may be reserved for
 * the assault. 7 guarantees the van AND both assailants fit in ONE uncropped
 * frame (`VIEW_W = 18` ⇒ half-frame 9; an enemy plane is ≈ 2.1 wide) with ≈ 0.95 u
 * of margin. Hard ceiling 7.9 — widening it is measured and rejected (spec §7).
 */
export const ASSAULT_RADIUS = 7;

/**
 * Base of the assault's id range — and, per D2.6 (confirmed by the architect),
 * **the identity DISCRIMINANT itself**: an entry of `state.enemies` is one of this
 * delivery's assailants iff its id is at or above this value. It is therefore NOT
 * merely a collision-avoidance base and must never be lowered: `spawnWave` mints
 * `wave·100 + i`, so the range is unreachable below wave 9000 (an executable
 * invariant, see `deliveryAssault.test.ts`), and a typed field on `Enemy` was
 * deliberately refused — `Enemy` is the game→render contract and an assailant
 * renders exactly like any window cop. Read it through {@link isDeliveryAssailant}
 * only; no inline comparison anywhere else in the codebase.
 */
export const DELIVERY_ASSAULT_ID_BASE = 900000;

/** Seed base of the deterministic kind pick, same shape as `spawnWave`'s. */
const ASSAULT_SEED_BASE = 907;

/** Is this enemy one of the live delivery's assailants? The ONE predicate (D2.6). */
export function isDeliveryAssailant(enemy: Enemy): boolean {
  return enemy.id >= DELIVERY_ASSAULT_ID_BASE;
}

/**
 * The slots this level reserves for its delivery assault, nearest the stop
 * position first (exact ties → lower slot index), within {@link ASSAULT_RADIUS}.
 * Pure geometry — no authored data, no camera, no enemy state.
 *
 * They are reserved for the WHOLE level (D2.8): every slot consumer must exclude
 * them (both `spawnWave` call sites and the loot-crate eligibility), otherwise a
 * wave cop or a crate can squat a slot and the objective silently loses an
 * assailant. Fewer than {@link DELIVERY_ASSAILANTS} results means the level's
 * window geometry cannot host the assault — an authoring error, pinned by a test
 * on every shipped level rather than papered over here.
 */
export function reservedAssaultSlots(
  facade: FacadeMap,
  spec: DeliverySpec | null,
): readonly number[] {
  if (spec === null) return [];
  const stopX = spec.stopPosition.x;
  return facade.slots
    .map((slot, slotIndex) => ({ slotIndex, distance: Math.abs(slot.screenPosition.x - stopX) }))
    .filter((c) => c.distance <= ASSAULT_RADIUS)
    .sort((a, b) =>
      a.distance === b.distance ? a.slotIndex - b.slotIndex : a.distance - b.distance,
    )
    .slice(0, DELIVERY_ASSAILANTS)
    .map((c) => c.slotIndex);
}

/**
 * Seat the assault on its reserved slots — called once, on the tick the vehicle
 * enters `INCOMING` (one roll-in BEFORE the damage window opens, so the roll-in is
 * a real telegraph and a present player can clear the ambush pre-emptively).
 *
 * State at seating is `VISIBLE`, and that is FAIRNESS-load-bearing (K-9), not a
 * read preference: ADR-0069 freezes an off-screen enemy in the state it holds, so
 * a player who is absent for the whole roll-in finds two EXPOSED, immediately
 * shootable targets at the window opening — never a frozen duck. Timers are
 * staggered with `spawnWave`'s own `(1 + i·0.3)` factor so two identical kinds do
 * not pop and duck in lockstep.
 *
 * `occupied` is checked even though the reservation should make it impossible: a
 * slot already holding an enemy in ANY state — `DEAD` included — or the live loot
 * crate is not seated on, because `EnemySprite` resolves a slot's occupant with a
 * first-match `find`, so an assailant seated behind a corpse would render nothing
 * while chipping the gauge.
 */
export function seatAssault(
  facade: FacadeMap,
  spec: DeliverySpec | null,
  pool: readonly EnemyKind[] | undefined,
  enemies: readonly Enemy[],
  lootSlotIndex: number | null,
): readonly Enemy[] {
  if (spec === null) return [];
  const occupied = new Set<number>(enemies.map((e) => e.slotIndex));
  if (lootSlotIndex !== null) occupied.add(lootSlotIndex);
  const shooters = (pool ?? WEIGHTED).filter((k) => ARCHETYPES[k].shoots);

  return reservedAssaultSlots(facade, spec)
    .filter((slotIndex) => !occupied.has(slotIndex))
    .map((slotIndex, i) => {
      const kind = pickKindFor(ASSAULT_SEED_BASE + slotIndex * 7 + i * 17, shooters);
      const archetype = ARCHETYPES[kind];
      return {
        id: DELIVERY_ASSAULT_ID_BASE + i,
        slotIndex,
        state: "VISIBLE" as const,
        timer: archetype.visibleDuration * (1 + i * 0.3),
        kind,
        hp: archetype.hp,
      };
    });
}

/**
 * How many of this delivery's assailants are still ALIVE — the damage count of
 * D1, as amended in Rev.2 and ratified at the round-2 design gate.
 *
 * ALIVE, not `targetable`: `tickEnemy` freezes every state but `HIT`, so counting
 * only shootable states let an ordinary edge-scroll freeze both assailants
 * mid-duck and suspend the drain entirely — the panel's own "the objective is
 * free" blocker, re-entered through the pop-up state instead of the camera
 * (measured: 17-26 % of pan timings kept the full bonus with zero player shots).
 * `state !== "DEAD"` reads nothing the freeze can touch, so `t_fail` is ONE number
 * per level for every camera trajectory. Do not narrow this back to `targetable`.
 */
export function countAliveAssailants(enemies: readonly Enemy[]): number {
  return enemies.filter((e) => isDeliveryAssailant(e) && e.state !== "DEAD").length;
}

/**
 * Retire the assault with the set-piece (D3): on the `DELIVERING → SUCCESS|FAILED`
 * tick every surviving assailant becomes `DEAD`, with no score, no kill credit and
 * no quota credit — the escort leaves when the van leaves. Without this, two
 * permanently-frozen enemies would sit in the wave array and block `allDead` (so
 * the wave rollover) for the rest of the level, in a zone the player may never
 * revisit.
 */
export function retireAssault(enemies: readonly Enemy[]): readonly Enemy[] {
  return enemies.map((e) =>
    isDeliveryAssailant(e) && e.state !== "DEAD" ? { ...e, state: "DEAD" as const, timer: 0 } : e,
  );
}
