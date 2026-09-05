# 0084 — The Unity track lives in this repo under `unity/`: boundary, tooling isolation, CI

- **Status:** Proposed — but read the scope of that word. The six arbitrations in §Context are
  **Bertrand's (CEO), final, and not open for re-litigation** by any lane. `Proposed` applies to
  the isolation design in §Decision (D1-D8), which no green CI run has yet proven and which
  becomes `Accepted` in the PR that lands the first `unity/` tree with the web pipeline still
  green.
- **Date:** 2026-09-05
- **Number:** 0084 — **self-allocated** via the `adr-new` skill, because no `producer` number was
  allocated for this track (it is out-of-epic exploratory work opened directly by the CEO, and
  the handoffs shard carries no ADR number). Allocation checked on 2026-09-05 across local
  `docs/adr/`, `origin/main:docs/adr` and the generated index table — highest was 0083 in all
  three. **Re-check at merge**: this repo has already shipped two ADR-0020s and renumbered
  ADR-0083 twice.
- **Author:** decision content by `senior-architect` (Winston), on the CEO's mandate
  (decision 6: "piste suivie ⇒ ADR").
- **Relates to:** `_bmad-output/planning-artifacts/story-unity-bootstrap-welcome-screen.md` (the
  spike this ratifies), `docs/handoffs/story-unity-bootstrap-welcome-screen.md`,
  `_bmad-output/guidelines/PROJECT_GUIDELINES.md` §3 (the stack lock this ADR deliberately does
  **not** amend), `AGENTS.md` §Architecture (the boundary law this ADR extends), ADR-0063 and
  ADR-0070 (the CI merge-gate panel that now also sees `unity/` PRs), ADR-0077 (the precedent
  that this repo's tooling deliberately scans wider than `src/`).

## Context

Bertrand arbitrated on 2026-09-05 that the Unity 3D bootstrap spike becomes a tracked track
inside this repository, and the question this ADR answers is therefore not whether muf does
Unity but how a second game engine can live in this tree without breaking the web game that
already ships from it. His six decisions, verbatim in effect:

1. **Repo location — a `unity/` subfolder in THIS repo.** The story recommended a separate
   repository; the CEO decided the opposite. That call stands. This ADR records it and carries
   its cost (see §Consequences), it does not re-argue it.
2. **Unity licence — Personal.**
3. **macOS architecture — Apple Silicon only.** No Intel, no Universal.
4. **CI in V1 — yes.**
5. **Who writes the Unity project — `trambz`.**
6. **After the spike — the track is followed, hence this ADR.**

The prior state matters, because it is what a second project collides with. This repo is a
single-language monorepo whose toolchain is deliberately **repo-wide**, verified in the files on
2026-09-05:

- `package.json` → `format:check` is `prettier --check .` — the whole tree, not `src/`.
- `package.json` → `lint` is `eslint .`, and `eslint.config.ts` carries an explicit `ignores`
  list (`dist/**`, `node_modules/**`, `.claude/worktrees/**`, `coverage/**`, `.yarn/**`, …) with
  **no** `unity` entry and **no** `includeIgnoreFile(...)` — flat-config ESLint does not read
  `.gitignore`, so what is gitignored is still linted if it exists on disk.
- `.github/workflows/ci.yml` has `on: pull_request` with **no `paths` filter at all** — it runs
  on every PR, whatever it touches.
- `.prettierignore` currently ignores `.claude/`, `_bmad/`, `_bmad-output/` and the two
  generated ADR-index artifacts. Nothing else.
- `.gitattributes` holds only four Yarn entries. There is **no Git LFS** in this repo (and `git
lfs` is not even installed in the current sandbox).
- `.editorconfig` has a single `[*]` block: `indent_style = space`, `indent_size = 2`.

And the parts that turn out **not** to be at risk, checked rather than assumed:

- `scripts/check-agents-infographic.mjs` and `scripts/check-harness-infographics.mjs` — the two
  freshness gates that fail loudest — hash **enumerated** source paths (`.claude/agents/`, the
  harness docs), they do not glob the repository. A `unity/` tree cannot make them STALE.
- `scripts/gen-adr-index.mjs`, `check-art-prompts.mjs`, `check-hero-wiring.mjs` likewise read
  fixed paths (`docs/adr/`, `levelArt.json`, `references/approved/`).
- `vitest.config.ts` `include` is an explicit list of `src/**` and `scripts/**/*.test.mjs`, so
  Unity test files can never enter `yarn test`.
- `tsconfig.json` has `"include": ["src"]` and `tsconfig.node.json` enumerates its files, so no
  TypeScript project can currently see `unity/`.
- `vite.config.ts` builds from explicit HTML entry points, so `unity/` is not bundled.

So the real subject is a short, boring list of configuration seams — and one governance seam
(a nominative licence secret in a company repo) that is not boring at all.

## Decision

### D1 — `unity/` is a sealed second project: two games, one repo, zero coupling

`AGENTS.md`'s boundary law (`src/game/**` pure, `src/render/**` R3F-only, `src/hooks/**` the sole
bridge) is **unchanged**. It is extended by one clause at the top level:

