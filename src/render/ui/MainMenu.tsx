import { useState } from "react";
import type { JSX } from "react";
import { LEVELS } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import type { Prefs } from "@game/systems/prefsSystem";
import { loadScores } from "@game/systems/highScoreSystem";

const NEON_GREEN = "#39ff14";
const NEON_YELLOW = "#ffe600";
const NEON_PINK = "#ff2d9b";
const NEON_ORANGE = "#ff6600";

type MenuTab = "levels" | "scores" | "prefs";

interface Props {
  unlockedLevels: ReadonlySet<string>;
  prefs: Prefs;
  onPlay: (levelId: string) => void;
  onSavePrefs: (prefs: Prefs) => void;
}

const base: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "#000",
  color: "#fff",
  fontFamily: "'Impact', 'Arial Narrow', sans-serif",
  userSelect: "none",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const scanlines: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
  pointerEvents: "none",
};

function TabBar({
  active,
  onSelect,
}: {
  active: MenuTab;
  onSelect: (t: MenuTab) => void;
}): JSX.Element {
  const tabs: { id: MenuTab; label: string }[] = [
    { id: "levels", label: "NIVEAUX" },
    { id: "scores", label: "SCORES" },
    { id: "prefs", label: "OPTIONS" },
  ];
  return (
    <div style={{ display: "flex", borderBottom: `2px solid ${NEON_YELLOW}` }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            onSelect(t.id);
          }}
          style={{
            flex: 1,
            padding: "10px",
            background: active === t.id ? NEON_YELLOW : "transparent",
            color: active === t.id ? "#000" : "#888",
            border: "none",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "12px",
            letterSpacing: "0.2em",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function LevelCard({
  level,
  unlocked,
  onPlay,
}: {
  level: LevelConfig;
  unlocked: boolean;
  onPlay: () => void;
}): JSX.Element {
  const scores = loadScores(level.id);
  const best = scores[0];

  return (
    <div
      onClick={unlocked ? onPlay : undefined}
      style={{
        border: `1px solid ${unlocked ? NEON_YELLOW : "#333"}`,
        padding: "16px",
        cursor: unlocked ? "pointer" : "default",
        opacity: unlocked ? 1 : 0.4,
        marginBottom: "10px",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              fontSize: "22px",
              color: unlocked ? NEON_YELLOW : "#555",
              letterSpacing: "0.05em",
            }}
          >
            {level.name}
          </div>
          <div
            style={{ fontFamily: "monospace", fontSize: "10px", color: "#666", marginTop: "2px" }}
          >
            {level.district} — {level.year}
          </div>
        </div>
        {!unlocked && (
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#555" }}>VERROUILLÉ</div>
        )}
        {unlocked && best !== undefined && (
          <div style={{ textAlign: "right", fontFamily: "monospace" }}>
            <div style={{ fontSize: "10px", color: "#666" }}>MEILLEUR</div>
            <div style={{ fontSize: "18px", color: NEON_GREEN }}>{best.score}</div>
          </div>
        )}
      </div>
      {unlocked && (
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            gap: "16px",
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#555",
          }}
        >
          <span>⏱ {level.timeSeconds}s</span>
          <span>🎯 {level.enemiesToWin} cibles</span>
          <span
            style={{
              color:
                level.enemySpeedMultiplier > 1.2
                  ? NEON_PINK
                  : level.enemySpeedMultiplier > 1.0
                    ? NEON_ORANGE
                    : NEON_GREEN,
            }}
          >
            {level.enemySpeedMultiplier > 1.2
              ? "DIFFICILE"
              : level.enemySpeedMultiplier > 1.0
                ? "MOYEN"
                : "FACILE"}
          </span>
        </div>
      )}
    </div>
  );
}

function ScoresTab({ unlockedLevels }: { unlockedLevels: ReadonlySet<string> }): JSX.Element {
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[0]?.id ?? "");
  const scores = loadScores(selectedLevel);

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {LEVELS.filter((l) => unlockedLevels.has(l.id)).map((l) => (
          <button
            key={l.id}
            onClick={() => {
              setSelectedLevel(l.id);
            }}
            style={{
              padding: "6px 12px",
              background: selectedLevel === l.id ? NEON_YELLOW : "transparent",
              color: selectedLevel === l.id ? "#000" : "#888",
              border: `1px solid ${selectedLevel === l.id ? NEON_YELLOW : "#333"}`,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.1em",
            }}
          >
            {l.name}
          </button>
        ))}
      </div>

      {scores.length === 0 ? (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            color: "#444",
            textAlign: "center",
            padding: "40px",
          }}
        >
          AUCUN SCORE ENREGISTRÉ
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "monospace",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ color: "#555", borderBottom: "1px solid #222" }}>
              <td style={{ padding: "4px 8px" }}>#</td>
              <td style={{ padding: "4px 8px" }}>SCORE</td>
              <td style={{ padding: "4px 8px" }}>VAGUE</td>
              <td style={{ padding: "4px 8px" }}>DATE</td>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr
                key={i}
                style={{ borderBottom: "1px solid #111", color: i === 0 ? NEON_GREEN : "#aaa" }}
              >
                <td style={{ padding: "6px 8px" }}>{i + 1}</td>
                <td style={{ padding: "6px 8px", fontSize: "16px" }}>{s.score}</td>
                <td style={{ padding: "6px 8px" }}>{s.wave}</td>
                <td style={{ padding: "6px 8px", color: "#555" }}>{s.date.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#888",
          marginBottom: "4px",
          letterSpacing: "0.15em",
        }}
      >
        {label} — {Math.round(value * 100)}%
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => {
          onChange(Number(e.target.value) / 100);
        }}
        style={{ width: "100%", accentColor: NEON_YELLOW }}
      />
    </div>
  );
}

