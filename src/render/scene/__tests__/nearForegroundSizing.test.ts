import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getBackdropLayout, getNearForeground, WORLD_HEIGHT } from "@game/levels/levelArt";
import { NEAR_BAND_MARGIN, nearForegroundBandTop } from "../nearParallax";
import {
  KIND_MAX_WORLD_H,
  MAX_PROP_WORLD_H,
  NEAR_KIND_SPECS,
  nearKindSpec,
  nearPropPlaneHeight,
  propMaxWorldH,
} from "../nearForegroundArt";

/**
 * Vertical sizing law of the near-foreground props (ADR-0047 + its 2026-07-25
 * amendment): the lamppost was raised (Bertrand: « il devrait être plus haut » —
 * its lantern sat at the delivery van's CABIN height), and the raise must NOT cost
 * the non-occlusion invariant. Pure geometry, no R3F: the row constants are read
 * back out of NearForeground.tsx's source so this spec cannot silently drift from
 * the component it models (the reducedMotionProp.test.ts source-check precedent).
 */
const SRC = readFileSync(resolve(process.cwd(), "src/render/scene/NearForeground.tsx"), "utf8");

function num(name: string): number {
  const m = new RegExp(`const ${name} = (-?[0-9.]+);`).exec(SRC);
  if (m === null) throw new Error(`${name} not found in NearForeground.tsx`);
  return Number(m[1]);
}

const NEAR_STREET_LINE = num("NEAR_STREET_LINE");
const FAR_STREET_LINE = num("FAR_STREET_LINE");
const NEAR_SCALE = num("NEAR_SCALE");
const FAR_SCALE = num("FAR_SCALE");
const MOBILE_BAND_DROP = num("MOBILE_BAND_DROP");

const facadeH = WORLD_HEIGHT;
// DeliveryVehicleSprite: VEHICLE_H = 2.4 centred on the level's stopPosition.y
// (-4.5 on every level, src/game/levels/levels.ts) ⇒ roof line.
const VAN_ROOF_Y = -4.5 + 2.4 / 2;
// lamppost.png alpha profile (public/assets/nearfg/lamppost.png, 256×512): the
// lantern head occupies texture rows 10..120, i.e. these fractions of plane height
// measured DOWN from the plane's top edge.
const LANTERN_TOP_FRAC = 10 / 512;
const LANTERN_BOTTOM_FRAC = 120 / 512;

const LEVELS = ["belliard", "stalingrad"] as const;
const ROWS = [
  { row: "near" as const, line: NEAR_STREET_LINE, scale: NEAR_SCALE },
  { row: "far" as const, line: FAR_STREET_LINE, scale: FAR_SCALE },
];

interface Placed {
  readonly kind: string;
  readonly planeH: number;
  /** World Y of the sprite's plane top (feet already dropped by the foot pad). */
  readonly topY: number;
  readonly bandTopY: number;
  readonly lowestWindowBottomY: number;
}

/** Every non-derogating prop of a level, placed exactly like `Row` in the component. */
function place(levelId: string, mobile: boolean): Placed[] {
  const layer = getNearForeground(levelId);
  if (layer === null) return [];
  const zones = getBackdropLayout(levelId).tiles.flatMap((t) => t.zones);
  const bandTop = nearForegroundBandTop(zones);
  const lowestWindowBottom = Math.max(...zones.map((z) => z.y + z.h / 2));
  const bandTopY = (0.5 - (mobile ? bandTop + MOBILE_BAND_DROP : bandTop)) * facadeH;
  const out: Placed[] = [];
  for (const { row, line, scale: rowScale } of ROWS) {
    const streetY = (0.5 - line) * facadeH;
    const maxH = Math.max(0, bandTopY - streetY);
    for (const obj of layer.objects) {
      if ((obj.row ?? "near") !== row) continue;
      if (obj.kind === "trafficLight") continue; // the ONE documented derogation
      const planeH = nearPropPlaneHeight(
        obj.kind,
        facadeH,
        (obj.scale ?? 1) * rowScale,
        rowScale,
        maxH,
      );
      const footPad = (nearKindSpec(obj.kind).footPadFrac ?? 0) * planeH;
      out.push({
        kind: obj.kind,
        planeH,
        topY: streetY + planeH - footPad,
        bandTopY,
        lowestWindowBottomY: (0.5 - lowestWindowBottom) * facadeH,
      });
    }
  }
  return out;
}

