import { useState, useEffect, useCallback } from "react";
import type { CSSProperties, JSX } from "react";
import type { NarrativeScene } from "@game/systems/narrativeSystem";
import { GestureIcon } from "./GestureIcon";
import { PaperSheet, STOCK, INK, MARK, MASTHEAD } from "@render/ui/print";

interface Props {
  scene: NarrativeScene;
  onDone: () => void;
  showSkipButton?: boolean;
  /**
   * Label for the final "advance" hint shown when the scene is done. Defaults to
   * "JOUER" (pre/post-level flow, where onDone starts/continues play). The tutorial
   * passes "TERMINER" because its onDone returns to the MENU, not into a level.
   */
  doneLabel?: string;
}

const CHAR_DELAY_MS = 28;

/**
 * The single illustration slot above the dialogue box — shared verbatim by the `image` channel
 * and the code-drawn `gesture` channel so the "same slot" contract holds by construction.
 * Shrinkable in the bottom-anchored `overflow: hidden` column (`minHeight: 0` + `flexShrink: 1`)
 * so the illustration scales down in short landscape instead of clipping at the top; the child's
 * percentage box keeps aspect via `objectFit`/the SVG's `maxHeight`.
 */
const ILLUSTRATION_SLOT_STYLE: CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "center",
  padding: "0 16px 12px",
  minHeight: 0,
  flexShrink: 1,
  maxHeight: "38vh",
};

/**
 * Pre/post-level briefing. Behaviour, scripts, three call sites, typewriter and
 * `Passer`/progress logic are FROZEN (ADR-0021 D5). Only the **visual frame** joins
 * the print system: the dark facade wash → a newsprint répondeur/fax transcript
 * ground (lead-art ruling), scanlines → the paper dot-screen, the neon `#ffe600`
 * rule → an `ink-black` keyline, the glowing hint → an inked hint with a typewriter
 * cursor. Zero glow (art-direction §2bis).
 */
export function NarrativeScreen({
  scene,
  onDone,
  showSkipButton = false,
  doneLabel = "JOUER",
}: Props): JSX.Element {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [imageError, setImageError] = useState(false);

  const currentLine = scene.lines[lineIndex];
  const fullText = currentLine?.text ?? "";
  const isTyping = charIndex < fullText.length;

  // Clear any previous sprite-load failure when the panel changes.
  useEffect(() => {
    setImageError(false);
  }, [lineIndex]);

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
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <PaperSheet
        stock={STOCK.newsprint}
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          {/* Running masthead — one printing across the pre-game surfaces */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              background: "transparent",
              borderBottom: `1px solid ${INK.black}`,
              padding: "4px 12px",
              fontSize: "9px",
              letterSpacing: "0.3em",
              color: INK.black,
              textAlign: "center",
            }}
          >
            {MASTHEAD.running}
          </div>

          {showSkipButton && (
            <button
              type="button"
              onClick={handleSkip}
              style={{
                position: "absolute",
                top: 30,
                left: 16,
                border: `2px solid ${INK.black}`,
                background: STOCK.newsprint,
                color: INK.black,
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

          {/* Progress dots — inked, not neon */}
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
                  background: i <= lineIndex ? INK.black : "transparent",
                  border: `1px solid ${INK.black}`,
                }}
              />
            ))}
          </div>

          {/* Optional illustrative sprite (ADR-0012, D5): only present on tutorial
            panels that reference shipped art; other scenes render exactly as before.
            Same BASE_URL interpolation as the backdrop, pixelated like in-game sprites. */}
          {currentLine?.image !== undefined && !imageError && (
            <div style={ILLUSTRATION_SLOT_STYLE}>
              <img
                // Force remount on sprite change so the previous sprite is never held
                // on screen while the next one decodes (ADR-0012, C1).
                key={currentLine.image}
                src={`${import.meta.env.BASE_URL}${currentLine.image}`}
                alt={currentLine.imageAlt ?? ""}
                onError={() => {
                  // A missing/404 asset (e.g. bad deploy path) must not surface a broken
                  // image icon — hide the illustration and keep the dialogue readable.
                  setImageError(true);
                }}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                  imageRendering: "pixelated",
                }}
              />
            </div>
          )}

          {/* Optional code-drawn animated gesture icon (ADR-0020): shown on the forked control
              panels in the SAME slot `image` uses. The two channels are normally mutually exclusive
              (Lane A guarantees it), but the gate also acts as the image degradation fallback: if a
              panel carries BOTH and the image 404s (`imageError`), the drawable gesture is rendered
              instead of nothing. `GestureKind` is a closed union with an exhaustive icon map, so every
              value draws; an absent gesture skips this slot and the panel degrades to text. When the
              label is missing/empty the slot drops `role="img"` (no empty-labelled image node) and is
              marked `aria-hidden` instead. */}
          {currentLine?.gesture !== undefined &&
            (currentLine.image === undefined || imageError) &&
            ((currentLine.gestureAlt ?? "") !== "" ? (
              <div role="img" aria-label={currentLine.gestureAlt} style={ILLUSTRATION_SLOT_STYLE}>
                <GestureIcon kind={currentLine.gesture} />
              </div>
            ) : (
              <div aria-hidden={true} style={ILLUSTRATION_SLOT_STYLE}>
                <GestureIcon kind={currentLine.gesture} />
              </div>
            ))}

          {/* Transcript box — the fax/répondeur note, ink on paper */}
          <div
            style={{
              position: "relative",
              margin: "0 0 0 0",
              padding: "24px 32px 48px",
              borderTop: `2px solid ${INK.black}`,
              background: "transparent",
              minHeight: 160,
            }}
          >
            {/* Speaker name */}
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.3em",
                color: INK.black,
                fontWeight: 700,
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
                color: INK.black,
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
                    background: INK.black,
                    marginLeft: 2,
                    verticalAlign: "text-bottom",
                    animation: "blink 0.7s step-start infinite",
                  }}
                />
              )}
            </div>

            {/* Continue hint — inked, with a typewriter cursor blink (the one allowed pulse) */}
            {!isTyping && (
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 24,
                  fontSize: "11px",
                  color: done ? MARK.green : INK.black,
                  letterSpacing: "0.15em",
                  animation: "blink 1s step-start infinite",
                }}
              >
                {done ? `[ ${doneLabel} ]` : "[ CONTINUER ]"}
              </div>
            )}
          </div>
        </div>
      </PaperSheet>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
