# UX spec — Run stats end-screen, "copier mon rapport", funnel discoverability

**Surface:** `EndScreen` (`GAME_OVER` / `LEVEL_COMPLETE`), its new optional detail
expansion, the "copier mon rapport" export action, and the visibility question for the
4-step `localStorage` funnel.
**Author:** `ux-designer` (Tony) · **Date:** 2026-07-30.
**Status:** **GATED (design) 2026-07-30** — `lead-game-designer` (Karim) **PASS WITH
RESERVES**. Blocking reserves to transcribe here before `dev-r3f-render` opens: **R1**
(the two controls + open panel + fallback textarea form ONE non-dismissing control block
with ≥24 px inert padding — `stopPropagation` alone does not satisfy Sacha's D3.5.2
near-miss clause), **R2** (headline slots are NOT short numerics once H2 lands — pin a
per-slot character budget measured in real mobile landscape), **R3** (detail panel = the
7 lines of Sacha's D3.1, headline metrics included — §3.1's "never a duplicate" is
overruled), **R4** (§1.2 ASCII mock names the wrong trio: `SCORE | LIVRAISON | DÉGÂTS`;
`VAGUE` is detail line 7), **R5** (run-end cause must be legible at 0 input, without
consuming a headline slot — guidelines §5 rule 4; placement is your lane). Open
questions 1/2/3 ruled at the gate (resolution log at the end of this document). Full
verdict: [`docs/handoffs/story-run-stats-system.md`](../../handoffs/story-run-stats-system.md)
§3. Written in parallel with `game-designer` (Sacha)'s gameplay spec
(`docs/game-design/spec-run-stats.md`, also gated PASS WITH RESERVES same date): Sacha
picked the gated 3-metric trio (H1 `SCORE FINAL` / H2 `LIVRAISON` / H3 `DÉGÂTS`, D1.1);
this spec fixes the **form** around that trio — layout, hierarchy, interaction,
accessibility.
**Scope guard:** `_bmad-output/planning-artifacts/story-run-stats-system.md` (AC2, AC3,
AC4, AC5, AC6, AC9), `PROJECT_GUIDELINES.md` §5 Règles UX Non-Négociables (rule 1: <10s
launch→gameplay: N/A here but its sibling rule — the end screen must add **zero
mandatory step** to the restart loop — is AC9 and is the load-bearing constraint on
every choice below), ADR-0015 (device-forked control copy conventions — reused for the
"copier mon rapport" fallback copy, not a new tutorial fork).
**Groundwork read:** `src/render/ui/EndScreen.tsx` + `.module.css` (current shipped
structure), `src/render/ui/PauseScreen.tsx` (existing toggle/action button pattern,
`aria` gap noted in `spec-menus-ui-completion.md` item 2c — not repeated here),
`docs/game-design/ux/spec-menus-ui-completion.md` (house format, fanzine artifact
metaphor precedent for `NAME_ENTRY`, ADR-0015 device wording), `_bmad-output/guidelines/PROJECT_GUIDELINES.md`.
**Lane:** spec only — zero production code (`src/render/**` is `dev-r3f-render`'s), zero
visual/style decision (type, ink, grain, exact fanzine framing = `lead-art`). I spec
WHETHER the screen works (hierarchy, hit areas, glance-legibility, flow length,
accessibility); the LOOK seam is hereby handed to `lead-art` per section below. In-game
copy (the exact button/report-field wording) is proposed as a strawman for
`narrative-designer` (Yasmine) to adjust for voice — flagged inline.

---

## 0. Task framing (before the screen)

The player's task at end-of-run is: **"see how it went, then go again."** Everything
this spec adds is optional deceleration off that task — so the acceptance bar for every
new element is: _does it cost the restart-loop a mandatory tap? If yes, cut it or make
it opt-in._ (AC9, guidelines §5 sibling rule.)

Bertrand-the-playtester's task is different and secondary to the player's: **"grab a
structured blob for Discord without breaking my flow."** The export button serves this
task only — it must never intrude on the primary player task by default.

---

## 1. Screen layout — desktop and mobile

### 1.1 Current structure (baseline, unchanged in position)

```
┌───────────────────────────────────────┐
│              — UNE / SUCCÈS —          │   .label
│                                         │
│     LE LIVREUR DU 19ÈME INTERPELLÉ     │   .title
│         (or LA RAVE A EU LIEU)         │
│                                         │
│     SCORE FINAL : 4200 | VAGUE 3       │   .score  ← existing single line
│                                         │
│   [ CLIQUER POUR RETOURNER AU MENU ]   │   .prompt (blinking, whole-screen click)
└───────────────────────────────────────┘
```

The whole `Overlay` is currently one giant click target that dismisses to menu — this
is the thing AC9 protects: **restart/dismiss must stay a single, un-nested action.**
Anything added must sit _inside_ that flow without turning the full-screen click into a
trap (see 1.4).

### 1.2 New structure — 3 headline metrics + end-cause subhead + detail affordance (amended R2/R4/R5)

```
┌───────────────────────────────────────┐
│              — UNE / SUCCÈS —          │
│                                         │
│     LE LIVREUR DU 19ÈME INTERPELLÉ     │
│         [ FIN DE RUN : SANTÉ ]         │   .endCause — NEW (R5), 0-input, own line,
│                                         │   not a headline slot (see 1.2b)
│  ┌────────────┬──────────────┬────────┐│   .headlineRow — gated trio (Sacha D1.1)
│  │ SCORE FINAL │  LIVRAISON   │ DÉGÂTS ││   3 slots, UNEQUAL width by design (R2):
│  │    4200     │ INTERROMPUE  │  1,5 ♥ ││   H2 reserves more horizontal budget for
│  │             │  — 78 %      │        ││   its outcome+% string; H2 may wrap to 2
│  └────────────┴──────────────┴────────┘│   lines, H1/H3 stay 1 line (see 1.2c)
│                                         │
│         [ ▾ DÉTAIL DE LA COURSE ]       │   .detailToggle — new, opt-in
│                                         │
│   [ COPIER MON RAPPORT ]                │   .exportButton — new, opt-in
│                                         │
│   [ CLIQUER POUR RETOURNER AU MENU ]   │   .prompt — unchanged position/behaviour
└───────────────────────────────────────┘
```

**R4 correction, logged so it isn't re-opened at code review:** the gated headline trio
(Sacha `spec-run-stats.md` D1.1) is **SCORE FINAL / LIVRAISON (issue + intégrité) /
DÉGÂTS (cœurs perdus)** — not `SCORE | LIVRAISONS | VAGUE` as an earlier draft of this
mockup named it. **Consequence, ruled and accepted:** `VAGUE`, always visible on the
screen today (`EndScreen.tsx:38`), moves behind the detail tap (line 7, §3.1). This is a
**conscious visibility regression**, not an oversight — the gate's reasoning is that
"wave reached" doesn't answer "how did the run go" the way the loop's three verbs do,
and it stays reachable in one tap (detail) and in the export. Nothing to fix here at
stage 5/code-review; it's a ruled trade-off.

#### 1.2a — headline row content

- **Headline row** replaces the single `.score` line with **exactly 3 slots** (AC2: 0
  extra tap/click). No slot is emphasized over another beyond what §1.2c requires for
  legibility — hierarchy of _weight_ between the 3 stays a `lead-art`/`game-designer`
  call.
- **`FIN DE RUN` subhead (R5, new)** — sits between the title and the headline row, own
  line, **always rendered, 0 input**, and does **not** occupy one of the 3 headline
  slots (guidelines §5 rule 4 requires it; the story's AC2 caps headline slots at
  exactly 3 — the two constraints coexist only if the cause is a subhead, not a 4th
  metric). Typographically **subordinate** to the title (smaller, same ink family,
  no colour-coding by outcome — neutral copy per the gate's Q7 ruling: this is
  diagnostic text, not a fanzine flourish). Value is one of Sacha's 5 causes (`SANTÉ`,
  `TEMPS`, `QUOTA`, `BOSS GAGNÉ`, `BOSS PERDU`, D2.6.1) — same vocabulary on-screen and
  in the export (one source of truth for the string). It also repeats at detail line 6
  (D3.2's "autoportant" rule) — that's intentional, not a duplication bug.
- **`DÉTAIL DE LA COURSE`** — a single row, own line, positioned _between_ the headline
  row and the export button. Closed by default. Opening it is additive (accordion-style
  reveal below its own row), never a modal, never a navigation away from `EndScreen` —
  so dismissing to menu remains valid at every state of the detail toggle (open or
  closed), never blocked by it.
- **`COPIER MON RAPPORT`** — its own row, below the detail toggle (or below the open
  detail panel, if open — see 1.4), above the existing dismiss prompt.
- Both new rows, the end-cause subhead, and the headline row all sit **inside the single
  non-closing controls block** defined in §1.4 (amended, R1) — not "outside a click
  target" as an earlier draft framed it; §1.4 is now the one place this is specified.

#### 1.2b — why the end-cause line is not a 4th headline slot

Sacha's D1.1 gates _exactly 3_ headline metrics and the story's AC2 pins that count.
Guidelines §5 rule 4 ("chaque mort/échec : raison explicite affichée") is
non-negotiable and is currently **not met** by the shipped screen (the title
`LE LIVREUR DU 19ÈME INTERPELLÉ` is not a reason — 3 of 5 causes share the same
`GAME_OVER` phase and today's title doesn't distinguish them). The subhead resolves the
rule without touching the metric count: it reads as part of the masthead ("UNE" → title
→ subhead), not as a stat, so the player parses it in the same glance as the headline
(same AC2 "0 input" bar) while the design contract (3, exactly 3, headline slots)
stays intact.

#### 1.2c — measured character budget per slot (R2)

The premise "3 short numeric slots, no stacking needed" (an earlier draft's §1.3) does
not survive H2's real content (Sacha D2.2.3): `NON DÉCLENCHÉE` (14 chars), `PERDUE`
(6 chars), `INTERROMPUE — intégrité 78 %` (29 chars, worst realistic case at 2-digit
percent), `RÉUSSIE — intégrité 100 %` (25 chars), `—` (1 char, no delivery authored).
H1 (`SCORE FINAL`, an integer, signed per D2.5.3 — worst case ~7 chars incl. sign) and
H3 (`DÉGÂTS`, `x,xx ♥`, ≤6 chars on the quarter-heart step) both stay short; **H2 alone**
needs the budget.

**Ruling:**

1. **Per-slot character budget, measured, not eyeballed:** at real mobile-landscape
   width (ADR-0003 viewport set) and the shipped `--font-mono`/`--font-display` stack,
   `dev-r3f-render` captures the rendered width of H2's worst case (`INTERROMPUE —
intégrité 100 %`, the longest string across all 5 issues) at the headline row's font
   size. **Two outcomes, both pre-specified so no guessing happens at implementation
   time:**
   - **Fits on one line within the slot width** (i.e. the 3-column layout has enough
     room once H2's column is widened relative to H1/H3, per the mockup above) → ship
     the layout as drawn, H2 column wider, H1/H3 unchanged.
   - **Doesn't fit** → H2's value **wraps to 2 lines inside its own slot** (label line +
     value line, e.g. `INTERROMPUE` / `— 78 %`), never shrinks below the project's
     existing minimum legible body size, and never truncates silently. Truncation
     (`INTERROMPUE — i…`) and shrinking under the readability floor are **both
     forbidden** — a broken-off word or a squint-to-read percentage fails "glance-
     legibility" as hard as it fails accessibility.
   - If **neither** clears the readability floor even wrapped, `dev-r3f-render` requests
     abbreviated forms from Sacha (her ruling in the gate: she supplies them on
     request) — e.g. `INT. — 78%`. This is the fallback of last resort, not the default
     plan.
2. **A measured screenshot capture is the acceptance artifact**, not a full new mockup:
   one screenshot per worst-case string, at the mobile-landscape viewport, is sufficient
   evidence for stage 5 (`ux-designer` review) — no additional design-loop round needed.
3. **Desktop is not the constraint** (more width available) — the mobile-landscape
   measurement is the binding case; if it clears, desktop clears trivially.

### 1.3 Desktop vs mobile — same structure, different density (ADR-0003 posture)

No device fork is needed at the _layout_ level — this is not a controls-copy question
(ADR-0015 territory), it is a responsive-density one:

- **Desktop** (mouse, hover available): headline row as 3 side-by-side columns, H2's
  column widened per §1.2c's measured budget; detail panel, when open, can render as a
  small 2-column grid (2 of the remaining stats per row) since desktop has vertical room
  and no thumb-reach constraint.
- **Mobile landscape** (this game is landscape-only per `RotateOverlay`, ADR-0003): the
  3-column headline row still holds **one row**, but is **not** assumed to be "3 short
  numeric slots" (that premise is withdrawn, R2 — see §1.2c for the measured budget and
  H2's wrap rule). The detail panel, when open, stacks **one stat per row**
  (single column) rather than desktop's 2-column grid, because mobile landscape height
  is the scarce axis here, not width, and a cramped 2-column grid risks sub-44px rows
  once padding is added (see 2.3). This is the one deliberate per-device layout delta in
  this spec; everything else — including the end-cause subhead (§1.2) — is identical
  across devices.

### 1.4 The single non-closing controls block (amended, R1 — replaces the earlier stopPropagation-only ruling)

Today `EndScreen`'s whole `Overlay` fires `onRestart` on click — safe, because nothing
else on the screen is interactive. Adding interactive rows (detail toggle, export
button, the open detail panel, the clipboard-fallback `<textarea>`) inside that same
overlay creates a real hazard, and a bare `stopPropagation` on the two buttons only
half-closes it: it stops a click **on** a control from dismissing, but does nothing for
a tap that **misses** a control by a few px and lands on the overlay background right
next to it — exactly the near-miss the gate's D3.5.2 clause protects against (a rough
mobile thumb should not cost the player the detail view or the export).

**Ruling (R1):** the end-cause subhead, headline row, detail toggle, the open detail
panel (when expanded), the export button, and the clipboard-fallback `<textarea>` (when
shown) all live inside **one single non-closing controls block** — a single rectangular
region, sized to its content plus **≥24px of inert padding on all four sides** (roughly
half a 44px touch target: the realistic thumb-miss margin, pinned as a testable value,
and capped so it doesn't eat the closing surface on mobile landscape where vertical
space is already the scarce axis, §1.3). **Any input landing anywhere inside this
block — on a control or in its inert padding — does not reach `onRestart`.** Only input
outside the block (background, title, label, the existing dismiss prompt line) fires
the dismiss-to-menu behaviour, unchanged from today. This satisfies all three of
Sacha's D3.5 sub-clauses: D3.5.1 (a control activation never also dismisses), D3.5.2
(a near-miss tap never dismisses either), D3.5.3 (opening the detail doesn't re-arm
dismissal — the block's boundary doesn't move when the panel opens, it only grows
downward with it).

The mechanism (`stopPropagation`, a hit-test on a bounding rect, or otherwise) is
`dev-r3f-render`'s implementation choice — this spec fixes the **behavioural contract**
(one block, ≥24px inert padding, nothing inside it reaches the dismiss handler), per the
gate's T2 ruling. Amended AC below (§5, A7).

---

## 2. "COPIER MON RAPPORT" — placement, copy, feedback, fallback

### 2.1 Placement and label

Own row, positioned **after** the detail toggle and **before** the dismiss prompt (§1.2)
— so it reads as "here's your stuff, want to keep more? here's how to leave" in
top-to-bottom order, matching the fanzine "byline" precedent already gated in
`spec-menus-ui-completion.md` (a player-facing artifact-of-record, not a settings
control).

**Proposed label (strawman for Yasmine):** `[ COPIER MON RAPPORT ]` — square-bracket
button-glyph convention matches the existing `[ CLIQUER POUR RETOURNER AU MENU ]` and
`OPTIONS`/`PAUSE` action-button house style already in the codebase. "Rapport" reads
in-fiction as a police/journalist report — fits the fanzine/tabloid register
(`PARIS-MINUIT`) without requiring new art. Yasmine may retune wording; the _shape_
(bracketed, one line, verb+object, imperative) should hold for house-style consistency.

### 2.2 Feedback after copy (success path)

A silent copy is a broken promise (COLLABORATION-adjacent principle: every toggle/
action is a promise). On successful `navigator.clipboard.writeText()`:

- The button's own label swaps in place, no layout shift, no modal:
  `[ COPIER MON RAPPORT ]` → `[ ✓ RAPPORT COPIÉ ]` for **2.5s**, then reverts.
- This is a **text swap**, not a toast/snackbar — no new UI primitive, no risk of
  overlapping the fixed-position dismiss prompt below it, no z-index question.
- `aria-live="polite"` on the button's accessible name (or a visually-hidden sibling
  span announcing "Rapport copié dans le presse-papier") so a screen-reader user gets
  the confirmation without needing focus to move — the visual swap alone is invisible
  to assistive tech (same class of gap `spec-menus-ui-completion.md` flagged for the
  CRT/options toggles; do not repeat it here).
- **Reduced motion:** the swap is a discrete text change, not an animation — no
  fade/slide needed, so `prefers-reduced-motion` requires no special-case here (unlike
  the detail-panel reveal, §3.3).

### 2.3 Touch target and desktop parity

Minimum **44×44px** hit area (WCAG 2.5.5 AAA / iOS HIG minimum, already the project's
implicit bar per existing `spec-*` touch-target language) — the button's visible text
may be smaller, but its clickable/tappable box must clear 44px on the shorter axis on
both device classes, not just mobile. Same control, same markup, both devices — no
ADR-0015-style fork needed since there is no gesture-vocabulary difference (a tap and a
click are the same "activate" affordance here, unlike the two-finger-shoot case).

### 2.4 Fallback when clipboard write fails (AC5)

`navigator.clipboard.writeText()` can reject (permission denied, insecure context,
unsupported browser — non-HTTPS `file://` preview builds are a realistic case here
given the project's own `scripts/screenshot-preview.mjs` local-file workflows).

**Decision — never a silent no-op, never a thrown/uncaught error, never a network
fallback (AC4 forbids network entirely):**

1. On rejection, the button's row expands **in place** (same accordion mechanism as the
   detail panel, §3) to reveal a **read-only, pre-selected `<textarea>`** containing the
   exact JSON payload.
2. Label swaps to `[ ⚠ COPIE AUTO INDISPONIBLE — SÉLECTIONNE ET COPIE (⌘/CTRL+C) ]` (or
   mobile-appropriate wording — see below) instead of the success confirmation.
3. The `<textarea>` auto-selects its full content on reveal (`element.select()`) so a
   desktop user's next real keypress is already `⌘/Ctrl+C`, and a mobile user gets the
   native "Select All / Copy" context menu on tap-and-hold with the selection
   pre-primed.
4. **Device wording split (ADR-0015 precedent applied, not re-litigated):** desktop
   fallback copy says `(⌘/CTRL+C)`; mobile fallback copy says `(sélectionne le texte et
copie-le)` — no keyboard-shortcut text on a device with no keyboard. This is the one
   place in this spec that needs the same device-aware copy discipline ADR-0015 set for
   the tutorial; flagging for `narrative-designer`/dev to keep both strings in sync the
   way ADR-0015 D1 keeps its two scripts in sync.
5. This state is **recoverable**, not terminal — the textarea stays visible and
   selectable indefinitely; the player is never stuck or blocked from dismissing to menu
   (the dismiss prompt below still works — the fallback textarea joins the single
   non-closing controls block defined in §1.4, so it never accidentally dismisses
   either, and the rest of the overlay outside that block still dismisses as today).

---

## 3. Detail panel — interaction, touch target, reduced motion

### 3.1 Trigger and content (AC3) — amended, R3: 7 lines, headline metrics included

**Withdrawn:** this section originally read "strictly additive, never a duplicate
re-list of the headline row." The gate overruled that framing — Sacha's spec (D3.1,
D3.2) requires the detail to be **complete and self-standing** (it's the block a
playtester reads aloud or pastes verbatim), and the story's AC3 pins **all 5 v1
counters in the detail**, which the "additive-only" reading violated literally by
implying only 2 non-headline rows. Ruling: **Sacha's content and order win, without
reserve.**

