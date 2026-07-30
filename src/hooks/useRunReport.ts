/**
 * "Copier mon rapport" (story AC5, UX §2) — the clipboard half of the bridge.
 *
 * Pure builders live in `src/game` (`buildRunReport` + `serializeRunReport`); this
 * hook only calls them and talks to `navigator.clipboard`. It never re-implements a
 * field, a unit or a rounding rule, and it holds no network call of any kind
 * (story AC4 — the whole path is `fetch`-free by construction).
 *
 * Three states, no fourth: `idle`, `copied` (a 2.5 s in-place feedback, then back to
 * idle) and `failed` — which is RECOVERABLE, never terminal: the serialized payload
 * is handed back so the caller can reveal it in a pre-selected read-only textarea.
 * A rejection is never a silent no-op and never an uncaught error (UX §2.4).
 */
import { useCallback, useEffect, useState } from "react";
import type { FunnelState, RunSummary } from "@game/types/runStats";
import { buildRunReport, serializeRunReport } from "@game/systems/runReport";

/** How long the in-place "copié" feedback holds before reverting (UX §2.2). */
export const COPY_FEEDBACK_MS = 2500;

export type CopyStatus = "idle" | "copied" | "failed";

export interface RunReportCopy {
  readonly status: CopyStatus;
  /** The serialized report — non-null ONLY while `status === "failed"`. */
  readonly payload: string | null;
  /** Builds, serializes and copies. Safe to call again after a failure (retry). */
  readonly copy: () => void;
}

interface CopyState {
  readonly status: CopyStatus;
  readonly payload: string | null;
  /**
   * Monotonic per successful copy. The 2.5 s feedback timer is keyed on it, so a
   * SECOND copy inside the window re-arms a full window instead of inheriting the
   * remainder of the first (an effect on `status` alone never re-runs: the value
   * is already `"copied"`). UX §2.2 promises the feedback, not a slice of it.
   */
  readonly nonce: number;
}

const IDLE: CopyState = { status: "idle", payload: null, nonce: 0 };

export function useRunReport(
  summary: RunSummary,
  funnel: FunnelState,
  levelId: string,
): RunReportCopy {
  const [state, setState] = useState<CopyState>(IDLE);

  const copy = useCallback((): void => {
    const payload = serializeRunReport(buildRunReport(summary, funnel, levelId));
    try {
      // `navigator.clipboard` is absent in an insecure context (file:// previews) —
      // the lib types declare it as always present, which is a lie on the platforms
      // this fallback exists for, hence the narrowing cast.
      const { clipboard } = navigator as { clipboard?: Clipboard };
      if (clipboard === undefined) {
        setState((prev) => ({ status: "failed", payload, nonce: prev.nonce }));
        return;
      }
      void clipboard.writeText(payload).then(
        () => {
          setState((prev) => ({ status: "copied", payload: null, nonce: prev.nonce + 1 }));
        },
        () => {
          setState((prev) => ({ status: "failed", payload, nonce: prev.nonce }));
        },
      );
    } catch {
      setState((prev) => ({ status: "failed", payload, nonce: prev.nonce }));
    }
  }, [summary, funnel, levelId]);

  useEffect(() => {
    if (state.status !== "copied") return;
    const timer = setTimeout(() => {
      // Keeps the nonce monotonic across the idle hop so a later copy can never
      // collide with an already-seen (status, nonce) pair.
      setState((prev) => ({ ...IDLE, nonce: prev.nonce }));
    }, COPY_FEEDBACK_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [state.status, state.nonce]);

  return { status: state.status, payload: state.payload, copy };
}
