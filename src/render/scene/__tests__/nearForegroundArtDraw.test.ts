import { describe, it, expect } from "vitest";
import { drawNearForegroundObject, drawSignalLenses } from "../nearForegroundArt";
import type { SignalLenses } from "@game/levels/levelArt";
import type { SignalState } from "../trafficSignal";

/**
 * Pure Canvas2D coverage of the ADR-0049 traffic-light split: the housing draw is
 * DEAD grey (zero lit colour, art law C1) and the animated lit lens + halo lives in
 * the render-side overlay {@link drawSignalLenses}. happy-dom's canvas has no real
 * 2D context, so a recording mock captures every colour assigned to fill/stroke and
 * every gradient stop — enough to assert "lit index ↔ colour" and "housing has no
 * colour" without a bitmap.
 */

const SIGNAL_LIT = { red: "#ff3446", amber: "#ffb02a", green: "#3bf06e" } as const;

interface Recorder {
  readonly ctx: CanvasRenderingContext2D;
  readonly colours: string[];
}

// A no-op Canvas2D that records every colour string set on fill/stroke or added as
// a gradient stop. Every path/state method is a no-op; createRadialGradient returns
// a stub whose addColorStop feeds the same recorder.
function makeRecorder(): Recorder {
  const colours: string[] = [];
  const gradient = {
    addColorStop: (_offset: number, colour: string): void => {
      colours.push(colour);
    },
  };
  const noop = (): void => undefined;
  const methods = {
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    quadraticCurveTo: noop,
    arc: noop,
    ellipse: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    strokeRect: noop,
    clearRect: noop,
    createRadialGradient: (): typeof gradient => gradient,
  };
  let fillStyle: unknown = "";
  let strokeStyle: unknown = "";
  let lineWidth = 0;
  let lineCap = "butt";
  const record = (value: unknown): void => {
    if (typeof value === "string") colours.push(value);
  };
  const ctx = new Proxy(methods, {
    get(target, prop): unknown {
      if (prop === "fillStyle") return fillStyle;
      if (prop === "strokeStyle") return strokeStyle;
      if (prop === "lineWidth") return lineWidth;
      if (prop === "lineCap") return lineCap;
      return Reflect.get(target, prop);
    },
    set(_target, prop, value): boolean {
      if (prop === "fillStyle") {
        fillStyle = value;
        record(value);
      } else if (prop === "strokeStyle") {
        strokeStyle = value;
        record(value);
      } else if (prop === "lineWidth") {
        lineWidth = value as number;
      } else if (prop === "lineCap") {
        lineCap = value as string;
      }
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, colours };
}

// Parse a "#rrggbb" or "rgba(r,g,b,a)" colour to [r,g,b]; null for gradients/other.
function rgb(colour: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{6})$/i.exec(colour);
  if (hex !== null) {
    const n = Number.parseInt(hex[1] ?? "0", 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }
  const rgba = /^rgba?\(([^)]+)\)$/i.exec(colour);
  if (rgba !== null) {
    const parts = (rgba[1] ?? "").split(",").map((p) => Number.parseFloat(p.trim()));
    if (parts.length >= 3) return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  }
  return null;
}

// Saturation proxy: the spread between the brightest and darkest RGB channel. Grey
// tones are near-zero; the lit signal colours (red/amber/green) are far above.
function channelSpread(colour: string): number {
  const parsed = rgb(colour);
  if (parsed === null) return 0;
  return Math.max(...parsed) - Math.min(...parsed);
}

const W = 100;
const H = 512;

describe("drawNearForegroundObject('trafficLight') — dead grey housing (C1)", () => {
  it("never paints a lit signal colour", () => {
    const { ctx, colours } = makeRecorder();
    drawNearForegroundObject(ctx, "trafficLight", W, H);
    expect(colours.length).toBeGreaterThan(0);
    for (const lit of Object.values(SIGNAL_LIT)) {
      expect(colours).not.toContain(lit);
    }
  });

  it("keeps every housing colour desaturated (grey / near-black, no colour)", () => {
    const { ctx, colours } = makeRecorder();
    drawNearForegroundObject(ctx, "trafficLight", W, H);
    for (const colour of colours) {
      expect(channelSpread(colour), `"${colour}" must read as grey`).toBeLessThan(80);
    }
  });
});

describe("drawSignalLenses — animated lit-lens overlay", () => {
  const draw = (state: SignalState, lenses: SignalLenses | null = null): string[] => {
    const { ctx, colours } = makeRecorder();
    drawSignalLenses(ctx, W, H, lenses, state);
    return colours;
  };

  it("lights the vehicle RED lens (and pedestrian stand red) at vehicle=red", () => {
    const colours = draw({ vehicle: "red", ped: "red" });
    expect(colours).toContain(SIGNAL_LIT.red);
    expect(colours).not.toContain(SIGNAL_LIT.amber);
    expect(colours).not.toContain(SIGNAL_LIT.green);
  });

  it("lights the vehicle AMBER lens at vehicle=amber", () => {
    const colours = draw({ vehicle: "amber", ped: "red" });
    expect(colours).toContain(SIGNAL_LIT.amber);
    expect(colours).toContain(SIGNAL_LIT.red); // pedestrian stand is red while vehicles move
    expect(colours).not.toContain(SIGNAL_LIT.green);
  });

  it("lights the vehicle GREEN lens at vehicle=green", () => {
    const colours = draw({ vehicle: "green", ped: "red" });
    expect(colours).toContain(SIGNAL_LIT.green);
    expect(colours).not.toContain(SIGNAL_LIT.amber);
  });

  it("lights the pedestrian WALK (green) lens at ped=green", () => {
    const colours = draw({ vehicle: "red", ped: "green" });
    // vehicle red + pedestrian green: both red and green lenses lit, never amber.
    expect(colours).toContain(SIGNAL_LIT.green);
    expect(colours).toContain(SIGNAL_LIT.red);
    expect(colours).not.toContain(SIGNAL_LIT.amber);
  });

  it("degrades to the fixed-fraction fallback when lenses is null (still lights up)", () => {
    const colours = draw({ vehicle: "green", ped: "red" }, null);
    expect(colours).toContain(SIGNAL_LIT.green);
  });

  it("degrades per-anchor when the arrays are empty or an anchor is non-finite", () => {
    const empty: SignalLenses = { vehicle: [], ped: [] };
    expect(() => draw({ vehicle: "red", ped: "green" }, empty)).not.toThrow();
    const malformed: SignalLenses = {
      vehicle: [
        { x: Number.NaN, y: 0.1, rx: 0.1, ry: 0.03 },
        { x: 0.29, y: 0.24, rx: 0.11, ry: 0.035 },
        { x: 0.29, y: 0.38, rx: 0.11, ry: 0.035 },
      ],
      ped: [{ x: 0.34, y: 0.62, rx: 0.14, ry: 0.05 }],
    };
    // vehicle red uses index 0 (NaN → fallback), pedestrian green uses ped[1] (missing
    // → fallback). Both still emit their lit colour, no throw.
    const colours = draw({ vehicle: "red", ped: "green" }, malformed);
    expect(colours).toContain(SIGNAL_LIT.red);
    expect(colours).toContain(SIGNAL_LIT.green);
  });
});
