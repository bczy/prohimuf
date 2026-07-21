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

## BATCH-2 reroll [B1]-[B4] intégré (Serge TECHNICAL PASS mesurée, 2026-07-21 — DERNIER reroll du cap 2-batches)

Le batch-1 a landé les 9 PNGs ; revue Bertrand « très mal détouré » + « attention aux trous ». Serge a
**mesuré** (hole-audit / closability probe, `morphology.mjs`) : **5/9 CLEAN** (`commander_exposed`,
`_hit`, `_down`, `_weakpoint`, `_parry_windup` — les « trous » y sont du **négatif de pose légitime**,
prompts **inchangés byte-for-byte**) ; **4/9 REGEN**. Fixes ciblés (≈1 variable/prompt, tous **positifs**
→ budget négation tenu), appliqués au shard **et** aux 4 strings `levelArt.json` :

- **[B1] `commander_shielded`** — liséré clair dédié au **hem/hanche** (le trou rond du batch-1 y était
  edge-connecté, non-bridgeable). `a pale contour of light tracing the coat lower hem and hip edge`.
- **[B2] `commander_finisher`** (pire, ~14,6% troué) — **plancher de valeur des plis** sur **torse +
  cuisse** (rendus near-black au batch-1). `its torso and thigh folds a mid-charcoal, lighter than the
pitch-black backdrop` (positif, pas « no near-black »).
- **[B3] `lustre`** (~13,5% troué + orphan-drop) — value-lock **étendu à l'ARMATURE** (`the whole frame
a solid pale-to-mid grey lighter than the black backdrop`) + **guard mono-objet positif** (`one …
chandelier`, `every drop attached to the frame`).
- **[B4] `speaker_wall`** (94,3% revenu en photo outdoor) — **verrou fond-noir dominant** tôt dans le
  sujet (`on a completely flat uniform black background filling the frame`) + retrait du langage
  photo-évocateur (`from the ground up`, `scaffold` supprimés).

Comptes après batch-2 (assemblé `prompt`+`style`, tenus à la main) : shielded **117**, finisher **119**,
lustre **120**, speaker_wall **119** — 0 négation sujet, 2 assemblé, tous ≤120. Les 5 CLEAN inchangés.

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

### `commander_shielded` — SHIELDED / protégé (seed 4870) — APPLIQUÉ · **BATCH-2 [B1]**

> a towering french plainclothes commander, facing forward, bare-headed, a long knee-length
> charcoal-grey overcoat lighter than the black backdrop, a pale contour of light tracing the coat
> lower hem and hip edge, broad squared shoulders, a reflective brassard on the sleeve, a shoulder
> radio, a gloved hand in a halt gesture, the other on a holstered boxy sidearm, closed guarded stance

- `towering … commander` → masse dominante, plein pied ; distinct du buste-fenêtre.
- `bare-headed` → RULING §1 ; le tell fort (seul crâne nu du roster).
- **[B1] (batch-2, Serge TECHNICAL)** : `a pale contour of light tracing the coat lower hem and hip
edge` → le liséré clair GÉNÉRAL (`with pale edge highlights`) s'était dégradé **à ce contour
  précis** (le batch-1 a mordu un trou rond dans le tissu à la hanche/l'ourlet, edge-connecté au fond
  → non-bridgeable). Clause de contour dédiée au hem/hanche = value-separation locale forcée là où le
  détourage cassait. (Compensé : `at full height`, `flat`, `clipped at the shoulder`, `at the hip`
  trimés pour rester ≤120.)
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

> the same bare-headed french plainclothes commander on one knee, his long overcoat pooling at his
> leg, its torso and thigh folds a mid-charcoal, lighter than the pitch-black backdrop, upright from
> the waist, head up, one arm reaching up, sleeved to the wrist, the closed hand on the shoulder radio,
> calling it in, the other on his knee, straining unfinished effort, facing forward

- `on one knee` + `his long overcoat pooling at his leg` → à genou, manteau qui flaque (Estelle « one
  knee down, coat pooling »).
- **[B2] (batch-2, Serge TECHNICAL — la pire entrée du set, ~14,6% de surface trouée)** : `its torso
and thigh folds a mid-charcoal, lighter than the pitch-black backdrop` → le batch-1 a rendu les plis
  d'ombre du manteau/pantalon en **near-key-black** sur toute la **cuisse à genou** et le **torse/dos**
  (deux vrais trous à travers le tissu, exactement le risque [S7]/gate Nico « highest anatomy »). Plancher
  de valeur des plis **positif** (mid-charcoal, jamais near-black) ciblé sur ces deux zones — pas de
  négation (« lighter than », pas « no near-black », budget tenu).
- `upright from the waist, head up` → **encore en vie / en train d'essayer**, le distingue nettement
  du sprawl immobile de `down`.
- `one arm reaching up, sleeved to the wrist, the closed hand on the shoulder radio, calling it in` →
  le geste que le finisher stoppe (fiction §3.1) **+ [S7]** : `sleeved to the wrist` = manche couvre le
  bras épaule→poignet (membre épais/continu → coupe limb-detach ET thin-limb-vanish) et la **main
  fermée** supprime le gap-entre-doigts qui key-troue.
- `straining unfinished effort` → tension d'effort, **pas** douleur/mort (garde-fou de ton §3.2 ;
  sprite mono-figure = aucune arme braquée sur lui, garde-fou intrinsèquement tenu).

## C. Les 2 props de la salle — READY-FOR-STRUCTURE (n'existent PAS en JSON)

> Objets interactifs du lever 2 (décor). Identités fiction §1.2 : le **lustre** appartient au
> bâtiment (l'ancien monde), le **mur d'enceintes** appartient au crew (le son). Le prop lit **à qui
> il est** en un coup d'œil : le lustre **PEND** (HUNG), le mur est **CONSTRUIT** (BUILT). Partagent
> la tail boss (voir nuance props↔tail plus haut). Seeds SUGGÉRÉS 4877/4878 — dev-tooling pinne.
>
> **[S13] — aspect par prop (POUR dev-tooling-assets, structure).** Les 2 props ne doivent PAS hériter
> le `size` carré 256×256 du bloc figures : le **lustre = portrait** (silhouette pendante
> chaîne→pampilles), le **speaker_wall = landscape** (pyramide large au sol). Forcer le carré rétrécit
> la silhouette dans un cadre vide (résolution gâchée = pire readability au game-size final) ou invite
> FLUX à cropper/déformer. Précédent dans ce fichier : `nearForegroundArt.types` assigne un
> `size`/aspect par kind (lamppost 256×512 portrait, etc.), épinglé par son test de cohérence.
> **Appel structurel de dev-tooling** — je l'enregistre (readability que je porte), je n'invente pas le JSON.

### `lustre` — le lustre de bal (seed sugg. 4877)

Advisory Estelle : lustre cristal/verre multi-étages, armature fer forgé/laiton doré, registre
salle-de-bal 1900-30, **dégât asymétrique** (une pampille manquante, inclinaison, poussière) jamais
gravats ; silhouette cône/parapluie avec **spokes rayonnants SUGGÉRÉS** (non énumérés). PAS une
boule à facettes, PAS d'industrial-chic.

> one grand ballroom chandelier on a single chain up top, a multi-tier cone-and-umbrella wrought-iron
> armature, the whole frame a solid pale-to-mid grey lighter than the black backdrop, hung with solid
> pale grey-white crystal drops, each with a bright rim, every drop attached to the frame, two adjacent
> drops missing, a wide notch, slightly tilted and dusty, decayed 1900s grandeur, centered and fully visible

- `one grand ballroom chandelier on a single chain up top` → il **PEND** (HUNG) — lecture « au
  bâtiment », composition top-centrée ; `one … chandelier` ouvre le guard mono-objet (voir [B3]).
- `multi-tier cone-and-umbrella wrought-iron armature` → la forme cône/parapluie qui **exclut la boule
  à facettes** (mirror-ball) par la forme.
- **[B3] (batch-2, Serge TECHNICAL — ~13,5% du prop troué + un orphan-drop dupliqué)** :
  - `the whole frame a solid pale-to-mid grey lighter than the black backdrop` → **étend le value-lock
    [S8] du CRISTAL à l'ARMATURE** : le batch-1 a rendu la masse fer forgé/laiton entre étages en
    near-key-dark → « swiss-cheese » de la structure (le [S8] n'avait éclairci que les pampilles, pas le
    frame). Maintenant tout le frame est verrouillé en valeur médiane claire.
  - `one … chandelier` + `every drop attached to the frame` → **guard mono-objet POSITIF** contre
    l'artefact orphan-drop (une pampille flottante déconnectée / fil sévéré du batch-1) : un seul objet
    continu, chaque pampille restante rattachée au frame (0 négation — pas de « no duplicate »).
- `solid pale grey-white crystal drops, each with a bright rim` → **[S8]** : valeur PLEINE claire (pas
  de facette sombre qui key-troue contre le fond noir).
- `two adjacent drops missing, a wide notch` → **[S9]** : notch élargie (deux pampilles adjacentes) pour
  que le **dégât asymétrique** survive au downscale ; jamais gravats. (Cohérent avec « every drop
  attached » : les manquantes sont ABSENTES — un trou net —, les présentes toutes rattachées.)
- `decayed 1900s grandeur` → registre salle-de-bal d'époque.

### `speaker_wall` (mur d'enceintes) — le sound-system du crew (seed sugg. 4878)

Advisory Estelle : stack teknival **fait main** — caissons de basse contreplaqué + pavillons,
pyramide/mur brute, non-brandé, câbles speakon/XLR qui serpentent, gaffer, rig échafaudage/palette,
marques de crew au **pochoir** (cadeau maison). Lit **CONSTRUIT** vs le lustre **PENDU**. PAS un
line-array, PAS un DJ booth, PAS des amplis guitare.

> a hand-built teknival sound-system wall on a completely flat uniform black background filling the
> frame, a pyramid of mismatched plywood bass-bins and horns, cabinet faces flat pale grey panels with
> black outlines, the stack clearly lighter than the black ground, on a pallet rig, cables as pale grey
> lines, lighter gaffer wraps, a sprayed stencil spiral mark, chunky unbranded mass, fully visible

- **[B4] (batch-2, Serge TECHNICAL — 94,3% du canvas revenu en photo outdoor, PAS keyable)** : le
  batch-1 a rendu une **vraie photo de rig/ciel/tente en extérieur** (coins échantillonnés : bleu-ciel
  et gris-sol) au lieu du fond noir plat — FLUX tiré vers une compo documentaire par « from the ground
  up … on a scaffold ». Fix double : (1) **verrou fond-noir DOMINANT** placé tôt dans le sujet — `on a