function PrefsTab({ prefs, onSave }: { prefs: Prefs; onSave: (p: Prefs) => void }): JSX.Element {
  const [local, setLocal] = useState(prefs);

  function update(patch: Partial<Prefs>): void {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onSave(updated);
  }

  return (
    <div style={{ padding: "16px", maxWidth: "480px" }}>
      <Slider
        label="VOLUME SFX"
        value={local.soundVolume}
        onChange={(v) => {
          update({ soundVolume: v });
        }}
      />
      <Slider
        label="VOLUME MUSIQUE"
        value={local.musicVolume}
        onChange={(v) => {
          update({ musicVolume: v });
        }}
      />

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#888",
            marginBottom: "8px",
            letterSpacing: "0.15em",
          }}
        >
          VIES — {local.lives}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => {
                update({ lives: n });
              }}
              style={{
                width: "36px",
                height: "36px",
                background: local.lives === n ? NEON_YELLOW : "transparent",
                color: local.lives === n ? "#000" : "#666",
                border: `1px solid ${local.lives === n ? NEON_YELLOW : "#333"}`,
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "14px",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#888",
            marginBottom: "8px",
            letterSpacing: "0.15em",
          }}
        >
          DIFFICULTÉ
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["easy", "normal", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                update({ difficulty: d });
              }}
              style={{
                padding: "8px 16px",
                background: local.difficulty === d ? NEON_YELLOW : "transparent",
                color: local.difficulty === d ? "#000" : "#666",
                border: `1px solid ${local.difficulty === d ? NEON_YELLOW : "#333"}`,
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              {d === "easy" ? "FACILE" : d === "normal" ? "NORMAL" : "DIFFICILE"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MainMenu({ unlockedLevels, prefs, onPlay, onSavePrefs }: Props): JSX.Element {
  const [tab, setTab] = useState<MenuTab>("levels");

  return (
    <div style={base}>
      <div style={scanlines} />

      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid #222`,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontFamily: "Impact",
            fontSize: "32px",
            color: "#fff",
            textShadow: `2px 2px 0 ${NEON_YELLOW}`,
          }}
        >
          MUF
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#555",
            letterSpacing: "0.3em",
          }}
        >
          UNDERGROUND PARIS — 1998
        </div>
      </div>

      <TabBar active={tab} onSelect={setTab} />

      <div style={{ flex: 1, overflowY: "auto", padding: tab === "levels" ? "16px" : "0" }}>
        {tab === "levels" && (
          <>
            {LEVELS.map((level) => (
              <LevelCard
                key={level.id}
                level={level}
                unlocked={unlockedLevels.has(level.id)}
                onPlay={() => {
                  onPlay(level.id);
                }}
              />
            ))}
          </>
        )}
        {tab === "scores" && <ScoresTab unlockedLevels={unlockedLevels} />}
        {tab === "prefs" && <PrefsTab prefs={prefs} onSave={onSavePrefs} />}
      </div>
    </div>
  );
}
