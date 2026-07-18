import type { CSSProperties, JSX } from "react";
import { INK, FONT, MASTHEAD, STOCK } from "@render/ui/print";
import { PaperSheet } from "@render/ui/print";

/**
 * Progressive loading screen shown while a screen's asset manifest warms
 * (story-asset-preloading). Presentational only — all progress logic lives in
 * `useAssetPreloader` / `App`.
 *
 * House style = the pre-game print system (ADR-0021 / art-direction §2bis): a
 * newsprint `PaperSheet` with the running masthead, Courier/Impact ink type, and
 * a "SOUS PRESSE" press-sheet metaphor — the bar is a black-keyline rule the ink
 * fills as the tirage is pulled. Zero glow / text-shadow / scanline (banned by
 * §2bis; PaperSheet supplies the dot-screen + toner texture).
 */

const mono = FONT.mono;

interface Props {
  /** What is loading — e.g. "MENU", a level name, or "Tutoriel". */
  label: string;
  /** 0..1 fraction settled. */
  progress: number;
}

function infoStyle(fontSize: string, letterSpacing: string, marginTop = 0): CSSProperties {
  return {
    fontFamily: mono,
    fontSize,
    letterSpacing,
    color: INK.black,
    marginTop,
    textTransform: "uppercase",
  };
}

export function LoadingScreen({ label, progress }: Props): JSX.Element {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  // Zero-padded press-run counter reads as a printed folio (e.g. "042 %").
  const folio = String(pct).padStart(3, "0");

  return (
    <PaperSheet stock={STOCK.shell} style={{ userSelect: "none" }}>
      {/* The bar's width tracks real progress; smooth it, but honour reduced-motion
          (the rest of the print system forces its motion tokens to 0 there too). */}
      <style>{`.muf-load-fill{transition:width 0.12s linear}@media (prefers-reduced-motion: reduce){.muf-load-fill{transition:none}}`}</style>

      {/* Masthead strip — printed ink bar (single-sourced running string). */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: INK.full,
          color: STOCK.shell,
          padding: "4px 12px",
          fontFamily: mono,
          fontSize: "10px",
          letterSpacing: "0.28em",
          textAlign: "center",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {MASTHEAD.running}
      </div>

      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "48px 40px",
          boxSizing: "border-box",
        }}
      >
        <div style={infoStyle("11px", "0.4em")}>★ SOUS PRESSE ★</div>

        <div
          style={{
            fontFamily: FONT.display,
            fontSize: "clamp(44px, 8vw, 84px)",
            lineHeight: 0.9,
            letterSpacing: "0.05em",
            color: INK.full,
            marginTop: "8px",
          }}
        >
          CHARGEMENT…
        </div>

        {/* The edition being pulled — target name under an ink rule. */}
        <div style={infoStyle("clamp(12px, 1.8vw, 16px)", "0.22em", 10)}>{label}</div>
        <div
          style={{ width: "min(420px, 80%)", height: 2, background: INK.black, margin: "18px 0" }}
        />

        {/* Press bar — black keyline the ink fills as the tirage is pulled. */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Chargement ${label}`}
          style={{
            width: "min(60vw, 420px)",
            height: "16px",
            border: `2px solid ${INK.black}`,
            background: STOCK.shell,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="muf-load-fill"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: `${String(pct)}%`,
              background: INK.black,
            }}
          />
        </div>

        <div
          style={{
            fontFamily: mono,
            fontSize: "20px",
            letterSpacing: "0.18em",
            color: INK.black,
            marginTop: 14,
          }}
        >
          {folio} %
        </div>
      </div>
    </PaperSheet>
  );
}
