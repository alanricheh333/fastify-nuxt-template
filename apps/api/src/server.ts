import 'dotenv/config'

import { createApp } from './app.js'
import { getRuntimeConfig } from './shared/config/get-runtime-config.js'
import { createDatabaseClient } from './shared/db/database-client.js'
import { createDatabaseReadinessCheck } from './shared/db/create-database-readiness-check.js'
import { createReadinessState } from './shared/runtime/create-readiness-state.js'
import { registerGracefulShutdown } from './shared/runtime/register-graceful-shutdown.js'

const config = getRuntimeConfig()
const readinessState = createReadinessState()
const databaseClient = createDatabaseClient(config.database)
const app = await createApp(config, readinessState)

readinessState.addCheck(
  'database',
  createDatabaseReadinessCheck(databaseClient.db),
)

try {
  await app.listen({
    port: config.server.port,
    host: config.server.host,
  })
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
  timeoutMs: config.shutdown.timeoutMs,
  markNotReady: readinessState.markNotReady,
  cleanup: [databaseClient.close],
})
