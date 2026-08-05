# PORTRAIT-ROBOT — fiction spec (« TÊTE À CONNAÎTRE »)

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **ROUND 3 — sortie anticipée re-signifiée** · **Date:** 2026-08-05

---

## 0. Journal de révision

**Round 3 (2026-08-05)** — entrée : problème de design ratifié par Bertrand — le joueur à 3/4 qui se
croit fini n'a plus aucun geste ; la **sortie anticipée** (`Escape` / retour Android) devient une
affordance permanente et **change de sens** : elle ne dit plus « j'abandonne », elle dit « c'est
parti comme ça ». Pas de bouton de validation réintroduit.

| #   | Origine        | Ce que j'ai fait                                                                                                                                  |
| --- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| R10 | Sortie re-signifiée | **§6.2 neuve** — libellé permanent `ÇA PART COMME ÇA`, deux variantes (immédiate / confirmée), ligne de sortie KENZA `Bon. On imprime ce qu'on a.` |
| R11 | Cohérence      | `Tu raccroches ?` / `JE RACCROCHE` **retirés** de l'IHM (§6.1 mis à jour, §4.9 note d'abandon réécrite). Non recyclés de force ; parqués en §6.2 pour un éventuel vrai quit-to-menu. |
| R12 | Interdit lexical | **Verdict rendu sur `imprimer`** — §4.11 amendée : autorisé à l'**impersonnel** uniquement, interdit à l'impératif 2ᵉ personne. La règle opposable est durcie, pas assouplie. |

**Round 2 (2026-08-05)** — entrée : `docs/game-design/design-gate-portrait-robot.md` §7 (4 conditions),
§8 (amendements B1/B2/B3, A12bis→A16), §3 (valeurs canoniques). La §3 du gate prime sur toute valeur
de cette spec.

| #   | Origine                    | Ce que j'ai fait                                                                                                                                                                            |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Condition 1 (annulée par B2) | La conversion 14 unités est **morte** avant que je l'écrive. §4.5 refaite : jauge continue, plus un seul nombre à l'écran, paliers **nommés** (MI-PARCOURS / URGENCE / DERNIER) au lieu de chiffrés par moi. |
| R2  | Condition 2               | **`PARTIAL` écrit** — nouveau §4.7, tampon `PRESQUE LUI` + KENZA/DISPATCH/MUF. Cadré comme palier **subi** (A12bis) : on ne se contente pas d'un 3/4, on n'a pas fini. |
| R3  | Condition 3               | **Rappels du niveau suivant écrits** — nouveau §5.3, deux scènes courtes, `IDENTIFIED` et `FAILED`. Obligatoires, pas décoratifs (A1b/A10). Un troisième cas `PARTIAL` ajouté par nécessité (il existe, il ne peut pas être muet). |
| R4  | Condition 4               | **Passe de conformité IHM** — nouveau §6.1 : chaque chaîne d'écran de l'UX passée contre ma liste d'interdits. Message d'abandon réécrit. |
| R5  | **B1** (CTA supprimé)     | `SORTIR LA TÊTE` **abandonné comme libellé**, recyclé nulle part de force. **Balayage de toute la spec fait** (§4.2, §4.4, §4.9, §5) : plus une seule ligne ne présuppose un geste de validation. Détail du balayage en §4.11. |
| R6  | **B1 / A16**              | **Nouveau beat : LE VERROUILLAGE** — §4.6. C'est le seul feedback de la scène, il lui fallait sa ligne. |
| R7  | **A14** (`initialStateAllWrong`) | La tête absurde du premier écran est **mise en scène**, pas subie — §4.0. |
| R8  | **A15**                   | Les textes de révélation sont désormais **calés sur deux durées** (1,4 s à `IDENTIFIED`, 2,6 s ailleurs) : contrainte de lecture inscrite en §4.6/§4.7/§4.8. |
| R9  | A12 · Q1→Q4               | Questions fermées par le gate — §7 réécrite en « ce qui est tranché » + les seules questions encore ouvertes.                                                                                |

**Ce que j'abandonne officiellement :** `SORTIR LA TÊTE` comme chaîne d'IHM. Elle ne devient pas un
autre bouton, pas un titre, pas une ligne de verrouillage. Elle survit **là où elle est née** — dans
la bouche de KENZA au §4.1, réplique 4. C'était une réplique avant d'être un bouton ; elle redevient
ce qu'elle était. Une scène qui n'a plus de bouton n'a pas besoin qu'on lui en écrive le fantôme.
**Entrées :** `docs/research/research-photofit-robocop-atari-st.md` (recon, §5 rôle narratif),
`docs/game-design/spec-boss-encounter-fiction.md`, `spec-boss-belliard-fiction.md`,
`spec-niveau-final-fiction.md`, `pregame-copy-deck.md`, `tutorial-script-visual-gestures.md`,
`_bmad-output/guidelines/PROJECT_GUIDELINES.md` §7.

Voice baseline = le registre **shippé** dans `src/game/systems/narrativeSystem.ts` (DISPATCH sec
et impératif, KENZA de terrain, MUF laconique). Période **1998 Paris, circuit free-party** —
francs, télécartes, `08 36`, répondeurs ; zéro vocabulaire post-2000. Textes joueur en **français**,
notes en anglais. Aucun code ici : `game-designer` (Sacha) écrit la mécanique en parallèle,
`dev-gameplay` transcrit.

---

## 1. Pitch en 5 lignes

Après une teuf, KENZA appelle Muf d'une cabine : un type qu'elle n'avait jamais vu tournait à la
porte, il a compté les entrées, il est reparti sans danser. Trois personnes l'ont vu, trois
descriptions qui ne collent pas. Sur le comptoir de la cabine, Muf a la planche de gueules
photocopiée du fanzine — quatre bandes découpées — et le temps que dure sa télécarte pour en sortir
**une seule tête**. Réussi : la tête part au tirage du prochain numéro, et la porte suivante ne
s'ouvre pas pour lui. Raté : le fanzine imprime la mauvaise gueule, un habitué se fait refuser à
l'entrée, et l'homme, lui, entre.

---

## 2. Justification d'univers — pourquoi ce geste est le nôtre

**Le geste n'est pas « identifier un suspect », c'est « prévenir le réseau ».** La différence n'est
pas cosmétique : elle décide qui est protégé.

- Un commissariat fabrique un portrait-robot pour **ouvrir un dossier** et aller chercher quelqu'un.
  Le fanzine en fabrique un pour **fermer une porte** — il ne poursuit personne, il ne dénonce à
  personne, il n'a aucune autorité au-delà de son propre seuil. C'est de la **défense de milieu**,
  la même famille de gestes que « pas de logo, pas d'adresse, RV sur l'info-line ».
- Le circuit free-party de 1998 fonctionne **exactement comme ça** : pas de fichier, pas de base de
  données, des visages qui se passent de bouche à oreille et, à l'occasion, une page photocopiée qui
  circule main à main. Le média est déjà canon dans muf — le zine `UNDERGROUND PARIS`, tiré à 23
  exemplaires, « ne se vend pas, ne se jette pas, se passe » (copy-deck §4.1). La planche de gueules
  est **une page de ce zine**, pas un kit de police.
- La cible est déjà scopée : **les RG en civil**, §7 des guidelines — « micro-tells visuels,
  détectables à l'œil, pas de jauge ». Le portrait-robot est la version **écran** de cette promesse :
  on ne te donne pas un radar, on te donne une gueule à retenir. Zéro nouvelle faction ; on branche
  sur ce qui existe, et sur le nœud BAC×RG déjà ratifié autour du Commandant
  (`spec-boss-encounter-fiction.md` §1.2).
- L'objet est **contradictoire par nature** : trois témoins, trois versions. Le joueur n'établit pas
  une vérité, il **tranche entre des souvenirs**. C'est la posture inverse du flic (qui compare à une
  photo) — et ça justifie mécaniquement l'absence de feedback par trait relevée dans la recon (§3).

