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

5. **L'arrivée d'un utilisateur au clavier stabilise le mur immédiatement.** La suite
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

   **Restriction au clavier (correctif E2E).** La stabilisation ne se déclenche que sur une
   arrivée **clavier**, pas sur n'importe quel focus. La première version
   réagissait à tout focus, y compris celui d'un clic : retirer l'animation en plein geste
   faisait **sauter** la feuille de sa position de départ à sa position de repos, entre le
   `mousedown` et le `mouseup` — le clic tombait dans le vide et le niveau ne démarrait
   jamais. La gate E2E golden l'a attrapé, en cliquant un flyer pendant sa phase de délai
   où il est immobile et paraît donc prêt à recevoir le clic. Aucune perte : le rognage
   d'anneau de focus que cette règle protège est un problème strictement clavier.

   **Détection : le TYPE de la dernière entrée.** Un `keydown` dit « clavier », un
   `pointerdown` dit « pointeur », et seule une arrivée clavier stabilise. Les deux écoutes
   sont posées sur `window` : le Tab d'une arrivée venue de l'EXTÉRIEUR du mur se déclenche
   sur l'élément qu'on quitte, jamais sur nous.

   Deux détections antérieures ont été essayées et retirées ; elles sont consignées ici
   parce que chacune paraît la solution évidente et casse une plateforme différente :
   - **`:focus-visible`** — l'élément focusé est un `div[role="button"]`, pas un `<button>`
     natif, et sur ce type d'élément les moteurs divergent : WebKit a livré des versions où
     un focus souris matche. Sur Safari le clic aurait re-cassé le démarrage d'un niveau,
     sur un chemin invisible pour la gate golden qui ne teste que Chromium.
   - **Récence du pointeur** (« un appui a-t-il eu lieu il y a moins de 300 ms ») — cassait
     le **tactile**. L'ordre des événements d'un tap est `pointerdown` → `pointerup` →
     `mousedown` synthétique → `focus` : le focus du tap arrive APRÈS la fin de son propre
     geste, donc il était lu comme une arrivée clavier et la feuille sautait sous le doigt.
     Aucun seuil ne pouvait convenir — il aurait dû être à la fois assez long pour ce focus
     tardif et assez court pour laisser passer un Tab suivant un clic.

   Le type d'événement n'a ni l'un ni l'autre défaut, et supprime le réglage au lieu de le
   déplacer.

6. **Le mouvement réduit ne consomme pas la cascade de la session.** L'animation étant
   supprimée, marquer la session comme « déjà jouée » dépenserait son unique passage pour
   rien : un joueur qui désactive ensuite la bascule in-app et revient sur NIVEAUX ne
   verrait jamais l'entrée. Le drapeau n'est posé que si l'animation a réellement pu jouer.

   **Et il est RENDU si le mouvement réduit s'active en cours de chute.** La moitié OS de
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

## Suites, non bloquantes

- Passe lecteur d'écran réelle pour confirmer que `opacity: 0` au premier keyframe n'empêche
  pas l'annonce (attendu : non, ce n'est ni `visibility:hidden` ni `display:none`).
- Éventuel troisième palier de mouvement (« fondu doux » pour qui tolère un peu de
  mouvement) : nouvelle demande, pas un manque de cette PR.
