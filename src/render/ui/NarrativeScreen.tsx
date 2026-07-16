import { useState, useEffect, useCallback } from "react";
import type { CSSProperties, JSX } from "react";
import type { NarrativeScene } from "@game/systems/narrativeSystem";
import { GestureIcon } from "./GestureIcon";
import { PaperSheet, HalftoneHero, STOCK, INK, MARK, MASTHEAD } from "@render/ui/print";

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
 * Location décor mask (ADR-0023): the halftone facade reads in the upper "letterhead" band
 * and fades to nothing before the transcript, so the briefing text always sits on clean
 * newsprint (lead-art constraint — ink-on-paper, ≥AA). Knocked back via `opacity` so it
 * establishes place without drowning the sprite/text above it. Zero glow (art-direction §2bis).
 * Opacity 0.30 is the lead-art composite-gate number (ADR-0023): a paper-dominant printed ghost,
 * not a photographic wash — measured to keep the transcript ink at AAA on solid newsprint.
 */
const BACKDROP_MASK = "linear-gradient(to bottom, #000 0%, #000 38%, transparent 62%)";
const BACKDROP_OPACITY = 0.3;

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
      <PaperSheet stock={STOCK.shell} style={{ fontFamily: "'Courier New', Courier, monospace" }}>
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
          {/* Location décor (ADR-0023): the level facade rephotocopied to halftone B&W as a
              full-bleed wash BEHIND everything. First child + no z-index, so the masthead,
              illustration slot and transcript (all positioned) paint on top by DOM order.
              `HalftoneHero` forces grayscale(1) — kills the source facade's warm window-glow
              (§2bis). Its facade layer is a CSS background-image, so a 404 leaves at most the
              faint dot-screen grain — never a broken-image glyph, and no coupling to the per-line
              `imageError`. Absent on tutorial scenes. */}
          {scene.backdrop !== undefined && (
            <HalftoneHero
              src={`${import.meta.env.BASE_URL}${scene.backdrop}`}
              pitch={10}
              style={{
                opacity: BACKDROP_OPACITY,
                maskImage: BACKDROP_MASK,
                WebkitMaskImage: BACKDROP_MASK,
              }}
            />
          )}

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
                top: 32,
                left: 16,
                minHeight: 44,
                border: `2px solid ${INK.black}`,
                background: STOCK.shell,
                color: INK.black,
                padding: "10px 20px",
                fontSize: "15px",
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

          {/* Optional illustrative sprite (ADR-0012, D5): the tutorial bestiary panels and the
            illustrated pre/post briefings (ADR-0023). Same BASE_URL interpolation as the backdrop,
            pixelated like in-game sprites. */}
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
                  // La loi de l'imprimé (lead-art gate, ADR-0023): on a briefing that carries a
                  // location décor, grayscale the sprite so it reads as ONE printing with the
                  // halftone facade (kills stray badge/uniform colour, no dot-screen that would
                  // eat the silhouette, no neon rim — §2bis). Gated on `scene.backdrop` so the
                  // décor-less tutorial keeps its sprites byte-identical to before.
                  filter: scene.backdrop !== undefined ? "grayscale(1) contrast(1.05)" : undefined,
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

          {/* Transcript box — the fax/répondeur note, ink on paper. On a backdrop scene the
              ground is forced to SOLID newsprint (lead-art constraint) so the ink text never
              rides over the halftone facade; backdrop-less scenes (tutorial) keep `transparent`
              and are byte-identical to before. */}
          <div
            style={{
              position: "relative",
              margin: "0 0 0 0",
              padding: "24px 32px 48px",
              borderTop: `2px solid ${INK.black}`,
              background: scene.backdrop !== undefined ? STOCK.shell : "transparent",
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

            {/* Continue hint — inked, with a typewriter cursor blink (the one allowed pulse).
                On the final panel the "done" tell is a black-keylined green box accent, not
                green text: mark ink never carries small text (art-direction §2bis). */}
            {!isTyping && (
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 24,
                  fontSize: "11px",
                  color: INK.black,
                  letterSpacing: "0.15em",
                  animation: "blink 1s step-start infinite",
                  ...(done
                    ? {
                        background: MARK.green,
                        border: `1px solid ${INK.black}`,
                        padding: "1px 6px",
                      }
                    : {}),
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
