import type { RuntimeConfig } from './runtime-config.type.js'

export const getRuntimeConfig = (
  env: NodeJS.ProcessEnv = process.env,
): RuntimeConfig => {
  const environment = parseEnvironment(env.NODE_ENV)

  return {
    environment,
    server: {
      host: env.HOST ?? '0.0.0.0',
      port: parsePositiveInteger(env.PORT, 3001, 'PORT'),
    },
    logging: {
      level: parseLogLevel(
        env.LOG_LEVEL,
        environment === 'production' ? 'info' : 'debug',
      ),
    },
    cors: {
      allowedOrigins: parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS),
      allowCredentials: parseBoolean(
        env.CORS_ALLOW_CREDENTIALS,
        false,
        'CORS_ALLOW_CREDENTIALS',
      ),
    },
    rateLimit: {
      max: parsePositiveInteger(env.RATE_LIMIT_MAX, 300, 'RATE_LIMIT_MAX'),
      timeWindowMs: parsePositiveInteger(
        env.RATE_LIMIT_WINDOW_MS,
        60_000,
        'RATE_LIMIT_WINDOW_MS',
      ),
    },
    database: {
      databaseUrl: requireValue(env.DATABASE_URL, 'DATABASE_URL'),
      maxConnections: parsePositiveInteger(env.DB_POOL_MAX, 10, 'DB_POOL_MAX'),
      idleTimeoutMs: parsePositiveInteger(
        env.DB_IDLE_TIMEOUT_MS,
        30_000,
        'DB_IDLE_TIMEOUT_MS',
      ),
      connectionTimeoutMs: parsePositiveInteger(
        env.DB_CONNECTION_TIMEOUT_MS,
        5_000,
        'DB_CONNECTION_TIMEOUT_MS',
      ),
      ssl: parseBoolean(env.DB_SSL, false, 'DB_SSL'),
    },
    shutdown: {
      timeoutMs: parsePositiveInteger(
        env.SHUTDOWN_TIMEOUT_MS,
        10_000,
        'SHUTDOWN_TIMEOUT_MS',
      ),
    },
  }
}

const parseEnvironment = (
  rawValue: string | undefined,
): RuntimeConfig['environment'] => {
  const value = rawValue ?? 'development'

  if (value === 'development' || value === 'test' || value === 'production') {
    return value
  }

  throw new Error('NODE_ENV must be development, test, or production.')
}

const parseLogLevel = (
  rawValue: string | undefined,
  fallback: RuntimeConfig['logging']['level'],
): RuntimeConfig['logging']['level'] => {
  const value = rawValue ?? fallback

  if (
    value === 'fatal'
    || value === 'error'
    || value === 'warn'
    || value === 'info'
    || value === 'debug'
    || value === 'trace'
    || value === 'silent'
  ) {
    return value
  }

  throw new Error(
    'LOG_LEVEL must be fatal, error, warn, info, debug, trace, or silent.',
  )
}

const parseAllowedOrigins = (rawValue: string | undefined): ReadonlySet<string> => {
  const allowedOrigins = new Set(
    (rawValue ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )

  if (allowedOrigins.size === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS must contain at least one trusted origin.')
  }

  return allowedOrigins
}

const requireValue = (rawValue: string | undefined, name: string): string => {
  if (!rawValue) {
    throw new Error(`${name} is required.`)
  }

  return rawValue
}

const parsePositiveInteger = (
  rawValue: string | undefined,
  fallback: number,
  name: string,
): number => {
  if (rawValue === undefined) {
    return fallback
  }

  const value = Number(rawValue)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return value
}

const parseBoolean = (
  rawValue: string | undefined,
  fallback: boolean,
  name: string,
): boolean => {
  if (rawValue === undefined) {
    return fallback
  }

  if (rawValue === 'true') {
    return true
  }

  if (rawValue === 'false') {
    return false
  }

  throw new Error(`${name} must be either "true" or "false".`)
}
