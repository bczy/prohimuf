# Prompt drafts — famille `boss` : « le Commandant » + les deux props de la salle

Craft per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md). Sujet : l'antagoniste
capstone de la feature QTE boss + les deux objets interactifs de la salle (lever 2 décor).
Fiches : [`spec-boss-encounter-fiction.md`](../../game-design/spec-boss-encounter-fiction.md) §2,
[`spec-boss-differentiation-fiction.md`](../../game-design/spec-boss-differentiation-fiction.md)
§1/§3/§5, mécaniques dans
[`spec-boss-qte-differentiation.md`](../../game-design/spec-boss-qte-differentiation.md).
**Statut : DRAFT — game-graphist PRE-PROD PASS puis lead-art PROMPT GATE requis avant tout
commit/génération.**

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

> a towering french plainclothes commander at full height facing forward, bare-headed, a long
> knee-length dark overcoat, broad squared shoulders, a reflective armband brassard on one sleeve, a
> boxy radio clipped at the shoulder, one gloved hand raised flat in a halt-and-hold gesture, the
> other hand resting on a holstered boxy sidearm at the hip, closed guarded upright stance

- `towering … at full height` → masse dominante, plein pied ; distinct du buste-fenêtre.
- `bare-headed` → RULING §1 ; le tell fort (seul crâne nu du roster).
- `long knee-length dark overcoat` → LE tell « chef » sans couleur.
- `reflective armband brassard` + `boxy radio clipped at the shoulder` → micro-tells d'autorité
  plainclothes-BAC qui **remplacent** la casquette (RULING §1) ; la radio pose le finisher.
- `one gloved hand raised flat in a halt-and-hold gesture` → « il commande / ne tire pas » = SHIELDED,
  et ferme la silhouette.
- `the other hand resting on a holstered boxy sidearm` → arme présente mais NON présentée = pas la
  fenêtre atteignable. **Réconciliation fiche ↔ SHIELDED** : pas de bouclier CRS (interdit fiche) ;
  la protection = posture fermée + arme au holster. Contraste net avec EXPOSED ouvert.
- `closed guarded upright stance` → ancre le contraste avec le lunge ouvert d'EXPOSED.

### `commander_exposed` — EXPOSED phase-1 / à découvert, tire (seed 4871) — APPLIQUÉ

> the same towering bare-headed french plainclothes commander in his long knee-length overcoat,
> reflective armband and shoulder radio, lunging one stride forward into the open, both arms thrust
> forward presenting a boxy service pistol straight at the viewer, big bright muzzle flash, the long
> coat flaring open, aggressive exposed firing stance, facing forward

- `reflective armband and shoulder radio` → ADN compact re-cité (continuité).
- `lunging one stride forward into the open` → EXPOSED = il quitte le couvert = la seule fenêtre.
- `both arms thrust forward presenting a boxy service pistol … big bright muzzle flash` → calque
  `enemy_shooting` ; frame dangereuse **et** atteignable (anchor `muzzle` tuné au gate).
- `the long coat flaring open` → silhouette OUVERTE, contraste net avec le SHIELDED fermé.
- **Sert la phase-1 (mono-ring).** La phase-2+ (deux rings) utilise `commander_weakpoint` (ci-dessous)
  — bras étendus-présentés ici **occultent la bande torse**, inutilisable comme canvas deux-bandes.

### `commander_hit` — touché (seed 4872) — APPLIQUÉ · **re-clé RULING §1**

> the same towering bare-headed french plainclothes commander in his long knee-length overcoat,
> staggered a step backward by a bullet impact, torso recoiling and head snapping back, the
> reflective armband brassard torn loose and flapping from his sleeve, the shoulder radio knocked
> spinning off its clip, the boxy pistol arm falling loose, off-balance reeling posture, facing forward

- `staggered a step backward … torso recoiling and head snapping back` → lecture « touché » claire.
- `the reflective armband brassard torn loose … the shoulder radio knocked spinning off its clip` →
  **le beat d'autorité défaite re-clé sur brassard + radio** au lieu d'une casquette qui saute
  (RULING §1 mandaté). Deux tells lisibles à taille de jeu.
