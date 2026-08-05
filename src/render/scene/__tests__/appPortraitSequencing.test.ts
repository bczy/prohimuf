import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";

// Opt into React's act() environment so client-render interaction tests don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import type { HudData } from "@render/ui/HUD";
import type { LevelModifier } from "@game/types/levelModifier";
import type { PortraitOutcome } from "@game/types/portraitRobot";

/**
 * THE SHELL'S HALF OF THE INTERSTITIAL SEAM — the receiving-lane tests (hand-off §6.4).
 *
 * The story failed its first panel because four values left `resolvePortraitScene` and
 * three of them had no reader: `scoreDelta` was computed and dropped, `narrativeBeat` was
 * carried and never played, `validatePortrait` had no caller at all. Each of those is a
 * value crossing a lane boundary, and the method fix the architect prescribed is exactly
 * this file: **the receiving lane writes a test that observes the value ON ARRIVAL.**
 *
 * The subject is `App.tsx`'s sequencing, so the scene itself is stubbed down to its
 * output — a `LevelModifier` handed to `onDone`. The scene's own behaviour has its own
 * suites; what is proven here is that the shell SPENDS what the scene produces.
 */
const saveScore = vi.fn();

/** The board threshold for this suite: 5000 points. 4200 misses it; 4200 + 1500 clears it. */
const QUALIFYING_SCORE = 5000;

