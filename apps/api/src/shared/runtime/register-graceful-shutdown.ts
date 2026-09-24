import type { FastifyBaseLogger, FastifyInstance } from 'fastify'

type ShutdownSignal = 'SIGINT' | 'SIGTERM'

type RegisterGracefulShutdownOptions = {
  app: FastifyInstance
  timeoutMs: number
  cleanup?: ReadonlyArray<() => Promise<void>>
  logger?: Pick<FastifyBaseLogger, 'info' | 'error'>
}

export const registerGracefulShutdown = ({
  app,
  timeoutMs,
  cleanup = [],
  logger = app.log,
}: RegisterGracefulShutdownOptions): (() => void) => {
  let shutdownPromise: Promise<void> | undefined

  const shutdown = (signal: ShutdownSignal): Promise<void> => {
    shutdownPromise ??= performShutdown(signal)
    return shutdownPromise
  }

  const onSigterm = (): void => {
    void shutdown('SIGTERM')
  }

  const onSigint = (): void => {
    void shutdown('SIGINT')
  }

  process.once('SIGTERM', onSigterm)
  process.once('SIGINT', onSigint)

  async function performShutdown(signal: ShutdownSignal): Promise<void> {
    logger.info({ signal }, 'Graceful shutdown started.')

    const timeout = setTimeout(() => {
      logger.error({ signal, timeoutMs }, 'Graceful shutdown timed out.')
      process.exitCode = 1
    }, timeoutMs)
    timeout.unref()

    try {
      await app.close()

      for (const closeResource of cleanup) {
        await closeResource()
      }

      logger.info({ signal }, 'Graceful shutdown completed.')
    } catch (error) {
      process.exitCode = 1
      logger.error({ err: error, signal }, 'Graceful shutdown failed.')
    } finally {
      clearTimeout(timeout)
    }
  }

  return () => {
    process.removeListener('SIGTERM', onSigterm)
    process.removeListener('SIGINT', onSigint)
  }
}
