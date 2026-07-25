# ADR-0068 — Lazy-load du runtime Three.js/R3F

- **Status:** Accepted
- **Date:** 2026-07-25

## Context

The Vite production build shipped a single JS chunk of **1 425 kB (408 kB gzip)**,
dominated by Three.js + @react-three/fiber (~700 kB). Both libraries were imported
statically in `App.tsx`, so they were parsed and evaluated on the very first paint —
the `TitleScreen`.

`TitleScreen` is pure HTML/CSS. It uses no Three.js primitives whatsoever. The game
phase machine is `TITLE → MENU → PLAYING`; Three.js is only needed once the player
enters `PLAYING`. Loading 700 kB of 3-D runtime before the user sees a single game
frame is pure waste.

## Decision

### D1 — `PlayingCanvas.tsx`: the single Three.js cut point

A new component `src/render/scene/PlayingCanvas.tsx` groups every Three.js / R3F
import behind one module boundary: the R3F `<Canvas>`, `<GameScene>`, and any future
3-D primitive. It carries a **default export** so `React.lazy` can consume it directly.

All Three.js/R3F imports are removed from `App.tsx`.

### D2 — `React.lazy` at the `App.tsx` call site

```tsx
const PlayingCanvas = React.lazy(() => import("./render/scene/PlayingCanvas"));
```

This replaces the former static imports of `Canvas` and `GameScene` in `App.tsx`.
The lazy boundary is at the component level, not the route level, so no router
changes are required.

### D3 — Prefetch on `MENU`

A `useEffect` in `App.tsx` fires a prefetch as soon as `appPhase === "MENU"`:

```ts
useEffect(() => {
  if (appPhase === "MENU") void import("./render/scene/PlayingCanvas");
}, [appPhase]);
```

The chunk is already in the browser cache by the time the player starts the game,
eliminating the cold-load latency on the `MENU → PLAYING` transition.

### D4 — Two-level `<Suspense>`

- **Outer** (in `App.tsx`): `<Suspense fallback={<LoadingScreen …>}>` wraps
  `PlayingCanvas`. Shown only on a genuine cache miss (first PLAYING on a cold load).
- **Inner** (in `PlayingCanvas.tsx`): `<Suspense fallback={null}>` is preserved for
  the R3F streaming / asset-suspension contract — this was already present before
  this ADR and is unchanged in semantics.

### D5 — `manualChunks` in `vite.config.ts` (game build only)

Three stable vendor chunks are declared:

| Chunk key       | Modules                                        |
| --------------- | ---------------------------------------------- |
| `vendor-three`  | `three`                                        |
| `vendor-r3f`    | `@react-three/fiber`      |
| `vendor-react`  | `react`, `react-dom`, `scheduler`              |

These chunks change only when the corresponding library version changes, enabling
long-term HTTP caching per stability tier. The split is applied in the `game` build
config only — the harness build is unaffected.

## Consequences

**Positive**

- Initial JS payload drops from ~408 kB gzip to **~80 kB gzip** — a ~5× reduction
  on first paint.
- Three.js is loaded on demand; users who navigate away before playing never pay
  the 3-D cost.
- Long-term cache efficiency: a Three.js patch release invalidates `vendor-three`
  only, not the full bundle.

**Negative / trade-offs**

- A genuine cold load of `PLAYING` (no prefetch hit) incurs a waterfall: the
  `PlayingCanvas` chunk must download, parse, and hydrate before the canvas
  appears. The outer `<LoadingScreen>` covers this gap, and the D3 prefetch
  eliminates it for any user who spends time in `MENU`.
- `PlayingCanvas.tsx` is a **maintained boundary**: every future Three.js or R3F
  import must live inside it (or in modules it imports), never directly in
  `App.tsx`. Violating this collapses the lazy boundary silently — the chunk just
  merges back into the main bundle without a build error.

## Alternatives rejected

**Lazy-loading `EndScreen`, `NameEntryScreen`, `NarrativeScreen` as well**
Each is < 5 kB; the complexity of three additional lazy boundaries and Suspense
wrappers outweighs the gain. Rejected.

**Lazy-loading `GameScene` directly (without `PlayingCanvas`)**
`Canvas` itself is exported from `@react-three/fiber`. Keeping `Canvas` in a static
import while lazy-loading `GameScene` achieves nothing — the R3F bundle would still
be in the main chunk. Both must move together. `PlayingCanvas` is the minimal
wrapper that makes this possible as a single lazy boundary. Rejected.
