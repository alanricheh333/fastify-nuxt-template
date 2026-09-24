import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import type { RateLimitConfig } from './rate-limit-config.type.js'
import { RateLimitExceededError } from './rate-limit-exceeded.error.js'

export const registerRateLimit = async (
  app: FastifyInstance,
  config: RateLimitConfig,
): Promise<void> => {
  await app.register(rateLimit, {
    global: true,
    max: config.max,
    timeWindow: config.timeWindowMs,
    errorResponseBuilder: () => new RateLimitExceededError(),
  })
}
