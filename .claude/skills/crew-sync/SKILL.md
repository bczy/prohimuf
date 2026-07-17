---
name: crew-sync
description: >
  Regenerate the crew bitmap and re-pin the agent-infographic freshness gate after any
  change to the crew's definition. Use this whenever you edit `.claude/agents/**` (a fiche,
  its `tools:`/`model:`, the roster) or `docs/muf-crew-bitmap.py`, or when CI reports
  `check-agents-infographic` STALE or SPRITE DRIFT, or someone asks to "sync the crew
  bitmap", "regenerate the crew poster/sprites", "re-pin the infographic", or "fix the
  freshness gate". It runs the exact regenerate → re-pin → verify sequence in the right
  order (the gate refuses to re-pin over stale sprites, so order matters) and ends FRESH.
  Owner lane: dev-tooling-assets. Does NOT decide roster/model content — it syncs the
  artefacts after that content is set.
---

# crew-sync — regenerate the crew bitmap & re-pin the freshness gate

The freshness gate (`scripts/check-agents-infographic.mjs`, run in CI) pins a sha256 of
every `.claude/agents/*.md`, `docs/diagrams/agent-workflows.md`, and the generator
`docs/muf-crew-bitmap.py`, and pixel-compares every committed `docs/diagrams/crew/*.png`
against a fresh generator run. Touch any watched source and CI goes STALE until the
manifest is **consciously re-pinned in the same PR**. This skill packages that re-pin so it
happens correctly every time — I did this sequence by hand five times in one session.

It syncs artefacts; it does **not** author content. Editing a fiche, the `MODELS` dict, or
adding/removing an agent is the caller's job first — then run this.

## When each artefact actually changes (so you know what to expect)

- **Label-only change** (a `model:` tier, a role/persona string on the poster): only the
  **poster** `docs/muf-crew.png` changes. The transparent singles are label-free, so
  `docs/diagrams/crew/*.png` stay byte-identical.
- **Roster change** (add/remove an agent, change overlays): the **singles change too** —
  new/removed sprite files under `docs/diagrams/crew/` must be committed.
- **Any watched-source edit** (any agent `.md`, `agent-workflows.md`, the generator):
  the **manifest** must be re-pinned regardless of whether a PNG changed.

## The sequence (order matters)

Run from the repo root:

```
# 1. Regenerate the poster (always safe; reflects current MODELS + labels)
python3 docs/muf-crew-bitmap.py

# 2. Regenerate the transparent singles INTO the repo (before re-pin — see note)
python3 docs/muf-crew-bitmap.py --singles

# 3. Re-pin the manifest. This runs the sprite-drift check FIRST and REFUSES to
#    re-pin over stale sprites — which is why step 2 comes before it.
node scripts/check-agents-infographic.mjs --update

# 4. Verify the gate is green (what CI will run)
node scripts/check-agents-infographic.mjs
```

Expected tail of step 4: `FRESH — 21 watched sources match the manifest; sprites in sync
with the generator.` If it prints STALE or SPRITE DRIFT, do **not** commit — re-read the
error (a watched source moved, or a sprite wasn't regenerated) and redo from step 1.

## The one judgement call: did the protocol or roster change?

The manifest also watches the **authored** HTML pipeline infographic's sources. The re-pin
is sanctioned as either "updated the infographic to match" **or** "confirmed no visual
change is needed" — a conscious act, not a rubber stamp:

- **Model tier / references / wording change only** → the pipeline poster
  (`agents-pipeline-infographic.html`) shows no model or reference text, so **no HTML edit
  is needed**; re-pin is the "no visual change" path. (Confirm this is true for your diff.)
- **Roster / stage / gate-routing change** → update `docs/diagrams/agent-workflows.md` and
  `docs/diagrams/agents-pipeline-infographic.html` to match **before** re-pinning, so the
  poster doesn't drift from the protocol.

## Commit

Stage the regenerated + re-pinned artefacts together with the change that triggered them:

```
git add docs/muf-crew.png docs/diagrams/crew/ docs/diagrams/agents-pipeline-infographic.sources.json docs/muf-crew-bitmap.py
```

Commit them in the **same PR** as the agent edit — a re-pin split from its cause reads as
an unexplained manifest churn.

## Guardrails

- Never re-pin before regenerating singles — the gate will (correctly) refuse, and forcing
  it would bless sprites that were never regenerated.
- Never hand-edit the manifest JSON — always via `--update`.
- Never commit on STALE/DRIFT — that's the gate telling you an artefact is out of sync.
- Roster/protocol change ⇒ update the HTML infographic + `agent-workflows.md` first.
