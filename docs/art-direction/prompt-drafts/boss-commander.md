# Prompt drafts — famille `boss` : « le Commandant » + les deux props de la salle

Craft per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md). Sujet : l'antagoniste
capstone de la feature QTE boss + les deux objets interactifs de la salle (lever 2 décor).
Fiches : [`spec-boss-encounter-fiction.md`](../../game-design/spec-boss-encounter-fiction.md) §2,
[`spec-boss-differentiation-fiction.md`](../../game-design/spec-boss-differentiation-fiction.md)
§1/§3/§5, mécaniques dans
[`spec-boss-qte-differentiation.md`](../../game-design/spec-boss-qte-differentiation.md).
**Statut : DRAFT — game-graphist PRE-PROD PASS INTÉGRÉE (Serge, 2026-07-20, 9/9
PASS-WITH-CORRECTION) ; lead-art PROMPT GATE requis avant tout commit/génération.**

## PRE-PROD corrections intégrées (Serge, game-graphist, 2026-07-20)

Toutes value-language + continuité, **aucune ne change le sujet/silhouette** (les poses sont
intactes). Résout le piège keying « dark clothing eaten by the near-black key » (art-direction §2).

- **[S1] (les 7 figures)** — le « dark overcoat » contredisait la tail « light grey white and pale
  neon tones ». Le manteau est maintenant steeré en **valeur médiane keyable dans le SUJET** :
  `charcoal-grey … lighter than the black backdrop` (+ pale edge highlights sur la pose
  établissante), jamais near-black. **Phrasé positif** (« lighter than », pas « never dark ») → 0
  négation.
- **[S2] exposed** — clause lining sur le pan ouvert : `flaring open to reveal a pale contrasting
grey lining` (le pan sombre ouvert = trou-torse keyé sinon).
- **[S3] down (priorité)** — la masse manteau étalée est le plus gros risque de trou : valeur
  explicite `mid-grey fabric lighter than the pitch-black ground and traced by a thin pale contour`.
- **[S4] hit** — tether stroke : `both still tethered to him by a strap and cord` (brassard/radio
  arrachés lisent « FROM him », pas débris flottant → évite un faux-positif du defect-sweep).
- **[S6] parry_windup (priorité, mécanique-critique)** — `the long coat still hanging closed`
  verrouille le contraste de silhouette dans le prompt, pour **ne pas** converger avec l'enveloppe
  ouverte/flared d'exposed (§3-C « a shared tell = a bullshit whiff »).
- **[S7] finisher (priorité)** — continuité de membre + main fermée : `the coat sleeve covering it
to the wrist` (membre épais/continu, coupe le risque limb-detach + thin-limb-vanish) + `the closed
hand on the shoulder radio` (supprime le gap-entre-doigts qui key-troue).
- **[S8]/[S9] lustre** — cristal en valeur pleine claire : `solid pale grey-white faceted crystal
drops, each with a bright rim highlight` (pas de facettes sombres qui key-trouent) ; notch de dégât
  élargie `two adjacent drops missing on one side, a wide notch` (lisible à taille de jeu).
- **[S10]/[S11] speaker_wall** — verrou valeur/contour sur la grande masse : `cabinet faces flat pale
grey panels with black contours, the stack lighter than the black backdrop` ; câbles clairs :
  `cables as pale grey lines with lighter gaffer wraps` (une ligne near-black sur fond near-black
  disparaît sinon).
- **[S13] (pour dev-tooling-assets, structure)** — les 2 props ne doivent PAS hériter le `size`
  carré 256×256 du bloc figures : `lustre` = **portrait** (silhouette pendante chaîne→pampilles),
  `speaker_wall` = **landscape** (pyramide large au sol). Précédent : `nearForegroundArt.types`
  assigne un `size`/aspect par kind, épinglé par son test de cohérence. **Appel structurel de
  dev-tooling** ; je l'enregistre ici (readability-at-game-size que je porte), je n'invente pas le JSON.
