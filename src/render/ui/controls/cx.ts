/**
 * Join CSS-module class names (render-layer shared). Under `noUncheckedIndexedAccess`
 * a `styles.*` lookup is `string | undefined`, so filter before joining. Mirrors
 * `hud/cx.ts` for the pre-game menu/control primitives.
 */
export const cx = (...names: (string | false | null | undefined)[]): string =>
  names.filter((n): n is string => typeof n === "string").join(" ");
