import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ── Ignore build artifacts ──
  globalIgnores(['dist', 'dist_nginx', 'build', 'node_modules']),

  // ── Node.js files: server, scripts, root .js files ──
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
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser },
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // ── Config files ──
  {
    files: ['vite.config.js', 'eslint.config.js', 'prisma.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