- **Deviations Maud CONFIRMÉES par Serge** (POLICE-en-forme + « figure » dans la tail props) : gardées
  telles quelles ; la 2ᵉ devient un check prop-specific du defect-sweep de sa passe TECHNIQUE (si une
  silhouette humaine incidente bleed dans un prop → trigger du fallback tail roster-wide, pas un fork).

## Binding ruling — RULING (1) bare-headed plainclothes-BAC (lead-art, Nico, 2026-07-20)

**PAS de casquette à visière. Le Commandant est tête nue.** ADN partagé sur les **7 figures
humaines**. La lecture « chef » repose sur : **long pardessus jusqu'aux genoux** (unique dans le
roster), **stature + épaules carrées**, et — remplaçant la casquette comme micro-tell d'autorité —
un **brassard réfléchissant** sur la manche + une **radio/mic clipsée à l'épaule**. Les beats de
défaite (hit/down) se re-clé sur **brassard arraché / radio délogée / pistolet lâché**, jamais sur
une casquette qui saute (il n'y en a plus). Advisory `art-advisor` (Estelle) intégrée ci-dessous.

## Décision de structure — bloc `boss` séparé, pas `enemies.types` (inchangée)

Le Commandant est une **figure de QTE cinématique**, pas un archétype qui pop aux fenêtres.
`levelArt.consistency.test.ts` interdit toute clé de `enemies.types` non dérivée de `ARCHETYPES` ;
lui ajouter un archétype serait du code gameplay (hors lane) et le ferait pop comme un mook.
Précédent : le bloc `hostages` (ADR-0030) vit **à côté** de `enemies`. Le bloc `boss` suit ce
patron : sibling de `enemies`/`hostages`, non couvert par `check-art-prompts.mjs` (qui ne connaît
que vehicles/enemies/courier/levels/nearForeground) — **le contrat est donc tenu à la main ici**
(≤2 négations assemblées, langage de forme positif, sujet-seul, pas de couleur/hue bakée).

> **Structure = propriété `dev-tooling-assets`.** Noms de bloc/clés, `asset`, `size`, seeds pinnés,
> l'anchor `muzzle` d'EXPOSED et un futur anchor `parryPoint` (bras armé) sont un scaffolding
> calqué sur `hostages`. Moi (concept-artist) je porte **les strings `prompt` + `style`**, rien
> d'autre. Les clés proposées ci-dessous (`commander_weakpoint`, `commander_parry_windup`,
> `commander_finisher`, `lustre`, `speaker_wall`) sont **SUGGÉRÉES** — dev-tooling tranche.

## Style tail — factorisée UNE fois, VERBATIM du roster live (`enemies.style`/`hostages.style`)

Family consistency (art-direction.md §2 loi 2) : le boss est un membre du roster police, le tableau
final est **une seule impression**. Le roster live porte encore la tail SNES ; la direction pochoir
validée n'est **pas encore appliquée** à `levelArt.json` (bloquée keying). Forker une tail pour le
seul boss violerait §2 loi 2. **Décision : copier la tail live verbatim ; le boss migre pochoir EN
LOCKSTEP avec tout le roster.** Cette tail est appendée **verbatim** aux 9 sujets ci-dessous.

```
, 16-bit pixel art game sprite on a solid uniform matte black background (#000000) filling the
whole frame edge to edge, the same flat black filling every space between the figure's limbs and
gear, crisp clean pixels, light grey white and pale neon tones figure, simple bold shapes,
centered, high contrast, retro snes style, no text, no watermark
```

