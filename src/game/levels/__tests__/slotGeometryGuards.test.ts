import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getBackdropLayout, WORLD_HEIGHT, FACADE_ASPECT } from "@game/levels/levelArt";
import { LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL } from "@game/levels/levels";
import {
  ASSAULT_RADIUS,
  DELIVERY_ASSAILANTS,
  reservedAssaultSlots,
} from "@game/systems/deliveryAssault";
import type { DeliverySpec } from "@game/types/delivery";
import { levelFacade } from "./levelFacade";

/**
 * Guards on the REAL runtime slot geometry of the shipped levels (the facade
 * `GameScene` composes and the tick receives — see `levelFacade`).
 *
 * All of them are load-bearing for gameplay and invisible from the data they
 * guard: a window-zone retouch is an art/tooling change that can silently gut a
 * core-loop objective (AC12.1), strand an enemy out of reach forever (ADR-0071)
 * or pull the two assault windows apart until the player can no longer hold both
 * assailants in one frame (AC17). They fail CI instead.
 */

const DELIVERY_LEVELS = LEVELS.flatMap((l) => {
  const spec = l.deliveries[0];
  return spec === undefined ? [] : [[l.id, spec] as const];
});

/* ------------------------------------------------------------------------- *
 * The runtime camera model (spec §4.5 / AC17), re-declared here WITH ITS
 * PROVENANCE rather than imported: this file guards `src/game` data and the pure
 * lane must not pull `src/render` into production or into its own reasoning. Each
 * constant names the file AND line it mirrors, so drift is visible in review.
 * ------------------------------------------------------------------------- */

const MOBILE_ZOOM_FACTOR = 1.7; // GameScene.tsx:107
const BELLIARD_ZOOM_FACTOR = 0.85; // GameScene.tsx:335 (the belliard dezoom test)
const PANEL_W = WORLD_HEIGHT * FACADE_ASPECT; // GameScene.tsx:159
/** The shot hit test is a disc on the SLOT CENTRE — `bulletSystem.ts:52` (radius)
 *  and `:129-132` (the test), which is why these guards measure centres and never
 *  sprite planes. */
const HIT_RADIUS = 0.8;
/** World height of the van sprite — `DeliveryVehicleSprite.tsx:20`. */
const VEHICLE_H = 2.4;
/** Pinned tolerance of both framing tables (spec §5, AC18): ±0.01 world units. */
const TOLERANCE = 0.01;
function expectNear(actual: number, expected: number): void {
  expect(actual).toBeGreaterThanOrEqual(expected - TOLERANCE);
  expect(actual).toBeLessThanOrEqual(expected + TOLERANCE);
}

interface Viewport {
  readonly label: string;
  readonly w: number;
  readonly h: number;
  readonly mobile: boolean;
  /** Pinch fraction of `baseZoom` — `useTouchControls.ts:41-46`. */
  readonly f: number;
}

/**
 * The declared sweep of spec §4.5: 3 desktop viewports at the static zoom, then
 * mobile landscape at max (`MAX_ZOOM_FRACTION` 1), default (`DEFAULT_ZOOM_FRACTION`
 * 0.7) and min (`MIN_ZOOM_FRACTION` 0.5) pinch — 9 rows × 4 delivery levels = the
 * 36 cells §4.5 swept.
 */
const VIEWPORTS: readonly Viewport[] = [
  { label: "1920x1080", w: 1920, h: 1080, mobile: false, f: 1 },
  { label: "1440x900", w: 1440, h: 900, mobile: false, f: 1 },
  { label: "1280x1024", w: 1280, h: 1024, mobile: false, f: 1 },
  { label: "844x390 f1", w: 844, h: 390, mobile: true, f: 1 },
  { label: "932x430 f1", w: 932, h: 430, mobile: true, f: 1 },
  { label: "1024x768 f1", w: 1024, h: 768, mobile: true, f: 1 },
  { label: "844x390 f0.7", w: 844, h: 390, mobile: true, f: 0.7 },
  { label: "932x430 f0.7", w: 932, h: 430, mobile: true, f: 0.7 },
  { label: "844x390 f0.5", w: 844, h: 390, mobile: true, f: 0.5 },
];

/** `baseZoom` × pinch → the world-space frame and its pan clamp, for one level on
 *  one viewport (`GameScene.tsx:332-335` and `:385-386`, mobile `useGameLoop.ts:367-368`). */
