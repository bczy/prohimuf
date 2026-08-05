import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import type { HudData } from "@render/ui/HUD";

/**
 * B4a — AN INVALID CATALOGUE SKIPS THE PHASE (ADR-0080 D3).
 *
 * `validatePortrait` existed, was total, was thoroughly tested — and had **no caller in
 * production at all**. The "skip the phase rather than brick the run" decision therefore
 * did not exist, and neither did the `plateChecksum` guard: a catalogue that could not
 * produce a playable board would have opened the scene anyway.
 *
 * The whole point is a NEGATIVE observation, so it needs its own file: the shell memoises
 * the validator's answer for the session, and a suite that asserted both answers would
 * only ever see the first one.
 */
vi.mock("@game/portraits", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  validatePortrait: () => [
    { code: "band-count", severity: "error", field: "bands", message: "stubbed for the test" },
  ],
}));

vi.mock("@render/ui/TitleScreen", () => ({
  TitleScreen: ({ onEnter }: { onEnter: () => void }) =>
    createElement("button", { type: "button", onClick: onEnter }, "ENTER"),
}));

vi.mock("@render/ui/MainMenu", () => ({
  MainMenu: ({ onPlay }: { onPlay: (id: string) => void }) =>
    createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          onPlay("belliard");
        },
      },
      "PLAY",
    ),
}));

vi.mock("@render/ui/NarrativeScreen", () => ({
  NarrativeScreen: ({ scene, onDone }: { scene: { id: string }; onDone: () => void }) =>
    createElement("button", { type: "button", onClick: onDone }, `NARRATIVE:${scene.id}`),
}));

vi.mock("@render/ui/EndScreen", () => ({
  EndScreen: () => createElement("div", null, "END_SCREEN"),
}));

vi.mock("@render/ui/portrait/PortraitRobotPhase", () => ({
  PortraitRobotPhase: () => createElement("div", null, "PORTRAIT_PHASE"),
}));

vi.mock("@hooks/useAssetPreloader", () => ({
  useAssetPreloader: () => ({ loaded: 1, total: 1, done: true }),
}));

let pushHud: ((data: HudData) => void) | null = null;

function CanvasStub({ onHudUpdate }: { onHudUpdate: (data: HudData) => void }): null {
  pushHud = onHudUpdate;
  return null;
}

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, lazy: () => CanvasStub };
});

import { App } from "../App";

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function click(el: Element | null | undefined): void {
  act(() => {
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function button(label: string): HTMLButtonElement | undefined {
  return [...(container?.querySelectorAll("button") ?? [])].find((b) =>
    b.textContent.includes(label),
  );
}

beforeEach(() => {
  localStorage.clear();
  pushHud = null;
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
  localStorage.clear();
  vi.useRealTimers();
});

describe("B4a — validatePortrait has a production caller, and its verdict is honoured", () => {
  it("skips the phase on an error-severity catalogue, and the run continues to the end", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root?.render(createElement(App));
      await Promise.resolve();
    });
    click(button("ENTER"));
    click(button("PLAY"));
    click(button("NARRATIVE:belliard_pre"));
    await act(async () => {
      await Promise.resolve();
    });

    vi.useFakeTimers();
    act(() => {
      pushHud?.({
        score: 4200,
        lives: 2,
        timeRemaining: 12,
        phase: "LEVEL_COMPLETE",
        wave: 3,
        energy: 100,
        weapon: { active: "base", stock: Number.POSITIVE_INFINITY },
        weaponEmptyNonce: 0,
      });
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    click(button("NARRATIVE:belliard_post"));

    const text = container.textContent;
    // The scene never opens…
    expect(text).not.toContain("PORTRAIT_PHASE");
    // …and the run is not stuck: an invalid catalogue costs the FEATURE, never the run.
    // (4200 on an empty board qualifies, so the run lands on the name entry.)
    expect(text).toMatch(/END_SCREEN|ENTRÉE AU CLASSEMENT/);
  });
});