> **Nuance props ↔ tail (flag pour le gate).** La tail dit « the figure's limbs and gear » / « tones
> figure » — vocabulaire figure. Les deux props (`lustre`, `speaker_wall`) l'héritent : neutre pour
> FLUX (il ne keye que sur le fond noir + medium pixel + tons gris/blanc/néon-pâle + centered, tous
> valables pour un objet). **On NE forke PAS** une tail-prop (violerait §2 loi 2 : le tableau est une
> impression). Si lead-art préfère généraliser « figure » → « figure or object » sur toute la tail
> boss, c'est un changement de tail **roster-wide**, pas un fork local — à trancher au gate.

## ADN de silhouette partagé (bare-headed) — le « chef » lisible en < 0,3 s sans couleur

Un seul personnage à travers les 7 poses, distinct du roster **par la forme seule** :

- **Long pardessus/gabardine jusqu'aux genoux** — LE tell « chef » n°1, sans couleur ; verrouille le
  contraste avec la veste-hanche du mook et l'armure/bouclier du CRS `enemy_riot`.
- **Tête nue** — le **seul crâne découvert** d'un roster sinon uniformément casqué/casquetté
  (mook = casquette plate, `enemy_riot` = casque, `enemy_biker` = casque intégral). Différenciateur
  **plus fort** que la casquette (RULING §1) : tête nue + manteau long contraste plus dur que
  casquette + manteau.
- **Brassard réfléchissant** sur une manche + **radio boxy clipsée à l'épaule** — les micro-tells
  d'autorité plainclothes-BAC qui remplacent la casquette ; la radio pose aussi le finisher (main qui
  remonte vers elle).
- **Stature dominante, plein pied, épaules carrées** — masse > piétaille (spec §4.1).
- **Sidearm boxy générique d'époque** (silhouette MAC-50/MR73-class), **jamais nommé, jamais
  moderne** (pas de Glock/polymère) — contrainte fiche §3.7 + advisory Estelle.

### Déviation consciente vs advisory Estelle — le lettrage « POLICE »

Estelle demande « reversible-lining POLICE reflective lettering ». **Je rends le panneau/brassard
réfléchissant comme une FORME lumineuse, PAS comme des glyphes « POLICE ».** Raison : (1) la tail
partagée porte `no text` (loi maison §3.8 : une illustration de fanzine, pas de typo) ; (2) FLUX-
schnell rend le texte en glyphes charcutés, illisibles à 256 px et défaut de génération = FAIL de
set (§2 loi 3). Le **brassard large + un pan réfléchissant** portent la lecture « flic en civil » par
la silhouette seule ; le mot littéral ne survit pas au game-size de toute façon. → à confirmer au
gate ; si lead-art veut tenter le lettrage, c'est un amendement conscient de la loi `no text`.

---

# LES 9 ENTRÉES

Vue de face (le boss tire « vers le viewer », comme `enemy_hostage`/`enemy_riot`). Chaque `prompt`
= **sujet + silhouette SEULEMENT** ; fond/medium/no-text/centered viennent de la tail partagée.
0 négation par sujet (la tail en porte 2 : `no text, no watermark` → total assemblé = 2, dans le
budget §3.1). Continuité `the same … commander` = recolle les poses (utile pour un futur kontext lock).

## A. Les 4 poses V1 redraftées (EXISTENT dans levelArt.json — APPLIQUÉES)

### `commander_shielded` — SHIELDED / protégé (seed 4870) — APPLIQUÉ

> a towering french plainclothes commander at full height, facing forward, bare-headed, a long
> knee-length charcoal-grey overcoat with pale edge highlights, lighter than the black backdrop, broad
> squared shoulders, a reflective brassard on the sleeve, a radio clipped at the shoulder, a gloved
> hand flat in a halt gesture, the other on a holstered boxy sidearm at the hip, closed guarded stance

- `towering … at full height` → masse dominante, plein pied ; distinct du buste-fenêtre.
- `bare-headed` → RULING §1 ; le tell fort (seul crâne nu du roster).
- `long knee-length charcoal-grey overcoat with pale edge highlights, lighter than the black
backdrop` → LE tell « chef » sans couleur, **+ [S1]** : valeur médiane keyable (jamais near-black),
  résout la contradiction avec la tail « light grey … tones ».
