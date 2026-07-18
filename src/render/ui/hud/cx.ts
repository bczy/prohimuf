/**
 * Join CSS-module class names. Under `noUncheckedIndexedAccess` a `styles.*` lookup
 * is `string | undefined`, so filter before joining (avoids template-literal lint).
 * Shared across the HUD widgets in this folder.
 */
export const cx = (...names: (string | undefined)[]): string =>
  names.filter((n): n is string => n !== undefined).join(" ");
