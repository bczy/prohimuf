// Multi-weapon pickup roster V1 (A-B-C) — ADR-0052 D1.
// Type-only module (no functions), the exact `enemyTypes.ts` precedent: the
// runtime `WeaponState` rides `GameState`; `WEAPON_SPECS` is a data table, not
// logic. Tuning values trace to `docs/game-design/weapons.md` §7 and are
// `verify`-tunable starting points, not gated constants.

// Neutral code identifiers (French names in the spec are designer placeholders):
// "base"   = A "le calibre"   — precision mono-cible, always present, ∞ stock.
// "auto"   = B "la sulfateuse" — per-trigger burst, finite rounds.
// "spread" = C "l'éventail"    — 3 simultaneous resolutions, finite presses.
export type WeaponKind = "base" | "auto" | "spread";

// A special (non-base) weapon — the only kinds a LOOT crate can carry (§5.2).
export type SpecialWeaponKind = Exclude<WeaponKind, "base">;

// Data descriptor for a weapon kind (ADR-0052 D1; ARCHETYPES precedent). Carries
// the §7 tuning: how many resolutions a trigger produces (`offsets`), the burst
// cadence (`auto` only), the post-fire lockout, and the starting stock.
export interface WeaponSpec {
  readonly kind: WeaponKind;
  // Starting stock. `base` = Infinity (never decremented, §2.2 / AC1).
  readonly startStock: number;
  // Per-trigger world-x offsets for the §2.1 resolutions: A/B `[0]`, C
  // `[-2, 0, 2]` (façade column pitch `col*2-18`, §2.4). Each entry = one
  // independent hitscan resolution at that dx from the live crosshair.
  readonly offsets: readonly number[];
  // Rounds emitted per burst trigger — `auto` only (§2.3). A/C never burst
  // (value inert; the auto branch of `resolveTrigger` is the sole reader).
  readonly burstRounds: number;
  // Inter-round cadence for a burst, ms (`auto`; §7 BURST_INTERVAL_MS = 90). At
  // most one round fires per tick (ADR-0052 D4). 0 for non-burst weapons.
  readonly burstIntervalMs: number;
  // Post-fire lockout, ms: `auto` post-burst BURST_REFRACTORY_MS = 150, `spread`
  // post-press SPREAD_COOLDOWN_MS = 300, `base` 0 (input-gated, no cooldown, §2.2).
  readonly refractoryMs: number;
}

// Runtime weapon state on `GameState` (ADR-0052 D1). Burst is pure tick state
// (D4): the timer-accumulator lives here, so it freezes naturally through a QTE
// (D7 — rides `...state`, no weapon logic runs in the frozen branches).
export interface WeaponState {
  readonly active: WeaponKind;
  // Remaining stock; `Infinity` for `base` (AC11 — never a counter/red/blink).
  readonly stock: number;
  // Rounds left in the in-flight `auto` burst; 0 when idle.
  readonly burstRemaining: number;
  // Accumulator toward the next burst round, ms.
  readonly burstTimerMs: number;
  // Post-fire lockout remaining, ms; blocks a new trigger until it elapses.
  readonly refractoryMs: number;
}

// §7 tuning table (verify starting points, not gated). ±2.0 u = the façade
// column pitch (`facade01.ts`: x = col*2 − 18), so a centred `spread` covers 3
// adjacent columns.
export const WEAPON_SPECS: Record<WeaponKind, WeaponSpec> = {
  base: {
    kind: "base",
    startStock: Infinity,
    offsets: [0],
    burstRounds: 1,
    burstIntervalMs: 0,
    refractoryMs: 0,
  },
  auto: {
    kind: "auto",
    startStock: 120, // 20 bursts × 6 rounds (§7 "burns fast", ≈10.8 s of fire).
    offsets: [0],
    burstRounds: 6,
    burstIntervalMs: 90,
    refractoryMs: 150,
  },
  spread: {
    kind: "spread",
    startStock: 30, // 30 presses (≈90 resolutions), shotgun-shell model (§2.4).
    offsets: [-2, 0, 2],
    burstRounds: 1,
    burstIntervalMs: 0,
    refractoryMs: 300,
  },
};
