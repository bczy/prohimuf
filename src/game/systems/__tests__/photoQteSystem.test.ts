import { describe, expect, it } from "vitest";
import {
  FILL_MAX,
  FILL_MIN,
  FOCUS_HOLD,
  PHOTO_DEVELOP_SECONDS,
  PHOTO_ESTABLISH_SECONDS,
  PHOTO_MAX_ATTEMPTS,
  SHUTTER_ARM_SECONDS,
  SUSPICION_MAX,
  SUSPICION_SHUTTER_EXPOSED,
  createPhotoQte,
  focalBandOf,
  isPhotoQteActive,
  photoOutcomeOf,
  photoSceneView,
  photoSheetView,
  shouldTriggerPhotoQte,
  subjectBoxAt,
  tickPhotoQte,
} from "@game/systems/photoQteSystem";
import { BELLIARD_PHOTO_QTE } from "@game/levels/photoQteBelliard";
import type { PhotoInput, PhotoQte, PhotoQteSpec } from "@game/types/photoQte";

const SPEC = BELLIARD_PHOTO_QTE;

const NEUTRAL: PhotoInput = {
  aim: null,
  panDx: 0,
  panDy: 0,
  focalDelta: 0,
  shutter: false,
  raiseIntent: false,
  skipBriefing: false,
  cta: null,
  reducedMotion: false,
};

const input = (patch: Partial<PhotoInput> = {}): PhotoInput => ({ ...NEUTRAL, ...patch });

/** Run `n` ticks of `delta`, feeding the same input each time. */
function run(qte: PhotoQte, n: number, delta: number, i: PhotoInput = NEUTRAL): PhotoQte {
  let cur = qte;
  for (let k = 0; k < n; k++) cur = tickPhotoQte(cur, i, delta).qte;
  return cur;
}

/** Fast-forward past BRIEFING + ESTABLISHING into ACTIVE at sceneClock ≈ 0. */
function active(spec: PhotoQteSpec = SPEC, attemptIndex = 0): PhotoQte {
  let qte = createPhotoQte(spec, attemptIndex);
  qte = tickPhotoQte(qte, input({ skipBriefing: true }), 1 / 60).qte;
  qte = run(qte, Math.ceil(PHOTO_ESTABLISH_SECONDS * 60) + 1, 1 / 60);
  expect(qte.phase).toBe("ACTIVE");
  return qte;
}

/**
 * Aim the viewfinder at the subject at scene time `t` and settle the focus hold, by
 * driving the machine the way a player would: point at the box, pick the sweet-spot focal,
 * hold still. Returns a RAISED, armed, focus-locked record.
 */
function framed(qte: PhotoQte, focalMm?: number): PhotoQte {
  const target = focalMm ?? focalBandOf(subjectBoxAt(qte.spec.subjectTrack, qte.sceneClock)).sweet;
  // Track the subject the way a player does: re-aim at the CURRENT box every tick (the
  // track moves during a transit, so a fixed aim is not "framed", it is "framed a moment
  // ago"). Zoom to the sweet spot first, then hold until the focus locks.
  const aimAt = (cur: PhotoQte) => {
    const box = subjectBoxAt(cur.spec.subjectTrack, cur.sceneClock);
    return { x: box.cx / 100, y: box.cy / 56.25 };
  };
  let cur = qte;
  const dir = target > cur.focal ? 1 : -1;
  for (let i = 0; i < 400; i++) {
    cur = tickPhotoQte(
      cur,
      input({ aim: aimAt(cur), raiseIntent: true, focalDelta: dir * 0.6 }),
      1 / 60,
    ).qte;
    if (dir > 0 ? cur.focal >= target : cur.focal <= target) break;
  }
  for (let i = 0; i < 60; i++) {
    cur = tickPhotoQte(cur, input({ aim: aimAt(cur), raiseIntent: true }), 1 / 60).qte;
  }
  return cur;
}

