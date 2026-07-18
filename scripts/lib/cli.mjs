/**
 * Shared `--list` / `--asset <name>` CLI parser (ADR-0007 D2) — replaces the
 * duplicated parser that used to differ only in a `padEnd` column width
 * between generate-assets.mjs and generate-game-assets.mjs, and is now
 * hand-copied again in gen-vehicle-sprites.mjs / gen-courier-sprites.mjs.
 *
 * Pure: reads only the `argv` array passed in, no `process.argv`, no I/O.
 */

/**
 * parseAssetArgs(argv, { targetFlag = "--asset" }) -> { list?: true, target?: string }
 *
 * - `--list` (anywhere in argv) sets `list: true`.
 * - `<targetFlag> <value>` sets `target: value`. Defaults to `--asset`; pass a
 *   custom flag (e.g. `{ targetFlag: "--layer" }`) for a generator whose CLI
 *   uses a different name for the same "restrict to one item" concept
 *   (gen-courier-sprites.mjs's `--layer`) without changing its documented flag.
 * - Throws if the target flag is present with no value, or a value that looks
 *   like another flag (starts with `--`) — a missing/garbled value would
 *   otherwise silently resolve to `undefined`/the next flag's name.
 */
export function parseAssetArgs(argv, { targetFlag = "--asset" } = {}) {
  const result = {};
  if (argv.includes("--list")) {
    result.list = true;
  }
  const i = argv.indexOf(targetFlag);
  if (i !== -1) {
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${targetFlag} requires a value`);
    }
    result.target = value;
  }
  return result;
}
