# Story: Armement multi-armes par pickup — V1 (roster A-B-C)

**Type:** Gameplay core loop (`Éviter`/tir — puissance de feu, pas un nouveau verbe) ·
**Statut:** prête-pour-dev (attend design gate `lead-game-designer` en parallèle, puis TECH
PLAN `senior-architect`) · **Date :** 2026-07-20 · **PM :** John
**Pré-spec :** `docs/game-design/pre-spec-weapons.md` (2026-07-18, lane `game-designer`,
statut pre-gate) · **ADR réservé :** ADR-0052 · **Shard hand-offs :**
`docs/handoffs/story-weapons-pickup.md` (ne pas écrire ici — log tenu par `producer`)

## Why

Bertrand veut changer la sensation de tir sans toucher au controller : tirer une **caisse
d'armement** dans une fenêtre équipe une arme spéciale (mitraillette full-auto, triple tir
horizontal) à stock fini, qui retombe automatiquement sur le calibre de base (∞) une fois
vidée. Aucune touche de switch, aucun inventaire — un seul état d'arme actif. Ça recrée, en
version "puissance de feu", la tension "munitions" de l'original.

## Test du Cahier des Charges Prohibition — verdict : EXTENSION consciente, restreinte

- **Une arme fixe unique = fidèle à l'original.** Prohibition (Atari ST) n'a ni pickup ni
  type de tir alternatif. **Tout roster multi-armes dépasse le cahier des charges** — c'est
  noir sur blanc dans les guidelines (§8, et le verdict §1 du pré-spec).
- **Ce qui rend l'extension défendable :** le geste d'acquisition — tirer un objet/caisse
  pour s'équiper — est un canon du genre "galerie à viseur" **dès 1987** (Operation Wolf,
  contemporain exact de Prohibition), et le pré-spec le documente sur 14 titres (§2). La
  contrainte "une arme, pas de switch" (Bertrand) tient le controller intact
  (déplacement + tir, ADR-0015) — la seule règle UX non-négociable qui aurait pu être
  menacée par un système d'armes.
- **Verdict :** GO, mais **restreint** au strict périmètre demandé par Bertrand — voir
  ruling #1 ci-dessous. Ce n'est pas un blanc-seing sur tout le roster du pré-spec.

---

## Rulings PM (pré-spec §6.2, items assignés `pm`)

### 1. Roster V1 : **A-B-C**, PAS D (contre la recommandation "A-B-C-D" du pré-spec)

- Le brief de Bertrand nomme explicitement **deux** types de tir alternatifs : "mitraillette,
  triple tir horizontal" = **B** (sulfateuse) et **C** (éventail). Il ne mentionne pas de
  troisième arme spéciale. Le pré-spec lui-même note l'ambiguïté : Bertrand dit "1-2
  spéciales", mais son propre tableau §4.1 classe B, C **et** D comme "stock fini" (donc 3
  spéciales) — l'auteur du pré-spec force la lecture "D = la spéciale, E = la seconde" pour
  faire rentrer sa recommandation dans la contrainte. Je ne retiens pas ce forçage : au
  sens strict de la demande, **B + C couvrent "1-2 spéciales"**, D est une troisième
  extension non demandée.
- **Contrainte technique qui renforce le cut (pas la cause) :** le tir joueur actuel est un
  **hitscan instantané** contre la cible éligible la plus proche (`resolvePlayerShot`,
  ADR-0040) — il n'y a plus de `Bullet` voyageur pour le joueur. B (cadence augmentée, même
  cible unique la plus proche) est une extension quasi triviale de ce modèle. C (3 tirs
  simultanés sur des fenêtres adjacentes) demande déjà une résolution multi-cible par
  pression — un vrai delta d'architecture, à cadrer par `senior-architect`. D (cône court +
  **portée réduite**, notion absente du modèle actuel) ajoute une deuxième dimension neuve
  (la portée) en plus du multi-cible. Livrer A-B-C-D d'un coup empile deux inconnues
  d'architecture (multi-cible ET portée) avant même d'avoir joué-testé A-B-C — ça viole le
  garde-fou du pré-spec lui-même ("une variable à la fois", §4.2).
- **Conséquence :** D devient un **fast-follow** une fois A-B-C livré et joué-testé (`verify`),
  pas un YAGNI définitif — le tuning §4.2 du pré-spec reste valable pour cette suite, coût de
  re-design ~nul. **E reste YAGNI**, confirmé (le pré-spec le dit déjà sans ambiguïté et rien
  ici ne le contredit).