`[ ▾ DÉTAIL DE LA COURSE ]` (chevron flips to `▴` when open) reveals **exactly 7 lines**,
in this imposed order — the loop's 3 verbs, then the meta lines (Sacha D3.1):

| #   | Line                  | Content                                                                | Relation to headline row                                                   |
| --- | --------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | `RÉCUPÉRER — Caisses` | `n / m`, or `—` if the level authors no crates                         | not a headline metric — new here                                           |
| 2   | `LIVRER — Livraison`  | issue + `intégrité NN %` (§2.2.3)                                      | **repeats H2**                                                             |
| 3   | `ÉVITER — Dégâts`     | `x ♥` + `(dont y ♥ de fautes)` when `y > 0`                            | **repeats H3**                                                             |
| 4   | Durée de jeu          | `t,t s`, labelled "temps de jeu effectif (hors pause et cinématiques)" | not a headline metric — new here                                           |
| 5   | Score final           | signed integer                                                         | **repeats H1**                                                             |
| 6   | Fin de run            | one of the 5 causes (D2.6.1)                                           | **repeats the §1.2 subhead** (R5) — same string, same vocabulary           |
| 7   | Vague                 | integer                                                                | not a headline metric — non-regression carry-over from today's screen (R4) |

Lines 2, 3, 5 **intentionally duplicate** the headline row and line 6 **intentionally
duplicates** the §1.2 end-cause subhead — this is by design (D3.2, R5's "autoportant"
requirement), not a bug a future pass should "deduplicate." The mapping is fixed by
Sacha's gated spec, not by the 3-metric choice at large (that choice is already made:
H1/H2/H3, D1.1) — there is no remaining "downstream of Sacha's choice" ambiguity in
this section.

