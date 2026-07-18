import type { JSX } from "react";
import type { Phase } from "@game/types/gameState";
// Single source of truth for the delivery phase: the game type (no render-side dup).
import type { DeliveryPhase } from "@game/types/delivery";
import type { QtePhase } from "@game/types/hostageQte";
import { INK, MARK, ACID } from "@render/ui/print";
import styles from "./HUD.module.css";

// Join CSS-module class names. Under `noUncheckedIndexedAccess` a `styles.*` lookup
// is `string | undefined`, so filter before joining (avoids template-literal lint).
const cx = (...names: (string | undefined)[]): string =>
  names.filter((n): n is string => n !== undefined).join(" ");

export interface HudTargetIndicator {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/** Delivery state surfaced to the DOM HUD (read from the state ref, not per frame). */
export interface HudDelivery {
  phase: DeliveryPhase;
  integrity: number;
  integrityMax: number;
}

/**
 * Hostage-taker QTE state surfaced to the DOM HUD (the static duel), read from the
 * state ref. Only the two set-piece stamps remain on the HUD — the "OTAGE" zoom
 * banner (`warning`) and the WON/LOST verdict (`phase`). The captor-HP, countdown
 * and hostage-HP gauges left the screen (UX spec §1): the duel is binary and the
 * sole clock is the blown-peeks count, surfaced diegetically in-world (Flag B),
 * never as a HUD bar.
 */
export interface HudHostageQte {
  phase: QtePhase;
  warning: boolean;
}

export interface HudData {
  score: number;
  lives: number;
  timeRemaining: number;
  phase: Phase;
  wave: number;
  // Continuous energy stat 0–100 (ADR-0030 D5): the hostage taker's bavure /
  // timeout penalties drain it. Read-only view value; the game owns the rule.
  energy: number;
  levelName?: string;
  isHighScore?: boolean;
  targetIndicator?: HudTargetIndicator | undefined;
  delivery?: HudDelivery | undefined;
  hostageQte?: HudHostageQte | undefined;
}

/**
 * In-game HUD — the print system carried into gameplay (ADR-0021 / art-direction §2bis).
 * A solid paper ticker strip in ink, no neon and ZERO glow (no text-shadow, box-shadow
 * or drop-shadow). Urgency is spoken with the semantic marker inks (MARK.*), never light;
 * transient call-outs are stamped paper chips so they read over any scene without a halo.
 *
 * Styling: static structure/typography lives in HUD.module.css referencing the injected
 * print-token CSS vars (ADR-0046). Runtime-computed values (gauge fill %, state-driven
 * inks, arrow rotation, transition durations) stay inline below. The ramp functions are
 * render-side view mapping and stay in TS.
 */

// Integrity gauge: print marker inks shift warm as the vehicle takes damage (no glow).
function integrityColor(fill: number): string {
  if (fill > 0.6) return MARK.green;
  if (fill > 0.3) return MARK.orange;
  return MARK.pink;
}

// Energy gauge (0–100): print marker inks shift warm as the hostage penalties
// drain it (same semantic ink ramp as the integrity gauge — no neon, no glow).
function energyColor(energy: number): string {
  if (energy > 60) return MARK.green;
  if (energy > 30) return MARK.orange;
  return MARK.pink;
}

function phaseMessage(phase: Phase): { text: string; color: string } | null {
  switch (phase) {
    case "GAME_OVER":
      return { text: "— INTERPELLÉ —", color: MARK.pink };
    case "LEVEL_COMPLETE":
      return { text: "— LA RAVE A EU LIEU —", color: MARK.green };
    default:
      return null;
  }
}

function ArrowIndicator({
  direction,
  active,
}: {
  direction: "up" | "down" | "left" | "right";
  active: boolean;
}): JSX.Element {
  const rotation = {
    right: "rotate(0deg)",
    down: "rotate(90deg)",
    left: "rotate(180deg)",
    up: "rotate(270deg)",
  }[direction];

  // Single inline SVG (not the old shaft-span + CSS-border-triangle pair): a CSS
  // triangle can't take an outline, and these arrows need a black keyline to read
  // over the scene. Acid-yellow fill, black keyline — flat, NO blur/glow/shadow.
  return (
    <span
      className={styles.arrowCore}
      style={{
        // Raised opacity from 0.28: off-screen arrows overlay the 3D scene and
        // visibility was the complaint. Acid-yellow fill + black keyline reads on
        // dark and light facades.
        transform: `${rotation}${active ? " scale(1.12)" : ""}`,
        opacity: active ? 1 : 0.35,
        transition: "opacity 120ms ease, transform 120ms ease",
      }}
    >
      {/* display:block — an inline svg sits on the text baseline and drifts off
          the span's geometric centre, which is also the rotation origin. */}
      <svg
        width={34}
        height={34}
        viewBox="0 0 34 34"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <polygon
          points="3,13 18,13 18,7 31,17 18,27 18,21 3,21"
          fill={ACID.yellow}
          stroke={INK.black}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function HUD({ data }: { data: HudData }): JSX.Element {
  const msg = phaseMessage(data.phase);
  const timeColor =
    data.timeRemaining < 20 ? MARK.pink : data.timeRemaining < 40 ? MARK.orange : INK.full;
  const livesColor = data.lives <= 1 ? MARK.pink : INK.full;
  const indicator = data.targetIndicator ?? { up: false, down: false, left: false, right: false };
  const energyFill = Math.max(0, Math.min(100, data.energy));
  const energyHue = energyColor(energyFill);
  const delivery = data.delivery;
  const deliveryPhase = delivery?.phase;
  const deliveryFill =
    delivery !== undefined && delivery.integrityMax > 0
      ? Math.max(0, Math.min(1, delivery.integrity / delivery.integrityMax))
      : 0;

  const qte = data.hostageQte;
  const qtePhase = qte?.phase;
  const qteVisible =
    qtePhase === "ZOOMING" || qtePhase === "ACTIVE" || qtePhase === "WON" || qtePhase === "LOST";

  return (
    <>
      <div className={styles.hud}>
        <div className={styles.item}>
          <span className={styles.label}>score</span>
          <div className={styles.scoreRow}>
            <span className={styles.value}>{String(data.score).padStart(4, "0")}</span>
            {data.isHighScore === true && <span className={styles.hiFlag}>★HI</span>}
          </div>
        </div>
        {data.levelName !== undefined && (
          <div className={styles.item}>
            <span className={styles.label}>niveau</span>
            <span className={styles.levelName}>{data.levelName}</span>
          </div>
        )}
        <div className={styles.item}>
          <span className={styles.label}>vague</span>
          <span className={styles.value}>{data.wave}</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>temps</span>
          <span className={styles.value} style={{ color: timeColor }}>
            {Math.ceil(data.timeRemaining)}s
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>vies</span>
          <span className={styles.value} style={{ color: livesColor }}>
            {"♥".repeat(Math.max(0, data.lives))}
          </span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>énergie</span>
          <div className={styles.energyWrap}>
            <span className={styles.energyValue} style={{ color: energyHue }}>
              ⚡{Math.round(energyFill)}
            </span>
            <div className={styles.energyTrack}>
              <div
                className={styles.gaugeFill}
                style={
                  {
                    "--gauge-fill": `${String(energyFill)}%`,
                    "--gauge-hue": energyHue,
                    transition: "width 120ms linear",
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        </div>
      </div>

      {deliveryPhase === "DELIVERING" && (
        <div className={styles.deliveryBanner}>
          <span className={cx(styles.chip, styles.chipDelivering)}>
            LIVRAISON — PROTÉGEZ LE VÉHICULE !
          </span>
          <div className={styles.deliveryTrack}>
            <div
              className={styles.gaugeFill}
              style={
                {
                  "--gauge-fill": `${String(deliveryFill * 100)}%`,
                  "--gauge-hue": integrityColor(deliveryFill),
                  transition: "width 100ms linear",
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      )}

      {(deliveryPhase === "SUCCESS" || deliveryPhase === "FAILED") && (
        <div
          className={cx(styles.chip, styles.deliveryVerdict)}
          style={{ color: deliveryPhase === "SUCCESS" ? MARK.green : MARK.pink }}
        >
          {deliveryPhase === "SUCCESS" ? "LIVRAISON SÉCURISÉE" : "LIVRAISON PERDUE"}
        </div>
      )}

      {qteVisible && qte !== undefined && (
        <>
          {/* Dim wash over the frozen scene — a soft vignette that keeps the
              centred, zoomed captor readable (transparent core). The bottom-centre
              gauge stack is intentionally GONE (UX spec §1): the sole clock is the
              blown-peeks count, read diegetically in-world (Flag B), no HUD
              surrogate. The rgba is INK-black at partial alpha — a gradient literal
              with no clean token, so it stays inline (not re-declared in CSS). */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse at center, rgba(20,18,16,0) 42%, rgba(20,18,16,0.5) 100%)",
            }}
          />

          {qte.warning && (
            <div className={styles.centerOverlay}>
              <div className={cx(styles.chip, styles.chipOtage)}>OTAGE</div>
            </div>
          )}

          {(qtePhase === "WON" || qtePhase === "LOST") && (
            // The verdict is the payoff of the whole set-piece: a big centred
            // stamp (same register as the OTAGE warning / end-of-level message)
            // over the zoomed tableau, not a small ticker chip nobody reads.
            <div className={styles.centerOverlay}>
              <div
                className={cx(styles.chip, styles.chipVerdict)}
                style={{ color: qtePhase === "WON" ? MARK.green : MARK.pink }}
              >
                {qtePhase === "WON" ? "OTAGE SAUVÉE" : "OTAGE PERDUE"}
              </div>
            </div>
          )}
        </>
      )}

      <div className={styles.targetRing}>
        <span
          className={styles.arrowWrap}
          style={{ top: 52, left: "50%", transform: "translateX(-50%)" }}
        >
          <ArrowIndicator direction="up" active={indicator.up} />
        </span>
        <span
          className={styles.arrowWrap}
          style={{ bottom: 8, left: "50%", transform: "translateX(-50%)" }}
        >
          <ArrowIndicator direction="down" active={indicator.down} />
        </span>
        <span
          className={styles.arrowWrap}
          style={{ top: "50%", left: 8, transform: "translateY(-50%)" }}
        >
          <ArrowIndicator direction="left" active={indicator.left} />
        </span>
        <span
          className={styles.arrowWrap}
          style={{ top: "50%", right: 8, transform: "translateY(-50%)" }}
        >
          <ArrowIndicator direction="right" active={indicator.right} />
        </span>
      </div>

      {msg !== null && (
        <div className={styles.centerOverlay}>
          <div className={cx(styles.chip, styles.chipMessage)} style={{ color: msg.color }}>
            {msg.text}
          </div>
        </div>
      )}
    </>
  );
}
