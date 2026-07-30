import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";

// Opt into React's act() environment so client-render interaction tests don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import type { RunSummary } from "@game/types/runStats";
import { EndScreen, type EndScreenProps } from "../EndScreen";

/**
 * End screen, run-stats pass (ADR-0076). Pins the three contracts the design gate
 * made blocking for this lane: the 0-input reads (R5 cause subhead + exactly 3
 * headline slots), the 7-line detail in its imposed order (R3), and the single
 * non-closing controls block (R1) — including the near-miss tap in the inert
 * padding, which is the sub-clause a bare per-button stopPropagation misses.
 */
const SUMMARY: RunSummary = {
  score: 4200,
  durationSeconds: 68.4,
  wave: 3,
  endCause: "SANTE",
  pickups: { collected: 3, spawned: 4 },
  delivery: { issue: "INTERROMPUE", integrityPct: 78 },
  heartsLost: { total: 1.5, damage: 0.5, faults: 1, max: 3 },
};

const BASE: EndScreenProps = {
  phase: "GAME_OVER",
  summary: SUMMARY,
  funnel: {
    titleSeen: true,
    tutorialCleared: true,
    firstDeliveryDone: false,
    belliardCleared: false,
  },
  levelId: "belliard",
  onRestart: () => {
    /* replaced per test */
  },
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(overrides: Partial<EndScreenProps> = {}): HTMLDivElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(createElement(EndScreen, { ...BASE, ...overrides }));
  });
  return container;
}

