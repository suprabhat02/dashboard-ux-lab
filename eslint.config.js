// @ts-check
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Architectural boundaries (see docs/decisions/0002-implementation-boundaries.md).
 * The rule set is the contract; CI fails the build if any arrow is crossed.
 *
 *   spec/          → nothing (pure data + functions, no DOM, no frameworks)
 *   impl-react/    → spec/, react
 *   impl-vanilla/  → spec/ only
 *   lab/           → spec/ only (site chrome shared by both lab pages)
 */
/** @returns {import('eslint').Linter.RulesRecord} */
const forbid = (/** @type {string[]} */ groups, /** @type {string} */ message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: groups, message }] }],
});

export default defineConfig(
  {
    ignores: ['dist/', '.astro/', 'node_modules/', 'playwright-report/', 'test-results/'],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['tests/**'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.astro'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['src/spec/**'],
    rules: forbid(
      ['react', 'react-dom', 'react/*', '**/impl-*/**', '**/lab/**', 'astro', 'astro:*'],
      'spec/ must stay framework-free and dependency-free.',
    ),
  },
  {
    files: ['src/impl-react/**'],
    extends: [reactHooks.configs.flat.recommended],
    rules: forbid(
      ['**/impl-vanilla/**', '**/lab/**', '**/spec/i18n/all'],
      'React must not depend on the vanilla implementation or lab chrome, or bundle every catalogue (import spec/i18n/load/<locale>).',
    ),
  },
  {
    files: ['src/impl-vanilla/**'],
    rules: forbid(
      [
        'react',
        'react-dom',
        'react/*',
        '**/impl-react/**',
        '**/lab/**',
        '**/spec/i18n/all',
      ],
      'The vanilla implementation must not depend on React or the lab chrome, or bundle every catalogue.',
    ),
  },
  {
    files: ['src/lab/**'],
    rules: forbid(
      [
        'react',
        'react-dom',
        'react/*',
        '**/impl-react/**',
        '**/impl-vanilla/**',
        '**/spec/i18n/all',
      ],
      'Lab chrome talks to implementations only through spec/protocol.ts and loads one catalogue per page.',
    ),
  },
);
