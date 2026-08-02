import { describe, expect, it } from "vitest";
import { photoHudChanged } from "@hooks/useGameLoop";
import { BELLIARD_PHOTO_QTE } from "@game/levels/photoQteBelliard";
import { createPhotoQte } from "@game/systems/photoQteSystem";
import type { PhotoQte } from "@game/types/photoQte";

/**
 * The HUD push gate's photo term. The set-piece freezes every OTHER term the gate watches
 * (score, lives, timer, phase, wave, energy, weapon), so without this one the dress never
 * reaches the DOM at all — the bug this term was written for, caught by capture.
 */
const base: PhotoQte = createPhotoQte(BELLIARD_PHOTO_QTE, 0);

describe("photoHudChanged", () => {
  it("pushes on the set-piece opening and on its exit", () => {
    expect(photoHudChanged(null, base)).toBe(true);
    expect(photoHudChanged(base, null)).toBe(true);
    expect(photoHudChanged(null, null)).toBe(false);
  });

  it("does not push when nothing the dress draws moved", () => {
    // The clock, the viewfinder and the sway all advance every frame and are drawn by the
    // SCENE, not by the dress — they must not wake the DOM HUD.
    expect(photoHudChanged(base, { ...base, sceneClock: base.sceneClock + 0.016 })).toBe(false);
  });

  it("pushes on each drawn value: phase, posture, film, bracket, focal, needle", () => {
    expect(photoHudChanged(base, { ...base, phase: "ACTIVE" })).toBe(true);
    expect(photoHudChanged(base, { ...base, posture: "RAISED" })).toBe(true);
    expect(photoHudChanged(base, { ...base, film: base.film - 1 })).toBe(true);
    expect(
      photoHudChanged(base, {
        ...base,
        composition: { ...base.composition, bracket: "locked" },
      }),
    ).toBe(true);
    expect(photoHudChanged(base, { ...base, focal: base.focal + 1 })).toBe(true);
    expect(photoHudChanged(base, { ...base, suspicion: base.suspicion + 1 })).toBe(true);
  });

  it("compares at the DRAWN precision, so a sub-unit drift costs no push", () => {
    expect(photoHudChanged(base, { ...base, focal: base.focal + 0.2 })).toBe(false);
    expect(photoHudChanged(base, { ...base, suspicion: base.suspicion + 0.2 })).toBe(false);
  });
});
