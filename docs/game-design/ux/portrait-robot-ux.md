# UX spec — scène TÊTE À CONNAÎTRE (ex. "portrait-robot")

**Surface :** scène interstitielle post-niveau — recomposer un visage suspect à partir de 4 bandes
**jointives** (`LA COUPE / LE REGARD / LE NEZ / LA BOUCHE`) sous chrono continu (jauge télécarte,
sans unité affichée). **Validation automatique** dès 4/4, aucun CTA.
**Auteur :** `ux-designer` (Tony) · **Date création :** 2026-08-05 · **Round 2 :** 2026-08-05 ·
**Round 3 :** 2026-08-05 · **Round 4 :** 2026-08-05
**Statut :** RÉVISÉ round 4 — trou d'ergonomie identifié par `game-designer` (joueur à 3/4 sans
aucun geste, jusqu'à 20 s devant une jauge qui se vide) comblé par une **sortie anticipée**
rhabillée en affordance permanente à l'écran (« j'ai fini, imprime »), ratifiée par Bertrand : pas
de retour du CTA de validation. §2.8 (nouvelle), §3, §5.4, §7, §9.1/§9.2 mis à jour.

## Journal de révision (round 4)

**Le trou identifié.** Depuis B1 (round 3), la scène se verrouille seule à 4/4, sans CTA. Mais un
joueur qui est à 3/4 et se croit fini n'a plus aucun geste disponible — il ne peut qu'attendre
l'expiration du chrono (jusqu'à 20 s à `normal`) devant une jauge qui se vide sans qu'il sache s'il
a une porte de sortie. `game-designer` documente que c'est l'état normal de l'échec honnête, pas un
cas rare (`PARTIAL` à 3/4 est une issue attendue du design, pas un accident) — donc pas un problème
marginal à ignorer.

**Solution ratifiée par Bertrand — pas de retour du CTA.** On ne réintroduit pas un bouton de
validation. On rhabille la **sortie anticipée déjà existante** (§7, la garde `Escape`/retour) : elle
résout la scène à l'état courant exactement comme le buzzer de fin de chrono — mais son sens change.
Elle ne signifie plus « j'abandonne » (aucune connotation d'échec, cohérent avec A1 : aucune perte de
vie n'a jamais été en jeu sur cette scène) : elle signifie **« j'ai fini, imprime »**. Exigence
explicite : cette sortie doit être une **affordance permanente à l'écran**, jamais un `Escape` caché
— un raccourci clavier invisible ne résout pas le problème d'un joueur qui ne sait pas qu'il a une
porte.

**Ce qui a changé, concrètement :**

1. **Le bouton `[✕]` de coin déjà présent au HUD (§1.1, §1.2, §9) change de rôle et de sens**, pas de
   position ni de gabarit. Il portait déjà `Escape`/retour avec confirmation légère (§7) ; il devient
   la sortie anticipée « imprime ». Aucun nouvel élément n'est ajouté au layout — voir §2.8 pour le
   motif de ce choix (ne PAS ajouter une deuxième cible).
2. **Nouvelle §2.8** : spec complète de l'affordance — pourquoi elle n'est PAS un CTA malgré sa
   permanence, traitement visuel distinctif, gabarit de copie pour `narrative-designer`.
3. **Confirmé retenu, mécanisme tranché en armé/tir (A17, `lead-game-designer`)** — §2.8.3 : premier
   appui arme (2,0 s, chrono non mis en pause), second appui sur la même cible sort ; plus d'overlay
   (masquait cible/bandes, réintroduisait un CTA à deux boutons). Nouvelle §2.8.3bis : état armé
   distinct du verrouillage §2.5 par portée/durée, jamais par la couleur seule. §2.8.4 tranche
   l'accessibilité du double-appui : `Escape` et l'activation clavier du bouton résolvent en un seul
   appui (une action clavier délibérée vaut confirmation en soi), le double-appui chronométré reste
   réservé au pointeur.
4. **§7 fusionnée avec §2.8** : il n'existe plus deux concepts distincts (« abandon » et
   « validation anticipée ») mais un seul bouton, un seul comportement, une seule confirmation — la
   copie de la confirmation change de registre (narrative-designer), pas son mécanisme.
5. **§3, §5.4, §9.1, §9.2** mis à jour avec les cotes exactes de la cible (elle existait déjà en
   layout — seules le rôle, le libellé et l'aria changent, gabarit et position inchangés donc la
   jointure des 4 bandes et la parité des deux visages ne bougent PAS).