function click(el: Element | null | undefined): void {
  act(() => {
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function button(el: HTMLDivElement, startsWith: string): HTMLButtonElement | undefined {
  return [...el.querySelectorAll("button")].find((b) => b.textContent.includes(startsWith));
}

/**
 * Replaces `navigator.clipboard` in place — the API is declared non-optional by
 * the lib types, and the insecure-context case (no clipboard at all) is exactly
 * one of the branches under test.
 */
function setClipboard(value: unknown): void {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}

/** The one interactive region — everything inside it must not dismiss (gate R1). */
function controlsBlock(el: HTMLDivElement): HTMLElement {
  const toggle = button(el, "DÉTAIL DE LA COURSE");
  const block = toggle?.parentElement;
  if (block === null || block === undefined) throw new Error("controls block not found");
  return block;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
  Reflect.deleteProperty(navigator, "clipboard");
  vi.unstubAllGlobals();
});

describe("EndScreen — 0-input reads (A1, A11)", () => {
  it("shows the end-of-run cause without any input, on both terminal phases", () => {
    for (const phase of ["GAME_OVER", "LEVEL_COMPLETE"] as const) {
      const el = mount({ phase });
      expect(el.textContent).toContain("FIN DE RUN : SANTÉ");
      act(() => {
        root?.unmount();
      });
      el.remove();
    }
  });

  it("renders exactly 3 headline slots, the cause NOT being one of them", () => {
    const el = mount();
    const block = controlsBlock(el);
    // The headline row is the block's only child holding the three values.
    const row = [...block.children].find((c) => c.textContent.includes("SCORE FINAL"));
    expect(row?.children.length).toBe(3);
    expect(row?.textContent).not.toContain("FIN DE RUN");
    expect(row?.textContent).toContain("4200");
    expect(row?.textContent).toContain("INTERROMPUE — intégrité 78 %");
    expect(row?.textContent).toContain("1,5 ♥");
  });
});

describe("EndScreen — detail disclosure (A2)", () => {
  it("is a native button carrying aria-expanded/aria-controls, closed by default", () => {
    const el = mount();
    const toggle = button(el, "DÉTAIL DE LA COURSE");
    expect(toggle?.tagName).toBe("BUTTON");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    const panelId = toggle?.getAttribute("aria-controls") ?? "";
    expect(panelId).not.toBe("");
    expect(el.querySelector(`#${CSS.escape(panelId)}`)).toBeNull();
  });

  it("reveals exactly the 7 lines of spec D3.1, in that order", () => {
    const el = mount();
    const toggle = button(el, "DÉTAIL DE LA COURSE");
    click(toggle);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");

    const panelId = toggle?.getAttribute("aria-controls") ?? "";
    const panel = el.querySelector(`#${CSS.escape(panelId)}`);
    const rows = [...(panel?.children ?? [])].map((row) => ({
      term: row.querySelector("dt")?.textContent ?? "",
      value: row.querySelector("dd")?.textContent ?? "",
    }));

    expect(rows.length).toBe(7);
    expect(rows[0]?.term).toContain("RÉCUPÉRER — Caisses");
    expect(rows[0]?.value).toBe("3 / 4");
    expect(rows[1]?.term).toContain("LIVRER — Livraison");
    expect(rows[1]?.value).toBe("INTERROMPUE — intégrité 78 %");
    expect(rows[2]?.term).toContain("ÉVITER — Dégâts");
    expect(rows[2]?.value).toBe("1,5 ♥ (dont 1 ♥ de fautes)");
    expect(rows[3]?.term).toContain("Durée de jeu");
    expect(rows[3]?.value).toBe("68,4 s");
    expect(rows[4]?.term).toContain("Score final");
    expect(rows[4]?.value).toBe("4200");
    expect(rows[5]?.term).toContain("Fin de run");
    expect(rows[5]?.value).toBe("SANTÉ");
    expect(rows[6]?.term).toContain("Vague");
    expect(rows[6]?.value).toBe("3");
  });

  it("prints `—` (never `0/0`) for a level authoring no crates and no delivery", () => {
    const el = mount({ summary: { ...SUMMARY, pickups: null, delivery: null } });
    click(button(el, "DÉTAIL DE LA COURSE"));
    const panel = el.querySelector("dl");
    const values = [...(panel?.querySelectorAll("dd") ?? [])].map((d) => d.textContent);
    expect(values[0]).toBe("—");
    expect(values[1]).toBe("—");
    expect(el.textContent).not.toContain("0 / 0");
  });
});

describe("EndScreen — the single non-closing controls block (A7, gate R1)", () => {
  it("(a) activating a control never dismisses", async () => {
    const onRestart = vi.fn();
    const el = mount({ onRestart });
    click(button(el, "DÉTAIL DE LA COURSE"));
    click(button(el, "COPIER MON RAPPORT"));
    // Let the clipboard promise settle inside act() before asserting.
    await act(async () => {
      await Promise.resolve();
    });
    expect(onRestart).not.toHaveBeenCalled();
  });

  it("(b) a near-miss tap in the block's inert padding never dismisses", () => {
    const onRestart = vi.fn();
    const el = mount({ onRestart });
    // A tap that hits the block itself and no control IS the near-miss case
    // (spec D3.5.2) — the one a per-button stopPropagation would let through.
    click(controlsBlock(el));
    expect(onRestart).not.toHaveBeenCalled();
  });

  it("(b bis) the headline row and the open detail panel are inside the block", () => {
    const onRestart = vi.fn();
    const el = mount({ onRestart });
    click(button(el, "DÉTAIL DE LA COURSE"));
    click(el.querySelector("dl"));
    click(controlsBlock(el).firstElementChild);
    expect(onRestart).not.toHaveBeenCalled();
  });

  it("(c) a tap outside the block still dismisses — AC9 keeps its single action", () => {
    const onRestart = vi.fn();
    const el = mount({ onRestart });
    const title = [...el.querySelectorAll("div")].find(
      (d) => d.textContent === "LE LIVREUR DU 19ÈME INTERPELLÉ",
    );
    click(title);
    expect(onRestart).toHaveBeenCalledOnce();
  });
});

describe("EndScreen — copier mon rapport (A4, A5)", () => {
  function stubClipboard(impl: () => Promise<void>): void {
    setClipboard({ writeText: vi.fn(impl) });
  }

  it("announces the copy in an aria-live region, not by the label swap alone", async () => {
    stubClipboard(() => Promise.resolve());
    const el = mount();
    click(button(el, "COPIER MON RAPPORT"));
    await act(async () => {
      await Promise.resolve();
    });
    const live = el.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain("Rapport copié");
    expect(button(el, "RAPPORT COPIÉ")).toBeDefined();
  });

  it("falls back to a pre-selected read-only textarea when the write rejects", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    const el = mount();
    click(button(el, "COPIER MON RAPPORT"));
    await act(async () => {
      await Promise.resolve();
    });
    const textarea = el.querySelector("textarea");
    expect(textarea).not.toBeNull();
    expect(textarea?.readOnly).toBe(true);
    expect(textarea?.value).toContain("muf.run-report");
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain(
      "Copie automatique indisponible",
    );
  });

  it("never leaks the player byline into the payload (gate A1)", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    localStorage.setItem("muf_player_name", "DJ MEHDI");
    const el = mount();
    click(button(el, "COPIER MON RAPPORT"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(el.querySelector("textarea")?.value).not.toContain("DJ MEHDI");
    localStorage.removeItem("muf_player_name");
  });
});
