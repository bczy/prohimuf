# Follow-ups — post drift audit 2026-07

**Origine :** [drift-audit-2026-07.md](./drift-audit-2026-07.md), findings F5, F6, F7, F8, F10.
**Convention :** ces items sortent de la lane `tech-writer` (iron rule : Otis
décide _rien_). Chacun appartient à l'owner listé, qui doit soit ouvrir une
story dans le sprint courant, soit la reporter avec une justification.

Cette liste tient lieu de « tickets » tant que l'environnement de rédaction
n'a pas pu ouvrir des issues GitHub (auth cassée pour le compte robot). À
convertir en issues quand Bertrand ou un mainteneur avec droits le fera.

---

## F5 — Roadmap refresh (`docs/roadmap.md`)

- **Owner :** `pm` (John).
- **Story slug proposé :** `story-roadmap-refresh-2026-q3`.
- **Symptôme :** `docs/roadmap.md:3` affiche `Status as of 2026-04-11` ;
  Sprints 0-3 listés ; boss QTE, Belliard live, CRT composite (ADRs 0031,
  0051-0060) absents. Comma-wrap damage identique à F2.
- **Livrable attendu :** roadmap remise à jour au 2026-Q3 (sprints inclus,
  ADR récents référencés), passée par la nouvelle DOCS-PLAN (ADR-0061) au
  moment du re-scoping.
- **Fix path :** full pipeline (contenu, pas wording).

## F6 — Architecture doc refresh (`docs/architecture.md`)

- **Owner :** `senior-architect` (Winston) pour le contenu, `tech-writer`
  (Otis) pour le drafting.
- **Story slug proposé :** `story-architecture-doc-refresh-2026-q3`.
- **Symptôme :** folder-tree obsolète — `TiledFacade` retiré, absents :
  `LevelBackdrop` PNG layers, boss QTE, CRT composite (ADR-0031), foreground
  parallax (ADR-0047), fallbacks procéduraux near-fg (ADR-0049), single-wide
  backdrop (ADR-0057), grille overlay (ADR-0058), CSS Modules + tokens
  (ADR-0046), asset preloading gate (ADR-0022).
- **Livrable attendu :** section « Folder structure » et « Data flow »
  reconstruites depuis l'état HEAD, cross-refs vers les ADR concernés.
- **Fix path :** full pipeline (contenu).

## F7 — README spot-check complet

- **Owner :** `tech-writer` (Otis) — c'est de la wording lane.
- **Story slug proposé :** `story-readme-spot-check-2026-07`.
- **Symptôme :** non audité dans la première vague ; la section
  « Multi-agent compatibility » est vérifiée par repo memory 2026-07-19,
  le reste ne l'est pas.
- **Livrable attendu :** audit README section par section, findings notés,
  wording corrigé si dérive mineure, escalade en tickets par owner si
  dérive de contenu.
- **Fix path :** fix lane si tout est wording ; full pipeline sinon.

## F8 — Décision sharding de l'index handoffs

- **Owner :** `producer` (Marion) — c'est de la log hygiene.
- **Story slug proposé :** `story-handoffs-index-sharding-decision`.
- **Symptôme :** `docs/agent-handoffs.md` fait ~97 lignes Markdown mais
  ~51 k tokens (lignes très longues / dense). ADR-0032 réclame sharding
  quand un doc partagé approche de ~100 KB / la limite de lecture en une
  passe. On y est.
- **Livrable attendu :** décision `producer` — soit trim + garder l'index
  minimal, soit refactoriser vers une deuxième couche de shards (ex :
  `agent-handoffs-2026-h1.md`), soit démonstration qu'aucune action
  nécessaire pour le moment. Verdict logué dans le shard concerné.
- **Fix path :** fix lane si trim ; full pipeline si refactor.

## F10 — `docs/perf-budget.md` — écriture initiale

- **Owner :** `gpu-specialist` (Ben) pour le contenu ; `tech-writer`
  (Otis) pour l'index une fois shippé.
- **Story slug proposé :** `story-perf-budget-doc-authoring`.
- **Symptôme :** COLLABORATION.md:25 et ADR-0037 traitent `docs/perf-budget.md`
  comme un deliverable existant ; le fichier n'existe pas dans le repo. La
  drift-audit a évité de linker un fichier absent depuis `docs/index.md`.
- **Livrable attendu :** doc initiale — frame budget spec, profiling
  protocol, on-target measurement procedure — conforme à la fiche du
  `gpu-specialist`.
- **Fix path :** full pipeline (contenu, ADR-worthy si les métriques
  fixées ont un impact décisionnel sur l'architecture render).

---

## ADR-0062 — post-merge promotion

- **Owner :** `senior-architect` (Winston) ; `tech-writer` (Otis) opère.
- **Symptôme :** ADR-0062 est shippée en **Proposed** dans le PR courant,
  faute d'avoir été triée par un architect (moi, tech-writer, ne peux pas
  décider — iron rule). Doctrine décrite déjà appliquée de facto depuis
  commit 502ecd2, donc rien n'est cassé.
- **Livrable attendu :** relecture architect, verdict PASS/FAIL, promotion
  `Proposed` → `Accepted` (ou rework), regeneration ADR index.
- **Fix path :** fix lane (wording only si simple flip de status).
