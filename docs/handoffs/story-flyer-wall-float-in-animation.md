# Handoffs — Story : animation d'entrée du mur de flyers (STORY-FLYER-WALL-FLOAT-IN)

Story slug: `story-flyer-wall-float-in-animation` · branche `origin/claude/flyer-wall-float-in-animation`.

Animation d'entrée en cascade des flyers de la page NIVEAUX, escaladée de la tier fix-lane vers la pipeline complète.

## Producer Ruling — collision de numéro d'ADR (Marion — 2026-08-02)

### Ruling initial (2026-08-02, matin)

**COLLISION DÉTECTÉE** entre deux branches revendiquant ADR-0077 :

- `docs/adr/0077-mcp-level-editor-server.md` — branche `claude/mcp-level-editor-build-iy2jaw`, revendiqué 2026-07-31, au merge gate (PR #159)
- `docs/adr/0077-flyer-cascade-session-key.md` — commit `24762f7a`, branche `origin/claude/flyer-wall-float-in-animation`, créé 2026-08-01

**RULING** : la story MCP garde ADR-0077 (antériorité + au merge gate) ; cette branche renumérote 0077 → 0078 à son rebase.

### Dénouement réel (2026-08-02, après-midi) — le ruling a tenu, mais un TIERS a pris le 0077

Un troisième prétendant, hors des deux branches arbitrées, a mergé sur `main` en premier :
**`docs/adr/0077-couverture-tsc-eslint-scripts.md`** (branche `claude/focused-wozniak-lomy3e`,
PR #161). Le numéro 0077 est donc devenu indisponible pour les DEUX branches arbitrées,
alors même que l'arbitrage portait sur lui.

État final des numéros, vérifié le 2026-08-02 :

| Numéro | Titulaire / prétendant                    | État                                              |
| ------ | ----------------------------------------- | ------------------------------------------------- |
| 0077   | `couverture-tsc-eslint-scripts`           | **mergé sur `main`** — définitif                  |
| 0077   | `qte-photo-paparazzi-set-pieces` (#163)   | collision avec `main` — cette lane devra bouger   |
| 0078   | `flyer-cascade-session-key` (#145)        | cette branche — renumérotation déjà faite         |
| 0078   | `sp2-paid-generation-ci-surface` (#156)   | **collision avec #145** — l'une des deux bougera  |
| 0079   | _(libre à l'instant T)_                   | cible naturelle des glissements ci-dessus         |
| 0080   | `photo-leverage-cross-level-carry` (#163) | non mergé                                         |
| 0081   | `mcp-level-editor-server`                 | story MCP (PR #159) — pris ici, hors zone de choc |

**Alerte pour `producer`, découverte au balayage exhaustif (103/103 branches distantes inspectées le 2026-08-02)** : une SECONDE collision est déjà en place sur **0078** — `claude/flyer-wall-float-in-animation` (#145) et `feat/level-harness-sp2` (#156) le revendiquent toutes deux, et `design/qte-photo-paparazzi` (#163) doit en plus quitter 0077. La story MCP s'est donc rangée en **0081**, hors de la zone où ces trois glissements vont atterrir (0078/0079), plutôt que de camper sur le premier trou libre.

**Aucun geste ne reste dû à cette lane sur le 0078 lui-même** : la branche flyer s'est rebasée sur le nouveau
`main` et porte bien `docs/adr/0078-flyer-cascade-session-key.md`. Le ruling est exécuté.

### Leçon pour `producer` — l'allocation par arbitrage ne suffit pas

Arbitrer un numéro entre deux branches connues ne protège pas d'une troisième qui merge
d'abord : le numéro n'est réservé qu'au moment du merge sur `main`, jamais avant. Le seul
mécanisme fiable reste celui de la garde de `scripts/gen-adr-index.mjs` — qui a bien
détecté le doublon ici — plus une re-vérification du numéro **juste avant le merge**, pas
au moment de l'écriture de l'ADR. Consigne à ne pas pinner un numéro futur dans un
hand-off : dire « le prochain libre, vérifié au rebase » plutôt qu'un chiffre.

### Suite (2026-08-05) — la collision annoncée sur 0078 a eu lieu, cette branche part en 0082

L'alerte ci-dessus s'est réalisée : `feat/level-harness-sp2` (#156) a mergé sur `main` avec
`docs/adr/0078-sp2-paid-generation-ci-surface.md`, donc 0078 est devenu indisponible pour
cette branche exactement comme 0077 l'était devenu. Deuxième renumérotation :
**0078 → 0082**.

0079 et 0080 sont libres sur `main` et **délibérément évités** : le ruling les désigne comme
la zone d'atterrissage des glissements encore en vol (#163 doit quitter 0077 et détient
0080). Se ranger au-delà est le raisonnement même qui avait fait choisir 0081 à la story MCP,
et que Marion validait. Les deux lignes du tableau ci-dessus concernant #145 sont donc
périmées — laissées telles quelles, c'est son relevé daté, pas le mien.

La leçon de ce ruling se vérifie deux fois plutôt qu'une : arbitrer un numéro ne le réserve
pas, seul le merge le fait. Le contrôle qui a servi ici est le même les deux fois — la
re-vérification au merge, pas l'allocation à l'écriture.

**Tracé par** : Marion (producer), 2026-08-02, en réponse à l'escalade Winston §6.7 de
`story-mcp-level-editor.md` ; mis à jour l'après-midi avec le dénouement réel.

---

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

**Escaladé pour de bon** : palier tournée complète, cycle tracé ici **depuis l'escalade**,
signature du second lane obtenue.

`docs/handoffs/fixes.md` garde en revanche les **deux lignes d'AVANT l'escalade**
(2026-07-30), quand cette PR était encore une course express : la réponse au panel de
stage 6, et la dérogation `senior-architect` — **retirée depuis**, le panel l'ayant bloquée.
Elles y restent parce qu'un journal ne se réécrit pas : effacer la trace d'une dérogation
demandée puis refusée supprimerait précisément ce qu'il est utile de savoir. Les deux
lignes portent un renvoi vers ce shard, qui est l'enregistrement à jour.

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
mutations. Les AUTRES points sont validés en l'état — sans les compter, ce décompte ayant déjà
vieilli une fois quand la décision §7 (rack short-landscape) est arrivée : focus au montage avec
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

## Élargissement de périmètre — les emblèmes de crew (demandé par Bertrand)

**Ce n'est pas un débordement subi : c'est une décision de Bertrand, prise en cours de PR**
(« non mais c'était cool mets ça dans la branche sur le menu existant »). La branche
`claude/flyer-motifs` a donc été fusionnée ici, `d4cba804` → merge `051d6400`.

**Quoi.** Un emblème SVG par flyer, propre à son crew : spirale pour SPIRALE 23 (son
homonyme littéral), trame pour NADIR 94, anneaux pour KANAL SYSTEM, invader pour L'Éden,
smiley pour le tutoriel. Nouveau `FlyerMotif.tsx`, table `FLYER_EMBLEMS`, lignes CSS et
suite de tests dédiée. SVG inline, aucune dépendance, aucun asset généré.

**Genèse.** Les dessins viennent du spike R3F (`claude/spike-r3f-flyers`), où ils étaient
rasterisés sur des textures canvas ; Bertrand les a itérés en direct pendant la session
(nombre de spirales, largeur des fentes, taille des trous, ajout de l'invader) puis a
demandé leur report sur les flyers DOM. Le style — imprimé pauvre, une couleur, formes
grasses lisibles à la photocopie — suit la même intention que le reste du mur.

**Ce qui MANQUE, nommé plutôt que sous-entendu :**

- **Gate `lead-art` — PASSÉ. Verdict final : PASS sur les cinq**, réserve bloquante levée
  après rework.** Réclamé par moi auprès de
  Bertrand à la fusion, puis indépendamment par le panel, puis demandé par Bertrand.
  Verdict : [`docs/art-direction/decision-flyer-crew-emblems.md`](../art-direction/decision-flyer-crew-emblems.md).
  Quatre emblèmes sur cinq passent ; **`halftone` (NADIR 94) est refusé** — le champ de
  points ne résout aucune forme quand on recule, donc c'est une texture et non une marque,
  il entre en collision avec le dot-screen du papier, et il est le seul aplat tonal d'un set
  d'encres pleines (bible §2 loi 2 : un asset hors-famille fait tomber le set).
  **Arbitré par Bertrand** : voie (b), remplacer par une marque d'encre pleine — la trame
  devient un **fil à plomb** (`plumb`), nadir = le point le plus bas, masse pleine et trou
  de visée percé comme les yeux du smiley. Les cinq marques sont désormais homogènes, ce
  qui referme le grief de famille. **Re-gate : R1 LEVÉE\*\* — la loi de famille est refermée,
  la marque tient à trois mètres y compris sous le filtre de verrouillage (une masse pleine
  encaisse là où un aplat tonal se dissolvait), le trou de visée reste ouvert à ~100 px, et
  la silhouette axiale est la seule du mur qui pointe. `lead-art` juge l'attribution « la
  mieux fondée du mur avec la spirale » : un fil à plomb est l'instrument qui DÉFINIT le
  point le plus bas, donc la marque ne décore pas le nom, elle le démontre. Les 5°
  d'inclinaison sur un instrument dont la fonction est la verticale sont conservés à sa
  demande — ce n'est pas le plomb qui penche, c'est le tampon tapé à la main.

  Deux corrections de prose demandées au passage et faites : des commentaires décrivaient
  encore la trame supprimée (« un commentaire qui décrit une forme disparue est précisément
  par où une trame reviendrait »), et l'ancrage de l'invader défendait par une absence
  d'anachronisme — ce qui l'aurait justifié sur n'importe quel mur postérieur à 1978 —
  au lieu du bon motif : Invader carrelait Paris à partir de 1998, même ville, même année,
  même geste que le joueur. Refinement facultatif non appliqué, noté dans la note : abaisser
  le point le plus large de la masse d'un dixième de hauteur.

- **Gate `narrative-designer` — PASSÉ. Verdict : PASS**, réserve bloquante levée dans le
  même push. Verdict :
  [`docs/game-design/narrative/decision-flyer-crew-emblems.md`](../game-design/narrative/decision-flyer-crew-emblems.md).

  La question de fond est tranchée : **le symbole est une citation, l'attribution est un fait
  de fiction**. Qu'une spirale ou un smiley acid existent en 1998 n'engage personne ; dire
  « cette marque est celle de ce crew-là et d'aucun autre » énonce sur une entité canonique un
  fait qu'aucune source gatée n'énonçait, et qui devient le seul ancrage visuel de trois
  collectifs qui n'ont qu'un nom. Fiction nouvelle, donc — mais de faible amplitude.

  **Réserve bloquante R-N1, corrigée** : la prose du code était fausse sur 2 feuilles sur 5 et
  **canonisait L'Éden comme crew**, alors que `PLAYABLE_COPY["niveau-final"].crew` vaut
  `SPIRALE 23 · KANAL SYSTEM · NADIR 94` et que la bible classe L'Éden en **Lieu**, avec
  interdiction de fusionner les classes. L'invader n'appartient donc à personne : c'est **la
  ville qui signe** la feuille des trois systèmes. Ce qui referme une symétrie que rien
  n'avait écrite — les deux feuilles sans système portent les deux marques sans propriétaire.

  Relevé non demandé, ratifié : le code avait remplacé **en silence** une doctrine gatée du
  copy deck (motifs _partagés_ → marques _exclusives_). Le gate ratifie le changement — une
  marque partout n'est la marque de personne — et le note comme amendement dû au deck (R-N3).

- **Suites de ce gate, non bloquantes** : amendement du `pregame-copy-deck.md` §2.2-§2.4
  (motifs superseded, re-gate court `lead-game-designer`), repli des cinq lignes de canon dans
  la bible après merge, interdiction permanente de gloser les marques en jeu.

**Défaut trouvé à la fusion, corrigé ici** — NADIR 94 n'affichait AUCUN emblème : placée en
slot `hero`, la seule feuille conçue pour attaquer par son image, alors que la mise en page
verrouillée ne rendait que `mid` et `body`. Verrouillé, c'est l'essentiel du mur à la
première visite. Corrigé côté mise en page (`0992563d`), test sur les deux états de chaque
niveau, puis étendu au troisième rendu (tutoriel) sur relevé du panel.

**Structure durcie après le panel.** Les cinq tables parallèles indexées par `levelId`
(`MOTIF_BY_LEVEL_ID`/`_PLACEMENT`/`_SIZE_PX`/`_TILT_DEG`/`_WEAR_SEED`) — la forme exacte qui
a produit le bug NADIR 94 — sont fusionnées en une seule, `FLYER_EMBLEMS`, typée
`FlyerEmblem` : une entrée à moitié remplie est désormais une erreur de compilation, là où
un attribut oublié retombait silencieusement sur un défaut. Relevé en PROPOSÉ par la passe
`simplify`, tranché par le panel, appliqué à rendu inchangé (tailles d'emblèmes mesurées
identiques avant/après sur une capture réelle).

## Troisième lane, arrivé hors session — EXTRAIT vers sa propre PR

Le commit `94b2db14` (poussé sur cette branche par une AUTRE session Claude) modifiait
`.github/workflows/code-review-panel.yml` — le gate de merge lui-même. Le panel l'a relevé
trois fois, en escalade : MAJEUR, puis BLOQUANT, avec un argument imparable —
« _self-disclosure by the PR does not close the gate_ ». Déclarer le trou ne le comble pas.

Trois griefs, tous justes : aucune signature de lane (`.github/workflows/**` appartient à
`dev-tooling-assets`), aucun ADR (ce fichier en a exigé un trois fois — ADR-0063, 0067,
0070), et le gate se modifiait en se jugeant.

**Extrait vers [PR #168](https://github.com/bczy/prohimuf/pull/168)** (branche
`claude/panel-harness-pin-pr-head`), avec **ADR-0083** et une demande explicite de signature
`dev-tooling-assets`. Cette story revient donc à **deux lanes**, et le BLOQUANT tombe.

Ce qui RESTE ici de ce commit : son correctif CSS `.slot.slotSettled`, en périmètre — il fait
gagner la stabilisation par le sélecteur au lieu d'un ordre de déclaration dans le fichier.

Coût de l'extraction, borné et connu : jusqu'au merge de #168, les relances MANUELLES du panel
(`workflow_dispatch`/`workflow_call`) produisent encore un diff vide. Le flux normal sur
`pull_request` n'est pas affecté — c'est précisément ce qui avait rendu le défaut invisible.

## Débordements de périmètre, déclarés

Deux changements de ce diff sortent de « une animation d'entrée », nommés plutôt que
découverts en relecture. Un troisième l'a fait un temps — la modification du workflow du
panel — jusqu'à son extraction vers la PR #168 (section ci-dessus) :

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
- Le dernier verdict FAIL (check run `91549184645`) ne portait sur **aucun défaut du
  diff** : le harness du panel avait livré `panel-input/diff.patch` et `files.txt` **vides**,
  et le reviewer a refusé de rendre un PASS sur un sujet inexistant. Cause : le `checkout`
  du job `prepare` n'épinglait aucune `ref`, donc sur `workflow_dispatch` /
  `workflow_call` il atterrissait sur la **branche par défaut** et `git diff
origin/main...HEAD` ne rendait rien. Corrigé en amont (`refs/pull/N/head` sous les trois
  déclencheurs), plus deux garde-fous : `prepare` échoue bruyamment sur une liste de
  fichiers vide, et `triage` compte désormais `prepare` parmi les jobs dont l'échec vaut
  DEGRADED — sans quoi un harness cassé continuait de publier un PASS creux. Le finding
  disait exactement cela : « must not treat this run's empty findings list as a genuine
  PASS ».

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

  **Suite : APPLIQUÉ.** Le panel a soulevé le même point indépendamment, ce qui a fourni le
  mandat qui manquait ici — voir « Structure durcie après le panel » plus haut. Cette ligne
  est conservée telle quelle plutôt que réécrite : elle date de la passe `simplify`, où le
  constat « proposé, pas appliqué » était exact, et une passe de dégraissage n'a pas à
  paraître avoir tranché ce qu'elle avait justement laissé à une lane.

**REVERTED** : aucun. **Bugs repérés (non corrigés)** : aucun.