> **Écart assumé avec RoboCop.** Chez Ocean, la réussite ouvre le dossier du suspect ; c'est un
> geste d'institution. Ici la réussite ouvre **un numéro du fanzine**. Structure identique
> (4 bandes, chrono, verdict global), intention retournée.

### 2.1 Pourquoi les autres pistes perdent

| Piste                                    | Pourquoi je la refuse                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Reconnaître un indic dans le réseau**  | C'est le geste le plus toxique du lot : le joueur désigne **un des siens** sur des rumeurs. Un portrait-robot d'indic, c'est une chasse aux sorcières — le milieu qui s'auto-flique. Ça salit Muf pour rien et ça donne au joueur un pouvoir qu'aucun personnage du zine ne devrait avoir. **Gardé comme thème** (l'indic reste §7), jamais comme mini-jeu. |
| **Un type recherché _par_ le milieu (dette, arnaque)** | Fonctionne moralement, mais fait de Muf le bras d'un recouvrement. On glisse vers le film de gangsters : muf n'a pas de milieu à dettes, il a un réseau de sons. Et la récompense (« on va le retrouver ») est une menace, pas une protection. Hors ton. |
| **Voir se construire son PROPRE portrait-robot** | La meilleure idée du lot — et la pire à cet endroit. Elle est superbe **une fois**, elle est un **twist**, et un twist n'est pas une boucle : le joueur n'a rien à décider, il regarde. Elle appartient au **Niveau Final** (l'étau qui se referme), pas à une mécanique répétable. **Réservée, non dépensée ici** — voir §7 Q3. |
| **Identifier le flic en civil vu à la sortie** | C'est celle que je retiens — mais **recentrée** : le livrable n'est pas « on a identifié un flic », c'est « la porte suivante le reconnaîtra ». Le mot _identifier_ est justement celui que je bannis (§6). |

---

## 3. Le personnage qui porte la scène — KENZA

**KENZA**, du cast shippé. C'est déjà la voix du terrain et des lieux (`stalingrad_pre` : « Fais
gaffe aux RG. Ils ont des planques là-dedans depuis '95 » ; `vitry_pre` : « les barres ont des yeux
partout »). Elle **était à la porte** : elle encaisse, elle compte, elle voit passer tout le monde.
Personne d'autre du cast n'a de raison d'avoir vu ce type.

