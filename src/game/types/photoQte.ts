import type { NarrativeLine } from "@game/types/narrative";
import type { PhotoLeverage } from "@game/types/photoLeverage";

/**
 * Photo QTE "paparazzi" set-piece — the TYPE seam (techplan §2.1, D-A..D-D).
 *
 * Type-only, zero functions, zero runtime, zero `@game/systems` import. Everything the
 * render lane is allowed to know about the set-piece is declared here; the RULES live in
 * `@game/systems/photoQteSystem` and nowhere else (boundary law, AGENTS.md).
 *
 * Geometry lives on a dedicated 2D scene plate of `100.0 × 56.25` scene units (su), 16:9
 * (spec §0). It never touches world/street coordinates.
 */

/** An axis-aligned box on the plate: centre + size, in scene units. */
export interface Box {
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
}

/** One authored keyframe of the subject track (E-4d). Scene units on the plate. */
export interface SubjectKeyframe {
  /** Seconds of `sceneClock`; strictly increasing across the array (F12(3)). */
  readonly t: number;
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
}

export type PhotoInstantRole = "master" | "bonus";

/**
 * An authored photographable instant — an INTERVAL over the track, never a second box
 * (spec §2.1). The subject box during the instant is whatever `subjectTrack` already holds
 * on that segment: one source, no duplicate.
 */
export interface PhotoInstant {
  /** Stable ASCII id, e.g. `"ARRIVEE" | "ECHANGE" | "PLAQUE"`. */
  readonly id: string;
  readonly role: PhotoInstantRole;
  /** Strictly < `openAt` (F2), by at least `TELEGRAPH_LEAD_FLOOR`. */
  readonly tellAt: number;
  readonly openAt: number;
  readonly closeAt: number;
}

/**
 * Periodic sound cover, authored as a GENERATOR rather than a window list — one source of
 * truth for the cadence (spec §4.1). `WAVE_PERIOD` is a wave INTERVAL, not a light cycle:
 * the 42 s junction cycle is fiction and must never appear as a value (ruling R3-1).
 */
export interface CoverWindows {
  readonly firstOpenAt: number;
  readonly periodSeconds: number;
  readonly coverSeconds: number;
  readonly tellSeconds: number;
}

/**
 * The set-piece's art ids. IDS ONLY — no paths, no sizes: the manifest owns those
 * (`assetManifest.ts`, lane C), and `src/game` never learns a file layout.
 */
export interface PhotoPlate {
  /** Id of the authored backdrop plate for this set-piece. */
  readonly plateId: string;
  /** Ids of the key-pose sprites, in authored order. */
  readonly poseIds: readonly string[];
}

/**
 * Authored per set-piece (`LevelConfig.photoQte`). Absent ⇒ no set-piece and the level is
 * tick-identical to `main` (the additive-and-optional law of `bossQteSpec` / `lootSpec`).
 */
export interface PhotoQteSpec {
  /** Level-clock seconds at which the set-piece opens (Belliard: 2.5 s, pinned by F15). */
  readonly triggerAtElapsedSeconds: number;
  readonly sceneDuration: number;
  readonly filmCount: number;
  /** Integer. Same seed + same inputs ⇒ byte-identical scene (AC10, F11). */
  readonly swaySeed: number;
  readonly briefingMaxSeconds: number;
  readonly briefingLines: readonly NarrativeLine[];
  readonly cover: CoverWindows;
  /** Sorted, total on `[0, sceneDuration]`, first/last exactly on the bounds (F12(3)). */
  readonly subjectTrack: readonly SubjectKeyframe[];
  /** Exactly one entry with `role === "master"` (asserted at construction). */
  readonly instants: readonly PhotoInstant[];
  readonly plate: PhotoPlate;
}

export type PhotoQtePhase =
  | "BRIEFING"
  | "ESTABLISHING"
  | "ACTIVE"
  | "SPOTTED"
  | "ROLL_END"
  | "SCENE_END"
  | "DEVELOPING"
  | "CONTACT_SHEET"
  | "DONE"
  | "EXITED";

export type PhotoPosture = "LOWERED" | "RAISED";

export type PhotoRejectReason =
  | "no-subject"
  | "out-of-frame"
  | "too-wide"
  | "too-tight"
  | "blurred";

export type PhotoVerdict = "MASTER" | "BONUS" | "REJECTED";

/** The three live states of the AF brackets (spec §2.3, T-1). Mechanical, never semantic. */
export type PhotoBracket = "dashed" | "solid" | "locked";

/**
 * One exposed frame. `instantId` is the CANDIDATE instant (T2) — never surfaced live, only
 * stamped on the contact sheet (D8).
 */
export interface PhotoFrameRecord {
  /** 1-based, shot order. */
  readonly ordinal: number;
  readonly verdict: PhotoVerdict;
  readonly instantId: string | null;
  /** Non-null iff `verdict === "REJECTED"`. */
  readonly rejectReason: PhotoRejectReason | null;
  /** For the sheet's diagnostic only — never a verdict input. */
  readonly inCover: boolean;
}

/**
 * The MECHANICAL read (E-4b). Nothing here can express a verdict — by design: composition
 * and focus are properties of the TOOL and are shown live; the moment and the role are
 * properties of the EVIDENCE and are withheld until the contact sheet (spec §2.4).
 */
