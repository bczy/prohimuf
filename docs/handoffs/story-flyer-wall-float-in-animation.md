# Story — animation d'entrée du mur de flyers (NIVEAUX)

**PR :** [#145](https://github.com/bczy/prohimuf/pull/145) · **branche :** `claude/flyer-wall-float-in-animation`
**Palier : 🚚 TOURNÉE COMPLÈTE** — escaladé depuis la course express, voir §Palier.

## Quoi

Les flyers de NIVEAUX apparaissaient tous d'un coup. Ajout d'une entrée en cascade
(`mufFlyerFloatIn`, 1400 ms, staggée 180 ms par flyer via `--slot-delay`), avec trois
trajectoires de chute déterministes cyclées par index pour qu'aucune feuille ne rejoue
le chemin de sa voisine. Itéré en direct avec Bertrand (3 tours : « trop rapide », « trop
linéaire », « toujours la même distance gauche-droite »).

## Palier — pourquoi cette story existe

Ouverte en **course express** (un lane, `dev-r3f-render`, polish sur un composant déjà
gaté). Le palier a cassé en cours de route : un finding du panel a montré que
`screenshot-preview.mjs` capturait le menu en pleine animation, et le correctif correct
vivait dans `scripts/` — donc chez `dev-tooling-assets`.

Première tentative de résolution : une **dérogation de palier** demandée à
`senior-architect`, qui l'a accordée en argumentant que le critère mono-lane est une
heuristique de chemin approximant le rayon de souffle, et qu'ici l'heuristique se
déclenche sans que le rayon de souffle suive.

**Le panel l'a bloquée, à raison.** COLLABORATION.md §fix lane est absolu : un correctif
qui casse un critère en vol « ESCALATES to the full pipeline at the stage it violated —
**it never continues in the fix lane** ». Aucune clause de dérogation n'existe ;
l'architecte avait d'ailleurs reconnu inventer une troisième issue. Une dérogation
attribuable reste une dérogation à une règle qui n'en prévoit pas.

**Escaladé pour de bon** : palier tournée complète, cycle tracé ici et non dans
`docs/handoffs/fixes.md` (réservé aux cycles fix-lane), signature du second lane obtenue.

**Écart de doctrine à porter par `producer`** : le palier fix-lane n'offre que deux
issues (express / pipeline complet). Le cas rencontré — un correctif de review qui fait
déborder le diff sur un second lane — n'a pas d'issue proportionnée. Une troisième,
« express multi-lane à double signature », est à débattre pour COLLABORATION.md §fix lane.
Elle n'a PAS été appliquée ici : on ne s'autorise pas une exception avant qu'elle soit
doctrine.

## Porte de design (rétroactive)

Le panel a relevé — à raison — que l'escalade en pipeline complet avait rouvert le critère
mono-lane sans jamais rouvrir le critère **« zéro design »**, que ce changement casse aussi :
régler le ressenti d'une animation d'écran relève d'`ux-designer`, pas d'un lane dev.

**Revue `ux-designer` passée**, verdict « acceptable avec changements nommés », dont **un
bloquant** : l'entrée rejouait à chaque aller-retour de rubrique et masquait ~2,5 s durant
les noms de niveaux et les cadenas déjà lus. Corrigé — la cascade joue au plus **une fois
par session** (`sessionStorage`, clé distincte du drapeau à vie du nudge), validé par deux
mutations. Les quatre autres points sont validés en l'état (focus au montage avec
`preventScroll`, mouvement réduit en coupure franche, portée du clip d'overflow).

Décisions consignées dans
[`docs/game-design/ux/decision-niveaux-entrance-animation.md`](../game-design/ux/decision-niveaux-entrance-animation.md),
pour qu'un contributeur ultérieur les trouve au lieu de les redéduire du CSS.

## Signatures de lane

- **`dev-r3f-render`** — moitié render (`src/render/ui/**`).
- **`dev-tooling-assets` (Amelia) : SIGN-OFF** sur la moitié `scripts/` —
  `waitForFlyerWallSettled` interroge le bon élément (`.muf-flyer-slot` est bien le nœud
  animé), est sûr sous reduced-motion par construction (`animation: none` ⇒
  `getAnimations()` vide ⇒ prédicat vrai au tick suivant), la garde tableau-vide est
  porteuse (FlyerWall se démonte à chaque aller-retour de rubrique), le timeout de 20 s
  vaut ~8× le pire cas mesuré, et l'export additif est sans risque pour les 12
  importateurs dont les gates bloquants.

  **Périmètre exact de cette signature.** Elle porte sur `waitForFlyerWallSettled` et sur
  l'isolation des captures, qui n'ont pas bougé depuis. Elle validait AUSSI un mécanisme de
  « suppression de la capture périmée puis re-throw » — **retiré depuis** : un tour ultérieur
  a montré qu'il détruisait une capture saine quand l'échec n'avait rien à voir avec
  l'animation. Le comportement actuel est plus simple : un échec de settle est logué et la
  capture est sautée, sans rien supprimer. Cette moitié de la signature ne porte donc sur
  aucun code vivant, et n'est conservée ici que pour l'historique.

- **`ux-designer`** — porte de design rétroactive (ci-dessus).
- **`senior-architect`** — analyse du rayon de souffle conservée comme argumentaire (elle
  reste juste sur le fond), mais elle ne vaut PAS dérogation : c'est la double signature
  de lane qui autorise le merge, pas elle.

## Débordements de périmètre, déclarés

Deux changements de ce diff sortent de « une animation d'entrée », et méritent d'être
nommés plutôt que découverts en relecture :

1. **`errText()` appliqué à TOUS les `catch` de `screenshot-preview.mjs`**, pas seulement
   aux deux du correctif de settle — dont la boucle de capture par niveau et le handler
   `main().catch`, tous deux antérieurs. Motif : `throw` peut porter autre chose qu'une
   `Error`, auquel cas `e.message` affiche `undefined` et fait perdre le détail réel dans
   un run CI qu'on ne reproduit pas. Laisser deux sites sur l'ancienne forme aurait figé
   un défaut connu à côté de sa correction. Change ce que CI imprime en cas d'échec, jamais
   ce qui réussit ou échoue.
2. **`overflow-x: hidden` sur `.rubriquesLevels`** (`MainMenu.tsx`/`.module.css`), qui
   n'est pas le mur de flyers : la dérive latérale de l'entrée faisait apparaître une barre
   de défilement horizontale transitoire sur le conteneur de rubrique. Cause et correctif
   appartiennent au même diff.

## Vérification

`tsc` / `eslint` / `prettier` verts · suite `src/render/ui` verte. **Pas de décompte de
tests écrit ici** : ce nombre a déjà été faux une fois, et il le redevient à chaque test
ajouté — même travers que les affirmations de verdict ci-dessous. Tests validés **par
mutation**, pas seulement verts : pas de stagger → 2 ms ⇒ rouge ; typo `"level"` dans le
littéral ⇒ rouge ; clé `--fio-*` inconnue ⇒ `TS2353` ; attente de settle cassée ⇒ le script
poursuit au lieu d'abandonner la capture du niveau.

**Verdict du panel : voir le check `panel-verdict` sur la PR — délibérément PAS recopié
ici.** Ce fichier a affirmé trois fois un état du panel (« COMPLET et PASS », un nombre de
tours) qui était faux au moment d'être lu. La cause n'est pas l'inattention : elle est
structurelle. Le panel juge un commit, donc son verdict n'existe qu'APRÈS que le commit
soit écrit — toute affirmation sur le verdict, inscrite dans le commit qu'il juge, est
périmée par construction, et le tour suivant la démentira. Le seul état durable est le
pointeur vers l'autorité, jamais l'instantané.

## Assumé, hors périmètre

**Rien.** Les deux réserves qui figuraient ici ont été traitées dans cette PR, et laisser
la mention aurait fait mentir le document dont c'est justement le rôle de servir de
référence :

- _le rejeu de l'entrée à chaque retour sur NIVEAUX_ — c'était le finding **bloquant** de
  la porte `ux-designer` ; corrigé, la cascade joue au plus une fois par session
  (§Porte de design, et décision §1 de la note UX) ;
- _l'auto-focus qui part pendant l'animation_ — corrigé par `preventScroll: true`
  (décision §2), qui supprime le défilement vers la position transformée sans retarder le
  focus.

Restent ouverts, hors de ce diff et non créés par lui : la passe lecteur d'écran réelle et
l'éventuel troisième palier de mouvement, tous deux listés dans la note UX.

## Historique de la revue

Déroulé complet — verdicts, findings et correctifs, tour par tour — dans le fil de la
[PR #145](https://github.com/bczy/prohimuf/pull/145). Non dupliqué ici pour la même raison
que ci-dessus : un journal de tours écrit dans le diff est incomplet dès le tour suivant.

Ce qu'il faut en retenir, et qui ne périme pas :

- Le palier a été **escaladé** de la course express au pipeline complet, une dérogation
  ayant d'abord été accordée puis **retirée** (voir §Palier) — COLLABORATION.md n'en prévoit
  aucune.
- Plusieurs correctifs de revue ont eux-mêmes introduit le défaut suivant : la suppression
  de capture périmée détruisait une capture saine ; le partage d'échéance pouvait faire
  attendre indéfiniment (`timeout: 0` vaut « pas de timeout » en Playwright). C'est le coût
  réel d'un diff corrigé sous revue, et il est plus honnête de l'écrire que de ne montrer
  que l'état final.
- Trois affirmations d'état périmées (inventaire de fichiers ×3, verdict du panel ×3) ont
  toutes la même cause : une valeur recopiée à la main au lieu d'être générée ou pointée.
  L'inventaire est désormais généré par commande ; le verdict est pointé, plus recopié.

## Passe `simplify` (stage 5, avant le panel)

19 fichiers · 1699 → 1684 lignes de code ajoutées (−15). Baseline verte avant/après
(tsc, 1701 tests, eslint). Commit `e5e64b17`.

**APPLIQUÉ** — trois lots, vert après chacun :

- `FlyerWall.tsx` — deux commentaires jumeaux sur `playCascade` ; paragraphe périmé laissé
  au-dessus du raffiné dans l'effet mouvement réduit ; les trois détections rejetées
  recopiées du doc de décision (§5) réduites à un renvoi. C'est cette duplication même qui
  avait produit le BLOQUANT « le doc contredit le code ».
- `scripts/e2e-lib.mjs` — l'argument « ne pas recalculer la durée » tenu deux fois dans le
  même bloc JSDoc ; gardé l'exemplaire qui porte le plafond des 105 niveaux.
- `FlyerMotif.tsx` — prop `className` : un seul appelant, jamais renseignée.

**PROPOSÉ** — non appliqué, demande un arbitrage de lane :

- `LevelFlyer.tsx` + `FlyerMotif.tsx` — **cinq tables parallèles** indexées par le même
  `levelId` (`MOTIF_BY_LEVEL_ID`, `MOTIF_PLACEMENT`, `MOTIF_SIZE_PX`, `MOTIF_TILT_DEG`,
  `MOTIF_WEAR_SEED`), donc cinq lectures et cinq `?? défaut` par emblème. Ajouter un niveau
  demande de toucher cinq endroits, et une entrée oubliée retombe silencieusement sur un
  défaut — c'est la forme exacte du bug NADIR 94. Une seule table par niveau supprimerait
  les défauts dispersés. → owner : `senior-architect` · non appliqué : déplace un export
  public entre deux modules et impose de réécrire les tests des emblèmes, donc hors du
  périmètre « mécanique et prouvé par la suite existante ».

**REVERTED** : aucun. **Bugs repérés (non corrigés)** : aucun.