| Champ                | Contenu                                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rôle dans la scène** | Elle appelle, elle décrit, elle presse. Elle ne valide rien : elle n'a pas vu assez bien, c'est précisément le problème.                                                            |
| **Ce qu'elle sait**  | Ce que trois personnes lui ont dit, et ça ne colle pas. Elle donne les contradictions telles quelles, sans les résoudre — c'est le joueur qui tranche.                              |
| **Comment elle parle** | Phrases courtes, concrètes, jamais de jargon. Elle décrit des **impressions**, pas des signalements : « une coupe de mec qui va au boulot », pas « cheveux châtains mi-longs ».     |
| **Ce qu'elle ne fait jamais** | Elle ne dit pas « suspect », « signalement », « fiche ». Elle ne demande pas qu'on aille chercher le type. Elle veut juste que la porte suivante sache.                     |
| **DISPATCH**         | Encadre : ouvre (pourquoi maintenant) et referme (ce qu'on en fait). Une ligne chacun, pas plus. Il ne participe pas au montage.                                                    |
| **MUF**              | Deux mots, à plat. Il assemble, il ne commente pas.                                                                                                                                |

Où : une cabine, après la teuf. La **télécarte** est le chrono (§4.5) — l'objet, pas une pendule.

---

## 4. Textes in-game (prêts à implémenter)

Toutes les longueurs sont des **plafonds** pensés pour un écran lisible en **paysage mobile**.
`game-designer` possède les slots ; si un slot est plus étroit, les replis sont donnés en §4.9.

### 4.1 Entrée — titre & accroche (scène courte type `NarrativeLine`, 4 répliques max)

| #   | speaker  | text (FR)                                                    | image (sprite shippé)      | imageAlt                  | Max     |
| --- | -------- | ------------------------------------------------------------ | -------------------------- | ------------------------- | ------- |
| 1   | KENZA    | `Y'avait un mec à la porte. Il a compté les entrées.`        | —                          | —                         | 52 car. |
| 2   | KENZA    | `Il a pas dansé. Il est reparti à pied, seul.`               | —                          | —                         | 46 car. |
| 3   | MUF      | `Il ressemblait à quoi ?`                                    | `assets/courier/rider.png` | `Muf, le coursier à moto` | 30 car. |
| 4   | KENZA    | `À trois trucs différents. Sors-moi une tête, une seule.`    | —                          | —                         | 56 car. |

**Titre d'écran (bandeau du mini-jeu) :** `TÊTE À CONNAÎTRE` — **18 car.**
**Sur-titre / rubrique zine :** `UNDERGROUND PARIS · PAGE 23` — **28 car.**
**Accroche sous le titre :** `trois versions, une seule gueule` — **34 car.**

### 4.0 Le premier écran — la tête qui ne ressemble à personne (A14)

**Fait de mise en scène, pas accident technique.** L'invariant `initialStateAllWrong` garantit que la
scène s'ouvre sur **quatre traits faux** : une gueule assemblée au hasard, qui ne ressemble à rien ni
à personne. C'est le meilleur cadeau que la mécanique fait à la fiction, et je le prends.

**Ce que ça dit, et que je veux qu'on entende :** un portrait-robot vide ressemble à **tout le
monde**. C'est exactement la thèse morale de la scène (§6) — une tête approximative met un innocent
dehors. Le joueur voit le danger avant de jouer, sur son propre écran, sans qu'on le lui explique.

**Une ligne, KENZA, à l'apparition du montage (avant la consigne §4.2) :**

| Slot                     | Copy (FR)                                | Max     |
| ------------------------ | ---------------------------------------- | ------- |
| Ligne d'ouverture montage | `Ça, c'est personne. Commence par la coupe.` | **44 car.** |

_Elle commente la tête absurde **et** amorce le geste dans la même respiration — pas de ligne
gratuite. `la coupe` reprend le libellé canon `LA COUPE` (§4.3) : la première bande est nommée par
KENZA avant d'être lue dans l'IHM._

**Repli (slot étroit) :** `Ça, c'est personne.` — **20 car.**
**Interdit ici :** toute formulation qui note l'état (« 0 sur 4 », « rien de juste ») — ce serait du
feedback par trait déguisé, interdit par A16.

### 4.2 La consigne (apprend la mécanique sans tuto plaqué)

Une seule ligne, dans la voix de KENZA, placée sous le titre au premier affichage :

- `Fais glisser les bandes. Arrête-toi quand ça te parle.` — **54 car.**

Elle nomme le geste canonique — **swipe/drag horizontal sur la bande** (A4-bis, B3), les quatre
indépendamment — **sans nommer un seul verbe d'interface**. Repli si le slot est court :
`Fais glisser les bandes. Arrête-toi.` (**37 car.**)

> **R5 — réécrite pour B1.** L'ancienne version disait « Change de bande, fais défiler, arrête-toi
> quand ça te parle » : elle décrivait la sélection-puis-action que A4-bis supprime. Et surtout,
> « arrête-toi » y sonnait comme **l'annonce d'un dernier geste à poser** — un pas de plus vers un
> bouton. Ici, « arrête-toi quand ça te parle » est la **fin de l'effort**, pas un envoi : le joueur
> pose la bonne bande, la scène fait le reste.

**Ligne d'ambiance, affichée une fois au démarrage (facultative) :**

- `Personne te dira si c'est bon. C'est ton œil.` — **46 car.**
  _Elle installe diégétiquement « aucun feedback par trait » (A16) : ce n'est pas une lacune du jeu,
  c'est la condition du souvenir. **Elle reste exacte après B1** — personne ne te dit si c'est bon ;
  la scène s'arrête quand ça l'est. Karim le note lui-même en A16. Zéro retouche._

### 4.3 Les 4 bandes — libellés

Mots de rue, pas de jargon d'IHM. Chaque libellé est accompagné du **souvenir** de KENZA, qui est la
seule aide que le joueur reçoit — et qui doit rester **partiellement contradictoire**.

| Bande       | Libellé (FR) | Max     | Souvenir KENZA (sous-titre de bande)         | Max     |
| ----------- | ------------ | ------- | -------------------------------------------- | ------- |
| Cheveux     | `LA COUPE`   | 12 car. | `coiffé comme un type qui bosse en semaine`  | 44 car. |
| Yeux        | `LE REGARD`  | 12 car. | `il regardait pas les gens, il les comptait` | 44 car. |
| Nez         | `LE NEZ`     | 12 car. | `là-dessus personne est d'accord`            | 44 car. |
| Bouche      | `LA BOUCHE`  | 12 car. | `il a pas souri de la nuit`                  | 44 car. |

_Note : `LE REGARD` plutôt que « les yeux » — on assemble un souvenir, pas une anatomie. `LE NEZ`
reste nu exprès : c'est la bande sur laquelle les témoins se contredisent, son sous-titre le dit._

### 4.4 Micro-copie de manipulation (si un slot d'aide existe)

- Aide variante, par bande : `{n} sur {total}` — **12 car.**
  _Chiffres seulement, **lisibilité d'état, pas feedback** (A8) : il dit « tu as tout vu », jamais
  « c'est bon ». Aucun libellé de touche : la lane contrôles/UX possède ça._

> **R5 — supprimé :** `bande {n}/4`. Il n'y a plus de « bande active » au doigt (A4-bis) ; les quatre
> bandes se manipulent directement et indépendamment. Le compteur d'accessibilité au clavier, lui,
> appartient à l'UX (`aria`), pas au copy-deck joueur.

### 4.5 Le chrono qui presse — la télécarte (refonte B2/A13)

**L'habillage télécarte survit — comme objet, pas comme compteur.** C'est même plus juste qu'avant :
une télécarte de cabine ne s'égrène pas par bips comptables sous tes yeux, **elle se vide**. Tu ne
sais jamais combien il te reste, tu sais que ça descend. La jauge continue d'A13 est littéralement la
carte magnétique qui fond dans l'appareil pendant que tu parles — et le joueur de 1998 le sait dans
son corps.

**Nouvelle chaîne permanente — remplace `TÉLÉCARTE · {n} UNITÉS` (mort, B2) :**

| Slot                        | Copy (FR)     | Max         | Note                                                       |
| --------------------------- | ------------- | ----------- | ---------------------------------------------------------- |
| Libellé de jauge, permanent | `TÉLÉCARTE`   | **9 car.**  | Le mot seul, collé à la jauge qui se vide. **Aucun nombre.** |
| Repli (slot très étroit)    | `CARTE`       | **5 car.**  | Ne jamais tomber sur un pictogramme muet : le mot porte l'époque. |

**Contrainte de longueur :** plafond dur **9 car.** — c'est un mot d'étiquette, pas une phrase. Il
n'est **jamais** suivi d'un séparateur ni d'une valeur : `TÉLÉCARTE · …` est interdit sous toutes ses
formes, c'est ce qui a tué l'ancienne chaîne. Interdits reconduits : `temps restant`, `{n} s`,
`{n} unités`, tout chiffre décroissant à l'écran (A6, A13).

**Les répliques de palier — recalées sur les paliers NOMMÉS, pas sur mes chiffres.**
Les valeurs (50 % de `timerSeconds` · 10,0 s · 5,0 s) appartiennent à `game-designer` et au gate §3 :
je n'en écris aucune. J'écris **pour trois paliers nommés**, et si Sacha en déplace la valeur, ma
copie ne bouge pas d'une lettre.

| Palier (nom canonique) | Copy (FR)                                 | Max     | Registre                                       |
| ---------------------- | ----------------------------------------- | ------- | ---------------------------------------------- |
| **MI-PARCOURS**        | `KENZA — « Ma carte descend. »`            | 28 car. | Constat. Elle informe, elle ne presse pas encore. |
| **URGENCE**            | `KENZA — « Grouille, il me reste rien. »`  | 42 car. | Elle presse. C'est **elle** qui paie l'appel.  |
| **DERNIER**            | `bip`                                     | 6 car.  | Plus de mots. L'appareil parle à sa place.     |

_Pourquoi ces trois-là tiennent après B2 :_ aucune ne mentionnait un nombre d'unités — elles disaient
déjà **la descente**, pas le décompte. « Ma carte descend » est exactement une jauge continue en
français parlé. C'est le seul endroit de la spec que l'arbitrage n'a pas entamé.

_Le mot `bip` en bas de casse est un son imprimé, pas un message système : le zine écrit ce qu'on
entend. Si la lane audio préfère un vrai bip, le texte disparaît sans rien casser._

**Coordination `game-designer` :** je consomme trois paliers nommés, dans cet ordre, une seule fois
chacun, non répétés. Si la table de paliers en gagne un quatrième, il me revient — je ne laisse pas
un palier muet.

### 4.6 LE VERROUILLAGE — la tête se fige toute seule

**C'est le beat de la scène.** Il n'y a plus de bouton : quand les quatre bandes tombent juste, le
montage **se verrouille de lui-même**, immédiatement (A12bis). Le joueur ne décide pas de la fin — il
la déclenche sans le savoir, en posant la bonne bande. Une fraction de seconde plus tôt il cherchait
encore ; maintenant il regarde une gueule qui le regarde.

**Ce que je refuse d'en faire :** un « CORRECT », un « VALIDÉ », un jingle, un compteur qui saute à
4/4. Ce serait la machine qui félicite. Ici ce n'est pas le jeu qui reconnaît le type — **c'est
KENZA**. Le verrouillage est un moment de **reconnaissance humaine**, pas de validation système. Et
il tombe **sans** qu'on ait eu à dire « c'est lui » : les trois souvenirs contradictoires viennent de
se refermer sur une seule tête.

**La ligne de verrouillage — elle joue AU moment du gel, avant le tampon `C'EST LUI` (§4.7) :**

| Slot                       | Copy (FR)                | Max         |
| -------------------------- | ------------------------ | ----------- |
| **Ligne de verrouillage**  | `Là. Bouge plus.`        | **16 car.** |

**Speaker : KENZA.** Sans image (comme le monologue Vitry shippé).

_Pourquoi celle-là._ Deux mots, deux temps. `Là.` — c'est le doigt qui se pose, la reconnaissance qui
tombe d'un coup, l'interjection de quelqu'un qui vient de revoir un visage, pas de quelqu'un qui
valide un formulaire. `Bouge plus.` — c'est **l'ordre à Muf** (arrête, n'y touche plus) **et la
description de ce qui vient de se passer à l'écran** (le montage s'est figé) dans les mêmes deux
mots. La ligne **est** le verrouillage ; elle ne le commente pas. Aucun mot de la liste noire §6 :
pas de « c'est lui » (le tampon le dira, 1,4 s plus tard, et c'est son travail à lui), pas de
certitude — KENZA reconnaît, elle ne prouve pas.

**Contraintes d'implémentation (A15) :** la ligne doit être **lue en moins de 1,4 s** — d'où les
16 car. C'est le plafond le plus dur de la spec et il n'est pas négociable à la hausse : au-delà,
elle empiète sur `revealSeconds` à `IDENTIFIED` (flash + 4 tampons simultanés, pas de reptation) et
le meilleur moment du jeu devient un mur de texte.

**Repli (aucun slot dédié disponible) :** la ligne est **fusionnable en tête de la ligne KENZA de
§4.7** — `Là. Bouge plus. C'est cette gueule-là.` (**39 car.**) — mais c'est un repli, pas
l'intention : séparée, elle porte le gel ; fusionnée, elle n'est qu'un début de phrase.

**Interdit :** rejouer cette ligne à `PARTIAL`/`FAILED`. Il n'y a pas de verrouillage sans 4/4 — le
buzzer n'est pas un verrouillage, c'est une carte morte (§4.8).

