import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { registerRequestId } from './register-request-id.js'

const createTestApp = () => {
  const app = Fastify({ logger: false })
  registerRequestId(app)
  app.get('/test', (request) => ({ requestId: request.id }))
  return app
}

describe('registerRequestId', () => {
  it('returns the Fastify request id in the response header', async () => {
    const app = createTestApp()

    const response = await app.inject({ method: 'GET', url: '/test' })
    const body = response.json<{ requestId: string }>()

    expect(response.statusCode).toBe(200)
    expect(response.headers['x-request-id']).toBe(body.requestId)

    await app.close()
  })

  it('does not trust a caller supplied x-request-id header by default', async () => {
    const app = createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'x-request-id': 'caller-controlled-id',
      },
    })

    expect(response.headers['x-request-id']).not.toBe('caller-controlled-id')

    await app.close()
  })
})
