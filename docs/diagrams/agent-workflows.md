# Agent Workflows — Subagent Crew Orchestration

Visual companion to [`.claude/agents/COLLABORATION.md`](../../.claude/agents/COLLABORATION.md)
(the normative protocol). Two flows: the **dev flow** for any feature/refactor/bug, and the
**art flow** for any generated asset. Every gate verdict and hand-off is logged in
[`agent-handoffs.md`](../agent-handoffs.md).

```mermaid
flowchart TB
    B(("Bertrand<br/>(product owner)"))

    subgraph DEV["Dev flow — feature / refactor / bug"]
        direction TB
        PM["pm · John 📋<br/>PRD, scoped story,<br/>scope guard"]
        ARCH["senior-architect · Winston 🏗️<br/>lane partitioning,<br/>game/render/hooks boundaries"]
        R3F["dev-r3f-render · Amelia 🎨<br/>src/render + hooks (view side)"]
        GAME["dev-gameplay · Amelia 🧠<br/>src/game + hooks (logic side), TDD"]
        TOOL["dev-tooling-assets · Amelia 🛠️<br/>scripts/, levelArt.json (structure), CI"]
        REVIEW["senior-architect<br/>review + integration sign-off"]
        ACCEPT["pm<br/>acceptance vs story<br/>+ PROJECT_GUIDELINES"]

        PM --> ARCH
        ARCH -->|"parallel lanes<br/>(non-overlapping paths)"| R3F & GAME & TOOL
        R3F --> REVIEW
        GAME --> REVIEW
        TOOL --> REVIEW
        REVIEW --> ACCEPT
    end

    subgraph ART["Art flow — any generated asset (vehicles, enemies, level art)"]
        direction TB
        ADV["art-advisor · Estelle 📼<br/>references, cultural grounding<br/>(advice only, read-only)"]
        CONCEPT["concept-artist · Maud ✍️<br/>authors FLUX prompts<br/>(levelArt.json)"]
        PREPROD["game-graphist · Serge 🕹️<br/>PRE-PROD PASS<br/>game-size readability, keying"]
        GATE1{"lead-art · Nico 🎯<br/>PROMPT GATE<br/>+ check-art-prompts.mjs (CI)"}
        GEN["CI generation<br/>marker push → render farm<br/>check-sprite-style.mjs + retries"]
        TECH["game-graphist · Serge 🕹️<br/>TECHNICAL PASS<br/>real-size inspection,<br/>fringe/halo cleanup (scripts)"]
        GATE2{"lead-art · Nico 🎯<br/>ASSET GATE<br/>PASS/FAIL vs art-direction.md"}

        ADV --> CONCEPT
        CONCEPT --> PREPROD
        PREPROD -->|annotations integrated| GATE1
        GATE1 -->|PASS| GEN
        GATE1 -->|FAIL| CONCEPT
        GEN --> TECH
        TECH --> GATE2
        GATE2 -->|"FAIL · iterate 1 variable/roll<br/>max 2 batches/cycle"| CONCEPT
    end

    B -->|"intent (what/why)"| PM
    ACCEPT --> B
    GATE2 -->|PASS| ACCEPT
    GATE2 -.->|escalate after 2 batches| B
    GATE1 -.->|"decision beyond the bible"| B

    LOG[("docs/agent-handoffs.md<br/>hand-off log<br/>+ gate verdicts")]
    REVIEW -.-> LOG
    GATE1 -.-> LOG
    GATE2 -.-> LOG

    classDef gate fill:#ffe9a8,stroke:#b8860b,color:#000
    classDef dev fill:#d4e9ff,stroke:#2b6cb0,color:#000
    classDef art fill:#ffd9ec,stroke:#b83280,color:#000
    classDef ci fill:#e2e2e2,stroke:#666,color:#000
    class GATE1,GATE2 gate
    class R3F,GAME,TOOL dev
    class ADV,CONCEPT,PREPROD,TECH art
    class GEN,LOG ci
```

## How to read it

- **Dev flow** (blue): Bertrand states an intent → `pm` turns it into a scoped story →
  `senior-architect` decides the "how" and partitions three parallel lanes on
  non-overlapping paths (`dev-r3f-render`, `dev-gameplay`, `dev-tooling-assets`) →
  architect review → product acceptance. The only routinely shared seam between dev
  lanes is `src/hooks/**`, which must be serialised (announce, don't co-edit).
- **Art flow** (pink): the pipeline for every generated asset, with two production
  passes by `game-graphist` (Serge) bracketing CI generation, and two blocking gates
  held by `lead-art` (Nico, yellow): the **prompt gate** before any prompt commit to
  `levelArt.json`, and the **asset gate** after generation. On FAIL, `concept-artist`
  iterates (one variable per roll, max two batches per cycle before escalating options
  to Bertrand).
- Dotted arrows are escalations to Bertrand and logging: every gate verdict and
  hand-off is recorded in [`agent-handoffs.md`](../agent-handoffs.md).
