# Prompt drafts — famille `boss` : « le Commandant » (QTE cinématique)

Craft per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md). Sujet : l'antagoniste
capstone de la feature QTE boss (`_bmad-output/planning-artifacts/story-boss-encounter-qte.md`).
Fiche personnage : [`docs/game-design/spec-boss-encounter-fiction.md`](../../game-design/spec-boss-encounter-fiction.md) §2.
Spec mécanique (états à visuel distinct) : [`docs/game-design/spec-boss-qte-encounter.md`](../../game-design/spec-boss-qte-encounter.md) §OQ2.
**Statut : DRAFT — PROMPT GATE lead-art (Nico) requis avant tout commit/génération.**

## Décision de structure — bloc `boss` séparé, pas `enemies.types`

Le Commandant est une **figure de QTE cinématique**, pas un archétype qui pop aux fenêtres.
`src/game/levels/__tests__/levelArt.consistency.test.ts` (§"no orphan keys", l.129-134)
**interdit** toute clé de `enemies.types` qui n'est pas dérivée de `ARCHETYPES`
(`src/game/types/enemyTypes.ts`) ; lui ajouter un archétype serait du code gameplay (hors
lane concept-artist) et ferait pop le boss aux fenêtres comme un mook — contraire à la fiche
(plein-pied, autorité, apparaît seulement dans le QTE). Précédent exact : le bloc `hostages`
(ADR-0030) vit **à côté** de `enemies` précisément pour rester hors du registre ARCHETYPES.
Le bloc `boss` suit ce patron : sibling de `enemies`/`hostages`, non-lint par
`check-art-prompts.mjs` (qui ne connaît que vehicles/enemies/courier/levels/nearForeground),
non couplé au gate de cohérence.

> **Structure = provisoire, propriété `dev-tooling-assets`.** Nom du bloc, clés, `asset`,
> `size`, seeds pinnés et l'éventuel `muzzle` anchor de la pose EXPOSED sont un scaffolding
> calqué sur `hostages` pour porter les prompts ; `dev-tooling-assets` les ratifie/ajuste
> quand il câble le tech-plan (générateur `gen-boss-sprites.mjs` ou extension de
> `gen-hostage-sprites.mjs`, chemins `public/assets/boss/…`, registration render-side). Moi
> (concept-artist) je porte **les strings `prompt` + `style`**, rien d'autre.

## Style tail — calquée VERBATIM sur le roster LIVE (`enemies.style` / `hostages.style`)

Family consistency (art-direction.md §2 loi 2) : le boss est un membre du roster police, il
partage **le même bloc de style que le roster tel qu'il ship aujourd'hui**. Le roster live
porte encore la tail SNES (`16-bit … retro snes style`). La direction **pochoir** validée pour
les enemies (`prompt-drafts/enemies.md`, PASS Nico 2026-07-18) n'est **pas encore appliquée à
`levelArt.json`** (bloquée par le keying liseré-photocopie). Forker une tail pochoir pour le
seul boss violerait §2 loi 2 (asset hors-famille = FAIL du set entier) et heurterait le même
blocage keying. **Décision : copier la tail live verbatim ; le boss migre vers le pochoir EN
LOCKSTEP avec tout le roster quand lead-art débloque et ship cette migration.** → point à
ratifier par le gate (timing de direction de style).

```
, 16-bit pixel art game sprite on a solid uniform matte black background (#000000) filling the
whole frame edge to edge, the same flat black filling every space between the figure's limbs
and gear, crisp clean pixels, light grey white and pale neon tones figure, simple bold shapes,
centered, high contrast, retro snes style, no text, no watermark
```

## ADN de silhouette partagé (le « chef » lisible en < 0,3 s sans couleur)

Un seul personnage reconnaissable à travers les 4 poses, distinct du reste du roster **par la
forme seule** :

- **Long pardessus de commandement jusqu'aux genoux** — le tell d'autorité n°1 : aucun autre
  membre du roster n'a ce manteau long (les mooks = veste à hauteur de hanche, le CRS = armure/
  bouclier). C'est ce qui lit « chef » instantanément, sans couleur.
- **Haute casquette d'officier à visière, calotte rigide** — coiffe d'autorité, distincte de la
  casquette plate du mook (`enemy_sprite`) par sa hauteur/rigidité.
- **Stature dominante, plein pied, épaules carrées** — masse plus grande que la piétaille
  (spec §4.1 : « Art scales the boss figure, larger silhouette »).
- **PAS de CRS** : aucun casque, aucune visière, aucun bouclier anti-émeute, aucune armure
  lourde — contrainte dure de la fiche (le boss n'est pas un reskin d'`enemy_riot`).

> **Réconciliation SHIELDED ↔ fiche.** La mécanique (§OQ2.1) thématise SHIELDED = « behind
> cover / riot shield ». La fiche **interdit** la tenue CRS/bouclier. On résout côté fiche : le
> Commandant SHIELDED n'est pas protégé par UN bouclier qu'il tient, mais par sa posture de
> commandement fermée, arme non présentée (il « descend au contact » seulement quand il tire,
> §1.3). Le contraste lisible reste : SHIELDED = silhouette fermée, arme au holster / EXPOSED =
> silhouette ouverte, pistolet tendu + muzzle flash — exactement le couple `enemy_riot` (fermé)
> ↔ `enemy_riot_shooting` (tire). À ratifier par lead-art.

## Les 4 poses (mandatées par la story : protégé / à découvert / touché / à terre)

Vue de face (comme `enemy_hostage` / `enemy_riot`, le boss tire « vers le viewer »). Prompts =
sujet + silhouette SEULEMENT ; fond/medium/no-text viennent de la tail partagée.

