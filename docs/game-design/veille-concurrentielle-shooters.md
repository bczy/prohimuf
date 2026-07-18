# Veille concurrentielle — jeux de tir sur cibles → features pour muf

> **Statut :** recherche / **pre-gate**. Ce document est une veille d'idéation, PAS une
> spec gatée. Aucune feature ici n'est actée : toute extension retenue passe le design gate
> `lead-game-designer` (Karim), le contrôle de scope `pm` (John) et le "cahier des charges
> test" (`_bmad-output/guidelines/PROJECT_GUIDELINES.md`) avant d'atteindre une spec ou un dev.
>
> **Lane :** `game-designer` (crew veille, 8 lanes parallèles). **Date :** 2026-07-18.
> **Périmètre :** tir sur cibles / light-gun / galerie / shmup / run-and-gun + emprunts
> cross-genres, toutes époques (1969→2024), tous supports (arcade / console / micro / web),
> tous pays. **Armement traité séparément :** `pre-spec-weapons.md`.

## 1. Ancre "cahier des charges" — la ligne de base Prohibition

Tout ce qui suit se mesure à l'original. **_Prohibition_ (Infogrames, FR, 1987, Atari ST)**
— lui-même dérivé du coin-op **_Empire City: 1931_** (Seibu/Taito, JP, 1986) — est une
galerie de tir : viseur baladé sur des façades larges, gangsters qui surgissent de
fenêtres/portes/toits, **duel au timer individuel** (tirer avant que la cible ne riposte),
**planque limitée** pour réinitialiser le timer, **discrimination cible/innocent**, **bonus
round** de fin de stage (timer accéléré, plus de planque), **rampe de difficulté par la
vitesse**.

**Ce que l'original n'avait pas** (⇒ toute reprise = **[EXTENSION]** consciente à
documenter) : armes multiples, scoring nuancé (headshot / justice shot), combos /
multiplicateurs, boss, couche rythme, phases véhicule, branchements, méta-progression.

Verdicts utilisés dans ce document :

- **[FIDÈLE]** — présent dans Prohibition ; implémentation sans débat.
- **[EXTENSION]** — absent de l'original, compatible boucle ; extension consciente à justifier au gate.
- **[HORS-SCOPE]** — change le genre / le controller / le périmètre prototype ; à écarter, noté pour mémoire.

Boucle cœur inchangée par toutes les propositions : **`Récupérer → Livrer → Éviter`**.
Reframe muf : la galerie oppose _menaces armées_ (descente BAC, videurs hostiles, dealers
rivaux) à _innocents_ (teufeurs, clients, le livreur civil) ; la discrimination sert
directement le `Éviter`.

---

## 2. Lignée directe — le socle (à implémenter fidèlement)

### 2.1 Discrimination de cibles (le pilier moral, cœur de muf)

| Feature                                                | Source (pays/année)                             | Verdict                                       | Note muf                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discrimination menace/innocent à la silhouette**     | Hogan's Alley (JP 84), Lethal Enforcers (JP 92) | **[FIDÈLE] — PILIER**                         | Contrat de lecture : un signe **positif & constant** (arme visible / masque) marque la cible légitime. Lethal Enforcers : ennemis **toujours masqués**, innocents **toujours à visage nu** → règle binaire apprenable. Le piège chromatique de Hogan's Alley (gangster ≈ civil en couleur) est un levier de difficulté avancé, pas de départ. |
| **Signe non-chromatique obligatoire (daltonien-safe)** | contre-ex. Hogan's Alley                        | **[EXTENSION] — PILIER accessibilité**        | Menace lisible **sans couleur** (silhouette / pose / arme). Le néon vient en renfort, jamais comme seul canal. Cible de lisibilité : trier menace/innocent en **< 0,3 s** à distance de réticule.                                                                                                                                             |
| **Pénalité graduée pour tir sur innocent**             | Operation Wolf / Lethal Enforcers / Point Blank | **[FIDÈLE]** principe, **[EXTENSION]** barème | Spectre : jauge/heat (soft, Operation Wolf) → perte de vie + rétrogradation (Lethal Enforcers) → game-over rapide (Point Blank, 5 fautes). Départ recommandé : modèle heat, sévérité Point Blank réservée au mode difficile.                                                                                                                  |
| **Le "ne pas tirer" comme objectif actif**             | Point Blank (JP 94)                             | **[EXTENSION] forte**                         | Stages "protège la cible", "descente : un client tué = livraison perdue". La retenue devient skill mesuré, pas simple interdit.                                                                                                                                                                                                               |
| **Otage / bouclier humain**                            | Lethal Enforcers, NAM-1975, Vampire Night       | **[EXTENSION]**                               | Un videur se planque derrière un raver ; fenêtre de tir étroite. Puissant mais coûteux en anim. Post-MVP.                                                                                                                                                                                                                                     |
| **Cible qui change de statut**                         | Hogan's Alley (cartons pivotants), Point Blank  | **[EXTENSION] modérée**                       | Le raveur qui sort un flingue → devient cible. Alourdit le contrat de lecture ; après maîtrise de la discrimination statique.                                                                                                                                                                                                                 |

