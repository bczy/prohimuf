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

## What NOT to do

- Do **not** attempt to invoke Claude's subagent crew or BMAD skills
  (`.claude/agents/`, `.claude/skills/bmad-*`). Those are Claude-Code-only
  runtime machinery — Copilot doesn't have `Task` with `subagent_type`. The
  rules in `AGENTS.md` are already the distilled output of that pipeline.
- Do **not** duplicate rules from `AGENTS.md` into this file. Keep this
  overlay narrow. If you find yourself wanting to add a general rule here,
  it probably belongs in `AGENTS.md`.
- Do **not** run the asset-generation workflows (`.github/workflows/gen-*`)
  from Copilot — they cost external API budget. Art is generated in CI on
  demand by maintainers.
