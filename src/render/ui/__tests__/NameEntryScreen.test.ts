import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";

// Opt into React's act() environment so client-render interaction tests don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MAX_NAME_LENGTH } from "@game/systems/highScoreSystem";
import { NameEntryScreen, type NameEntryScreenProps } from "../NameEntryScreen";

const noop = (): void => {
  /* replaced per test */
};

const BASE: NameEntryScreenProps = {
  score: 1240,
  wave: 3,
  initialName: "DJ MEHDI",
  onSubmit: noop,
  onSkip: noop,
};

function markup(overrides: Partial<NameEntryScreenProps> = {}): string {
  return renderToStaticMarkup(createElement(NameEntryScreen, { ...BASE, ...overrides }));
}

/**
 * NAME_ENTRY (M1, ADR-0054 §2). The static block pins the a11y contract the byline owes
 * every input path (label↔input association, live clamp, pre-fill, both actions); the
 * client block pins the focus-on-mount + submit/skip wiring (AC1/AC7).
 */
describe("NameEntryScreen a11y contract", () => {
  it("associates the visible label with the input (htmlFor === input id)", () => {
    const html = markup();
    const forMatch = /<label [^>]*for="([^"]+)"/.exec(html);
    expect(forMatch).not.toBeNull();
    const id = forMatch?.[1] ?? "";
    expect(id).not.toBe("");
    expect(html).toContain(`id="${id}"`);
  });

  it("clamps the byline to MAX_NAME_LENGTH natively", () => {
    expect(markup()).toMatch(new RegExp(`maxLength="${String(MAX_NAME_LENGTH)}"`, "i"));
  });

  it("pre-fills the input from initialName (returning-player convenience)", () => {
    expect(markup()).toMatch(/value="DJ MEHDI"/);
  });

  it("sanitises the pre-fill (control chars stripped, clamped) before display", () => {
    // 20 printable chars + a control char → stripped + clamped to 16.
    const html = markup({ initialName: "ABCDEFGHIJKLMNOPQRST\u0000" });
    expect(html).toMatch(/value="ABCDEFGHIJKLMNOP"/);
    expect(html).not.toContain("\u0000");
  });

  it("renders a SIGNER submit and a PASSER skip button", () => {
    const html = markup();
    expect(html).toContain("[ SIGNER ]");
    expect(html).toContain("[ PASSER ]");
    expect((html.match(/type="submit"/g) ?? []).length).toBe(1);
  });

  it("shows the score in the NUIT BLANCHE lead", () => {
    expect(markup()).toContain("NUIT BLANCHE : 1240");
  });
});

describe("NameEntryScreen interaction", () => {
  let root: ReturnType<typeof createRoot> | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  function mount(overrides: Partial<NameEntryScreenProps> = {}): HTMLDivElement {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root?.render(createElement(NameEntryScreen, { ...BASE, ...overrides }));
    });
    return container;
  }

  it("focuses the byline input on mount (AC7)", () => {
    const el = mount();
    const input = el.querySelector("input");
    expect(document.activeElement).toBe(input);
  });

  it("submits the pre-filled byline when the form is submitted (Enter / SIGNER)", () => {
    const onSubmit = vi.fn();
    const el = mount({ onSubmit });
    act(() => {
      el.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("DJ MEHDI");
  });

  it("skips via the PASSER button", () => {
    const onSkip = vi.fn();
    const el = mount({ onSkip });
    const passer = [...el.querySelectorAll("button")].find((b) => b.textContent === "[ PASSER ]");
    act(() => {
      passer?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("skips on Escape (keyboard mirror of PASSER, AC1)", () => {
    const onSkip = vi.fn();
    const el = mount({ onSkip });
    act(() => {
      el.querySelector("input")?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
