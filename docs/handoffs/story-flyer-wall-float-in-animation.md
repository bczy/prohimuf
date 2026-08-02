# Handoffs — Story : animation d'entrée du mur de flyers (STORY-FLYER-WALL-FLOAT-IN)

Story slug: `story-flyer-wall-float-in-animation` · branche `origin/claude/flyer-wall-float-in-animation`.

Animation d'entrée en cascade des flyers de la page NIVEAUX, escaladée de la tier fix-lane vers la pipeline complète.

## Producer Ruling — collision de numéro d'ADR (Marion — 2026-08-02)

### Ruling initial (2026-08-02, matin)

**COLLISION DÉTECTÉE** entre deux branches revendiquant ADR-0077 :

- `docs/adr/0077-mcp-level-editor-server.md` — branche `claude/mcp-level-editor-build-iy2jaw`, revendiqué 2026-07-31, au merge gate (PR #159)
- `docs/adr/0077-flyer-cascade-session-key.md` — commit `24762f7a`, branche `origin/claude/flyer-wall-float-in-animation`, créé 2026-08-01

**RULING** : la story MCP garde ADR-0077 (antériorité + au merge gate) ; cette branche renumérote 0077 → 0078 à son rebase.

### Dénouement réel (2026-08-02, après-midi) — le ruling a tenu, mais un TIERS a pris le 0077

Un troisième prétendant, hors des deux branches arbitrées, a mergé sur `main` en premier :
**`docs/adr/0077-couverture-tsc-eslint-scripts.md`** (branche `claude/focused-wozniak-lomy3e`,
PR #161). Le numéro 0077 est donc devenu indisponible pour les DEUX branches arbitrées,
alors même que l'arbitrage portait sur lui.

État final des numéros, vérifié le 2026-08-02 :

| Numéro | Titulaire / prétendant                    | État                                              |
| ------ | ----------------------------------------- | ------------------------------------------------- |
| 0077   | `couverture-tsc-eslint-scripts`           | **mergé sur `main`** — définitif                  |
| 0077   | `qte-photo-paparazzi-set-pieces` (#163)   | collision avec `main` — cette lane devra bouger   |
| 0078   | `flyer-cascade-session-key` (#145)        | cette branche — renumérotation déjà faite         |
| 0078   | `sp2-paid-generation-ci-surface` (#156)   | **collision avec #145** — l'une des deux bougera  |
| 0079   | _(libre à l'instant T)_                   | cible naturelle des glissements ci-dessus         |
| 0080   | `photo-leverage-cross-level-carry` (#163) | non mergé                                         |
| 0081   | `mcp-level-editor-server`                 | story MCP (PR #159) — pris ici, hors zone de choc |

**Alerte pour `producer`, découverte au balayage exhaustif (103/103 branches distantes inspectées le 2026-08-02)** : une SECONDE collision est déjà en place sur **0078** — `claude/flyer-wall-float-in-animation` (#145) et `feat/level-harness-sp2` (#156) le revendiquent toutes deux, et `design/qte-photo-paparazzi` (#163) doit en plus quitter 0077. La story MCP s'est donc rangée en **0081**, hors de la zone où ces trois glissements vont atterrir (0078/0079), plutôt que de camper sur le premier trou libre.

**Aucun geste ne reste dû à cette lane sur le 0078 lui-même** : la branche flyer s'est rebasée sur le nouveau
`main` et porte bien `docs/adr/0078-flyer-cascade-session-key.md`. Le ruling est exécuté.

### Leçon pour `producer` — l'allocation par arbitrage ne suffit pas

Arbitrer un numéro entre deux branches connues ne protège pas d'une troisième qui merge
d'abord : le numéro n'est réservé qu'au moment du merge sur `main`, jamais avant. Le seul
mécanisme fiable reste celui de la garde de `scripts/gen-adr-index.mjs` — qui a bien
détecté le doublon ici — plus une re-vérification du numéro **juste avant le merge**, pas
au moment de l'écriture de l'ADR. Consigne à ne pas pinner un numéro futur dans un
hand-off : dire « le prochain libre, vérifié au rebase » plutôt qu'un chiffre.

**Tracé par** : Marion (producer), 2026-08-02, en réponse à l'escalade Winston §6.7 de
`story-mcp-level-editor.md` ; mis à jour l'après-midi avec le dénouement réel.
