import type { CSSProperties, JSX } from "react";
import styles from "./HalftoneHero.module.css";

export interface HalftoneHeroProps {
  /** A `BASE_URL`-prefixed facade PNG path. */
  src: string;
  /** Hero dot pitch, 8–12px (default 10). */
  pitch?: number;
  style?: CSSProperties;
}

/**
 * A facade PNG rephotocopied to pure B&W: `grayscale(1) contrast(2.2) brightness(1.1)`
 * (grayscale(1) FIRST — any surviving warm window-glow reintroduces glow on a menu and
 * is a FAIL, art-direction §2bis) under a blown-up hero halftone dot screen. Absolutely
 * positioned to fill its container by default; the caller layers content above it.
 */
export function HalftoneHero({ src, pitch = 10, style }: HalftoneHeroProps): JSX.Element {
  const dotCore = (pitch * 0.24).toFixed(2);
  const dotEdge = (pitch * 0.32).toFixed(2);
  const pitchPx = `${pitch.toString()}px`;

  // CSS custom properties for pitch-derived dot-screen gradient and size.
  const heroCssVars: CSSProperties = {
    ...style,
  };

  const photoCssVars: CSSProperties = {
    "--halftone-photo-bg": `url('${src}')`,
  } as CSSProperties;

  const dotsCssVars: CSSProperties = {
    "--halftone-dots-bg": `radial-gradient(circle, rgba(20,18,16,0.55) ${dotCore}px, transparent ${dotEdge}px)`,
    "--halftone-dots-size": `${pitchPx} ${pitchPx}`,
  } as CSSProperties;

  return (
    <div aria-hidden={true} className={styles.hero} style={heroCssVars}>
      <div className={styles.photo} style={photoCssVars} />
      <div className={styles.dots} style={dotsCssVars} />
    </div>
  );
}
