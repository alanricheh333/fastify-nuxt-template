import type { FastifyInstance } from 'fastify'
import { Type } from '@fastify/type-provider-typebox'
import type { ReadinessState } from '../runtime/readiness-state.type.js'

export const registerHealthRoutes = (
  app: FastifyInstance,
  readinessState: ReadinessState,
): void => {
  app.get(
    '/health/live',
    {
      config: {
        rateLimit: false,
      },
      schema: {
        tags: ['System'],
        summary: 'Liveness check',
        description: 'Returns whether the API process is alive.',
        response: {
          200: Type.Object({
            status: Type.Literal('ok'),
          }),
        },
      },
    },
    () => ({ status: 'ok' as const }),
  )

  app.get(
    '/health/ready',
    {
      config: {
        rateLimit: false,
      },
      schema: {
        tags: ['System'],
        summary: 'Readiness check',
        description: 'Returns whether the API instance is ready to receive traffic.',
        response: {
          200: Type.Object({
            status: Type.Literal('ready'),
          }),
          503: Type.Object({
            status: Type.Literal('not_ready'),
            failedChecks: Type.Array(Type.String()),
          }),
        },
      },
    },
    async (_request, reply) => {
      const result = await readinessState.check()

      if (!result.ready) {
        return reply.status(503).send({
          status: 'not_ready' as const,
          failedChecks: result.failedChecks,
        })
      }

      return { status: 'ready' as const }
    },
  )
}
