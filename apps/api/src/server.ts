import 'dotenv/config'

import { createApp } from './app.js'
import { registerGracefulShutdown } from './shared/runtime/register-graceful-shutdown.js'

const app = await createApp()

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'
const shutdownTimeoutMs = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 10000)

registerGracefulShutdown({
  app,
  timeoutMs: shutdownTimeoutMs,
})

await app.listen({ port, host })
