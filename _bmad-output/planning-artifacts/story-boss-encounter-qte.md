# Story — Boss / mini-boss encounter (cinematic QTE set-piece)

**Epic:** veille concurrentielle 2026-07-18 (`docs/game-design/veille-concurrentielle-shooters.md`
§3 Tier A, idea #6) · **Sequence:** direct-build, jumped ahead of the normal roadmap order on
Bertrand's explicit instruction ("peu importe, regarde la veille et étudie si ça colle") · **Type:**
new cinematic QTE set-piece, extends the existing QTE architecture (ADR-0030/ADR-0034),
cross-boundary (game + hooks + render).

## Why

Every existing target in muf is read-and-react in a few seconds; nothing tests **sustained**
mastery of the skills the player has already built (discrimination, reflex duel, precision under
pressure). Time Crisis / House of the Dead solve this with a boss whose weak points are
**sequenced**, not always-on: "un chef de brigade protégé, vulnérable seulement quand il ouvre le
feu" (veille §3 idea #6) — a set-piece capstone, not a new skill to learn.

Two things make this a considered "why", not just a cool feature:

- It fills a real gap rather than decorating one. `PROJECT_GUIDELINES.md` §7 already scopes a
  **"Niveau Final — 31 décembre 1999… flics débordés"** — currently a mood, not a mechanical
  climax. A boss QTE is a legitimate candidate to give that already-planned finale an actual beat,
  rather than being scope creep invented from nothing (see Open Question 4 — where it lands first
  is still undecided, but the *need* for a climax is already canon).
- It is a distinct product from the hostage QTE, not a reskin. The hostage duel (ADR-0030/0034) is
  an explicit **side objective** — it never advances the kill quota. The veille frames a "boss de
  livraison" as tied to `Récupérer → Livrer`, i.e. plausibly a **required** beat that gates
  completing something. That is a real fork in stakes design, and I am flagging it rather than
  quietly picking one (Open Question 1).

## Cahier des charges check

> "Did Prohibition Atari ST have a boss?"

**No** (confirmed by the veille itself, §1: "Ce que l'original n'avait pas… boss"). **[EXTENSION]**
— conscious, same class and same documentation standard as the hostage-taker QTE (ADR-0030):
explicitly requested by Bertrand, justified against the loop, recorded in an ADR before any code
lands.

- `Éviter` — untouched; nothing new to discriminate, the boss doesn't widen the target-reading
  rule.
- `Récupérer` / `Livrer` — this is where the feature actually plugs in, and exactly how (gate vs.
  bonus) is Open Question 1, not decided by this story.
- Anti-"bullshit death" guardrail (§5.6, already load-bearing on the hostage QTE): "vulnerable only
  when he opens fire" **must be a readable, telegraphed tell**, not a guess the player has to
  memorise blind — this is the design loop's job to prove (mirrors ADR-0034's G4/G5 telegraph
  floors), not an assumption this story makes.

## Scope decision (V1) — what I am choosing to build now, and what I am deliberately not bundling

**IN:**

- **One** dedicated boss archetype, **one** scripted encounter, reusing the ADR-0030/ADR-0034
  architecture wholesale: freeze the rest of the level, scripted trigger, progressive-zoom camera
  holding on an anchor, forward-only phase machine (`ZOOMING → ACTIVE → WON|LOST → DONE`), the
  `energy` stat (ADR-0004 D5) as outcome currency, once per level. This is an **EXTEND**, not a
  **REINVENT** — no new orchestration primitive from scratch (see Architecture directive below).
- A sequenced-vulnerability rule, narratively distinct from the hostage's peek-duel (a "chef de
  brigade", not a kidnapper) but free to reuse the same `COVERED`/exposed state-machine **shape**
  if `game-designer` judges it fits (boss "opens fire" = exposed window; "protected" = covered) —
  the exact mechanic is explicitly `game-designer`'s call at the design gate (Open Question 2), not
  frozen here.
- A graded, multi-hit resolution for the boss (unlike the hostage duel, which ADR-0034 Rev. 4 made
  **binary** — one clean head-shot). A boss taking several weighted hits to go down is a deliberate,
  different product call this story makes — it matches the House of the Dead reference and gives a
  boss more weight than a single-shot duel would. Magnitudes stay `game-designer`'s.

**OUT of V1 (explicitly deferred, not silently dropped):**

