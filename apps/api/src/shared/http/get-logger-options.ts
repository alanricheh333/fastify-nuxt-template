import type { FastifyServerOptions } from 'fastify'

type LoggerOptions = Exclude<FastifyServerOptions['logger'], boolean | undefined>

export const getLoggerOptions = (level: string): LoggerOptions => ({
  level,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers.set-cookie',
      'authorization',
      'cookie',
      'set-cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
})
