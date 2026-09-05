# Unity bootstrap — artefacts livrables

Ce dossier contient les artefacts **destinés au projet Unity**, pas au jeu web `muf`.
Ils vivent ici parce que le ticket qui les commande est tracké dans ce dépôt
(`_bmad-output/planning-artifacts/story-unity-bootstrap-welcome-screen.md`), alors que
l'emplacement du projet Unity lui-même n'est pas encore arbitré (dépôt séparé recommandé
vs sous-dossier — question ouverte #1 de la story).

## Contenu

| Fichier                    | Destination dans le projet Unity   |
| -------------------------- | ---------------------------------- |
| `pull_request_template.md` | `.github/pull_request_template.md` |

À copier **tel quel** : le fichier est prêt à l'emploi, sans en-tête à retirer.

## Ce que ce dossier n'est pas

Il ne s'applique **pas** aux PR de ce dépôt. Les PR de `muf` utilisent
`.github/pull_request_template.md` à la racine, qui reste inchangé : il encode les gates
de `.claude/agents/COLLABORATION.md` (panel de review stage 6, preview de branche, route
tournée complète / course express) et n'a aucune raison de bouger pour la piste Unity.

Le template Unity encode d'autres gates, parce que le projet a d'autres risques : un build
qui compile mais ne se lance pas, un `.meta` perdu, un upgrade d'éditeur subi, un
`Library/` committé, un asset tiers sans licence.
