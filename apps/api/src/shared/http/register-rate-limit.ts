import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import type { RateLimitConfig } from './rate-limit-config.type.js'

export const registerRateLimit = async (
  app: FastifyInstance,
  config: RateLimitConfig,
): Promise<void> => {
  await app.register(rateLimit, {
    global: true,
    max: config.max,
    timeWindow: config.timeWindowMs,
    errorResponseBuilder: (request) => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        requestId: request.id,
      },
    }),
  })
}