**Entrée ajoutée pour ce round :** trou d'ergonomie signalé par `game-designer` (3/4 sans geste
disponible, 2026-08-05) ; arbitrage Bertrand du même jour (pas de retour du CTA, rhabillage de la
sortie anticipée, affordance permanente non cachée) ; copie exacte réservée à `narrative-designer`
(registre « j'ai fini, imprime »).

---

## Journal de révision (round 3)

**Ce qui a changé et sur ordre de qui — trois arbitrages directs, tous postérieurs au round 2 :**

1. **CTA `SORTIR LA TÊTE` supprimé (B1/A12bis).** Validation automatique et immédiate dès que les
   4 bandes affichent 4/4 (« verrouillage »). Tout le document est purgé des mentions de CTA,
   `confirmGuardSeconds`, Entrée-valide, focus CTA. Nouvel invariant de seed
   (`initialStateAllWrong`) remplace la garde temporelle — §1, §2.1, §3, §6, §7, §9.
2. **Chrono continu, plus d'unités (B2/A13).** `TÉLÉCARTE · {n} UNITÉS` disparaît. La jauge se vide
   en continu (habillage télécarte conservé comme objet, pas comme compteur), essais illimités.
   Paliers refaits en secondes (50 % écoulé · 10,0 s restantes · 5,0 s restantes). Accessibilité du
   chrono continu réécrite en §5.5 — l'annonce `aria-live` ne peut plus dire « n unités », elle
   réutilise les répliques KENZA déjà écrites comme texte du live-region, à 3 occurrences fixes,
   jamais une par seconde.
3. **Desktop tranché — Option B (drag horizontal), §8 B3 du gate.** §2.2 n'est plus une liste de
   3 propositions : c'est une décision documentée avec son motif (§2.2). Nouvelle §2.6 : seuils,
   comportement du curseur, relâchement à mi-chemin, cohabitation avec les chevrons et le clavier.
4. **Bandes jointives — correction directe Bertrand sur le layout.** Le gap inter-bandes de 8px
   (justifié en round 2 comme garde anti-dérive de swipe) est retiré : les 4 bandes forment une
   **seule surface continue**, au gabarit exact de la cible, sans aucune couture. La garde
   anti-dérive est retrouvée **autrement** — verrouillage de la bande d'origine au `pointerdown` +
   hystérésis en deux phases (pré-engagement / post-engagement), voir §2.3.4 réécrite. S'applique
   identiquement au drag desktop (§2.6).
5. **Nouvel état « verrouillé » spécifié en propre (§2.5)** — c'est le seul feedback de toute la
   scène (A16) : signal global, terminal, non ambigu avec un simple changement de variante, sans
   dépendre de la couleur, compatible reduced-motion.
6. **§9 réécrite** pour décrire ce qui est réellement dessiné dans le Figma (bandes jointives 68px,
   pas de CTA, hauteur libérée redistribuée entre la taille des bandes et la marge de cadrage
   assurant la parité de taille des deux visages).

**Entrée ajoutée pour ce round :** `docs/game-design/design-gate-portrait-robot.md` §8
« Amendements post-gate » et §3 mise à jour (fait foi) ; maquette Figma `muf — Design System` ›
`Écrans · Portrait-robot` (référence de fait, mobile 844×390 / desktop 1440×900).

---

## Journal de révision (round 2)

**Ce qui a changé et sur ordre de qui :**

1. **Geste tactile renversé — ordre direct Bertrand, prime sur le gate.** « Pour les contrôles
   mobiles : un swipe gauche/droite sur chaque bande, on oublie ta sélection et tes flèches. » Le
   §2.3 est réécrit intégralement : swipe horizontal sur la bande visée = geste primaire, plus de
   tap de sélection, plus de notion de bande active au doigt, chevrons rétrogradés en affordance +
   cible d'accessibilité (§2.3, §2.7).
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
│  TÊTE À CONNAÎTRE                    [jauge télécarte, sans nombre]  [✕]  │ ← HUD strip, 56px
├───────────────────────────┬────────────────────────────────────────────-─┤
│                           │                                              │
│   PAGE 23 (référence)    │   RECONSTRUCTION (en cours)                  │
│   ┌─────────────────┐    │   ┌─────────────────┐                        │
│   │                 │    │   │                 │                        │
│   │   portrait BD    │    │   │   portrait BD    │                       │
│   │   fixe, grand    │    │   │   en construction │                      │
│   │                 │    │   │                 │                        │
│   └─────────────────┘    │   └─────────────────┘                        │
│   ~40% largeur           │   ~40% largeur, même taille que la cible     │
│                           │                                              │
├───────────────────────────┴────────────────────────────────────────────-─┤
│ LA COUPE   ◁[ variante 3/6 ]●●●○○○▷ ‖LE REGARD ◁[1/6]●○○○○○▷‖LE NEZ...   │ ← surface UNIQUE
│ ‖LA BOUCHE ◁[ variante 2/6 ]●●○○○○▷ (bande courante, surlignée)          │   jointive, 4 bandes
└──────────────────────────────────────────────────────────────────────────┘   sans trait ni gap
```

Le bloc du bas est **une seule surface continue** (§0 bis) : les quatre bandes empilées ne sont
séparées par aucun trait, aucune couture, aucun gap — `‖` ci-dessus indique seulement la limite de
lecture ASCII, elle n'existe pas à l'écran. Il n'y a **plus de CTA** : la scène valide seule.

Note : l'état « verrouillé » (§2.5) est le seul feedback de toute la scène — il n'apparaît qu'au
moment où les 4 bandes sont justes, jamais avant. Le compteur `{n} sur {total}` subsiste comme
lisibilité d'état permanente, il n'affirme rien sur la justesse du choix.

- Les 2 portraits restent CÔTE À CÔTE, **de même taille**, chacun ~40 % de largeur — mise en scène
  ST conservée, confirmée par le Figma. Hauteur bornée pour laisser la surface de 4 bandes visible
  sans scroll.
- Les 4 bandes forment une surface jointive unique, hauteur fixe par bande (§3), la bande
  **courante** (celle que le clavier ou le drag contrôlent) est visuellement distincte par une
  bordure/forme, jamais par la couleur seule (§5.2).
- Plus de CTA à garder au-dessus de la ligne de flottaison : la leçon de `pregame-landscape-ux.md`
  §0 s'applique désormais à la **surface de bandes** elle-même, qui reste entièrement visible.

### 1.2 Mobile landscape (le cas contraignant — cible de référence 844×390)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [jauge télécarte, sans nombre]                                  [✕]    │ ← HUD, 32px
├─────────────────────┬────────────────────────────────────────────────-─┤
│                     │  LA COUPE     ◁           [variante img]     ▷   │
│    médaillon        │  LE REGARD    ◁           [variante img]     ▷   │ ← surface UNIQUE
│    cible (page 23)  │  LE NEZ       ◁           [variante img]     ▷   │   jointive, 4×68px,
│    28% largeur      │  LA BOUCHE    ◁           [variante img]     ▷   │   sans trait ni gap
│    tap/long-press    │                                                  │
│    = overlay plein   │                                                  │
└─────────────────────┴────────────────────────────────────────────────-─┘
```

Plus de CTA : la surface de bandes va jusqu'au bas de l'écran, la hauteur qu'occupait le CTA est
rendue aux visages. Les 4 bandes n'ont **aucune séparation visuelle entre elles** — elles forment
un unique bloc au gabarit exact de la cible, pour que les deux visages se comparent trait pour
trait sans que l'œil ait à recomposer une image coupée.

- Le médaillon cible occupe une **colonne fixe à gauche, ≥ 28 % de la largeur d'écran** (repli du
  gate A8 après le CUT du mini-crop de comparaison locale — voir §4) : à 844px, 236px de large,
  même hauteur que le bloc de bandes en face (parité de taille des deux visages, mise en scène ST).
  Toujours visible en l'état "cible fixe" ; tap ou pression maintenue l'agrandit en overlay
  plein-cadre TEMPORAIRE pour un examen fin.
- Les 4 bandes occupent la colonne de droite (≥ 72 % de largeur), empilées **jointives**, avec
  l'image de variante au centre de chacune. Les chevrons `◁ ▷` sont dessinés **dans** la bande, en
  semi-transparence, jamais comme trait de séparation — ce sont une affordance + une cible
  d'accessibilité, pas la limite visuelle entre deux bandes (§2.3.3).
- Le geste primaire sur mobile est le **swipe horizontal sur la bande visée** (§2.3) — pas un tap
  de sélection préalable.
