# Agent Workflows — The Production Pipeline

Visual companion to [`.claude/agents/COLLABORATION.md`](../../.claude/agents/COLLABORATION.md)
(the normative protocol). One pipeline: every feature passes hand to hand through stages
0-9 — product → design → tech plan → build (dev ∥ art ∥ audio) → verify → integrate →
review → accept → merge — driven by the `producer`. Every gate verdict and hand-off is
logged in [`agent-handoffs.md`](../agent-handoffs.md).

```mermaid
flowchart TB
    B(("Bertrand<br/>(product owner)"))
    PROD["producer · Marion 📆<br/>pipeline state, hand-off chasing,<br/>caps &amp; escalations, sprint status"]

    B -->|"0. INTAKE — intent, bug, idea"| PM

    subgraph P1["1. PRODUCT"]
        PM["pm · John 📋<br/>scoped story, scope guard,<br/>acceptance criteria"]
    end

    subgraph P2["2. DESIGN — only when gameplay or fiction is touched"]
        direction TB
        GD["game-designer · Sacha 🎮<br/>mechanics, tuning values, 3C specs"]
        ND["narrative-designer · Yasmine ✒️<br/>universe, cast, scripts"]
        DGATE{"lead-game-designer · Karim 🧭<br/>DESIGN GATE<br/>scope · core loop · verifiability · coherence"}
        GD --> DGATE
        ND --> DGATE
        DGATE -->|"FAIL · max 2 rework rounds"| GD
        DGATE -->|"FAIL"| ND
    end

    PM -->|"story touches gameplay/fiction"| GD
    PM -->|"story touches gameplay/fiction"| ND
    PM -->|"pure tech / tooling story"| ARCH
    DGATE -->|PASS| ARCH

    subgraph P3["3. TECH PLAN"]
        ARCH["senior-architect · Winston 🏗️<br/>boundaries, ADR if needed,<br/>lane partition (dev + art)"]
    end

    subgraph P4["4. BUILD — parallel, non-overlapping lanes"]
        direction TB
        subgraph DEVL["dev lanes"]
            R3F["dev-r3f-render · Amelia 🎨<br/>src/render + hooks (view side)"]
            GAME["dev-gameplay · Amelia 🧠<br/>src/game + hooks (logic side), TDD"]
            TOOL["dev-tooling-assets · Amelia 🛠️<br/>scripts/, levelArt.json (structure), CI"]
        end
        subgraph ARTL["art lane — when the feature needs new/changed visuals"]
            direction TB
            ADV["art-advisor · Estelle 📼<br/>references, cultural grounding<br/>(advice only)"]
            CONCEPT["concept-artist · Maud ✍️<br/>FLUX prompts (levelArt.json)"]
            PREPROD["game-graphist · Serge 🕹️<br/>PRE-PROD PASS<br/>game-size readability, keying"]
            GATE1{"lead-art · Nico 🎯<br/>PROMPT GATE<br/>+ check-art-prompts.mjs (CI)"}
            GEN["CI generation<br/>marker push → render farm<br/>check-sprite-style.mjs + retries"]
            TECH["game-graphist · Serge 🕹️<br/>TECHNICAL PASS<br/>real-size inspection, cleanup"]
            GATE2{"lead-art · Nico 🎯<br/>ASSET GATE<br/>PASS/FAIL vs art-direction.md"}
            ADV --> CONCEPT
            CONCEPT --> PREPROD
            PREPROD -->|annotations integrated| GATE1
            GATE1 -->|PASS| GEN
            GATE1 -->|FAIL| CONCEPT
            GEN --> TECH
            TECH --> GATE2
            GATE2 -->|"FAIL · 1 variable/roll<br/>max 2 batches/cycle"| CONCEPT
        end
        subgraph AUDL["audio lane — when the feature needs sound"]
            direction TB
            SD["sound-designer · Malik 🎧<br/>audio specs: BGM tiers, SFX<br/>(ce qui sonne informe)"]
            SRC["sourcing / generation<br/>scripts/download-audio.mjs<br/>(dev-tooling-assets mechanics)"]
            AGATE{"sound-designer · Malik 🎧<br/>AUDIO GATE<br/>PASS/FAIL vs audio-direction.md"}
            SD --> SRC
            SRC --> AGATE
            AGATE -->|"FAIL · max 2 batches/cycle"| SD
        end
    end

    ARCH --> R3F
    ARCH --> GAME
    ARCH --> TOOL
    ARCH -.->|"assets needed"| ADV
    ARCH -.->|"sound needed"| SD

    subgraph P5["5. VERIFY — the test stage"]
        direction TB
        CHECKS["rtk tsc · rtk vitest (100%) · rtk lint<br/>+ e2e / verify runs (player-visible changes)"]
        GATE4{"lead-art · Nico 🎯<br/>COMPOSITE GATE (Gate 4)<br/>runtime visuals on REAL screenshots"}
        PLAY["game-designer · Sacha 🎮<br/>PLAYTEST vs the gated spec"]
        DACC{"lead-game-designer · Karim 🧭<br/>DESIGN ACCEPTANCE"}
        CHECKS --> GATE4
        CHECKS --> PLAY
        PLAY --> DACC
    end

    R3F --> CHECKS
    GAME --> CHECKS
    TOOL --> CHECKS
    GATE2 -->|PASS| CHECKS
    AGATE -->|PASS| CHECKS

    subgraph P67["6. INTEGRATE · 7. REVIEW"]
        direction TB
        REVIEW["senior-architect · Winston 🏗️<br/>integration review + sign-off"]
        PANEL["CODE-REVIEW PANEL (merge gate)<br/>4 parallel skills: code-review (high) ·<br/>bmad-code-review · edge-case-hunter ·<br/>security-review — findings adversarially<br/>verified, architect triage"]
        REVIEW --> PANEL
    end

    GATE4 -->|PASS| REVIEW
    DACC -->|PASS| REVIEW
    DACC -->|"FAIL → back to dev lane,<br/>or spec amended &amp; re-gated"| ARCH

    subgraph P8["8. ACCEPT"]
        ACCEPT["pm · John 📋<br/>acceptance vs story<br/>+ PROJECT_GUIDELINES"]
    end

    PANEL -->|"zero CONFIRMED blocking/major"| ACCEPT
    ACCEPT -->|"9. MERGE to main"| B

    LOG[("docs/agent-handoffs.md<br/>every hand-off + gate verdict")]
    PROD -.->|"tracks stages, chases missing entries,<br/>enforces caps, serialises shared seams"| LOG
    PROD -.->|"escalation packets<br/>(caps hit, blockers)"| B
    DGATE -.-> LOG
    GATE1 -.-> LOG
    GATE2 -.-> LOG
    GATE4 -.-> LOG
    AGATE -.-> LOG
    DACC -.-> LOG
    REVIEW -.-> LOG

    classDef gate fill:#ffe9a8,stroke:#b8860b,color:#000
    classDef dev fill:#d4e9ff,stroke:#2b6cb0,color:#000
    classDef art fill:#ffd9ec,stroke:#b83280,color:#000
    classDef design fill:#d9f2d9,stroke:#2f855a,color:#000
    classDef audio fill:#ffe4cc,stroke:#c05621,color:#000
    classDef ci fill:#e2e2e2,stroke:#666,color:#000
    classDef prod fill:#e9d8fd,stroke:#6b46c1,color:#000
    class DGATE,GATE1,GATE2,GATE4,AGATE,DACC gate
    class R3F,GAME,TOOL dev
    class ADV,CONCEPT,PREPROD,TECH art
    class GD,ND,PLAY design
    class SD audio
    class GEN,SRC,LOG,CHECKS,PANEL ci
    class PROD prod
```

