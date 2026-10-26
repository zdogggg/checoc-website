// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(prettier, {
  rules: {
    // Mock data and option payloads are still loosely typed until the API lands (Phase B)
    '@typescript-eslint/no-explicit-any': 'warn',
  },
})
