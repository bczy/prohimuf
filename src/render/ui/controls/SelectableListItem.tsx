import type { ButtonHTMLAttributes, JSX, Ref } from "react";
import { MarkerCircle, INK } from "@render/ui/print";

export interface SelectableListItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Draw the inked focus/selection ellipse (forwarded to MarkerCircle). */
  active: boolean;
  /** Marker ink (default `INK.black` inside MarkerCircle). */
  ink?: string;
  /** Ref to the inner `<button>` (roving surfaces store these to move focus). */
  buttonRef?: Ref<HTMLButtonElement>;
}

/**
 * One roving list row (ADR-0046): a `MarkerCircle`-wrapped `<button>`, the repeated
 * shape behind the MENU sommaire tabs, the SCORES édition switch and the OPTIONS
 * ballot boxes. Owns only the wrapper + button wiring (ref, tabIndex, arrow/enter
 * handlers via `useRovingIndex`); every visual — the tab underline, the bordered box,
 * the ballot X-stamp — stays per-surface through `className`/`children`, so no style
 * is centralised here (nothing to make non-pixel-identical). Zero glow.
 */
export function SelectableListItem({
  active,
  ink = INK.black,
  buttonRef,
  children,
  ...buttonProps
}: SelectableListItemProps): JSX.Element {
  return (
    <MarkerCircle active={active} ink={ink}>
      <button type="button" ref={buttonRef} {...buttonProps}>
        {children}
      </button>
    </MarkerCircle>
  );
}
