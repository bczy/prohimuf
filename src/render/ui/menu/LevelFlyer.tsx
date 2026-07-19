import { useState } from "react";
import type { JSX } from "react";
import type { LevelConfig } from "@game/levels/levels";
import { loadScores } from "@game/systems/highScoreSystem";
import { Stamp, MarkerCircle, TapeCorner, INK, MARK, MOTION } from "@render/ui/print";
import { cx } from "../controls";
import { difficultyMark } from "./derivations";
import styles from "./LevelFlyer.module.css";

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
  return <div className={styles.infoRow}>{children}</div>;
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

  // Runtime-driven only; static box/typography live in styles.flyer.
  const dynamic: React.CSSProperties = {
    background: stock,
    cursor: unlocked ? "pointer" : "default",
    transform: `translateX(${String(translateX)}px) translateY(${String(pulled ? -4 : 0)}px) rotate(${String(rotation)}deg) scale(${String(pulled ? 1.02 : 1)})`,
    transition: `transform ${String(MOTION.flyerPull)}ms ease-out`,
    animation: shaking ? `mufLockedShake ${String(MOTION.lockedShakeMs)}ms ease-in-out` : undefined,
    opacity: unlocked ? 1 : 0.85,
    filter: unlocked ? "none" : "grayscale(1)",
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
        style={dynamic}
        className={cx(styles["muf-anim"], styles.flyer)}
      >
        {pulled && unlocked && <TapeCorner />}

        {isTutorial ? (
          <>
            <Stamp label={TUTORIAL_COPY.stamp} ink={INK.full} shape="box" />
            <div className={styles.tutorialName}>{level.name}</div>
            <div className={styles.handNote}>{TUTORIAL_COPY.handNote}</div>
            <InfoRow>{TUTORIAL_COPY.crew}</InfoRow>
            <InfoRow>{TUTORIAL_COPY.rvLine}</InfoRow>
            <div className={styles.strike}>{TUTORIAL_COPY.noLine}</div>
            <div className={styles.markTop}>
              <Stamp label={TUTORIAL_COPY.badge} ink={INK.black} shape="oval" />
            </div>
          </>
        ) : unlocked ? (
          <PlayableBody level={level} best={best?.score} />
        ) : (
          <LockedBody level={level} />
        )}
      </div>
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
      <div className={styles.playableHead}>
        <div>
          <div className={styles.crew}>{copy?.crew ?? level.district}</div>
          <div className={styles.name}>{level.name}</div>
        </div>
        {best !== undefined && (
          <MarkerCircle active ink={MARK.green}>
            <div className={styles.record}>
              <div className={styles.recordLabel}>RECORD</div>
              <div className={styles.recordValue}>{best}</div>
            </div>
          </MarkerCircle>
        )}
      </div>

      <div className={styles.diffRow}>
        <Stamp label={mark.label} ink={mark.ink} shape="box" />
        {copy !== undefined && <span className={styles.ambiance}>{copy.ambiance}</span>}
      </div>

      {copy !== undefined && (
        <>
          <div className={styles.slogan}>{copy.slogan}</div>
          <InfoRow>{copy.dateLine}</InfoRow>
          <InfoRow>{copy.zoneLine}</InfoRow>
          <InfoRow>{copy.rvLine}</InfoRow>
          <InfoRow>☎ {copy.infoLine}</InfoRow>
        </>
      )}

      <div className={styles.stats}>
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
      <div className={styles.crew}>{copy?.crew ?? level.district}</div>
      <div className={styles.nameLocked}>{level.name}</div>
      <div className={styles.stampBlock}>
        <Stamp label={LOCKED_COPY.badge} ink={INK.black} shape="diagonal" struck />
      </div>
      <InfoRow>{LOCKED_COPY.dateLine}</InfoRow>
      <InfoRow>{LOCKED_COPY.rvLine}</InfoRow>
      <InfoRow>☎ {LOCKED_COPY.infoLine}</InfoRow>
      <div className={styles.markTop}>
        <Stamp label={LOCKED_COPY.overlay} ink={INK.full} shape="diagonal" />
      </div>
      <div className={styles.helper}>{LOCKED_COPY.helper}</div>
    </>
  );
}
