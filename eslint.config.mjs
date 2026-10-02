// @ts-check
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig(
  { ignores: ['dist/**', '.astro/**', '.wrangler/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  // Same house style as before: no semicolons, single quotes, 2 spaces, no
  // trailing commas.
  stylistic.configs.customize({ commaDangle: 'never', braceStyle: '1tbs' }),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    // The JSX layout rules read <style> and <script> bodies in .astro files
    // as JSX text and would split inline text runs; markup layout is left to
    // the template.
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
      // Void tags are written HTML-style (<meta …>, <img …>), which this
      // rule reads as a JSX tag missing its space before "/>".
      '@stylistic/jsx-tag-spacing': 'off'
    }
  }
)
