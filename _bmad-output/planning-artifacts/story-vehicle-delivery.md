# Story: Livraison scénarisée par véhicule (protéger le véhicule)

**Type:** Gameplay core loop (`Livrer`) — remplace la mécanique cargo abstraite ·
**Statut:** prête-pour-dev (attend lane assignment `senior-architect`)
**Date:** 2026-07-04 · **PM:** John
**Supersede:** `_bmad-output/planning-artifacts/story-core-loop-delivery.md`

## Why

La cargaison abstraite (colis vert flottant + zone de dépôt pointillée, collecte par
proximité du crosshair) est peu lisible. On la remplace par une **livraison scénarisée par
véhicule**, plus parlante : un véhicule (camion / voiture / moto) **arrive sur la rue,
s'arrête pour livrer**, et le joueur **le protège** en abattant les ennemis qui le menacent
— rien de neuf côté input, on réutilise le tir aux fenêtres existant. Réussir = **bonus de
score**. La victoire reste « 10 ennemis tués » ; rater n'inflige **aucun malus**.

## Test du Cahier des Charges Prohibition — verdict : PARTIEL (extension consciente justifiée)

- **Véhicule qui traverse/s'arrête dans la rue = FIDÈLE.** Prohibition (Atari ST, Infogrames)
  fait passer des voitures dans la rue devant la façade (drive-by de gangsters). Le primitive
  « entité véhicule sur le couloir rue » existe dans l'original — on le réutilise tel quel.
- **« Véhicule ami qu'on protège pendant une livraison scriptée pour un bonus » = EXTENSION
  consciente.** L'original a des véhicules *hostiles*, pas de véhicule à protéger. Ici c'est
  le reskin muf du verbe `Livrer` (coursier qui livre du matériel son à une rave). Extension
  assumée, documentée, au service direct du core loop — pas de gameplay nouveau hors boucle.
- **Verdict :** on garde le primitive fidèle (véhicule sur la rue) et on assume la couche
  narrative « protéger la livraison » comme extension. Enjeu limité au **bonus** → n'altère
  pas la boucle de tir ni la condition de victoire d'origine.

## Migration (retiré vs réutilisé)

- La story cargo précédente **n'a pas été implémentée** (aucun `deliverySystem.ts`,
  `types/cargo.ts`, `CargoMarkers.tsx` n'existe dans le code à ce jour). La migration est donc
  d'abord une **supersession de spec** : cette story remplace `story-core-loop-delivery.md`.