### 3.2 Interaction and touch target

- Single tap/click toggles open/closed — no double-tap, no long-press, no swipe
  gesture (keeps parity with every other disclosure control in the codebase, e.g.
  `OptionsColophon` rows).
- **Hit area ≥44×44px** on both device classes (§2.3's bar applies identically here).
- `aria-expanded={open}` and `aria-controls` pointing at the panel's id — standard
  disclosure-widget semantics, screen-reader-legible open/closed state (the gap
  `spec-menus-ui-completion.md` flagged on `OptionsColophon`/`PauseScreen` toggles is
  the reason this is stated explicitly here rather than assumed).
- Keyboard: focusable, `Enter`/`Space` toggles (native `<button>` semantics give this for
  free — no custom `div onClick` widget, same lesson already applied to `NAME_ENTRY`'s
  real `<input>` decision in `spec-menus-ui-completion.md`).

### 3.3 Reduced motion

Default: the panel reveal may use a short height/opacity transition (a `lead-art`
polish call, not specced here). Under `prefers-reduced-motion: reduce` (already read
live in 7 render files per the audit in `spec-menus-ui-completion.md` item 2b): the
panel **must** snap open/closed with no transition — instant show/hide, respecting the
project's existing reduced-motion posture. No new preference needed here; this reuses
the existing OS-media-query mechanism already wired project-wide. (If/when a persisted
in-app `reducedMotion` toggle ships per that spec's open item, this panel inherits it
automatically — no separate wiring.)

---

## 4. The funnel — visible or purely internal?

**Decision: purely internal in v1. Not surfaced to the player anywhere in this screen
or elsewhere.**

Rationale:

- The story's own hand-off note frames the funnel as "playtest instrumentation... may
  not [need] in-fiction flavor text — this can be a diagnostic overlay, not necessarily
  in-fiction" and explicitly rules out any reward/progression hookup this cycle ("the
  funnel is read-only instrumentation, not a reward mechanic, in this story" — Scope
  OUT). A visible funnel UI is, by definition, either an achievements-adjacent
  progression surface (out of scope) or a second stats display competing with the
  3-headline-metric rule (AC2) for attention on the one screen guidelines §5 protects
  hardest.
