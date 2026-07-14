# Agent Handoffs Log

Serial coordination log, written by the orchestrator only. Parallel devs must NOT
both edit this file (protocol rule #3). One block per story.

Template:

```
### <story-slug>
- arch: <lane assignment + parallel-safe verdict>   (Winston / Senior Architect)
- release: <dev outcome>                             (added serially after devs run)
```

---

### story-tutorial-visual-gestures

- pm→arch: Story written (`_bmad-output/planning-artifacts/story-tutorial-visual-gestures.md`),
  from Bertrand's 2026-07-14 tutorial feedback ("pas assez visuel"). WHAT: make the tutorial
  show gestures + the shipped bestiary — four code-drawn (SVG/CSS) gesture icons on the control
  panels (desktop mouse-click / desktop edge-scroll / mobile two-finger single-tap / mobile
  one-finger swipe) via a new optional pure-data field on `NarrativeLine`, plus enemy panels for
  the full shipped Belliard pool (normal/riot/biker/bonus/courier) reusing on-disk sprites. WHY:
  the stage exists for control discoverability yet teaches motor skills as pure prose; only 3/8
  panels are illustrated. PM RULINGS (fixed): teach the REAL mobile shoot = SINGLE two-finger tap
  (Bertrand said "double tap" — wrong, corrected); car/hostage stay OUT (not shipped); NO
  FLUX/CI/asset-gate (icons in code). HANDOFF to `senior-architect` (cross-cutting: `src/game`
  data field ∥ `src/render` icon component): own lane partition, the boundary-clean animated-icon
  approach, the `NarrativeLine.gesture` field shape, and — REQUIRED — the **ADR-0015 D3 amendment
  or new ADR** (D3 locks control panels text-only; this story reopens it — icons are code-drawn so
  ADR-0012 D5 "no generation" is preserved). Then DESIGN LOOP (`game-designer`+`narrative-designer`
  → `lead-game-designer` gate): icon fidelity (animated vs static), new-panels-vs-enriched (8-panel
  parity), bestiary copy depth. No commits made by pm. (John / PM)
- narrative→design-gate: Expanded tutorial WORDS delivered
  (`docs/game-design/tutorial-script-visual-gestures.md`). Full copy for all four
  segment constants, paste-ready for `narrativeSystem.ts`: opening ×2 (shared), desktop
  control ×2 + mobile control ×2 (forked, gesture-icon slots pinned per panel), field ×7
  (shared) — bestiary expanded to the full shipped Belliard pool (normal/riot/biker/bonus/
  courier) + HUD + outro. Panel count 11/11 (was 8/8), parity + fork-only-on-controls
  invariant held; all copy TRUE to `ARCHETYPES` (bonus = +5 s reward, not "temps perdu";
  riot = 2 shots; civilian = -1 vie/-1 point). ADR-0015 device pins verified (mobile:
  `deux doigts`, no `clic`/`souris`; desktop: `souris`+`clic`, no `doigt`/`balay`; shared
  panels clean). Corrected Bertrand's "double tap" to the real single simultaneous
  two-finger tap (`en même temps` added to MC1). TWO `[FLAG]`s for the lead gate: (a)
  shooter-pose vs idle sprite choice for F1/F2/F3; (b) F5 courier shows `enemy_civilian.png`
  but the live courier renders `courier/rider.png` — accuracy call. TENSION: 11 panels
  strains ADR-0012's <10s-to-gameplay ethos (skippable, but long) — biker/bonus depth is
  the trim lever if the gate wants it shorter. Needs `game-designer` (panel structure /
  icons) sync + `lead-game-designer` PASS before `dev-gameplay`. (Yasmine / Narrative)
- design→gate: GAMEPLAY-TEACHING spec written (`docs/game-design/tutorial-visual-gestures.md`),
  UNGATED (awaits Karim PASS). ALIGNED with Yasmine's copy (both landed 11/11 panels, fork on
  [2,3], parity held). RULINGS: (1) four gesture icons ANIMATED (motion, not diagram); glow law
  = only the acted element glows (left button / touched edge / two fingertips / fading swipe
  trail) with alpha falloff to 0 (no aplat); two-finger icon = ONE simultaneous tap + long
  inter-loop rest so it never reads as double-tap; edge-scroll = edge PUSH not drag; swipe = one
  finger, 4 dirs, inertial glide. Per-icon animation tuning table (loop 1.2/2.4/1.4/2.0s) in §1.5.
  (2) Panel structure = ENRICH controls (icon in image slot, fork stays 2) + ADD 3 bestiary →
  11 panels; <10s ethos preserved (tutorial off default first-play, skippable every panel).
  (3) RESOLVES Yasmine's two [FLAG]s: (a) armed types (normal/riot/biker) use SHOOTING sprite
  (the danger tell IS the lesson), bonus/civilian idle; (b) courier stays `enemy_civilian.png`
  NOT `courier/rider.png` — bike layer not on disk + lone rider still = floating torso; civilian
  sprite is the clearest "livreur, never shoot" read (revisit when `courier/bike.png` ships).
  (4) `gesture` = pure-data enum `mouse-click|edge-scroll|two-finger-tap|swipe-pan`, device-
  correct via the forked control segment, mutually exclusive with `image`, degrades to text.
  HAND-OFFS: `narrative-designer` (copy/labels — done, aligned); `lead-art` (final glow hue,
  rec. #ffe600, + falloff read at composite gate); `senior-architect` (field shape + ADR-0015
  D3 amendment). Design ACCEPTANCE (stage 5): playtest via `verify` on both `?preview=tutorial`
  contexts vs §5 DA1–DA8 before architect integration review. (Sacha / Game Designer)
- design-gate→arch/art: **PASS — both deliverables gated** (`docs/game-design/tutorial-visual-gestures.md`,
  `docs/game-design/tutorial-script-visual-gestures.md`). Verdict per leg:
  · **Scope** — conscious documented extension inside the ADR-0012 envelope (optional/skippable/
  informative-only, zero rule added); enemies limited to the shipped Belliard pool (ADR-0012 D4);
  no new sprite/FLUX. ADR-0015 D3 reopening is DECLARED (not undeclared) → architect's lane (AC11).
  · **Core loop** — informative-only, serves `Récupérer→Livrer→Éviter`, dilutes nothing; the 3-5min
  mission cap does not bind a skippable non-mission stage.
  · **Verifiability** — icon animation timings (1.2/2.4/1.4/2.0s), lit elements, teaching points and
  sprite paths are all concrete; copy is verbatim; field-shape correctly deferred to architect.
  · **Coherence (both docs)** — panel indices MATCH (fork [2,3], shared [0,1,4,5,6,7,8,9,10], 11/11);
  icon slots ↔ copy annotations MATCH (DC1/MC1=shoot p2, DC2/MC2=pan p3); sprite picks MATCH
  (armed→`_shooting`, bonus/civilian idle). Sacha's §3.1 RESOLVES both of Yasmine's `[FLAG]`s.
  · **Factual audit vs `ARCHETYPES`** — VERIFIED TRUE: normal hp1/shoots/+1/3.2s; riot hp2; biker
  2.0s fast; bonus shoots:false/timeDelta5/countsAsTarget:false; civilian −1 vie/−1 point. All five
  sprites + truck confirmed on disk. Mobile shoot correctly = single simultaneous two-finger tap
  (not double-tap). ADR-0015 device-copy pins hold (mobile `deux doigts`, desktop `souris`/`clic`).
  · **Art-bible** — icon specs invoke loi du glow (only acted element glows) + halo=dégradé (alpha
  falloff to 0, no aplat); hue and falloff-read correctly DEFERRED to `lead-art` at the composite
  gate — no visual arbitration by me, no bible conflict flagged.
  **PANEL-STRUCTURE DECISION (mine, explicit): KEEP 11, do NOT trim biker+bonus.** The <10s ethos
  (guidelines §5 UX-1) governs the _default_ launch→gameplay path; the tutorial is off it by
  construction (optional secondary affordance, Belliard is the default highlight, ADR-0012 D2) and
  skippable at every panel. Bertrand asked for "encore plus détaillé"; biker (weight 15) and bonus
  (weight 11) are LIVE in Belliard's default pool, so trimming them under-teaches the shipped game —
  contra the story's own purpose. Conscious documented trade (spec §2.2), not a violation.
  **PROPOSED GUIDELINE RULE (guidelines silent here):** the <10s launch→gameplay budget binds the
  default first-play only; an optional stage that is not the default highlight and is skippable at
  every step is budgeted on _clarity_, not brevity. Forwarded to `pm` for §5 codification.
  No amendments needed to either doc — both were already coherent. DOWNSTREAM UNBLOCKED:
  `senior-architect` (field shape + ADR-0015 D3 amendment), `lead-art` (glow hue/falloff), then
  `dev-gameplay` transcribes; design ACCEPTANCE (stage 5) via `verify` on both `?preview=tutorial`
  contexts vs §5 DA1–DA8. (Karim / Lead Game Designer)
- arch→devs: **Boundary verdict PASS. ADR-0020 written** (`docs/adr/0020-code-drawn-gesture-icons.md`,
  Accepted) — reopens ADR-0015 D3 (control panels no longer text-only), extends ADR-0012 D5 (adds a
  second optional illustration channel); ADR-0012 D5 "no generation" guarantee PRESERVED (icons are
  code-drawn SVG/CSS, no FLUX/CI/asset-gate). Index + 0012/0015 cross-refs updated.
  **FIELD CONTRACT (fixed — the ONLY shared knowledge between the two lanes):** new exported
  `type GestureKind = "mouse-click" | "edge-scroll" | "two-finger-tap" | "swipe-pan";` in
  `narrativeSystem.ts`; `NarrativeLine` gains `readonly gesture?: GestureKind` +
  `readonly gestureAlt?: string`. `gesture` is MUTUALLY EXCLUSIVE with `image` (test-enforced, not
  type-enforced), lives ONLY on forked control panels (indices 2,3). Render imports `GestureKind` and
  builds an EXHAUSTIVE `Record<GestureKind,…>` (compile-time completeness). `GestureIcon` lives at
  NEW `src/render/ui/GestureIcon.tsx`.
  **LANE A → `dev-gameplay` (`src/game/**`only):**`src/game/systems/narrativeSystem.ts`(add`GestureKind`+ the two fields; transcribe the gated 11-panel script VERBATIM from`docs/game-design/tutorial-script-visual-gestures.md`— opening ×2 shared, desktop/mobile control
×2 forked with`gesture`set +`image`unset, field ×7 shared; set`gestureAlt`from the script's
parenthetical labels);`src/game/levels/**tests**/tutorialInvariants.test.ts`(widen shared-ref
index list`[0,1,4,5,6,7]`→`[0,1,4,5,6,7,8,9,10]`, parity 11==11, fork `[2,3]`; new pins: gesture
ONLY on 2,3 · desktop∈{mouse-click,edge-scroll}/mobile∈{two-finger-tap,swipe-pan} · no panel sets
both `image`&`gesture`· every`gesture`line has non-empty`gestureAlt`; keep device-copy regex +
shipped-sprite-exists checks green); `src/game/systems/**tests**/narrativeSystem.test.ts`(gesture
value ∈ enum integrity).
**LANE B →`dev-r3f-render` (`src/render/**` only):** NEW `src/render/ui/GestureIcon.tsx` (4
  animated B&W-lineart+neon icons per `docs/game-design/tutorial-visual-gestures.md` §1, loi du glow
  = only the acted element glows w/ alpha falloff to 0, two-finger = ONE simultaneous tap + long
  rest, edge-scroll = PUSH not drag, swipe = 1 finger/4 dirs/inertia); MOD
  `src/render/ui/NarrativeScreen.tsx` (render `GestureIcon` in the existing image slot `:185-219`
  when `gesture` present & `image` absent; degrade to text on unknown value).
  **PARALLEL-SAFE: YES** — disjoint paths (`src/game/**` ⟂ `src/render/**`); the ONLY shared knowledge
  is the field contract above (frozen here). `NarrativeScreen.tsx` is Lane B; `narrativeSystem.ts` is
  Lane A — no file overlap. HARNESS: `scripts/screenshot-preview.mjs` UNAFFECTED (captures the
  tutorial's opening panel, not a per-panel loop; dots render from `scene.lines.map`) → NO tooling
  lane needed; icons+bestiary verified by driving panels via `verify` on both `?preview=tutorial`
  contexts (ADR-0015 harness). `docs/agent-handoffs.md` shared/serialized — devs must not edit it
  concurrently. (Winston / Senior Architect)
- rework(dev-r3f-render): **Mobile gesture icons redesigned around a recognizable stylized HAND**
  after Bertrand's "très très bof" on the shipped `two-finger-tap`/`swipe-pan` (old versions read as
  paperclips/blobs — no hand). ONLY `src/render/ui/GestureIcon.tsx` touched. Both mobile hands are now
  a SINGLE continuous fanzine B&W silhouette path (fist + extended finger(s), fill=BODY + INK 3px
  stroke, wider palm, knuckle/thumb detail lines) so no stray finger shapes — new consts
  `HAND_TWO_FINGER` (index+middle up) / `HAND_ONE_FINGER` (index only). `two-finger-tap`: both
  fingertips touch glass, neon `#ffe600` halos flash in SYNC + one ripple from the midpoint; retimed
  loop = dip-to-touch → flash → lift → long rest (never a double-tap). `swipe-pan`: index sweeps,
  fingertip trails the alpha-falloff motion trail, hand lifts mid-travel (new `gi-sp-*-hand` fade) and
  the trail glides to an eased stop; H→V direction cycling kept. Phone frame demoted to thin
  low-contrast context (stroke 1.4 / opacity .28). Desktop `mouse-click` UNTOUCHED. Desktop
  `edge-scroll` glow band given a steeper multi-stop inward falloff (0→.04→.22→.9) so it reads as a
  halo, not an aplat (art-bible §2). prefers-reduced-motion still freezes on a readable frame (hand
  touching, halos on). VERIFY: `corepack yarn typecheck` + `corepack yarn lint` green; drove
  `?preview=tutorial` via the `verify` skill — mobile landscape 844×390 panels 2/3 + desktop panel 3 —
  and confirmed on screenshots both hands read instantly as hands and the falloff is a gradient. No
  commit. (Amelia / dev-r3f-render)
