// Platform detection (ADR-0003). Leaf utility: no React/Three imports;
// importable by render and hooks, never by src/game.

const MOBILE_UA_PATTERN =
  /Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini/i;

/** Pure UA classifier. Known limitation: iPadOS Safari reports a desktop UA. */
export function isMobileUA(ua: string): boolean {
  return MOBILE_UA_PATTERN.test(ua);
}

/** Reads the real browser UA. Decided once at app load; never flips mid-session. */
export function detectMobile(): boolean {
  return typeof navigator !== "undefined" && isMobileUA(navigator.userAgent);
}
