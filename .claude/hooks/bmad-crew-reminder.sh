#!/usr/bin/env bash
# UserPromptSubmit hook — injects the BMAD-crew default routing policy on every prompt.
# The policy itself (and the "non-trivial" judgement) lives in CLAUDE.md; this hook
# just keeps it in context so it survives long sessions and context resets.
# To pause the crew for a session, set MUF_CREW_OFF=1 in the environment.

if [ "${MUF_CREW_OFF:-0}" = "1" ]; then
  exit 0
fi

cat <<'EOF'
[muf · routage par défaut] Pour toute tâche NON TRIVIALE (feature, refactor, bug touchant
du code/des assets, conception), orchestre le crew BMAD en parallèle plutôt que d'agir seul :
  pm (quoi/pourquoi, story scopée)
   → senior-architect (comment, frontières, assignation des lanes + plan parallèle)
     → dev-r3f-render ┐
     → dev-gameplay   ├─ Task calls EN PARALLÈLE (un seul message) sur des chemins disjoints
     → dev-tooling    ┘
       → senior-architect (revue + sign-off intégration)
       → PANEL DE CODE REVIEW — GATE OBLIGATOIRE avant tout merge sur main :
         4 reviewers parallèles, skills distincts (code-review high, bmad-code-review,
         bmad-review-edge-case-hunter, security-review) sur git diff origin/main...HEAD ;
         findings contre-vérifiés adversarialement ; triage senior-architect. Aucun merge
         avec un finding CONFIRMÉ bloquant/majeur non traité.
   → pm (acceptation vs story + PROJECT_GUIDELINES)
Coordination : .claude/agents/COLLABORATION.md · journal : docs/agent-handoffs.md.
EXCEPTIONS (agir en direct, sans crew) : questions/explications, lectures, recherches,
micro-edits (typo, renommage local, une ligne), commandes git/CI ponctuelles.
EOF
exit 0
