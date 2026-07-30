import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { act, createElement } from "react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import type { FunnelState, RunSummary } from "@game/types/runStats";
import { useRunReport, COPY_FEEDBACK_MS, type RunReportCopy } from "@hooks/useRunReport";

const SUMMARY: RunSummary = {
  score: 4200,
  durationSeconds: 68.4,
  wave: 3,
  endCause: "SANTE",
  pickups: null,
  delivery: { issue: "REUSSIE", integrityPct: 100 },
  heartsLost: { total: 0, damage: 0, faults: 0, max: 3 },
};

const FUNNEL: FunnelState = {
  titleSeen: true,
  tutorialCleared: false,
  firstDeliveryDone: true,
  belliardCleared: false,
};

/**
 * The clipboard half of the export (story AC5). The three states are the whole
 * contract: a success reverts on its own, a rejection is RECOVERABLE (the payload
 * comes back so the caller can show it), and an absent `navigator.clipboard` — the
 * insecure-context case the file:// preview builds actually hit — is a failure, not
 * a crash and not a silent no-op.
 */
let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
let latest: RunReportCopy | null = null;

function Probe(): null {
  latest = useRunReport(SUMMARY, FUNNEL, "belliard");
  return null;
}

/**
 * Replaces `navigator.clipboard` in place — the lib types declare it non-optional,
 * and "no clipboard at all" (insecure context) is one of the branches under test.
 */
function setClipboard(value: unknown): void {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}

function mount(): void {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(createElement(Probe));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
  latest = null;
  Reflect.deleteProperty(navigator, "clipboard");
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useRunReport", () => {
  it("starts idle and holds no payload", () => {
    setClipboard({ writeText: vi.fn() });
    mount();
    expect(latest?.status).toBe("idle");
    expect(latest?.payload).toBeNull();
  });

  it("copies the serialized report, then reverts to idle after the feedback window", async () => {
    const writeText = vi.fn((_text: string) => Promise.resolve());
    setClipboard({ writeText });
    mount();
    await act(async () => {
      latest?.copy();
      await Promise.resolve();
    });
    expect(latest?.status).toBe("copied");
    const written = writeText.mock.calls[0]?.[0] ?? "";
    expect(JSON.parse(written)).toMatchObject({ schema: "muf.run-report", level: "belliard" });

    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_MS);
    });
    expect(latest?.status).toBe("idle");
    expect(latest?.payload).toBeNull();
  });

  it("hands the payload back on rejection, and stays there (recoverable, never silent)", async () => {
    setClipboard({ writeText: vi.fn(() => Promise.reject(new Error("denied"))) });
    mount();
    await act(async () => {
      latest?.copy();
      await Promise.resolve();
    });
    expect(latest?.status).toBe("failed");
    expect(latest?.payload).toContain("muf.run-report");

    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_MS * 4);
    });
    expect(latest?.status).toBe("failed");
  });

  it("fails over — never throws — when the clipboard API is absent (insecure context)", () => {
    setClipboard(undefined);
    mount();
    act(() => {
      latest?.copy();
    });
    expect(latest?.status).toBe("failed");
    expect(latest?.payload).toContain("muf.run-report");
  });
});
