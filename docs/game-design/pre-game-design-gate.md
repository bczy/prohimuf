# Design gate — pre-game experience redesign (stage 3)

**Gate:** `lead-game-designer` (Karim) · **Date:** 2026-07-14
**Deliverables under review:**

- UX spec — `docs/game-design/pre-game-experience-ux.md` (`game-designer`, Sacha)
- Copy deck — `docs/game-design/pregame-copy-deck.md` (`narrative-designer`, Yasmine)

**Story:** `_bmad-output/planning-artifacts/story-pre-game-experience-redesign.md`
**Anchors checked:** `PROJECT_GUIDELINES.md` §5 · `docs/art-direction.md` §2 · shipped
`MainMenu.tsx`, `StartScreen.tsx`, `levels.ts`.

---

## Overall verdict: **PASS WITH CONDITIONS**

The set is coherent, faithful (cahier-des-charges: title/menu/scores are original
Prohibition front-end surface — reskin, no new mechanic, core loop untouched), and
verifiable. It may proceed to `senior-architect` for lane partition and ADR call — the
conditions below do **not** affect feasibility or the render-only lane assignment. They
are spec amendments owed by Sacha & Yasmine **before the render dev builds the flyer/UNE
surfaces**, and are re-checked at the stage-5 design-acceptance playtest.

---

## Verdict table

| #   | Escalated point                                                           | Verdict                      | Anchor                          |
| --- | ------------------------------------------------------------------------- | ---------------------------- | ------------------------------- |
| a   | New TITLE vs 10 s launch budget (no-dwell, ≤280 ms, whole-screen hit)     | **PASS w/ condition**        | §5 UX rule 1; AC5               |
| b   | `TITLE` as `AppPhase` local state, not game `stateMachine`                | **PASS**                     | AC4/AC7/AC8                     |
| c   | UNE on newsprint cream + one fluo accent (≠ "one fluo stock per surface") | **PASS w/ condition**        | §5; art bible §2                |
| d   | NarrativeScreen frame: print vs world-glow                                | **PASS — ruling: PRINT**     | art bible §2 (loi du glow)      |
| e   | Flyer "pile" as jittered ±3° vertical stack, not a deep fan               | **PASS**                     | §5; AC4 (nothing lost)          |
| f   | Net-new canon (crews, PARIS-MINUIT, infolines) + MOYEN/NORMAL             | **PASS w/ condition**        | cahier-des-charges; §7          |
| g   | Cross-lane slot fit (every string a slot; every slot copy)                | **PASS w/ condition**        | division of labour              |
| —   | **Stalingrad difficulty (found in review, not escalated)**                | **CONDITION — required fix** | AC4; `levels.ts`/`MainMenu.tsx` |

---

## Rulings & conditions

**(a) PASS w/ condition.** The mitigation is sound: no dwell, entry action fires
immediately regardless of typewriter progress, ≤280 ms transitions, whole-screen hit
target. The 3-tap returning path (title → flyer → Passer) is comfortably < 10 s.
_Condition:_ the stage-5 design-acceptance playtest must **time** the 3-tap path as a
hard checkpoint (already in UX §8) — it is a verification gate, not an assumption.

**(b) PASS.** `AppPhase` (render-layer `useState` in `App.tsx`) is not the game
`stateMachine`. Adding a `TITLE` branch + `?preview=title|menu` is render-only; `Prefs`,
`highScoreSystem`, `levels.ts`, `stateMachine` stay byte-untouched. Within "reskin not
re-plumb." The new phase + shared token module warrant an ADR — **architect's call** (AC8).

**(c) PASS w/ condition.** Design-side this is the _more_ faithful choice — a real
night-tabloid prints on newsprint, not fluo card; a single fluo masthead accent adds no
glow and keeps the surface on the print side of the line. I do not arbitrate visuals:
_condition_ — `lead-art` (Nico) confirms the newsprint-cream stock exception against
`art-direction.md` before the UNE surface is built. Flagged to the art gate.

**(d) PASS — ruling: PRINT frame.** The briefing is pre-play ("avant de jouer") and sits
on the **menu = print** side of the loi du glow. Design intent: paper ground + ink rule +
halftone, read as a fax / répondeur transcript — which also reinforces the infoline motif
the deck introduces. Glow stays reserved for the in-game world. NarrativeScreen _behaviour_
stays frozen (AC3); only the frame joins the system. Visual execution is `lead-art`'s.

