# Design gate — PORTRAIT-ROBOT (« TÊTE À CONNAÎTRE »)

**Gate:** `lead-game-designer` (Karim) · **Date:** 2026-08-05 · **Cycle:** story-portrait-robot
**Amont :** `_bmad-output/planning-artifacts/story-portrait-robot.md` (`pm`),
`docs/research/research-photofit-robocop-atari-st.md` (`tech-scout`),
arbitrage Bertrand 2026-08-05 (4 bandes · DA BD/comics maison, pas de visage numérisé),
`_bmad-output/guidelines/PROJECT_GUIDELINES.md`.

Les trois lanes ont travaillé en aveugle. Elles se contredisent sur **cinq** points structurants
(sanction, placement, fréquence, nombre de variantes, mapping tactile). Aucun de ces points ne
descend au `senior-architect` non tranché : les arbitrages §2 font foi, la table §3 est la seule
source de vérité de tuning pour la suite du pipeline.

## Deliverables sous revue

| #   | Deliverable                                       | Auteur                         | Verdict                                         |
| --- | ------------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| M   | `docs/game-design/spec-portrait-robot.md`         | `game-designer` (Sacha)        | **RETOUR LANE** (round 1/2)                     |
| F   | `docs/game-design/spec-portrait-robot-fiction.md` | `narrative-designer` (Yasmine) | **PASS AVEC CONDITIONS**                        |
| UX  | `docs/game-design/ux/portrait-robot-ux.md`        | `ux-designer` (Tony)           | **PASS AVEC CONDITIONS**                        |
| ART | `docs/art-direction/brief-portrait-robot.md`      | `lead-art` (Nico)              | _hors gate_ — cohérence design↔art vérifiée, §5 |

**Aucun FAIL.** Le RETOUR LANE sur M n'est pas un jugement de qualité : la spec est la plus solide
des trois sur le fond mécanique. Elle est renvoyée parce qu'elle **contredit trois décisions
amont déjà arrêtées** (AC5 de la story, placement, fréquence) et qu'un dev qui la lirait
implémenterait une sanction interdite. Toutes les valeurs de remplacement sont dans la §3 :
c'est une transcription, pas une reconception. Une seule ronde attendue.

### Les quatre jambes du gate

- **Scope / cahier des charges.** Prohibition (Atari ST, 1987) n'a **pas** de phase portrait-robot.
  C'est une **extension consciente**, déclarée à l'identique par les trois lanes et par `pm`, au
  standard ADR-0012/0030. Déclaration conforme ⇒ pas de FAIL de scope. Le test de fond
  (« remplissage à la Ocean ? ») est tranché en **A11**.
- **Boucle core.** `Récupérer → Livrer → Éviter` intouchée : aucun verbe ajouté. La contrainte
  dure « une mission = 3-5 min » est **la raison** de l'arbitrage de placement **A2** : une
  digression de 35 s + révélation + textes ne rentre pas dans le budget d'une mission sans la
  ronger, elle vit donc **entre** deux missions.
- **Vérifiabilité.** Deux trous réels trouvés : le **payoff AC6 n'est chiffré nulle part** (A10) et
  le **destin de l'énergie entre deux niveaux** n'est défini nulle part (A1c). Les deux sont
  fermés ici.
- **Cohérence.** Cinq contradictions inter-lanes (A1, A2, A3, A4, A6) + une contradiction
  design↔art (A5). Toutes tranchées ci-dessous.

---

## Les arbitrages

### A1 — Sanction de l'échec → **énergie seule. Zéro perte de vie. −20 d'énergie sur le niveau suivant.**

**La contradiction.** `pm` (AC5) : « `energy` is adjusted accordingly ; **no life is subtracted
directly** ». `narrative-designer` (§5) : refus explicite du −1 vie, coût **social**.
`game-designer` (§4.3) : **−0.5 cœur** + −15 énergie. `ux-designer` (§7) construit une garde
`Escape` **motivée par « possible perte de vie »**.

**Décision.**

1. **Aucune vie n'est retirée, ni entière ni fractionnaire.** La currency est l'énergie, point.
2. `FAILED` ⇒ **−20 d'énergie**, appliquée au **capital de départ du niveau suivant** (A1c).
3. `PARTIAL` ⇒ **0 énergie**, **+400 score**. `IDENTIFIED` ⇒ **0 énergie**, **+1500 score**
   - le payoff **A10**.
4. L'invariant « la scène ne peut pas tuer » de Sacha est **conservé et renforcé** : il devient
   trivialement vrai, l'énergie n'ayant pas de mort à 0.

**Motif.** AC5 de la story est une décision `pm` **déjà arrêtée en amont du design loop** ; une
spec de design ne la renverse pas, elle l'exécute ou elle l'escalade. Or elle n'a pas été
escaladée : Sacha a chiffré −0.5 cœur en connaissance de la recon mais sans traiter AC5. C'est un
FAIL de cohérence amont, mécanique. Sur le fond je donne raison au `pm` **et** à Yasmine : faire
perdre de la santé physique sur un écran où l'on ne peut ni esquiver ni tirer est exactement la
« mort bullshit » que les garde-fous G4/G5 des QTE existent pour interdire, et le −0.5 cœur de
Sacha reste une transposition littérale d'un jeu qui n'avait ni énergie ni cœurs fractionnaires.

**A1b — le mordant, puisqu'on retire les dents.** Yasmine demande un coût **social** ; je le
ratifie comme **conséquence narrative obligatoire, pas décorative** : à `FAILED`, la ligne
« un habitué se fait refuser à sa propre porte » (§5.1 fiction) **doit** être jouée au niveau
suivant. Un échec qui ne produit qu'un chiffre serait un échec sans beat ; un échec qui ne produit
qu'un beat serait sans enjeu. On prend les deux : **−20 énergie + le beat**.

**A1c — RÈGLE DE PROJET, RATIFIÉE par Bertrand le 2026-08-05 (§9).** ~~nouvelle règle, parce que les
guidelines sont muettes~~ — elle n'est plus « proposée », elle est acquise et dépasse cette story.
La scène étant post-niveau (A2),
une sanction d'énergie appliquée « tout de suite » ne coûte rien (le niveau est fini) et un bonus
d'énergie serait mangé par le clamp à 100. **Règle ~~proposée~~ RATIFIÉE et appliquée ici :** une issue de scène
interstitielle modifie le **capital d'énergie initial du niveau suivant** (`ENERGY_INITIAL` local),
jamais l'énergie du niveau écoulé. Corollaire : **il n'y a pas de récompense en énergie** (elle
serait toujours clampée) — la récompense est score + payoff. C'est pourquoi le `+25` de Sacha
disparaît : il n'est pas refusé, il est **inopérant**. À inscrire dans l'ADR de scène.

### A2 — Placement → **interstitiel post-niveau (`AppPhase` dédié). PAS de gel du monde.**

**La contradiction.** Sacha (§2.1) : déclenchement **scripté en cours de niveau**, le monde **se
fige**, réemploi du shell ADR-0030. Yasmine (§3) : **après la teuf**, dans une cabine. `pm` :
« narrative interstitial, **not a per-level gate** ». Tony (§7) : `AppPhase` **dédié**, « pas un
sous-état de `PLAYING` ».

**Décision : interstitiel.** La scène s'insère **après** la fin de niveau, dans la chaîne
`LEVEL_COMPLETE → NARRATIVE_POST → PORTRAIT_ROBOT → (niveau suivant)`. Le monde n'est pas gelé :
il n'y a pas de monde. Le shell ADR-0030 (zoom sur le monde, `QTE_ZOOM_SECONDS`) n'est **pas**
réutilisé ; seule la discipline de machine à phases forward-only l'est.

**Motif.** Trois lanes sur quatre disent interstitiel, dont le `pm` qui en a fait une décision de
scope écrite. Et surtout : **le budget 3-5 min**. Une scène de 35 s + 2,6 s de révélation + 2,2 s
de hold + 7 répliques encadrantes, insérée **dans** la mission, mange 20 à 30 % de son budget et
transforme une contrainte dure en approximation. Hors mission, le coût est nul pour la boucle.
Bénéfice secondaire : la fiction de Yasmine (la cabine, l'appel de KENZA après la soirée) devient
littéralement vraie au lieu d'être plaquée sur un gel de fusillade.

**Skippabilité.** Les **répliques** d'entrée et de sortie sont skippables en un geste (guidelines
§5.3). La **phase interactive ne l'est pas** : ce n'est pas une cutscene, elle a une issue et un
coût. `Escape` / retour Android ⇒ confirmation légère (garde UX §7 **conservée**), et la sortie
confirmée **résout la scène à l'état courant**, exactement comme l'expiration du chrono (A7). Aucun
chemin de sortie ne produit un résultat non évalué. → **Rhabillée en « j'ai fini, imprime » et
requalifiée par A17 (§9) : ce n'est plus un abandon, la confirmation devient un double appui sur
une affordance permanente.**

### A3 — Fréquence → **une fois par RUN. Pas une par niveau.**

Sacha : « une par niveau, au maximum ». `pm` : « **once per run, V1** », motivée par la critique
« filler » de la presse d'époque. **`pm` gagne**, sans discussion : la fréquence est une décision
de scope, pas de tuning. Conséquence directe : la **table de progression #1/#2/#3+** de Sacha
(§3 D3) est **hors V1** — elle n'a pas de deuxième occurrence à cadencer. Elle est conservée comme
note post-V1, pas comme spec.

### A4 — Mécanisme d'entrée → **sélection libre. Les deux lanes disent la même chose. Mapping tactile = celui de l'UX.**

**Vérifié : pas de contradiction de fond.** Sacha D1 (Option A), Tony §2, `pm` (« free-selection
input ») et la recon (source primaire, manuel Amiga) convergent. **D1 est ratifiée.** L'Option B
(bandes qui défilent à figer) est **définitivement close** : elle contredit la seule mécanique
CONFIRMÉE de la source et ferait de la scène la troisième épreuve de fenêtre-à-saisir du jeu après
le duel d'otage et le boss. Si Bertrand voulait littéralement des bandes qui défilent, c'est une
escalade (§6, point 1) — pas une réouverture de lane.

**Contradiction résiduelle, tranchée : le geste tactile.** Sacha (AC2) impose « tap bande **/ swipe
horizontal** » comme équivalents tactiles opérants. Tony (§2.3) **rejette le swipe comme geste
primaire** (ambiguïté diagonale sous chrono) et impose des **chevrons ◀ ▶ tapables**, le swipe
restant additif et facultatif.

~~**Décision : le mapping de l'UX fait foi.** Primaire = **tap sur la bande** (elle devient active)

- **tap sur chevron** (variante ±1). Le **swipe horizontal est un raccourci optionnel** sur la
  bande déjà active, jamais requis, jamais testé en acceptance.~~

