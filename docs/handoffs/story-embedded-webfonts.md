# Story — embedded OFL webfonts

Embed three self-hosted SIL OFL 1.1 faces (Anton / Courier Prime / Caveat) to replace the
system-font stopgaps (Impact / Courier New / cursive) and close the two `docs/art-direction.md`
§Typographie fast-follows (display webfont + handwriting webfont). Single-sourced via a new
`FONT` token. ADR-0045. Branch `claude/game-font-design-c0gk2h`.

## 0/1. INTAKE — Bertrand → orchestrator — 2026-07-18

- claim: Bertrand asked whether a font "made for this game" could be found or generated.
- release: image models don't emit usable font files; scoped to **curating OFL faces**
  (his choice), all three roles (display / mono / hand), self-hosted, offline. Self-allocated
  ADR **0045** (no producer in loop; collision-checked local + origin/main max = 0044).

## ART GATE — lead-art — 2026-07-18

- claim: one OFL face per role + a fallback each, gated against the house style.
- release: **PASS.** Display **Anton** (fb Oswald); mono **Courier Prime** 400/700/ital-400
  (fb IBM Plex Mono); hand **Caveat** (fb Caveat Brush). Flagged & rejected **Permanent
  Marker / Rock Salt** — Apache-2.0, not OFL. Two conditions, neither blocking selection:
  (1) off-license faces rejected; (2) mono HUD-size legibility under the §8 CRT composite is
  NOT covered by this typographic PASS — must clear **Gate-4 on real in-game screenshots** at
  merge, with IBM Plex Mono the pre-approved HUD fallback.

## IMPLEMENTATION — orchestrator (render lane) — 2026-07-18

- woff2 self-hosted in `src/assets/fonts/` (latin + latin-ext subsets), `OFL.txt` + `CREDITS.md`
  for license compliance; `fonts.css` imported once in `src/main.tsx`; new `FONT` token in
  `src/render/ui/print/tokens.ts`; ~12 scattered font-stack literals across `src/render/ui/**`
  rewired to `FONT` (embedded-first, former system stack as fallback).
- File List:
  - `src/assets/fonts/*` (10 woff2, `fonts.css`, `OFL.txt`, `CREDITS.md`) (new)
  - `src/render/ui/print/tokens.ts` (FONT token), `src/main.tsx` (CSS import)
  - `src/render/ui/{HUD,MainMenu,TitleScreen,LoadingScreen,EndScreen,PauseScreen,RotateOverlay,NarrativeScreen}.tsx`
  - `src/render/ui/menu/{LevelFlyer,ScoresUne,OptionsColophon}.tsx`, `src/render/ui/print/Stamp.tsx`
  - `docs/art-direction.md` (§Typographie fast-follows closed), `docs/adr/0045-*.md` (+ regenerated registry)
- checks: `yarn typecheck` clean · `yarn lint` clean (exit 0) · `yarn build` OK (Vite fingerprinted
  all 10 woff2 + bundled `@font-face` CSS).
- verify (Playwright, desktop 1280×800): all 5 faces load (`document.fonts`: Anton 400,
  Courier Prime 400/700/ital, Caveat 400); Anton renders on TITLE "MUF" + loading headlines,
  Courier Prime on body with French accents (PÉRIPHÉRIE / fenêtres / Récupère); in-game HUD
  reached (SCORE/NIVEAU/TEMPS/VIES/ÉNERGIE) — Courier Prime legible on the light HUD strip;
  zero pageerrors, no layout breakage.
  VERDICT: PASS — implementation + runtime verify.

## DISPLAY SWAP — Bertrand (owner) — 2026-07-18

- claim: on the first build Bertrand found the Anton title "barely different" (near-Impact by
  design). Presented an 8-face OFL comparison board rendered on the real "MUF" title.
- release: Bertrand selected **Rubik Mono One** (geometric mono block, techno-flyer character)
  for the display role — owner override of lead-art's Anton pick. Anton removed; Rubik Mono One
  woff2 embedded (latin + latin-ext), `FONT.display` + `fonts.css` + `OFL.txt` + `CREDITS.md` +
  art-direction §Typographie + ADR-0045 updated. Mono (Courier Prime) and hand (Caveat) unchanged.
  VERDICT: owner decision (no gate — Bertrand's direct call supersedes the art gate here).

## STAGE-6 REVIEW PANEL — 2026-07-18

- 4 reviewers in parallel on `git diff origin/main...HEAD` (34 files): code-review(high) ·
  bmad-code-review · bmad-review-edge-case-hunter · security-review. Findings adversarially
  self-verified.
- **No CONFIRMED BLOQUANT/MAJEUR.** Security: supply chain clean (10 woff2 = genuine fonts,
  zero payload; fully self-hosted, no CDN; OFL §2 satisfied). Edge-case: French coverage,
  FOUT fallbacks, italic/700 shipped, Vite `/preview/<slug>/` base-path all sound.
- One MAJEUR (PLAUSIBLE), triaged & DISCHARGED: ADR-0045's Gate-4 HUD-legibility condition —
  exercised (Courier Prime HUD read too small) and resolved via IBM Plex Mono on stacked #95
  (ADR-0046, lead-art PASS). ADR-0045 updated.
- Fixed on #94: ADR-0045 "Anton fallback" doc drift → Impact/Arial Narrow; Gate-4 discharge note.
- Deferred to #95 (touch the font files #95 extends — avoid stacked conflict; all MINEUR/NIT):
  drop 2 unused Courier Prime italic woff2 (~35KB); consolidate 3 copyright lines into OFL.txt +
  correct CREDITS Rubik notice (binary = "2013,2014 Hubert and Fischer"); soften tokens.ts
  single-source comment to note the `FeedbackLayer` canvas-font exception. Verify: Rubik Mono
  width vs narrow-viewport headline overflow (EndScreen/Pause) at #95 UX gate.
- Integration review: boundary law CLEAN (fonts render-only, no `src/game` import — unanimous
  across reviewers); deps = committed assets only, no runtime/network change.
- VERDICT: **MERGE** — #94 to land with (or immediately before) #95 so the HUD fix ships with the embed.
