# Hand-offs — Run stats system (local-first)

Story: [`_bmad-output/planning-artifacts/story-run-stats-system.md`](../../_bmad-output/planning-artifacts/story-run-stats-system.md)

## 0. INTAKE — producer (Marion) — 2026-07-30

- claim: open the story tracking shard for "Système de stats de run (local-first)", validated by
  Bertrand at the 2026-07-30 brainstorm party-mode roundtable; allocate ADR; record pipeline state.
- release: **ADR-0076 allocated** (`docs/adr/0076-run-stats-system-local-first.md`, scaffolded
  awaiting senior-architect decision content). Story tracking opened.

  **Pipeline committed (per Bertrand intake notes):** pm (scope + story artifact, in parallel with
  this stage) → design loop (game-designer + ux-designer in parallel → lead-game-designer gate) →
  senior-architect (tech plan + ADR decision, may request tech-scout feasibility recon) → dev lanes
  in parallel: dev-gameplay (stats module in `src/game`, pure TDD) ∥ dev-r3f-render (end-of-run
  screen UI + export button) → verify (qa-lead: quality gate + playtest + e2e conformity +
  ux-designer screen review on device classes) → code-review panel (merge gate, 4 reviewers) → pm
  acceptance → merge.

  **Known scope boundaries (from intake):**
  - **Module location:** stats system lives in `src/game` (pure game logic), UI render lives in
    `src/render` (R3F end-of-run screen).
  - **No boundary changes:** existing seams (`src/game`/`src/render`, storage APIs) untouched by
    product scope.
  - **Storage:** local-first (browser `localStorage`, no remote sync in this release).

- next: awaiting pm (John) SCOPE + STORY artifact in parallel. Design loop (game-designer +
  ux-designer) can open immediately from the intake brief and Bertrand's notes; lead-game-designer
  gate will hold until design lane closes.

**Index entry generated; ADR-0076 awaiting content.**

## 1. PM SCOPE + STORY — pm (John) — 2026-07-30

- claim: write the story artifact from the brainstorm consensus and Marion's intake brief
  (§0), staying in the QUOI/POURQUOI lane (no architecture, no file names as decisions). /
  release: story written at
  [`_bmad-output/planning-artifacts/story-run-stats-system.md`](../../_bmad-output/planning-artifacts/story-run-stats-system.md) —
  context/why (player legibility + Bertrand-playtester Discord reporting), player + Bertrand
  user stories, 9 testable ACs, explicit IN/OUT scope (OUT: network, accounts, backend, SaaS
  analytics, and — named explicitly — no duplication of/competition with the Sprint-4
  high-score feature already on `docs/roadmap.md`), risks (duplication with Sprint 4 high
  scores, end-screen UX cost against PROJECT_GUIDELINES §5, scope creep into a full
  analytics suite, determinism drift breaking the `src/game` TDD/purity bar), and a minimal
  v1 event list — deliveries completed, pickups collected, deaths, run duration, final
  score — each justified against the récupérer→livrer→éviter loop and explicitly capped
  (shots fired/accuracy/per-enemy breakdown/near-misses named as cut, not silently dropped).
  Cahier des charges check logged: **EXTENSION CONSCIENTE**, justified (observes the loop,
  doesn't touch it; stays inside the project's existing local-first/no-backend posture;
  playtest-instrumentation purpose stated so a future pivot to networked telemetry needs its
  own scope call, not inherited from this one).
- Two decisions explicitly left open for the design loop (not decided by pm): which 3 of
  the 5 counters are the "headline" metrics on the end-of-run screen, and the screen's
  visual form (fanzine register, per `lead-game-designer` gate).
- next: **design loop** — `game-designer` + `ux-designer` in parallel (may run now, intake
  brief + this story are both available) → `lead-game-designer` design gate. Then
  `senior-architect` for TECH PLAN / ADR-0076 decision content.

## 2. DESIGN LOOP — game-designer (Sacha) — 2026-07-30

- claim: décider les 3 métriques phares, définir précisément les 5 compteurs v1 (événement
  déclencheur dans les systèmes existants, unité, cas limites), spécifier le détail optionnel
  et vérifier l'absence d'incitation perverse contre `Récupérer → Livrer → Éviter`. /
  release: spec écrite à
  [`docs/game-design/spec-run-stats.md`](../game-design/spec-run-stats.md) — statut DRAFT,
  en attente du gate `lead-game-designer`.

