import { useState } from "react";
import type { JSX } from "react";
import type { LevelConfig } from "@game/levels/levels";
import { loadScores } from "@game/systems/highScoreSystem";
import { Stamp, MarkerCircle, TapeCorner, INK, MARK, MOTION } from "@render/ui/print";
import { difficultyMark } from "./derivations";

/**
 * One rave flyer per level (NIVEAUX). Three artifact modes — playable, tutorial
 * (a hand-marked "mode d'emploi"), and locked (LIGNE FERMÉE). Copy is verbatim from
 * `docs/game-design/pregame-copy-deck.md` §2. Zero glow: state is hand-work (marker
 * circle focus, tape corners, rubber stamps), never light.
 */

interface FlyerCopy {
  readonly crew: string;
  readonly slogan: string;
  readonly dateLine: string;
  readonly zoneLine: string;
  readonly rvLine: string;
  readonly infoLine: string;
  readonly ambiance: string;
}

// Playable flyer copy (deck §2.2–§2.4), keyed by level id.
const PLAYABLE_COPY: Record<string, FlyerCopy> = {
  belliard: {
    crew: "SPIRALE 23",
    slogan: "LE SON MONTE PAR LES TOITS",
    dateLine: "SAM. → DIM. · 23H → ?",
    zoneLine: "QUELQUE PART DANS LE 19e",
    rvLine: "RV : SUR L'INFO-LINE",
    infoLine: "08 36 23 19 98",
    ambiance: "AMBIANCE : ÇA ROULE",
  },
  stalingrad: {
    crew: "KANAL SYSTEM",
    slogan: "UN ENTREPÔT · UN MUR DE SON",
    dateLine: "NUIT ENTIÈRE · 00H → AUBE",
    zoneLine: "BORDS DU CANAL · 19e",
    rvLine: "RV : SUR L'INFO-LINE",
    infoLine: "08 36 23 95 19",
    ambiance: "AMBIANCE : CHAUD",
  },
  vitry: {
    crew: "NADIR 94",
    slogan: "AU PIED DES BARRES · SON MAXIMAL",
    dateLine: "JUSQU'AU LEVER DU JOUR",
    zoneLine: "VAL-DE-MARNE · 94 · TU CONNAIS ?",
    rvLine: "RV : SUR L'INFO-LINE",
    infoLine: "08 36 23 94 09",
    ambiance: "AMBIANCE : BRÛLANT",
  },
};

// Tutorial substitutions (deck §2.1) — no info-line, no stats.
const TUTORIAL_COPY = {
  stamp: "REPÉRAGE",
  handNote: "ta première — lis tout — D.",
  crew: "SANS SYSTÈME · AVANT LE SON",
  rvLine: "RV : ici, maintenant",
  noLine: "pas besoin d'appeler",
  badge: "TUTORIEL",
} as const;

// Locked flyer copy (deck §2.5) — most flavour withheld; crew stays legible.
const LOCKED_COPY = {
  badge: "LIGNE FERMÉE",
  dateLine: "DATE À VENIR",
  rvLine: "RV : INCONNU",
  infoLine: "08 36 · · · · · — LIGNE MUETTE",
  overlay: "PAS ENCORE POUR TOI",
  helper: "la ligne ouvre quand la précédente est bouclée",
} as const;

const HEADLINE_FONT = "'Impact', 'Arial Narrow', sans-serif";
const BODY_FONT = "'Courier New', Courier, monospace";

interface LevelFlyerProps {
  level: LevelConfig;
  unlocked: boolean;
  stock: string;
  restRotationDeg: number;
  jitterPx: number;
  focused: boolean;
  shaking: boolean;
  tabIndex: number;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
}