### 2.2 Rythme, vagues, difficulté (fidèles)

- **[FIDÈLE]** Rampe par vitesse + densité + **ratio d'innocents** (le vrai durcisseur de
  discrimination) — une variable à la fois. Pop-up depuis planques multiples obligeant le
  balayage (pas le camping central). **Bonus round final** ("l'after qui se vide",
  munitions libres, score pur, sans discrimination — récompense).
- **[FIDÈLE]** **Timer-duel télégraphié** : chaque cible a sa fenêtre avant de riposter ;
  l'attaque doit être annoncée (l'ennemi lève l'arme / clignote X ms avant de tirer — cf.
  "crisis flash" de Time Crisis). Indispensable pour rendre le duel équitable à la souris.

### 2.3 Feedback visuel & game feel (transposé "fanzine N&B + néon acide")

Grammaire de feedback **d'époque** (1987-98), pas FPS moderne :

- **Impact = flash blanc bref** (1-2 frames) sur la silhouette touchée, puis pose de mort
  — hérité du Zapper (Wild Gunman / Duck Hunt), cohérent avec le "flash photocopieur".
- **Réaction de mort = cassure de silhouette nette** (bascule / chute), pas un clignotement
  — lisible à 6 fps (Virtua Cop, Hogan's Alley).
- **Screenshake multi-magnitude** (petit par tir, gros sur kill/erreur — Nuclear Throne) +
  **hitstop 60-80 ms**. ⚠️ le shake secoue la **scène**, jamais le crosshair/HUD (visée 1:1).
- **Feedback d'échec ultra-lisible** quand on touche un innocent (Duck Hunt : le chien se
  moque ; Hogan's Alley : compteur MISS) — l'apprentissage passe par un échec mémorable.
- **Précédent "N&B + une seule couleur d'accent"** : _MadWorld_ (2009) prouve qu'une teinte
  unique réservée au feedback porte la lisibilité — ne pas diluer le néon en ajoutant une
  2ᵉ couleur "impact".
- ⚠️ **Anachronismes bannis** (aucune réf. dans le corpus 1987-98) : hit-marker croix
  flottante façon FPS, kill-cam, barre de vie à dégradé, chromatic aberration "ciné" (tic
  2010s). Déjà cadré par `docs/art-direction.md` (§8.1 OUT) — la veille le confirme.

### 2.4 Contrôle & accessibilité (souris navigateur vs pistolet)

- **[EXTENSION obligatoire, cadre ADR-0015]** Souris = light-gun natif 1:1. **Clic gauche =
  tir, Espace/clic droit = planque-recharge**. Leçon Time Crisis : **jamais** de geste
  "hors-écran" (ambigu en fenêtré) — Time Crisis a précisément supprimé la recharge
  hors-écran au profit de la planque.
- **[EXTENSION]** Magnétisme de réticule minimal/nul sur desktop (la précision fait le
  skill) ; réservé au schéma tactile mobile (hitbox élargies, réticule plus gros,
  télégraphes plus longs). Paliers exposés : `télégraphe_ms`, `temps_avant_riposte`,
  `taille_reticle` pour difficulté + accessibilité.

---

## 3. Diversification — nouvelles features (champ libre, tous genres, tous univers)

Idéation dédupliquée sur 4 lanes : diversification light-gun, cross-genres (~50 jeux tous
genres), twists expérimentaux (35 idées), fiction (annexe §5). Aucune idée ci-dessous
n'existait dans Prohibition ⇒ toutes **[EXTENSION]** sauf mention. Aucune n'élargit la
boucle ; elles la _rejouent_ sous d'autres règles. Classées par potentiel
(nouveauté × faisabilité web × compatibilité galerie).

### Tier S — signature forte + faisable web + boucle intacte

1. **Tir sur le beat** — _Rez (JP 01), Child of Eden (JP 11), Crypt of the NecroDancer (CA 15)_. Tirer sur le kick techno = multiplicateur, les impacts s'intègrent au mix ; les
   **vagues se calent sur le morceau** (assaut au drop, build-up qui annonce — Space Channel
   5). Couche facultative : le casual clique librement, l'expert cale. *L'*extension la mieux
   justifiée : c'est le thème rave qui devient mécanique. Base audio Howler déjà présente.
2. **Parade de tir à fenêtre de timing** — _Sekiro (JP 19)_. Ennemi qui dégaine → flash →
   cliquer **pile sur son arme** dans la fenêtre = désarmé + jauge. Transforme `Éviter` en
   geste actif et gratifiant. Pur timing, faisabilité maximale.
3. **Quitte-ou-double sur la livraison** — _Balatro (CA 24) / push-your-luck_. Après une
   vague propre : **livrer** (encaisser sûr) ou tenir une vague de plus (multiplicateur ↑,
   tout perdu si bavure). Fait de `Livrer` un vrai choix. Zéro tech exotique.
4. **Temps-mouvement souris** — _SUPERHOT (PL 16)_. La scène n'avance que quand **le réticule
   bouge**. Δpointer → dt, trivial ; aide même la discrimination (on lit la scène posément).
   Candidat mode signature ou niveau-gimmick.
5. **Le noir stroboscopique révélé par le tir** — _Alan Wake (FI 10), écholocation_. Cave
   plongée dans le noir, chaque muzzle-flash / strobe révèle menace ou innocent une fraction
   de seconde. Un masque lumineux R3F, tension morale maximale, 100 % raccord esthétique rave.

### Tier A — forte valeur, coût modéré

6. **Boss & mini-boss** — _Time Crisis, House of the Dead_. Points faibles séquencés ("boss
   de livraison" : chef de brigade protégé, vulnérable seulement quand il ouvre le feu) ; et
   le **"fuyard"** (indic/voleur de came qui traverse la foule — s'il s'échappe, récup perdue,
   branché sur `Récupérer`).
7. **Décor interactif à double tranchant** — _House of the Dead_. Lustre / pile d'enceintes à
   faire tomber sur un groupe ; **tableau électrique** = coupe la lumière (avantage tactique
   MAIS discrimination durcie sous strobe) ; machine à fumée (couvre la récup, cache aussi une
   menace). Signature audiovisuelle 98, très "juice".
8. **Draft de "combines" entre vagues** — _Hades (US 20), Slay the Spire (US 19)_. 1 parmi 3
   modificateurs attachés à un geste (ton clic ricoche / la livraison recharge une balle / les
   flics touchés lâchent du fric). Un slot par geste. Rejouabilité, quasi zéro risque boucle.
9. **Économie de munitions survival-horror** — _Resident Evil 4 (JP 05)_. Chaque balle
   compte ; rater = danger réel ; corps-à-corps de secours quand la cible s'approche. Renforce
   le poids du tir, très "cave clandestine".
10. **Tableaux à règle changeante** — _Point Blank (JP 94)_. Micro-épreuves d'interlude : ne
    tire que X, protège Y, séquence à mémoriser, compte en tirant. Variété maximale à coût
    faible (même moteur, règle réécrite). À doser comme épices — ⚠️ scope `pm`.
11. **Ricochet / bank shot** — _Peggle (US 07) / billard_. Miroirs de club, tôles, boule à
    facettes : atteindre les cibles à couvert par rebond, sans toucher la foule. Physique 2D
    de réflexion simple, puzzle géométrique lisible.
12. **Chaos inter-niveaux + morale facturée** — _Dishonored (FR 12) + Papers, Please (US 13)_.
    Trop de morts = plus de présence policière ensuite (barrages, sniper) et fin sombre ;
    jouer propre ouvre des routes. Une éthique **facturée, jamais sermonnée** — pile dans le
    thème Prohibition. Un compteur qui module spawns et fin.
13. **Score/Time Attack + events aléatoires de vague** — **[FIDÈLE]** à l'ADN arcade de
    Prohibition, coût quasi nul, fraîcheur run après run (contrôle de police impromptu, panne
    de courant, bagarre au bar qui rebat les priorités).

### Tier B — pépites à cantonner (mode annexe / niveau-gimmick / événement signature)

- **Marquage différé + salve** (Dead Eye, Red Dead) — maintenir peint 3-5 menaces, relâcher
  chorégraphie la rafale ; le skill migre vers la planification de l'ordre.
- **Zoom tactique** (Silent Scope) — arbitrage permanent couverture rapide (risque innocent)
  ↔ précision tunnel. Molette + shader de flou.
- **Polarité couleur des cibles** (Ikaruga) — deux factions néon rose/cyan, le réticule a une
  polarité ; le _choix de cible_ devient puzzle. "Épargner l'innocent = épargner la mauvaise
  couleur".
- **Jauge de super / défouraille** (Street Fighter / Devil May Cry) — remplie par les tirs
  propres/en rythme ; pleine = "drop" (bullet-time + tir auto-lock sur la salle).
- **Combo à banque + jauge d'équilibre** (Tony Hawk) — le combo ne crédite que quand tu
  _choisis_ de le clore ; le tenir demande de ne pas rater / ne pas toucher d'innocent.
  "Je pousse ou j'encaisse ?"
- **Rembobinage limité** (Braid) — rattraper un innocent touché en remontant 2 s, à coût
  (score/temps), stock rationné. Adoucit `Éviter` → à doser fort.
- **Mode photo** (Pokémon Snap, Umurangi, Fatal Frame) — "shooter" au Polaroïd les descentes
  de police / les preuves, noté au cadrage + timing. Le recadrage conceptuel le plus fort et
  le plus "muf" (fanzine, doc de rue). Mode à part.
- **Nemesis** (Shadow of Mordor) — un flic récurrent qui s'adapte à tes habitudes (tu vises
  la tête → ils mettent des casques ; tu tardes → ils prennent des otages).
- **Défense du sound-system** (tower-defense inversé, Operation Wolf) — protéger la platine
  pendant le set ; si la barre "son" tombe, la rave s'arrête.
- **Parade rythmique call-and-response** (Space Channel 5), **lumière-arme dans le noir**
  (Alan Wake, "éclairer avant de tirer"), **déduction "qui est le flic infiltré"** (Obra
  Dinn), **auto-tir horde** (Vampire Survivors, mode "débordé" contrastant), **loot à raretés
  néon** (Diablo). Fortes en cachet, à isoler en évènements/modes signatures.

### Écartés du proto (scope / autre genre)

Co-op / versus online (**[HORS-SCOPE]** tech), sniper-scope à périphérique (change le
controller), cabal-shooter trackball, branches multi-routes coûteuses (2+ chemins à
produire), gestion inter-vagues lourde (frôle le rogue-lite — ⚠️ `pm`), logique idle /
prestige / logistique Factorio (étrangère à la galerie).

---

## 4. Recommandation d'ensemble

Paquet cohérent proposé au design gate : **l'armement complet** (`pre-spec-weapons.md`) +
**tir sur le beat** + **quitte-ou-double sur la livraison** + **parade de tir** + **décor
interactif**. Cette combinaison donne à muf une signature (rythme + morale + push-your-luck)
qu'aucun clone de galerie n'a, **sans toucher à la boucle** `Récupérer → Livrer → Éviter`.

---

## 5. Annexe — pistes diégétiques (lane fiction, matière optionnelle)

Non retenues comme socle (le lead a demandé de ne pas fonder la diversification sur la
narrative), mais compatibles si on veut habiller les features ci-dessus dans l'univers :

- **`LE SON QUI TIENT`** — chrono diégétique nuit→aube (reskin **[FIDÈLE]** du timer : le
  ciel s'éclaircit, l'aube = victoire).
- **`COUPURE DE SON`** — pic de tension audio conséquent (beat qui coupe qques s si trop de
  menaces convergent) ; s'appuie sur l'audio adaptatif prévu (PROJECT_GUIDELINES §6 : "la
  musique est le seul indicateur de tension").
- **`LA DESCENTE`** — la phase raid = le "couvre le véhicule" de Prohibition **inversé**
  (couvrir le départ du matos).
- **`LA FOULE QUI DANSE`** — innocents mobiles denses (discrimination dynamique) ; ⚠️ ton à
  cadrer `pm`/lead (ne jamais donner l'impression de "tirer dans la foule").
- **`LE RÉSEAU`** — contacts & réputation entre missions ; **déjà dans le scope canon**
  (PROJECT_GUIDELINES §7/§8), donc activation plutôt qu'extension.
- ⚠️ **NON recommandé** : l'économie de la came comme monnaie d'upgrade. Le canon (README) est
  clair : Muf livre _matériel son, flyers, groupes électrogènes_ — la monnaie de progression
  reste **logistique** (essence, réparer le van, caisses de son), jamais un trafic glorifié.

---

## 6. Hand-offs (à logger dans `docs/agent-handoffs.md` après lecture par le lead)

1. → `lead-game-designer` (Karim) : **gate** sur les features retenues (toutes hors
   guidelines) avant toute spec.
2. → `pm` (John) : **contrôle de scope** — arbitrer le sous-ensemble Tier S/A ; trancher les
   flags de ton (foule, économie logistique vs came).
3. → `lead-art` (Maud) : **read** de la discrimination menace/innocent (< 0,3 s, sans
   couleur), du strobe/fumée, de la foule.
4. → `narrative-designer` (Yasmine) : fiction des boss / branches si retenues.
5. → `sound-designer` : horloge musicale (Howler) pour "tir sur le beat" / vagues au drop.

---

## Sources

**Lignée directe & light-gun :**
[Prohibition — MobyGames](https://www.mobygames.com/game/prohibition/) ·
[Empire City 1931 / Dead Angle — Wikipedia](https://en.wikipedia.org/wiki/Dead_Angle) ·
[Hogan's Alley — Wikipedia](<https://en.wikipedia.org/wiki/Hogan's_Alley_(video_game)>) ·
[Lethal Enforcers — Konami Wiki](https://konami.fandom.com/wiki/Lethal_Enforcers) ·
[Virtua Cop — Wikipedia](https://en.wikipedia.org/wiki/Virtua_Cop) ·
[Time Crisis — Wikipedia](<https://en.wikipedia.org/wiki/Time_Crisis_(video_game)>) ·
[Point Blank — Wikipedia](<https://en.wikipedia.org/wiki/Point_Blank_(video_game_series)>) ·
[Operation Wolf — Wikipedia](https://en.wikipedia.org/wiki/Operation_Wolf) ·
[Silent Scope — Wikipedia](<https://en.wikipedia.org/wiki/Silent_Scope_(video_game)>) ·
[House of the Dead branching — Fandom](https://thehouseofthedead.fandom.com/wiki/Branching_paths) ·
[Carnival — Wikipedia](<https://en.wikipedia.org/wiki/Carnival_(video_game)>)

**Taxonomie large & shmups :**
[Gradius — Wikipedia](https://en.wikipedia.org/wiki/Gradius) ·
[Ikaruga — Wikipedia](https://en.wikipedia.org/wiki/Ikaruga) ·
[Missile Command — Wikipedia](https://en.wikipedia.org/wiki/Missile_Command) ·
[Robotron: 2084 — Wikipedia](https://en.wikipedia.org/wiki/Robotron:_2084) ·
[Metal Slug — Wikipedia](https://en.wikipedia.org/wiki/Metal_Slug) ·
[DonPachi (chaining/rank) — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/DonPachi)

**Feedback & game feel :**
[MadWorld — Wikipedia](https://en.wikipedia.org/wiki/MadWorld) ·
[Duck Hunt gun — SlashGear](https://www.slashgear.com/1215870/this-is-how-the-duck-hunt-gun-actually-worked/) ·
[The Art of Screenshake (game feel)](https://valdemird.com/blog/game-feel-on-the-web/)

**Diversification & cross-genres :**
[Rez](<https://en.wikipedia.org/wiki/Rez_(video_game)>) ·
[Child of Eden](https://en.wikipedia.org/wiki/Child_of_Eden) ·
[Space Channel 5](https://en.wikipedia.org/wiki/Space_Channel_5) ·
[Crypt of the NecroDancer](https://en.wikipedia.org/wiki/Crypt_of_the_NecroDancer) ·
[SUPERHOT](https://en.wikipedia.org/wiki/Superhot) ·
[Sekiro Deflection — Fextralife](https://sekiroshadowsdietwice.wiki.fextralife.com/Deflection) ·
[Hades Boons — Fandom](https://hades.fandom.com/wiki/Boons) ·
[Slay the Spire](https://en.wikipedia.org/wiki/Slay_the_Spire) ·
[Balatro — Armchair Arcade](https://armchairarcade.com/perspectives/2026/05/20/balatro-game-review-why-is-it-so-addictive/) ·
[Alan Wake Flashlight — Fandom](https://alanwake.fandom.com/wiki/Flashlight) ·
[RE4 Mercenaries — RE Wiki](<https://residentevil.fandom.com/wiki/The_Mercenaries_(RE4)>) ·
[Peggle — Wikipedia](https://en.wikipedia.org/wiki/Peggle) ·
[Immersive sim — Wikipedia](https://en.wikipedia.org/wiki/Immersive_sim) ·
[Papers, Please — Wikipedia](https://en.wikipedia.org/wiki/Papers,_Please) ·
[Return of the Obra Dinn — Wikipedia](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn) ·
[Vampire Survivors — Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors)
