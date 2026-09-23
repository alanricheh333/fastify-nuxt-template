import type { CorsConfig } from './cors-config.type.js'

export const getCorsConfig = (): CorsConfig => {
  const allowedOrigins = new Set(
    (process.env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )

  if (allowedOrigins.size === 0) {
    throw new Error('CORS_ALLOWED_ORIGINS must contain at least one trusted origin.')
  }

  return {
    allowedOrigins,
    allowCredentials: parseBoolean(process.env.CORS_ALLOW_CREDENTIALS, false),
  }
}

const parseBoolean = (
  rawValue: string | undefined,
  fallback: boolean,
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

  throw new Error('CORS_ALLOW_CREDENTIALS must be either "true" or "false".')
}
