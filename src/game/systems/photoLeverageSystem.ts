import type { PhotoLeverage, PhotoLeverageTiers } from "@game/types/photoLeverage";

/**
 * The cross-level carry's ALGEBRA (ADR-0080, techplan §2.4) — the pure half. The impure half
 * (localStorage) lives in `src/hooks/photoLeverageStorage.ts`, exactly the ADR-0076 D4 split.
 *
 * This is the first state in muf that travels from one level to another: the proof is earned
 * on Belliard and spent at the Niveau Final, across the end screen, the menu, two further
 * levels, any number of retries and any number of reloads. Everything below is total and
 * monotone, because that gap is where a lenient parse or a downgrade would bite.
 */

/** The storage key — a sixth, distinct `muf_*` key, never shared with prefs/progress/scores. */
export const PHOTO_LEVERAGE_STORAGE_KEY = "muf_leverage";

/** The blob's schema version. The blob is an OBJECT so the deferred `hasPlaque` bit is an
 *  added FIELD, not a migration (E-5 / R2-4). */
export const PHOTO_LEVERAGE_BLOB_VERSION = 1;

const RANK: Record<PhotoLeverage, number> = {
  none: 0,
  master: 1,
  "master-bonus": 2,
};

function isPhotoLeverage(v: unknown): v is PhotoLeverage {
  return v === "none" || v === "master" || v === "master-bonus";
}

/**
 * Read a persisted blob. TOTAL: absent, malformed, wrong version, unknown value — everything
 * reads as `"none"`, and it never throws. A reward that crashes the menu on a corrupt key
 * would be worse than a reward that quietly is not there (ADR-0076 D4 posture).
 */
export function parsePhotoLeverage(raw: string | null): PhotoLeverage {
  if (raw === null || raw === "") return "none";
  try {
    const blob: unknown = JSON.parse(raw);
    if (typeof blob !== "object" || blob === null) return "none";
    const record = blob as Record<string, unknown>;
    if (record.v !== PHOTO_LEVERAGE_BLOB_VERSION) return "none";
    const value = record.leverage;
    return isPhotoLeverage(value) ? value : "none";
  } catch {
    return "none";
  }
}

/** Serialise for storage. The only writer of the blob's shape. */
export function serialisePhotoLeverage(leverage: PhotoLeverage): string {
  return JSON.stringify({ v: PHOTO_LEVERAGE_BLOB_VERSION, leverage });
}

/**
 * MONOTONE and idempotent: `none < master < master-bonus`. A later, worse roll never
 * downgrades a proof already obtained — load-bearing rather than cautious, because Belliard
 * is level 1 and always unlocked, so replaying it (and declining the set-piece) is the NORMAL
 * case, not an edge case.
 */
export function mergePhotoLeverage(a: PhotoLeverage, b: PhotoLeverage): PhotoLeverage {
  return RANK[a] >= RANK[b] ? a : b;
}

/**
 * The tier lookup, and the ONLY place a leverage value becomes a number. Absent tiers ⇒ 1.0,
 * `"none"` ⇒ 1.0 — so an encounter that authors no tiers is byte-identical at every leverage
 * value. NEVER a module constant: `shieldedLullSeconds` is shared by Belliard and the Niveau
 * Final, and a multiplier on that table would compress the boss of the very level the player
 * just photographed (the D-F trap, E-4f).
 */
export function photoRewardMultiplier(
  tiers: PhotoLeverageTiers | undefined,
  leverage: PhotoLeverage,
): number {
  if (tiers === undefined) return 1.0;
  switch (leverage) {
    case "master":
      return tiers.master;
    case "master-bonus":
      return tiers.masterBonus;
    case "none":
      return 1.0;
  }
}
