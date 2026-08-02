/**
 * The photo set-piece's cross-level carry value (ADR-0080), alone in its own module so the
 * boss types can depend on it without pulling the whole photo vocabulary in.
 *
 * Type-only, zero runtime. The ALGEBRA (parse / merge / multiplier lookup) lives in
 * `@game/systems/photoLeverageSystem`; the storage I/O lives in `@game/../hooks`.
 */

/**
 * What the roll bought, as it crosses a level boundary (ADR-0080). Three values today
 * (design gate R2-4); the persisted blob is an OBJECT so the deferred `PARIS-MINUIT` UNE
 * variant (E-5 / F-2) adds a `hasPlaque` FIELD rather than forcing a migration.
 *
 * Ordered: `none` < `master` < `master-bonus`. The merge is monotone over that order.
 */
export type PhotoLeverage = "none" | "master" | "master-bonus";

/**
 * Reward tiers, authored on the Niveau Final `bossQteSpec` row ONLY (techplan §4, E-4f).
 * Absent ⇒ ×1.00 at every leverage value ⇒ the encounter is byte-identical. NEVER a module
 * constant: `shieldedLullSeconds` / `telegraphLeadSeconds` are shared by Belliard and the
 * Niveau Final, so a multiplier on the table would hit both encounters (the D-F trap).
 */
export interface PhotoLeverageTiers {
  /** ×0.90 — the roll contains a MASTER frame and nothing else. */
  readonly master: number;
  /** ×0.80 — the roll contains a MASTER frame and at least one BONUS frame. */
  readonly masterBonus: number;
}