- **3 métriques phares retenues** : **SCORE FINAL** (agrégat, déjà à l'écran, clé de tri du
  Sprint 4) · **LIVRAISON** = issue + intégrité restante en % (`Livrer` — le seul verbe qu'on
  peut rater sans s'en apercevoir, puisque la victoire passe par le quota, pas par la
  livraison) · **DÉGÂTS** = cœurs perdus au pas de 0,25 (`Éviter` — le seul verbe dont
  l'échec termine la run, et la métrique la plus fine des trois : 13 valeurs).
  `Récupérer` n'a **pas** de phare : les caisses d'armement ne sont authorées que sur
  belliard, un emplacement phare afficherait `—` sur 3 niveaux sur 4. Servi en détail
  (ligne 1) et via le score. Limite de contenu, pas de design.

- **Trois constats de build qui conditionnent la spec** (§0) : une run = une tentative sur UN
  niveau ; « livraisons effectuées » ne peut valoir que 0 ou 1 (une seule livraison authorée
  par niveau) ; « morts » ne peut valoir que 0 ou 1 (pas de respawn) — et `GAME_OVER` n'est
  PAS synonyme de mort (chrono expiré et boss perdu produisent le même `GAME_OVER`). Deux des
  5 compteurs de `pm` sont donc des booléens déguisés : je les **regradue** (unité changée,
  aucun compteur ni événement ajouté) plutôt que d'en ajouter.

- **Contraintes d'implémentation signalées maintenant, pas au stage 5** : (a) l'issue de
  livraison **doit** être latchée au tick de transition — le véhicule repasse à `PARTI`
  ensuite, l'issue n'est plus lisible dans l'état final ; (b) les cœurs perdus ne sont **pas**
  calculables depuis la variation nette de la jauge (une caisse peut rendre des cœurs), les
  deux sources — dégâts encaissés / faute sur livreur civil — doivent être comptées
  séparément ; (c) les 4 jalons de l'entonnoir doivent être des verrous **indépendants**,
  jamais chaînés : on peut boucler belliard sans jamais déclencher la livraison (quota 10
  avant les 20 s du trigger), le jalon 4 franchi avant le 3 ; (d) l'écran de fin actuel se
  ferme sur un clic n'importe où — y poser un bouton détail et un bouton export est un
  conflit d'entrée direct, contrat exigé en D3.5.

- **Contrôle d'incitation perverse (§5)** : 2 risques réels identifiés, tous deux mitigés par
  les règles existantes (chrono + quota dominent le camping et la course au chrono) — **aucune
  règle nouvelle ajoutée à la boucle**. Deux contraintes contraignantes en sortent : la durée
  reste en détail, jamais en phare et **jamais comparée** (la mettre en avant récompenserait
  la run qui saute `Livrer`) ; et la valeur `0 dégât` ne doit être ni félicitée, ni colorée,
  ni sonorisée — le moment où l'écran célèbre un sans-faute est le moment où camper devient
  rationnel. **Recommandation ferme : ne pas faire l'historique local des N dernières runs en
  v1** (point 6 de la story) — c'est le vecteur de restart-scum.

- 15 critères d'acceptation de conception vérifiables au stage 5 (§6), dont 6 tests
  déterministes (double-hit dispersion sur une caisse, fenêtre d'invulnérabilité, écrêtage du
  coup fatal, soin de caisse ne décrémentant pas les dégâts).

- **7 questions ouvertes pour le gate Karim** (§7), dont 3 qui demandent un aval `pm` :
  Q1 la regraduation de deux compteurs, Q3 « Belliard atteint » → « Belliard **bouclé** »
  (sinon le jalon 4 double le jalon 2 et casse l'ordre annoncé par l'AC6), Q5 l'historique
  local.

- next: `ux-designer` (en parallèle, contrats de lecture et d'entrée D3.4/D3.5 à satisfaire) →
  **gate `lead-game-designer`** (Karim) sur cette spec + la passe UX → `senior-architect`
  (plan tech + contenu ADR-0076). Aucune lane dev ne démarre avant le PASS du gate.

## 2. DESIGN LOOP — ux-designer (Tony) — 2026-07-30

- claim: spec the FORM of the end-of-run screen (layout hierarchy, "copier mon rapport"
  button, optional detail expansion, funnel visibility, accessibility) for both device
  classes — in parallel with `game-designer` (Sacha), who owns WHICH 3 counters are
  headline. This section does not touch her lane.
- release: spec written at
  [`docs/game-design/ux/ux-run-stats-endscreen.md`](../game-design/ux/ux-run-stats-endscreen.md).
  Key choices:
  - **Layout:** existing single `.score` line replaced by a 3-slot headline row (equal
    weight, generic — fills with whatever 3 metrics Sacha names), plus two new opt-in
    rows below it: `[ ▾ DÉTAIL DE LA COURSE ]` (accordion, all 5 counters, closed by
    default) and `[ COPIER MON RAPPORT ]`. Existing dismiss-to-menu prompt/behaviour
    unchanged in position. Desktop and mobile-landscape share one structure; the only
    per-device delta is the open detail panel's internal grid (2-column desktop vs
    1-column mobile, height being the scarce axis on mobile landscape) — no ADR-0015-
    style device fork needed since there's no gesture-vocabulary difference here.
  - **New hazard flagged + closed:** the two new interactive rows sit inside
    `EndScreen`'s existing whole-overlay click-to-dismiss target; spec requires
    `stopPropagation` on both new controls so a mis-tap doesn't accidentally dismiss to
    menu — this is what keeps AC9's "single action" restart guarantee honest once the
    screen gains interactive children.
  - **"Copier mon rapport":** own row, after the detail toggle, before the dismiss
    prompt. Strawman label `[ COPIER MON RAPPORT ]` for Yasmine to adjust (bracketed
    house-style verb+object, matches existing button conventions). Success feedback is
    an in-place 2.5s text swap (`→ [ ✓ RAPPORT COPIÉ ]`) plus an `aria-live="polite"`
    announcement — no toast/modal, no reduced-motion special-case needed (discrete text
    swap, not an animation). Fallback on clipboard rejection (AC5): the row expands to a
    pre-selected read-only `<textarea>` with the JSON, device-aware instruction copy
    (`(⌘/CTRL+C)` desktop vs `(sélectionne le texte et copie-le)` mobile — same
    ADR-0015-style device-wording discipline, applied not re-litigated), never a silent
    no-op, always recoverable.
  - **Detail panel:** native `<button>` disclosure, `aria-expanded`/`aria-controls`,
    ≥44×44px hit area both device classes, instant open/close under
    `prefers-reduced-motion: reduce` (reuses the project's existing OS-media-query
    mechanism, no new pref).
  - **Funnel visibility (§4 of the spec):** **decided purely internal in v1** — no
    funnel UI anywhere on this screen or elsewhere; its only surfaced consumer is the
    "copier mon rapport" JSON payload. Justified against the story's own OUT-of-scope
    framing (funnel is read-only instrumentation, not a reward mechanic, this cycle) and
    the cahier des charges (Prohibition 1987 had no milestone UI at all — invisible
    funnel needs no extension justification; a visible one would).
  - **Accessibility:** consolidated 10-item checklist (§5 of the spec) — hit areas,
    `aria-live`/`aria-expanded`, reduced-motion, contrast-via-existing-tokens, focus
    order, and the propagation-stop check, each with a stated e2e/manual verification.
- Open questions logged for the `lead-game-designer` gate (full detail in spec §"Open
  questions"): (1) confirm funnel stays silent even in the export-diff sense (no
  "newMilestonesThisRun" field this cycle — default is no, YAGNI, revisit only if
  Bertrand-as-playtester asks); (2) confirm the overlay-click `stopPropagation`
  requirement reads as spec, not implementation overreach; (3) confirm mobile
  single-column detail-panel density is an acceptable "different device, not a smaller
  one" call without a measured mock.
- next: `lead-game-designer` (Karim) design gate — needs this spec + Sacha's gameplay
  spec (3-metric choice) together before PASS/changes-requested.

## 2bis. RESERVES TRANSCRIBED — ux-designer (Tony) — 2026-07-30

- claim: transcribe the gate's (§3 below) blocking reserves R1, R2, R3, R4 (mine) and R5
  (Sacha's, placed in my lane) into `ux-run-stats-endscreen.md`, plus ratify T1.
- release: reserves transcribed — R1 (`stopPropagation` replaced by a single non-closing
  controls block with ≥24px inert padding, §1.4), R2 (measured per-slot character
  budget for H2's variable-length outcome string, §1.2c, headline row no longer assumed
  short/numeric), R3 (detail = Sacha's 7 lines, headline metrics repeated, §3.1 rewritten,
  "never a duplicate" framing withdrawn), R4 (ASCII mock corrected to `SCORE FINAL /
LIVRAISON / DÉGÂTS`, `VAGUE`'s visibility regression logged as ruled and accepted, §1.2),
  R5 (end-of-run cause added as a 0-input, non-headline subhead, §1.2a/1.2b, new AC A11).
  T1 ratified (funnel silent end-to-end, no change needed). Accessibility checklist
  extended (A11, A12) and A1/A2/A7/A9/A10 amended to match. Spec status flipped to
  **GATED (design)**.
- next: `senior-architect` — tech plan / ADR-0076 decision content, per both amended
  specs.

## 3. DESIGN GATE — lead-game-designer (Karim) — 2026-07-30

### Verdict

**PASS WITH RESERVES — both deliverables.**

| Deliverable                                     | Author                  | Verdict                                               |
| ----------------------------------------------- | ----------------------- | ----------------------------------------------------- |
| `docs/game-design/spec-run-stats.md`            | Sacha (`game-designer`) | **PASS with reserves** (R1, R3, R5 to transcribe)     |
| `docs/game-design/ux/ux-run-stats-endscreen.md` | Tony (`ux-designer`)    | **PASS with reserves** (R1, R2, R3, R4 to transcribe) |

Round 1 of 2 — the reserves are **transcriptions, not rework**: no re-gate needed, the
amended specs go straight to `senior-architect`. Round cap not consumed.

Gate checks, in order:

1. **Scope / cahier des charges.** EXTENSION CONSCIENTE, already ruled and justified by
   `pm`; both specs restate it correctly. Sacha's spec adds **zero verb, zero rule, zero
   event source** — every counter branches on a transition that already exists in the tick.
   Tony's funnel ruling (invisible ⇒ no extension justification needed at all) is right.
   Verified against the build: 4 playable levels (`belliard`, `stalingrad`, `vitry`,
   `niveau-final`) each author **exactly one** delivery (`levels.data.ts:60/170/191/252`)
   and only `belliard` authors `loot` (`levels.data.ts:122`) — F2 and D1.4 confirmed
   byte-for-byte. The tutorial never produces a run (`App.tsx:392` routes it to `TUTORIAL`,
   no game state), so "universelle sur tous les niveaux publiés" holds.
2. **Core loop / 3-5 min.** Served, not diluted: 3 phares = 0 input, detail + export = 1
   optional input each, dismiss unchanged at 1 input. No mandatory step added to the
   restart loop (story AC9, guidelines §5). The end screen sits **after** the run, so the
   3-5 min mission ceiling is untouched.
3. **Verifiability.** Sacha's spec is implementable without guessing: every counter has an
   event, a unit, a rounding rule, a latch rule and a limit-case table; 15 design ACs, 6 of
   them deterministic tests. Tony's spec has 10 a11y ACs with stated verifications. Nothing
   sent back for missing values.
4. **Coherence.** Four mechanics↔form contradictions found (R1-R4 below) — none fatal, all
   resolved by ruling in this gate. No art-bible conflict: Tony explicitly hands the visual
   register to `lead-art` and pins "existing `--ink-*`/`--stock-*` tokens, no new hex" (A9).

### Decisions — one line per open question

**Sacha (§7)**

| Q      | Ruling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | PM aval                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Q1** | **RATIFIÉE — regraduation dans ta lane.** Livraison → issue + intégrité, morts → cœurs perdus + cause de fin. À événements constants (aucune source nouvelle), à compteurs constants (5), et l'AC3 de la story reste satisfaite par les lignes 1-5 du détail. Une unité n'est pas un périmètre. Mieux : la cause de fin **répare** une règle non-négociable (guidelines §5.4 « chaque mort/échec : raison explicite affichée ») que l'écran actuel ne tient pas — voir R5.                                                                                                                                                                                                                                                         | **Non** (périmètre constant). `pm` informé pour acceptation.                                             |
| **Q2** | **GRADUATIONS, toutes deux IN.** Dénominateur caisses : même chaîne d'événements, sans lui le numérateur ne veut rien dire ; aucune ligne d'écran de plus (ligne 1 du détail). Décomposition dégâts/fautes : **techniquement obligatoire**, la variation nette de la jauge est polluée par les soins de caisse (`livesDelta: 2` sur le drop `spread`, `levels.data.ts:131`) — sans les deux termes le compteur est faux, pas juste moins riche.                                                                                                                                                                                                                                                                                    | **Non**.                                                                                                 |
| **Q3** | **« Belliard BOUCLÉ »** (`LEVEL_COMPLETE` sur belliard). `belliard` est `unlocked: true` et jouable immédiatement : « atteint » double le jalon 2 et se franchit avant le jalon 3. Même nombre de jalons, même irréversibilité, source d'événement différente ⇒ pas d'élargissement. **D4.3 RATIFIÉE** : les 4 jalons sont des verrous **indépendants**, jamais chaînés — le « dans l'ordre » de l'AC6 est descriptif, pas mécanique (contre-exemple réel : quota 10 avant les 20 s du trigger de livraison).                                                                                                                                                                                                                      | **Rédactionnel** : `pm` amende le libellé du jalon 4 et le « in order » de l'AC6. Ne bloque aucune lane. |
| **Q4** | **NON en v1 — v1.1.** « Neutralisations / quota » est un 6ᵉ compteur : c'est le seul de la liste qui élargirait vraiment le périmètre `pm`, et YAGNI le tranche. Le quota est déjà lisible en jeu ; la cause `QUOTA` (§2.6) en porte l'issue. Consigné comme premier candidat v1.1, sans engagement.                                                                                                                                                                                                                                                                                                                                                                                                                               | (n/a — refus)                                                                                            |
| **Q5** | **PAS d'historique de runs en v1 — recommandation SUIVIE.** Le point 6 de la story était déjà conditionnel (« only if it stays cheap ») ; c'est une **réduction** de périmètre. Motifs cumulés : restart-scum (§5.3), et surtout collision réelle avec les meilleurs scores qui sont **déjà en production** (`highScoreSystem.ts`, clés `muf_scores_<levelId>` / `muf_player_name`) — un second journal local ferait deux sources de vérité sur « comment s'est passée cette run ». Le risque #1 de la story tombe de moitié.                                                                                                                                                                                                      | **Non** (réduction). `pm` informé.                                                                       |
| **Q6** | **Ça passe par moi, pas par une nouvelle passe `ux-designer`.** Le clic-partout de `EndScreen` est un comportement **de fait** (`EndScreen.tsx:19`), jamais gaté comme décision de design : aucune spec de l'index ne le pinne (`spec-menus-ui-completion.md` n'insère que `NAME_ENTRY` en amont). Le contrat D3.5 est donc un **prérequis de jouabilité**, pas une renégociation d'une surface gatée. Ratifié tel quel, avec R1 qui comble le seul point que la passe UX ne couvre pas.                                                                                                                                                                                                                                           | **Non**.                                                                                                 |
| **Q7** | **COPIE NEUTRE, hors fiction — `narrative-designer` N'EST PAS engagée sur ce cycle.** Les 7 libellés du détail, les 5 causes de fin et les 5 issues de livraison sont du diagnostic : la voix fanzine y ajouterait de l'ambiguïté là où on veut de la précision, et le rapport copié doit se lire pareil dans Discord et à l'écran. Les 2 libellés de bouton de Tony (`[ COPIER MON RAPPORT ]`, repli) sont des clones de house-style d'une chaîne déjà en production (`[ CLIQUER POUR RETOURNER AU MENU ]`) — pas de round Yasmine pour ça non plus. **Y compris pour R5** : le sous-titre « cause de fin » sur la UNE reste **neutre et typographiquement subordonné**, un seul vocabulaire de cause à l'écran et dans l'export. | (n/a)                                                                                                    |

**Tony (§Open questions)**

| Q      | Ruling                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T1** | **CONFIRMÉ : entonnoir silencieux de bout en bout, y compris dans l'export.** Pas de champ `newMilestonesThisRun` ce cycle — YAGNI, et un « ce qui a changé depuis » est un diff, donc un état persistant de plus à écrire au moment d'un événement de navigation. L'export porte l'**état** des 4 jalons (story AC4), pas leur delta. À rouvrir seulement sur demande explicite de Bertrand-playtesteur. |
| **T2** | **CONFIRMÉ : c'est de la spec, pas de la surenchère d'implémentation** — Sacha l'exige indépendamment (D3.5.1), deux lanes convergent. Reformulé en **exigence de comportement**, pas en instruction technique : « aucune entrée atteignant le bloc de contrôles n'atteint le handler de fermeture » ; le mécanisme (`stopPropagation` ou autre) appartient à `dev-r3f-render`.                           |
| **T3** | **Panneau de détail : ACCEPTÉ sans maquette mesurée** (1 colonne en paysage mobile, la hauteur est bien l'axe rare). **Bandeau phare : REFUSÉ sans mesure** — voir R2 : la prémisse « 3 short numeric slots » est fausse une fois H2 branchée.                                                                                                                                                            |

### Réserves

**Bloquantes** (à transcrire dans les specs avant que la lane concernée n'ouvre) :

- **R1 — Le contrat d'entrée ne converge qu'aux deux tiers. [Sacha D3.5 ↔ Tony §1.4] — bloque `dev-r3f-render`.**
  `stopPropagation` sur les deux contrôles satisfait D3.5.1 et D3.5.3, **pas D3.5.2** (le
  tap qui manque la cible de moins d'une hauteur de contrôle ne doit pas fermer l'écran) —
  une cible de 44 px n'est pas une marge d'erreur. **Ruling :** les deux contrôles, le
  panneau de détail ouvert et le `<textarea>` de repli vivent dans **UN SEUL bloc de
  contrôles non-fermant**, avec **≥ 24 px de padding inerte** sur les quatre côtés (≈ la
  moitié d'une hauteur de cible = l'erreur de pouce réaliste ; valeur pinnée pour être
  testable, et bornée pour ne pas manger la surface de fermeture en paysage mobile). Tout
  ce qui est hors de ce bloc ferme comme aujourd'hui. Tony amende §1.4 et l'AC A7 (« cliquer
  dans le padding inerte ne déclenche pas `onRestart` ») ; Sacha marque D3.5.2 comme résolu.
- **R2 — H2 n'est pas un slot numérique court. [Tony §1.2/§1.3] — bloque `dev-r3f-render`.**
  Tout l'argument « les 3 colonnes tiennent en paysage mobile, 3 courts slots numériques ne
  sont pas un paragraphe » s'effondre sur la valeur réelle de H2 : `NON DÉCLENCHÉE`,
  `INTERROMPUE — 78 %`, `RÉUSSIE — intégrité 100 %`. **Ruling :** Tony pinne un **budget de
  caractères par slot phare** (mesuré au plus long libellé, en paysage mobile réel, à la
  largeur de police du bandeau) ; si le budget ne passe pas, il commande à Sacha les formes
  abrégées des 5 issues et Sacha les fournit — la troncature silencieuse et la réduction de
  corps sous le seuil de lisibilité sont toutes deux interdites. Une capture mesurée
  suffit, pas une maquette complète.
- **R3 — Contradiction frontale sur le contenu du détail. [Tony §3.1 ↔ Sacha D3.2/D3.1] — bloque les deux lanes dev.**
  Tony : « strictly additive, never a duplicate re-list of the headline row » et « all 5 v1
  counters ». Sacha : les 3 phares **réapparaissent** dans le détail, qui compte **7 lignes**.
  **Ruling : Sacha gagne, sans réserve** — le détail est le bloc qu'on lit à voix haute et
  qu'on copie, il doit être complet et autoportant ; et l'AC3 de la story exige les 5
  compteurs dans le détail, ce que la lecture « additive » de Tony viole littéralement.
  Tony réécrit §3.1 : 7 lignes, l'ordre de D3.1 est **imposé** (les 3 verbes puis le méta),
  et son AC A1/A2 renvoie à D3.1 plutôt qu'à « the remaining 2 ».
- **R4 — La maquette ASCII de Tony §1.2 nomme le mauvais trio. [Tony §1.2] — bloque `dev-r3f-render`.**
  `SCORE | LIVRAISONS | VAGUE` n'est pas le trio gaté : c'est `SCORE | LIVRAISON (issue +
intégrité) | DÉGÂTS (cœurs perdus)`, et `VAGUE` est la **ligne 7 du détail**. Le spec dit
  « generic, fills with whatever 3 Sacha names » mais un dev lit le dessin. À corriger dans
  le bloc ASCII. **Conséquence assumée et ruled :** `VAGUE`, aujourd'hui toujours visible
  (`EndScreen.tsx:38`), passe derrière un tap. C'est une **régression de visibilité
  consciente et acceptée** — la vague ne répond pas à « comment s'est passée la run » ; elle
  reste au détail (ligne 7) et dans l'export. Consigné ici pour que la revue de code ne la
  rouvre pas.
- **R5 — La cause de fin doit être lisible sans aucune entrée. [Sacha §2.6 + Tony §1.2] — bloque `dev-r3f-render`.**
  Guidelines §5, règle 4 (**non négociable**) : « chaque mort/échec : raison explicite
  affichée ». Trois causes sur cinq produisent le même `GAME_OVER` et le titre actuel
  (`LE LIVREUR DU 19ÈME INTERPELLÉ`) n'est pas une raison. Mettre la cause **uniquement** en
  ligne 6 du détail, donc derrière un tap opt-in, laisse la règle non tenue. **Ruling :** la
  cause de fin est affichée **à 0 entrée**, et **ne consomme pas** un des 3 emplacements
  phares (l'AC2 de la story tient : 3 métriques, exactement). Elle n'est pas une métrique :
  c'est le sous-titre de la UNE. **Placement, hiérarchie et forme = lane `ux-designer`**
  (Tony ajoute la ligne à §1.2 et un AC de vérification) ; copie neutre par Q7 ; aucune
  donnée nouvelle (la cause est déjà spécifiée en §2.6). Elle reste **aussi** en ligne 6 du
  détail par D3.2 (autoportance).

**Non bloquantes** (advisories — à porter au stage 5 / aux lanes nommées) :

- **A1 — `muf_player_name` est un identifiant stable et il existe déjà.**
  D3.6 interdit « tout identifiant stable qui rendrait deux rapports rattachables au même
  humain ». Le byline joueur (`highScoreSystem.ts:15`, `muf_player_name`) est exactement ça
  et il est déjà en `localStorage`. **Pin explicite pour `senior-architect` : il ne doit PAS
  entrer dans la charge exportée**, ni directement ni via une reprise du bloc high-score.
- **A2 — Clés de stockage : quatre familles `muf_*` existent déjà** (`muf_prefs`,
  `muf_progress`, `muf_scores_<levelId>`, `muf_player_name`). L'AC7 de la story est donc
  vérifiable dès maintenant contre du réel. Le nommage de la (des) clé(s) de l'entonnoir
  appartient à `senior-architect` ; la contrainte de design est : **une clé distincte, aucun
  partage d'état mutable avec les quatre existantes**.
- **A3 — D3.3 « aucune comparaison inter-runs » est ratifiée MAIS scopée à l'écran de fin.**
  Le jeu compare déjà des runs ailleurs et c'est gaté (meilleur score par niveau sur le mur
  de flyers, `LevelFlyer.tsx:166`). Ce n'est **pas** une violation de D3.3 et la revue ne
  doit pas la lever comme telle. La règle : pas de comparaison **sur `EndScreen`**.
- **A4 — La branche `—` de la ligne LIVRAISON est morte sur le contenu publié** (les 4
  niveaux jouables authorent chacun une livraison). À garder en défensif, mais **ne pas
  dépenser une run de vérification** dessus au stage 5. La branche `—` des caisses, elle,
  est atteignable sur 3 niveaux sur 4 (AC-8 pertinent).
- **A5 — Score négatif (D2.5.3) :** vérifier au stage 5 que la chaîne d'affichage ne le
  plancherait pas à 0 quelque part en amont, et qu'il traverse aussi l'export.
- **A6 — Séquence de fin de run :** `NAME_ENTRY` s'intercale déjà avant `EndScreen`
  (gate menus 2026-07-20, Q2). Le coût total « fin de run → rejouer » se mesure au stage 5
  **de bout en bout**, pas sur `EndScreen` seul — c'est là que l'AC9 se joue vraiment.
- **A7 — Seam Sprint 4 :** les meilleurs scores sont partiellement en production. Quand la
  story Sprint 4 reprendra la main sur `EndScreen`, D3.3 et cet écran devront être relus
  ensemble (`pm` + `senior-architect`), pas fusionnés par accident.

### Ce qui part chez `senior-architect`

Les deux specs, **amendées de R1-R5**, plus les pins suivants pour le contenu d'ADR-0076 :
schéma/nommage/versionnement de l'export (contenu sémantique figé par D3.6), clé(s) de
stockage de l'entonnoir distinctes des quatre `muf_*` existantes (A2), exclusion explicite
de `muf_player_name` de la charge (A1), latch d'issue de livraison et double source des
cœurs perdus comme contraintes d'implémentation dures (D2.2.2, D2.3.2), verrous d'entonnoir
indépendants et non chaînés (D4.3/Q3). Découpage attendu : `dev-gameplay` (compteurs purs,
TDD — non bloqué par R2/R4/R5) ∥ `dev-r3f-render` (bandeau phare, bloc de contrôles
non-fermant, export — bloqué par R1/R2/R4/R5 jusqu'à transcription).

- next: `game-designer` + `ux-designer` transcrivent R1-R5 (pas de re-gate) →
  `senior-architect` (plan tech + ADR-0076). `pm` : deux amendements rédactionnels de story
  (jalon 4 « Belliard bouclé », AC6 « in order » descriptif) et deux informations de
  périmètre (regraduation Q1, historique de runs coupé Q5).

## 4. TECH PLAN — senior-architect (Winston) — 2026-07-30

- claim: transformer les deux specs gatées + les rulings du §3 en plan technique buildable,
  écrire le contenu de décision d'ADR-0076, découper les lanes dev sur des chemins
  non-chevauchants. /
  release: **ADR-0076 rédigé et passé en `Accepted`**
  ([`docs/adr/0076-run-stats-system-local-first.md`](../adr/0076-run-stats-system-local-first.md)),
  index ADR régénéré (`node scripts/gen-adr-index.mjs --write` → 76 ADR, registre en phase).
  Les deux specs gatées sont transcrites (R1-R5) et font foi. **Aucune lane n'est bloquée.**

### 4.1 Architecture — la décision en une lecture

Lue dans le build, la difficulté n'est pas de compter : c'est que **trois faits sur cinq sont
détruits par le tick qui les produit ou non reconstituables après coup** (issue de livraison
écrasée par `→ GONE` ; cœurs perdus non déductibles du delta de jauge, polluée par les soins de
caisse ; `GAME_OVER` qui recouvre trois causes). Et `tickGameState` a **sept sites de retour** :
tout design qui demande de toucher les sept en oubliera un.

D'où la forme retenue (détail et justification : ADR-0076 D1-D7) :

| Couche                          | Quoi                                                                                                                                                                                  | Où                                                                | Pur ?      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---------- |
| Accumulateur                    | `RunStats` — **uniquement l'irrécupérable** : caisses ramassées/apparues, cœurs perdus décomposés (dégâts / fautes), jauge de départ, latch d'issue de livraison + intégrité au latch | champ `stats` de `GameState`, plié **une seule fois** par tick    | oui        |
| Dérivation                      | `RunSummary` — tout ce qui se déduit de l'état terminal : score, durée, vague, cause de fin, issue de livraison (5 valeurs), ratio caisses                                            | `buildRunSummary(state)`, appelé à la lecture                     | oui        |
| Rapport                         | `RunReport` + sérialisation JSON `muf.run-report` v1                                                                                                                                  | `buildRunReport(summary, funnel, levelId)` / `serializeRunReport` | oui        |
| Entonnoir (algèbre)             | `parseFunnel` total, `withMilestones` idempotent, `milestonesFromRun`                                                                                                                 | `src/game/systems/runFunnelSystem.ts`                             | oui        |
| Entonnoir (I/O) + presse-papier | `localStorage` `muf_funnel`, `navigator.clipboard`                                                                                                                                    | `src/hooks/**` — **jamais** `src/game`                            | non, isolé |

Points durs verrouillés par le plan, chacun repris d'un ruling du §3 :

- **Latch de livraison (D2.2.2)** : le fait est hissé hors de la branche
  `wasPhase === "DELIVERING" && (SUCCESS|FAILED)` qui existe déjà, écrit **une fois**, jamais
  ré-écrit — un `SUCCÈS` suivi d'un `GAME_OVER` reste `RÉUSSIE`.
- **Double source des cœurs perdus (D2.3.2)** : `TriggerResult` gagne **un** champ additif
  `faultLivesDelta` (le terme livreur civil, déjà séparé dans les branches de `resolveTrigger`).
  On ne filtre **pas** `pointFeedback` sur le signe de `livesDelta` : cette heuristique casse en
  silence à la première caisse à récompense négative. Les dégâts encaissés viennent du
  `damageTaken` local, déjà borné par la fenêtre d'invulnérabilité.
- **Cause de fin** : **dérivée**, pas accumulée — précédence boss gagné → boss perdu → santé →
  temps → quota, fonction totale de l'état terminal. Zéro point de contact dans le tick.
- **Verrous d'entonnoir indépendants (D4.3)** : la valeur stockée est un **objet de 4 booléens**,
  fusionné en OU (jamais une liste ordonnée) — boucler Belliard sans avoir vu la livraison
  n'efface rien.
- **Ramassage à l'arme à dispersion (AC-4)** : garanti **structurellement**, pas par un compteur
  — la caisse est consommée par le premier projectile, les offsets 2 et 3 ne la voient plus.

Deux points remontent aux lanes amont, sans bloquer le dev :

- **ADR-0076 C6 / advisory A5 — `game-designer` + `pm`** : D2.5.3 (« score négatif affiché tel
  quel ») est **inatteignable dans le build** — `tickGameState` plafonne déjà le score à 0
  (`Math.max(0, …)`). Le rendre atteignable serait changer une règle de score depuis une
  fonctionnalité qui a promis d'observer. **Ruling : aucun changement de code**, l'export porte
  le score tel que le jeu le tient (≥ 0). À corriger dans la spec, pas dans le tick.
- **`ux-designer` / `narrative-designer`** : l'export porte les tokens **ASCII pliés majuscules**
  (`SANTE`, `BOSS_GAGNE`, `NON_DECLENCHEE`…) et l'écran les libellés accentués. Une seule
  vocabulaire (mêmes cinq mots, zéro synonyme), un seul point de correspondance côté render —
  lecture retenue de Q7/R5 : l'accent est de la typographie, pas du vocabulaire.

### 4.2 Le CONTRAT entre les deux lanes

**Un seul fichier partagé, un seul auteur.**
**`dev-gameplay` écrit `src/game/types/runStats.ts` ; `dev-r3f-render` l'importe en lecture
seule et ne l'édite jamais.** C'est un module `types/` : types uniquement, zéro fonction
(convention `src/game/types/**`).

Il porte : `RunStats`, `RunStatsTickFacts`, `RunSummary`, `EndCause`, `DeliveryIssue`,
`FunnelState`, `Milestone`, `RunReport`, et la constante `FUNNEL_STORAGE_KEY = "muf_funnel"`.

Signatures gelées maintenant (`dev-r3f-render` code contre elles avant même qu'elles existent,
avec une fixture locale de `RunSummary` dans ses propres tests) :

```ts
// src/game/systems/runStatsSystem.ts
export function createRunStats(heartsAtStart: number): RunStats;
export function foldRunStats(prev: RunStats, facts: RunStatsTickFacts): RunStats;
export function buildRunSummary(state: GameState): RunSummary; // PAS de levelId

// src/game/systems/runFunnelSystem.ts
export const EMPTY_FUNNEL: FunnelState;
export function parseFunnel(raw: string | null): FunnelState; // total, ne jette jamais
export function withMilestones(f: FunnelState, ms: readonly Milestone[]): FunnelState; // OU idempotent
export function milestonesFromRun(summary: RunSummary, levelId: string): readonly Milestone[];

// src/game/systems/runReport.ts
export function buildRunReport(
  summary: RunSummary,
  funnel: FunnelState,
  levelId: string,
): RunReport;
export function serializeRunReport(report: RunReport): string;
```

Trois règles de contrat, vérifiables en revue :

1. **`dev-r3f-render` ne lit JAMAIS `GameState.stats`.** L'accumulateur est privé à la couche
   pure ; le render consomme `RunSummary` (projeté par `useGameLoop` dans `HudData`) et les deux
   builders. Aucune règle d'arrondi, aucun `—` vs `0`, aucune précédence de cause côté render.
2. **`dev-r3f-render` ne réimplémente aucune de ces fonctions**, même « en attendant » : il code
   contre la signature, avec une fixture de test locale.
3. **`dev-gameplay` ne touche ni `src/render/**`ni`src/hooks/**`** ; `dev-r3f-render` ne touche
   pas `src/game/**` (y compris les tests de `src/game`).

### 4.3 Lanes — chemins exacts, non chevauchants

**Lane A — `dev-gameplay` (TDD, `src/game/**` uniquement)\*\*

Nouveaux :

- `src/game/types/runStats.ts` — **le contrat (commit 0, à pousser en premier)**
- `src/game/systems/runStatsSystem.ts`
- `src/game/systems/runFunnelSystem.ts`
- `src/game/systems/runReport.ts`
- `src/game/systems/__tests__/runStatsSystem.test.ts`
- `src/game/systems/__tests__/runFunnelSystem.test.ts`
- `src/game/systems/__tests__/runReport.test.ts`

Édités :

- `src/game/types/gameState.ts` — `+ readonly stats: RunStats`
- `src/game/systems/stateMachine.ts` — seed dans `createInitialState` (depuis
  `params.lives`) ; **un** appel `foldRunStats` juste après `newLives` ; report explicite sur
  les **trois** sites de retour situés en dessous (`newLives <= 0`, expiration du chrono,
  retour normal). Les six retours au-dessus propagent déjà `...state`.
- `src/game/systems/weaponSystem.ts` — `+ faultLivesDelta: number` sur `TriggerResult`
  (additif, sans changement de comportement)
- `src/game/systems/__tests__/stateMachine.test.ts`, `.../weaponSystem.test.ts`,
  `.../deliveryAssaultTick.test.ts`, `src/game/levels/__tests__/belliardBoss.test.ts`,
  `.../validateLevel.test.ts` — mise à jour des fixtures qui construisent un `GameState`
  littéral (le champ est requis ⇒ `rtk tsc` les signalera toutes)

Tests obligatoires (couvrent AC1/AC8 story + AC-4/5/6/7/11/12 spec) : ramassage unique sous
dispersion · deux projectiles dans la même fenêtre d'invulnérabilité · écrêtage du coup fatal à
`heartsAtStart` · soin de caisse ne décrémentant pas les cœurs perdus · latch de livraison qui
survit à un `GAME_OVER` postérieur · `NON_DECLENCHEE` sur quota avant le trigger · les cinq
causes de fin · `parseFunnel` sur blob corrompu / champ inconnu / `null` · `withMilestones`
idempotent et non chaîné · **test de non-régression : les six retours précoces laissent `stats`
inchangé** · `serializeRunReport` ne contient jamais `muf_player_name` ni d'horodatage.

**Lane B — `dev-r3f-render` (`src/render/**`+`src/hooks/**`)**

Nouveaux :

- `src/hooks/runFunnelStorage.ts` — adaptateur `localStorage` impur (get/set + try/catch
  avalé, comme les quatre propriétaires existants)
- `src/hooks/useRunReport.ts` — charge utile + `navigator.clipboard` + états
  `idle | copied | failed` (repli AC5)
- `src/render/ui/RunDetailPanel.tsx` + `RunDetailPanel.module.css` — les **7 lignes verbatim**
  de D3.1, dans cet ordre
- `src/render/ui/runStatsLabels.ts` — **l'unique** correspondance token → libellé accentué
- `src/render/ui/__tests__/EndScreen.runStats.test.tsx`, `src/hooks/__tests__/useRunReport.test.ts`

Édités :

- `src/render/ui/EndScreen.tsx` + `src/render/ui/EndScreen.module.css` — sous-titre cause de fin
  (0 entrée, R5), bandeau 3 phares (R2/R4), **bloc de contrôles non-fermant unique avec ≥ 24 px
  de padding inerte** (R1), accordéon, ligne export, repli `<textarea>`
- `src/render/ui/hud/types.ts` — `+ runSummary?: RunSummary | undefined` sur `HudData`
- `src/hooks/useGameLoop.ts` — projeter `buildRunSummary(state)` dans `HudData` sur phase
  terminale (idempotent : l'état terminal est figé)
- `src/render/scene/App.tsx` — passer `runSummary` à `EndScreen` ; écrire les jalons
  `titleSeen` / `tutorialCleared` (événements de navigation) et
  `milestonesFromRun(summary, selectedLevel.id)` en fin de run ; fixture de résumé pour le
  harnais `?preview=end` (aujourd'hui il fabrique un `hudData` factice — sans fixture l'écran de
  capture casse)

**Zéro fichier en commun.** Le seul point de contact est `src/game/types/runStats.ts`, écrit par
A, importé par B. `src/render/ui/hud/types.ts` est bien lane B (`HudData` vit côté render).

### 4.4 Ordre

1. **A, commit 0 (~30 min)** : `src/game/types/runStats.ts` seul, poussé, tsc vert. Débloque B.
2. **A ∥ B en parallèle**, sans point de synchronisation.
3. **Intégration = lane B**, une fois A mergée : `App.tsx` / `useGameLoop.ts` branchent les vraies
   fonctions à la place des fixtures. **Seule étape sérialisée du plan.**
4. Stage 5 (`qa-lead`) : quality gate + playtest `game-designer` (AC-1→AC-15) + revue
   `ux-designer` sur les deux classes d'appareils (A1→A12, dont la capture mesurée de R2) +
   vérif navigateur des jalons après rechargement.

### 4.5 Risques résiduels

| #   | Risque                                                                                   | Mitigation / propriétaire                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Le champ `stats` requis casse toute fixture `GameState` littérale du repo                | `rtk tsc` les liste exhaustivement ; lane A les corrige dans le même commit. Aucune n'est côté render (vérifié : le render ne consomme que des sous-tranches).                                                          |
| 2   | R2 (budget de caractères H2) demande une **capture mesurée** en paysage mobile réel      | Ne bloque pas la structure ; à produire par `dev-r3f-render` au stage 5, `ux-designer` valide. Si le budget ne passe pas : `game-designer` fournit les formes abrégées des 5 issues (troncature silencieuse interdite). |
| 3   | Le seuil de ≥ 24 px de padding inerte mange de la surface de fermeture en paysage mobile | Testable (A7 (a)(b)(c)) : le cas (c) — un tap **hors** du bloc ferme toujours — est la garantie AC9. À mesurer sur les deux classes.                                                                                    |
| 4   | Séquence de fin réelle = `NAME_ENTRY` puis `EndScreen` (advisory A6)                     | Le coût « fin de run → rejouer » se mesure **de bout en bout** au stage 5, pas sur `EndScreen` seul.                                                                                                                    |
| 5   | Deux conventions de stockage coexistent (ADR-0076 C4)                                    | Assumé et documenté dans l'ADR. **Interdiction explicite** de migrer les quatre existants dans cette story.                                                                                                             |
| 6   | Sprint 4 (meilleurs scores) reprendra `EndScreen`                                        | Advisory A7 : relecture conjointe `pm` + `senior-architect` à ce moment-là, pas de fusion accidentelle.                                                                                                                 |

- next: **lanes dev en parallèle** — `dev-gameplay` (commit 0 puis logique pure TDD) ∥
  `dev-r3f-render` (écran + hooks) → `qa-lead` (stage 5) → panel de revue de code (gate de
  merge) → acceptation `pm`. `senior-architect` reste le point de sign-off transverse : toute
  dérive du contrat §4.2 (render lisant `stats`, réimplémentation d'un builder, édition croisée
  de `runStats.ts`) remonte ici avant d'être codée.

## 5. DEV — lane A · `dev-gameplay` (Amelia) — 2026-07-30

- claim: `src/game/**` uniquement — le contrat de types (commit 0), les trois systèmes purs
  en TDD, et les trois seams du tick prévus au §4.3. Aucun fichier de `src/render/**` ni de
  `src/hooks/**` touché. /
  release: **4 commits, suite verte** (`rtk tsc` sans erreur, 970 tests `src/game` au vert,
  `eslint src/game` propre). Le contrat a été **poussé en premier** (`bd5a4ed8`), avant les
  systèmes, pour débloquer lane B.

### Commits

| #   | Commit     | Contenu                                                                                      |
| --- | ---------- | -------------------------------------------------------------------------------------------- |
| 1   | `02b4c7a0` | `chore(tooling)` — ignore lint des worktrees imbriqués `.claude/worktrees/**` (voir écart 1) |
| 2   | `bd5a4ed8` | **commit 0** — `src/game/types/runStats.ts`, types seuls, zéro fonction                      |
| 3   | `d55e5975` | les trois systèmes purs + leurs tests, et les trois seams du tick                            |
| 4   | `a59d9934` | passe `simplify` sur mon propre diff (voir plus bas)                                         |

### File List

Nouveaux : `src/game/types/runStats.ts` · `src/game/systems/runStatsSystem.ts` ·
`src/game/systems/runFunnelSystem.ts` · `src/game/systems/runReport.ts` ·
`src/game/systems/__tests__/runStatsSystem.test.ts` (32 tests) ·
`src/game/systems/__tests__/runFunnelSystem.test.ts` (19) ·
`src/game/systems/__tests__/runReport.test.ts` (12).

Édités : `src/game/types/gameState.ts` (`+ readonly stats: RunStats`) ·
`src/game/systems/stateMachine.ts` (seed + **un seul** `foldRunStats` juste après `newLives`

- les 3 reports) · `src/game/systems/weaponSystem.ts` (`+ faultLivesDelta` sur
  `TriggerResult`) · `src/game/systems/__tests__/stateMachine.test.ts` (+16 tests
  d'intégration) · `src/game/systems/__tests__/weaponSystem.test.ts` (+2) ·
  `eslint.config.ts` (écart 1).

### Ce qui est couvert par les tests

Fold : ramassage unique sous dispersion · tick absorbé par la fenêtre d'invulnérabilité ·
écrêtage du coup fatal à `heartsAtStart` (dégâts **et** faute contre le même plafond) ·
soin de caisse ne décrémentant pas les cœurs perdus · latch écrit une fois, jamais réécrit.
Dérivation : les **5 causes de fin** dans leur précédence, dont un boss non résolu qui ne
prime pas · les **5 issues de livraison**, `INTERROMPUE` sur `INCOMING` **et** `DELIVERING`,
`REUSSIE` survivant à un `GAME_OVER` postérieur véhicule `GONE` compris · plancher de
l'intégrité (99,6 ⇒ 99) · `null` (jamais `0/0`) sur un niveau sans caisses.
Entonnoir : `parseFunnel` sur `null`, blob corrompu, JSON non-objet, tableau, champ inconnu,
valeur non booléenne · `withMilestones` idempotent, non chaîné, indépendant de l'ordre ·
`milestonesFromRun` ne produit jamais les deux jalons de navigation.
Rapport : sérialisation stable, `null` sérialisé `null`, **aucun** `muf_player_name`, aucun
horodatage, et trois tests structurels (aucun import de `highScoreSystem`, aucun
`localStorage`/`navigator`/`fetch`, aucun `Date.now`/`Math.random`) sur les trois modules.
Tick : les **retours précoces au-dessus du pli laissent `stats` inchangé** (égalité de
référence) sur les 5 branches atteignables — idle terminal `GAME_OVER`, idle
`LEVEL_COMPLETE`, transition quota, QTE otage gelée, duel de boss gelé + boss résolu.

### Passe `simplify` (mon diff uniquement)

- **APPLIQUÉ** (`a59d9934`, vert) : `RunStats.deliveryIntegrityMaxAtLatch` et
  `RunStatsTickFacts.deliveryIntegrityMax` supprimés — `integrityMax` est semé une fois
  depuis le spec et n'est **jamais** muté, donc le latcher stockait une variation que le
  build ne peut pas produire ; le véhicule porte encore le dénominateur du tick de latch.
  −1 champ de type, −1 fait, −1 ligne au site d'appel, −1 repli dans le résumé.
- **PROPOSÉ** (non appliqué, jugement de lane) : `deriveEndCause` / `deriveDelivery` /
  `derivePickups` sont des helpers à un seul appelant. Les inliner ferait de
  `buildRunSummary` une fonction de ~60 lignes portant trois règles de présentation
  distinctes — plus court, moins lisible. Laissé tel quel, à trancher en revue si un
  relecteur pense l'inverse.
- **REVERTÉ** : rien.
- **Bugs repérés, non corrigés** : aucun.

### Écarts au plan (3) — tous à connaître par `senior-architect` / `producer`

1. **`eslint.config.ts` touché (hors lane A).** Un worktree git d'une session Claude
   parallèle vit sous `.claude/worktrees/` : exclu de git (`.git/info/exclude`) mais **pas**
   d'ESLint flat-config, et ses fichiers sont hors du projet tsconfig ⇒ 109 erreurs du parser
   type-aware ⇒ `yarn lint` rouge ⇒ **plus aucun commit possible dans le dépôt**, pour les
   deux lanes. Vérifié : 100 % des erreurs venaient de ce répertoire, l'arbre était propre.
   J'ai ajouté `.claude/worktrees/**` aux `ignores` (même classe que `dist/**`), en commit
   séparé. À valider par `dev-tooling-assets`, qui possède ce fichier.
2. **Formatage de fichiers d'autres lanes.** Le hook de pré-commit lance `format:check` sur
   **tout l'arbre** : les specs/ADR non commités des étapes amont, `public/madeleine-tag.html`
   (fichier non suivi de Bertrand) et deux fichiers en cours de lane B bloquaient le commit.
   J'ai lancé `prettier --write` dessus (formatage seul, aucun changement sémantique, aucun
   `git add` hors `src/game` + `eslint.config.ts`). Lane B : tes fichiers `RunDetailPanel.tsx`
   et `runStatsLabels.ts` ont été reformatés sur disque, ils restent à toi et non stagés.
3. **Risque #1 du §4.5 (les fixtures `GameState` littérales) : néant.** `rtk tsc` ne signale
   **aucune** fixture cassée par le champ `stats` requis — le dépôt ne construit jamais un
   `GameState` littéral, tout part de `createInitialState`. Rien à corriger, ni côté game ni
   côté render.

### Notes pour lane B et la revue

- `buildRunSummary` est exportée par **`runStatsSystem.ts`** (contrat §4.2), pas par
  `runReport.ts` — la consigne de lane et le contrat divergeaient sur ce point, le contrat
  fait foi et c'est déjà ce qu'importe `useGameLoop.ts`.
- ADR-0076 C6 confirmé dans le code : `tickGameState` plafonne le score à 0, l'export porte
  le score tel que le jeu le tient. Aucun changement de règle de score.
- `faultLivesDelta` est un delta **négatif** (comme `livesDelta`) ; le tick passe
  `faultLivesLost: -trigger.faultLivesDelta` au fold, qui compte des magnitudes.

- next: `dev-r3f-render` termine son écran (l'intégration §4.4-3 est chez elle) → `qa-lead`
  (stage 5 : quality gate + playtest AC-1→AC-15 + revue UX deux classes d'appareils) →
  panel de revue de code → acceptation `pm`.
