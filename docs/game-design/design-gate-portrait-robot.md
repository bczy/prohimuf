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

| #   | Deliverable                                     | Auteur                     | Verdict                    |
| --- | ----------------------------------------------- | -------------------------- | -------------------------- |
| M   | `docs/game-design/spec-portrait-robot.md`        | `game-designer` (Sacha)    | **RETOUR LANE** (round 1/2) |
| F   | `docs/game-design/spec-portrait-robot-fiction.md`| `narrative-designer` (Yasmine) | **PASS AVEC CONDITIONS** |
| UX  | `docs/game-design/ux/portrait-robot-ux.md`       | `ux-designer` (Tony)       | **PASS AVEC CONDITIONS**   |
| ART | `docs/art-direction/brief-portrait-robot.md`     | `lead-art` (Nico)          | *hors gate* — cohérence design↔art vérifiée, §5 |

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
   + le payoff **A10**.
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

**A1c — nouvelle règle, parce que les guidelines sont muettes.** La scène étant post-niveau (A2),
une sanction d'énergie appliquée « tout de suite » ne coûte rien (le niveau est fini) et un bonus
d'énergie serait mangé par le clamp à 100. **Règle proposée et appliquée ici :** une issue de scène
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
coût. `Escape` / retour Android ⇒ confirmation légère (garde UX §7 **conservée**), et l'abandon
confirmé **résout la scène à l'état courant**, exactement comme l'expiration du chrono (A7). Aucun
chemin de sortie ne produit un résultat non évalué.

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
+ **tap sur chevron** (variante ±1). Le **swipe horizontal est un raccourci optionnel** sur la
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

| Palier | t restant | Unités | Ce qui se passe |
| --- | --- | --- | --- |
| Mi-parcours | 17,5 s | 7 | `KENZA — « Ma carte descend. »` |
| Urgence | 10,0 s | 4 | `KENZA — « Grouille, il me reste rien. »` + 1ᵉʳ resserrement musical |
| Dernier | 5,0 s | 2 | `bip` + 2ᵉ resserrement + annonce `aria-live` |

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
2. **Elle a une conséquence** (A10). Une interlude sans conséquence *est* du remplissage, par
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

