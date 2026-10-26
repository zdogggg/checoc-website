import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

// Apply pending migrations when the server boots, so a fresh container
// (dev or prod) always has an up-to-date schema.
export default defineNitroPlugin(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL not set, skipping migrations')
    return
  }
  try {
    await migrate(useDb(), { migrationsFolder: resolve(process.cwd(), 'server/db/migrations') })
  } catch (error) {
    console.error('[db] Migration failed', error)
  }
})
