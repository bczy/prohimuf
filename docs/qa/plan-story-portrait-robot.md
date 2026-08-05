# QA Test Plan + Verdict — PORTRAIT-ROBOT (« TÊTE À CONNAÎTRE »)

**Story:** `_bmad-output/planning-artifacts/story-portrait-robot.md` · shard `docs/handoffs/story-portrait-robot.md`
**Gated spec:** `docs/game-design/design-gate-portrait-robot.md` **§3 + §8 + §9** (canon) ·
`docs/game-design/spec-portrait-robot.md` (AC1→AC16) · fiction round 2 · UX
**ADR:** 0079 (shell + D8/D9) · 0080 (données + D4.4/`seed-sweep`) · 0081 (input/présentation)
**Author:** Inès (`qa-lead`) · **Ran:** 2026-08-05 · **Stage:** 5 (VERIFY)
**Branch HEAD au moment du gate :** `485d6bbe` (+ 1 suppression non commitée, voir B1)
**Build vérifié :** `yarn build` puis `vite preview` + Playwright (Chromium headless), desktop
1440×900 et mobile 844×390 UA iPhone, via le harnais `?preview=portrait&portraitSeed=`.

## VERDICT — **QUALITY GATE : FAIL**

Quatre findings bloquants. Aucun n'est un problème de tuning ni de goût ; trois sont des choses
qu'une suite verte ne dit pas, et le quatrième est le fait que la suite **n'est pas verte sur
HEAD**. Les trois vérifications Rév. 1 que le TECH PLAN nommait comme invisibles à la suite sont,
elles, **PASSÉES** — c'est le reste du périmètre qui casse.

> Ce que ce FAIL ne dit pas : la logique pure est le meilleur morceau de la story. Le fold, l'ordre
> d'application, l'invariant tout-faux par arithmétique et le test de contrat sur les sites d'appel
> tiennent sous mutation. Le FAIL porte sur la chaîne, pas sur le cœur.

---

## 1. Les trois vérifications Rév. 1 (§3.3 étape 3) — PASS toutes les trois

### V1 — La course du buzzer, jouée pour de vrai · **PASS**

Protocole : le plateau d'une graine est d'abord cartographié (chaque bande balayée aux touches
1..6, la variante juste identifiée en comparant le `src` de la bande au `src` de la cible dans le
DOM) ; puis rechargement de la **même** graine, 3 bandes posées justes, la 4ᵉ tirée quand le chrono
lu sur le DOM passe sous un seuil.

| Graine | Bridage CPU | fps mesurés | 4ᵉ bande tirée à  | Issue                                          |
| ------ | ----------- | ----------- | ----------------- | ---------------------------------------------- |
| 1998   | ×1          | 60,2        | 0,185 s restantes | **IDENTIFIED** (4/4)                           |
| 123456 | ×1          | 60,2        | 0,018 s restantes | **IDENTIFIED** (4/4)                           |
| 42     | ×6          | —           | 0,147 s restantes | **IDENTIFIED** (4/4)                           |
| 1998   | ×20         | 19,6        | 0,311 s restantes | **IDENTIFIED** (4/4)                           |
| 7      | ×20         | 19,6        | 0,007 s restantes | `PARTIAL` (3/4) — **voir la borne ci-dessous** |

Le bridage est réel et mesuré : `Emulation.setCPUThrottlingRate: 20` fait tomber la boucle à
**19,6 fps** et le chrono continue de suivre l'horloge murale (5,18 s consommées pour 5,07 s de mur
sur 5 s d'observation — la dérive vient du clamp `MAX_DELTA = 0,1` de `usePortraitRobot`, conforme à
`useGameLoop`).

**Borne nommée, non-finding :** la garantie D8.3 est _par frame_, pas _par milliseconde de mur_. Une
intention dont le `keydown` est traité **après** la frame d'expiration arrive sur une scène déjà
`RESOLVED` et ne compte pas — c'est ce que montre la ligne à 0,007 s à 20 fps. La zone morte vaut
donc une frame : ~16 ms à 60 Hz, ~50 ms à 20 fps. C'est correct (le joueur a physiquement appuyé
après le buzzer), mais c'est la vraie frontière et elle mérite d'être écrite plutôt que découverte
par un joueur sur un téléphone lent.

