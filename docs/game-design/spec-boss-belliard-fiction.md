# Boss on Belliard — fiction spec (placement + shield cover prop)

**Author:** orchestrator (standing in for `narrative-designer` (Yasmine) after two subagent runs died on
API stream errors) · **Gate:** `lead-game-designer` (Karim) — status **DRAFT, awaiting PASS** ·
**Date:** 2026-07-21
**Story:** `_bmad-output/planning-artifacts/story-boss-belliard-live.md`
**Extends:** `docs/game-design/spec-boss-encounter-fiction.md` (the Commandant's identity — do not
reopen it), `docs/game-design/spec-boss-differentiation-fiction.md`.

Voice baseline = the shipped register in `src/game/systems/narrativeSystem.ts` (DISPATCH terse, KENZA
field-savvy, MUF laconic). Period **1998 Paris, free-party circuit** — francs, `08 36` infolines, no
smartphone vocabulary. Player-facing strings **French**; meta/notes English.

---

## 0. What this spec decides (and what it does NOT)

The Commandant's WHO is already ratified (apex of the **BAC de nuit**, singular, named, capstone —
`spec-boss-encounter-fiction.md`). This spec answers only what the Belliard placement newly needs:

1. Why the Commandant appears at the FIRST level, Rue Belliard — reconciled with the finale framing.
2. The **shield cover prop** fiction (lead-art canon: nothing shootable modelled ON his body).
3. The player-facing beats: pre-duel, post-duel (win), loss-reason copy.

It does NOT re-decide his identity, and it flags one tension for the gate (§1.3).

## 1. Why the Commandant is at Belliard

### 1.1 The read in one line

**Il est venu en personne.** Rue Belliard, 19e — première livraison "chaude" du joueur. Le Commandant
ne délègue pas cette porte : il la bloque lui-même. Rencontrer le chef **dès le premier niveau** dit au
joueur, sans un mot de trop, qui commande les flics qu'il fuira niveau après niveau. Ce n'est pas un
mook de plus à la fenêtre — c'est **le** visage derrière tous les autres, posé en travers de la
livraison.

### 1.2 Pourquoi ça tient diégétiquement

- La BAC de nuit patrouille le 19e (établi, roster §7). Que son chef soit **sur le terrain** à Belliard
  — pas dans un bureau — colle au personnage : un commandant de rue, pas un gradé de cabinet.
- Le porche de livraison (`porte cochère`, réutilisé du QTE otage ADR-0030) est le goulot naturel : il
  s'y **retranche**, couvert, et n'ouvre le feu que par à-coups. Le "à découvert seulement quand il
  tire" reste vrai localement — il tient une position, il ne charge pas.

### 1.3 TENSION à trancher au gate (flag, pas une décision)

`spec-boss-encounter-fiction.md` §1.3 ancre le **foyer narratif** du Commandant au **Niveau Final (31
déc 1999, flics débordés)** — c'est là que "débordé donc à découvert" est le plus fort. Le placer en
**premier boss** à Belliard avance cette rencontre. Deux lectures cohérentes, au choix de Karim :

- **(A) Première passe, pas la dernière.** Belliard est la **première** confrontation ; le Niveau Final
  reste la culmination (rematch / il revient débordé). Le joueur apprend le duel tôt, le paie au bout.
  _Recommandé_ — cohérent avec un boss récurrent et avec la montée en puissance déjà spécifiée.
- **(B) Belliard EST son unique scène en V1.** Si le Niveau Final n'est pas encore construit, Belliard
  porte toute la charge ; on ajuste `spec-boss-encounter-fiction.md` §1.3 pour ne plus promettre le
  finale comme foyer exclusif.

Cette bascule est du ressort de `lead-game-designer` + `narrative-designer`, pas de la mécanique. Rien
en aval n'en dépend (la mécanique et le code sont identiques dans les deux cas).

## 2. Le bouclier — cover prop, PAS une armure sur lui (canon lead-art)

