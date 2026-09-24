import 'dotenv/config'

import { createApp } from './app.js'
import { createDatabaseClient } from './shared/db/database-client.js'
import { createDatabaseReadinessCheck } from './shared/db/create-database-readiness-check.js'
import { createReadinessState } from './shared/runtime/create-readiness-state.js'
import { registerGracefulShutdown } from './shared/runtime/register-graceful-shutdown.js'

const readinessState = createReadinessState()
const app = await createApp(readinessState)
const databaseClient = createDatabaseClient()

readinessState.addCheck(
  'database',
  createDatabaseReadinessCheck(databaseClient.db),
)

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'
const shutdownTimeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 10000)

try {
  await app.listen({ port, host })
} catch (error) {
  try {
    await app.close()
  } finally {
    await databaseClient.close()
  }

  throw error
}

registerGracefulShutdown({
  app,
  timeoutMs: shutdownTimeoutMs,
  markNotReady: readinessState.markNotReady,
  cleanup: [databaseClient.close],
})
