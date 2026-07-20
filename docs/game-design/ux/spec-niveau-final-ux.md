# UX spec — Niveau Final: progression/unlock surface + finale onboarding

**Surface:** the level-select flyer for the new `niveau-final` `LevelConfig`, the
finale's onboarding (does the player get warned a boss ends this level), the
accessibility carry-over onto the new level's surfaces, and the failure/retry loop on
the hardest level in the game.
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-20
**Story:** `_bmad-output/planning-artifacts/story-boss-niveau-final-live.md`
("Le Commandant" ships live) · part of the design loop alongside `game-designer`
(pacing/quota/difficulty, Open Q1-2) and `narrative-designer` (venue-canon
confirmation, `final_pre`/`final_post` wiring, Open Q4/AC7).
**Not respecced here:** the boss QTE's own on-screen legibility (HP bar, parry tell,
finisher, multi-target read, smoke audio-tell) — that surface is already gated in
`ux/spec-boss-qte-hp-read.md` and `ux/spec-boss-qte-differentiation-ux.md` and ships
**unchanged** per the story's own instruction. This spec only covers the NEW surface
this story adds: the flyer, the onboarding seam, and the retry loop, all of which are
either straight reuse or a fairness ruling — no new component, no new mechanic.
**No mechanics/tuning numbers, no visual style, no production code, no in-game words**
— pacing is `game-designer`'s, look is `lead-art`'s, code is `dev-r3f-render`'s/
`dev-gameplay`'s, and flyer copy (crew name, slogan, zone/date/rv lines) is
`narrative-designer`'s. Every decision below is a surface/function ruling, verifiable
on a screenshot at both device classes.

---

## 1. Level-select surface — the Niveau Final flyer

### 1.1 Ruling: zero new UI. Reuse `LevelFlyer`/`FlyerWall` verbatim.

**D1 — The Niveau Final flyer is the 4th playable flyer, rendered by the existing,
already-gated `LevelFlyer`/`FlyerWall` components (`flyer-wall-format.md`,
`ux/flyer-wall-format.md` PASS 2026-07-19), with zero new layout, zero new component,
zero new CSS.** It is data (`LEVELS[3]`, a `PLAYABLE_COPY` entry keyed to its id) flowing
through a frozen surface, exactly the pattern every prior level addition (Stalingrad,
Vitry) already used. Reopening the flyer format gate for this story is out of scope —
if the format needs a change, that is a separate, explicit story against
`flyer-wall-format.md`, not a side effect of adding a level.

Both states render exactly as they do for Stalingrad/Vitry today:

- **Locked (default state, before Vitry is cleared):** `LockedBody` — crew name legible
  (from `narrative-designer`'s copy), name struck/greyscale, `LIGNE FERMÉE` stamp,
  `PAS ENCORE POUR TOI` overlay, `DATE À VENIR` / `RV : INCONNU` / muted info-line, and
  the standing helper text `"la ligne ouvre quand la précédente est bouclée"` — unchanged,
  reused verbatim (`LOCKED_COPY`, `LevelFlyer.tsx`).
- **Unlocked (after Vitry's `LEVEL_COMPLETE` fires):** `PlayableBody` — crew/name,
  difficulty stamp (`difficultyMark`, unchanged thresholds), slogan, date/zone/rv/
  info-lines, stats row (`⏱ {timeSeconds} s` / `{enemiesToWin} cibles`), and a `RECORD`
  marker once a score exists. All fields already exist on `LevelConfig`/`PLAYABLE_COPY`;
  this level needs one new entry in each, authored by `game-designer` (numbers) and
  `narrative-designer` (words).

**D2 — Unlock mechanism: the existing index-based chain, unchanged (AC per story
Scope).** Placement at `LEVELS[3]` (after belliard/stalingrad/vitry) means the flyer
flips from locked to unlocked automatically on the same `LEVEL_COMPLETE → shippedIdx+1 →
unlockLevel()` hop `App.tsx` already runs for every prior level (`levels.ts`
`loadUnlockedLevels`/`unlockLevel`). No new unlock code, no new UX state to design —
confirmed as reuse, not a gap.

### 1.2 What is NOT added: no "finale" badge, no boss-reveal on the menu

**D3 — The flyer carries no mechanical or visual marker that a boss ends this level.**
No new stamp, no distinct border treatment, no boss silhouette in the flyer's own
imagery. Two reasons, both binding:

- **Cahier des charges / minimal-surface discipline:** the story's own scope is data +
  narrative wiring, not a new UI object. A "LAST STOP" stamp would be a new component
  this story does not need to answer its own question (does the required gate read
  right at the end of a real level).
- **Spoiler discipline (see §2):** the flyer is browsed BEFORE the player has committed
  to the level. Any visual/textual tell that "this one has a named apex enemy" on the
  menu — before the player has even started the level, let alone reached `final_pre` —
  spends the "one true reveal" (the fiction's own framing, `spec-boss-encounter-fiction.md`
  §4.1, line 4: "...le Commandant.") on a screen the player skims, not the moment
  authored for it.

If `narrative-designer`'s copy wants to signal "this is the last one" (a legitimate,
different question from "there's a boss"), that is carried through the EXISTING copy
slots — slogan, zone line, ambiance — the same way difficulty/mood already reads through
copy today, not a new UI element. Flagged to `narrative-designer` as a copy option, not
a UX requirement.

### 1.3 Device classes

**D4 — No device-specific work.** The flyer wall's wide-viewport wrap-grid, the
short-landscape horizontal rack (`SHORT_LANDSCAPE_MEDIA`), the roving-focus keyboard
nav, and the touch-target floor (flyer box ≥ 280×300 px, already far above the 44×44 px
minimum, `flyer-wall-format.md` §"Touch target ≥ 44 px") all already handle an arbitrary
4th flyer — verified structurally by the existing `LEVELS.map` loop, not something this
level exercises differently. The ONE thing worth a stage-5 look (§3, not a new
requirement) is that a 4th flyer doesn't push the wide-viewport grid or the mobile rack
into a state nobody previously screenshotted (e.g. a 4-wide row wrapping oddly) — a
confirmation check, not a design change.

**Acceptance (§1):**

- A1. Locked-state screenshot of the niveau-final flyer at desktop wide-viewport and at
  mobile-landscape rack: matches Stalingrad/Vitry's locked treatment exactly (same
  stamp, same helper copy, same greyscale).
