# UX spec — scène TÊTE À CONNAÎTRE (ex. "portrait-robot")

**Surface :** scène interstitielle post-niveau — recomposer un visage suspect à partir de 4 bandes
(`LA COUPE / LE REGARD / LE NEZ / LA BOUCHE`) sous chrono (`TÉLÉCARTE · {n} UNITÉS`).
**Auteur :** `ux-designer` (Tony) · **Date création :** 2026-08-05 · **Round 2 :** 2026-08-05
**Statut :** RÉVISÉ round 2 — applique le DESIGN GATE (`docs/game-design/design-gate-portrait-robot.md`,
PASS AVEC CONDITIONS) et l'arbitrage direct Bertrand du même jour sur le geste tactile (A4-bis).

## Journal de révision (round 2)

**Ce qui a changé et sur ordre de qui :**

1. **Geste tactile renversé — ordre direct Bertrand, prime sur le gate.** « Pour les contrôles
   mobiles : un swipe gauche/droite sur chaque bande, on oublie ta sélection et tes flèches. » Le
   §2.3 est réécrit intégralement : swipe horizontal sur la bande visée = geste primaire, plus de
   tap de sélection, plus de notion de bande active au doigt, chevrons rétrogradés en affordance +
   cible d'accessibilité (§2.3, §2.4).
2. **Deux extensions coupées par le gate (A8).** Le mini-crop de comparaison locale (ex-D4.2/D4.3)
   et le verrouillage indicatif de bande (ex-§0/D0, ex-D5.2 partiel, ex-D5.4 `aria-pressed`) sont
   retirés. Repli acté : médaillon cible ≥ **28 % de largeur** en mobile paysage, rapproché des
   bandes (§1.2, §4).
3. **Vocabulaire canon appliqué (A6).** `CHEVEUX/YEUX/NEZ/BOUCHE` → `LA COUPE/LE REGARD/LE
   NEZ/LA BOUCHE` en surface joueur (repli sans article `COUPE/REGARD/NEZ/BOUCHE` si l'espace
   manque). Bandeau `PORTRAIT-ROBOT` → `TÊTE À CONNAÎTRE`. CTA `VALIDER LE PORTRAIT` →
   `SORTIR LA TÊTE`. « dossier suspect » → « la page 23 ». Chrono → `TÉLÉCARTE · {n} UNITÉS`
   (1 unité = 2,5 s, 14 unités au départ).
4. **Perte de vie retirée de tout le document (A1).** La garde `Escape`/retour (§7) est conservée
   mais reformulée : son motif n'est plus « perte de vie possible » mais « la scène se résout à
   l'état courant si abandonnée » (aucune issue n'est un échec sec, y compris l'abandon).
5. **Placement confirmé, plus une question ouverte (A2).** `AppPhase` `PORTRAIT_ROBOT` est un
   **interstitiel post-niveau** (`LEVEL_COMPLETE → NARRATIVE_POST → PORTRAIT_ROBOT → niveau
   suivant`), pas un sous-état de `PLAYING`, pas de gel du monde/shell ADR-0030. §7 mis à jour,
   §8.1/§8.3 (questions ouvertes) closes par le gate.
6. **Valeurs de chrono/difficulté chiffrées (A7)** : `Prefs.difficulty` module cette scène —
   `easy` 56 s / `normal` 35 s / `hard` 30 s ; pause du chrono sous `RotateOverlay` tranchée
   (§5.5, §7).
7. **Nouvelle §2.2 « Propositions desktop »** — pas une décision, une base de 3 options pour
   arbitrage sur maquette Figma (demande explicite Bertrand), socle clavier inchangé.
8. **Nouvelle §9 « Spécification pour la maquette »** — dimensions/proportions exploitables pour
   construire le Figma (mobile paysage 844×390, desktop 1440×900).

