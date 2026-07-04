import type { JSX } from "react";
import type { Phase } from "@game/types/gameState";
// Single source of truth for the delivery phase: the game type (no render-side dup).
import type { DeliveryPhase } from "@game/types/delivery";

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

export interface HudData {
  score: number;
  lives: number;
  timeRemaining: number;
  phase: Phase;
  wave: number;
  levelName?: string;
  isHighScore?: boolean;
  targetIndicator?: HudTargetIndicator | undefined;
  delivery?: HudDelivery | undefined;
}

// Neon accent colors (guidelines: jaune fluo, rose fuchsia, vert acide, orange brûlé)
const NEON_GREEN = "#39ff14";
const NEON_YELLOW = "#ffe600";
const NEON_PINK = "#ff2d9b";
const NEON_ORANGE = "#ff6600";

// Integrity gauge colour shifts warm as the vehicle takes damage.
function integrityColor(fill: number): string {
  if (fill > 0.6) return NEON_GREEN;
  if (fill > 0.3) return NEON_ORANGE;
  return NEON_PINK;
}

function phaseMessage(phase: Phase): { text: string; color: string } | null {
  switch (phase) {
    case "GAME_OVER":
      return { text: "— INTERPELLÉ —", color: NEON_PINK };
    case "LEVEL_COMPLETE":
      return { text: "— LA RAVE A EU LIEU —", color: NEON_GREEN };
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
  background: "rgba(0,0,0,0.85)",
  borderBottom: `2px solid ${NEON_YELLOW}`,
  fontFamily: "'Impact', 'Arial Narrow', sans-serif",
  letterSpacing: "0.08em",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#888",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  fontFamily: "monospace",
};

const valueStyle = (color: string): React.CSSProperties => ({
  fontSize: "22px",
  color,
  lineHeight: 1,
});

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
  opacity: 0.3,
  filter: "none",
  transition: "opacity 120ms ease, filter 120ms ease",
};

const activeArrowStyle: React.CSSProperties = {
  opacity: 1,
  filter: `drop-shadow(0 0 6px ${NEON_YELLOW}) drop-shadow(0 0 12px ${NEON_ORANGE})`,
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

  return (
    <span
      style={{
        ...arrowCoreStyle,
        transform: rotation,
        ...(active ? activeArrowStyle : null),
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 2,
          top: "50%",
          width: 19,
          height: 8,
          transform: "translateY(-50%)",
          background: NEON_YELLOW,
          borderRadius: 999,
        }}
      />
      <span
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          width: 0,
          height: 0,
          transform: "translateY(-50%)",
          borderTop: "10px solid transparent",
          borderBottom: "10px solid transparent",
          borderLeft: `16px solid ${NEON_YELLOW}`,
        }}
      />
    </span>
  );
}

export function HUD({ data }: { data: HudData }): JSX.Element {
  const msg = phaseMessage(data.phase);
  const timeColor =
    data.timeRemaining < 20 ? NEON_PINK : data.timeRemaining < 40 ? NEON_ORANGE : NEON_GREEN;
  const livesColor = data.lives <= 1 ? NEON_PINK : NEON_YELLOW;
  const indicator = data.targetIndicator ?? { up: false, down: false, left: false, right: false };
  const delivery = data.delivery;
  const deliveryPhase = delivery?.phase;
  const deliveryFill =
    delivery !== undefined && delivery.integrityMax > 0
      ? Math.max(0, Math.min(1, delivery.integrity / delivery.integrityMax))
      : 0;

  return (
    <>
      <div style={hudStyle}>
        <div style={itemStyle}>
          <span style={labelStyle}>score</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={valueStyle(NEON_YELLOW)}>{String(data.score).padStart(4, "0")}</span>
            {data.isHighScore === true && (
              <span
                style={{
                  fontSize: "9px",
                  color: NEON_GREEN,
                  fontFamily: "monospace",
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
                color: "#aaa",
                fontFamily: "monospace",
                letterSpacing: "0.05em",
              }}
            >
              {data.levelName}
            </span>
          </div>
        )}
        <div style={itemStyle}>
          <span style={labelStyle}>vague</span>
          <span style={valueStyle(NEON_GREEN)}>{data.wave}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>temps</span>
          <span style={valueStyle(timeColor)}>{Math.ceil(data.timeRemaining)}s</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>vies</span>
          <span style={valueStyle(livesColor)}>{"♥".repeat(Math.max(0, data.lives))}</span>
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
              fontFamily: "'Impact', 'Arial Narrow', sans-serif",
              fontSize: "18px",
              letterSpacing: "0.1em",
              color: NEON_YELLOW,
              textShadow: `0 0 8px ${NEON_YELLOW}, 0 0 16px ${NEON_ORANGE}`,
            }}
          >
            LIVRAISON — PROTÉGEZ LE VÉHICULE !
          </span>
          <div
            style={{
              width: 220,
              height: 12,
              border: `2px solid ${NEON_YELLOW}`,
              background: "rgba(0,0,0,0.7)",
              boxShadow: `0 0 8px ${NEON_YELLOW}`,
            }}
          >
            <div
              style={{
                width: `${String(deliveryFill * 100)}%`,
                height: "100%",
                background: integrityColor(deliveryFill),
                boxShadow: `0 0 8px ${integrityColor(deliveryFill)}`,
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
            fontFamily: "'Impact', 'Arial Narrow', sans-serif",
            fontSize: "22px",
            letterSpacing: "0.1em",
            color: deliveryPhase === "SUCCESS" ? NEON_GREEN : NEON_PINK,
            textShadow: `0 0 12px ${deliveryPhase === "SUCCESS" ? NEON_GREEN : NEON_PINK}`,
          }}
        >
          {deliveryPhase === "SUCCESS" ? "LIVRAISON SÉCURISÉE" : "LIVRAISON PERDUE"}
        </div>
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
              fontFamily: "'Impact', sans-serif",
              fontSize: "72px",
              color: msg.color,
              letterSpacing: "0.1em",
              textShadow: `0 0 20px ${msg.color}, 0 0 40px ${msg.color}`,
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