- A2. Unlocked-state screenshot (post-Vitry-clear) at both device classes: matches the
  Belliard/Stalingrad/Vitry unlocked treatment exactly (same field layout, difficulty
  stamp present, stats row present).
- A3. No boss-specific stamp, icon, or copy referencing "boss"/"Commandant"/"QTE"
  appears anywhere on the flyer in either state.
- A4. 4-flyer layout at desktop wide-viewport (wrap-grid) and mobile short-landscape
  (rack): no visual regression versus the existing 3-flyer captures (row wrap, scroll-
  snap positions).

---

## 2. Finale onboarding — spoiler discipline vs. fairness (the ruling)

### 2.1 The tension, stated plainly

Two rules pull in opposite directions and both are real:

- **Narrative law:** the boss reveal is a **one-shot payoff** — the player should not
  know "le Commandant" exists, by name or by sprite, before the game itself tells them
  (`spec-boss-encounter-fiction.md` §4.1 line 4 is the FIRST time the name is spoken).
- **`PROJECT_GUIDELINES.md` §5.6 — never a "mort bullshit":** the rules of an encounter
  that can end a run must be visible and coherent BEFORE the player is tested on them,
  not discovered mid-failure. A required, level-gating fight (ADR-0051 D3) that opens
  with zero warning and zero rule-teaching is, structurally, an ambush.

### 2.2 The ruling

**D5 — The already-gated `final_pre` narrative scene (`spec-boss-encounter-fiction.md`
§4.1, 8 lines, `narrative-designer`) IS the fairness mechanism, and it is sufficient as
already written. No additional onboarding surface is needed.** Reasoning:

- `final_pre` plays at the START of the level (`NARRATIVE_PRE` phase, before `PLAYING`
  begins) — the player is briefed BEFORE clearing a single mook, not sprung on at the
  boss trigger. This gives the warning maximal lead time within the level, without
  spending it on the menu (§1.2, D3).
- Line 4 spends the name-reveal ("...le Commandant.") — that is the narrative payoff,
  and stays exactly where it is written; this spec does not touch it.
