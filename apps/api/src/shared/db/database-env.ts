export type DatabaseEnv = {
  databaseUrl: string
  maxConnections: number
  idleTimeoutMs: number
  connectionTimeoutMs: number
  ssl: boolean
}

export const getDatabaseEnv = (): DatabaseEnv => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.')
  }

  return {
    databaseUrl,
    maxConnections: parsePositiveInteger(process.env.DB_POOL_MAX, 10, 'DB_POOL_MAX'),
    idleTimeoutMs: parsePositiveInteger(process.env.DB_IDLE_TIMEOUT_MS, 30_000, 'DB_IDLE_TIMEOUT_MS'),
    connectionTimeoutMs: parsePositiveInteger(process.env.DB_CONNECTION_TIMEOUT_MS, 5_000, 'DB_CONNECTION_TIMEOUT_MS'),
    ssl: parseBoolean(process.env.DB_SSL, false, 'DB_SSL'),
  }
}

const parsePositiveInteger = (
  rawValue: string | undefined,
  fallback: number,
  name: string,
): number => {
  if (rawValue === undefined) {
    return fallback
  }

  const value = Number.parseInt(rawValue, 10)

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
