/**
 * PORTRAIT-ROBOT — the screen's canonical strings, transcribed verbatim.
 *
 * The render lane authors NO copy (ADR-0081 D4). Every string below is copied
 * character-for-character out of `docs/game-design/spec-portrait-robot-fiction.md`
 * (round 3), which is the only place they may be changed. The section reference
 * sits beside each one so a reviewer can diff them against the spec without
 * guessing which round they came from.
 *
 * What is deliberately NOT here: the verdict dialogue (KENZA / DISPATCH / MUF
 * lines of §4.7-§4.9) and the next-level beats (§5.3). Those are `NarrativeScene`
 * material and belong to `narrativeSystem.ts` (game lane) — a `NarrativeScreen`
 * plays them, this screen never does.
 *
 * Two prohibitions this file exists to keep visible:
 * - **No number ever reaches the gauge** (gate A6/A13). `TÉLÉCARTE` is a bare
 *   label; `TÉLÉCARTE · {n} UNITÉS` is dead and no separator may follow the word.
 * - **No validation vocabulary** (gate B1, fiction §6/§4.11). No `VALIDER`,
 *   `TERMINER`, `ENVOYER`, `IMPRIMER`, no verb in the 2nd person, anywhere.
 */
import type { PortraitBandId, PortraitOutcome, PortraitPalier } from "@game/types/portraitRobot";

/** Screen masthead (fiction §4.1). Never « PORTRAIT-ROBOT » — that is the internal name (§6). */
export const SCREEN_TITLE = "TÊTE À CONNAÎTRE";

/**
 * Zine rubric under the target portrait (fiction §4.1), with the authored narrow-slot
 * fallback (§4.12). The mobile column is 28 % of 844px — the full rubric ellipsises
 * there, and an ellipsis is not a fallback, it is a truncation that reads as a bug.
 */
export const SUPERTITLE = "UNDERGROUND PARIS · PAGE 23";
export const SUPERTITLE_SHORT = "PAGE 23";

/**
 * Gauge label (fiction §4.5) — the word alone, 9 chars, no separator, no value.
 * ADR-0081 D4 told the render lane to ship the gauge unlabelled until the
 * narrative lane delivered a number-free label; round 2 delivered this one.
 */
export const GAUGE_LABEL = "TÉLÉCARTE";

/** Alt text of the reference portrait — « la page 23 », never « dossier suspect » (fiction §6.1). */
export const TARGET_ALT = "La page 23 — la tête à reconnaître";

/** Per-band variant counter (fiction §4.4). State legibility, never a correctness cue (gate A8/A16). */
export function variantCounter(ordinal: number, total: number): string {
  return `${String(ordinal)} sur ${String(total)}`;
}

/**
 * The three chrono paliers, spoken by KENZA (fiction §4.5). Read off
 * `scene.palier`, which changes exactly once per crossing (ADR-0079 D9) — so the
 * `aria-live` region announces once per palier and never once per frame.
 * `NONE` announces nothing at all.
 */
export const PALIER_LINE: Readonly<Record<PortraitPalier, string>> = {
  NONE: "",
  MID: "Ma carte descend.",
  URGENT: "Grouille, il me reste rien.",
  LAST: "bip",
};

/**
 * Qualitative `aria-valuetext` for the gauge (UX §5.5 point 3) — never a number of
 * seconds, on any channel.
 *
 * UX §5.5 authored THREE qualitative steps against the three paliers it knew;
 * gate A18 then added a fourth palier (`MID`, the mid-course cue). `MID` and
 * `URGENT` therefore share « ça presse » rather than have the render lane invent a
 * fourth string — flagged to `ux-designer` rather than papered over.
 */
export const PALIER_VALUETEXT: Readonly<Record<PortraitPalier, string>> = {
  NONE: "temps confortable",
  MID: "ça presse",
  URGENT: "ça presse",
  LAST: "dernières secondes",
};

/**
 * The lock-in line (fiction §4.6), played AT the freeze, ≤ 16 chars so it is read
 * inside `revealSeconds` at `IDENTIFIED` (1,4 s). Never replayed at
 * `PARTIAL`/`FAILED` — there is no lock-in without 4/4.
 */
export const LOCK_LINE = "Là. Bouge plus.";

/** The three verdict stamps (fiction §4.7/§4.8/§4.9). Three distinct lengths, on purpose. */
export const OUTCOME_STAMP: Readonly<Record<PortraitOutcome, string>> = {
  IDENTIFIED: "C'EST LUI",
  PARTIAL: "PRESQUE LUI",
  FAILED: "TIRÉ QUAND MÊME",
};

/**
 * Early exit (fiction §6.2) — device-forked because the mobile HUD strip caps the
 * label at 8 chars (UX §2.8.1). The subject of every string is the PAGE, never the
 * player: it can neither congratulate nor scold, which is the whole point (§6.2).
 */
export const EXIT_LABEL: Readonly<Record<"desktop" | "mobile", string>> = {
  desktop: "ÇA PART COMME ÇA",
  mobile: "ÇA PART",
};

/** Armed state of the same target (fiction §6.2 variante B). A statement, not a question. */
export const EXIT_ARMED_LABEL: Readonly<Record<"desktop" | "mobile", string>> = {
  desktop: "ENCORE UN COUP",
  mobile: "ENCORE",
};

/**
 * Full `aria-label` of the exit target, independent of the visible label's length
 * (UX §2.8.5). Says what the control does — it resolves the scene at the current
 * board — without a 2nd-person verb.
 */
export const EXIT_ARIA_LABEL = "La page part avec les quatre bandes en l'état — termine la scène";

/** Announced once when the pointer path arms the exit (UX §2.8.5). */
export const EXIT_ARMED_ANNOUNCE = "Encore un appui et ça part.";

/** Chevron labels (UX §5.4). The band's canonical label comes from the catalogue, never from here. */
export function chevronLabel(direction: -1 | 1, bandLabel: string): string {
  return `${direction === -1 ? "Variante précédente" : "Variante suivante"} — ${bandLabel}`;
}

/** Band group label (UX §5.4): `{Nom de bande}, variante {n} sur {total}`. */
export function bandGroupLabel(bandLabel: string, ordinal: number, total: number): string {
  return `${bandLabel}, variante ${variantCounter(ordinal, total)}`;
}

/**
 * Internal band ids never reach the screen (ADR-0081 D4) — this map exists only so
 * a `data-band` attribute can carry one for the gesture hook and the e2e tests.
 */
export const BAND_TEST_ID: Readonly<Record<PortraitBandId, string>> = {
  hair: "hair",
  eyes: "eyes",
  nose: "nose",
  mouth: "mouth",
};
