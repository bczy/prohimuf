<!-- muf PR template — the checklist mirrors the mandatory gates of
     .claude/agents/COLLABORATION.md. A PR is not mergeable to main until
     every box is checked. -->

## Quoi / Pourquoi

<!-- Résumé du changement et de la story/ADR qui le motive. -->

## Preview

<!-- OBLIGATOIRE : lien vers la preview de branche (déployée par
     deploy-preview.yml sur chaque push d'une branche claude/**).
     URL : https://bczy.github.io/prohimuf/preview/<slug>/ où <slug> est le
     nom de la branche avec tout caractère hors [a-zA-Z0-9._-] remplacé
     par '-' (ex. claude/foo-bar → claude-foo-bar). -->

🔍 [Preview de la branche](https://bczy.github.io/prohimuf/preview/REMPLACER-PAR-LE-SLUG/)

## Vérifications

- [ ] `rtk tsc` / `yarn typecheck` vert
- [ ] `rtk vitest` / `yarn test` vert (100 %)
- [ ] `rtk lint` / `yarn lint` vert

## Voie (cocher UNE des deux — COLLABORATION.md §fix lane)

### Pipeline complet (feature / refactor / design)

- [ ] **Panel de code review multi-skills passé (stage 6)** — 4 reviewers parallèles
      (`code-review` high, `bmad-code-review`, `bmad-review-edge-case-hunter`,
      `security-review`), findings contre-vérifiés, **triage `senior-architect`
      valant sign-off d'intégration** (frontière game/render/hooks) :
      **zéro finding CONFIRMÉ bloquant/majeur non traité**
- [ ] Acceptation `pm` vs story + `PROJECT_GUIDELINES`
- [ ] Cycle tracé dans `docs/handoffs/story-<slug>.md` (index : `docs/agent-handoffs.md`)
- [ ] Si frontières/dépendances/déploiement changent : ADR ajouté ou mis à jour dans la
      PR (numéro alloué par `producer`)

### Voie FIX (petit diff mono-lane : zéro design, zéro asset, zéro dépendance/frontière)

- [ ] Un seul lane dev propriétaire, comportement DÉJÀ gaté (bug fix / polish)
- [ ] **Un reviewer `code-review` (effort high)** sur `git diff origin/main...HEAD` —
      findings traités ou réfutés
- [ ] Une ligne tracée dans `docs/handoffs/fixes.md`
