# 0045 — Embedded self-hosted OFL webfonts via a single `FONT` token

- **Status:** Accepted
- **Date:** 2026-07-18
- **Number:** 0045, self-allocated (no `producer` in the loop for this change);
  max committed ADR was 0044 on this branch and `origin/main`. Re-check at merge.

## Context

muf shipped its UI type on **system fonts** — `Impact`/`Arial Narrow` for ransom-note
display, `Courier New` for typewriter info blocks, `cursive` for handwritten annotations —
declared across ~12 render surfaces as duplicated string literals. `docs/art-direction.md`
§Typographie named this a stopgap: the "display webfont" and a "small handwriting webfont"
were both flagged as **fast-follows**, and Impact-as-ransom-substrate + `cursive` were "v1,
weakest CSS gap" placeholders. System fonts also vary per OS, so the house style
("photocopied fanzine B&W + acid neon", 1998 Paris rave; source _Prohibition_ Atari ST 1987) was never rendered as authored on most machines.

Constraints: the game is offline/self-contained — assets are committed, not CDN-loaded;
strict-OFL licensing only; and the mono double-duties as HUD text drawn under the §8 CRT
composite, where small-size legibility is a functional requirement, not just taste.

## Decision

Embed three **SIL OFL 1.1** faces:

- **Display / titres → Rubik Mono One** — geometric mono block, techno-flyer character that
  reads at every size. Bertrand (owner) selected it directly from an 8-face visual
  comparison board, overriding `lead-art`'s original Anton pick (which was a faithful-but-
  invisible Impact substitute); Anton stays in the stack as the near-Impact fallback.
- **Corps / mono → Courier Prime** (400 / 700 / italic-400) — keeps the named typewriter
  identity, a legibility upgrade on system Courier New. Gated by `lead-art` (PASS).
- **Manuscrit → Caveat** — legible felt-tip marker hand. Gated by `lead-art` (PASS).

Mechanics:

- woff2 self-hosted in `src/assets/fonts/` (latin + latin-ext subsets for French accents),
  with `OFL.txt` + `CREDITS.md` for license compliance. No CDN.
- A co-located `fonts.css` (`@font-face`, `font-display: swap`) imported once in
  `src/main.tsx`; Vite fingerprints and bundles the woff2.
- A new **`FONT`** token in `src/render/ui/print/tokens.ts` (`display` / `mono` / `hand`),
  each stack **embedded-first with the former system stack as fallback**. All ~12 scattered
  literals across `src/render/ui/**` now reference `FONT` — single source of truth, matching
  the existing `INK`/`STOCK`/`MARK` token discipline.

Rejected: **Permanent Marker / Rock Salt** for the hand role — Apache-2.0, not OFL.

## Consequences

- **Positive:** house-style type now renders as authored on every OS; one place to change a
  font stack; the two art-direction fast-follows are closed; offline guarantee preserved.
- **Negative:** production bundle grows ~230 KB (10 woff2, gzip-exempt but cache-friendly).
- **Gotcha / follow-up:** Courier Prime's HUD-size legibility under the CRT scanline pass is
  **not** covered by the typographic PASS — it must clear **Gate 4 on real in-game
  screenshots** (§8.5 P5) at the merge panel. If it aliases at ~11px, the HUD-only usage
  switches to the **pre-approved IBM Plex Mono** fallback while Courier Prime stays for
  menu/print blocks. Desktop HUD evidence (1280×800) reads clean; mobile/CRT is the open case.
