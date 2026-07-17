# story-harness-railing-alignment — handoffs

Story : les garde-corps de premier plan (barrières) dessinés par le code sont décalés
des vraies fenêtres. Branche `claude/harness-corriger-barrieres-6i29tx`, PR #68. Story
`_bmad-output/planning-artifacts/story-harness-railing-alignment.md` ; décisions dans
l'amendement (cycles 1-3) de `docs/adr/0028-window-alignment-harness.md`.

- 2026-07-17 · intake (Bertrand) : « il y a un harness pour corriger les barrières ;
  dans belliard tout n'est pas bien aligné, encore décalé à gauche ou à droite ; retravaille
  le harness pour que l'alignement soit vraiment parfait ».
- 2026-07-17 · cycle 1 — mesure des bords (John→Winston→Amelia). Détection ne gardait que le
  centroïde chaud + `openingW` fixe ; `measure()` sans défaut horizontal. Fix : bords mesurés
  par fenêtre, `x` = milieu de `[x0,x1]`, défaut MISALIGN par-bord (tol 0.012) dans `--fix` et
  `--check`. Panel code-review ×4 (0 bloquant/majeur ; sécurité 0). pm ACCEPTED 7/7 ACs.
- 2026-07-17 · cycle 2 — détection robuste (Bertrand : « seulement 2 bonnes fenêtres »).
  Hystérésis (vantail sombre rejoint son jumeau) + split aux vallées (fin de la barrière qui
  enjambe 2 fenêtres) + défauts UNDERCOVER/OVERCOVER mesurés contre l'art (`scripts/lib/coverage.mjs`).
  belliard 17→18, vitry 36→38.
- 2026-07-17 · cycle 3 — cause racine du décalage écran (dev-r3f-render). `LevelBackdrop`
  étire chaque panneau de façade de 1+BLEND (8 %) alors que barrières + slots flics mappaient au
  pas exact → parfait au centre, dérive ±4 % aux bords. Fix : `src/render/scene/facadeLayout.ts`
  (BLEND, FACADE_DRAW_SCALE, applyFacadeStretchX/invert), barrières + slots suivent l'étirement ;
  hooks dev `__MUF_PROJECT__` + `__MUF_HIDE_RAILINGS__`. `src/game` byte-identique.
- 2026-07-17 · tentative screen-truth (Bertrand : « base-toi sur des screenshots écran sans
  barrière, lance la détection dessus »). Harness réécrit pour détecter en pixels écran
  (façade nette via zones vides) + inversion `__MUF_PROJECT__`. RÉGRESSION : couverture chute
  (belliard 18→12), placement bas — le gate SCREEN s'auto-certifie via un `__MUF_PROJECT__` dont
  la portée verticale ne couvre que la moitié haute du canvas. Mise DE CÔTÉ (patch préservé), non
  shippée. FINDING à traiter : corriger la portée verticale du hook/placement façade avant de
  reprendre la voie screen-truth.
- 2026-07-17 · rebase sur main (30 commits ; ADR-0031 CRT a touché GameScene, auto-mergé ;
  conflits handoffs résolus vers la structure shardée). tsc / vitest 448 / lint / build verts.
- VERDICT: PASS — pm acceptance cycle 1 (John)
