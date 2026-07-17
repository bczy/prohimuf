# Références — Produit, architecture & process (`pm`, `producer`, `senior-architect`, `tech-writer`, `qa-lead`)

Pour le « quoi/pourquoi », le pilotage du pipeline, les frontières techniques, les ADR/docs
et le quality gate. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `_bmad-output/guidelines/PROJECT_GUIDELINES.md` — scope guard non négociable.
- `.claude/agents/COLLABORATION.md` — le protocole normatif du crew (pipeline 0-8, gates, caps).
- `docs/architecture.md` + `docs/adr/README.md` — frontières et journal des décisions.
- `docs/index.md`, `docs/agent-handoffs.md` — cartes d'entrée doc & hand-offs.
- `_bmad/bmm/config.yaml` — config BMAD (langue, chemins d'artefacts).

## Références externes

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/fr/v1.0.0/) — format de commit imposé (commitlint).
- [Architecture Decision Records (adr.github.io)](https://adr.github.io/) — le format ADR de référence.
- [M. Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — l'article fondateur de l'ADR.
- [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) — discipline de journal lisible par un humain.
- [Semantic Versioning 2.0.0](https://semver.org/lang/fr/) — vocabulaire de version pour les décisions de release.
- [User story mapping — Jeff Patton](https://www.jpattonassociates.com/story-mapping/) — découper une intention en stories (pour `pm`).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — critère d'acceptation transverse quand une story touche l'UI (pour `qa-lead`).

## MCP / Skills à utiliser

- **codegraph** (`senior-architect`) — vérifier l'impact d'un changement de frontière avant sign-off.
- `pm` : `bmad-create-prd`, `bmad-validate-prd`, `bmad-create-epics-and-stories`, `bmad-correct-course`.
- `producer` : `bmad-sprint-planning`, `bmad-sprint-status`, `bmad-retrospective`.
- `senior-architect` : `review-panel` (merge gate stage 6), `bmad-create-architecture`, `bmad-check-implementation-readiness`.
- `tech-writer` : `bmad-agent-tech-writer`, `bmad-index-docs`, `bmad-document-project`.
- `qa-lead` : `bmad-qa-generate-e2e-tests`, `bmad-review-edge-case-hunter`, `verify`.