### 2. Perte de l'arme spéciale à la mort (règle Metal Slug) : **NON pour V1**

- L'économie actuelle : `lives` décrémente de 1 sur un hit ennemi, sans reset ni séquence de
  "mort" visible (`stateMachine.ts` — `newLives = state.lives - (playerHit ? 1 : 0) + …`),
  la partie continue jusqu'à `lives === 0` → `GAME_OVER`. Il n'y a **pas** de "vie" au sens
  arcade (respawn), donc pas d'équivalent direct du "on perd l'arme en perdant une vie"
  Metal Slug — la mécanique source suppose un respawn immédiat que muf n'a pas.
- Coupler la perte d'arme au `livesDelta` d'un hit ajouterait une **deuxième pénalité
  simultanée** (vie − arme) sur le même événement, sans donnée de playtest justifiant que
  c'est nécessaire — la tension est déjà portée par l'épuisement du stock (§4.2 garde-fous
  du pré-spec : "fenêtres tactiques", pas un état permanent). Ça couple aussi deux systèmes
  (combat/vies × armement) qui sont sinon indépendants — plus de surface à faire valider par
  `senior-architect` pour une story déjà extension.
- **Ruling : NON pour V1.** Le stock de l'arme active est **inchangé** par un hit joueur
  (AC A7 ci-dessous, testée en régression). Revisiter en fast-follow **si** le playtest
  montre un hoarding problématique de l'arme spéciale (le joueur la garde sans risque).

### 3. Rollout : **Belliard-first, confirmé**

- Cohérent avec tous les rollouts précédents (`story-level-roster-belliard.md`, le
  dev-harness non-shippé de la boss QTE ADR-0051, etc.). Rien dans le pré-spec ne justifie
  une exception ici. Belliard reste le niveau de développement/validation ; les autres
  niveaux reçoivent le système une fois validé (pas de nouvelle donnée par niveau requise
  pour A-B-C — la caisse est un spawn générique, pas un script par niveau).

### 4. Hors scope V1 — confirmé + précisions

- **Conteneur glissant** (variante "pod" façon Contra/tonneaux Operation Wolf) : confirmé
  hors scope. Le pré-spec recommande déjà la version fenêtre pour V1 (§5.1) — moins de tech
  neuve, réutilise la state machine de cible existante. Le conteneur glissant reste une
  variante ultérieure, pas de travail de cadrage nécessaire maintenant.
- **Arme E (bombe)** : YAGNI confirmé (voir ruling #1).
- **Noms d'armes finaux / fiction** : les placeholders du pré-spec ("calibre", "sulfateuse",
  "éventail") ne sont **pas** du lore validé (hand-off `narrative-designer` en attente,
  pré-spec §6.5) — non-bloquant pour le dev V1, voir identifiants de code ci-dessous.
- **Style visuel de la caisse / du HUD** : hors scope de cette story au sens "je ne le
  spécifie pas" — c'est le lot du design gate en cours (Karim) + `ux-designer` (layout HUD,
  ADR-0003/0015) + éventuellement `lead-art` (read de la caisse). Je pose une hypothèse de
  travail ci-dessous pour ne pas bloquer le lancement des lanes dev, à confirmer/amender par
  ces gates sans réouverture de story si le changement reste dans l'enveloppe (glyphe +
  contour lumineux).

---

## Modèle V1 (résumé — le détail mécanique reste au pré-spec §4-5, ADAPTÉ au roster A-B-C)

- **Roster :** `base` (∞, mono-cible, cadence actuelle inchangée), `auto` (cadence
  augmentée, même résolution mono-cible-la-plus-proche que `base` — juste plus rapide,
  stock fini), `spread` (3 résolutions simultanées sur des slots horizontalement adjacents
  par pression, stock fini, décompté **par pression** comme le pré-spec §4.2 le prévoit
  pour C). Identifiants de code neutres — pas les noms placeholder du pré-spec (voir ruling
  #4) : `"base" | "auto" | "spread"`.
- **Caisse (`LOOT`) :** apparaît dans une fenêtre, réutilise la state machine de cible
  existante (`HIDDEN→APPEARING→VISIBLE→…`) avec un discriminant distinct de `EnemyKind` —
  tirer dessus ne doit **jamais** passer par le chemin score/vies des ennemis. Porte le
  glyphe de l'arme qu'elle contient, visible avant le tir.
- **Règle "une seule arme" :** tirer une caisse remplace l'arme active immédiatement, stock
  au plein ; le stock restant de l'arme précédente (si spéciale) est perdu. L'arme de base
  ne "range" jamais.
- **Retour auto :** stock spécial à 0 → retour immédiat à `base`, feedback dédié (flash HUD
  + son de culasse à vide) sur ce tick précis, jamais un tir "raté" silencieux.
- **Tuning §4.2 du pré-spec** (cooldowns, dispersion, stock de départ) reste une
  **hypothèse à playtester** via `verify`, pas une valeur gatée — modifiable sans réouverture
  de story tant que la structure (AC ci-dessous) tient.

## Note technique pour `senior-architect` (à trancher au TECH PLAN, pas ici)

- Le tir joueur est un hitscan instantané mono-cible (`resolvePlayerShot`, `bulletSystem.ts`,
  ADR-0040) — pas de `Bullet` voyageur côté joueur. `spread` (3 slots simultanés) et l'event
  `weaponEmpty` (feedback du retour auto) demandent tous deux **plus d'un événement par
  tick** ; `GameState.impactEvents` est aujourd'hui commenté "0 or 1 element (one shot per
  tick)" — cette invariant devra bouger pour `spread`. Signalé, pas résolu ici.
