# Story — Unity 3D project bootstrap — cross-platform welcome screen

**Epic:** none — exploratory track, sits outside the `muf` epic list · **Sequence:** n/a ·
**Type:** bootstrap/spike, **[HORS-STACK — décision CEO]**, cross-platform build
verification. No gameplay, no design gate, no art gate.

## Why

Bertrand (CEO, 2026-09-05, verbatim): *« Peux tu faire un ticket pour la création du
projet sous unity 3d. Je ne veux rien dans le jeu juste un welcome screen. [...] Je veux
juste initier le projet et vérifier qu'il fonctionne bien sous windows mac et linux »*

This is a toolchain spike, not a feature: before any Unity investment goes further, prove
that a brand-new Unity 3D project can be built and actually run on all three target OSes
from this team's setup. The welcome screen exists only to give the build something visible
to show — it is the smallest possible payload that lets a human confirm "yes, this window
opened and this is a 3D scene," nothing more.

## Cahier des charges check

> "Did Prohibition Atari ST have this?"

That test does not apply here — it is a *game feature* filter, and this ticket is a
*platform/tooling* initiative, not a `muf` feature. Classification:
**[HORS-STACK — décision CEO]**.

- `PROJECT_GUIDELINES.md` §3 locks the stack to TypeScript / React Three Fiber / Vite /
  GitHub Pages. There is no trace of Unity anywhere in this repo (confirmed by grep before
  writing this ticket). This story does not amend §3, does not compete with the `muf` web
  build, and does not touch `src/`.
- Before any Unity code is merged **anywhere** (this repo or elsewhere), it needs an
  explicit ADR or a §3 guidelines amendment recording that a second, parallel track exists
  and why. This ticket does not carry that ADR — it is the exploratory work the ADR would
  later ratify or reject.
- Until that ADR lands, this track has no bearing on `muf`'s scope, roadmap, or
  `PROJECT_GUIDELINES.md` §8 scope control. Treat it as fully quarantined.

## Scope (V1)

**Location — DECIDED (Bertrand, 2026-09-05): a `unity/` subfolder in THIS repo.**

This overrides the separate-repo recommendation this story originally carried. The
decision stands; what follows is the cost that comes with it, which the kickoff has to
pay rather than discover:

- Unity's canonical ignores use root-anchored patterns (`/[Ll]ibrary/`, `/[Tt]emp/`, …)
  that do **not** work as-is from the repo root for a subfolder — they must be re-scoped
  to `unity/` without masking anything elsewhere.
- `yarn format:check` runs `prettier --check .` over the **whole** repo and will meet
  Unity-generated `.json`/`.yml`/`.md` under `unity/`.
- Web CI must not be triggered by a `unity/`-only change, and the (costly) Unity build
  must not be triggered by a `src/`-only change — both directions need `paths:` filters,
  with care that a *required* check which never runs blocks a PR forever.
- No code is shared between `unity/` and `src/`: two games, one repo, zero coupling.

The exact file-by-file consequences are the ADR's job (mandated by decision 6), not this
story's.

**Unity project setup**

- Create a new, empty Unity **3D** project. Pin an **LTS release** (not a Tech Stream
  release) — the exact version string is confirmed at kickoff (see Uncertainties) and
  recorded in `ProjectSettings/ProjectVersion.txt`; that file's version must be identical
  across Hub and all three build machines/runners.
- Commit `Assets/`, `Packages/`, `ProjectSettings/`, and **every `.meta` file** (losing
  `.meta` files corrupts asset references — do not add a blanket ignore for them).
- `.gitignore` follows GitHub's canonical `Unity.gitignore`
  (`github/gitignore`, `Unity.gitignore`): ignore `/[Ll]ibrary/`, `/[Tt]emp/`, `/[Oo]bj/`,
  `/[Bb]uild/`, `/[Bb]uilds/`, `/[Ll]ogs/`, `/[Uu]ser[Ss]ettings/`, `*.csproj`, `*.sln`,
  `.vs/`, and generated player artifacts (`*.apk`, `*.app`, `*.unitypackage`, etc.).

**The welcome screen — deliberately minimal, a test harness not a design deliverable**

- Game title text, static, placeholder wording is fine.
- One visible **3D** element proving the 3D renderer actually rendered (e.g. a lit,
  rotating primitive) — not flat UI alone, since the point is "Unity **3D**," not "Unity
  UI."
- A `Quit` control that exits the application cleanly on all three platforms.
- Nothing else. No art direction, no fanzine styling, no `muf` visual identity, no audio,
  no narrative. A real title screen would need the design gate (`lead-game-designer`) and
  art gate (`lead-art`) that this ticket deliberately skips.