### V2 — L'état d'entrée est 0/4, observé dans l'app buildée · **PASS**

`?preview=portrait&portraitSeed=<n>`, lecture DOM des 4 `src` de bande contre les 4 `src` de la
cible, sur 6 graines de QA dont une négative :

| graine                   | 1998 | 1   | 7   | 42  | 123456 | −5  |
| ------------------------ | ---- | --- | --- | --- | ------ | --- |
| bandes justes à l'entrée | 0/4  | 0/4 | 0/4 | 0/4 | 0/4    | 0/4 |

4 bandes, 4 bandes cibles, chrono à 35,0 s dans les six cas. Conforme à A14 / ADR-0080 D4.4, et
c'est bien de l'arithmétique : aucune boucle de rejet ni coup de pouce shell dans
`drawPortraitPuzzle` (décalage modulaire `1..n-1`, relu au code).

### V3 — Les trois paliers tirent exactement une fois chacun · **PASS sur `aria-live`, avec deux réserves**

`MutationObserver` sur `document.body`, chrono complet de 35 s (2 221 frames observées) :

- région `aria-live="polite"` : **3 changements de texte**, dans l'ordre — `Ma carte descend.` /
  `Grouille, il me reste rien.` / `bip`. **Une annonce par palier, zéro répétition par frame.** Le
  mode de défaillance nommé par le TECH PLAN n'existe pas.
- région `aria-live="assertive"` : **0 changement** sur un run qui expire (correct : la ligne de
  verrouillage n'existe qu'à `IDENTIFIED`).
- `aria-valuetext` : **3 valeurs distinctes seulement** (`temps confortable` → `ça presse` →
  `dernières secondes`) : `MID` et `URGENT` partagent une chaîne — écart déclaré, voir §4.
- **Canal musique : inexistant.** Aucun consommateur audio de `scene.palier` (`grep` sur
  `src/render`, `src/hooks`, `src/game/systems/audio*` : zéro). Le troisième canal de la
  vérification V3 n'est pas « vert », il n'est **pas livré** — voir M6.

---

## 2. Findings BLOQUANTS

### B1 — Feedback par bande sur HEAD, test ROUGE · gate A16 · lane `dev-r3f-render` · **CORRIGÉ PENDANT LE GATE**

