import type { RateLimitConfig } from './rate-limit-config.type.js'

export const getRateLimitConfig = (): RateLimitConfig => ({
  max: parsePositiveInteger(process.env.RATE_LIMIT_MAX, 300, 'RATE_LIMIT_MAX'),
  timeWindowMs: parsePositiveInteger(
    process.env.RATE_LIMIT_WINDOW_MS,
    60_000,
    'RATE_LIMIT_WINDOW_MS',
  ),
})

const parsePositiveInteger = (
  rawValue: string | undefined,
  fallback: number,
  envName: string,
): number => {
  if (rawValue === undefined) {
    return fallback
  }

  const parsed = Number(rawValue)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${envName} must be a positive integer.`)
  }

  return parsed
}
