# 0078 — Clé de session pour l'entrée du mur de flyers

- **Status:** Accepted
- **Date:** 2026-08-01
- **Number:** 0078 — auto-alloué (aucun `producer` dans la boucle sur cette PR, ouverte en
  course express puis escaladée ; max local + `origin/main` + index vérifiés ensemble, voir
  le skill `adr-new`). **Renuméroté 0077 → 0078 au merge** : `main` avait entre-temps livré
  son propre ADR-0077 (`couverture-tsc-eslint-scripts`). C'est exactement le cas que la
  re-vérification au merge existe pour attraper, et le doublon qui avait produit deux
  ADR-0020 dans ce dépôt.

## Context

L'animation d'entrée de l'écran NIVEAUX ne doit jouer qu'une fois par session, décision
bloquante rendue par `ux-designer` : `FlyerWall` se démonte à chaque changement de rubrique,
si bien qu'un aller-retour OPTIONS→NIVEAUX rejouait ~2,5 s de papier en mouvement et masquait
les noms de niveaux et les cadenas que le joueur venait de lire. Il faut donc mémoriser, pour
la durée de la session seulement, que la cascade a déjà été montrée.

La doctrine sécurité du projet est explicite : toute nouvelle surface observable — paramètre
d'URL, clé de stockage, chemin d'asset servi, dépendance — demande un ADR. Un reviewer du
panel a relevé, à raison, que la clé introduite n'en avait pas.

## Decision

Ajouter **une** clé `sessionStorage` : `muf_flyer_cascade_played`, écrite au montage de
`FlyerWall` et lue pour décider si la cascade joue.

- **`sessionStorage`, pas `localStorage`** : la portée voulue est la session. Une session
  ultérieure rejoue l'entrée, ce qui est le comportement souhaité.
- **Clé distincte de `muf_seen_tutorial_nudge`** (drapeau à vie, `localStorage`) : les deux
  répondent à des questions différentes, et les confondre figerait la cascade pour toujours
  ou ferait réapparaître le nudge à chaque session.
- **Contenu** : la chaîne `"1"`, marqueur de présence. Aucune donnée de joueur, aucun
  identifiant, rien de personnel — la valeur elle-même ne porte pas d'information.
- **Lectures et écritures gardées** en `try/catch`, comme `loadPrefs` : en navigation privée
  ou stockage indisponible, l'absence est traitée comme « déjà jouée » — l'écran dégrade vers
  « pas d'animation » plutôt que vers un rejeu à chaque montage.
- **Non posée sous mouvement réduit** : l'animation étant supprimée, marquer la session
  dépenserait son unique passage pour rien.

## Consequences

**Positif.** Le rejeu à chaque changement d'onglet disparaît. La surface ajoutée est
minimale et cloisonnée : une clé, une valeur constante, et **trois** fonctions exportées et
testées — nommées ici plutôt que comptées, un décompte se périmant au premier ajout, ce qui
est exactement arrivé à cette ligne :

- `hasCascadePlayed()` — lecture (`getItem`) ;
- `markCascadePlayed()` — écriture (`setItem`), au montage, quand l'animation peut jouer ;
- `clearCascadePlayed()` — effacement (`removeItem`), qui rend la séance quand le mouvement
  réduit tronque une cascade **en cours** (décision §6 du doc UX lié). Seule cette fonction
  retire la clé.

Rien n'est lu depuis cette clé pour piloter autre chose que l'animation.

**Négatif / à savoir.** C'est une troisième clé de stockage côté render, après
`muf_seen_tutorial_nudge` et `muf_prefs` — la tentation de mutualiser existera, et il faut y
résister tant que les portées diffèrent (session vs vie, décoratif vs réglage).
Un joueur peut effacer ou pré-remplir la clé depuis la console pour supprimer l'animation :
sans conséquence, elle ne garde aucun contenu et ne débloque rien.

**Périmètre.** Aucune frontière de module n'est franchie : la clé vit dans
`src/render/ui/menu/FlyerWall.tsx`, côté render, et n'est pas un champ de `Prefs`
(elle enregistre qu'une _visite_ a eu lieu, pas un réglage — même raisonnement qu'ADR-0054 §1
pour le nudge).
