import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerGracefulShutdown } from './register-graceful-shutdown.js'

afterEach(() => {
  process.exitCode = undefined
  vi.useRealTimers()
})

describe('registerGracefulShutdown', () => {
  it('closes Fastify and registered resources on SIGTERM', async () => {
    const app = Fastify({ logger: false })
    const closeApp = vi.spyOn(app, 'close')
    const closeResource = vi.fn().mockResolvedValue(undefined)
    const info = vi.fn()
    const error = vi.fn()

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      cleanup: [closeResource],
      logger: { info, error },
    })

    process.emit('SIGTERM')
    await vi.waitFor(() => {
      expect(closeResource).toHaveBeenCalledOnce()
    })

    expect(closeApp).toHaveBeenCalledOnce()
    expect(error).not.toHaveBeenCalled()
    expect(process.exitCode).toBeUndefined()

    unregister()
  })

  it('runs shutdown only once when multiple signals are received', async () => {
    const app = Fastify({ logger: false })
    const closeApp = vi.spyOn(app, 'close')
    const closeResource = vi.fn().mockResolvedValue(undefined)

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      cleanup: [closeResource],
      logger: { info: vi.fn(), error: vi.fn() },
    })

    process.emit('SIGTERM')
    process.emit('SIGINT')

    await vi.waitFor(() => {
      expect(closeResource).toHaveBeenCalledOnce()
    })
    expect(closeApp).toHaveBeenCalledOnce()

    unregister()
  })

  it('sets a non-zero exit code when cleanup fails', async () => {
    const app = Fastify({ logger: false })
    const failure = new Error('cleanup failed')
    const closeResource = vi.fn().mockRejectedValue(failure)
    const error = vi.fn()

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      cleanup: [closeResource],
      logger: { info: vi.fn(), error },
    })

    process.emit('SIGTERM')
    await vi.waitFor(() => {
      expect(process.exitCode).toBe(1)
    })

    expect(error).toHaveBeenCalled()

    unregister()
  })

  it('closes registered resources when Fastify close fails', async () => {
    const app = Fastify({ logger: false })
    vi.spyOn(app, 'close').mockRejectedValue(new Error('Fastify close failed'))
    const closeResource = vi.fn().mockResolvedValue(undefined)

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      cleanup: [closeResource],
      logger: { info: vi.fn(), error: vi.fn() },
    })

    process.emit('SIGTERM')
    await vi.waitFor(() => {
      expect(process.exitCode).toBe(1)
    })

    expect(closeResource).toHaveBeenCalledOnce()

    unregister()
  })

  it('forces a non-zero exit when graceful shutdown times out', async () => {
    vi.useFakeTimers()
    const pendingClose = new Promise<void>(() => {
      // Intentionally pending to exercise the shutdown deadline.
    })
    const app = {
      close: vi.fn().mockReturnValue(pendingClose),
    } as unknown as FastifyInstance
    const exitProcess = vi.fn()

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      logger: { info: vi.fn(), error: vi.fn() },
      exitProcess,
    })

    process.emit('SIGTERM')
    await vi.advanceTimersByTimeAsync(1000)

    expect(process.exitCode).toBe(1)
    expect(exitProcess).toHaveBeenCalledWith(1)

    unregister()
  })
})
