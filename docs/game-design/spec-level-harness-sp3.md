# Spec — Harness de level, SP3 : « pitch → candidat »

> **Statut** — cadrage validé par Bertrand le 2026-07-30 (4 décisions, §2). **BUILD
> séquencé APRÈS le merge de SP2** ([`spec-level-harness-sp2.md`](./spec-level-harness-sp2.md)) :
> SP3 orchestre les phases que SP2 rend autonomes — ce spec peut être relu et gaté dès
> maintenant, aucune ligne de SP3 ne se code avant. Sous-projet **3 sur 3** du harness
> (SP1 mergé — ADR-0075). Le serveur MCP
> ([`spec-mcp-level-editor.md`](./spec-mcp-level-editor.md)) fournit `validate`/`scaffold`
> en bibliothèque.
> **Lanes** — `dev-tooling-assets` (orchestrateur + gate packet), `dev-gameplay` (courbe
> de difficulté, TDD), boucle design par candidat (le cœur du flux, voir §3.1),
> `producer` (tracking + ADR de l'orchestrateur si besoin).

## 1. Objet

Fermer la boucle du harness : de **une ligne de pitch** à **une PR draft contenant un
level candidat complet** — plan validé, décor payé, fenêtres calibrées, skins, props,
preuve de jouabilité — avec un **gate packet** qui rend la revue humaine rapide. Le
harness produit un candidat, jamais une décision : tous les gates humains restent.

## 2. Décisions de cadrage (Bertrand, 2026-07-30)

1. **Pitch = ligne libre + boucle design.** L'entrée est une phrase. L'orchestrateur la
   confie à `game-designer` + `narrative-designer` (fiction, quartier, registre, cast de
   props/ennemis), gate `lead-game-designer` — le harness orchestre la créativité de la
   crew, il ne l'imite pas.
2. **Tuning = courbe paramétrique + gate.** Une courbe de difficulté dérivée des levels
   shippés (position visée dans la campagne → `enemiesToWin`/`timeSeconds`/
   `enemySpeedMultiplier` interpolés) propose les valeurs par défaut ; le gate
   `lead-game-designer` les ajuste ou les accepte.
3. **Autonomie = jusqu'à la PR draft + gate packet.** L'orchestrateur enchaîne les
   phases et ouvre une PR **DRAFT**. Design PASS avant toute génération payée (l'ordre
   du spec SP2 §7), lead-art sur les images, panel, `pm`, merge : tous humains.
4. **Budget = hérite des caps SP2, un candidat à la fois.** Cap 3 tirages payés
   (compteur `.paid-attempts`, SP2 T3), itérations bornées des sprites, pas de fan-out
   de candidats.

## 3. Le flux

```
pitch (une ligne)
  → [design] game-designer + narrative-designer → spec candidat → GATE lead-game-designer
  → [plan]   courbe de tuning + scaffold (MCP validate/scaffold en bibliothèque)
  → [gen]    phases SP2 : backdrop payé → calibration ; skins ∥ props   (caps hérités)
  → [preuve] e2e-generated-level (§8) + contact sheet
  → [packet] gate packet + PR DRAFT
```

### 3.1 La boucle design est DANS le flux, pas contournée

L'orchestrateur s'arrête de lui-même tant que le spec candidat n'a pas le PASS
`lead-game-designer` (un fichier de verdict dans le shard du candidat fait foi — le même
mécanisme de trace que les stories humaines). C'est la matérialisation de la décision
« design d'abord, génération ensuite » : aucun tirage payé avant le PASS.

### 3.2 La courbe de difficulté (lane `dev-gameplay`, TDD)

`difficultyCurve(slot: number): Pick<LevelPlan["gameplay"], …>` — interpolation sur les
valeurs des levels shippés (belliard 10/90/1.0 → stalingrad 12/80/1.3 → vitry …),
clampée aux bornes que `validateLevelPlan` impose déjà (dont `timeSeconds >` déclencheur
de livraison). Pure, testée sur les slots existants (elle doit REPRODUIRE les valeurs
shippées à leurs positions) et sur l'extrapolation.

### 3.3 Le gate packet

Un dossier `docs/qa/evidence/<id>/` + un commentaire de PR généré : contact sheet
(backdrop, zones calibrées en overlay, chaque skin, chaque prop), les verdicts machine
(validate, align --check, check-sprite-integrity, check-nearfg-style, §8 report), le
plan complet, le compteur de tirages payés, et la liste de ce qui attend un œil humain
(lead-art sur les images, playtest). But : une revue en minutes, pas une archéologie.

### 3.4 L'orchestrateur

Un workflow `gen-level-candidate.yml` (workflow_dispatch, input : le pitch + le slot de
campagne visé) qui enchaîne les workflows SP2 par étapes reprenables — chaque phase
reste dispatchable seule (la définition de SP2) ; SP3 n'ajoute que l'enchaînement, le
stop-on-gate design, et le packet. Pas de moteur nouveau : `workflow_call` + les
conventions existantes.

## 4. Critère d'acceptation

Un pitch réel (celui du level candidat SP2 si non consommé, sinon un nouveau) traverse
le flux : design PASS tracé → plan scaffoldé et validé → phases SP2 vertes → PR draft
ouverte avec gate packet complet → un humain (toi) peut décider en < 10 minutes de
promouvoir, itérer ou jeter. Compteur payé ≤ 3, levels shippés intouchés.

## 5. Hors périmètre

La promotion au menu (toujours un acte humain délibéré, ADR-0075 §6) · le multi-candidat
(fan-out) · toute évolution du schéma `LevelPlan` non exigée par la courbe · la
génération audio (bible sonore : lane `sound-designer`, hors harness pour l'instant).

## 6. Risques reconnus

- Le stop-on-gate design repose sur une trace de verdict lisible par machine — à
  spécifier au plan (format du fichier de verdict dans le shard candidat).
- Une courbe interpolée sur 4 points est fragile aux extrêmes — clamp + gate humain.
- L'enchaînement de workflows GitHub (`workflow_call`) a des limites de profondeur et
  de secrets à vérifier au plan (le `POLLINATIONS_TOKEN` ne traverse que la phase
  backdrop).