### 4.7 `IDENTIFIED` — la tête est sortie (4/4)

Joué **après** la ligne de verrouillage §4.6, sur `revealSeconds` **1,4 s** (flash + 4 tampons
simultanés) puis `resultHoldSeconds` 2,2 s.

| Slot              | Copy (FR)                                                | Max     |
| ----------------- | -------------------------------------------------------- | ------- |
| Tampon d'écran    | `C'EST LUI`                                              | 12 car. |
| Ligne KENZA       | `C'est cette gueule-là. Je la sortirai plus.`            | 44 car. |
| Ligne DISPATCH    | `Page 23 du prochain numéro. Toutes les portes l'auront.` | 56 car. |
| Ligne MUF (clôture) | `Il rentrera nulle part.`                                | 26 car. |

> **R5/R8 — retouche :** l'ancienne ligne KENZA commençait par `Voilà.` — un mot de **validation
> accomplie**, écrit du temps où le joueur appuyait sur un bouton. Coupé : `Là.` est passé au
> verrouillage (§4.6), où il fait un vrai travail, et le doubler ici l'userait. 52 → 44 car., ce qui
> soulage aussi la lecture sur 2,2 s de hold.

### 4.8 `PARTIAL` — trois sur quatre, au buzzer (condition 2 du gate)

**Ce palier ne se choisit pas, il se subit** (A12bis) : sans acte de soumission, on ne « se contente »
plus d'un 3/4 pour empocher 400 points — **on n'a pas eu le temps de finir**. La copie doit donc
sonner comme une **interruption**, jamais comme un demi-succès accepté.

Et la non-négociable §5 règle 4 (« chaque échec, raison affichée ») est tenue **deux fois** : la
reptation de révélation (2,6 s) corrige la bande fausse sous les yeux du joueur, et KENZA nomme le
manque en toutes lettres.

| Slot              | Copy (FR)                                              | Max     |
| ----------------- | ------------------------------------------------------ | ------- |
| Tampon d'écran    | `PRESQUE LUI`                                          | 14 car. |
| Ligne KENZA       | `Trois sur quatre. C'est presque une gueule.`          | 44 car. |
| Ligne DISPATCH    | `Page 23 quand même. Les portes hésiteront, c'est tout.` | 56 car. |
| Ligne MUF         | `Presque, ça laisse entrer.`                           | 28 car. |

_Notes de fabrication._ `PRESQUE LUI` est un tampon **honnête et amer** : il dit le résultat sans le
récompenser, et il se lit d'un coup à côté de `C'EST LUI` et de `TIRÉ QUAND MÊME` (même famille
typographique, trois longueurs distinctes — un joueur reconnaît lequel il a eu avant d'avoir lu).
`Trois sur quatre` est le **seul chiffre autorisé de toute la scène** : il arrive après la fin, donc
il n'oriente aucun geste (A16 intact). `Les portes hésiteront` est le payoff `+10 s` traduit en
fiction — un renseignement à moitié aveugle, pas aveugle. Et la clôture MUF referme la morale de la
scène : le presque-juste n'est pas neutre, il a un coût pour quelqu'un.

### 4.9 `FAILED` — le zine est parti avec la mauvaise tête (≤ 2/4)

Pas de « ÉCHEC ». Le fanzine est parti à l'impression avec la mauvaise tête — c'est ça, l'échec.

| Slot              | Copy (FR)                                              | Max     |
| ----------------- | ------------------------------------------------------ | ------- |
| Tampon d'écran    | `TIRÉ QUAND MÊME`                                      | 18 car. |
| Ligne KENZA       | `C'est pas lui. C'est une tête, mais c'est pas lui.`   | 52 car. |
| Ligne DISPATCH    | `Trop tard, c'est photocopié. 23 exemplaires dehors.`  | 52 car. |
| Ligne MUF         | `On a mis un innocent à la porte.`                     | 34 car. |

**La ligne de carte morte — cadrage réécrit (B1, §8).** Elle était écrite comme la *variante* du cas
« le chrono expire avant toute validation ». Cette formulation est caduque : **l'expiration est
désormais le chemin normal** de `PARTIAL` et de `FAILED`. La ligne est donc **promue** — elle n'est
plus une variante, elle est la **ligne d'ouverture des deux verdicts non verrouillés**, jouée avant
le tampon, en miroir exact de la ligne de verrouillage §4.6 :

| Slot                              | Copy (FR)                                | Max     | Joué à                |
| --------------------------------- | ---------------------------------------- | ------- | --------------------- |
| Ligne de buzzer (KENZA, sans image) | `Ma carte est morte. On imprime ce qu'on a.` | 44 car. | `PARTIAL` **et** `FAILED` |

_La symétrie est le squelette de la scène : **`Là. Bouge plus.`** d'un côté (la carte a tenu, la tête
est sortie), **`Ma carte est morte.`** de l'autre (le temps a gagné). Deux fins, deux causes, jamais
un « tu as perdu »._

**À la sortie anticipée** (affordance permanente, §6.2) : **pas cette ligne** — R11. La carte n'est
pas morte, c'est le joueur qui a rendu la main. La ligne de sortie est `Bon. On imprime ce qu'on a.`
(§6.2) : même seconde moitié, donc même symétrie, un seul mot d'écart pour dire qui a décidé. Le
verdict qui suit (`PARTIAL` ou `FAILED`) est résolu à l'identique — la fiction ne fait aucun cas à
part, et surtout ne moralise personne.

### 4.10 La ligne qui relance vers la suite

Une seule, en sortie de scène — elle rend la main à la boucle :

- `IDENTIFIED` : `DISPATCH — « Bouge. La prochaine sono t'attend. »` — **46 car.**
- `PARTIAL` : `DISPATCH — « On repassera dessus. Bouge. »` — **38 car.**
- `FAILED` : `DISPATCH — « On corrigera au numéro d'après. Bouge. »` — **48 car.**

_Les trois finissent sur `Bouge.` : c'est le mot de sortie shippé de DISPATCH (`« Compris ? Bouge.
Rue Belliard t'attend. »`, tutoriel). La boucle reprend, quoi qu'il se soit passé dans la cabine._

### 4.11 Balayage anti-« geste de validation » (R5 — exigé par B1)

Passe faite sur l'intégralité du copy-deck. **Toute formulation qui présuppose un envoi, une
soumission ou une confirmation est éliminée.** Résultat :

| Ligne / slot                                    | Statut | Traitement                                                              |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| CTA `SORTIR LA TÊTE` (§4.9 replis, round 1)     | **MORT** | Supprimé de l'IHM. Abandonné, non recyclé (voir §0).                    |
| KENZA `Sors-moi une tête, une seule` (§4.1 #4)  | **VIT** | C'est un **dialogue**, pas un libellé — une commande passée à Muf au téléphone, pas un ordre d'interface. Aucune retouche. |
| Consigne `…, arrête-toi quand ça te parle` (§4.2) | **RÉÉCRITE** | Ancienne version décrivait sélection→action. Nouvelle version = geste de glissement seul. |
| `Voilà.` en tête du verdict `IDENTIFIED` (§4.7) | **COUPÉ** | Mot de validation accomplie. |
| Variante « avant toute validation » (§4.9)      | **RECADRÉE** | Le mot *validation* disparaît ; l'expiration devient le chemin normal.  |
| Aide `bande {n}/4` (§4.4)                       | **COUPÉE** | Plus de bande active au doigt (A4-bis).                                 |
| §5 « la réussite ouvre un numéro »              | **OK**  | Décrit une conséquence, pas un geste. Aucun « quand tu es sûr », aucun « envoie », aucun « confirme » ailleurs dans la spec — **vérifié ligne à ligne**. |

| Sortie anticipée `ÇA PART COMME ÇA` (§6.2)      | **VIT** | Sujet grammatical = **la page**, pas le joueur. Ne présuppose aucune justesse. Voir l'amendement ci-dessous. |
| `Tu raccroches ?` / `JE RACCROCHE` (§6.1)       | **RETIRÉ** | Copie d'abandon devenue fausse : la sortie n'est plus un renoncement (R11).       |

**Règle opposable, valable pour toute copie future de cette scène :** aucun texte joueur ne peut
contenir un impératif d'envoi (`envoie`, `valide`, `confirme`, `sors la tête`, `quand tu es sûr`,
`t'es prêt ?`). La scène n'a pas de moment où le joueur dit « c'est lui » — **c'est le montage qui le
dit à sa place**. Un seul verbe est autorisé pour décrire l'action du joueur : **faire glisser**.

