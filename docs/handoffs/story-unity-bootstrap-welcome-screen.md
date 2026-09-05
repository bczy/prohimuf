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

## stage-1c. DÉCISIONS CEO — Bertrand — 2026-09-05

Les 6 questions ouvertes sont tranchées. Verbatim :

1. Emplacement du dépôt : **sous-dossier `unity/` dans ce dépôt** — inverse de la
   recommandation écrite dans la story (dépôt séparé). La décision du CEO s'applique ; la
   story ne re-litige pas, elle chiffre le coût.
2. Licence Unity : **Personal** — sous réserve de vérification d'éligibilité, non
   vérifiable ici (unity.com bloqué par l'egress). Ça engage une société.
3. Architecture macOS : **Apple Silicon uniquement** — un Mac Intel n'est plus une machine
   de smoke test valide (impacte AC3/AC4).
4. CI : **dans le V1** — AC9 cesse d'être optionnel.
5. Dev : **trambz** (compte GitHub `trambz` vérifié). Aucun lane C#/Unity dans le crew.
6. Suite : **piste suivie ⇒ ADR** écrit maintenant.

- release (pm) : story mise à jour — section « Decisions taken » remplaçant « Open
  questions », scope `unity/` avec son coût nommé (ignores ancrés à re-scoper,
  `prettier --check .` qui balaie tout le dépôt, filtres `paths:` dans les deux sens,
  zéro partage de code entre `unity/` et `src/`), AC9 rendu obligatoire, **AC10** (la CI
  web reste intacte sur une PR `src/`-only, la CI Unity ne se déclenche pas pour rien, et
  aucun check requis ne reste bloqué à « jamais rapporté ») et **AC11** (aucun artefact
  Unity tracké par git, vérifié au `git status` après une vraie session d'éditeur, pas
  supposé depuis le texte du pattern) ajoutés, file map ré-attribuée.
- ADR : délégué à `senior-architect` (numéro alloué via la skill `adr-new`).

## Next

Le ticket n'est plus bloqué : les 6 décisions sont prises et l'ADR est en cours. Ce qui
reste avant qu'une ligne de C# existe :

1. **Vérifier l'éligibilité Unity Personal** sur unity.com (seuils + splash screen). C'est
   le seul point qui engage juridiquement le studio et il n'a pas pu être vérifié d'ici.
   Si le studio ne qualifie pas, la décision 2 change et la CI d'activation avec.
2. **Lire les inconnues Unity restantes** au kickoff (version LTS, template/render
   pipeline, noms des modules Hub, UI Toolkit vs uGUI) — section « Uncertainties » de la
   story, volontairement non devinées.
3. **`dev-tooling-assets`** : intégration `unity/` dans ce dépôt (ignores re-scopés,
   `.prettierignore`, filtres `paths:` des workflows, LFS) — c'est ce que vérifient AC10
   et AC11.
4. **trambz** : le projet Unity lui-même.

Aucun design gate ni art gate : le welcome screen est un banc d'essai de build, pas un
écran-titre.