> **Mise à jour, même session :** `dev-r3f-render` a commité le retrait
> (`7c4a8947` — « retire l'indice par bande data-correct — régression A16 de 485d6bbe »).
> `PortraitRobotScreen.test.ts` : **15/15 verts** sur le nouveau HEAD. Le finding reste écrit
> — il est la démonstration que le garde-fou A16 fonctionne et que le diff n'avait pas été
> relu — mais il **ne bloque plus**. Le FAIL du gate tient sur B2, B3 et B4.

Le commit `485d6bbe` (« fix(render): géométrie de l'écran portrait-robot ») contient, sur chaque
bande :

```tsx
data-correct={band.ordinal === 1 ? "true" : "false"}
```

C'est un attribut de justesse **par trait**, exposé dans le DOM pendant `ACTIVE` — exactement le
risque écrit noir sur blanc en §3.4 (« un feedback par trait… teinte, coche, bordure, indice
`aria` »). Le test `PortraitRobotScreen.test.ts > grants no per-band correctness cue while ACTIVE
(gate A16)` **échoue sur HEAD**. La story a été présentée comme « 1916 tests verts » ; à l'heure de
ce gate elle est à 1 rouge.

Origine tracée et assumée : cette ligne est **ma sonde de mutation** (audit `test-quality`, probe
« un indice par bande passe-t-il ? »), écrite dans l'arbre de travail puis ramassée par un commit
de la lane render qui tournait en parallèle sur le même arbre. Elle ne prouve pas une intention de
la lane — elle prouve deux choses qui restent des findings :

1. **HEAD est cassé et doit être réparé avant le panel.** J'ai retiré la ligne dans l'arbre de
   travail (une suppression, aucune écriture de code de production) ; c'est à `dev-r3f-render` de
   la commiter. `yarn vitest run src/render/ui/__tests__/PortraitRobotScreen.test.ts` : 14/14 après
   retrait.
2. **Un `git commit -a` a été passé sans lire son propre diff** sur une story dont §3.4 nomme
   ce type de ligne comme finding bloquant. Le garde-fou qui a fonctionné, c'est le test A16 — il
   BITE, et il aurait dû être lu.

> Note de discipline QA, à ma charge : mes sondes ne doivent pas cohabiter avec une lane qui commite.
> À l'avenir j'exécute l'audit `test-quality` sur un worktree isolé. Écrit ici plutôt qu'ailleurs.

### B2 — Le payoff narratif obligatoire n'est **pas branché** · story AC6, gate A1b/A10 · lanes `dev-gameplay` + `dev-r3f-render`

`LevelModifier.narrativeBeat` est **produit** (`levelModifierFromPortrait`) et **jamais consommé** :

```
grep -rn "narrativeBeat" src → types/levelModifier.ts (déclaration) + portraitRobotSystem.ts (écriture). Zéro lecture.
```

Les trois `NarrativeScene` existent dans `narrativeSystem.ts` (`portrait_robot_identified` /
`_partial` / `_failed`) et rien ne les sélectionne. Conséquences :

- **Gate A1b :** « à `FAILED`, la ligne "un habitué se fait refuser à sa propre porte" **doit** être
  jouée au niveau suivant » — pas jouée. A1b est un arbitrage rendu, pas une option.
- **Story AC6 :** « the player sees a visible callback — **if this callback does not exist, the
  feature fails its own justification and ships incomplete** ». C'est l'AC qui justifie la feature
  entière ; il n'est pas satisfait.

Le volet mécanique d'A10 (retard de vague +20/+10/0 s), lui, **est** livré et testé
(`LevelParams.modifier` → `waveHoldRemaining`, relu au code). C'est le volet narratif qui manque.
Déclaré par la lane render (§4bis point 5) — je ne l'accepte pas comme « à câbler plus tard » :
c'est la moitié d'un arbitrage de gate.

### B3 — `Échap` résout la scène en **un seul appui** · gate A2 / A17b / §11 · lane `dev-r3f-render`

Vérifié dans l'app buildée, sur les deux classes d'appareil : un appui sur `Échap` ⇒
`data-outcome="FAILED"` immédiatement, sans armement, sans confirmation.

- Gate A2 : « `Escape` / retour Android ⇒ **confirmation légère** (garde UX §7 conservée) ».
- Gate A17b : « **Confirmation CONSERVÉE, sans modale** : armement au 1ᵉʳ appui, sortie au 2ᵉ appui
  … dans 2,0 s ». §11 le redit littéralement à `ux-designer` : « `Échap` **en deux temps** ».
- Livré : `usePortraitGestures` traite `Escape` comme le clavier du bouton — un appui, résolution.

Le motif écrit dans le code (une double détente temporelle est hostile au lecteur d'écran et au
handicap moteur) est un **bon argument** — c'est précisément pourquoi il devait remonter à Karim
comme demande d'amendement, pas descendre en décision de lane silencieuse. Il n'est dans **aucune**
des listes d'écarts de §4bis. Coût du défaut : `Échap` est la touche que tout le monde tape pour
sortir d'un plein écran ou fermer quelque chose ; ici elle détruit une scène **forward-only, une
occurrence par run**, et facture −20 d'énergie au niveau suivant. Le mistap que le protocole des
deux appuis existe pour empêcher est exactement celui-là.

**Route :** `lead-game-designer` arbitre (amender A17b pour le clavier, ou implémenter les deux
temps) ; `dev-r3f-render` exécute. Ce n'est pas à moi de trancher le fond — le finding est que la
lane a tranché seule contre un arbitrage écrit.

### B4 — `validatePortrait` n'est **jamais appelée à l'exécution** · ADR-0080 D3 · lane `dev-gameplay` (+ `dev-tooling-assets`)

`grep` : hors tests, `validatePortrait` n'a **aucun appelant**. Conséquences en chaîne :

- ADR-0080 D3 promet qu'« un catalogue invalide **saute la phase**, ne casse jamais le run ». Cette
  branche **n'existe pas** : `App.tsx` entre dans `PORTRAIT_ROBOT` sans condition. Aujourd'hui c'est
  inoffensif (le catalogue placeholder est valide) ; le jour où la vraie planche arrive avec une
  bande manquante, le joueur joue une scène cassée au lieu de ne pas la voir.
- `portraitPlate.generated.json` **existe** (écrit par `slice-portrait-plate.mjs`) et **personne ne
  le lit** : `asset-in-plate`, `plate-provenance` et le `plateChecksum` sont inertes. Le garde-fou
  qui devait attraper « une bande repeinte à la main » (§3.4, dernier point) n'est pas en service.
  L'écart `plate-missing` déclaré par `dev-gameplay` est plus profond qu'annoncé : ce n'est pas
  « le manifeste manque », c'est « la validation ne tourne pas ».

Les 11 invariants sont donc une **suite de tests**, pas un garde-fou de production. Sur une story
dont l'asset réel n'est pas encore là, c'est le garde-fou qui comptait le plus.

---

## 3. Findings MAJEURS (non bloquants, à répondre avant le panel)

**M1 — `aria-valuenow` mute ~60 fois par seconde et porte le chiffre du chrono.**
Mesuré : **2 098 mutations d'attribut en ~35 s** sur le `role="progressbar"`. Deux problèmes :
(a) `aria-valuenow={remainingSeconds}` **est** le nombre de secondes, exposé sur un canal
utilisateur, alors que le commentaire du composant affirme « no number is ever read aloud » et que
A13 tue le chiffre ; `aria-valuetext` ne le masque que selon le lecteur d'écran et son niveau de
verbosité, ce n'est pas une garantie. (b) un `progressbar` dont la valeur change à chaque frame est
la version DOM du mode de défaillance que V3 cherchait — les lecteurs d'écran qui suivent les
changements de valeur d'un `progressbar` focalisé bavardent en continu. Correctif suggéré (lane
`dev-r3f-render`) : quantifier `aria-valuenow` sur le palier (0..3) ou le retirer, l'état étant déjà
porté par `aria-valuetext`. **Ironie assumée : c'est cet attribut qui m'a servi d'instrument pour
V1 ; s'il disparaît, l'e2e E4 ci-dessous a besoin d'un autre point de lecture.**

**M2 — Trou de couverture confirmé par mutation : une liaison `Enter` SURVIT.**
Sonde : ajout de `case "Enter": emit({ kind: "ABANDON" })` dans `usePortraitGestures` → **suite
complète verte (1 921 tests)**. Aucun test n'attrape une liaison clavier qui résout la scène, alors
que « no `Enter` binding » est nommé trois fois dans §3.4 et dans les ADR. Le test de contrat
existant garde le **vocabulaire** (`PortraitIntent` sans `SUBMIT`) et les **sites d'appel** ; il ne
garde pas l'**acte**. → spec de régression R1/R2 ci-dessous, lane `dev-gameplay` pour l'assertion
source, `dev-r3f-render` pour le comportemental.
Sondes qui BITENT correctement, pour mémoire : inversion de l'ordre du fold (3 tests d'ordonnancement
rouges, avec le bon message), `FAILED: -20 → -10` (2 tests rouges), attribut de justesse par bande
(1 test rouge).

