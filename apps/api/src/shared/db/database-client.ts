import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { getDatabaseEnv } from './database-env.js'

export const createDatabaseClient = () => {
  const env = getDatabaseEnv()

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