- `the boxy pistol arm falling loose` → blessé, ne tire plus.

### `commander_down` — à terre / vaincu (seed 4873) — APPLIQUÉ · **re-clé RULING §1**

> the same towering bare-headed french plainclothes commander defeated and fallen, lying sprawled on
> his back flat on the ground, the long overcoat splayed out around him, the torn armband brassard
> and the knocked-loose shoulder radio lying on the ground beside him, a boxy service pistol dropped
> from his open hand, a motionless collapsed heap

- `lying sprawled on his back flat on the ground` → à terre / vaincu, posé lisible sur fond noir.
- `the long overcoat splayed out around him` → garde le manteau signature reconnaissable au sol.
- `the torn armband brassard and the knocked-loose shoulder radio lying … beside him` → l'autorité
  défaite **re-clé sur brassard + radio** (RULING §1), plus le `service pistol dropped` (déjà là).
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

> the same towering bare-headed french plainclothes commander in his long knee-length overcoat,
> reflective armband and shoulder radio, square and still facing forward, chin lifted and head fully
> clear, torso squared flat to the viewer, both arms held out wide, a boxy service pistol in one
> lowered hand held clear of the chest, frontal readable stance

- `standing square and still facing directly forward` → grammaire fenêtre Prohibition-ST : frontal,
  immobile, lisible.
- `chin lifted and head held fully clear` → **bande VITAL (tête) dégagée** pour le ring tête.
- `chest and torso squared flat to the viewer` + `both arms held out wide away from the body` →
  **bande LIMB (torse) dégagée** ; rien (bras/revers/holster) n'occulte les bandes (discipline de
  négatif Estelle).
- `a boxy service pistol in one lowered hand kept clear of the chest` → silhouette d'arme **conservée
  partout** (jamais un tell melee), mais tenue basse hors de la bande torse.

### `commander_parry_windup` — PARRY / charged windup (seed sugg. 4875)

**Pourquoi une pose distincte, PAS un fold dans `exposed` :** lever 3 (spec §3-C) **EXIGE** un tell
**catégoriquement distinct** du tell de fenêtre EXPOSED normale, lu **avant** de s'engager — un tell
partagé = « bullshit whiff ». La parade = tirer **sur l'arme qui se lève** (fiction §4). Advisory
Estelle : « pull the moment EARLIER than commander_exposed — elbows bent, pistol angled up not yet
presented, shoulders hunched loading the swing ; arms-drawn-IN vs exposed's arms-EXTENDED is the
sub-half-second read ; firearm silhouette throughout, never a melee tell. »

> the same towering bare-headed french plainclothes commander in his long knee-length overcoat,
> reflective armband and shoulder radio, coiled a beat before firing, elbows bent and drawn in tight
> to the body, a boxy service pistol gripped in both hands and angled steeply upward mid-raise, still
> short of firing level, shoulders hunched and loaded, tense wound-up crouch, facing forward

- `coiled a beat before firing` + `weight gathered back` → le moment **plus tôt** qu'EXPOSED.
- `elbows bent and drawn in tight to the body` → **bras rentrés** (le read sub-0,5 s vs bras étendus
  d'EXPOSED) — le contraste catégorique que §3-C exige.
- `a boxy service pistol … angled steeply upward mid-raise, still short of firing level` → **arme qui
  se lève, pas encore présentée** = le point de parade (fiction « on tire sur le flingue ») ;
  silhouette d'arme conservée, **jamais un tell melee** (`still short of firing level` = phrasé
  positif, 0 négation).
- `shoulders hunched and loaded, tense wound-up crouch` → charge le swing (le « charged window »).

### `commander_finisher` — COUP DE GRÂCE / kneeling still-trying (seed sugg. 4876)

**Pourquoi distinct de `down` :** lever 5 (spec §5-A, fiction §3.1) = **down-but-not-finished**, sur
un genou, une main remonte vers la radio/mic pour faire couper le son ailleurs ; le finisher stoppe
ce geste. Doit lire **encore en train d'essayer**, PAS déjà mort (`down` = ça). **Garde-fou de ton
(fiction §3.2, binding sur le dessin) :** pas de sang, pas de grimace de douleur, aucune arme braquée
sur lui — livraison, pas exécution. Sprite mono-figure → aucun agresseur/arme dans le cadre, le
garde-fou est intrinsèquement tenu ; je décris positivement (main qui remonte, main qui prend appui,
tête haute).