- The **"fuyard"** variant named in the *same* veille Tier A #6 entry (indic/voleur qui traverse la
  foule — s'échapper = récup perdue, branché sur `Récupérer`). Different mechanic shape entirely
  (a live street-traversal escape clock, not a frozen cinematic duel). Bundling it here would break
  the one-variable-at-a-time discipline every QTE story before this one followed (each of
  ADR-0034's five revisions shipped exactly one lever). If the boss lands well, the fuyard is a
  natural **follow-up story**, not a parallel deliverable in this one.
- **A distinct, lesser "mini-boss" tier** (more frequent, cheaper, mid-level pop-ins). This story
  scopes exactly **one** boss-tier encounter. Whether a mini-boss tier exists at all, and how many
  total encounters the game ships, is Open Question 3 — a pacing/production-cost call for
  `lead-game-designer` + `pm` jointly, once design proposes options. Not pre-committed here, so the
  story doesn't quietly multiply into "N bosses" mid-build.
- Any new player verb, weapon, or UI beyond what the existing QTE shell already provides. In
  particular, whether the boss's HP surfaces as a HUD element or stays diegetic is a **fresh** call
  (Open Question 6) — it must not silently inherit ADR-0034 Rev. 4's "no HUD bar, diegetic pips"
  ruling for the hostage, since that ruling was made for a binary duel that no longer has an HP bar
  at all; a boss that DOES have HP is a different case.
- Re-tuning the hostage QTE to match the boss, or vice versa. DRY applies to the **shell**
  (freeze/zoom/phase machine), not to each QTE's specific vulnerability/damage rules — two QTE
  flavours are allowed to diverge.

## Open questions — for the design loop to resolve, not pre-decided here

Handed to `lead-game-designer` (gate owner) + `game-designer` (mechanic/tuning) +
`narrative-designer` (fiction) + `ux-designer` (any HP/health-read surface):

1. **Required gate or optional set-piece?** Is the boss a mandatory beat the player must clear to
   finish the level/run it's placed in (the veille's "boss de livraison" reading, tied to
   `Livrer`), or an optional dramatic moment like the hostage QTE (never advances the kill quota)?
   This changes the stakes model and the `energy`-ledger design. I lean toward "required, tied to
   `Livrer`" reading the veille closely, but I am not deciding it here — it needs a design-gate
   ruling.
2. **The vulnerability-window mechanic.** "Vulnerable only when he opens fire" — a literal reuse of
   the hostage's `COVERED`/`PEEKING` shape re-themed, or a genuinely new pattern (several sequenced
   attack phases, a weak point that relocates)? `game-designer`'s call.
3. **Boss vs. mini-boss — how many, where.** Exactly one boss (finale only), a boss per zone (one
   per recruitable contact?), or a boss plus several cheaper mini-boss pop-ins? Real production
   cost (art, tuning, ADR count) attached to this number — `lead-game-designer` + `pm` own it
   jointly once design proposes options.
