import type { Config } from "jest";

/**
 * Jest for the backoffice's utility layer (ticket FE-019).
 *
 * Scope is deliberate: these are the pure functions in `lib/` — the error
 * translator, the token store, the formatters, the lifecycle table. They
 * are the code most likely to break silently, because a wrong result
 * shows up as odd wording or a missing option rather than a crash.
 *
 * React components are not tested here. They are covered end-to-end
 * against a running API with Playwright, which exercises the real
 * browser rather than a simulated DOM — see TESTING.md.
 */
const config: Config = {
  // jsdom, not node: the token helpers read `window.localStorage`, and
  // their whole point is surviving a storage that misbehaves.
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: { jsx: "react-jsx", esModuleInterop: true } },
    ],
  },

  // Mirror the `@/*` alias from tsconfig.json so imports read the same
  // in tests as in application code.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],

  collectCoverageFrom: [
    "lib/**/*.ts",
    // Excluded: a two-line constants module with no logic to get wrong.
    "!lib/api.ts",
  ],
};

export default config;
