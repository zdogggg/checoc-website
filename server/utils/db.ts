import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

export { schema }

let _db: ReturnType<typeof createDb> | undefined

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set (see .env.example)')
  }
  return drizzle(postgres(url, { max: 10, onnotice: () => {} }), { schema })
}

export function useDb() {
  _db ??= createDb()
  return _db
}