Contrainte canon (lead-art) : le Commandant est **tête nue, sans casque, sans bouclier** — cette
silhouette **est** sa différenciation du roster CRS/`enemy_riot`. Donc l'objet que le joueur tire n'est
**pas** sur son corps.

**Décision : un bouclier de maintien de l'ordre dressé en travers du porche — sa couverture, un objet
séparé.** Un grand bouclier balistique de section, calé debout contre le porche (ou un vantail de la
porte cochère rabattu en protection de fortune) derrière lequel il se **planque** entre deux tirs.

- **Levé / intact** — pendant `SHIELDED` : il est derrière, à couvert, intouchable.
- **Baissé / vulnérable** — pendant une fenêtre `EXPOSED` (phase 2+) : pour tirer, il **abaisse sa
  couverture** ; son bord exposé, bas et côté rue, devient le point que le joueur peut dégommer.

**Le read du "shield-break" (lever 6) :** tirer dans ce bord bas — dégommer sa couverture — **l'empêche
de se replanquer aussi longtemps** : la prochaine accalmie (`SHIELDED` lull) est plus courte. Fiction
motivée, pas un debuff abstrait : _« t'as fait sauter son bouclier, il peut plus rester planqué »_. La
couverture n'est **pas détruite** définitivement (il la relève à chaque cycle) — elle est **enfoncée**
le temps d'un round. Cohérent avec le prop récurrent de la spec mécanique (§0-bis).

Ligne de lecture pour KENZA/DISPATCH (optionnelle, si un cue est voulu) :

- `KENZA — « Son bouclier ! Casse-lui sa planque, il restera pas couvert ! »`

## 3. Beats joueur (French strings, tunable copy)

**Pré-duel (quota atteint, le duel s'ouvre) — DISPATCH, terse :**

- `DISPATCH — « Le porche est bloqué. C'est lui. Le Commandant. »`
- `DISPATCH — « Il tire que quand il se découvre. Vise juste, garde ton énergie. »`

**Victoire (`bossHp → 0`, avant `LEVEL_COMPLETE`) — laconique, pas triomphal :**

- `MUF — « Il est à terre. La caisse passe. »`
- (option KENZA) `KENZA — « Un de moins aux fenêtres. Bouge, d'autres vont rappliquer. »`

**Défaite (blown-window clock atteint → `LOST` → `GAME_OVER`) — raison explicite, non-bullshit :**

- **Ligne canon (confirmée) :** `« La brigade t'a submergé — trop d'ouvertures manquées. »`
  - Rationale : reste factuelle et diégétique, nomme la CAUSE (les fenêtres manquées) pour que la mort
    soit lisible (contrat anti-"mort bullshit"). Conserver telle quelle.

## 4. Hard scope pins

- **PAS de bouclier humain / raver-otage en V1** (spec mécanique §4.4). Si un jour on le veut, c'est une
  addition de scope explicite (réintroduit la pénalité bavure + le clamp G6) — à lever avec `pm`/Karim,
  jamais en douce.
- **Pas de nouvelle faction.** Le Commandant reste l'apex du roster §7 déjà scopé (BAC de nuit).
- **Le bouclier est un objet, jamais une armure sur lui** (canon lead-art). Toute dérive rouvrirait sa
  silhouette ratifiée.

## 5. Hand-off — `lead-game-designer` (gate)

**Décidé ici :** la lecture "il est venu en personne" pour Belliard ; le bouclier = cover prop séparé
(levé/baissé) avec son read shield-break motivé ; les beats pré/post/défaite (ligne de défaite
confirmée).
**Laissé OUVERT pour toi (§1.3) :** lecture (A) première-passe-pas-la-dernière vs (B) Belliard =
scène unique en V1, et l'ajustement de `spec-boss-encounter-fiction.md` §1.3 que (B) impliquerait.
**Requesting:** gate `VERDICT:` (PASS / PASS-WITH-CORRECTIONS / FAIL) + le choix (A)/(B).
