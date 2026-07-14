import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import { defineConfig } from "eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default defineConfig([
  // 1. TanStack Query flat recommended configuration
  ...pluginQuery.configs["flat/recommended"],

  // 2. Global Ignores (TanStack Start & distribution build paths)
  {
    ignores: ["dist", ".tanstack/**/*", ".output/**/*", "node_modules/**/*"],
  },

  // 3. Central Application Linting Rules
  {
    // Extends structural rules for JS and TypeScript
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Necessary for TanStack Start SSR/CSR TSX components
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@tanstack/router": pluginRouter, // Formats file-based routing validation
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // TanStack Router rule integration
      ...pluginRouter.configs["flat/recommended"].rules,
    },
  },
]);
