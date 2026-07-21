# Handoff — Rue Belliard décor references (curation + AD read)

## stage-art. REFERENCE CURATION + AD READ — lead-art (Nico) — 2026-07-18

- claim: curate the VALIDATED board `docs/art-direction/references/boards/board-belliard-decor.md`
  into the reference library, then give the art-director read on the décor direction for the
  Belliard backdrop.
- release: folded 3 stable links (Paris Tonkar / Internet Archive, Wikipédia FR Rue Belliard,
  Wikipédia FR Billy la Banlieue) into `docs/references/art-culture.md` under a new
  "Décor de niveau — façade Rue Belliard" block, one context sentence + licence note each;
  dropped the redundant/ephemeral rest with a traceable "Écarté à la curation" note.
  File List: `docs/references/art-culture.md`.
- VERDICT: PASS — Belliard décor direction art-read (lead-art)
- notes: crade-documentaire B&W register is on-house-style (§1). Guardrails for the
  concept-artist prompt below — décor never glows (§2 law 1), flat frontal poster geometry
  (§1/§5), no Deneux direct likeness. Proposed a bible clause codifying the décor/backdrop
  doctrine (§5 is currently thin) — to land via a separate bible-gate PR, not in this task.

## stage-art. PROMPT GATE — décor Belliard v3 (5-asset regen lot) — lead-art (Nico) — 2026-07-21

- claim: final DA prompt gate on `docs/art-direction/prompt-drafts/level-belliard-decor-v3.md`
  (lot: `troncon-a`, `troncon-b`, `troncon-c`, `sky`, `foreground` + shared style block),
  after Serge's pre-prod pass (S1–S14) and Maud's corrective pass (iteration 1/2).
- checks run: byte-for-byte identity of the shared block across A/B/C (`python` prefix diff —
  IDENTICAL, distinguishing tail only); word/negation budgets; `checkLevels` behaviour in
  `scripts/check-art-prompts.mjs`; belliard manifest key structure; committed §606 foreground
  regressions confirmed restored.

- **VERDICT — shared style block: PASS.** Register N&B front-loaded ("Photocopied 1990s fanzine
  xerox, high-contrast black-and-white only" opens the block, §1/§3.1/§3.4); zero residual colour
  clause (no hue names; ladder is pure greyscale); the three hex anchors #141210/#3A3E44/#E9E3D2
  present AND bound to surfaces (sky/wall/lit-window value, ground-floor "one value step lighter");
  no-glow ruling explicit ("windows dark or shuttered … a flat paper-white #E9E3D2 rectangle, no
  glow" — décor never emits, loi du glow §2 law 1); roof/chimney armour bounded ("two or three
  thick blocky chimneys per building"). Byte-identical across A/B/C = one printing run (§2 law 2).
- **VERDICT — word-count derogation (~131 vs ~115): ACCEPTED, no cut forced.** `checkLevels` applies
  NO word ceiling to level prompts (the 120 hard-max is a FLUX-vehicle calibration in `checkBudgets`,
  not wired to level fields — verified in source), so there is zero mechanical pressure; every word
  past 90 traces to a gated RULING (register / hex ladder / no-glow / anti-defect chimneys / tagged-band
  taper / ADR-0048 margins) and all blocking clauses are front-loaded in the first ~65 words. The free
  "stapled" cut is left in — byte-for-byte shared-block stability outranks a 1-word saving.
- **VERDICT — troncon-a: PASS.** Two distinct volumes + S10 min-width sliver anchor ("at least as wide
  as one window bay") so the gap keys clean and the row reads as two silhouettes not one fused mass
  (§2 law 3).
- **VERDICT — troncon-b: PASS.** 100% generic faubourien — zero Deneux residue (no ceramic / bow-window
  / roof-terrace / name), mur-pignon anchored on the mid-grey #3A3E44 value. S1 "plain brick coursing"
  safety word deferred (nice-to-have) — accepted; re-flag only if a future roll drifts ornamental.
- **VERDICT — troncon-c: PASS.** S11 anchor present ("set back well within the row … away from either
  edge") keeps the near-black passage off the L/R margin so the region-mask sky key can't eat it;
  reads generic (instanced twice in a,c,b,c).
- **VERDICT — sky: PASS.** Sodium halo as VALUE not hue ("rendered purely as value", horizon lighter
  than zenith), anchored on near-black #141210, "everything staying below paper-white" (a lit window
  still reads brightest — no-glow held), horizontally tileable. The word "glow" is fine here — no hue,
  explicitly a value gradient, and `checkLevels` runs no neon-token check on level prompts.
- **VERDICT — foreground: FAIL (single mechanical correction required).** DA content is PASS-worthy:
  ironwork floats alone (S2 restored positively — no building/wall/sky behind), evenly spaced (S3
  restored — bars can't weld into a solid mass), plein/vide front-loaded (S4), pure-black ink, hard
  cutout, décor does not glow (keyed to bare B&W, no rim). BUT the prompt dropped the literal
  `magenta chroma-key` pipeline-contract token (it now reads "bright magenta #FF3CDC"). `checkLevels`
  hard-ERRORS any `foreground` layer missing that exact two-word phrase (`MAGENTA_KEY_RE`), and draft
  §9 requires `check-art-prompts.mjs` green before generation — as written it reds CI.
  - **REQUIRED FIX (verbatim token restoration, not a creative rework):** insert `chroma-key` right
    after `magenta` so the literal phrase `magenta chroma-key` exists, e.g.
    `… one flat uniform bright magenta chroma-key field #FF3CDC so only the black iron is solid …`.
    Preserves S2/S3/S4 gains; the previous gated §606 foreground already carried this token
    ("magenta chroma-key background"). This is a contract-token restore — it does NOT need a fresh
    concept-artist loop and does NOT consume a generation batch (no generation has run).

- **GATE RESULT: 5/6 PASS; foreground held for one verbatim token restore.** Once `dev-tooling-assets`
  restores `magenta chroma-key` in the foreground string and `check-art-prompts.mjs` is green, the lot
  is cleared for dispatch — no re-gate needed for the token restore.
- **DISPATCH CONDITIONS (confirmed on-spec):** FLUX text-to-image, pinned seeds (A/B/C share `7110` =
  one printing run; sky `7120`; foreground `7130`); `enhance=false`. NEVER `gen-from-reference`/`kontext`
  img2img off a colour photo (root cause of the v2 colour — §7). `street.png`/`ground.png` stay as-is,
  out of the lot.
- notes for the asset gate (mine, downstream): sky/foreground/tronçons are delivered PNGs (baked), so
  they land at the ASSET gate, not the composite gate — no runtime-composed glow in this lot. The
  no-glow ruling means there is intentionally nothing for Gate 4 here; if any future pass adds a
  render-side rim to décor it would itself be off-spec (décor is non-interactive).
