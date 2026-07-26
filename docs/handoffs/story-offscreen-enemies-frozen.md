# Story — off-screen enemies frozen (ADR-0069) — merge-gate panel

## Panel run — 2026-07-26 (Bertrand: "ok could we merge?" — whole branch `claude/offscreen-enemies-cannot-shoot` → main)

Scope: `git diff origin/main...HEAD` at panel time (31 files, 1552+/87- — the
offscreen-enemies freeze + ADR-0069, the boss multi-model bake-off tooling, regenerated
boss PNGs, and this session's tag-live-paint reference board/curation). Player-visible
(gameplay) + tooling/CI + docs/assets.

Four reviewers run in parallel: `code-review` (high), `bmad-code-review`,
`bmad-review-edge-case-hunter`, `security-review`. Findings adversarially verified; two
(prettier BLOQUANT, `speaker_wall.png` chroma conflict) re-checked directly against the
real files/image by the triager below before being accepted.

### CONFIRMED findings (most severe first)

- **[BLOQUANT] scripts/bakeoff-boss-models.mjs, scripts/gen-boss-sprites.mjs,
  docs/art-direction/references/LICENSES.md — not prettier-formatted**, CI's
  `yarn format:check` (`.github/workflows/ci.yml`) would redden the branch.
  **FIXED** in commit `de8b6135` (prettier --write, no semantic change; `LICENSES.md`
  line was this session's own italic-style slip).

- **[MAJEUR] src/game/systems/stateMachine.ts:497-499 — "protéger la camionnette"
  devient un objectif gratuit.** `shootingCount` filtre maintenant sur la position
  caméra, pas la proximité au véhicule : pointer la caméra sur un tronçon sans ennemi
  pendant la fenêtre `DELIVERING` donne `shootingCount === 0`, l'intégrité ne descend
  jamais, `SUCCESS` + bonus (belliard 500 / stalingrad 400) tombent à tous les coups.
  **Unanimously confirmed by all 3 code reviewers** (A/B/C), independently traced to
  the same lines. ADR-0069 §Négatif discloses this verbatim and explicitly asks for a
  `game-designer` arbitration ("mérite un arbitrage game-designer plutôt qu'un choix
  implicite") that has not happened — the diff instead ships a new test
  (`stateMachine.test.ts:1492`) that _pins_ the exploit as expected behaviour rather
  than guarding it. **Owner: `game-designer`** (decide fix — e.g. gate on
  shooter-to-vehicle proximity instead of camera position, or redesign the objective)
  → `dev-gameplay` implements. **Not fixed — blocks merge.**

- **[MAJEUR] public/assets/boss/speaker_wall.png — chroma-key background conflict,
  ships a visibly broken asset.** The bake-off pipeline's `COMIC_TAIL` demands a flat
  magenta (#FF3CDC) chroma ground, but `speaker_wall`'s own subject prompt
  (`levelArt.json` boss.types.speaker_wall, untouched by this diff) still says "on a
  completely flat uniform black background" — the two clauses fight. Verified visually
  (`Read` on the committed PNG): large opaque black masses flare left/right of the
  stack, un-keyable at any chroma tolerance (~250 away from #FF3CDC). Every gate passes
  it (`check-sprite-integrity` sees one dominant component; `desaturate-enemy-figure
--check` accepts black as neutral). **Owner: `concept-artist`** fixes the
  `speaker_wall` prompt (drop/align the background clause with the magenta tail),
  `dev-tooling-assets` regenerates. **Not fixed — blocks merge.**

- **[MAJEUR→downgraded on verification] "3 of 4 levels enemy-inert at camera rest" /
  unpinned viewport-reachability invariant** (stateMachine.ts:364 / viewport.ts:17,
  raised independently by B and C). Triager re-verified the underlying numbers: A's
  own re-derivation of max\|slotX\| vs the pan-clamp bound (`fullW/2`) matches ADR-0069's
  disclosed figure exactly (vitry 39.4586/40, margin 0.54) and shows **every shipped
  level's slots are currently reachable — no permanent stall exists today.** The
  "3 levels empty at camera rest for the whole level" framing describes a pre-existing
  level-geometry/camera-control property (player-driven pan, no autoscroll — confirmed
  in `GameScene.tsx`), not a regression this diff introduces; ADR-0069 §Négatif already
  names this pacing change and records it as knowingly accepted, with a mitigation path
  if it proves to feel broken. **Not a merge blocker as a correctness bug** — but the
  ADR is still `Proposed` (not `Accepted`) and self-commits to adding a test for
  `max |slotX| <= fullW/2` that is missing from the diff; given the panel's sharper
  measurement (0% active frames for a full level, not "one cycles"), **recommend**
  Bertrand/`game-designer` re-confirm the pacing call now that it's quantified, and
  `dev-gameplay` add the invariant test per the ADR's own to-do before flipping
  ADR-0069 to `Accepted`. Non-blocking for this panel's verdict, but should not be
  dropped silently.

### MINEUR (non-blocking, recommended before/soon after merge)

- `scripts/bakeoff-boss-models.mjs` duplicates `genUrl`/`fetchImg`/`withRetry` from
  `scripts/lib/gptimage.mjs` with no timeout/retry — a hung request stalls a paid CI
  run to its 45-min cap. Owner: `dev-tooling-assets`.
- `scripts/gen-boss-sprites.mjs` `REF_IMAGES` points at mutable `raw.githubusercontent`
  URLs on `main` — breaks the "pinned seed" reproducibility contract, silent 404
  degradation. Owner: `dev-tooling-assets`.
- Chroma `tol: 150` (`gen-boss-sprites.mjs:212`) now reaches into the art's own
  mid-grey tone band (nearest neutral grey at distance 147) — no current damage, but
  margin against future poses is gone and only a WARN-level gate would notice. Owner:
  `dev-tooling-assets` / `lead-art` to confirm tolerance.
- New "flatten to neutral tones" CI step (`gen-boss-sprites.yml:144`) is a no-op —
  `keyAndDown()` already flattens; 0px changed on all 9 committed PNGs. Owner:
  `dev-tooling-assets`.
- `security-review`: unescaped error text interpolated into the bake-off HTML report
  (`bakeoff-boss-models.mjs:345/419/117`) — a hostile/spoofed upstream error becomes
  markup in a CI artifact opened by a human. One `esc()` helper fixes it. Owner:
  `dev-tooling-assets`.
- `workflow_dispatch` inputs interpolated raw into a `run:` bash block
  (`.github/workflows/bakeoff-boss-models.yml:90-92`) — standard `env:` indirection
  fix; no actual privilege escalation (dispatch already requires write). Owner:
  `dev-tooling-assets`.

### NIT

Muzzle flash cosmetic on a frozen mid-`SHOOTING` enemy (ADR-0069 already discloses,
accepted); dead default params on `viewport.ts` (single call site passes all args);
ADR-0069 leads its Context sentence with backticked snake_case (violates this diff's
own `adr-new` SKILL.md style rule, added same commit) — **routed to `tech-writer`**;
`urlFor()`/`fetchBuf()` duplicate `genUrl()`/`fetchImg()` (same root cause as the
MINEUR above).

### Integration review (boundary law / seams / deps)

- Boundary law holds: `viewport.ts`/`enemySystem.ts`/`stateMachine.ts` stay
  `src/game`-pure (no React/Three); the `EnemySprite.tsx` muzzle-flash NIT is a
  `src/render` cosmetic reader, not a boundary violation.
- New deps: `@napi-rs/canvas@1.0.2` (bake-off only), pinned, `--ignore-scripts
--no-save` — no supply-chain concern.
- Two new GH Actions workflows are least-privilege (`contents: read`, no commit step);
  no secret reachable outside the `Authorization` header.
- No SSRF / attacker-controlled surface in the gameplay diff (pure in-memory state).

### Verdict: **NO-MERGE**

Blockers (both owned outside this session's lane, neither touched by our reference-hunt
commits):

1. Van-objective-becomes-free — needs `game-designer` arbitration + `dev-gameplay` fix.
2. `speaker_wall.png` broken chroma background — needs `concept-artist` prompt fix +
   `dev-tooling-assets` regen.

Prettier BLOQUANT already fixed (commit `de8b6135`). This session's own additions
(reference board, `art-culture.md`, `LICENSES.md`, this handoffs shard) carry **zero**
CONFIRMED findings beyond the now-fixed formatting slip.

Process note: the working tree carries substantial **unrelated, uncommitted** work from
a concurrent session (CI review-panel automation itself — `panelFindings.mjs`,
`panel-write-*.mjs`, ADR-0070 draft, `.github/actions/panel-reviewer/`, `FlyerWall.*`,
`NearForeground.tsx` boss-QTE z-order fix). None of it is in `origin/main...HEAD`, none
of it was touched or reviewed by this panel, per Bertrand's explicit instruction to
leave it alone.

## Blocker 2 levé côté prompt — `speaker_wall` conflit chroma (concept-artist, Maud, 2026-07-26)

Réponse au finding **[MAJEUR] public/assets/boss/speaker_wall.png** ci-dessus. Corrigé :
**uniquement** la clause de fond du prompt `boss.types.speaker_wall` dans
`src/game/levels/levelArt.json` (1 ligne, 0 autre clé touchée).

- **AVANT** — `a hand-built teknival sound-system wall `**`on a completely flat uniform black background filling the frame`**`, a wide pyramid of mismatched plywood bass-bins and horns stacked on a pallet rig, cables looping between the cabinets, a sprayed stencil spiral on one face`
- **APRÈS** — `one hand-built teknival sound-system wall `**`as a single isolated object`**`, a wide pyramid of mismatched plywood bass-bins and horns stacked on a pallet rig, cables looping between the cabinets, a sprayed stencil spiral on one face`

Pourquoi ça ne peut plus contredire `COMIC_TAIL` : le sujet ne nomme **plus aucun fond ni aucune
couleur** (0 occurrence de `background`/`backdrop`/`black`/`magenta`), donc la queue est la **seule
autorité** sur le fond — même patron que les 8 autres entrées `boss.types.*`. La clause de
remplacement est un verrou de **composition** (objet unique, isolé), qui _renforce_ le
`floating isolated on a … #FF3CDC background` de la queue au lieu de se battre avec lui ; elle
reprend la charge utile de [B4] (tuer la traction photo-outdoor du référent teknival, échec mesuré
à 94,3 %) sans rouvrir le conflit. `one` (ex-`a`) est le garde-fou mono-objet de `lustre`. Contenu
du sujet inchangé par ailleurs (pile teknival, bass-bins/horns contreplaqué, pallet rig, câbles,
stencil spray).

Budget : sujet **36** mots (41 avant), **assemblé 106** avec le `COMIC_TAIL` réellement envoyé
(bande du set 95-105), 93 avec `boss.style` ; **0 négation** dans le sujet ; `<= 120` §3.3 tenu.
`node scripts/check-art-prompts.mjs` **vert** (14 warnings préexistants, aucun sur `boss`),
`prettier --check` vert. Rationale complète + variante rejetée (retrait sec de la clause, gardée en
fallback) : `docs/art-direction/prompt-drafts/boss-commander.md` §[B5]. Note : la prémisse du
RULING (2) de lead-art qui avait _restauré_ ce verrou noir (« la queue porte bien le fond noir ») est
devenue fausse au passage du set sur la queue comic-ink/magenta — la correction sert la même
intention sur la queue réelle.

**Non fait, délibérément** : aucune régénération d'asset (pas de script, pas d'appel API) — le PNG
reste cassé sur disque. **Suite : `dev-tooling-assets`** régénère `public/assets/boss/speaker_wall.png`
(seed 4878, épinglé, inchangé) → **`lead-art` Gate 2** sur le PNG (watch : retour de la photo outdoor

- plus aucune masse opaque non-magenta sur les flancs). Le blocker 1 (van-objective gratuit,
  `game-designer`) est hors de ma lane et reste ouvert.
