import 'dotenv/config'

import { createApp } from './app.js'
import { createReadinessState } from './shared/runtime/create-readiness-state.js'
import { registerGracefulShutdown } from './shared/runtime/register-graceful-shutdown.js'

const readinessState = createReadinessState()
const app = await createApp(readinessState)

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'
const shutdownTimeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 10000)

registerGracefulShutdown({
  app,
  timeoutMs: shutdownTimeoutMs,
  markNotReady: readinessState.markNotReady,
})

await app.listen({ port, host })