- `LOOT` doit rester **hors** du chemin `ARCHETYPES`/score-vies (`enemyTypes.ts`,
  `resolvePlayerShot`) pour ne jamais produire de `scoreDelta`/`livesDelta` accidentels sur
  un hit de caisse — nouveau discriminant ou nouvelle liste parallèle, au choix de
  l'architecte/dev, tant que `src/game/` reste la seule source de vérité.

---

## Lanes non chevauchantes

### Lane A — `dev-gameplay` (`src/game/**` uniquement, TDD)

- `src/game/types/weapon.ts` (nouveau) — `WeaponKind = "base" | "auto" | "spread"` ;
  `WeaponSpec` (data : cooldownMs, stock de départ ou `Infinity`) ; `WeaponState` (runtime :
  `active: WeaponKind`, `stock: number`). Zéro fonction.
- `src/game/systems/weaponSystem.ts` (nouveau) — pur : résolution d'un tir selon l'arme
  active (mono-cible pour `base`/`auto`, jusqu'à 3 cibles adjacentes pour `spread`),
  décrément de stock, retour auto à `base` sur stock à 0 (+ event dédié), équipement sur hit
  `LOOT`.
- `src/game/systems/__tests__/weaponSystem.test.ts` (nouveau).
- Extension state machine cible / `enemyTypes.ts` ou équivalent pour le discriminant `LOOT`
  (détail laissé à l'architecte, cf. note technique) + tests dédiés.
- `src/game/types/gameState.ts` (édition) — `readonly weapon: WeaponState`.
- `src/game/systems/stateMachine.ts` (édition) — seed `weapon` init `base`/∞, branchement du
  tir sur `weaponSystem` au lieu du chemin mono-cible actuel, spawn du `LOOT` en fenêtre.

**AC (A) :**
A1. `base`, `auto`, `spread` sont des `WeaponKind` distincts avec cooldown et stock propres ;
`base.stock === Infinity`, jamais décrémenté.
A2. Une caisse `LOOT` suit `HIDDEN→APPEARING→VISIBLE→…` avec les mêmes conventions de timing
que les cibles existantes, mais un tir dessus **ne produit jamais** de `scoreDelta`/
`livesDelta` (test de régression explicite contre le chemin `ARCHETYPES`).
A3. Tirer une `LOOT` `VISIBLE` remplace l'arme active par celle portée par la caisse, stock
remis au plein ; le stock restant de l'arme précédente (si non-`base`) est perdu (test :
équiper `auto` à moitié vide puis `spread` → `spread` au plein, pas de report).
A4. `spread` décrémente son stock d'1 unité **par pression** (3 cibles touchées = 1 unité de
stock consommée) ; `auto` décrémente son stock d'1 unité **par round de rafale**
(`BURST_ROUNDS` rounds par pression, décompte round par round, pas par pression) —
*amended per design gate round 2 (P3), pm ack 2026-07-20* : conséquence directe du modèle
rafale-par-pression B4 (VERDICT PASS `docs/game-design/weapons.md`, Karim) sur cette AC
initialement rédigée pm.
A5. `spread` résout jusqu'à 3 cibles éligibles sur des slots horizontalement adjacents en une
seule pression ; `auto` reste mono-cible-la-plus-proche comme `base`, seul le cooldown change.
A6. Stock à 0 → retour **immédiat et automatique** à `base` le même tick, avec exactement un
event `weaponEmpty` sur ce tick (pas de tir "silencieusement raté").
A7. **Régression obligatoire :** un hit joueur (perte de vie) ne modifie ni `weapon.active`
ni `weapon.stock` — testé explicitement (ruling #2).
A8. Tests A1-A7 verts ; `src/game/` toujours sans import React/Three ; `tsc`/ESLint clean.

### Lane B — `dev-r3f-render` (`src/render/**` uniquement)

- Rendu de la caisse `LOOT` dans son slot de fenêtre — **glyphe placeholder dessiné** (SVG/
  Canvas, pattern `GestureIcon.tsx`/`DiagramIcon.tsx` déjà en place dans `src/render/ui/`),
  pas de sprite FLUX généré pour V1 (voir note art ci-dessous) ; halo/glow "ça brille" tant
  que `VISIBLE`.
- Rendu multi-impact pour `spread` (jusqu'à 3 impacts simultanés) — dépend du delta
  d'architecture noté ci-dessus (`impactEvents`).
- `src/render/ui/HUD.tsx` (édition) — glyphe arme active, compteur/pips de stock pour
  `auto`/`spread`, symbole ∞ pour `base`, clignotement des ~20% derniers, flash sur
  `weaponEmpty` (+ son réutilisé/placeholder — pas de nouvel asset audio requis pour V1).

**AC (B) :**
B1. La caisse `LOOT` est visuellement distincte d'une cible ennemie au même type de slot
(pas le même sprite/silhouette) et porte le glyphe de l'arme qu'elle contient, lisible avant
le tir.
B2. La caisse brille (glow/néon) tant qu'elle est `VISIBLE`, conforme à la règle "ce qui
brille est interactif".
B3. HUD : glyphe arme active + stock (numérique ou pips) + ∞ sur `base` + clignotement des
20% derniers — tout dérivé de `GameState.weapon`, aucune règle de jeu dans le rendu.
B4. `weaponEmpty` déclenche un flash HUD + un cue son (réutilisation d'un SFX existant
acceptable pour V1) sur le tick exact de l'event.
B5. `src/render/**` ne fait que consommer `GameState` ; aucune logique de jeu ajoutée.

### Art lane — pas engagée en V1 (à confirmer par le design gate)

Un glyphe dessiné (pattern `GestureIcon`/`DiagramIcon`, déjà utilisé en dehors du pipeline
FLUX) suffit pour la caisse et le HUD en V1 — pas besoin d'une génération de sprite dédiée.
Si le design gate (`lead-game-designer`) ou la revue `lead-art` du read caisse-vs-cibles
juge le placeholder insuffisamment lisible, c'est un fast-follow ciblé (une lane, un
artefact), pas un blocage du lancement des lanes A/B.

---

## Contrat inter-lanes

- `WeaponKind` (`"base"|"auto"|"spread"`) est la clé partagée : Lane A la porte dans
  `GameState.weapon`, Lane B en dérive purement le glyphe/HUD — aucune convention de nommage
  de fichier à coordonner (pas d'asset externe requis pour V1).
- Ensembles disjoints : A = `src/game/**` · B = `src/render/**`. Candidat PARALLEL-SAFE
  (verdict final `senior-architect`, TECH PLAN à trancher notamment sur le point
  `impactEvents`/multi-cible avant de lancer B en toute confiance).

## Out of scope (V1)

Arme D (tromblon, portée réduite) et arme E (bombe) · conteneur glissant · touche/geste de
switch d'arme · perte de l'arme spéciale à la mort · inventaire/roue d'armes · noms d'armes
finaux (fiction) · sprite FLUX dédié pour la caisse/le glyphe · script par niveau (la caisse
est un spawn générique, pas data-driven par niveau comme les livraisons) · tuning final
§4.2 (hypothèse de départ, à affiner via `verify`).

## Dépendances / hand-offs

- Design gate `lead-game-designer` (Karim) tourne en parallèle sur le pré-spec — cette story
  n'attend pas son verdict pour démarrer le TECH PLAN, mais le gate peut amender le modèle
  (§5.4 HUD, §5.1 read caisse) sans rouvrir cette story si l'amendement reste dans
  l'enveloppe A-B-C posée par les rulings ci-dessus.
- `ux-designer` (Tony) : layout HUD arme active + stock desktop **et** tactile
  (ADR-0003/0015) — non-bloquant pour le lancement des lanes A/B (hypothèse de layout dans
  B3 ci-dessus), à réconcilier avant ship.
- `senior-architect` (Winston) : TECH PLAN — trancher le point `impactEvents`/multi-cible
  (`spread`) et le discriminant `LOOT`, écrire ADR-0052 sur cette base.
