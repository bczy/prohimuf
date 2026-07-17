# story-agents-pipeline-infographic — handoffs

Story: infographie du pipeline des agents (poster HTML + sprites du crew) et son
gate de fraîcheur en CI. Branche `claude/agents-pipeline-infographic-v5igsx`.
Pas d'ADR (appel de Bertrand) : outillage de doc, pas de décision d'architecture —
le mécanisme est documenté dans l'en-tête de `scripts/check-agents-infographic.mjs`.

- 2026-07-17 · intake (Bertrand) : infographie du pipeline des agents + mécanisme de
  maintenance (« le mettre à jour dès que quelque chose change »).
- 2026-07-17 · dev-tooling-assets : infographic HTML (docs/diagrams), sprites singles
  via muf-crew-bitmap.py, check-agents-infographic.mjs + wiring ci.yml.
- 2026-07-17 · code-review (high) : 8 angles parallèles, findings vérifiés.
  Appliqués : slug dans les tuples AGENTS (zip positionnel supprimé), write_png
  partagé (color_type), poster gardé hors --singles + $CREW_OUTDIR, drift des
  sprites vérifié pixel-à-pixel dans le check (les deux modes), refs HTML vérifiées,
  check déplacé avant install en CI, I/O réordonnée. Réfutés : blocs [data-theme]
  « morts » (le viewer d'artifact stampe data-theme — documenté en commentaire CSS),
  taille de l'HTML (livrable demandé).
- 2026-07-17 · rebase sur main d7d0dac (ADR-0037 : +Tony/Ben/Otis) : conflit
  muf-crew-bitmap.py résolu (base main 18 agents + transformation singles),
  19 sprites régénérés, infographie refondue — roster supprimé, sprites inline
  dans chaque carte (demande Bertrand), nouveaux agents placés (Tony DESIGN+VERIFY,
  Ben TECH PLAN+PERF VERDICT, Otis lane DOCS au REVIEW).
- VERDICT: PASS — checks mécaniques (tsc/vitest/lint/format + gate FRESH + tests
  négatifs du gate) (dev-tooling-assets)