| Clé | Valeur canonique | Source / arbitrage |
| --- | --- | --- |
| `stripCount` | **4** — figé (`LA COUPE`, `LE REGARD`, `LE NEZ`, `LA BOUCHE`) | Bertrand · A6 |
| `variantsPerStrip` | **6** — plafond dur 6 | A5 |
| `faceTemplates` | **1** gabarit (24 assets de bande) | A5 · brief art §5.1 |
| Composition des leurres (V1) | 1 bonne + 2 classe forte + 3 classe moyenne + **0 classe 4** | A5 |
| `occurrences` | **1 par run**, sur déclencheur narratif | A3 · `pm` |
| Placement | **Interstitiel post-niveau**, `AppPhase` dédié `PORTRAIT_ROBOT` | A2 |
| Gel du monde | **Aucun** (pas de shell ADR-0030) | A2 |
| `timerSeconds` | **35** · `easy` **56** · `hard` **30** (`Prefs.difficulty`) | A7 |
| ~~Unité de chrono~~ | ~~**1 unité = 2,5 s** ⇒ 14 unités · paliers 7 / 4 / 2 unités~~ | ~~A7~~ — **supprimé par B2**, voir ci-dessous |
| Affichage du chrono | **Jauge continue** qui se vide, sans nombre à l'écran (ni unités, ni secondes). Habillage télécarte conservé | **B2 · A13** |
| Paliers de tension | **50 % de `timerSeconds`** (17,5 / 28,0 / 15,0 s restants selon difficulté) · **10,0 s restants** · **5,0 s restants** — les deux derniers en **secondes absolues, identiques dans les 3 difficultés** | **A13** (refonte de A7) |
| Chrono sous `RotateOverlay` | **Pause** | A7 |
| ~~`confirmGuardSeconds`~~ | ~~**1,0** (CTA inerte à l'entrée)~~ | ~~Sacha §4.1~~ — **supprimé par B1** (plus de CTA à garder) |
| `initialStateAllWrong` | **`true`** — invariant de seed : à l'entrée en `ACTIVE`, les 4 bandes affichent une variante **fausse** (0/4 garanti). Remplace la garde anti-validation accidentelle | **A14** (remplace `confirmGuardSeconds`) |
| `revealSeconds` | **2,6** à `PARTIAL`/`FAILED` (4×~0,45 s + 0,8 s de tenue — la reptation porte les corrections) · **1,4** à `IDENTIFIED` (flash de verrouillage + 4 tampons simultanés, pas de reptation) | **A15** (amende Sacha §4.1) |
| `resultHoldSeconds` | **2,2** (`QTE_RESULT_HOLD`) — inchangé, toutes issues | Sacha §4.1, ratifié |
| `identifiedThreshold` | **4/4** — **évalué en continu, verrouillage automatique et immédiat** dès que l'état courant est 4/4 | **A12bis** (amende Sacha §4.2) |
| `partialThreshold` | **3/4 — atteignable UNIQUEMENT au buzzer ou à l'abandon.** Il n'existe plus d'acte de soumission volontaire | **A12bis** (amende A9) |
| `failedThreshold` | **≤ 2/4** au buzzer ou à l'abandon | Sacha §4.2, ratifié |
| Ordre de résolution (anti-issue-fantôme) | Le test 4/4 se fait **à chaque changement d'état de bande**, avant tout tick de chrono ; l'expiration n'est évaluée **que si aucun verrouillage n'a eu lieu**. Un 4/4 posé dans la même frame que l'expiration ⇒ **`IDENTIFIED`** | **A12bis** |
| Timeout / abandon | **Évalué à l'état courant** — aucun échec sec. Ne peut **jamais** produire `IDENTIFIED` (un 4/4 se serait déjà verrouillé) ⇒ issues possibles : `PARTIAL` ou `FAILED` | A2 · **A12bis** |
| `IDENTIFIED` | **0 vie · 0 énergie · +1500 score · payoff +20 s** | A1 · A10 |
| `PARTIAL` | **0 vie · 0 énergie · +400 score · payoff +10 s** | A1 · A10 |
| `FAILED` | **0 vie · −20 énergie initiale du niveau suivant · 0 score · beat obligatoire** | A1 · A1b |
| Perte de vie | **INTERDITE** sur cette scène, toutes issues confondues | A1 · story AC5 |
| Feedback pendant `ACTIVE` | ~~**Zéro**, sous toute forme~~ → **Aucun feedback par trait, sous aucune forme. UN seul signal, global, binaire et terminal : le verrouillage.** Il ne commente pas, il termine | **A16** (amende A9) |
| Cible | **Visible en permanence** · médaillon ≥ **28 %** de largeur en mobile paysage | A8 |
| Geste primaire tactile | **swipe horizontal sur la bande visée** = variante ±1 sur CETTE bande. Pas de tap de sélection, pas de bande « active » au doigt. Chevrons ◀ ▶ conservés en affordance + cible d'accessibilité (≥ 44×44 px), jamais comme geste primaire | **A4-bis · Bertrand 2026-08-05** (renverse A4) |
| Geste primaire desktop | ~~à trancher sur maquette Figma~~ → **OPTION B : drag horizontal à la souris sur la bande visée** = variante ±1 sur CETTE bande. Même modèle mental que le swipe tactile, un seul geste à documenter pour les deux classes d'appareil. Clic sur chevron conservé en affordance + cible d'accessibilité | **B3 · Bertrand 2026-08-05** |
| Geste clavier | ↑↓ = bande · ←→ = variante · ~~Entrée = CTA~~ (plus de CTA) · Échap = confirmation d'abandon | A2 · UX §2.1 · **B1** |
| Bandeau / ~~CTA~~ | **`TÊTE À CONNAÎTRE`** / ~~**`SORTIR LA TÊTE`**~~ — **le CTA n'existe plus dans l'IHM** (B1). La réplique KENZA « Sors-moi une tête, une seule » reste au dialogue | A6 · **B1** |
| Déterminisme | Fonction pure hachée de `portraitSeed` · zéro `Math.random` / `Date.now` | ADR-0034 · Sacha §0 |

---

## 4. Ce qui est COUPÉ

| Coupé | Auteur | Motif |
| --- | --- | --- |
| **−0,5 cœur** (et toute perte de vie) | M §4.3 | Contredit story AC5 · A1 |
| **+25 énergie** à `IDENTIFIED` | M §4.3 | Inopérant (clamp à 100) après A1c |
| **Gel du monde / shell ADR-0030** | M §2.1 | Placement interstitiel · A2 |
| **Table de progression #1/#2/#3+** | M §3 D3 | Une seule occurrence par run · A3 (gardée en note post-V1) |
| **8 variantes par bande** | M §3/§4.1 | Budget art · A5 |
| **Mini-crop de comparaison locale** | UX D4.2 | Attaque le verbe de la scène + coût · A8 |
| **Verrouillage indicatif de bande** | UX §0/D0 | État superflu, problème déjà supprimé par le layout · A8 |
| Libellés `CHEVEUX/YEUX/…` en surface joueur | UX §1 | Vocabulaire canon · A6 |
| Bandeau « PORTRAIT-ROBOT » / « dossier suspect » | UX §1/§6 | Registre interdit · A6 |
| **Bandes qui défilent à figer** | option B, M §1 | Close définitivement · A4 |
| Nom propre pour « le type de la porte » | F Q4 | Recommandation de Yasmine ratifiée — il reste anonyme |
| Twist « ton propre portrait-robot » | F §2.1 | **Gelé**, pas coupé · A12 |
| **CTA `SORTIR LA TÊTE`** (le bouton, la chaîne, sa zone d'écran, son focus, `Entrée`) | M §R5/§4.1, UX §1/§2.1/§5, F §4.9 | **Bertrand B1** — la validation est automatique · A12bis |
| **`confirmGuardSeconds` 1,0 s** | M §4.1 | Gardait un CTA qui n'existe plus · **B1**. Remplacé par l'invariant `initialStateAllWrong` · A14 |
| **Compte d'unités télécarte (14 unités, 1 unité = 2,5 s)** et **paliers 7/4/2 unités** | A7, M §4.1/§6/AC13, F §4.5, UX §1.1 | **Bertrand B2** — essais illimités dans un temps imparti, plus de décompte d'essais ni d'unités · A13 |
| **Libellé `TÉLÉCARTE · {n} UNITÉS`** (et son repli `{n} UNITÉS`) | F §4.5/§4.9, UX §1.1 | Il n'y a plus d'unités à afficher. Jauge continue · A13. Copie de remplacement due par `narrative-designer` |
| **Soumission volontaire d'un 3/4** | A9 | Sans CTA, on ne peut plus soumettre. `PARTIAL` n'existe plus qu'au buzzer · A12bis |
| **Reptation de révélation à `IDENTIFIED`** (4×0,45 s) | M §4.1 | Zéro information à délivrer après un verrouillage 4/4 · A15 (2,6 s → 1,4 s). Conservée intégralement à `PARTIAL`/`FAILED` |

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
4. **A1c est une règle neuve.** Les guidelines ne disent rien du destin de l'énergie **entre** deux
   niveaux. J'ai posé : une scène interstitielle modifie le capital initial du niveau suivant,
   jamais l'énergie du niveau écoulé. À intégrer aux guidelines si tu la valides — elle servira à
   toute scène interstitielle future.
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

| #      | Verbatim                                                                                                                     | Ce qu'il renverse                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
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
un sens **informatif** après une soumission — elle disait *quels* traits étaient faux et les
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

### A16 — A9 tient, mais sa formulation change (et c'est le vrai sujet)

**A9 ne tient pas tel quel** : « zéro feedback, sous toute forme » est devenu factuellement faux, le
verrouillage **est** un feedback, et c'est le seul. Prétendre le contraire serait une table qui ment.

**Nouvelle formulation canonique :** *aucun feedback par trait, sous aucune forme ; UN seul signal,
global, binaire et terminal — le verrouillage. Il ne commente pas, il termine.*

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

| Palier       | Déclencheur                              | `normal` (35 s) | `easy` (56 s) | `hard` (30 s) | Ce qui se passe                                                        |
| ------------ | ---------------------------------------- | --------------- | ------------- | ------------- | ---------------------------------------------------------------------- |
| Mi-parcours  | **50 % de `timerSeconds` écoulés**       | 17,5 s restants | 28,0 s        | 15,0 s        | `KENZA — « Ma carte descend. »` (copie seule)                          |
| Urgence      | **10,0 s restants** (valeur absolue)     | 10,0 s          | 10,0 s        | 10,0 s        | `KENZA — « Grouille, il me reste rien. »` + 1ᵉʳ resserrement musical   |
| Dernier      | **5,0 s restants** (valeur absolue)      | 5,0 s           | 5,0 s         | 5,0 s         | `bip` + 2ᵉ resserrement + annonce `aria-live`                          |

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
