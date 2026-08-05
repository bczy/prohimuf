# PORTRAIT-ROBOT — fiction spec (« TÊTE À CONNAÎTRE »)

**Author:** `narrative-designer` (Yasmine) · **Gate:** `lead-game-designer` (Karim) —
status **DRAFT, awaiting PASS** · **Date:** 2026-08-05
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

### 4.2 La consigne (apprend la mécanique sans tuto plaqué)

Une seule ligne, dans la voix de KENZA, placée sous le titre au premier affichage :

- `Change de bande, fais défiler, arrête-toi quand ça te parle.` — **58 car.**

Elle nomme les deux gestes de la recon (haut/bas = bande, gauche/droite = variante) **sans nommer un
seul verbe d'interface**. Repli si le slot est court : `Change de bande. Fais défiler. Arrête-toi.`
(**42 car.**)

**Ligne d'ambiance, affichée une fois au démarrage (facultative) :**

- `Personne te dira si c'est bon. C'est ton œil.` — **46 car.**
  _Elle installe diégétiquement « pas de feedback par trait » (recon §3) : ce n'est pas une lacune du
  jeu, c'est la condition du souvenir._

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

- Aide bande active : `bande {n}/4` — **12 car.**
- Aide variante : `{n} sur {total}` — **12 car.**
  _Chiffres seulement. Aucun libellé de touche : la lane contrôles/UX possède ça._

### 4.5 Le chrono qui presse — la télécarte

Le chrono **est** un objet de 1998 : les unités de la télécarte dans la cabine. Il ne dit pas
« temps restant », il dit ce qu'il coûte.

| Palier                     | Copy (FR)                             | Max     |
| -------------------------- | ------------------------------------- | ------- |
| Libellé permanent          | `TÉLÉCARTE · {n} UNITÉS`              | 24 car. |
| Relance à mi-parcours      | `KENZA — « Ma carte descend. »`       | 28 car. |
| Dernier tiers (urgence)    | `KENZA — « Grouille, il me reste rien. »` | 42 car. |
| Deux unités                | `bip`                                 | 6 car.  |

_Le mot `bip` en bas de casse est un son imprimé, pas un message système : le zine écrit ce qu'on
entend. Si la lane audio préfère un vrai bip, le texte disparaît sans rien casser._

### 4.6 Verdict de réussite

| Slot              | Copy (FR)                                                | Max     |
| ----------------- | -------------------------------------------------------- | ------- |
| Tampon d'écran    | `C'EST LUI`                                              | 12 car. |
| Ligne KENZA       | `Voilà. C'est cette gueule-là. Je la sortirai plus.`     | 52 car. |
| Ligne DISPATCH    | `Page 23 du prochain numéro. Toutes les portes l'auront.` | 56 car. |
| Ligne MUF (clôture) | `Il rentrera nulle part.`                                | 26 car. |

### 4.7 Verdict d'échec

Pas de « ÉCHEC ». Le fanzine est parti à l'impression avec la mauvaise tête — c'est ça, l'échec.

| Slot              | Copy (FR)                                              | Max     |
| ----------------- | ------------------------------------------------------ | ------- |
| Tampon d'écran    | `TIRÉ QUAND MÊME`                                      | 18 car. |
| Ligne KENZA       | `C'est pas lui. C'est une tête, mais c'est pas lui.`   | 52 car. |
| Ligne DISPATCH    | `Trop tard, c'est photocopié. 23 exemplaires dehors.`  | 52 car. |
| Ligne MUF         | `On a mis un innocent à la porte.`                     | 34 car. |

_Variante si le chrono expire avant toute validation (mêmes plafonds) :_

- KENZA : `Ma carte est morte. On imprime ce qu'on a.` — **44 car.**

### 4.8 La ligne qui relance vers la suite

Une seule, en sortie de scène, quel que soit le verdict — elle rend la main à la boucle :

- Réussite : `DISPATCH — « Bouge. La prochaine sono t'attend. »` — **46 car.**
- Échec : `DISPATCH — « On corrigera au numéro d'après. Bouge. »` — **48 car.**

### 4.9 Replis si les slots sont plus étroits

`TÊTE À CONNAÎTRE` → `TÊTE À CONNAÎTRE` (ne pas raccourcir, c'est le nom de la scène) ·
sur-titre → `PAGE 23` · consigne → §4.2 repli · libellés de bande → `COUPE / REGARD / NEZ / BOUCHE`
(sans article, **8 car.**) · télécarte → `{n} UNITÉS` (**12 car.**).

### 4.10 Illustrations

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
- **Pas de game over, pas de vie perdue.** La recon dit −1 vie chez Ocean (§4/§7) ; je **déconseille
  la transposition littérale** : ici le chrono est une télécarte, pas une bombe, et le prix d'un
  raté est social. Un échec doit produire un **beat**, pas un écran de mort. Décision finale :
  `game-designer` + gate (§7 Q1).
- **Rejouable sans se contredire.** Chaque teuf peut produire sa tête : un autre visage aperçu, un
  autre numéro du zine. La scène ne s'épuise pas, et elle ne gate jamais la mission
  (« une mission = 3-5 minutes » — elle encadre, elle n'interrompt pas).

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

---

## 7. Questions ouvertes

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
- **`une mission = 3-5 min` :** scène courte (4 répliques d'entrée + le montage + 3 de sortie),
  skippable en un bouton comme toute cutscene (guidelines §5.3).
- **Roster :** aucune 4e faction. On branche sur **RG en civil** (§7), déjà scopé, déjà relié au
  Commandant. Aucun contact §7 (Masta Klem, Faïza, Seb, Oxane, Karim) n'est convoqué ici.
- **Période :** cabine, télécarte, photocopieuse, tirage à 23. Zéro anachronisme. Grounding
  culturel vérifiable auprès d'`art-advisor` (Estelle) si le gate veut durcir le read cabine/télécarte.

## 9. Hand-off

**De :** `narrative-designer` (Yasmine) · **À :** `lead-game-designer` (Karim)
**Livré :** angle retenu + démolition des alternatives (§2), porteuse de scène (§3), **tous** les
textes joueur avec plafonds (§4), récompense/coût (§5), interdits (§6).
**Non décidé :** Q1→Q8 (§7). **Demandé :** `VERDICT:` PASS / PASS-WITH-CORRECTIONS / FAIL +
ratification des trois points de canon net-new (Q3).
**À loguer :** hand-off dans `docs/handoffs/`, indexé dans `docs/agent-handoffs.md`.
