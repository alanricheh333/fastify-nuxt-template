import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { ApplicationError } from '../errors/application-error.js'
import { registerErrorHandling } from './register-error-handling.js'

class TestConflictError extends ApplicationError {
  constructor() {
    super({
      code: 'TEST_CONFLICT',
      message: 'The test resource conflicts.',
    })
  }
}

describe('registerErrorHandling', () => {
  it('maps a registered application error to its HTTP status', async () => {
    const app = Fastify({ logger: false })
    registerErrorHandling(app, { TEST_CONFLICT: 409 })

    app.get('/test', async () => {
      throw new TestConflictError()
    })

    const response = await app.inject({ method: 'GET', url: '/test' })
    const body = response.json()

    expect(response.statusCode).toBe(409)
    expect(body.error.code).toBe('TEST_CONFLICT')
    expect(body.error.message).toBe('The test resource conflicts.')
    expect(body.error.requestId).toEqual(expect.any(String))
  })

  it('sanitizes unmapped application errors as internal errors', async () => {
    const app = Fastify({ logger: false })
    registerErrorHandling(app, {})

    app.get('/test', async () => {
      throw new TestConflictError()
    })

    const response = await app.inject({ method: 'GET', url: '/test' })
    const body = response.json()

    expect(response.statusCode).toBe(500)
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(body.error.message).toBe('An unexpected error occurred.')
    expect(body.error.message).not.toContain('conflict')
  })

  it('sanitizes unexpected errors', async () => {
    const app = Fastify({ logger: false })
    registerErrorHandling(app, {})

    app.get('/test', async () => {
      throw new Error('database password leaked here')
    })

    const response = await app.inject({ method: 'GET', url: '/test' })
    const body = response.json()

    expect(response.statusCode).toBe(500)
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(JSON.stringify(body)).not.toContain('database password leaked here')
  })

  it('returns the shared contract for unknown routes', async () => {
    const app = Fastify({ logger: false })
    registerErrorHandling(app, {})

    const response = await app.inject({ method: 'GET', url: '/missing' })
    const body = response.json()

    expect(response.statusCode).toBe(404)
    expect(body.error.code).toBe('ROUTE_NOT_FOUND')
    expect(body.error.requestId).toEqual(expect.any(String))
  })
})
