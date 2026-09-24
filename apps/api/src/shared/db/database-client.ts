import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import type { DatabaseEnv } from './database-env.type.js'

export const createDatabaseClient = (env: DatabaseEnv) => {
  const pool = new Pool({
    connectionString: env.databaseUrl,
    max: env.maxConnections,
    idleTimeoutMillis: env.idleTimeoutMs,
    connectionTimeoutMillis: env.connectionTimeoutMs,
    ...(env.ssl ? { ssl: true } : {}),
  })

  const db = drizzle({ client: pool })

  return {
    db,
    close: async (): Promise<void> => {
      await pool.end()
    },
  }
}
