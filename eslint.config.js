import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ── Ignore build artifacts ──
  globalIgnores(['dist', 'dist_nginx', 'build', 'node_modules']),

  // ── Node.js files: server, scripts, root .js/.mjs/.cjs ──
  {
    files: ['server/**/*.js', 'scripts/**/*.js', '*.js', '*.mjs', '*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },

  // ── Browser files: src (React JSX) ──
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser },
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // ── Config files (Node env) ──
  {
    files: ['vite.config.js', 'eslint.config.js', 'prisma.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
