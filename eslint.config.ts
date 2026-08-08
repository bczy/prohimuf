import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",

      // BUILD_CATALOG=1 output (vite.config.ts) — a build artifact, lint-ignored like dist.
      "dist-catalog/**",

      "node_modules/**",

      // Nested git worktrees of parallel Claude sessions (already excluded from
      // git via `.git/info/exclude`, but flat-config ESLint lints dot-directories):
      // they are OTHER checkouts of this repo, outside the root tsconfig project,
      // so every file in them fails the type-aware parser and blocks `yarn lint`
      // (and therefore every commit) for reasons unrelated to the working tree.
      ".claude/worktrees/**",

      "coverage/**",

      ".yarn/**",

      "scripts/**",
      // Gemini asset generation scripts — linted separately
      "eslint.config.ts",
      // self-referential lint causes false positives
      "vite.config.ts",

      "vitest.config.ts",

      "prettier.config.ts",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.strictTypeChecked,

  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.ts", "*.tsx", "*.mjs"],
        },

        tsconfigRootDir: import.meta.dirname,
      },

      globals: { ...globals.browser, ...globals.es2022 },
    },

    rules: {
      // Downgrade deprecated API warning — tseslint.config() is still valid in v8
      "@typescript-eslint/no-deprecated": "warn",

      "@typescript-eslint/no-explicit-any": "error",

      "@typescript-eslint/no-unsafe-assignment": "error",

      "@typescript-eslint/no-unsafe-call": "error",

      "@typescript-eslint/no-unsafe-member-access": "error",

      "@typescript-eslint/no-unsafe-return": "error",

      "@typescript-eslint/explicit-module-boundary-types": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",

        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/consistent-type-imports": [
        "error",

        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },

  prettierConfig,
);
