# Dev Guidelines — muf

## Core Principles

**TDD** — Write tests before writing system functions. Every function in `src/game/systems/` has a corresponding test in `__tests__/`.

**YAGNI** — Don't add features that aren't immediately needed. No speculative abstractions, no future-proofing hooks.

**DRY** — Don't repeat logic. Extract only when 3+ concrete use cases exist.

---

## Game Logic / Render Separation

The `src/game/` directory must have zero imports from React, Three.js, or R3F. This is enforced by convention and verified by tests running in a plain Node environment.

```
src/game/      ← pure TypeScript, no DOM, no React
src/hooks/     ← bridge: reads game state, drives R3F frame loop
src/render/    ← R3F + HTML components only
```

---

## State Immutability

All game state types use `readonly`. System functions return new state objects; they never mutate inputs.

```ts
// CORRECT
return { ...state, score: state.score + 1 };

// WRONG
state.score += 1;
return state;
```

---

## Testing

```bash
yarn test          # run all tests (watch mode)
yarn test --run    # run once, CI mode
```

Tests live in `src/game/systems/__tests__/`. Each system file has a corresponding test file. Tests import system functions directly — no mocking of game logic.

---

## TypeScript

Strict mode is on. No `any`, no `!` non-null assertions unless absolutely unavoidable (prefer null guards or `??`). ESLint enforces `no-non-null-assertion` and `no-confusing-void-expression`.

---

## Async in useEffect

When loading async resources in `useEffect`, use the inner-async-function pattern:

```ts
useEffect(() => {
  async function load() {
    try {
      const result = await fetchSomething();
      setState(result);
    } catch (e) {
      console.error(e);
    }
  }
  void load();
}, []);
```

Never `return` a Promise from a `useEffect` callback.

---

## Asset Generation

Run `node scripts/generate-assets.mjs` to generate missing sprites. Never commit generated assets unless they are final and approved. The `BASE_STYLE` constant in the script defines the visual identity — do not change it without design review.

---

## Commits

Follow conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

---

## Spawning Teams

When a task requires significant architectural decisions or spans multiple systems, use the BMAD methodology:

- **DP** — Document Project (update docs)
- **CP** — Create PRD
- **CA** — Create Architecture
- **CE** — Create Epics/Stories
- **SP** — Sprint Planning

See `.claude/skills/` for available skills.
