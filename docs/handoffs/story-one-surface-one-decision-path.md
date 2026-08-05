# story-one-surface-one-decision-path

Amendement de doctrine issu de la **PR #145**, dont le récit complet vit dans
[`story-flyer-wall-float-in-animation.md`](./story-flyer-wall-float-in-animation.md)
(§ « Défaut de process à porter par `producer` », et le bloc « Non corrigé dans cette
PR, volontairement »). Cinq collisions entre sessions Claude parallèles sur une même
branche. Sortie normative : `.claude/agents/COLLABORATION.md` règles #10 et #11.

## 0. INTAKE — Bertrand → producer — 2026-08-05

- claim: « défaut de process à porter en doctrine ». Les cinq collisions, telles que
  tracées sur la branche de la PR #145 :
  1. modification de `.github/workflows/code-review-panel.yml` — le gate de merge
     lui-même — dans une PR que ce gate jugeait, sans signature `dev-tooling-assets`
     ni ADR (le fichier en a exigé un trois fois : ADR-0063, 0067, 0070). Relevé
     MAJEUR puis BLOQUANT par le panel, argument décisif « _self-disclosure by the PR
     does not close the gate_ ». Extrait vers la PR #168 ;
  2. un SECOND changement du même fichier atterri après l'extraction du premier ;
  3. deux sessions passant le même gate narratif sur la même surface sans se voir →
     deux documents de verdict concurrents ;
  4. deux arbitrages `lead-game-designer` contradictoires sur ces deux verdicts
     (garder l'invader recadré / exiger son remplacement) ;
  5. une troisième session implémentant l'un des deux arbitrages pendant que l'autre
     était encore en cours.
- coût réel : deux agents mobilisés pour le même arbitrage avec des conclusions
  opposées, un document de gate écrasé de justesse (rattrapé par un `git checkout`
  avant push), des panels annulés en vol par des poussées concurrentes.
- règle proposée par `lead-game-designer` en clôture de son arbitrage (K-A4) :
  **une surface = un chemin de décision**.

## 1-8 — producer (Marion 📆, changement méta-protocole, direct) — 2026-08-05

- claim: porter les deux règles dans la doctrine. Crew non spawné : le diff est
  documentaire, il modifie la charte du crew à partir d'un constat factuel tracé et
  d'une formulation déjà rendue par le gate owner concerné (K-A4). Aucune surface de
  scope, de design, d'art ni de code. Palier : hors des deux paliers (ni course
  express ni tournée complète) — même traitement que
  `story-agent-team-flow-optimization`, qui a créé le précédent le 2026-07-17.
- release: File List —
  - `.claude/agents/COLLABORATION.md` — §rules of engagement : **règle #10** (une
    surface = un chemin de décision : comment savoir qu'une surface est gatée, où
    va l'objection, qui arbitre quand deux verdicts existent quand même) et
    **règle #11** (une PR ne modifie pas le gate qui la juge). Renvois courts
    ajoutés dans la règle #3 (les chemins ne sont qu'une surface de contention),
    §code-review panel (→ #11) et §design flow (→ #10). **Aucune renumérotation** :
    #1-#9 sont référencées depuis 7 ADR et une dizaine de shards.
  - `docs/handoffs/story-one-surface-one-decision-path.md` — ce shard.
  - `docs/agent-handoffs.md` — ligne d'index.
- ADR: **aucun numéro alloué**. La doctrine du crew est normative dans
  COLLABORATION.md ; ADR-0032 (two-tier pipeline and process amendments) reste le
  registre des amendements de pipeline et pourrait accueillir ces deux règles en
  amendement — c'est un appel `senior-architect`, pas le mien. Signalé, non tranché.
- VERDICT: PASS — merge gate note: diff docs-only, relu par Bertrand en PR
  (autorité de merge stage 8 inchangée).

## Pistes de garde-fou automatisable — proposées, NON décidées

À arbitrer par `senior-architect` + `dev-tooling-assets`, hors de ce diff (contrainte
« documentation seulement »). Coût annoncé honnêtement.

- **Règle #11, automatisable et bon marché.** Un check qui échoue quand le diff
  (`git diff origin/main...HEAD --name-only`) intersecte les chemins du gate ET des
  chemins hors gate. Formulé ainsi il n'a **pas besoin d'échappatoire** : une PR
  gate-only passe, ce qui est exactement le comportement voulu. Coût : ~20 lignes
  dans un job existant, plus une liste de chemins à maintenir — et cette liste dérive
  silencieusement dès qu'un check requis gagne un script. Elle doit donc vivre à côté
  de la définition des checks requis, pas dans un coin du workflow.
  Attention : ce check appartient au gate qu'il protège, donc la PR qui l'introduit
  tombe elle-même sous la règle #11 → elle doit être gate-only.
- **Règle #10, mauvaise candidate à l'automatisation.** Ce qu'il faudrait détecter,
  c'est deux documents jugeant le même objet — une identité sémantique, pas un chemin.
  Une convention de nommage (`<gate>-<slug-de-surface>.md`) plus un check d'unicité de
  slug attraperait le cas facile et manquerait tous les autres, tout en donnant
  l'illusion d'une couverture. Le vrai mécanisme existe déjà et il est gratuit : le
  `grep` sur les lignes `VERDICT:` des shards avant d'ouvrir un document de gate.
  Verrouiller réellement (advisory lock sur le shard) supposerait un état partagé
  entre worktrees parallèles, qui n'existe pas. **Reco : ne rien automatiser ici.**