- **Budget vertical, recalculé après suppression du CTA** : à 390px de hauteur, HUD 32px fixe,
  reste **358px** pour le bloc de 4 bandes jointives (plus de CTA à soustraire, plus de gaps à
  soustraire — 3×8px de round 2 disparaissent avec le gap). La maquette Figma fixe **68px/bande**
  (272px pour les 4, contre 58px dans une itération intermédiaire encore munie d'un CTA) : la
  hauteur des bandes n'est **pas** dimensionnée pour remplir mécaniquement les 358px disponibles,
  elle est dimensionnée pour **égaler la hauteur du médaillon en face** (parité de taille des deux
  visages, §0.1/§1.1) — les 86px restants (358 − 272) sont de la marge de cadrage haut/bas autour
  du bloc jointif, pas du contenu perdu. La hauteur de bande utile pour le calcul de cible tactile
  (§3) reste **68px**, largement au-dessus du plancher 44px.
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
- **Entrée / Espace : n'a plus d'effet de validation** (plus de CTA à cibler, B1). Sur le focus
  d'un chevron `<button>`, Entrée/Espace agit comme un clic normal (§2.3.3) — c'est son seul rôle
  résiduel.
- **Échap** : ouvre la confirmation d'abandon (§7), jamais une sortie directe.
- Reste la traduction la plus fidèle du mapping ST d'origine (4 directions discrètes) — c'est le
  socle sur lequel toute proposition souris ci-dessous s'appuie sans le remplacer.

### 2.2 Desktop — DÉCISION : Option B, drag horizontal à la souris (§8 B3 du gate)

**Tranché par Bertrand sur maquette Figma, prime sur tout ce qui suit.** Le round 2 proposait trois
options (clic zone gauche/droite, drag, molette+chevrons) pour arbitrage ; l'arbitrage a retenu
**Option B — drag horizontal directement sur la bande visée**, en écartant explicitement les deux
autres. Le mécanisme complet (seuils, curseur, relâchement à mi-chemin, cohabitation clavier/
chevrons) est spécifié en §2.6, sur le même modèle que le swipe tactile.

**Motif du choix, tel qu'il ressort de l'arbitrage :** c'est la seule des trois options qui donne
**un seul modèle mental pour les deux classes d'appareil** — « on fait glisser la bande » — au lieu
d'une réponse par appareil qui aurait fonctionné (le brief l'acceptait) mais aurait demandé deux
descriptions de geste distinctes dans chaque doc aval (spec mécanique, script de test e2e, copie
ADR-0015). Le coût identifié en round 2 (le drag à la souris est moins idiomatique que le clic,
implémentation de geste dupliquée plutôt qu'un simple `onClick`) est assumé : il est compensé par
le fait que le moteur de geste (seuil de distance, résolution sur bande d'origine, hystérésis) est
**déjà nécessaire** pour le tactile — le desktop en hérite plutôt que d'ouvrir un second système
d'input. Les Options A (clic zone gauche/droite) et C (molette) sont closes, non réouvertes ici.

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
  fourchette parce qu'on est sous chrono et que les 4 bandes sont jointives, sans aucun gap entre
  elles (68px chacune, §1.2), donc le risque de contamination inter-bande prime sur la
  permissivité du geste — c'est l'angle qui protège désormais, plus le gap.
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

#### 2.3.4 Doigt qui part d'une bande et finit sur une autre — anti-dérive SANS gap (round 3)

**Contexte du changement.** Le round 2 tenait la garde anti-dérive dans un gap physique de 8px
entre les bandes : au-delà de 12px de dérive verticale, le geste sortait de la zone morte et
s'annulait. Bertrand a supprimé le gap — les 4 bandes sont **jointives** (§0 bis, §1.2), parce qu'un
trait de séparation casse la lecture du visage. **Cela retire le dispositif physique qui portait la
garde, pas le besoin de la garde** : sans lui, un doigt qui dérive verticalement pendant un swipe
traverserait directement la bande voisine, avec un risque réel de cran appliqué à la mauvaise
bande. La garde est donc reconstruite par la **logique du geste**, pas par l'espace à l'écran.

**Mécanisme retenu — verrouillage au premier contact + hystérésis en deux phases.**

1. **Résolution de bande au `pointerdown`, immédiate et définitive.** Les bandes étant jointives,
   chaque point y de l'écran appartient à exactement une bande (pas de zone ambiguë à départager).
   La bande sous le point de contact initial est assignée au geste **une fois pour toutes** — ce
   n'est plus une question de "dans quelle bande le geste finit", c'est une propriété figée dès la
   première frame de contact.
2. **Phase pré-engagement (`|Δx| < 40px`, seuil de §2.3.1 inchangé).** Le geste n'a pas encore
   franchi le seuil de déclenchement — il peut encore être un tap manqué, un scroll accidentel, ou
   une dérive. Dans cette phase, une dérive verticale `|Δy| > 50 % de la hauteur de bande` (34px à
   68px de bande mobile, valeur proportionnelle donc stable si `lead-art` retouche la hauteur)
   **annule le geste sans effet** — même logique protectrice que le round 2, seuil relatif au lieu
   d'un gap fixe.
3. **Phase post-engagement (`|Δx| ≥ 40px`).** Dès que le seuil horizontal est franchi, le geste est
   considéré **engagé** : la bande assignée à l'étape 1 devient **immunisée à toute dérive
   verticale ultérieure**, jusqu'au relâchement. Motif : un doigt qui a déjà parcouru 40px à
   l'horizontale sur une bande a démontré une intention claire ; le corps humain arque
   naturellement la trajectoire d'un swipe rapide (dérive verticale de fin de geste, pas de début),
   et c'est précisément ce que le round 2 punissait à tort en laissant la garde active jusqu'au
   relâchement. L'hystérésis (garde stricte avant l'engagement, garde nulle après) élimine ce faux
   positif sans jamais permettre un transfert vers la bande voisine — la bande reste celle assignée
   à l'étape 1, quoi qu'il arrive après l'engagement.
4. **Conséquence directe :** il n'existe **aucun scénario** où un cran s'applique à une bande
   différente de celle touchée au `pointerdown`. La garde est désormais un test de trajectoire
   (deux phases, un seuil proportionnel), pas un test de position à l'écran — elle survit à la
   disparition du gap sans rouvrir le trou de sécurité que le gap comblait.

**Retour visuel/haptique du cran**, inchangé sur le fond : au franchissement du seuil de
déclenchement, (a) l'image de variante affiche un cut instantané (pas de slide/fade — la transition
EST le geste, cohérent avec "discret" §2.3.2 ; `reduced-motion` applique D5.1) accompagné d'un bref
flash de contour **local à la bande concernée** (2 frames, non coloré seul, §5.2) — à distinguer
explicitement du signal de verrouillage global (§2.5), plus long et non local ; (b) un clic sonore
bref, distinct du sting de verrouillage (§2.5) ; (c) si `navigator.vibrate` est disponible et non
désactivé, une vibration courte (~10 ms).

**Acceptance :** test e2e simulant `pointerdown` sur une bande à `y=y0`, mouvement vers
`Δx=20px, Δy=40px` (>50 % de 68px) → geste annulé, aucun cran ; puis un second test avec
`Δx=45px` (engagement franchi) suivi de `Δy=40px` supplémentaires → cran **appliqué à la bande
d'origine**, aucun transfert. Les deux bandes voisines doivent rester à leur variante précédente
dans les deux cas.

### 2.5 L'état « verrouillé » — le seul feedback de toute la scène (A9/A16)

Depuis B1, il n'y a plus d'acte de soumission : dès que l'état courant des 4 bandes est 4/4, la
scène se termine **d'elle-même**. C'est le seul moment de toute la phase `ACTIVE` où quelque chose
est montré au joueur sur la justesse de son choix (A16 : « aucun feedback par trait, sous aucune
forme ; UN seul signal, global, binaire et terminal »). Il doit donc être conçu comme un événement
à part, pas comme le énième changement de variante.

**Ce que le joueur voit et entend, dans l'ordre, au frame où 4/4 est atteint :**

1. **Gel immédiat de l'input.** Les 4 bandes cessent d'accepter tout swipe/drag/clic de chevron/
   flèche clavier à l'instant `t`. Ce n'est pas qu'un signal visuel : c'est un changement d'état
   fonctionnel — un joueur qui tente un geste après le verrouillage ne produit aucun effet. C'est
   la première moitié du signal, et elle est **non ambiguë par construction** : un changement de
   variante (§2.3.4) reste toujours actionnable l'instant suivant, un verrouillage jamais.
2. **Un contour global unique**, autour de la surface entière des 4 bandes jointives (pas bande par
   bande — ce serait retomber dans le feedback par trait interdit par A16), passe d'un liseré
   ambiant fin à un cadre plein, plus épais, de forme reconnaissable — changement de **forme et
   d'épaisseur**, jamais de teinte seule (§5.2). Il se pose et **tient** pendant `revealSeconds`
   (1,4 s à `IDENTIFIED`, A15) avant la tenue du résultat.
3. **La jauge télécarte se fige** au niveau où elle était — elle cesse de se vider. C'est un
   deuxième signal binaire indépendant de la couleur ou de la forme : le temps s'arrête parce que
   l'épreuve est finie, pas parce qu'elle a été perdue. Sous `reduced-motion`, ce gel est déjà la
   forme "reposée" de la jauge (D5.1) — rien à animer en plus.