function lamppost(levelId: string, mobile: boolean): Placed {
  const p = place(levelId, mobile).find((o) => o.kind === "lamppost");
  if (p === undefined) throw new Error(`no lamppost on ${levelId}`);
  return p;
}

describe("near-foreground prop sizing", () => {
  describe("non-occlusion (every kind but the feu tricolore, both rows, both densities)", () => {
    for (const levelId of LEVELS) {
      for (const mobile of [false, true]) {
        it(`${levelId} ${mobile ? "mobile" : "desktop"}: no prop top reaches a window row`, () => {
          const placed = place(levelId, mobile);
          expect(placed.length).toBeGreaterThan(0);
          for (const p of placed) {
            // Ceiling: the VISIBLE top stays at or below the band top…
            expect(p.topY).toBeLessThanOrEqual(p.bandTopY + 1e-9);
            // …and the band top is itself a full NEAR_BAND_MARGIN below the lowest
            // window's bottom edge, so a cop can never be masked at any pan offset.
            expect(p.lowestWindowBottomY - p.topY).toBeGreaterThanOrEqual(
              NEAR_BAND_MARGIN * facadeH - 1e-9,
            );
          }
        });
      }
    }
  });

  describe("lamppost raise (Bertrand 2026-07-25) — lantern above the delivery van", () => {
    for (const levelId of LEVELS) {
      it(`${levelId}: the lantern clears the van roof on desktop`, () => {
        const p = lamppost(levelId, false);
        const lanternTop = p.topY - LANTERN_TOP_FRAC * p.planeH;
        const lanternBottom = p.topY - LANTERN_BOTTOM_FRAC * p.planeH;
        // The WHOLE lantern head now sits above the van's roof line…
        expect(lanternBottom).toBeGreaterThan(VAN_ROOF_Y);
        // …by clearly more than the head's own height (it reads as a street lamp
        // overhanging the truck, not as a dwarf lamp beside its cabin).
        expect(lanternTop - VAN_ROOF_Y).toBeGreaterThan(1.8);
      });

      it(`${levelId}: mobile keeps the lantern at least level with the van roof`, () => {
        const p = lamppost(levelId, true);
        const lanternTop = p.topY - LANTERN_TOP_FRAC * p.planeH;
        expect(lanternTop - VAN_ROOF_Y).toBeGreaterThan(1.2);
      });

      it(`${levelId}: the plane is taller than the old global believable cap`, () => {
        // MUTATION GUARD: restoring the shared MAX_PROP_WORLD_H (4.5) for the
        // lamppost puts it back at 4.5 × 1.3 = 5.85 and this fails.
        expect(lamppost(levelId, false).planeH).toBeGreaterThan(MAX_PROP_WORLD_H * NEAR_SCALE + 1);
      });
    }
  });

  describe("the raise is scoped to the lamppost", () => {
    it("only the lamppost overrides the global believable cap", () => {
      expect(Object.keys(KIND_MAX_WORLD_H)).toEqual(["lamppost"]);
      expect(propMaxWorldH("lamppost")).toBeGreaterThan(MAX_PROP_WORLD_H);
    });

    it("every other kind keeps min(natural, band, global cap)", () => {
      for (const levelId of LEVELS) {
        for (const p of place(levelId, false)) {
          if (p.kind === "lamppost") continue;
          expect(p.planeH).toBeLessThanOrEqual(MAX_PROP_WORLD_H * NEAR_SCALE + 1e-9);
        }
      }
    });

    it("the band ceiling clamps the sprite TOP, foot pad included", () => {
      // A prop whose natural height exceeds the band tops out EXACTLY on the band
      // line — no foot-pad slack thrown away, none consumed past the line.
      const bandMaxH = 3;
      const h = nearPropPlaneHeight("lamppost", facadeH, 1, 1, bandMaxH);
      const fp = NEAR_KIND_SPECS.lamppost.footPadFrac;
      expect(h - fp * h).toBeCloseTo(bandMaxH, 10);
    });
  });
});
