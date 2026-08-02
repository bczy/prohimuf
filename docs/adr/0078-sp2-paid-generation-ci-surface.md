# 0078 — La surface CI de génération SP2 : dispatch privilégié, exécution dynamique de plan, et comptabilité du cap payé

- **Status:** Proposed
- **Date:** 2026-08-02
- **Number:** 0078 — alloué après vérification de `docs/adr/` local, de l'index, d'`origin/main`
  ET de toutes les branches distantes (0077 est pris par le serveur MCP de la story ③,
  branche `feat/mcp-level-editor`, non encore poussée au moment de l'allocation).
- **Relates to:** ADR-0075 (schéma `LevelPlan`) — dont la section Consequences dit
  verbatim « SP2 (per-phase CI generation) … build on this schema; **nothing here
  presumes them** » : c'est précisément pourquoi SP2 ne peut pas se réclamer de 0075 et
  a besoin de cet ADR. ADR-0009 (marqueurs de dispatch), ADR-0057 (backdrop single-wide),
  ADR-0063/0070 (discipline des workflows privilégiés).
- **Author:** rédigé après le BLOQUANT du run 6 du panel sur la PR #156, qui a établi que
  « ADR n/a » y était une erreur de jugement — la PR introduit bien une surface nouvelle.

## Context

SP2 (spec `spec-level-harness-sp2.md`) rend chaque phase de matérialisation d'un
`LevelPlan` exécutable seule en CI. Trois workflows `workflow_dispatch` naissent avec :

- `permissions: contents: write` (ils committent les assets produits sur la branche) ;
- pour deux d'entre eux, le secret `POLLINATIONS_TOKEN` — de l'argent réel par appel ;
- un **input string** (`level_id`) qui est résolu en chemin de module, puis **transpilé
  et exécuté** par `jiti` (`scripts/lib/loadPlan.mjs`) pour lire le plan.

Un input de dispatch qui aboutit à une exécution de code, dans un job privilégié tenant
un secret payant, n'est pas « le pattern commit-back existant » : les générateurs
préexistants lisent un manifeste JSON commité, jamais un module TypeScript désigné par
l'appelant. La question n'est pas seulement la sécurité (l'accès write au dépôt est déjà
requis pour dispatcher) mais la **traçabilité** : sans ADR, la prochaine révision du cap
ou de l'allowlist — après un dépassement de coût ou un quasi-incident — n'aurait aucun
point de repère, et le raisonnement ne survivrait que dans un fil de commentaires de PR.

## Decision

1. **Allowlist en défense de profondeur, premier step de chaque job.** `level_id` doit
   matcher `^[a-z0-9-]+$` — vérifié dans un step dédié (`id: validate`) AVANT tout
   usage, et de nouveau dans `loadPlan.mjs` avant toute résolution de chemin ou import
   jiti. Jamais d'interpolation `${{ }}` dans un `run:` — l'id transite par une variable
   d'environnement.
2. **L'allowlist vaut aussi sur le chemin d'échec.** Le seul step en `if: failure()`
   (upload d'artefact) est gaté sur `steps.validate.outcome == 'success'` : un id refusé
   ne peut atteindre AUCUN chemin, artefact compris.
3. **Confinement des cibles d'écriture — les TROIS champs concernés.** `props[].asset`,
   `archetype.spriteBase` et `backdrop.file` portent chacun une garde de forme dans
   `validateLevelPlan` (CI-time) ET une assertion de containment dans les générateurs
   (runtime). Les deux moitiés ne font pas double emploi, mais **pas** pour la raison
   d'abord écrite ici (« le validateur ne voit pas les brouillons ») : depuis la
   décision 4, `loadPlan` valide _tout_ plan qu'il rend, brouillons compris. La vraie
   raison est que les helpers de mode plan (`planRunTarget`, `loadEnemiesFromPlan`,
   `loadNearForegroundArtFromPlan`, `resolveBackdropFile`) sont **exportés et
   appelables avec un littéral** qui n'est jamais passé par `loadPlan` — leurs propres
   tests le font. La garde de forme et la garde de containment n'attrapent d'ailleurs
   pas la même chose : le containment ne voit que l'évasion, la forme refuse aussi ce
   qui reste à l'intérieur sans être un stem de fichier (un sous-dossier, par exemple).
   Corollaire de la même loi : le namespace des sprites est **plat**
   (`public/assets/<spriteBase>*.png`, sans sous-dossier par level, contrairement aux
   props), donc `spriteBase` doit porter l'id de son level (`enemy_<id>_…`) — sans quoi
   une collision avec la table shippée ou un level frère échoue _silencieusement en
   vert_ : le générateur ne produit une frame que si elle MANQUE.
4. **Verrou d'identité et validation avant dépense.** `loadPlan` refuse un module dont
   `plan.id` diffère du nom de fichier (sinon une tentative cappée serait dépensée pour
   un level tout en écrasant l'art d'un autre), et valide le plan complet avant de le
   rendre — un brouillon non câblé dans `GENERATED_PLANS` ne peut plus faire dépenser une
   tentative sur une requête vouée à l'échec.
5. **Comptabilité du cap payé par commits de trace.** Le compte de tentatives est le
   **nombre de commits** touchant `public/assets/levels/<id>/.paid-attempts` sur
   `origin/main..HEAD`, lu avec `--full-history` (sans quoi un merge peut être omis, donc
   sous-compté). Un commit de trace est poussé **avant** l'appel payé (pas d'appel sans
   trace) ; la garde lit le compte **avant** cet incrément (le cap autorise donc bien 3
   tirages) ; un échec de commit-back après dépense met le job en FAIL, jamais en warn.
   Alternative écartée : compter la valeur numérique d'un fichier — vulnérable au
   read-modify-write concurrent, que la sémantique par commits élimine avec la
   sérialisation ci-dessous.
6. **Sérialisation par level.** `concurrency: { group: <workflow>-<level_id>,
cancel-in-progress: false }` : au plus un run par level. GitHub ne conserve qu'un run
   en attente par groupe — les dispatches intermédiaires sont annulés, sans dépense
   fantôme (un run annulé n'atteint jamais l'appel payé).
7. **Idempotence au niveau workflow.** Un re-dispatch sur un backdrop déjà généré
   court-circuite avant la garde et avant la trace (`exit 0`, rien à payer) ; `force`
   est un input explicite.

## Consequences

- La discipline est vérifiable : chaque point ci-dessus est épinglé par un test qui lit
  le YAML réel ou exécute le script, plusieurs par mutation (retirer `--full-history`,
  l'import d'allowlist ou le gate d'upload fait rougir).
- Limite assumée : une tentative tracée sans image (annulation entre trace et appel,
  erreur 5xx de l'API payante) ne se récupère ni par revert ni par réécriture
  d'historique sans casser la comptabilité — lever le cap est une décision humaine,
  dite dans le message d'escalade.
- L'allowlist est une classe de caractères, pas une énumération d'ids : un id bien formé
  mais inexistant échoue proprement dans `loadPlan`. Restreindre à `GENERATED_PLANS`
  serait plus strict mais interdirait le cas d'usage central — générer un level dont le
  module vient d'être écrit et n'est pas encore câblé.
- SP3 (orchestrateur) héritera de ces caps sans les redéfinir ; toute évolution du cap
  ou de l'allowlist amende CET ADR.
