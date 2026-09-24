import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerErrorHandling } from './register-error-handling.js'
import { registerRateLimit } from './register-rate-limit.js'

const createTestApp = async () => {
  const app = Fastify({ logger: false })

  registerErrorHandling(app, {})
  await registerRateLimit(app, {
    max: 2,
    timeWindowMs: 60_000,
  })

  app.get('/limited', () => ({ ok: true }))
  app.get(
    '/health',
    {
      config: {
        rateLimit: false,
      },
    },
    () => ({ status: 'ok' }),
  )

  return app
}

describe('registerRateLimit', () => {
  it('returns the centralized error shape when the global limit is exceeded', async () => {
    const app = await createTestApp()

    await app.inject({ method: 'GET', url: '/limited' })
    await app.inject({ method: 'GET', url: '/limited' })

    const response = await app.inject({ method: 'GET', url: '/limited' })

    expect(response.statusCode).toBe(429)
    expect(response.json()).toMatchObject({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    })
    expect(response.json().error.requestId).toBeTypeOf('string')

    await app.close()
  })

  it('does not rate limit the health endpoint', async () => {
    const app = await createTestApp()

    for (let request = 0; request < 5; request += 1) {
      const response = await app.inject({ method: 'GET', url: '/health' })
      expect(response.statusCode).toBe(200)
    }

    await app.close()
  })
})
