import { sql } from 'drizzle-orm'

import type { Database } from './database.type.js'

export const createDatabaseReadinessCheck = (
  database: Database,
): (() => Promise<boolean>) => {
  return async () => {
    await database.execute(sql`select 1`)
    return true
  }
}