#### Amendement R12 — le cas `imprimer`

Question posée franchement : en habillant la sortie avec l'imprimerie, est-ce que je réintroduis le
geste de validation par la porte de derrière ? **Non — sous une condition que j'écris ici pour qu'on
puisse me l'opposer.**

Le critère qui définit la liste noire n'est pas « verbe d'action terminale », c'est **verbe qui
présuppose que la réponse du joueur est la bonne**. `valide`, `confirme`, `quand tu es sûr` :
tous fabriquent une certitude que la scène refuse (§6, cliché n°2). `envoie` : le joueur est le sujet
et il émet un jugement. **`imprimer` ne présuppose rien** — le zine part *de toute façon*, juste
ou faux ; c'est déjà écrit dans la ligne de buzzer shippée en spec (§4.9 : `On imprime ce qu'on a.`)
et dans le tampon `TIRÉ QUAND MÊME`. Imprimer n'est pas un verdict, c'est une **fatalité de
fabrication**. C'est même l'exact contraire d'une validation : on imprime *aussi* la mauvaise tête.

**Condition opposable :** `imprimer` n'est autorisé qu'à l'**impersonnel ou à la 3ᵉ personne**
(`on imprime`, `ça part au tirage`, `c'est photocopié`). Il est **interdit à l'impératif adressé au
joueur** — `Imprime !`, `Imprime quand t'es prêt`, `IMPRIMER` en libellé de bouton. Un impératif
remet le joueur en position de sujet qui émet, et à ce moment-là `imprime` **est** `envoie` avec un
costume d'époque. La liste noire de §6 est donc étendue : **`imprime` (impératif 2ᵉ pers.)**,
`tire` / `tirer` au sens d'imprimer à l'impératif, `au tirage !`. Aucun libellé d'IHM de cette scène
ne contient de verbe conjugué à la 2ᵉ personne. Aucun.

### 4.12 Replis si les slots sont plus étroits

`TÊTE À CONNAÎTRE` → **ne pas raccourcir**, c'est le nom de la scène · sur-titre → `PAGE 23` ·
consigne → §4.2 repli · ouverture montage → §4.0 repli (`Ça, c'est personne.`) · libellés de bande →
`COUPE / REGARD / NEZ / BOUCHE` (sans article, **8 car.**) · jauge → `CARTE` (**5 car.**) ·
verrouillage → fusion en tête de §4.7 (**39 car.**, repli assumé, voir §4.6).

### 4.13 Illustrations

Règle de fer respectée : **aucun sprite nouveau n'est présumé**. Les répliques d'encadrement
réutilisent `assets/courier/rider.png` (MUF) ; les répliques KENZA/DISPATCH restent **sans image**,
comme le monologue Vitry shippé. Les **planches de visages** sont l'affaire de l'écran du mini-jeu
et de l'art flow (`concept-artist` → `lead-art`) : **demande**, pas fait accompli. Direction
demandée (arbitrage Bertrand, recon §6) : trait BD/comics maison, B&N photocopié, **pas** de photo
numérisée ; les bandes doivent se lire comme **découpées dans un zine** (bord de ciseaux, décalage
de photocopie), pas comme un kit d'identification judiciaire. Le backdrop de scène peut réutiliser
une façade shippée (`assets/levels/{level}/facade.png`) — cabine dans la rue.

---

## 5. Ce que la réussite débloque · ce que l'échec coûte

**L'équivalent du « dossier du suspect » (recon §5) est ici la page 23 du prochain numéro.**

- **Réussite → la tête circule.** Le zine sort avec la gueule en page 23 ; les portes du circuit
  l'ont vue. En fiction, ce type **ne rentre plus** : c'est le premier coup que le réseau porte au
  bras _renseignement_ du dispositif (les RG qui alimentent le Commandant,
  `spec-boss-encounter-fiction.md` §1.2). Traduction gameplay possible — **je propose, Sacha
  tranche** : une soirée suivante où le renseignement adverse est aveugle un moment (moins de
  planques renseignées / une vague retardée). Aucun chiffre ici.
- **Échec → une histoire, pas un malus.** Le zine part quand même : 23 exemplaires avec la mauvaise
  gueule. Deux conséquences narratives, toutes deux jouables :
  1. **Un habitué se fait refuser à sa propre porte.** Le réseau s'est blessé lui-même. C'est le
     coût moral, et c'est le seul garde-fou qui empêche cette scène de devenir un jeu de flic :
     le jeu montre ce que ça coûte de se tromper de tête.
  2. **L'autre, lui, est entré.** Il a vu la salle, il a compté. La soirée suivante est plus
     surveillée.
- **Pas de game over, pas de vie perdue.** ~~Décision finale : `game-designer` + gate.~~ →
  **TRANCHÉ, A1 : aucune vie retirée, ni entière ni fractionnaire.** Le coût est l'énergie
  (−20 sur le capital de départ du niveau suivant) **plus le beat obligatoire** (A1b). Ma
  recommandation a été retenue et **durcie** : le beat n'est pas décoratif, il est dû.
- **Rejouable sans se contredire.** ~~Chaque teuf peut produire sa tête.~~ → **A3 : une seule
  occurrence par run en V1.** La fiction n'en souffre pas — au contraire, une tête par run fait de
  cette page 23 **un événement** plutôt qu'une rubrique. La note de rejouabilité est conservée pour
  le post-V1, pas pour la V1. La scène ne gate jamais la mission et vit **hors** d'elle (A2) : le
  budget 3-5 min n'est pas entamé d'une seconde.

### 5.3 Les rappels du niveau suivant (condition 3 du gate — OBLIGATOIRES)

Trois scènes courtes, **une par issue**, jouées dans le **pré-niveau suivant** (A10.1). Elles sont la
preuve jouable que la scène a servi à quelque chose : sans elles, A11 coupe la feature. Elles
s'insèrent dans la scène narrative pré-niveau existante, **avant** le briefing DISPATCH habituel, et
ne dépassent pas 3 répliques — elles rappellent, elles ne rejouent pas.

**a) `IDENTIFIED` — la porte le refuse** _(payoff : première vague de pression retardée de +20 s)_

| #   | speaker  | text (FR)                                          | image                      | Max     |
| --- | -------- | -------------------------------------------------- | -------------------------- | ------- |
| 1   | KENZA    | `Le type de l'autre fois s'est pointé à la porte.` | —                          | 48 car. |
| 2   | KENZA    | `Le gars avait la page 23 dans la poche. Il l'a pas fait entrer.` | —          | 62 car. |
| 3   | DISPATCH | `Ils sont sourds ce soir. Profite, ça durera pas.` | —                          | 50 car. |

_Note : personne ne triomphe (§6, cliché n°1). KENZA raconte, DISPATCH chiffre l'avantage en durée
sans jamais dire « +20 secondes ». `Ils sont sourds` = le renseignement adverse a perdu un œil pour
un moment — la traduction exacte du payoff._

**b) `PARTIAL` — la porte hésite** _(payoff : +10 s)_

| #   | speaker  | text (FR)                                             | image | Max     |
| --- | -------- | ----------------------------------------------------- | ----- | ------- |
| 1   | KENZA    | `La page 23 est sortie. La tête est à moitié bonne.`  | —     | 50 car. |
| 2   | DISPATCH | `Les portes regardent deux fois. C'est déjà ça.`      | —     | 46 car. |

