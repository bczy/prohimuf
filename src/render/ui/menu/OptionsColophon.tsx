import { useState } from "react";
import type { JSX } from "react";
import type { Prefs } from "@game/systems/prefsSystem";
import { PaperSheet, STOCK, INK, FONT } from "@render/ui/print";
import { OptionsControls } from "./OptionsControls";
import styles from "./OptionsColophon.module.css";

/**
 * OPTIONS — the OURS / colophon (UX §2.5, deck §4). The zine back page: sliders are
 * inked VU meters, toggles are ballot boxes with an X-stamp. Orange colophon stock
 * (§4.5), zero glow. Owns only the colophon chrome; the ballot/VU rows are the shared
 * `OptionsControls` (ADR-0052 §4). All writes go through the existing `onSave` (Prefs
 * schema byte-unchanged). Copy verbatim from deck §4.
 */

interface OptionsColophonProps {
  prefs: Prefs;
  onSave: (prefs: Prefs) => void;
}

const COLOPHON_LINES = [
  "UNDERGROUND PARIS — fanzine clandestin",
  "Rédaction : DISPATCH · KENZA · MUF",
  "Tirage : 23 exemplaires photocopiés",
  "Ne se vend pas. Ne se jette pas. Se passe.",
  "Ni pub, ni logo, ni adresse.",
] as const;

export function OptionsColophon({ prefs, onSave }: OptionsColophonProps): JSX.Element {
  const [local, setLocal] = useState(prefs);

  function update(patch: Partial<Prefs>): void {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onSave(updated);
  }

  return (
    <PaperSheet
      stock={STOCK.orange}
      fullBleed={false}
      style={{ padding: "18px 20px", fontFamily: FONT.mono, color: INK.black, maxWidth: "560px" }}
    >
      <div className={styles.title}>OURS</div>
      <div className={styles.subtitle}>l'ours du fanzine · réglages</div>

      {/* Colophon body (static block) */}
      <div className={styles.colophon}>
        {COLOPHON_LINES.map((line) => (
          <div key={line} className={styles.colophonLine}>
            {line}
          </div>
        ))}
      </div>

      <OptionsControls prefs={local} onChange={update} />
    </PaperSheet>
  );
}
