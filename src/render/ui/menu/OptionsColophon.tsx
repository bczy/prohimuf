import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { PaperSheet, STOCK, INK, MarkerCircle, useRovingIndex } from "@render/ui/print";

/**
 * OPTIONS — the OURS / colophon (UX §2.5, deck §4). The zine back page: sliders are
 * inked VU meters, toggles are ballot boxes with an X-stamp. Orange colophon stock
 * (§4.5), zero glow. All writes go through the existing `onSave` (Prefs schema
 * byte-unchanged, AC4). Copy verbatim from deck §4.
 */

interface OptionsColophonProps {
  prefs: Prefs;
  onSave: (prefs: Prefs) => void;
}

const BODY_FONT = "'Courier New', Courier, monospace";
const DISPLAY_FONT = "'Impact', 'Arial Narrow', sans-serif";

const COLOPHON_LINES = [
  "UNDERGROUND PARIS — fanzine clandestin",
  "Rédaction : DISPATCH · KENZA · MUF",
  "Tirage : 23 exemplaires photocopiés",
  "Ne se vend pas. Ne se jette pas. Se passe.",
  "Ni pub, ni logo, ni adresse.",
] as const;

const DIFFICULTIES: readonly { value: Prefs["difficulty"]; label: string }[] = [
  { value: "easy", label: "FACILE" },
  { value: "normal", label: "NORMAL" },
  { value: "hard", label: "DIFFICILE" },
];

const LIVES = [1, 2, 3, 4, 5] as const;

interface BallotOption {
  key: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function OptionsColophon({ prefs, onSave }: OptionsColophonProps): JSX.Element {
  const [local, setLocal] = useState(prefs);

  function update(patch: Partial<Prefs>): void {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onSave(updated);
  }

  const livesOptions: BallotOption[] = LIVES.map((n) => ({
    key: String(n),
    label: String(n),
    selected: local.lives === n,
    onSelect: () => {
      update({ lives: n });
    },
  }));

  const difficultyOptions: BallotOption[] = DIFFICULTIES.map((d) => ({
    key: d.value,
    label: d.label,
    selected: local.difficulty === d.value,
    onSelect: () => {
      update({ difficulty: d.value });
    },
  }));

  return (
    <PaperSheet
      stock={STOCK.orange}
      fullBleed={false}
      style={{ padding: "18px 20px", fontFamily: BODY_FONT, color: INK.black, maxWidth: "560px" }}
    >
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: "30px", letterSpacing: "0.05em" }}>
        OURS
      </div>
      <div style={{ fontSize: "11px", letterSpacing: "0.12em", marginBottom: "14px" }}>
        l'ours du fanzine · réglages
      </div>

      {/* Colophon body (static block) */}
      <div
        style={{ borderLeft: `2px solid ${INK.black}`, paddingLeft: "10px", marginBottom: "18px" }}
      >
        {COLOPHON_LINES.map((line) => (
          <div key={line} style={{ fontSize: "11px", lineHeight: 1.6 }}>
            {line}
          </div>
        ))}
      </div>

      <VuMeter
        label="BRUITS DE RUE"
        hint="tirs & sirènes"
        value={local.soundVolume}
        onChange={(v) => {
          update({ soundVolume: v });
        }}
      />
      <VuMeter
        label="LA SONO"
        hint="le son du système"
        value={local.musicVolume}
        onChange={(v) => {
          update({ musicVolume: v });
        }}
      />

      <BallotRow label="VIES" hint="combien de fois tu te relèves" options={livesOptions} />
      <BallotRow
        label="PRESSION"
        hint="à quel point les flics te collent"
        options={difficultyOptions}
      />
    </PaperSheet>
  );
}

function VuMeter({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}): JSX.Element {
  return (
    <div style={{ marginBottom: "18px", minHeight: "44px" }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.14em", fontWeight: 700 }}>
        {label} — {Math.round(value * 100)}%
      </div>
      <div style={{ fontSize: "9px", letterSpacing: "0.1em", marginBottom: "6px", opacity: 0.8 }}>
        {hint}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => {
          onChange(Number(e.target.value) / 100);
        }}
        style={{ width: "100%", accentColor: INK.black, height: "24px" }}
      />
    </div>
  );
}

function BallotRow({
  label,
  hint,
  options,
}: {
  label: string;
  hint: string;
  options: BallotOption[];
}): JSX.Element {
  const [focusWithin, setFocusWithin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const roving = useRovingIndex(options.length, {
    axis: "horizontal",
    wrap: true,
    onActivate: (i) => {
      options[i]?.onSelect();
    },
  });

  useEffect(() => {
    if (containerRef.current?.contains(document.activeElement)) {
      itemRefs.current[roving.index]?.focus();
    }
  }, [roving.index]);

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.14em", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "9px", letterSpacing: "0.1em", marginBottom: "6px", opacity: 0.8 }}>
        {hint}
      </div>
      <div
        ref={containerRef}
        onFocus={() => {
          setFocusWithin(true);
        }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
            setFocusWithin(false);
          }
        }}
        style={{ display: "flex", gap: "8px" }}
      >
        {options.map((opt, i) => (
          <MarkerCircle key={opt.key} active={focusWithin && roving.index === i} ink={INK.black}>
            <button
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              tabIndex={roving.index === i ? 0 : -1}
              onKeyDown={roving.onKeyDown}
              onFocus={() => {
                roving.setIndex(i);
              }}
              onClick={opt.onSelect}
              style={{
                position: "relative",
                minWidth: "44px",
                height: "44px",
                padding: "0 12px",
                background: "transparent",
                color: INK.black,
                border: `2px solid ${INK.black}`,
                cursor: "pointer",
                fontFamily: BODY_FONT,
                fontSize: "13px",
                letterSpacing: "0.08em",
                fontWeight: opt.selected ? 700 : 400,
              }}
            >
              {opt.label}
              {opt.selected && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    lineHeight: 1,
                    color: INK.full,
                    background: STOCK.orange,
                    border: `1.5px solid ${INK.black}`,
                    borderRadius: "1px",
                    transform: "rotate(-8deg)",
                    pointerEvents: "none",
                  }}
                >
                  ✕
                </span>
              )}
            </button>
          </MarkerCircle>
        ))}
      </div>
    </div>
  );
}
