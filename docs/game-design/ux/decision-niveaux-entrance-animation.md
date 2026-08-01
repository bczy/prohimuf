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

   **Restriction au clavier (correctif E2E).** La stabilisation ne se déclenche que sur un
   focus **clavier** (`:focus-visible`), pas sur n'importe quel focus. La première version
   réagissait à tout focus, y compris celui d'un clic : retirer l'animation en plein geste
   faisait **sauter** la feuille de sa position de départ à sa position de repos, entre le
   `mousedown` et le `mouseup` — le clic tombait dans le vide et le niveau ne démarrait
   jamais. La gate E2E golden l'a attrapé, en cliquant un flyer pendant sa phase de délai
   où il est immobile et paraît donc prêt à recevoir le clic. Aucune perte : le rognage
   d'anneau de focus que cette règle protège est un problème strictement clavier.

## Suites, non bloquantes

- Passe lecteur d'écran réelle pour confirmer que `opacity: 0` au premier keyframe n'empêche
  pas l'annonce (attendu : non, ce n'est ni `visibility:hidden` ni `display:none`).
- Éventuel troisième palier de mouvement (« fondu doux » pour qui tolère un peu de
  mouvement) : nouvelle demande, pas un manque de cette PR.