> **A4-bis — ARBITRAGE BERTRAND, 2026-08-05 (postérieur au gate, il prime) :**
> « Pour les contrôles mobiles : **un swipe gauche/droite sur chaque bande**, on oublie ta sélection
> et tes flèches. Pour le desktop fais une propal dans le figma. »
>
> **Le mapping tactile de l'UX est donc RENVERSÉ.** Geste primaire mobile = **swipe horizontal
> directement sur la bande visée** — il fait défiler les variantes de CETTE bande. Il n'y a plus de
> notion de « bande active » au doigt (plus de tap de sélection préalable), et plus de chevrons
> ◀ ▶ comme geste primaire. Une bande = une piste qu'on fait défiler sous le doigt, les quatre
> indépendamment et dans n'importe quel ordre.
>
> Ce que cet arbitrage **règle** : il supprime le tap de sélection, donc l'aller-retour
> sélection→action que Tony cherchait justement à éviter, et il colle à la métaphore physique des
> bandes de papier qu'on fait coulisser (cohérent avec la fiction « planche de gueules découpée »).
>
> Ce que cet arbitrage **ouvre, et qui revient à `ux-designer`** (round 2, non bloquant pour le
> TECH PLAN) : (a) l'ambiguïté du swipe diagonal que Tony documentait reste réelle — il faut un
> **seuil d'angle et une distance de déclenchement** chiffrés, pas un rejet du geste ; (b) la
> **hauteur minimale par bande** devient une contrainte de swipe, pas seulement de lecture ;
> (c) l'**accessibilité** : un swipe n'est pas actionnable au clavier ni par un lecteur d'écran —
> les chevrons ◀ ▶ ne disparaissent pas, ils **rétrogradent en affordance visuelle + cible
> d'accessibilité**, pas en geste primaire ; (d) le **discrete-swipe** (1 swipe = 1 variante) vs
> le défilement continu à l'inertie — trancher, la V1 penchant vers 1 swipe = 1 cran, prévisible
> sous chrono.
>
> ~~**Desktop : non tranché ici, volontairement.** Bertrand demande une proposition **dans le
> Figma**.~~ → **TRANCHÉ, §8 B3 : option B, drag horizontal à la souris sur la bande.** Le mapping
> clavier ↑↓/←→ reste le socle.

### A5 — Nombre de bandes et de variantes → **4 bandes (figé). 6 variantes max. UN gabarit.**

**Bandes :** les quatre lanes ont obéi — 4 bandes, cheveux/yeux/nez/bouche. Conforme à Bertrand.
Le brief art exclut proprement oreilles et menton du découpage (§1.1). **Rien à trancher.**

**Variantes : contradiction design↔art.** Sacha monte à **8** par bande (occ. #2/#3) avec plafond
dur à 8. `lead-art` (§5.1) chiffre le budget de production et recommande **M=1 gabarit, N=4 à 6,
soit 16 à 24 assets**, en nommant le risque de raccord comme multiplicatif. `pm` : « small closed
set ».

**Décision : `variantsPerStrip` = 6, plafond dur 6. `faceTemplates` = 1.** 24 assets de bande.
Motif : (a) A3 supprime les occurrences #2/#3 qui étaient la seule justification du passage à 8 ;
(b) le budget art est un fait de production chiffré par la lane qui le porte, pas une préférence —
un gate qui l'ignore fabrique une dette qu'un autre paiera ; (c) le levier de difficulté reste
intact, parce que la difficulté vient de la **distance** entre variantes, pas de leur nombre — c'est
la thèse de la recon, celle de Sacha (§3 D2) et celle de `lead-art` (§2, « graduer par la classe de
variation plutôt que par le nombre »). Les trois disent la même chose : la courbe se règle sur la
classe de leurre, jamais sur N. Le plafond de charge d'input de Sacha (AC11, balayage ≤ 25 % du
chrono) devient d'ailleurs confortable : 4×6 = 20 pressions ≈ 5 s, soit 14 % de 35 s.

**Difficulté V1 (occurrence unique) :** 1 bonne + **2 leurres de classe forte** (forme /
proportion, classes 1 et 3 du brief art) + **3 leurres de classe moyenne**, **zéro leurre de classe
4** (détail de trait). La règle du **trait nommé** de Sacha (D2, A1→A6) est ratifiée intégralement
et devient **opposable au gate art** : un leurre dont `lead-art` ne peut pas énoncer la différence
en une phrase courte, sans coordonnées de pixels, est rejeté.

### A6 — Vocabulaire → **les mots du narratif font foi partout, y compris dans l'IHM.**

Les libellés canoniques sont **`LA COUPE` / `LE REGARD` / `LE NEZ` / `LA BOUCHE`** (fiction §4.3),
repli sans article `COUPE / REGARD / NEZ / BOUCHE`. Les wireframes UX affichent
`CHEVEUX / YEUX / NEZ / BOUCHE` : **amendés**. La spec mécanique peut continuer d'employer
cheveux/yeux/nez/bouche comme **noms internes de zone** (code, données, ADR) — mais aucun de ces
mots n'atteint l'écran.

Corollaires appliqués au même titre :

- Le bandeau d'écran est **`TÊTE À CONNAÎTRE`**, jamais « PORTRAIT-ROBOT » (mot interdit en surface
  joueur, fiction §6 — c'est le nom interne de la feature). Le wireframe UX §1.1 est amendé.
- ~~Le CTA est **`SORTIR LA TÊTE`**, pas « VALIDER LE PORTRAIT ». Il reprend la réplique de KENZA
  (« Sors-moi une tête, une seule ») et évite le registre commissariat.~~ → **CTA supprimé, §8 B1.**
  La réplique de KENZA reste au dialogue.
- « dossier suspect » (UX §6/§7, `pm`) devient **« la page 23 »** en surface joueur.
- ~~Le chrono s'affiche **`TÉLÉCARTE · {n} UNITÉS`**, jamais « temps restant ».~~ → **jauge continue
  sans nombre, §8 B2/A13.** L'interdit « temps restant » tient.

**Le tell comportemental jamais physique (fiction §6) est-il compatible avec un jeu de comparaison
de visages ? Oui, et je l'inscris comme règle.** La distinction porte sur **qui décrit** :

- les **textes** (souvenirs de KENZA) restent **comportementaux** — « il regardait pas les gens, il
  les comptait » ;
- les **dessins** portent nécessairement des différences morphologiques, c'est le medium.
  **Règle ajoutée (opposable au gate art) :** aucun descripteur discriminant ne peut être lu comme un
  marqueur d'origine, de classe ou de « sale gueule ». Les descripteurs admis de Sacha (§3 D2 : raie,
  frange, paupière, arête, commissures…) sont conformes ; la liste est **fermée** et toute addition
  repasse par ce gate. Le garde-fou moral de Yasmine (§5 : à l'échec, c'est **le réseau qui se blesse
  lui-même**) est ratifié comme **obligatoire**, pas optionnel : c'est lui qui empêche la scène de
  devenir un jeu de flic.

### A7 — Chrono → **35 s. ~~Habillage télécarte, 1 unité = 2,5 s (14 unités).~~ Échappatoire = `Prefs.difficulty`.**

> **AMENDÉ par §8 (B2 / A13) :** les durées 35/56/30 s et la pause sous `RotateOverlay` tiennent.
> La conversion en unités et les paliers 7/4/2 unités **sautent** — paliers refaits en secondes, §8 A13.

- **Durée : 35 s** (Sacha), milieu exact de la fourchette CONFIRMÉE 30-40 s. Ratifié.
- **Habillage : la télécarte** (Yasmine). Ratifié comme canon (A9). **Conversion canonique :
  1 unité = 2,5 s ⇒ 14 unités au départ.** Elle est choisie pour faire tomber les paliers des deux
  lanes au même endroit :

| Palier      | t restant | Unités | Ce qui se passe                                                      |
| ----------- | --------- | ------ | -------------------------------------------------------------------- |
| Mi-parcours | 17,5 s    | 7      | `KENZA — « Ma carte descend. »`                                      |
| Urgence     | 10,0 s    | 4      | `KENZA — « Grouille, il me reste rien. »` + 1ᵉʳ resserrement musical |
| Dernier     | 5,0 s     | 2      | `bip` + 2ᵉ resserrement + annonce `aria-live`                        |

Les deux paliers musicaux de Sacha (10 s / 5 s) et les trois paliers de copie de Yasmine
coïncident désormais. Les annonces lecteur d'écran de Tony (D5.5) se posent sur les mêmes.

