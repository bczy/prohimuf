# Pré-spec armement muf — modèle multi-armes par pickup

> **Statut :** recherche / **pre-gate**. Ceci est un pré-spec d'idéation, PAS une spec gatée.
> Le **roster multi-armes dépasse les guidelines** (Prohibition n'avait qu'une arme) et doit
> passer le design gate `lead-game-designer` (Karim) + le contrôle de scope `pm` (John) avant
> tout dev. Les valeurs de tuning (§4) sont des **points de départ à playtester** sur le build
> (skill `verify`), non des valeurs gatées.
>
> **Lane :** `game-designer`. **Date :** 2026-07-18. **Intention lead (Bertrand) :** changer
> d'arme en **tirant dans une caisse** ; plusieurs types de tir (mitraillette, triple tir
> horizontal) ; **une seule arme, pas de switch** ; **arme spéciale à durée limitée en nombre
> de tirs**. Veille de contexte : `veille-concurrentielle-shooters.md`.

## 1. Verdict cahier des charges (à lire en premier)

**Prohibition (Atari ST, 1987) n'avait qu'UNE arme fixe** — aucun pickup, aucun type de tir
alternatif. **Tout roster multi-armes est une [EXTENSION] consciente**, pas de la fidélité,
et **dépasse les guidelines** (§scope : "toute feature qui ne sert pas la boucle est hors
scope"). La décision d'ajouter des armes multiples appartient au gate.

Ce que la veille **confirme sans réserve** : le mécanisme d'acquisition voulu — **tirer une
caisse/un item pour s'équiper** — est un **canon absolu du genre**, présent dès 1987 (Contra
et Operation Wolf, contemporains exacts de Prohibition). Si l'extension est validée, elle sera
**fidèle à la grammaire arcade** du genre auquel Prohibition appartient.

## 2. Précédents — "tirer un objet pour changer d'arme" est le standard du genre

Catalogue condensé (recherche : ~30 requêtes, wikis spécialisés / HG101 / StrategyWiki).
Trois familles d'acquisition : **(A)** tirer un objet mobile/volant qui EST/lâche le
power-up ; **(B)** tirer une caisse/décor fixe qui révèle l'arme ; **(C)** boutique/menu
(hors tir — pour mémoire). Le modèle voulu = **A/B, collecte par tir**.

| Jeu (pays/année)                                                      | Geste d'acquisition                         | Armes / icônes                                                                     | Remplace ?            | Stock fini → retour base ?                                                     |
| --------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| **Wild Guns** (JP 94, SNES) — _galerie à viseur, LE cousin exact_     | **tir sur l'icône** larguée/apportée (A/B)  | Machine Gun, Shotgun (spread), Grenade Launcher, + piège **Pea Shooter** (0 dégât) | **oui**               | **oui, auto**                                                                  |
| **CarnEvil** (US 98, light-gun)                                       | tir sur icône flottante (A)                 | machine gun (~20 s), flamethrower, acid                                            | oui (shotgun de base) | oui (temps/coups)                                                              |
| **Crypt Killer** (JP 95, light-gun)                                   | tir pots → tir sur l'arme (B)               | machine gun, etc.                                                                  | oui                   | oui                                                                            |
| **Lethal Enforcers I/II** (JP 92/94, light-gun)                       | tir sur l'icône (A/B)                       | auto, magnum, rifle, shotgun, **MG**, grenade                                      | oui                   | **partiel** : MG/Gatling/canon = 1 chargeur puis retour ; autres rechargeables |
| **Virtua Cop 1-2** (JP 94/95, light-gun)                              | tir décor → tir sur icône (B)               | Auto, Rifle, MG, Shotgun, Magnum                                                   | oui                   | non (perte sur hit/civil)                                                      |
| **Contra** (JP 87, run&gun)                                           | tir sur la **capsule volante** / pilier (A) | **S**pread, **M**achine, **L**aser, **F**ire, **R**apid, **B**arrier               | oui                   | non (munitions ∞, perte à la mort)                                             |
| **Metal Slug** (JP 96+, run&gun) — _la réf. UX du modèle_             | tir sur POW/caisse, collecte contact (A)    | **H** 200, **R** 30, **S** 10/30, **F** 30, **L**, **C**, **G**                    | oui (arme spéciale)   | **oui** → pistolet ∞ ("Heavy Machine Gun!" →…clic)                             |
| **Cabal / Blood Bros / NAM-1975** (JP 88-90)                          | tir décor → collecte contact (B)            | MG rapide, auto-shotgun, grenades                                                  | oui                   | oui                                                                            |
| **Operation Wolf** (JP 87, light-gun) — _contemporain de Prohibition_ | **tir sur caisses/tonneaux** (B)            | recharge munitions/grenades, MG boost 10 s                                         | boost                 | recharge/boost temporaire                                                      |
| **Elevator Action Returns** (JP 95)                                   | tir caisses/poubelles (B)                   | AK/MM-1, MP5K/ARWEN…                                                               | oui                   | **oui, auto** → pistolet ∞                                                     |
| **Shock Troopers** (JP 97)                                            | tir caisses/bâtiments (B)                   | 3-way, MG, flamethrower, rocket, laser                                             | oui                   | oui                                                                            |
| **Total Carnage / Smash TV** (US 90-92)                               | power-up lâché (A)                          | three-way, spread, rocket, flamethrower                                            | oui                   | **oui** (jauge 6 carrés) → base                                                |
| **1943** (JP 87, shmup)                                               | **flip du POW à coups de tir** (A)          | 3-way, machine gun, shell                                                          | oui                   | oui (timer)                                                                    |
| **TwinBee** (JP 85, shmup)                                            | **jongler la cloche au tir** (A)            | jaune/bleu/blanc(double)/vert/rouge                                                | remplace/ajoute       | non                                                                            |

