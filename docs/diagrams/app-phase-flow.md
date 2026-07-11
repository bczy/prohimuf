# App Phase Flow

`App.tsx` orchestrates the front-end through `AppPhase`
(`"MENU" | "NARRATIVE_PRE" | "PLAYING" | "NARRATIVE_POST" | "END" | "TUTORIAL"`).
The optional scripted tutorial (ADR-0012) is a side branch off the menu that never
touches game state.

```mermaid
stateDiagram-v2
    [*] --> MENU

    MENU --> TUTORIAL : handlePlay(level.kind = "tutorial")\nNo game state created
    MENU --> NARRATIVE_PRE : handlePlay(level)\nPRE_LEVEL_NARRATIVE[id] exists
    MENU --> PLAYING : handlePlay(level)\nno pre-level scene

    TUTORIAL --> MENU : onDone() (finish OR "Passer")\nnothing written to muf_progress / scores

    NARRATIVE_PRE --> PLAYING : onDone()\nBGM starts

    state PLAYING {
        [*] --> ACTIVE
        ACTIVE : hudData.phase = PLAYING\nAudio tension ∝ timeRemaining
        ACTIVE --> GAME_OVER : lives = 0 or timer = 0\nBGM stops
        ACTIVE --> LEVEL_COMPLETE : score ≥ enemiesToWin\nunlock next level (by id)
    }

    PLAYING --> NARRATIVE_POST : after 1500ms\nLEVEL_COMPLETE and POST_LEVEL_NARRATIVE[id] exists
    PLAYING --> END : after 1500ms\nGAME_OVER, or no post-level scene

    NARRATIVE_POST --> END : onDone()

    state END {
        [*] --> END_SCREEN
        END_SCREEN : "INTERPELLÉ" (GAME_OVER)\nou "LA RAVE A EU LIEU" (LEVEL_COMPLETE)\nAffiche score + wave
    }

    END --> MENU : onRestart() → handleBackToMenu()
```
