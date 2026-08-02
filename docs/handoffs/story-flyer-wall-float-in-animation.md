# Handoffs — Story : animation d'entrée du mur de flyers (STORY-FLYER-WALL-FLOAT-IN)

Story slug: `story-flyer-wall-float-in-animation` · branche `origin/claude/flyer-wall-float-in-animation` (commit `b0fbf8c6`).

Animation d'entrée en cascade des flyers de la page NIVEAUX, escaladée de la tier fix-lane vers la pipeline complète.

## Producer Ruling — ADR Number Collision (Marion — 2026-08-02)

**COLLISION DÉTECTÉE** : deux branches revendiquent ADR-0077 :
- `docs/adr/0077-mcp-level-editor-server.md` — branche `claude/mcp-level-editor-build-iy2jaw`, revendiqué 2026-07-31, au merge gate (PR #159 draft)
- `docs/adr/0077-flyer-cascade-session-key.md` — commit `24762f7a`, branche `origin/claude/flyer-wall-float-in-animation`, créé 2026-08-01

**RULING PRODUCER** : story MCP garde ADR-0077 (antériorité + au merge gate). **Cette branche renumérote 0077 → 0078 au rebase sur `main` après merge de la story MCP.**

**Geste à faire avant rebase sur main** :
1. Renommer `docs/adr/0077-flyer-cascade-session-key.md` → `docs/adr/0078-flyer-cascade-session-key.md`
2. Régénérer l'index : `node scripts/gen-adr-index.mjs --write` puis `--check`
3. Vérifier le handoff dans cette shard : « ADR-0078 » à la place de « 0077 »

**Tracé par** : Marion (producer), 2026-08-02, en réponse à l'escalade Winston §6.7 de story-mcp-level-editor.md.
