import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { applicationErrorHttpMap } from './application-error-http-map.js'
import { apiErrorSchema } from './shared/http/api-error.schema.js'
import { getCorsConfig } from './shared/http/get-cors-config.js'
import { getLoggerOptions } from './shared/http/get-logger-options.js'
import { getRateLimitConfig } from './shared/http/get-rate-limit-config.js'
import { registerCors } from './shared/http/register-cors.js'
import { registerErrorHandling } from './shared/http/register-error-handling.js'
import { registerHealthRoutes } from './shared/http/register-health-routes.js'
import { registerRateLimit } from './shared/http/register-rate-limit.js'
import { registerRequestId } from './shared/http/register-request-id.js'
import { registerSecurityHeaders } from './shared/http/register-security-headers.js'
import { createReadinessState } from './shared/runtime/create-readiness-state.js'
import type { ReadinessState } from './shared/runtime/readiness-state.type.js'

export const createApp = async (
  readinessState: ReadinessState = createReadinessState(),
) => {
  const app = Fastify({
    logger: getLoggerOptions(),
  }).withTypeProvider<TypeBoxTypeProvider>()

  registerRequestId(app)
  registerErrorHandling(app, applicationErrorHttpMap)
  await registerCors(app, getCorsConfig())
  await registerSecurityHeaders(app, process.env.NODE_ENV === 'production')
  await registerRateLimit(app, getRateLimitConfig())

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

  registerHealthRoutes(app, readinessState)

  return app
}
