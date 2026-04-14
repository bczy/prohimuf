---
stepsCompleted: [1,
 2,
 3]
inputDocuments: []
session_topic: "Prohibition Atari ST remake with React Three Fiber"
session_goals: "Brainstorm all aspects of the remake: gameplay,
 visual style,
 architecture,
 tech stack,
 game loops,
 entities,
 levels,
 audio,
 UX,
 dev guidelines"
selected_approach: "ai-recommended"
techniques_used:
  [
    "SCAMPER Method",

    "What If Scenarios",

    "Reverse Brainstorming",

    "Constraint Mapping",

    "Dream Fusion Laboratory",

  ]
ideas_generated: [43]
context_file: ""
---

# Brainstorming Session — Prohibition Game Remake

**Facilitator:** Bertrand.coizy
**Date:** 2026-04-10

---

## Session Overview

**Topic:** Remake of Prohibition (Atari ST) using React Three Fiber
**Goals:** Explore and document all facets of the game — gameplay fidelity,
 visual identity,
 technical architecture,
 dev methodology,
 guidelines

### Visual Concept

- 2D gameplay faithful to original Prohibition (Atari ST) mechanics
- Paper Mario-inspired aesthetic: flat 2D sprites in a 3D world,
 fold/tilt effects,
 pop-up book depth
- React Three Fiber as rendering engine (Three.js under the hood)

### Dev Philosophy

- **TDD** — Test-Driven Development: tests first,
 implementation second
- **YAGNI** — You Aren't Gonna Need It: no speculative features
- **DRY** — Don't Repeat Yourself: reusable systems over copy-paste
- **Methodical,
 documented,
 guideline-driven** approach
- Solid architecture before any code

---

## Technique Selection

**Approach:** AI-Recommended Techniques

**Recommended Techniques:**

1. **SCAMPER Method** _(structured)_
2. **What If Scenarios** _(creative)_
3. **Reverse Brainstorming** _(creative)_
4. **Constraint Mapping** _(deep)_
5. **Dream Fusion Laboratory** _(theatrical)_

---

## Idées Générées (43)

### SCAMPER