_Deux répliques, pas trois : un demi-résultat n'a pas droit à une histoire complète. Le gate ne
demandait que deux rappels (a et c) — j'ajoute celui-ci parce que `PARTIAL` **existe** et qu'un
palier muet au niveau suivant contredirait la non-négociable « chaque échec, raison affichée »._

**c) `FAILED` — un habitué se fait refuser à sa propre porte** _(beat OBLIGATOIRE, A1b · payoff 0 s
· −20 énergie initiale)_

| #   | speaker  | text (FR)                                              | image                      | Max     |
| --- | -------- | ------------------------------------------------------ | -------------------------- | ------- |
| 1   | KENZA    | `Ils ont refusé Sam hier. À sa propre porte.`          | —                          | 44 car. |
| 2   | KENZA    | `Il vient depuis trois ans. Il avait juste la gueule de la page 23.` | —            | 66 car. |
| 3   | MUF      | `Et l'autre ?`                                         | `assets/courier/rider.png` | 14 car. |
| 4   | KENZA    | `L'autre est entré. Il est resté jusqu'au jour.`       | —                          | 48 car. |

_Notes de fabrication, et c'est le beat le plus important de la spec._ **Le réseau s'est blessé
lui-même** : c'est le garde-fou moral ratifié comme obligatoire par A6/§5, celui qui empêche cette
scène de devenir un jeu de flic. Il fallait un **prénom** — `Sam`, un habitué, jamais revu ailleurs,
pas un contact §7 : un nom qui coûte, sans ouvrir le roster (contrairement au type de la porte, qui
reste anonyme, Q4). La question de MUF (`Et l'autre ?`) est la seule ligne qu'il puisse dire ici, et
la réponse est la vraie sanction : **l'homme, lui, est entré, et il est resté jusqu'au bout de la
nuit.** Aucune ligne ne gronde le joueur. On lui raconte les dégâts, il fait le calcul tout seul.

**Interdits sur les trois :** pas de récapitulatif de score, pas de « tu as échoué », pas de rappel
de l'énergie perdue en mots (le HUD le montre, c'est son travail), aucun mot de la liste §6.

**Contrainte de boucle :** 4 répliques max, skippables en un geste comme toute cutscene (guidelines
§5.3). Elles s'ajoutent au pré-niveau **une seule fois**, jamais répétées.

---

## 6. Ce que je refuse sur cette scène

**Registre interdit — le vocabulaire du commissariat.** Bannis, sans exception, dans tout texte
joueur de cette scène :

