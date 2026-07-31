# Plan d'implémentation — Harness de level, SP2

> **Pour les lanes agentiques :** exécution tâche par tâche, cases `- [ ]`. Spec :
> [`spec-level-harness-sp2.md`](./spec-level-harness-sp2.md). Branche d'implémentation :
> `feat/level-harness-sp2` (après merge des specs). Lane principale :
> `dev-tooling-assets` ; tâche 1 : `dev-gameplay`.

**Objectif** — chaque phase de matérialisation d'un `LevelPlan` tourne seule en CI,
idempotente, gates existants, zéro octet des levels shippés modifié.

## Contraintes globales

- Décisions §2 du spec : jamais de regénération payée par la calibration · cap dur
  3 tirages payés/level/PR · seed backdrop = dérivée du `levelId` · le plan porte le
  point de départ de calibration.
- Loi de frontière ; TDD sur `src/game` ; Conventional Commits ; pas de `--no-verify`.
- Idempotence : skip-if-exists / `FORCE=1`, comme tous les `gen-*.mjs`.
- La génération réseau ne tourne qu'en CI (sandbox local sans egress) — les scripts se
  testent localement en mode `--paths`/`--list` (le pattern `gen-level-art.mjs`).

### Tâche 1 — `calibration` dans `LevelPlan` (lane dev-gameplay, TDD)

**Fichiers** : `src/game/levels/levelPlan.ts` + `__tests__/levelPlan.test.ts`.

- [ ] Test rouge : un plan avec `calibration: { windowBand: { top: 0.12, bottom: 0.5 }, expectedCols: 7 }` valide ; `top >= bottom`, borne hors [0,1] ou `expectedCols < 1` → erreurs explicites.
- [ ] Schéma :

```ts
/** Point de départ de la calibration des fenêtres (spec SP2 §2.3, décision Bertrand) :
 *  la bande verticale (normalisée y-down sur l'image) où chercher les ouvertures, et
 *  le nombre de colonnes attendu. Optionnel : absent ⇒ la phase (b) refuse de tourner
 *  pour ce level (pas de LEVEL_CFG manuel de repli pour un level généré). */
readonly calibration?: {
  readonly windowBand: { readonly top: number; readonly bottom: number };
  readonly expectedCols?: number;
};
```

- [ ] Validation dans `validateLevelPlan` (finitude, bornes, ordre), messages en une ligne chacun.
- [ ] Ajouter `calibration` au plan du fixture (valeurs plausibles) pour que le champ vive.
- [ ] Commit `feat(game): le LevelPlan porte le point de départ de calibration (SP2 §2.3)`.

### Tâche 2 — généraliser le générateur payé

**Fichiers** : `scripts/gen-street-paid.mjs` (refonte), `scripts/lib/paidPrompt.mjs`
(nouveau), test `scripts/__tests__/paidPrompt.test.mjs`.

