import { fileURLToPath } from 'node:url'
import antfu from '@antfu/eslint-config'
import { includeIgnoreFile } from '@eslint/compat'
import tsParser from '@typescript-eslint/parser'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import svelteParser from 'svelte-eslint-parser'
import svelteConfig from './svelte.config.js'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

const svelteFiles = ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js']

export default antfu(
  includeIgnoreFile(gitignorePath),
  { ignores: ['**/*.md'] },
  ...svelte.configs.recommended.map(config => ({
    ...config,
    files: config.files ?? svelteFiles,
  })),
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      'no-undef': 'off',
    },
  },
  {
    files: svelteFiles,
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        projectService: true,
        extraFileExtensions: ['.svelte'],
        tsconfigRootDir: import.meta.dirname,
        svelteConfig,
      },
    },
  },
)