export interface PhotoComposition {
  /** T3 — the subject box is inside the viewfinder with `FRAME_MARGIN` clear. */
  readonly contained: boolean;
  /** T4's live ratio `max(B.w/V.w, B.h/V.h)`. */
  readonly fill: number;
  /** T4 — `fill ∈ [FILL_MIN, FILL_MAX]`. */
  readonly fillValid: boolean;
  /** T5's accumulator: continuous seconds of T3 ∧ T4, reset to 0 on any break. */
  readonly focusHeldSeconds: number;
  readonly bracket: PhotoBracket;
}

export interface PhotoQte {
  readonly phase: PhotoQtePhase;
  readonly posture: PhotoPosture;
  /** BRIEFING cap / ESTABLISHING / DEVELOPING countdown. */
  readonly phaseRemaining: number;
  /** The ONLY cadence input. Frozen at 0 before `ACTIVE`. */
  readonly sceneClock: number;
  readonly raisedElapsed: number;
  /** Sway path identity, hashed with `swaySeed`; incremented on every raise. */
  readonly raiseIndex: number;
  /** Millimetres. RETAINED across posture changes (D1.a). */
  readonly focal: number;
  /** Always clamped fully inside the plate. */
  readonly viewfinder: Box;
  /** D-C: evaluated ONCE per tick, here. The brackets read THIS value. */
  readonly subjectBox: Box;
  readonly composition: PhotoComposition;
  readonly film: number;
  readonly suspicion: number;
  readonly frames: readonly PhotoFrameRecord[];
  /**
   * 0-based entry stamp, set by `createPhotoQte(spec, attemptIndex)` and NEVER touched by
   * the tick (techplan Rev.5 T-2). The mission-scoped AUTHORITY is
   * `GameState.photoQteAttempts`; this is only its snapshot, so `tickPhotoQte` and
   * `photoSheetView` stay total functions of their existing arguments and no `GameState`
   * ever enters `photoQteSystem`. Derived reads: `BRIEFING` is entered iff
   * `attemptIndex === 0`; `retryOffered = attemptIndex + 1 < PHOTO_MAX_ATTEMPTS`.
   * The budget is a MODULE constant (`PHOTO_MAX_ATTEMPTS = 2`), never an authored field —
   * one gated value, one source of truth against D-1.
   */
  readonly attemptIndex: number;
  /** Derived at `DEVELOPING`, frozen from then on. */
  readonly outcome: PhotoLeverage;
  /** Carried so the tick needs no second argument. */
  readonly spec: PhotoQteSpec;
}

/**
 * Device-neutral input (D-B). Assembled in the bridge (`src/hooks`); `src/game` sees ONLY
 * this and contains zero knowledge of Space, taps, wheels or pinches.
 */
export interface PhotoInput {
  /** Desktop: normalised pointer 0..1 used as a rate-limited TARGET (D-I). Mobile: null. */
  readonly aim: { readonly x: number; readonly y: number } | null;
  /** Mobile: this frame's viewfinder pan delta, normalised. Desktop: 0. */
  readonly panDx: number;
  readonly panDy: number;
  /** Signed focal input this frame (wheel notches / pinch delta), device-normalised. */
  readonly focalDelta: number;
  /** Consumed EDGE, one per press — never a level. */
  readonly shutter: boolean;
  /** D-B: the single posture intent. Desktop = Space held; mobile = the toggle latch. */
  readonly raiseIntent: boolean;
  readonly skipBriefing: boolean;
  readonly cta: PhotoCta | null;
  readonly reducedMotion: boolean;
}

/** The contact-sheet controls, by ROLE (the shipped strings are the render lane's, C-3). */
export type PhotoCta = "continue" | "retry" | "decline";

/**
 * What the render may draw while the scene is live (D-D). It has NO field able to express a
 * verdict, an instant or a role — the two-beat feedback (D8) is therefore a TYPE-level
 * guarantee: a render lane cannot leak the secret because the secret is not in scope.
 */
export interface PhotoSceneView {
  readonly phase: PhotoQtePhase;
  readonly posture: PhotoPosture;
  readonly viewfinder: Box;
  readonly subjectBox: Box;
  readonly bracket: PhotoBracket;
  readonly focalMm: number;
  readonly film: number;
  readonly suspicion: number;
  /** The ONLY projection of the cover state: the packet's headlights (D-J / R3-2). */
  readonly headlightsLit: boolean;
  readonly plate: PhotoPlate;
}

/**
 * The verdict surface (D-D). `photoSheetView` returns `null` unless the phase is
 * `CONTACT_SHEET` or `DONE`, so no semantic bit can reach the render one beat early.
 */
export interface PhotoSheetView {
  readonly frames: readonly PhotoFrameRecord[];
  readonly outcome: PhotoLeverage;
  /** The leaving control's role: `continue` with a MASTER frame, `decline` without. */
  readonly leavingCta: Extract<PhotoCta, "continue" | "decline">;
  /** `retry` is offered iff the mission-scoped attempt budget has room (spec §1.3.a). */
  readonly retryOffered: boolean;
}
