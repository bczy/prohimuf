# Spec — Harness de level, SP2 : « chaque phase de génération tourne seule »

> **Statut** — cadrage validé par Bertrand le 2026-07-30 (4 décisions, §2), spec à relire
> avant plan d'implémentation. Sous-projet **2 sur 3** du harness (parent :
> [`spec-level-harness-sp1.md`](./spec-level-harness-sp1.md), mergé — ADR-0075).
> **Lanes** — `dev-tooling-assets` (scripts + workflows, lane principale),
> `dev-gameplay` (l'ajout de schéma `LevelPlan` §4.2), boucle design (fiction du level
> candidat, §5). `producer` ouvre le shard et alloue l'ADR si besoin.
> **Chantier frère** — la story ③ (MCP level-editor,
> [`spec-mcp-level-editor.md`](./spec-mcp-level-editor.md)) fournit le cœur de
> validation que les phases appellent en bibliothèque ; les deux avancent en parallèle
> sur des chemins disjoints.

## 1. Objet

SP1 a rendu un level **descriptible** en données (`LevelPlan`). SP2 rend chaque phase de
sa **matérialisation** autonome : un job CI idempotent qui lit un plan, produit ses
assets, passe les gates existants — sans orchestrateur (SP3) et sans toucher aux levels
shippés.

## 2. Décisions de cadrage (Bertrand, 2026-07-30)

1. **Budget payé** — la phase calibration **ne regénère jamais** l'image payée : elle ne
   fait que détecter/corriger les zones sur l'image existante ; un échec de convergence
   BLOQUE et escalade à un humain. En plus, **cap dur de 3 générations payées** par level
   et par PR pour la phase backdrop elle-même. Le coût ne peut pas s'emballer.
2. **Seeds** — pinnée (dérivée déterministiquement du `levelId`) pour le backdrop payé ;
   libres avec itération jusqu'aux gates pour skins et props (le pattern actuel des
   sprites).
3. **Calibration** — **le plan porte le point de départ** : `LevelPlan` gagne un champ
   optionnel déclarant la bande de gameplay / grille de fenêtres attendue, et la boucle
   `align-windows` converge depuis là. Zéro `LEVEL_CFG` écrit à la main pour un level
   généré. (Le `validate` du MCP connaît ce champ — coordination avec la story ③.)
4. **Level pilote** — SP2 se prouve sur un **vrai level candidat** (id + quartier +
   fiction réels, promuable plus tard au menu par un acte délibéré, jamais
   automatiquement — ADR-0075 §6 tient). Sa fiction passe par la boucle design.

## 3. Les cinq phases

Chaque phase = un script `scripts/` paramétré par `levelId` + un workflow
`workflow_dispatch` au pattern commit-back existant (`gen-*.yml`). Contrats communs :
lecture du plan via `generated/<id>.ts` (jamais d'écriture dans `levelArt.json` pour un
level généré), idempotence skip-if-exists / `FORCE=1`, namespace `<id>:` respecté
partout, et **aucun octet des 4 levels shippés modifié** (invariant hérité de SP1,
vérifié par les tests existants).

| Phase                 | Entrée                                             | Sortie                                                      | Gate                                                                                                             |
| --------------------- | -------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **(a) Backdrop**      | `plan.backdrop` + prompt dérivé du plan            | `public/assets/levels/<id>/<file>.png`                      | dimension/aspect exacts + relecture humaine (lead-art)                                                           |
| **(b) Calibration**   | l'image de (a) + le point de départ du plan (§2.3) | `windowZones.generated.json[<id>]`                          | boucle `align-windows` : convergence 0 défaut (OVERFLOW/MISALIGN/UNDER-/OVERCOVER), jamais de regénération payée |
| **(c) Skins ennemis** | `plan.archetypes[].spriteBase`                     | `public/assets/enemy_<spriteBase>*.png` (flipbook 2 frames) | pipeline kontext existant + `check-sprite-integrity` + fill-holes                                                |
| **(d) Props**         | `plan.props[]`                                     | `public/assets/nearfg/<id>/<kind>.png`                      | `check-nearfg-style` (C1 grey, silhouette)                                                                       |
| **(e) Preuve**        | (a)–(d)                                            | screenshots + report via `?preview=level&level=<id>`        | le driver §8 de SP1 (zéro pageerror, timer, HUD)                                                                 |

