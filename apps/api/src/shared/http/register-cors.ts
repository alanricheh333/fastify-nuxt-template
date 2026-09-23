import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import type { CorsConfig } from './cors-config.type.js'
import { CorsOriginNotAllowedError } from './cors-origin-not-allowed.error.js'

export const registerCors = async (
  app: FastifyInstance,
  config: CorsConfig,
): Promise<void> => {
  await app.register(cors, {
    origin: (origin, callback) => {
      if (origin === undefined || config.allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new CorsOriginNotAllowedError(), false)
    },
    credentials: config.allowCredentials,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
}