| clé (pose)           | état QTE           | seed | rôle lisible                                   |
| -------------------- | ------------------ | ---- | ---------------------------------------------- |
| `commander_shielded` | SHIELDED / protégé | 4870 | fermé, commande, arme au holster — intouchable |
| `commander_exposed`  | EXPOSED / tire     | 4871 | ouvert, pistolet tendu + flash — la fenêtre    |
| `commander_hit`      | touché             | 4872 | encaisse, casquette qui saute, arme qui tombe  |
| `commander_down`     | à terre / vaincu   | 4873 | effondré au sol, casquette à côté              |

### `commander_shielded` — SHIELDED / protégé (seed 4870)

> a towering menacing french police brigade commander at full height facing forward, a long
> knee-length commanding officer's overcoat, a tall stiff peaked officer's cap, broad squared
> shoulders, one gloved hand raised flat in a halt-and-hold command gesture, the other hand
> resting on a holstered sidearm at the hip, closed guarded upright authority stance

Rationale (clause → l'échec verrouillé) :

- `towering … at full height` → masse dominante, plein pied (spec §4.1) ; distinct du buste-fenêtre.
- `long knee-length commanding officer's overcoat` → LE tell « chef » sans couleur ; verrouille
  le contraste avec la veste-hanche du mook et l'armure du CRS.
- `tall stiff peaked officer's cap` → coiffe d'autorité ; hauteur/rigidité la séparent de la
  casquette plate d'`enemy_sprite`.
- `one gloved hand raised flat in a halt-and-hold command gesture` → lit « il commande / ne tire
  pas » = SHIELDED, et ferme la silhouette.
- `the other hand resting on a holstered sidearm` → arme présente mais NON présentée = pas la
  fenêtre atteignable/dangereuse.
- `closed guarded upright authority stance` → ancre le contraste avec le lunge ouvert d'EXPOSED.

### `commander_exposed` — EXPOSED / à découvert, tire (seed 4871)

> the same towering french brigade commander in his long knee-length overcoat and tall peaked
> officer's cap, lunging one stride forward into the open, both arms thrust forward presenting a
> service pistol straight at the viewer, big bright muzzle flash, the long coat flaring open,
> aggressive exposed firing stance, facing forward

Rationale :

- `the same … commander in his long … overcoat and tall peaked … cap` → continuité de
  personnage (recolle sur SHIELDED ; utile pour un futur kontext lock).
- `lunging one stride forward into the open` → EXPOSED = il quitte le couvert = la seule fenêtre.
- `both arms thrust forward presenting a service pistol … big bright muzzle flash` → calque le
  langage `enemy_shooting` ; la frame dangereuse + atteignable (aura besoin d'un `muzzle` anchor
  tuné au gate, comme les enemies).
- `the long coat flaring open` → silhouette OUVERTE, contraste net avec le SHIELDED fermé.
- `service pistol` → arme générique d'époque, pas d'anachronisme (pas d'arme moderne nommée).

### `commander_hit` — touché (seed 4872)

> the same towering french brigade commander in his long knee-length overcoat, the tall peaked
> officer's cap tipping off his head, staggered a step backward by a bullet impact, torso
> recoiling and head snapping back, one hand clutching his chest, the pistol arm falling loose,
> off-balance reeling posture, facing forward

Rationale :

- `the tall peaked officer's cap tipping off his head` → beat d'autorité qui vacille, lisible à
  taille de jeu.
- `staggered a step backward … torso recoiling and head snapping back` → lecture « touché » claire.
- `one hand clutching his chest, the pistol arm falling loose` → blessé, ne tire plus.

### `commander_down` — à terre / vaincu (seed 4873)

> the same towering french brigade commander defeated and fallen, lying sprawled on his back flat
> on the ground, the long overcoat splayed out around him, the tall peaked officer's cap knocked
> off and lying beside his head, a service pistol dropped from his open hand, a motionless
> collapsed heap

Rationale :

- `lying sprawled on his back flat on the ground` → à terre / mort, posé lisible sur fond noir.
- `the long overcoat splayed out around him` → garde le manteau signature reconnaissable même au sol.
- `the tall peaked officer's cap knocked off and lying beside his head` → l'autorité défaite
  (beat « à terre » de la fiche, post-scene `final_post` §4.2).

## Budgets (non-lint, mais craft respecté)

- Négations : 0 dans chaque sujet ; la tail partagée en porte 2 (`no text, no watermark`) →
  total ≤ 2, dans le budget bible §3.1.
- Assemblé (`prompt` + `style`) : ~90-96 mots — bande warn si c'était lint, mais chaque clause
  descriptive est load-bearing (nouvelle figure d'autorité qui doit être **non-ambiguë**) ;
  justifié ici, comme le prévoit §3.3.
- Aucune couleur/hue dans le sujet (le néon acide est render-side, convention roster).

## Ce qui reste à trancher par lead-art (gate)

1. **PASS / corrections** sur les 4 sujets + la réconciliation SHIELDED-sans-bouclier.
2. **Timing de direction de style** : boss en tail SNES live maintenant (family-consistent) →
   migre pochoir en lockstep quand la migration roster ship, OU direction différente ?
3. **Poses optionnelles déférées** (non produites ici, simplicité) : `telegraph-windup`
   (le tell §OQ2 avant chaque fenêtre) et une `per-phase posture` (phases 2/3) — proposées
   render-side (tint/scale) plutôt qu'en sprites distincts ; à confirmer avec ux-designer (OQ6).
   </content>
   </invoke>