`suspect` · `signalement` · `identifier` / `identification` · `portrait-robot` (dans la bouche des
personnages — c'est le nom interne de la feature, pas un mot du zine) · `fiche` / `fichier` /
`dossier` · `témoin` (dire « quelqu'un l'a vu ») · `enquête` · `preuve` · `mandat` · `avis de
recherche` · `traquer` / `retrouver le type` · `justice` · `interroger`.

**Clichés interdits :**

- Le **triomphe de flic** (« on le tient »). La réussite se dit à plat : la porte se ferme, c'est
  tout.
- La **certitude**. Personne ne confirme jamais que la tête est la bonne : KENZA dit qu'elle la
  reconnaît, pas qu'elle a raison. Aucun narrateur omniscient ne valide.
- Le **portrait comme trophée**. Pas de galerie de gueules collectionnées, pas de score de visages.
- Le **descriptif physique ethnicisant ou moralisant** — aucune description ne repose sur l'origine,
  la couleur, la classe ou une « sale gueule ». Les tells sont **comportementaux** (il compte, il ne
  danse pas, il repart seul) ; c'est aussi ce qui rend la scène honnête. **Non négociable.**
- Le **gadget** : pas d'écran « bonus » clignotant, pas de jingle victorieux. C'est une page de
  fanzine, pas une machine à sous.
- L'**anachronisme** : aucune image de « scan », « base de données », « reconnaissance faciale »,
  « pixel », « logiciel ». On découpe du papier dans une cabine.
- **Le vocabulaire de la validation** (nouveau, R5/B1) : `valider`, `confirmer`, `envoyer`,
  `soumettre`, `terminer`, `es-tu sûr ?`. La scène n'a plus d'acte de validation — aucun mot ne doit
  en inventer le fantôme. Seul verbe d'action joueur autorisé : **faire glisser**.
  **Extension R12 :** s'ajoutent `imprime` / `imprimer` / `tire` **à l'impératif adressé au joueur**
  (impersonnel toujours autorisé — critère et raisonnement complets en §4.11, amendement R12).

### 6.1 Passe de conformité sur les libellés d'IHM (condition 4 du gate)

Chaque chaîne d'écran ajoutée par l'UX, passée contre la liste ci-dessus. **Verdict par ligne :**

| Chaîne d'IHM (source UX)          | Verdict     | Chaîne canonique / traitement                                                     |
| --------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| Bandeau d'écran                   | **CONFORME** | `TÊTE À CONNAÎTRE` — jamais « PORTRAIT-ROBOT » (nom interne, §6). Ratifié A6.      |
| Libellés de bande `CHEVEUX/YEUX/…` | **REJETÉ**  | → `LA COUPE / LE REGARD / LE NEZ / LA BOUCHE` (A6). Repli sans article, 8 car.     |
| CTA `SORTIR LA TÊTE`              | **CADUC**   | Le bouton n'existe plus (B1). Rien ne le remplace — pas de libellé de substitution. |
| « dossier suspect » (UX §6/§7)    | **REJETÉ**  | Deux mots de la liste noire en trois syllabes. → **`la page 23`**, partout.        |
| `TÉLÉCARTE · {n} UNITÉS`          | **CADUC**   | → `TÉLÉCARTE` seul, 9 car., jauge sans nombre (§4.5). Repli `CARTE`.               |
| « temps restant » / `{n} s`       | **REJETÉ**  | Interdit reconduit (A6/A13). Aucun chiffre décroissant à l'écran.                  |
| Compteur `{n} sur {total}`        | **CONFORME** | Lisibilité d'état, pas feedback (A8). Chiffres nus, aucun libellé.                 |
| Message de confirmation d'abandon | **CADUC**   | `Tu raccroches ?` / `JE RACCROCHE` retirés (R11). → **§6.2**, la sortie n'est plus un abandon. |
| Affordance de sortie permanente   | **NOUVEAU** | `ÇA PART COMME ÇA` — §6.2.                                                        |

**Le message d'abandon — retiré, pas réécrit.** Round 2 l'avait écrit comme un renoncement : on
repose le combiné, `Tu raccroches ?`, `JE RACCROCHE`. La copie était bonne et elle dit maintenant la
mauvaise chose. Voir §6.2.

### 6.2 LA SORTIE ANTICIPÉE — « ça part comme ça » (round 3)

**Le problème de fiction, tel qu'il m'a été posé.** La sortie anticipée existe déjà et résout la
scène comme le buzzer. Elle devient **visible en permanence** (l'UX la spécifie), parce que le joueur
à 3/4 qui se croit fini n'a plus rien à faire de ses mains pendant 20 secondes. Elle sert donc
**deux joueurs opposés avec les mêmes mots** : celui qui a fini et qui est fier, celui qui a renoncé
et qui veut que ça s'arrête. Une copie triomphante humilie le second ; une copie de renoncement vole
sa fin au premier.

**Le fait qui tranche, et il est cruel :** au 4/4 le montage se verrouille **tout seul** (§4.6). Donc
**aucun joueur qui presse cette sortie n'a réellement fini.** Le fier se trompe — il est à 3/4 ou
moins, l'auto-verrouillage l'aurait devancé. Un libellé triomphant ne serait pas seulement
maladroit : il serait **factuellement faux**, à chaque pression, sans exception. Et un libellé de
défaite serait tout aussi faux, parce que ce joueur-là a fait son travail et croit de bonne foi
l'avoir bien fait.

**La sortie de piège :** ne rien dire du joueur. Dire ce qui arrive **à la page**. Le zine part de
toute façon — c'est le canon de la scène depuis le round 1 (`TIRÉ QUAND MÊME`, `On imprime ce qu'on
a.`). Une phrase dont le **sujet grammatical est la planche, pas le joueur**, ne peut ni féliciter ni
humilier : elle constate un départ à l'imprimerie. Le fier y lit « c'est prêt, ça part » ; celui qui
renonce y lit « tant pis, ça part comme ça ». **Deux lectures, une seule phrase, aucune des deux
fausse.** L'ambivalence n'est pas une prudence de rédaction ici, c'est la vérité de l'état du jeu :
personne, joueur compris, ne sait si la tête est bonne.

#### Chaîne canonique — l'affordance permanente

| Slot                        | Copy (FR)             | Max         | Note                                                        |
| --------------------------- | --------------------- | ----------- | ------------------------------------------------------------- |
| **Libellé permanent**       | `ÇA PART COMME ÇA`    | **16 car.** | Plafond dur. Sujet = la page. Aucun verbe à la 2ᵉ personne.   |
| Repli (slot étroit)         | `ÇA PART`             | **8 car.**  | Perd la nuance de haussement d'épaules, garde le sens.        |
| Repli extrême               | `AU TIRAGE`           | **9 car.**  | Dernier recours. `tirage` est canon (23 exemplaires, §4.9).   |

_`comme ça` fait tout le travail. Sans lui, `ÇA PART` est neutre-administratif ; avec lui, c'est un
haussement d'épaules qui se lit indifféremment comme « en l'état, et c'est bien » ou « en l'état, et
tant pis ». C'est du français parlé de 1998, pas un libellé d'IHM. Il reprend mot pour mot la
sous-ligne du round 2 (`Ce qui est sur la planche part comme ça`), qui était déjà la bonne phrase —
elle était juste rangée derrière la mauvaise question._

**Interdits sur ce libellé, opposables :** `TERMINER`, `VALIDER`, `ENVOYER`, `IMPRIMER`, `J'AI FINI`,
`PRÊT`, `QUITTER`, `ABANDONNER`, `JE RACCROCHE`, et toute 1ʳᵉ personne (`J'ENVOIE`, `J'IMPRIME`) —
la 1ʳᵉ personne remet le joueur en sujet qui affirme, exactement ce que §4.11 interdit.

#### Variante A — sortie immédiate (pas de confirmation)

Une pression, la scène se résout. Rien à écrire de plus que le libellé, plus la ligne de sortie :

| Slot                                   | Copy (FR)                     | Max         | Joué à                    |
| -------------------------------------- | ----------------------------- | ----------- | ------------------------- |
| Ligne de sortie (KENZA, sans image)    | `Bon. On imprime ce qu'on a.` | **28 car.** | sortie anticipée, avant le tampon |

_Miroir exact des deux autres ouvertures de verdict — `Là. Bouge plus.` (§4.6), `Ma carte est morte.
On imprime ce qu'on a.` (§4.9). **Un seul mot d'écart avec la ligne de buzzer**, et il dit qui a
décidé : le temps, ou toi. `Bon.` est le mot le plus ambivalent du français parlé — satisfaction
et résignation dans la même syllabe, dit exactement pareil par le fier et par celui qui lâche. C'est
lui qui tient les deux joueurs, et il coûte quatre lettres._

#### Variante B — ARBITRÉE (A17, gate §9) : double appui sur la même cible

**La modale est morte, la confirmation reste.** Le gate conserve une garde — l'asymétrie est réelle
(un appui accidentel coûte la scène entière, définitivement, contre ~1 s de friction une fois par
run ; et un swipe horizontal raté qui se résout en tap est le scénario nominal) — mais il refuse
l'écran à deux boutons, **pour le motif exact de mon objection** : un « t'es sûr ? » est un bouton de
validation avec de la latence, et une overlay masquerait les bandes au moment de la dernière
vérification.

**Forme retenue :** premier appui = armement, second appui dans les 2,0 s = ça part, désarmement
silencieux ensuite. Pas d'écran, pas de question, pas de second bouton. **Un seul texte de
confirmation existe désormais : le libellé de l'état armé.**

| Slot                          | Copy (FR)         | Max         | Appareil |
| ----------------------------- | ----------------- | ----------- | -------- |
| **État armé — desktop**       | `ENCORE UN COUP`  | **14 car.** | desktop  |
| **État armé — mobile**        | `ENCORE`          | **6 car.**  | mobile   |

_Pourquoi celui-là._ Il tient les trois contraintes d'un coup : **pas une question** (aucun point
d'interrogation, aucune demande d'assentiment — c'est un constat d'état, « il en reste un ») ;
**aucun verbe conjugué**, donc pas de 2ᵉ personne, l'interdit §4.11 tient sans exception ; et il ne
juge toujours ni la tête ni le joueur — le fier y lit « encore un et ça part », celui qui renonce y
lit la même chose. `un coup` est du français de rue de 1998 et couvre exactement le geste (un appui
de plus), sans emprunter un mot d'interface. Le désarmement est **muet** : on ne dit pas au joueur
qu'il a laissé passer sa fenêtre, ça ferait un reproche là où il n'y a qu'un non-événement — le
libellé revient à l'état repos, point.

**Interdit sur ce slot :** toute mention de la fenêtre de 2,0 s en mots (`2 s`, `vite`, `dépêche`) —
règle des chiffres à l'écran (A6/A13) ; le compte à rebours visuel appartient à l'UX. Interdits
reconduits : `CONFIRMER`, `SÛR ?`, `OK`, `VRAIMENT`, `T'ES SÛR`.

#### Répartition mobile / desktop — chaînes définitives

Gabarit UX : mobile ≤ **8 car.** (icône obligatoire, libellé optionnel), desktop ≤ **20 car.** avec
icône. **Aucun choix n'est laissé au dev :**

| État        | Desktop (≤ 20 car.)          | Mobile (≤ 8 car.)   |
| ----------- | ---------------------------- | ------------------- |
| **Repos**   | `ÇA PART COMME ÇA` (16 car.) | `ÇA PART` (8 car.)  |
| **Armé**    | `ENCORE UN COUP` (14 car.)   | `ENCORE` (6 car.)   |

`AU TIRAGE` (9 car.) est **retiré des replis** : il dépasse le gabarit mobile et n'a aucun usage
desktop, où la chaîne pleine passe. Il ne reste nulle part.

_Sur mobile, `comme ça` saute — c'est ce que le gabarit permet et c'est la bonne perte : la nuance de
haussement d'épaules est portée par le contexte (une planche à moitié faite, une jauge qui descend)
autant que par les mots, et `ÇA PART` garde l'essentiel, à savoir que le sujet est la page et pas le
joueur. Sur desktop la phrase complète tient, on la garde ; les deux appareils lisent la même chose,
l'un plus bavard que l'autre. Jamais l'inverse : pas de libellé mobile qui dirait quelque chose que
le desktop ne dit pas._

**Ce que l'arbitrage n'emporte PAS : la ligne de sortie KENZA `Bon. On imprime ce qu'on a.`
(28 car.) survit intacte.** Elle appartenait à la sortie elle-même, pas à la variante B. Elle se joue
**après le second appui**, avant le tampon, exactement comme la ligne de buzzer §4.9 se joue après
l'expiration. L'état armé ne la déclenche pas ; un désarmement silencieux ne déclenche rien du tout.

**Ce que devient `JE RACCROCHE` :** parqué, pas recyclé. Si un vrai chemin de sortie du jeu existe un
jour depuis cette scène (retour au menu, run abandonné — un geste qui n'imprime rien), `Tu
raccroches ?` / `JE RACCROCHE` est la copie prête et juste. Tant que ce chemin n'existe pas, la
chaîne ne sert nulle part. Une scène qui n'a plus d'abandon n'a pas besoin qu'on lui en garde le mot
sous le coude.

---

## 7. Questions — état après le gate

### 7.0 Ce qui est TRANCHÉ (round 2 — plus rien à me demander là-dessus)

| Q  | Tranché par | Décision                                                                                 |
| -- | ----------- | ------------------------------------------------------------------------------------------ |
| Q1 | **A1 · A1b** | Zéro vie. −20 énergie sur le capital initial du niveau suivant **+ beat obligatoire** (§5.3c). |
| Q2 | **A2**      | **Interstitiel post-niveau**, `AppPhase` dédié. Répliques skippables, **phase interactive non**. Abandon = expiration anticipée. |
| Q3 | **A12 · gate §7 F** | Les trois points de canon net-new **ratifiés** : page 23, télécarte, gel du twist. |
| Q4 | **gate §4** | Le type de la porte **reste anonyme**. Ratifié. (Seul prénom neuf de la spec : `Sam`, §5.3c — un habitué, pas un personnage.) |
| Q5 | **B2 · A13** | Chrono 35 s (56/30), **jauge continue sans nombre**, trois paliers nommés (§4.5).       |
| Q6 | **A5**      | 6 variantes, 1 gabarit, 1 bonne + 2 leurres forts + 3 moyens.                            |
| Q7 | **A16**     | Aucun feedback par trait. **UN** signal global et terminal : le verrouillage (§4.6).      |
| Q8 | **A10**     | Payoff = vague retardée (+20 / +10 / 0 s) + rappel narratif obligatoire (§5.3).           |

### 7.1 Ce qui reste ouvert (round 2)

**Pour `game-designer` (Sacha) — coordination directe, non bloquante :**

- **Q9 — les trois paliers.** Je consomme `MI-PARCOURS` / `URGENCE` / `DERNIER` **par leur nom**
  (§4.5). Confirme que ta table n'en produit ni plus ni moins, et qu'aucun n'est répétable. S'il en
  apparaît un quatrième, il me revient — pas de palier muet.
- **Q10 — le slot de la ligne de verrouillage.** §4.6 demande un slot **dédié**, joué au gel, avant
  le tampon, sous 1,4 s. S'il n'existe pas, c'est le repli fusionné — dis-le-moi, je ne veux pas
  l'apprendre à l'implémentation.

**Pour `ux-designer` (Tony) :** les chaînes de §6.1 sont les définitives. Le message d'abandon est
**mort** (R11) — l'affordance permanente de sortie et ses deux variantes sont en **§6.2**, écrites en
entier, plafonds compris. Ne les paraphrase pas, et ne rajoute ni pictogramme de porte/croix qui
retournerait le libellé en « quitter », ni compteur d'état à côté (A16).

**Pour `lead-game-designer` (Karim) — round 3 :**

- **Q11 — variante A ou B ?** Les deux sont écrites (§6.2). Ma recommandation : **A** (immédiate) ;
  une confirmation reconstruit le bouton de validation supprimé par B1.
- **Q12 — verdict `imprimer`.** §4.11 amendement R12 : autorisé à l'impersonnel, interdit à
  l'impératif 2ᵉ personne. Si tu juges le critère trop fin pour être tenu par les lanes suivantes,
  dis-le et je bannis le verbe en entier — je perds `On imprime ce qu'on a.` (×2) et je réécris.

---

## 7.2 Archive round 1 — questions telles que posées avant le gate

**Pour `lead-game-designer` (Karim) :**

- **Q1 — sanction d'échec.** Je propose un échec **narratif sans perte de vie** (§5). La recon
  documente −1 vie chez Ocean. Trancher : beat narratif seul, ou coût gameplay ? _(Ma
  recommandation : beat narratif + conséquence sur la soirée suivante.)_
- **Q2 — placement dans la boucle.** Je l'écris comme scène **post-niveau** (après la teuf,
  la cabine). Est-ce que la scène est **optionnelle** (on peut la sauter comme toute cutscene) ou
  **requise** ? Si requise, elle doit rester sous la barre des 3-5 min de la mission.
- **Q3 — canon net-new à ratifier.** (a) la **page 23** comme lieu fictionnel de la récompense ;
  (b) l'usage de la **télécarte** comme chrono diégétique ; (c) la **réserve** du twist « ton propre
  portrait-robot » pour le Niveau Final (§2.1) — je demande qu'il soit **gelé, pas dépensé**.
- **Q4 — l'homme a-t-il un nom ?** Ma recommandation : **non**. Il reste « le type de la porte » ;
  le nommer en ferait un personnage et rouvrirait le roster §7. Un jour, il peut devenir la main
  invisible du Commandant — sans jamais parler.

**Pour `game-designer` (Sacha) — terrain partagé, on conçoit ensemble, on livre séparément :**

- **Q5 — durée du chrono.** Je n'avance aucun chiffre. La seule contrainte de fiction : il doit
  s'exprimer en **unités de télécarte** décroissantes, et les paliers §4.5 doivent tomber quelque
  part (mi-parcours, dernier tiers, deux unités).
- **Q6 — nombre de variantes par bande.** Non chiffré par la recon. Contrainte de fiction : assez
  **proches** pour que le doute existe (c'est le levier de difficulté identifié, recon §7), pas au
  point que le joueur se sente floué.
- **Q7 — feedback.** J'écris la scène pour **zéro feedback par trait** (§4.2, ligne d'ambiance).
  Si le tuning exige une aide, elle doit venir de **KENZA qui se souvient mieux**, jamais d'un
  voyant vert. Dis-moi ce qu'il te faut, je l'écris.
- **Q8 — la récompense côté chiffres** (§5) : blindage du renseignement adverse, vague retardée,
  autre ? La fiction supporte les trois ; je ne présume rien.

**Pour l'art flow (via le gate) :** ouvrir la demande de **planches de gueules** (4 bandes,
n variantes, style zine découpé, §4.10). Aucune ligne de cette spec ne dépend d'un sprite non
shippé — la scène est jouable en texte seul si l'art n'atterrit pas.