**Match complet du modèle voulu** (tir sur caisse → remplace → stock fini → retour base,
collecte **par tir**) : **Wild Guns, CarnEvil, Crypt Killer, Lethal Enforcers** (partiel).
Match mécanique mais collecte au contact : Cabal, Metal Slug, Elevator Action Returns, Shock
Troopers, Total Carnage.

**➡️ Référence canonique pour muf : _Wild Guns_** — même genre (galerie à viseur), collecte
**par tir sur l'icône**, remplacement, compteur de munitions, retour auto à l'arme infinie,
et même le twist du **Pea Shooter piège** (une "fausse" arme à vider — très fanzine).

## 3. Modèle "une seule arme, pas de switch" — étayé

Choix du lead, fort et défendable. **L'imposent :** Contra (aucun inventaire ni touche de
swap), Metal Slug classique (MS1→5 ; le stock à 2 slots n'arrive qu'en MS6/2006, aveu que
l'inventaire est un confort tardif), Wild Guns, Cabal, Mercs, Total Carnage.

**Avantages pour muf :**

1. **Zéro binding supplémentaire** — le controller reste **viser + tirer** (guideline UX §5 :
   "déplacement + UNE action, appris en 10 s"). Un inventaire/roue d'armes violerait ça. Argument décisif souris/tactile.
2. **Décision sous pression, pas de menu** — prendre une caisse = choix instantané et
   engageant ("je sacrifie ma mitraillette à moitié pleine pour ce triple tir ?").
3. **HUD minimal** — un seul état d'arme, une seule jauge de stock. Colle au HUD fanzine épuré.
4. **Tension = ressource** — le retour forcé à l'arme de base **recrée** la tension
   "munitions" de Prohibition, transposée en tension "puissance de feu".

**Inconvénient assumé** — perte accidentelle d'une bonne arme si on tire une caisse par
réflexe ("problème de la capsule Contra"). _Atténuation :_ caisse **qui brille** (guideline
"ce qui brille est interactif") portant le **glyphe de l'arme AVANT de tirer**, et idéalement
pas pile devant le viseur de tir.

## 4. Modèle d'armement spec-ready (valeurs de départ à playtester)

Les "armes" modifient **comment le projectile part du viseur** (mono / cône rapide / éventail
horizontal). `T_base` = cadence de l'arme de base du proto, à mesurer via `verify` (hypothèse
de travail ~4-5 tirs/s bridés par le cooldown clic).

### 4.1 Roster

