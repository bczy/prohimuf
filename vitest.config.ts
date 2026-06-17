import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,

    environment: "happy-dom",

    include: ["src/game/**/*.test.ts"],

    coverage: {
      provider: "v8",

      reporter: ["text", "lcov", "html"],

      include: ["src/game/**/*.ts"],

      exclude: [
        "src/game/**/*.test.ts",
        "src/game/types/**",
        // Static data / content modules — no executable logic to cover
        "src/game/maps/**",
        "src/game/levels/**",
        "src/game/entities/**",
        "src/game/state/**",
        "src/game/systems/narrativeSystem.ts",
      ],

      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },

  resolve: {
    alias: {
      "@game": resolve(__dirname, "src/game"),
    },
  },
});