describe("createPhotoQte — floors F1–F14, asserted against authored data", () => {
  it("accepts the shipped Belliard set-piece", () => {
    expect(() => createPhotoQte(SPEC)).not.toThrow();
  });

  it("opens LOWERED, film full, needle at zero, clock frozen at 0", () => {
    const qte = createPhotoQte(SPEC);
    expect(qte.phase).toBe("BRIEFING");
    expect(qte.posture).toBe("LOWERED");
    expect(qte.film).toBe(SPEC.filmCount);
    expect(qte.suspicion).toBe(0);
    expect(qte.sceneClock).toBe(0);
    expect(qte.frames).toEqual([]);
    expect(qte.outcome).toBe("none");
  });

  it("enters BRIEFING iff attemptIndex === 0 — a retry re-enters at ESTABLISHING", () => {
    expect(createPhotoQte(SPEC, 0).phase).toBe("BRIEFING");
    expect(createPhotoQte(SPEC, 1).phase).toBe("ESTABLISHING");
  });

  it("D-1: throws above the mission-scoped attempt budget", () => {
    expect(() => createPhotoQte(SPEC, PHOTO_MAX_ATTEMPTS)).toThrow(/PHOTO_MAX_ATTEMPTS/);
  });

  // A-T11 — one mutated authored fixture per floor, each throwing with a NAMED message.
  const mutate = (patch: Partial<PhotoQteSpec>): PhotoQteSpec => ({ ...SPEC, ...patch });

  it("F1: rejects a pose window under POSE_WINDOW_FLOOR", () => {
    expect(() =>
      createPhotoQte(
        mutate({
          instants: SPEC.instants.map((i) =>
            i.id === "PLAQUE" ? { ...i, closeAt: i.openAt + 1.0 } : i,
          ),
        }),
      ),
    ).toThrow(/F1:/);
  });

  it("F2: rejects an un-telegraphed instant", () => {
    expect(() =>
      createPhotoQte(
        mutate({
          instants: SPEC.instants.map((i) =>
            i.id === "ECHANGE" ? { ...i, tellAt: i.openAt - 0.5 } : i,
          ),
        }),
      ),
    ).toThrow(/F2:/);
  });

  it("F3: rejects an instant with no cover overlap — a zero-suspicion run must exist", () => {
    expect(() =>
      createPhotoQte(
        mutate({
          cover: { ...SPEC.cover, firstOpenAt: 20.0, coverSeconds: 2.0, periodSeconds: 21 },
        }),
      ),
    ).toThrow(/F3:/);
  });

  it("F4: rejects an instant whose legal focal band is too narrow", () => {
    expect(() =>
      createPhotoQte(
        mutate({
          subjectTrack: SPEC.subjectTrack.map((k) =>
            k.t === 36.5 || k.t === 51.2 ? { ...k, w: 90.0, h: 50.63 } : k,
          ),
        }),
      ),
    ).toThrow(/F4:/);
  });

  it("F5a: rejects a sway share above the master ceiling", () => {
    // SHRINK the master's box: `s_eff` scales with the box, so a smaller subject is framed
    // at a longer focal and 2.00 su of tremor crosses the 60 % ceiling.
    expect(() =>
      createPhotoQte(
        mutate({
          subjectTrack: SPEC.subjectTrack.map((k) =>
            k.t === 36.5 || k.t === 51.2 ? { ...k, w: 12.0, h: 6.75 } : k,
          ),
        }),
      ),
    ).toThrow(/F5a:/);
  });

  it("F6: rejects a roll that cannot absorb one mistake, and one that needs pagination", () => {
    expect(() => createPhotoQte(mutate({ filmCount: 4 }))).toThrow(/F6:/);
    expect(() => createPhotoQte(mutate({ filmCount: 9 }))).toThrow(/F6:/);
  });

  it("F12(2): rejects a track that moves before the next tell (the leak)", () => {
    expect(() =>
      createPhotoQte(
        mutate({
          subjectTrack: SPEC.subjectTrack.map((k) => (k.t === 34.7 ? { ...k, cx: 60.0 } : k)),
        }),
      ),
    ).toThrow(/F12\(2\):/);
  });

  it("F12(3): rejects a track that is not total on [0, sceneDuration]", () => {
    expect(() => createPhotoQte(mutate({ subjectTrack: SPEC.subjectTrack.slice(1) }))).toThrow(
      /F12\(3\):/,
    );
    expect(() => createPhotoQte(mutate({ subjectTrack: SPEC.subjectTrack.slice(0, -1) }))).toThrow(
      /F12\(3\):/,
    );
  });

  it("F13: rejects an attempt whose authored frozen time exceeds the budget", () => {
    expect(() => createPhotoQte(mutate({ briefingMaxSeconds: 40.0 }))).toThrow(/F13:|F14:/);
  });

  it("F14: rejects a mission-scoped budget over 155 s", () => {
    expect(() => createPhotoQte(mutate({ sceneDuration: 60, briefingMaxSeconds: 30 }))).toThrow(
      /F14:|F13:/,
    );
  });

  it("rejects a spec with no master instant, and one with two", () => {
    expect(() =>
      createPhotoQte(mutate({ instants: SPEC.instants.map((i) => ({ ...i, role: "bonus" })) })),
    ).toThrow(/master/);
    expect(() =>
      createPhotoQte(mutate({ instants: SPEC.instants.map((i) => ({ ...i, role: "master" })) })),
    ).toThrow(/master/);
  });

  it("F4/F5: reproduces the design's own sweet spots (94 / 132 / 251 mm)", () => {
    const sweet = (t: number) => focalBandOf(subjectBoxAt(SPEC.subjectTrack, t)).sweet;
    expect(sweet(11.0)).toBeCloseTo(94, 0);
    expect(sweet(36.5)).toBeCloseTo(132, 0);
    expect(sweet(53.0)).toBeCloseTo(251, 0);
  });
});

