import { sql } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'

import { createDatabaseClient } from '../../src/shared/db/database-client.js'
import { getTestDatabaseUrl } from '../support/get-test-database-url.js'

const databaseClient = createDatabaseClient({
  databaseUrl: getTestDatabaseUrl(),
  maxConnections: 2,
  idleTimeoutMs: 5_000,
  connectionTimeoutMs: 5_000,
  ssl: false,
})

afterAll(async () => {
  await databaseClient.close()
})

describe('database integration', () => {
  it('executes queries against a real PostgreSQL database', async () => {
    const result = await databaseClient.db.execute(sql`select 1 as value`)

    expect(result.rows[0]).toMatchObject({ value: 1 })
  })
})
