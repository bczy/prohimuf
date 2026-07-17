# Story: CRT-TV post-process on the game screen

**Story ID:** STORY-CRT-POST-PROCESS
**Type:** Render-side visual treatment (conscious documented extension — period-authentic presentation). No new verb, input, rule, or scoring change.
**PM:** John · **Date:** 2026-07-16 · **Status:** ACCEPT-with-conditions (PM gate 2026-07-16, PR #63) — 1 open item: AC6 real-GPU perf (CI-deferred)
**Origin:** Bertrand — "I would love a post process to simulate a CRT TV screen."
**Scope guard:** PROJECT_GUIDELINES §1 (cahier des charges), §4 (boundary law), §5 (loi du glow) · docs/art-direction.md §1-2
**Touches:** `src/render/effects/`, the `<Canvas>` render pipeline in `src/render/scene/App.tsx`, `src/game/systems/prefsSystem.ts` (one pref field), `src/render/ui/PauseScreen.tsx` (toggle)

## Why (product value)

The game already reads as "a free-party flyer that came alive" — photocopied xerox B&W +
acid neon, a poster not a diorama (art-direction §1). A CRT skin closes the period loop:
in 1998 this game would have been played on a CRT. A subtle tube treatment — scanlines,
gentle curvature, vignette, phosphor glow — makes the neon bloom the way it did on a real
monitor and pushes the whole frame from "web canvas" to "screen you found in a squat."
It costs the player nothing (no new input, no rule) and reinforces the strongest asset muf
has: its era. This is a look-and-feel bet; the smallest thing that validates it is the CRT
on the screen you actually stare at during play — the game scene.

## Cahier des charges test — verdict: CONSCIOUS, DOCUMENTED, JUSTIFIED EXTENSION

> "Est-ce que Prohibition Atari ST avait ça ?"

- **A CRT shader — No.** Prohibition (Atari ST, 1987) had no post-process. So per §1 this
  must be a conscious, documented, justified extension — and it is: **it reproduces the
  period-authentic presentation.** Prohibition was displayed on CRT monitors; the effect
  simulates that hardware, not a new game mechanic. It adds zero to the verb set.
- **No change** to the core loop (`Récupérer → Livrer → Éviter`), victory condition,
  inputs, scoring, enemy behaviour, timing, or the crosshair contract. Net gameplay scope
  surface is unchanged; only presentation changes.
- Justification lives in this story and (per CLAUDE.md ADR rule) in the ADR the render-
  pipeline change will carry.

## Decisions (PM rulings — fixed for this story)

### 1. Scope — game scene ONLY for the MVP (canvas), not the HTML screens

The 3D game renders in one `<Canvas flat orthographic>`; the HUD, title, menu, narrative,
pause and end screens are **HTML overlays outside the canvas** (siblings in the DOM). A true
"post process" pass can only touch what the GPU renders — i.e. the canvas.

- **MVP = CRT on the in-game scene (the `<Canvas>`) during PLAYING.** This is the screen the
  player spends the play minutes on, it is where "does a CRT make muf better?" is actually
  validated, and it is the architecturally clean home for a post-process pass (stays inside
  `src/render`, respects the boundary law).
- **HTML screens (menu/title/HUD/pause/narrative/end) are OUT of MVP scope.** Applying a
  genuine CRT warp to live HTML would mean either moving the entire UI into the canvas (a
  large refactor that breaks the HTML-overlay architecture) or an expensive/janky SVG-filter
  hack — both fail "smallest thing." A lightweight CSS scanline/vignette *skin* to unify the
  DOM screens later is a reasonable follow-up (PauseScreen already fakes CSS scanlines today),
  but it is a **different technique** and is not this story.

### 2. Toggle — YES, persisted, single boolean, default ON

- CRT post-effects are a known accessibility/comfort issue (curvature + scanlines can hurt
  readability and cause discomfort for some players) and UX §5 is non-negotiable ("jamais de
  mort bullshit" — the player must always clearly read enemies and the crosshair). So a
  toggle is required, not optional.
- **Add one pure-data field `crt: boolean` to `Prefs`** (`prefsSystem.ts`), with a default,
  parse-clamp, and persistence exactly like the existing fields (localStorage, TDD test).
  **Default ON** (deliver the intended aesthetic); OFF is the escape hatch. *(Whether default
  ships ON or OFF is the one thing the design gate may overturn — recommend ON.)*
- **Single boolean only. No intensity slider, no per-effect (scanline/curvature/aberration)
  controls** — YAGNI. Surface it as one toggle in the PauseScreen settings panel (the
  existing prefs UI), alongside the volume sliders.

### 3. Implementation route — architect's call (flagged, not prescribed)

The repo has **no** postprocessing dependency today (no `postprocessing`,
`@react-three/postprocessing`, or drei). Two routes exist: (a) add
`@react-three/postprocessing` + `postprocessing` and write a custom CRT `Effect`; (b)
hand-roll a single custom fullscreen shader pass in raw Three. Adding a dependency and/or
wrapping the render pipeline is **cross-cutting** — `senior-architect` owns the build-vs-dep
decision, the boundary-clean wiring, and the **ADR** (this changes the render contract).

## Acceptance Criteria (testable)

- **AC1 — CRT visible on the game scene.** With the effect ON, a CRT treatment is applied to
  the in-game 3D render during PLAYING, containing **at minimum scanlines + screen vignette +
  subtle barrel/curvature**. (Phosphor bloom, chromatic aberration, flicker are optional and
  art-gate's call.) Verified on screen via `/verify` with before/after screenshots.
- **AC2 — art identity survives.** `lead-art` PASSes the look against `docs/art-direction.md`
  §1-2: the fanzine B&W stays legible and — critically — the acid-neon rims still **read as
  neon** through the tube (loi du glow §5, halo falloff not destroyed). Judged on real in-game
  composite screenshots at game size.
- **AC3 — toggle persists.** A `crt` boolean pref exists in `prefsSystem.ts` (default per
  ruling #2), is surfaced as a single toggle in the PauseScreen settings, survives reload
  (localStorage), and when OFF the render is **byte-equivalent to the pre-CRT pipeline** (the
  pass is fully bypassed, not merely faded). Pref parse/default/clamp is unit-tested (TDD,
  pure `src/game`, no Three import).
- **AC4 — readability + aim preserved (UX §5).** With CRT ON, enemies, the crosshair, and
  neon rims remain clearly legible at game size, and **shots still land where the crosshair
  points** — any screen-space curvature must NOT desync the crosshair→world hit mapping (keep
  curvature subtle, or exclude the crosshair from the warp). Verified on screen; the
  crosshair/warp interaction is an explicit design + architect check.
- **AC5 — boundary law holds (§4).** The effect lives entirely in `src/render`
  (`effects/` + the composer/pass wiring); `src/game` gains only the `crt` data field (no
  Three import, no rule). Hooks remain the only bridge. The pass holds no game logic.
- **AC6 — no perf regression.** With CRT ON, the shooting phase holds its frame budget on the
  desktop target (no dropped-frame regression in the play loop). On mobile (ADR-0003) it stays
  acceptable or degrades/disables gracefully — architect/design decide the mobile policy.
  Measured, not assumed.
- **AC7 — verified + documented before done (DoD §9).** `rtk tsc` + `rtk vitest` + `rtk lint`
  clean; new pref logic unit-tested TDD-first; CRT-on and CRT-off both confirmed in-browser via
  `/verify`. An **ADR is added** (adds a dependency and/or wraps the render pipeline → render-
  contract change per CLAUDE.md ADR rule), recording the period-authentic-CRT justification.

## PM Acceptance — 2026-07-16 (PR #63) — ACCEPT-with-conditions

| AC  | Verdict                     | Evidence |
| --- | --------------------------- | -------- |
| AC1 | PASS (documented deviation) | Scanlines + vignette + neon bloom + grain + flicker on the PLAYING canvas (QA evidence 03/04/14). **Curvature consciously dropped** by the lead-art design gate to protect aim — anticipated by this story's Open Q#2 and AC4, recorded in ADR-0030 §Context. Not a defect. |
| AC2 | PASS                        | QA runtime/composite gate PASS + lead-art: fanzine B&W legible, acid-neon rims still read as neon through the tube (bloom halos, §2.1 falloff intact). Bertrand playtested twice; look retuned sharper + visible scanlines (evidence 14-15, dpr 1 & 2). |
| AC3 | PASS                        | `crt` boolean pref, default ON, persisted (localStorage), single PauseScreen toggle "ÉCRAN CATHODIQUE"; CRT-OFF byte-identical to pre-CRT pipeline (evidence 03/05-crt-off, pass unmounted); pref parse/default/clamp unit-tested (pure `src/game`). |
| AC4 | PASS                        | Crosshair on `CRT_OVERLAY_LAYER`, drawn flat above the pass, 1:1 aim at every position; curvature OUT so no spatial warp; crosshair excluded from grain/scanline/bloom softening (evidence 05-crop: crosshair sharp). |
| AC5 | PASS                        | Effect lives entirely in `src/render` (`effects/` + composite pass); `src/game` gains only the pure `crt` data field, zero Three import; hooks remain the bridge (ADR-0030 §Decision). |
| AC6 | **OPEN — CI-DEFERRED**      | Sustained real-GPU frame budget (desktop + mobile) is **not measurable under SwiftShader** in the sandbox; QA escalated to producer for the perf-on-target check (docs/agent-handoffs.md STAGE 5). This is the sole open acceptance item. |
| AC7 | PASS                        | QA quality gate PASS with evidence; ADR-0030 added (render-contract change + period-authentic justification); CRT-on and CRT-off both confirmed in-browser; no new runtime dependency. |

**Scope-OUT respected:** no CRT on HTML/menu surfaces (menus flat, evidence 02), single boolean only (no intensity/per-effect controls), no animated tube theatrics, no CRT audio, no `src/game` change beyond the `crt` field, no drei/`postprocessing` dependency. Cahier des charges: conscious/documented/justified extension (period-authentic CRT presentation) — upheld.

**Condition to close (→ full ACCEPT):** producer confirms AC6 sustained frame budget on real desktop + mobile GPU targets (no play-loop regression, or graceful mobile-lite/off). Merge is not blocked on it (CI-deferred, sandbox-unmeasurable), but the story stays ACCEPT-with-conditions until that measurement lands.

## Out of scope (explicit)

- **CRT on the HTML screens** (menu/title/HUD/pause/narrative/end) — follow-up, different
  technique (CSS/DOM skin), not this story.
- **Intensity slider / per-effect toggles** — single boolean only.
- **Animated tube theatrics** — power-on/off flash, channel-change, VHS tracking bars,
  rolling sync, degauss wobble. None in this story.
- **CRT audio** (tube hum / degauss thunk) — not this story (sound lane, separate).
- **Any `src/game` change beyond the one `crt` pref field** — no effect on hit detection,
  timing, scoring, enemy spawn/visibility rules, or the crosshair source-of-truth contract.
- **No drei kitchen-sink import** — at most the single postprocessing dep the architect
  approves for the pass.

## Open questions (for the design + architect gates — not decided by PM)

1. **Default ON or OFF?** PM recommends ON; design gate may overturn if the tuned look hurts
   readability enough to warrant opt-in.
2. **Curvature vs. crosshair aiming** — how much barrel is safe before shots feel off-target
   (AC4); design + architect own the answer (subtle warp, or crosshair excluded from the pass).
3. **Build vs. dependency, and mobile policy** — architect owns (ruling #3, AC6).
4. **Which optional effects** (phosphor bloom / chromatic aberration / flicker) earn their
   place beyond the AC1 minimum — art gate owns, judged on the composite.

---

*Pipeline: DESIGN LOOP (`game-designer` readability/feel + gate on default-ON and
crosshair-warp) → `senior-architect` (lane partition, dep-vs-handroll, ADR, mobile policy) →
render lane implements the pass + the pref/toggle → QA (`qa-lead`: pref unit tests, e2e
shooting smoke unaffected, composite visual gate for the tube look) → code-review panel →
PM acceptance (AC1-AC7 + scope-OUT respected). Devs implement only assigned, scoped lanes;
log every hand-off in `docs/agent-handoffs.md`.*