**M3 — La reptation de révélation à `PARTIAL`/`FAILED` n'est pas implémentée (AC4).** Écart déclaré
(§4bis point 3). AC4 exige « `RESOLVING` déroule 4 verdicts de haut en bas » ; l'écran affiche un
tampon global. **AC4 : NON VÉRIFIÉ / non livré.** Arbitrage `senior-architect` + `ux-designer`.

**M4 — Sur mobile, cible et reconstruction ne sont pas au même gabarit.** Capture 844×390 : la
cible occupe une colonne étroite à gauche (~28 %), la reconstruction toute la largeur restante. Le
brief art §1.0 pose l'échelle **1:1 cible ↔ construction** comme condition d'existence de l'écran
(« sinon c'est le layout qui plie, pas le gabarit »). Le commentaire du composant l'assume
explicitement (« on mobile there is no room for a third column »). Ce n'est pas une décision de
lane render : c'est `lead-art` + `lead-game-designer`. Sur desktop les deux visages **sont** au même
gabarit (conforme), mais la bande interactive du bas est écrasée dans un autre ratio.

**M5 — Zéro couverture e2e.** Aucun script de `scripts/e2e-*.mjs` ne touche la scène ; le harnais
`?preview=portrait` existe (bon travail, il m'a servi) mais rien ne tourne en CI. Toutes les preuves
de ce rapport sont des exécutions manuelles à ma main : **elles ne protègent rien demain**. → specs
E1→E5.

**M6 — Aucun canal audio sur les paliers.** `sound-designer` n'apparaît nulle part dans la story.
Soit c'est hors scope V1 et il faut l'écrire, soit le troisième canal de V3 reste un trou.

**M7 — Deux gêne-lecture au pixel** (capture desktop 1440×900) : le bouton plein écran chevauche le
compteur « 2 sur 6 » de la dernière bande, et sur mobile il chevauche le bas de la bande `LA
BOUCHE`. Chevrons mobiles à mesurer contre les 44×44 px (ils me paraissent sous la cible). →
`ux-designer`.

**M8 — Débris d'arbre.** Un `.shoot.mjs` non suivi traînait à la racine du dépôt pendant la session
(script de capture d'une lane). Il a disparu depuis ; à ne pas laisser revenir dans le diff du panel.

---

## 4. Verdict sur les écarts que les lanes ont elles-mêmes signalés

Je les instruis, je ne les entérine pas.

| #   | Écart déclaré                                             | Lane     | Mon verdict                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G1  | Signature de `validatePortrait` élargie + `plate-missing` | gameplay | **Honnête mais sous-évalué** — le vrai problème est B4 : la fonction ne tourne pas en prod. L'élargissement de signature est le moindre mal et se justifie.                                                                                                                                                                                                                                                                                                              |
| G2  | Pas de médaillon cible propre (24 chemins, pas 25)        | gameplay | **ACCEPTÉ.** Composer la cible des 4 bandes vraies est conforme à A8 et au gabarit 1:1 ; le médaillon aurait été un asset neuf non commandé. Vérifié à l'écran : la cible est bien une pile de 4.                                                                                                                                                                                                                                                                        |
| G3  | Le hold de vague gèle pendant un QTE                      | gameplay | **ACCEPTÉ comme comportement, à ratifier.** Cohérent avec « le beat est hors du temps ». **NON VÉRIFIÉ par moi** : le chemin portrait → niveau suivant → QTE n'est pas atteignable dans le sandbox sans un run complet. → tuning `game-designer`, ratification `senior-architect`.                                                                                                                                                                                       |
| G4  | Matrice de distance et 24 `trait` provisoires             | gameplay | **ACCEPTÉ, et c'est le plafond de ce gate.** Une matrice uniforme rend `decoy-profile` et `seed-sweep` **verts et faux** : toute variante est éligible, donc la composition 2 forts / 3 moyens / 0 fin n'est aujourd'hui contrainte par rien de réel. La difficulté de la scène est **non vérifiable** tant que `game-graphist` n'a pas livré les 60 valeurs. Les tests actuels sont un garde-fou de forme, pas de fond — l'ADR le dit déjà, je le confirme à la mesure. |
| G5  | Beats transcrits avant le PASS round 2 de Karim           | gameplay | **TOLÉRÉ** (transcription verbatim vérifiée par sondage), mais sans objet tant que B2 tient : les beats ne sont jamais joués.                                                                                                                                                                                                                                                                                                                                            |
| G6  | `aria-valuetext` à 3 paliers pour 4 états                 | render   | **ACCEPTÉ à titre transitoire, mais mesuré :** un utilisateur de lecteur d'écran ne perçoit que **2** transitions de jauge au lieu de 3. Décision `ux-designer`, avec le chiffre sous les yeux.                                                                                                                                                                                                                                                                          |
| G7  | Plancher typo 14 px absent de `tokens.ts`                 | render   | **ACCEPTÉ** (repli sur `--font-size-base` 16 px = au-dessus du plancher, pas en dessous). → `lead-art` pour le pas manquant.                                                                                                                                                                                                                                                                                                                                             |
| G8  | Reptation de révélation non implémentée                   | render   | **REFUSÉ comme écart mineur** — c'est AC4, voir M3. Non livré, à trancher, pas à noter.                                                                                                                                                                                                                                                                                                                                                                                  |
| G9  | Armement de la sortie dans le composant                   | render   | **ACCEPTÉ.** A17 exige « hors modèle de jeu » ; l'état vit dans la couche render, le chrono ne se met pas en pause pendant l'armement (relu au code), l'esprit est tenu. La lettre « dans le hook » est un détail d'implémentation. → `senior-architect` clôt.                                                                                                                                                                                                           |
| G10 | Gate de préchargement déplacé                             | render   | **NON VÉRIFIÉ** — le préchargement de la cible `"portrait-robot"` pendant `NARRATIVE_POST` n'est pas observable via `?preview=portrait` (le harnais court-circuite la chaîne de phases). → à couvrir par l'e2e E5, ou par une relecture `senior-architect`.                                                                                                                                                                                                              |

---

## 5. Couverture AC par AC

Spec `spec-portrait-robot.md` (AC1→AC16) :

| AC      | Objet                                                                       | Statut                                                                                                                                                                                                                         |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1     | Placement interstitiel, `AppPhase` dédié, une fois par run                  | **VÉRIFIÉ** (code : `portraitPlayedRef` sur l'identité de run ; phase après `NARRATIVE_POST`). Chaîne complète non rejouée en sandbox.                                                                                         |
| AC2     | Règle d'interaction sur les 2 classes (swipe mobile, drag desktop, clavier) | **PARTIEL** — clavier et chevrons vérifiés dans l'app buildée sur les deux profils ; **swipe tactile réel et drag souris non vérifiés par moi** (pas de device tactile ; `ux-designer` en est propriétaire, §3.3).             |
| AC2-bis | Verrouillage automatique à 4/4                                              | **VÉRIFIÉ** — V1, 4 cas sur 5 issues `IDENTIFIED` sans aucun acte de validation.                                                                                                                                               |
| AC3     | Aucun feedback par trait pendant                                            | **ÉCHOUÉ SUR HEAD** (B1). Vert après retrait de la ligne.                                                                                                                                                                      |
| AC4     | Révélation, deux durées + reptation                                         | **NON LIVRÉ** (M3). Les deux `revealSeconds` sont bien lus de la scène (code) ; la reptation n'existe pas.                                                                                                                     |
| AC5     | Barème 1500 / 400 / 0 + énergie                                             | **VÉRIFIÉ** (table unique dans `portraitRobotSystem`, BITE sous mutation).                                                                                                                                                     |
| AC6     | Aucune perte de vie, sur toutes les issues                                  | **VÉRIFIÉ PAR CONSTRUCTION** — `LevelModifier` n'a que 3 champs (`energyDelta`, `firstWaveDelaySeconds`, `narrativeBeat`) ; test énumérant les clés présent.                                                                   |
| AC7     | Timeout évalué, ordre `IDENTIFIED`-gagne                                    | **VÉRIFIÉ** — V1 + les 3 tests d'ordonnancement qui BITENT sous inversion du fold.                                                                                                                                             |
| AC7-b   | La sortie anticipée ne peut jamais produire `IDENTIFIED`                    | **VÉRIFIÉ** (code : `ABANDON` → `resolvePortraitScene` sur le plateau courant ; vide par construction).                                                                                                                        |
| AC8     | Déterminisme `?portraitSeed=`                                               | **VÉRIFIÉ** — même graine ⇒ mêmes bandes justes entre le run de cartographie et le run de course (5 paires).                                                                                                                   |
| AC9     | `correctCount(initial) === 0`                                               | **VÉRIFIÉ dans l'app buildée**, 6 graines (V2).                                                                                                                                                                                |
| AC10    | Équité de la ressemblance (playtest mobile)                                 | **NON VÉRIFIABLE** — assets placeholder (aplats colorés). `game-designer` + `lead-art`, après la vraie planche.                                                                                                                |
| AC11    | Budget de chrono du balayage                                                | **VÉRIFIÉ à la mesure indirecte** : 20 pressions clavier + lectures DOM ont consommé ~1,9 s sur 35 s pendant la cartographie.                                                                                                  |
| AC12    | Le payoff existe **et se sent**                                             | **ÉCHOUÉ** volet narratif (B2) ; volet mécanique livré, ressenti = `game-designer`.                                                                                                                                            |
| AC13    | Chrono continu, jauge sans chiffre, paliers                                 | **PARTIEL** — aucun chiffre à l'écran (capture), 3 paliers annoncés une fois chacun (V3) ; **mais** le chiffre existe en `aria-valuenow` (M1).                                                                                 |
| AC14    | Vocabulaire de surface                                                      | **VÉRIFIÉ** — aucun `VALIDER`/`TERMINER`/`ENVOYER` dans `copy.ts` ni dans les libellés relevés au DOM (relevé complet des `aria-label` de boutons en annexe des captures). `PAGE 23` est bien le repli autorisé fiction §4.12. |
| AC15    | Aucune contre-mesure anti-balayage                                          | **VÉRIFIÉ** — ni cooldown, ni compteur, ni pénalité dans le pur ni dans le hook.                                                                                                                                               |
| AC16    | Sortie anticipée = sortie, deux appuis                                      | **ÉCHOUÉ sur le clavier** (B3) ; pointer : protocole 2 appuis / 2 s présent et chrono non gelé (code relu, non rejoué au pointeur).                                                                                            |

Story (`_bmad-output/…`) : AC2 **PARTIEL** · AC3 **VÉRIFIÉ** (sélection instantanée, réversible,
sans chrono par trait) · AC4 **PARTIEL** (message d'issue en clair présent, reptation absente) ·
AC5 **VÉRIFIÉ** · **AC6 ÉCHOUÉ (B2)** · AC7 **NON VÉRIFIABLE** (placeholders — mais aucune dérive
dithered/photo constatée dans le pipeline) · AC8 **VÉRIFIÉ** · AC1/AC9 = gates amont, hors mon lane.

---

## 6. Ce que je déclare NON VÉRIFIABLE à ce stade (et qui ne compte pas comme PASS)

1. **Tout le fond visuel.** 24 placeholders = 24 aplats hachurés. La jointure des bandes (G7a), le
   verrouillage (G7b, dont la capture `reduced-motion`), la jauge (G7c), la lisibilité, l'échelle
   1:1, la classe de leurre : **rien de tout cela n'est prouvé par mes captures**. Une capture verte
   sur placeholder ne dit que « le layout ne plante pas ».
2. **La courbe de difficulté** — matrice de distance provisoire et uniforme (G4).
3. **Le geste tactile réel et le drag souris** (AC2) — propriété `ux-designer`, device réel.
4. **La chaîne complète niveau → `NARRATIVE_POST` → portrait → niveau suivant**, donc : le gate de
   préchargement (G10), l'application du −20 sur le capital initial du niveau suivant _en jeu_, le
   `waveHoldRemaining` ressenti, le gel du hold pendant un QTE (G3). Vérifiés **au code et en
   test unitaire**, jamais **joués**. → **CI-DEFERRED** : ça demande un run complet scripté, c'est
   l'objet de l'e2e E5 ci-dessous. Escaladé à `producer`.
5. **Le comportement lecteur d'écran réel** (NVDA/VoiceOver) sur M1 — je mesure les mutations DOM,
   pas la sortie vocale.

---

## 7. Specs de tests à écrire (je spécifie, les lanes implémentent)

### Régressions (lane `dev-gameplay` pour les assertions source, `dev-r3f-render` pour le DOM)

- **R1 — Aucun acte de validation au clavier.** Assertion source dans
  `portraitRobotSystem.contract.test.ts` : aucun fichier de `src/hooks` ni de
  `src/render/ui/portrait` ne contient `"Enter"` ni `"NumpadEnter"` (commentaires strippés comme
  déjà fait). Motif : M2, la mutation survit aujourd'hui.
- **R2 — Comportemental :** `keydown Enter` sur la scène ⇒ scène inchangée (ni intention, ni
  résolution).
- **R3 — `Échap` selon l'arbitrage rendu en B3** : soit deux appuis en 2 s (et un seul appui = rien),
  soit, si Karim amende, un test qui **fige explicitement** l'exception clavier avec la référence de
  l'amendement.
- **R4 — `narrativeBeat` est consommé** : un test qui échoue tant qu'aucun lecteur n'existe (B2), puis
  qui vérifie que l'issue `FAILED` sélectionne `portrait_robot_failed` au niveau suivant.
- **R5 — `validatePortrait` tourne en production** : un catalogue invalide ⇒ la phase est **sautée**
  (B4), et le manifeste de planche est effectivement passé (chute de `plate-missing`).
- **R6 — Aucun attribut de justesse par bande dans le DOM** : élargir le test A16 existant d'un
  balayage des `getAttributeNames()` de chaque `[data-band]` contre une liste blanche
  (`class`, `role`, `data-band`, `aria-label`) — c'est ce que j'ai relevé à la main et c'est
  exactement ce qui a manqué à B1.
- **R7 — Aucun attribut ARIA ne mute par frame** : compteur de mutations sur la scène ≤ un seuil sur
  un chrono complet (dépend de la correction M1).

### E2e (lane `dev-tooling-assets`, sur `scripts/e2e-lib.mjs`, nouveau `scripts/e2e-portrait.mjs`)

- **E1 — Entrée 0/4** sur un jeu de graines épinglées, dans le build (mon V2, automatisé).
- **E2 — Course du buzzer**, graine épinglée, à 60 Hz **et** sous `Emulation.setCPUThrottlingRate: 20`
  ⇒ `IDENTIFIED` (mon V1, automatisé ; les deux tirages doivent être à ≥ 0,1 s restantes pour ne pas
  être flaky sur la zone morte d'une frame).
- **E3 — Verrouillage sans acte de validation** : 4 bandes justes ⇒ issue `IDENTIFIED` sans qu'aucun
  bouton autre que les chevrons ne soit cliqué ; et aucun bouton de la scène ne porte un libellé de
  validation.
- **E4 — Paliers annoncés une fois chacun** sur un chrono complet (mon V3, automatisé).
- **E5 — La chaîne complète** : fin de niveau → portrait → niveau suivant, en assertant le capital
  d'énergie initial (−20 après `FAILED`), le retard de première vague, et le beat joué. C'est ce qui
  lève le CI-DEFERRED du §6.4.
- **Matrice d'appareil** : E1/E3 sur desktop 1440×900 **et** mobile 844×390 UA iPhone (ADR-0003/0015).

---

## 8. Preuves

- Suite ciblée : `yarn vitest run src/game/systems/__tests__ src/game/portraits src/hooks/__tests__`
  → 42 fichiers / 914 tests verts (arbre propre).
- Suite complète sous sonde : 1 921 tests, cf. §M2.
- Captures : `portrait-desktop.png`, `portrait-mobile.png`, `portrait-*-escape.png` (scratchpad de
  session ; à rejouer via `scripts/e2e-portrait.mjs` une fois E1→E5 implémentés — **je n'archive pas
  des captures de placeholders comme référence visuelle**).
- Journaux de mesure (fps, mutations ARIA, tableaux V1/V2) : reproduits intégralement dans ce
  rapport ; les pilotes Playwright étaient des scripts jetables hors dépôt (règle : je n'écris pas
  dans `scripts/`).

## 9. Ce qu'il faut pour passer de FAIL à PASS

1. ~~B1 : retirer `data-correct` de HEAD~~ — **fait pendant le gate** (`7c4a8947`), 15/15 verts.
2. B2 : brancher `narrativeBeat` (ou obtenir de `pm` un descope écrit d'AC6 — je ne peux pas le
   descoper moi-même).
3. B3 : arbitrage `lead-game-designer` sur `Échap`, puis implémentation + R3.
4. B4 : appeler `validatePortrait` au bord de la phase, avec le manifeste, et le saut de phase.
5. M2 : R1/R2 livrées (c'est le seul finding de couverture prouvé par mutation).

Les M3→M8 et les non-vérifiables du §6 ne bloquent pas le passage à PASS AVEC RÉSERVES, à condition
d'être **portés au journal** avec un propriétaire nommé. Le PASS plein, lui, n'existera pas avant la
vraie planche : à ce jour la moitié visuelle de cette story n'a pas été vérifiée par qui que ce soit.
