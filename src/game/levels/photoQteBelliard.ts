import type { PhotoQteSpec } from "@game/types/photoQte";

/**
 * The authored data of set-piece #1 — the passage mouth, rue Belliard, seen from the roof
 * lucarne (spec-photo-qte-paparazzi Rev.5 §2.5 / §4.1 / §4.2 / §8).
 *
 * Every number here is the DESIGN's, transcribed and never invented. It lives in its own
 * module rather than inline in `levels.data.ts` because it is a 9-keyframe table plus three
 * instants plus a cover generator — and because the floor tests mutate COPIES of it, so it
 * has to be importable on its own.
 *
 * Read `createPhotoQte`: every value below is re-asserted against floors F1–F14 at
 * construction. Nothing here is trusted.
 */
export const BELLIARD_PHOTO_QTE: PhotoQteSpec = {
  // Pinned by F15 (`12 − 2.5 = 9.5 s ≥ 8.0` of played separation from the hostage duel),
  // not by taste — authored window [2.0, 3.0] (spec §1.3.a decision 5).
  triggerAtElapsedSeconds: 2.5,
  sceneDuration: 60.0,
  // F6: `≥ instantCount + 2` and `≤ 8` (no contact-sheet pagination) — 3 + 3 spare.
  filmCount: 6,
  // Pinned at stage-5 verify per the ADR-0034 K-5 discipline; any integer is legal to the
  // floors, and AC10 is what qualifies THIS one.
  swaySeed: 19980215,
  // Rev.5: 15.0 (was 25.0) — the briefing is the fattest block of frozen time in attempt 1.
  briefingMaxSeconds: 15.0,
  // PLACEHOLDER COPY — `narrative-designer` owns the shipped strings (hand-off F-1, scene
  // id `belliard_photo_pre`). The machine only needs the shape; swapping the text moves no
  // floor, since F13/F14 count `briefingMaxSeconds`, never the line count.
  briefingLines: [
    {
      speaker: "DISPATCH",
      text: "La lucarne en haut de la rue. Tu montes, tu attends, tu ne descends pas avant d'avoir la photo.",
    },
    {
      speaker: "MUF",
      text: "Six poses. Et une bagnole qui recule dans le passage.",
    },
  ],
  // Traffic waves released by the carrefour (spec §4.1). `periodSeconds` is a WAVE INTERVAL,
  // never a light cycle: the 42 s junction cycle is fiction and must never appear as a value
  // (ruling R3-1). Windows: [10,17] [31,38] [52,59]; approach tells from 8.2 / 29.2 / 50.2.
  cover: {
    firstOpenAt: 10.0,
    periodSeconds: 21.0,
    coverSeconds: 7.0,
    tellSeconds: 1.8,
  },
  // The 9 keyframes of §2.5, linearly interpolated on all four components. Piecewise-constant
  // except during a telegraph (F12(2)): all transit lives inside `[tellAt, openAt]`.
  subjectTrack: [
    { t: 0.0, cx: 65.0, cy: 12.75, w: 6.0, h: 13.5 }, // K0 — the Commandant alone
    { t: 9.2, cx: 65.0, cy: 12.75, w: 6.0, h: 13.5 }, // K1 — tell #1 fires
    { t: 11.0, cx: 54.0, cy: 12.75, w: 24.0, h: 13.5 }, // K2 — ARRIVEE opens
    { t: 34.7, cx: 54.0, cy: 12.75, w: 24.0, h: 13.5 }, // K3 — hold pose, tell #2 fires
    { t: 36.5, cx: 54.0, cy: 14.72, w: 17.0, h: 9.56 }, // K4 — ECHANGE opens
    { t: 51.2, cx: 54.0, cy: 14.72, w: 17.0, h: 9.56 }, // K5 — hold pose, tell #3 fires
    { t: 53.0, cx: 62.0, cy: 9.0, w: 7.5, h: 4.22 }, // K6 — PLAQUE opens
    { t: 55.9, cx: 71.0, cy: 9.0, w: 7.5, h: 4.22 }, // K7 — PLAQUE closes (3.103 su/s)
    { t: 60.0, cx: 83.7, cy: 9.0, w: 7.5, h: 4.22 }, // K8 — SCENE_END
  ],
  // The triptych of §4.2. `TELEGRAPH_LEAD_PHOTO = 1.8 s` on all three.
  instants: [
    { id: "ARRIVEE", role: "bonus", tellAt: 9.2, openAt: 11.0, closeAt: 15.5 },
    { id: "ECHANGE", role: "master", tellAt: 34.7, openAt: 36.5, closeAt: 40.3 },
    { id: "PLAQUE", role: "bonus", tellAt: 51.2, openAt: 53.0, closeAt: 55.9 },
  ],
  // Art IDS only — the manifest owns every path and size (lane C).
  plate: {
    plateId: "belliard-passage-plate",
    poseIds: ["pose-arrivee", "pose-echange", "pose-plaque"],
  },
};