**(e) PASS.** A literal deep fan would hide flyer data, violating AC4 "nothing lost." The
jittered ±3° near-full-width vertical stack is a sound, documented reading of §5's "pile de
flyers" (the _read_, not literal depth). Legibility is non-negotiable. Flagged for the art
gate as a conscious §5 interpretation.

**(f) PASS w/ condition.** The crew names (SPIRALE 23 / KANAL SYSTEM / NADIR 94), the
tabloid PARIS-MINUIT, and the infoline numbers are a **conscious, documented extension**
(ADR-0012 precedent): a flyer must name _something_ to read as a flyer; these are minimal
presentation flavour, a different entity class from the §7 recruitable contacts (no
collision), grounded in shipped dialogue (KENZA "'95", the Vitry 9th-floor callback in
`…94 09`), and period-authentic (`08 36` premium-rate, francs `1F50`, no post-2002 vocab).
The tutorial-has-no-infoline rule is intentional and coherent.
_Conditions:_

- **f1** — Record these as **gated canon** in `docs/game-design/README.md` and open a
  follow-up to seed `narrative-bible.md` (no bible exists yet — without one these names
  drift). Note the crew ↔ §7-contact relationships (Faïza/Stalingrad ↔ KANAL SYSTEM; DJ
  Masta Klem/Vitry ↔ NADIR 94) so a future bible does not collide.
- **f2 (MOYEN/NORMAL)** — Standardize the middle-tier word on **NORMAL** (both lanes
  agree). Align the render label `MainMenu.tsx:170` `MOYEN → NORMAL` (a one-word,
  in-scope render change, no data touch) and amend UX §4.1/§4.4 which currently say
  "keep exact label MOYEN." Note: with shipped data **no level renders the middle tier**
  (see the Stalingrad condition), so this is latent cohesion, not a visible fix.

**(g) PASS w/ condition.** Slot fit is mostly clean (`[INFOLINE_CTA]` 23≤28; `[NO_SCORE_LINE]`
24≤32; Prefs labels/values covered; empty-state, locked, masthead all mapped). Two gaps:

- **g1** — The deck (§2) introduces flyer flavour slots — **crew, slogan, date line, zone
  line, RV line, info-line, flavour-difficulty** — that the UX data-map (§4.1) never
  allocated (it counts only the 4 existing data fields). The UX spec must **add these
  slots with max lengths** so its §3.2 legibility budget ("no datum hidden") is computed
  against the real ~8-line flyer, and the art lane knows the flyer must hold copy, not 4
  fields. Sacha owns this amendment.
- **g2** — The deck does not restate the three sommaire labels `[RUBRIQUE_NIVEAUX/SCORES/
OPTIONS]` (UX §2.2, ≤12). Confirm the shipped `NIVEAUX / SCORES / OPTIONS` baseline (the
  surface mastheads — flyer wall / PARIS-MINUIT / OURS — are correctly distinct from the
  index tabs). Yasmine confirms in one line.

**(Stalingrad difficulty — required fix, found in review).** Shipped
`enemySpeedMultiplier`: belliard `1.0`, stalingrad `1.3`, vitry `1.6`; derivation
`>1.2 → DIFFICILE`, `>1.0 → MOYEN`, else `FACILE`. Therefore **Stalingrad's flyer stamps
DIFFICILE, not MOYEN** — the deck's §2.3 header and §8.3 reasoning are factually wrong
against the data. Re-tuning `levels.ts` to make it MOYEN is **forbidden** (AC4, byte-
unchanged). _Condition:_ the deck corrects its premise — Stalingrad derives DIFFICILE; the
**AMBIANCE flavour gradient (CHAUD < BRÛLANT) + district** carries the felt difference
between the two hard gigs. Consequence for the UX lane: two playable flyers (Stalingrad,
Vitry) will both carry the DIFFICILE (pink) stamp — the difficulty stamp alone is **not**
a glanceable discriminator with current data; UX §4.1/§4.4 should acknowledge this and lean
on AMBIANCE + district for the read, not the stamp.

---

## Iteration status

Round 1 of 2 (cap per COLLABORATION.md). All conditions are small, additive spec
amendments — no re-architecture. Sacha owns a/f2/g1 + the Stalingrad UX note; Yasmine owns
f1/g2 + the Stalingrad deck correction; c/d/e are flagged to `lead-art` for the visual gate.
Re-verify the amendments at stage-5 design acceptance, not a full re-gate.
