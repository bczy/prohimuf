# Story: Audio licence attribution + provenance cleanup

**Type:** Legal/compliance debt on already-shipped assets — no new feature surface ·
**Status:** ready-for-arch (awaiting lane assignment from `senior-architect`)
**Date:** 2026-07-14 · **PM:** John · **Branch:** `claude/bmad-game-designer-agents-k6dlle`
**Approved by:** Bertrand ("ouais go") ·
**Relates to:** ADR-0018 audio gate rule · `.claude/agents/sound-designer.md` gate 1 ·
`docs/agent-handoffs.md` (review-panel false-IP-alarm entry)

## Why (product value)

We ship five BGM tracks that are **Kevin MacLeod / incompetech.com** cuts under
**CC-BY 4.0** (confirmed via ID3 tags: "Kevin MacLeod", "incompetech"). That licence is
valid for our use, but it is **conditional: attribution is mandatory**. A `grep` of
`README.md`, `src/`, `index.html`, `docs/` and `public/` finds **zero** attribution
anywhere. **We are currently shipping these tracks in breach of their licence.** The game
deploys publicly, so this is a live legal exposure, not a hypothetical one.

Two adjacent problems compound it and must be closed in the same pass:

1. **`scripts/download-audio.mjs` lies about provenance.** Its header claims "public domain
   / CC" tout court, and it carries dead, unused constants — `TRACKS` (Fats Waller 78rpm),
   `IA_TRACKS` (**LukHash tracks, which are copyrighted, NOT public domain**), plus a
   `fallback`/`FALLBACKS` path. Only the `CURATED` list (Kevin MacLeod) is actually run by
   `main()`. This dead code already **caused a code-review panel to raise a false IP alarm**
   (see `docs/agent-handoffs.md`). It is a provenance landmine: it makes an auditor believe
   we sourced copyrighted material we never used.
2. **`shoot.wav` has no traced origin** anywhere in the repo. Under the new audio gate
   (ADR-0018 / sound-designer gate 1) **no shipped audio asset may PASS without a verified
   licence/provenance record.** An untraceable file is an automatic FAIL until traced or
   replaced.

Product value: **de-risk the public deploy, honour the licence of assets we chose to keep,
and make provenance auditable by construction** so the next review panel reads a clean,
honest record instead of a landmine. This is pure debt paydown — it adds no verb, no input,
no UI, no rule to the game.

## Cahier des charges test — verdict: DOES NOT ARISE (compliance, not a feature)

Attribution is a **legal obligation attached to assets we already ship**, not a new game
feature. The "did Prohibition Atari ST have this?" question does not apply — there is no new
player-facing surface, mechanic, or content to weigh against fidelity. Nothing here touches
the core loop `Récupérer → Livrer → Éviter`, the victory condition, inputs, or any game
rule. Scope guard: **PASS by non-applicability.**

## Stage-2 DESIGN — EXPLICITLY SKIPPED

**This story does NOT enter the design loop (pipeline stage 2).** It changes **no gameplay
and no fiction**: no mechanic, no 3C, no tension mapping, no narrative/text content, no
audible behaviour (the tracks and their tier wiring are untouched — we attribute what
already plays, we do not re-source or re-tune it). Therefore `game-designer` and
`narrative-designer` are **not** engaged, and there is **no `lead-game-designer` design
gate** for this story. The audio work here is licence/provenance only, which is
`sound-designer`'s **gate**, not a design pass. Architect may route straight from PRODUCT
(stage 1) to lane assignment (stage 3). This skip is recorded so the hand-off log stays
honest.

## What — Acceptance Criteria

1. **AC1 — Attribution shipped WITH the game (deployed surface).** A credits/licence file
   is added under the served asset tree (e.g. `public/assets/audio/CREDITS.md` — final path
   is the architect/dev call, but it MUST be inside `public/` so Vite copies it into the
   build and it is reachable in the deployed game). It lists **all five** BGM tracks, each
   with the CC-BY 4.0 attribution norm string: `"Title" Kevin MacLeod (incompetech.com),
   Licensed under Creative Commons: By Attribution 4.0,
   https://creativecommons.org/licenses/by/4.0/`. The five titles must match the real files
   on disk (`bgm_loop`=Funky Chunk, `bgm_loop2`=Ouroboros, `bgm_tension`=Sneaky Snitch,
   `bgm_danger`=Darkest Child, `bgm_win`=Reformat — verify each title against its actual
   file/ID3 before writing it).
