import type { JSX } from "react";
import { Overlay } from "./controls/Overlay";
import styles from "./EndScreen.module.css";

interface EndScreenProps {
  phase: "GAME_OVER" | "LEVEL_COMPLETE";
  score: number;
  wave: number;
  onRestart: () => void;
}

export function EndScreen({ phase, score, wave, onRestart }: EndScreenProps): JSX.Element {
  const isGameOver = phase === "GAME_OVER";

  const label = isGameOver ? "— UNE —" : "— SUCCÈS —";
  const title = isGameOver ? "LE LIVREUR DU 19ÈME INTERPELLÉ" : "LA RAVE A EU LIEU";

  return (
    <Overlay onClick={onRestart} className={styles.screen}>
      <div className={styles.grain} />

      <div className={styles.content}>
        <div className={styles.label}>{label}</div>

        <div className={styles.title}>{title}</div>

        <div
          className={styles.score}
        >{`SCORE FINAL : ${String(score)} | VAGUE ${String(wave)}`}</div>

        <div className={styles.prompt}>[ CLIQUER POUR RETOURNER AU MENU ]</div>
      </div>
    </Overlay>
  );
}