- `reflective armband brassard` + `boxy radio clipped at the shoulder` → micro-tells d'autorité
  plainclothes-BAC qui **remplacent** la casquette (RULING §1) ; la radio pose le finisher.
- `one gloved hand raised flat in a halt-and-hold gesture` → « il commande / ne tire pas » = SHIELDED,
  et ferme la silhouette.
- `the other hand resting on a holstered boxy sidearm` → arme présente mais NON présentée = pas la
  fenêtre atteignable. **Réconciliation fiche ↔ SHIELDED** : pas de bouclier CRS (interdit fiche) ;
  la protection = posture fermée + arme au holster. Contraste net avec EXPOSED ouvert.
- `closed guarded upright stance` → ancre le contraste avec le lunge ouvert d'EXPOSED.

### `commander_exposed` — EXPOSED phase-1 / à découvert, tire (seed 4871) — APPLIQUÉ

> the same towering bare-headed french plainclothes commander in his long knee-length charcoal-grey
> overcoat, reflective armband and shoulder radio, lunging one stride forward into the open, both arms
> thrust forward presenting a boxy service pistol straight at the viewer, big bright muzzle flash, the
> long coat flaring open to reveal a pale contrasting grey lining, aggressive firing stance, facing forward

- `in his long knee-length charcoal-grey overcoat` → **[S1]** valeur médiane keyable (continuité DNA).
- `reflective armband and shoulder radio` → ADN compact re-cité (continuité).
- `lunging one stride forward into the open` → EXPOSED = il quitte le couvert = la seule fenêtre.
- `both arms thrust forward presenting a boxy service pistol … big bright muzzle flash` → calque
  `enemy_shooting` ; frame dangereuse **et** atteignable (anchor `muzzle` tuné au gate).
- `the long coat flaring open to reveal a pale contrasting grey lining` → silhouette OUVERTE (contraste
  net avec SHIELDED fermé) **+ [S2]** : le pan ouvert reçoit une valeur claire pour ne pas devenir un
  trou-torse keyé (le pan sombre ouvert sur fond near-black = grande zone que le keyer prend pour le fond).
- **Sert la phase-1 (mono-ring).** La phase-2+ (deux rings) utilise `commander_weakpoint` (ci-dessous)
  — bras étendus-présentés ici **occultent la bande torse**, inutilisable comme canvas deux-bandes.

### `commander_hit` — touché (seed 4872) — APPLIQUÉ · **re-clé RULING §1**

> the same towering bare-headed french plainclothes commander in his long knee-length charcoal-grey
> overcoat, staggered back by a bullet, torso recoiling and head snapping back, the reflective brassard
> torn loose and flapping from his sleeve, the shoulder radio knocked spinning off its clip, both still
> tethered to him by a strap and cord, the pistol arm falling loose, reeling off-balance, facing forward

- `staggered back … torso recoiling and head snapping back` → lecture « touché » claire.
- `the reflective brassard torn loose … the shoulder radio knocked spinning off its clip` →
  **le beat d'autorité défaite re-clé sur brassard + radio** au lieu d'une casquette qui saute
  (RULING §1 mandaté). Deux tells lisibles à taille de jeu.
- `both still tethered to him by a strap and cord` → **[S4]** : le brassard/radio arrachés lisent
  « coming loose FROM him » et non débris flottant — évite aussi un faux-positif du defect-sweep
  (objet flottant = suspicion de trou de génération). `charcoal-grey overcoat` = **[S1]**.
- `the pistol arm falling loose` → blessé, ne tire plus.

### `commander_down` — à terre / vaincu (seed 4873) — APPLIQUÉ · **re-clé RULING §1**