- [ ] Test rouge sur `buildPaidPrompt(plan)` : contient le bloc de style house VERBATIM (constante exportée, comparaison stricte), contient quartier/registre du plan, et les éléments imposés par la calibration (mur pignon, passage) quand `calibration` est déclaré.
- [ ] `paidPrompt.mjs` : `STYLE_BLOCK` (l'actuel bloc Tardi, extrait tel quel) + `buildPaidPrompt(plan)` concaténant style (commun) et contenu (dérivé du plan) — la séparation qui empêche « Belliard déteint sur tout » (spec §4.1).
- [ ] `gen-street-paid.mjs` : `--plan <id>` charge `generated/<id>.ts` (via `node --experimental-strip-types` ou un mini-loader esbuild comme les tests scripts existants), seed = hash stable du `levelId` (fonction pure testée), sortie `public/assets/levels/<id>/<plan.backdrop.file>.png`, skip-if-exists/`FORCE=1`. Le mode historique sans `--plan` (Belliard, street-experiments/) reste intact.
- [ ] Commit `feat(tooling): gen-street-paid paramétré par LevelPlan, prompt style/contenu séparés`.

### Tâche 3 — workflow backdrop + cap payé

**Fichiers** : `.github/workflows/gen-plan-backdrop.yml` (nouveau, pattern commit-back de
`gen-level-art.yml`).

- [ ] Input `level_id` (workflow_dispatch) ; job unique : checkout → setup → `node scripts/gen-street-paid.mjs --plan $level_id` → commit-back `public/assets/levels/<id>/`.
- [ ] **Cap 3 — mécanisme exact, dans cet ordre** (un tirage payé dont le commit-back
      échoue doit compter quand même) :
  1. **Sérialisation** : `concurrency: { group: gen-plan-backdrop-<level_id>,
cancel-in-progress: false }` au niveau du workflow — deux dispatches sur le même
     `level_id` s'exécutent l'un APRÈS l'autre, jamais en course.
  2. **Sémantique du compteur** : le compte de tentatives est le **nombre de commits**
     touchant `public/assets/levels/<id>/.paid-attempts` sur `origin/main..HEAD`
     (`git log --oneline origin/main..HEAD -- <chemin> | wc -l`) — PAS la valeur du
     fichier (le contenu n'est qu'informatif : timestamp + run id). Un commit = une
     tentative (y compris merge ou revert : TOUT commit touchant le chemin compte) ;
     la sémantique par commits, combinée à la sérialisation du point 1, élimine la
     race read-modify-write. Fichier jamais commité = 0 (cas bootstrap d'un level
     neuf — la phase (a) doit pouvoir tourner la première fois).
  3. **Ordre des steps et lecture robuste** : le step de GARDE tourne en premier et
     lit le compte TEL QU'IL EXISTAIT AVANT cette tentative — fail à ≥ 3 avec
     message d'escalade explicite (le cap autorise donc bien 3 tirages, pas 2).
     Lecture robuste ou rien : checkout `fetch-depth: 0` (le shallow clone par
     défaut de `checkout@v4` ne ramène pas `origin/main`), `set -euo pipefail`,
     `git fetch origin` puis `git reset --hard origin/<branche>` (sûr aussi en
     re-run d'un job), et FAIL si `origin/main` ne résout pas — un échec git ne
     vaut JAMAIS 0 tentative.
  4. **Trace avant dépense** : ensuite seulement, le step d'incrément committe
     (`git add -f`, le pattern du commit-back de `gen-level-art.yml`) et POUSSE un
     commit touchant `.paid-attempts` ; si ce push échoue, le job FAIL avant tout
     appel payé — pas d'appel sans trace (rien de dépensé : re-dispatch et repartir).
  5. **Après dépense** : le push du commit-back des assets suit le pattern retry de
     `gen-level-art.yml` (3 tentatives, `git pull --rebase --autostash` entre chaque
     — les pushes concurrents des autres workflows sur la même branche ne brûlent
     pas un tirage) ; s'il échoue quand même APRÈS un appel payé réussi, le job FAIL
     (jamais warn) — le tirage reste compté par son commit de trace du point 4.
  6. **Limites assumées, dites dans le message d'escalade** : une tentative tracée
     sans image (annulation entre la trace et l'appel, 500/timeout de l'API payante)
     ne se récupère NI par revert (le commit de revert toucherait `.paid-attempts`
     et compterait comme tentative) NI par réécriture d'historique — un
     rebase/squash/force-push qui réécrit les commits de trace remet le compteur à
     zéro : c'est le contournement HUMAIN volontaire assumé du mécanisme, jamais un
     geste de workflow. Lever le cap est une décision de Bertrand — le message
     d'escalade le dit et pointe le geste autorisé (re-dispatch après merge, ou
     nouvelle PR). Et la file de concurrency GitHub ne gardant qu'un run en attente
     par groupe, un 3e dispatch pendant un run annule le 2e en attente — re-dispatch
     nécessaire, zéro dépense fantôme.
     Testé par un dry-run bash local des steps 2-4 (y compris le cas fichier absent,
     le cas `origin/main` non résolu, et le push simulé contre un remote fictif).
- [ ] Jamais sur main (le garde `if:` de `gen-level-art.yml`, copié).
- [ ] Commit `ci(harness): workflow backdrop payé par plan, cap 3 tirages par PR`.

### Tâche 4 — calibration depuis le plan

**Fichiers** : `scripts/align-windows.mjs` (chemin additif), `scripts/lib/planCalibration.mjs`
(nouveau, pur, testé).

- [ ] Test rouge sur `levelCfgFromPlan(plan, imageMeta)` : produit une config de détection (bande, seuils par défaut, cols attendues) SANS entrée manuelle dans `LEVEL_CFG` ; plan sans `calibration` ⇒ erreur claire « phase (b) exige calibration dans le plan ».
- [ ] `align-windows.mjs` : si l'id résolu est un level généré, config via `levelCfgFromPlan` (le hook `buildMask` par défaut warm-glow ; l'edge-density reste opt-in) ; boucle converge/écrit `windowZones.generated.json[<id>]` comme aujourd'hui ; **aucun chemin de regénération d'image** — un échec de convergence exit non-zéro avec le rapport de défauts (décision §2.1).
- [ ] `--check` fonctionne sur le level généré (le gate CI).
- [ ] Commit `feat(tooling): align-windows calibre un level généré depuis son plan`.

