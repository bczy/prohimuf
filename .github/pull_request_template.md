<!-- muf PR template — la checklist reflète les gates obligatoires de
     .claude/agents/COLLABORATION.md. Pas de mainlevée vers `main` tant
     qu'une case reste vide. -->

```
██▓▒░  M U F   —   B O N   D E   L I V R A I S O N  ░▒▓██
   coursier : @toi   ·   cargo : ce diff   ·   itinéraire : main
```

## 📻 Quoi / pourquoi t'es sur la route

<!-- Résumé du changement et de la story/ADR qui le motive. -->

**Story / shard :** <!-- lien vers docs/handoffs/story-<slug>.md, ou "fix lane" -->
**ADR :** <!-- lien vers docs/adr/NNNN-*.md si applicable, sinon "n/a" -->

## 📦 Inventaire de la cargaison

<!-- Compter les fichiers du diff par extension et par type de changement
     (une ligne par type). Source : `git diff --name-status origin/main...HEAD`
     (M = modifié, A = créé, D = supprimé). -->

| Type      | .ts | .tsx | .mjs | .css | .json | .md | .png | Autres |
| --------- | --- | ---- | ---- | ---- | ----- | --- | ---- | ------ |
| Modifiés  | 0   | 0    | 0    | 0    | 0     | 0   | 0    | 0      |
| Créés     | 0   | 0    | 0    | 0    | 0     | 0   | 0    | 0      |
| Supprimés | 0   | 0    | 0    | 0    | 0     | 0   | 0    | 0      |

## 📸 Preuve sur le mur (si visible en jeu)

<!-- OBLIGATOIRE si le changement touche au gameplay, au rendu ou à l'UI :
     captures/enregistrement issus du skill `verify` ou de la suite e2e (jamais
     de mockup) — desktop ET mobile si le HUD/les contrôles sont concernés.
     cf. COLLABORATION.md stage 5 VERIFY et §fix lane. -->

## 🔗 Preview de la tournée

<!-- OBLIGATOIRE : lien vers la preview de branche (déployée par
     deploy-preview.yml sur chaque push d'une branche claude/**).
     URL : https://bczy.github.io/prohimuf/preview/<slug>/ où <slug> est le
     nom de la branche avec tout caractère hors [a-zA-Z0-9._-] remplacé
     par '-' (ex. claude/foo-bar → claude-foo-bar). -->

🔍 [Preview de la branche](https://bczy.github.io/prohimuf/preview/REMPLACER-PAR-LE-SLUG/)

## ✅ Check du matos avant de rouler

- [ ] `rtk tsc` / `yarn typecheck` vert
- [ ] `rtk vitest` / `yarn test` vert (100 %)
- [ ] `rtk lint` / `yarn lint` vert

## 🛣️ Itinéraire (cocher UN des deux — COLLABORATION.md §fix lane)

### 🚚 Tournée complète (feature / refactor / design)

- [ ] **Panel de code review multi-skills passé (stage 6)** — 4 reviewers parallèles
      (`code-review` high, `bmad-code-review`, `bmad-review-edge-case-hunter`,
      `security-review`), findings contre-vérifiés, **triage `senior-architect`
      valant sign-off d'intégration** (frontière game/render/hooks) :
      **zéro finding CONFIRMÉ bloquant/majeur non traité**
- [ ] Acceptation `pm` vs story + `PROJECT_GUIDELINES`
- [ ] Cycle tracé dans `docs/handoffs/story-<slug>.md` (index : `docs/agent-handoffs.md`)
- [ ] Si frontières/dépendances/déploiement changent : ADR ajouté ou mis à jour dans la
      PR (numéro alloué par `producer`)

### 🛵 Course express (petit diff mono-lane : zéro design, zéro asset, zéro dépendance/frontière)

- [ ] Un seul lane dev propriétaire, comportement DÉJÀ gaté (bug fix / polish)
- [ ] Si le changement est visible en jeu : captures/e2e `verify` jointes (voir
      section ci-dessus)
- [ ] **Un reviewer `code-review` (effort high)** sur `git diff origin/main...HEAD` —
      findings traités ou réfutés
- [ ] Une ligne tracée dans `docs/handoffs/fixes.md`

---

<sub>📼 Livré sans se faire choper par la BAC. Merci pour la cargaison.</sub>
