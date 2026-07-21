/**
 * Pure expansion of a level's hand-authored `WindowRows` (the `windows` block in
 * `src/game/levels/levelArt.json`, e.g. belliard's single-wide grid) into a flat
 * zone list — MIRRORS `src/game/levels/levelArt.ts`'s `getWindowZones()` windows
 * branch exactly:
 *
 *   const { w, h, rows } = art.windows;
 *   return rows.flatMap((row) => row.xs.map((x) => ({ x, y: row.y, w, h })));
 *
 * Scripts/ cannot import that `.ts` module directly (the harness runs under plain
 * node, no TS loader), so this is a deliberate, unit-tested re-implementation kept
 * in lockstep by `__tests__/windowRows.test.mjs` (which reads the real
 * `belliard.windows` out of levelArt.json and asserts the exact shape/order the
 * app itself derives). Consumed by `scripts/align-grilles.mjs` to build the
 * "opening" (green box) list for the single-wide belliard verification harness —
 * no edge-density pixel detection applies to that baked backdrop, so these
 * hand-authored zones ARE the ground truth, not a detector's guess.
 *
 * @param {{w:number,h:number,rows:readonly {y:number, xs: readonly number[]}[]}} windows
 * @returns {{x:number,y:number,w:number,h:number}[]} row-major, xs-ascending within a row.
 */
export function zonesFromWindowRows(windows) {
  const { w, h, rows } = windows;
  return rows.flatMap((row) => row.xs.map((x) => ({ x, y: row.y, w, h })));
}
