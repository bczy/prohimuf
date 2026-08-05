# Décision UX — animation d'entrée de NIVEAUX

**Statut :** revue rétroactive · `ux-designer` · PR #145
**Portée :** l'entrée en cascade du mur de flyers (`FlyerWall`), pas ses valeurs de réglage.

## Pourquoi cette note existe

L'animation a été réglée en direct avec Bertrand puis livrée en course express, sans
passer par la boucle de design. Le panel CI l'a relevé : l'escalade en pipeline complet
avait réexaminé le critère mono-lane sans jamais rouvrir le critère « zéro design », que
ce changement casse aussi — régler le ressenti d'un écran relève d'`ux-designer`.

Les **valeurs** de réglage (courbes, stagger, trois trajectoires) ne sont pas rejugées ici :
les poser à l'œil avec Bertrand est une façon normale de finir du mouvement. Ce qui
manquait, c'est l'examen des **conséquences sur l'écran entier**. Ce document en est le
résultat, pour qu'un contributeur ultérieur ait une référence au lieu de la redéduire du CSS.

## Décisions

1. **L'animation joue au plus une fois par SESSION, pas une fois par montage.** ⟵ bloquant,
   corrigé dans la PR. `FlyerWall` se démonte à chaque changement de rubrique, donc un
   aller-retour OPTIONS→NIVEAUX rejouait ~2,5 s de papier en mouvement et masquait les noms
   de niveaux et les cadenas que le joueur venait de lire. NIVEAUX est l'écran que le joueur
   traverse en boucle (parcourir → régler → parcourir → jouer) : le moment de première
   impression se garde, la taxe sur la boucle se supprime. Implémenté via `sessionStorage`
   (`muf_flyer_cascade_played`), clé **distincte** du drapeau à vie
   `muf_seen_tutorial_nudge` — les confondre figerait la cascade pour toujours ou ferait
   réapparaître le nudge à chaque session. Une session suivante rejoue : c'est voulu.
2. **Le focus du premier lancement reste au montage**, pendant l'animation, avec
   `preventScroll: true`. Faire attendre ~2 s un utilisateur de lecteur d'écran pour qu'une
   animation se termine inverse la priorité : l'accessibilité est un plancher, pas un tour
   de file. `preventScroll` neutralise le seul vrai défaut — le défilement vers la position
   transformée, donc fausse, de la feuille.
3. **Mouvement réduit = aucune animation**, apparition en place. C'est le bon défaut, pas un
   sous-traitement : un fondu reste du mouvement. Les deux interrupteurs (média OS et
   bascule in-app) atterrissent sur le même état.
4. **`overflow-x: hidden` reste limité à NIVEAUX.** SCORES et OPTIONS gardent une barre de
   défilement visible plutôt qu'un contenu coupé en silence.

