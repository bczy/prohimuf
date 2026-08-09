import type { FaceCatalogue, PortraitBandId, VariantDistance } from "@game/types/portraitRobot";
import { PORTRAIT_ASSET_DIR } from "@game/types/portraitRobot";

/**
 * The authored portrait catalogue (ADR-0080 D1) — one gabarit, four bands, 40 variants
 * (10 per band since 2026-08-09; it was 24, see `VARIANTS_PER_BAND`).
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
 * The 180 pairwise distances below (45 per band, one shared copy) are **placeholders**,
 * committed on purpose so that
 * `decoy-profile` and `seed-sweep` are exercised from day one rather than idling the
 * lane (hand-off §3.3 step 1, ADR-0080 C2). They are laid out on a deliberate, readable
 * pattern — the `strong` pairs form a 10-cycle (`0-1-…-9-0`) and every other pair is
 * `medium` — so that **every** variant's row is exactly 2 strong + 7 medium + 0 fine,
 * i.e. every variant is an eligible truth.
 *
 * That uniformity is exactly what makes them provisional: a real matrix, read off the
 * comparison plate (`lead-art` §7.2), will NOT be uniform, and the difficulty curve of
 * the scene is the difference. **Replacing these 45 values is a data edit, no code
 * moves** — which is the whole point of the matrix being data (ADR-0080 D2).
 *
 * The `trait` strings are likewise provisional: they are the witness's words, one short
 * sentence, never pixel coordinates and never a hint of correctness (gate A5's rule of
 * the named trait). Final copy belongs with `narrative-designer` and to the plate the
 * traits describe.
 *
 * `plateChecksum` is no longer a placeholder — see the field's own comment. It MATCHES
 * `portraitPlate.generated.json`; it moves with each real slicing run.
 * `validatePortrait` reports `plate-missing` (warning) when no manifest is supplied and
 * `plate-provenance` (error) the moment the two disagree.
 */

/**
 * The provisional 10-CYCLE matrix — see the module note. One copy, four bands.
 *
 * The `strong` pairs form a 10-cycle (`0-1-2-…-9-0`) and every other pair is `medium`, so
 * every variant's row is exactly 2 strong + 7 medium + 0 fine, i.e. every variant is an
 * eligible truth. Same construction as the 6-cycle it replaces, extended to the new count.
 * 45 pairs instead of 15.
 */
const PROVISIONAL_DISTANCES: Readonly<Record<string, VariantDistance>> = {
  "0:1": "strong",
  "0:2": "medium",
  "0:3": "medium",
  "0:4": "medium",
  "0:5": "medium",
  "0:6": "medium",
  "0:7": "medium",
  "0:8": "medium",
  "0:9": "strong",
  "1:2": "strong",
  "1:3": "medium",
  "1:4": "medium",
  "1:5": "medium",
  "1:6": "medium",
  "1:7": "medium",
  "1:8": "medium",
  "1:9": "medium",
  "2:3": "strong",
  "2:4": "medium",
  "2:5": "medium",
  "2:6": "medium",
  "2:7": "medium",
  "2:8": "medium",
  "2:9": "medium",
  "3:4": "strong",
  "3:5": "medium",
  "3:6": "medium",
  "3:7": "medium",
  "3:8": "medium",
  "3:9": "medium",
  "4:5": "strong",
  "4:6": "medium",
  "4:7": "medium",
  "4:8": "medium",
  "4:9": "medium",
  "5:6": "strong",
  "5:7": "medium",
  "5:8": "medium",
  "5:9": "medium",
  "6:7": "strong",
  "6:8": "medium",
  "6:9": "medium",
  "7:8": "strong",
  "7:9": "medium",
  "8:9": "strong",
};

/** Canonical player-facing labels — the narrative's words, everywhere (gate A6). */
const BAND_LABELS: Readonly<Record<PortraitBandId, string>> = {
  hair: "LA COUPE",
  eyes: "LE REGARD",
  nose: "LE NEZ",
  mouth: "LA BOUCHE",
};

/** TEN named traits per band, in authoring order. Provisional — see the module note:
 * they were written for imaginary faces and do NOT describe the shipped images. */
const BAND_TRAITS: Readonly<Record<PortraitBandId, readonly string[]>> = {
  hair: [
    "Rasé sur les côtés, plat dessus.",
    "Mèche qui tombe sur un œil.",
    "Cheveux tirés en arrière.",
    "Boule frisée, haute.",
    "Coupe au bol, franche.",
    "Crâne dégarni sur le devant.",
    "Cheveux plaqués, raie sur le côté.",
    "Nuque longue, dessus court.",
    "Crâne rasé de près.",
    "Mèches folles qui dépassent.",
  ],
  eyes: [
    "Yeux très rapprochés.",
    "Paupières lourdes, mi-closes.",
    "Sourcils épais qui se rejoignent.",
    "Regard écarquillé, fixe.",
    "Un œil plus fermé que l'autre.",
    "Sourcils hauts et fins.",
    "Cernes marqués sous les yeux.",
    "Yeux enfoncés, très écartés.",
    "Sourcils droits, presque horizontaux.",
    "Regard baissé, paupières tombantes.",
  ],
  nose: [
    "Nez cassé, dévié à gauche.",
    "Nez long et droit.",
    "Nez court, retroussé.",
    "Narines larges, base épaisse.",
    "Arête marquée, bosse au milieu.",
    "Nez fin, presque pointu.",
    "Nez large à la racine.",
    "Pointe du nez tombante.",
    "Nez busqué, arête haute.",
    "Narines pincées, nez étroit.",
  ],
  mouth: [
    "Lèvres pincées, presque une ligne.",
    "Lèvre inférieure épaisse.",
    "Bouche large, coins tombants.",
    "Petite bouche, coins relevés.",
    "Moustache fine au-dessus.",
    "Menton fendu sous la lèvre.",
    "Lèvres serrées, mâchoire crispée.",
    "Bouche entrouverte, dents visibles.",
    "Coins de bouche creusés.",
    "Menton large sous une bouche fine.",
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
  // The checksum of the slicing run these 24 paths come from. AUTHORED, deliberately not
  // derived from `portraitPlate.generated.json`: deriving it would make `plate-provenance`
  // vacuous — the check exists to catch a catalogue that no longer matches the plate.
  // It moves with every real slicing run.
  //
  // The checksum of the ONE base plate every band is derived from (gate A19).
  //
  // A19 requires a band's variants to be the same FACE. Generation cannot do it: img2img
  // is silently ignored on this tier, and at constant seed a changed descriptor produces a
  // byte-for-byte identical image (both measured, see the gate). So the variants are
  // SYNTHESISED from one hand-registered, background-stripped plate — a feature moved or
  // resized inside its band, which is what a real photofit kit does.
  //
  // The load-bearing detail: every warp is multiplied by an envelope that is ZERO at the
  // band's top and bottom edges, and sampling reads the WHOLE plate rather than the band.
  // So a vertical shift pulls content from the neighbouring band — the same face — instead
  // of leaving a hole, and the seams stay pixel-exact. Warping without that envelope would
  // have thrown away the one thing the manual registration bought.
  //
  // Variant 01 of every band is the UNWARPED face, so the intact portrait is always a
  // reachable answer rather than an interpolation.
  plateChecksum: "sha256:e3b6c2cb9c106e28b4b0ebae66de78c3fe6cf166282e95ad8d3ede64cbada0e2",
  bands: [band("hair"), band("eyes"), band("nose"), band("mouth")],
};
