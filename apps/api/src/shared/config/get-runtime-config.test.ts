import { describe, expect, it } from 'vitest'

import { getRuntimeConfig } from './get-runtime-config.js'

const validEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: '3001',
  LOG_LEVEL: 'silent',
  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  CORS_ALLOW_CREDENTIALS: 'false',
  RATE_LIMIT_MAX: '300',
  RATE_LIMIT_WINDOW_MS: '60000',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/app',
  DB_POOL_MAX: '10',
  DB_IDLE_TIMEOUT_MS: '30000',
  DB_CONNECTION_TIMEOUT_MS: '5000',
  DB_SSL: 'false',
  SHUTDOWN_TIMEOUT_MS: '10000',
})

describe('getRuntimeConfig', () => {
  it('parses a valid environment into typed runtime config', () => {
    const config = getRuntimeConfig(validEnv())

    expect(config.environment).toBe('test')
    expect(config.server).toEqual({ host: '127.0.0.1', port: 3001 })
    expect(config.logging.level).toBe('silent')
    expect(config.cors.allowedOrigins.has('http://localhost:3000')).toBe(true)
    expect(config.cors.allowCredentials).toBe(false)
    expect(config.rateLimit).toEqual({ max: 300, timeWindowMs: 60000 })
    expect(config.database.maxConnections).toBe(10)
    expect(config.database.ssl).toBe(false)
    expect(config.shutdown.timeoutMs).toBe(10000)
  })

  it('uses safe defaults for optional values', () => {
    const config = getRuntimeConfig({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/app',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    })

    expect(config.environment).toBe('development')
    expect(config.server).toEqual({ host: '0.0.0.0', port: 3001 })
    expect(config.logging.level).toBe('debug')
    expect(config.rateLimit).toEqual({ max: 300, timeWindowMs: 60000 })
    expect(config.database.maxConnections).toBe(10)
    expect(config.shutdown.timeoutMs).toBe(10000)
  })

  it('fails when required configuration is missing', () => {
    const env = validEnv()
    delete env.DATABASE_URL

    expect(() => getRuntimeConfig(env)).toThrow('DATABASE_URL is required.')
  })

  it.each([
    ['PORT', '0'],
    ['RATE_LIMIT_MAX', '-1'],
    ['RATE_LIMIT_WINDOW_MS', 'nope'],
    ['DB_POOL_MAX', '1.5'],
    ['SHUTDOWN_TIMEOUT_MS', '0'],
  ])('rejects invalid positive integer %s', (name, value) => {
    const env = validEnv()
    env[name] = value

    expect(() => getRuntimeConfig(env)).toThrow(`${name} must be a positive integer.`)
  })

  it('rejects invalid booleans and environments', () => {
    expect(() =>
      getRuntimeConfig({ ...validEnv(), DB_SSL: 'yes' }),
    ).toThrow('DB_SSL must be either "true" or "false".')

    expect(() =>
      getRuntimeConfig({ ...validEnv(), NODE_ENV: 'staging' }),
    ).toThrow('NODE_ENV must be development, test, or production.')
  })

  it('rejects unsupported log levels', () => {
    expect(() =>
      getRuntimeConfig({ ...validEnv(), LOG_LEVEL: 'verbose' }),
    ).toThrow(
      'LOG_LEVEL must be fatal, error, warn, info, debug, trace, or silent.',
    )
  })
})
