import type { FastifyServerOptions } from 'fastify'

type LoggerOptions = Exclude<FastifyServerOptions['logger'], boolean | undefined>

export const getLoggerOptions = (): LoggerOptions => ({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
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
