# 0046 — Render-layer CSS Modules + tokens.ts→CSS-var bridge; hud-css skill

- **Status:** Accepted
- **Date:** 2026-07-18
- **Number:** 0046, self-allocated (no producer in the loop); max committed ADR was
  0045 on this branch and `origin/main`. Re-check at merge (rule #9).

## Context

The entire render UI layer (`src/render/ui/**`) is styled with inline `style={{…}}` —
~172 sites, 25 blocks / 43 `style=` sites in `HUD.tsx` alone, which stacks 9 distinct
widgets in one 515-line file. There is no CSS file and no styling `className` in
application code; the only stylesheets are `index.html` (reset) and
`src/assets/fonts/fonts.css` (@font-face). Style tokens are already mono-sourced in
`src/render/ui/print/tokens.ts` (INK, STOCK, MARK, ACID, FONT, MOTION, MASTHEAD,
breakpoints). Inline styling is unmaintainable at this scale, but a fraction of HUD
styles are runtime-computed (gauge fills, state-driven marker inks, off-screen arrow
positions) and cannot become static classes. Hard constraints: the game/render/hooks
boundary (law), TS strict, Vite 6 + React 19, fully offline/self-contained (no CDN),
and tokens.ts must remain the single source of every hex/font.

## Decision

1. **CSS Modules (`*.module.css`), co-located** with each render/ui component, are the
   styling mechanism for the layer. Chosen over global+BEM (no scoping guarantee),
   vanilla-extract (adds a Vite plugin + vitest transform for ~90% of the same value),
   and Tailwind (would duplicate tokens and fight the bespoke fanzine design). Zero new
   dependency; Vite 6 and Vitest handle it natively.
2. **tokens.ts stays the sole source.** A boot module
   `src/render/ui/applyPrintTokens.ts` derives CSS custom properties on `:root` from
   the token objects at startup (called from `main.tsx`). `.module.css` files reference
   `var(--ink-black)` etc.; no hex/font/motion literal is ever redeclared in CSS. Chosen
   over committing a generated `tokens.css`: runtime injection has no generated artefact
   and no drift by construction; the sub-frame FOUC is moot behind muf's loading gate
   (ADR-0022/0027).
3. **Dynamic values stay inline as CSS custom properties** the class consumes
   (`style={{'--gauge-fill': …}}` → `width: var(--gauge-fill)`). State→token ramp
   functions remain in TS (render-side view logic, not game rule). Target is "zero
   STATIC inline style", not "zero inline style".
4. **`prefers-reduced-motion`** zeroing moves into a CSS media query consuming
   `--motion-*` — behaviour-equivalent to today's JS forcing.
5. **A `hud-css` skill** (owner lane `dev-r3f-render`), not a new agent, packages the
   migration procedure and conventions. `dev-r3f-render` already owns `src/render/**`;
   this is a technique inside an existing lane, so it does not warrant a crew extension
   (contrast ADR-0037/0042, which staffed _unowned_ lanes).

## Consequences

- The boundary is unchanged: CSS holds no game rule; game logic imports no React/Three.
- One new render-layer boot dependency (`applyPrintTokens` on `:root`); happy-dom
  provides `documentElement`, so component tests are unaffected (none assert on inline
  styles today).
- Migration is a lossless, pixel-identity-gated refactor, piloted on `HUD.tsx` (composite
  gate), then rolled out surface-by-surface. Each surface: static→class, computed→CSS var.
- A new convention to keep alive: any new token is added to tokens.ts AND
  applyPrintTokens.ts in the same change; no raw hex in CSS or TSX.
- No crew-graph churn: a skill, not an agent (no bitmap/infographic/COLLABORATION.md/
  mermaid updates). Vitest may want `css.modules.classNameStrategy: 'non-scoped'` if a
  future test asserts on a class name; not required for current tests.
- Enables the muf design system (extended tokens + component library + HTML catalog,
  P2) and an optional Figma mirror + Code Connect (P3, blocked on Figma editor access).
