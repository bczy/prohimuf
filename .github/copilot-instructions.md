# GitHub Copilot instructions — muf

> **Read `../AGENTS.md` first.** It holds the vendor-neutral project facts,
> stack, commands, architecture boundary law, scope guard, working rules, and
> Karpathy behavioral guidelines. Everything below is Copilot-specific and
> narrow.

## Copilot-specific notes

- **Node.js 24, Yarn 4** (via `corepack enable`). Do not switch to npm.
- **Commands** are the plain `yarn` ones in `AGENTS.md`
  (`yarn typecheck` / `yarn test` / `yarn lint` / `yarn build`).
  Do NOT invoke `rtk` — that's a Claude Code optimization; it may not be
  installed in your sandbox and the plain yarn commands do the same thing.
- **Coding agent sandbox** (issue-assigned Copilot) is bootstrapped by
  `.github/workflows/copilot-setup-steps.yml`. Trust that setup; do not
  reinstall Node or Yarn from scratch.
- **Boundary law (repeat):** anything you write in `src/game/**` must import
  **zero** React or Three. If a task requires React/Three, place the code in
  `src/render/**` or `src/hooks/**` instead. This is enforced by review; a
  boundary violation is a blocking finding.
- **Style:** strict TypeScript (no `any`), ESLint + Prettier via Husky
  lint-staged on commit. If you write a new file, expect the pre-commit hook
  to reformat it.
- **Tests are non-negotiable for game logic:** every new system under
  `src/game/systems/` needs a matching test in `src/game/systems/__tests__/`.
  Copy the structure of an existing sibling test file.
- **Commits:** Conventional Commits (commitlint-enforced). Example:
  `feat(game): add courier stamina system`,
  `fix(render): correct HUD scale on 4:3 aspect`.
- **PR description:** must include the branch-preview link. Format and
  slug-escaping rules are in `AGENTS.md` §Working rules.
- **ADRs:** if your change touches module boundaries, deployment,
  dependencies, or the `src/game` ↔ `src/hooks` ↔ `src/render` contract, add
  or update an ADR under `docs/adr/` in the same PR
  (see `docs/adr/README.md`).

## Merge gate — do not self-simulate

The mandatory 4-reviewer merge-gate panel (`code-review`, `bmad-code-review`,
`bmad-review-edge-case-hunter`, `security-review` + skeptic + triage) is
executed **in CI** by `.github/workflows/code-review-panel.yml` (ADR-0063).
You do NOT have the Claude-Code `Task`/`subagent_type` machinery, so you
**must not** answer "I ran the merge-gate panel" from a single conversation —
that's a doctrinal violation.

Your loop is:

1. Make the change, run `yarn typecheck` + `yarn test` + `yarn lint`.
2. `report_progress` (or `create_pull_request` on the last step).
3. Stop. The CI panel runs on the PR and publishes the `panel-verdict`
   check. Address findings on the next push.

The `/review-panel` skill referenced in `CLAUDE.md` is Claude-Code-only —
never claim to have run it.

## What NOT to do

- Do **not** attempt to invoke Claude's subagent crew or BMAD skills
  (`.claude/agents/`, `.claude/skills/bmad-*`). Those are Claude-Code-only
  runtime machinery — Copilot doesn't have `Task` with `subagent_type`. The
  rules in `AGENTS.md` are already the distilled output of that pipeline.
- Do **not** self-simulate the 4-reviewer merge-gate panel. Push and let the
  CI workflow (`.github/workflows/code-review-panel.yml`) run it.
- Do **not** duplicate rules from `AGENTS.md` into this file. Keep this
  overlay narrow. If you find yourself wanting to add a general rule here,
  it probably belongs in `AGENTS.md`.
- Do **not** run the asset-generation workflows (`.github/workflows/gen-*`)
  from Copilot — they cost external API budget. Art is generated in CI on
  demand by maintainers.
