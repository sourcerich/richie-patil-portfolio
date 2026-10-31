// @ts-check
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig(
  { ignores: ['dist/**', '.astro/**', '.wrangler/**', 'public/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  stylistic.configs.customize({ commaDangle: 'never', braceStyle: '1tbs' }),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['**/*.astro'],
    rules: {
      '@stylistic/jsx-one-expression-per-line': 'off',
      '@stylistic/jsx-indent': 'off',
      '@stylistic/jsx-indent-props': 'off',
      '@stylistic/jsx-closing-tag-location': 'off',
      '@stylistic/jsx-closing-bracket-location': 'off',
      '@stylistic/jsx-max-props-per-line': 'off',
      '@stylistic/jsx-first-prop-new-line': 'off',
      '@stylistic/jsx-wrap-multilines': 'off',
      '@stylistic/jsx-curly-newline': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/jsx-tag-spacing': 'off'
    }
  }
)
