# Recon — la phase « portrait-robot » (photofit) de RoboCop, Ocean 1988-89

- **Lane :** `tech-scout` (recon read-only, stage 0)
- **Date :** 2026-08-05
- **Demandeur :** Bertrand — référence explicite pour la nouvelle boucle « portrait-robot » de muf,
  avec consigne « je voudrais vraiment quelque chose qui ressemble à la version **Atari ST** ».
- **Statut :** rapport sourcé, niveaux de confiance explicites. Sert d'entrée aux specs de design
  (`docs/game-design/spec-portrait-robot*.md`) et aux ADR 0079-0081.

> Chaque affirmation porte son niveau de confiance : **CONFIRMÉ** (≥ 2 sources indépendantes ou
> source primaire), **PROBABLE** (une source sérieuse ou déduction solide), **INCERTAIN**.
> Ce qui n'a pas pu être vérifié est listé en fin de document — c'est une information, pas un trou
> à combler par de l'invention.

## 1. Structure de l'écran

- **Portrait cible à gauche, portrait en construction à droite.** **CONFIRMÉ** — Crash 59 :
  « Eyes, ears, chin, nose and hairstyle must be matched to the picture on the **left** » ;
  Your Sinclair (via MobyGames) : « on the left is a picture of Emil, and you have to cycle
  through all the possible eyes, noses, hairpieces, chins, ears and mouths ».
- **Les bandes = traits du visage empilés.** Le manuel Amiga officiel liste *hairline, eyes, nose,
  mouth, chin, ears* → **6 zones** ; la presse n'en cite que 5. **PROBABLE : 6 zones en 16-bit,
  5 sur certaines versions 8-bit.** Le découpage est **anatomique, pas une grille régulière** —
  Crash note que « some overlap ».
- **HUD :** timer visible qui décompte (« tense music as the seconds tick down »), score et vies
  partagés avec le reste du jeu. **PROBABLE** (déduit du timer + de la règle de vie confirmée).

## 2. Le mécanisme d'entrée — le point critique

**CONFIRMÉ, source primaire** (manuel officiel Amiga, Lemon Amiga) :

> « In the photofit section **left and right joystick movements select between the different pieces
> of face available**, whereas **up and down movements select which area of the photofit to
> change**. »

Donc : **sélection libre, PAS de bande qui défile et qu'on fige au bon moment.** Aucune mécanique
de timing ni de réflexe. Haut/bas change de **zone** (le trait courant), gauche/droite fait défiler
les **variantes** de cette zone. La tension vient uniquement du chronomètre global.

C'est l'inverse de l'intuition courante (haut/bas = variante) : le manuel est explicite.
Aucune source ne décrit un défilement à figer, sur aucune version. Les différences de mécanique
entre ST / CPC / Amiga / C64 n'ont pas été trouvées — la mécanique semble **identique partout,
seul le rendu diffère** (§6). **INCERTAIN**, faute de manuels ST/CPC consultés.

## 3. Contrôle exact, ordre, feedback

- Joystick 4 directions + bouton feu. Le rôle du **bouton feu** dans cette phase n'est **pas
  documenté** par le manuel (qui ne décrit que les 4 directions) : validation finale, ou inutilisé
  si la sélection est un simple état courant. **INCERTAIN.**
- **Ordre de résolution libre**, pas de verrouillage progressif documenté. **PROBABLE** — corroboré
  par le conseil de Crash « don't spend too long on one feature », qui n'a de sens que si l'on peut
  revenir en arrière.
- **Aucun feedback par trait.** Aucune source ne mentionne de validation zone par zone ;
  l'évaluation semble globale, en fin de phase. « Until you've got a full face it's easy to get
  confused » (Crash) suggère qu'on juge à l'œil, sans aide du jeu. **PROBABLE.**

## 4. Contrainte de temps

- **ACE (jan. 1989) : 40 secondes. C&VG (jan. 1989) : 30 secondes.** **CONFIRMÉ** (presse d'époque
  via Spectrum Computing). Divergence probablement due à des versions différentes ou à un arrondi
  de journaliste — retenir **30-40 s** comme fourchette réelle.
- **Expiration = perte d'une vie.** **CONFIRMÉ** — Crash 59 : « As on all the sections there's a
  time limit and **a life is lost if you exceed it**. » Ce n'est pas un simple bonus perdu.
- Barème de score du photofit : **non chiffré** par le manuel. **INCERTAIN.**

## 5. Récompense narrative

- La phase intervient **après la station-service** où Emil déclenche les flashbacks de Murphy, et
  **avant l'usine de drogue** (Crash 59 ; Retro Archives). **CONFIRMÉ** pour le placement. Le manuel
  Amiga mentionne **deux** séquences photofit dans le jeu — **PROBABLE.**
- Réussite → le jeu **affiche le dossier du suspect** : identité, complices (dont Clarence
  Boddiker), lien avec le meurtre d'Alex J. Murphy. **CONFIRMÉ.** C'est le pivot narratif du jeu :
  la phase transforme un flashback en preuve et oriente vers le niveau suivant.

## 6. Le rendu visuel — Atari ST (référence de structure, PAS de rendu)

