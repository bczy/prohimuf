import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { zonesFromWindowRows } from "../windowRows.mjs";

const manifest = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "src/game/levels/levelArt.json"), "utf8"),
);
const belliard = manifest.levels.find((l) => l.id === "belliard");

describe("zonesFromWindowRows", () => {
  it("belliard: expands every row's xs into one zone each, sharing that row's y and the shared w/h", () => {
    const zones = zonesFromWindowRows(belliard.windows);
    const totalXs = belliard.windows.rows.reduce((n, r) => n + r.xs.length, 0);
    expect(totalXs).toBe(54); // 12 + 18 + 24, per ADR-0057's repositioning spec
    expect(zones).toHaveLength(totalXs);
    for (const z of zones) {
      expect(z.w).toBe(belliard.windows.w);
      expect(z.h).toBe(belliard.windows.h);
    }
  });

  it("is row-major, xs-ascending — the same order getWindowZones' windows branch produces", () => {
    const zones = zonesFromWindowRows(belliard.windows);
    let i = 0;
    for (const row of belliard.windows.rows) {
      for (const x of row.xs) {
        expect(zones[i]).toEqual({ x, y: row.y, w: belliard.windows.w, h: belliard.windows.h });
        i++;
      }
    }
  });

  it("handles an arbitrary WindowRows shape, not just belliard's", () => {
    const zones = zonesFromWindowRows({
      w: 0.1,
      h: 0.2,
      rows: [
        { y: 0.5, xs: [0.25, 0.75] },
        { y: 0.8, xs: [0.5] },
      ],
    });
    expect(zones).toEqual([
      { x: 0.25, y: 0.5, w: 0.1, h: 0.2 },
      { x: 0.75, y: 0.5, w: 0.1, h: 0.2 },
      { x: 0.5, y: 0.8, w: 0.1, h: 0.2 },
    ]);
  });

  it("an empty rows array yields an empty zone list", () => {
    expect(zonesFromWindowRows({ w: 0.1, h: 0.1, rows: [] })).toEqual([]);
  });
});
