# story-adhoc-reference-iteration — handoffs

Story : permettre à un opérateur de **conditionner la génération d'un asset sur une
référence graphique qu'il dépose** (véhicules, décors, ennemis), via le path
Pollinations **kontext img2img** déjà utilisé pour les frames de flipbook ennemi —
généralisé à une référence arbitraire hébergée. Branche
`claude/image-generation-agents-references-1176lb`. ADR-0044 (auto-alloué faute de
`producer` en boucle cette session ; noté dans l'ADR).

Périmètre confirmé par Bertrand (AskUserQuestion) : flux **ad-hoc** (« je dépose une
image → je l'héberge → génération kontext one-shot pour itérer »), sur les trois
familles véhicules + décors + ennemis. Réponse à la question amont : une pièce jointe de
chat ne part PAS au modèle (FLUX = texte-seul via URL) ; le seul canal image→modèle est
`model=kontext&image=<URL publique>`, la réf devant être hébergée (raw.githubusercontent /
GitHub Pages), pas jointe.

- 2026-07-18 · intake (Bertrand) : « update le pipeline pour répondre au besoin » ;
  faisabilité établie (le path kontext existe déjà, `gen-enemy-types.mjs:150`).
- 2026-07-18 · senior-architect : forme verrouillée + ADR-0044 scaffoldée (Proposed).
  Décisions : réf sous `references/` (racine, hors bundle Vite) ; helper générique
  `scripts/gen-from-reference.mjs` factorisant le path kontext dans un lib
  `scripts/lib/pollinations.mjs` unit-testé ; exécution réelle via `workflow_dispatch`
  (`gen-from-reference.yml`) car le sandbox n'a pas de réseau ; post-traitement par
  famille réutilisé (véhicules cutout+désat, ennemis cutout, décors rien) ;
  `check-art-prompts.mjs` inchangé ; caveat de fidélité kontext documenté. Boundary law :
  100 % `scripts/`/`.github/`/`docs/`/`references/`, zéro `src/`.
- 2026-07-18 · dev-tooling-assets (commit `ceaebcf`) : helper + lib + test + workflow +
  `references/` + docs (SCRIPTS.md, HARNESS.md, ADR + index). Extraction kontext prouvée
  inerte (aller-retour réseau réel). Gates verts (tsc/vitest 452/lint).
- 2026-07-18 · **panel de review (stage 6, 4 reviewers ∥)** — code-review(high) ·
  bmad-code-review · edge-case-hunter · security-review. Verdict initial **NO-MERGE**.
  Findings CONFIRMÉS : 2 BLOQUANTS (injection shell des inputs `workflow_dispatch` dans
  `run:` ; import de `gen-vehicle-sprites.mjs` exécutant son `main()` non gardé →
  `--family vehicles` cassé), 3 MAJEURS (`--out` sans containment ; `catch` trop large
  masquant les erreurs d'écriture ; pas de timeout réseau), 5 MINEURS (SSRF élargi,
  redirects non capés, `parseSize` 0x0, parser d'args, `startsWith("http")`).
- 2026-07-18 · triage senior-architect (= revue d'intégration, une passe) : aucun finding
  rejeté ; décisions de forme — garde `isMain` (pas d'extraction spéculative), SSRF →
  `https://` seul sans allowlist (le runner n'est pas le fetcher), timeout 120 s dans le
  lib partagé. Boundary law CLEAN confirmée.
- 2026-07-18 · dev-tooling-assets (commit `ac5e94a`) : spec de correctifs appliquée en une
  édition sérialisée (lib partagé = un seul owner). 19 tests ajoutés (redirect-cap + suite
  `gen-from-reference` : parseSize/resolveRefUrl/resolveOutFile). Gates verts (tsc/vitest
  467/lint) ; checks comportementaux BLOQ-1/BLOQ-2/MAJ-3 vérifiés.
- 2026-07-18 · **re-run borné du panel** (sécurité + correctness ∥ sur le delta de fix) :
  tous les blockers **CONFIRMED-CLOSED**, aucune régression, tests non-hollow (61/61).
  Observations non-bloquantes notées (exit-code 1 vs 2 sur `--size` pré-existant ;
  `git add -f "$OUT"` sans `--`, impact nul).
- VERDICT : **MERGE-clear** côté gates + panel. Reste : acceptation `pm`/produit
  (Bertrand) sur la PR draft.