- **Cahier des charges check:** Prohibition (Atari ST, 1987) had no funnel/milestone UI
  of any kind — a purely-internal funnel needs no extension justification at all; it's
  invisible instrumentation, same trust tier as the existing OS-media-query reduced-
  motion read. A _visible_ funnel would be the extension, and this story's own OUT list
  already forecloses the progression framing that would justify one.
- Its **only** consumer in this story is the export payload (§AC4: funnel state ships
  inside the "copier mon rapport" JSON) — so Bertrand-the-playtester still gets full
  visibility, just via the export he already asked for, not via a new always-on screen
  element competing with the run's actual result.
- If a future story wants to surface milestones as an in-fiction reward (e.g. a
  "vous avez atteint Belliard" flyer stamp), that is new scope with its own design loop
  — not implied here, mirroring the story's own escalation language for the Sprint-4
  high-score risk.

**One open question flagged to `lead-game-designer`/`pm`:** should the _first-ever_ run
after reaching a brand-new funnel milestone (e.g. very first delivery ever) get any
in-the-moment signal at all, even a non-visual one (e.g. included as a one-line note in
the exported JSON's structure, `"newMilestonesThisRun": [...]`, still invisible in the
UI)? I'd default to **no** — YAGNI, keep the funnel silent end-to-end in v1, add the
export-diff field only if Bertrand-as-playtester actually asks for "what changed since
last time I copied" — but flagging since it sits exactly on the seam between my lane
(is it shown) and game-designer's (does an event deserve a moment).

