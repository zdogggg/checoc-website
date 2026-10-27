import { resolve } from 'node:path'
import { count } from 'drizzle-orm'
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
    await bootstrapOwner()
  } catch (error) {
    console.error('[db] Migration failed', error)
  }
})

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
    .values({ email, name: 'Chủ quán', role: 'owner', passwordHash: await hashPassword(password) })
  console.log(`[db] Created owner account ${email}`)
}
