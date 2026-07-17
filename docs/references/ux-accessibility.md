# Références — UX & accessibilité (`ux-designer`)

Pour menus/HUD, onboarding & tutorial, accessibilité (reduced-motion, toggles escape-hatch,
aria, cibles tactiles), ergonomie mobile vs desktop. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `docs/game-design/ux/` — specs UX du projet.
- `docs/game-design/pre-game-experience-ux.md`, `pregame-landscape-ux.md` — flows déjà gatés.
- ADR `docs/adr/0003`, `0008`, `0026` — touch controls, pan/fullscreen, pinch-zoom.

## Références externes

- [WCAG 2.2 (W3C, Recommendation)](https://www.w3.org/TR/WCAG22/) — le standard d'accessibilité de référence.
- [WAI-ARIA Authoring Practices (APG)](https://www.w3.org/WAI/ARIA/apg/) — patterns clavier/roles pour menus, dialogs, toggles.
- [Understanding Target Size (Minimum) — WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — plancher 24×24 CSS px pour les cibles.
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — respecter le réglage système (escape-hatch animations).
- [MDN — ARIA basics](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/WAI-ARIA_basics) — labels, live regions, roles.
- [Apple HIG — inputs / touchscreen gestures](https://developer.apple.com/design/human-interface-guidelines/gestures) — ergonomie tactile (cible ~44 pt).
- [Material Design — touch targets](https://m3.material.io/foundations/designing/structure) — plancher ~48 dp, espacement.
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/) — checklist spécifique jeu (Basic/Intermediate/Advanced).

## MCP à utiliser

- **Figma** (`get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs`) — lire une maquette/design system, extraire tokens et mesures.

## Skills à utiliser

- `bmad-agent-ux-designer` (Sally) · `bmad-create-ux-design` — specs UX/flows.
- `verify` — revoir les écrans construits sur de vrais screenshots, les deux devices.