---

## 8. Conformité boucle / scope

- **Cahier des charges :** Prohibition (Atari ST) n'a pas de portrait-robot ⇒ **extension
  consciente et documentée**, même standard qu'ADR-0012 (tutoriel) et ADR-0030 (otage). La scène
  **encadre** `Récupérer → Livrer → Éviter` ; elle n'ajoute aucune règle à `Éviter`.
- **`une mission = 3-5 min` :** la scène est **hors mission** (A2) — le budget n'est pas entamé.
  Budget propre : 4 répliques d'entrée + le montage (35 s) + verrouillage/révélation + 1 ligne de
  sortie, soit **38,6 s** à `IDENTIFIED`. Les **répliques** sont skippables en un geste
  (guidelines §5.3) ; la **phase interactive ne l'est pas** — elle a une issue et un coût (A2).
  Les rappels §5.3 ajoutent ≤ 4 répliques au pré-niveau suivant, une seule fois.
- **Roster :** aucune 4e faction. On branche sur **RG en civil** (§7), déjà scopé, déjà relié au
  Commandant. Aucun contact §7 (Masta Klem, Faïza, Seb, Oxane, Karim) n'est convoqué ici.
- **Période :** cabine, télécarte, photocopieuse, tirage à 23. Zéro anachronisme. Grounding
  culturel vérifiable auprès d'`art-advisor` (Estelle) si le gate veut durcir le read cabine/télécarte.

## 9. Hand-off

**De :** `narrative-designer` (Yasmine) · **À :** `lead-game-designer` (Karim)
**Livré (round 2) :** les **4 conditions du gate** appliquées (§0 journal), les **3 amendements
Bertrand** absorbés — CTA mort et balayage anti-validation complet (§4.11), chrono ré-habillé en jauge
continue avec paliers nommés (§4.5), desktop/mobile alignés sur un seul verbe (§4.2) — plus **deux
livrables neufs non demandés mais dus** : la **ligne de verrouillage** (§4.6) et la **mise en scène du
premier écran tout-faux** (§4.0).
**Non décidé :** Q9, Q10 (§7.1) — coordination `game-designer`, non bloquantes.
**Demandé :** `VERDICT:` PASS / PASS-WITH-CORRECTIONS / FAIL sur le round 2.
**À loguer :** hand-off dans `docs/handoffs/`, indexé dans `docs/agent-handoffs.md`.
