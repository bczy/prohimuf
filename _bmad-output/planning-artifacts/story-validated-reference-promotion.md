# Story: Validated-reference promotion loop (internal hero → style-lock family derivation)

**Type:** Asset-tooling capability (`scripts/**` + `docs/**` — no game/render/hooks
surface) · **Status:** ready-for-tech-plan (awaits `senior-architect` lane assignment)
· **Date:** 2026-07-18 · **PM:** John
**Builds on:** ADR-0044 (`docs/adr/0044-adhoc-reference-conditioned-asset-iteration.md`,
branch `claude/image-generation-agents-references-1176lb`, PR #84 draft) and art bible
§3.12 / §7 (`docs/art-direction.md`) which already names "kontext hero-sprite derivation
pass for hard style-locking" as a follow-up.
**Coincides with:** the new `graphic-references` (Ray) subagent merged on `main`
(`.claude/agents/graphic-references.md`) — see "Coexistence" below.

## Why (product value)

ADR-0044 shipped the **ad-hoc** half of the reference loop: an operator drops a photo,
hosts it, runs one manual `kontext` generation conditioned on it, judges the pixel
output by eye. What it deliberately left out — and what Bertrand now wants — is the
**feedback half**: once a generated asset **passes the `lead-art` acceptance gate**, it
should stop being a one-shot experiment and become a **reusable reference** that the
pipeline **itself reaches for** on the next generation of a related asset in the same
family, so a validated hero style-locks its siblings without an operator re-dropping the
same file by hand every time. This closes the loop the art bible already anticipated
(§3.12 kontext-as-consistency-strategy, §7 follow-up) and turns "we liked this truck" into
"every future van in this family starts from the truck that passed the gate."

Bertrand's hard emphasis, verbatim: **"assure-toi qu'ils soient bien utilisés jusqu'au
bout de la chaîne"** — a promoted reference is worthless if it is merely recorded
somewhere. It must be traceable, provably, all the way to the Pollinations `image=`
parameter of a subsequent generation request, and demonstrably change that request's
output versus not having it. This story's acceptance criteria are built around proving
that, not around the existence of a field.

## Cahier des charges test — N/A, stated explicitly (tooling, not a game feature)

Prohibition (Atari ST, 1987) has no concept of "AI reference promotion" — the test that
governs game features doesn't apply to build tooling, same precedent as ADR-0044 and
`story-shared-morphology-lib.md`. This is a conscious, documented extension of the
**asset-generation pipeline only**: it serves visual coherence of the assets the game
ships, it does not add a game feature, a screen, a mechanic, or player-facing content.
Zero touch to `src/game`, `src/render`, `src/hooks` — the boundary law is not engaged.
Governing principles instead: DRY (one reference library, not a second parallel one) and
the existing art-flow gate discipline (nothing bypasses `lead-art`).

## Flows

**(a) Validate → promote.** An asset that reaches the `lead-art` ASSET GATE (or, for
runtime-composed visuals, the COMPOSITE GATE at stage 5) and receives a **PASS** becomes
eligible for promotion into an **approved internal reference** for its family/type
(e.g. the truck that passed becomes the vehicles/truck reference; a cop variant that
passed becomes that enemy type's reference). The exact promotion mechanism/criterion
(what "mark as reference" means procedurally, and whether every PASS auto-promotes or an
explicit second call from `lead-art` is required) is **not designed here** — that
judgment call belongs to `lead-art` (Nico). What this story fixes as a hard requirement:
promotion can only ever happen **after** a gate PASS, never before, never on a rejected
or still-iterating asset.

**(b) Promoted reference → automatic use in subsequent generation.** When a later
generation run targets a family/type that already has an approved internal reference,
the pipeline **resolves that reference automatically** and threads it into the `kontext`
`image=` parameter of the outbound Pollinations request — the same mechanism ADR-0044
proved out for enemy flipbook frame-N-from-frame-1 and for the ad-hoc `--ref` flag,
except the reference is now looked up rather than manually supplied on every call. An
operator generating a new van no longer needs to know or re-supply the truck's URL by
hand; the pipeline already knows it is the family's approved hero. The exact resolution
mechanism (registry format, where it lives, how the generator script looks it up) is
**not designed here** — that is `senior-architect`'s tech-plan call, informed by the
ADR-0044 `scripts/lib/pollinations.mjs` contract it must extend without breaking.

**(c) Coexistence with Ray's external boards.** The reference system now has two
upstreams feeding **one** downstream (concept-artist's prompt authorship + the kontext
`image=` source at generation) — they must stay coherent, not become two disconnected
mechanisms an agent could confuse:

- **External** — `graphic-references` (Ray) runs interactive hunts with Bertrand,
  producing validated **boards** under `docs/art-direction/references/boards/`
  (mood, culture, era, style — informs *how a family should look* before any pixel
  exists). `lead-art` curates validated boards into the reference library
  (`docs/references/art-culture.md`).
- **Internal** — this story's loop: a **validated generated pixel asset**, promoted
  because it already passed the gate, becomes a style-lock **anchor for img2img
  derivation** of siblings (a hero conditions the family it belongs to, after the fact).
- Both are curated by the same gate owner (`lead-art`) into what should read as **one**
  reference library with two intake paths — a mood board that informs a prompt, and a
  validated hero that conditions a generation — not two competing registries. This story
  must not introduce a second, parallel "reference" concept; where exactly the internal
  registry lives relative to Ray's boards and `docs/references/art-culture.md` is an
  architect + `lead-art` decision, but the doc produced by this story's tech plan must
  state the relationship explicitly so a future agent never has to guess which one to
  check.

## In-scope families

**vehicles, levels, enemies, courier** — the three families ADR-0044 already wired
end-to-end (vehicles, enemies, levels) plus `courier` (the layered flipbook family,
§4.2 of the art bible), which is the natural next candidate since it already has a
protected reference concept in spirit (bike/rider layers) even though it has no
frame-1-lock today. Any family beyond these four is a follow-up, not this story.

## Acceptance criteria

Centred on **proving** the reference reaches the `image=` param and actually changes the
output — not on the existence of a field or a registry entry.

- **AC1 (promotion is gate-gated, never earlier).** A generated asset can only become an
  approved internal reference after a documented `lead-art` gate PASS (ASSET GATE or
  COMPOSITE GATE) for that exact asset. There is no code path that promotes an
  unreviewed or FAILed asset.
- **AC2 (automatic resolution, no manual re-supply).** A generation run for a
  family/type that has an approved internal reference resolves and uses it **without**
  the operator passing `--ref` by hand — the ad-hoc manual flag from ADR-0044 keeps
  working as an explicit override, but the promoted reference is the default when one
  exists and none is manually given.
- **AC3 (end-to-end proof — hard requirement).** There is a concrete, reviewable
  assertion/log/test that shows the *exact* promoted reference's resolved URL is the one
  placed in the `image=` parameter of the request for a run that used it — e.g. a unit
  test asserting the built request URL contains the promoted reference's URL segment for
  a given family/type, AND a reviewable log line (CI or dry-run) echoing
  `family/type → resolved reference URL` for every run that resolved one. "The field
  exists in a manifest" does **not** satisfy this criterion — the proof must show
  causality: change which reference is approved for a family and the next generation's
  `image=` value changes accordingly.
- **AC4 (no reference = today's behaviour, unchanged).** A family/type with no approved
  internal reference generates exactly as it does today (flux, no `image=`) — this loop
  is additive; nothing regresses ADR-0044's ad-hoc path or the existing per-family
  generators when no promotion has happened yet.
- **AC5 (one coherent library, not two).** The tech-plan doc and any code state
  explicitly how the internal-promotion registry relates to Ray's boards
  (`docs/art-direction/references/boards/`) and the curated library
  (`docs/references/art-culture.md`) — both remain under `lead-art` curation, and a
  reader of either doc can find the other.
- **AC6 (bounded, no runaway auto-regeneration).** Promoting an asset changes what a
  **future, deliberately-triggered** generation resolves to; it never itself triggers
  regeneration of the rest of the family. Generation stays operator/CI-dispatched exactly
  as ADR-0044 left it (`workflow_dispatch`, no network in the dev sandbox) — this story
  does not add an auto-regen-on-promotion trigger.
- **AC7 (boundary law + gates green).** Zero touch to `src/game`, `src/render`,
  `src/hooks`. `rtk tsc` + `rtk vitest` + `rtk lint` green. Full code-review panel before
  merge per `COLLABORATION.md` (this is a pipeline-mechanics change, not a fix-lane diff:
  it touches shared generator/lib code and the art-flow docs, i.e. more than one
  concern — full pipeline, not the fix lane).

## Out of scope / follow-ups

- The exact registry/manifest schema and generator wiring — **`senior-architect`**
  tech-plan, informed by `scripts/lib/pollinations.mjs` (ADR-0044).
- The exact promotion criterion/procedure ("what makes a PASS become a promoted
  reference") — **`lead-art`** call.
- Retiring the manual `--ref` ad-hoc flag — it stays as an explicit override (AC2); no
  removal.
- Multiple competing/versioned references per family/type (rotation, history, "revert to
  a previous hero") — MVP is latest-approved-wins, no history UI.
- Cross-family transfer (e.g. a vehicle hero style-locking an enemy) — YAGNI unless a
  follow-up story requests it.
- Any browsing UI for the reference library beyond the existing docs.
- Extending beyond vehicles / levels / enemies / courier without a follow-up story.
- Auto-regeneration of a whole family when its hero changes (explicitly excluded, AC6).

## Coordination note (opening the loop, not closing it)

This story only opens the loop — per the collaboration contract I do not design the
mechanism or write code. Next hands: `senior-architect` for the tech plan (registry
shape + generator wiring, likely a small ADR extending or superseding parts of
ADR-0044) and `lead-art` for the promotion criterion, ideally in the same round since
AC5's "one coherent library" needs both perspectives reconciled before lanes are cut.
Flagging as **cross-cutting** (touches `scripts/**` tooling AND the art-flow docs/gate
contract) per `COLLABORATION.md` — hands to `senior-architect`, not a single dev lane.