> **Arbitrage Bertrand, 2026-08-05 — à lire avant tout le §6.** « Pour la partie visage, pas
> forcément numérisée, on peut garder la direction artistique très BD comics actuelle, ce serait
> même mieux je pense. »
>
> Donc : ce qu'on emprunte à la version ST, c'est la **mise en scène** — gros portrait cible, écran
> qui respire, bandes lisibles, musique tendue qui décompte — **pas** le procédé photo-digitalisé.
> Les visages restent dans la DA maison (fanzine B&W + néon acide, trait BD/comics,
> `docs/art-direction.md`). Le §6 ci-dessous documente l'original **pour information historique** ;
> aucune de ses valeurs (palette 16 couleurs, dithering photo, grain de numérisation) ne devient une
> contrainte de production.

- **La version ST est la meilleure de cette phase.** « a very **fancy upgrade** on the photofit
  bonus stage (which actually features **the digitised face of one of the Ocean development
  team**) » ; « The photofit screen in particular is great, with **huge digitised pictures** of the
  crooks and **tense music** as the seconds tick down » (retroarcadia.blog). **CONFIRMÉ** : visages
  **numérisés** (photo digitalisée), pas dessinés — d'où le côté « realistically creepy » relevé
  aussi côté Amiga.
- Résolution ST : 320×200, 16 couleurs (low-res standard). **PROBABLE par déduction plateforme**,
  non confirmé par une source propre au jeu. Des visages numérisés en 16 couleurs impliquent une
  palette quasi monochrome / sépia dégradée — à valider sur capture avant de s'en servir comme spec
  de palette.
- **CPC :** une source mentionne l'usage du **Multi-Mode** (mélange de modes graphiques sur un même
  écran) précisément pour la zone du portrait. **INCERTAIN** (source secondaire). Si c'était
  confirmé, ce serait un indice fort que le portrait est la zone haute-fidélité de l'écran.
- **Amiga :** équivalent ST, visages numérisés.

## 7. Valeurs exploitables pour du tuning

| Paramètre           | Valeur                                        | Confiance         |
| ------------------- | --------------------------------------------- | ----------------- |
| Durée du timer      | **30-40 s**                                   | CONFIRMÉ (plage)  |
| Nombre de zones     | **5 à 6** (hair, eyes, nose, mouth, chin, ears) | PROBABLE        |
| Variantes par zone  | non trouvé                                    | INCERTAIN         |
| Sanction d'échec    | **−1 vie**                                    | CONFIRMÉ          |
| Contrôle            | haut/bas = zone, gauche/droite = variante     | CONFIRMÉ          |
| Feedback par trait  | aucun                                         | PROBABLE          |

Pour viser la sensation d'époque : **~35 s, pas de feedback par trait, échec qui coûte réellement**.
La difficulté vient explicitement de la **proximité visuelle des variantes** (« made all the more
difficult by the **minor differences** », The Games Machine) — c'est le **levier de tuning
principal**, bien plus que le timer.

## 8. Prior art

Le mini-jeu intercalaire est une **signature Ocean** de l'époque (leur marque d'adaptation de
licence). Aucun autre jeu à phase photofit précise n'a pu être identifié dans le temps imparti ;
la piste évidente serait les autres adaptations Ocean de la même période. **NON CONFIRMÉ.**

## Ce qui n'a pas pu être confirmé

1. La source donnée par Bertrand (`jeux.dokokade.net`) — **HTTP 403** via le proxy, non exploitée.
2. Le rôle du **bouton feu** dans la phase.
3. Le **nombre de variantes par zone**.
4. Une **capture ST** validant palette et disposition exacte des bandes.
5. Le **Multi-Mode CPC** (une seule source secondaire).
6. Toute **différence de mécanique** entre versions — l'hypothèse « identique, rendu seul
   différent » est une absence de preuve, pas une preuve d'absence.

Lever 2/3/4 d'un coup demanderait un longplay vidéo ST ou une ROM en émulateur : hors d'atteinte de
cette recon (pas d'accès vidéo). **À faire par Bertrand si une valeur exacte devient bloquante.**

## Sources

- [RoboCop — Instructions/Docs (manuel Amiga), Lemon Amiga](https://www.lemonamiga.com/games/docs.php?id=1364) — **source primaire** pour les contrôles
- [CRASH 59 — Robocop](https://www.crashonline.org.uk/59/robocop.htm) — traits, portrait à gauche, perte de vie
- [RoboCop — reviews scannées, Spectrum Computing](https://spectrumcomputing.co.uk/zxsr.php?id=4179) — ACE 40 s, C&VG 30 s, TGM, Sinclair User, Your Sinclair
- [My Life With… Robocop — Arcade / ZX Spectrum / Atari ST](https://retroarcadia.blog/2022/03/02/my-life-with-robocop-arcade-zx-spectrum-atari-st/) — spécificités ST, visages numérisés
- [RoboCop (1988) — MobyGames](https://www.mobygames.com/game/1409/robocop/)
- [Amiga Reviews: Robocop 1](https://amigareviews.leveluphost.com/robocop1.htm)
- [RoboCop (Ocean Software) — Retro Archives](https://retroarchives.fr/robocop-ocean-software/) — placement du niveau, Multi-Mode CPC (à re-vérifier)
- [Robocop — Atari Legend](https://www.atarilegend.com/games/robocop)
- [RoboCop — Lemon64](https://www.lemon64.com/review/robocop/244)
- [robocop © Ocean Software (1989) — CPC-Power](https://www.cpc-power.com/index.php?page=detail&num=1815)
- Non consultable : `https://jeux.dokokade.net/2011/10/03/robocop-amstrad-cpc-1988/` (403)