describe("the phase machine (AC1) — forward only, all three terminals reach the sheet", () => {
  it("BRIEFING is skippable in one press", () => {
    const qte = createPhotoQte(SPEC);
    expect(tickPhotoQte(qte, input({ skipBriefing: true }), 1 / 60).qte.phase).toBe("ESTABLISHING");
  });

  it("BRIEFING falls through on its own cap", () => {
    const qte = run(createPhotoQte(SPEC), Math.ceil(SPEC.briefingMaxSeconds * 60) + 2, 1 / 60);
    expect(qte.phase).not.toBe("BRIEFING");
  });

  it("ESTABLISHING holds 2.0 s, forced LOWERED, clock frozen at 0", () => {
    let qte = tickPhotoQte(createPhotoQte(SPEC), input({ skipBriefing: true }), 1 / 60).qte;
    qte = run(qte, 60, 1 / 60, input({ raiseIntent: true, shutter: true }));
    expect(qte.phase).toBe("ESTABLISHING");
    expect(qte.posture).toBe("LOWERED");
    expect(qte.sceneClock).toBe(0);
    expect(qte.film).toBe(SPEC.filmCount);
    qte = run(qte, 70, 1 / 60);
    expect(qte.phase).toBe("ACTIVE");
  });

  it("SCENE_END is the passive-failure route, and it reaches the contact sheet", () => {
    let qte = active();
    while (qte.phase === "ACTIVE") qte = tickPhotoQte(qte, NEUTRAL, 1 / 60).qte;
    expect(qte.phase).toBe("SCENE_END");
    qte = tickPhotoQte(qte, NEUTRAL, 1 / 60).qte;
    expect(qte.phase).toBe("DEVELOPING");
    qte = run(qte, Math.ceil(PHOTO_DEVELOP_SECONDS * 60) + 1, 1 / 60);
    expect(qte.phase).toBe("CONTACT_SHEET");
    expect(photoSheetView(qte)).not.toBeNull();
  });

  it("isPhotoQteActive is false exactly on DONE and EXITED", () => {
    const qte = createPhotoQte(SPEC);
    expect(isPhotoQteActive(qte)).toBe(true);
    expect(isPhotoQteActive({ ...qte, phase: "CONTACT_SHEET" })).toBe(true);
    expect(isPhotoQteActive({ ...qte, phase: "DONE" })).toBe(false);
    expect(isPhotoQteActive({ ...qte, phase: "EXITED" })).toBe(false);
    expect(isPhotoQteActive(null)).toBe(false);
  });

  it("shouldTriggerPhotoQte fires once, at the authored threshold, never on a null spec", () => {
    expect(shouldTriggerPhotoQte(null, null, 99)).toBe(false);
    expect(shouldTriggerPhotoQte(SPEC, null, 2.4)).toBe(false);
    expect(shouldTriggerPhotoQte(SPEC, null, 2.5)).toBe(true);
    expect(shouldTriggerPhotoQte(SPEC, createPhotoQte(SPEC), 30)).toBe(false);
  });
});