vi.mock("@game/systems/highScoreSystem", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  saveScore: (...args: readonly unknown[]) => {
    saveScore(...args);
  },
  isHighScore: (_id: string, score: number) => score >= QUALIFYING_SCORE,
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

// The narrative stub prints the SCENE ID it was handed: that is how "the shell picked
// the beat by key" is observed rather than asserted about (finding B3).
vi.mock("@render/ui/NarrativeScreen", () => ({
  NarrativeScreen: ({ scene, onDone }: { scene: { id: string }; onDone: () => void }) =>
    createElement("button", { type: "button", onClick: onDone }, `NARRATIVE:${scene.id}`),
}));

vi.mock("@render/ui/EndScreen", () => ({
  EndScreen: ({ onRestart }: { onRestart: () => void }) =>
    createElement("button", { type: "button", onClick: onRestart }, "BACK_TO_MENU"),
}));

vi.mock("@render/ui/NameEntryScreen", () => ({
  NameEntryScreen: ({ onSkip }: { onSkip: () => void }) =>
    createElement("button", { type: "button", onClick: onSkip }, "NAME_ENTRY"),
}));

/** The verdict the stubbed scene hands back — set per test. */
let nextModifier: LevelModifier = {
  scoreDelta: 0,
  energyDelta: 0,
  firstWaveDelaySeconds: 0,
  narrativeBeat: null,
};

vi.mock("@render/ui/portrait/PortraitRobotPhase", () => ({
  PortraitRobotPhase: ({ onDone }: { onDone: (m: LevelModifier) => void }) =>
    createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          onDone(nextModifier);
        },
      },
      "PORTRAIT_DONE",
    ),
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

/** A LEVEL_COMPLETE push worth 4200 — below the board on its own. */
function wonHud(): HudData {
  return {
    score: 4200,
    lives: 2,
    timeRemaining: 12,
    phase: "LEVEL_COMPLETE",
    wave: 3,
    energy: 100,
    weapon: { active: "base", stock: Number.POSITIVE_INFINITY },
    weaponEmptyNonce: 0,
    runSummary: {
      score: 4200,
      durationSeconds: 68.4,
      wave: 3,
      endCause: "QUOTA",
      pickups: { collected: 3, spawned: 4 },
      delivery: { issue: "REUSSIE", integrityPct: 100 },
      heartsLost: { total: 0, damage: 0, faults: 0, max: 3 },
    },
  };
}

function modifierFor(outcome: PortraitOutcome): LevelModifier {
  return {
    scoreDelta: outcome === "IDENTIFIED" ? 1500 : outcome === "PARTIAL" ? 400 : 0,
    energyDelta: outcome === "FAILED" ? -20 : 0,
    firstWaveDelaySeconds: outcome === "IDENTIFIED" ? 20 : outcome === "PARTIAL" ? 10 : 0,
    narrativeBeat: outcome,
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
  click(button("NARRATIVE:belliard_pre"));
  await act(async () => {
    await Promise.resolve();
  });
}

/** Win the level, sit through the post-level scene, and land in the portrait phase. */
async function reachPortrait(): Promise<void> {
  await mountIntoPlay();
  vi.useFakeTimers();
  act(() => {
    pushHud?.(wonHud());
  });
  act(() => {
    vi.advanceTimersByTime(1500);
  });
  click(button("NARRATIVE:belliard_post"));
}

beforeEach(() => {
  localStorage.clear();
  saveScore.mockClear();
  pushHud = null;
  nextModifier = modifierFor("FAILED");
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

describe("B1 — the portrait's score reaches the run, and reaches it in time", () => {
  it("does NOT settle the score while a portrait is still ahead", async () => {
    nextModifier = modifierFor("IDENTIFIED");
    await reachPortrait();
    // The run is not over: nothing has been written to the board yet. Settling here is
    // what made a 4/4 worth zero on the high-score table.
    expect(saveScore).not.toHaveBeenCalled();
    expect(container?.textContent).toContain("PORTRAIT_DONE");
  });

  it("an IDENTIFIED that crosses the board threshold routes to NAME_ENTRY", async () => {
    nextModifier = modifierFor("IDENTIFIED");
    await reachPortrait();
    click(button("PORTRAIT_DONE"));
    // 4200 alone misses the board; 4200 + 1500 clears it. The qualification is decided
    // AFTER the scene, which is the whole of the architect's §6.2 arbitration.
    expect(container?.textContent).toContain("NAME_ENTRY");
    // A qualifying run defers its single write to the name entry (ADR-0054 §2).
    expect(saveScore).not.toHaveBeenCalled();
  });

  it("a FAILED leaves the run below the board and writes the un-topped-up total", async () => {
    nextModifier = modifierFor("FAILED");
    await reachPortrait();
    click(button("PORTRAIT_DONE"));
    expect(container?.textContent).not.toContain("NAME_ENTRY");
    expect(saveScore).toHaveBeenCalledTimes(1);
    expect(saveScore.mock.calls[0]?.[1]).toMatchObject({ score: 4200 });
  });

  it("a PARTIAL adds its 400 to the score that is written", async () => {
    nextModifier = modifierFor("PARTIAL");
    await reachPortrait();
    click(button("PORTRAIT_DONE"));
    expect(saveScore).toHaveBeenCalledTimes(1);
    expect(saveScore.mock.calls[0]?.[1]).toMatchObject({ score: 4600 });
  });

  it("settles the score exactly once — the scene cannot pay twice", async () => {
    nextModifier = modifierFor("PARTIAL");
    await reachPortrait();
    click(button("PORTRAIT_DONE"));
    click(button("PORTRAIT_DONE"));
    expect(saveScore).toHaveBeenCalledTimes(1);
  });
});

describe("B3 — the verdict is played back at the next level (AC6, gate A1b)", () => {
  it("a FAILED plays `portrait_robot_failed` before the next level's briefing", async () => {
    nextModifier = modifierFor("FAILED");
    await reachPortrait();
    click(button("PORTRAIT_DONE"));
    // Back to the menu and into the next run: the beat is owed and must be played.
    click(button("BACK_TO_MENU"));
    await act(async () => {
      await Promise.resolve();
    });
    click(button("PLAY"));
    expect(button("NARRATIVE:portrait_robot_failed")).toBeDefined();
    // …and the level's own briefing still follows it, in that order.
    click(button("NARRATIVE:portrait_robot_failed"));
    expect(button("NARRATIVE:belliard_pre")).toBeDefined();
  });

  it("an IDENTIFIED plays its own beat, chosen BY KEY and not by a verdict switch", async () => {
    nextModifier = modifierFor("IDENTIFIED");
    await reachPortrait();
    click(button("PORTRAIT_DONE"));
    // An IDENTIFIED qualifies here, so the run passes through NAME_ENTRY first.
    click(button("NAME_ENTRY"));
    click(button("BACK_TO_MENU"));
    await act(async () => {
      await Promise.resolve();
    });
    click(button("PLAY"));
    expect(button("NARRATIVE:portrait_robot_identified")).toBeDefined();
  });

  it("plays no beat at all on a run that had no scene", async () => {
    await mountIntoPlay();
    expect(button("NARRATIVE:portrait_robot_failed")).toBeUndefined();
  });
});
