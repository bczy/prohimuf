#!/usr/bin/env bash
# UserPromptSubmit hook — injects the BMAD-crew default routing policy on every prompt.
# The policy itself (and the "non-trivial" judgement) lives in CLAUDE.md; this hook
# just keeps it in context so it survives long sessions and context resets.
# To pause the crew for a session, set MUF_CREW_OFF=1 in the environment.

if [ "${MUF_CREW_OFF:-0}" = "1" ]; then
  exit 0
fi

cat <<'EOF'
[muf · routage par défaut] Deux voies (protocole : .claude/agents/COLLABORATION.md) :

VOIE FIX — petit diff mono-lane (bug fix / polish d'un comportement DÉJÀ gaté ; zéro
design, zéro asset, zéro dépendance/frontière, un seul lane dev propriétaire) :
  dev du lane → rtk tsc + vitest + lint (+ verify si visible joueur)
   → UN reviewer `code-review` (effort high) sur git diff origin/main...HEAD
   → merge Bertrand · log : 1 ligne dans docs/handoffs/fixes.md
  Doute ou critère cassé en route → escalade en pipeline complet. Marion trace le tiering.

PIPELINE COMPLET — toute feature, refactor ou conception (stages 0-8) :
  pm (quoi/pourquoi, story scopée)
   → [design : game-designer ∥ narrative-designer → gate lead-game-designer, si gameplay/fiction]
   → senior-architect (comment, frontières, lanes ; n° d'ADR alloué par Marion/producer)
     → dev-r3f-render ┐
     → dev-gameplay   ├─ Task calls EN PARALLÈLE (un seul message) sur des chemins disjoints
     → dev-tooling    ┘  (∥ lane art / audio si assets)
       → VERIFY (qa-lead orchestre : tsc/vitest/lint, e2e, gates composite/design/audio)
       → REVIEW (stage 6) — GATE OBLIGATOIRE avant merge sur main : 4 reviewers parallèles,
         skills distincts (code-review high, bmad-code-review, bmad-review-edge-case-hunter,
         security-review) ; findings contre-vérifiés adversarialement ; TRIAGE senior-architect
         = aussi sa revue d'intégration (une seule passe). Aucun finding CONFIRMÉ
         bloquant/majeur non traité.
   → pm (acceptation vs story + PROJECT_GUIDELINES) → merge Bertrand
Journal SHARDÉ : docs/handoffs/story-<slug>.md (index + format VERDICT: docs/agent-handoffs.md).
EXCEPTIONS (agir en direct, sans crew) : questions/explications, lectures, recherches,
micro-edits (typo, renommage local, une ligne), commandes git/CI ponctuelles.
EOF
exit 0
