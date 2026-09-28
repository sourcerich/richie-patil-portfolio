// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['.wrangler/**']
}, {
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  }
})
