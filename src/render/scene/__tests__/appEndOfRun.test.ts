import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";

// Opt into React's act() environment so client-render interaction tests don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import type { HudData } from "@render/ui/HUD";
import type { RunSummary } from "@game/types/runStats";

/**
 * End-of-run persistence effect (`App.tsx`) — review-panel finding A regression.
 *
 * The terminal HUD push is NOT a one-shot: `useGameLoop` keeps ticking after
 * GAME_OVER (its early-return is conditioned on a RESTART INPUT, not on the phase),
 * so a later push — the camera-driven delivery-arrow term alone can trigger one —
 * hands the shell a BRAND-NEW `RunSummary` object carrying the same frozen numbers.
 * With that object (or the freshly-loaded `unlockedLevels` Set) in the effect's deps,
 * the effect re-ran: `saveScore` fired twice (it de-duplicates nothing) and the
 * 1500 ms routing timer was torn down.
 *
 * The subject is the SHELL's effect, so the screens around it are stubbed to their
 * callbacks (each has its own suite) and the R3F chunk is replaced at the `lazy`
 * boundary — the shortest seam that hands the test the HUD push callback.
 */
const saveScore = vi.fn();

vi.mock("@game/systems/highScoreSystem", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  saveScore: (...args: readonly unknown[]) => {
    saveScore(...args);
  },
  // Keeps the run off the NAME_ENTRY branch: the plain, non-deferred save path.
  isHighScore: () => false,
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
  NarrativeScreen: ({ onDone }: { onDone: () => void }) =>
    createElement("button", { type: "button", onClick: onDone }, "NARRATIVE"),
}));

vi.mock("@hooks/useAssetPreloader", () => ({
  useAssetPreloader: () => ({ loaded: 1, total: 1, done: true }),
}));

/** The loop's HUD push, captured from the stub standing in for the R3F canvas. */
let pushHud: ((data: HudData) => void) | null = null;

function CanvasStub({ onHudUpdate }: { onHudUpdate: (data: HudData) => void }): null {
  pushHud = onHudUpdate;
  return null;
}

// `App.tsx` reaches the canvas through `lazy(() => import("./PlayingCanvas"))`
// (ADR-0068), and mocking that chunk module leaves the REAL one loaded through the
// lazy path. The substitution is made at the `lazy` call itself instead; every
// other React export stays the genuine one.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, lazy: () => CanvasStub };
});

import { App } from "../App";

const SUMMARY: RunSummary = {
  score: 4200,
  durationSeconds: 68.4,
  wave: 3,
  endCause: "SANTE",
  pickups: { collected: 3, spawned: 4 },
  delivery: { issue: "INTERROMPUE", integrityPct: 78 },
  heartsLost: { total: 1.5, damage: 0.5, faults: 1, max: 3 },
};

/** A terminal HUD push, with a FRESH summary object each time — as the loop emits it. */
function terminalHud(): HudData {
  return {
    score: 4200,
    lives: 0,
    timeRemaining: 12,
    phase: "GAME_OVER",
    wave: 3,
    energy: 100,
    weapon: { active: "base", stock: Number.POSITIVE_INFINITY },
    weaponEmptyNonce: 0,
    runSummary: { ...SUMMARY },
  };
}

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

/** Boots the shell all the way into PLAYING, where the loop owns the HUD. */
async function mountIntoPlay(): Promise<void> {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(createElement(App));
    await Promise.resolve();
  });
  click(button("ENTER"));
  click(button("PLAY"));
  // Belliard authors a pre-level narrative; its stub button routes on to PLAYING.
  click(button("NARRATIVE"));
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  localStorage.clear();
  saveScore.mockClear();
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

describe("App — end-of-run persistence is armed on the RUN, not on the HUD push", () => {
  it("saves the score ONCE across two terminal pushes, and still routes to END", async () => {
    await mountIntoPlay();
    expect(pushHud).not.toBeNull();
    // Installed only here: the boot path above needs the real clock to settle.
    vi.useFakeTimers();

    act(() => {
      pushHud?.(terminalHud());
    });
    expect(saveScore).toHaveBeenCalledTimes(1);

    // Second terminal push: same frozen numbers, NEW summary identity — exactly
    // what a post-terminal tick emits.
    act(() => {
      pushHud?.(terminalHud());
    });
    expect(saveScore).toHaveBeenCalledTimes(1);

    // …and the routing timer armed by the first push was never torn down by the
    // second: the end screen still arrives on schedule.
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(container?.textContent).toContain("LE LIVREUR DU 19ÈME INTERPELLÉ");
  });
});
