# Hand-offs — story-boss-belliard-live

Le Commandant, live on Rue Belliard (normal-play boss gate), shipped DECOUPLED behind a flag.
Story: `_bmad-output/planning-artifacts/story-boss-belliard-live.md`.

## §1 — `lead-game-designer` (Karim): FICTION GATE VERDICT + (A)/(B) narrative call — 2026-07-21

**Deliverable gated:** `docs/game-design/spec-boss-belliard-fiction.md` (DRAFT).

**VERDICT: PASS-WITH-CORRECTIONS.**

Gate legs:

- **Scope ([EXTENSION]):** placement/fiction reconciliation of an already-ratified antagonist, no new
  faction — the Commandant stays the BAC-de-nuit apex (§7). Cover-prop-not-armour respects the lead-art
  canon that his bare-headed silhouette IS his read-differentiation from `enemy_riot`. PASS.
- **Coherence — ratified Commandant identity (`spec-boss-encounter-fiction.md`):** no contradiction with
  his WHO. The Belliard exposure justification (§1.2: holds the `porte cochère` chokepoint by choice,
  covered, fires in bursts) is a DIFFERENT diegetic reason from the finale's "flics débordés" — and that
  is a feature, not a conflict: Belliard = in control (blocks a door in person), finale = desperate
  (overwhelmed, no one to cover him). Two motivations for the same mechanical exposure, coherent, and
  they arc. PASS.
- **Voice / period:** DISPATCH-terse / KENZA-savvy / MUF-laconic held; 1998 register, francs, no
  smartphone vocab. Loss line names the CAUSE ("trop d'ouvertures manquées") — anti-"mort bullshit"
  compliant, maps to the blown-window clock. PASS.

### The (A)/(B) call — delegated in §1.3

**RULING: (A) — "première passe, pas la dernière." Belliard is the FIRST confrontation; the Niveau
Final remains the culmination (he returns, débordé).**

**Why (A), and why (B) is foreclosed:** the choice is not open on the merits — it is settled by gated
canon. The **Niveau Final live-ship** (`spec-boss-niveau-final-level.md` + `spec-niveau-final-fiction.md`,
PASSED 2026-07-20, README) already ships le Commandant **as canon at the finale** with his `final_pre`/
`final_post` scenes. Option (B) ("Belliard = son unique scène en V1", amend `spec-boss-encounter-fiction`
§1.3 to drop the finale as exclusive foyer) would **contradict a previously-gated spec that is already
building**. One contradictory spec fails the set — so (B) is out. (A) is the only reading coherent with
the whole: the finale keeps its ratified role as the narrative foyer where "débordé donc à découvert" is
strongest; Belliard becomes the first, in-control encounter of a **recurring nemesis**. This also
resolves the earlier §3.2 constraint ("le final n'existe pas encore") — it now does.

The earlier narrative recommendation (placeholder-on-Belliard, canon-reserved-to-finale) is superseded
by Bertrand's "Belliard first" decision (live story) + the now-built finale. Both encounters are canon;
neither is a placeholder.

**Corrections (narrative fold-in):**

- **K-1 (recurrence must READ — protects finale primacy):** because (A) makes him recurring, the
  Belliard WIN copy must NOT read as a definitive death, or it steals the finale's payoff. Current §3
  ("Il est à terre. La caisse passe." + KENZA "d'autres vont rappliquer") is already "down, not dead"
  and serviceable — but it is register-identical to the finale's "À terre. Ses hommes l'ont pas vu
  tomber." Differentiate the two beats so the arc lands: **Belliard = repoussé-this-door / il se relève
  ailleurs** (he is not finished), **finale = the definitive fall**. Light copy pass by
  `narrative-designer`, not a re-spec.
