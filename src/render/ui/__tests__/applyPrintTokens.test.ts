import { describe, it, expect } from "vitest";
import { buildPrintTokenVars } from "../applyPrintTokens";
import {
  INK,
  STOCK,
  MARK,
  ACID,
  FONT,
  MOTION,
  FONT_SIZE,
  SPACE,
  KEYLINE_WIDTH,
  FLYER_MAX_WIDTH_PX,
  Z,
} from "../print/tokens";

/**
 * The token bridge is only a single source if it can't silently drop a key. These
 * tests pin the invariant from ADR-0046: every key of every token object surfaces
 * as a `--namespace-key` CSS var, plus the lone `--keyline-width` scalar — so adding
 * a token to tokens.ts without wiring applyPrintTokens.ts fails here.
 */
const GROUPS: Record<string, Readonly<Record<string, string | number>>> = {
  ink: INK,
  stock: STOCK,
  mark: MARK,
  acid: ACID,
  font: FONT,
  motion: MOTION,
  "font-size": FONT_SIZE,
  space: SPACE,
  z: Z,
};

const camelToKebab = (key: string): string => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

describe("buildPrintTokenVars", () => {
  const vars = buildPrintTokenVars();

  it("emits a CSS var for every key of every token group", () => {
    for (const [prefix, tokens] of Object.entries(GROUPS)) {
      for (const key of Object.keys(tokens)) {
        expect(vars).toHaveProperty(`--${prefix}-${camelToKebab(key)}`);
      }
    }
  });

  it("covers exactly the token keys plus the lone scalars (no extras, none dropped)", () => {
    // +2 lone scalars: --keyline-width and --flyer-max-width.
    const expected =
      Object.values(GROUPS).reduce((n, tokens) => n + Object.keys(tokens).length, 0) + 2;
    expect(Object.keys(vars)).toHaveLength(expected);
    expect(vars).toHaveProperty("--keyline-width");
    expect(vars).toHaveProperty("--flyer-max-width");
  });

  it("formats each group with the right unit", () => {
    expect(vars["--ink-black"]).toBe(INK.black); // colour verbatim
    expect(vars["--font-display"]).toBe(FONT.display); // font stack verbatim
    expect(vars["--motion-title-to-menu"]).toBe(`${String(MOTION.titleToMenu)}ms`);
    expect(vars["--font-size-xs"]).toBe(`${String(FONT_SIZE.xs)}px`);
    expect(vars["--space-md"]).toBe(`${String(SPACE.md)}px`);
    expect(vars["--keyline-width"]).toBe(`${String(KEYLINE_WIDTH)}px`);
    expect(vars["--flyer-max-width"]).toBe(`${String(FLYER_MAX_WIDTH_PX)}px`);
    expect(vars["--z-hud"]).toBe(String(Z.hud)); // unitless
  });
});

describe("applyPrintTokens", () => {
  it("writes every built var onto the given root element", async () => {
    const { applyPrintTokens } = await import("../applyPrintTokens");
    const root = document.createElement("div");
    applyPrintTokens(root);
    const vars = buildPrintTokenVars();
    for (const [name, value] of Object.entries(vars)) {
      expect(root.style.getPropertyValue(name)).toBe(value);
    }
  });
});
