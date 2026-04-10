export function tickTimer(timeRemaining: number, delta: number): number {
  return Math.max(0, timeRemaining - delta);
}
