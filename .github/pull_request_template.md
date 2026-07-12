<!-- muf PR template — the checklist mirrors the mandatory gates of
     .claude/agents/COLLABORATION.md. A PR is not mergeable to main until
     every box is checked. -->

## Quoi / Pourquoi

<!-- Résumé du changement et de la story/ADR qui le motive. -->

## Vérifications

- [ ] `rtk tsc` / `yarn typecheck` vert
- [ ] `rtk vitest` / `yarn test` vert (100 %)
- [ ] `rtk lint` / `yarn lint` vert

## Gates crew (obligatoires avant merge sur main)

- [ ] Sign-off d'intégration `senior-architect` (frontière game/render/hooks)
- [ ] **Panel de code review multi-skills passé** — 4 reviewers parallèles
      (`code-review` high, `bmad-code-review`, `bmad-review-edge-case-hunter`,
      `security-review`), findings contre-vérifiés, triage architecte :
      **zéro finding CONFIRMÉ bloquant/majeur non traité**
- [ ] Acceptation `pm` vs story + `PROJECT_GUIDELINES`
- [ ] Cycle tracé dans `docs/agent-handoffs.md`
- [ ] Si frontières/dépendances/déploiement changent : ADR ajouté ou mis à jour dans la PR
