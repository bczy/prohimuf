---
name: hud-css
description: >
  Migrate a src/render/ui surface from inline style={{…}} to co-located CSS
  Modules while preserving pixel-identical output. Use when converting HUD.tsx
  or any render/ui screen off inline styles, adding a new styled DOM surface in
  the render layer, or wiring a style value to the print tokens. Enforces the
  CSS-Modules + tokens.ts→CSS-vars architecture (ADR-0046): no hex/font
  redeclared in CSS, dynamic values flow through inline CSS custom properties,
  game/render boundary untouched. Owner lane: dev-r3f-render.
---

# hud-css — render-layer CSS Module migration

## Architecture (ADR-0046)

- CSS Modules `*.module.css`, co-located next to the component (`HUD.module.css`).
- All colours/fonts/motion come from CSS custom properties injected at boot by
  `src/render/ui/applyPrintTokens.ts` from `tokens.ts`. **Never** write a hex,
  font stack, or motion ms literal in a `.module.css` — reference `var(--ink-black)`,
  `var(--font-display)`, `var(--motion-flyer-pull)`, etc. `tokens.ts` stays the sole
  source of every value.
- CSS holds zero game rules. State→token ramp functions (`integrityColor`,
  `energyColor`, `timeColor`, …) stay in TS — they are render-side view mapping, not
  game logic, and must not migrate into `src/game` or into CSS.

## The token bridge

- `applyPrintTokens.ts` iterates the `tokens.ts` objects (INK, STOCK, MARK, ACID,
  FONT, MOTION + the extended typo/spacing/state/z-index scales) and writes
  `--namespace-key` custom properties onto `document.documentElement` once at startup.
  Called from `main.tsx` right after the `fonts.css` import.
- Adding a token = add it to `tokens.ts` AND to `applyPrintTokens.ts` in the same
  change. Never inline a raw hex/px/ms literal that a token could carry.

## Class naming

- One `.module.css` per component. Local class names are plain camelCase
  (`hud`, `item`, `label`, `value`, `chip`, `gaugeTrack`, `gaugeFill`, `arrowWrap`).
  Scoping is automatic (hashed) — no BEM prefixes, no component prefix.

## Inline vs class (the boundary)

- **STATIC** layout/box/typography → class.
- **RUNTIME-COMPUTED** value → stays inline as a CSS custom property; the class reads it:
  `style={{ '--gauge-fill': `${pct}%`, '--gauge-hue': hue } as React.CSSProperties}`
  with `.gaugeFill { width: var(--gauge-fill); background: var(--gauge-hue); }`.
- Positions/transforms driven by state (arrow rotation, stamp tilt, anchor coords)
  → inline.
- TS-strict: indexing `--*` custom-property keys needs the inline object cast
  `as React.CSSProperties` (or a small typed `cssVars(record)` helper). No `any`.

## Migration recipe (per surface)

1. Baseline: run the `verify` skill to screenshot the surface BEFORE (composite-gate reference).
2. Create `<Component>.module.css`; move each static style object to a class,
   swapping literal tokens for the matching `var(--…)`.
3. Replace `style={staticObj}` with `className={styles.x}`. For mixed objects,
   split: static → class, computed → inline custom props.
4. Keep ramp/derivation functions in the `.tsx` unchanged.
5. `rtk tsc` + `rtk vitest` + `rtk lint`.
6. `verify` AFTER; the diff must be pixel-identical (HUD is on the composite gate).
7. If a new token is needed, add it to `tokens.ts` AND `applyPrintTokens.ts` —
   never inline a raw hex.

## Do NOT

- redeclare a hex / font stack / motion literal in CSS (reference the `var(--…)`).
- let any `src/game` symbol or game rule leak into style logic.
- change visual output — this is a lossless refactor gated on pixel-identity.