> the same towering bare-headed french plainclothes commander defeated and fallen, sprawled on his
> back flat on the ground, his long overcoat splayed around him in mid-grey fabric lighter than the
> pitch-black ground and traced by a thin pale contour, the torn brassard and knocked-loose shoulder
> radio lying beside him, a boxy service pistol dropped from his open hand, a motionless heap

- `sprawled on his back flat on the ground` → à terre / vaincu, posé lisible sur fond noir.
- `his long overcoat splayed around him in mid-grey fabric lighter than the pitch-black ground and
traced by a thin pale contour` → garde le manteau signature **+ [S3] (priorité)** : la plus grande
  masse sombre continue du set, couchée à plat contre le fond noir sans arête verticale pour accrocher
  un liseré ; valeur médiane + contour pâle explicites empêchent qu'elle soit avalée en entier (ce qui
  tuerait le seul rôle de la pose : un tas lisible au sol).
- `the torn brassard and knocked-loose shoulder radio lying … beside him` → l'autorité défaite
  **re-clé sur brassard + radio** (RULING §1), plus le `service pistol dropped` (déjà là).
  (`knocked-loose`, pas `knocked-free` : `-free` déclencherait le détecteur de négation.)
- **Distinct du finisher** : ici il est **immobile, sur le dos** = déjà vaincu ; le finisher le montre
  **sur un genou, tête haute, encore en train d'essayer**.

## B. Les 3 nouvelles poses humaines — READY-FOR-STRUCTURE (n'existent PAS en JSON)

> dev-tooling-assets ajoute les entrées JSON (clés/asset/seed/size + anchors). Strings ci-dessous
> prêtes. Seeds SUGGÉRÉS 4874/4875/4876 (continuent la série boss) — dev-tooling pinne.

### `commander_weakpoint` — DUAL WEAK-POINT / EXPOSED phase-2+ deux-rings (seed sugg. 4874)

**Pourquoi une pose distincte, PAS un fold dans `exposed` :** lever 1 (spec §1-A/C) fait apparaître
en phase 2+ **deux rings simultanés** — VITAL (bande tête) + LIMB (bande torse). Les rings sont
dessinés render-side ; le sprite doit offrir **les deux bandes anatomiques dégagées** pour un
placement honnête (color-honesty §1-A). Le pose `exposed` (bras étendus présentant le pistolet +
lunge) **occulte la bande torse et incline la tête** → inutilisable comme canvas deux-bandes. Donc
pose propre : **carrée, frontale, immobile, arme dégagée des bandes.** Advisory Estelle : « chin up,
head exposed, torso squared frontal, NOTHING occluding head or torso bands ; the render rings do the
callout, the sprite only keeps both bands clean ; Prohibition-ST window-enemy grammar : frontal,
still, readable. »

> the same towering bare-headed french plainclothes commander in his long knee-length mid-grey
> charcoal overcoat clearly lighter than the black backdrop, reflective armband and shoulder radio,
> square and still facing forward, chin lifted and head fully clear, torso squared flat to the viewer,
> both arms held out wide, a boxy service pistol low in one hand, clear of the chest, frontal readable stance

- `square and still facing forward` → grammaire fenêtre Prohibition-ST : frontal, immobile, lisible.
- `chin lifted and head fully clear` → **bande VITAL (tête) dégagée** pour le ring tête.
- `torso squared flat to the viewer` + `both arms held out wide` → **bande LIMB (torse) dégagée** ;
  rien (bras/revers/holster) n'occulte les bandes (discipline de négatif Estelle).
- `mid-grey charcoal overcoat clearly lighter than the black backdrop` → **[S1]** — compte **plus**
  ici (Serge) : les rings render-side se posent DIRECTEMENT sur ces valeurs ; une valeur de manteau
  ambiguë sous le ring LIMB est pire que sur une pose statique. La tête nue value-sépare naturellement
  du manteau (peau pâle vs masse), ce qui renforce la lecture deux-bandes (Serge PASS-AS-IS là-dessus).
