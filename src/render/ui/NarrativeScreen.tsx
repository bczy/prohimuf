import { useState, useEffect, useCallback } from "react";
import type { JSX } from "react";
import type { NarrativeScene } from "@game/systems/narrativeSystem";
import { GestureIcon } from "./GestureIcon";
import { DiagramIcon } from "./DiagramIcon";
import { PaperSheet, HalftoneHero, STOCK, FONT, MASTHEAD } from "@render/ui/print";
import { cx } from "./controls/cx";
import styles from "./NarrativeScreen.module.css";

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
 * and the code-drawn `gesture` channel so the "same slot" contract holds by construction
 * (now `styles.illustrationSlot`). Shrinkable in the bottom-anchored `overflow: hidden` column
 * (`min-height: 0` + `flex-shrink: 1`) so the illustration scales down in short landscape instead
 * of clipping at the top; the child's percentage box keeps aspect via `object-fit`/the SVG's
 * `max-height`.
 */

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
    <div onClick={advance} className={styles.root}>
      <PaperSheet stock={STOCK.shell} style={{ fontFamily: FONT.mono }}>
        <div className={styles.column}>
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
          <div className={styles.masthead}>{MASTHEAD.running}</div>

          {showSkipButton && (
            <button type="button" onClick={handleSkip} className={styles.skip}>
              Passer
            </button>
          )}

          {/* Progress dots — inked, not neon */}
          <div className={styles.dots}>
            {scene.lines.map((_, i) => (
              <div key={i} className={cx(styles.dot, i <= lineIndex && styles.dotFilled)} />
            ))}
          </div>

          {/* Optional illustrative sprite (ADR-0012, D5): the tutorial bestiary panels and the
            illustrated pre/post briefings (ADR-0023). Same BASE_URL interpolation as the backdrop,
            pixelated like in-game sprites. */}
          {currentLine?.image !== undefined && !imageError && (
            <div className={styles.illustrationSlot}>
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
                className={styles.sprite}
                style={{
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
              <div
                role="img"
                aria-label={currentLine.gestureAlt}
                className={styles.illustrationSlot}
              >
                <GestureIcon kind={currentLine.gesture} />
              </div>
            ) : (
              <div aria-hidden={true} className={styles.illustrationSlot}>
                <GestureIcon kind={currentLine.gesture} />
              </div>
            ))}

          {/* Optional code-drawn animated MECHANIC diagram (sibling of `gesture`): teaches a game
              rule that has no shipped sprite (e.g. the hostage-QTE colour ring). Same slot, same
              mutual-exclusivity as the other channels (only rendered when neither `image` nor
              `gesture` is set). Labelled slot when `diagramAlt` is present, else `aria-hidden`. */}
          {currentLine?.diagram !== undefined &&
            currentLine.image === undefined &&
            currentLine.gesture === undefined &&
            ((currentLine.diagramAlt ?? "") !== "" ? (
              <div
                role="img"
                aria-label={currentLine.diagramAlt}
                className={styles.illustrationSlot}
              >
                <DiagramIcon kind={currentLine.diagram} />
              </div>
            ) : (
              <div aria-hidden={true} className={styles.illustrationSlot}>
                <DiagramIcon kind={currentLine.diagram} />
              </div>
            ))}

          {/* Transcript box — the fax/répondeur note, ink on paper. On a backdrop scene the
              ground is forced to SOLID newsprint (lead-art constraint) so the ink text never
              rides over the halftone facade; backdrop-less scenes (tutorial) keep `transparent`
              and are byte-identical to before. */}
          <div
            className={styles.transcript}
            style={{ background: scene.backdrop !== undefined ? STOCK.shell : "transparent" }}
          >
            {/* Speaker name */}
            <div className={styles.speaker}>{currentLine?.speaker ?? ""}</div>

            {/* Text */}
            <div className={styles.text}>
              {displayedText}
              {isTyping && <span className={styles.caret} />}
            </div>

            {/* Continue hint — inked, with a typewriter cursor blink (the one allowed pulse).
                On the final panel the "done" tell is a black-keylined green box accent, not
                green text: mark ink never carries small text (art-direction §2bis). */}
            {!isTyping && (
              <div className={cx(styles.hint, done && styles.hintDone)}>
                {done ? `[ ${doneLabel} ]` : "[ CONTINUER ]"}
              </div>
            )}
          </div>
        </div>
      </PaperSheet>
    </div>
  );
}
