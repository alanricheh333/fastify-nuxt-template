import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerCors } from './register-cors.js'
import { registerErrorHandling } from './register-error-handling.js'

const createTestApp = async () => {
  const app = Fastify({ logger: false })

  registerErrorHandling(app, {})
  await registerCors(app, {
    allowedOrigins: new Set(['http://localhost:3000']),
    allowCredentials: false,
  })

  app.get('/test', () => ({ ok: true }))

  return app
}

describe('registerCors', () => {
  it('allows a configured origin', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        origin: 'http://localhost:3000',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')

    await app.close()
  })

  it('rejects an unconfigured browser origin', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        origin: 'https://untrusted.example.com',
      },
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toMatchObject({
      error: {
        code: 'CORS_ORIGIN_NOT_ALLOWED',
        message: 'The request origin is not allowed.',
      },
    })

    await app.close()
  })

  it('allows requests without an Origin header', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()

    await app.close()
  })
})
