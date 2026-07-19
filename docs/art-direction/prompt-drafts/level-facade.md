# Prompt drafts — level `facade` layer (Maud, concept-artist)

Craft rules per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md); nothing
reaches `levelArt.json` without the `lead-art` PROMPT GATE.

## belliard — `facade` (crade-documentaire re-skin, ADR-0044 kontext)

**Why it changed.** Regenerating the Rue Belliard backdrop via the
reference-conditioned system (ADR-0044, `scripts/gen-from-reference.mjs`, family=levels)
against lead-art's BINDING guardrails logged in
`docs/handoffs/story-belliard-decor-references.md` and the curated board
`docs/references/art-culture.md` ("Décor de niveau — façade Rue Belliard"). Direction:
crade-documentaire (photocopy grain, contrasty B&W, dirty/real), ordinary working 18e
fabric, tagged rideaux de fer, an on-façade free-party flyer/stencil, Paris 1998 night.

The old prompt (`"long parisian haussmann stone apartment facade at night, front
elevation, … some windows glowing warm orange others dark with shutters, elaborate ornate
wrought iron balcony railings with scrollwork …, ground floor shops with neon signs, …"`)
broke two guardrails: it baked GLOW into the backdrop (`glowing warm orange` windows +
`ground floor shops with neon signs` — LOI DU GLOW says the PNG ships pure crade B&W ink,
neon is render-side on interactive hotspots only) and leaned Haussmann-grand
(`elaborate ornate … scrollwork`) against the ordinary-18e brief.

**Load-bearing spine kept verbatim in intent** (game + ADR-0028 window-alignment harness
depend on it): exactly 7 identical evenly spaced tall french windows per floor, 3 upper
floors, every window and floor line perfectly aligned, wrought-iron balcony railings in
front of every window, horizontally tileable seamless repeat.

**Final prompt** (93 words, zero negations):

```
flat frontal elevation of an ordinary working-class Paris 18e apartment building at night, all floor lines horizontal and parallel, plain stone wall, strict regular grid of exactly 7 identical evenly spaced tall french windows per floor across 3 upper floors, every window and floor line perfectly aligned, dark unlit glass panes and closed shutters, plain wrought-iron balcony railings in front of every window, ground-floor metal roll-down shop shutters densely layered with hand-painted tags, a stapled photocopied flyer and a spray stencil on the shutters, high-contrast grainy black-and-white photocopy ink, horizontally tileable seamless repeat
```

**Per-clause rationale**

- `flat frontal elevation … all floor lines horizontal and parallel` → Poster, not diorama
  (guardrail 2): positively forces the flat frontal window-grid geometry and denies the
  vanishing-point / perspective pull the street-photo refs would otherwise seed. No negation.
- `ordinary working-class Paris 18e apartment building` → ordinary working 18e fabric, not
  touristy central-Paris Haussmann grandeur (board D4 / art-culture); also the anachronism
  firewall's period anchor without naming a real building (guardrail 4, no Deneux likeness).
- `plain stone wall` + `plain wrought-iron balcony railings` → keeps the load-bearing railings
  in front of every window (ADR-0028) but demotes the old "elaborate ornate scrollwork" to
  plain ironwork, matching the ordinary-fabric brief.
- `strict regular grid of exactly 7 identical evenly spaced tall french windows per floor
across 3 upper floors, every window and floor line perfectly aligned` → the untouched
  structural spine the window-alignment harness (ADR-0028) and windowGrid tuning read.
- `dark unlit glass panes and closed shutters` → LOI DU GLOW (guardrail 1): replaces the
  baked "glowing warm orange" windows with inert ink windows; interactive glow is render-side.
- `ground-floor metal roll-down shop shutters densely layered with hand-painted tags` →
  the crade-documentaire core (board D1 rideaux de fer / Paris Tonkar) and the on-façade
  rave/street layer (guardrail 3) — printed/painted, never luminous.
- `a stapled photocopied flyer and a spray stencil on the shutters` → the "something is
  happening tonight" tell, scoped strictly ON the façade (board D3 / guardrail 3), as PRINT.
- `high-contrast grainy black-and-white photocopy ink` → bakes the crade B&W medium so the
  PNG ships pure ink (LOI DU GLOW / house §1); no colour, no glow token.
- `horizontally tileable seamless repeat` → load-bearing panel tiling kept verbatim.

**Rejected variants**

- Conditioning kontext on a stock street photo (Alamy 2F60CJ9 / Getty rue de Buci) —
  REJECTED: lead-art marks those mood-only (never traced/composited), and a photo ref would
  drag perspective + real-building likeness into the plane. Condition on our own committed
  flat-frontal `facade.png` instead (structure preserved, re-skinned by the prompt).
- Keeping "at night" implying lit windows — narrowed to `dark unlit glass panes` so night
  reads as ink contrast, not baked window glow.

**Intended invocation (for review — NOT run here):**

```
node scripts/gen-from-reference.mjs \
  --ref public/assets/levels/belliard/facade.png \
  --prompt "<final prompt above>" \
  --out public/assets/levels/belliard/facade.candidate.png \
  --family levels --seed 6701 --size 1024x512
```

Recommend conditioning on the existing committed `facade.png` (kontext img2img preserves
the 7×3 grid geometry ADR-0028 needs, is already flat-frontal, carries no Deneux likeness
and no stock-photo licence risk) rather than a street photo. Seed PINNED so a re-roll does
not drift the grid.
