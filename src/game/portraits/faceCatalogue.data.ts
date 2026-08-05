import type { FaceCatalogue, PortraitBandId, VariantDistance } from "@game/types/portraitRobot";
import { PORTRAIT_ASSET_DIR } from "@game/types/portraitRobot";

/**
 * The authored portrait catalogue (ADR-0080 D1) — one gabarit, four bands, 24 variants.
 *
 * Pure and import-time-computable: no I/O, no clock, no randomness. It mirrors
 * `src/game/levels/levels.data.ts` and, like it, is data a tool can read and one day
 * write. `validatePortrait` (which imports NO catalogue) is the single source of its
 * invariants.
 *
 * ---
 *
 * ## ⚠ PROVISIONAL DISTANCE MATRIX — `game-graphist`'s comparison plate is not in yet
 *
 * The 60 pairwise distances below are **placeholders**, committed on purpose so that
 * `decoy-profile` and `seed-sweep` are exercised from day one rather than idling the
 * lane (hand-off §3.3 step 1, ADR-0080 C2). They are laid out on a deliberate, readable
 * pattern — the `strong` pairs form a 6-cycle (`0-1-2-3-4-5-0`) and every other pair is
 * `medium` — so that **every** variant's row is exactly 2 strong + 3 medium + 0 fine,
 * i.e. every variant is an eligible truth.
 *
 * That uniformity is exactly what makes them provisional: a real matrix, read off the
 * comparison plate (`lead-art` §7.2), will NOT be uniform, and the difficulty curve of
 * the scene is the difference. **Replacing these 60 values is a data edit, no code
 * moves** — which is the whole point of the matrix being data (ADR-0080 D2).
 *
 * The `trait` strings are likewise provisional: they are the witness's words, one short
 * sentence, never pixel coordinates and never a hint of correctness (gate A5's rule of
 * the named trait). Final copy belongs with `narrative-designer` and to the plate the
 * traits describe.
 *
 * `plateChecksum` is a placeholder until `scripts/slice-portrait-plate.mjs` emits the
 * real one; `validatePortrait` reports `plate-missing` (warning) while the generated
 * manifest is absent and `plate-provenance` (error) the moment the two disagree.
 */

/** The provisional 6-cycle matrix — see the module note. One copy, four bands. */
const PROVISIONAL_DISTANCES: Readonly<Record<string, VariantDistance>> = {
  "0:1": "strong",
  "0:2": "medium",
  "0:3": "medium",
  "0:4": "medium",
  "0:5": "strong",
  "1:2": "strong",
  "1:3": "medium",
  "1:4": "medium",
  "1:5": "medium",
  "2:3": "strong",
  "2:4": "medium",
  "2:5": "medium",
  "3:4": "strong",
  "3:5": "medium",
  "4:5": "strong",
};

/** Canonical player-facing labels — the narrative's words, everywhere (gate A6). */
const BAND_LABELS: Readonly<Record<PortraitBandId, string>> = {
  hair: "LA COUPE",
  eyes: "LE REGARD",
  nose: "LE NEZ",
  mouth: "LA BOUCHE",
};

/** Six named traits per band, in authoring order. Provisional — see the module note. */
const BAND_TRAITS: Readonly<Record<PortraitBandId, readonly string[]>> = {
  hair: [
    "Rasé sur les côtés, plat dessus.",
    "Mèche qui tombe sur un œil.",
    "Cheveux tirés en arrière.",
    "Boule frisée, haute.",
    "Coupe au bol, franche.",
    "Crâne dégarni sur le devant.",
  ],
  eyes: [
    "Yeux très rapprochés.",
    "Paupières lourdes, mi-closes.",
    "Sourcils épais qui se rejoignent.",
    "Regard écarquillé, fixe.",
    "Un œil plus fermé que l'autre.",
    "Sourcils hauts et fins.",
  ],
  nose: [
    "Nez cassé, dévié à gauche.",
    "Nez long et droit.",
    "Nez court, retroussé.",
    "Narines larges, base épaisse.",
    "Arête marquée, bosse au milieu.",
    "Nez fin, presque pointu.",
  ],
  mouth: [
    "Lèvres pincées, presque une ligne.",
    "Lèvre inférieure épaisse.",
    "Bouche large, coins tombants.",
    "Petite bouche, coins relevés.",
    "Moustache fine au-dessus.",
    "Menton fendu sous la lèvre.",
  ],
};

function band(id: PortraitBandId) {
  const traits = BAND_TRAITS[id];
  return {
    id,
    label: BAND_LABELS[id],
    variants: traits.map((trait, i) => {
      const ordinal = String(i + 1).padStart(2, "0");
      return {
        id: `${id}-${ordinal}`,
        asset: `${PORTRAIT_ASSET_DIR}/${id}-${ordinal}.png`,
        trait,
      };
    }),
    distances: PROVISIONAL_DISTANCES,
  };
}

export const FACE_CATALOGUE: FaceCatalogue = {
  gabaritId: "gabarit-01",
  plateChecksum: "PROVISIONAL-NO-PLATE-YET",
  bands: [band("hair"), band("eyes"), band("nose"), band("mouth")],
};
