import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PREFS } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { OptionsControls } from "../OptionsControls";

const noop = (): void => {
  /* controlled by the host in production */
};

function render(prefs: Prefs, runScopedNote?: string): string {
  return renderToStaticMarkup(
    createElement(OptionsControls, { prefs, onChange: noop, runScopedNote }),
  );
}

const count = (html: string, re: RegExp): number => (html.match(re) ?? []).length;

/**
 * The shared OPTIONS body is the single source of truth for both surfaces (ADR-0052 §4).
 * These tests pin the a11y contract and the drift-kill so neither can silently regress:
 * one radiogroup per ballot row, radio + aria-checked per choice, the canonical CRT
 * label, native sliders kept, and the Pause-only false-affordance note.
 */
describe("OptionsControls a11y contract", () => {
  const html = render(DEFAULT_PREFS);

  it("wraps every ballot row in role=radiogroup (VIES, PRESSION, TUBE CATHODIQUE)", () => {
    expect(count(html, /role="radiogroup"/g)).toBe(3);
  });

  it("names each radiogroup from its visible row label", () => {
    expect(count(html, /role="radiogroup" aria-labelledby="/g)).toBe(3);
  });

  it("exposes role=radio + aria-checked on every choice", () => {
    // 5 lives + 3 difficulties + 2 CRT choices = 10 radios.
    expect(count(html, /role="radio"/g)).toBe(10);
    expect(count(html, /aria-checked="/g)).toBe(10);
  });

  it("checks exactly one choice per radiogroup", () => {
    expect(count(html, /aria-checked="true"/g)).toBe(3);
  });

  it("keeps the native range sliders for the two VU meters", () => {
    expect(count(html, /type="range"/g)).toBe(2);
  });
});

describe("OptionsControls drift-kill", () => {
  const html = render(DEFAULT_PREFS);

  it("uses the canonical TUBE CATHODIQUE label, never ÉCRAN CATHODIQUE", () => {
    expect(html).toContain("TUBE CATHODIQUE");
    expect(html).not.toContain("ÉCRAN CATHODIQUE");
  });
});

describe("OptionsControls run-scoped note", () => {
  it("renders the false-affordance note under VIES and PRESSION when provided", () => {
    const html = render(DEFAULT_PREFS, "prend effet à la prochaine partie");
    expect(count(html, /prend effet à la prochaine partie/g)).toBe(2);
  });

  it("omits the note when not provided (colophon)", () => {
    expect(render(DEFAULT_PREFS)).not.toContain("prend effet");
  });
});
