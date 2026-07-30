/**
 * Run-stats display copy — THE single token → accented-label lookup of the render
 * lane (ADR-0076 D5, gate Q7/R5: "one vocabulary, on screen and in the export").
 *
 * The pure layer holds the vocabulary as ASCII-folded uppercase tokens (`SANTE`,
 * `NON_DECLENCHEE`, …) so the exported blob survives any paste target; the accents
 * are typography and live HERE, in one place. Same five words on both sides — no
 * synonym, no second lookup anywhere in `src/render`.
 *
 * Copy is NEUTRAL and out-of-fiction (gate Q7): this is diagnostic text, read the
 * same way on screen and in a Discord paste. No outcome praise, no "sans faute", no
 * colour-coding — the value `0` on DÉGÂTS reads exactly like any other (spec D5.1).
 *
 * Formatting only: the render carries NO rounding rule, no `—`-vs-`0` decision and
 * no cause precedence (ADR-0076 D6). `null` arrives already decided by
 * `buildRunSummary`; these helpers only paint it.
 */
import type {
  DeliverySummary,
  EndCause,
  HeartsLostSummary,
  PickupsSummary,
} from "@game/types/runStats";

/** What an absent (`null`) value prints — never `0`, never `0/0` (spec §2.1.3). */
const ABSENT = "—";

/** Heart glyph used by the damage readouts (spec D3.1 line 3). */
const HEART = "♥";

/** The five end-of-run causes (spec D2.6.1). */
export const END_CAUSE_LABELS: Readonly<Record<EndCause, string>> = {
  SANTE: "SANTÉ",
  TEMPS: "TEMPS",
  QUOTA: "QUOTA",
  BOSS_GAGNE: "BOSS GAGNÉ",
  BOSS_PERDU: "BOSS PERDU",
};

/** The delivery issues (spec D2.2.3); the fifth value, "no delivery", is `ABSENT`. */
const DELIVERY_ISSUE_LABELS: Readonly<Record<DeliverySummary["issue"], string>> = {
  REUSSIE: "RÉUSSIE",
  PERDUE: "PERDUE",
  INTERROMPUE: "INTERROMPUE",
  NON_DECLENCHEE: "NON DÉCLENCHÉE",
};

/** Headline row (§1.2 of the UX spec) — exactly three, in reading order. */
export const HEADLINE_LABELS = {
  score: "SCORE FINAL",
  delivery: "LIVRAISON",
  damage: "DÉGÂTS",
} as const;

/** Detail panel line labels, in the imposed order of spec D3.1. */
export const DETAIL_LABELS = {
  pickups: "RÉCUPÉRER — Caisses",
  delivery: "LIVRER — Livraison",
  damage: "ÉVITER — Dégâts",
  duration: "Durée de jeu",
  score: "Score final",
  endCause: "Fin de run",
  wave: "Vague",
} as const;

/** The duration line's explicit note (spec D2.4.3 — asked for verbatim). */
export const DURATION_NOTE = "temps de jeu effectif (hors pause et cinématiques)";

/** French decimal comma — typography, not a rounding rule (the value arrives rounded). */
function fr(value: number): string {
  return String(value).replace(".", ",");
}

/** `SCORE FINAL` — the integer exactly as the game holds it, sign included. */
export function formatScore(score: number): string {
  return String(score);
}

/** `LIVRAISON` — issue label plus its integrity when the issue carries one. */
export function formatDelivery(delivery: DeliverySummary | null): string {
  if (delivery === null) return ABSENT;
  const label = DELIVERY_ISSUE_LABELS[delivery.issue];
  return delivery.integrityPct === null
    ? label
    : `${label} — intégrité ${String(delivery.integrityPct)} %`;
}

/** `DÉGÂTS` — hearts lost on the quarter-heart lattice (ADR-0066). */
export function formatHeartsLost(hearts: HeartsLostSummary): string {
  return `${fr(hearts.total)} ${HEART}`;
}

/** Detail line 3 — the same value, plus the fault share when there is one. */
export function formatHeartsLostDetail(hearts: HeartsLostSummary): string {
  const base = formatHeartsLost(hearts);
  return hearts.faults > 0 ? `${base} (dont ${fr(hearts.faults)} ${HEART} de fautes)` : base;
}

/** Detail line 1 — `n / m`, or `—` on a level that authors no crates. */
export function formatPickups(pickups: PickupsSummary | null): string {
  return pickups === null ? ABSENT : `${String(pickups.collected)} / ${String(pickups.spawned)}`;
}

/** Detail line 4 — one decimal, seconds (spec D2.4.2). */
export function formatDuration(seconds: number): string {
  return `${fr(seconds)} s`;
}

/** The 0-input subhead (gate R5) — neutral, never colour-coded by outcome. */
export function formatEndCause(cause: EndCause): string {
  return `FIN DE RUN : ${END_CAUSE_LABELS[cause]}`;
}