function InfoRow({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ fontFamily: BODY_FONT, fontSize: "11px", color: INK.black, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export function LevelFlyer({
  level,
  unlocked,
  stock,
  restRotationDeg,
  jitterPx,
  focused,
  shaking,
  tabIndex,
  onSelect,
  onKeyDown,
  onFocus,
  registerRef,
}: LevelFlyerProps): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const isTutorial = level.kind === "tutorial";
  const pulled = focused || hovered;

  // Best score read — byte-identical to the shipped LevelCard: only for unlocked,
  // non-tutorial levels (ADR-0012 A2).
  const best = isTutorial || !unlocked ? undefined : loadScores(level.id)[0];

  const rotation = pulled || !unlocked ? 0 : restRotationDeg;
  const translateX = pulled ? 0 : jitterPx;

  const outer: React.CSSProperties = {
    position: "relative",
    background: stock,
    color: INK.black,
    padding: "16px 18px",
    // Extra vertical gap so the tilted flyers' corners never crowd/overlap the
    // neighbour's edge in the pile (lead-art Gate 4 note).
    marginBottom: "22px",
    minHeight: "72px",
    outline: "none",
    cursor: unlocked ? "pointer" : "default",
    transform: `translateX(${String(translateX)}px) translateY(${String(pulled ? -4 : 0)}px) rotate(${String(rotation)}deg) scale(${String(pulled ? 1.02 : 1)})`,
    transformOrigin: "center",
    transition: `transform ${String(MOTION.flyerPull)}ms ease-out`,
    boxShadow: "none",
    animation: shaking ? `mufLockedShake ${String(MOTION.lockedShakeMs)}ms ease-in-out` : undefined,
  };

  return (
    <MarkerCircle active={focused} ink={INK.black}>
      <div
        ref={registerRef}
        role="button"
        aria-disabled={!unlocked}
        tabIndex={tabIndex}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
        style={{
          ...outer,
          opacity: unlocked ? 1 : 0.85,
          filter: unlocked ? "none" : "grayscale(1)",
        }}
        className="muf-anim"
      >
        {pulled && unlocked && <TapeCorner />}

        {isTutorial ? (
          <>
            <Stamp label={TUTORIAL_COPY.stamp} ink={INK.full} shape="box" />
            <div
              style={{
                fontFamily: HEADLINE_FONT,
                fontSize: "26px",
                letterSpacing: "0.04em",
                marginTop: "6px",
              }}
            >
              {level.name}
            </div>
            <div
              style={{
                fontFamily: "cursive, 'Courier New', monospace",
                fontStyle: "italic",
                fontSize: "13px",
                margin: "6px 0",
              }}
            >
              {TUTORIAL_COPY.handNote}
            </div>
            <InfoRow>{TUTORIAL_COPY.crew}</InfoRow>
            <InfoRow>{TUTORIAL_COPY.rvLine}</InfoRow>
            <div
              style={{
                fontFamily: BODY_FONT,
                fontSize: "11px",
                color: INK.black,
                textDecoration: "line-through",
                marginTop: "2px",
              }}
            >
              {TUTORIAL_COPY.noLine}
            </div>
            <div style={{ marginTop: "8px" }}>
              <Stamp label={TUTORIAL_COPY.badge} ink={INK.black} shape="oval" />
            </div>
          </>
        ) : unlocked ? (
          <PlayableBody level={level} best={best?.score} />
        ) : (
          <LockedBody level={level} />
        )}
      </div>
      <style>{`
        @keyframes mufLockedShake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          50% { transform: translateX(3px); }
          75% { transform: translateX(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .muf-anim { transition: none !important; animation: none !important; }
        }
      `}</style>
    </MarkerCircle>
  );
}

function PlayableBody({
  level,
  best,
}: {
  level: LevelConfig;
  best: number | undefined;
}): JSX.Element {
  const copy = PLAYABLE_COPY[level.id];
  const mark = difficultyMark(level.enemySpeedMultiplier);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: HEADLINE_FONT, fontSize: "20px", letterSpacing: "0.06em" }}>
            {copy?.crew ?? level.district}
          </div>
          <div
            style={{
              fontFamily: HEADLINE_FONT,
              fontSize: "26px",
              letterSpacing: "0.03em",
              marginTop: "2px",
            }}
          >
            {level.name}
          </div>
        </div>
        {best !== undefined && (
          <MarkerCircle active ink={MARK.green}>
            <div style={{ fontFamily: BODY_FONT, textAlign: "center", padding: "2px 6px" }}>
              <div style={{ fontSize: "9px", color: INK.black }}>RECORD</div>
              <div style={{ fontSize: "18px", color: INK.black }}>{best}</div>
            </div>
          </MarkerCircle>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", margin: "8px 0" }}>
        <Stamp label={mark.label} ink={mark.ink} shape="box" />
        {copy !== undefined && (
          <span style={{ fontFamily: BODY_FONT, fontSize: "12px", fontWeight: 700 }}>
            {copy.ambiance}
          </span>
        )}
      </div>

      {copy !== undefined && (
        <>
          <div
            style={{ fontFamily: BODY_FONT, fontSize: "12px", fontWeight: 700, margin: "4px 0" }}
          >
            {copy.slogan}
          </div>
          <InfoRow>{copy.dateLine}</InfoRow>
          <InfoRow>{copy.zoneLine}</InfoRow>
          <InfoRow>{copy.rvLine}</InfoRow>
          <InfoRow>☎ {copy.infoLine}</InfoRow>
        </>
      )}

      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "8px",
          fontFamily: BODY_FONT,
          fontSize: "11px",
        }}
      >
        <span>⏱ {level.timeSeconds} s</span>
        <span>{level.enemiesToWin} cibles</span>
      </div>
    </>
  );
}

function LockedBody({ level }: { level: LevelConfig }): JSX.Element {
  const copy = PLAYABLE_COPY[level.id];

  return (
    <>
      {/* Crew name stays legible; the rest is the tear (deck §2.5). */}
      <div style={{ fontFamily: HEADLINE_FONT, fontSize: "20px", letterSpacing: "0.06em" }}>
        {copy?.crew ?? level.district}
      </div>
      <div
        style={{
          fontFamily: HEADLINE_FONT,
          fontSize: "24px",
          letterSpacing: "0.03em",
          marginTop: "2px",
        }}
      >
        {level.name}
      </div>
      <div style={{ margin: "8px 0" }}>
        <Stamp label={LOCKED_COPY.badge} ink={INK.black} shape="diagonal" struck />
      </div>
      <InfoRow>{LOCKED_COPY.dateLine}</InfoRow>
      <InfoRow>{LOCKED_COPY.rvLine}</InfoRow>
      <InfoRow>☎ {LOCKED_COPY.infoLine}</InfoRow>
      <div style={{ marginTop: "8px" }}>
        <Stamp label={LOCKED_COPY.overlay} ink={INK.full} shape="diagonal" />
      </div>
      <div style={{ fontFamily: BODY_FONT, fontSize: "10px", color: INK.black, marginTop: "6px" }}>
        {LOCKED_COPY.helper}
      </div>
    </>
  );
}
