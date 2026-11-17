import { resolve } from 'node:path'
import { count, sql } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

// Apply pending migrations when the server boots, so a fresh container
// (dev or prod) always has an up-to-date schema.
export default defineNitroPlugin(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL not set, skipping migrations')
    return
  }
  const migrationsFolder = resolve(process.cwd(), 'server/db/migrations')
  try {
    await migrate(useDb(), { migrationsFolder })
    await warnOnEditedMigrations(migrationsFolder)
    await bootstrapOwner()
  } catch (error) {
    console.error('[db] Migration failed', error)
    // Never serve on an outdated schema: the process exits, Docker restarts it and the
    // failure shows in the logs and the healthcheck instead of as random 500s.
    // In dev the server keeps running so the error can be fixed without a restart loop.
    if (!import.meta.dev) process.exit(1)
  }
})

// Drizzle only runs migrations newer than the last applied one and never compares contents, so
// a migration edited after it ran somewhere is silently skipped there. Say so in the log: the
// fix is a new migration, not an edit.
async function warnOnEditedMigrations(migrationsFolder: string) {
  try {
    const applied = await useDb().execute<{ hash: string; created_at: string }>(
      sql`select hash, created_at from drizzle.__drizzle_migrations`
    )
    const byTime = new Map(applied.map((r) => [Number(r.created_at), r.hash]))
    const edited = readMigrationFiles({ migrationsFolder }).filter(
      (m) => byTime.has(m.folderMillis) && byTime.get(m.folderMillis) !== m.hash
    )
    if (edited.length) {
      console.warn(
        `[db] ${edited.length} migration(s) changed after being applied here (created at ${edited.map((m) => m.folderMillis).join(', ')}).` +
          ' The changes were NOT applied to this database; put them in a new migration instead.'
      )
    }
  } catch (error) {
    console.warn('[db] Could not check applied migrations', (error as Error).message)
  }
}

// The production image has no seed script, so the first owner is created here: only when
// there is no account at all. Further accounts are managed in /admin/users.
async function bootstrapOwner() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) return
  const [existing] = await useDb().select({ n: count() }).from(schema.users)
  if (existing!.n > 0) return
  await useDb()
    .insert(schema.users)
    .values({ email, name: 'Chủ quán', role: 'owner', passwordHash: await hashStaffPassword(password) })
  console.log(`[db] Created owner account ${email}`)
}