Ordre : (a) → (b) ; (c) et (d) indépendants ; (e) ferme. Chaque phase doit pouvoir
tourner **seule** — c'est la définition de SP2 ; l'enchaînement automatique est SP3.

## 4. Travaux structurels (hors simple scripting)

### 4.1 Généraliser `gen-street-paid.mjs`

Aujourd'hui : prompt Belliard EN DUR, sortie `street-experiments/`, non committé. SP2 en
fait un générateur paramétré : prompt construit depuis le plan (quartier, registre
architectural, éléments imposés — gable, passage — nécessaires à la calibration), seed
dérivée du `levelId`, sortie committable sous `public/assets/levels/<id>/`, cap de
3 tirages par PR (compteur dans le workflow). Le style house (« Tardi ink, three values »)
reste un bloc verbatim partagé — le risque « le prompt Belliard déteint sur tout » est
traité en séparant bloc de style (commun) et bloc de contenu (par plan).

### 4.2 Le point de départ de calibration dans `LevelPlan`

Ajout de schéma (lane `dev-gameplay`, TDD) : un champ optionnel, p.ex.
`calibration?: { windowBand: { top: number; bottom: number }; expectedCols?: number }`,
validé par `validateLevelPlan` (bornes 0..1, top < bottom). `align-windows` gagne un
chemin « départ fourni par le plan » qui construit sa config de détection depuis ces
valeurs au lieu d'un `LEVEL_CFG` manuel. Le faux-vert reste possible (pm l'a nommé) —
mitigé par le gate humain de (a) et par les axes détection-indépendants
UNDERCOVER/OVERCOVER qui jugent contre l'ART, pas contre la détection.

### 4.3 Le level candidat

Ouvert par la boucle design au BUILD (pas dans ce spec) : `game-designer` +
`narrative-designer` proposent id/quartier/fiction/tuning, `lead-game-designer` gate,
puis le plan est écrit (à la main ou via le `scaffold` du MCP si la story ③ a livré).
Ce spec n'invente pas le contenu — il exige seulement qu'il existe avant la phase (e).

## 5. Critère d'acceptation

Sur le level candidat : **les 5 phases lancées chacune isolément en CI** produisent leurs
assets et passent leurs gates ; la preuve (e) montre le level jouable avec décor payé,
fenêtres calibrées convergées, au moins un ennemi skinné du plan et au moins un prop
généré rendu ; le diff ne touche aucun octet des levels shippés ; le compteur de
générations payées de la PR est ≤ 3.

## 6. Hors périmètre

Orchestrateur/DAG/`--resume`, générateur de tuning, fiction automatique, gate packet →
**SP3**. Le serveur MCP lui-même → **story ③** (SP2 n'en dépend pas : il appelle les
fonctions du cœur en bibliothèque).

## 7. Risques reconnus

- Faux-vert de calibration sur décor inédit (mitigation §4.2, jamais éliminé — le gate
  lead-art sur l'image reste le juge).
- Style Belliard « par défaut » si le bloc contenu du prompt est trop maigre (mitigation
  §4.1 ; la relecture lead-art l'attrape).
- Assets payés du candidat gaspillés si sa fiction est refusée en design APRÈS
  génération — d'où l'ordre : design gate d'abord, génération ensuite.
- Collision de namespace si deux levels générés partagent un préfixe — déjà gardée
  (SP1 : `assertDistinctPlanIds` + validateur).