**[SCAMPER #1] : Paris Clandestin**
_Concept :_ Le jeu se déroule à Paris en 1925. Le joueur est un livreur de "pinard" clandestin qui sillonne les arrondissements. La géographie parisienne crée une asymétrie naturelle — boulevards larges mais visibles,
 passages couverts discrets mais lents.
_Nouveauté :_ Risque vs vitesse à chaque trajet,
 naturellement encodé dans la carte.

**[SCAMPER #2] : Paris Rave Clandestin**
_Concept :_ Le joueur est un organisateur de free parties qui livre du matos sono,
 des flyers,
 des générateurs — en évitant la BAC,
 les CRS et les indics. Carte = Paris périphérique années 90 : ZAC abandonnées,
 hangars de Pantin,
 bois de Vincennes,
 catacombes.
_Nouveauté :_ La "marchandise" c'est la fête elle-même. Contexte culturel français immédiatement reconnaissable.

**[SCAMPER #3] : Les Antagonistes Substitués**
_Concept :_ Les flics de Chicago deviennent la BAC de nuit et les RG en civil. Certains "flics" sont mélangés aux ravers — le joueur doit les repérer visuellement avant qu'ils le repèrent.
_Nouveauté :_ Mécanique de détection sociale — un flic en civil a un comportement légèrement off.

**[SCAMPER #4] : Le Réseau Clandestin**
_Concept :_ Le joueur gère un réseau de contacts répartis sur la carte. Chaque contact a une spécialité (sono,
 lieu,
 substrat,
 flyers) et une fiabilité variable. Pour lancer une rave,
 il faut activer le bon réseau dans le bon ordre.
_Nouveauté :_ Un contact grillé est perdu pour plusieurs niveaux. Les relations ont du poids.

**[SCAMPER #5] : Recrutement Organique**
_Concept :_ Les contacts potentiels sont des PNJ reconnaissables à des signaux visuels subtils (flyer en main,
 t-shirt de crew,
 caisse de matos). Le joueur les approche en temps réel pendant que les flics patrouillent.
_Nouveauté :_ Le recrutement est lui-même un risque — un flic qui voit l'échange peut l'interpréter comme un deal.

**[SCAMPER #6] : Le Cast — Réseau Clandestin Paris 98**
_Concept :_ 5 personnages inspirés de la scène rap français fin 90s — DJ Masta Klem (sonorisateur Vitry),
 Faïza "La Logiste" (organisatrice Stalingrad),
 Seb le Blond (Châtelet,
 "le reste"),
 Oxane (photographe Belleville,
 génère les flyers/réputation),
 Karim "Le Mécano" (générateurs,
 Pantin). Chacun crée une contrainte gameplay unique.
_Nouveauté :_ Archétypes forts,
 esthétique immédiate,
 chaque personnage a un impact mécanique distinct.

**[SCAMPER #7] : Couleur Contextuelle**
_Concept :_ Récupérer = aller chercher Karim et son van. Livrer = amener le matos au squat de Faïza. Éviter = passer entre les patrouilles BAC. Même boucle de jeu originale,
 habillage 100% Paris 98.
_Nouveauté :_ Aucune mécanique ne change — mais chaque action a un son,
 une image,
 un nom ancré dans la culture rave française.

**[SCAMPER #8] : Identité Visuelle — Fanzine Néon**
_Concept :_ Le monde est en noir et blanc "photocopié" — textures grain,
 légèrement sale. Les néons et éléments importants (personnages,
 cargaisons,
 flics) explosent en couleurs acides : jaune fluo,
 rose fuchsia,
 vert acide,
 orange brûlé. Les effets Paper Mario : quand un personnage "apparaît",
 il se déplie comme un flyer qu'on décolle d'un mur.
_Nouveauté :_ Le noir/blanc + néon crée une hiérarchie visuelle gameplay naturelle — ce qui brille est interactif. Lisibilité parfaite sans HUD complexe.

**[SCAMPER #9] : Identité Sonore**
_Concept :_ Bande son de boucles instrumentales rap français 90s — boom bap,
 samples vinyle,
 scratches. Le tempo s'accélère quand les flics se rapprochent,
 ralentit quand tu es safe.
_Nouveauté :_ La musique est le seul indicateur de danger — pas de barre de stress,
 pas d'icône d'alerte. Minimaliste,
 immersif,
 YAGNI parfait.

**[SCAMPER #10] : Scope Validé — Full Feature Set**
_Concept :_ Score,
 vies,
 timer,
 difficulté,
 game over,
 minimap,
 barre de vie,
 jauge de détection,
 menu principal,
 cutscenes,
 inventaire,
 leaderboard — tout conservé et stylisé dans l'esthétique fanzine néon.
_Nouveauté :_ Le défi devient visuel : comment faire un inventaire,
 une minimap,
 une barre de vie qui ressemblent à des éléments d'un fanzine photocopié des années 90.

**[SCAMPER #11] : La Perspective Renversée**
_Concept :_ Un niveau sur dix,
 le joueur incarne brièvement un inspecteur des RG qui doit repérer le livreur dans la foule. Même carte,
 même mécanique,
 objectif inversé. Dure 2-3 minutes max.
_Nouveauté :_ Retourne la tension sans complexifier l'architecture — même code,
 mêmes systèmes. Humanise les antagonistes.

---

### What If Scenarios

**[WI #12] : Paris Circadien**
_Concept :_ La carte évolue en temps réel selon un cycle nuit/aube. Patrouilles changeantes,
 contacts disponibles selon l'heure,
 passages qui s'ouvrent ou se ferment.
_Nouveauté :_ Le timing devient une compétence — connaître Paris la nuit comme un vrai habitué.

**[WI #13] : BAC Adaptative**
_Concept :_ Les patrouilles ont une mémoire simple — si tu passes trois fois par la même rue,
 elle devient surveillée. Le joueur doit varier ses routes.
_Nouveauté :_ Le joueur lui-même génère le danger par ses habitudes. Difficulté organique.

**[WI #14] : Mémoire du Bitume**
_Concept :_ Après chaque rave réussie,
 un élément visuel apparaît sur la carte à cet endroit — un tag,
 un flyer collé,
 une lumière dans une fenêtre. Paris se couvre progressivement de traces.
_Nouveauté :_ Progression visuelle pure,
 sans mécanique ajoutée. Le joueur voit son histoire inscrite dans la ville.

**[WI #15] : La Délation**
_Concept :_ Un contact du réseau peut se faire retourner par les RG. Il continue d'apparaître normal mais il balance tes itinéraires. Détectable aux comportements — arrive en retard,
 propose des routes inhabituelles.
_Nouveauté :_ Paranoïa mécanique — tu ne sais jamais lequel est grillé.

**[WI #16] : La Météo comme Allié**
_Concept :_ La pluie réduit la visibilité des flics mais ralentit le joueur. Le brouillard cache les mouvements mais désactive la minimap. La canicule vide les rues.
_Nouveauté :_ La météo crée des sessions de jeu naturellement différentes sans mécanique ajoutée.

**[WI #17] : Les Catacombes**
_Concept :_ Sous Paris existe un réseau souterrain débloquable qui court-circuite les barrages en surface. Mais en dessous,
 pas de minimap,
 pas de signal — navigation à l'aveugle.
_Nouveauté :_ Risque/récompense spatial pur. Même mécanique de déplacement,
 contexte radicalement différent.

**[WI #18] : Le Fanzine comme Interface**
_Concept :_ Tous les écrans UI — menu,
 game over,
 score,
 inventaire — sont des pages d'un fanzine photocopié. Le menu principal est une couverture de zine. L'écran de game over est une "UNE" : "Le livreur du 19ème interpellé".
_Nouveauté :_ L'interface raconte l'histoire. Chaque écran est un artefact de l'univers.

**[WI #19] : Les Niveaux comme Flyers**
_Concept :_ L'écran de sélection de niveau est une pile de flyers de raves — chaque flyer est un niveau,
 avec une date,
 un lieu,
 un line-up fictif. Plus tu avances,
 plus les flyers sont usés,
 froissés,
 tachés de bière.
_Nouveauté :_ La progression narrative est dans l'objet lui-même. Pas besoin de cutscene pour raconter le temps qui passe.

**[WI #20] : La Réputation comme Difficulté**
_Concept :_ Pas de niveaux de difficulté au démarrage — la difficulté émerge de ta réputation. Plus la scène te connaît,
 plus les events sont gros,
 plus les RG sont mobilisés.
_Nouveauté :_ Difficulté organique,
 jamais arbitraire. Le joueur est responsable de sa propre pression.

**[WI #21] : La Nuit du 31 Décembre 1999**
_Concept :_ Le niveau final se passe le 31 décembre 1999 — bug de l'an 2000,
 Paris en délire,
 flics débordés,
 la ville en état d'exception festif. La rave ultime dans un Paris qui croit que le monde va s'arrêter.
_Nouveauté :_ Climax narratif fort ancré dans un moment historique réel. Émotion immédiate.

**[WI #22] : Paper Mario Dépliage**
_Concept :_ Chaque nouveau quartier de Paris se "déplie" comme une page de livre pop-up quand tu l'explores pour la première fois. Les bâtiments se lèvent,
 les rues s'étirent,
 les personnages apparaissent en se décollant du sol.
_Nouveauté :_ L'exploration est récompensée visuellement sans aucune mécanique ajoutée.

**[WI #23] : Les Indics Visuels**
_Concept :_ Les RG en civil ont des micro-tells visuels dans l'esthétique fanzine — couleur légèrement différente,
 mouvement trop mécanique,
 ombre qui ne colle pas. Pas de jauge pour eux — juste l'œil du joueur.
_Nouveauté :_ Skill gap naturel entre débutant et expert. Le vrai joueur apprend à lire la rue.

**[WI #24] : La Radio Pirate**
_Concept :_ Entre les missions,
 une radio pirate fictive — style Radio Nova / Générations 88.2 — commente les events,
 donne des infos sur les mouvements de flics,
 joue des morceaux. C'est la narration du jeu. Pas de cutscene — juste une voix et de la musique.
_Nouveauté :_ Narration 100% sonore,
 zéro asset visuel supplémentaire. YAGNI parfait.

---

### Reverse Brainstorming — Principes de Design

**[RB #25]** Carte lisible instantanément — hiérarchie visuelle claire,
 fanzine noir/blanc + néons fait ce travail naturellement.

**[RB #26]** Contrôles minimaux — déplacement + une action. Appris en 10 secondes,
 maîtrisé en 10 minutes.

**[RB #27]** Fluidité totale — pas de loading visible,
 pas d'animation bloquante. Dépliage Paper Mario quasi-instantané.

**[RB #28]** Flics avec des règles claires et lisibles — le joueur comprend toujours pourquoi il s'est fait chopper. Jamais de mort "bullshit".

**[RB #29]** Tout dans le monde — inventaire sur la carte,
 score dans le décor,
 réseau visible sur la map. Zéro écran de pause obligatoire.

**[RB #30]** Sessions courtes et denses — une mission = 3-5 minutes max. Jouable dans le métro.

**[RB #31]** Recruter un contact est satisfaisant et rapide — interaction courte,
 feedback visuel immédiat,
 le personnage se déplie et rejoint la carte.

**[RB #32]** Bande son variée — minimum 10 tracks boom bap,
 rotation intelligente selon la tension. Survit à 2h de jeu.

**[RB #33]** Chaque échec est lisible — "Faïza t'a balancé" — une ligne,
 une raison,
 on repart. Chaque état de défaite est testé et documenté.

**[RB #34]** Menu = flyer de rave — dans l'univers dès la première seconde. Temps entre lancement et gameplay : moins de 10 secondes.

**[RB #35]** Cutscenes toujours skippables en un bouton,
 sans exception.

**[RB #36]** Leaderboard narratif — les scores ont des noms de raves fictives,
 des dates,
 des lieux. "Nuit du Canal — 2347 pts — Pantin,
 nov 98". Journal de bord collectif.

---

### Constraint Mapping

**[CM #37] : Le Vrai Problème R3F**
_Concept :_ R3F est excellent pour le rendu mais sans ECS,
 collision native,
 ou game loop structuré. Décision : pas d'ECS si le gameplay est simple. Prohibition original n'a pas besoin de physique complexe.
_Nouveauté :_ Cette contrainte force une décision d'architecture tôt — c'est une bonne chose.

**[CM #38] : Le Garde-Fou du Scope**
_Concept :_ La fidélité au gameplay original est la meilleure protection contre le feature creep. Chaque nouvelle idée se teste : "Est-ce que Prohibition Atari ST avait ça ?" Si non,
 c'est une extension consciente et documentée.
_Nouveauté :_ Le jeu original devient le cahier des charges de base.

**[CM #39] : TDD sur Game Logic**
_Concept :_ Séparation stricte game logic (pure functions,
 testables avec Vitest) / rendu R3F (non-testable unitairement). Les positions,
 états des contacts,
 détection des flics — logique pure. Le rendu consomme cet état,
 il ne le produit pas.
_Nouveauté :_ Architecture naturellement testable et découplée. TDD force la bonne architecture.

**[CM #40] : Les Vraies Opportunités**
_Concept :_ Projet solo = liberté totale. Browser-only = pas d'install,
 lien partageable. 2D dans Three.js = depth tricks Paper Mario gratuits. Fanzine = assets simples,
 dev rapide. Gameplay borné = scope clair et livrable réaliste.
_Nouveauté :_ Chaque contrainte retournée en avantage.

---

### Dream Fusion Laboratory

**[DF #41] : La Vision Ultime**
_Concept :_ Page fanzine Letraset au lancement. Boucle Oxmo instrumental. Carte de Paris qui se déplie arrondissement par arrondissement. Nokia 3310 qui vibre pour déclencher la mission. Flyer de rave comme écran de niveau. Traversée de Paris la nuit avec textures de rue distinctes. Rave qui démarre en arrière-plan après livraison réussie. Score affiché comme une Une de journal.
_Nouveauté :_ Vision complète,
 100% faisable techniquement,
 tout reverse-engineerable en sprints.

**[DF #42] : Le MVP Concret**
_Concept :_ V1 = carte d'un arrondissement + un contact + une mission + un type de flic + cycle gameplay complet. Chaque sprint ajoute un arrondissement,
 un contact,
 un antagoniste.
_Nouveauté :_ Jouable et beau dès la première semaine. Scope incrémental et validable.

**[DF #43] : L'Architecture Cible**
_Concept :_

```
src/
  game/          ← pure logic,
 100% testable Vitest
    entities/    ← player,
 contacts,
 cops
    systems/     ← movement,
 detection,
 delivery
    state/       ← game state machine
  render/        ← R3F components,
 consomme game state
    scene/
    ui/
    effects/
  assets/        ← sprites,
 audio,
 fonts
  hooks/         ← bridge game loop ↔ React
```

_Nouveauté :_ Séparation stricte logique/rendu. Vitest teste tout dans `game/`. R3F render dans `render/` est une vue pure de l'état.

---

## Synthèse Session

**43 idées générées** à travers 5 techniques.

**Décisions clés :**

- Univers : Paris rave clandestin,
 années 90-2000
- Gameplay : fidèle à Prohibition Atari ST (récupérer → livrer → éviter)
- Visuel : 2D fanzine noir/blanc + néons acides + effets Paper Mario
- Audio : boom bap instrumental,
 musique = seul indicateur de tension
- Réseau : 5 contacts recrutables organiquement,
 inspirés scène rap français 98
- Architecture : game logic pure / rendu R3F strict séparation
- Stack : TypeScript + React Three Fiber + Vitest + ESLint + Prettier
- Niveau final : 31 décembre 1999
