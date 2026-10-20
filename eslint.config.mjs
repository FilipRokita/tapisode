import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

/** The layers and who may import whom. A violation fails lint, and lint runs in CI. */
const layers = {
  domain: { pattern: "src/domain/**", allow: ["domain"] },
  config: { pattern: "src/config/**", allow: ["config"] },
  db: { pattern: "src/db/**", allow: ["domain", "config", "db"] },
  lib: { pattern: "src/lib/**", allow: ["domain", "config", "db", "lib"] },
  actions: { pattern: "src/actions/**", allow: ["domain", "config", "lib", "actions"] },
  api: { pattern: "src/app/api/**", allow: ["domain", "config", "lib", "actions", "api"] },
  ui: { pattern: ["src/app/**", "src/components/**"], allow: ["domain", "config", "actions", "ui"] },
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", "src/db/migrations/**", "public/**", ".lighthouseci/**", "playwright-report/**", "test-results/**", "plans/**", "dev-only/**", ".agents/**"]),
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] } },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true, project: "./tsconfig.json" } },
      "boundaries/elements": Object.entries(layers).map(([type, { pattern }]) => ({ type, pattern })),
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: Object.entries(layers).map(([type, { allow }]) => ({ from: { element: { type } }, allow: { to: { element: { type: allow } } } })),
        },
      ],
    },
  },
  {
    // The domain is pure: no framework, no database, no auth.
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["next", "next/*", "react", "react-dom", "drizzle-orm", "drizzle-orm/*", "postgres", "better-auth", "better-auth/*", "zod"] }],
    },
  },
]);