- `a boxy service pistol low in one hand, clear of the chest` → silhouette d'arme **conservée partout**
  (jamais un tell melee), mais tenue basse hors de la bande torse.

### `commander_parry_windup` — PARRY / charged windup (seed sugg. 4875)

**Pourquoi une pose distincte, PAS un fold dans `exposed` :** lever 3 (spec §3-C) **EXIGE** un tell
**catégoriquement distinct** du tell de fenêtre EXPOSED normale, lu **avant** de s'engager — un tell
partagé = « bullshit whiff ». La parade = tirer **sur l'arme qui se lève** (fiction §4). Advisory
Estelle : « pull the moment EARLIER than commander_exposed — elbows bent, pistol angled up not yet
presented, shoulders hunched loading the swing ; arms-drawn-IN vs exposed's arms-EXTENDED is the
sub-half-second read ; firearm silhouette throughout, never a melee tell. »

> the same towering bare-headed french plainclothes commander in his long knee-length charcoal-grey
> overcoat clearly lighter than the black backdrop, the long coat still hanging closed, reflective
> armband, shoulder radio, coiled a beat before firing, elbows drawn in tight, a boxy service pistol
> gripped two-handed, angled steeply upward mid-raise, short of firing level, shoulders hunched, tense
> wound-up crouch, facing forward

- `coiled a beat before firing` → le moment **plus tôt** qu'EXPOSED.
- `the long coat still hanging closed` → **[S6] (priorité, mécanique-critique)** : verrouille le
  contraste de silhouette DANS le prompt pour ne pas converger vers l'enveloppe ouverte/flared
  d'`exposed` (le voisinage `overcoat`+`firing` pousse FLUX vers « flaring open » sinon) — §3-C « a
  shared tell = a bullshit whiff ». **`charcoal-grey … lighter than the black backdrop`** = [S1].
- `elbows drawn in tight` → **bras rentrés** (le read sub-0,5 s vs bras étendus d'EXPOSED) — le
  contraste catégorique que §3-C exige.
- `a boxy service pistol gripped two-handed, angled steeply upward mid-raise, short of firing level`
  → **arme qui se lève, pas encore présentée** = le point de parade (fiction « on tire sur le
  flingue ») ; silhouette d'arme conservée, **jamais un tell melee** (`short of firing level` =
  phrasé positif, 0 négation).
- `shoulders hunched, tense wound-up crouch` → charge le swing (le « charged window »).

### `commander_finisher` — COUP DE GRÂCE / kneeling still-trying (seed sugg. 4876)

**Pourquoi distinct de `down` :** lever 5 (spec §5-A, fiction §3.1) = **down-but-not-finished**, sur
un genou, une main remonte vers la radio/mic pour faire couper le son ailleurs ; le finisher stoppe
ce geste. Doit lire **encore en train d'essayer**, PAS déjà mort (`down` = ça). **Garde-fou de ton
(fiction §3.2, binding sur le dessin) :** pas de sang, pas de grimace de douleur, aucune arme braquée
sur lui — livraison, pas exécution. Sprite mono-figure → aucun agresseur/arme dans le cadre, le
garde-fou est intrinsèquement tenu ; je décris positivement (main qui remonte, main qui prend appui,
tête haute).

> the same bare-headed french plainclothes commander down on one knee, his long charcoal-grey
> overcoat, lighter than the black ground, pooling at his bent leg, upright from the waist, head up,
> one arm reaching up, its coat sleeve covering it to the wrist, the closed hand on the shoulder radio,
> calling it in, the other on his knee, straining unfinished effort, facing forward

- `down on one knee` + `his long charcoal-grey overcoat … pooling at his bent leg` → à genou, manteau
  qui flaque (Estelle « one knee down, coat pooling ») ; **`lighter than the black ground`** = [S1].
- `upright from the waist, head up` → **encore en vie / en train d'essayer**, le distingue nettement
  du sprawl immobile de `down`.