## How to read it

- **The pipeline is one line, hand to hand.** A feature never skips a stage silently:
  a stage that does not apply (e.g. no DESIGN on a pure tooling story, no art lane when
  no visual changes) is skipped explicitly and the skip is logged.
- **Design loop (green)**: when a story touches how the game plays or its fiction,
  `game-designer` (mechanics/tuning/3C) and `narrative-designer` (universe/cast/scripts)
  work in parallel on non-overlapping deliverables; `lead-game-designer` holds the
  blocking **design gate** (max 2 rework rounds, then escalation to Bertrand). No dev
  implements an ungated design.
- **Build (blue + pink + orange)**: `senior-architect` partitions parallel lanes on
  non-overlapping paths. The dev lanes' only routinely shared seam is `src/hooks/**`
  (serialised, never co-edited). The art lane keeps its two production passes
  (`game-graphist`) bracketing CI generation and its two blocking gates (`lead-art`).
  The audio lane mirrors it: `sound-designer` (Malik) specs every cue ("ce qui sonne
  informe" — every audio cue is information), sourcing runs through the tooling
  scripts, and his **audio gate** verdicts assets and audible behaviour changes vs
  `docs/audio-direction.md`; what needs human ears is escalated to Bertrand as a
  shortlist, never passed blind.
- **Verify (stage 5) is the test stage**: mechanical checks (`rtk tsc`/`vitest`/`lint`,
  100% green) plus e2e/`verify` runs, the **composite gate** on real in-game screenshots
  for runtime-composed visuals, and the **design acceptance** leg — `game-designer`
  playtests the build against the gated spec and `lead-game-designer` verdicts; drift
  goes back to the dev lane or the spec is re-gated, never absorbed silently.
- **Review (stages 6-7)**: architect integration sign-off, then the mandatory
  **code-review panel** (4 parallel skills, findings adversarially verified) before any
  merge to `main`.
- **Producer (purple)**: `producer` (Marion) drives the pipeline itself — she tracks
  which stage every feature is in, chases missing hand-offs in the log, enforces the
  bounded-iteration caps, serialises contended seams, and assembles escalation packets
  for Bertrand. She holds no gate and authors no content.
- Dotted arrows are logging and escalations: every hand-off and gate verdict lands in
  [`agent-handoffs.md`](../agent-handoffs.md).