| #                        | Arme (placeholder)                                | Rôle                        | Munitions                   | Verdict CdC                                                                                                              |
| ------------------------ | ------------------------------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A                        | **Le calibre** (pistolet base)                    | précision mono-cible        | **∞**                       | [EXTENSION-proche-FIDÈLE] — Prohibition avait une arme unique ; ici rendue ∞ car le stress-munitions passe aux spéciales |
| B                        | **La sulfateuse** (mitraillette / full-auto)      | panic-clear, cadence        | **stock fini**              | [EXTENSION]                                                                                                              |
| C                        | **L'éventail** (triple tir horizontal)            | largeur, rangée de fenêtres | **stock fini**              | [EXTENSION]                                                                                                              |
| D                        | **Le tromblon** (scatter courte portée, spéciale) | burst haute puissance       | **stock fini (petit)**      | [EXTENSION]                                                                                                              |
| E _(optionnel, phase 2)_ | **La bombe** (nettoyage de rangée)                | panic total                 | **stock fini (très petit)** | [EXTENSION] — YAGNI tant que A-D non playtestés                                                                          |

Recommandation : **livrer A-B-C-D**, traiter E en YAGNI. (Bertrand : "1-2 spéciales" → D est
la spéciale, E la seconde optionnelle.)

### 4.2 Table de tuning — points de départ

| Arme                   | Projectiles/tir   | Cadence (cooldown) | Dispersion                                   | Dégâts/proj.           | **Stock départ**             | Rationale                                                                                                        |
| ---------------------- | ----------------- | ------------------ | -------------------------------------------- | ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **A — Calibre**        | 1                 | ~220 ms (≈4,5/s)   | 0 (pile viseur)                              | 1 (one-shot standard)  | ∞                            | La ligne de base ; tout se compare à elle                                                                        |
| **B — Sulfateuse**     | 1 (auto maintenu) | ~100 ms (≈10/s)    | cône ±2-3°                                   | 1                      | **120 tirs** (~12 s)         | Gros stock car brûle vite (ratio Heavy MG Metal Slug = 200) ; dispersion pour la différencier d'un base accéléré |
| **C — Éventail**       | 3 (horizontal)    | ~300 ms            | ≈ largeur de 2-3 fenêtres à distance médiane | 1 chacun               | **30 pressions** (=90 proj.) | Petit stock "par pression" façon shotgun MS (30) ; exploite le layout façade                                     |
| **D — Tromblon**       | 5-6 (cône court)  | ~500 ms            | cône large, **portée réduite**               | 1 chacun (couvre zone) | **12 tirs**                  | Ratio armes lourdes MS (30) / launcher EAR (20)                                                                  |
| **E — Bombe** _(opt.)_ | nettoie 1 rangée  | ~1 s               | zone = 1 rangée                              | élevé                  | **4-6 tirs**                 | Panic total ; stock minuscule (grenade launcher TC = 5)                                                          |

**Garde-fous de balance (à mesurer) :**