- `one arm reaching up, its coat sleeve covering it to the wrist, the closed hand on the shoulder
radio, calling it in` → le geste que le finisher stoppe (fiction §3.1) **+ [S7] (priorité)** : la
  manche couvre le bras épaule→poignet (membre épais/continu → coupe le risque limb-detach ET
  thin-limb-vanish à taille de jeu) et la **main fermée** sur la radio supprime le gap-entre-doigts
  qui key-troue. (Passe TECHNIQUE de Serge = defect-sweep anatomie obligatoire sur cette entrée.)
- `straining unfinished effort` → tension d'effort, **pas** douleur/mort (garde-fou de ton §3.2 ;
  sprite mono-figure = aucune arme braquée sur lui, garde-fou intrinsèquement tenu).

## C. Les 2 props de la salle — READY-FOR-STRUCTURE (n'existent PAS en JSON)

> Objets interactifs du lever 2 (décor). Identités fiction §1.2 : le **lustre** appartient au
> bâtiment (l'ancien monde), le **mur d'enceintes** appartient au crew (le son). Le prop lit **à qui
> il est** en un coup d'œil : le lustre **PEND** (HUNG), le mur est **CONSTRUIT** (BUILT). Partagent
> la tail boss (voir nuance props↔tail plus haut). Seeds SUGGÉRÉS 4877/4878 — dev-tooling pinne.

### `lustre` — le lustre de bal (seed sugg. 4877)

Advisory Estelle : lustre cristal/verre multi-étages, armature fer forgé/laiton doré, registre
salle-de-bal 1900-30, **dégât asymétrique** (une pampille manquante, inclinaison, poussière) jamais
gravats ; silhouette cône/parapluie avec **spokes rayonnants SUGGÉRÉS** (non énumérés). PAS une
boule à facettes, PAS d'industrial-chic.

> a grand ballroom chandelier hung from a single chain up top, a multi-tier cone-and-umbrella stack of
> crystal-drop rings, an ornate wrought-iron and brass armature with suggested arms, solid pale
> grey-white faceted crystal drops, each with a bright rim highlight, two adjacent drops missing on one
> side, a wide notch, hanging slightly tilted and dust-dulled, decayed 1900s grandeur, centered and fully visible

- `hung from a single chain up top` → il **PEND** (HUNG) — lecture « au bâtiment », composition top-centrée.
- `multi-tier cone-and-umbrella stack of crystal-drop rings` → la forme cône/parapluie qui **exclut la
  boule à facettes** (mirror-ball) par la forme, pas par négation.
- `ornate wrought-iron and brass armature with suggested arms` → armature ornée qui exclut
  l'industrial-chic ; **arms suggérés, non énumérés** (Estelle ; Serge PASS-AS-IS : linework tier/arms
  ornemental, la lecture porte sur cône + chaîne + tilt + dust).
- `solid pale grey-white faceted crystal drops, each with a bright rim highlight` → **[S8]** : valeur
  PLEINE claire (remplace « strings of faceted glass droplets ») — aucune facette à valeur sombre qui
  tomberait dans la plage near-black et se ferait key-trouer contre le fond noir (le keyer confondrait
  ces trous avec le SEUL dégât voulu).
- `two adjacent drops missing on one side, a wide notch` → **[S9]** : notch élargie (deux pampilles
  adjacentes) pour que le **dégât asymétrique** survive au downscale à taille de jeu, pas seulement en
  256px pleine résolution ; jamais gravats.
- `decayed 1900s grandeur` → registre salle-de-bal d'époque.

### `speaker_wall` (mur d'enceintes) — le sound-system du crew (seed sugg. 4878)

Advisory Estelle : stack teknival **fait main** — caissons de basse contreplaqué + pavillons,
pyramide/mur brute, non-brandé, câbles speakon/XLR qui serpentent, gaffer, rig échafaudage/palette,
marques de crew au **pochoir** (cadeau maison). Lit **CONSTRUIT** vs le lustre **PENDU**. PAS un
line-array, PAS un DJ booth, PAS des amplis guitare.

