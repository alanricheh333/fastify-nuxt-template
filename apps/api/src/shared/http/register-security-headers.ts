import helmet from '@fastify/helmet'
import type { FastifyInstance } from 'fastify'

export const registerSecurityHeaders = async (
  app: FastifyInstance,
  isProduction: boolean,
): Promise<void> => {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    strictTransportSecurity: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
        }
      : false,
  })
}
