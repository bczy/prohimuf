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
}

const IDLE: CopyState = { status: "idle", payload: null };

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
        setState({ status: "failed", payload });
        return;
      }
      void clipboard.writeText(payload).then(
        () => {
          setState({ status: "copied", payload: null });
        },
        () => {
          setState({ status: "failed", payload });
        },
      );
    } catch {
      setState({ status: "failed", payload });
    }
  }, [summary, funnel, levelId]);

  useEffect(() => {
    if (state.status !== "copied") return;
    const timer = setTimeout(() => {
      setState(IDLE);
    }, COPY_FEEDBACK_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [state.status]);

  return { status: state.status, payload: state.payload, copy };
}
