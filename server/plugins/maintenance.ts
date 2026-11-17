// Runs housekeeping (points expiry, pruning old login codes and audit entries) shortly after
// boot, then every 6 hours. Failures are logged and retried at the next run.
const EVERY_MS = 6 * 60 * 60 * 1000
const FIRST_RUN_MS = 2 * 60 * 1000

export default defineNitroPlugin((nitro) => {
  if (!process.env.DATABASE_URL || process.env.VITEST) return
  const run = () => runMaintenance().catch((error) => console.error('[maintenance] failed', error))
  const first = setTimeout(run, FIRST_RUN_MS)
  const timer = setInterval(run, EVERY_MS)
  nitro.hooks.hook('close', () => {
    clearTimeout(first)
    clearInterval(timer)
  })
})