- review-panel + arch triage (stages 6-7, PR #43 `claude/tutorial-visual-improvements-iiepue`):
  4 parallel reviewers (`code-review` high / `bmad-code-review` / `bmad-review-edge-case-hunter` /
  `security-review`) on `git diff origin/main...HEAD`. **No BLOQUANT, no MAJEUR on the shipped
  happy path.** 11 findings CONFIRMED, 2 REFUTED. Winston adversarial triage + owning-lane split:
  · **CONFIRMED → docs lane (applied by Winston in this pass, no production code):** (1) stripped
  stray `</content>`/`</invoke>` tool-call artifact from `docs/game-design/tutorial-visual-gestures.md`;
  (2a) ADR-0020 D2 reworded — the "graceful degradation / never a broken slot" promise is a
  **compile-time** guarantee (closed `GestureKind` union + exhaustive `Record`), NOT a runtime
  fallback (a rogue out-of-union value throws); "never a broken slot" traces to the caller's
  absent-gesture gate. (2b) ADR-0020 D2 signature aligned to shipped `GestureIcon({ kind })` with
  the accessible label on the caller's `role="img"` slot (`aria-label={gestureAlt ?? ""}`), not a
  `label` prop. (8) narrativeSystem.ts module JSDoc "two shipped enemies" → five (comment only).
  (9) ADR-0015 "Amended by" note: ADR-0020 also supersedes D1's "8 panels"/"field ×4" counts
  (now 11 / ×7; structure unchanged). (10) story `Status: ready-for-arch` → `in-review`.
  · **CONFIRMED → `dev-r3f-render` (Lane B, `src/render/**`):** (3) swipe-pan icon animates only
  2 of the 4 gated directions — **DECISION: fix code, extend to the 4-dir cycle\*\* (spec §1.4/§1.5
  - DA2 say four; cheaper than a design-gate re-entry), and dedupe the ~40-line verbatim hand group
    into an SVG `<defs>`/`<use>` so the 4-dir cycle is cheap. (4) edge-scroll `prefers-reduced-motion`
    frozen frame is unreadable (both bands glow at 0.4, cursor centred) → static attrs must encode a
    readable base frame: cursor flat on the RIGHT edge, right band glowing, left band + chevrons at 0.
    (5a) render guard: `role="img"` + empty `aria-label` when a future line lacks `gestureAlt`;
    (5b) image+gesture line whose image 404s shows NO illustration (imageError hides img, gesture
    stays suppressed) — add a fallback to the drawable icon in the degradation chain. (11) extract the
    gesture-slot container style (verbatim copy of the image slot) into a shared const so the "same
    slot" contract holds by construction. · **CONFIRMED → `dev-gameplay` (Lane A, `src/game/**`):**
(5c) widen the XOR + `gestureAlt` invariant tests from the tutorial variants to ALL exported
scenes (pre/post-level lines currently unguarded); (6) fix the HUD-panel copy (panel 9) — the real
top bar (`src/render/ui/HUD.tsx`) renders score/niveau/vague/temps/vies (no elimination counter;
delivery is a separate centered banner), corrected French in the briefing register, keeping the
ADR-0015 device-token pins (no clic/souris/doigt/balay in shared panels); (7) test A5 in
`narrativeSystem.test.ts`is tautological under strict TS (exhaustive Record already guards enum
growth) — **derive-or-drop → DROP** (the compile-time guard is the real check). · **REFUTED
(no action):** new sprite paths "lack existence assertions" (Blind Hunter) — the existing`existsSync` invariant already covers both variants (confirmed by 3 reviewers + acceptance
auditor). "Stale QA PASS" (Blind Hunter major) — MITIGATED not refuted: the post-QA icon rework
was dev-self-verified + orchestrator-reviewed on screenshots; a focused QA re-capture runs AFTER
this fix batch (re-verifies reworked + newly-fixed icons in one pass). **VERDICT: no unresolved
CONFIRMED blocking/major → clear to dispatch the fix batch.** Lanes A and B are path-disjoint
(`src/game/**`⟂`src/render/**`) → dispatched in **parallel**; QA re-capture then re-review of
    the fix diff, then pm accept. (Panel + Winston / Senior Architect)
- pm acceptance (John, stage 8): **ACCEPT-WITH-NOTES.** All 12 ACs verified against the
  shipped artifacts, not just the log: ADR-0020 landed (AC11); `GestureIcon.tsx` ships the four
  icons incl. the 4-direction swipe cycle (AC1-AC4, panel finding #3 fixed); `NarrativeScreen.tsx`
  carries the `role="img"`/`aria-label` a11y guard + image-404→gesture degradation chain (AC10);
  `tutorialInvariants.test.ts` widened to the 11-panel shared set [0,1,4,5,6,7,8,9,10] with the
  gesture-XOR-image, fork-only-[2,3], device-correct and non-empty-`gestureAlt` pins (AC9, AC7).
  Scope CLEAN vs PROJECT_GUIDELINES: conscious documented extension inside the ADR-0012 envelope
  (optional/skippable/informative-only, zero rule added), Belliard pool only, no car/hostage, no
  FLUX (AC5/AC6/AC8). Mobile "très très bof" rejection was reworked around recognizable stylized
  hands + orchestrator screenshot review; the panel's "stale QA" concern is mitigated (not
  refuted) by the render lane's fresh `verify` self-check of the reworked+fixed icons on both
  device contexts — good enough to accept, flagged for Bertrand. NOTES for stage 9 (Bertrand):
  (1) merge only on GREEN final-commit CI (green on prior commit, re-running); (2) the 8→11 panel
  growth is a conscious trade vs the <10s ethos — Karim's gate ruled KEEP 11 and forwarded a
  PROPOSED §5 guidelines codification ("optional non-default skippable stages are budgeted on
  clarity, not the <10s launch→gameplay brevity") awaiting a PM/Bertrand call; (3) no full QA
  re-capture after the icon rework — dev self-verify + screenshot review stood in. Story
  shippable now. (John / PM)

---

### story-audio-licence-attribution

- arch: Boundary verdict PASS — pure debt paydown, ZERO `src/**` touch, NO React/Three
  boundary in play (game↔render↔hooks contract untouched; `audioSystem.ts`/`useAudio`/tier
  wiring explicitly out of scope, no audible behaviour change). Stage-2 DESIGN correctly
  skipped by pm (no gameplay/fiction). **Single lane → `dev-tooling-assets`** owns all three
  work surfaces: `scripts/download-audio.mjs` (dead-code removal + header fix + per-track
  provenance records), NEW `public/assets/audio/CREDITS.md` (shipped credits, MUST sit under
  `public/` so Vite copies it into the build), `README.md` (attribution section). PARALLEL-SAFE:
  **N/A — deliberately single-lane, NOT split.** AC3 (single source of truth, no drift) makes
  splitting these three surfaces across lanes an anti-goal: the attribution strings
  (title/author/source/licence/licence-URL) are shared content, so one agent must author the
  canonical set in one pass to keep them coherent by construction. Fanning out would manufacture
  the exact drift AC3 forbids. `shoot.wav` (AC7) is a separate un-scripted asset — NOT in
  `download-audio.mjs` — so its provenance must be investigated independently (ID3/`ffprobe`/git
  history); binary outcome only: traced record in CREDITS **or** explicit flag-for-replacement
  with recorded FAIL rationale, no silent third path.
  Dev constraints (must respect): (1) `node --check scripts/download-audio.mjs` after edit —
  no syntax break (repo pattern); (2) after removing `TRACKS`/`IA_TRACKS`/`fallback` keys/
  `FALLBACKS`/`getIAFiles` + the orphaned FALLBACKS branch in `main()`, the script still
  downloads EXACTLY the five `CURATED` tracks — NO behaviour change beyond dead-code removal
  (keep `download`/`sleep`/`downloadTrack`/both `http`+`https` imports — the proto switch uses
  both); (3) `rtk lint` clean — zero unused imports/vars/functions post-removal (AC4);
  (4) single source of truth (AC3) — identical attribution strings across the script's per-track
  records, `CREDITS.md`, and README; README may point to `CREDITS.md` as canonical (AC2) to
  shrink the drift surface; (5) verify the five titles against actual file/ID3 before writing,
  do not trust the existing `CURATED` description comments (AC1); (6) do NOT edit this log
  concurrently (orchestrator-serialized) and do NOT touch `src/**`.
  Sequencing with gates: dev lane builds all three surfaces + resolves `shoot.wav` → `yarn build`
  to prove `CREDITS.md` lands in `dist/` (deployed-surface check, AC1) → **`sound-designer`
  (Malik) licence gate (AC8) FIRST** (every shipped file — 5 BGM + `shoot.wav` — must carry a
  verified provenance record; unresolved AC7 blocks PASS) → **`qa-lead` quality gate (AC9)
  AFTER** (`rtk tsc`+`rtk vitest`+`rtk lint` green, script runs clean over the five tracks,
  strings render in CREDITS + README) → architect review → code-review panel → pm accept.
  No new ADR required: the shipped-credits-file convention is a one-file docs surface, not a
  boundary/dependency/contract change; ADR-0018 (audio gate) already governs the provenance
  rule this satisfies — a back-reference in the story suffices. (Winston / Senior Architect)

- release: dev-tooling-assets lane done (no commit by dev). File List: scripts/download-audio.mjs
  (dead TRACKS/IA_TRACKS/FALLBACKS/getIAFiles removed, true CC-BY 4.0 header, per-track
  provenance records), public/assets/audio/CREDITS.md (NEW, canonical credits — 5 BGM
  records + explicit "UNKNOWN PROVENANCE — flagged for replacement" entry for shoot.wav
  with evidence), README.md (§Audio credits pointing to CREDITS.md). ID3-verified titles:
  Funky Chunk / Ouroboros / Sneaky Snitch / Darkest Child / Reformat, all Kevin MacLeod.
  node --check OK, lint/tsc/test (208/208)/build green; CREDITS.md proven in dist/.
  (Amelia, tooling lane)
- AUDIO GATE (AC8, Malik 🎧, first activation): per-asset — 5 BGM PASS (ID3 spot-checked
  himself, CC-BY 4.0 norm strings complete and identical across CREDITS/README/script);
  shoot.wav FAIL (RIFF has no INFO/authorship chunks, no generator script, entered at
  root commit 7db7d6b — provenance unknowable, automatic FAIL per gate-1 licence rule).
  Composite gate outcome: FAIL surfaced honestly; remediation already recorded (flag in
  CREDITS.md, AC7 second branch). ESCALATION to Bertrand: (1) replace SFX in follow-up
  story [Malik recommends], (2) temporary waiver with the shipped flag, (3) remove SFX
  (audible-behaviour change, would trip behaviour gate). Decision requested at merge.

- QUALITY GATE (AC9, Inès 🧪): first run FAIL — sole failing case M4 `yarn format:check`
  RED on public/assets/audio/CREDITS.md (table padding; merge-blocking, CI job + husky).
  Routed to dev-tooling-assets; remedy applied as prescribed (`prettier --write`, padding
  only, zero content change; orchestrator executed the one-command remedy on the lane's
  behalf). Inès re-ran M4 herself → green; re-verdict PASS. Everything else held on first
  run: tsc / vitest 208/208 / lint green; S1-S8 script integrity (dead code gone, both
  http+https imports, no-op run [skip]×5, zero network); AC3 zero drift across the 3
  surfaces; ID3 titles verified from bytes; CREDITS.md proven byte-identical in dist/;
  AC7 explicit flag present; blast radius confined to the 3 dev surfaces. One named
  CI-DEFERRED (non-blocking): fresh-dir download smoke over incompetech.com. Clear for
  stage 6. (Inès, quality gate)

- review-panel + arch triage (stages 6-7): 4 parallel reviewers (code-review-high /
  acceptance-audit / edge-case-hunter / security) on the story diff. 10 consolidated
  findings; Winston adversarial triage: the sole MAJEUR (download() open-redirect +
  https→http downgrade, no checksum) REFUTED as introduced — byte-identical to main,
  pre-existing, dev-tool-only → FOLLOW-UP TICKET "harden download-audio.mjs redirects:
  https-only + hop cap". 6 minors CONFIRMED and fixed in the touch-up commit: Ouroboros
  ID3 variant noted + "unmodified verbatim downloads" statement (CC-BY §3(a) complete),
  QA-plan grep literal aligned to the shipped em-dash norm string, stale release line
  dropped, script header "shipped with" wording, shoot.wav record now cites
  docs/roadmap.md:65 ("generated and wired") and re-weights to "likely original
  project work, unconfirmed". 2 REFUTED (no change): MUST-match wording, shoot.wav
  reuse notice. FOLLOW-UP TICKET #2: in-game/footer link to CREDITS.md (conscious-
  extension backlog). Integration sign-off: PASS, zero boundary risk, zero unresolved
  CONFIRMED blocking/major. Escalation to Bertrand REFRAMED per the roadmap evidence:
  confirm shoot.wav was generated in-project (→ PASS as original work) or order the
  replacement story. (Panel + Winston; orchestrator applied the touch-up)

- pm acceptance (John, stage 8): ACCEPT-WITH-NOTES. All 10 ACs verified from the
  artifacts (AC8 = composite FAIL-escalated BY DESIGN, the story's contracted path).
  Scope clean vs PROJECT_GUIDELINES (pure compliance, core loop untouched, out-of-scope
  respected). Remaining stage-9 human decisions for Bertrand: (1) shoot.wav — confirm
  in-project generation (flips record FAIL→PASS as original work) / order replacement
  story / temporary waiver; (2) greenlight or backlog the two follow-up tickets
  (downloader hardening; in-game credits link). Story shippable now. (John / PM)

- stage 9 (Bertrand): MERGE authorized explicitly for PR #44 (squash on green CI).
  shoot.wav decision: in-project generation NOT confirmable -> REPLACEMENT ORDERED
  (follow-up story, sound-designer lane, per Malik's recommendation); decision recorded
  in CREDITS.md. Follow-up tickets standing: downloader redirect hardening; in-game
  credits link. (Bertrand via orchestrator)

---

### story-live-neon-rim

- pm→arch: Story written (`_bmad-output/planning-artifacts/story-live-neon-rim.md`),
  branch `claude/art-pipeline-graphist`. WHAT: decouple neon from FLUX generation — vehicles
  ship as pure B&W xerox sprites, the loi du glow moves to `src/render` as an emissive
  alpha-edge neon rim, hue from `levelArt.json.vehicles.types.*.neon`. WHY: kills the FLUX
  body-flood at its source (the neon token), one shader/three hues makes family consistency
  structural, and a live rim enables pulse/flicker as real signals (both follow-ups).
  Scope test: conscious documented extension, already established by the bible's loi du glow —
  no new scope surface, only relocates where the signal is produced. AC1–AC7: B&W sprites
  load, rim renders in the type's hue (same hue→color as generation, no forked palette),
  rim visible at game size in the delivery beat, ZERO `src/game/**` changes, e2e-delivery
  green, art gates green, verified in-browser. OUT OF SCOPE: pulse/flicker animations,
  enemies rim (all follow-ups). HANDOFF to `senior-architect` (cross-cutting: `src/render`
  - shared hue source of truth + likely ADR): own lane partition, the boundary-clean
    alpha-edge rim approach, and the single hue→color source-of-truth decision (name→hex map
    currently lives ONLY in `scripts/gen-vehicle-sprites.mjs` `NEON_HEX` — do not fork it in
    render). No commits made by pm. (John / PM)

---

### story-narrative-coverage

- arch: Boundary verdict PASS. Lane A → `dev-gameplay` owns `src/game/**` (new file
  `src/game/systems/__tests__/narrativeSystem.test.ts`, pure-logic test, no React/Three deps —
  existing `narrativeSystem.ts` confirmed import-free, exports `PRE_LEVEL_NARRATIVE` +
  `POST_LEVEL_NARRATIVE` only). Lane B → `dev-tooling-assets` owns tooling
  (`package.json` script entry + new file `scripts/test-affected.mjs`). File sets are
  disjoint — no path overlap between `src/game/**` and `scripts/**`/`package.json`.
  PARALLEL-SAFE: YES. Coordination file `docs/agent-handoffs.md` is shared and serialized
  by the orchestrator; devs must not edit it concurrently. (Winston / Senior Architect)
- release: Lane A + Lane B built CONCURRENTLY on disjoint paths; neither dev edited this
  log (serialization respected). Lane A (`dev-gameplay`) → new `src/game/systems/__tests__/narrativeSystem.test.ts`,
  5 tests covering A1–A4. Lane B (`dev-tooling-assets`) → new `scripts/test-affected.mjs`
  - `package.json` `test:affected` script. (Amelia ×2)
- review: PASS. Boundaries intact. Lane A executed for real (isolated vitest): 5/5 green.
  Lane B `node --check` OK; `codegraph affected src/game/systems/narrativeSystem.ts`
  correctly resolved the new test file — codegraph integration verified end-to-end.
  Accepted vs story acceptance criteria. (Winston review + John acceptance)

---

### story-ingame-render-gate

- release: `dev-tooling-assets` (tooling lane, `scripts/**` + `.github/**` only — no
  `src/` touched). Added a CI "in-game smoke" gate that boots the prod build, enters one
  level (belliard) for real, and blocks the gh-pages publish if the R3F/WebGL game scene
  fails to render. Complements `e2e-home.mjs`, which is pure-DOM and cannot see a broken
  game scene. File List: NEW `scripts/e2e-ingame.mjs`, NEW `.github/actions/e2e-ingame/action.yml`;
  MOD `.github/workflows/deploy.yml` (gating step + artifact upload, before publish),
  `scripts/SCRIPTS.md` (docs), `.gitignore` (`screenshots/e2e-ingame.png`). Verified with
  `node --check` + YAML parse; Playwright itself runs in CI (browser mismatch locally).
  (Amelia — Tooling & Assets)

---

### story-vehicle-delivery — Lane A (dev-gameplay, `src/game/**` only)

- done: Replaced abstract cargo with the scripted vehicle-delivery core loop (`Livrer` =
  protect the vehicle). Pure logic + TDD. START/FINISH same session.
- File List:
  - NEW `src/game/types/delivery.ts` (`VehicleType`, `DeliveryPhase`, `DeliverySpec`,
    `DeliveryVehicle`).
  - REWROTE `src/game/systems/deliverySystem.ts` (`tickDelivery` state machine +
    `seedDeliveryVehicle` + tuning consts).
  - REWROTE `src/game/systems/__tests__/deliverySystem.test.ts` (19 tests).
  - MOD `src/game/types/gameState.ts` (removed `cargo`; added `deliverySpec`,
    `deliveryVehicle`, `elapsedSeconds`, `kills`).
  - MOD `src/game/types/index.ts` (export delivery types, drop `Cargo`).
  - DELETED `src/game/types/cargo.ts`.
  - MOD `src/game/levels/levels.ts` (`deliveries` per level: belliard=truck,
    stalingrad=car, vitry=moto; removed `cargoPickup`/`cargoDepot`).
  - MOD `src/game/systems/stateMachine.ts` (seed + tick delivery, fold bonus into score,
    victory now gated on `kills >= enemiesToWin` NOT score).
  - MOD `src/game/systems/__tests__/stateMachine.test.ts`.
- verify: `vitest run` 123/123 green; `eslint src/game` clean; `tsc` clean for
  `src/game/**` + `src/hooks/**`.
- HANDOFF to Lane B (`dev-r3f-render`): `GameState.cargo` is GONE. Read
  `GameState.deliveryVehicle: DeliveryVehicle | null` instead (fields: `phase`, `position`
  world-space Vec2, `vehicleType`, `integrity`, `integrityMax`, `windowRemaining`). Draw
  only when `phase !== "IDLE" && phase !== "GONE"`; HUD gauge during `"DELIVERING"`. The
  render lane must also drop `CargoMarkers.tsx`, the `@game/types/cargo` imports, and map
  `LevelConfig.deliveries[0]` → `LevelParams.delivery` in `App.tsx`. tsc currently red ONLY
  in `src/render/**` for these — expected, owned by Lane B. (Amelia — Gameplay)

## dev-r3f-render (Amelia — Render) — story-vehicle-delivery Lane B — FINISH 2026-07-04

- Scope: `src/render/**` + forward in `App.tsx`. Renders `GameState.deliveryVehicle`
  only; zero game rules. START/FINISH same session.
- File List:
  - NEW `src/render/scene/DeliveryVehicleSprite.tsx` (pooled single mesh, `stateRef`-driven
    in `useFrame`, no per-frame React re-render; texture `assets/vehicles/${vehicleType}.png`
    lazily cached by type via `import.meta.env.BASE_URL`; visible only when
    `phase !== "IDLE" && phase !== "GONE"`; flips to face travel direction; fires
    `onHudChange` to the DOM HUD only on phase / rounded-integrity change).
  - DELETED `src/render/scene/CargoMarkers.tsx`.
  - MOD `src/render/scene/GameScene.tsx` (drop `CargoMarkers` + `@game/types/cargo`; mount
    `DeliveryVehicleSprite`; `onCargoStatus` prop → `onDelivery`).
  - MOD `src/render/ui/HUD.tsx` (drop `cargoStatus`/`CargoStatus`; add `HudDelivery`
    (`phase`/`integrity`/`integrityMax`); "LIVRAISON — PROTÉGEZ LE VÉHICULE !" banner +
    neon integrity gauge during `DELIVERING`; brief SUCCESS/FAILED feedback).
  - MOD `src/render/scene/App.tsx` (`buildLevelParams` maps `level.deliveries[0] ?? null`
    → `LevelParams.delivery`; HUD channel `onCargoStatus`→`onDelivery`, preserve
    `prev.delivery` across HUD refreshes).
- verify: `tsc -p tsconfig.json --noEmit` clean (0 errors, whole tree incl. render);
  `eslint src/render` clean; `prettier --check` clean on all touched/created files.
  (Amelia — Render)

---

### epic-enemies-car-hostage — architecture sign-off (ADR-0004)

- arch: Cross-cutting epic touching game + render + hooks + scripts. Boundary verdict PASS
  (game stays pure, render stays logic-free, `useGameLoop.ts` is the only bridge,
  `HUD.tsx` stays type-only). Two open decisions ACTED in `docs/adr/0004-enemies-car-hostage-taker.md`
  (Status: Accepted): (1) `energy` — option **a**, a `readonly energy: number` 0–100 slice on
  `GameState`, hostage is the sole V1 consumer, pure clamp in `energySystem.ts`, HUD read-only;
  (2) car shooter-seat — bestiary §2.3 **confirmed** (shooter on the trailing seat per `dir`,
  muzzle flash + bullet origin on the trailing side, sprite mirrored, driver never fires).
  SHARED FILES requiring serialisation across S1/S2/S3: `stateMachine.ts`, `levels.ts`,
  `enemy.ts`, `enemyTypes.ts`, `feedback.ts`, `useGameLoop.ts`. Sequence gate: **S1 must land
  first** (it introduces the roster seam + `pickKindFor`); S2 and S3 then run in parallel on
  disjoint _new_ paths but coordinate their `stateMachine.ts` / `levels.ts` / `enemy.ts` edits
  serially (merge-order, not concurrent edit). (Winston / Senior Architect)

### story-level-roster-belliard (S1) — gate, must land first

- arch: Single-lane → `dev-gameplay` only. No `src/render/**`, no asset script (pure scaffolding).
  Claimed files: `src/game/levels/levels.ts` (add optional `roster` on `LevelConfig` +
  `belliard.roster = { streetSpawns: ["courier"] }`), `src/game/types/enemyTypes.ts` (add
  `buildWeighted` + `pickKindFor(seed, weights)` siblings — **do NOT mutate** `pickKind`/`WEIGHTED`),
  `src/game/systems/enemySystem.ts` (`spawnWave` gains optional weights arg, defaults to `pickKind`),
  `src/game/systems/stateMachine.ts` (thread `roster` via the level-params/options object into
  step-7b street block + `spawnWave`; **owns the shared-file edit first**),
  `src/hooks/useGameLoop.ts` (pass active level's `roster` into `tickGameState`),
  new `src/game/systems/__tests__/levelRoster.test.ts` (AC1 byte-for-byte snapshot, AC2–AC4).
  PARALLEL-SAFE: N/A (single lane, blocks S2/S3). Released: see below.
- release: RELEASED (dev-gameplay / Amelia). TDD: 15 new tests written RED first, then GREEN.
  AC1 (byte-for-byte) — `pickKindFor(seed, buildWeightedFrom(defaults)) === pickKind(seed)` over
  500 seeds + `spawnWave` legacy-vs-default equality over 8 waves + frozen-sequence inline snapshot.
  AC2 — override merges `{ ...defaults, ...windowWeights }`, `weight:0` drops the kind, no mutation
  of `WEIGHTED`. AC3 — `streetSpawnsCourier(["courier" | ...])` / `undefined` ⇒ true. AC4 — `[]` /
  courier-omitted ⇒ false, never throws. Files:
  • `src/game/types/enemyTypes.ts` — `export WEIGHTED` + new `buildWeightedFrom` + `pickKindFor`
  (`pickKind`/`WEIGHTED` logic unchanged; `EnemyKind` union untouched).
  • `src/game/levels/levels.ts` — new `LevelRoster` interface + optional `roster?` on `LevelConfig`;
  `belliard.roster = { streetSpawns: ["courier"] }`. `stalingrad`/`vitry` UNCHANGED (no roster).
  • `src/game/systems/enemySystem.ts` — `spawnWave(wave, facade, weights?)`; absent ⇒ `pickKind`.
  • `src/game/systems/courierSystem.ts` — new pure `streetSpawnsCourier(streetSpawns?)` gate.
  • `src/game/systems/stateMachine.ts` — thread optional `roster` into `createInitialState` +
  `tickGameState`; `windowPoolFor(roster)` feeds both `spawnWave` sites; courier spawn gated by
  `streetSpawnsCourier(roster?.streetSpawns)`.
  • `src/hooks/useGameLoop.ts` — optional `roster` param plumbed into the state machine (bridge seam).
  • `src/render/scene/GameScene.tsx` — resolve `roster` from `levelId` via `LEVELS`, pass to hook.
  • new `src/game/systems/__tests__/levelRoster.test.ts` — AC1–AC4, 15 tests.
  Verification: `rtk vitest` 107 PASS / 0 FAIL · `rtk tsc` no errors · `rtk lint` no issues.
  Boundary: zero React/Three under `src/game`. S2/S3 unblocked. (Amelia / dev-gameplay)

### story-car-drive-by (S2) — requires S1

- arch: Three lanes, disjoint on NEW paths; shared files coordinated post-S1.
  `dev-gameplay`: new `src/game/types/car.ts`, new `src/game/systems/carSystem.ts`
  (`spawnCar`/`tickCars`/`carSpawnInterval`/`checkCarHits`, pure, modelled on `courierSystem.ts`),
  new `src/game/systems/__tests__/carSystem.test.ts`; SHARED-serial: `enemy.ts` (+`"car"`),
  `enemyTypes.ts` (`ARCHETYPES.car`, excluded from `WEIGHTED`), `levels.ts`
  (`belliard.roster.streetSpawns += "car"`), `stateMachine.ts` (add `cars` to `GameState` +
  `createInitialState`, tick gated by `streetSpawns.includes("car")`).
  `dev-r3f-render`: new `src/render/scene/CarSprite.tsx` (mirror on `dir`, muzzle flash on
  trailing side per ADR table — logic-free); SHARED-serial seam: `useGameLoop.ts` (car field
  plumb if needed). `dev-tooling-assets`: new `scripts/gen-car-enemies.mjs`,
  `scripts/cutout-enemies.mjs` (extend), `src/render/scene/enemyTextures.ts` (register `car_*`).
  PARALLEL-SAFE: YES across the three lanes on new paths; the five shared files are serialised
  (S2 takes them after S1 releases). Render runs before assets exist (cop fallback). Released: pending.

### story-hostage-taker (S3) — requires S1, independent of S2

- arch: Three lanes. `dev-gameplay`: new `src/game/types/hostage.ts` (street entity +
  double-hitbox shape), new `src/game/systems/energySystem.ts` (pure clamp), new
  `src/game/systems/hostageSystem.ts` (window+street spawn, `EXECUTES` extension, hostage-precedence
  resolver), new `__tests__/hostageSystem.test.ts` + `__tests__/energySystem.test.ts`;
  SHARED-serial: `enemy.ts` (+`"hostage_taker"`, +`EXECUTES` state), `enemyTypes.ts`
  (`ARCHETYPES.hostage_taker`), `feedback.ts` (optional `energyDelta`, default 0),
  `enemySystem.ts` (timeout→`EXECUTES` route, other kinds byte-identical), `stateMachine.ts`
  (`energy: 100` init + `hostageTakers` array + energy aggregation), `levels.ts`
  (`belliard.roster` += windowWeights.hostage*taker≈8 + streetSpawns).
  `dev-r3f-render`: new `src/render/scene/HostageTaker*.tsx`(kidnapper + foreground hostage,
rising-tension countdown, execution beat, mirror on`dir`); SHARED-serial: `src/render/ui/HUD.tsx`
(+`HudData.energy?`, read-only energy display), `useGameLoop.ts` (`floaterFor`energy label +
`onHudUpdate`energy plumb — coordinate with S2 on this file).`dev-tooling-assets`: new
`scripts/gen-hostage-enemies.mjs`, `cutout-enemies.mjs`(extend),`enemyTextures.ts` (register`hostage\*\*`). PARALLEL-SAFE: YES across lanes on new paths; shared files serialised;
**`useGameLoop.ts` is the one file S2 and S3 both touch — serialise S2 then S3 on it.\*\*
  Released: pending.

### mobile-two-axis-pan + fullscreen-toggle (WI-1 / WI-2, PR #29 `claude/mobile-landscape-adr-awjl8z`)

- arch: TWO lanes, ZERO file overlap, both branches typecheck in isolation → fully parallel, no sequencing.
  **Lane G (dev-gameplay)** owns the pan contract end-to-end: `src/game/types/cameraPan.ts`
  (`{x,y,vx,vy}` flat), `src/game/systems/cameraPanSystem.ts` (2D signatures — see plan),
  `src/game/systems/__tests__/cameraPanSystem.test.ts` (Y + cross-axis coverage, TDD),
  `src/hooks/useTouchControls.ts` (+`panDeltaY`/`flickVelocityY` + `data-muf-ui` preventDefault
  exemption), `src/hooks/useGameLoop.ts` (`MobileControls.halfWorldHeight`, 2-axis pan applied to
  `camera.position.x`+`.y`), and the ONE render line `src/render/scene/GameScene.tsx`
  (`halfWorldHeight: facadeH/2` added to the `mobileControls` object — moved into Lane G to keep
  the interface + its call site in one branch and dodge the object-literal excess-property compile
  hazard). **Lane R (dev-r3f-render)** owns fullscreen + shell: new `src/hooks/useFullscreen.ts`,
  new `src/render/ui/FullscreenButton.tsx` (renders null when unsupported, `data-muf-ui`, zIndex 300),
  `src/render/scene/App.tsx` (rename `withRotateGuard`→`renderAppShell`, append `<FullscreenButton/>`
  to every branch), new `docs/adr/0008-two-axis-pan-and-fullscreen.md` + `docs/adr/README.md` index row.
  Lane R does NOT touch GameScene or useGameLoop. PARALLEL-SAFE: YES (disjoint file sets).
  ADR: new ADR-0008 (extends ADR-0003 D4 to Y; realizes the fullscreen item deferred in 0003) —
  0003 stays immutable, NOT edited. HIGH RISK flagged to PM: vertical pan has no `cameraOffsetY`
  in the shot path (`fireBullet`/`crosshairToWorld` ignore camera.y) → taps after a vertical pan
  land at the wrong world-Y; pan-only scope leaves aiming broken on panned windows. Needs a PM
  ruling (fast-follow WI-3 aim fix, or ship documented). (Winston / Senior Architect)
- release: pending.

---

### story-push-marker-dispatch (PR #27 — file-marker workflow dispatch)

- review-cycle: Cross-cutting change to the CI dispatch mechanism (touches
  `.github/**`, `docs/**`, and regenerated `public/assets/vehicles/*.png`). Reviewed
  by 5 reviewers; Scrum Master triaged all reports; a focused debate (Q1–Q5) resolved
  the open architecture/CI-cost calls; work then partitioned into parallel lanes on
  disjoint paths (DOCS ⟂ TOOLING/`.github` ⟂ QA/ci-e2e). Boundary verdict: PASS —
  nothing touches `src/game`/`src/render`/`src/hooks`; the game↔render↔hooks contract
  is untouched. (Winston / Senior Architect)
- confirmed fixes (in-PR): ADR bot-commit/no-CI consequence (A1); preview.yml
  exclusion reworded as "redundant, not impossible" (A3, Winston); concurrency-group
  collision fixed by renaming `deploy-preview.yml` group to
  `deploy-preview-${{ github.ref }}` (A5 — Winston's "out of scope" OVERRULED by SM,
  conceded: edge-case hunter showed a `deploy-preview` marker touch on the style
  branch drops both `deploy-preview.yml` and `preview.yml` into the same
  `cancel-in-progress` group); `branches-ignore: ["main"]` on all marker triggers
  (a merge would otherwise fire `gen-vehicle-sprites` FORCE=1 on `main`);
  `ci(dispatch):` head-commit-message job guard against merge/rebase/deletion
  propagation firings; **bounded 3-attempt** push retry-rebase in the gen workflows;
  branch-slug sanitization + env-quoting of branch-derived values (shell-injection
  sink); `noindex` meta on previews; `@napi-rs/canvas` npm pin. QA ships in-PR: new
  e2e job in `ci.yml`, 404 gate, e2e-assets sweep, menu assertions, vitest
  consistency test. (SM triage)
- debate resolutions (Winston's positions adopted):
  - Q1 (marker trigger scope): `branches-ignore: ["main"]` only — branch-prefix
    allowlist REJECTED for a two-actor repo (push triggers never fire from forked-PR
    contexts, so untrusted surface is already nil; an allowlist would silently no-op
    ad-hoc human branches). Revisit on first external contributor.
  - Q2 (delivery-loop e2e vs `deploy.yml`): land in-PR but `continue-on-error` for one
    soak cycle; promote to a hard release gate in a follow-up once it has clean green
    history — a first-appearance e2e must never block publishing the live site.
  - Q4 (game-over/score e2e): hook-free route — assert on the already-rendered DOM
    contract (HUD score in `src/render/ui/HUD.tsx`, `EndScreen.tsx`) driven by
    deterministic inputs, same pattern as the frozen-cops delivery smoke. A
    `window.__MUF_*` state seam is REJECTED as boundary erosion; if a state ever proves
    unobservable from the DOM, add a test-only bridge strictly in `src/hooks` under a
    new ADR — never importable from `src/game`.
  - (Q3/Q5 resolved by SM + other reviewers; captured in their triage records.)
- A6 hygiene (accepted, not fixed): the PR bundles the dispatch mechanism with its
  first output (the regenerated truck/car/moto FLUX PNGs). Mildly mixes "add the
  mechanism" with "run it once"; accepted as-is — correct `dev-tooling-assets` lane,
  no boundary impact.
- follow-up stories (8):
  1. promote `e2e-delivery` from `continue-on-error` soak to a hard `deploy.yml` gate.
  2. transitions / pause e2e coverage.
  3. hook-free game-over/score e2e (`window.__MUF_*` seams rejected; if ever needed, a
     bridge lives in `src/hooks` only, gated by its own ADR).
  4. preview cleanup job on branch deletion (reap `preview/<branch>/` on `gh-pages`).
  5. chroma-key improvements (glow-halo / shadow-box handling).
  6. narrative `?preview=` + prefs-persistence e2e.
  7. conditional sprite-prompt workshop — only if batch 2 fails the acceptance floor
     (neon glow on all three vehicles + car reads as a hatchback).
  8. revisit the branch-prefix allowlist on the first external contributor (Q1 trigger).
- LANE-DOCS release: `docs/adr/0009-push-marker-workflow-dispatch.md` (canonical idiom,
  `branches-ignore`, guard contract, marker-on-first-dispatch, preview.yml reword, new
  Consequences bullets + Security consequences subsection), `docs/ci.md` (dispatch
  section rewrite + quick-ref row `actions: write`), `docs/agent-handoffs.md` (this
  block). No `.github/**` or `scripts/**` touched — those are other lanes' live edits.
  (Winston / Senior Architect — DOCS lane)

---

### story-sprite-prompt-workshop (follow-up 7) — PROMPT GATE

- gate: **PASS (with reservations)** on the `vehicles` prompt rework (Maud, drafts in
  `docs/art-direction/prompt-drafts.md`). Assembled prompts obey the bible §3: **zero
  negations** (the headline fix — old set carried 6-7), medium+view front-loaded (§3.2),
  hex-bound colours (§3.5), one xerox primary style (§3.4), `neonPhrase` carries the law
  of glow with hue from the `neon` field (§2.1, no hardcoded hues), shared `opening`/
  `neonPhrase`/`style` are byte-identical by construction so family consistency (§2.2) is
  structural. Car sedan-FAIL fix endorsed: "one-box monospace city car" + "hood and
  windshield in one continuous slope" is the correct anchor — I REJECTED adding a
  "hatchback" class noun (a hatchback is two-box, would fight the one-box slope; §3.7 trap).
  No prompt clause needs rework; Maud does NOT iterate. (Nico / Lead-Art)
- BLOCKER (not Maud's — `dev-tooling-assets`): `scripts/check-art-prompts.mjs` hard-fails
  these correct prompts with 3 ERRORs and will red CI. It lints `STYLE_TOKENS` against the
  `vehicles.style` field alone, but the §4 four-slot split legitimately moved side-view →
  `opening` and neon → `neonPhrase`, and §3.1 forbade the anti-photoreal _negation_ the
  linter still REQUIRES. Fix before merge: lint the ASSEMBLED prompt across all four slots,
  and let the anti-photoreal token accept positive phrasing ("flat 2D video game sprite",
  "photocopied fanzine illustration", "black and white") instead of demanding "not photoreal".
- bible: amended §3.3 word ceiling 80 → 90 (assembled), reconciling the four-slot reality;
  every added clause verified load-bearing, no filler found. (Nico / Lead-Art bible gate)
- watch at ASSET gate: (1) xerox/halftone treatment sits at words ~56-89 (weak attention
  tail) — verify it did not wash out; the set will drift _together_ so §2.2 holds even if
  §1 fidelity softens. (2) "black and white except the neon" vs stray colour in the body
  (toner-tint OK, full colour FAIL). (3) moto is a §5-verbatim chimera (Booster fat wheels +
  103 exposed frame) — accept if it reads as skeletal moped + top-box; re-anchor to one bike
  if it renders confused. (4) car "corner-mounted wheels" — if wheel placement reads wrong,
  swap to §5 verbatim "wheels pushed to the corners" next iteration. (Nico / Lead-Art)

---

### story-sprite-prompt-workshop (follow-up 7) — ASSET GATE

- verdict: **ITERATE — 3/3 FAIL, set fails family (§2.2). Over the 2-batch cap
  (seed-reroll was batch 2), so this is NOT a self-authorized reroll → options to
  Bertrand.** Mechanical pre-check does not bind; taste FAILs where the machine passed.
- truck (seed 1337): **FAIL** — §1 identity + §2.1. Body is a solid ORANGE fill, not
  B&W xerox with an orange edge-rim (mechanical neon 37.3% confirms the flood). This is
  exactly watch-item (2): full colour in body = FAIL. No high-contrast B&W read survives.
- car (seed 42): **FAIL** — §2.1 (nothing decorative glows): a neon-cyan skyscraper
  SKYLINE glows behind the car — decorative glow, and it breaks the §3.5 flat matte-black
  ground the sprite is chroma-keyed on. Corner-sampling mechanical missed it (cityscape
  sits inside the frame → "grounds 100% clean" is a false pass — textbook why the machine
  doesn't bind). Secondary: reads low/long fastback, not the tall one-box glasshouse
  city-car of §5 (proportion miss, not a class miss). NB body treatment (black + cyan
  rim, glowing wheels per neonPhrase) is the ONLY on-direction one of the three.
- moto (seed 8128): **FAIL** — §1 + §2.1, same body flood as truck (magenta panels, not
  B&W + rim). Cleared watch-item (3): reads as a coherent skeletal moped + top-box, NOT a
  chimera. Cleared (4): wheels read fine. Fails only on the colour flood.
- root causes are TWO, not one → no single-variable reroll fixes the set: (a) truck+moto
  body-flood traces to `neonPhrase` "glowing along the whole silhouette" — FLUX reads
  "whole silhouette" as fill the body; (b) car has a decorative background + proportion.
- vs previously PM-accepted set: mixed, not yet better to ship — WIN: right seeds, moto
  chimera cleared, car finally shows the correct black-body + neon-rim treatment (the
  actual direction). LOSS: two bodies regressed to full colour, car smuggled a glowing
  skyline. Not a family-consistent, shippable run.
- options for Bertrand (all exceed the 2-batch cap → your call): (1) spend batch 3 with
  two coordinated prompt edits — reword `neonPhrase` to "thin outline edge-rim only, body
  pure B&W xerox" (fixes truck+moto flood) + harden car ground/proportion; I re-gate the
  prompts first. (2) kontext style-lock (§3.12/§7): fix the car, make its black-body+rim
  the family hero, derive truck+moto image-to-image from it — strongest §2.2 guarantee,
  no fresh prompt batches. (3) override + ship as-is (only you may override a FAIL).
  (Nico / Lead-Art — asset gate)

---

### story-sprite-prompt-workshop (batch 3) — TECHNICAL PASS (Serge / game-graphist)

- scope: metered the batch-3 PNGs (commit a20a2c5) at real in-game scale. Mechanical
  `check-sprite-style.mjs` re-verified PASS 3/3 (but see flood note — the gate is blind to it).
- alpha: **hard-binary on all three (0.00% semi-transparent)** — no soft feathered fringe,
  nothing to alpha-harden. "crisp cutout edges" already holds on the alpha channel.
- keyed edge (boundary-ring dark+saturated glow remnant, my [S4] metric): **truck 54%**
  (dark-orange), **car 74%** (dark green-cyan), **moto 9%** (borderline-neutral → clean).
  Hot isolated pixels (disconnected strays): truck 6px/5 islands, car 18px/14, moto 26px/17
  — all <0.2% of opaque, trivial.
- body treatment (the blocker, gate-blind): **truck ORANGE FLOOD** (neon-band 44% of content),
  **moto MAGENTA FLOOD** (pink panels, band 8%) — both §1/§2.1, NOT B&W xerox + rim. **car**
  black body + cyan rim is ON-DIRECTION but carries a large **connected** glowing cyan
  cabin/cityscape mid-frame (§2.1 decorative glow / [S7] glasshouse over-read; it is part of
  vehicle component #0, box spans it → NOT a removable stray). truck silhouette low (38%
  canvas height) reads generic van, not tall-cargo ([S5] confirmed).
- retouch decision: **NONE — deferred.** Every sprite is blocked by a DIRECTION failure
  outside the retouch remit: body flood (repaint = artistic alteration) and the car's
  connected cabin (content removal = artistic alteration) — both force **regeneration**. The
  edge halo, though real, is invisible against the flooded bodies (truck orange-on-orange) or
  dwarfed by the car cabin; retouching sprites that must be regenerated = gratuitous
  processing. Retouch is deferred to the corrected (de-flooded) batch, where the edge shows
  against a B&W body and will not be thrown away. Deterministic op spec recorded in
  `prompt-drafts.md` (batch-3 technical-pass note) so it lands in one sitting next pass.
- verdict: **0/3 technically shippable — NOT on edge hygiene (edges are sound) but on body
  flood (truck/moto) + decorative cabin & low/long proportion (car).** The batch-3 "body
  staying pure black-and-white xerox" prompt edit did not hold against FLUX. Recommend another
  anti-flood iteration or the kontext hero-lock (§3.12) before any retouch pass. Nico's ASSET
  GATE owns the taste verdict; my technical read (edges clean, flood/cabin are the blockers)
  is advisory and his gate wins. (Serge — game-graphist, technical pass)

---

### story-decoupled-bw-vehicles — TECHNICAL PASS (Serge / game-graphist)

- scope: metered the first decoupled B&W batch (commit 42095d1, magenta chroma-key ground per
  my [S1]). Mechanical `check-sprite-style.mjs` PASS 3/3 (bw mode) — but a FALSE pass on the
  car, see gate gap.
- **[S1] magenta-key VALIDATED (the silhouette half):** alpha hard-binary on all three
  (0.00% semi), boundary ring ~0% magenta (truck 0 / moto 0 / car 12%), black ink linework
  preserved, interior whites survived, and — my key concern — **the moto tube frame survived
  intact** (black-on-black ground would have flood-eaten it; on magenta it keys clean). No
  eaten contours. The eaten-silhouette risk of the decouple is solved.
- **NEW defect — magenta COLOR CAST bleeds into the B&W render (deep interior, not fringe):**
  strong-colored (S>0.40) share = truck 22% / moto 27% (+42% faint) / **car 54% (meanSat
  0.41 — body-wide pink)**; hue is a consistent crimson/magenta 330-360° across all three
  seeds → it is GROUND SPILL, not design. Violates §1 "fully black and white". The car is the
  low-contrast render that soaked up the most. This is a GENERATION-pipeline contamination:
  the pipeline keys the ground but never forces the sprite back to B&W.
- **retouch decision: NONE.** The cast is a body-wide tonal problem, not edge hygiene — my
  remit (fringe/halo/alpha/quantize) and my documented spec (stray + boundary-clamp + alpha)
  do not cover a global desaturation, which would also be a tonal alteration and would leave
  the low-contrast car muddy. Strays are trivial (truck 4px / car 46px / moto 37px). Cleaning
  them now is throwaway: the set must be re-processed at source to kill the cast, which
  regenerates every pixel. Alpha already hard-binary → nothing to harden.
- **SOURCE FIX (dev-tooling-assets + Maud, not retouch):** add a **grayscale / force-B&W step
  AFTER the magenta key** in `gen-vehicle-sprites.mjs`. Key on the colour image first (clean
  silhouette, proven here), THEN desaturate the keyed sprite → neutralises the ground spill in
  the body while keeping the clean cut. This is the missing companion to my [S1] ground change
  (flagged then as a coordinated tooling change). Rim bake (ADR 0011) is unaffected either way
  (it reads alpha, not colour), but the visible sprite must be true B&W.
- **GATE GAP (flag for tooling):** the bw-mode flood-kill counts only high-sat AND high-val
  pixels in ONE hue band (≤18%). The car reads **12.39% magenta → PASS** while being 54%
  strong-coloured to the eye, because the pink cast is medium-value. The gate green-lights a
  pink sprite. Recommend a mean-saturation ceiling or a medium-val saturated-pixel count so a
  body-wide cast trips it.
- silhouette reads at game size: **[S5] truck improved** — boxy tall-cargo roofline (43% canvas
  height vs batch-3's 38% low van; front cab/hood steps down, cargo box tall), acceptable, final
  taste to Nico. **[S7] car** — got the tall rear phone-booth glasshouse but overall reads long
  wagon/estate (aspect 3.3), not the short tall one-box city car of §5; silhouette taste concern
  for Nico on top of the cast. **moto** coherent skeletal moped + top-box, frame intact.
- verdict: **0/3 technically clean — but for a NEW, narrower reason (magenta cast) and the
  decouple's core risk (eaten silhouette / colour flood) is now SOLVED.** One source step
  (grayscale-after-key) + a gate tightening away from a clean set; then a fringe/stray retouch
  pass from me if needed. Per sprite: truck CLOSEST (cast mostly enclosed window crimson,
  B&W-ish body) — likely clean after the source fix; moto coherent but pink-cast; car WORST
  (severe body-wide cast + long-wagon silhouette + falsely gate-passed). Back to
  dev-tooling-assets/Maud for the B&W step; Nico's asset gate owns the silhouette taste calls.
  (Serge — game-graphist, technical pass)

---

### story-sprite-prompt-workshop (follow-up 7) — PROMPT re-GATE (batch 3b)

- verdict: **PASS — dispatch batch 3b on `claude/art-pipeline-graphist`.** Both
  Bertrand-authorised option-1 edits land correctly on the two root causes; Serge's one
  blocker (rim over-correction) is resolved in 3b. New link Serge (game-graphist) noted.
- neonPhrase rim ([S1]/[S2] fix): **PASS** — "a bright, crisp {neon} ({hex}) acid neon
  rim light, a clean band a few pixels thick tracing only the outer edge and wheel rims,
  body staying pure black-and-white xerox." Brightness-led + thickness FLOOR is the right
  call (value survives the in-lane downscale, stroke-area doesn't); "only the outer edge"
  keeps the anti-flood limiter that fixed my §1/§2.1 body-flood FAIL; positive B&W body in
  the strong zone; {neon}/{hex} stay data-bound (§2.1); zero negations ("only"/"a few" are
  limiters); "acid neon rim light" keeps the loi-du-glow lint token. Good.
- car subject: **PASS** — "completely alone, empty surroundings" is the positive antidote
  to the smuggled cyan skyline (§2.1/§3.5, no scenery negation); "tall upright phone-booth-
  shaped glasshouse cabin" is proportion language with no class noun, the direct fix for
  the low-fastback (§5); "wheels pushed to the corners" is §5-verbatim, clearing my old
  reservation (4); my three endorsed anchors kept verbatim. Good.
- coarse-halftone (shared `style`, §2.2 family change, [S3]): **PASS/approved** — byte-
  identical across the set so family holds structurally; consistent with §1 "degraded
  xerox halftone" / §3.4 (an intensification of the xerox law, not a drift); aids downscale
  - edge-key. No bible change needed for it.
- BIBLE GATE (mine): reconciled §3.3 — bible said "30-90 assembled words," the crew was
  citing a 120 lint ceiling not in the bible. Amended §3.3 to "30-90 target; 120 hard
  ceiling (lint errors >120, warns >90)," 90-120 tolerated ONLY for load-bearing FAIL-fix
  clauses justified in prompt-drafts. 102/113/102 all fit; I verified no filler to cut —
  every word past 90 fixes a specific asset-gate FAIL. The car's 113 is watched (below).
- asset-gate watch list (mine, next gate): (W1) **truck [S5] — the live risk.** Serge
  metered the reject at 36% canvas height, cargo roof ~level with cab = low/generic van,
  NOT §5 "cargo body taller than the cab line"; the flood was masking it. Subject clause is
  already §5-verbatim and the changed tail (neonPhrase+coarse-halftone) alters the fixed-
  seed roll, so improvement is possible but NOT guaranteed. CONTINGENCY (pre-registered, so
  we don't dither): if the truck reproduces low/generic, the remedy is a truck-subject step-
  up-roofline strengthening (+ possible seed reroll) escalated to Bertrand as a scoped
  follow-up — NOT folded in now (outside authorised option-1 scope; better to measure with
  data than pile a speculative 3rd variable onto the one authorised shot). (W2) car [S6] —
  "body staying pure B&W xerox" + "crisp cutout edges" sit at ~word 85-113 (weakest zone);
  car was the one that did NOT flood, so lowest risk where deepest, but verify the B&W body
  held. (W3) car [S7] — phone-booth clause must not over-read into a small van/box. (W4)
  moto — smallest canvas (256), verify the "few pixels thick" rim floor didn't vanish and
  chimera stays cleared. (W5) [S4] glow-halo boundary fringe (truck 39/car 64/moto 29% on
  the reject) is Serge's TECHNICAL-pass retouch, not a prompt blocker — confirm cleaned.
  (Nico / Lead-Art — prompt re-gate)

---

### story-sprite-prompt-workshop (follow-up 7) — ASSET GATE, batch 3 (commit a20a2c5)

- verdict: **ITERATE — 0/3 FAIL. I concur with Serge's advisory read.** This was the
  Bertrand-authorised shot; per instruction I do NOT self-authorise another batch —
  options + recommendation below go to Bertrand. Prompt-only has now plateaued on the
  flood across two batches — that is the §3.12 kontext trigger condition, stated in law.
- truck (seed 1337): **FAIL, double** — §1/§2.1 the orange BODY FLOOD recurred (Serge
  neon-band 44%, up from 37.3%) despite "body staying pure black-and-white xerox" + "black
  and white except the neon"; the positive B&W clause did NOT overcome FLUX-schnell's fill
  tendency. AND §2.3 silhouette: watch-item W1/[S5] confirmed — a long, LOW, stretched van,
  cargo roof ~level with the cab, not "cargo body taller than the cab line" (§5). Worst of
  the three.
- car (seed 42): **FAIL** — §2.1 REGRESSED: last batch's cyan skyline was a detachable
  background; now it is a CONNECTED glowing cyan cabin/greenhouse fused into the vehicle
  blob (Serge component analysis: part of the sprite, not removable by retouch). "completely
  alone / empty surroundings" did not starve it. §2.3: still low/long, the phone-booth clause
  ([S7]) under-read. Body treatment no longer the clean hero it was in batch 2.
- moto (seed 8128): **FAIL** — §1/§2.1 magenta panel flood recurred, same root as the truck.
  Silhouette PASSES (coherent moped + top-box, chimera stays cleared); fails only on flood.
- family §2.2: FAIL as a set — two flooded bodies + one fused-cyan car; not one printing run.
- edges: Serge confirms technically sound (binary alpha; [S4] halo deferred to his pass) —
  NOT the blocker. The blocker is generation content (flood + silhouette), not keying.
- TOOLING FOLLOW-UP (for the record, `dev-tooling-assets`): `check-sprite-style.mjs` has no
  NEON UPPER BOUND — it is flood-blind, passed truck at 37.3% (b2) and 44% (b3). Add a
  ceiling (a body-flood FAIL above ~15-20% neon area) so a flood auto-rejects mechanically.

**Options for Bertrand (I will not self-authorise a batch):**

- **(A) Revert to the previously PM-accepted set** — safe, ships now, unblocks the delivery
  beat. Known-good. Downside: off the current prompt direction, but on-screen and accepted.
- **(B) Decouple neon from the body [MY RECOMMENDATION]** — the flood's root cause is the
  neon token itself: FLUX-schnell reads "acid neon rim" on a monochrome vehicle as "paint
  the vehicle neon," and two batches of positive B&W clauses cannot beat it. Fix: FLUX
  generates the vehicles as PURE B&W xerox with NO neon token at all (removes the trigger →
  no flood, and the low-van silhouette can then be fought on a clean plate), and the neon
  rim becomes a RENDER-SIDE emissive outline in `src/render` keyed off the sprite alpha.
  This is MORE on-direction, not a compromise: §2.1 "what glows is interactive" is better
  served by a live glow than a baked one (it can respond/pulse as a real signal). Scope: pm
  - senior-architect + dev-r3f-render (render effect, boundary-clean, needs an ADR).
- **(C) kontext hero-lock (§3.12)** — the eventual fallback if a fully-baked pipeline is
  mandated. Caveat: we have NO clean hero. The batch-2 car body was a good TREATMENT ref
  but bad on silhouette+background; a clean B&W hero must be generated FIRST, then truck/
  moto derived image-to-image. Real work, unproven pipeline (§7 follow-up, not yet wired).
- **(D) One more same-lever prompt iteration — I REJECT this.** Prompt-only has plateaued
  on the exact failure twice; a third word-tweak against the flood is low expected value and
  burns the shot.

**Recommendation: (A) now to unblock, (B) as the real fix.** Revert to the accepted set so
the delivery beat is not held hostage to art, and commission the decouple (clean B&W sprite

- render-side neon rim) as the correct long-term solution — it kills the flood at its source
  and upgrades the loi du glow from baked to live. (C) only if product mandates fully-baked
  sprites. (Nico / Lead-Art — asset gate, batch 3)

---

### story-sprite-prompt-workshop (follow-up 7) — PROMPT GATE, decoupled B&W (ADR 0011)

- verdict: **PASS — dispatch the B&W generation**, with ONE dispatch-ordering condition on
  the chroma-key ground (below). The flood era is over by construction, not by wording.
- prompt contract (§3): **clean.** `neonPhrase` retired to `""` (no neon/glow token
  anywhere — the ADR 0011 inverse rule); `style` = "…coarse halftone dots, fully black and
  white, on a uniform matte black background (#000000)…" with my KEEP-clauses intact;
  subjects unchanged from 3b; 71/82/71 words (back inside the 30-90 band, so the §3.3
  tail-washout pressure is gone); zero negations; hex-bound ground (§3.5); shared style
  byte-identical (§2.2 structural). Nothing to rework in the contract.
- §2.1 loi du glow: now satisfied by the RENDERER (additive emissive silhouette, hue from
  the `neon` data field, flood impossible by construction per ADR 0011). BIBLE amended:
  §2.1 now states the law governs the on-screen result not the method, vehicles carry a
  render-side rim and ship as pure B&W (a baked rim on a vehicle sprite is now itself
  off-spec); §6 pipeline/gate note updated (neon check flips to an upper-bound flood-kill
  for the vehicle set; prompt lint forbids neon tokens in vehicle prompts).
- KEYING WATCH (Serge's parallel pre-prod concern — I SHARE it, but it is not a contract
  rework): with the bright neon rim gone, the vehicle's dark ink OUTLINE now sits on the
  #000000 ground; the cutout is `cutout-enemies.mjs`'s conservative border FLOOD-FILL
  (threshold 24, preserves interior dark), NOT a global black key — so a mostly-light B&W
  van is far safer than the `foreground` SOLID-black ironwork that needs a magenta key. The
  only vulnerable pixels are contour ink within ~24 of pure black (high-contrast xerox can
  push ink to true black → leak/nibble). CONDITION on dispatch: bind the ground to Serge's
  parallel keying pass. If his metering shows a clean cut on #000000 (threshold/edge-
  quantize handles it, his technical pass, no regen) → ship as-is. If the outline is
  eaten/ragged and unrecoverable in retouch → switch the generation ground to a bright
  chroma-key mirroring the in-file `foreground` magenta detour ("solid flat uniform bright
  magenta chroma-key background") — that is a prompt change so it must land BEFORE the
  generation, not after. Decide from Serge's result before committing the batch; do not
  regenerate twice.
- SILHOUETTE watch (unchanged subjects → carried to the asset gate, NOT blocking here): W1
  truck [S5] low/generic van (§5 taller-than-cab); W3 car [S7] phone-booth over/under-read.
  Removing the neon token changes the fixed-seed roll, so these may shift — measure at the
  asset gate; if the truck still reads low, THEN strengthen its subject (a scoped, isolated
  change), not now (keep subjects fixed to isolate the decouple variable).
  (Nico / Lead-Art — prompt gate, decoupled B&W)

---

### story-sprite-prompt-workshop (follow-up 7) — ASSET GATE, final decoupled set

- verdict: **SHIP.** 2/3 clean PASS; the car FAILS the silhouette-archetype law but does
  NOT block ship — it rides as a scoped follow-up. This set + the render-side rim is what
  ships. §1 satisfied on all three: fully B&W xerox, crimson cast gone (grayscale-after-key
  Rec.601 worked, meanSat 0.000) — the magenta-key detour + grayscale step was the right
  call. Judged as pure B&W; the neon rim comes live in-game (§2.1 render-side, ADR 0011).
- truck (seed 1337): **PASS.** W1/[S5] resolved — the cargo body now reads clearly TALLER
  than the cab line (Serge 43% vs 38%), boxy tall-roof delivery volume, clean high-contrast
  xerox. Reads unambiguously as the truck class (§2.3) — biggest, boxiest, longest. Minor
  fidelity note (not a FAIL, optional future roll): it carries a long hood so it reads
  estate/panel-wagon rather than flat-nosed forward-control (§5) — class is right, the nose
  detail is soft. Ships.
- moto (seed 8128): **PASS.** Coherent skeletal moped, exposed tube frame intact, fat small
  wheels, round headlamp, top-box crate — the delivery read lands. Chimera stays cleared.
  Cleanest B&W of the three. Ships.
- car (seed 42): **FAIL (§2.3 / §5 archetype), ship-unblocking — scoped follow-up.** The
  phone-booth clause over-read ([S7]): the tall glasshouse landed as a tall boxy volume
  grafted onto the REAR of a low long body → reads "long wagon/estate/hearse," not the
  short one-box city car (Twingo/AX charm). By the letter of the silhouette law that is a
  FAIL. BUT it does not block ship: it still reads as a four-wheeled civilian CAR-class
  vehicle (not moto, and distinguishable from the truck by its low front + overall
  size), and the live cyan rim seals the class read in-lane. The delivery beat has been
  blocked across four generation cycles; holding the whole feature on a proportion/charm
  miss (right class, wrong archetype) is not worth it when truck+moto are clean and the car
  is functional. FOLLOW-UP (scoped, one asset): iterate the car subject to a SHORT one-box —
  the fix is to kill the long rear-box read, e.g. drop "phone-booth-shaped rear cabin"
  language, steer "short overall length, minimal front and rear overhang, tall cabin set
  well forward over a stubby body," reroll seed 42 if composition stays long. Not a blocker;
  a polish pass.
- overall: SHIP truck + moto + car now with the runtime rim; open a scoped follow-up story
  for the car silhouette iteration. (Nico / Lead-Art — asset gate, final set)

---

### story-render-side-neon-rim — decouple vehicle glow from baked art (ADR-0011)

- arch: Boundary verdict PASS. Decision recorded in `docs/adr/0011-render-side-neon-rim.md`
  (Accepted): vehicles generate PURE B&W; the loi du glow moves to `src/render` as a runtime
  emissive rim. Technique = CPU-baked neon silhouette (opaque pixels → assigned hue via source
  alpha) drawn behind the sprite with `AdditiveBlending`, scaled out by a uniform world-space
  margin. Rejected post-processing (SwiftShader/e2e cost + new dep) and a custom edge-detect
  shader (overkill, GLSL risk on software GL). Chosen path adds ZERO new GL surface — stock
  `MeshBasicMaterial`+`CanvasTexture`+`AdditiveBlending`, already exercised by `EnemySprite`.
  Data contract: `GameState.deliveryVehicle.vehicleType` already reaches render; neon NAME
  stays authored in `levelArt.json` `vehicles.types[*].neon`; name→hex is a render-side
  constant anchored to art-direction §2.1. Game logic (`delivery.ts`, `deliverySystem.ts`,
  `GameState`, `levelArt.ts` loader) UNTOUCHED — the hue never enters game state.
- lanes (three disjoint path sets, PARALLEL-SAFE: YES):
  - **dev-r3f-render** — `src/render/**` ONLY. NEW `src/render/scene/vehicleNeon.ts`
    (`getVehicleNeonHex(type)` reading `levelArt.json` data + render-side `NEON_HEX` anchored
    to §2.1; `buildNeonSilhouette(image, hex)` CanvasTexture bake, nearest filter). MOD
    `DeliveryVehicleSprite.tsx`: cache a baked silhouette per type in the load callback; add a
    second `rimRef` mesh (renderOrder 6, z = VEHICLE_Z − 0.01, MeshBasicMaterial transparent /
    depthWrite:false / AdditiveBlending); per-frame same position, per-axis scale
    `x=facing·(worldW+2T)`, `y=worldH+2T`, `T≈0.06·VEHICLE_H`; `rim.visible = onStage &&
silhouetteTex!==null`. No game/scripts edits.
  - **dev-tooling-assets** — `scripts/**` ONLY. `check-art-prompts.mjs`: inverse rule for the
    vehicles set — assembled vehicle prompt must contain NO neon/glow token. `check-sprite-style.mjs`:
    flip vehicle NEON check to UPPER-BOUND flood-kill (≤ ~15–20% of content in any saturated
    hue band, all modes) and REMOVE the lower bound for B&W vehicles (expected-low); recalibrate
    table against regenerated B&W PNGs. `gen-vehicle-sprites.mjs`: defensive only (assembly already
    tolerates an empty `neonPhrase`). Keep the `neon` NAME field — it is now render metadata, not
    a prompt token. No `levelArt.json` string edits, no `src/**`.
  - **concept-artist** — `levelArt.json` STRING fields + `prompt-drafts.md` ONLY (sole writer of
    levelArt.json here → no file overlap). Remove every neon/glow/acid/hue token from the vehicle
    prompt: empty `neonPhrase`, rewrite `style` to pure B&W xerox (drop "except the neon" / "acid
    neon"), keep matte-black bg for keying and all silhouette/medium/view language. Retain per-type
    `neon` NAME. Document the decouple rationale (FLUX floods on the neon token) for the prompt gate.
- serialization note: `levelArt.json` is written ONLY by concept-artist in this story (all edits
  are string content); tooling stays in `scripts/**`, render only READS the JSON. `docs/agent-handoffs.md`
  serialized by the orchestrator. (Winston / Senior Architect)

---

### adr-tutorial — crew adversarial review of ADR-0012 (optional scripted tutorial stage)

Cycle: 4 parallel read-only review lanes → architect arbitration + in-place amendment →
pm acceptance. ADR stays **Proposed**; final acceptance = Bertrand merging the PR. No `src/`
changes in this cycle — the ADR is design-only; implementation is a separate story.

- pm (John), scope lane: **GO-AVEC-AMENDEMENTS** — mécanisme scope-compliant
  (optionnel/skippable/non-gating/additif, boucle intouchée), mais 2 MAJEURS avant PR : D4
  enseigne des ennemis (car/hostage/`energy`) absents du seul niveau jouable Belliard
  (courier-only, YAGNI), et la revendication « même registre narratif » est fausse et frôle
  le §8 « dialogue élaboré » — plus 3 MINEURS (justification desktop gonflée → recentrer
  mobile, friction première-carte vs UX §5.1, exactitude/sur-énumération contrôles).
- dev-gameplay, `src/game` lane: **GO-AVEC-AMENDEMENTS** — 2 bloquants avant impl : (1)
  `stateMachine.test.ts:87-96` itère tout `LEVELS` avec `deliveries.length>0` et cassera sur
  l'entrée tutorial (test oublié par l'ADR, à filtrer sur `kind!=="tutorial"`) ; (2) l'entrée
  inerte spécifiée ne type-check pas (`name/district/year/enemySpeedMultiplier` requis
  manquants, et `name/district/year` affichés par `LevelCard` donc non inertes). Reste
  (unlock id-based, citations de lignes, remèdes consistance, `kind?`/`image?` additifs)
  confirmé exact.
- dev-r3f-render, `src/render` lane: **GO-AVEC-AMENDEMENTS** — toutes citations render
  exactes (App/MainMenu/NarrativeScreen). D2/D5 faisables sans refonte (branchement `kind`
  interne à `LevelCard`, `NarrativeLine.image?` additif). Amender D3 : l'effet de tension
  `App.tsx:136-139` divise par `selectedLevel.timeSeconds` sans garde de phase → la branche
  tutorial ne doit pas `setSelectedLevel` sur l'entrée `timeSeconds:0` et le seed doit passer
  par `FIRST_PLAYABLE_LEVEL`. Mineurs : filtre `kind` Scores redondant (défense en
  profondeur) ; `GameScene.tsx:83` consommateur `LEVELS` non listé mais sûr (par id).
- dev-tooling-assets, pipeline/CI lane: **GO-AVEC-AMENDEMENTS** — pipeline/CI/
  `?preview=tutorial`/BASE*URL confirmés sans risque (aucun script n'itère le module
  `LEVELS` ; tous lisent `levelArt.json` seul), mais D5 doit être amendé : sprites drive-by
  `car*\_`et`hostage\_\_`+ assets HUD **non livrés**, donc « illustré avec les assets
existants seulement » n'est vrai aujourd'hui que pour cops/livreur/bonus. Le harnais
preview a deux moitiés :`App.tsx:74-76`ET`scripts/screenshot-preview.mjs:167-169`.
- arch (Winston), arbitration: ADR-0012 — adversarial-review amendments arbitrated,
  **16/16 findings ACCEPTED, 0 rejected**. ADR amended in place (Context + D1–D5 +
  Consequences/Gotchas): scope descoped to shipped content (window cops + courier + loop +
  base HUD; car/hostage/`energy` deferred to S2/S3 alongside the roster that introduces
  them), `NaN`-divisor and `LEVELS[0]`-consumer hazards documented (`App.tsx:136-139`,
  `stateMachine.test.ts:87-96`), asset claims corrected to the real `public/assets/`
  inventory, distinct briefing register assumed (short of §8). README index labels
  0009/0010/0011 fixed. Status stays **Proposed** — cleared for pm acceptance; devs must
  not implement until Accepted.
- pm (John) → Bertrand, acceptance: ADR-0012 amendé **accepté produit** (2e passe, lecture
  seule). Les 5 points de la 1re review (2 MAJEURS, 3 MINEURS) sont tous traités et cités ;
  scope confirmé optionnel/skippable/non-bloquant/zéro-règle/cutscene-simple, aucune
  régression introduite par les amendements techniques. Statut ADR reste Proposed —
  acceptation finale = merge PR par Bertrand.

---

### story-tutorial-stage — implementation of ADR-0012 (3 parallel lanes, PR #34)

Bertrand's "Go" = product green light to implement. Three dev lanes fanned out on disjoint
path sets (PARALLEL-SAFE: YES — `src/game/**` / `src/render/**` + diagram / `scripts/**`),
coded against a shared interface contract (`FIRST_PLAYABLE_LEVEL`, `TUTORIAL_NARRATIVE`,
`LevelConfig.kind?`, `NarrativeLine.image?`).

- release Lane A (`dev-gameplay`, `src/game/**`, TDD): `LevelConfig.kind?` +
  complete tutorial entry prepended to `LEVELS` (diegetic `name/district/year`, inert
  gameplay fields) ; `FIRST_PLAYABLE_LEVEL` non-undefined via module-load invariant (double
  casts retired) ; `NarrativeLine.image?` additif ; `TUTORIAL_NARRATIVE` en constante
  séparée, registre briefing DISPATCH/KENZA, 8 panneaux limités au livré ; tests
  `stateMachine`/`levelArt.consistency` filtrés sur `kind`, NEW
  `tutorialInvariants.test.ts` (index 0, belliard premier jouable, exclusion unlock,
  isolation clés narratives, existence des sprites). vitest 175→180, eslint clean. (Amelia
  — Gameplay)
- release Lane B (`dev-r3f-render`, `src/render/**`): `AppPhase` + `"TUTORIAL"` ;
  `handlePlay` branche sur `kind` en premier, sans `setSelectedLevel` (piège NaN du
  diviseur de tension évité), fin/skip → MENU, rien d'écrit ; seeds/fallback via
  `FIRST_PLAYABLE_LEVEL` ; `?preview=tutorial` ; badge statique `TUTORIEL` (néon jaune,
  hors échelle de difficulté), stats/MEILLEUR masqués, Scores défaut premier jouable +
  filtre défensif ; `NarrativeScreen` rend `image?` au-dessus du dialogue (BASE_URL) ;
  `docs/diagrams/app-phase-flow.md` rafraîchi. tsc + eslint clean. (Amelia — Render)
- release Lane C (`dev-tooling-assets`, `scripts/**`): capture explicite
  `?preview=tutorial` → `02_tutorial.png` dans `screenshot-preview.mjs` + insertion contact
  sheet (la boucle par niveau lit `levelArt.json` et n'atteint jamais le tutorial) ;
  dégradation gracieuse si la phase manque. `node --check` OK. (Amelia — Tooling)
- verify (orchestrateur): tsc clean, eslint clean, vitest **180/180**, prettier clean ;
  navigateur headless (Playwright/Chromium) **8/8 PASS**, 0 pageerror — carte TUTORIEL
  première du menu (Belliard garde badge FACILE et reste le défaut Scores), briefing rendu
  avec sprite véhicule, clic carte → briefing, « Passer » → retour menu.
- arch (Winston), integration sign-off: ADR-0012 tutorial integration **APPROVED**.
  Boundary law + D1–D6 all PASS across the 3 lanes (game/render/scripts, non-overlapping).
  NaN-tension trap avoided (no `setSelectedLevel` on tutorial branch), no `levelArt.json`
  entry, no art gate. **ADR flipped to Accepted** ; PR #34 merge seals. No corrections
  required.
- pm (John) → PR #34, acceptance: **ACCEPTÉ** le tutoriel ADR-0012. D2/D4/D6 + guidelines
  §1/§5/§8 conformes (registre briefing terse, contenu limité au livré, non-goals
  respectés, zéro art généré, skippable un bouton). Follow-up cosmétique non-bloquant :
  wording du district « Prise en main » (une variante plus diégétique façon flyer pourrait
  coller mieux — à considérer plus tard).

---

### code-review panel — PR #34 (tutorial ADR-0012) — first run of the mandatory merge gate

Demande de Bertrand : review de code par une équipe de plusieurs architectes aux skills de
review distincts, désormais **gate obligatoire avant tout merge sur main** (encodé dans
COLLABORATION.md §code-review panel, CLAUDE.md, le hook crew-reminder et le PR template).

- Architecte A (`code-review`, effort high): 0 bloquant/majeur. 3 MINEURS — libellé
  `[ JOUER ]` trompeur en fin de tutoriel ; `loadScores` lu inutilement pour la carte
  tutorial ; assertion tautologique dans `tutorialInvariants.test.ts`.
- Architecte B (`bmad-code-review`, couches Blind Hunter / Edge Case Hunter / Acceptance
  Auditor): 0 bloquant/majeur. 4 MINEURS — `district: "Prise en main"` non diégétique
  (viole D1/D4) ; `[ JOUER ]` (doublon A) ; `alt=""` sur des sprites informatifs (a11y) ;
  rognage possible de l'image en paysage mobile court.
- Architecte C (`bmad-review-edge-case-hunter`): 1 MAJEUR — `<img>` sans `key` React :
  sur deux panneaux illustrés consécutifs (flic → livreur), le navigateur garde l'ancien
  sprite affiché jusqu'au décodage du suivant (modèle current/pending request), donc le
  sprite du FLIC peut rester visible pendant « le livreur, tu le touches JAMAIS ». 3
  MINEURS — pas d'`onError` sur 404 ; pas de préchargement ; `findIndex === -1` →
  `unlockLevel("tutorial")` théorique.
- Architecte D (`security-review`): **aucun finding** — `image` non attaquant-contrôlé,
  `?preview=` en égalités strictes jamais rendu au DOM, parsers localStorage durcis
  (pas de merge d'objet → pas de prototype pollution), script preview sans entrée externe.
- Vérification adversariale (skeptique): C1 (img sans key) **CONFIRMÉ** — séquence idx 4→5
  de `TUTORIAL_NARRATIVE` vérifiée, comportement navigateur conforme spec, le typewriter
  aggrave la fenêtre. C4 (unlock "tutorial") **RÉFUTÉ** — `currentIdx === -1` prouvé
  inatteignable : toutes les écritures de `selectedLevel` sont contraintes à des membres
  de `LEVELS` et la branche tutorial de `handlePlay` return avant `setSelectedLevel`.
- Triage + correctifs (2 lanes parallèles, chemins disjoints):
  - render: `key={currentLine.image}` (C1) ; `onError` + reset par ligne (C2) ;
    `alt={currentLine.imageAlt ?? ""}` (B3) ; conteneur image rétrécissable
    `minHeight:0/flexShrink:1/objectFit:contain` (B4) ; prop `doneLabel` (défaut
    `"JOUER"`), la phase TUTORIAL passe `"TERMINER"` (A1/B2) ; `loadScores` gaté par
    `!isTutorial` (A2).
  - game: `NarrativeLine.imageAlt?` + 3 alts français authorés (B3) ;
    `district: "Repérage"` (B1, suggestion pm) ; assertion tautologique remplacée par
    `LEVELS.slice(1).every(l => l.kind !== "tutorial")` (A3).
  - REJETÉ avec motif: C3 (préchargement des images) — avec le fix `key`, un bref blanc
    pendant le décodage d'un asset local minuscule est acceptable ; complexité non
    justifiée. C4 — réfuté (voir ci-dessus), garde défensive non requise aujourd'hui.
- verify (orchestrateur): `tsc` clean, `eslint` clean, `vitest` **180/180**, prettier
  clean. Zéro finding CONFIRMÉ bloquant/majeur restant → gate PASS, PR #34 mergeable.

---

### story-halo-alpha-composite-gate — INCIDENT + Gate 4 (Nico / Lead-Art)

- incident: The ADR-0011 render-side vehicle neon rim shipped in the play-test build as a
  **hard-edged solid neon plate — binary alpha, no falloff** (the runtime rim bake is
  binary-alpha, scaled out ~6%). On-screen it reads as a flat neon aplat around the vehicle,
  not a glow. Bertrand's play-test verdict: disappointing render.
- why the chain missed it — **NOT a taste failure, a chain failure.** The neon rim exists
  ONLY at render time (decoupled from the sprite, ADR-0011); the delivered PNGs are pure
  B&W. My asset gate correctly judged the source sprites as pure B&W with the rim "coming
  live in-game" (this log, final-decoupled-set verdict / follow-up 7). But NO gate —
  mechanical or human — ever saw the in-game COMPOSITE: the asset gate judges the source
  PNG, and the runtime rim was never part of any PNG. Runtime-composed visuals simply had
  no acceptance surface. A binary-alpha rim could ship because nobody, by design, looked at
  the composited result.
- fix (three parts, parallel lanes): (1) RENDER — distance-based alpha-falloff bake so the
  rim decreases from the sprite edge to zero at the outer margin (`src/render`, architect
  amends ADR-0011 — not my lane). (2) MECHANICAL — a gradient check added to the e2e
  delivery gate so a flat/binary-alpha glow trips automatically (`scripts/**` — not my lane).
  (3) PROCESS — my lane, done this session:
  - BIBLE (§2.1, loi du glow): added the measurable rule **« un halo est un dégradé, jamais
    un aplat »** — every glow/halo, baked or render-side, MUST carry an alpha falloff
    decreasing from the sprite edge to zero at the outer margin; alpha sampled edge→margin
    must be monotonically non-increasing and terminate at 0; a flat binary-alpha glow is an
    automatic FAIL.
  - GATE 4 (`lead-art.md`): new **in-game composite gate** — any change to a runtime-composed
    visual (rims, glows, additive/emissive effects, anything not fully in the delivered PNGs)
    needs my verdict on REAL in-game screenshots before merge; an asset-gate PASS explicitly
    does NOT cover runtime composition.
  - FLOW (`COLLABORATION.md`): `dev-r3f-render` delivers in-game screenshots with any visual
    change; `game-graphist`'s TECHNICAL pass inspects the composite at real in-game size; the
    orchestrator routes those screenshots to me. No screenshots = ungated = no merge.
- composite verdict on the new falloff-baked halo — **GATE 4, first real pass: PASS 3/3.**
  Read on real in-game composites (`screenshots/preview-vehicle-{truck,car,moto}.png` +
  `-closeup.png`), belliard/stalingrad/vitry. The incident condition (hard-edged binary-alpha
  aplat) is GONE on all three: the chamfer-distance quadratic falloff (margin 0.06×sprite
  height/side) now reads as a true halo — brightest at the sprite edge, monotonically fading
  outward to zero at the outer margin, no opaque step, no cut edge. « Un halo est un dégradé,
  jamais un aplat » (§2.1) is satisfied in the composite. Per vehicle:
  - **truck (belliard, orange #FF8C14): PASS.** Falloff present and monotonic; hue correct;
    rim thickness readable at game size. Weakest of the three on background contrast —
    orange-rim-on-orange-storefront (belliard's warm shop lights) is the hardest read of the
    set — but the vehicle sits against the darker shopfront band and the silhouette + glow
    still read clearly. Not a FAIL; noted as the family's low-contrast case to watch if
    belliard's palette ever warms further.
  - **car (stalingrad, cyan #28F0FF): PASS (composite).** Best-reading glow of the set —
    cyan against the cool dark-blue/red night street pops cleanly, falloff soft and correct,
    hue correct. NB: the car's long-wagon/estate silhouette-archetype FAIL is the SEPARATE,
    pre-existing asset-gate follow-up (final-decoupled-set verdict above) and is NOT reopened
    here — Gate 4 judges the runtime composite (the glow/falloff), not the source silhouette.
    The glow passes; the silhouette follow-up stands as previously logged.
  - **moto (vitry, magenta #FF3CDC): PASS.** Falloff present and monotonic, hue correct,
    reads strongly against vitry's cooler tower-block backdrop. Most prominent halo of the
    three because the sprite is the smallest (256 canvas) so a per-side 0.06×height margin
    is proportionally the most generous, and the top-box crate outline makes the wrap read
    large — this is within family (identical falloff law + margin ratio across the set), not
    a defect. If it ever reads as bloom rather than rim, tune the margin CONSTANT, not the
    law.
  - **family consistency (§2.2): PASS.** One treatment across all three — same quadratic
    chamfer falloff, same 0.06×height margin ratio, hue-per-assignment from the `neon` data
    field. The three read as one printing run with three accent inks. This is the loi du glow
    working as designed, now live and gradient.
  - PRECEDENT NOTE (this entry is the Gate 4 template): a runtime-composed visual is gated
    ONLY on composites Read here; Gate 4 verdicts the composition (falloff/hue/read), while
    silhouette/archetype/body defects remain the asset gate's jurisdiction and are not
    re-litigated or absolved by a Gate 4 PASS. No bible/agent rule fix forced — the falloff
    rule held on first contact with real screenshots. (Nico / Lead-Art — Gate 4, first pass)
- arch review (PR #32, `claude/halo-alpha-transparency-review-uez37y`, 0a0cad0..85d581b):
  **BOUNDARY + TECHNIQUE PASS.** Boundary law upheld: **zero `src/game/**`changes** (diff
empty), every`src/**`change confined to`src/render/**`. New `haloFalloff.ts`is pure and
DOM-free (no React/Three import);`vehicleNeon.ts`/`DeliveryVehicleSprite.tsx`hold no game
rules — they read`deliveryVehicle`phase/position/integrity from state and render, hue stays
render-side data and never enters`GameState`. **Stock materials only** (`MeshBasicMaterial`
  - `CanvasTexture` + `AdditiveBlending`); no `ShaderMaterial` / `onBeforeCompile` /
    `EffectComposer` / GLSL introduced → SwiftShader gate safe. **Scripts stay outside `src`**
    (no script imports from `src`; only `playwright` + node built-ins + lazy CI-only
    `@napi-rs/canvas`). **No new deps in `package.json`** (diff empty; `@napi-rs/canvas@1.0.2`
    installed CI-only via `--no-save`, same pin as gen-sprites / gen-vehicle-sprites — PnP
    lockfile untouched). Verified green here: `yarn typecheck` exit 0; `haloFalloff.test.ts`
    9/9. ADR-0011 amended (Amendment 2026-07-11: solid rim → chamfer-distance quadratic gradient;
    consequences updated for the frame-diff e2e gate + Gate 4 composite gate). No code changed by
    the architect. (Winston / Senior Architect)
- pm-accept (PR #32, `claude/halo-alpha-transparency-review-uez37y`, 0a0cad0..581750d):
  **ACCEPTED vs story-halo-alpha-composite-gate AC1–AC7.** All three fixes Bertrand asked for
  are closed:
  - **AC1–AC3 render fix — PASS.** `src/render/scene/haloFalloff.ts` turns the old binary
    silhouette into a real outward alpha gradient (chamfer 3-4 distance transform + quadratic
    ease-out `(1−d/margin)²`); reads as light bleed under AdditiveBlending, not a sticker.
    Pure/DOM-free, `src/render`-only, stock materials → SwiftShader-safe. Architect boundary
    review: **zero `src/game/**` changes (empty diff)\*\*, no new deps. 9 unit tests, 184/184
    green, tsc + lint green.
  - **AC4 mechanical gate — PASS.** `scripts/check-halo-gradient.mjs` (frame-diff A=pre-trigger
    vs B=DELIVERING, recovered-alpha intermediate share ≥ 20% floor), wired into
    `scripts/e2e-delivery.mjs`. Discriminates plate (≈0%) from gradient (32%/70%) structurally.
    I credit the team's HONESTY: the first hue-on-single-frame metric was invalidated by the
    architect's own red-proof (belliard warm windows polluted it, plate scored 60.9% — would
    have false-PASSED) and was reworked, documented candidly in the script's calibration block.
  - **AC5–AC6 process fix — PASS.** Bible §2.1 measurable rule « un halo est un dégradé, jamais
    un aplat »; lead-art **Gate 4 (in-game composite gate)** added to COLLABORATION.md +
    `lead-art.md` — any runtime-composed visual (rims/glows/effects) now requires a lead-art
    verdict on real in-game screenshots before merge. First Gate 4 pass: **PASS 3/3**
    (truck/car/moto) on real composites, logged above. Precedent template set.
  - **AC7 — PASS.** ADR-0011 amended; Bertrand received the 3 vehicle previews on real street
    backgrounds; e2e-delivery SUCCESS end-to-end.
  - **Bertrand's question answered in-story and confirmed true in the artifacts:** lead-art DID
    review the delivered PNGs (asset gate) but had NO acceptance surface on the runtime
    composite — that exact gap is what shipped the falloff-less halo, and Gate 4 now closes it.
  - **One residual noted (not a blocker):** the AC4 RED proof is _synthetic by construction_ —
    a binary plate composited onto a real dark-street crop (0.0% intermediate) rather than a
    full end-to-end rerun of the old bake through paired frames, because only one old-bake
    DELIVERING frame was ever saved. Honestly documented in the calibration table; the
    plate-vs-gradient separation is structural, so intent (gate goes red on a plate) is met. If
    a future regression ever wants belt-and-suspenders, capture a paired old-bake frame set once
    and assert the gate red on it — logging as a nice-to-have, NOT reopening this story.
    Scope guard holds: fidelity fix to an approved extension (ADR-0011) + pipeline hardening, no
    new gameplay verb/input/rule, passes PROJECT_GUIDELINES. Story **DONE**. (John / PM)

---

## 2026-07-12 — dev-tooling-assets — Enclosed-island cutout pass (courier sprite white-speckle fix)

- **Start.** Task from senior-architect: land generic enclosed-background-island handling in the SHARED keyer `scripts/cutout-enemies.mjs` (not a standalone retouch script), retouch `public/assets/enemy_civilian.png` in place, sweep the rest.
- **Finish — DONE.** Lane: `scripts/cutout-enemies.mjs`, `public/assets/enemy_civilian.png`, `docs/adr/0013-*`, `.github/workflows/gen-sprites.yml` (comment only), this log.
  - **Root cause:** the 4-corner flood in `cutout-enemies.mjs` can never reach ground walled in by the subject (bike-frame triangle, wheel interiors, arm/torso gap) → those enclaves stayed opaque white.
  - **Fix:** added an additive enclosed-island pass after the flood — connected-component labelling of a loose ground-colour mask, clearing a component only when it is topologically enclosed (touches neither border nor an already-transparent pixel) AND its mean is within the tight ground band. Corner-adaptive (keyed to sampled corners), so it works for white/black/magenta grounds — NOT a hardcoded white key. Ground sampling ignores transparent (pre-keyed) corners with a documented light-ground fallback for in-place retouch of committed sprites.
  - **In-place retouch:** new optional single-file CLI arg — `node scripts/cutout-enemies.mjs <path>` IS the deterministic retouch. Idempotent: re-run is byte-identical (0 px cleared).
  - **Metrics (enemy_civilian.png):** opaque 22215 → 19580 (−2635, within the −900..−3000 window); visible pureWhite 939 → 149 (residual = legitimate helmet/jacket highlight); nearWhite 1774 → 360; semi-transparent 0 → 0 (binary alpha held); whiteFringeOnEdge 22 → 22 (silhouette border unchanged). Magenta composite (vis.mjs) confirms frame triangle + wheel interiors + arm/torso gap transparent with spokes/rims preserved; helmet, jacket, backpack, limbs, tubes intact — no punched holes.
  - **AC6 sweep:** only `enemy_civilian.png` has the genuine defect. `vehicles/truck.png` (−3237) and `enemy_biker_shooting.png` (−474) would punch legitimate bright subject (white truck body / muzzle-flash core) under the pre-keyed white fallback → left untouched, documented for a separate per-sprite gated story; `enemy_shooting_3.png` and the low-white sprites show ~0 delta. CI path is unaffected for vehicles (raw truck gen has magenta corners → tight band keys magenta only, never the white body).
  - **Contract note to dev-r3f-render:** asset contract UNCHANGED — same path/size/name (`enemy_civilian.png`, 256×256 RGBA), only interior alpha corrected. No renderer change needed.
  - **Verification:** yarn typecheck OK, yarn test 189/189 OK, yarn lint OK. No `src/**` changes. ADR-0013 added. (Amelia / dev-tooling-assets)

---

## 2026-07-13 — senior-architect — Merge-gate triage + CI-batch guard-rail (courier fix)

- **Panel outcome.** 4-reviewer panel raised a CONFIRMED blocking defect against the above lane: the `nGround === 0` white fallback + enclosed-island pass is reached by the **no-args CI batch** (`gen-sprites.yml` runs `cutout-enemies.mjs` with no args over the whole committed `enemy_*.png` set, while generation only creates missing files). Re-simulated: the pre-fix branch script punched legitimate bright subject in 9/12 committed sprites (biker_shooting −474 muzzle-flash core, riot_shooting −124, sprite_2 −114, …), which the workflow's `git add -f && commit && push` would land silently. The three "live CI path never hits this fallback" claims (ADR-0013, script comment, workflow comment) were factually false.
- **Fix landed (scripts/CI guard-rail — architect domain, `src/**`untouched):**`cutout(file, { lightFallback })`. Batch/imported mode (`lightFallback` off) **skips** pre-keyed sprites (`nGround === 0`) with a log — restoring the historical no-op; explicit single-file CLI mode (`lightFallback`on) keeps the white fallback for the deterministic retouch.`gen-vehicle-sprites.mjs`'s `cutout(file)`import is unaffected (raw vehicles have opaque magenta corners →`nGround > 0`).
- **Re-verified:** CI no-args batch over all 12 committed sprites is now **byte-identical** (0 px changed); single-file retouch of `enemy_civilian.png` still idempotent (byte-identical). ADR-0013, the workflow comment, and the AC6 note below corrected to describe the actual guarantee.
- **AC6 correction (superseding line above):** the "~0 delta" claim for non-civilian sprites was wrong — under the _unguarded_ white fallback the deltas were −25..−474, not ~0. The sprites are now protected by the batch skip, not by luck. `vehicles/truck.png` and `enemy_biker_shooting.png` remain untouched by construction.
- **Boundary review:** diff is confined to `scripts/**`, `public/assets/**`, `.github/workflows/**`, `docs/**`. No React/Three in `src/game`, no game rules in `src/render`, no `src/hooks` change; `git diff origin/main...HEAD -- src` empty. Asset contract (path/size/name of `enemy_civilian.png`) unchanged. **Sign-off: cleared for merge once green re-verified.** (Winston / senior-architect)

---

## 2026-07-13 — pm — story-courier-sprite-transparency-fix — ACCEPTANCE (John / PM)

- **Full crew cycle, one block.** Scoping: PM framed the courier ("livreur à vélo")
  white-speckle bug as a FAITHFULNESS fix on a core-loop `Éviter` asset — Prohibition
  Atari ST shipped clean street-enemy sprites, so a correct cutout is faithful
  implementation, not an extension (cahier des charges test PASS, not a feature). WHY it
  mattered: opaque white background enclaves broke the fanzine-cutout illusion and the
  neon-is-interactive language. Hand-off to `senior-architect` for the one cross-cutting
  call — generic enclosed-island handling in the SHARED keyer vs a standalone reprocess
  step. Lanes fanned out: `dev-tooling-assets` (primary, `scripts/**` + `public/assets/**`),
  `dev-r3f-render` + `dev-gameplay` (read-only non-regression audits), `concept-artist`
  (defense-in-depth prompt hardening). Gates: graphiste PASS + lead-art PASS. Merge panel
  (4 reviewers) → `senior-architect` triage caught + fixed the real landmine (CI no-args
  batch re-keying committed sprites) with the `lightFallback` batch-skip guard; two items
  routed back to PM/orchestrator.
- **AC verification (I re-inspected the repo, not the reports):**
  - **AC1 (islands keyed) — PASS with PM-ruled deviation.** I read the before/after magenta
    composites myself: bike-frame triangle, arm/torso gap and BOTH wheel interiors go from
    opaque → transparent, spokes/rims preserved. pureWhite 939→149, no contiguous opaque
    near-white island >~50 px remains enclosed. **PM RULING: I accept the 149-vs-≤30 numeric
    deviation.** The ≤30 literal target was MISCALIBRATED against the sprite's legitimate
    whites — connected-component analysis and both art gates confirm the residual 149 px is
    the courier's own helmet/jacket highlight (byte-identical to the origin/main subject),
    NOT background. The substantive AC1 clause (enclosed islands keyed, no opaque white
    island remains) is met. Driving pureWhite lower would require a global white key that
    eats the helmet/jacket and violates AC2 — explicitly rejected.
  - **AC2 (subject preserved) — PASS.** opaque 22215→19580 (−2635, inside the 900–3000 px
    window); composite shows a single coherent silhouette, no punched holes in
    helmet/jacket/limbs/bike tubes.
  - **AC3 (alpha discipline) — PASS.** semi-transparent 0→0 (binary held), whiteFringeOnEdge
    22→22 (no new speckle, silhouette border untouched).
  - **AC4 (visual gate) — PASS.** I read `civ_before_vis.png` vs `civ_after_vis.png` via the
    Read tool: the three enclosed regions render magenta (transparent) after; body intact,
    no eaten contours; reads as a clean high-contrast fanzine B&W cutout at game size.
  - **AC5 (root-cause / no CI regression) — PASS.** Fix landed GENERICALLY in the shared
    `cutout-enemies.mjs` (enclosed-island pass, corner-adaptive, not a white key). Idempotent
    (byte-identical re-run). The CI landmine is closed by the `lightFallback` batch-skip guard
    (verified in the working tree, lines 48–94): no-args batch skips pre-keyed sprites, so a
    future CI cutout/reprocess cannot reintroduce enclosed islands or re-key accepted art.
    ADR-0013 corrected to match shipped code.
  - **AC6 (generic sweep) — PASS.** Sweep documented in ADR-0013: only `enemy_civilian.png`
    carries the genuine enclosed-ground defect; `vehicles/truck.png` and
    `enemy_biker_shooting.png` bright regions are legitimate subject (white truck body /
    muzzle-flash core) — correctly left untouched and protected by the batch skip.
  - **AC7 (green baseline / boundary) — PASS.** typecheck / test 189/189 / lint green
    (dev-gameplay + post-panel re-verify); `git diff --stat -- src/game src/render src/hooks`
    EMPTY; CourierSprite.tsx + enemyTypes.ts civilian archetype untouched. Change surface =
    `scripts/**` + `public/assets/**` (+ `docs/adr/**` and a non-functional workflow comment,
    both mandated by the CLAUDE.md ADR rule and triaged benign — sanctioned widening).
- **Open-item dispositions.** (1) AC1 numeric deviation → ACCEPTED above. (2) The uncommitted
  `gen-enemy-types.mjs` PIXEL_STYLE hardening (matte-black ground front-loaded + "the same
  flat black filling every space between the figure's limbs and gear") passed the lead-art
  gate and fixes AC5's root cause at the prompt level — I recommend it SHIPS WITH this story;
  the commit/drop mechanics are the orchestrator's call, not an acceptance blocker. Recorded
  trade-off: PIXEL_STYLE is shared across all enemy archetypes, so a future FORCE=1 regen of
  any accepted enemy sprite will differ from its pinned-seed original and need re-acceptance.
- **VERDICT: ACCEPTED.** All seven ACs satisfied, no unresolved CONFIRMED blocking/major
  finding, both art gates PASS. Story **DONE**. No commit/push by PM — orchestrator owns
  the merge. (John / PM)

## 2026-07-13 — dev-tooling-assets (docs/pipeline-agents lane) — AI-generation defect sweep

Follow-up to the courier detached-legs bug (the transparency fix revealed a first-generation
anatomical defect: both legs never joined the hips — the hip zone was white, keyed to a hole).
Root cause = an AI-generation defect that was invisible on opaque white and slipped every gate.
Closing the gap at the PIPELINE-AGENTS level (the machine-check wiring + asset retouch are
laneTooling's disjoint section):

- `.claude/agents/game-graphist.md` — TECHNICAL pass gains a mandatory **AI-generation defect
  sweep** (4 items: anatomy/limb attachment, extremities & duplication, fused objects &
  perspective, pre-key hole inventory), run on a contrasting background at game size, before
  the lead-art asset gate. Names `scripts/check-sprite-integrity.mjs` as a non-binding
  mechanical floor. A hit blocks the sprite from going up to Nico. Sweep also runs on any
  scripted retouch, not only fresh generations.
- `.claude/agents/lead-art.md` — Asset gate gains the same sweep as an **automatic FAIL**
  (detached / duplicated / fused / anatomically-broken / perspective-incoherent subject),
  aligned with the existing "wrong archetype = automatic FAIL" + "Silhouette first" clauses.
- `docs/art-direction.md` — canonical rule added under law #3 (Silhouette first): AI-generation
  defects are an automatic set FAIL; enclosed light over the body is a suspected hole, not
  background.

Prose/checklist only — no code, no scripts, no assets touched by this lane. Not committed
(orchestrator owns the merge). (Serge-adjacent tooling pass / dev-tooling-assets)

---

## 2026-07-13 — Courier sprite integrity gate + hip retouch (TOOLING/ASSETS lane, dev-tooling-assets)

Build log for the scripted deliverables (part A1 scripted check + part B retouch + CI wiring +
ADR). Agent-checklist edits (A2) belong to the parallel agents-pipeline lane — NOT touched here.

**Delivered (files):**

- `scripts/check-sprite-integrity.mjs` (NEW) — pure `measureIntegrity`/`evaluateIntegrity` +
  lazy-`@napi-rs/canvas` CLI, modelled on `check-halo-gradient.mjs`. HARD: dominance ≥ 0.97,
  speckle budget ≤ 4 comps < 12px, binary alpha. SOFT (WARN-only, routed to art gates):
  interior torso-zone enclave inventory (> 150px in upper 80% of a figure). 4-connectivity.
- `scripts/retouch-sprites.mjs` (NEW) — deterministic, idempotent per-sprite geometry repair.
  Hip bridge (local aplat sample ≈ (52,48,62), 4-way enclosure fill, iterated to a fixed point)
  - speckle sweep. `RETOUCH_SPECS` documents every window/threshold per sprite.
- `public/assets/enemy_civilian.png` — retouched in place (run once).
- `.github/workflows/gen-sprites.yml` — new "Check sprite integrity" step after cutout, before
  commit, scoped to `enemy_civilian.png` (no duplicate `@napi-rs/canvas` install).
- `scripts/SCRIPTS.md`, `docs/adr/0014-*.md` (+ index) — documented.

**Measured (enemy_civilian.png):** components 69 → 1 (dominant); hip enclaves 224/110/103px → 0;
dominant 19469 → 20082px (+611 bridge + 2px absorbed speckles, fixed-point); silhouette bbox `[29,19,226,237]` UNCHANGED;
semi-alpha 0 → 0; pngstats no new white / fringe 22 → 11. Idempotent: md5 identical across 3
runs (`b272505…`).

**Proof of detection (standalone CLI exit codes):**

- `check-sprite-integrity.mjs --file public/assets/enemy_civilian.png` (repaired) → **PASS, exit 0**.
- `check-sprite-integrity.mjs --file <pre-fix 69-comp state>` → **FAIL, exit 1** (speckle 68 > 4;
  SOFT also flags the 224px hip anatomy hole at 60% down).

**FINDING (flagged to senior-architect / for review):** the other 11 committed `enemy_*.png`
carry PRE-EXISTING keying debris (22–220 non-dominant comps) and action-pose detached elements
(dominance down to ~78%) — accepted art this cycle did not touch. The courier's 68 parasites is
FEWER than several accepted sprites (137, 220), so no speckle budget separates the bug from the
set. Hence the CI gate is scoped to `enemy_civilian.png`; a whole-set HARD gate needs a separate
set-wide cleanup / recalibration story. Also: with `ENCLAVE_TORSO_FRAC=0.80` the repaired courier
still emits 2 benign SOFT warns on legit bike see-through (~75% down); lowering to ~0.73 would make
it warn-clean while still flagging the 58–70%-down hip holes — an architect call, documented in
ADR-0014, not silently retuned.

**Gates:** `yarn lint` / `yarn typecheck` / `yarn test` (189/189) all green. Mechanical
`check-sprite-integrity` PASSES on the repaired sprite. Taste verdicts (Serge TECHNICAL /
Nico asset gate) are the art lane's to record; the crop/vis evidence for their pass is in the
tooling scratchpad. Not committed (orchestrator owns the merge). (dev-tooling-assets)

## 2026-07-13 — pm — story-courier-cyclist-sprite-fix — ACCEPTANCE (John / PM)

- **Two-lane cycle, one block.** Scoping I ruled on: (A) the scripted+agent "AI-generation
  defect sweep" is a CONSCIOUS, DOCUMENTED extension — Prohibition Atari ST had no AI
  generation, but it did ship anatomically-legible enemy sprites, so a gate that protects
  legibility serves the faithfulness bar; explicitly requested by Bertrand. (B) the courier
  hip retouch is a pure FAITHFULNESS bugfix (a first-generation FLUX pelvis hole exposed by
  last cycle's keying) — cahier des charges PASS, core loop `Récupérer→Livrer→Éviter`
  untouched. Lanes fanned out on disjoint paths: `tooling` (`scripts/**` + `.github/**` +
  `public/assets/**` + `docs/adr/**`) and `agents-pipeline` (`.claude/agents/**` +
  `docs/art-direction.md`). Gates: graphiste (Serge) PASS, lead-art (Nico) PASS. Merge panel
  (4 reviewers) → `senior-architect` triage: 0 blocking, all 4 confirmed majors were
  comment/doc-level falsehoods (incl. the real merge-stopper — `*.mjs` outside lint-staged's
  prettier glob) and are FIXED in-tree; format:check green. CLEAR TO MERGE, architect sign-off.
- **AC verification (I re-inspected the repo/artefacts myself; note: no shell in my context,
  so I verified scripts + CI wiring + agent files + ADR by Read, and the visual gate by
  reading the game-size composite and the hip magenta crops, and relied on the three
  independent lane reports + triage + fixes for the executable exit-code/green-baseline
  proofs):**
  - **A1 (scripted gate) — PASS.** `scripts/check-sprite-integrity.mjs` is standalone
    (`node … --file`), exit 0/1, documented header + calibration table, lazy
    `@napi-rs/canvas@1.0.2` (`--no-save --ignore-scripts` pattern, no full-tree install).
    HARD (dominance ≥ 0.97, `MAX_SPECKLE_COMPONENTS=4`/`SPECKLE_MAX_SIZE_PX=12`, binary alpha)
    - SOFT torso-zone enclave inventory (`SUSPECT_ENCLAVE_MIN_PX=150`, `ENCLAVE_TORSO_FRAC=0.80`,
      figure-scoped) — all named/commented constants, 4-connectivity, deterministic. Speckle
      budget anchored below the original's ~47 sub-3px baseline. Wired into `gen-sprites.yml`
      AFTER cutout (step "Check sprite integrity") and BEFORE the commit step, no duplicate
      canvas install, step rationale documented. Proof-of-detection recorded: repaired courier
      → PASS exit 0, pre-fix 69-comp state → FAIL exit 1 (speckle 68 > 4). PM-accepted scope
      ruling: the CI gate is scoped to `enemy_civilian.png`, NOT the whole set — empirically
      11/12 accepted sprites carry pre-existing debris (22–220 comps, dominance to ~78%) and the
      courier's 68 is fewer than several accepted sprites, so no single budget separates the bug
      from accepted art. Set-wide gate correctly deferred to a follow-up story (ADR-0014 §C).
  - **A2 (agent sweeps) — PASS.** `game-graphist.md` TECHNICAL pass gains the mandatory
    4-item sweep (ANATOMY / EXTREMITIES & DUPLICATION / FUSED OBJECTS & PERSPECTIVE / PRE-KEY
    HOLE INVENTORY), run on a contrasting ground at game size, before Nico's gate, citing
    `check-sprite-integrity.mjs` as a non-binding mechanical floor, re-running on scripted
    retouches. `lead-art.md` asset gate gains the same sweep as an automatic FAIL, weighted
    with "wrong archetype = automatic FAIL". Root cause captured in both files +
    `art-direction.md` bible (law #3).
  - **B (deterministic retouch) — PASS.** `scripts/retouch-sprites.mjs` repairs the courier
    with a locally-SAMPLED aplat (≈(52,48,62), never hardcoded), 4-way enclosure fill iterated
    to a fixed point (idempotent, byte-identical re-run, md5 `b272505…`), then a speckle sweep,
    binary alpha. Defect coordinates documented in `RETOUCH_SPECS` (hip window x[118,190]
    y[143,197]). I read the hip magenta crop (`z_fixed_lower` vs `z_main_lower`) and the
    game-size composite (`civ_after_vis_g64`) myself: the crotch/upper-thigh now reads as one
    continuous dark trouser mass rooting BOTH legs to the torso; magenta shows through only at
    legit bike see-through (spokes, frame triangle). Measured 69 → 1 dominant comp, hip enclaves
    224/110/103px → 0, bbox `[29,19,226,237]` unchanged, semi-alpha 0, fringe 22 → 11, no new
    white. The 2 residual SOFT warns (367px/169px, ~75% down) are adjudicated by BOTH art gates
    as legit bike-fork/wheel see-through — non-failing.
  - **Baseline / boundary — PASS.** `yarn typecheck` / `yarn test` (189/189) / `yarn lint` /
    `yarn format:check` green (triple-reported by tooling, verif, and fixes lanes). ZERO
    `src/**` changes (verif lane traced the courier render path: flat texture map, no topology
    coupling — the PNG retouch cannot alter render behaviour). Change surface = `scripts/**`,
    `.github/workflows/**`, `public/assets/**`, `.claude/agents/**`, `docs/**` (ADR-0014 added
    per the CLAUDE.md CI-contract rule).
- **Follow-ups I'm logging (non-blocking, recommend a fast-follow tooling story):** (1) detached
  ~12–600px limb-fragment blind window (assert `nonDominantComponents == 0` for the courier at
  zero false-positive cost); (2) scope inversion — freshly generated/keyed sprites are
  auto-committed ungated while the gate covers only the sprite least likely to change. Both are
  deliberate + documented in ADR-0014 §C.
- **VERDICT: ACCEPTED.** All acceptance criteria satisfied, both art gates PASS, architect
  sign-off, no unresolved CONFIRMED blocking/major finding. Story **DONE**. No commit/push by
  PM — orchestrator owns the merge. (John / PM)

---

## 2026-07-13 — cycle — story-tutorial-device-paths (PR #38, ADR-0015) — FULL CYCLE

- **WHAT/WHY (Bertrand):** the scripted tutorial (ADR-0012) gets TWO paths — one detailing
  desktop controls, one mobile controls — picked automatically from the device, plus the ADR
  update. Bertrand ruled (AskUserQuestion): new **ADR-0015** amending ADR-0012 D4 §2, per the
  README immutability convention. Bonus motivation surfaced in exploration: the mixed copy was
  factually WRONG on both sides (mobile shooting is a TWO-finger tap, "clic ou tap" hid it;
  desktop has no drag-pan, "bord ou glisser" described a control that does not exist).
- arch: Boundary verdict PASS, four lanes on disjoint paths, fully parallel. Lane G
  (`dev-gameplay`): `src/game/systems/narrativeSystem.ts` + `tutorialInvariants.test.ts` +
  `narrativeSystem.test.ts`. Lane R (`dev-r3f-render`): `src/render/scene/App.tsx` only.
  Lane T (`dev-tooling-assets`): `scripts/screenshot-preview.mjs` only. Lane A (architect):
  `docs/adr/0015-device-forked-tutorial-script.md` + 0012 "Amended by" header line + README
  index row. (Winston / Senior Architect)
- release: all four lanes CONCURRENT, no file overlap, none edited this log (serialized by
  the orchestrator). Lane G — `TUTORIAL_NARRATIVE` replaced by `TUTORIAL_NARRATIVE_DESKTOP` /
  `TUTORIAL_NARRATIVE_MOBILE` (ids `tutorial_desktop`/`tutorial_mobile`), composed from four
  private segments; the 6 shared panels are the SAME objects by reference, only the 2 control
  panels fork; 8 panels per variant (progress-dot parity). TDD: 2 new invariants (fork limited
  to control panels via `toBe` reference equality; device-accurate copy via regex — mobile
  says "deux doigts" never "clic/souris", desktop the inverse). Lane R — module-scope
  `TUTORIAL_SCENE = IS_MOBILE ? mobile : desktop` beside `IS_MOBILE` (once-at-load, ADR-0003
  D1); `NarrativeScreen` untouched (device-agnostic). Lane T — `02_tutorial.png` →
  `02_tutorial_desktop.png` + second Playwright context with a mobile UA capturing
  `03_tutorial_mobile.png`; contact sheet updated. (Amelia ×3)
- review: architect diff review **PASS** — boundary law clean (no device/navigator vocabulary
  in `src/game`), scope exact, ADR-0015 statements verified item-by-item against the landed
  code, zero CONFIRMED blocking/major findings. (Winston / Senior Architect)
- verify: `yarn typecheck` / `yarn test` (191/191) / `yarn lint` green. End-to-end in a
  headless browser against the prod build: `?preview=tutorial` under a desktop UA renders
  "le viseur suit ta souris… Clic gauche" / "Pousse le curseur au bord", under a mobile UA
  "tape à DEUX doigts" / "Un doigt pour balayer… pichenette" — fork confirmed live.
- merge: PR #38 (draft → ready) **MERGED to main by Bertrand directly** (squash `1d4d341`).
  NOTE for the record: the 4-reviewer code-review panel and the formal PM acceptance were
  NOT run before this merge (only the architect sign-off was) — owner's prerogative,
  logged so the gap is visible, not silent. This handoff entry lands as a follow-up commit.
- follow-ups (non-blocking): (1) iPadOS desktop-UA limitation means iPads get the desktop
  script (accepted, ADR-0003 D1); (2) control copy now lives in two places — the
  device-accuracy regex test is the guard rail when a control scheme changes.

### story-enemy-sprite-flipbook (PR #37 draft, `claude/spline-three-fiber-integration-cm2hv4`)

- pm→arch: WHAT — give the enemy sprites a minimal 2-frame flip (6 fps) per state so a
  hostile shifts weight / recoils after firing, chosen AFTER evaluating a Spline/3D animated
  model and rejecting it. WHY — the Prohibition-1987 shooting gallery reads as "poster, not
  diorama" (`art-direction.md` §1); period sprites sell life with a tiny flip, not smooth
  animation, and the flip must NOT break the flat 2D fanzine identity or the existing
  generation → cutout → CI pipeline. Frames come from the existing Pollinations/FLUX pipeline
  (kontext img2img as the primary consistency lock) and are consumed as separate `_f<N>` PNG
  files. Scope test: conscious documented extension of the accepted enemy set, recorded in
  ADR-0016. (John / PM intent)
- arch: THREE lanes, disjoint paths, PARALLEL-SAFE. **Lane MANIFEST (dev-tooling-assets, data)**
  → new top-level `enemies` block in `src/game/levels/levelArt.json` (flat keys per base sprite
  file = asset root + legacy variant suffix, pinned integer seeds, `frames[0]==""` committed
  frame 1, `frames[i>0]` pose-delta clause), the single source of truth for both script and
  render. **Lane SCRIPT (dev-tooling-assets, tooling)** → `scripts/gen-enemy-types.mjs`
  rewritten manifest-driven with the kontext-primary / matched-flux-pair fallback strategy;
  `scripts/check-art-prompts.mjs` gains the `enemies` set; docs (`SCRIPTS.md`,
  `asset-pipeline.md`, `art-direction.md` §4.1, `render-layer.md`, `gen-sprites.yml` header)
  - ADR-0016. **Lane RENDER (dev-r3f-render)** → new pure `src/render/scene/flipbook.ts`
    (`flipbookFrame`, DOM/Three-free) + `enemyTextures.ts` (frame param, per-frame preload,
    frame→frame-1→global fallback chain, `frameCountFor`/`enemyAnimFps` reading the manifest) +
    `EnemySprite.tsx` (per-state anim clock, HIT pins frame 1). The manifest↔ARCHETYPES key
    contract is locked by a consistency test in `src/game/levels/__tests__` that mirrors the
    `fileFor` key scheme (game may NOT import render, so the rule is duplicated, not shared).
    Shared file `levelArt.json` is owned by the MANIFEST lane; render/test only READ it.
    Boundary law upheld by design: game stays React/Three-free, flip timing is visual-only,
    no new dependency. (Winston / Senior Architect — lane plan)
- release: All three lanes landed. MANIFEST — `enemies` block, 12 types keyed to the exact
  base filenames (normal ×3 variants idle+shooting, riot/biker idle+shooting, bonus/civilian
  idle-only), pinned seeds 4801–4812, `fps:6`, `size:256²`. SCRIPT — `gen-enemy-types.mjs`
  manifest-driven, kontext img2img primary from the committed frame 1 + matched-pair fallback,
  skip-existing, per-asset try/catch; `check-art-prompts` `enemies` set + docs + ADR-0016.
  RENDER — `flipbook.ts` (6 unit tests), `enemyTextures.ts` frame-aware fallback chain,
  `EnemySprite.tsx` anim clock; `levelArt.consistency.test.ts` locks the manifest↔ARCHETYPES
  contract. No `_f<N>` PNGs committed (generated in CI as designed). (Amelia ×3)
- review: **SIGN-OFF (no blockers).** Boundary law PASS — `src/game` has zero React/Three
  imports (only `levelArt.json` data + a read-only consistency test added), `flipbook.ts` is
  import-free/pure, render holds only visual timing, no new dependency. Cross-lane contract
  COHERENT — all 12 renderer-derivable keys present with no orphans (consistency test), the
  `fileFor` key derivation, the consistency-test mirror, the generator's `${key}_f${i+1}`
  filename construction and the ADR-0016 `_f<N>`-after-variant-suffix wording all agree; the
  12 committed frame-1 PNGs match the manifest keys. Pipeline safety PASS — skip-existing per
  file, kontext primary never touches frame 1, the loud fallback is the only frame-1 writer
  besides `FORCE=1`, per-asset try/catch never crashes the run. Verified GREEN locally:
  `yarn typecheck` 0 errors, `vitest` 200/200, `yarn lint` clean, `check-art-prompts --set
enemies` PASS (1 pre-existing non-blocking WARN on the civilian prompt).
  Non-blocking observations logged for a fast-follow: (1) the consistency test duplicates the
  `fileFor` root-derivation rule (boundary forces it — game can't import render); the pure
  key-derivation depends only on `ARCHETYPES`, so extracting it into `src/game` and importing
  it from both `enemyTextures.ts` and the test would make the contract structural instead of a
  mirror (`enemyTextures.ts` `baseFileKey` ↔ `levelArt.consistency.test.ts` `root()`/`keysFor`).
  (2) The fallback path in `gen-enemy-types.mjs` is non-atomic — it writes the regenerated
  frame 1 before fetching frame 2, and because the committed art was made by the old
  random-seed script the pinned-seed reroll won't reproduce it, so any fallback firing
  genuinely mutates accepted art; gated by the human art review in the PR, acceptable as-is.
  No commit/push. (Winston / Senior Architect — review)
- panel: 4-reviewer merge gate ran (all findings adversarially verified). #1 code-review
  (high): 0 blocking/major, 3 minor, 2 info, 12 refuted. #2 bmad-code-review: 0 blocking/major,
  5 minor, 4 info, 7 refuted. #3 edge-case hunter: 1 MAJOR, 2 minor, 2 low, 18 refuted. #4
  security-review: 0 findings, 2 refuted. One MAJOR (the non-atomic fallback I flagged at
  review) confirmed; no security findings. (panel)
- triage (Winston / Senior Architect — respecting the scope guard, minimal change, no
  speculative hardening):
  - **PRE-MERGE (one small coherent patch, no boundary impact / no new dep / no `src/game`
    logic change):**
    1. Non-atomic fallback (MAJOR) — fetch BOTH buffers before writing either so a partial
       failure can never orphan the committed frame 1 (ADR-0016 only sanctions the successful
       art-gated pair). `gen-enemy-types.mjs` `generateExtraFrame`.
    2. FORCE blast radius — simpler than the panel's `FORCE_ALL` proposal: `FORCE` gates only
       `_f<N>` frames; frame 1 (`i===0`) is generated ONLY when missing, never under FORCE.
       Restores the "committed art untouched" guarantee with ZERO new env surface (deliberate
       reroll = delete the PNG and re-run). Prefer this over adding a flag.
    3. Stale/absent kontext source — under fix #2 the only run that writes frame 1 is a
       brand-new enemy, so: when frame 1 was just written this run, skip kontext → matched
       pair (no valid committed source to img2img from).
    4. `ensureLoaded` in-flight guard — the 3-line `pending` Set only (real duplicate-load
       window amplified by the new per-frame preload loop). `enemyTextures.ts`.
    5. Frame≥2 prompt lint gap — fold into the item-6 `checkEnemies` edit, reusing
       `countNegations`/`wordCount`. Contract-completeness (low live risk: the short delta
       clauses assemble to fewer words/negations than the already-linted frame 1).
    6. Validation guards (code only) — null/shape guard + positive-seed check in
       `checkEnemies`; `loadEnemies` throws on a non-integer seed (kills the null-entry
       TypeError and the `seed=undefined`-in-URL defect). `check-art-prompts.mjs` +
       `gen-enemy-types.mjs`.
    7. Doc absolutes — re-qualify the "frame 1 never regenerated" wording in the
       `gen-enemy-types.mjs` + `gen-sprites.yml` headers (mandatory: items 1–2 change that
       behaviour in the same patch).
       8a. `$comment` filename typo in `levelArt.json` (`enemy_<key>_f<N>` doubles the prefix →
       `<key>_f<N>`).
  - **FAST-FOLLOW:** wire `check-art-prompts` into `gen-sprites.yml` as a gate (CI-policy
    change, split out of item 6); widen the integrity gate beyond `enemy_civilian.png` to
    `_f<N>` frames (own story, consistent with ADR-0014's deliberately-scoped gate);
    verify kontext output when its `image=` source is a transparent keyed PNG vs the
    black-ground style tail (unverifiable locally — network blocked; art gate catches bad
    output at first CI generation); tighten the vacuous single-frame scope-guard test.
  - **ACCEPT / decline:** per-(kind,variant,shooting) path-array memoization — speculative,
    per-frame small-string allocs are negligible (scope guard: no speculative hardening);
    200-non-image body written to `.png` — pre-existing pattern shared with
    `gen-vehicle-sprites.mjs`, not introduced here (scope guard §3: don't fix unrelated
    pre-existing issues).
  - Verdict: MERGE-GATE HELD — pre-merge patch required before merge (fixes the one CONFIRMED
    MAJOR + the cheap coherent guards); no unresolved CONFIRMED blocking/major finding remains
    after that patch. Re-run typecheck/vitest/lint/check-art-prompts on the patch before merge.
    No commit/push. (Winston / Senior Architect — panel triage)

---

## 2026-07-13 — dev-tooling-assets (Amelia): courier layered flipbook, tooling lane (ADR 0017)

- **START/FINISH:** implemented the tooling lane of the "2-layer courier flipbook" feature.
  Lane-scoped to scripts/CI/docs only; did NOT touch src/**, levelArt.json, or other
  workflows (parallel lanes own src/render/** and src/game/levels/**tests**/\*\*). No commit/push.
- **File List:**
  - `scripts/gen-courier-sprites.mjs` (NEW) — strip-and-slice generator: loadCourier()
    fail-fast, atomic per-layer skip/regen, one FLUX strip per layer sliced in-memory on a
    fixed grid (@napi-rs/canvas), per-file cutout() reuse, --list/--placeholder/PLACEHOLDER/
    FORCE/OUT_DIR, dependency-free procedural placeholders.
  - `scripts/check-art-prompts.mjs` — extracted `checkBudgets(rep, ap, assembled)` to
    top-level (pure refactor, enemies behaviour unchanged); added `checkCourier`; wired
    `courier` into --set whitelist + `all`.
  - `.github/workflows/gen-courier-sprites.yml` (NEW) — dispatch + ci(dispatch) guard,
    prompt gate before paid FLUX, installs @napi-rs/canvas BEFORE the generator, FORCE=1
    regen, bounded push-rebase-retry, failure artifact upload. Separate from gen-sprites.yml.
  - `docs/adr/0017-layered-courier-flipbook-strip-and-slice.md` (NEW) + README index row.
  - `docs/art-direction.md` §4.2, `scripts/SCRIPTS.md`, `docs/asset-pipeline.md`.
- **Key decision (flagged for review):** the courier per-layer word budget is measured over
  the strip-VARIABLE content (`exactly ${N} cells, ` + prompt + joined `cell i:` clauses),
  NOT the full assembled strip. Folding the byte-identical shared opening (~31 w) + style
  (~58 w) boilerplate into a multi-cell strip pushes EVERY layer past the 120-word ceiling
  (bike 141, rider 180) regardless of content, making the budget meaningless. Scoped per the
  sanctioned "adapt the courier set scope rather than reword the manifest" instruction; the
  manifest was NOT reworded. Result: bike 53 w (target band, clean), rider 92 w (90-120 WARN
  band, as specified), >120 still a hard error. Documented in a code comment in checkCourier.
- **VERIFY:** `node --check` both scripts OK; `--list` OK; `check-art-prompts.mjs` (all) and
  `--set courier` both PASS against the committed manifest (1 courier WARN = rider 92 w, by
  design); enemies set unchanged; `yarn format:check` clean; workflow YAML parses (7 steps).

- panel (courier increment `7c2226d..HEAD`): 4-reviewer merge gate, all adversarially
  verified. #1 code-review high: 2 major / 6 minor / 2 info, 8 refuted. #2 bmad-code-review:
  3 major / 5 minor / 3 info, 6 refuted. #3 edge-case hunter: 2 major / 3 medium-low, 15
  refuted. #4 security: 0 findings, 11 refuted. Zero CONFIRMED blocking. The three converged
  MAJORs are all in the generation/gate path (dimension validation, exit-code, asset↔key
  coupling) — load-bearing for the CI art run Bertrand fires next. (panel)
- boundary verdict: **PASS.** `src/game` gains only `levelArt.json` data + the consistency
  test (imports `vitest` / `@game/*` / manifest JSON only — no `src/render`); render
  (`CourierSprite.tsx`, `courierTextures.ts`) is texture/composite only, reads manifest data,
  holds no game rules; `@napi-rs/canvas` is CI-only (already used by the vehicle/enemy
  generators), no new runtime dependency; the game↔render↔hooks contract is untouched.
- triage (Winston / Senior Architect — scope guard: minimal change, no speculative hardening):
  - **PRE-MERGE (one coherent patch: `gen-courier-sprites.mjs`, `gen-courier-sprites.yml`,
    `check-art-prompts.mjs`, `courierTextures.ts` comment, `levelArt.json` bike prompt,
    `levelArt.consistency.test.ts`, `render-layer.md`, `SCRIPTS.md`):**
    1. sliceStrip dimension validation — throw when `img.width/height !== stripW/stripH`
       after `loadImage`; a clamped/rescaled FLUX return would otherwise slice garbage on the
       fixed grid and commit it green. LOAD-BEARING for the CI run. (If CI shows Pollinations
       _proportionally_ rescaling, a derive-cellW-from-`img.width/N` tolerance is a fast-follow
       — but throw is the correct minimal call for a gated pipeline.)
    2. exit code — count per-layer fetch/slice failures and `process.exit(1)` at end so a
       partial/total-failure run fails the job instead of committing a partial set green;
       guard the workflow `git add` (`compgen -G` or add the directory) so a zero-file run
       fails loudly, not with a misleading pathspec fatal. LOAD-BEARING.
    3. asset↔key coupling — assert `asset === "assets/courier/<layerName>.png"` in both
       `checkCourier` and the consistency test (also enforces the `.png` suffix that
       `fileFor`'s `/\.png$/` replace silently no-ops on). Closes the renamed-asset →
       permanent-silent-fallback footgun.
    4. tryCutout — swallow only `ERR_MODULE_NOT_FOUND` (decoder absent), rethrow the rest, so
       a real keying error can't commit un-keyed black frames.
    5. bike prompt `"rider-free"` = hidden negation (forbidden by this diff's own
       art-direction §4.2 and the manifest's own `$comment`); reword positively ("an empty
       delivery bicycle, bare saddle, unoccupied pedals") and extend `NEG_RE` with
       `\b\w+-free\b|\bwithout\b`. LOAD-BEARING (wasted paid run if FLUX paints a rider on the
       bike layer).
    6. loadCourier fail-fast — align to the lint/test/ADR contract: frames 2..8 (not >=1),
       non-empty opening/style (not `?? ""`).
    7. workflow_dispatch guard — add job-level `if: github.ref_name != 'main'` so a manual UI
       run on `main` can't FORCE-push art past the merge gate. Scoped to THIS workflow; the
       same latent gap in sibling workflows is FAST-FOLLOW (pre-existing, backstopped by the
       merge-gate policy). Does not impede the branch run.
    8. checkCourier hardening — numeric guards on `size.width/height`/`fps`, `typeof` guards
       on `opening`/`style`/`prompt` (raw `.trim()` on a non-string currently crashes the
       linter), and assert `size.width === size.height` (the square-cell assumption the
       opening prompt + slicer + render plane all silently depend on).
    9. correct the false "picked up the moment it lands in CI" wording in `courierTextures.ts`
       - `render-layer.md` — the `failed` set is permanent for a running client; a reload is
         required. Doc/comment only.
    10. `fetchImage` (3rd copy) — minimal redirect-depth cap + socket timeout IN THE NEW
        SCRIPT ONLY, so a redirect loop / hung socket can't ride to the 6h CI kill. Full
        `scripts/lib` extraction of the shared flux/png helpers = FAST-FOLLOW.
    11. SCRIPTS.md prompt-assembly formula corrupted by a `-` list item — trivial doc fix.
  - **FAST-FOLLOW:** hot-path readiness latch + per-frame URL rebuild (perf, courierTextures);
    one-time aspect pop at fallback→ready swap; `_f<N>` naming hand-rolled in 4 sites → shared
    helper; flux/png helpers in 3 scripts → `scripts/lib` extraction (with the item-10 caps);
    `@napi-rs/canvas` pin across 4 workflows → composite action; widen the sibling-workflow
    dispatch guard (item 7).
  - **ACCEPT:** none deferred to accept beyond the above — the 200-non-image-body-written-to-
    `.png` pattern was refuted/pre-existing (shared with `gen-vehicle-sprites.mjs`), out of
    scope per scope-guard §3.
  - **lint-scoping deviation — SIGN-OFF (conditional).** Budgeting the strip-VARIABLE content
    only (excluding the byte-identical ~89 w opening+style house tail) is a justified,
    documented adaptation: folding the shared tail into a multi-cell strip makes the full-
    assembly budget a constant meaningless FAIL (bike 141 / rider 180 regardless of content),
    exactly the reasoning the vehicle four-slot split already established. It does not hide
    authoring risk — negations/word-bloat in the authored prompt + cells ARE checked.
    CONDITIONS: (a) item 5 lands (the `-free` slip is a NEG_RE gap, not a scoping gap — without
    it the deviation + a blind NEG_RE is the exact hole that passed "rider-free"); (b) the
    deviation stays recorded in ADR-0017. Optional refinement (not blocking): negation-scan the
    FULL assembly while word-budgeting only the variable part, so a stray negation in the shared
    tail can never slip.
  - Verdict: **MERGE-GATE HELD** — the pre-merge patch (items 1-11) is required before merge
    and before firing CI generation (1/2/5 are directly load-bearing for that run); after it,
    no unresolved CONFIRMED blocking/major finding remains. Re-run `yarn typecheck` / `vitest`
    / `yarn lint` / `check-art-prompts --set courier` + `node --check` on the patch. No
    commit/push. (Winston / Senior Architect — panel triage)
- art PROMPT GATE: PASS — courier rework (opening per-cell containment + greyscale
  register + crouch/3-spoke frames, seeds 5210/5220). Lint PASS, 1 sanctioned WARN
  (rider 107w). Asset-gate watch items: rider phantom-bike risk from "feet on pedals";
  bike "three" manifest coupling; enemy regen — watch "pale neon tones" color flood +
  \_f2 pair identity. (lead-art)
- art ASSET GATE (bike): PASS par Bertrand — take 4 per-frame + retouche scriptée
  des bâtons (retouch-bike-spokes.mjs, 0/40/80°, base unique = zéro flicker).
  Rider: prochaine itération.
- art ASSET GATE (courier final): PASS par Bertrand — sprite cycliste complet unique
  (base FLUX seed 5220) + rotation de roues scriptée 6 frames/20° (retouch-courier-
  spokes.mjs, bâtons à liseré). Layer vélo retiré du composite, art conservé en
  réserve. Vérifié en jeu (burst headless, zéro erreur).

---

### story-enemy-sprite-hole-fill — enclosed-transparency-hole fill + CI gate

- audit baseline: the chroma-key cutout (enclosed-island pass, ADR-0013) left
  transparency holes INSIDE some enemy figures — a hole audit found **20/22
  enemy\_\*.png files** carrying enclosed holes, **2832 enclosed transparent px**
  total (interior alpha<16 fully walled by opaque body — paper-white zones FLUX
  never drew that the keying pass then cleared).
- fill tool (game-graphist lane): `scripts/fill-sprite-holes.mjs` — surgical fill,
  re-opaques ONLY enclosed alpha<16 pixels to the boundary-mean colour, never cuts,
  deterministic + idempotent; `--check` writes nothing and exits 1 if any enemy
  file still has an enclosed hole.
- prevention wired (dev-tooling-assets lane, `.github/**` + docs only — no
  `src/`/`scripts/`/`public/` touched): `.github/workflows/gen-sprites.yml` runs
  `node scripts/fill-sprite-holes.mjs` after cutout (reuses the @napi-rs/canvas the
  cutout step already installs) then a `--check` **hole gate** before commit, so the
  job FAILS if any enclosed hole survives (Bertrand's condition: no enemy character
  may ship with a transparency hole). Docs: `scripts/SCRIPTS.md` (new section),
  `docs/asset-pipeline.md` (enclosed-hole fill + gate paragraph), this log. Verified
  with a YAML parse + visual indentation check; prettier clean. No commit.
  (Amelia — Tooling & Assets)

### story-enemy-hole-fill (scripted retouch — game-graphist)

- graphiste TECHNICAL pass (Serge): the chroma-key ("enclosed-island pass" in
  cutout-enemies.mjs) ate DARK-clothing regions that matched the near-black key ground,
  punching transparency HOLES _inside_ 19/22 enemy sprites (2832 enclosed px total; worst:
  enemy_civilian 2087 = solid bike-wheel spoke-gaps + dark trousers, enemy_sprite_3 241 =
  beanie crown, enemy_shooting 103 = uniform shoulder, enemy_sprite_2 102 = black belt).
- FIX: authored `scripts/fill-sprite-holes.mjs` — surgical FILL ONLY. Border flood-fill
  (4-conn, alpha<16) marks exterior; remaining transparent = enclosed holes; each region
  filled with the MEAN colour of its alpha-255 opaque border (trouser-hole → trouser colour).
  Built-in surgical self-check ABORTS the write if any previously-opaque (alpha>=16) pixel
  changes or any non-enclosed pixel changes. `--check` mode = CI gate (exit 1 if any hole).
- RESULT: all 2832 holes filled, every per-file self-check clean, `--check` exits 0 (zero
  enclosed px on every enemy\_\*.png), idempotent (2nd run writes nothing). Independent PIL
  byte-diff vs git HEAD on the 4 worst: opaque_pixels_changed=0, changed count == holes
  filled, all changed pixels were previously transparent. Silhouettes untouched; fill colours
  plausible. NOTE for Nico's taste gate: civilian's bicycle wheels go from spoked to SOLID
  dark discs (the spoke-gaps were enclosed transparency per Bertrand's "everything solid"
  mandate) — reads fine at game size, outer rim unchanged, but it is the one visible read
  change worth a taste glance. NOT committed. (Serge — TECHNICAL pass, scripted retouch)

### story-enemy-hole-fill — ITERATION 2 (SOLIDIFY pass, game-graphist)

- Bertrand's gate rejected iter-1 ("encore trop de transparence"): the enclosed-only fill
  left figures POROUS through BORDER-connected transparency (gaps opening to the outside;
  waist-cut bust torsos draining out the bottom edge). Bertrand prototyped + applied a
  SOLIDIFY pass to all 22 working-tree files (validated visually by his direction).
- PORTED that pass into `scripts/fill-sprite-holes.mjs` as default behavior so CI reproduces
  it. Two passes per file: PASS A — reconstruct the solid body mask (opaque + SELECTIVE
  bottom-row seal [only frame-cut columns, opaque within 2px of the bottom edge — NOT the
  whole x-extent, which would annex the background triangle between spread legs / slivers
  under feet] → disk-10 binary_closing → binary_fill_holes → largest CC → disk-1 erode) and
  fill every transparent px inside it with the dark-clothing tone (median RGB of opaque px
  below the figure's median luminance); PASS B — the iter-1 enclosed-region mop-up. Pure
  JS morphology (precomputed disk offsets), no scipy. Surgical self-check unchanged (aborts
  if any originally-opaque px would change). `--check` = detect-only gate, exit 1 if either
  pass would fill anything.
- ACCEPTANCE (king): `node scripts/fill-sprite-holes.mjs` reports 0 px to fill on all 22
  current files, `--check` exits 0, no PNG rewritten. CI-fidelity: run on the porous git-HEAD
  originals fills 101,975 px, every self-check clean, re-check exits 0 (solid + idempotent);
  regenerated figures composite fully solid over magenta with body intact. Selective-seal
  vs ground-truth diff: orange=0 (NEVER over-annexes background); the only deltas are 1-3px
  base/under-feet slivers the seal correctly leaves transparent.
- Docs updated: script WHY header + SCRIPTS.md section + gen-sprites.yml two step comments
  (was "enclosed only" → "solidify") + sprite-hole-audit skill. node --check + prettier
  clean. NOT committed. (Serge — TECHNICAL pass, scripted retouch iter-2)

### story-enemy-muzzle-and-blobs-fix (kickoff — pm + senior-architect)

- Bertrand reported two in-game bugs: (1) code muzzle glow misaligned with the baked
  flash/barrel (fixed +x offset in EnemySprite.tsx vs per-sprite flash positions, some
  aiming LEFT), (2) dark opaque background blobs around figures (chroma-key remnants
  locked opaque by the solidify pass) reading as rectangles in game.
- pm (John): scoped story `_bmad-output/planning-artifacts/story-enemy-muzzle-and-blobs-fix.md`
  — bug fix, cahier-des-charges FAITHFUL, AC1-AC7 incl. the 81a26ad hard line (figures
  stay solid) and `fill-sprite-holes.mjs --check` still passing.
- senior-architect (Winston) sign-off: `muzzle` anchors = OPTIONAL per-frame array
  (`[{x,y}|null]`, normalized from PNG top-left, index-aligned with `frames`) in
  levelArt.json enemies.types — asset metadata, no game/render boundary violation
  (manifest already imported by enemyTextures.ts only). Plane math validated:
  dx=(x−0.5)·planeH·aspect, dy=(0.5−y)·planeH. ADR: none for the anchor field
  (extend asset-pipeline.md + ADR 0016 note); NEW ADR 0019 required for the
  blob-removal retouch (destructive edit to committed art, cross-ref ADR 0014).
- Lane partition: A = dev-r3f-render (enemyTextures.ts `muzzleFor` + EnemySprite
  consumption, null → current fixed-offset fallback) ∥ B = game-graphist (scripted
  blob removal OUTSIDE figures only, flashes preserved, --check green, ADR 0019);
  C = dev-tooling-assets (scripts/measure-muzzle-anchors.mjs + levelArt.json data)
  runs AFTER B so committed anchors are measured against shipped pixels.
  levelArt.json written only by C; enemyTextures.ts/EnemySprite.tsx only by A;
  PNGs only by B. (John + Winston, orchestrated)

### explosion-alignment-transparency — Lane A (render muzzle anchors)

- Amelia (dev-r3f-render): enemyTextures.ts gains optional per-frame `muzzle` manifest
  field + `muzzleFor()` (null-safe under noUncheckedIndexedAccess); EnemySprite.tsx
  SHOOTING branch anchors the additive glow at the per-frame anchor (same `frame` as
  the displayed texture), fallback to the legacy fixed offset when null. HIT burst
  unchanged. 6 new unit tests (muzzleFor.test.ts). tsc + vitest (213) + eslint green.
  Committed as edee686.

### explosion-alignment-transparency — Lane B (enemy sprite blob cleanup, iter 2)

- Serge (TECHNICAL pass): iter 1 (flash-scoped auto guards, 1,874 px) rejected at the
  visual gate — torn rings/wings still read on light bg. Iter 2 reworked
  scripts/retouch-flash-halos.mjs to per-file CLEAR_ZONES + THRESH_OVERRIDE +
  exterior-connected + solidify-reconcile + speckle-sweep, run to a fixpoint
  (delete-outside-only, alpha 255→0, RGB frozen). Removed the torn flash rings/wings
  on 10 shooting sprites (23,353 px). fill-sprite-holes --check PASS, retouch --check
  idempotent PASS, integrity failing set 16→9 (8 sprites now PASS, no regressions),
  enclaves=0 on all, flashes preserved, figures intact. Accepted residual: shooting_3
  & riot_shooting flashes detach topologically (render identically at the muzzle).
  civilian + idles untouched. ADR-0019 added. Committed with this entry.

### explosion-alignment-transparency — Lane C (muzzle anchor data)

- Amelia (dev-tooling-assets): new scripts/measure-muzzle-anchors.mjs (deterministic,
  idempotent via string-surgery + prettier; @napi-rs/canvas like the other asset
  scripts) measures the baked-flash centroid (hot-pixel 8-connected largest component,
  min 50 px) and writes per-frame `muzzle` arrays into levelArt.json for the 5 shooting
  entries. Visual preview: all 10 markers on the flash. tsc + vitest 213/213 + prettier
  green. Docs: asset-pipeline.md + SCRIPTS.md. Committed with this entry.

### explosion-alignment-transparency — iter 3 (Bertrand's gate: 3 flagged sprites)

- Bertrand flagged 3 sprites on the anchor preview: shooting_3 f1 (floating faint
  flash star, detached from the pistol), riot_shooting f1 + f2 (torn dark wings
  still around the blasts).
- Serge (TECHNICAL pass, iter 3): new ERASE_ISLANDS lever removed the whole floating
  star (532 px, a separate component — figure-safe by construction); riot splash
  zones widened to the full island + SB relaxed to 0.85 under lum<88 (dark-red torn
  material) — riot f1 −1472 px, riot f2 −1023 px. Figure-seed reconcile prototyped
  and REJECTED (would open a 539 px interior hole in f2); the all-opaque reconcile
  is the maximal safe removal. shooting_3_f2 judged fine and left byte-identical.
  fill-holes --check PASS, retouch --check idempotent PASS, shooting_3 integrity
  FAIL→PASS. Measured pistol muzzle tip for shooting_3 f1: n(0.77, 0.44).
- Orchestrator: measure-muzzle-anchors.mjs gains a documented MANUAL_ANCHORS
  override (frame file → anchor, precedence over detection) for erased-flash
  frames; re-measured → levelArt.json shooting_3 f1 anchor now (0.77, 0.44), all
  other anchors unchanged. Preview verified: marker on the barrel end. tsc +
  vitest 213/213 + prettier + both asset gates green. Committed with this entry.

### explosion-alignment-transparency — iter 4 (Bertrand: "tu as fait des trous")

- Bertrand flagged the pushed iter-3 sprites: over-deletion punched holes — big
  chest/under-bust hole on shooting_3, ragged bites all along the bust bottoms
  (shooting_2{,\_f2}, shooting_3{,\_f2}), lacy riot blasts + left-foot bites. Root
  cause: the zone+tone rule can't separate dark FIGURE from dark remnant, and once a
  whole figure region in a zone is deleted the solidify reconcile can no longer
  reconstruct it as body → keyed hole.
- Serge (TECHNICAL pass, iter 4): NEW `scripts/restore-figure-bites.mjs`
  (ADD-BACK-ONLY, self-checked; reference = pre-retouch base c79dfda). Bust/figure
  regime restores the whole figure component minus the flash-exclude zone (entire
  bust bottom + chest solid, "prefer oversized to any hole"); riot regime restores
  figure body (opening∖bright-halo) ∪ warm blast interior (r−b>20), grey wings stay
  deleted. Restored px: shooting_3 6004, shooting_3_f2 2986, riot 1328, riot_f2 745,
  shooting_2 725, shooting_2_f2 600; shooting{,\_f2} + biker{,\_f2} = 0 (audited
  clean). Then fill-sprite-holes topped riot interiors (A=1221 / A=575).
- Recalibrated `retouch-flash-halos.mjs` to a FIXPOINT: removed all figure-covering
  zones + retired both riot files from the zone table (wings already gone, a splash
  zone only re-laced the finished blast); added global WARM_GUARD (r−b>15 never a
  candidate); review-panel fixes — self-check now asserts α≥OPAQUE→0 (was 255→0),
  speckle-sweep global scope documented as deliberate; THRESH_OVERRIDE emptied.
- Gates all green: retouch --check = 0 (idempotent, no re-punch), fill --check PASS,
  restore --check = 0 (idempotent), border-flood = 0 enclosed transparent px anywhere
  incl. blast islands; check-sprite-integrity all 6 PASS (busts comps=1, star gone).
  Anatomy sweep on magenta clean (limbs rooted, both boots solid, no floating member,
  no punched hole). Visual at 512/256/64 grey+magenta: bust bottoms continuous, chest
  solid, blasts full (no lace), wings/star gone. ADR-0019 updated (iter-4 section).
  6 PNGs + 2 scripts changed; NOT committed (per Bertrand's request). Files:
  shooting_2{,\_f2}, shooting_3{,\_f2}, riot_shooting{,\_f2}.

### explosion-alignment-transparency — iter 5 (bust-hem fill, Bertrand live gate)

- Bertrand: "remplis encore un peu plus le buste" (enemy_shooting_3), then
  approved frame 2 at the closing-only result ("pour lui c'est ok"). The
  raggedness was the ORIGINAL torn hem (border-open bays — no retouch bite
  left). New scripts/fill-bust-hem.mjs authors fill: disk-22 closing in the
  lower half + frame-cut extendDown on f1 (columns whose hem mass reaches the
  bottom band fill to the frame bottom, matching approved f2); median local
  clothing tone; add-only + self-check; joint fixpoint with fill-sprite-holes
  (6 residual px). f1 +6,283 px, f2 +1,659 px. All four gates PASS, anchors
  unchanged, 213 tests green. (orchestrator, graphist lane)

---

### crew-game-design-lane

- setup: Game-design lane added to the crew (Bertrand's request, 2026-07-14). Three new
  subagents: `game-designer` (Sacha 🎮 — mechanics, tuning, 3C), `narrative-designer`
  (Yasmine ✒️ — universe, cast, in-game text) and `lead-game-designer` (Karim 🧭 —
  DESIGN GATE + design↔art↔dev sync). New flow section in
  `.claude/agents/COLLABORATION.md` (§"The design flow"): designers write specs/scripts
  under `docs/game-design/` (index README owned by Karim), gate PASS required before
  `senior-architect` assigns lanes; devs implement gated specs only. Rule #1 amended
  accordingly. BMAD side: the official BMGD module ("BMad Game Dev Studio", module code
  `gds`, npm `bmad-game-dev-studio`) exists but is NOT installed in this repo; the new
  agents bridge to installed BMM skills and will prefer `bmgd-*` workflows once/if
  Bertrand installs the module (`npx bmad-method install`, select "Game Dev Studio").
  (Orchestrator)
- update: Follow-up on Bertrand's review (same cycle): (1) the three separate flows are
  now ONE production pipeline (stages 0. INTAKE → 9. MERGE) in COLLABORATION.md, with an
  explicit VERIFY stage (checks + e2e + composite gate + game-designer PLAYTEST vs gated
  spec → lead-game-designer design acceptance); (2) new `producer` subagent (Marion 📆)
  owns pipeline execution — stage tracking, hand-off chasing, cap enforcement,
  escalation packets — no gate, no authorship; (3) `docs/diagrams/agent-workflows.md`
  rewritten as one mermaid flowchart of the full pipeline (syntax validated).
  (Orchestrator)
- update 2: `sound-designer` (Malik 🎧) added — Bertrand spotted the gap: a game ABOUT
  sound systems had nobody owning the sound. Malik owns `docs/audio-direction.md` (to be
  drafted on first activation, sonic twin of the art bible), audio specs ("ce qui sonne
  informe"), and the AUDIO GATE on BGM/SFX assets + audible behaviour changes; taste
  calls needing human ears are escalated to Bertrand as shortlists, never passed blind.
  Pipeline stage 4 gains an AUDIO lane (§audio flow in COLLABORATION.md); mermaid
  diagram updated and re-validated. Roster: 14 agents. (Orchestrator)
- update 3: `qa-lead` (Inès 🧪) added — owner of pipeline stage 5 (VERIFY): per-story
  test plans under `docs/qa/` (index created, with the known e2e holes listed), e2e and
  regression scenario SPECS (implementation stays in the dev lanes), and the QUALITY
  GATE funnelling checks + composite/audio gates + design acceptance into one verdict
  before INTEGRATE. Decision recorded as ADR-0018 (staffed production pipeline).
  Roster: 15 agents. Mermaid diagram updated. (Orchestrator)
- review-panel: 4 parallel reviewers (consistency/code-review-high, acceptance-audit/
  bmad-code-review, edge-case-hunter, security-review) on the full branch diff;
  24 consolidated findings triaged by senior-architect (adversarial verification
  against the real files). Verdict: 3 CONFIRMED MAJEUR (blocking) — ADR-0018 missing
  from the ADR index; COMPOSITE GATE had no viable FAIL route (routed to concept-artist
  for a src/render defect); new AUDIO GATE had no licence/provenance criterion — plus
  19 CONFIRMED MINEUR, 1 REFUTED (tool-grant premise wrong: pm has WebSearch),
  1 OUT-OF-SCOPE (pre-existing prompt-gate cap behaviour). ALL confirmed findings
  fixed in-branch (blocking set + minors batched: gate lists, FAIL/reject edges,
  cap semantics + cycle definition, skip authority, QA waiver/dispute arbitration,
  producer serialisation wording, merge-authority wording, docs/index.md rows,
  lead-game-designer Bash dropped). ESCALATION to Bertrand/pm (separate ticket,
  pre-existing, NOT fixed by this branch): scripts/download-audio.mjs labels its
  sources "public domain / CC" but its lists fetch copyrighted LukHash tracks —
  live IP risk on the public deploy. (Panel + Winston triage, orchestrator applied)

- story-tutorial-visual-gestures / Lane A (dev-gameplay, Amelia): FINISH. Owned
  `src/game/**` only (Lane B owns src/render, untouched). Added `GestureKind` union +
  optional `gesture?`/`gestureAlt?` to `NarrativeLine` per ADR-0020 (D1, JSDoc verbatim,
  pure data — narrativeSystem.ts stays import-free). Transcribed the gated 11-panel script
  (`docs/game-design/tutorial-script-visual-gestures.md`): opening [0,1] shared (O2
  tightened per gate), forked control panels [2,3] carry desktop `mouse-click`/`edge-scroll`
  and mobile `two-finger-tap`/`swipe-pan` (no image), field [4..10] shared bestiary
  (normal/riot/biker/bonus/civilian shooting-pose + HUD + outro). All 6 sprite paths
  verified on disk. Panel count 8→11 both variants; shared indices [0,1,4,5,6,7,8,9,10]
  reference-equal, fork [2,3]. Tests: extended tutorialInvariants (11-panel count, gesture
  XOR image, gesture only on [2,3], device-correct values, gestureAlt-present, shared-panel
  token cleanliness) + narrativeSystem A5 (gesture ∈ GestureKind). GREEN: tsc clean, lint
  clean, 194/194 src/game tests (tutorialInvariants 13, narrativeSystem 6). NOT committed —
  orchestrator commits after both lanes land. Hand-off to Lane B: `GestureKind` is exported
  from `@game/systems/narrativeSystem` for the exhaustive `Record<GestureKind,…>` icon map.
  (Amelia / dev-gameplay)

- story-tutorial-visual-gestures / Lane B (dev-r3f-render, Amelia): FINISH. Owned
  `src/render/**` only (Lane A's `src/game` untouched — its contract landed while I worked,
  so tsc is green against the real `GestureKind` + `gesture?`/`gestureAlt?`, no shim needed).
  NEW `src/render/ui/GestureIcon.tsx`: four inline-SVG + CSS-keyframe icons per
  `docs/game-design/tutorial-visual-gestures.md` §1, one exhaustive `Record<GestureKind,…>`
  (a 5th enum value fails the build). B&W line-art décor (INK) + ONE neon-yellow `#ffe600`
  glow each, every glow a radial/linear alpha-falloff gradient to 0 (loi du glow / halo-dégradé).
  `prefers-reduced-motion: reduce` freezes each on its readable base frame. Animations:
  mouse-click (1.2s) left button presses 2px + glow spike → one click-ripple → rest;
  edge-scroll (4.8s, alternates right then left edge) cursor slides to edge → edge band glows
  inward + chevrons march → snap back (horizontal both-senses; top/bottom is the noted faithful
  extension); two-finger-tap (1.4s) both fingertip halos flash in sync (shared class) → single
  midpoint ripple → lift → long rest (never reads as double-tap); swipe-pan (4s) one fingertip
  sweeps trailing a gradient motion-trail, lifts mid-travel, trail glides to an eased stop
  (inertia), cycles horizontal then vertical (two dirs shown; full 4-way is the noted extension).
  EDITED `src/render/ui/NarrativeScreen.tsx`: renders `<GestureIcon kind={…}/>` in the same
  38vh/shrinkable slot as `image`, only when `image` absent & `gesture` set, wrapped
  `role="img"` + `aria-label={gestureAlt ?? ""}` (SVG aria-hidden). Graceful degradation:
  absent gesture → slot not rendered; unknown value impossible under the exhaustive Record.
  GREEN: `yarn typecheck` clean, `yarn lint` clean. NOT committed. Runtime visual fidelity
  (glow falloff, read-at-a-glance) is for the composite/`verify` gate on real screenshots.
  (Amelia / dev-r3f-render)

- devs→arch: **INTEGRATION REVIEW — APPROVE-with-fixes (fixes applied, no rework).** Both lanes
  land clean against ADR-0020. CONTRACT: `GestureKind`/`gesture?`/`gestureAlt?` verbatim per D1;
  boundary law upheld (`narrativeSystem.ts` zero imports = pure data; every pixel in
  `src/render/ui/GestureIcon.tsx`; type-only cross-boundary import). GOTCHAS all honored: gesture
  XOR image, gesture only on fork [2,3], device-correct values, shared-ref [0,1,4,5,6,7,8,9,10],
  11-panel parity, exhaustive `Record<GestureKind,…>` — all test-pinned (tutorialInvariants 13,
  narrativeSystem 6, both green). tsc EXIT=0 under `noUncheckedIndexedAccess` because the Record is
  over a _closed literal union_ (lookup is non-nullable, hence exhaustive). NarrativeScreen: gesture
  slot gated on `image===undefined && gesture!==undefined` → zero regression for pre/post-level
  scenes (no `gesture` field); a11y `role="img"`+`aria-label`, SVG `aria-hidden`; reduced-motion
  freeze via media query. All 5 bestiary sprites + truck confirmed on disk. Surgical: every changed
  line traces to the gated script/spec. FIX APPLIED (mine, trivial, doc-only): the header JSDoc in
  `GestureIcon.tsx` and the slot comment in `NarrativeScreen.tsx` claimed the "never a broken slot"
  guarantee came from a runtime `… | undefined` lookup / `GestureIcon` returning null — factually
  wrong (the closed union makes the lookup non-nullable; GestureIcon never returns null). Corrected
  both to describe the real mechanism (closed union + exhaustive Record + caller's gate). No code
  behavior changed; tsc+lint re-verified EXIT=0. VERDICT: cleared for the code-review panel / merge
  gate. (Winston / Senior Architect)

- story-tutorial-visual-gestures / Stage 5 VERIFY — QUALITY GATE: **PASS**
  (qa-lead, Inès). Runtime capture via `verify` skill on `?preview=tutorial`, both
  device forks, headless Chromium; 0 pageerrors either context. DESKTOP (default UA):
  drove all 11 panels — dotCount=11, litDots 1→11 monotonic, `Passer` present every
  panel. Panel 2 `mouse-click` (role=img aria "Souris : un clic gauche, un tir."),
  panel 3 `edge-scroll` (aria "Curseur poussé au bord…") — edge-PUSH glow band, not a
  drag (DA1). Bestiary panels 4–8 render correct sprites+alts: enemy*shooting,
  enemy_riot_shooting, enemy_biker_shooting (all SHOOTING pose w/ muzzle flash),
  enemy_bonus + enemy_civilian (idle) (DA5). MOBILE (iPhone UA → detectMobile flips to
  TUTORIAL_NARRATIVE_MOBILE): panel 2 `two-finger-tap` (aria "Deux doigts, un seul tap
  simultané…", two static glowing fingertips) + panel 3 `swipe-pan` (aria "Un doigt
  balaye…", one fingertip + neon motion trail) — device-accurate copy, distinguishable
  at a glance (DA2/DA4). GLOW (DA3): every lit element is a radial/linear alpha-falloff
  gradient reaching 0 — mouse left-button bloom, edge-band bright→0 inward, fingertip
  radial halos, swipe trail tip→tail — NO flat neon plate. ANIMATION: frameA vs frameB
  1s apart differ on BOTH forks (desktop button glow spike→idle; mobile differs) —
  loops running. Both variants 11 panels, dot parity (DA6). Optional/skippable/
  informative, TERMINER→menu, nothing written to progress (DA7). Icons render in the
  38vh slot, never a broken/empty slot (DA8). Evidence: 11 PNGs under qa scratchpad
  (desktop_panel*{2,3,5,6,7}[_frameA/B], mobile*panel*{2,3}[_frameA/B]).
  NOTES (informational, non-blocking): (i) mobile tutorial is only reachable in
  LANDSCAPE — portrait raises the ADR-0003 rotate overlay ("TOURNEZ VOTRE APPAREIL")
  by design; captures taken in 844×390. (ii) edge-scroll alt-edge (left) cycle + swipe
  4-direction full sweep are noted faithful extensions per Lane B, not captured as
  single stills. No defects found. Hand to senior-architect (Winston) for integration
  review; game-designer (Sacha) design-conformity playtest runs in parallel. (Inès / qa-lead)

---

### fix-wheel-spin-and-vehicle-facing (PR #42, branch claude/bike-wheel-speed-nnh6wi)

- intake: two visual bugs from Bertrand (2026-07-14): courier bike wheels spin far too
  slowly vs road speed; delivery vehicle reads as driving in reverse. (Orchestrator)
- diagnosis: (1) stamped-spoke flipbook played at fixed 6 fps regardless of
  COURIER_SPEED=7 u/s — measured wheel ≈ 84px of the 256px cell ⇒ ~0.85 wu diameter ⇒
  ~2.6 rev/s ⇒ ~940 deg/s ⇒ ~47 fps at the rider's 20°/frame step, rounded to 48;
  (2) car.png/truck.png art faces LEFT while DeliveryVehicleSprite assumed right-facing
  art (courier convention) — moto correct by accident. (Orchestrator)
- dev lane (dev-r3f-render): per-type `facing` registration knob in levelArt.json
  (car/truck=left, moto=right), artSign() combined with inferred travel direction,
  applied to sprite mesh AND baked neon rim; consistency test requires the knob.
- verify (qa-lead, headless run + screenshots): PASS both fixes — spokes advance fast
  between captures; truck (→right) and car (→left) both point hood-first in travel
  direction, rim aligned, no ghosting. tsc + 208 vitest + lint green. Known coverage
  gap: `moto` (facing=right) never spawned by any level's delivery — logic+test only.
- architect: APPROVE-WITH-NOTES → note folded (fps tuned to rider 20°/frame; spare bike
  layer 40°/frame would need ~24 fps if re-composited). No ADR (registration/tuning
  knobs, no boundary/contract change).
- review-panel (4 parallel: code-review-high / bmad-code-review / edge-case-hunter /
  security-review): ZERO blocking/major; security NO FINDINGS. Actionable minors fixed
  in-branch: flipbook clock gated on `paused` (7121101); artSign direct closed-union
  manifest indexing, Record widening dropped (bb9c4e8) — endorsed as strict improvement
  (compile-time exhaustiveness: future vehicle type without `facing` fails tsc);
  redundant $comment sentence deduped.
- triage (Winston, final): APPROVE for merge. Deferred: wagon-wheel undersampling of the
  48fps flipbook on sub-48Hz displays → game-designer PLAYTEST item; fps↔speed coupling
  test → WON'T-FIX (would hardcode the eyeballed 84px estimate into a brittle oracle —
  the $comment derivation is the right home); one-frame stale-facing flash at
  IDLE→INCOMING → pre-existing, off-screen, pm backlog minor; `facing` staleness after a
  FLUX reroll → art-gate checklist duty (documented in $comment), closed; rider layer
  facing knob symmetry → backlog LOW (couriers travel one lane direction; speculative
  generality today).
- pm acceptance (John): ACCEPT — fidelity fixes to shipped features, scope test passes
  with no cahier-des-charges question; core loop intact; DoD met (checks green,
  browser-verified both directions, manifest test guards `facing`). Standing note: the
  deferred minors/nits above are tracked follow-up debt (this entry is the log).
  Clear to merge.

- story-tutorial-visual-gestures / panel fix batch (post-triage, two parallel lanes):
  Lane A (dev-gameplay, Amelia): HUD panel copy corrected to match HUD.tsx reality
  ("En haut : ton score, le niveau, la vague, le chrono et tes vies. Quand le colis
  passe, la jauge de livraison s'affiche au centre — tiens-la au vert."), gesture/image
  XOR + gestureAlt invariants widened to ALL exported scenes (tutorial variants +
  PRE/POST_LEVEL_NARRATIVE), tautological test A5 dropped. 214/214 green.
  Lane B (dev-r3f-render, Amelia): swipe-pan extended to the full 4-direction cycle
  (2.0s/dir, 8s loop) with the hand deduped via SVG defs/use; edge-scroll reduced-motion
  static base frame made readable (cursor on right edge, right band lit, left band +
  chevrons 0); NarrativeScreen empty-gestureAlt guard (aria-hidden fallback), image-404
  → gesture-icon degradation chain, shared ILLUSTRATION_SLOT_STYLE const. tsc/lint/
  format green; visual self-check via verify skill both contexts, no pageerrors.
  (Amelia ×2, logged by orchestrator per serialisation rule)

- story-tutorial-visual-gestures / hand silhouettes v3 (post-merge-gate product
  feedback, Bertrand: "on ne dirait pas du tout une main" on the live preview):
  game-graphist authored new HAND_TWO_FINGER / HAND_ONE_FINGER silhouettes with the
  three missing anatomy cues (thumb lobe, scalloped folded-knuckle ridge, unequal
  leaning fingers) proven on screenshots at 240/96/64px (3 iterations);
  dev-r3f-render integrated verbatim into GestureIcon.tsx, retargeted halo/ripple/
  trail anchors to the new fingertips, all animation ids/classes preserved.
  tsc/lint/format green; in-context verify capture both mobile panels — hands read,
  anchors aligned. (Sam / game-graphist + Amelia / dev-r3f-render)

- story-tutorial-visual-gestures / hand pose v4 (Bertrand's photo reference):
  Bertrand supplied a photo of the real two-finger tap (side view, arched hand,
  fingers descending diagonally to touch the surface, curled fingers under, wrist
  exiting top-right). game-graphist redrew both HAND\_\* silhouettes in that pose
  (screenshot-proven at 240/96/64, defect sweep clean); dev-r3f-render integrated,
  retargeted tap halos (38,84)/(28,95) r8 + ripple (33,90) + swipe tip (34,87),
  re-anchored the 4 directional trails, trimmed down/up sweep travel to keep the
  low fingertip in frame. tsc/lint/format green; in-context frozen captures match
  the photo pose. (Serge / game-graphist + Amelia / dev-r3f-render)

- story-tutorial-visual-gestures / hand line-art v5 (Bertrand rejected v4 pose, then
  supplied the iStock touch-gesture reference sheet): Serge/game-graphist redrew both
  HAND\_\* as THIN uniform outline line-art (fill:none, INK stroke 2.4px, round caps/joins)
  in the iStock idiom — extended finger(s) straight up, unused fingers as curled
  knuckle-bumps, soft relaxed thumb lobe, short wrist. Neon (#ffe600) indicators are
  SEPARATE paths: 3 concentric tap-rings for the two-finger tap, a tip-circle (+optional
  direction arrow) for the swipe. Screenshot-proven at 240/96/64 on dark vs the reference
  crops (5 iterations, /tmp scratchpad). Defect sweep clean (fingers rooted, parity 2-up
  correct, thumb singular, no fused/detached parts). NOTE for render dev: this is a
  vocabulary change — set fill="none" (not BODY), drop the old interior crease detail
  paths, retarget halo/ripple/trail anchors to the new tips (below). Did NOT edit
  GestureIcon.tsx — SVG + anchors handed to dev-r3f-render. (Serge / game-graphist)

- story-tutorial-visual-gestures / hand line-art v5 INTEGRATED (PR #43): dev-r3f-render
  applied the iStock vocabulary in src/render/ui/GestureIcon.tsx. Both HAND\_\* swapped to the
  v5 outline paths (fill="none", INK stroke 2.4, round caps/joins); all interior crease/knuckle
  sub-paths deleted on both hands. Two-finger tap: single ripple → 3 concentric neon rings
  centered (55,17) r6/10/14 (2px, fill none), pulsed on the tap beat via gi-tt-ripple with
  static opacity=1 = the reduced-motion frozen frame; fingertip halos retargeted to (45,23)/
  (63,17). Swipe: 4 tip glows + 4 directional trails retargeted to the top tip (50,19), static
  neon contact ring (50,20) r7 added, and a reduced-motion-ONLY direction arrow (66,20→86,20 +
  head) revealed via a new .gi-rm-only rule in the reduced-motion media query (R-trail static
  opacity=0 so the frozen frame stays clean). Down/up sweep translates re-tuned (-2→34) to keep
  the now-top-anchored fingertip in frame. tsc/lint/format:check all green; mobile-UA/landscape
  captures (panels 2 & 3, one animated + one reduced-motion frame each) sit naturally next to the
  iStock reference. Not committed (per Bertrand). (Amelia / dev-r3f-render)

- story-tutorial-visual-gestures / thumb fold fix v7 (Bertrand on v5: "le pouce doit être
  PLIÉ, reprends la référence"): Serge/game-graphist reworked the LEFT/palm edge of both
  HAND\_\* outlines ONLY — the open side-hook thumb replaced by a FOLDED thumb per iStock
  r1c1/r1c4: a smooth rounded lobe hugging the palm front (convex outer edge from finger
  base to wrist), plus one short interior fold-crease stroke (ONE_CREASE/TWO_CREASE)
  separating the thumb lobe from the palm. Finger geometry, tips (45,23)/(63,17)/(50,19),
  fist bottom and wrist all UNCHANGED. Screenshot-proven at 240/96/64 vs reference thumb
  crops (v6 too-sharp notch → v7 smooth lobe). Render-dev note: keep the crease inside the
  animated <g> (lifts/sweeps with the hand); it is the ONLY interior stroke to add (the old
  knuckle/finger-split creases still get dropped). Did NOT edit GestureIcon.tsx.
  (Serge / game-graphist)