### Tâche 5 — skins ennemis et props du plan

**Fichiers** : `scripts/gen-enemy-types.mjs` + `scripts/gen-nearfg-sprites.mjs` (chemins
additifs `--plan <id>`), workflows `gen-plan-sprites.yml` (nouveau, un job matrix
skins/props, commit-back).

- [ ] `gen-enemy-types.mjs --plan <id>` : itère `plan.archetypes[].spriteBase`, prompts dérivés (clause de pose standard + descripteur du kind), seeds LIBRES avec itération jusqu'aux gates (décision §2.2), sortie `public/assets/enemy_<spriteBase>*.png`, puis les étapes existantes (cutout, fill-holes `--check`, `check-sprite-integrity`) inchangées — elles matchent déjà le glob.
- [ ] `gen-nearfg-sprites.mjs --plan <id>` : itère `plan.props[]`, sortie `public/assets/nearfg/<id>/<name>.png` (le chemin que `GeneratedPropSpec.asset` déclare), gate `check-nearfg-style`.
- [ ] Vérifier le namespace : chaque fichier écrit dérive de l'id du plan — un test de chemin dans les tests scripts.
- [ ] Commit `feat(tooling): skins et props générés depuis le plan (pipeline kontext/flux existant)`.

### Tâche 6 — la preuve (e) en CI

**Fichiers** : `scripts/e2e-generated-level.mjs` (nouveau, généralise le driver §8),
extension d'un workflow existant ou `gen-plan-verify.yml`.

- [ ] Le driver §8 (aujourd'hui script de session) devient `e2e-generated-level.mjs <id>` : build vite, `?preview=level&level=<id>`, zéro pageerror, timer qui décrémente, screenshots → `docs/qa/evidence/<id>/`. Réutilise `e2e-lib.mjs`.
- [ ] Le job CI l'exécute et committe l'évidence (pattern screenshots/ existant).
- [ ] Commit `feat(tooling): preuve jouabilité d'un level généré en CI (e2e-generated-level)`.

### Tâche 7 — le level candidat (design d'abord, génération ensuite)

Hors code : boucle design (`game-designer`+`narrative-designer` → `lead-game-designer`
PASS) sur id/quartier/fiction/tuning ; puis le plan est écrit (scaffold MCP si dispo,
sinon à la main), et les tâches 3→6 tournent dessus une à une — le critère
d'acceptation §5 du spec. Rien ne se génère avant le design PASS (risque « assets
gaspillés » du spec §7).

## Auto-revue

Couverture spec : §2.1→T3/T4 · §2.2→T2/T5 · §2.3→T1/T4 · §2.4→T7 · §3 table→T2-T6 ·
§4.1→T2 · §4.2→T1/T4 · §5→T7. Ordre : T1 seule en gameplay ; T2→T3 ; T4 après T1+T3 ;
T5, T6 indépendantes après T1 ; T7 ferme.

**Croisements MCP (séquencement obligatoire, miroir de l'Auto-revue du plan MCP)** :
T1 (garde `calibration`) et MCP T2b (migration `LevelIssue[]`) touchent tous deux le
corps de `validateLevelPlan` dans `levelPlan.ts` — atterrissage séquentiel : la seconde
branche rebase sur la première et adapte (T1 émet alors des `LevelIssue` avec le code
`plan/calibration` ; T2b ajoute ce code à sa liste). T6 (driver §8 généralisé) est
l'autre point partagé — dédupliqué par la première lane qui merge.