4. **Where does it live first — Belliard (engineering-velocity precedent, like every prior QTE) or
   the finale level (the narratively correct home per §7's Niveau Final)?** Every prior QTE rolled
   out Belliard-first for iteration speed, then generalised. A "chef de brigade" authority figure
   may read wrong on the test level. `narrative-designer` + `senior-architect` to weigh in; I
   default to Belliard-first (de-risks the build, matches precedent) unless there's a strong
   narrative argument against it.
5. **Fiction.** Who is "le chef de brigade" in the 1998 Paris rave underground — a corrupt BAC
   commander, an RG chief, a syndic protecting the club circuit? What's his stated link to the
   already-scoped antagonist roster (§7: BAC de nuit / RG en civil)? Singular and named, or a title
   reused per level? `narrative-designer`'s to author — he must **extend** the existing roster, not
   fork a third, unrelated faction.
6. **HP read.** Given the boss keeps a multi-hit HP bar (unlike the now-binary hostage duel), does
   that surface as a HUD element or stay diegetic (in-world pips / visible damage on the sprite)?
   `ux-designer`'s call, made fresh for this feature — not inherited from ADR-0034 Rev. 4's ruling
   for the hostage (that ruling was about a binary duel with no HP bar at all).

## Architecture directive (binding on the tech-plan stage, not a suggestion)

At TECH PLAN, `senior-architect` is instructed to treat ADR-0030 (the freeze / zoom / phase-machine
shell) and ADR-0034 (the sequenced-vulnerability precedent, its determinism law for any wandering
target, the `energy`-ledger currency, and the "diegetic read is the default, HUD needs its own
ruling" convention) as the load-bearing precedent for this feature's contract — the same discipline
that turned five successive playtest corrections into ADR-0034 *revisions* of one contract, rather
than five competing designs. Expect a new `bossQteSystem.ts` (or an extension of the existing
`qteSystem.ts`, if the architect judges the shapes close enough to share code). Reinventing the
freeze/zoom/phase-machine primitive from scratch is out of scope and would be a story-level scope
violation, not a legitimate technical choice.

## Acceptance criteria (PM-level — gate the scope, not the mechanic; the design loop owns its own
detailed ACs at its gate, per the ADR-0034 precedent)

| # | Criterion |
| --- | --- |
| AC1 | The gated design spec explicitly answers Open Questions 1–3 before any dev lane starts. A spec silent on these is a design-gate FAIL, not a `pm`-review surprise later. |
| AC2 | The build reuses the ADR-0030/ADR-0034 freeze + zoom + phase-machine shell; `senior-architect`'s tech plan states which parts are reused verbatim vs. newly authored, mirroring the ADR-0034 revision-log discipline. |
| AC3 | Exactly one boss-tier encounter ships in V1 — no silent multiplication into several bosses without an explicit, gated decision per Open Question 3. |
| AC4 | The "fuyard" variant is **not** built as part of this story. |
| AC5 | An ADR is merged documenting the conscious extension (cahier des charges test), the architecture reuse, and the resolution of Open Questions 1, 2 and 6 — following the ADR-0030/0034 documentation standard. |
| AC6 | Fiction is authored by `narrative-designer` and traces to the existing antagonist roster (§7) rather than inventing an unrelated faction. |
| AC7 | `pm` re-reviews the gated spec at ACCEPT (this story's own review, before `senior-architect` cuts dev lanes) to confirm the resolved Open Questions still respect the scope decisions above — no drift into mini-boss multiplication or new-verb creep. |

## File map (indicative only — `senior-architect` owns the real lane cut at TECH PLAN)

| Lane | Likely touch | Note |
| --- | --- | --- |
| `dev-gameplay` | `src/game/types/bossQte.ts` (new, mirrors `hostageQte.ts`), `src/game/systems/bossQteSystem.ts` (new, or an extension of `qteSystem.ts`) | Pure logic — phase machine, HP resolution, vulnerability windows. Zero React/Three. |
| `dev-gameplay` | `src/game/levels/levels.ts` | New `bossQteSpec` per authored level, additive/optional field — mirrors `hostageQte` gating. |
| `dev-r3f-render` | `src/render/scene/BossQte*.tsx` (new) | Draws the tableau, exposed/protected poses, HP read (bar or diegetic per Open Q6). Logic-free. |
| `src/hooks` (architect-assigned) | `src/hooks/useGameLoop.ts` | Extends the existing zoom/freeze bridge — serialise with any concurrent QTE work. |
| `dev-tooling-assets` | new FLUX prompt family | Boss sprite poses (protected / exposed / hit / defeated), once fiction (Open Q5) is authored. |
| `senior-architect` | `docs/adr/` | New ADR for the boss QTE contract, per AC5. |

## Out of scope (V1)

- The "fuyard" street-escape variant (see Scope decision — deferred, not this story).
- A distinct mini-boss tier or any specific total encounter count (Open Question 3, undecided).
- Any HUD/UI surface beyond what the QTE shell already provides, pending Open Question 6.
- Re-tuning the hostage QTE (ADR-0034) to match this feature, or vice versa.
- Any new player verb or control scheme.

## Definition of Done (story-level, pre-dev)

- [ ] Design loop run: `game-designer` + `narrative-designer` (+ `ux-designer` if an HP-read
      surface is proposed) specs delivered on non-overlapping deliverables.
- [ ] `lead-game-designer` design gate: PASS or PASS-WITH-CORRECTIONS logged with a `VERDICT:`
      line.
- [ ] Open Questions 1–6 all explicitly answered in the gated spec — not silently assumed.
- [ ] `pm` re-review of the gated spec against this story's scope decisions (AC7).
- [ ] `senior-architect` TECH PLAN: ADR drafted, lanes cut, ADR-0030/0034 shell reuse confirmed
      (AC2, AC5).
- [ ] Hand-off logged in `docs/handoffs/story-boss-encounter-qte.md`, indexed in
      `docs/agent-handoffs.md`.