4. **4 tampons simultanés** (pas séquentiels — A15 : la reptation trait-par-trait n'a plus de sens
   informatif à `IDENTIFIED`, elle serait redondante avec le verrouillage qui vient de l'annoncer)
   marquent chaque bande comme juste.
5. **Un sting sonore de verrouillage, distinct du clic de cran** (§2.3.4) — plus long, un seul
   événement, jamais confondu avec le bruit d'un swipe qui aboutit à une variante quelconque.
6. Si `navigator.vibrate` est disponible : une vibration plus longue et de motif différent
   (ex. deux pulses courts) de celle d'un cran simple (un seul pulse, §2.3.4) — encore une fois,
   le signal doit être discriminable sans dépendre de l'attention portée à l'écran.

**Ce que ce signal n'est jamais :** une teinte qui change sans changement de forme ; une animation
qui ne survivrait pas à `reduced-motion` (le cadre plein et les tampons sont un état statique
atteignable en un cut, pas une trajectoire d'animation obligatoire) ; un signal par bande (A16
l'interdit explicitement — le verrouillage est un événement de la scène entière, pas de chacune des
4 bandes) ; silencieux (un joueur qui ne regarde pas l'écran au moment précis du verrouillage — cas
réaliste, l'œil est sur la cible ou sur une autre bande — doit pouvoir s'en rendre compte au son ou
à la vibration, pas seulement à l'image figée).

**Acceptance :** capture d'écran au frame de verrouillage montrant le cadre plein autour de la
surface de bandes (pas de trait par bande) + jauge figée + 4 tampons simultanés ; test togglant
`reducedMotion` confirmant que le cadre et les tampons apparaissent en un cut, sans trajectoire
d'animation ; test e2e simulant un geste (swipe/drag/tap chevron/flèche) immédiatement après
l'atteinte de 4/4 et vérifiant qu'aucun changement de variante n'en résulte ; test audio/haptique
vérifiant que le sting et le motif de vibration du verrouillage diffèrent de ceux d'un cran simple.

### 2.6 Drag desktop — mécanisme complet (Option B, §2.2)

Même moteur de geste que le swipe tactile (§2.3), adapté à la souris. Les seuils et la garde
anti-dérive de §2.3.1/§2.3.4 s'appliquent **à l'identique**, `pointerdown/pointermove/pointerup`
étant le même type d'événement en souris qu'au doigt (Pointer Events unifie déjà les deux) : bande
résolue au `pointerdown` (jointive, sans ambiguïté), seuil de déclenchement 40px horizontaux,
hystérésis en deux phases identique.

- **Curseur.** Au survol d'une bande (hors chevron), le curseur passe à `grab`. Pendant un drag
  engagé, il passe à `grabbing` et reste visuellement **contraint à l'axe horizontal** de la bande
  — même si la souris dérive verticalement pendant la phase post-engagement (§2.3.4), le curseur
  ne "sort" pas visuellement de la ligne de la bande, pour ne pas suggérer un geste vertical
  possible qui n'existe pas.
- **Relâchement avant le seuil (`|Δx| < 40px` au `pointerup`).** Aucun cran n'est appliqué — la
  variante affichée revient à son état d'avant-drag si un déplacement intermédiaire avait été
  prévisualisé (voir ci-dessous), sinon elle n'a jamais bougé. Comportement identique à un tap
  manqué au doigt (§2.3.1).
- **Prévisualisation pendant le drag (différence assumée avec le tactile).** Contrairement au
  swipe discret (§2.3.2, un cut instantané seulement au franchissement du seuil), le drag à la
  souris peut suivre le curseur en continu pendant la phase pré-engagement/engagement — l'image de
  variante glisse visuellement sous le pointeur — **sans qu'aucun cran ne soit appliqué avant le
  relâchement**. C'est cohérent avec l'attente d'un geste de type "glisser-déposer" à la souris (le
  joueur voit ce qu'il tient) sans changer la règle de fond : **1 relâchement au-delà du seuil = 1
  cran**, jamais plus, jamais un cran par pixel parcouru. Sous `reduced-motion`, ce suivi continu
  est désactivé (D5.1) : le curseur se déplace, l'image reste fixe jusqu'au relâchement, puis cut.
- **Relâchement au-delà du seuil (`|Δx| ≥ 40px` au `pointerup`).** Exactement **1 cran** appliqué
  dans la direction du déplacement, quelle que soit la distance parcourue au-delà de 40px — même
  règle discrète que le tactile (§2.3.2), pour que le budget d'input (AC11, gate §A5) et le calcul
  anti-brute-force (A16) restent valides indépendamment de l'appareil.
- **Cohabitation avec les chevrons cliquables.** Les chevrons restent des `<button>` réels
  (§2.3.3). Un `pointerdown` sur un chevron ne démarre **jamais** un drag de bande : l'événement
  est capturé par le bouton (`stopPropagation`), donc pas de double-déclenchement possible entre un
  clic de chevron et un drag qui aurait commencé au même endroit.
- **Cohabitation avec le socle clavier (§2.1).** Un drag qui aboutit à un cran met à jour la bande
  **courante** au sens clavier (celle que ↑↓ sélectionnerait ensuite) — cohérence d'un joueur qui
  bascule entre souris et clavier en cours de scène, pas deux modèles disjoints. Le clavier reste
  pleinement fonctionnel indépendamment de la souris, à tout instant.

**Acceptance :** test e2e simulant un drag `pointerdown→pointermove(Δx=45,Δy=0)→pointerup` sur une
bande → 1 cran ; un drag relâché à `Δx=20px` → 0 cran, retour à l'état initial ; un `pointerdown`
sur un chevron suivi d'un `pointermove` de 45px → aucun cran de drag (seul le clic du chevron, s'il
a lieu, produit un effet) ; vérification CSS que le curseur passe `grab`→`grabbing` pendant le
drag engagé.

### 2.7 Copie d'appareil (ADR-0015)

Toute instruction affichée à l'écran (si un onboarding contextuel existe pour cette scène — à
coordonner avec `narrative-designer`) suit le vocabulaire ADR-0015 : mobile = "**deux doigts**"
n'est PAS pertinent ici (pas de tir), donc la copie mobile doit dire **"fais glisser une bande pour
changer"** (jamais "touche"/"tape" seul, qui décrirait un tap et non un swipe) — jamais
"clic"/"souris" côté mobile. Desktop : **Option B étant tranchée (§2.2)**, la copie desktop dit
elle aussi "**fais glisser une bande pour changer**" — plus de fork nécessaire entre les deux
copies : c'est le même geste nommé de la même façon sur les deux appareils, seul le nom de
l'appareil qui l'exécute (souris/doigt) change si la copie a besoin de le préciser.

### 2.8 Sortie anticipée — affordance permanente, PAS un CTA (round 4)