- **Échappatoire d'accessibilité : ratifiée**, et chiffrée ici parce que ni Sacha ni Tony ne l'a
  fait. `Prefs.difficulty` module **cette scène** : `easy ×1.6` (**56 s**) · `normal ×1.0`
  (**35 s**) · `hard ×0.86` (**30 s**, plancher de la fourchette historique). Motif : un chrono
  serré sur une tâche de comparaison fine désavantage structurellement un joueur lent (Tony D5.5,
  et c'est juste) ; l'échappatoire **existe déjà** dans le jeu, on la câble ici au lieu d'inventer
  un mode. `easy` sort de la fourchette 30-40 s : **assumé et escaladé** (§6, point 2) — la fidélité
  historique ne prime pas sur une barrière d'accessibilité.
- **Chrono pendant `RotateOverlay` : PAUSE** (question ouverte UX §8.3). Le joueur ne peut pas
  jouer derrière l'overlay ; laisser tourner serait une perte non imputable au joueur.

### A8 — Les deux extensions UX → **mini-crop CUT · verrouillage indicatif CUT · médaillon RENFORCÉ**

**Mini-crop de comparaison locale (UX D4.2) — CUT.** Motifs, dans l'ordre : (1) **il attaque le
verbe de la scène.** Co-localiser un crop de la cible à côté de la variante courante réduit
l'épreuve d'observation à une superposition locale — c'est une aide qui fait la moitié du travail
que la scène demande, et Tony le concède à demi-mot en écrivant « sans dire correct/incorrect »
(le fait d'avoir à écrire cette précaution est le symptôme). (2) **Coût** : Tony le nomme lui-même
comme « la pièce qui coûte le plus » (rendu d'un crop synchronisé par bande) — KISS/YAGNI sur une
feature déjà classée extension. (3) **Il est redondant** : la cible est visible **en permanence**
(A9), on n'est pas en test de mémoire.
**Repli retenu, celui que Tony propose lui-même :** médaillon cible **plus grand et repositionné
contre les bandes** — plancher **28 % de la largeur** en mobile paysage (au lieu de « ≤ 20 % » en
haut d'écran), toujours visible, agrandissable en overlay temporaire au tap/long-press. Le problème
de confusion documenté par la recon est traité par la **proximité**, pas par une aide. Compromis
assumé, tracé ici.

**Verrouillage indicatif de bande (UX §0/D0) — CUT.** Motifs : (1) Sacha le met explicitement hors
spec (§7.2) avec un argument que je fais mien — il ajoute un état (verrouillé/libre), un risque de
blocage perçu, et il faudrait ensuite trancher s'il donne un feedback, ce que **A9 refuse** ;
(2) l'argument de Tony (« réponse au problème de confusion ») ne tient pas ici : un pense-bête qui
ne dit pas si le choix est bon n'aide pas à comparer, il aide à **se souvenir qu'on a regardé** —
or les 4 bandes sont **toutes visibles simultanément** dans son propre layout (son §2.3.1), donc il
n'y a rien à mémoriser. L'extension résout un problème que son layout a déjà supprimé.
Le champ `aria-pressed` associé (D5.4) tombe avec.

**Ce qui reste des deux : rien de perdu côté ergonomie.** Le compteur de position `{n} sur {total}`
(Sacha §5, Yasmine §4.4, Tony) est **conservé** — c'est de la lisibilité d'état, pas du feedback,
et c'est lui qui dit « tu as tout vu ».

### A9 — Feedback → **zéro pendant la phase, tout à la révélation. Cible visible en permanence.**

> **AMENDÉ par §8 (A16) :** « zéro feedback » devient « aucun feedback **par trait** ; un seul
> signal global et terminal : le verrouillage ». Et le **`PARTIAL` 3/4 maintenu ci-dessous n'est
> plus soumettable** — il n'existe qu'au buzzer (§8 A12bis).

Ratifié tel que Sacha l'écrit (D4), sans amendement, et corroboré côté fiction par la ligne
d'ambiance de Yasmine (« Personne te dira si c'est bon. C'est ton œil. ») qui l'installe
diégétiquement au lieu de le subir. La révélation (2,6 s, 4 verdicts de haut en bas à ~0,45 s,
correction visible de chaque bande fausse, 0,8 s de tenue) est **le** beat payant et la seule
raison pour laquelle l'absence de feedback n'est pas une brimade. Le palier **PARTIAL 3/4 est
maintenu** (Sacha le donnait comme son point le plus discutable) : sans lui, un joueur à 3/4 subit
le même verdict qu'un joueur à 0/4, ce qui contredit frontalement la non-négociable §5 règle 4
(« chaque échec, raison affichée »). Le presque-juste doit être **lisible**, faiblement récompensé,
et jamais indolore — c'est exactement le dosage retenu en A1 (`PARTIAL` = score seul, 0 énergie).

### A10 — Le payoff AC6 → **obligatoire, chiffré, et c'est la condition d'existence de la feature.**

`pm` en a fait un critère de sortie dur : « if design cannot show the resolved face mattering
later, cut the feature ». Yasmine livre la fiction du payoff (la page 23, la porte qui se ferme) et
**propose** un effet gameplay sans le chiffrer (« Sacha tranche »). Sacha, lui, écrit l'inverse en
§2.4 : « elle ne modifie pas le quota d'ennemis, ne débloque pas d'arme… **pas un gate** ». En
l'état, **le payoff n'existe dans aucune des trois specs** — c'est le trou de vérifiabilité le plus
grave du set, et il est fatal au titre d'AC1 de la story.

**Décision : le payoff est requis et prend cette forme, en V1 :**

1. **Un rappel narratif visible** au niveau suivant, dans le pré-niveau : à `IDENTIFIED` la tête est
   en page 23 et la porte le refuse ; à `FAILED`, l'habitué refusé + « l'autre est entré ». C'est
   la ligne de Yasmine, jouée obligatoirement.
2. **Un effet mécanique unique et minuscule**, sur le niveau suivant uniquement :
   `IDENTIFIED` ⇒ **la première vague de pression RG/BAC est retardée de +20 s**.
   `PARTIAL` ⇒ **+10 s**. `FAILED` ⇒ **0 s** (et le −20 d'énergie initiale d'A1).
   Un seul levier, un seul niveau, aucune persistance au-delà.

**Motif.** C'est le plus petit effet qui satisfait AC6 sans ouvrir un système : il ne touche ni le
quota, ni les armes, ni la géométrie, ne gate aucune complétion (le §2.4 de Sacha reste vrai sur
tout le reste), et il traduit exactement la fiction — le renseignement adverse a perdu un œil pour
un moment. Le `+20 s` est **ma valeur par défaut** ; si `game-designer` la conteste au retour de
lane, il la remplace par une valeur argumentée dans le même barreau — il ne la supprime pas.

### A11 — Le test du cahier des charges → **la scène passe, et voici à quelle condition exacte.**

Question qu'il m'appartient de trancher : est-ce le « remplissage » que la presse reprochait à
Ocean ? **Réponse : non — sous trois conditions, toutes tenues par les arbitrages ci-dessus, et
sinon oui.**

1. **Elle ne dilue pas la boucle** parce qu'elle est **hors** de la mission (A2) : le budget 3-5 min
   n'est pas entamé d'une seconde.
2. **Elle a une conséquence** (A10). Une interlude sans conséquence _est_ du remplissage, par
   définition. C'est le seul critère qui distingue un set-piece d'une curiosité, et c'est celui que
   la presse d'époque appliquait à Ocean.
3. **Elle apporte un verbe que muf n'a pas** (Sacha D1, argument que je fais mien) : le jeu a déjà
   deux épreuves de fenêtre-à-saisir, il n'a aucune épreuve de « regarder et déduire ». Une
   troisième scène de réflexe aurait été du remplissage même bien exécutée.

**Corollaire opposable :** si, au stage 5, le payoff A10 n'est pas implémenté ou n'est pas perçu
par le joueur au playtest, la feature **échoue son propre gate de justification** et le `pm` et moi
la coupons — pas de « on l'ajoutera plus tard ». C'est le critère de sortie de la story, je le
reprends à mon compte.

### A12 — Le twist « ton propre portrait-robot » → **GEL RATIFIÉ.**

Yasmine demande qu'il soit réservé au Niveau Final, pas dépensé ici. **Accordé, et son argument est
le bon :** un twist n'est pas une boucle — le joueur n'y décide rien, il regarde. Le dépenser sur
une mécanique répétable le brûle pour un gain nul. Il est **gelé, inscrit au canon comme réservé**,
et ne peut être ouvert que par ce gate, dans le cycle du Niveau Final. Aucune lane ne le référence
d'ici là.

---

## 3. Valeurs canoniques (fait foi pour tout le pipeline aval)

Toute valeur ci-dessous prime sur la même valeur dans n'importe quelle spec de lane.

| Clé                                                      | Valeur canonique                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Source / arbitrage                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `stripCount`                                             | **4** — figé (`LA COUPE`, `LE REGARD`, `LE NEZ`, `LA BOUCHE`)                                                                                                                                                                                                                                                                                                                                                                                                                                                | Bertrand · A6                                                         |
| `variantsPerStrip`                                       | **6** — plafond dur 6                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | A5                                                                    |
| `faceTemplates`                                          | **1** gabarit (24 assets de bande)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | A5 · brief art §5.1                                                   |
| Composition des leurres (V1)                             | 1 bonne + 2 classe forte + 3 classe moyenne + **0 classe 4**                                                                                                                                                                                                                                                                                                                                                                                                                                                 | A5                                                                    |
| `occurrences`                                            | **1 par run**, sur déclencheur narratif                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | A3 · `pm`                                                             |
| Placement                                                | **Interstitiel post-niveau**, `AppPhase` dédié `PORTRAIT_ROBOT`                                                                                                                                                                                                                                                                                                                                                                                                                                              | A2                                                                    |
| Gel du monde                                             | **Aucun** (pas de shell ADR-0030)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | A2                                                                    |
| `timerSeconds`                                           | **35** · `easy` **56** · `hard` **30** (`Prefs.difficulty`)                                                                                                                                                                                                                                                                                                                                                                                                                                                  | A7                                                                    |
| ~~Unité de chrono~~                                      | ~~**1 unité = 2,5 s** ⇒ 14 unités · paliers 7 / 4 / 2 unités~~                                                                                                                                                                                                                                                                                                                                                                                                                                               | ~~A7~~ — **supprimé par B2**, voir ci-dessous                         |
| Affichage du chrono                                      | **Jauge continue** qui se vide, sans nombre à l'écran (ni unités, ni secondes). Habillage télécarte conservé                                                                                                                                                                                                                                                                                                                                                                                                 | **B2 · A13**                                                          |
| Paliers de tension                                       | **Mi-parcours : `max(timerSeconds / 2 ; PALIER_URGENCE + 7,0)` s restants** ⇒ 28,0 (`easy`) / 17,5 (`normal`) / **17,0** (`hard`) · **Urgence : 10,0 s restants** · **Dernier : 5,0 s restants** — les deux derniers en **secondes absolues, identiques dans les 3 difficultés**. Si le mi-parcours calculé ≥ `timerSeconds`, il n'est **pas** joué (pas de cue à t=0)                                                                                                                                       | **A13** amendé par **A18**                                            |
| Chrono sous `RotateOverlay`                              | **Pause**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | A7                                                                    |
| ~~`confirmGuardSeconds`~~                                | ~~**1,0** (CTA inerte à l'entrée)~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | ~~Sacha §4.1~~ — **supprimé par B1** (plus de CTA à garder)           |
| `initialStateAllWrong`                                   | **`true`** — invariant de seed : à l'entrée en `ACTIVE`, les 4 bandes affichent une variante **fausse** (0/4 garanti). Remplace la garde anti-validation accidentelle                                                                                                                                                                                                                                                                                                                                        | **A14** (remplace `confirmGuardSeconds`)                              |
| `revealSeconds`                                          | **2,6** à `PARTIAL`/`FAILED` (4×~0,45 s + 0,8 s de tenue — la reptation porte les corrections) · **1,4** à `IDENTIFIED` (flash de verrouillage + 4 tampons simultanés, pas de reptation)                                                                                                                                                                                                                                                                                                                     | **A15** (amende Sacha §4.1)                                           |
| **Reptation de révélation** (contenu de `revealSeconds`) | **OBLIGATOIRE à `PARTIAL`/`FAILED`** : les 2,6 s sont une séquence **JOUÉE** — 4 verdicts de bande à ~0,45 s **avec affichage de la variante JUSTE** de chaque bande fausse, puis 0,8 s de tenue. Ce n'est PAS un temps mort. Un écran qui laisse le joueur fixer un visage faux sans jamais voir la bonne réponse est un **FAIL de gate**, pas un manque de polish. À `IDENTIFIED` : pas de reptation (1,4 s, 4 tampons simultanés)                                                                         | **A15** · **R-4 GARDE (Bertrand 2026-08-05)** · guidelines §5 règle 4 |
| `resultHoldSeconds`                                      | **2,2** (`QTE_RESULT_HOLD`) — inchangé, toutes issues                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Sacha §4.1, ratifié                                                   |
| `identifiedThreshold`                                    | **4/4** — **évalué en continu, verrouillage automatique et immédiat** dès que l'état courant est 4/4                                                                                                                                                                                                                                                                                                                                                                                                         | **A12bis** (amende Sacha §4.2)                                        |
| `partialThreshold`                                       | **3/4 — atteignable UNIQUEMENT au buzzer ou à l'abandon.** Il n'existe plus d'acte de soumission volontaire                                                                                                                                                                                                                                                                                                                                                                                                  | **A12bis** (amende A9)                                                |
| `failedThreshold`                                        | **≤ 2/4** au buzzer ou à l'abandon                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Sacha §4.2, ratifié                                                   |
| Ordre de résolution (anti-issue-fantôme)                 | Le test 4/4 se fait **à chaque changement d'état de bande**, avant tout tick de chrono ; l'expiration n'est évaluée **que si aucun verrouillage n'a eu lieu**. Un 4/4 posé dans la même frame que l'expiration ⇒ **`IDENTIFIED`**                                                                                                                                                                                                                                                                            | **A12bis**                                                            |
| Timeout / sortie anticipée                               | **Évalué à l'état courant** — aucun échec sec. Ne peut **jamais** produire `IDENTIFIED` (un 4/4 se serait déjà verrouillé) ⇒ issues possibles : `PARTIAL` ou `FAILED`                                                                                                                                                                                                                                                                                                                                        | A2 · **A12bis**                                                       |
| **Sortie anticipée** (ex-« abandon »)                    | **RATIFIÉE comme geste « j'ai fini, imprime »** — affordance **visible en permanence** (≥ 44×44 px), pas un `Escape` caché. Résout à l'état courant. **Jamais** un abandon dans la copie, **jamais** une validation dans la fonction                                                                                                                                                                                                                                                                         | **A17 · Bertrand 2026-08-05**                                         |
| Confirmation de la sortie anticipée                      | **OUI, conservée, mais sans modale** : cible **armée au 1ᵉʳ appui, confirmée au 2ᵉ appui sur la MÊME cible** dans une fenêtre de **2,0 s** ; désarmement silencieux à l'expiration. **Le chrono ne se met pas en pause** pendant l'armement. ~~`Échap` clavier suit le même protocole en deux temps~~ → **le protocole en deux temps ne s'applique qu'au POINTEUR (tactile et souris). Au CLAVIER — y compris `Échap` et `Entrée`/`Espace` sur l'affordance focalisée — la sortie se fait en UN SEUL appui** | **A17**, amendé par **A17-bis**                                       |
| Critère anti-CTA (opposable)                             | Est interdit tout contrôle dont l'activation **peut produire `IDENTIFIED`** ou évaluer une réussite. La sortie anticipée ne le peut pas par construction ⇒ elle n'est **pas** un CTA. C'est le critère, pas la forme du geste                                                                                                                                                                                                                                                                                | **A17** (précise §7 3-bis de la spec M)                               |
| `IDENTIFIED`                                             | **0 vie · 0 énergie · +1500 score · payoff +20 s**                                                                                                                                                                                                                                                                                                                                                                                                                                                           | A1 · A10                                                              |
| `PARTIAL`                                                | **0 vie · 0 énergie · +400 score · payoff +10 s**                                                                                                                                                                                                                                                                                                                                                                                                                                                            | A1 · A10                                                              |
| `FAILED`                                                 | **0 vie · −20 énergie initiale du niveau suivant · 0 score · beat obligatoire**                                                                                                                                                                                                                                                                                                                                                                                                                              | A1 · A1b                                                              |
| Perte de vie                                             | **INTERDITE** sur cette scène, toutes issues confondues                                                                                                                                                                                                                                                                                                                                                                                                                                                      | A1 · story AC5                                                        |
| Feedback pendant `ACTIVE`                                | ~~**Zéro**, sous toute forme~~ → **Aucun feedback par trait, sous aucune forme. UN seul signal, global, binaire et terminal : le verrouillage.** Il ne commente pas, il termine                                                                                                                                                                                                                                                                                                                              | **A16** (amende A9)                                                   |
| Cible                                                    | **Visible en permanence** · médaillon ≥ **28 %** de largeur en mobile paysage                                                                                                                                                                                                                                                                                                                                                                                                                                | A8                                                                    |
| Geste primaire tactile                                   | **swipe horizontal sur la bande visée** = variante ±1 sur CETTE bande. Pas de tap de sélection, pas de bande « active » au doigt. Chevrons ◀ ▶ conservés en affordance + cible d'accessibilité (≥ 44×44 px), jamais comme geste primaire                                                                                                                                                                                                                                                                     | **A4-bis · Bertrand 2026-08-05** (renverse A4)                        |
| Geste primaire desktop                                   | ~~à trancher sur maquette Figma~~ → **OPTION B : drag horizontal à la souris sur la bande visée** = variante ±1 sur CETTE bande. Même modèle mental que le swipe tactile, un seul geste à documenter pour les deux classes d'appareil. Clic sur chevron conservé en affordance + cible d'accessibilité                                                                                                                                                                                                       | **B3 · Bertrand 2026-08-05**                                          |
| Geste clavier                                            | ↑↓ = bande · ←→ = variante · ~~Entrée = CTA~~ (plus de CTA, `Entrée` bindée à rien) · ~~Échap = confirmation d'abandon~~ → ~~**Échap = sortie anticipée, en deux appuis (A17)**~~ → **Échap = sortie anticipée, en UN appui (A17-bis)** — asymétrie assumée avec le pointeur                                                                                                                                                                                                                                 | A2 · UX §2.1 · **B1 · A17 · A17-bis**                                 |
| Bandeau / ~~CTA~~                                        | **`TÊTE À CONNAÎTRE`** / ~~**`SORTIR LA TÊTE`**~~ — **le CTA n'existe plus dans l'IHM** (B1). La réplique KENZA « Sors-moi une tête, une seule » reste au dialogue                                                                                                                                                                                                                                                                                                                                           | A6 · **B1**                                                           |
| Déterminisme                                             | Fonction pure hachée de `portraitSeed` · zéro `Math.random` / `Date.now`                                                                                                                                                                                                                                                                                                                                                                                                                                     | ADR-0034 · Sacha §0                                                   |

---

## 4. Ce qui est COUPÉ

| Coupé                                                                                  | Auteur                              | Motif                                                                                                                     |
| -------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **−0,5 cœur** (et toute perte de vie)                                                  | M §4.3                              | Contredit story AC5 · A1                                                                                                  |
| **+25 énergie** à `IDENTIFIED`                                                         | M §4.3                              | Inopérant (clamp à 100) après A1c                                                                                         |
| **Gel du monde / shell ADR-0030**                                                      | M §2.1                              | Placement interstitiel · A2                                                                                               |
| **Table de progression #1/#2/#3+**                                                     | M §3 D3                             | Une seule occurrence par run · A3 (gardée en note post-V1)                                                                |
| **8 variantes par bande**                                                              | M §3/§4.1                           | Budget art · A5                                                                                                           |
| **Mini-crop de comparaison locale**                                                    | UX D4.2                             | Attaque le verbe de la scène + coût · A8                                                                                  |
| **Verrouillage indicatif de bande**                                                    | UX §0/D0                            | État superflu, problème déjà supprimé par le layout · A8                                                                  |
| Libellés `CHEVEUX/YEUX/…` en surface joueur                                            | UX §1                               | Vocabulaire canon · A6                                                                                                    |
| Bandeau « PORTRAIT-ROBOT » / « dossier suspect »                                       | UX §1/§6                            | Registre interdit · A6                                                                                                    |
| **Bandes qui défilent à figer**                                                        | option B, M §1                      | Close définitivement · A4                                                                                                 |
| Nom propre pour « le type de la porte »                                                | F Q4                                | Recommandation de Yasmine ratifiée — il reste anonyme                                                                     |
| Twist « ton propre portrait-robot »                                                    | F §2.1                              | **Gelé**, pas coupé · A12                                                                                                 |
| **CTA `SORTIR LA TÊTE`** (le bouton, la chaîne, sa zone d'écran, son focus, `Entrée`)  | M §R5/§4.1, UX §1/§2.1/§5, F §4.9   | **Bertrand B1** — la validation est automatique · A12bis                                                                  |
| **`confirmGuardSeconds` 1,0 s**                                                        | M §4.1                              | Gardait un CTA qui n'existe plus · **B1**. Remplacé par l'invariant `initialStateAllWrong` · A14                          |
| **Compte d'unités télécarte (14 unités, 1 unité = 2,5 s)** et **paliers 7/4/2 unités** | A7, M §4.1/§6/AC13, F §4.5, UX §1.1 | **Bertrand B2** — essais illimités dans un temps imparti, plus de décompte d'essais ni d'unités · A13                     |
| **Libellé `TÉLÉCARTE · {n} UNITÉS`** (et son repli `{n} UNITÉS`)                       | F §4.5/§4.9, UX §1.1                | Il n'y a plus d'unités à afficher. Jauge continue · A13. Copie de remplacement due par `narrative-designer`               |
| **Soumission volontaire d'un 3/4**                                                     | A9                                  | Sans CTA, on ne peut plus soumettre. `PARTIAL` n'existe plus qu'au buzzer · A12bis                                        |
| **Reptation de révélation à `IDENTIFIED`** (4×0,45 s)                                  | M §4.1                              | Zéro information à délivrer après un verrouillage 4/4 · A15 (2,6 s → 1,4 s). Conservée intégralement à `PARTIAL`/`FAILED` |

Restent hors spec V1, tels que Sacha les liste (§7) et que je ratifie sans changement : feedback par
trait, bonus de score au temps restant, plus de 4 bandes, indices/aides, cible masquée, portraits
procéduraux, effet sur le quota/les armes/la complétion, photo numérisée.

---

## 5. Cohérence design ↔ art (flags à `lead-art`, pas d'arbitrage visuel)

Le brief de Nico n'est pas dans mon gate. Trois points de contact à traiter entre nous :

1. **Budget : nous nous sommes alignés.** A5 fixe N=6 / M=1 = 24 assets, dans la fourchette 16-24
   qu'il recommande. Sa **règle de raccord** (§1) et son **plancher de discernabilité** (§2) sont
   ratifiés côté design comme **contraintes opposables** : la règle du trait nommé (A5) et le
   plancher de lisibilité mobile CRT allumé disent la même chose des deux côtés de la frontière.
2. **Correction à faire descendre :** son §4 justifie l'hypothèse « monde de jeu » par « elle a un
   chrono **qui coûte une vie** ». C'est faux depuis A1, et son placement change avec A2. Réponse
   du design à sa question ouverte 7.3 : **surface interstitielle mais INTERACTIVE** — le liseré
   néon de sélection est légitime (la loi du glow dit « ce qui brille est manipulable », et la bande
   active l'est), la cible reste sans glow. La formulation finale et l'application du CRT sont sa
   juridiction, pas la mienne.
3. **Sa recommandation de graduer par classe de variation** plutôt que par le nombre est **adoptée**
   et devient la règle de difficulté V1 (A5).

---

## 6. Escalade à Bertrand (dépasse les guidelines ou une décision qui t'appartient)

1. **A4 est ratifiée sur la source, pas sur ton intention.** Tu as dit « 4 bandes » ; la recon
   confirme la **sélection libre** et les trois lanes ont convergé dessus. Si tu voulais
   littéralement des **bandes qui défilent qu'on fige**, dis-le maintenant : ça réécrit A4, la §2.2
   de la spec mécanique et deux lignes de tuning — le reste tient. Après le TECH PLAN, ça coûte
   beaucoup plus.
2. **A2 — la scène quitte la mission.** Sacha l'écrivait en cours de niveau. Je la sors pour tenir
   les 3-5 min. C'est un déplacement de ton brief initial : à confirmer.
3. **A7 — `easy` à 56 s sort de la fourchette historique 30-40 s.** Choix assumé : accessibilité
   avant fidélité. Si tu veux le plancher historique en toutes difficultés, dis-le, mais alors on
   perd l'échappatoire pour les joueurs lents et il faut l'écrire comme tel.
4. ~~**A1c est une règle neuve.**~~ → **RATIFIÉE par Bertrand le 2026-08-05 (« valide ça »).**
   Elle n'est plus proposée, elle n'est plus une escalade, et elle **sort du périmètre de cette
   story** : « une scène interstitielle modifie le capital d'énergie initial du niveau **suivant**,
   jamais l'énergie du niveau écoulé » devient une **règle de projet**, applicable à toute scène
   interstitielle future. Inscription dans
   `_bmad-output/guidelines/PROJECT_GUIDELINES.md` : **due par `pm`**, en parallèle de ce cycle.
   Ici, A1c est du **canon acquis** — plus rien à décider. Voir §9.
5. **A12 — le gel du twist « ton propre portrait-robot »** immobilise la meilleure idée du lot
   jusqu'au Niveau Final. Je l'approuve ; c'est un pari de calendrier, il t'appartient de le casser.
6. **A11 est un couperet.** Si le payoff A10 n'est pas ressenti au playtest, `pm` et moi coupons la
   feature après investissement art. Tu es prévenu du risque maintenant, pas au stage 5.

---

## 7. Retours de lane

### M — `game-designer` (Sacha) · RETOUR LANE, round 1/2

À amender, **sans reconception** (toutes les valeurs sont en §3) :

- §2.1 / §2.3 : placement **interstitiel**, suppression du gel du monde et du shell ADR-0030 (A2).
- §4.3 : sanction → **énergie seule**, mécanisme A1c ; suppression du +25 ; ajout des payoffs A10.
- §3 D3 : table de progression → note post-V1 (A3).
- §3/§4.1 : `variantsPerStrip` **6**, plafond 6, composition de leurres V1 (A5).
- §4.1 : ajout de la modulation `Prefs.difficulty` et du mapping unités de télécarte (A7).
- AC2 : mapping tactile aligné sur l'UX — chevrons primaires, swipe optionnel (A4).
- AC5/AC6 : réécrits sur le barème §3 ; **AC6 devient « la scène ne retire jamais de vie »**.
- **Nouvel AC** : payoff A10 vérifiable au niveau suivant (retard de vague + rappel narratif).
- Libellés de zone : noms internes conservés, surface joueur = A6.

### F — `narrative-designer` (Yasmine) · PASS AVEC CONDITIONS

Spec la plus propre du set : angle justifié, alternatives démolies, textes livrés avec plafonds,
interdits explicites, zéro sprite présumé. Canon net-new **ratifié** : la **page 23**, la
**télécarte** comme chrono diégétique, le **gel du twist** (A12). Conditions :

1. Ajouter la conversion **1 unité = 2,5 s / 14 unités** et caler les trois paliers sur 7/4/2
   unités (A7).
2. **Manque un verdict `PARTIAL` (3/4)** — §4.6 et §4.7 ne couvrent que réussite et échec. Le palier
   existe (A9) et la non-négociable §5 règle 4 impose une raison affichée : écrire le tampon + les
   lignes KENZA/DISPATCH/MUF du « presque ».
3. Écrire les **deux rappels du niveau suivant** (A10) : la porte qui refuse à `IDENTIFIED`,
   l'habitué refusé + « l'autre est entré » à `FAILED`. Ils sont obligatoires, pas optionnels.
4. Passe de conformité sur les libellés d'IHM que l'UX ajoute (bandeau, CTA `SORTIR LA TÊTE`,
   message de confirmation d'abandon) contre ta liste d'interdits §6.

### UX — `ux-designer` (Tony) · PASS AVEC CONDITIONS

Le layout mobile chiffré, les cibles 44 px, la passe a11y et le signalement du chrono comme barrière
sont exactement ce qu'on attend de la lane — D5.5 a produit une valeur canonique que personne
d'autre n'avait vue. Conditions :

1. **Retirer** le mini-crop (D4.2/D4.3) et le verrouillage indicatif (§0, §5.2, §6, D5.4
   `aria-pressed`) ; **appliquer le repli** médaillon ≥ 28 % rapproché des bandes (A8).
2. Libellés de bande, bandeau, CTA, « dossier suspect » → vocabulaire canon (A6).
3. §7 : **supprimer toute mention de « perte de vie »** — la garde `Escape` est conservée, mais son
   motif devient « la scène se résout à l'état courant » (A1, A2).
4. Inscrire les facteurs `Prefs.difficulty` **56 / 35 / 30 s** (A7) et la pause du chrono sous
   `RotateOverlay`.
5. §7 : `AppPhase` **`PORTRAIT_ROBOT` en interstitiel post-niveau** confirmé (A2) — le placement
   n'est plus une question ouverte.
6. Question §8.1 (5ᵉ bande) : **close**, 4 bandes figées, ton calcul 56 px tient.

---

## Hand-off

Design gate **PASS conditionnel** pour le cycle PORTRAIT-ROBOT. La §3 est canonique dès maintenant :
`senior-architect` peut ouvrir le TECH PLAN (ADR-0079/0080/0081) **sur la §3 de ce gate**, sans
attendre les réécritures de lane — aucune valeur ne bougera. Points structurants pour lui :
`AppPhase` interstitiel (A2), pas de réemploi du shell ADR-0030, contrat de sortie
`outcome/correctCount/energyDelta(niveau+1)/scoreDelta/waveDelaySeconds`, déterminisme par
`portraitSeed`, atomicité du gabarit de bandes demandée par `lead-art`.

**Re-review `pm` (AC9)** attendue sur un point : A2 (placement) et A10 (payoff chiffré) précisent sa
story sans la contredire ; A1/A3/A5 la confirment.

**VERIFY (stage 5) :** `game-designer` rejoue la scène construite contre la §3 et contre A11 — la
question posée au playtest n'est pas « est-ce que ça marche » mais **« est-ce que le payoff se
sent »**. Je verdicte l'acceptation design sur ce rapport.

**À loguer :** `docs/handoffs/story-portrait-robot.md`, indexé dans `docs/agent-handoffs.md`.

---

## 8. Amendements post-gate (Bertrand, 2026-08-05)

Trois arbitrages directs, **postérieurs au gate, qui priment sur tout ce qui précède**. Les deux
premiers ne sont pas cosmétiques : ils **suppriment l'acte de validation** et **délinéarisent le
chrono**. La §3 et la §4 ci-dessus sont mises à jour en place — elles restent la source de vérité.
Maquette de référence à jour : Figma `muf — Design System`, page `Écrans · Portrait-robot`.

### Les trois arbitrages, verbatim

| #      | Verbatim                                                                                                                      | Ce qu'il renverse                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **B1** | « bouton "sortir la tete" **inutile**, il faut **valider à l'écran dès que la bonne combinaison est sortie** »                | A6 (CTA), A9, Sacha R5/§4.1, UX §2.1 |
| **B2** | « télécarte 14 unités -> **on vire**, autant d'essais que l'on veut mais **dans un temps imparti** »                          | A7 (conversion et paliers en unités) |
| **B3** | Desktop : « **option B** » = drag horizontal sur la bande, même modèle mental que le swipe tactile ; mobile reste sur A4-bis. | A4-bis (point laissé ouvert)         |

### A12bis — Régime des issues sans acte de validation

C'est la conséquence structurante de B1. Il n'y a plus **un** moment d'évaluation (la soumission),
il y en a **deux, de natures différentes** :

1. **`IDENTIFIED` = verrouillage automatique en cours de phase.** Dès que l'état courant des
   4 bandes est 4/4, la phase se termine sur-le-champ. Le joueur ne décide pas de la fin.
2. **`PARTIAL` (3/4) et `FAILED` (≤ 2/4) = évaluation de l'état courant à l'expiration** du chrono
   (ou à l'abandon confirmé, qui reste traité comme une expiration anticipée — A2 inchangé).

**Le 3/4 ne peut donc plus exister qu'au buzzer.** A9 le maintenait comme un palier de soumission ;
il devient un palier **subi**. Ça ne l'affaiblit pas — au contraire, il devient plus honnête : le
joueur ne peut plus « se contenter » d'un 3/4 pour empocher les 400 points, il ne peut que ne pas
avoir fini. Le motif d'A9 (le presque-juste doit être lisible, faiblement récompensé, jamais
indolore) tient mot pour mot, avec un `PARTIAL` **strictement moins farmable** qu'avant. Barème
`IDENTIFIED`/`PARTIAL`/`FAILED` (A1, A10) : **inchangé, aucune valeur ne bouge**.

**Issue fantôme cherchée, trouvée, fermée : le 4/4 pile au buzzer.** Sans règle d'ordre, un joueur
qui pose sa 4ᵉ bonne bande dans la frame de l'expiration tombe dans un état où deux évaluations
concurrentes sont vraies (`IDENTIFIED` par verrouillage, `PARTIAL`/`FAILED` par expiration selon
l'ordre d'évaluation). **Règle canonique (§3) :** le test 4/4 est évalué **sur événement d'entrée**,
le test d'expiration **sur tick**, et l'expiration n'est évaluée **que si aucun verrouillage n'a eu
lieu**. À égalité, **`IDENTIFIED` gagne**. Motif : le joueur a produit la combinaison, la scène ne
peut pas la lui refuser sur un départage de frame — et c'est le sens du garde-fou anti-« mort
bullshit » déjà appliqué en A1. Corollaire déterministe (ADR-0034) : cet ordre doit être **une
propriété du réducteur, pas de l'ordre d'arrivée des events du navigateur**.

**Deuxième fantôme, fermé par A14 :** le seed pouvait produire un 4/4 **à l'entrée en `ACTIVE`**,
soit une scène qui se verrouille avant le premier geste. Impossible désormais par invariant.

### A14 — `confirmGuardSeconds` ne se transforme pas, il est remplacé

`confirmGuardSeconds` = 1,0 s existait pour **une seule raison** : désarmer un CTA pendant la
première seconde, contre la validation accidentelle en sortie de transition. Le CTA disparaît, la
raison disparaît : **la valeur saute, elle ne se transforme pas.** Un délai de grâce sur
l'auto-verrouillage serait absurde (il retarderait une bonne réponse) et un délai avant d'accepter
les entrées serait une perte de temps non imputable au joueur.

Ce qu'il faut **quand même** couvrir, c'est le risque qu'il couvrait de fait : une issue produite
sans geste. D'où la nouvelle valeur canonique **`initialStateAllWrong = true`** — invariant de seed,
les 4 bandes démarrent sur une variante fausse. Il garantit **≥ 4 gestes délibérés** avant tout
verrouillage, ce que la garde temporelle ne garantissait même pas. C'est un durcissement, pas un
report. Vérifiable par test pur sur `portraitSeed` : `correctCount(état initial) === 0`.

### A15 — Ce que devient la révélation après un verrouillage

Question réelle : la reptation trait-par-trait (4 verdicts à ~0,45 s + 0,8 s de tenue = 2,6 s) avait
un sens **informatif** après une soumission — elle disait _quels_ traits étaient faux et les
corrigeait à l'écran. Après un verrouillage automatique, ce contenu informatif dépend de l'issue :

- à `PARTIAL`/`FAILED`, il est **intact** : il reste 1 à 4 bandes à corriger sous les yeux du
  joueur, c'est le beat payant d'A9 et la « raison affichée » exigée par la non-négociable §5
  règle 4 des guidelines. **`revealSeconds` reste 2,6 s.**
- à `IDENTIFIED`, il est **nul** : quatre tampons « juste » qui défilent l'un après l'autre pour
  annoncer ce que le verrouillage vient déjà d'annoncer. C'est du temps mort sur le meilleur moment
  du jeu. **`revealSeconds` = 1,4 s** : flash de verrouillage + les 4 tampons **simultanés**, pas de
  reptation.

`resultHoldSeconds` reste **2,2 s** dans les deux cas — c'est le temps de lire le tampon et la
ligne KENZA, il ne dépend pas de l'issue. Budget total de la scène : 35 + 1,4 + 2,2 = **38,6 s** à
`IDENTIFIED` (contre 39,8 s avant), inchangé ailleurs. Aucun impact sur A2/A11.

**Précision du 2026-08-05 (stage 6, finding M6) — l'asymétrie 2,6 / 1,4 n'a de sens que si la
reptation est JOUÉE.** Le panel a constaté que `revealSeconds` était consommé comme **délai**, sans
reptation : à l'échec, 2,6 s + 2,2 s de tenue = **4,8 s passées à fixer un visage faux, sans jamais
voir la bonne réponse**. Sous cette implémentation, A15 devient incohérent avec lui-même : les deux
valeurs ne se justifiaient que par leur **contenu informatif** (2,6 s parce qu'il reste 1 à 4 bandes
à corriger sous les yeux du joueur ; 1,4 s parce qu'il n'y a rien à dire après un 4/4). Un délai nu
de 2,6 s n'est pas un beat payant, c'est la punition d'attendre. **Bertrand a tranché « GARDE » : on
implémente** (R-4 ci-dessous). Les deux valeurs restent **inchangées** — c'est leur contenu qui est
rendu obligatoire, pas leur durée qui bouge.

**Ce que la reptation N'EST PAS, et qui doit rester clair pour le prochain reviewer :** elle est
**post-résolution**, donc elle ne tombe pas sous l'interdit A16. A16 interdit le feedback par trait
**pendant `ACTIVE`**, parce qu'il orienterait les gestes suivants. Ici il n'y a pas de geste suivant :
la phase est finie, la scène ne se rejoue jamais (A3). Un dev ou un reviewer qui lit la reptation
comme une violation d'A16 lit la bonne règle sur la mauvaise fenêtre de temps.

### A16 — A9 tient, mais sa formulation change (et c'est le vrai sujet)

**A9 ne tient pas tel quel** : « zéro feedback, sous toute forme » est devenu factuellement faux, le
verrouillage **est** un feedback, et c'est le seul. Prétendre le contraire serait une table qui ment.

**Nouvelle formulation canonique :** _aucun feedback par trait, sous aucune forme ; UN seul signal,
global, binaire et terminal — le verrouillage. Il ne commente pas, il termine._

La distinction est nette et elle est opposable au dev comme à l'UX : un signal qui **met fin à la
phase** n'informe pas la suite du jeu du joueur, il n'y a pas de suite. Un signal par trait, lui,
oriente les trois gestes suivants — c'est ce qui reste interdit, et c'est tout ce qu'A9 protégeait
vraiment. L'installation diégétique de Yasmine (« Personne te dira si c'est bon. C'est ton œil. »)
reste **exacte** : personne ne te dit si c'est bon, la scène s'arrête quand ça l'est.

**L'effet de bord, chiffré au lieu d'être supposé.** Le CTA rendait le brute-force impossible : on
ne soumettait qu'une fois. Sans lui, le joueur peut **balayer** les variantes en attendant que ça
se verrouille. Est-ce une menace ?

- Espace de recherche : 6⁴ = **1 296** combinaisons. Un balayage exhaustif est un compteur base 6 à
  4 chiffres : **1 295 entrées** minimum (une entrée = un cran = un nouvel état).
- Cadence d'entrée : la §A5 de ce gate a déjà chiffré le débit d'input de la scène (4×6 = 20
  pressions ≈ 5 s), soit **≈ 4 entrées/s au clavier**. Un swipe/drag discret est plus lent :
  **≈ 2/s**.
- Couverture en 35 s : **140 états au clavier (10,8 %)**, **70 au doigt (5,4 %)**. En `easy` (56 s) :
  224 états, **17,3 %**. Même à 8 entrées/s — irréaliste sous chrono — on plafonne à **21,6 %**.
- Balayage complet : 1 295 / 4 ≈ **324 s**, soit **9,3 × le chrono**.
- Et le balayeur qui échoue échoue **durement** : il finit sur un état quelconque, où
  P(≥ 3 bons) = 4·(1/6)³·(5/6) = 20/1296 = **1,5 %**. Le brute-force ne rate pas en `PARTIAL`, il
  rate en `FAILED`.

**Verdict : le brute-force n'est pas une menace, il est une stratégie strictement dominée.** ~11 %
de réussite contre ~1,5 % de lot de consolation, face à un joueur qui regarde et qui vise 4/4 sur
une comparaison à 6 variantes dont 2 leurres forts seulement (A5). Anti-synergie en prime : balayer
au doigt, c'est ne pas regarder la cible. **Aucune contre-mesure n'est ajoutée** — pas de cooldown
d'input, pas de pénalité au nombre de crans, pas de plafond d'essais. Ce serait de la complexité
contre un exploit qui n'existe pas, et ça punirait le joueur qui hésite légitimement. Position
réévaluable au stage 5 **sur une observation de playtest**, pas sur une intuition.

### A13 — Le chrono, ré-exprimé en secondes

`timerSeconds` **inchangé** : 35 s · `easy` 56 · `hard` 30 (A7 tient, y compris son escalade §6.3).
Ce qui saute (B2) : l'unité de 2,5 s, le compte de 14 unités, les paliers 7/4/2. **Affichage : jauge
continue qui se vide**, sans nombre — ni unités, ni secondes (« temps restant » reste interdit,
A6). L'habillage télécarte survit comme **objet**, pas comme compteur : c'est la carte qui se vide,
et c'est cohérent avec la fiction §4.5 de Yasmine (« il ne dit pas temps restant, il dit ce qu'il
coûte »).

**Les paliers refaits, en secondes :**

| Palier      | Déclencheur                          | `normal` (35 s) | `easy` (56 s) | `hard` (30 s) | Ce qui se passe                                                      |
| ----------- | ------------------------------------ | --------------- | ------------- | ------------- | -------------------------------------------------------------------- |
| Mi-parcours | **50 % de `timerSeconds` écoulés**   | 17,5 s restants | 28,0 s        | 15,0 s        | `KENZA — « Ma carte descend. »` (copie seule)                        |
| Urgence     | **10,0 s restants** (valeur absolue) | 10,0 s          | 10,0 s        | 10,0 s        | `KENZA — « Grouille, il me reste rien. »` + 1ᵉʳ resserrement musical |
| Dernier     | **5,0 s restants** (valeur absolue)  | 5,0 s           | 5,0 s         | 5,0 s         | `bip` + 2ᵉ resserrement + annonce `aria-live`                        |

**Motif de la règle mixte — c'est un arbitrage, pas une commodité.** Le mi-parcours est un palier
**de rythme** : il doit tomber au milieu de la scène, quelle que soit sa durée ⇒ proportionnel.
L'urgence et le dernier palier sont des paliers **de panique** : ce qui les rend efficaces, c'est
qu'il reste peu de temps **en secondes réelles**, pas en pourcentage. En `easy`, un palier d'urgence
proportionnel tomberait à 16 s restants — assez de temps pour tout corriger, donc une fausse alarme
qui apprendrait au joueur à ignorer la musique. Bénéfice secondaire : la table de paliers
audio/`aria-live` est **la même dans les trois difficultés** sur ses deux paliers critiques.

Note : ce recalcul **révèle un trou qu'A7 masquait** — le compte de 14 unités n'avait aucun sens en
`easy` (56 s / 2,5 = 22,4 unités) ni en `hard` (12). La conversion télécarte était incompatible avec
l'échappatoire d'accessibilité qu'elle côtoyait dans la même table. B2 la supprime avant qu'un dev
ait eu à deviner. Bonne prise, par accident.

### B1 — Ce qui tombe avec la chaîne `SORTIR LA TÊTE`

**La chaîne disparaît de l'IHM.** Elle appartient à `narrative-designer` (A6) : **prévenue**, avec
deux points à vérifier de son côté et un livrable neuf.

- Rien d'autre dans le copy-deck n'en dépend, **vérifié** : `SORTIR LA TÊTE` n'apparaît que dans le
  §4.9 (replis) de la fiction et dans la §2 du gate. La réplique **source** de KENZA
  (« Sors-moi une tête, une seule ») est un **dialogue**, pas un libellé : elle **reste**, et elle
  reste le meilleur argument que la scène n'a jamais eu besoin d'un bouton.
- En revanche `TÉLÉCARTE · {n} UNITÉS` et son repli `{n} UNITÉS` (§4.5, §4.9) sont **morts** (A13) :
  il faut un libellé de jauge sans nombre. Livrable neuf, plafond court.
- Et la variante d'expiration §4.7 (« Ma carte est morte. On imprime ce qu'on a. ») était écrite
  comme le cas « le chrono expire **avant toute validation** » — formulation caduque : l'expiration
  est désormais **le** chemin normal de `PARTIAL`/`FAILED`, plus une variante. La ligne est bonne,
  son cadrage doit être réécrit.

### Ce que ces amendements NE changent pas

Pour couper court à toute dérive silencieuse : **A1** (énergie seule, zéro vie), **A1c**, **A2**
(interstitiel), **A3** (1/run), **A5** (4 bandes, 6 variantes, 1 gabarit, composition des leurres),
**A6** (vocabulaire, hors CTA), **A8** (mini-crop et verrouillage indicatif restent CUT — le
verrouillage **automatique** d'A12bis n'a rien à voir avec le verrouillage **indicatif de bande**
d'A8, qui reste coupé), **A10** (payoff +20/+10/0 s), **A11** (le couperet) et **A12** (gel du
twist) sont **intacts**. `timerSeconds`, les seuils 4/4 · 3/4 · ≤2/4 et les trois barèmes d'issue
n'ont pas bougé d'une unité.

### Escalade complémentaire à Bertrand

7. **A16 est le point qui te revient si tu veux le casser.** J'assume qu'un balayage à ~11 % de
   réussite ne mérite aucune contre-mesure, et je refuse d'ajouter un cooldown d'input « au cas
   où ». Si le playtest stage 5 montre des joueurs qui balayent **au lieu** de regarder, ce n'est
   pas le brute-force qu'il faudra punir, c'est le signe que les leurres sont trop durs (levier A5,
   classe de variation) — je traiterai par là, pas par une pénalité.
8. **A15 crée deux durées de révélation au lieu d'une.** C'est une asymétrie assumée (l'information
   à délivrer n'est pas la même), mais c'est une constante de plus pour le dev. Si tu préfères une
   seule valeur, la bonne est **2,6 s partout** — jamais 1,4 s partout, ce qui écraserait les
   corrections à `FAILED` et casserait la non-négociable §5 règle 4.

---

## 9. Ratifications Bertrand — 2026-08-05 (après lecture du dossier complet)

Trois réponses de Bertrand. Elles **ferment** ; ce §9 journalise ce qu'elles ferment et rend les
deux arbitrages qu'elles laissaient à ma charge. **Le dossier ne se rouvre pas dessus.**

| #   | Réponse de Bertrand                                                     | Portée                        | État                                        |
| --- | ----------------------------------------------------------------------- | ----------------------------- | ------------------------------------------- |
| R-1 | Sortie anticipée rhabillée en « j'ai fini, imprime » — « Ok très bien » | Story · canon §3              | **RATIFIÉ → A17**                           |
| R-2 | Règle A1c — « valide ça »                                               | **Projet** (dépasse la story) | **RATIFIÉ → §6.4**                          |
| R-3 | Voie de production art : visages entiers puis découpe des bandes        | Art · ADR-0080                | **RATIFIÉ**                                 |
| R-4 | Reptation de révélation (AC4 / finding M6) — « **GARDE** » (2026-08-05) | Story · canon §3 · A15        | **RATIFIÉ → on IMPLÉMENTE, pas de descope** |

**Deuxième vague — 2026-08-05, après le triage du panel (stage 6, §6.2/§6.3 du journal de story).**
Deux inscriptions, toutes deux **actées ici et dans le même diff que le code**, parce qu'une
divergence non écrite se relit comme un bug — c'est exactement ce que quatre reviewers viennent de
faire sur `Échap`.

### A17-bis — `Échap` et le clavier : l'asymétrie est assumée, la table s'aligne sur le code

**Le constat.** Mon canon §3 (A17) écrivait que « `Échap` clavier suit le même protocole en deux
temps ». Le code livré par `dev-r3f-render` sort en **un seul appui** au clavier. Le panel l'a levé
en M5 (divergence non actée).

**L'arbitrage est rendu par `senior-architect` (§6.3 du journal de story) et je l'inscris : le code
garde son comportement, c'est ma table qui bouge.** L'argument de l'`ux-designer` (§2.8.4) est bon,
et il est meilleur que ma ligne d'origine :

- le protocole en deux temps a été conçu **contre le mistap du pouce** (A17 : « le geste primaire est
  un swipe/drag horizontal, au milieu des bandes, un swipe raté qui se résout en tap est le scénario
  nominal »). Ce raisonnement est **entièrement spatial**. Il ne transpose pas au clavier ;
- au clavier, **l'intention est déjà prouvée par le trajet** : il faut tabuler jusqu'à l'affordance,
  ou frapper une touche dédiée (`Échap`) qui n'a aucun voisin fonctionnel dans la scène. Il n'y a pas
  de « bord d'écran » où le doigt dérape ;
- et empiler une précision **temporelle** (2,0 s) sur une précision **spatiale** (la même cible) est
  **hostile aux lecteurs d'écran et aux troubles moteurs** : la fenêtre d'armement est invisible à
  l'oreille, et elle transforme une commande en épreuve de cadence. C'est une régression
  d'accessibilité payée pour un risque qui n'existe pas sur ce canal d'entrée.

**Canon amendé (§3, deux lignes, ancienne formulation barrée et non effacée) :**

| Canal d'entrée                                                         | Sortie anticipée                                                                                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pointeur** (tactile, souris)                                         | **DEUX appuis** — armement au 1ᵉʳ, sortie au 2ᵉ sur la même cible dans **2,0 s**, désarmement silencieux. Chrono non pausé. Inchangé (A17). |
| **Clavier** (`Échap`, et `Entrée`/`Espace` sur l'affordance focalisée) | **UN SEUL appui.** Pas d'armement, pas de fenêtre de 2,0 s, pas de second état à annoncer.                                                  |

**Ce que l'amendement NE couvre PAS — et je le nomme pour qu'on ne s'en réclame pas.** L'aggravant
trouvé par le panel — `EarlyExitButton` est le **premier élément focusable du DOM**, donc `Tab` +
`Entrée` termine la scène instantanément, avant même que le joueur l'ait jouée — **n'est couvert par
aucun argument d'accessibilité et n'est pas amendé**. C'est un défaut d'ordre de focus, corrigé par
la lane render comme tel (§6.3/§6.6 du journal de story). L'argument d'A17-bis dit « le trajet
clavier prouve l'intention » : il est **faux tant que le trajet est nul**. L'amendement et la
correction sont donc solidaires — l'un ne tient que si l'autre est fait.

**Conséquence aval :** l'`ux-designer` doit livrer les états armé/désarmé **pour le pointeur
seulement** (la ligne d'A17 « `Échap` en deux temps » de mon §11 de hand-off est caduque) ; la copie
de sortie de `narrative-designer` reste à **deux états** (repos / armé), l'état armé n'étant
simplement jamais atteint au clavier ; ADR-0082 enregistre l'asymétrie (`tech-writer` transcrit).

### R-4 — Reptation de révélation : « GARDE », donc on implémente

**Ce que Bertrand a tranché (2026-08-05).** Le panel a constaté que la reptation de révélation
**n'était pas implémentée** : `revealSeconds` était consommé comme temps mort, et à l'échec le
joueur fixait **4,8 s un visage faux sans jamais voir la bonne réponse**. `senior-architect` a posé
l'alternative sans échappatoire (§6.1 M6) : implémenter, ou **descoper par écrit**. Réponse de
Bertrand : **« GARDE ».**

**Inscrit : la reptation est IMPLÉMENTÉE. Aucun descope d'AC4.** La lane `dev-r3f-render`
l'implémente en parallèle de cette inscription. Motifs, pour que la décision soit relisible :

1. **C'est le sujet de la scène.** Un jeu de reconnaissance qui ne montre jamais ce qu'il fallait
   reconnaître n'enseigne rien. La boucle d'apprentissage est le seul contenu de la phase — la scène
   ne se rejoue jamais (A3, 1/run), donc la révélation est la **seule** occasion de la fermer.
2. **Guidelines §5, règle UX non-négociable n°4** — « chaque mort/échec : raison explicite
   affichée ». Un tampon `PRESQUE LUI` sur un visage faux nomme l'issue, il n'affiche pas la
   **raison**. La raison, ce sont les bandes fausses et leur variante juste.
3. **A15 en dépend** (voir la précision ajoutée à A15) : les 2,6 s ne se justifient que par leur
   contenu. Sans reptation, la bonne décision aurait été de couper la durée, pas de la garder — donc
   « ne pas implémenter » n'était jamais un statu quo neutre, c'était une troisième valeur de tuning
   non gatée.

**Cohérence §3 ↔ AC4 vérifiée au passage, et il y a un écart de LETTRE à signaler.** L'AC4 de la
story n'exige littéralement qu'« a plain-language outcome message names success or failure
explicitly (no silent state change) » — un tampon suffit à sa lettre. **L'obligation de reptation ne
vient donc pas d'AC4 mais de mon canon §3 + A15 + la règle 4 des guidelines.** Une lane qui ne lit
que la story pouvait de bonne foi se croire conforme : c'est précisément ce qui s'est produit. Je
ferme le trou en inscrivant la reptation **comme ligne du canon §3** (nouvelle ligne « Reptation de
révélation »), qui fait foi sur toute spec de lane. `pm` peut resserrer AC4 s'il le souhaite — ce
n'est plus bloquant, le canon suffit.

**Deux valeurs canoniques restent inchangées :** `revealSeconds` **2,6 / 1,4** et
`resultHoldSeconds` **2,2**. R-4 rend un contenu obligatoire, il ne re-tune rien.

### A17 — La sortie anticipée : ce que la ratification règle, et ce qu'elle me laissait

**Ce qui est acquis (R-1).** La sortie `Escape` / retour Android n'est plus un **abandon**, c'est le
geste **« j'ai fini, imprime »**. Elle résout à l'état courant, exactement comme le buzzer. Le
premier « désaccord maintenu » de Sacha (spec M, round 3, §Désaccords 1) **cesse d'être un
désaccord : il devient une décision**, et le temps mort qu'il documentait (jusqu'à 20 s de vide subi
par l'état modal de l'échec honnête) est **fermé**. Le livrable AC16 est **confirmé bloquant** :
affordance visible en permanence, ≥ 44×44 px, copie qui ne lit ni « valider » ni « abandonner »
(`ux-designer` pour l'affordance, `narrative-designer` pour la copie).

**Arbitrage 1 — cette sortie peut-elle produire `IDENTIFIED` ? NON, et la question est vide par
construction.** Je l'ai vérifiée au lieu de l'inventer :

- `IDENTIFIED` est évalué **sur événement d'entrée**, pas sur tick (A12bis) : dès que l'état devient
  4/4, la phase **est déjà terminée**.
- Il n'existe donc **aucun instant** où le joueur est à 4/4 et encore en `ACTIVE` — donc aucun
  instant où il pourrait presser la sortie en étant à 4/4.
- L'invariant `initialStateAllWrong` (A14) ferme le seul chemin restant (un 4/4 dès l'entrée).

**Conséquence :** mon §8/A12bis (« un abandon ne peut jamais verrouiller ») **tient sans
modification**, et il tient désormais pour une raison plus forte qu'avant — ce n'est plus une règle
de barème qu'on applique, c'est un **état inatteignable**. Aucune règle nouvelle n'est ajoutée : la
ligne « ne peut jamais produire `IDENTIFIED` » reste au canon §3 comme **assertion de régression**
(AC7-b), pas comme mécanisme. Un dev qui devrait écrire un `if` pour l'empêcher a un bug ailleurs.

**Arbitrage 2 — la confirmation est-elle conservée ? OUI, mais elle change de forme : deux appuis
sur la même cible, pas de modale.**

> **Amendé le 2026-08-05 par A17-bis (§9, deuxième vague) : tout cet arbitrage 2 ne vaut QUE pour le
> POINTEUR (tactile, souris). Au CLAVIER — `Échap` inclus — la sortie se fait en UN SEUL appui.**

L'asymétrie décide, et elle est brutale :

- coût d'un appui accidentel = **la scène entière**, définitivement (machine forward-only, **une
  occurrence par run**, elle ne se rejoue jamais — A3/§2.3). Le joueur perd le payoff, le score, et
  encaisse potentiellement le −20 d'énergie ;
- coût de la confirmation = **~1 s sur 35**, une fois par run.
- Et le risque de mistap n'est **pas** théorique depuis A4-bis : la cible vit sur un écran où le
  geste primaire est un **swipe/drag horizontal**, au milieu des bandes. Un swipe raté qui se
  résout en tap est le scénario nominal, pas le cas rare.

**Mais la modale est refusée** : elle masquerait la cible et les bandes au moment précis où le
joueur veut vérifier une dernière fois, et une modale à deux boutons **réintroduit un CTA** par la
fenêtre. Forme retenue, au canon §3 : **1ᵉʳ appui = armement** (la cible change d'état, la copie
devient explicite), **2ᵉ appui sur la même cible dans les 2,0 s = sortie**, désarmement silencieux
au-delà. **Le chrono ne se met pas en pause pendant l'armement** — sinon l'armement devient un
bouton « geler le temps pour réfléchir », et c'est un exploit gratuit.

**L'objection que je dois traiter moi-même, parce qu'elle est réelle :** « deux appuis pour
imprimer » ressemble au _double-tap pour imprimer_ que la spec M interdit en §7 3-bis. **Ce n'est
pas le même objet, et je fixe le critère qui les sépare** (canon §3) : _est interdit tout contrôle
dont l'activation peut produire `IDENTIFIED` ou évaluer une réussite._ La sortie anticipée ne le
peut pas — arbitrage 1 ci-dessus. **Le critère est la fonction, pas la forme du geste.** `pm` et
`ux-designer` s'en servent comme test : si un jour un contrôle proposé peut produire une réussite,
c'est un CTA, il tombe sous B1, quel que soit son libellé.

**Effet de bord nommé plutôt que subi : `PARTIAL` redevient partiellement soumettable.** A12bis
écrivait que le 3/4 était devenu « strictement moins farmable ». **C'est désormais faux au pied de
la lettre** et je le corrige ici au lieu de laisser deux textes se contredire : un joueur à 3/4
peut délibérément imprimer pour empocher +400 et +10 s. **Le barème ne bouge pas pour autant** —
400 contre 1500, et surtout le joueur **abandonne tout le temps restant** dans lequel il pouvait
atteindre 4/4. Se contenter d'un 3/4 est une stratégie **dominée**, pas un farm : elle échange une
chance réelle de 1500 contre 400 certains. Aucune contre-mesure. Position réévaluable au stage 5
**sur observation de playtest**, comme A16.

### A18 — Palier de mi-parcours : le plancher de Sacha est ACCORDÉ, avec sa constante dérivée

**Son argument, examiné sur le fond.** En `hard` (30 s), un mi-parcours strictement à 50 % tombe à
**15,0 s restants**, soit **5,0 s** avant le palier d'urgence (10,0 s). Deux cues KENZA à 5 s
d'intervalle ne se perçoivent pas comme deux paliers : ils fusionnent en rampe — ce que le choix
« paliers, pas crescendo » (§6 de la spec M) existe précisément pour éviter. Le chiffre est juste,
le diagnostic est juste, et il ne coûte **ni branche conditionnelle, ni valeur d'issue, ni
`timerSeconds`** : il déplace un palier de **copie seule**, et seulement en `hard`.

**ACCORDÉ.** Une correction : je refuse le littéral `17,0` comme constante libre — c'est un nombre
magique qui se désynchronisera le jour où le palier d'urgence bougera. La règle canonique est
**`max(timerSeconds / 2 ; PALIER_URGENCE + 7,0)` secondes restantes**, `PALIER_URGENCE = 10,0` ⇒
17,0 en `hard`, valeurs de Sacha à l'identique (28,0 / 17,5 / 17,0). La distance minimale de
**7,0 s** est le vrai objet de design : c'est le temps de **corriger réellement une bande**
(balayage des 6 variantes ≈ 1,5 s + comparaison), donc le palier de mi-parcours reste
**actionnable** au lieu d'être un constat. C'est cette phrase qui est opposable, pas le 17.

**Trou de bord fermé au passage** (il ne l'était dans aucune des deux versions) : si un
`timerSeconds` futur descendait sous ~24 s, le plancher dépasserait la durée de la scène et le cue
tomberait **à t = 0**. Règle : **si le mi-parcours calculé ≥ `timerSeconds`, il n'est pas joué du
tout.** Une scène assez courte n'a pas de milieu à annoncer.

Conséquence pour l'aval : l'AC13 de la spec M est **confirmé dans sa branche « plancher »** — la
valeur `hard` attendue est **17,0 s restants**, la mention « si `lead-game-designer` refuse, retour
à 15,0 » devient caduque et doit sauter.

### R-3 — Voie de production art : ratifiée, le risque est clos

« À la limite fais les visages en entier, et après découpe les bandes » = exactement la
recommandation `lead-art` §5 et la décision d'ADR-0080. **Ce n'est plus une question ouverte, c'est
un fait acquis.** Le risque « et si on générait bande par bande » (raccords multiplicatifs,
gabarits incohérents) est **clos définitivement** : la génération bande-par-bande n'est plus une
option à évaluer, et sa réouverture serait une escalade Bertrand, pas une décision de lane. La
**règle de raccord** et l'**atomicité du gabarit** demandées par `lead-art` restent opposables au
gate art — elles deviennent d'ailleurs faciles à tenir, puisqu'un seul visage entier par jeu de
variantes garantit le raccord par construction. Le **plafond 24 assets / 1 gabarit** (A5) est
inchangé.

### Ce que ces ratifications NE changent pas

**A1** (énergie seule, zéro vie), **A2** (interstitiel), **A3** (1/run), **A5** (4 bandes ·
6 variantes · 1 gabarit · composition des leurres), **A6** (vocabulaire), **A8**, **A10** (payoff
+20/+10/0 s), **A11** (le couperet), **A12** (gel du twist), **A12bis** (régime des issues),
**A14**, **A15**, **A16** : **intacts**. `timerSeconds`, les seuils 4/4 · 3/4 · ≤ 2/4, les deux
paliers absolus (10,0 / 5,0 s) et les trois barèmes d'issue **n'ont pas bougé d'une unité**.

**Ni la deuxième vague (A17-bis, R-4).** A17-bis ne touche **qu'un canal d'entrée** : la fonction de
la sortie anticipée est identique (résout à l'état courant, ne peut jamais produire `IDENTIFIED`,
chrono non pausé), le critère anti-CTA est inchangé, et le pointeur garde ses deux appuis. R-4 ne
change **aucune valeur** : `revealSeconds` 2,6 / 1,4 et `resultHoldSeconds` 2,2 sont ceux d'A15, et
le budget de scène reste 38,6 s à `IDENTIFIED` / 39,8 s ailleurs (A11 intact).

### Statut du dossier après ce §9

**Aucun désaccord de lane n'est plus ouvert.** Les deux réserves de Sacha (round 3) sont tranchées :
la première par ratification Bertrand + A17, la seconde par A18 en sa faveur. La §3 reste la seule
source de vérité de tuning ; le TECH PLAN travaille dessus.

**Mise à jour 2026-08-05 (post-panel).** Les deux inscriptions de la deuxième vague (**A17-bis**,
**R-4**) sont **actées** et le dossier reste clos : aucune valeur de tuning n'a bougé, aucun
désaccord de lane n'est rouvert. Les deux items du panel qui portaient mon nom (M5 en tant
qu'amendement, M6 en tant que décision) sont **levés côté design**. Restent des tâches de lane, pas
de gate : l'ordre de focus d'`EarlyExitButton` (`dev-r3f-render`, défaut), l'implémentation de la
reptation (`dev-r3f-render`, avec le hold de révélation remonté dans la scène pure — prescription
M7), l'affordance armé/désarmé pointeur-seulement (`ux-designer`) et la transcription en ADR-0082
(`tech-writer`).

---

## A19 — Les variantes d'une bande viennent du MÊME visage (Bertrand, 2026-08-09)

**Consigne, non négociable.** Les 10 variantes d'une bande doivent être 10 versions du **même
visage** — une coupe, un regard, un nez, une bouche déclinés sur une seule tête. Ce que la §3
appelait déjà « un gabarit », mais qui n'avait jamais été énoncé comme un critère de recette.

**Pourquoi c'est mécanique et pas cosmétique.** Assemblées, quatre bandes de quatre personnes
différentes ne lisent pas comme un visage : elles lisent comme une chimère, avec des ruptures de
carnation et de largeur à chaque couture. Le joueur n'apparie plus des traits, il repère la
discontinuité. C'est le même vice que les fonds non uniformes (voir plus bas) : la scène devient
soluble sans jamais regarder le visage.

**État réel au 2026-08-09, à ne pas maquiller.** Les 40 assets livrés (`86bbdeb5`) sont tirés de
**dix personnes différentes**, une par index de variante. C'est un pis-aller assumé, pas la cible :
Bertrand a constaté l'effet chimère de lui-même (« les modèles sont faits de visages différents,
c'est étrange »). La scène est jouable, elle n'est pas juste.

**Pourquoi ce n'est pas déjà fait.** La §5.2 prévoyait de dériver les 5 variantes d'une planche
validée par img2img (`kontext`), un descripteur nommé à la fois. Cette voie est **fermée** : le
paramètre `image=` de `image.pollinations.ai` est ignoré en silence sur le palier anonyme — avec et
sans référence, les images sortent identiques au pixel (meanAbsDiff 0,00). Tout script qui prétend
verrouiller un style par `imageUrl` ne verrouille rien.

**Les deux voies restantes**, à trancher par `lead-art` :

1. ~~**Graine constante, un descripteur changé.**~~ **MESURÉ ET RÉFUTÉ, 2026-08-09.** Six
   descripteurs de coupe incompatibles (`hair shaved at the sides and flat on top`, `hair combed
   straight back`, `a high round mass of curly hair`, `a blunt bowl cut`, `a bald front and a
   receding hairline`) sur la graine 4242, prompt identique au mot près par ailleurs : **les six
   images sont la même**. Écart moyen absolu à la référence : **0,00** pour trois d'entre elles,
   **1,30** pour les trois autres — soit du bruit de ré-encodage, pas une coiffure différente. Le
   descripteur n'a **aucun** effet ; l'identité ET la coiffure sont soudées à la graine.

   Corollaire à retenir, plus large que A19 : sur ce palier, **le prompt ne peut pas modifier un
   trait à identité constante**. Donc les 40 assets livrés ne sont pas réparables en régénérant
   avec de meilleurs mots — c'est un mur, pas un défaut de formulation.

2. **Une clé de compte** (`enter.pollinations.ai`), qui débloque le vrai catalogue de modèles et
   l'img2img, donc la dérivation prévue à l'origine. Demande une inscription côté Bertrand.
   **C'est désormais la SEULE voie connue** pour satisfaire A19.

**Critère de recette.** Une planche de contact des 10 variantes d'une même bande doit se lire comme
**une seule personne** qui change de coupe (ou de regard, de nez, de bouche). Le jugement est celui
de Bertrand : aucune métrique de ce dépôt ne mesure « est-ce la même personne », et prétendre le
contraire serait répéter l'erreur du tamis de frontalité, qui a laissé passer cinq crânes et une
pomme parce qu'il ne mesurait qu'une masse sombre symétrique.
