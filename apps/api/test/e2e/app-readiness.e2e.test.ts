import { afterAll, describe, expect, it } from 'vitest'

import { createApp } from '../../src/app.js'
import { createDatabaseReadinessCheck } from '../../src/shared/db/create-database-readiness-check.js'
import { createDatabaseClient } from '../../src/shared/db/database-client.js'
import { createReadinessState } from '../../src/shared/runtime/create-readiness-state.js'
import type { RuntimeConfig } from '../../src/shared/config/runtime-config.type.js'
import { getTestDatabaseUrl } from '../support/get-test-database-url.js'

const config: RuntimeConfig = {
  environment: 'test',
  server: {
    host: '127.0.0.1',
    port: 3001,
  },
  logging: {
    level: 'silent',
  },
  cors: {
    allowedOrigins: new Set(['http://localhost:3000']),
    allowCredentials: false,
  },
  rateLimit: {
    max: 300,
    timeWindowMs: 60_000,
  },
  database: {
    databaseUrl: getTestDatabaseUrl(),
    maxConnections: 2,
    idleTimeoutMs: 5_000,
    connectionTimeoutMs: 5_000,
    ssl: false,
  },
  shutdown: {
    timeoutMs: 10_000,
  },
}

const readinessState = createReadinessState()
const databaseClient = createDatabaseClient(config.database)

readinessState.addCheck(
  'database',
  createDatabaseReadinessCheck(databaseClient.db),
)

const app = await createApp(config, readinessState)

afterAll(async () => {
  await app.close()
  await databaseClient.close()
})

describe('application readiness', () => {
  it('reports ready through Fastify when PostgreSQL is reachable', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ready',
    })
  })
})
