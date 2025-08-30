// eslint.config.js (Flat config, ESLint v9)
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import a11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import configPrettier from 'eslint-config-prettier'

export default tseslint.config([
  { ignores: ['dist', 'node_modules', 'coverage', '.vercel', '.next'] },

  // App code
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': a11y,
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      react.configs.recommended,
      reactHooks.configs['recommended-latest'],
      a11y.configs.recommended,
      reactRefresh.configs.vite,
      configPrettier,
    ],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Config/tooling files
  {
    files: [
      'vite.config.*',
      'eslint.config.js',
      'vitest.setup.*',
      '**/*.config.*',
      '**/*.scripts.*',
      '**/*.{js,cjs,mjs,cts,mts,ts}',
    ],
    ignores: ['src/**'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, configPrettier],
  },

  // Test files
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'vitest.setup.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.vitest },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      configPrettier,
    ],
  },
])