**Entrées ajoutées pour ce round :** `docs/game-design/design-gate-portrait-robot.md` (fait foi
sur tout chiffre, §3 du gate) ; arbitrage verbatim Bertrand 2026-08-05 sur le geste tactile.
**Entrées :** `docs/research/research-photofit-robocop-atari-st.md` (recon RoboCop Atari ST,
2026-08-05) ; arbitrage Bertrand du même jour (DA BD/comics maison, **pas** de visages numérisés) ;
`docs/game-design/ux/spec-hostage-qte-hud-readability.md` (conventions HUD diégétique maison) ;
`docs/game-design/pregame-landscape-ux.md` (conventions short-landscape) ; `docs/adr/0015-*`
(vocabulaire d'appareil) ; `src/game/systems/prefsSystem.ts` (préférences persistées) ;
`_bmad-output/guidelines/PROJECT_GUIDELINES.md` §5.
**Cette spec fixe :** layout des deux classes d'appareil, vocabulaire de gestes par appareil,
cibles tactiles, lisibilité sous chrono, accessibilité, états d'écran, insertion `AppPhase`.
**Cette spec ne fixe pas :** le nombre exact de variantes par bande, la durée du chrono, le barème
de score, la sanction d'échec précise (`game-designer`/ADR à venir) ; le style visuel des bandes,
la typo, le grain (`lead-art`) ; le texte du dossier suspect révélé (`narrative-designer`).

---

## 0. Cahier des charges — ce qu'on garde de RoboCop ST, ce qu'on change

| Élément original (CONFIRMÉ/PROBABLE, recon §1-4) | Décision muf |
| --- | --- |
| Portrait cible à gauche, portrait en construction à droite | **Gardé** en desktop landscape (assez de largeur). **Changé** en mobile landscape (§1.2) — la largeur ne tient pas 2 portraits + 4 bandes lisibles, voir §0.1. |
| Haut/bas = zone, gauche/droite = variante (joystick 4 directions) | **Traduit**, pas copié, par appareil — §2. Un joystick n'a pas d'équivalent 1-pour-1 en souris/tactile ; copier bêtement le mapping serait paresseux (consigne explicite du brief). |
| Aucun feedback par trait, jugement à l'œil en fin de phase | **Gardé, tranché par le gate (A9).** Round 1 proposait un état "verrouillé" indicatif comme réponse au point de confusion documenté par la recon ; le gate l'a **coupé** (A8) — le médaillon élargi (§4) traite la confusion par la proximité, pas par un pense-bête d'état. Zéro feedback pendant la phase, tout à la révélation (2,6 s, §6). |
| Portrait numérisé, mise en scène "gros portrait qui respire" | Mise en scène **gardée**, rendu **remplacé** par la DA BD/comics maison (arbitrage Bertrand) — hors scope de cette spec (`lead-art`). |
| Ordre de résolution libre | **Gardé.** Aucune raison ergonomique de forcer un ordre ; ADR-0034-style contrainte artificielle à éviter. |
| Timer 30-40 s, échec = perte de vie | **Changé (A1, gate).** Le chrono reste dans la fourchette 30-40 s (`easy` sort à 56 s pour l'accessibilité, A7) mais **aucune perte de vie n'est possible** — la sanction est en énergie, appliquée au niveau suivant (A1c). |

### 0.1 Pourquoi le layout "cible à gauche / construction à droite" ne survit pas tel quel au mobile paysage

Un iPhone SE en paysage fait ~568×320 px utiles (moins la barre `RotateOverlay`/fullscreen). Deux
portraits côte à côte + 4 bandes de sélection horizontales en dessous de CHAQUE portrait ne tient
pas à une taille lisible : c'est exactement le problème que `pregame-landscape-ux.md` a documenté
pour TITLE/MENU ("SPA scrollée" en hauteur, ici ce serait un écran écrasé en largeur). Le portrait
cible et les 4 bandes de sélection sont deux tâches séquentielles pour l'œil (comparer, puis
ajuster) — elles peuvent partager l'écran sans être côte à côte pleine hauteur. Solution retenue
§1.2 : le portrait cible devient une **vignette de référence** superposable/rappelée en permanence
(petit médaillon fixe, jamais > 20% de largeur), le gros de l'écran va aux 4 bandes qui sont la
tâche active. Le desktop landscape, lui, a la largeur pour les deux gros portraits façon ST — gardé.

---

## 1. Layout — wireframes ASCII

### 1.1 Desktop landscape (≥ 900×560, souris/clavier)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TÊTE À CONNAÎTRE          TÉLÉCARTE · 14 UNITÉS         [ ✕ Échap ]      │ ← HUD strip, 56px
├───────────────────────────┬────────────────────────────────────────────-─┤
│                           │                                              │
│   PAGE 23 (référence)    │   RECONSTRUCTION (en cours)                  │
│   ┌─────────────────┐    │   ┌─────────────────┐                        │
│   │                 │    │   │                 │                        │
│   │   portrait BD    │    │   │   portrait BD    │                       │
│   │   fixe, grand    │    │   │   en construction │                      │
│   │                 │    │   │                 │                        │
│   └─────────────────┘    │   └─────────────────┘                        │
│   ~40% largeur           │   ~40% largeur                               │
│                           │                                              │
├───────────────────────────┴────────────────────────────────────────────-─┤
│  LA COUPE   ◀ [ variante 3/6 ]●●●○○○ ▶        (compteur, pas de coche)  │ ← bande 1, 60px
│  LE REGARD  ◀ [ variante 1/6 ]●○○○○○ ▶                                  │ ← bande 2
│  LE NEZ     ◀ [ variante 4/6 ]●●●●○○ ▶                                  │ ← bande 3
│  LA BOUCHE  ◀ [ variante 2/6 ]●●○○○○ ▶                                  │ ← bande 4 (courante, surlignée)
├──────────────────────────────────────────────────────────────────────────┤
│                          [ SORTIR LA TÊTE ]                               │ ← CTA, 56px, actif après confirmGuard 1,0s
└──────────────────────────────────────────────────────────────────────────┘
```

Note : l'état « verrouillé » (coche `✓`) du round 1 est **retiré** (gate A8) — seul le compteur
`{n} sur {total}` subsiste comme lisibilité d'état, il n'affirme rien sur la justesse du choix.

- Les 2 portraits restent CÔTE À CÔTE (assez de largeur en desktop, c'est la mise en scène ST
  qu'on garde le plus fidèlement). Chacun ~40% de largeur, hauteur bornée pour laisser les 4
  bandes + CTA visibles sans scroll.
- Les 4 bandes sont empilées, hauteur fixe (§3), la bande **courante** (celle que le clavier
  contrôle) est visuellement distincte (pas par couleur seule — voir §5.2).
- CTA "VALIDER" toujours visible, jamais en bas d'un scroll — leçon directe de
  `pregame-landscape-ux.md` §0 (CTA sous la ligne de flottaison = bug caractérisé).

### 1.2 Mobile landscape (le cas contraignant — cible de référence 844×390)

```
┌────────────────────────────────────────────────────────────────────────┐
│ TÉLÉCARTE · 14 UNITÉS                                          [✕]     │ ← HUD, 32px
├─────────────────────┬────────────────────────────────────────────────-─┤
│                     │  LA COUPE     ◁           [variante img]     ▷   │ ← bande 1, 72px
│    médaillon        ├────────────────────────────────────────────────-─┤
│    cible (page 23)  │  LE REGARD    ◁           [variante img]     ▷   │ ← bande 2, 72px
│    28% largeur      ├────────────────────────────────────────────────-─┤
│    tap/long-press    │  LE NEZ       ◁           [variante img]     ▷   │ ← bande 3, 72px
│    = overlay plein   ├────────────────────────────────────────────────-─┤
│                     │  LA BOUCHE    ◁           [variante img]     ▷   │ ← bande 4, 72px
├─────────────────────┴────────────────────────────────────────────────-─┤
│                          [ SORTIR LA TÊTE ]                             │ ← CTA, 44px min, pleine largeur
└────────────────────────────────────────────────────────────────────────┘
```

- Le médaillon cible occupe une **colonne fixe à gauche, ≥ 28 % de la largeur d'écran** (repli du
  gate A8 après le CUT du mini-crop de comparaison locale — voir §4) : à 844px, 236px de large,
  toute la hauteur de la zone de contenu (HUD exclu, CTA exclu). Il est **rapproché des bandes**
  (colonne adjacente, pas un médaillon isolé en coin), toujours visible en l'état "cible fixe" ;
  tap ou pression maintenue l'agrandit en overlay plein-cadre TEMPORAIRE pour un examen fin.
- Les 4 bandes occupent la colonne de droite (≥ 72 % de largeur), empilées pleine hauteur restante,
  avec l'image de variante au centre. Les chevrons `◁ ▷` sont dessinés en semi-transparence aux
  bords — ce ne sont plus une cible tactile primaire, voir §2.3/§2.4 pour ce qu'ils deviennent.
- Le geste primaire sur mobile est le **swipe horizontal sur la bande visée** (§2.3) — pas un tap
  de sélection préalable.
- Budget vertical calculé à 390px de hauteur (cible 844×390) : HUD 32px + CTA 44px = 76px fixes,
  reste 314px pour les 4 bandes. Avec 3 séparations de 8px (élargies vs round 1, voir §2.3.4 —
  la marge inter-bandes est désormais aussi une garde anti-dérive de swipe, pas seulement
  visuelle) : `(314 − 3×8) / 4 = 72,5px` → **72px/bande**, arrondi à l'entier inférieur, largement
  au-dessus du plancher 44px de cible tactile.
- Rotation écran → couvert par `RotateOverlay` existant si portrait ; en paysage court, PAS de
  layout alternatif supplémentaire nécessaire car ce layout EST déjà le layout court. Chrono en
  **pause** sous `RotateOverlay` (A7).

---

## 2. Vocabulaire de gestes — une réponse par appareil, assumée

Le brief est explicite : pas un menu d'options, une réponse par appareil. Le contrôle original
(joystick, haut/bas=zone, gauche/droite=variante) n'a pas d'équivalent direct en souris ou au
doigt — le traduire nécessite un choix, pas une translittération.

### 2.1 Clavier (desktop) — socle acquis, inchangé

- **↑ / ↓** (ou **W/S**) : change la bande courante (`LA COUPE`→`LE REGARD`→`LE NEZ`→`LA BOUCHE`,
  cyclique).
- **← / →** (ou **A/D**) : fait défiler les variantes de la bande courante, ±1 par pression.
- **Entrée / Espace** : valide le portrait si le focus est sur le CTA (le verrouillage indicatif
  du round 1 est retiré, gate A8 — Entrée n'a plus d'effet sur une bande).
- **Échap** : ouvre la confirmation d'abandon (§7), jamais une sortie directe.
- Reste la traduction la plus fidèle du mapping ST d'origine (4 directions discrètes) — c'est le
  socle sur lequel toute proposition souris ci-dessous s'appuie sans le remplacer.

### 2.2 Propositions desktop — À TRANCHER SUR MAQUETTE (non figé ici)

Bertrand tranche sur Figma, pas ici. Ce qui suit sont **3 options distinctes**, présentées pour
que la maquette puisse les montrer côte à côte. Le clavier §2.1 est acquis dans les trois cas ; il
ne s'agit que du canal souris/pointeur additionnel.

**Option A — Clic sur zones gauche/droite de la bande** (zone cliquable = moitié gauche/droite de
la ligne de bande, pas seulement les chevrons).
- *Avantage* : traduction directe de "toucher LA bande qu'on veut" — cohérent avec le pointeur
  direct, gros hit-target (toute la moitié de bande), pas de fine motricité requise.
- *Coût* : demande une affordance visuelle claire (zone gauche = ◁, zone droite = ▷ en fond léger)
  sinon le joueur ne découvre pas qu'il peut cliquer ailleurs que sur les chevrons — c'est
  `lead-art` qui rend ça lisible.
- *Cohérence avec le tactile* : **faible** — le mobile n'a plus de notion de zone cliquable
  gauche/droite (A4-bis), donc cette option crée un modèle mental différent par appareil. Assumé
  si retenu (le brief accepte déjà une réponse par appareil), mais à nommer comme tel au gate si
  choisi.

**Option B — Drag horizontal de la bande** (cliquer-glisser directement l'image de variante,
relâcher déclenche le changement).
- *Avantage* : **seule option qui mime le geste tactile** — un utilisateur qui bascule entre
  souris et tactile (trackpad tactile, écran tactile desktop) retrouve le même geste. Cohérent
  avec la métaphore "bande de papier qu'on fait coulisser" (fiction).
- *Coût* : le drag à la souris est moins naturel que le clic pour un geste discret court (bruit de
  micro-mouvements, risque de déclenchement accidentel en survolant) ; demande le même seuil de
  distance/angle que le mobile (§2.3.1) adapté à la souris, donc une implémentation dupliquée du
  moteur de geste plutôt qu'un simple `onClick`.
- *Cohérence avec le tactile* : **forte** — un seul mental model "on fait glisser la bande" pour
  les deux appareils, au prix d'une IHM souris moins idiomatique.

**Option C — Molette sur la bande survolée = variante ±1, chevrons cliquables en repli**
(reprend le round 1, chevrons désormais visibles et cliquables comme option de référence, molette
en raccourci).
- *Avantage* : le plus rapide à l'usage pour un joueur qui connaît déjà le geste "scroller pour
  changer une valeur" (carrousels, sélecteurs) ; ne demande aucun hit-target large ; les chevrons
  cliquables restent l'input de référence testable et accessible au clic simple, donc le geste
  souris additionnel (molette) ne retire jamais de fonctionnalité s'il est ignoré.
- *Coût* : la molette n'est pas découvrable sans indice visuel (curseur qui change au survol,
  micro-légende) — sans ce soin, une partie des joueurs ne la trouvera jamais et se rabattra sur
  les chevrons, ce qui est acceptable (repli fonctionnel) mais moins rapide.
- *Cohérence avec le tactile* : **nulle par construction** (la molette n'a pas d'équivalent
  tactile) — assumé, c'est une réponse par appareil comme le brief le demande, pas une
  incohérence à corriger.

**Recommandation Tony, pour arbitrage, pas une décision :** Option C, chevrons cliquables comme
socle **+** molette comme accélérateur, parce que c'est la seule des trois qui ne force aucun
joueur desktop à apprendre un nouveau geste pour agir (le clic sur chevron est déjà universellement
compris) tout en offrant une voie rapide à qui la découvre. Option B est la plus "cohérente" mais
au prix d'une IHM souris dégradée — à soupeser sur maquette avant de trancher.

### 2.3 Tactile (mobile) — swipe horizontal sur la bande visée (A4-bis, arbitrage Bertrand)

**Renversement du round 1, ordre direct :** « un swipe gauche/droite sur chaque bande, on oublie
ta sélection et tes flèches. » Le geste primaire est désormais un **swipe horizontal exécuté
directement sur la bande visée**, qui fait défiler les variantes de CETTE bande. Il n'y a plus de
tap de sélection préalable, plus de notion de « bande active » au doigt : les 4 bandes sont des
pistes indépendantes qu'on fait coulisser sous le doigt, dans n'importe quel ordre, en un seul
geste par action.

Ce que cela règle par rapport au rejet du round 1 : il supprime précisément l'aller-retour
sélection→action que je cherchais à éviter, en collant à la métaphore physique de la bande de
papier qu'on fait coulisser (fiction : « planche de gueules découpée »). L'ambiguïté que je
documentais (swipe diagonal, cible 44px) ne disparaît pas pour autant — elle devient un problème à
résoudre, ci-dessous, chiffré.

#### 2.3.1 Seuil d'angle et distance de déclenchement (chiffré)

- **Angle de tolérance horizontale : ≤ 30° par rapport à l'axe X** depuis le point de contact
  initial. Au-delà de 30° (mesuré `atan(|Δy| / |Δx|)`), le geste n'est **pas** reconnu comme un
  swipe de bande : il est annulé sans effet (aucun cran appliqué), pas réinterprété comme un
  autre geste (pas de scroll de page — la scène n'a pas de scroll vertical, §1.2). 30° est le
  compromis standard tactile (entre la tolérance stricte 15-20° des carrousels précis et la
  tolérance large 45° qui accepterait des swipes quasi-diagonaux) — retenu strict côté bas de la
  fourchette parce qu'on est sous chrono et que les 4 bandes sont proches verticalement (72px,
  §1.2), donc le risque de contamination inter-bande prime sur la permissivité du geste.
- **Distance minimale de déclenchement : 40px horizontaux** depuis le point de contact initial
  (avant application de l'angle ci-dessus). En dessous de 40px, le relâchement est traité comme un
  tap manqué (aucun effet) — ni cran de variante, ni erreur affichée. 40px est choisi pour être
  net au-dessus du bruit de tremblement/tap involontaire (~10px) tout en restant largement
  atteignable dans la largeur d'une bande à 844px (608px de colonne bandes, §1.2) sans que le
  joueur ait besoin d'un grand mouvement de bras sous stress de chrono.
- Ces deux seuils sont vérifiables en e2e par simulation de `pointerdown/pointermove/pointerup`
  synthétiques à angle et distance contrôlés (acceptance §3).

#### 2.3.2 Discret, pas continu — 1 swipe = 1 cran

**Tranché : discret.** Un swipe qui franchit le seuil de déclenchement (§2.3.1) fait avancer ou
reculer la variante de **exactement 1 cran**, quelle que soit la vitesse ou la distance
au-delà du seuil (pas de "swipe plus fort = plusieurs crans", pas d'inertie/momentum qui
continuerait à défiler après le relâchement du doigt). Motif : sous un chrono de 35 s avec 4
bandes à régler, un défilement à l'inertie introduit une incertitude sur le nombre exact de crans
appliqués (overshoot fréquent en carrousel à inertie) — le joueur devrait alors corriger,
c'est-à-dire un second aller-retour non prévu, exactement le coût que le geste discret vise à
éviter. Un cran par swipe est **prévisible et comptable** : avec 6 variantes max par bande, le pire
cas est 5 swipes pour une bande, ce qui reste dans le budget d'input de 25 % du chrono déjà posé
par `game-designer` (AC11, gate §A5). Un nouveau swipe peut démarrer immédiatement après le
relâchement précédent (pas de cooldown artificiel) — la limite de vitesse est la vitesse du doigt
du joueur, pas un throttle logiciel.

#### 2.3.3 Le sort des chevrons ◁ ▷ — rétrogradés, pas supprimés

Les chevrons **ne disparaissent pas**. Ils changent de rôle :

- **Sur mobile, ils cessent d'être un geste primaire actionnable au doigt** en usage normal (le
  swipe couvre l'action). Ils restent **visuellement présents** comme affordance qui signale "ceci
  défile horizontalement" (aide à la découverte du geste, surtout à la première rencontre de la
  scène) — rendu à définir par `lead-art`, plus discret que le round 1 (semi-transparent, taille
  réduite, cf. wireframe §1.2).
- Ils redeviennent une **cible d'accessibilité de plein droit, pas décorative** : un swipe n'est
  actionnable ni au clavier, ni par un lecteur d'écran, ni par un switch/contacteur d'accessibilité
  motrice. Les chevrons ◁ ▷ restent donc des **boutons réels** (`<button>`, `role="button"`,
  `aria-label`, §5.4), **tapables** en plus du swipe (un tap précis sur le chevron déclenche le
  même cran qu'un swipe — ce n'est pas un mode dégradé, c'est un input strictement équivalent),
  avec leur cible ≥ 44×44px inchangée (§3). C'est le canal qui satisfait le principe
  d'accessibilité "toute action gestuelle a un équivalent non gestuel" — ici, tap sur bouton.
- Conséquence directe : le clavier (§2.1, ←→ change la variante de la bande courante) et les
  chevrons tapables sont les deux chemins d'accessibilité de cette scène sur mobile ; le swipe est
  la voie rapide, jamais la voie unique.

#### 2.3.4 Doigt qui part d'une bande et finit sur une autre

Le geste est **résolu sur la bande d'origine** (celle sous le point de contact initial
`pointerdown`), pas sur la bande où le doigt termine sa course. Règle précise :

- Si le point de contact **sort des bornes verticales de la bande d'origine de plus de 12px**
  pendant le mouvement (dérive verticale au-delà d'une petite tolérance de tremblement), le geste
  est **annulé sans effet** — pas transféré à la bande voisine, pas appliqué à la bande d'origine
  non plus. Le joueur doit relâcher et recommencer. C'est délibérément strict : appliquer le cran
  à une bande que le doigt ne "vise" plus au moment du relâchement serait une action fantôme, pire
  qu'une absence d'action.
- Cette règle est la raison pour laquelle **l'espacement inter-bandes passe de 2px (round 1) à
  8px** (§1.2, §3) — c'est désormais une garde anti-dérive de geste, pas seulement une séparation
  visuelle : 8px de zone morte entre deux bandes de 72px absorbe une dérive de doigt raisonnable
  avant de franchir la tolérance de 12px dans la bande voisine.
- **Retour visuel/haptique du cran** : au franchissement du seuil de déclenchement, (a) l'image de
  variante affiche un cut instantané vers la variante suivante (pas de slide/fade en continu — la
  transition EST le geste, cohérent avec "discret" §2.3.2 ; en `reduced-motion` la règle D5.1
  s'applique de toute façon) accompagné d'un bref flash de contour (2 frames, non coloré seul,
  §5.2) sur la bande concernée ; (b) un clic sonore bref identique à celui du round 1 (§6) ; (c) si
  `navigator.vibrate` est disponible et que la préférence système ne le désactive pas, une
  vibration courte (~10 ms) marque le cran — jamais requis pour comprendre l'état, un renfort
  discret uniquement.

### 2.4 Copie d'appareil (ADR-0015)

Toute instruction affichée à l'écran (si un onboarding contextuel existe pour cette scène — à
coordonner avec `narrative-designer`) suit le vocabulaire ADR-0015 : mobile = "**deux doigts**"
n'est PAS pertinent ici (pas de tir), donc la copie mobile doit dire **"fais glisser une bande pour
changer"** (jamais "touche"/"tape" seul, qui décrirait un tap et non un swipe) — jamais
"clic"/"souris" côté mobile, jamais "glisse" côté desktop sauf si l'Option B (§2.2) est retenue au
Figma, même règle de fork que le tutoriel (D3, ADR-0015).

---

## 3. Cibles tactiles — chiffré

- **Zone de swipe = la bande entière** (§2.3) : hauteur 72px en mobile landscape à 844×390 (calcul
  §1.2), largeur = toute la colonne bandes (≥ 72 % d'écran). C'est la cible du geste primaire, pas
  seulement une bande de confort.
- **Chevrons ◁ / ▷** (accessibilité + affordance, §2.3.3) : 44×44px minimum (WCAG 2.5.5 / iOS
  HIG) inchangé, avec 8px de marge cliquable autour du glyphe visuel — la zone de hit-test n'est
  jamais réduite à la taille du glyphe, même rétrogradé visuellement.
- **Espacement inter-bandes : 8px** (élargi vs 2px round 1) — c'est désormais une **garde
  anti-dérive de swipe** en plus d'une séparation visuelle (§2.3.4) : absorbe la dérive verticale
  du doigt avant de franchir la tolérance de 12px vers la bande voisine.
- **CTA "SORTIR LA TÊTE"** : 44px de hauteur minimum, pleine largeur moins marges de 12px de
  chaque côté, toujours dans les 44px du bord d'écran le plus proche pour rester joignable au
  pouce en tenue mobile paysage à deux mains (pouces aux coins).
- **Quand 4 bandes + HUD + CTA ne tiennent PAS** (écran < ~300px de hauteur utile, cas extrême type
  petit téléphone avec barre de navigation OS visible) : le HUD passe à 28px (chrono seul, pas de
  libellé), et les bandes compressent leur padding interne (pas leur cible de swipe — jamais en
  dessous de 44px de hauteur, on réduit le texte/l'image avant la cible).
- **Acceptance geste (§2.3)** : test e2e simulant un swipe à 45° (doit être rejeté, aucun cran) et
  un swipe à 25° sur 40px (doit produire exactement 1 cran) ; test simulant un `pointerdown` sur
  une bande suivi d'une dérive verticale de 15px (doit annuler le geste, aucun cran) ; assertion
  que les chevrons restent des `<button>` cliquables/`Enter`-activables indépendamment du swipe.

---

## 4. Lisibilité sous chrono — le problème central de cette scène

La recon nomme le problème : "until you've got a full face it's easy to get confused" — l'aller-
retour entre cible et construction, sous pression du temps, est fatiguant et source d'erreur qui
n'est PAS un test de skill voulu (contrairement à un QTE de visée). Trois réponses :

**D4.1 — Le médaillon de référence reste TOUJOURS visible, jamais un onglet à ouvrir.** En
desktop, c'est le portrait complet côte-à-côte (déjà résolu, §1.1). En mobile, c'est le médaillon
**≥ 28 % de largeur, rapproché des bandes** (§1.2) — jamais besoin d'un tap pour SAVOIR à quoi ça
doit ressembler ; le tap/long-press ne sert qu'à l'agrandir pour un examen fin, pas à le révéler.

**D4.2/D4.3 — CUT par le gate (A8).** Le mini-crop de comparaison locale (repère co-localisé
bande/variante/cible) proposé en round 1 est retiré : il attaquait le verbe de la scène (la
comparaison EST l'épreuve, une aide qui la préremplit à moitié en change la nature) et coûtait le
plus cher à implémenter pour un problème que la proximité du médaillon élargi (D4.1) traite déjà
suffisamment — la cible étant visible en permanence, il ne s'agit pas d'un test de mémoire à
soulager. Le repli retenu **est** D4.1 renforcé : le médaillon grossit et se rapproche, il ne se
substitue à aucune comparaison locale.

**Acceptance (D4)** : capture d'écran mobile-landscape montrant le médaillon ≥ 28 % de largeur
adjacent à la colonne de bandes ; capture desktop montrant les deux portraits pleins simultanément.

---

## 5. Accessibilité — non négociable

**D5.1 — Reduced-motion.** Toute animation de "l'écran qui respire" (pulsation du cadre HUD,
transition de variante) suit la même convention maison que `DiagramIcon.tsx`/`GestureIcon.tsx` :
`prefers-reduced-motion` OU `data-reduced-motion="true"` (pref joueur, ADR-0054) gèle la
respiration sur une frame statique lisible ; le changement de variante devient un cut instantané
au lieu d'un slide/fade. Le chrono lui-même n'est jamais animé par un effet de "pulse rouge
clignotant" en dessous d'un seuil — voir D5.4.

**D5.2 — Le repère n'est jamais la couleur seule (daltonisme).** Le franchissement d'un cran de
swipe (§2.3.4) se signale par un flash de contour de forme identifiable (pas une teinte seule) +
son + haptique optionnel — jamais une pastille colorée isolée. Le compteur `{n} sur {total}`
(texte, pas couleur) reste la seule lisibilité d'état persistante par bande — le "verrouillage
indicatif" et son repère coche/couleur du round 1 sont retirés (gate A8, plus d'état à distinguer).
Vérifiable : capture en simulation deuteranopie/protanopie, le retour de cran reste perceptible
sans la couleur.

**D5.3 — Taille de texte et contraste.** Libellés de bande ("CHEVEUX", "YEUX"...) en majuscules
courtes pour rester lisibles à la taille mobile réduite (§3) ; taille minimale 14px effective à
l'écran (pas de texte en dessous du seuil WCAG AA pour du texte informatif). Contraste texte/fond
conforme AA (4.5:1) — valeur exacte = `lead-art`, mais la CONTRAINTE de ratio est ici et non
négociable.

**D5.4 — ARIA / labels (UI HTML).** Chaque bande est un groupe `role="group"` avec
`aria-label="{Nom de bande}, variante {n} sur {total}"` (nom de bande = vocabulaire canon A6 : `LA
COUPE`/`LE REGARD`/`LE NEZ`/`LA BOUCHE`) ; les chevrons ◁ ▷ sont des `<button>` réels avec
`aria-label="Variante précédente/suivante — {nom de bande}"`, actionnables au clic/`Enter`
indépendamment du swipe (§2.3.3 — c'est leur rôle premier maintenant, pas un à-côté). Le
`aria-pressed`/état "verrouillé" du round 1 disparaît (gate A8, plus d'état binaire à exposer). Le
chrono s'expose en `aria-live="polite"` avec un throttle raisonnable (annoncer aux paliers
documentés en D5.5, pas à chaque seconde).

**D5.5 — Le chrono est une barrière d'accessibilité : la traiter, pas l'ignorer.** Un joueur lent
(moteur, cognitif, lecteur d'écran) est structurellement désavantagé par un chrono serré sur une
tâche de comparaison fine — et un joueur qui ne peut pas swiper (tremblement, précision motrice
réduite) dépend entièrement des chevrons tapables/clavier (§2.3.3), donc du même chrono. Réponse
à deux niveaux, **valeurs chiffrées par le gate (A7)** :

1. **Échappatoire = `Prefs.difficulty`** (`easy | normal | hard`,
   `src/game/systems/prefsSystem.ts`), câblée sur cette scène spécifiquement :
   `easy` = **56 s**, `normal` = **35 s**, `hard` = **30 s** (le plancher assume de sortir de la
   fourchette historique 30-40 s pour `easy` — accessibilité avant fidélité, arbitrage gate A7).
   Un toggle qui ne s'applique pas à cette scène précise serait la même incohérence que la règle
   mère du CRT : un toggle qui ne s'applique pas partout où il le devrait est un mensonge.
2. **Annonce des paliers pour lecteur d'écran, calés sur les paliers narratifs/musicaux du
   gate (A7)** : à **17,5 s** (mi-parcours, 7 unités), **10,0 s** (urgence, 4 unités) et **5,0 s**
   (dernier, 2 unités) restantes, `aria-live` annonce le temps restant en unités télécarte
   (throttle explicite, un seul événement par palier) — un joueur non-voyant sent l'urgence sans
   dépendre du rendu visuel du chrono, sur les mêmes battements que le reste de la scène (musique,
   copie KENZA), pas des paliers UX isolés.
3. **Chrono en pause sous `RotateOverlay`** (A7, close la question ouverte §8) : le joueur ne peut
   pas jouer derrière l'overlay, donc laisser le chrono courir serait une perte non imputable.

**Acceptance (D5)** : test e2e togglant `reducedMotion`, capture en simulation daltonienne,
assertion aria sur chaque bouton chevron + groupe de bande, test togglant `difficulty` et
vérifiant que la durée effective devient 56/35/30 s pour CETTE scène spécifiquement, test
togglant `RotateOverlay` et vérifiant que le chrono ne décompte plus derrière.

---

## 6. États de l'écran

| État | Ce que voit le joueur | Ce qu'il entend |
| --- | --- | --- |
| **ENTRÉE** | Transition depuis `NARRATIVE_POST` ; médaillon cible (page 23) apparaît en premier (1 beat), PUIS les 4 bandes se déploient (Paper Mario rule, §"UI Fanzine" des guidelines) ; `confirmGuardSeconds` 1,0 s avant que le CTA ne devienne actif ; chrono démarre visible dès l'affichage complet, pas avant | Sting audio court signalant l'entrée en mini-jeu, distinct de la musique de niveau |
| **SÉLECTION EN COURS (`ACTIVE`)** | 4 bandes, chacune swipable indépendamment (§2.3) ; **zéro feedback juste/faux sous quelque forme que ce soit** (A9, gate) — seul le compteur `{n} sur {total}` évolue ; chrono `TÉLÉCARTE · {n} UNITÉS` décompte en HUD | Musique tendue en boucle (guidelines §6 — tempo = seul indicateur de tension) ; clic sonore bref à chaque cran de swipe/chevron (§2.3.4) |
| **PALIERS CHRONO** (17,5 s / 10,0 s / 5,0 s restantes, A7) | Chrono change de style aux paliers urgence/dernier (contraste/forme, pas couleur seule — D5.2) ; PAS de shake d'écran ni de flash strobant (reduced-motion + confort général) | Répliques KENZA (mi-parcours / urgence, gate A7) ; le tempo musical s'accélère aux paliers ; annonce `aria-live` au dernier palier (D5.5) ; pas de bip strident répété |
| **RÉVÉLATION DU VERDICT** (2,6 s, `revealSeconds`) | Écran se fige ; **c'est ici, et seulement ici, que le feedback apparaît** (A9) — 4 verdicts de haut en bas (~0,45 s chacun), correction visible de chaque bande fausse, 0,8 s de tenue ; médaillon et reconstruction se rapprochent visuellement pour la comparaison finale | Sting de verdict progressif par bande, puis sting global WON/PARTIAL/LOST (vocabulaire `spec-boss-qte-*`) |
| **TENUE DU RÉSULTAT** (2,2 s, `resultHoldSeconds`) | Tampon `IDENTIFIED`/`PARTIAL`/`FAILED` affiché avec raison explicite (guidelines §5 règle 4 — ex. "3 sur 4" pour `PARTIAL`) ; textes = `narrative-designer` | — |
| **SORTIE** | Transition vers `LEVEL_COMPLETE`/niveau suivant ; le payoff narratif (page 23 qui refuse, ou habitué refusé) se joue en pré-niveau suivant, pas ici (A10) ; les répliques d'entrée/sortie sont skippables en un geste, la phase interactive ne l'est pas (A2) | — |

---

## 7. Insertion dans le flow (`AppPhase`)

- **`AppPhase` dédié `"PORTRAIT_ROBOT"`, interstitiel post-niveau (A2, confirmé par le gate,
  n'est plus une question ouverte)** : chaîne `LEVEL_COMPLETE → NARRATIVE_POST → PORTRAIT_ROBOT →
  (niveau suivant)`. Pas un sous-état de `PLAYING`, pas de gel du monde ni de réemploi du shell
  ADR-0030 — la scène n'a pas de monde à figer, elle vit entre deux niveaux. Nommage/placement
  exact dans `App.tsx` = `senior-architect`.
- **Échap / bouton retour** : suit la convention `Escape` déjà câblée globalement
  (`App.tsx:314`) — **mais spécifiquement pour cette scène**, `Escape` n'expulse pas directement
  vers `TITLE` sans confirmation si la scène est engagée mi-résolution. Motif reformulé (A1/A2,
  round 2) : **aucune perte de vie n'est en jeu** (perte de vie interdite sur cette scène, toutes
  issues confondues) — la garde existe parce qu'un abandon en cours **résout la scène à l'état
  courant** exactement comme l'expiration du chrono (aucun raccourci de sortie ne doit produire un
  résultat non évalué). Confirmation légère ("Abandonner ?") avant de quitter, sur `Escape` comme
  sur le bouton retour Android.
- **Rotation en pleine scène** : la scène EST son propre layout court-paysage (§1.2) — aucune
  bascule dynamique supplémentaire pour une rotation paysage→paysage. Portrait→paysage suit la
  garde `RotateOverlay` globale (`App.tsx:278`) ; le chrono est **en pause** derrière l'overlay
  (A7, tranché — n'est plus une question ouverte).

---

## 8. Questions ouvertes restantes

Toutes les questions du round 1 sont closes par le design gate (nombre de bandes/variantes = A5,
verrouillage indicatif = A8/CUT, chrono sous `RotateOverlay` = A7, sanction/payoff = A1/A10,
mini-crop = A8/CUT). Il ne reste, pour cette lane, que le point que le gate a explicitement
renvoyé ici :

1. **Mapping desktop (§2.2)** : les 3 options proposées ne sont pas départagées — arbitrage sur
   maquette Figma, demande explicite Bertrand. Le socle clavier (§2.1) est acquis quel que soit le
   choix.

---

## 9. Spécification pour la maquette (Figma)

Valeurs exploitables directement pour dessiner l'écran, sur les deux cibles de référence. Tout ce
qui est en px est calculé à partir du viewport indiqué ; le style (couleurs, typo, texture,
glow) reste `lead-art`.

### 9.1 Mobile paysage — cible 844×390

**Hiérarchie de zones (3 lignes empilées, la colonne médaillon traverse la ligne du milieu) :**

| Zone | x | y | largeur | hauteur | Contenu |
| --- | --- | --- | --- | --- | --- |
| HUD | 0 | 0 | 844 | 32 | Bandeau `TÊTE À CONNAÎTRE` (peut être omis si l'espace manque, `lead-art`) à gauche ou masqué, `TÉLÉCARTE · {n} UNITÉS` centré/à droite, bouton retour `✕` en coin, ≥ 44×44px cible |
| Médaillon | 0 | 32 | **236 (28 %)** | 314 | Portrait cible page 23, fixe, contour distinct (pas de glow — §5, gate) ; tap/long-press = overlay plein écran temporaire |
| Colonne bandes | 236 | 32 | 608 (72 %) | 314 | 4 bandes empilées |
| Bande (×4) | 236 | 32 + i×(72+8) | 608 | **72** | Libellé (`LA COUPE`/…) à gauche, image de variante centrée, compteur `{n}/{total}` à droite, chevrons ◁▷ semi-transparents aux bords (44×44px cible, zone de swipe = toute la bande) |
| Gap inter-bandes | — | — | 608 | **8** | Zone morte anti-dérive (§2.3.4), pas de contenu |
| CTA | 0 | 346 | 844 | 44 | `SORTIR LA TÊTE`, pleine largeur, inerte visuellement pendant `confirmGuardSeconds` (1,0 s) |

**États à prévoir sur la maquette :** ENTRÉE (médaillon seul, bandes pas encore déployées) ·
ACTIVE (les 5 blocs ci-dessus) · cran de swipe (flash de contour bref sur 1 bande) · palier
urgence/dernier (chrono restylé) · RÉVÉLATION (4 verdicts qui descendent bande par bande,
médaillon et colonne bandes rapprochés) · confirmation d'abandon (overlay léger par-dessus, pas
plein écran).

### 9.2 Desktop — cible 1440×900

| Zone | x | y | largeur | hauteur | Contenu |
| --- | --- | --- | --- | --- | --- |
| HUD | 0 | 0 | 1440 | 56 | Bandeau `TÊTE À CONNAÎTRE` à gauche, `TÉLÉCARTE · {n} UNITÉS` au centre, `✕ Échap` à droite |
| Portrait cible (page 23) | 40 | 76 | **576 (40 %)** | 480 | Grand format, fixe |
| Portrait reconstruction | 824 | 76 | **576 (40 %)** | 480 | Se construit en direct au fil des swipes/clics |
| Gap central | 616 | 76 | 208 | 480 | Zone tampon (peut porter un élément narratif léger, `lead-art`/`narrative-designer`) |
| Colonne bandes | 40 | 556 | 1360 | 264 | 4 bandes empilées |
| Bande (×4) | 40 | 556 + i×(60+8) | 1360 | **60** | Libellé, chevrons cliquables ◀▶ (44×44px), zone de variante, compteur ; bande courante (celle contrôlée au clavier) visuellement distincte (bordure, pas couleur seule) |
| CTA | 40 | 836 | 1360 | 56 | `SORTIR LA TÊTE`, actif après `confirmGuardSeconds` |

**Sur la maquette, prévoir les 3 variantes du mapping souris (§2.2, Options A/B/C) comme
annotations ou frames alternatives sur la même bande** pour que l'arbitrage puisse comparer
visuellement : zones cliquables gauche/droite (A), poignée de drag suggérée sur l'image (B),
curseur "scroll" au survol + chevrons toujours visibles (C).

### 9.3 Constantes transverses aux deux cibles

- Cible tactile/clic minimale : **44×44px**, jamais réduite quelle que soit la densité d'écran.
- Contraste texte/fond : **AA, 4,5:1** minimum (valeurs exactes = `lead-art`, contrainte non
  négociable).
- Texte informatif (libellés de bande, compteur) : **14px effectif minimum**.
- Aucun état de la maquette ne doit encoder une information par la couleur seule (§5.2) — prévoir
  une forme/icône en complément partout où un état change.
- Le CTA n'est **jamais** sous une ligne de flottaison scrollée, sur aucune des deux cibles.