2. **AC2 — README attribution section.** `README.md` gains a short "Audio credits /
   licences" section covering the same five tracks (or pointing unambiguously to the shipped
   credits file as the source of truth). Repo-level transparency, minimal prose, **no new
   in-game UI**.
3. **AC3 — Single source of truth, no drift.** The attribution strings in README, the
   shipped credits file, and the `download-audio.mjs` per-track records are consistent — the
   same titles, author, source, licence and licence URL. No two surfaces disagree.
4. **AC4 — `download-audio.mjs` dead code removed.** The unused `TRACKS`, `IA_TRACKS`,
   `fallback` keys and `FALLBACKS` constant (and the now-orphaned fallback branch in
   `main()`, plus any `getIAFiles`/IA-only helper left unused by the removal) are deleted.
   After removal the script still runs and downloads exactly the five `CURATED` tracks; no
   unused imports/vars/functions remain (`rtk lint` clean).
5. **AC5 — Header corrected to the true licence.** The file header no longer claims "public
   domain / CC" or "Internet Archive". It states the actual truth: the tracks are **Kevin
   MacLeod (incompetech.com), CC-BY 4.0, attribution required**. No misleading provenance
   language survives anywhere in the file.
6. **AC6 — Per-track provenance record on `CURATED` (ADR-0018 audio-gate rule).** Each
   `CURATED` entry carries a machine-readable licence/provenance record: author
   (`Kevin MacLeod`), source URL, licence (`CC-BY 4.0`) and licence URL — so the sourcing
   script is itself the auditable provenance record the audio gate requires.
7. **AC7 — `shoot.wav` provenance resolved.** Its origin is investigated (ID3/metadata,
   `ffprobe` if available, git history of when/how it landed) and **either** a verified
   licence/provenance record is written into the shipped credits file (AC1 surface),
   **or**, if the origin is genuinely unknowable, the file is **explicitly flagged for
   replacement** with a recorded FAIL rationale — it is NOT silently left unattributed. No
   third outcome.
8. **AC8 — `sound-designer` (Malik) licence-gate verdict.** Malik records a PASS/FAIL per
   the gate-1 "licence first" rule in `docs/agent-handoffs.md`: PASS requires **every**
   shipped audio file (5 BGM + `shoot.wav`) to carry a verified licence/provenance record.
   Any asset without one (i.e. an unresolved AC7) blocks PASS.
9. **AC9 — `qa-lead` quality gate.** `rtk tsc` + `rtk vitest` + `rtk lint` are green (the
   script edit introduces no type/lint regression and breaks no test), the corrected
   `download-audio.mjs` executes to a clean run of the five tracks, and the attribution
   strings render correctly in the shipped credits file and README. Verified, not asserted.
10. **AC10 — Hand-off logged.** The stage-2 skip (this document), the lane hand-off, and the
    two gate verdicts (AC8, AC9) are recorded in `docs/agent-handoffs.md` per the
    COLLABORATION.md template, so the review panel reads a clean provenance trail.

## Out of scope (explicit)

- **Replacing any track** (sonic-identity / re-sourcing work) — that is a future
  `sound-designer` (Malik) story. This story attributes what already ships; it does not
  change what plays. (AC7 may *flag* `shoot.wav` for replacement, but performing any
  replacement is out.)
- **Any in-game credits screen / UI.** A player-facing credits screen is a
  conscious-extension candidate — **deferred**, not built here. The compliant surface is a
  shipped text/credits file + README, no new render or UI code.
- **Touching `src/game/**` audio code** (`audioSystem.ts`), the `useAudio` hook, or the
  tension→tier mapping. No audible behaviour change.
- **Re-tuning, re-mixing, loudness/loop-point work** — out (behaviour gate, not this story).

## Observations for the log (do NOT fix here)

- `docs/audio-system.md` references `hit.mp3`, `death.mp3`, `win.mp3` as shipped SFX, but
  **only `shoot.wav` and the five BGM files exist on disk** (`public/assets/audio/`). That
  doc/asset discrepancy is a separate concern (missing-asset or stale-doc, not a licence
  issue) — flagging it, not resolving it in this story.

---

*Architect (`senior-architect`) owns: lane partition (likely `dev-tooling-assets` for the
`download-audio.mjs` cleanup + provenance records, and the credits/README docs surface — no
cross-boundary code, no `src/**` touch, so this should be a single-to-two-lane, low-risk
change), and whether the shipped-credits-file convention warrants a one-line note in an ADR.
Gates: `sound-designer` (AC8, licence) then `qa-lead` (AC9, quality). No dev writes
`src/**`.*