5. **L'arrivée d'un joueur sur le mur le stabilise immédiatement.** La suite
   « anneau de focus rogné » notée plus bas s'est révélée réelle, pas théorique : la dérive
   latérale atteint 44 px alors que le rembourrage du mur vaut 16 px, donc pendant l'entrée
   une feuille de bord — et son anneau de focus — dépasse le clip `overflow-x` de
   `.rubriquesLevels` et se fait couper, jusqu'à 28 px. Plutôt que de rogner la dérive
   (réglage validé par Bertrand) ou d'affaiblir le clip (qui protège d'une barre de
   défilement parasite), le mur se stabilise dès qu'un focus **du joueur** entre : la
   fenêtre de rognage disparaît. L'auto-focus du premier lancement, lui, ne compte pas —
   il est nôtre, pas celui du joueur, sinon le primo-visiteur serait le seul à ne jamais
   voir la cascade. Au passage c'est le bon ordre de priorité : qui a commencé à
   interagir prime sur une animation décorative.

   **La seule exception : le focus du geste pointeur lui-même (correctif E2E).** La
   première version réagissait à TOUT focus, celui d'un clic compris : retirer l'animation
   en plein geste faisait **sauter** la feuille de sa position de départ à sa position de
   repos, entre le `mousedown` et le `mouseup` — le clic tombait dans le vide et le niveau
   ne démarrait jamais. La gate E2E golden l'a attrapé, en cliquant un flyer pendant sa
   phase de délai où il est immobile et paraît donc prêt à recevoir le clic. Le focus qui
   appartient à un geste pointeur est donc le seul à ne pas stabiliser ; toute autre
   arrivée le fait, y compris celles qui n'émettent aucune touche.

   **Détection : stabiliser par DÉFAUT, sauf pour le focus d'un geste pointeur.** Toute
   arrivée de focus stabilise le mur. Une seule est écartée : celle qui appartient à un
   geste pointeur, reconnaissable à ce qu'elle atterrit sur l'élément que ce geste vient
   d'appuyer. C'est la seule qu'il ne faut pas suivre — retirer l'animation en plein geste
   arrache la feuille de sous le doigt ou le curseur avant que le clic n'aboutisse.

   Trois règles plus étroites ont été essayées et retirées ; chacune paraît la solution
   évidente et chacune exclut une population réelle :
   - **`:focus-visible`** — l'élément focusé est un `div[role="button"]`, pas un `<button>`
     natif, et sur ce type d'élément les moteurs divergent : WebKit a livré des versions où
     un focus souris matche. Sur Safari le clic aurait re-cassé le démarrage d'un niveau,
     sur un chemin invisible pour la gate golden qui ne teste que Chromium.
   - **Récence du pointeur** (« un appui a-t-il eu lieu il y a moins de 300 ms ») — cassait
     le **tactile**. L'ordre des événements d'un tap est `pointerdown` → `pointerup` →
     `mousedown` synthétique → `focus` : le focus du tap arrive APRÈS la fin de son propre
     geste. Aucun seuil ne pouvait convenir — il lui aurait fallu être à la fois assez long
     pour ce focus tardif et assez court pour laisser passer un Tab suivant un clic.
   - **Exiger un `keydown`** — excluait les **technologies d'assistance**. Un balayage
     VoiceOver ou un saut au rotor NVDA déplace le focus DOM sans qu'aucune touche
     n'atteigne la page. La règle ignorait donc précisément l'utilisateur pour qui elle
     existe : l'anneau rogné est un problème d'accessibilité avant d'être un problème de
     confort.

   Comparer la CIBLE plutôt que deviner l'intention n'a aucun de ces défauts, et supprime
   le réglage au lieu de le déplacer. Une cible par pointeur, en revanche, et non une
   seule : les touchers sont **concurrents**, et un pouce posé sur le mur pendant que
   l'index tape écraserait la cible du geste actif — le tapotement se verrait alors refuser
   son exception et la feuille sauterait sous le doigt, soit la régression même que cette
   règle existe pour empêcher, réintroduite par la règle.

   Et la **libération** doit être par pointeur elle aussi. Seuls `pointerup` et
   `pointercancel` terminent un geste ; `click`, `contextmenu` et une frappe ne font que
   jeter ceux qui sont DÉJÀ terminés. Vider la table en bloc — ce qu'un marqueur unique
   permettait — reviendrait à ce qu'un doigt qui se lève efface la marque d'un doigt encore
   posé, ou qu'une touche frappée en pleine pression efface celle du doigt qui presse. Le
   `pointerup` ne supprime pas, il marque « terminé » : sur tactile, le focus d'un tap
   arrive après que son doigt s'est levé, et supprimer là rouvrirait le bug d'origine.

   **Une marque terminée ne survit pas à son usage.** Elle n'existe que pour UN focus —
   le sien, celui du tap, qui arrive après son `pointerup` — donc elle est jetée dès
   qu'elle l'a avalé, sans attendre le `click`. Ces trois collecteurs ne suffisaient pas :
   un geste peut se terminer sans qu'aucun n'arrive (un tap dont le `click` est supprimé,
   une pression dont la page s'en va). La marque restait alors à demeure et refusait sa
   stabilisation à l'arrivée SUIVANTE — au clavier ou au lecteur d'écran —, c'est-à-dire
   exactement à l'utilisateur pour qui la règle existe. La condition « terminée » est
   gardée : un doigt encore posé conserve sa marque tant qu'il est posé, inchangé.

6. **Le mouvement réduit ne consomme pas la cascade de la session.** L'animation étant
   supprimée, marquer la session comme « déjà jouée » dépenserait son unique passage pour
   rien : un joueur qui désactive ensuite la bascule in-app et revient sur NIVEAUX ne
   verrait jamais l'entrée. Le drapeau n'est posé que si l'animation a réellement pu jouer.

   **Et il est RENDU si le mouvement réduit s'active EN COURS DE CHUTE** — en cours de
   chute seulement. Une fois la séance **consommée**, la rendre offrirait une seconde
   cascade complète plus tard dans la même session. Consommée veut dire deux choses, pas
   une : soit la cascade est allée jusqu'au bout, soit le joueur l'a lui-même close en
   arrivant sur le mur (§5) — une stabilisation retire une animation en cours, qui émet donc
   `animationcancel` et jamais `animationend`, et s'en tenir à « allée au bout » lirait ce
   mur-là comme n'ayant rien montré. C'est §1 cassé par l'autre bout, et la bascule OS n'a
   pas de date limite : un joueur peut l'actionner une heure après l'entrée, pour des
   raisons étrangères à cet écran.

   La fin de chute est détectée par l'`animationend` de la dernière feuille — celle qui
   finit en dernier, même durée partout et délai croissant avec l'index — plutôt qu'en
   recalculant `(n-1) × stagger + durée`, qui obligerait à tenir ces trois valeurs
   synchronisées dans un endroit de plus. La moitié OS de
   ce signal est vivante : elle peut basculer pendant que le mur est monté. La coupure CSS
   tronque alors l'animation, alors que le drapeau était déjà posé au montage — la séance
   aurait dépensé son unique passage pour une cascade vue à moitié. Le drapeau est donc
   effacé, **et la coupure est verrouillée pour ce montage-ci**. Le verrou n'est pas
   accessoire : la bascule OS peut aussi revenir à OFF sans que le mur soit démonté, et la
   décision de jouer est prise une fois pour toutes au montage. Sans lui, la coupure CSS
   cesserait simplement de s'appliquer et le joueur verrait toute la cascade repartir au
   milieu de sa visite — le rejeu que §1 interdit. Avec lui, le mur reste au repos jusqu'au
   démontage, tandis que le drapeau rendu réserve la séance à un montage ULTÉRIEUR : soit
   encore réduit (rien ne joue, rien n'est marqué), soit revenu en mouvement normal — cas
   où rejouer est précisément ce que le joueur veut.

7. **Le rack paysage-court ne joue pas la cascade du tout.** Il apparaît en place, comme
   sous mouvement réduit. C'est la seule disposition qui **rogne** (`overflow-y: hidden`,
   imposé par `overflow-x: auto`) et son rembourrage haut est dimensionné pour le TIRAGE de
   la feuille, ~32 px. Or l'entrée démarre jusqu'à 230 px plus haut : mesuré sur un écran
   tactile 844×390, la feuille du tutoriel passait toute sa chute avec 233 px d'elle-même
   coupés au bord du clip — son bandeau et son tampon avec. Pendant ~2,5 s, NIVEAUX
   n'affichait que des feuilles décapitées.

   Gonfler le rembourrage à 240 px est l'autre issue, et la mauvaise : elle prendrait
   l'essentiel d'une bande de contenu de ~300 px pour ménager du ciel à une chute
   décorative, sur l'écran qui a le moins de hauteur à donner. Une chute verticale de
   230 px n'a de toute façon pas de sens dans un défilement **horizontal** contraint : les
   feuilles n'y tombent pas sur le mur, elles tombent depuis hors-mise-en-page. On retire
   donc l'animation — même état final que le mouvement réduit, atteint de la même manière,
   par retrait et non par ajout d'une seconde animation.

   **En deux endroits, parce qu'ils bouchent deux trous différents.** La règle CSS, dans le
   bloc `SHORT_LANDSCAPE_MEDIA`, rattrape une chute **déjà en vol** quand on fait pivoter le
   téléphone VERS le paysage. Le verrou côté composant (`playCascade` tient compte de la
   requête au montage, comme il tient déjà compte du mouvement réduit) empêche l'effet
   inverse : une règle média cesse de s'appliquer dès qu'elle ne matche plus, et avec le
   seul CSS, pivoter du rack vers le portrait **rejouait toute la cascade** en plein milieu
   de la visite — le rejeu que §1 interdit. Mesuré, pas déduit : 844×390 → 390×844 après
   stabilisation relançait les cinq feuilles.

   Comme pour le mouvement réduit (§6), la séance n'est **pas** consommée sur le rack :
   l'animation étant supprimée, la marquer « déjà jouée » dépenserait l'unique passage pour
   rien.

## Suites, non bloquantes

- Passe lecteur d'écran réelle pour confirmer que `opacity: 0` au premier keyframe n'empêche
  pas l'annonce (attendu : non, ce n'est ni `visibility:hidden` ni `display:none`).
- Éventuel troisième palier de mouvement (« fondu doux » pour qui tolère un peu de
  mouvement) : nouvelle demande, pas un manque de cette PR.
