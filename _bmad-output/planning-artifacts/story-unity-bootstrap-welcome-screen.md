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

**Repo location — decision needed from Bertrand before kickoff, not a fait accompli:**

| Option | Pros | Cons |
| --- | --- | --- |
| **Separate repo** (e.g. `bczy/muf-unity-bootstrap`) — **recommended** | No collision with `muf`'s CI workflows, root `.gitignore`, `check-*` gates, or the `src/game`/`src/render` boundary law. Clean history; easy to archive/delete if the spike is abandoned. | A second repo to create, grant access to, and (later) decide whether to keep. |
| `unity/` subfolder in this monorepo | One place to look. | Unity's own `.gitignore` needs (`Library/`, `Temp/`, `Obj/`, `Build/`, `Builds/`, `Logs/`, `UserSettings/`, `*.csproj`, `*.sln`, `.vs/`) must coexist with the Vite/Yarn root config without leaking into `muf`'s CI matrix or gates; `check-*` scripts would need explicit exclusions. |

This ticket is tracked here regardless of the answer; implementation happens wherever
Bertrand decides (see Open Questions).

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

- Build targets: Windows (x64), macOS, Linux (x64). Whether macOS needs Apple Silicon,
  Intel, or a Universal binary is an open question (see below).
- A written, repeatable **smoke-test procedure** (steps a human follows on each OS) is
  itself part of this ticket's deliverable, not an afterthought.

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
| AC9 | CI, if set up for this project (optional for V1) | A commit is pushed | CI proves **the build compiles for all three targets** (using `game-ci/unity-builder`, pinned to `v5`) — this is explicitly *not* proof the game was seen running; that proof is the manual smoke test (AC1–AC8). Any automated launch/screenshot check is best-effort/optional and must not be presented as a substitute for the manual pass. |

## File map (lane assignment hint for Winston)

This does not map to `muf`'s `src/game` / `src/render` / `hooks` / `scripts` lanes at all —
it is a brand-new project, most likely in a brand-new repo (see Scope). There is no
overlap with any existing `muf` file, so there is no cross-lane collision to arbitrate in
the usual sense. What still needs an owner:

| Concern | Likely owner | Note |
| --- | --- | --- |
| Repo creation / CI wiring (if any) | `dev-tooling-assets` or whoever Bertrand assigns | Closest existing skillset (CI, packaging, cross-platform scripting) even though the repo is Unity/C#, not this repo's Vite/Yarn stack. |
| ADR recording the HORS-STACK decision once this spike concludes | `senior-architect` | Required before any Unity code is treated as more than a spike (see Cahier des charges check). |
| Unity scene/scripting itself | Out of the current crew's normal lanes (no C#/Unity dev lane exists yet) | Flag explicitly to Bertrand at kickoff — this may need a contractor/new hire or Bertrand's own hands-on time. |

## Out of scope (V1)

- Any art direction, fanzine styling, `muf` visual identity, audio, or narrative content —
  this is a blank test harness, not a title screen.
- Code signing and notarization for macOS, code signing for Windows, and any distribution
  packaging beyond a raw build folder/archive — tracked as V2 follow-up.
- Publishing to any store (Steam, itch.io, Mac App Store, Microsoft Store).
- Any gameplay, menu logic beyond `Quit`, save data, settings, or input remapping.
- Automated proof that a built player visually launched and displayed correctly across
  all three OSes — CI can prove compilation; it cannot reliably prove a window appeared.
- Any decision about whether this Unity track continues past the spike, replaces or
  complements `muf`, or gets its own roadmap — that is a separate, later conversation once
  the bootstrap works.
- Changes to `PROJECT_GUIDELINES.md` §3 — this ticket does not amend the stack lock; that
  would be a distinct, deliberate follow-up if the spike leads anywhere.

## Open questions

1. **Repo location** — separate repo (recommended, e.g. `bczy/muf-unity-bootstrap`) or a
   `unity/` subfolder in this monorepo? Affects CI wiring and gitignore layout.
2. **Licence eligibility** — is Bertrand's studio eligible for **Unity Personal**, or does
   using Unity as a company push this into **Unity Pro** territory? This must be checked
   against Unity's current published thresholds before any project is created commercially
   — it affects a company, not a hobby project, and could carry a cost or a mandatory
   splash screen. Explicit go/no-go input needed from Bertrand.
3. **macOS target architecture** — Apple Silicon, Intel, or a Universal build? Depends on
   which Mac(s) are available for the build machine and the smoke test.
4. **Is CI in scope for V1 at all**, or is a manual local build on each OS sufficient to
   close this ticket? (AC9 is written as optional/best-effort to leave this open.)
5. **Who actually writes the Unity project** — is this Bertrand himself, a contractor, or
   does it wait for a Unity-capable hire? No dev lane in the current crew covers C#/Unity.
6. **Longevity of the spike** — once the three builds are proven, does this become a
   tracked parallel project (needs the ADR from the Cahier des charges check), or is it
   archived as "toolchain confirmed, shelved for now"?

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