> the same towering bare-headed french plainclothes commander brought down onto one knee, the long
> overcoat pooling around his bent leg, still upright from the waist with head held up, one free hand
> reaching up toward the shoulder radio as if to call it in, the other hand braced on his knee,
> reflective armband, straining unfinished effort, facing forward

- `brought down onto one knee` + `the long overcoat pooling on the ground` → à genou, manteau qui
  flaque (Estelle « one knee down, coat pooling »).
- `still upright from the waist with his head held up` → **encore en vie / en train d'essayer**, le
  distingue nettement du sprawl immobile de `down`.
- `one free hand reaching up toward the radio at his shoulder as if to call it in` → le geste que le
  finisher stoppe (fiction §3.1) ; la radio-tell d'épaule paie ici son set-up.
- `straining unfinished effort` → tension d'effort, **pas** douleur/mort (garde-fou de ton §3.2).

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

> a grand old ballroom chandelier hanging from a single chain up top, a multi-tier cone-and-umbrella
> silhouette of stacked crystal-drop rings, an ornate wrought-iron and brass armature with suggested
> radiating arms, strings of faceted glass droplets, one drop broken off on one side, the fixture
> hanging slightly tilted and dust-dulled, decayed 1900s ballroom grandeur, centered and fully visible

- `hanging from a single chain at the top of the frame` → il **PEND** (HUNG) — lecture « au
  bâtiment », composition top-centrée.
- `multi-tier cone-and-umbrella silhouette of stacked crystal-drop rings` → la forme cône/parapluie
  qui **exclut la boule à facettes** (mirror-ball) par la forme, pas par négation.
- `ornate wrought-iron and brass armature with suggested radiating arms` → armature ornée qui exclut
  l'industrial-chic ; **arms suggérés, non énumérés** (Estelle).
- `one drop broken and missing on one side, … slightly tilted and dust-dulled` → **dégât asymétrique**
  (pampille manquante + inclinaison + poussière), jamais gravats.
- `decayed 1900s ballroom grandeur` → registre salle-de-bal d'époque.

### `speaker_wall` (mur d'enceintes) — le sound-system du crew (seed sugg. 4878)

Advisory Estelle : stack teknival **fait main** — caissons de basse contreplaqué + pavillons,
pyramide/mur brute, non-brandé, câbles speakon/XLR qui serpentent, gaffer, rig échafaudage/palette,
marques de crew au **pochoir** (cadeau maison). Lit **CONSTRUIT** vs le lustre **PENDU**. PAS un
line-array, PAS un DJ booth, PAS des amplis guitare.

> a hand-built teknival sound-system wall stacked from the ground up, a rough pyramid of mismatched
> plywood bass-bin boxes and flared horn cabinets wedged together, on a scaffold and pallet rig, thick
> cables snaking down and taped with gaffer, a sprayed stencil spiral mark on one cabinet, unbranded
> raw plywood, chunky top-heavy improvised mass, centered and fully visible

- `stacked from the ground up … bolted onto a scaffold and wooden-pallet rig` → il est **CONSTRUIT**
  (BUILT) — lecture « au crew », par le sol, pas suspendu.
- `a rough pyramid of mismatched plywood bass-bin boxes and flared horn cabinets` → caissons
  contreplaqué dépareillés + pavillons = **sound-system**, ce qui exclut par la forme le line-array
  (arrays lisses suspendus), le DJ booth et les amplis guitare.
- `thick speaker cables snaking down and taped with gaffer` → câbles + gaffer, tell teknival.
- `a sprayed stencil spiral crew mark on one cabinet face` → **pochoir** (spirale Spiral-Tribe,
  période) rendu comme **FORME** sprayée, pas comme du texte (loi `no text`).
- `unbranded raw plywood, chunky top-heavy improvised mass` → non-brandé, improvisé.

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