**Cross-platform build**

- Build targets: Windows (x64), **macOS Apple Silicon** (DECIDED — Apple Silicon only:
  no Intel build, no Universal binary; an Intel Mac is therefore not a supported smoke-test
  machine), Linux (x64).
- A written, repeatable **smoke-test procedure** (steps a human follows on each OS) is
  itself part of this ticket's deliverable, not an afterthought.

**Process artefact already delivered**

- `docs/unity-bootstrap/pull_request_template.md` — the Unity project's PR template,
  ready to copy verbatim to `.github/pull_request_template.md` wherever the project
  lands. It gates what this project can actually get wrong: a build that compiles but
  never launches, an untested OS silently ticked, a lost `.meta`, an unintended editor
  upgrade via `ProjectVersion.txt`, a committed `Library/`, a third-party asset with no
  licence. `muf`'s own template is untouched — different project, different risks.

## Acceptance criteria

| # | Given | When | Then |
| --- | --- | --- | --- |
| AC1 | The Unity project exists, LTS version pinned | A Windows build is produced | A `.exe` + supporting files are generated; **produces a runnable build**, not necessarily a distributable one (SmartScreen will warn on the unsigned `.exe` — expected, not a defect). |
| AC2 | The Windows build artifact | It is copied to a clean Windows machine and launched | The welcome screen appears (title text + the 3D element visibly rendering) within a few seconds; `Quit` closes the application with no error dialog or hang. |
| AC3 | The Unity project | A macOS build is produced on the build machine | A `.app` is generated and **launches on that same build machine**. This is distinct from AC4. |
| AC4 | The unsigned macOS `.app` | It is copied to a *different* Mac and opened | The smoke-test document records the exact Gatekeeper behaviour observed (message text and the workaround used, e.g. right-click → Open), and the app **does launch and show the welcome screen after that workaround**. Gatekeeper blocking the first double-click is a **known and accepted V1 limitation**, not a defect — it is what separates "runs on the build machine" (AC3) from "runs on someone else's Mac". A build that will not start even after the documented workaround FAILS this AC. Signing/notarization is out of scope for V1 (see below). |
| AC5 | The Unity project | A Linux build is produced | An executable + its `*_Data/` folder are generated; the archive step (tar, not zip) preserves the executable bit — verified by checking permissions after extracting on a second machine. |
| AC6 | The Linux build artifact, extracted with executable bit intact | It is launched on a clean Linux machine | The welcome screen appears (title text + the 3D element visibly rendering); `Quit` closes the process cleanly (no orphaned process, no crash log). |
| AC7 | Any of the three launched builds | The 3D element is observed | It is unambiguously a rendered 3D object (lighting/shading and, ideally, motion/rotation visible), not a flat sprite or 2D UI panel — proves the 3D pipeline, not just UI Toolkit/uGUI. |
| AC8 | The smoke-test procedure document | Someone who was not involved in building it follows it | They can independently reproduce "build launches, welcome screen shown, Quit works" on each OS without asking the author a question. |
| AC9 | CI — **in scope for V1** (decision #4) | A commit touching `unity/` is pushed | CI proves **the build compiles for all three targets** (`game-ci/unity-builder`, pinned to `v5`) — explicitly *not* proof the game was seen running; that proof stays the manual smoke test (AC1–AC8). Any automated launch/screenshot check is best-effort and must never be presented as a substitute for the manual pass. |
| AC10 | The `unity/` subfolder exists in this repo (decision #1) | The existing web CI runs on a PR that touches **only** `src/` | It behaves exactly as it does today — `Lint · Typecheck · Test` (including `prettier --check .`), `E2E`, the preview build and every `check-*` gate stay green, and no Unity job is triggered. Symmetrically, a PR touching **only** `unity/` triggers the Unity build and does not run the web CI. No required check is left in a state where it can never report on a PR. |
| AC11 | A build produced by CI or locally | The repo is inspected afterwards | No Unity build output, `Library/`, `Temp/`, `Obj/`, `Logs/` or `UserSettings/` is tracked by git — the `unity/`-scoped ignore rules actually hold from the repo root, verified with `git status` after a real editor session, not assumed from the pattern text. |

## File map (lane assignment hint for Winston)

This does not map to `muf`'s `src/game` / `src/render` / `hooks` / `scripts` lanes at all —
it is a brand-new project, most likely in a brand-new repo (see Scope). There is no
overlap with any existing `muf` file, so there is no cross-lane collision to arbitrate in
the usual sense. What still needs an owner:

| Concern | Owner | Note |
| --- | --- | --- |
| Unity project, scene, welcome screen, C# | **trambz** (decision #5) | No C#/Unity lane exists in `.claude/agents/**`; this work sits outside the crew's gates. |
| `unity/` integration into this repo — ignore scoping, `.prettierignore`, workflow `paths:` filters, LFS | `dev-tooling-assets` | The monorepo choice (#1) makes this real work, not a formality: it is what AC10 and AC11 verify. |
| Unity CI wiring (`game-ci/unity-builder` `v5`, Personal licence activation secrets) | `dev-tooling-assets` with trambz | Decision #4 puts it in V1. The licence secret is nominative — a governance question the ADR raises. |
| ADR for the track | `senior-architect` | Mandated by decision #6, written alongside this update. |

## Out of scope (V1)

- Any art direction, fanzine styling, `muf` visual identity, audio, or narrative content —
  this is a blank test harness, not a title screen.
- Code signing and notarization for macOS, code signing for Windows, and any distribution
  packaging beyond a raw build folder/archive — tracked as V2 follow-up.
- Publishing to any store (Steam, itch.io, Mac App Store, Microsoft Store).
- Any gameplay, menu logic beyond `Quit`, save data, settings, or input remapping.
- Automated proof that a built player visually launched and displayed correctly across
  all three OSes — CI can prove compilation; it cannot reliably prove a window appeared.
- Whether the Unity track eventually replaces or complements `muf`, and what its own
  roadmap looks like — decision #6 says the track continues and gets an ADR, not that its
  product direction is settled. That conversation is still ahead.
- Changes to `PROJECT_GUIDELINES.md` §3 — this ticket does not amend the stack lock; that
  would be a distinct, deliberate follow-up if the spike leads anywhere.

## Decisions taken (Bertrand, CEO — 2026-09-05)

All six questions this story opened are now closed. They are recorded here as given; the
architectural consequences of #1 and #4 are the ADR's subject (mandated by #6).

| # | Question | Decision |
| --- | --- | --- |
| 1 | Repo location | **`unity/` subfolder in this repo** — overrides this story's separate-repo recommendation. |
| 2 | Unity licence | **Personal** — see the eligibility caveat below. |
| 3 | macOS target architecture | **Apple Silicon only** — no Intel build, no Universal binary. |
| 4 | CI in V1 | **Yes** — in scope. AC9 is therefore no longer optional (see AC9). |
| 5 | Who writes the Unity project | **trambz.** No C#/Unity lane exists in `.claude/agents/**`; the crew does not cover this work. |
| 6 | Longevity of the spike | **Track continues** ⇒ an ADR is written now, not deferred. |

**Caveat carried forward on #2 — this is not a verified compliance, it is a CEO decision
awaiting a check.** Unity Personal's eligibility thresholds (revenue/funding caps) and
whether the Unity splash screen is still mandatory on Personal could **not** be verified:
`unity.com` and `docs.unity3d.com` are refused by this environment's egress policy. This
engages a company, not a hobby project. Someone must read the current terms off unity.com
and confirm eligibility **before** the project is created — if the studio turns out not to
qualify, the licence decision changes and so does the CI activation flow.

**Consequence of #3 on acceptance:** an Intel Mac is not a valid smoke-test machine. AC3
and AC4 must be run on Apple Silicon hardware.

**Consequence of #5:** `trambz` owns the Unity implementation. The `muf` crew's dev lanes
(`dev-gameplay`, `dev-r3f-render`, `dev-tooling-assets`) do not cover C#/Unity, so their
gates do not apply to `unity/` code; what does apply is the PR template shipped with this
story and the CI decided in #4.

## Uncertainties / to verify at kickoff

This session's sandbox has `unity.com`, `docs.unity3d.com`, and `game.ci` blocked by org
egress policy, so none of the following could be confirmed and none are guessed here —
read them off unity.com at kickoff:

- **Current Unity LTS version string** — pin whatever is the current LTS at kickoff time,
  not whatever this ticket might have implied; record it in `ProjectSettings/ProjectVersion.txt`.
- **Default render pipeline / template name** for a new 3D project (Built-in vs URP vs
  HDRP) — affects which template to pick in Unity Hub and whether the "3D element renders"
  AC needs any pipeline-specific setup.
- **Exact Unity Hub build-support module names** needed for Windows/macOS/Linux targets —
  confirm the installer module list before provisioning build machines/CI runners.
- **Unity Personal vs Pro licence thresholds**, and **whether the Unity splash screen is
  still mandatory on Personal** — directly feeds Open Question #2; do not assume either
  answer.
- **UI Toolkit vs uGUI** — whichever Unity currently recommends for new runtime UI should
  drive how the title text and `Quit` control are implemented; not decided here.
