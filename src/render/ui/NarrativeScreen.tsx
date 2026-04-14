import { useState, useEffect, useCallback } from "react";
import type { JSX } from "react";
import type { NarrativeScene } from "@game/systems/narrativeSystem";

interface Props {
  scene: NarrativeScene;
  onDone: () => void;
  showSkipButton?: boolean;
}

const NEON_YELLOW = "#ffe600";
const NEON_GREEN = "#39ff14";
const CHAR_DELAY_MS = 28;

export function NarrativeScreen({ scene, onDone, showSkipButton = false }: Props): JSX.Element {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);

  const currentLine = scene.lines[lineIndex];
  const fullText = currentLine?.text ?? "";
  const isTyping = charIndex < fullText.length;

  // Typewriter effect
  useEffect(() => {
    if (!isTyping) return;
    const timer = setTimeout(() => {
      setCharIndex((c) => c + 1);
    }, CHAR_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [charIndex, isTyping]);

  const advance = useCallback(() => {
    if (done) {
      onDone();
      return;
    }
    if (isTyping) {
      // Skip to end of current line
      setCharIndex(fullText.length);
      return;
    }
    const nextIdx = lineIndex + 1;
    if (nextIdx >= scene.lines.length) {
      setDone(true);
    } else {
      setLineIndex(nextIdx);
      setCharIndex(0);
    }
  }, [done, isTyping, fullText.length, lineIndex, scene.lines.length, onDone]);

  // Keyboard / click advance
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === " " || e.key === "Enter" || e.key === "Escape") advance();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [advance]);

  const displayedText = fullText.slice(0, charIndex);

  function handleSkip(event: React.MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    onDone();
  }

  return (
    <div
      onClick={advance}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* Scanlines overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
        }}
      />

      {/* Fanzine header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: NEON_YELLOW,
          padding: "3px 12px",
          fontSize: "9px",
          letterSpacing: "0.3em",
          color: "#000",
          textAlign: "center",
        }}
      >
        UNDERGROUND PARIS — FANZINE CLANDESTIN — 1998
      </div>

      {showSkipButton && (
        <button
          type="button"
          onClick={handleSkip}
          style={{
            position: "absolute",
            top: 30,
            left: 16,
            border: `2px solid ${NEON_YELLOW}`,
            background: "rgba(0,0,0,0.88)",
            color: NEON_YELLOW,
            padding: "6px 12px",
            fontSize: "11px",
            letterSpacing: "0.18em",
            fontFamily: "inherit",
            textTransform: "uppercase",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          Passer
        </button>
      )}

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 16,
          display: "flex",
          gap: 6,
        }}
      >
        {scene.lines.map((_, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i <= lineIndex ? NEON_YELLOW : "#333",
            }}
          />
        ))}
      </div>

      {/* Dialogue box */}
      <div
        style={{
          position: "relative",
          margin: "0 0 0 0",
          padding: "24px 32px 48px",
          borderTop: `2px solid ${NEON_YELLOW}`,
          background: "rgba(0,0,0,0.95)",
          minHeight: 160,
        }}
      >
        {/* Speaker name */}
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: NEON_YELLOW,
            marginBottom: 10,
          }}
        >
          {currentLine?.speaker ?? ""}
        </div>

        {/* Text */}
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.55,
            color: "#fff",
            minHeight: 60,
            letterSpacing: "0.02em",
          }}
        >
          {displayedText}
          {isTyping && (
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "1em",
                background: "#fff",
                marginLeft: 2,
                verticalAlign: "text-bottom",
                animation: "blink 0.7s step-start infinite",
              }}
            />
          )}
        </div>

        {/* Continue hint */}
        {!isTyping && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              right: 24,
              fontSize: "11px",
              color: done ? NEON_GREEN : "#555",
              letterSpacing: "0.15em",
              animation: "blink 1s step-start infinite",
            }}
          >
            {done ? "[ JOUER ]" : "[ CONTINUER ]"}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
