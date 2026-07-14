// Pure FIFO ring-buffer write for the persistent wall-mark decal set
// (spec D4.2 / AC4). A fixed pool of `cap = slots.length` slots is written at a
// monotonically wrapping cursor, so the (cap+1)-th write overwrites the OLDEST
// entry and the number of live marks never exceeds `cap`. Extracted from
// ImpactEffects so the cap/eviction invariant has a DOM-free unit assertion,
// following the repo's pure-helper pattern (flipbook.ts, haloFalloff.ts).

/** Advance a ring cursor by one, wrapping at `cap`. */
export function nextCursor(cursor: number, cap: number): number {
  return (cursor + 1) % cap;
}

export interface MarkRing<T> {
  readonly slots: readonly (T | null)[];
  readonly cursor: number;
}

/**
 * Apply one FIFO write: overwrite `slots[cursor]` with `value` and advance the
 * cursor. Pure — the input array is not mutated. Because the pool is fixed at
 * `slots.length`, live entries can never exceed the cap; once the cursor has
 * lapped, each write evicts the oldest entry it lands on.
 */
export function writeMarkRing<T>(
  slots: readonly (T | null)[],
  cursor: number,
  value: T,
): MarkRing<T> {
  const next = slots.slice();
  next[cursor] = value;
  return { slots: next, cursor: nextCursor(cursor, slots.length) };
}
