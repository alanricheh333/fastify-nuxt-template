import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerSecurityHeaders } from './register-security-headers.js'

const createTestApp = async (isProduction: boolean) => {
  const app = Fastify({ logger: false })

  await registerSecurityHeaders(app, isProduction)
  app.get('/test', () => ({ ok: true }))

  return app
}

describe('registerSecurityHeaders', () => {
  it('adds standard security headers without a global CSP', async () => {
    const app = await createTestApp(false)

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['referrer-policy']).toBeDefined()
    expect(response.headers['content-security-policy']).toBeUndefined()
    expect(response.headers['strict-transport-security']).toBeUndefined()

    await app.close()
  })

  it('enables HSTS in production', async () => {
    const app = await createTestApp(true)

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000')

    await app.close()
  })
})
