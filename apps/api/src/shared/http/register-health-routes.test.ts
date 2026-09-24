import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { createReadinessState } from '../runtime/create-readiness-state.js'
import { registerHealthRoutes } from './register-health-routes.js'

describe('registerHealthRoutes', () => {
  it('reports liveness while the process is running', async () => {
    const app = Fastify({ logger: false })
    registerHealthRoutes(app, createReadinessState())

    const response = await app.inject({ method: 'GET', url: '/health/live' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })

    await app.close()
  })

  it('reports ready when all readiness checks pass', async () => {
    const app = Fastify({ logger: false })
    const readinessState = createReadinessState()
    readinessState.addCheck('database', async () => true)
    registerHealthRoutes(app, readinessState)

    const response = await app.inject({ method: 'GET', url: '/health/ready' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ready' })

    await app.close()
  })

  it('reports not ready when a dependency check fails', async () => {
    const app = Fastify({ logger: false })
    const readinessState = createReadinessState()
    readinessState.addCheck('database', async () => false)
    registerHealthRoutes(app, readinessState)

    const response = await app.inject({ method: 'GET', url: '/health/ready' })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toEqual({
      status: 'not_ready',
      failedChecks: ['database'],
    })

    await app.close()
  })

  it('reports not ready once shutdown begins', async () => {
    const app = Fastify({ logger: false })
    const readinessState = createReadinessState()
    readinessState.markNotReady()
    registerHealthRoutes(app, readinessState)

    const response = await app.inject({ method: 'GET', url: '/health/ready' })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toEqual({
      status: 'not_ready',
      failedChecks: ['shutdown'],
    })

    await app.close()
  })
})