describe("the shutter (AC2, A-T8) — T1 swallows everything while unarmed", () => {
  it("a release while LOWERED costs nothing at all", () => {
    const qte = active();
    const r = tickPhotoQte(qte, input({ shutter: true }), 1 / 60);
    expect(r.qte.film).toBe(SPEC.filmCount);
    expect(r.qte.suspicion).toBe(0);
    expect(r.qte.frames).toEqual([]);
    expect(r.exposed).toBeNull();
  });

  it("a release before the 0.40 s arm delay is swallowed, and armed after it", () => {
    let qte = active();
    qte = tickPhotoQte(qte, input({ raiseIntent: true }), 1 / 60).qte;
    qte = run(qte, 12, 1 / 60, input({ raiseIntent: true })); // ≈ 0.22 s < 0.40 s
    expect(qte.raisedElapsed).toBeLessThan(SHUTTER_ARM_SECONDS);
    expect(tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60).qte.film).toBe(
      SPEC.filmCount,
    );
    qte = run(qte, 15, 1 / 60, input({ raiseIntent: true })); // now past 0.40 s
    expect(qte.raisedElapsed).toBeGreaterThanOrEqual(SHUTTER_ARM_SECONDS);
    const r = tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60);
    expect(r.qte.film).toBe(SPEC.filmCount - 1);
    expect(r.exposed).not.toBeNull();
  });

  it("D1.a: the focal is RETAINED across a lower/raise — only the view changes", () => {
    let qte = framed(active());
    const focal = qte.focal;
    qte = run(qte, 30, 1 / 60); // lowered
    expect(qte.posture).toBe("LOWERED");
    expect(qte.focal).toBeCloseTo(focal, 10);
    qte = tickPhotoQte(qte, input({ raiseIntent: true }), 1 / 60).qte;
    expect(qte.focal).toBeCloseTo(focal, 10);
  });

  it("D1.b: every raise re-arms the shutter and re-rolls the sway path", () => {
    let qte = framed(active());
    const index = qte.raiseIndex;
    qte = run(qte, 5, 1 / 60); // lower
    qte = tickPhotoQte(qte, input({ raiseIntent: true }), 1 / 60).qte;
    expect(qte.raiseIndex).toBe(index + 1);
    expect(qte.raisedElapsed).toBe(0);
  });

  it("every armed release costs exactly one frame, whatever the verdict", () => {
    let qte = framed(active());
    const before = qte.film;
    qte = tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60).qte;
    expect(qte.film).toBe(before - 1);
    expect(qte.frames).toHaveLength(1);
  });
});

describe("suspicion (AC7, A-T9) — one input, one lesson", () => {
  /** Shoot `n` armed frames at the current scene time. */
  function shoot(qte: PhotoQte, n: number): PhotoQte {
    let cur = qte;
    for (let i = 0; i < n; i++) {
      cur = tickPhotoQte(cur, input({ raiseIntent: true, shutter: true }), 1 / 60).qte;
      if (cur.phase !== "ACTIVE") break;
      cur = run(cur, 30, 1 / 60, input({ raiseIntent: true }));
    }
    return cur;
  }

  it("two silent shutters do not spot; the third does", () => {
    let qte = framed(active()); // sceneClock ≈ 1 s ⇒ exposed street
    qte = shoot(qte, 2);
    expect(qte.suspicion).toBe(2 * SUSPICION_SHUTTER_EXPOSED);
    expect(qte.phase).toBe("ACTIVE");
    qte = shoot(qte, 1);
    expect(qte.suspicion).toBeGreaterThanOrEqual(SUSPICION_MAX);
    expect(qte.phase).toBe("SPOTTED");
  });

  it("a covered shutter moves the needle by exactly 0", () => {
    let qte = active();
    qte = run(qte, 11 * 60, 1 / 60); // sceneClock ≈ 11 s ⇒ inside [10, 17]
    qte = framed(qte);
    const r = tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60);
    expect(r.qte.suspicion).toBe(0);
  });

  it("the needle is frozen while LOWERED — no rise, no decay (UX A5)", () => {
    let qte = framed(active());
    qte = tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60).qte;
    const s = qte.suspicion;
    expect(s).toBeGreaterThan(0);
    qte = run(qte, 300, 1 / 60); // five seconds lowered
    expect(qte.suspicion).toBe(s);
  });

  it("SPOTTED is non-lethal and still reaches the sheet (F8, spec §1.1)", () => {
    const qte = { ...framed(active()), suspicion: SUSPICION_MAX, phase: "SPOTTED" as const };
    const r = tickPhotoQte(qte, NEUTRAL, 1 / 60);
    expect(r.qte.phase).toBe("DEVELOPING");
  });
});