> `unity/**` — a foreign toolchain and a separate product. **No import edge exists in either
> direction.** Nothing under `src/**`, `scripts/**`, `vite.config.ts`, `vitest.config.ts` or any
> test may reference `unity/`; nothing under `unity/` may reference `src/`.

Explicitly forbidden, because these are the shapes the temptation actually takes:

- a shared "core rules" package, workspace or path alias consumed by both;
- copying a `src/game/systems/*.ts` rule into C# "for now" so the two stay in sync by hand;
- adding `unity` to a `tsconfig` `include`, a Vite alias, or the Vitest `include`;
- putting a Unity build output under `public/` — `publicDir` is copied wholesale into `dist/`,
  so that would ship a desktop player inside the web bundle.

If a rule genuinely has to exist on both sides, it is re-derived on the Unity side from the
written spec, or a later ADR defines an explicit interchange **artefact** (a data file with a
schema and a validator), never a source import. The absence of an import edge is what makes the
two lanes non-overlapping and what keeps the boundary law meaningful; it is checkable by
`grep`, which is the point.

### D2 — the web toolchain is made blind to `unity/`, by configuration

| File               | Change                                               | Why (verified)                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.prettierignore`  | add `unity/`                                         | `format:check` is `prettier --check .`. Unity commits `.json` and `.md` under `Packages/`, and generates a large `Library/` tree that is gitignored but present on disk — Prettier reads `.prettierignore` only, **never** `.gitignore`.                                                                                                              |
| `eslint.config.ts` | add `"unity/**"` to `ignores`                        | `eslint .`, no `.gitignore` awareness. Any `.js`/`.mjs`/`.ts` under `unity/` (WebGL templates, `Library/PackageCache`, package tooling) hits the type-aware base config — the exact failure already documented in that file for `.claude/worktrees/**`: "every file fails the type-aware parser and blocks `yarn lint` (and therefore every commit)". |
| `.editorconfig`    | add a `[unity/**]` (or `[*.cs]`) section             | the single `[*]` block imposes 2-space indent on C#; Rider/Visual Studio defaults will fight it and each machine will drift.                                                                                                                                                                                                                          |
| `package.json`     | verify `lint-staged`, scope only if proven necessary | its patterns `*.{ts,tsx,mjs}` and `*.{json,md,yml,yaml,css,html}` match at **any depth**, so `unity/Packages/manifest.json` routes through `prettier --write` on commit. `.prettierignore` is expected to neutralise this for explicit arguments — that expectation is **untested in this repo**, see Open Question 5.                                |

No defensive edit is made to the `check-*.mjs` gates or to `vitest.config.ts`: they were checked
and are already blind to `unity/` by construction. Recorded here so nobody "hardens" them later
and invents a scope they never had.

### D3 — Unity's gitignore lives in `unity/.gitignore`, not in the root file

The canonical `Unity.gitignore` (`github/gitignore`) anchors its patterns with a leading slash —
`/[Ll]ibrary/`, `/[Tt]emp/`, `/[Bb]uilds/`. A leading slash anchors to the directory containing
the `.gitignore`, so pasted into the **root** file those patterns match `/Library/` at the repo
root and never `unity/Library/`. Stripping the anchors to "fix" it is worse: an unanchored
`Logs/`, `Builds/`, `Obj/`, `*.csproj` in the root file starts matching **anywhere** in `src/`,
`scripts/`, `docs/` or `public/`, silently hiding files nobody meant to hide.

**Decision: a dedicated `unity/.gitignore` holding the canonical Unity file verbatim.** Anchors
then resolve correctly, and the file stays diffable against upstream. The root `.gitignore` gains
nothing Unity-related. Never add a blanket `*.meta` ignore — losing `.meta` files corrupts asset
references (already in the story's scope section and in the Unity PR template).

### D4 — CI: one new Unity workflow, path-filtered; the web pipeline stays unfiltered

- A new `.github/workflows/unity-build.yml` uses **`game-ci/unity-builder`, tag `v5`** (per story
  AC9). Re-verified 2026-09-05 by `git ls-remote --tags`: `v5` and `v5.0.1` point at the same
  commit `adaf7cd8…`; `v6.0.0-beta.1` exists and is a beta — not used.
- **It carries `paths: ["unity/**", ".github/workflows/unity-build.yml"]`** on `pull_request`.
This is the expensive half of the filtering problem and it is fully solved by this one filter:
a PR touching only `src/` never triggers a Unity build.
- **`ci.yml` is NOT given a `paths-ignore`.** A unity-only PR will keep running the web CI. This
  is deliberate and it is the asymmetry that matters: the web pipeline is ubuntu-only and
  cached, so running it needlessly costs minutes — whereas a **required check that is filtered
  out never reports at all**, and GitHub leaves the PR stuck on "Expected — waiting for status"
  forever, unblockable except by branch-protection surgery only Bertrand can perform. Minutes
  are cheaper than a wedged merge queue. (The `panel-verdict` check and `deploy-preview.yml`
  likewise keep running on every branch, unchanged.)
- **`unity-build` must not be added to branch protection as a required check** while it carries
  a `paths:` filter — that would wedge every web-only PR by the same mechanism, in the other
  direction. If it must become required later, it needs a filter-free job that either builds or
  reports an explicit, deliberate skip.
- The Unity workflow is subject to `yarn workflows:check` (`scripts/check-workflows.mjs`), which
  runs in `ci.yml` and in lint-staged: root `actions/checkout` before any local composite action,
  no empty `${{ }}` inside string values, no secret handed to a PR-head checkout. Author it to
  pass that lint, do not exempt it.
- **CI proves compilation for the three targets. It never proves a window opened.** The manual
  per-OS smoke test (story AC1-AC8) remains the acceptance. No green CI run may be reported as
  "it runs on Windows/macOS/Linux".

### D5 — Unity Personal in CI: a nominative credential in a company repo

Activating a Personal licence in `unity-builder` requires repository secrets (an account
email/password plus a licence/serial payload; the exact variable names are read off game.ci at
kickoff — see Open Question 2). Three consequences are accepted explicitly rather than
discovered later:

1. **A Personal licence is nominative.** What ends up in this repo's Actions secrets is a named
   individual's Unity account credentials — not a company entitlement. Any workflow able to read
   that secret can act as that Unity account. Whose account it is (trambz's or Bertrand's) is a
   decision for Bertrand, and it should be a Unity account created for this purpose, not a
   personal one reused.
2. **Blast-radius rules for that secret, non-negotiable:** the licence-bearing job never runs on
   `pull_request_target`, never on fork PRs, and never after checking out PR-head content into
   the job that holds the secret. A Unity build _executes PR-authored C# and editor scripts_ with
   the licence in the environment — `check-workflows.mjs` catches the naive form of this, it does
   not catch that one.
3. **Rotation and offboarding are now a real risk.** If trambz changes his Unity password or
   leaves, CI dies. Owner: `producer`.

If activation for Personal in CI turns out to require a paid seat or a floating licence, that is
a cost decision that goes back to Bertrand — no lane invents a workaround.

### D6 — macOS Apple Silicon: what the CI matrix may claim today

The target is `StandaloneOSX` built for **Apple Silicon only** (CEO decision 3). Whether such a
player can be produced from a **Linux** runner by `unity-builder` **could not be verified** —
`unity.com`, `docs.unity3d.com` and `game.ci` are refused by this environment's egress proxy
(verified again today). This ADR therefore asserts nothing about it and classifies it as Open
Question 1.

Operative consequence: **V1's workflow ships the Windows and Linux targets on `ubuntu-latest`;
the macOS target is wired only after the lane has read game.ci's platform matrix.** If a
`macos-latest` runner turns out to be required, GitHub-hosted macOS minutes bill at a multiplier,
so enabling it is a cost call that goes to Bertrand **before** the job is added — not a silent
line in a matrix.

### D7 — No Git LFS for V1, and a hard gate before the first binary

Verified: this repo has no LFS today. V1's payload is a title string, a lit primitive and a Quit
button — nothing that needs it. LFS is therefore **not** enabled now (YAGNI, guidelines §2).

The gate that replaces it: **no binary asset larger than ~1 MB enters `unity/` until the LFS
question is decided.** The reason this is a rule and not a preference is the asymmetry of the
mistake — retrofitting LFS after binaries are committed does **not** shrink history. The blobs
stay in every clone forever unless the history is rewritten (`git lfs migrate import
--everything`), and rewriting history here means rewriting every SHA in a repo that has open PRs,
`claude/**` preview deploys keyed on branch names, and a published `gh-pages` branch. So: LFS is
decided **before** the first real art import, never after. Enabling it also consumes the
account's LFS storage/bandwidth quota — a second reason it is a decision, not a default.

### D8 — Ownership, and the review gap this creates

`trambz` writes everything under `unity/`. `dev-tooling-assets` owns the root-side changes in
D2/D3/D4 (`.prettierignore`, `eslint.config.ts`, `.editorconfig`, the workflow) because those are
muf files. That split is what makes the two lanes non-overlapping; the only shared files are the
four config files listed in D2, and they are touched **once**, in the bootstrap PR, by
`dev-tooling-assets` — serialised, not parallel.

**No C#/Unity lane exists in the crew** (verified: the 20 agent files in `.claude/agents/**`
contain zero occurrences of "unity" or "C#"). Consequences, named rather than hoped away:

- The design gate, the art gate and the three dev lanes do not apply to `unity/`.
- The **merge gate does** — it is the same repo, so any PR touching `unity/` still goes through
  the 4-reviewer panel and the CI checks. But the panel's reviewers have no Unity/C# expertise
  configured: their verdict on `unity/**` is a generic-code verdict, not a Unity review.
- Until a Unity-capable reviewer exists, trambz is effectively the sole technical reviewer of his
  own domain. **This is the largest quality gap this ADR creates**, it is accepted knowingly, and
  it is the first thing to fix if the track outlives the spike.

## Consequences

**Positive**

- One clone, one PR queue, one merge gate, one issue tracker. Bertrand sees both games in one
  place, which is exactly what he asked for.
- The isolation is enforced by **configuration**, not by anyone remembering it: four files
  (D2/D3) make the web toolchain structurally unable to see `unity/`.
- Several feared collisions turned out not to exist and are now documented as verified negatives
  (freshness gates, Vitest, tsconfig, Vite inputs) — nobody has to re-derive that.
- The `paths:` filter on the Unity workflow means the expensive job stays off web-only PRs from
  day one, instead of being retrofitted after the first surprising bill.

**Negative — the price of the monorepo, accepted**

- **Every muf contributor pays for a project they never build.** Unity trees grow fast, and with
  no LFS a committed binary is in every clone forever — including every CI job, every
  `.claude/worktrees/**` agent checkout, and the Copilot sandbox.
- **The ignore list becomes a permanent tax.** Every repo-wide tool added later — a new
  `check-*.mjs`, a docs gate, a codegraph index, a formatter — must be taught to skip `unity/`.
  Each omission surfaces as a red gate on somebody else's unrelated PR, and the person who
  debugs it will not be the person who added the Unity tree.
- **Shared blast radius.** A malformed Unity workflow breaks `yarn workflows:check` for everyone;
  an `.editorconfig` or `.prettierignore` edit is a muf-wide edit; a licence-secret leak is muf's
  incident. A sibling repo would have contained all three.
- **Abandoning the spike is no longer `Settings → Delete repository`.** It becomes a deletion PR,
  and the history permanently carries the Unity tree.
- **Two engines in one tree structurally invite the coupling D1 forbids**, and the temptation
  grows with every system muf ships. D1 is a rule with no automated enforcement today; it holds
  only as long as reviewers apply it.
- **`PROJECT_GUIDELINES.md` §3 now describes a tree that is not the whole tree.** This ADR does
  **not** amend §3 (the story explicitly keeps that a separate, deliberate act). Until a
  follow-up amends it, §3 is a non-negotiable document that the repository partly contradicts.
  Named here so the contradiction is a known debt, not a discovery.
- **The story's written recommendation (separate repo) was overruled.** Recorded so it is not
  re-litigated in a review comment — and so the costs above are attributed to the decision, not
  to whoever trips over them.
- **`AGENTS.md` and `CLAUDE.md` will need one line each** telling every agent that `unity/**` is
  not theirs. Without it, a well-meaning agent will "fix" a C# indentation, add `unity` to a
  tsconfig, or delete a `.meta` file it read as generated noise.

**Gotchas to watch for**

- A required status check that never runs blocks a PR permanently. That trap is why `ci.yml`
  keeps no `paths-ignore` (D4) — do not "optimise" it away without reading branch protection
  first (Open Question 4).
- `git lfs migrate` after the fact rewrites every SHA; the preview-deploy and `gh-pages` chains
  are keyed on branch names and history (D7).
- A Unity build job runs PR-authored code with a licence secret in the environment (D5).
- `.meta` files are source, not artefacts (D3).

## Open questions

1. **Can an Apple-Silicon-only macOS player be produced from a Linux runner by `unity-builder`,
   or is a `macos-latest` runner required?** Unverifiable here — game.ci and Unity docs are
   blocked by this environment's egress policy. Blocks the macOS leg of D6; if a macOS runner is
   needed, it is a billed cost decision for Bertrand.
2. **The exact game-ci secret names and the Personal-licence activation path in CI.** Same
   blockage. Read them at kickoff; do not guess variable names into a workflow.
3. **Unity Personal eligibility for the studio, and whether the splash screen is mandatory.**
   Bertrand decided Personal (decision 2) and that decision stands as recorded. But the
   eligibility thresholds (revenue/funding ceilings) and the splash-screen obligation **could not
   be verified** — `unity.com` and `docs.unity3d.com` are refused by this environment's egress
   proxy (connection refused, verified 2026-09-05). No threshold, amount or date is asserted
   anywhere in this ADR because none could be read. The decision is therefore recorded as **taken
   by the CEO subject to eligibility verification on unity.com**, and that verification is a
   **studio-level compliance consequence owned by Bertrand** — muf is a company, not a hobby
   project — not a technical detail a lane can close on his behalf.
4. **Which checks are actually required on `main`.** Could not be read (`gh` is not installed in
   this environment). Read the branch-protection contexts before changing any workflow trigger.
5. **Does `lint-staged` + `prettier --write` honour `.prettierignore` for an explicitly staged
   `unity/**`file?** Prove it by staging a Unity JSON and confirming it comes back untouched; if
it is rewritten, scope the`lint-staged` globs (D2).
6. **Unity LTS version string, project template / render pipeline, Hub module names, UI Toolkit
   vs uGUI.** Carried unchanged from the story's "Uncertainties / to verify at kickoff"; still
   unverifiable here, still not guessed.
7. **Should `.gitattributes` gain Unity YAML merge settings (`*.unity merge=unityyamlmerge`) and
   an explicit `text eol=lf` scope for `unity/**`?\*\* Not decided in V1 — one contributor, no
   merge conflicts in scene files yet. Revisit when a second person edits scenes.

## Alternatives Considered

**A1 — A separate repository (`bczy/muf-unity-bootstrap`).** The story's written recommendation,
and the option with none of the costs listed above. **Overruled by the CEO (decision 1).**
Recorded so the argument is not reopened in a review comment; the ADR's job from here is to make
the chosen option safe, not to keep scoring the other one.

**A2 — A git submodule under `unity/`.** Rejected: it re-introduces the second repository
Bertrand declined, while adding detached-HEAD and pointer-commit failure modes that every agent
checkout, the Copilot sandbox and CI would each have to learn. Worst of both shapes.

**A3 — Paste the canonical `Unity.gitignore` into the root `.gitignore`.** Rejected in D3, and
it is the trap most likely to be "helpfully" reintroduced: its `/[Ll]ibrary/`-style anchors do
not match `unity/Library/` from the root, and de-anchoring them makes `Logs/`, `Builds/`, `Obj/`
and `*.csproj` match anywhere in the repo.

**A4 — Give `ci.yml` a `paths-ignore: ["unity/**"]` so unity-only PRs skip the web pipeline.\*\*
The obvious symmetry, rejected in D4: a required check that is filtered out never reports, and
the PR is stuck forever. A few cached ubuntu minutes are the cheaper failure.

**A5 — A shared rules package consumed by both `src/game` and `unity/`.** Rejected in D1. It is
the decision that would make the monorepo look justified and would, within two stories, put a
TypeScript build step in a C# project's dependency chain and make one game's refactor a second
game's regression.

**A6 — Enable Git LFS pre-emptively now.** Rejected in D7: V1 stores no binaries, and the
guidelines forbid configuration for hypothetical cases. The safeguard is the pre-commit rule
(nothing over ~1 MB into `unity/` before the LFS call), because the _ordering_ is what is
expensive, not the feature.

---

**Next stage:** the config actions in D2/D3/D4 are `dev-tooling-assets`' bootstrap PR; everything
under `unity/` is trambz's. Neither starts before Open Questions 1-3 are answered off unity.com
and game.ci.
