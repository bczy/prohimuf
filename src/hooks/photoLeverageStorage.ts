/**
 * Photo-leverage persistence adapter (ADR-0080) — the IMPURE half of the cross-level carry.
 *
 * `src/game` owns the algebra (`parsePhotoLeverage` total, `mergePhotoLeverage` monotone);
 * this module owns the browser I/O and nothing else — the same ADR-0076 D4 split, and the
 * same try/catch-swallow posture as the five existing `muf_*` storage owners: a disabled,
 * full or corrupt localStorage degrades to "no proof carried", never to a thrown error on a
 * navigation event.
 *
 * WHY this is persisted rather than held in memory: the proof is earned on Belliard and spent
 * at the Niveau Final, and between the two the player crosses the end screen, the menu,
 * narrative screens, two further levels, any number of retries and any number of browser
 * reloads. An in-memory scheme would lose the reward by DEFAULT, which reads to a player as
 * "the reward doesn't work".
 */
import {
  PHOTO_LEVERAGE_STORAGE_KEY,
  mergePhotoLeverage,
  parsePhotoLeverage,
  serialisePhotoLeverage,
} from "@game/systems/photoLeverageSystem";
import type { PhotoLeverage } from "@game/types/photoLeverage";

/** Reads the carry; any failure (no storage, corrupt blob) reads as `"none"`. */
export function loadPhotoLeverage(): PhotoLeverage {
  try {
    return parsePhotoLeverage(localStorage.getItem(PHOTO_LEVERAGE_STORAGE_KEY));
  } catch {
    return "none";
  }
}

/**
 * Monotonically merges the given outcome into the stored carry and returns the result.
 * Idempotent, so the bridge may call it on every tick the outcome is present without
 * needing a "written already" flag of its own.
 */
export function recordPhotoLeverage(outcome: PhotoLeverage): PhotoLeverage {
  const next = mergePhotoLeverage(loadPhotoLeverage(), outcome);
  try {
    localStorage.setItem(PHOTO_LEVERAGE_STORAGE_KEY, serialisePhotoLeverage(next));
  } catch {
    // Storage unavailable/full — the run continues normally, only the carry is lost.
  }
  return next;
}