describe("the roll (AC3) — film is the second pressure", () => {
  it("ROLL_END fires on the decrement that empties the roll", () => {
    let qte = framed(active());
    for (let i = 0; i < SPEC.filmCount; i++) {
      qte = tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60).qte;
      if (qte.phase !== "ACTIVE") break;
      qte = run(qte, 30, 1 / 60, input({ raiseIntent: true }));
      // Keep the needle out of the way: this test is about film, not noise.
      qte = { ...qte, suspicion: 0 };
    }
    expect(qte.film).toBe(0);
    expect(qte.phase).toBe("ROLL_END");
  });
});

describe("verdicts and the two-beat feedback (D8, A-T2, A-T3)", () => {
  it("A-T3 (F12(1a)): the scene view's box is the SAME carried object the tests read", () => {
    const qte = framed(active());
    expect(photoSceneView(qte).subjectBox).toBe(qte.subjectBox);
  });

  it("A-T2: the scene view cannot express a verdict, an instant or a role", () => {
    const qte = framed(active());
    const keys = Object.keys(photoSceneView(qte));
    for (const forbidden of ["verdict", "instantId", "instant", "role", "frames", "outcome"]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("A-T2: a `locked` bracket on NO_SUBJECT is indistinguishable from one on the master", () => {
    // Same composition state, two different scene times: one inside the master window, one
    // in the dead street. The scene view must be identical field for field except the
    // clock-driven geometry — in particular the bracket and every visible cue.
    const onMaster = framed(active());
    const view = photoSceneView(onMaster);
    const off = photoSceneView({ ...onMaster, sceneClock: 20.0 });
    expect(off.bracket).toBe(view.bracket);
    expect(Object.keys(off)).toEqual(Object.keys(view));
  });

  it("photoSheetView is null until the sheet exists", () => {
    expect(photoSheetView(createPhotoQte(SPEC))).toBeNull();
    expect(photoSheetView(active())).toBeNull();
    expect(photoSheetView({ ...active(), phase: "CONTACT_SHEET" })).not.toBeNull();
  });

  it("A-T6: a release fired mid-transit is `no-subject` whatever the composition says", () => {
    let qte = active();
    qte = run(qte, Math.round(18.0 * 60), 1 / 60); // the dead beat after ARRIVEE closes
    qte = framed(qte);
    expect(qte.composition.bracket).toBe("locked");
    const r = tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60);
    const frame = r.qte.frames[0];
    expect(frame?.verdict).toBe("REJECTED");
    expect(frame?.rejectReason).toBe("no-subject");
    expect(frame?.instantId).toBeNull();
  });

  it("a well-composed release inside the master window is a MASTER frame", () => {
    let qte = active();
    qte = run(qte, Math.round(37.0 * 60), 1 / 60);
    qte = framed(qte, 132);
    expect(qte.composition.bracket).toBe("locked");
    const r = tickPhotoQte(qte, input({ raiseIntent: true, shutter: true }), 1 / 60);
    expect(r.qte.frames[0]?.verdict).toBe("MASTER");
    expect(r.qte.frames[0]?.instantId).toBe("ECHANGE");
    expect(r.exposed).toEqual({ focusHeld: true });
  });

  it("photoOutcomeOf: bonuses multiply the proof, they never substitute for it", () => {
    const f = (verdict: "MASTER" | "BONUS" | "REJECTED", instantId: string | null) => ({
      ordinal: 1,
      verdict,
      instantId,
      rejectReason: null,
      inCover: true,
    });
    expect(photoOutcomeOf([])).toBe("none");
    expect(photoOutcomeOf([f("BONUS", "ARRIVEE")])).toBe("none");
    expect(photoOutcomeOf([f("MASTER", "ECHANGE")])).toBe("master");
    expect(photoOutcomeOf([f("MASTER", "ECHANGE"), f("BONUS", "PLAQUE")])).toBe("master-bonus");
  });
});

describe("the exits from the sheet (K-4) — a leaving control, always", () => {
  function atSheet(attemptIndex = 0): PhotoQte {
    let qte = active(SPEC, attemptIndex);
    while (qte.phase === "ACTIVE") qte = tickPhotoQte(qte, NEUTRAL, 1 / 60).qte;
    qte = tickPhotoQte(qte, NEUTRAL, 1 / 60).qte;
    qte = run(qte, Math.ceil(PHOTO_DEVELOP_SECONDS * 60) + 1, 1 / 60);
    expect(qte.phase).toBe("CONTACT_SHEET");
    return qte;
  }

  it("the sheet waits for the player — it never dismisses itself", () => {
    const qte = run(atSheet(), 60 * 60, 1 / 60);
    expect(qte.phase).toBe("CONTACT_SHEET");
  });

  it("the failure branch's leaving control is `decline`, and it settles `none`", () => {
    const sheet = atSheet();
    expect(photoSheetView(sheet)?.leavingCta).toBe("decline");
    const r = tickPhotoQte(sheet, input({ cta: "decline" }), 1 / 60);
    expect(r.qte.phase).toBe("EXITED");
    expect(r.settled).toBe("none");
    expect(r.exit).toBe("decline");
  });

  it("retry is offered on attempt 1 and GONE at the cap (D-1)", () => {
    expect(photoSheetView(atSheet(0))?.retryOffered).toBe(true);
    expect(photoSheetView(atSheet(PHOTO_MAX_ATTEMPTS - 1))?.retryOffered).toBe(false);
  });

  it("a retry press at the cap leaves instead of looping", () => {
    const r = tickPhotoQte(atSheet(PHOTO_MAX_ATTEMPTS - 1), input({ cta: "retry" }), 1 / 60);
    expect(r.exit).toBe("decline");
    expect(r.qte.phase).toBe("EXITED");
  });

  it("a retry press below the cap asks stateMachine for a new attempt", () => {
    const r = tickPhotoQte(atSheet(0), input({ cta: "retry" }), 1 / 60);
    expect(r.exit).toBe("retry");
    expect(r.qte.phase).toBe("DONE");
    expect(r.settled).toBeNull();
  });
});

describe("determinism (AC10, F11)", () => {
  it("A-T10: the same input sequence replays byte-identically", () => {
    const script = [
      input({ raiseIntent: true, aim: { x: 0.54, y: 0.25 }, focalDelta: 0.8 }),
      input({ raiseIntent: true, aim: { x: 0.54, y: 0.25 } }),
      input({ raiseIntent: true, aim: { x: 0.6, y: 0.3 }, shutter: true }),
    ];
    const play = () => {
      let qte = active();
      for (let i = 0; i < 300; i++) {
        qte = tickPhotoQte(qte, script[i % script.length] ?? NEUTRAL, 1 / 60).qte;
      }
      return qte;
    };
    expect(JSON.stringify(play())).toBe(JSON.stringify(play()));
  });

  it("A-T10: retry N is byte-identical to retry 1 at the same attemptIndex", () => {
    expect(JSON.stringify(createPhotoQte(SPEC, 1))).toBe(JSON.stringify(createPhotoQte(SPEC, 1)));
  });

  it("uses no wall clock: two runs a moment apart agree", () => {
    const a = run(active(), 120, 1 / 60, input({ raiseIntent: true }));
    const b = run(active(), 120, 1 / 60, input({ raiseIntent: true }));
    expect(a.viewfinder).toEqual(b.viewfinder);
    expect(a.composition).toEqual(b.composition);
  });
});

describe("composition (AC5) — the double trade-off is geometric, not two bolted rules", () => {
  it("greedy-tight framing has no slack at all: FILL_MAX = 1 − 2 × FRAME_MARGIN", () => {
    expect(FILL_MAX).toBeCloseTo(0.92, 10);
    expect(FILL_MIN).toBeLessThan(FILL_MAX);
  });

  it("the focus hold resets to zero on ANY break of T3 ∧ T4", () => {
    let qte = framed(active());
    expect(qte.composition.focusHeldSeconds).toBeGreaterThanOrEqual(FOCUS_HOLD);
    // Pan away. The frame is rate-limited to PAN_RATE_MAX, so the break is not instant —
    // but the moment T3 fails the hold is gone entirely, not decayed.
    let ticks = 0;
    while (qte.composition.contained && ticks < 240) {
      qte = tickPhotoQte(qte, input({ raiseIntent: true, aim: { x: 0.05, y: 0.9 } }), 1 / 60).qte;
      ticks++;
    }
    expect(ticks).toBeLessThan(240);
    expect(qte.composition.focusHeldSeconds).toBe(0);
    expect(qte.composition.bracket).toBe("dashed");
  });

  it("the viewfinder never leaves the plate", () => {
    const qte = run(active(), 200, 1 / 60, input({ raiseIntent: true, aim: { x: 1.4, y: -0.4 } }));
    expect(qte.viewfinder.cx - qte.viewfinder.w / 2).toBeGreaterThanOrEqual(-1e-9);
    expect(qte.viewfinder.cx + qte.viewfinder.w / 2).toBeLessThanOrEqual(100 + 1e-9);
    expect(qte.viewfinder.cy - qte.viewfinder.h / 2).toBeGreaterThanOrEqual(-1e-9);
    expect(qte.viewfinder.cy + qte.viewfinder.h / 2).toBeLessThanOrEqual(56.25 + 1e-9);
  });
});

describe("the tell's two channels, and the plaque derivation (R2-4)", () => {
  it("the headlights approach 1.8 s before the cover opens and light it while it holds", () => {
    const base = active();
    const at = (t: number) => photoSceneView({ ...base, sceneClock: t });
    // The first wave opens at 10.0 s; its tell runs from 8.2 s.
    expect(at(8.0).headlightsApproaching).toBe(false);
    expect(at(8.5).headlightsApproaching).toBe(true);
    expect(at(9.9).headlightsApproaching).toBe(true);
    expect(at(9.9).headlightsLit).toBe(false);
    expect(at(10.5).headlightsApproaching).toBe(false);
    expect(at(10.5).headlightsLit).toBe(true);
  });

  it("nothing but the headlights projects the cover — the tell is never the verdict", () => {
    const lit = photoSceneView({ ...active(), sceneClock: 12.0 });
    const dark = photoSceneView({ ...active(), sceneClock: 20.0 });
    // The two differ ONLY on the cover channels, never on a bracket or a composition read.
    expect(lit.bracket).toBe(dark.bracket);
    expect(lit.headlightsLit).not.toBe(dark.headlightsLit);
  });

  it("hasPlaque is derived from the frames on the sheet, never carried", () => {
    const frame = (verdict: "MASTER" | "BONUS", instantId: string) => ({
      ordinal: 1,
      verdict,
      instantId,
      rejectReason: null,
      inCover: true,
    });
    const sheet = (frames: ReturnType<typeof frame>[]) =>
      photoSheetView({ ...active(), phase: "CONTACT_SHEET", frames });
    expect(sheet([frame("MASTER", "ECHANGE")])?.hasPlaque).toBe(false);
    expect(sheet([frame("BONUS", "ARRIVEE")])?.hasPlaque).toBe(false);
    expect(sheet([frame("MASTER", "ECHANGE"), frame("BONUS", "PLAQUE")])?.hasPlaque).toBe(true);
  });
});
