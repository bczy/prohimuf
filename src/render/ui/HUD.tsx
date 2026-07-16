import type { JSX } from "react";
import type { Phase } from "@game/types/gameState";
// Single source of truth for the delivery phase: the game type (no render-side dup).
import type { DeliveryPhase } from "@game/types/delivery";
import type { QtePhase } from "@game/types/hostageQte";
import { STOCK, INK, MARK, ACID } from "@render/ui/print";

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

/** Hostage-taker QTE state surfaced to the DOM HUD (ADR-0030), read from the state ref. */
export interface HudHostageQte {
  phase: QtePhase;
  captorHp: number;
  captorHpMax: number;
  hostageHp: number;
  hostageHpMax: number;
  windowRemaining: number;
  windowSeconds: number;
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
 */

const DISPLAY_FONT = "'Impact', 'Arial Narrow', sans-serif";
const MONO_FONT = "'Courier New', Courier, monospace";

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

const hudStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  pointerEvents: "none",
  userSelect: "none",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "6px 12px",
  background: STOCK.shell,
  borderBottom: `2px solid ${INK.black}`,
  fontFamily: DISPLAY_FONT,
  letterSpacing: "0.08em",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: INK.black,
  opacity: 0.7,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  fontFamily: MONO_FONT,
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: "22px",
  color,
  lineHeight: 1,
});

// A stamped paper chip for transient call-outs — reads over any scene, zero glow.
const chipStyle: React.CSSProperties = {
  background: STOCK.shell,
  border: `2px solid ${INK.black}`,
  padding: "6px 12px",
  fontFamily: DISPLAY_FONT,
};

const targetRingStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
};