> a hand-built teknival sound-system wall from the ground up, a pyramid of mismatched plywood bass-bins
> and horn cabinets, cabinet faces flat pale grey panels with black contours, the stack lighter than
> the black backdrop, on a scaffold and pallet rig, cables as pale grey lines with lighter gaffer wraps,
> a sprayed stencil spiral mark, chunky unbranded mass, centered and fully visible

- `from the ground up … on a scaffold and pallet rig` → il est **CONSTRUIT** (BUILT) — lecture « au
  crew », par le sol, pas suspendu.
- `a pyramid of mismatched plywood bass-bins and horn cabinets` → caissons contreplaqué dépareillés +
  pavillons = **sound-system**, ce qui exclut par la forme le line-array (arrays lisses suspendus), le
  DJ booth et les amplis guitare.
- `cabinet faces flat pale grey panels with black contours, the stack lighter than the black backdrop`
  → **[S10]** : le plus gros risque de masse-sombre-continue du set (contreplaqué brut → gris moyen-
  sombre, touche le fond noir sur plusieurs arêtes). Valeur claire + contours noirs explicites
  verrouillent la silhouette contre le key.
- `cables as pale grey lines with lighter gaffer wraps` → **[S11]** : une ligne near-black sur fond
  near-black **disparaît** (l'inverse du trou) et perd le tell teknival — d'où la valeur claire
  explicite sur les câbles + le gaffer.
- `a sprayed stencil spiral mark` → **pochoir** (spirale Spiral-Tribe, période) rendu comme **FORME**
  sprayée, pas du texte (loi `no text`). Serge PASS-AS-IS : mush en accent de texture à taille de jeu,
  pas load-bearing (BUILT-vs-HUNG porté par la forme pyramide/palette, pas par la marque).
- `chunky unbranded mass` → non-brandé, improvisé, top-heavy.

---

## Budgets (non-lint sur `boss`, mais contrat tenu à la main)

- **Négations : 0 par sujet** (vérifié : pas de `no`/`not`/`without`/`*-free` ; `knocked-loose` et
  non `knocked-free`, `still short of` et non `not yet`, `unobscured`/`unfinished`/`unbranded` ne sont
  pas des formes de négation). La tail partagée en porte 2 → **total assemblé = 2**, dans le budget
  §3.1.
- **Assemblé (`prompt` + `style`) : ~105-115 mots** — bande warn si c'était lint (§3.3), mais `boss`
  n'est pas linté ; chaque clause est load-bearing (7 figures d'autorité + 2 props qui doivent être
  **non-ambigus** et différenciés). Sous le plafond dur 120.
- **Aucune couleur/hue dans les sujets** (le néon acide est render-side, convention roster ADR-0011).

## Reste à trancher par le gate (game-graphist PRE-PROD → lead-art PROMPT GATE)

1. **PASS / corrections** sur les 9 sujets (7 figures bare-headed + 2 props).
2. **Déviation lettrage « POLICE »** : brassard/panneau réfléchissant rendu **en forme** (pas de
   glyphes) — confirmer, ou amender la loi `no text` sciemment.
3. **Nuance props ↔ tail** : « figure » hérité dans la tail partagée pour les props — garder tel quel
   (Family consistency) ou généraliser « figure » → « figure or object » **roster-wide** ?
4. **Timing de direction de style** : boss (+props) en tail SNES live maintenant → migre pochoir en
   lockstep avec le roster (inchangé du V1).
5. **Anchors render-side** (dev-tooling, pas moi) : `muzzle` sur `commander_exposed`, `parryPoint`
   (bras armé) sur `commander_parry_windup`, deux rings (VITAL/LIMB) sur `commander_weakpoint`.