**Le problème qu'elle résout.** Depuis B1, la scène n'a plus qu'une seule sortie automatique : 4/4.
Un joueur à 3/4 (ou moins) qui pense avoir fini — ou qui veut simplement couper court avant
l'expiration — n'a **aucun geste** pour le faire savoir : il subit le chrono jusqu'au bout. C'est
l'état normal de `PARTIAL`, pas un cas limite. La sortie anticipée résout la scène **au même titre
que le buzzer de fin de chrono** — même verdict calculé sur l'état courant des 4 bandes (`IDENTIFIED
/ PARTIAL / FAILED`, §6), pas un abandon qui sanctionnerait davantage.

**Où elle vit — aucun nouvel élément, on rhabille l'existant.** Le bouton `[✕]` de coin déjà présent
au HUD (§1.1 desktop, §1.2 mobile, §9) est le seul candidat : il occupe déjà la position en dehors
de la zone de tâche (médaillon + bandes), il a déjà un mécanisme de confirmation câblé (§7), et
surtout — **ajouter une deuxième cible serait la vraie faute UX ici** : la scène aurait alors deux
sorties visibles (l'ancienne `Escape`/retour ET une nouvelle « fini ») que le joueur devrait
distinguer sous chrono, exactement le genre de choix ambigu que cette scène s'interdit ailleurs (A16,
un seul signal, jamais deux concurrents). Un seul bouton, un seul sens désormais : peu importe qu'on
le presse en pensant « j'ai fini » ou « je veux sortir », le résultat est identique — résolution à
l'état courant. Position et gabarit du bouton ne bougent PAS : la jointure des 4 bandes (§0 bis) et
la parité de taille des deux visages (§0.1, §1.2) restent intactes, aucune hauteur n'est reprise aux
bandes ou au médaillon pour cette affordance.

**Comment elle se distingue visuellement d'un CTA de validation — c'est l'exigence centrale.** Un CTA
de validation (le `SORTIR LA TÊTE` supprimé en round 3) aurait été : centré ou pleine largeur en bas
d'écran, dans l'axe de lecture principal, rempli (fond plein), grande cible, libellé verbal d'action
("SORTIR", "VALIDER"). Cette affordance doit être son opposé point par point :

| Dimension | CTA (supprimé, round 3) | Sortie anticipée (§2.8) |
| --- | --- | --- |
| Position | Bande dédiée, bas d'écran, pleine largeur | Coin HUD (haut), hors de l'axe cible↔bandes |
| Poids visuel | Fond plein, contour marqué | Icône seule (glyphe), pas de fond plein, pas de glow (cohérent avec le médaillon, §9.1) |
| Taille | Cible large, texte verbal | Icône compacte + libellé court optionnel (gabarit §2.8.4) |
| Hiérarchie | Action principale attendue de tous | Action secondaire, disponible mais jamais mise en avant — un joueur qui ne la voit jamais et atteint 4/4 n'a rien perdu |
| Focus par défaut | (aurait été le focus naturel en fin de tâche) | **Jamais focus par défaut**, ni au clavier ni au lecteur d'écran (§2.8.5) |

Le motif ergonomique : si cette cible ressemble ne serait-ce qu'un peu à un bouton d'appel à
l'action, un joueur va croire qu'il DOIT l'actionner pour valider chaque bande réglée — et la
mécanique d'auto-verrouillage à 4/4 (qui ne demande justement aucune action) s'effondre dans sa
tête. Elle doit se lire comme une porte de sortie **discrète mais permanente et atteignable**, pas
comme la prochaine étape attendue.

#### 2.8.1 Gabarit de copie (pour `narrative-designer`)

Le libellé n'est pas écrit ici — registre « j'ai fini, imprime » (cabine/fanzine), à `narrative-
designer`. Contrainte de gabarit que la copie doit respecter :

- **Mobile (844×390, HUD 32px) :** icône seule obligatoire (24×24px visuel) ; libellé texte
  **optionnel**, seulement s'il tient sur **≤ 8 caractères** en capitales à 14px effectif à côté de
  l'icône sans repousser la jauge télécarte (le HUD porte déjà le bandeau `TÊTE À CONNAÎTRE`, omis
  en premier si l'espace manque — §9.1). Si aucun libellé ne tient, icône seule + `aria-label`
  complet côté accessibilité (§2.8.5).
- **Desktop (1440×900, HUD 56px) :** icône + libellé, **≤ 20 caractères** en capitales, à droite du
  HUD, aligné avec l'ancien emplacement `✕ Échap`.
- **Vérifié contre la copie livrée par `narrative-designer` :** libellé permanent proposé « ÇA PART
  COMME ÇA » (16 caractères) — tient sur desktop (≤ 20). Ne tient PAS dans le budget mobile (≤ 8) :
  c'est le repli déjà prévu par `narrative-designer`, « ÇA PART » (7 caractères), qui s'applique en
  mobile. Aucun des deux gabarits ne plie — le repli existait déjà côté narratif, la règle des ≤ 8
  caractères mobile reste inchangée.
- Le libellé (mobile comme desktop) doit être un verbe d'accomplissement (« fini », « imprime »),
  jamais un verbe d'abandon (« quitter », « abandonner ») — c'est le changement de sens central de ce
  round. La confirmation (§2.8.3) porte le même registre, pas de fork de ton entre bouton et
  confirmation.

#### 2.8.2 Icône — distincte du glyphe `✕`

Le glyphe `✕` (croix de fermeture) est visuellement une négation/annulation — il contredit le nouveau
sens (« j'ai fini », un accomplissement). Remplacé par un glyphe positif cohérent avec la fiction
cabine (ex. tampon/imprimante — rendu exact = `lead-art`), à condition qu'il reste visuellement
**différent** de tout élément de CTA (pas de fond plein, pas de forme pilule pleine largeur — §2.8).

#### 2.8.3 Confirmé — FORME CANONIQUE : armé/tir en deux appuis (A17, `lead-game-designer`)

**Confirmé est retenu** — mes trois motifs (zone de mistap au pouce en coin d'écran paysage,
résolution irréversible à n'importe quel état, aucun chemin de récupération interne à la scène) sont
ceux que retient `lead-game-designer` (arbitrage A17,
`docs/game-design/design-gate-portrait-robot.md` §9). **Le mécanisme change en revanche : plus
d'overlay/modale.** Deux motifs, qui touchent directement cette spec, tranchent contre l'overlay :
une overlay masquerait la cible et les bandes au moment précis où le joueur ferait sa dernière
vérification avant de sortir ; et une modale à deux boutons réintroduirait un CTA par la fenêtre —
exactement ce que le re-skin de §2.8 cherche à éviter en réutilisant l'existant plutôt qu'en ajoutant
un élément. **Forme canonique : premier appui = armement, second appui sur la MÊME cible dans les
2,0 s = sortie ; désarmement silencieux au-delà.** Le chrono ne se met **pas** en pause pendant
l'armement (contrainte dure A17) — sinon l'armement deviendrait un bouton « geler le temps pour
réfléchir », ce que rien d'autre dans la scène ne permet (D5.5, RotateOverlay excepté).

- **Premier appui (armement).** Tap/clic sur l'icône n'exécute rien : il fait passer le bouton en
  **état armé** (§2.8.3bis) pendant 2,0 s. Le chrono continue de se vider normalement — l'armement
  n'est pas un abri.
- **Second appui, dans les 2,0 s, sur la même cible.** Résout la scène à l'état courant des 4 bandes,
  exactement comme le verrouillage (§2.5) ou l'expiration du chrono (§6) le font pour leurs propres
  déclencheurs.
- **Aucun second appui dans les 2,0 s.** Désarmement automatique, retour à l'état de repos —
  **visible** (§2.8.3bis), pas silencieux au sens d'invisible : seuls le son et l'haptique sont
  omis, l'état visuel doit clairement retomber pour qu'un joueur qui revient tard sur le bouton ne le
  retrouve pas armé par erreur (piège au second appui tardif, explicitement évité).
- **Un appui ailleurs à l'écran pendant la fenêtre d'armement** (sur une bande, un chevron, dans le
  vide) ne désarme PAS immédiatement par lui-même — la fenêtre de 2,0 s court jusqu'à son terme
  indépendamment des autres gestes, pour ne pas ajouter une deuxième façon de désarmer à retenir. Le
  chrono d'armement est strictement lié à la cible, rien d'autre à l'écran n'interfère avec lui.

**Variante immédiate — gardée en trace du choix, non retenue.** Résoudre au premier appui sans
armement reste documentée comme option écartée : elle aurait le coût irréversible sans aucun garde-
fou, rejetée par les trois motifs ci-dessus et par A17.

#### 2.8.3bis État armé — se distingue du verrouillage (§2.5), ne s'y confond jamais

Les deux ne doivent jamais se lire pareil : l'un est **une question posée au joueur** (armé),
l'autre est **la fin de la scène** (verrouillé, §2.5). Ils sont différenciés par portée, durée et
poids, pas par une teinte :

| | État **armé** (§2.8.3) | État **verrouillé** (§2.5) |
| --- | --- | --- |
| Portée | Anneau/liseré **local, autour du bouton seul** | Cadre plein autour de **toute** la surface de bandes |
| Durée | **Transitoire, 2,0 s**, réversible par timeout | **Terminal**, ne retombe jamais |
| Ce qu'il signifie | « Un second appui va sortir » — réversible | « La scène est finie » — irréversible |
| Reduced-motion | Anneau apparaît en un cut, pas de compte à rebours animé requis pour comprendre l'état (§D5.1) ; le retrait au désarmement est également un cut | Cadre + tampons apparaissent en un cut (inchangé, §2.5) |
| Son | Clic d'armement bref, distinct du clic de cran (§2.3.4) et du sting de verrouillage | Sting de verrouillage, plus long (§2.5) |

Le désarmement (retour de l'anneau à l'état de repos, en un cut sous reduced-motion ou par un retrait
bref sinon) est **visuellement visible**, seuls le son et l'haptique d'armement ne se répètent pas à
l'envers — sans ce retour visible, un joueur qui revient sur la cible après les 2,0 s croirait
qu'elle est encore armée et un appui produirait un résultat qu'il n'a pas anticipé (ré-armement, pas
sortie).

#### 2.8.4 Socle clavier et accessibilité du double-appui — TRANCHÉ

**Le double-appui n'est PAS reproduit tel quel au clavier ni pour `Escape`.** Motif, c'est le point
le plus intéressant ouvert par A17 : un geste chronométré à deux temps (2,0 s) est un motif
**hostile** aux lecteurs d'écran (qui doivent d'abord localiser l'annonce, puis agir dans une fenêtre
courte, sans avoir vu l'état armé apparaître à l'écran) et aux troubles moteurs (précision temporelle
en plus de la précision spatiale — double peine). Reproduire le double-appui au clavier serait
transférer un problème de mistap tactile vers un problème d'accessibilité pire que celui qu'on
corrige.

- **`Escape` : activation unique, résout immédiatement** (pas d'armement). Motif : atteindre `Escape`
  exige une action déjà déliberée (viser une touche précise, pas un tap étalé sur un coin d'écran) —
  le risque de mistap qui justifie l'armement au pointeur (§2.8.3, mistap du pouce en bord d'écran)
  n'a pas d'équivalent clavier. C'est cohérent avec §2.1 : aucune autre action clavier de cette scène
  n'est protégée par une double-confirmation (les flèches ↑↓←→ n'en ont pas besoin non plus).
- **Activation clavier du `<button>` (`Enter`/`Espace` sur focus)** : **même règle — activation
  unique, résout immédiatement.** Une activation clavier explicite vaut confirmation en soi : elle
  suppose déjà d'avoir tabulé jusqu'à ce bouton précis (dernier de l'ordre de tabulation, ci-dessous)
  puis d'avoir appuyé sur une touche dédiée — deux gestes délibérés distincts qui ne partagent aucun
  mécanisme avec le tap accidentel de coin d'écran. Imposer un second `Enter` dans les 2,0 s
  ajouterait une contrainte temporelle sans réduire aucun risque réel identifié pour ce canal.
- La cible visible (armé/tir) reste un **ajout** pour le pointeur uniquement, jamais un remplacement
  du socle clavier — les deux canaux (pointeur à deux temps, clavier à un temps) coexistent en
  permanence et produisent le même résultat final (résolution à l'état courant), seul le nombre
  d'étapes pour y parvenir diffère selon le canal, par design.

#### 2.8.5 Accessibilité (le reste, inchangé dans son principe)

- **Rôle/libellé :** `<button>` réel, `aria-label` complet indépendant de la longueur du libellé
  visuel (ex. gabarit : "Imprimer le portrait maintenant — termine la scène avec l'état actuel des 4
  bandes", texte exact = `narrative-designer`) ; l'état armé s'expose via `aria-pressed="true"`
  pendant les 2,0 s (seul `aria-pressed` de toute la scène, exception assumée : c'est un état
  transitoire du bouton lui-même, pas un état de bande que D5.4 interdit par ailleurs) et un
  `aria-live="polite"` annonce l'armement une fois à son déclenchement (pointeur uniquement — au
  clavier, l'activation résout directement, §2.8.4, donc rien à annoncer d'intermédiaire).
- **Ordre de tabulation :** dernier élément du DOM interactif de la scène — après les 4 bandes et
  leurs chevrons. Un joueur au clavier/lecteur d'écran rencontre la tâche principale avant la sortie.
- **Jamais de focus par défaut.** Ni à l'entrée de la scène (`ENTRÉE`, §6), ni après un cran de
  swipe/drag/chevron, ni après une annonce `aria-live` (D5.5) : le focus ne doit jamais se poser sur
  ce bouton sans une action explicite du joueur. Motif : un focus involontaire suivi d'un `Enter`
  réflexe (habitude de valider un formulaire) déclencherait une résolution immédiate au clavier
  (§2.8.4) sans qu'aucune intention n'existe.
- **Cible ≥ zone déjà spécifiée en §9** (§9.1/§9.2, aire équivalente à 44×44px minimum même si la
  forme n'est pas strictement carrée dans le HUD compact mobile).

**Acceptance (§2.8) :** capture montrant l'icône au coin HUD sans fond plein ni glow, distincte du
médaillon/bandes ; capture de l'état armé (anneau local au bouton) côte à côte avec l'état verrouillé
(cadre global) démontrant la différence de portée ; test e2e `Tab` confirmant l'ordre (bandes →
chevrons → sortie anticipée en dernier) ; test confirmant qu'aucun focus n'atterrit sur ce bouton
sans interaction explicite du joueur ; test simulant tap→armement→pas de second tap→désarmement
visible après 2,0 s, sans effet sur l'état des 4 bandes ; test tap→armement→second tap < 2,0 s→
résolution avec le verdict correspondant à l'état courant ; test vérifiant que le chrono continue de
se vider pendant la fenêtre d'armement ; test `Enter`/`Espace` sur le bouton focusé résolvant en un
seul appui (pas d'armement) ; test `Escape` résolvant en un seul appui, identique au comportement
clavier du bouton.

---

## 3. Cibles tactiles — chiffré

- **Zone de swipe/drag = la bande entière** (§2.3, §2.6) : hauteur **68px** en mobile landscape à
  844×390 (valeur Figma, §1.2, §9), largeur = toute la colonne bandes (≥ 72 % d'écran). C'est la
  cible du geste primaire, pas seulement une bande de confort. Sur desktop : 60px (§9.2).
- **Chevrons ◁ / ▷** (accessibilité + affordance, §2.3.3) : 44×44px minimum (WCAG 2.5.5 / iOS
  HIG) inchangé, avec marge cliquable autour du glyphe visuel — la zone de hit-test n'est jamais
  réduite à la taille du glyphe. Ils sont **dessinés dans** la bande (semi-transparents), jamais
  comme un trait la délimitant.
- **Bandes jointives, zéro espacement inter-bandes** (correction directe Bertrand sur le layout,
  round 3) : les 4 bandes ne sont séparées par aucun gap ni aucun trait — elles forment une seule
  surface continue au gabarit exact de la cible. La garde anti-dérive de swipe que le gap portait
  en round 2 (8px, tolérance 12px) est **retrouvée sans lui** par le mécanisme de résolution au
  `pointerdown` + hystérésis en deux phases décrit en §2.3.4 : la sécurité ne dépend plus d'un
  espace à l'écran.
- **Plus de CTA à cibler** : la validation est automatique (§2.5). Aucune cible tactile de type
  bouton principal ne subsiste hors des chevrons et de la sortie anticipée (§2.8) — cette dernière
  est volontairement traitée en cible secondaire (coin HUD, icône compacte), pas en cible principale.
- **Quand 4 bandes + HUD ne tiennent PAS** (écran < ~300px de hauteur utile, cas extrême type petit
  téléphone avec barre de navigation OS visible) : le HUD passe à 28px (jauge seule, pas de
  libellé), et les bandes compressent leur padding interne (pas leur cible de swipe — jamais en
  dessous de 44px de hauteur, on réduit le texte/l'image avant la cible).
- **Acceptance geste (§2.3, §2.6)** : test e2e simulant un swipe à 45° (doit être rejeté, aucun
  cran) et un swipe à 25° sur 40px (doit produire exactement 1 cran) ; test simulant un
  `pointerdown` sur une bande suivi d'une dérive verticale > 50 % de la hauteur de bande **avant**
  franchissement du seuil de 40px (doit annuler le geste, aucun cran) et d'une dérive équivalente
  **après** franchissement (doit conserver le cran sur la bande d'origine, aucune annulation,
  aucun transfert) ; assertion que les chevrons restent des `<button>` cliquables/`Enter`-
  activables indépendamment du swipe/drag ; test drag desktop équivalent (§2.6).

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
`aria-pressed`/état "verrouillé" indicatif du round 1 reste absent (gate A8, plus d'état binaire par
bande à exposer) — le seul état binaire de la scène est désormais le verrouillage global terminal
(§2.5), exposé via `aria-live="assertive"` **une fois**, au moment où il survient (pas un état
persistant à interroger). La jauge de chrono s'expose en `role="progressbar"` avec
`aria-valuemin/aria-valuemax/aria-valuenow` en secondes (donnée interne, jamais lue automatiquement
— voir D5.5) et un `aria-live="polite"` séparé, distinct, pour les 3 annonces de palier.

**D5.5 — Le chrono continu est une barrière d'accessibilité : la traiter, pas l'ignorer — et sans
dénombrer ce qui ne l'est plus.** Un joueur lent (moteur, cognitif, lecteur d'écran) reste
structurellement désavantagé par un temps imparti serré sur une tâche de comparaison fine — B2 n'a
supprimé que le compte d'essais, pas le chrono, et un joueur qui ne peut pas swiper/dragger
(tremblement, précision motrice réduite) dépend entièrement des chevrons tapables/clavier (§2.3.3),
donc du même chrono. **Nouveau problème posé par B2 :** la jauge n'a plus d'unité — un lecteur
d'écran ne peut plus lire « il reste 4 unités », et l'annoncer en secondes brutes recréerait
l'affichage numérique que l'interdit « temps restant » (A6) bannit précisément de la surface
joueur. Réponse en trois volets :

1. **Échappatoire = `Prefs.difficulty`** (`easy | normal | hard`,
   `src/game/systems/prefsSystem.ts`), câblée sur cette scène spécifiquement :
   `easy` = **56 s**, `normal` = **35 s**, `hard` = **30 s** (le plancher assume de sortir de la
   fourchette historique 30-40 s pour `easy` — accessibilité avant fidélité, arbitrage gate A7).
   Un toggle qui ne s'applique pas à cette scène précise serait la même incohérence que la règle
   mère du CRT : un toggle qui ne s'applique pas partout où il le devrait est un mensonge.
2. **Annonce des paliers pour lecteur d'écran — exactement 3 occurrences par run, jamais plus,
   jamais un compte-à-rebours.** Aux paliers refaits en secondes par le gate (A13) — 50 % de
   `timerSeconds` écoulé, puis **10,0 s** et **5,0 s restantes** (valeurs absolues, identiques dans
   les 3 difficultés) — `aria-live="polite"` déclenche **une seule fois par palier**, jamais à
   chaque tick. Le texte annoncé n'est **pas un nombre** : il **réutilise telles quelles les
   répliques KENZA** déjà écrites pour ces mêmes paliers (« Ma carte descend. » / « Grouille, il me
   reste rien. » / le sting du dernier palier) — c'est le même texte que voit et entend un joueur
   voyant/entendant, exposé au lecteur d'écran plutôt que dupliqué avec un nombre de secondes qui
   n'existe nulle part ailleurs à l'écran. Ça règle le « comment sans harceler » à la racine : le
   throttle n'est pas un réglage de fréquence à calibrer, c'est **le nombre de battements
   narratifs de la scène**, qui est déjà fixé à 3 par le reste du design (musique, copie).
3. **La jauge expose son état sur demande, pas en continu.** `role="progressbar"` avec
   `aria-valuenow`/`aria-valuemin`/`aria-valuemax` en secondes internes (lisible par un lecteur
   d'écran qui navigue explicitement jusqu'à l'élément, à tout moment) et `aria-valuetext`
   **qualitatif**, calé sur les 3 mêmes paliers (`"temps confortable"` → `"ça presse"` →
   `"dernières secondes"`), jamais un nombre de secondes en toutes lettres — cohérent avec
   l'interdit A6 côté accessibilité aussi, pas seulement côté rendu visuel.
4. **Chrono en pause sous `RotateOverlay`** (A7, tranché) : le joueur ne peut pas jouer derrière
   l'overlay, donc laisser le chrono courir serait une perte non imputable.

**Acceptance (D5)** : test e2e togglant `reducedMotion`, capture en simulation daltonienne,
assertion aria sur chaque bouton chevron + groupe de bande, test togglant `difficulty` et
vérifiant que la durée effective devient 56/35/30 s pour CETTE scène spécifiquement, test
togglant `RotateOverlay` et vérifiant que la jauge ne se vide plus derrière, test comptant les
événements `aria-live` déclenchés sur un run complet (doit être exactement 3, jamais plus), test
d'assertion que le texte annoncé ne contient jamais de chiffre de secondes/unités et que
`aria-valuetext` suit les 3 paliers qualitatifs.

---

## 6. États de l'écran

| État | Ce que voit le joueur | Ce qu'il entend |
| --- | --- | --- |
| **ENTRÉE** | Transition depuis `NARRATIVE_POST` ; médaillon cible (page 23) apparaît en premier (1 beat), PUIS les 4 bandes se déploient (Paper Mario rule, §"UI Fanzine" des guidelines) ; l'invariant de seed (`initialStateAllWrong`, A14) garantit un 0/4 à l'entrée — **plus de délai de grâce à attendre**, les bandes sont immédiatement actionnables ; jauge télécarte pleine et visible dès l'affichage complet | Sting audio court signalant l'entrée en mini-jeu, distinct de la musique de niveau |
| **SÉLECTION EN COURS (`ACTIVE`)** | 4 bandes jointives, chacune swipable/dragable indépendamment (§2.3, §2.6) ; **aucun feedback par trait, sous aucune forme** (A16) — seul le compteur `{n} sur {total}` évolue ; jauge télécarte se vide en continu, sans nombre affiché (§9) ; **pas de CTA** | Musique tendue en boucle (guidelines §6 — tempo = seul indicateur de tension) ; clic sonore bref à chaque cran de swipe/drag/chevron (§2.3.4, §2.6) |
| **VERROUILLAGE** (instantané, dès 4/4) | **Le seul feedback de la scène** (§2.5) : gel immédiat de l'input, cadre plein autour de la surface entière de bandes (pas par bande), jauge figée, 4 tampons simultanés. Ne peut survenir qu'en cours d'`ACTIVE`, jamais après expiration (A12bis) | Sting de verrouillage distinct du clic de cran ; vibration longue si disponible, motif différent d'un cran simple |
| **PALIERS CHRONO** (50 % écoulé / 10,0 s / 5,0 s restantes, A13) — n'a lieu que si aucun verrouillage n'est encore survenu | Style de jauge change aux paliers urgence/dernier (contraste/forme, pas couleur seule — D5.2) ; PAS de shake d'écran ni de flash strobant (reduced-motion + confort général) | Répliques KENZA réutilisées comme annonce `aria-live` (D5.5) ; le tempo musical s'accélère aux paliers ; pas de bip strident répété |
| **RÉVÉLATION DU VERDICT** (`revealSeconds` — 2,6 s à `PARTIAL`/`FAILED`, 1,4 s à `IDENTIFIED`, A15) | Écran se fige ; à `PARTIAL`/`FAILED` : 4 verdicts de haut en bas (~0,45 s chacun) avec correction visible de chaque bande fausse, 0,8 s de tenue (reptation intacte, information réelle à délivrer) ; à `IDENTIFIED` : le verrouillage (état ci-dessus) a déjà tout dit, flash + 4 tampons simultanés sans reptation ; médaillon et reconstruction se rapprochent visuellement pour la comparaison finale | Sting de verdict, puis sting global WON/PARTIAL/LOST (vocabulaire `spec-boss-qte-*`) |
| **TENUE DU RÉSULTAT** (2,2 s, `resultHoldSeconds`) | Tampon `IDENTIFIED`/`PARTIAL`/`FAILED` affiché avec raison explicite (guidelines §5 règle 4 — ex. "3 sur 4" pour `PARTIAL`) ; textes = `narrative-designer` | — |
| **SORTIE** | Transition vers `LEVEL_COMPLETE`/niveau suivant ; le payoff narratif (page 23 qui refuse, ou habitué refusé) se joue en pré-niveau suivant, pas ici (A10) ; les répliques d'entrée/sortie sont skippables en un geste, la phase interactive ne l'est pas (A2) | — |

---

## 7. Insertion dans le flow (`AppPhase`)

- **`AppPhase` dédié `"PORTRAIT_ROBOT"`, interstitiel post-niveau (A2, confirmé par le gate,
  n'est plus une question ouverte)** : chaîne `LEVEL_COMPLETE → NARRATIVE_POST → PORTRAIT_ROBOT →
  (niveau suivant)`. Pas un sous-état de `PLAYING`, pas de gel du monde ni de réemploi du shell
  ADR-0030 — la scène n'a pas de monde à figer, elle vit entre deux niveaux. Nommage/placement
  exact dans `App.tsx` = `senior-architect`.
- **Échap / bouton de coin — fusionné avec la sortie anticipée (round 4, §2.8).** Il n'existe plus
  deux comportements distincts (« Escape quitte vers `TITLE` » vs « la scène se résout »). `Escape`
  et le bouton visible du HUD (§1.1, §1.2, §9, §2.8) déclenchent désormais **le même comportement
  unique** : la scène se résout à l'état courant des 4 bandes, exactement comme l'expiration du
  chrono (§6) — jamais une expulsion directe vers `TITLE`. Motif reformulé (A1/A2 round 2,
  réaffirmé round 4) : **aucune perte de vie n'est en jeu** sur cette scène, toutes issues
  confondues ; la sortie anticipée n'est donc plus un abandon pénalisant, c'est une résolution
  volontaire au même titre que le verrouillage 4/4 (§2.5). La confirmation prend deux formes
  distinctes selon le canal (A17, §2.8.3/§2.8.4) : **armé/tir en deux appuis dans les 2,0 s** pour le
  tap/clic sur le bouton visible du HUD (protège le mistap de pouce en coin d'écran) ; **activation
  unique** pour `Escape` et pour `Enter`/`Espace` sur ce même bouton une fois focusé au clavier (une
  action clavier délibérée vaut confirmation en soi, §2.8.4) ; le bouton retour Android suit le même
  régime que le tap/clic (armé/tir).
- **Rotation en pleine scène** : la scène EST son propre layout court-paysage (§1.2) — aucune
  bascule dynamique supplémentaire pour une rotation paysage→paysage. Portrait→paysage suit la
  garde `RotateOverlay` globale (`App.tsx:278`) ; le chrono est **en pause** derrière l'overlay
  (A7, tranché — n'est plus une question ouverte).

---

## 8. Questions ouvertes restantes

Toutes les questions du round 1 et du round 2 sont closes. Nombre de bandes/variantes = A5,
verrouillage indicatif = A8/CUT, chrono sous `RotateOverlay` = A7, sanction/payoff = A1/A10,
mini-crop = A8/CUT, **mapping desktop = Option B, §2.2/§2.6, tranché par Bertrand sur Figma (§8 B3
du gate)**.

**Round 4 : close par A17.** Confirmé vs immédiat pour la sortie anticipée est tranché — **confirmé,
en armé/tir à deux appuis** (§2.8.3, `docs/game-design/design-gate-portrait-robot.md` §9). Aucune
question ouverte restante pour cette lane sur ce round.

---

## 9. Spécification pour la maquette (Figma)

**La maquette fait référence** : fichier `muf — Design System`, page `Écrans · Portrait-robot`,
cibles mobile 844×390 et desktop 1440×900. Ce qui suit décrit ce qui y est effectivement dessiné,
pas une proposition à arbitrer. Le style (couleurs, typo, texture, glow) reste `lead-art`.

### 9.1 Mobile paysage — cible 844×390

**Hiérarchie de zones (2 colonnes, plus de ligne de CTA) :**

| Zone | x | y | largeur | hauteur | Contenu |
| --- | --- | --- | --- | --- | --- |
| HUD | 0 | 0 | 844 | 32 | Bandeau `TÊTE À CONNAÎTRE` (peut être omis si l'espace manque, `lead-art`) à gauche ou masqué, jauge télécarte continue (sans nombre) centrée |
| Sortie anticipée (§2.8) | 780 | 0 | 64 | 32 | Icône seule (24×24px visuel, glyphe distinct de `✕`, §2.8.2), pas de fond plein/glow ; libellé texte optionnel si ≤ 8 caractères tiennent sans repousser la jauge (§2.8.1) ; hit area **64×32px (2048px², ≥ l'aire d'une cible 44×44px)** — compromis largeur/hauteur imposé par le HUD 32px, aire équivalente documentée pour `lead-game-designer` |
| Médaillon | 0 | 32 | **236 (28 %)** | 358 | Portrait cible page 23, fixe, contour distinct (pas de glow — §5, gate), même hauteur que le bloc de bandes en face (parité de taille des deux visages) ; tap/long-press = overlay plein écran temporaire |
| Bloc de bandes (surface unique, jointive) | 236 | 32 | 608 (72 %) | 358 | 4 bandes empilées, **aucune séparation entre elles** |
| Bande (×4) | 236 | 32 + i×68 | 608 | **68** | Libellé (`LA COUPE`/…) à gauche, image de variante centrée, compteur `{n}/{total}` à droite, chevrons ◁▷ semi-transparents **dessinés dans** la bande, jamais comme trait de séparation (44×44px cible, zone de swipe/drag = toute la bande) |

**Il n'y a plus de CTA ni de ligne dédiée en bas d'écran.** La hauteur libérée (44px de CTA +
24px de gaps inter-bandes du round 2, soit 68px) est allée pour partie aux bandes elles-mêmes
(58→68px chacune dans une itération intermédiaire encore munie d'un CTA, avant sa suppression
définitive), et pour partie à la marge de cadrage haut/bas qui garantit que le bloc de bandes
égale visuellement la hauteur du médaillon — 4×68 = 272px de contenu, 358px de zone disponible,
l'écart est de la marge de composition, pas du contenu manquant.

**États à prévoir sur la maquette :** ENTRÉE (médaillon seul, bandes pas encore déployées, seed
garantissant 0/4, §6) · ACTIVE (les 2 colonnes ci-dessus, aucun CTA) · cran de swipe (flash de
contour bref, **local à une seule bande**) · **VERROUILLAGE** (cadre plein autour de **toute** la
surface de bandes — pas par bande — + jauge figée + 4 tampons simultanés, §2.5) · palier
urgence/dernier (jauge restylée) · RÉVÉLATION (à `PARTIAL`/`FAILED` : 4 verdicts qui descendent
bande par bande ; à `IDENTIFIED` : déjà montré par le verrouillage, flash + tampons simultanés) ·
confirmation d'abandon (overlay léger par-dessus, pas plein écran).

### 9.2 Desktop — cible 1440×900

| Zone | x | y | largeur | hauteur | Contenu |
| --- | --- | --- | --- | --- | --- |
| HUD | 0 | 0 | 1440 | 56 | Bandeau `TÊTE À CONNAÎTRE` à gauche, jauge télécarte continue au centre |
| Sortie anticipée (§2.8) | 1320 | 6 | 80 | 44 | Icône (glyphe distinct de `✕`, §2.8.2) + libellé ≤ 20 caractères (§2.8.1), `Échap` en légende à proximité ; cible 44×44px pleine (marge HUD 56px suffisante, pas de compromis d'aire nécessaire côté desktop) |
| Portrait cible (page 23) | 40 | 76 | **576 (40 %)** | 480 | Grand format, fixe |
| Portrait reconstruction | 824 | 76 | **576 (40 %)** | 480 | Même taille que la cible ; se construit en direct au fil des drags/clics de chevron |
| Gap central | 616 | 76 | 208 | 480 | Zone tampon (peut porter un élément narratif léger, `lead-art`/`narrative-designer`) |
| Bloc de bandes (surface unique, jointive) | 40 | 556 | 1360 | 264 | 4 bandes empilées, **aucune séparation entre elles**, jusqu'au bas de l'écran — plus de ligne de CTA à réserver en dessous |
| Bande (×4) | 40 | 556 + i×60 | 1360 | **60** | Libellé, chevrons cliquables ◁▷ **dans** la bande (44×44px cible), curseur `grab`/`grabbing` au survol/drag (§2.6), zone de variante, compteur ; bande courante (celle contrôlée au clavier ou par le dernier drag) visuellement distincte (bordure, pas couleur seule) |

**Il n'y a plus de CTA ni de ligne dédiée sous les bandes** : le bloc de bandes occupe l'espace
jusqu'au bord bas de la zone de contenu.

**États à prévoir en plus du mobile :** état de drag engagé (curseur `grabbing`, image qui suit le
pointeur en pré-relâchement, §2.6) ; relâchement à mi-chemin (retour visuel à l'état d'avant-drag).

### 9.3 Constantes transverses aux deux cibles

- Cible tactile/clic/drag minimale : **44×44px**, jamais réduite quelle que soit la densité d'écran.
- Contraste texte/fond : **AA, 4,5:1** minimum (valeurs exactes = `lead-art`, contrainte non
  négociable).
- Texte informatif (libellés de bande, compteur) : **14px effectif minimum**.
- Aucun état de la maquette ne doit encoder une information par la couleur seule (§5.2) — prévoir
  une forme/icône en complément partout où un état change. En particulier, le signal de
  verrouillage (§2.5) doit être distinguable du flash de cran par sa **portée** (toute la surface
  de bandes vs une seule bande), pas seulement par une teinte différente.
- **Aucune couture, trait ou gap visible entre les 4 bandes** — c'est une contrainte de maquette,
  pas seulement de code : deux bandes adjacentes doivent se raccorder pixel à pixel sur leur bord
  commun quelle que soit la paire de variantes affichée (contrainte à opposer au gate art, cohérent
  avec la règle de raccord de `lead-art`, gate §5).
- Plus de CTA sur aucune des deux cibles : la validation est **automatique** (§2.5).
- **Sortie anticipée (§2.8, round 4) : cible permanente, jamais un CTA.** Position/gabarit fixés en
  §9.1/§9.2 ci-dessus. Traitement visuel obligatoire : icône seule ou icône + libellé court, jamais
  de fond plein ni de glow, jamais dans l'axe de lecture cible↔bandes, jamais focus par défaut. Elle
  réutilise le bouton de coin déjà présent (ex-`✕`/Échap) — aucune hauteur n'est reprise aux bandes
  jointives (§0 bis, §1.2) ni au médaillon (§0.1) pour l'accueillir.
