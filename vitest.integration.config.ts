import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// End-to-end checks against a running server and its database (see tests/integration/README.md).
// Not part of `npm test`: they need TEST_BASE_URL, DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    // One file at a time: they share the server, its rate limits and the order code sequence
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