---

## 5. Accessibility summary (consolidated acceptance checklist)

| #   | Requirement                                                                                                                                                                                                                                                                                              | Verifiable check                                                                                                                                                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Headline row (3 metrics: `SCORE FINAL`/`LIVRAISON`/`DÉGÂTS`) has no extra tap/click to see                                                                                                                                                                                                               | e2e: on `GAME_OVER`/`LEVEL_COMPLETE` render, all 3 metric values are in the DOM and visually within the initial viewport, no `aria-hidden`/`display:none` gating them; H2's value matches one of Sacha's 5 issue strings (D2.2.3).                                                                                                                                            |
| A2  | Detail toggle: `aria-expanded`, `aria-controls`, native `<button>`; open state reveals exactly the 7 lines of §3.1 in order, headline values (H1/H2/H3) repeated verbatim in lines 5/2/3                                                                                                                 | e2e: assert attribute presence + value flips on toggle; keyboard `Enter`/`Space` fires the same handler as click; line-by-line text comparison against §3.1's table.                                                                                                                                                                                                          |
| A3  | Detail toggle + export button hit area ≥44×44px, both device classes                                                                                                                                                                                                                                     | e2e: computed bounding box height/width ≥44px at both a desktop and a mobile-landscape viewport (ADR-0003 viewport set).                                                                                                                                                                                                                                                      |
| A4  | Export success feedback is screen-reader-legible, not visual-only                                                                                                                                                                                                                                        | e2e/manual: `aria-live="polite"` region (or equivalent) announces "Rapport copié..." on success; visual label swap is not the sole channel.                                                                                                                                                                                                                                   |
| A5  | Export fallback (AC5) is never silent, never throws, always recoverable                                                                                                                                                                                                                                  | e2e: mock `clipboard.writeText` rejection → assert `<textarea>` appears, pre-selected, with device-correct copy instruction, no console error, no crash.                                                                                                                                                                                                                      |
| A6  | Detail panel reveal respects `prefers-reduced-motion: reduce`                                                                                                                                                                                                                                            | e2e/manual: with the media query forced, panel open/close has zero transition duration (instant), matching the existing project-wide reduced-motion posture.                                                                                                                                                                                                                  |
| A7  | Amended (R1) — no input landing anywhere inside the single non-closing controls block (§1.4) reaches `onRestart`, **including a tap in the block's ≥24px inert padding that misses every control**                                                                                                       | e2e, both device classes: (a) click/tap each control directly, assert dismiss did NOT fire; (b) click/tap a point inside the block's padding margin but outside any control's own hit box, assert dismiss did NOT fire; (c) click/tap outside the block entirely, assert dismiss DID fire. (c) must still pass — the block narrows the dismiss surface, it doesn't remove it. |
| A8  | Funnel state is never rendered as UI in this story                                                                                                                                                                                                                                                       | code/e2e: no funnel-milestone text/icon/progress element anywhere in `EndScreen` or its detail panel; funnel data only appears inside the exported JSON string; no `newMilestonesThisRun`-shaped field anywhere (T1, ratified).                                                                                                                                               |
| A9  | Contrast — new rows reuse existing `EndScreen` ink/stock tokens, no new hardcoded colour                                                                                                                                                                                                                 | code review: `.headlineRow`, `.endCause`, `.detailToggle`, `.exportButton` classes consume `var(--ink-*)`/`var(--stock-*)` tokens already used by `.score`/`.prompt`, no new hex; the end-cause line carries no outcome-based colour-coding (neutral copy, gate Q7).                                                                                                          |
| A10 | Focus order: end-cause subhead (non-interactive) → headline row (non-interactive) → detail toggle → detail panel content (if open) → export button → (fallback textarea, if shown) → dismiss prompt (whole-overlay, last in DOM order or given an explicit low tabindex if it must stay clickable-first) | e2e: `Tab` sequence matches this order; no focus trap, `Escape` does not need to do anything special here (unlike `NAME_ENTRY`/`NarrativeScreen`'s scripted `Escape` handling — this screen has no modal semantics to escape from).                                                                                                                                           |
| A11 | (New, R5) End-of-run cause is legible at 0 input on both `GAME_OVER` and `LEVEL_COMPLETE`, and never occupies one of the 3 headline slots                                                                                                                                                                | e2e: on render, the `.endCause` element is present and non-empty in the DOM at both phases, positioned outside `.headlineRow`'s 3 children; headline row still contains exactly 3 children.                                                                                                                                                                                   |
| A12 | (New, R2) H2's worst-case string (`INTERROMPUE — intégrité 100 %`-length content) never truncates and never drops below the project's minimum legible body size, on mobile landscape                                                                                                                     | manual, measured: screenshot capture at the mobile-landscape viewport with H2 forced to its longest string; visually verify no ellipsis/clip and font-size matches the rest of the headline row (or the specified 2-line wrap, §1.2c).                                                                                                                                        |

---

## 6. What this spec does NOT decide (explicitly handed off)

- **Which 3 counters are headline, and their exact units/rounding** — `game-designer`
  (Sacha), `spec-run-stats.md` D1.1/§2 (gated).
- **Visual register** — exact type/weight/colour treatment of the headline row,
  end-cause subhead, detail panel chrome, button styling, any fanzine framing device
  (stamp, torn-edge, etc.) — `lead-art` (Nico), applied on top of this spec's
  hierarchy/hit-area/flow rules. The single ruled constraint art must respect: the
  end-cause line stays typographically subordinate and never colour-codes by outcome
  (§1.2a, gate Q7).
- **Exact copy** — button label, fallback instruction strings, the 5 cause strings, any
  in-fiction framing of "the report" — strawman given above for `narrative-designer`
  (Yasmine) to adjust; the gate's Q7 ruling already fixes this as **neutral,
  out-of-fiction diagnostic copy**, not a fanzine-voiced round, so Yasmine is **not**
  engaged this cycle. The _shape_ (bracketed one-liner, device-aware fallback split)
  should hold if that ever changes.
- **JSON payload shape** — field names/structure of the exported report — `dev-gameplay`/
  `senior-architect` implementation detail, out of UX lane; this spec only requires that
  its presence in the DOM (via the fallback textarea) is exact and complete, and that
  its **existence** as a copy-target is legible to the player. Content of the payload
  (what it must contain, D3.6) is Sacha's; excluding `muf_player_name` (gate advisory A1)
  is `senior-architect`'s pin to enforce.
- **The measured character-budget capture itself (§1.2c)** — a screenshot artifact
  `dev-r3f-render` produces once H2's real strings are wired; this spec fixes the
  decision tree (fits / wraps / needs Sacha's abbreviated forms), not the pixel result.

---

## Gate resolution log (2026-07-30 — superseded the prior "Open questions" section)

All three items previously flagged to the `lead-game-designer` gate were ruled;
resolutions transcribed above, logged here for traceability:

1. **Funnel visibility (§4) — T1, CONFIRMED.** Purely internal, v1, end-to-end,
   including the export: no `newMilestonesThisRun` field. Re-open only on Bertrand's
   explicit request, not preemptively (A8, A12 verify this stays true).
2. **Full-screen dismiss + control interaction (§1.4) — T2, CONFIRMED as spec, amended
   to R1.** The gate agreed this is a behavioural requirement, not implementation
   overreach — and _strengthened_ it: a bare `stopPropagation` on the two buttons was
   found to satisfy only 2 of Sacha's 3 D3.5 sub-clauses (it missed the near-miss case,
   D3.5.2). The ruling replaces it with the single non-closing controls block
   (≥24px inert padding) specified in §1.4 above.
3. **Mobile detail-panel density (§1.3) — T3, split verdict.** The 1-column mobile
   stacking is **accepted without a measured mock** (unchanged from the original spec).
   The headline row's "3 short numeric slots" premise, however, was **rejected without a
   measurement** — it doesn't survive H2's real content — and is replaced by the
   measured character-budget process in §1.2c (R2).