completely flat uniform black background filling the frame` (positif, 0 négation, redouble la tail) ;
  (2) **langage photo-évocateur retiré** — `from the ground up` et `scaffold` supprimés (pallet rig
  seul garde le tell BUILT sans évoquer un chantier/festival en extérieur).
- `a pyramid of mismatched plywood bass-bins and horns` → caissons contreplaqué dépareillés + pavillons
  = **sound-system**, ce qui exclut par la forme le line-array, le DJ booth et les amplis guitare ;
  `on a pallet rig` garde le read **CONSTRUIT** (BUILT) au sol.
- `cabinet faces flat pale grey panels with black outlines, the stack clearly lighter than the black
ground` → **[S10]** : masse-sombre-continue verrouillée en valeur claire + contours (le key mord
  sinon).
- `cables as pale grey lines with lighter gaffer wraps` → **[S11]** : une ligne near-black sur fond
  near-black **disparaît** (l'inverse du trou) et perd le tell teknival — d'où la valeur claire
  explicite sur les câbles + le gaffer.
- `a sprayed stencil spiral mark` → **pochoir** (spirale Spiral-Tribe, période) rendu comme **FORME**
  sprayée, pas du texte (loi `no text`). Serge PASS-AS-IS : mush en accent de texture à taille de jeu,
  pas load-bearing (BUILT-vs-HUNG porté par la forme pyramide/palette, pas par la marque).
- `chunky unbranded mass` → non-brandé, improvisé, top-heavy.

---

## Budgets (non-lint sur `boss`, mais contrat tenu à la main)

- **Négations : 0 par sujet** (vérifié APRÈS intégration PRE-PROD sur les 9 : pas de
  `no`/`not`/`without`/`*-free` ; les clauses de valeur sont **positives** — « lighter than the black
  backdrop », jamais « never dark »/« not near-black » — précisément pour ne pas dépenser le budget ;
  `knocked-loose` et non `knocked-free`, `short of firing level` et non `not yet`, `unbranded`/
  `unfinished` ne sont pas des formes de négation). La tail partagée en porte 2 → **total assemblé =
  2**, dans le budget §3.1.
- **Assemblé (`prompt` + `style`) : 116-119 mots** après ajout des clauses de valeur/continuité
  [S1-S11] (les sujets ont été re-trimés en compensation) — bande warn si c'était lint (§3.3), mais
  `boss` n'est pas linté ; chaque clause est load-bearing (7 figures d'autorité + 2 props qui doivent
  être **non-ambigus**, différenciés ET keyables). **Tous sous le plafond dur 120** (vérifié à la main).
- **Aucune couleur/hue-néon dans les sujets** (le néon acide est render-side, convention roster
  ADR-0011). Les steers de valeur [S1/S3/S8/S10] nomment des **gris/blanc-cassé** (valeur, pas hue-
  néon) — c'est la palette que la tail elle-même déclare (« light grey white and pale … tones »), donc
  cohérent, pas une couleur bakée.

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