- Aucune spéciale ne rend l'arme de base **inutile** : ce sont des **fenêtres tactiques**
  (12 s de sulfateuse, 30 pressions d'éventail), pas un état permanent.
- Le joueur doit rester **≤ 30-40 % du temps de mission** sous arme spéciale (la tension
  Prohibition reste portée par l'arme de base). À mesurer.
- **Une variable à la fois** : ne toucher qu'un champ par itération, logger avant/après + pourquoi.

## 5. Acquisition, règles & HUD

### 5.1 La caisse à tirer

- Une **caisse d'armement** apparaît en **brillant** (= interactif), soit dans une fenêtre
  comme une cible (réutilise la state machine `HIDDEN→…` existante, marquée `LOOT` ≠ `ENEMY`),
  soit en conteneur glissant le long de la rue (hommage pod Contra / caisse Operation Wolf).
  **Recommandation : version fenêtre** (moins de tech neuve), conteneur glissant en variante ultérieure.
- **Tir dessus → arme équipée immédiatement** (remplace l'arme spéciale courante ; stock au plein).
- La caisse **porte le glyphe de l'arme** (picto fanzine) — le joueur sait ce qu'il prend
  **avant** de tirer (atténue le "problème de la capsule Contra").
- **Interaction avec la discrimination** (cf. `veille-concurrentielle-shooters.md` §2.1) : la
  caisse est un objet "à tirer" de plus ; son read doit être **sans ambiguïté** vs une cible
  civile/ennemie → hand-off `lead-art` (spécifier le read, pas le style).

### 5.2 Règle "une seule arme, pas de switch"

1. **Jamais** de touche/geste pour changer d'arme. Controller = viser + tirer (ADR-0015).
2. Prendre une caisse **remplace** l'arme spéciale active (le stock non consommé est **perdu**).
3. Arme de base = toujours en fond, jamais "rangée".

### 5.3 Retour à l'arme de base

1. Stock spécial à **0** → retour **automatique et immédiat** au calibre.
2. Feedback obligatoire : **son de culasse à vide + flash HUD** (le joueur ne découvre jamais
   le retour en ratant un tir).
3. _(à décider au gate)_ Perte de l'arme spéciale à la mort, façon Metal Slug — cohérent avec
   le système de vies. À confirmer `pm`.

### 5.4 HUD (le _quoi_, pas le _style_ — style = `lead-art`, layout = `ux-designer`)

1. **Arme active** — pictogramme/glyphe lisible d'un coup d'œil.
2. **Tirs restants** — compteur numérique **ou** barre/pips qui se vide (convention Metal
   Slug / Wild Guns).
3. **Alerte de fin proche** — les ~20 % derniers **clignotent** (convention arcade).
4. **Arme de base** — symbole **∞** (jamais de compteur anxiogène sur le fond).
5. Identité : HUD = artefact fanzine ; "ce qui brille est interactif" (la caisse brille).

## 6. Hand-offs (à logger dans `docs/agent-handoffs.md` après lecture du lead)

1. → `lead-game-designer` (Karim) : **gate** de ce pré-spec (extension hors guidelines) avant toute suite.
2. → `pm` (John) : **scope** — arbitrer A-D vs A-B-C ; trancher "perte d'arme à la mort".
3. → `lead-art` (Maud) : **read** de la caisse d'armement + glyphes d'arme (lisibilité vs cibles ennemies/civiles).
4. → `ux-designer` (Tony) : **layout HUD** arme active + stock + alerte, desktop **et** tactile (ADR-0003/0015).
5. → `narrative-designer` (Yasmine) : noms d'armes en fiction ("sulfateuse", "tromblon" sont des placeholders de designer, pas du lore validé).

**Si GO au gate :** formaliser en `docs/game-design/weapons.md` (spec numérotée) + playtester
les valeurs §4.2 sur le build via `verify` (mesure de `T_base`, ratio temps-sous-arme-spéciale),
une variable à la fois.

## Sources

[Wild Guns — HG101](https://hg101.kontek.net/wildguns/wildguns.htm) ·
[Wild Guns — Nintendo Life](https://www.nintendolife.com/reviews/vc/wild_guns_snes) ·
[Contra Power-up Capsule — Contra Wiki](https://contra.fandom.com/wiki/Power-up_Capsule) ·
[Spread Gun — Contra Wiki](https://contra.fandom.com/wiki/Spread_Gun) ·
[Metal Slug Weapons — Metal Slug Wiki](https://metalslug.fandom.com/wiki/Weapons) ·
[Metal Slug Weapon Stock — Metal Slug Wiki](https://metalslug.fandom.com/wiki/Weapon_Stock) ·
[Cabal — Wikipedia](<https://en.wikipedia.org/wiki/Cabal_(video_game)>) ·
[Mercs — Wikipedia](https://en.wikipedia.org/wiki/Mercs) ·
[Operation Wolf — Wikipedia](https://en.wikipedia.org/wiki/Operation_Wolf) ·
[Lethal Enforcers — Wikipedia](https://en.wikipedia.org/wiki/Lethal_Enforcers) ·
[CarnEvil — Grokipedia](https://grokipedia.com/page/CarnEvil) ·
[Crypt Killer — Wikipedia](https://en.wikipedia.org/wiki/Crypt_Killer) ·
[Elevator Action Returns — Wikipedia](https://en.wikipedia.org/wiki/Elevator_Action_Returns) ·
[Total Carnage — Wikipedia](https://en.wikipedia.org/wiki/Total_Carnage) ·
[1943 — Wikipedia](https://en.wikipedia.org/wiki/1943:_The_Battle_of_Midway) ·
[TwinBee Bell Power-Up — TwinBee Wiki](https://twinbee.fandom.com/wiki/Bell_Power-Up) ·
[Prohibition — MobyGames](https://www.mobygames.com/game/prohibition/)