const arrowWrapStyle: React.CSSProperties = {
  position: "fixed",
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const arrowCoreStyle: React.CSSProperties = {
  position: "relative",
  width: 34,
  height: 34,
  // Raised from 0.28: off-screen arrows overlay the 3D scene and visibility was
  // the complaint. Acid-yellow fill + black keyline reads on dark and light facades.
  opacity: 0.35,
  transition: "opacity 120ms ease, transform 120ms ease",
};

const activeArrowStyle: React.CSSProperties = {
  opacity: 1,
};

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
      style={{
        ...arrowCoreStyle,
        transform: `${rotation}${active ? " scale(1.12)" : ""}`,
        ...(active ? activeArrowStyle : null),
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
  const captorFill =
    qte !== undefined && qte.captorHpMax > 0
      ? Math.max(0, Math.min(1, qte.captorHp / qte.captorHpMax))
      : 0;
  const countdownFill =
    qte !== undefined && qte.windowSeconds > 0
      ? Math.max(0, Math.min(1, qte.windowRemaining / qte.windowSeconds))
      : 0;

  return (
    <>
      <div style={hudStyle}>
        <div style={itemStyle}>
          <span style={labelStyle}>score</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={valueStyle(INK.full)}>{String(data.score).padStart(4, "0")}</span>
            {data.isHighScore === true && (
              <span
                style={{
                  fontSize: "9px",
                  color: MARK.green,
                  fontFamily: MONO_FONT,
                  letterSpacing: "0.1em",
                }}
              >
                ★HI
              </span>
            )}
          </div>
        </div>
        {data.levelName !== undefined && (
          <div style={itemStyle}>
            <span style={labelStyle}>niveau</span>
            <span
              style={{
                fontSize: "12px",
                color: INK.black,
                fontFamily: MONO_FONT,
                letterSpacing: "0.05em",
              }}
            >
              {data.levelName}
            </span>
          </div>
        )}
        <div style={itemStyle}>
          <span style={labelStyle}>vague</span>
          <span style={valueStyle(INK.full)}>{data.wave}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>temps</span>
          <span style={valueStyle(timeColor)}>{Math.ceil(data.timeRemaining)}s</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>vies</span>
          <span style={valueStyle(livesColor)}>{"♥".repeat(Math.max(0, data.lives))}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>énergie</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ ...valueStyle(energyHue), fontSize: "18px" }}>
              ⚡{Math.round(energyFill)}
            </span>
            <div
              style={{
                width: 46,
                height: 5,
                border: `1px solid ${INK.black}`,
                background: STOCK.shell,
              }}
            >
              <div
                style={{
                  width: `${String(energyFill)}%`,
                  height: "100%",
                  background: energyHue,
                  transition: "width 120ms linear",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {deliveryPhase === "DELIVERING" && (
        <div
          style={{
            position: "fixed",
            top: 58,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            userSelect: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              ...chipStyle,
              fontSize: "16px",
              letterSpacing: "0.1em",
              color: INK.full,
            }}
          >
            LIVRAISON — PROTÉGEZ LE VÉHICULE !
          </span>
          <div
            style={{
              width: 220,
              height: 12,
              border: `2px solid ${INK.black}`,
              background: STOCK.shell,
            }}
          >
            <div
              style={{
                width: `${String(deliveryFill * 100)}%`,
                height: "100%",
                background: integrityColor(deliveryFill),
                transition: "width 100ms linear",
              }}
            />
          </div>
        </div>
      )}

      {(deliveryPhase === "SUCCESS" || deliveryPhase === "FAILED") && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            userSelect: "none",
            ...chipStyle,
            fontSize: "20px",
            letterSpacing: "0.1em",
            color: deliveryPhase === "SUCCESS" ? MARK.green : MARK.pink,
          }}
        >
          {deliveryPhase === "SUCCESS" ? "LIVRAISON SÉCURISÉE" : "LIVRAISON PERDUE"}
        </div>
      )}

      {qteVisible && qte !== undefined && (
        <>
          {/* Dim wash over the frozen scene — a soft vignette that keeps the
              centred, zoomed captor readable (transparent core). */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse at center, rgba(20,18,16,0) 42%, rgba(20,18,16,0.5) 100%)",
            }}
          />
          {/* Gauges: captor health + shoot-window countdown + hostage-hp pips. */}
          <div
            style={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              userSelect: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ ...labelStyle, color: INK.black, opacity: 0.9 }}>preneur</span>
              <div
                style={{
                  width: 240,
                  height: 12,
                  border: `2px solid ${INK.black}`,
                  background: STOCK.shell,
                }}
              >
                <div
                  style={{
                    width: `${String(captorFill * 100)}%`,
                    height: "100%",
                    background: integrityColor(captorFill),
                    transition: "width 100ms linear",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ ...labelStyle, color: INK.black, opacity: 0.9 }}>
                compte à rebours
              </span>
              <div
                style={{
                  width: 240,
                  height: 10,
                  border: `2px solid ${INK.black}`,
                  background: STOCK.shell,
                }}
              >
                <div
                  style={{
                    width: `${String(countdownFill * 100)}%`,
                    height: "100%",
                    background: integrityColor(countdownFill),
                    transition: "width 100ms linear",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ ...labelStyle, color: INK.black, opacity: 0.9 }}>otage</span>
              <span style={{ fontSize: "18px", color: MARK.pink, letterSpacing: "0.1em" }}>
                {"♥".repeat(Math.max(0, qte.hostageHp))}
                <span style={{ color: INK.black, opacity: 0.3 }}>
                  {"♡".repeat(Math.max(0, qte.hostageHpMax - qte.hostageHp))}
                </span>
              </span>
            </div>
          </div>

          {qte.warning && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  ...chipStyle,
                  padding: "10px 22px",
                  border: `3px solid ${INK.black}`,
                  fontSize: "44px",
                  color: MARK.pink,
                  letterSpacing: "0.12em",
                  transform: "rotate(-4deg)",
                }}
              >
                OTAGE
              </div>
            </div>
          )}

          {(qtePhase === "WON" || qtePhase === "LOST") && (
            // The verdict is the payoff of the whole set-piece: a big centred
            // stamp (same register as the OTAGE warning / end-of-level message)
            // over the zoomed tableau, not a small ticker chip nobody reads.
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  ...chipStyle,
                  padding: "12px 26px",
                  border: `3px solid ${INK.black}`,
                  fontSize: "48px",
                  letterSpacing: "0.12em",
                  transform: "rotate(-4deg)",
                  color: qtePhase === "WON" ? MARK.green : MARK.pink,
                }}
              >
                {qtePhase === "WON" ? "OTAGE SAUVÉE" : "OTAGE PERDUE"}
              </div>
            </div>
          )}
        </>
      )}

      <div style={targetRingStyle}>
        <span
          style={{
            ...arrowWrapStyle,
            top: 52,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <ArrowIndicator direction="up" active={indicator.up} />
        </span>
        <span
          style={{
            ...arrowWrapStyle,
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <ArrowIndicator direction="down" active={indicator.down} />
        </span>
        <span
          style={{
            ...arrowWrapStyle,
            top: "50%",
            left: 8,
            transform: "translateY(-50%)",
          }}
        >
          <ArrowIndicator direction="left" active={indicator.left} />
        </span>
        <span
          style={{
            ...arrowWrapStyle,
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
          }}
        >
          <ArrowIndicator direction="right" active={indicator.right} />
        </span>
      </div>

      {msg !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              ...chipStyle,
              padding: "14px 28px",
              border: `3px solid ${INK.black}`,
              fontSize: "56px",
              color: msg.color,
              letterSpacing: "0.1em",
              transform: "rotate(-3deg)",
            }}
          >
            {msg.text}
          </div>
        </div>
      )}
    </>
  );
}