function frameFor(levelId: string, vp: Viewport) {
  const baseZoom =
    Math.max(vp.w / PANEL_W, vp.h / WORLD_HEIGHT) *
    (vp.mobile ? MOBILE_ZOOM_FACTOR : 1) *
    (levelId === "belliard" ? BELLIARD_ZOOM_FACTOR : 1);
  const zoom = baseZoom * vp.f;
  const viewW = vp.w / zoom;
  const viewH = vp.h / zoom;
  return {
    viewW,
    viewH,
    rangeX: Math.max(0, (getBackdropLayout(levelId).fullW - viewW) / 2),
    rangeY: Math.max(0, (WORLD_HEIGHT - viewH) / 2),
  };
}

/**
 * The bounding box of the two RESERVED assault slot centres — read from the
 * production reservation (`reservedAssaultSlots`), not re-derived, so these guards
 * measure the slots the assault is actually seated on (AC7).
 */
function reservedExtent(id: string, spec: DeliverySpec) {
  const facade = levelFacade(id);
  const reserved = new Set(reservedAssaultSlots(facade, spec));
  const centres = facade.slots.filter((_, i) => reserved.has(i)).map((s) => s.screenPosition);
  const xs = centres.map((c) => c.x);
  const ys = centres.map((c) => c.y);
  return {
    count: centres.length,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

const FRAMING_CASES = DELIVERY_LEVELS.flatMap(([id, spec]) =>
  VIEWPORTS.map((vp) => [`${id} @ ${vp.label}`, id, spec, vp] as const),
);

function specOf(id: string): DeliverySpec {
  const entry = DELIVERY_LEVELS.find(([levelId]) => levelId === id);
  if (entry === undefined)
    throw new Error(`the framing tables name ${id}, which authors no delivery`);
  return entry[1];
}

/** `Δ + 2·HIT_RADIUS` per level — the frame each reserved pair requires (§4.5 F1).
 *  niveau-final's Δx = 6.09 (its two arches) is the binding case of the sweep. */
const F1_REQUIREMENT_CASES = (
  [
    ["belliard", 1.6, 3.04],
    ["stalingrad", 1.62, 3.16],
    ["vitry", 1.73, 2.59],
    ["niveau-final", 7.69, 1.6],
  ] as const
).map(([id, needW, needH]) => [id, needW, needH, specOf(id)] as const);

/** Camera-y band width, in world units, that composes the van with both slot
 *  centres — `LOCKED` = the clamp is a single point and it composes, `NONE` = no
 *  camera position does. Pinned from spec §5 AC18, tolerance ±0.01. */
type Band = number | "LOCKED" | "NONE";

const F2_TABLE: readonly (readonly [string, readonly Band[]])[] = [
  //                1920×1080 1440×900  1280×1024 844×390f1 932×430f1 1024×768f1 844f0.7 932f0.7 844f0.5
  ["belliard", ["LOCKED", "LOCKED", "LOCKED", "NONE", "NONE", 0.3, 0.3, 0.3, "LOCKED"]],
  ["stalingrad", [0.3, "LOCKED", "LOCKED", "NONE", "NONE", "NONE", 0.045, 0.033, 0.3]],
  ["vitry", [0.3, "LOCKED", "LOCKED", 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]],
  ["niveau-final", [0.3, "LOCKED", "LOCKED", "NONE", "NONE", "NONE", 0.3, 0.3, 0.3]],
];

const F2_CASES = F2_TABLE.flatMap(([id, bands]) =>
  VIEWPORTS.map((vp, i) => {
    const expected = bands[i];
    if (expected === undefined) throw new Error(`AC18's table has no cell for ${id} @ ${vp.label}`);
    return [`${id} @ ${vp.label}`, expected, id, specOf(id), vp] as const;
  }),
);

describe("AC12.1 — every delivery level can host its assault (the authoring guard)", () => {
  it.each(DELIVERY_LEVELS)(
    "%s has at least DELIVERY_ASSAILANTS slots within ASSAULT_RADIUS of the stop",
    (id, spec) => {
      const candidates = levelFacade(id).slots.filter(
        (s) => Math.abs(s.screenPosition.x - spec.stopPosition.x) <= ASSAULT_RADIUS,
      );
      // Measured today: belliard 10, stalingrad 7, vitry 28, niveau-final **2** —
      // the finale is AT the floor, so any window-zone retouch that moves one of
      // its two candidate windows out of range reddens here instead of silently
      // shipping a delivery the player cannot lose.
      expect(candidates.length).toBeGreaterThanOrEqual(DELIVERY_ASSAILANTS);
    },
  );
});

/**
 * AC17 — F1, MUTUAL SHOOTABILITY (spec §4.5). The fairness invariant `ASSAULT_RADIUS`
 * and the D2.8 reservation actually buy: SOME camera position the pan clamp allows
 * holds BOTH assault slot centres in frame, each with a full `HIT_RADIUS` of margin,
 * on every declared viewport. It is what §4.4's reference-player table assumes — the
 * `switch` cost between the two assailants is a re-aim, never a camera pan.
 *
 * This replaces a guard that claimed the same family of property and did not test it:
 * it measured a half-frame of 9 world units (a viewport no device produces — real ones
 * measure 9.41 to 27.68 here) against the enemy plane's FALLBACK width, the one
 * `EnemySprite` uses only when `size` is undefined, while the real plane is
 * `slot.size.y × ENEMY_PLANE_SCALE` = 1.40 / 1.89 / 1.24 / 9.67 world units. It never
 * looked at Y at all. It passed by data coincidence. See AC19 below.
 */
describe("AC17 — both assailants are shootable in one frame (F1, spec §4.5)", () => {
  it("sweeps the 36 cells §4.5 declares", () => {
    expect(FRAMING_CASES).toHaveLength(36);
  });

  it.each(FRAMING_CASES)(
    "%s: a clamp-legal camera position holds both slot centres at hit range",
    (_name, id, spec, vp) => {
      const e = reservedExtent(id, spec);
      const f = frameFor(id, vp);
      // A reservation short of its two slots would make the box degenerate and the
      // intervals trivially non-empty — the property is about BOTH assailants.
      expect(e.count).toBe(DELIVERY_ASSAILANTS);
      // AC17's two clamped camera intervals; non-empty ⇒ such a camera position exists.
      expect(Math.min(e.minX - HIT_RADIUS + f.viewW / 2, f.rangeX)).toBeGreaterThanOrEqual(
        Math.max(e.maxX + HIT_RADIUS - f.viewW / 2, -f.rangeX),
      );
      expect(Math.min(e.minY - HIT_RADIUS + f.viewH / 2, f.rangeY)).toBeGreaterThanOrEqual(
        Math.max(e.maxY + HIT_RADIUS - f.viewH / 2, -f.rangeY),
      );
    },
  );

  it.each(F1_REQUIREMENT_CASES)(
    "%s reserves a pair needing a %s × %s frame",
    (id, needW, needH, spec) => {
      const e = reservedExtent(id, spec);
      expect(e.count).toBe(DELIVERY_ASSAILANTS);
      expectNear(e.maxX - e.minX + 2 * HIT_RADIUS, needW);
      expectNear(e.maxY - e.minY + 2 * HIT_RADIUS, needH);
    },
  );

  it("pins the X margins: 4.07 u on §4.5's tightest row, 1.72 u across the whole sweep", () => {
    const margins = FRAMING_CASES.map(([name, id, spec, vp]) => {
      const e = reservedExtent(id, spec);
      return {
        name,
        label: vp.label,
        margin: frameFor(id, vp).viewW - (e.maxX - e.minX + 2 * HIT_RADIUS),
      };
    });
    const tightest = (rows: typeof margins) => rows.reduce((a, b) => (b.margin < a.margin ? b : a));
    // §4.5 quotes its headline margin at the row it calls the tightest real viewport
    // (mobile landscape 932×430 at max zoom → 11.76 × 5.43 world units).
    const quoted = tightest(margins.filter((m) => m.label === "932x430 f1"));
    expect(quoted.name).toBe("niveau-final @ 932x430 f1");
    expectNear(quoted.margin, 4.07);
    // Measured addendum: the narrowest frame the declared table actually produces is
    // 1024×768 at max zoom (viewW 9.41), where niveau-final has 1.72 u left. F1 holds
    // there too — 4.07 is a per-row figure, the invariant is the non-empty band above.
    const overall = tightest(margins);
    expect(overall.name).toBe("niveau-final @ 1024x768 f1");
    expectNear(overall.margin, 1.72);
  });
});

/**
 * AC18 — F2, COMPOSITION (spec §4.5): the van sprite uncropped in the SAME frame as
 * both slot centres. A characterisation test, not a guarantee — `NONE` is a ruled,
 * accepted state (§4.5 RULING: framing the van is mechanically inert during
 * `DELIVERING` — it cannot be shot, cannot be helped, does not move, and its gauge
 * lives in the HUD), never a bug. A cell moving in EITHER direction means the
 * geometry changed and §4.5's table is stale.
 */
describe("AC18 — the van-in-frame composition, characterised per device", () => {
  it.each(F2_CASES)("%s composes as %s", (_name, expected, id, spec, vp) => {
    const e = reservedExtent(id, spec);
    const f = frameFor(id, vp);
    // Camera-y band that keeps both slot centres in frame AND the van's bottom edge
    // above the frame's bottom.
    const lo = Math.max(e.maxY - f.viewH / 2, -f.rangeY);
    const hi = Math.min(spec.stopPosition.y - VEHICLE_H / 2 + f.viewH / 2, f.rangeY);
    if (expected === "NONE") {
      expect(hi).toBeLessThan(lo);
      return;
    }
    expect(hi).toBeGreaterThanOrEqual(lo);
    if (expected === "LOCKED") {
      // The pan clamp is a single point (the frame is as tall as the world) and that
      // one camera position composes.
      expect(f.rangeY).toBe(0);
      return;
    }
    expect(f.rangeY).toBeGreaterThan(0);
    expectNear(hi - lo, expected);
  });
});

/**
 * AC19 — the false claim cannot come back. The deleted guard rested on two numbers
 * that do not describe the runtime: the crosshair's fixed view constants (18 × 12,
 * a viewport no device produces) and `EnemySprite`'s fallback plane width, which the
 * renderer uses only when a slot has no `size`. Neither may be cited as a framing
 * property again — on the delivery/assault surface, in code or in a comment.
 */
describe("AC19 — no framing claim rests on the crosshair view constants or the fallback plane", () => {
  const SURFACE = [
    "../../systems/deliveryAssault.ts",
    "../../systems/deliverySystem.ts",
    "../../systems/__tests__/deliveryAssault.test.ts",
    "./slotGeometryGuards.test.ts",
  ];
  // The look-behind keeps the guard from tripping over its own source and over
  // ordinary numbering: `AC12.1` and a `§2.1` cross-reference are not plane widths.
  const FORBIDDEN = [
    { what: "the crosshair view constants", re: /VIEW_[WH]/ },
    { what: "the fallback enemy plane width", re: /(?<![\w.§])2\.1(?![\d])/ },
  ];

  it.each(SURFACE)("%s cites neither", (file) => {
    const text = readFileSync(resolve(__dirname, file), "utf8");
    for (const { what, re } of FORBIDDEN) {
      expect({ what, cited: re.exec(text)?.[0] ?? null }).toEqual({ what, cited: null });
    }
  });
});

describe("ADR-0071 — every window slot stays reachable by the camera pan", () => {
  // The ADR self-commits to this test (`0071:119`) and no test pinned it: the pan
  // clamp is `rangeX = fullW/2 − viewW/2` and the camera rect reaches `viewW/2`
  // past its centre, so the furthest reachable slot centre is exactly `fullW/2`.
  // Since ADR-0071 an unreachable slot is not a cosmetic wart but a HARD
  // progression stall: a frozen enemy there can never be killed, `allDead` never
  // turns true and the wave stops rolling over. The assault reservation makes slot
  // geometry MORE load-bearing, not less — it removes two slots per delivery level.
  const ALL = [...LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL];

  it.each(ALL.map((l) => [l.id] as const))("%s: max |slotX| <= fullW/2", (id) => {
    const facade = levelFacade(id);
    const bound = getBackdropLayout(id).fullW / 2;
    expect(facade.slots.length).toBeGreaterThan(0);
    const worst = Math.max(...facade.slots.map((s) => Math.abs(s.screenPosition.x)));
    expect(worst).toBeLessThanOrEqual(bound);
  });

  it("the thinnest margin is vitry's, and it is still positive (ADR-0071 measured 39.4586 / 40)", () => {
    const margins = LEVELS.map((l) => {
      const worst = Math.max(...levelFacade(l.id).slots.map((s) => Math.abs(s.screenPosition.x)));
      return { id: l.id, margin: getBackdropLayout(l.id).fullW / 2 - worst };
    });
    const tightest = margins.reduce((a, b) => (b.margin < a.margin ? b : a));
    expect(tightest.id).toBe("vitry");
    expect(tightest.margin).toBeGreaterThan(0);
    expect(tightest.margin).toBeCloseTo(0.54, 2);
  });
});
