# Références de l'équipe — muf

Bibliothèque **curatée et versionnée** de références externes pour les agents du crew
(`.claude/agents/`). Chaque fiche d'agent pointe vers le(s) fichier(s) de ce dossier via
sa section **« Sources & références »**.

## Pourquoi ce dossier

Avant, la connaissance externe des agents ne vivait que dans des appels `WebSearch` à la
volée : re-cherchée à chaque fois, non versionnée, non révisable. Ici, elle est **fixée,
relue et citée** — un agent ouvre sa fiche de références au lieu de redécouvrir le web.

## Règle de curation (non négociable)

- **Liens stables uniquement** : doc officielle, standard (W3C/MDN), archive pérenne, ou
  doc interne. Pas de blog éphémère, pas de lien qui pourrit dans six mois.
- **Une phrase de contexte par lien** : _pourquoi_ il est utile ici, pas juste le titre.
- **Note de licence** pour toute ressource réutilisée comme asset (musique, texture, font).
- **On étend par revue, jamais en dumpant des liens.** Un ajout = une PR, relue comme le
  reste. La source de vérité du projet reste les docs internes (`docs/**`,
  `_bmad-output/guidelines/PROJECT_GUIDELINES.md`).
- **Périmètre « cahier des charges »** : une référence sert la fidélité à _Prohibition_
  (Atari ST, 1987) et à l'univers 1998, ou la qualité technique — pas l'inspiration hors-scope.

## Index

| Fichier                                              | Pour                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| [`rendering-r3f.md`](rendering-r3f.md)               | `dev-r3f-render`                                               |
| [`game-logic-testing.md`](game-logic-testing.md)     | `dev-gameplay`                                                 |
| [`tooling-ci-assets.md`](tooling-ci-assets.md)       | `dev-tooling-assets`                                           |
| [`performance-gpu.md`](performance-gpu.md)           | `gpu-specialist`                                               |
| [`ux-accessibility.md`](ux-accessibility.md)         | `ux-designer`                                                  |
| [`audio.md`](audio.md)                               | `sound-designer`                                               |
| [`game-design.md`](game-design.md)                   | `game-designer`, `lead-game-designer`                          |
| [`narrative-1998-paris.md`](narrative-1998-paris.md) | `narrative-designer`                                           |
| [`art-culture.md`](art-culture.md)                   | `art-advisor`, `graphic-references`, `concept-artist`, `lead-art`, `game-graphist` |
| [`product-process.md`](product-process.md)           | `pm`, `producer`, `senior-architect`, `tech-writer`, `qa-lead` |

> L'art dispose déjà d'un dépôt de références dédié et license-noté sous
> [`docs/art-direction/references/`](../art-direction/references/) — `art-culture.md` le
> référence sans le dupliquer.
