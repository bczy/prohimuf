# GitHub Copilot instructions — muf

> **Read `../AGENTS.md` first.** It holds the vendor-neutral project facts,
> stack, commands, architecture boundary law, scope guard, working rules, and
> Karpathy behavioral guidelines. Everything below is Copilot-specific and
> narrow.

## Which Copilot runtime are you? (read this first)

Two different Copilot runtimes read this file, and they do **not** have the same
tools. Identify yours before anything else:

|                                | **Copilot CLI / Copilot app** (local worktree sessions)                                                                     | **Copilot Coding Agent** (github.com, issue-assigned) |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `Task` tool with custom agents | **YES** — `.claude/agents/**` are loaded as user-provided custom agents (`dev-gameplay`, `senior-architect`, `lead-art`, …) | no                                                    |
| `.claude/skills/**`            | **YES** — exposed as invocable skills (`review-panel`, `bmad-*`, `verify`, …)                                               | no                                                    |
| Working mode                   | **orchestrate the crew** (§ below)                                                                                          | single-agent loop (§ Merge gate)                      |

**Self-test:** if your tool list contains a `Task`/agent tool whose agent types
include `dev-gameplay`, `senior-architect` or `lead-art`, you are the **CLI
runtime** — the orchestration policy below is binding. If it does not, you are
the **Coding Agent** — skip that section and work solo.

## Default orchestration — CLI runtime only (Bertrand's standing preference)

Same policy as `CLAUDE.md` §"Default orchestration policy": **for every
non-trivial task, delegate to the crew in parallel — do not work solo.** The
agent fiches in `.claude/agents/**` are the real, current doctrine; this
overlay does not restate them.

- **Non-trivial** = any feature, refactor or bug touching code/assets, or any
  design work. Open with `pm`, plan lanes with `senior-architect`, fan out the
  dev lanes as concurrent `Task` calls on **non-overlapping paths**, close with
  architect review + `pm` acceptance.
- **Exceptions (act directly):** questions & explanations, read-only
  exploration, research, one-line/micro edits (typo, local rename), one-off
  git/CI commands. In doubt on a borderline task, prefer the crew.
- **Pipeline & hand-offs:** `.claude/agents/COLLABORATION.md` (stages 0-8, the
  two-tier fix lane, the hand-off log in `docs/handoffs/`).

Routing cheat-sheet (delegate, don't improvise):

| The task touches…                                                 | Lane to invoke                                                                      |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/game/**` pure logic, systems, TDD                            | `dev-gameplay`                                                                      |
| `src/render/**`, R3F, shaders, HUD, view hooks                    | `dev-r3f-render`                                                                    |
| `scripts/**`, `levelArt.json`, CI/workflows                       | `dev-tooling-assets`                                                                |
| Scope, PRD, stories, acceptance                                   | `pm`                                                                                |
| Boundaries, dependencies, ADR decisions                           | `senior-architect`                                                                  |
| Mechanics/tuning/3C · fiction & in-game text · screens/flows/a11y | `game-designer` · `narrative-designer` · `ux-designer` (gate: `lead-game-designer`) |
| Prompts & generated assets                                        | `concept-artist` → `game-graphist` → `lead-art` (gate)                              |
| Test plans, regressions, VERIFY stage                             | `qa-lead`                                                                           |
| ADR wording, doc↔code drift                                       | `tech-writer`                                                                       |

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
The CI `panel-verdict` check run is the merge-blocking authority for every
runtime.

**Never self-simulate the panel from a single conversation** — answering "I ran
the merge-gate panel" without four genuinely separate reviewer contexts is a
doctrinal violation. On the **CLI runtime** you may run the `review-panel`
skill as an _advisory pre-push check_ (it does spawn four real reviewer
subagents); its verdict never replaces CI's. On the **Coding Agent**, you have
no such tooling at all — push and let CI run.

Your loop is:

1. Make the change, run `yarn typecheck` + `yarn test` + `yarn lint`.
2. `report_progress` (or `create_pull_request` on the last step).
3. Stop. The CI panel runs on the PR and publishes the `panel-verdict`
   check. Address findings on the next push.

The `/review-panel` skill referenced in `CLAUDE.md` is available on the CLI
runtime and absent on the Coding Agent — never claim to have run it when you
have not.

## What NOT to do

- **Coding Agent only:** do not attempt to invoke the subagent crew or the
  BMAD skills (`.claude/agents/`, `.claude/skills/bmad-*`) — you have no `Task`
  with `subagent_type`, and `AGENTS.md` already carries the distilled rules.
  The **CLI runtime** has both and MUST use them (see § Default orchestration).
- Do **not** self-simulate the 4-reviewer merge-gate panel in a single
  conversation. Push and let `.github/workflows/code-review-panel.yml` run it.
- Do **not** duplicate rules from `AGENTS.md` into this file. Keep this
  overlay narrow. If you find yourself wanting to add a general rule here,
  it probably belongs in `AGENTS.md`.
- Do **not** run the asset-generation workflows (`.github/workflows/gen-*`)
  from Copilot — they cost external API budget. Art is generated in CI on
  demand by maintainers.