- **Line 6 already teaches the vulnerability rule diegetically**, in-voice, before any
  exposure: `"Il tire le premier. C'est là qu'il est à découvert. Nulle part ailleurs."`
  This names the **when** (he's vulnerable only when he opens fire) without naming the
  **how** (no HP bar, no phase count, no QTE vocabulary, no mechanic words) — exactly the
  right altitude: it satisfies §5.6 (the player is told the rule that will kill or save
  them) without pre-empting the mechanical discovery that is the encounter's own reveal.
- A second, independent lead-time buffer already exists structurally and needs no new
  work: the boss trigger itself opens with a 2-second `ZOOMING` phase
  (`QTE_ZOOM_SECONDS`/`spec.zoomSeconds`, `bossQteSystem.ts`, unchanged per AC5) — the
  same "the scene visibly commits to a set-piece" cue the hostage QTE already uses. A
  player who skipped or half-read `final_pre` still gets a second, in-the-moment signal
  that something distinct from ordinary play is starting, before the fight itself opens.

**D6 — What must NOT appear anywhere before the encounter itself (menu, `final_pre`
imagery, HUD-at-rest):** the boss's own sprite/silhouette, a preview of the HP bar, or
any text naming the mechanic ("boss," "QTE," "phases," "parry"). `final_pre`'s existing
script already respects this (its only imagery is already-shipped sprites — courier,
generic enemy — per the fiction spec's own "iron rule": only sprites already shipped).
This is a restatement/confirmation, not a new constraint on `narrative-designer`'s
already-gated text.

**D7 — This does not reopen `spec-boss-encounter-fiction.md` §4 or
`spec-boss-qte-hp-read.md`.** Both already answered their own onboarding-adjacent
questions (the phase-break cue, the diegetic HP-read); this section only rules on the
NEW question this story raises — is the pre-existing `final_pre` script, on its own,
enough of a fairness mechanism for a LIVE, first-contact player — and answers **yes**.

**Acceptance (§2):**

- A5. Playtest/e2e capture of a fresh run (no prior harness exposure): `final_pre` plays
  before the pre-boss quota section starts; line 6's vulnerability-rule line is present,
  unedited from the gated script.
- A6. No sprite/asset depicting the boss character appears in `final_pre`'s images, the
  flyer, or any pre-boss HUD state (confirmed against the shipped asset list — only
  `assets/courier/rider.png` and `assets/enemy_shooting.png` per the gated script).
- A7. The boss trigger's `ZOOMING` transition (existing, unchanged) fires visibly between
  the last pre-boss mook and the encounter's `ACTIVE` phase — confirmed present, not
  skipped, on the live level's real anchor.

---

## 3. Accessibility carry-over — nothing new, confirm and name stage-5 checks

**D8 — No new accessibility decision. Every discipline already shipped applies
unchanged to the new level's surfaces**, because every surface it uses is reused, not
new: the flyer (§1, `flyer-wall-format.md`'s a11y already covers touch target ≥44px
inherited via ≥280×300px flyer boxes, keyboard roving focus, `aria-disabled` on locked
flyers, `prefers-reduced-motion` disabling `.muf-anim` transitions/animations globally),
the narrative scene (`NarrativeScreen`, unchanged, skippable in one button per §5.3
guidelines), and the boss QTE HUD (already gated in `ux/spec-boss-qte-hp-read.md` +
`ux/spec-boss-qte-differentiation-ux.md`, reused byte-for-byte per this story's own
instruction not to respec it). ADR-0015 device wording (`clic`/`souris` vs. `deux
doigts`) has no new surface to apply to here — `final_pre`/`final_post`'s gated scripts
contain no input-instruction copy (confirmed by reading `spec-boss-encounter-fiction.md`
§4.1/§4.2: pure dialogue, zero "appuie"/"tape"/"clique" lines) — flagged as a fact to
re-confirm at gate if `narrative-designer` adapts the scripts for the concrete id/anchor
(story AC7), not a requirement to add anything.

### 3.1 Stage-5 `verify` checklist (level-specific, additive to the standing suite)

Nothing below is a NEW accessibility requirement — each is a confirmation that an
EXISTING discipline holds on the new instance (new anchor, new backdrop, new copy),
since re-anchoring/re-seeding (AC's own re-pin obligation) is exactly the kind of change
that can silently break a legibility guarantee proven on a different backdrop:

1. **Flyer locked/unlocked, both device classes** (§1 A1-A4).
2. **`final_pre`/`final_post` play correctly wired to the new level id** (AC7), skip
   button present and functional, no asset outside the shipped-sprite iron rule (§2 A5-A6).
3. **Boss QTE legibility re-verified on the LIVE anchor/backdrop**, not just the
   dev-harness's: re-run the existing A1-A15 acceptance captures from
   `ux/spec-boss-qte-differentiation-ux.md` (audio-tell grayscale, parry-vs-shoot form
   distinction, finisher cue, multi-target read, all under `prefers-reduced-motion:
reduce`) against the new venue backdrop and re-anchored position — the mechanic is
   unchanged, but contrast/legibility against a NEW backdrop (the squatted hall) is not
   proven until screenshotted there. This is the single most important level-specific
   check: a legibility guarantee proven on one backdrop is not automatically true on
   another.
4. **Mobile-landscape capture of the full finale flow** (flyer → `final_pre` → pre-boss
   quota → boss `ZOOMING` → encounter → `final_post`/`EndScreen`) at arm's-length
   scrutiny — first full-level pass on real device classes, not the harness's isolated
   `?preview=boss` entry point.
5. **ADR-0015 device-copy pin**, only if `narrative-designer` adapts any script line for
   the concrete id/anchor: re-run the regex-style check (no `clic`/`souris` on mobile
   scripts, no `deux doigts` on desktop) — currently N/A since no input copy exists in
   the gated scripts, confirm it stays that way if lines are touched.

**Acceptance (§3):** A8. All five checks above captured and reviewed by `ux-designer`
against the cited specs' existing acceptance criteria (no new criteria authored here);
PASS/deviation reported to `lead-game-designer` per the standing stage-5 protocol.

---

## 4. Failure/retry loop on the finale

**D9 — Reused pattern, unchanged: `EndScreen` in its `GAME_OVER` phase.** A lost boss
fight (`bossQteSystem.ts` resolves the encounter `LOST` → `stateMachine.ts` sets
`phase: "GAME_OVER"`, unchanged, AC5) renders the exact same generic `EndScreen` every
other failure on every other level already uses: the `"— UNE —"` tabloid overlay,
`SCORE FINAL / VAGUE` line, `[ CLIQUER POUR RETOURNER AU MENU ]` prompt, click/tap
anywhere to return to `MENU`. No boss-specific failure copy, no new component. This is
the same screen a lives-depleted or timer-expired loss on Belliard/Stalingrad/Vitry
already shows, and the same screen the boss dev-harness already exercises — reused
verbatim, not re-authored for this story.

**D10 — No mid-level checkpoint at the boss.** Losing the encounter returns the player
to `MENU`; retrying means re-selecting the flyer and re-playing the level from its
start — the pre-boss quota section included. This is not a new decision this story
makes; it falls directly out of ADR-0051 D3 ("required gate," terminal beat on
`Livrer`, no reserved retry-at-boss checkpoint) and is confirmed here as the reused,
accepted shape, not reopened. It is bounded by the standing "one mission = 3-5 minutes
maximum" ceiling (`PROJECT_GUIDELINES.md` §5.2) exactly as every other level's full-
retry cost already is — so a lost boss attempt costs at most one mission-length replay,
same ceiling as any other level's death.

**D11 — Flag, not a decision, for `game-designer`:** if Open Question 1 (pre-boss
quota/pacing) lands on a long pre-boss section, the retry cost for a boss loss scales
with it (a player who dies at the boss redoes the whole quota, not just the fight). This
is a pacing trade-off `game-designer` owns (Open Q1/Q2); I flag it here because it is
the retry-loop's felt cost, but the numeric call belongs to the pacing spec, not this one.

**Acceptance (§4):**

- A9. Boss-loss capture: `EndScreen` renders identically in structure/copy to a
  lives/timer `GAME_OVER` capture from an existing level (same component, same props
  shape, `phase="GAME_OVER"`).
- A10. Click/tap-anywhere-to-menu behaviour confirmed functional from a boss-loss state;
  re-selecting the niveau-final flyer re-enters `final_pre` → pre-boss quota → boss,
  from the top, exactly like any other level replay.

---

## Seams handed off explicitly

- **→ `narrative-designer` (Yasmine):** the `PLAYABLE_COPY` entry (crew, slogan, date/
  zone/rv/info lines) for the niveau-final flyer (§1.1); any "this is the last one"
  signal, if wanted, through those existing copy slots (§1.2, D3) — not a new UI
  element; confirming `final_pre`/`final_post` need no adaptation beyond the concrete
  id/anchor (AC7), and that no input-instruction copy is introduced (§3, ADR-0015 check).
- **→ `game-designer` (Sacha):** the pre-boss quota/pacing numbers (Open Q1-2) that
  determine D11's retry-cost felt weight; this spec states the floor (existing pattern,
  no checkpoint), not the numbers.
- **→ `lead-art` (Nico):** the flyer's own visual stock/imagery for niveau-final stays
  inside the existing frozen format (§1.1, D1) — no new component to skin. The venue
  backdrop's look (the squatted hall) is his; §3's stage-5 re-verification is about
  legibility against whatever he ships, not a request to change it.
- **→ `dev-r3f-render`/`dev-gameplay`:** nothing new to build for this spec specifically
  — every ruling above is "reuse this exact component/pattern," verifiable once the data
  (`LevelConfig`, `PLAYABLE_COPY`, narrative wiring) lands.
- **→ `lead-game-designer` (Karim):** design-gate owner alongside `game-designer`'s and
  `narrative-designer`'s parallel specs for this story.

**Gate:** this spec needs `lead-game-designer` DESIGN GATE PASS, alongside
`game-designer`'s pacing spec and `narrative-designer`'s venue/script wiring, per the
story's Definition of Done. It does not reopen `flyer-wall-format.md`,
`ux/spec-boss-qte-hp-read.md`, or `ux/spec-boss-qte-differentiation-ux.md` — all three
are cited, none revised.