- **K-2 (cross-spec, shared with the shield gate):** lever 6's cover prop is a system constant → it now
  appears at the Niveau Final too, where the shield read is UNWRITTEN (motivated only for Belliard's
  `porte cochère`; l'Éden needs its own cover read). Fold into a narrative follow-up when the shield
  lands live. Tracked in `story-boss-shield-tempo-shot.md` §2 K-2.

**Scope pins RATIFIED:** no human/hostage shield in V1 (§4.4); no 4th faction; shield = object never
armour. Loss line CONFIRMED as-is.

**Cleared:** fiction PASS-WITH-CORRECTIONS (K-1 folded by `narrative-designer`); (A) is the design-side
canon. Downstream: `senior-architect` TECH PLAN (D4-reversal ADR) unblocked on the fiction side; art
flow (Commandant + cover-prop sprite) is the flip-on gate per the live story (lead-art BLOCKING).

## §2 — `dev-tooling-assets` (Amelia): boss art-gen workstream prep — 2026-07-21

**claim:** scaffold the CI generation pipeline for the 7 already-ratified `commander_*` poses (blocked
on: no gen script existed) + structure (not prompt) the new SHIELD COVER PROP family, per lead-art's
BLOCKING verdict on the placeholder riot-cop boss.

**release:**

- `scripts/gen-boss-sprites.mjs` (new) — mirrors `gen-hostage-sprites.mjs` exactly (same
  Pollinations/FLUX flow via `scripts/lib/pollinations.mjs`, same `cutout-enemies.mjs` chroma-key
  detour, same `retouch-sprites.mjs` despeckle sweep). Reads `boss.types` from `levelArt.json` as the
  single source, generates only missing files (`FORCE=1` to redo), `--list`/`--asset <key>` CLI. Skips
  (does not error on) any entry with `pending: true` or an empty `prompt`, so a not-yet-gated prop
  entry never blocks generating the ratified figures.
- `.github/workflows/gen-boss-sprites.yml` (new) — same shape as `gen-hostage-sprites.yml`: manual
  `workflow_dispatch` or the `.github/dispatch/gen-boss-sprites` marker (never on `main`, only
  `ci(dispatch):`-prefixed pushes), `FORCE=1` generate → chroma-key → `fill-sprite-holes.mjs` solidify
  → `check-sprite-integrity.mjs` figure-topology gate (run only on the 7 `commander_*` keys — the two
  decor props `lustre`/`speaker_wall`, and the new `shield_cover_*` props, are not humanoid figures and
  don't fit that gate, mirroring how `gen-vehicle-sprites.yml` runs its own style gate instead) → commit
  `public/assets/boss/*.png` back to the branch with bounded push-retry.
- `.github/dispatch/gen-boss-sprites` (new marker) + `.github/dispatch/README.md` updated (added this
  row and the previously-undocumented `gen-hostage-sprites` row).
- `src/game/levels/levelArt.json` `boss.types` — added `shield_cover_raised` / `shield_cover_lowered`
  (structure only, per-entry `$comment`, `pending: true`, empty `prompt`, placeholder seeds 4879/4880,
  portrait `size` override `256x384` mirroring the `lustre`/`speaker_wall` [S13] precedent — a shield/
  door-leaf stood upright reads taller than wide, unlike the figures' square 256x256). **Prompt
  authorship is explicitly OUT of this lane** (concept-artist owns `prompt`+`style` strings per this
  block's own `$comment`) — brief for concept-artist below.

### Brief for `concept-artist` (Maud) — SHIELD COVER PROP, 2 reads

Source: `docs/game-design/spec-boss-belliard-fiction.md` §2, `docs/game-design/
spec-boss-shield-break-tempo-shot.md` §6-A/6-C/§7-flag-5 (lead-art's own read spec, quoted: "the player
must, at a glance, read the lowered riot shield as a fixed, low, boss's-side hit point that is not one
of the two wandering rings — a third, static affordance that appears in phase 2+"). Use the
[`flux-prompt`](../../.claude/skills/flux-prompt/SKILL.md) craft and this block's `style` tail
VERBATIM (family consistency, same as every other `commander_*`/prop entry) — do not fork a new tail.

- **Subject, not armour-on-him.** A large riot/ballistic control shield stood upright, propped against
  the `porte cochère` — OR a folded-back door-leaf of the porch used as improvised cover. It is a
  SEPARATE object the Commandant crouches behind, never anything drawn on his body (canon: he stays
  bare-headed, no shield/helmet/armour on his own silhouette — RULING 2026-07-20, block-level
  `$comment`).
- **Two reads, one object, no third state:**
  - `shield_cover_raised` — **intact/full-height**, reads as solid cover, nothing shootable implied.
  - `shield_cover_lowered` — **partially dropped/tilted**, its low street-side edge visibly exposed —
    this edge is where the fixed hit point (`BOSS_SHIELD_POINT`, anchor-relative `{x:0.4, y:-0.32}`,
    render-side, not a prompt concern) will sit. The exposed edge must read distinctly "vulnerable" vs.
    the raised read (an obvious silhouette delta between the two PNGs, not just a subtle tilt) — this is
    the single most important read requirement (AC5, the "third vertex of the triangle" vs. the two
    body rings).
- **Keying discipline (art-direction §2, the S1-style trap):** avoid near-black baked into the shield
  face — a dark ballistic shield on the shared matte-black `#000000` ground will key-eat. Steer the
  panel to a **keyable mid-value** (e.g. "charcoal-grey riot shield, lighter than the black backdrop,
  a pale rim/edge highlight") exactly like every `commander_*` entry's coat treatment (see `$comment`
  `[S1]`/`[S3]` in `docs/art-direction/prompt-drafts/boss-commander.md` for the precedent language).
- **Silhouette-first, positively described, ≤2 negations, no colour/hue baked** (house prompt law).
  Size is portrait `256x384` (already wired in `levelArt.json`, tunable if you need a different aspect
  — flag back to dev-tooling if so).
- **Gate:** this is a NEW prompt family (no existing prompt-drafts doc covers it) — needs a
  `lead-art` PROMPT GATE PASS (same as the 7 `commander_*` + 2 prop prompts got, 2026-07-20) **before
  any generation**. `gen-boss-sprites.mjs` will not attempt these two keys until `levelArt.json`'s
  `pending: true` is removed/false and a real `prompt` string lands — treat that flip as the "ready to
  generate" signal for CI.

### CI dispatch — exact commands (once prompts are gated PASS)

```sh
# Generate the 7 already-ratified commander_* poses now (no gate blocker on these):
date > .github/dispatch/gen-boss-sprites
git add .github/dispatch/gen-boss-sprites
git commit -m "ci(dispatch): gen-boss-sprites — le Commandant, 7 ratified poses"
git push
```

This fires `.github/workflows/gen-boss-sprites.yml` on the pushed branch (never on `main`). It generates
every `boss.types` entry that has a non-empty `prompt` and is not `pending: true` — today that's the 7
`commander_*` poses + `lustre` + `speaker_wall` (already-committed PNGs are skipped unless `FORCE=1`,
which this workflow always sets, so a re-dispatch re-rolls everything on its pinned seed). The two
`shield_cover_*` entries are silently skipped (logged `[pending]`) until concept-artist's prompt lands.
Once it does, drop `"pending": true` (or set it `false`) and re-dispatch the same marker — no script
change needed.

Manual alternative: Actions tab → "Generate boss sprites" → **Run workflow** on the target branch.

### Asset + composite gate checklist (lead-art's, not mine — listed so the hand-off is complete)

1. **Style gate** — each generated `commander_*`/prop/`shield_cover_*` PNG passes the same visual bar
   as the rest of the roster (silhouette legibility, keying cleanliness, family consistency with the
   `enemies`/`hostages` style tail). No automated `check-art-prompts.mjs` coverage for `boss` (block
   comment: "held by hand" — the prompt text itself is reviewed at the PROMPT GATE, not linted).
2. **Sprite integrity gate** — automated, wired above: `check-sprite-integrity.mjs` on the 7
   `commander_*` figure keys (topology: no detached limbs, no speckle over budget, no holes after
   `fill-sprite-holes.mjs`). Props (`lustre`, `speaker_wall`, `shield_cover_*`) are exempt (not
   humanoid figures) — lead-art reviews those by eye.
3. **Composite gate** — the actual render-integration checks lead-art flagged BLOCKING: the two
   `shield_cover_*` reads swap correctly with the `shieldPointLive` render flag (spec §6-C), the
   `BOSS_SHIELD_POINT` anchor sits on the lowered prop's exposed edge at real render scale (not just in
   the flat PNG), and the 7 `commander_*` poses read correctly composited into the live QTE tableau
   (zoom framing, both device classes per K-1 in the shield spec's AC5). This is a `verify`/`lead-art`
   stage-5 job on the real generated art, not something this prep can pre-check — flagged forward.
4. **ANCHOR SCHEMA GAP** (repeated from the block-level `$comment`, still open): `commander_weakpoint`
   VITAL/LIMB bands, `commander_parry_windup`'s `parryPoint`, and now the shield prop's
   `BOSS_SHIELD_POINT` all need a render-side anchor mechanism this file does not have yet (today's only
   mechanism, `enemies.*.muzzle`, is a per-frame array and doesn't fit a single-image entry or a band
   range). Needs `senior-architect` sign-off before render-integration wires any of the three; not
   resolved by this prep.

**Still needing generation + gating (this prep does not run it):**

- 7 `commander_*` figure poses + `lustre` + `speaker_wall` — script/workflow ready, PROMPT GATE already
  PASSED (2026-07-20) on their prompts, just never dispatched — the CI dispatch above is the remaining
  step (human/CI action, not code).
- `shield_cover_raised` / `shield_cover_lowered` — structure only landed here; BLOCKED on
  concept-artist's prompt (brief above) → `lead-art` PROMPT GATE → then the same dispatch.
- The render-side anchor schema (VITAL/LIMB bands, `parryPoint`, `BOSS_SHIELD_POINT`) — blocked on
  `senior-architect`, independent of generation.

Not run locally (network egress blocked in-sandbox by design); `BELLIARD_BOSS_ENABLED` not touched.
`rtk lint` run clean on `scripts/gen-boss-sprites.mjs` (see verification below).

---

## Stage 6 — code-review panel (merge gate) — orchestrator/senior-architect — 2026-07-21

**Panel — `claude/boss-shield-break-belliard` (rebased on origin/main, 14 commits) vs origin/main · 41 files, player-visible**
Reviewers (parallel, orthogonal skills): `code-review`(high) · `bmad-code-review` · `bmad-review-edge-case-hunter` · `security-review`.

**All four verdicts: MERGE. Zero CONFIRMED BLOQUANT/MAJEUR.**

CONFIRMED findings (all MINEUR/NIT) + disposition:

- MINEUR (A/B/C) — comment drift: stale "quota trigger"/`shouldTriggerBossQte` wording in `levels.ts` (×2) and the `createInitialState` guard comment in `stateMachine.ts`. → FIXED (rewritten to the ADR-0059 Amendment-2 timed-finale reality + the fail-loud throw).
- MINEUR (C) — pose over-telegraph: `BossQteSprite.tsx` pose decode gated on the bare `|| charged`, leaking the `parry_windup` pose for the whole resting lull. → FIXED (dropped `|| charged`; pose now tracks `parryOpen || parryWindup` like the tint layer).
- MINEUR (A) — `levelArt.json`: 2 Belliard `streetSign` near-props unintentionally dropped during the rebase conflict resolution (main had 6, branch had 4). → FIXED (both restored; count back to 6). _(Data-loss regression, the one substantive catch.)_
- NIT (A/B) — "catch discs cleanly disjoint" overstated in ADR-0060/spec/comment (the r-0.30 discs actually overlap; the load-bearing property is the shield CENTRE outside every ring catch disc, ≈0.314 > 0.30, overlaps settled by ring-precedence). → FIXED (ADR-0060 §D5 + spec §2/§6-A/§4 reworded accurately).
- NIT (B) — A1 anti-camp bound `< 0.85` loose vs measured ~0.75. Left as-is (conscious readability call, documented).
- NIT (A) — bossQteSystem disjointness assert checks box-membership not catch-disc separation. Left as-is (comment already defers the disc property to the spec; box assert is genuine).
- NIT (C) — held-fire re-chips the fixed shield point per tick (same as the wandering rings; relies on upstream fire-edge, out of this diff). Left as-is (consistent with shipped model; flagged for stage-5 playtest).
- NIT (D) — `gen-boss-sprites.mjs` `path.resolve(asset)` not asserted under `public/`. Left as-is (trusted committed input; optional CI hardening).

Integration review (senior-architect): boundary law OK — `src/game/**` (bossQteSystem, stateMachine, levels, assetManifest) carries NO React/Three; `src/render/**` (BossQteSprite, bossTextures, App, levelProgress) holds no game rules; the manifest `bossAssetPaths` is pure. Seams (timed-finale trigger, drawn==catch, decouple flag, unlock-on-LEVEL_COMPLETE) verified. Deps/deploy: 9 committed CI PNGs + gen script/workflow, no runtime dep added.

Post-fix re-verify: `tsc` clean · **1015 tests + 1 skipped** · lint clean · build ok · JSON valid.

**VERDICT: MERGE.** No unresolved CONFIRMED blocking/major finding.

---

## Stage 8 — PM acceptance — pm (John) — 2026-07-21

**Branch `claude/boss-shield-break-belliard` (HEAD 2d0cdf8, rebased on origin/main, merge-gate PASS).**

### VERDICT: ACCEPT-WITH-FOLLOWUPS

Coherent, honestly-documented execution of Bertrand's mid-flight calls. Every deviation from the
original story text traces to an explicit decision (ADR amendment / handoff); the core loop
`Récupérer → Livrer → Éviter` is intact; nothing reopens an already-ratified extension verdict.

**Cahier des charges:** the boss/lever pair is ratified `[EXTENSION]` (ADR-0051/0052; Prohibition ST
had no boss) — not relitigated. New here = placement (Belliard) + a 6th lever (shield-break) + a
trigger-timing change, all consciously scoped. Pass.

**Story ACs:**

- `story-boss-belliard-live`: AC1 (boss authored) MET; AC2 (decouple seam) exists + tested both ways
  but flipped ON at merge (deviation #1); AC3 (routing) MET; AC4 (persistence) accepted on the
  merge-gate PASS; AC5 (`?preview=boss` guard) MET; AC6 (supersedes D4) MET.
- `story-boss-shield-tempo-shot`: AC1–AC6 verified in code (constants + asserts present); AC7
  (winnability) correctly deferred to stage-5 playtest, flagged not dropped.

**The 4 conscious deviations — all accepted:** (1) BELLIARD_BOSS_ENABLED=true ahead of shield-prop
art — shipped honestly (canon poses wired + fallback; shield prop hidden, reticle carries the read;
tracked, not silent); (2) hostage QTE dropped on Belliard — forced by the pre-existing mutual-exclusion
throw, ADR-documented, hostage stays live on Vitry, coexistence is a named follow-up; (3) timed-finale
trigger — clean, matches ADR-0059 Amendment 2, byte-identical on non-boss levels; (4) vital ring +33%
— bounded by its own asserted invariant, anti-camp softening is a reversible tuning value on the
stage-5 watch-list.

**Follow-ups (do NOT block merge):**
1. Close the shield-cover-prop art gate (gen-boss-sprites dispatch for shield_cover_* → texture swap).
2. Hostage/boss coexistence on Belliard (ADR-0059 D3 option A) — scoped follow-up story if wanted.
3. Stage-5 playtest: winnability as first boss (level-1-gate difficulty) + W1/W2/W3 with lever 6 live
   - the +33% vital-ring anti-camp softening — one item on the pinned targetSeed.
4. (cosmetic) Confirm the 0058→0059 (and 0059→0060) renumber notes in the docs index.

**Merge-cleared by the pm.** Remaining before Bertrand merges: the follow-ups above are post-merge.
