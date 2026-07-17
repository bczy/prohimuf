# Références — Rendu R3F / Three.js (`dev-r3f-render`)

Pour la lane `src/render/**` (scene, ui, effects), le pont `src/hooks` côté vue, sprites,
shaders, parallaxe. Voir la règle de curation dans [`README.md`](README.md).

## Docs internes (source de vérité)

- `docs/architecture.md` — la loi des frontières (render ne porte aucune règle de jeu).
- `docs/render-layer.md` — organisation `scene/` · `ui/` · `effects/`.
- `docs/art-direction.md` — style maison à respecter au runtime (rims néon, halos = dégradés).
- ADR `docs/adr/0011`, `0025`, `0031` — neon rim, live-hue shader, CRT post-process.

## Références externes

- [React Three Fiber — docs](https://r3f.docs.pmnd.rs/) — API R3F, réconciliateur, `useFrame`, événements.
- [drei — helpers R3F](https://drei.docs.pmnd.rs/) — abstractions prêtes (sprites, billboards, shaders).
- [Three.js — documentation](https://threejs.org/docs/) — référence API cœur (matériaux, géométries, textures).
- [Three.js — manual](https://threejs.org/manual/) — tutoriels concept par concept (sprites, plans texturés, transparence).
- [react-postprocessing](https://react-postprocessing.docs.pmnd.rs/) & [postprocessing (pmndrs)](https://github.com/pmndrs/postprocessing) — pipeline d'effets (le CRT/composite passe par là).
- [React 19 — docs](https://react.dev/) — hooks, `use`, concurrent — le socle du réconciliateur.
- [MDN — WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) — transparence, blending, `image-rendering: pixelated`.
- [Discover Three.js — tips & tricks](https://discoverthreejs.com/tips-and-tricks/) — pièges courants (color management, disposal).

## MCP à utiliser

- **Context7** (`resolve-library-id` → `query-docs`) — doc R3F/Three.js/drei **à jour** avant d'écrire du code render.
- **codegraph** — tracer les callers d'un hook/composant avant de refactorer.
- **Three.js 3D Viewer** (`learn_threejs`, `show_threejs_scene`) — prototyper/valider une scène isolée.

## Skills à utiliser

- `verify` — build headless + screenshots réels : obligatoire pour tout visuel composé au runtime.
