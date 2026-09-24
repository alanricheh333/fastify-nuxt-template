import Fastify from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerGracefulShutdown } from './register-graceful-shutdown.js'

afterEach(() => {
  process.exitCode = undefined
})

describe('registerGracefulShutdown', () => {
  it('closes Fastify and registered resources on SIGTERM', async () => {
    const app = Fastify({ logger: false })
    const closeApp = vi.spyOn(app, 'close')
    const closeResource = vi.fn(async () => undefined)
    const info = vi.fn()
    const error = vi.fn()

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      cleanup: [closeResource],
      logger: { info, error },
    })

    process.emit('SIGTERM')
    await vi.waitFor(() => expect(closeResource).toHaveBeenCalledOnce())

    expect(closeApp).toHaveBeenCalledOnce()
    expect(error).not.toHaveBeenCalled()
    expect(process.exitCode).toBeUndefined()

    unregister()
  })

  it('runs shutdown only once when multiple signals are received', async () => {
    const app = Fastify({ logger: false })
    const closeApp = vi.spyOn(app, 'close')
    const closeResource = vi.fn(async () => undefined)

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      cleanup: [closeResource],
      logger: { info: vi.fn(), error: vi.fn() },
    })

    process.emit('SIGTERM')
    process.emit('SIGINT')

    await vi.waitFor(() => expect(closeResource).toHaveBeenCalledOnce())
    expect(closeApp).toHaveBeenCalledOnce()

    unregister()
  })

  it('sets a non-zero exit code when cleanup fails', async () => {
    const app = Fastify({ logger: false })
    const failure = new Error('cleanup failed')
    const closeResource = vi.fn(async () => {
      throw failure
    })
    const error = vi.fn()

    const unregister = registerGracefulShutdown({
      app,
      timeoutMs: 1000,
      cleanup: [closeResource],
      logger: { info: vi.fn(), error },
    })

    process.emit('SIGTERM')
    await vi.waitFor(() => expect(process.exitCode).toBe(1))

    expect(error).toHaveBeenCalled()

    unregister()
  })
})
