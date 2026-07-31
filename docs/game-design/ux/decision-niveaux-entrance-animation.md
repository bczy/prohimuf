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

## Suites, non bloquantes

- Passe lecteur d'écran réelle pour confirmer que `opacity: 0` au premier keyframe n'empêche
  pas l'annonce (attendu : non, ce n'est ni `visibility:hidden` ni `display:none`).
- Vérifier en capture, pendant la fenêtre d'entrée, que l'anneau de focus ne se fait pas
  rogner au bord du conteneur sur les largeurs mobiles étroites.
- Éventuel troisième palier de mouvement (« fondu doux » pour qui tolère un peu de
  mouvement) : nouvelle demande, pas un manque de cette PR.
