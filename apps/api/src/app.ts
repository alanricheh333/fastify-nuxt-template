import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { Type, TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { applicationErrorHttpMap } from './application-error-http-map.js'
import { apiErrorSchema } from './shared/http/api-error.schema.js'
import { registerErrorHandling } from './shared/http/register-error-handling.js'

export const createApp = async () => {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>()

  registerErrorHandling(app, applicationErrorHttpMap)

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Application API',
        description: 'HTTP API for the application.',
        version: '0.1.0',
      },
      components: {
        schemas: {
          ApiError: apiErrorSchema,
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  app.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns whether the API process is running.',
        response: {
          200: Type.Object({
            status: Type.Literal('ok'),
          }),
        },
      },
    },
    async () => ({ status: 'ok' as const }),
  )

  return app
}
