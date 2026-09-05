# Hand-offs — story-unity-bootstrap-welcome-screen (Unity 3D bootstrap, HORS-STACK)

Exploratory track opened by Bertrand (CEO) on 2026-09-05: a greenfield Unity 3D
project carrying nothing but a welcome screen, to prove the toolchain builds and
runs on Windows, macOS and Linux. **Ticket only** — no implementation in this
cycle, and no Unity code anywhere in this repo.

## stage-0. RECON — tech-scout (Nadia) — 2026-09-05

- claim: sourced feasibility recon on Unity for a cross-platform desktop bootstrap
  (LTS version, render pipeline/template, Hub build-support modules, licence
  Personal/Pro, CI via game-ci, repo hygiene, UI Toolkit vs uGUI, automated launch
  verification).
- release: **PARTIAL — recon blocked.** `unity.com`, `docs.unity3d.com` and
  `game.ci` are refused by this environment's egress proxy (organization policy),
  so none of the Unity-side facts could be sourced. Only GitHub-reachable facts
  were confirmed: the canonical `Unity.gitignore` (`github/gitignore`) and
  `game-ci/unity-builder`'s current stable major tag `v5` (= `v5.0.1`;
  `v6.0.0-beta.1` exists but is beta), both verified 2026-09-05. Everything else
  was deliberately NOT guessed and is carried into the ticket's
  "Uncertainties / to verify at kickoff" section.

## stage-1. PM — pm (John) — 2026-09-05

- claim: turn the CEO's intent into a scoped, testable ticket.
- release: `_bmad-output/planning-artifacts/story-unity-bootstrap-welcome-screen.md`
  — 9 acceptance criteria built around "a build is produced AND launches AND Quit
  exits cleanly" on the three OSes, a written manual smoke-test procedure as the V1
  acceptance, per-OS gotchas (Linux exec bit through the archive, macOS Gatekeeper
  on a second machine, Windows SmartScreen), signing/notarization pushed to V2,
  and 6 open questions for Bertrand. Classified **[HORS-STACK — décision CEO]**:
  outside `PROJECT_GUIDELINES.md` §3, quarantined from `muf`'s scope until an ADR
  ratifies or rejects the track. File List: the story file above + this shard +
  the index row in `docs/agent-handoffs.md`.

## stage-1b. PROCESS — pm — 2026-09-05

- claim: Bertrand rejects `muf`'s PR template for the Unity track ("non pas ce template
  de PR, refais une template pour ce jeu en question") and asks for one built for the
  Unity project. Scope confirmed with him: the Unity project only — `muf`'s
  `.github/pull_request_template.md` stays untouched.
- release: `docs/unity-bootstrap/pull_request_template.md` (copy-ready, no header to
  strip) + `docs/unity-bootstrap/README.md` saying where it goes and why it does not
  apply to this repo's PRs. Gates chosen for THIS project's failure modes, not `muf`'s:
  per-OS smoke test with its own trap noted inline (Windows SmartScreen, macOS Gatekeeper
  on a second machine, Linux exec bit through the archive), an explicit
  `ProjectVersion.txt` guard against a silent editor upgrade, Unity repo hygiene
  (`.meta` pairing, no `Library/`, LFS, text serialization), EditMode/PlayMode tests,
  third-party asset licensing, and a "what I did NOT verify" section. No CI-gate
  checkboxes are carried over from `muf` — the Unity project has no CI yet, and open
  question #4 is whether it gets any in V1.

## Next

Stage 1 is where this stops on purpose — the ticket is the deliverable. Nothing
proceeds to `senior-architect` (lane cut) until Bertrand answers the open
questions, above all **repo location** (separate repo recommended) and **Unity
licence eligibility for the studio**. No design gate and no art gate are involved:
the welcome screen is a build test harness, not a title screen.
