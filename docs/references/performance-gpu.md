# Références — Performance & GPU (`gpu-specialist`)

Pour le frame budget, l'analyse de coût GPU (passes, render targets, overdraw, shader cost,
draw calls) et le PERF VERDICT. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `docs/perf-budget.md` — **son livrable** : budget de frame et protocole de profiling.
- ADR `docs/adr/0031` (CRT post-process) et `0025` (live-hue shader) — surfaces perf-sensibles.
- `docs/render-layer.md` — où vivent passes et effets.

## Références externes

- [MDN — WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) — draw calls, state changes, batching.
- [Three.js — how to update things](https://threejs.org/docs/#manual/en/introduction/How-to-update-things) — coût des updates de buffers/attributs.
- [Discover Three.js — performance](https://discoverthreejs.com/tips-and-tricks/) — disposal, instancing, texture budget.
- [WebGL Fundamentals — performance](https://webglfundamentals.org/webgl/lessons/webgl-qna-how-to-get-good-performance.html) — overdraw et fill-rate.
- [Chrome DevTools — rendering performance](https://developer.chrome.com/docs/devtools/performance) — mesurer frames et jank sur cible réelle.
- [WebGLRenderer.info](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info) — compteurs draw calls/triangles/programs exposés par Three.

## MCP à utiliser

- **Context7** (déjà câblé) — doc Three.js/WebGL à jour pour chiffrer un coût.

## Skills à utiliser

- `bmad-technical-research` — recherche GPU/Three.js ciblée.
- `bmad-review-edge-case-hunter` — traquer les cas limites d'un changement perf.

## Note cible

CI (SwiftShader) **ne mesure pas** un GPU réel : préparer un protocole on-target
prêt-à-lancer, tracer un `DEFERRED`, escalader la mesure à Bertrand, lire les résultats.
