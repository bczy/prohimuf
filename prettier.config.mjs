/**
 * Prettier config as ESM, not TypeScript.
 *
 * `prettier.config.ts` needs a TS loader to be read, and that loader only resolves in the
 * MAIN checkout: every git worktree symlinks `node_modules` at the main repo, so loading a
 * .ts config from the worktree root fails with "Unknown file extension .ts". The practical
 * effect was that the pre-commit hook died in EVERY worktree (verified 2026-08-06 on both
 * prohimuf-photo and the pre-existing prohimuf-motifs) — which is how unformatted and even
 * syntactically broken files reached commits during worktree sessions.
 *
 * The config is pure literals, so the type annotation bought nothing that a JSDoc type
 * doesn't; ESM needs no loader anywhere.
 *
 * @type {import("prettier").Config}
 */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};
