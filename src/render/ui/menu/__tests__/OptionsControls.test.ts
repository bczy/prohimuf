import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PREFS } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { OptionsControls, buildReducedMotionChoices } from "../OptionsControls";

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
 * The label of the CHECKED choice inside one named ballot row.
 *
 * `BallotRow` renders its visible label, then its `role="radiogroup"`, then one
 * `role="radio"` box per choice — so the row's markup is everything from its label
 * up to the next row's `optLabel` div. Slicing there lets an assertion name the row
 * it is about, instead of counting `aria-checked="true"` document-wide (which is
 * one per radiogroup by construction and therefore cannot fail).
 */
function checkedIn(html: string, rowLabel: string): string | null {
  const start = html.indexOf(rowLabel);
  if (start === -1) return null;
  const rest = html.slice(start + rowLabel.length);
  const nextRow = rest.search(/class="[^"]*optLabel/);
  const row = nextRow === -1 ? rest : rest.slice(0, nextRow);
  const marked = /aria-checked="true"[^>]*>(?:<[^>]+>)*([A-ZÀ-Ü0-9]+)/.exec(row);
  return marked?.[1] ?? null;
}

/**
 * The shared OPTIONS body is the single source of truth for both surfaces (ADR-0054 §4).
 * These tests pin the a11y contract and the drift-kill so neither can silently regress:
 * one radiogroup per ballot row, radio + aria-checked per choice, the canonical CRT
 * label, native sliders kept, and the Pause-only false-affordance note.
 */
describe("OptionsControls a11y contract", () => {
  const html = render(DEFAULT_PREFS);

  it("wraps every ballot row in role=radiogroup (VIES, PRESSION, TUBE CATHODIQUE, BALAYAGE VHS, MOUVEMENT RÉDUIT)", () => {
    expect(count(html, /role="radiogroup"/g)).toBe(5);
  });

  it("names each radiogroup from its visible row label", () => {
    expect(count(html, /role="radiogroup" aria-labelledby="/g)).toBe(5);
  });

  it("exposes role=radio + aria-checked on every choice", () => {
    // 5 lives + 3 difficulties + 2 CRT + 2 VHS + 2 reduced-motion choices = 14 radios.
    expect(count(html, /role="radio"/g)).toBe(14);
    expect(count(html, /aria-checked="/g)).toBe(14);
  });

  it("checks exactly one choice per radiogroup", () => {
    expect(count(html, /aria-checked="true"/g)).toBe(5);
  });

  it("renders the MOUVEMENT RÉDUIT row (accessibility toggle)", () => {
    expect(html).toContain("MOUVEMENT RÉDUIT");
  });

  it("renders the BALAYAGE VHS row and tracks prefs.vhs", () => {
    expect(html).toContain("BALAYAGE VHS");
    // Scoped to the VHS row: a whole-document count of aria-checked="true" is
    // exactly one per radiogroup no matter WHICH choice each row marks, so it can
    // never fail. Read the marked label inside this row instead.
    expect(checkedIn(html, "BALAYAGE VHS")).toBe("OUI"); // DEFAULT_PREFS.vhs = true
    expect(checkedIn(render({ ...DEFAULT_PREFS, vhs: false }), "BALAYAGE VHS")).toBe("NON");
    // …and the neighbouring CRT row is unaffected by the VHS pref.
    expect(checkedIn(render({ ...DEFAULT_PREFS, vhs: false }), "TUBE CATHODIQUE")).toBe("OUI");
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

describe("buildReducedMotionChoices patch-through", () => {
  it("marks the choice matching prefs.reducedMotion as selected", () => {
    const off = buildReducedMotionChoices({ ...DEFAULT_PREFS, reducedMotion: false }, noop);
    expect(off.find((c) => c.label === "NON")?.selected).toBe(true);
    expect(off.find((c) => c.label === "OUI")?.selected).toBe(false);

    const on = buildReducedMotionChoices({ ...DEFAULT_PREFS, reducedMotion: true }, noop);
    expect(on.find((c) => c.label === "OUI")?.selected).toBe(true);
    expect(on.find((c) => c.label === "NON")?.selected).toBe(false);
  });

  it("reports the reducedMotion patch through onChange when a choice is selected", () => {
    const onChange = vi.fn();
    const choices = buildReducedMotionChoices({ ...DEFAULT_PREFS, reducedMotion: false }, onChange);
    choices.find((c) => c.label === "OUI")?.onSelect();
    expect(onChange).toHaveBeenCalledWith({ reducedMotion: true });

    onChange.mockClear();
    choices.find((c) => c.label === "NON")?.onSelect();
    expect(onChange).toHaveBeenCalledWith({ reducedMotion: false });
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