- **Si** l'ancien slice a été codé entre-temps → RETIRER : `src/game/systems/deliverySystem.ts`
  (version proximité), `src/game/types/cargo.ts`, `src/render/scene/CargoMarkers.tsx`, le champ
  `cargo` de `GameState`, le montage dans `GameScene`. Les devs vérifient l'existence avant
  suppression (ne pas supprimer ce qui n'existe pas).
- **Réutilisé :** couloir rue `CourierField` + pattern `CourierSprite` (entrée/sortie sur la
  rue), le crosshair + tir + détection de hits existants, le comptage d'ennemis en état
  `SHOOTING` déjà calculé dans `tickGameState`, le canal `feedback`, le HUD, le pipeline sprite
  fond-noir → détourage (`gen-enemy-types.mjs` → `cutout-enemies.mjs`).

## Modèle proposé (à intégrer ; règle de réussite = HYPOTHÈSE à confirmer)

- **Déclenchement SCRIPTÉ, non aléatoire :** exactement **une** livraison par niveau, à un
  instant fixe défini en data (`triggerAtSecondsRemaining`). Structure conçue **extensible à
  plusieurs** (tableau `deliveries`, MVP = 0 ou 1 entrée).
- **State machine véhicule (pure) :** `INCOMING → DELIVERING → SUCCESS | FAILED → GONE`.
  - `INCOMING` : glisse sur la rue depuis un bord vers `stopX` ; arrivé → `DELIVERING`.
  - `DELIVERING` : fenêtre de `windowSeconds`. **[À CONFIRMER]** les ennemis en état `SHOOTING`
    endommagent l'intégrité par ticks : `integrity -= dmgPerShooter × nbShooters × delta`. Le
    joueur les neutralise pour protéger.
  - Fenêtre survécue (`integrity > 0`) → `SUCCESS` (bonus appliqué **une seule fois**) → repart → `GONE`.
  - `integrity ≤ 0` → `FAILED` : le véhicule **fuit**, pas de bonus, **pas de malus** → `GONE`.
- **Bonus :** `SUCCESS` ajoute `bonus` au score. **[À CONFIRMER]** interaction avec la victoire :
  la victoire reste « 10 ennemis tués » (`enemiesToWin`) — si la condition courante est
  `score >= enemiesToWin`, s'assurer que le bonus ne déclenche pas la victoire à lui seul
  (gate sur le kill-count, ou bonus séparé du compteur de victoire). À trancher avec l'architecte.

---

## Lanes NON chevauchantes

### Lane A — dev-gameplay (`src/game/**` uniquement)

Script data par niveau + state machine véhicule pure + intégrité/dégâts + bonus + tests ;
retrait de l'ancien cargo si présent.

- `src/game/types/delivery.ts` (nouveau) — `DeliveryScript` (data : `vehicleType:
  "truck"|"car"|"moto"`, `triggerAtSecondsRemaining`, `stopX`, `dir: 1|-1`, `integrityMax`,
  `windowSeconds`, `bonus`) + `DeliveryVehicle` (runtime : `status`, `x`, `integrity`,
  `windowRemaining`). Zéro fonction.
- `src/game/systems/deliverySystem.ts` (nouveau) — pur : `tickDelivery(vehicle, script,
  shootingCount, field, delta) → { vehicle, scoreDelta, event? }` + helper de déclenchement.
- `src/game/systems/__tests__/deliverySystem.test.ts` (nouveau).
- `src/game/levels/levels.ts` (édition) — `readonly deliveries: readonly DeliveryScript[]`
  sur `LevelConfig` ; `belliard` reçoit 1 entrée (stalingrad/vitry optionnelles).
- `src/game/types/gameState.ts` (édition) — `readonly deliveryVehicle: DeliveryVehicle | null`.
- `src/game/systems/stateMachine.ts` (édition) — seed depuis le script du niveau, tick du
  véhicule chaque frame en réutilisant le `shootingEnemies` déjà calculé + `CourierField`,
  repli du `scoreDelta` bonus.
- Retrait éventuel de l'ancien cargo (voir Migration).

**AC (A) :** A1 la state machine suit exactement `INCOMING→DELIVERING→SUCCESS|FAILED→GONE`.
A2 déclenchement uniquement quand `timeRemaining` franchit `triggerAtSecondsRemaining`
(déterministe, non aléatoire). A3 en `DELIVERING`, `nbShooters>0` réduit l'intégrité, `0`
ne la réduit pas. A4 fenêtre survécue → `SUCCESS` + `scoreDelta === bonus` **une seule fois**
(idempotent aux ticks suivants). A5 `integrity ≤ 0` → `FAILED`, `scoreDelta === 0`, aucun
`livesDelta`. A6 tests A1–A5 verts ; `src/game/` sans import React/Three ; `tsc`/ESLint clean.

### Lane B — dev-r3f-render (`src/render/**` uniquement)

Composant véhicule sur le couloir rue + repères discrets + HUD ; retrait de `CargoMarkers`.

- `src/render/scene/DeliveryVehicleSprite.tsx` (nouveau) — entrée/arrêt/sortie sur la rue
  (pattern `CourierSprite`, lit `deliveryVehicle` depuis la ref d'état) ; sprite selon
  `vehicleType` via convention `assets/vehicles/${vehicleType}.png` ; retour visuel
  d'intégrité (petite jauge/flash) pendant `DELIVERING`.
- Petits repères départ/arrivée discrets (dans ce composant ou un `DeliveryMarkers.tsx`) —
  discrets, néon léger.
- `src/render/scene/GameScene.tsx` (édition) — monte le véhicule ; retire le montage
  `CargoMarkers` s'il existe.
- `src/render/ui/HUD.tsx` (édition) — bandeau « Livraison — protégez le véhicule » +
  indicateur d'intégrité pendant la fenêtre.
- Retrait de `src/render/scene/CargoMarkers.tsx` s'il existe.

**AC (B) :** B1 véhicule visible seulement en `INCOMING/DELIVERING/SUCCESS|FAILED` transitoire,
absent en `GONE`. B2 bandeau HUD + jauge affichés uniquement pendant `DELIVERING`. B3 lit
`GameState.deliveryVehicle`, **aucune règle de jeu**, n'importe que les types ; pas de nouveau
hook (`useGameLoop` propage déjà l'état). B4 aucun résidu de `CargoMarkers`.

### Lane C — dev-tooling-assets (`scripts/**` + `levelArt.json` uniquement)

Sprites véhicule via la pipeline Pollinations/FLUX, détourage, déclaration.

- `scripts/gen-vehicle-sprites.mjs` (nouveau) — génère `truck` / `car` / `moto` sur fond noir
  plat (style `gen-enemy-types.mjs`), sortie `public/assets/vehicles/{type}.png`.
- Réutilise `scripts/cutout-enemies.mjs` (ou équivalent) pour le détourage fond-noir → alpha.
- `src/game/levels/levelArt.json` (édition) — section `vehicles` (prompts + tailles par type),
  source unique de génération, alignée sur les blocs `sizes`/`prompts` existants.

**AC (C) :** C1 les 3 PNG existent aux chemins conventionnés, détourés (alpha propre). C2 la
section `vehicles` de `levelArt.json` valide (JSON parse OK, un bloc par type). C3 aucun fichier
`src/game/**` (hors `levelArt.json`) ni `src/render/**` touché.

---

## Contrat inter-lanes (couplage par convention, fichiers disjoints)

- `vehicleType` (`"truck"|"car"|"moto"`) est **la** clé partagée : Lane A la produit comme
  data (`DeliveryScript.vehicleType`, choix par niveau) ; Lane C génère `public/assets/
  vehicles/{vehicleType}.png` ; Lane B charge la texture par cette convention de nom.
- Aucun fichier édité par plus d'une lane : A = `src/game/**` (sauf `levelArt.json`) ·
  B = `src/render/**` · C = `scripts/**` + `src/game/levels/levelArt.json`. Ensembles disjoints
  → candidat PARALLEL-SAFE (verdict final : `senior-architect`). Hand-off à logger dans
  `docs/agent-handoffs.md`.

## Out of scope

Livraisons multiples par niveau (structure extensible mais MVP = 1) · avatar joueur mobile ·
livraison comme condition de victoire · malus en cas d'échec · nouvel input · véhicules
hostiles / drive-by (roster ennemi — autre plan) · tuning intégrité/dégâts data-driven avancé.
