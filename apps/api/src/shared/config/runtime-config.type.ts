import type { DatabaseEnv } from '../db/database-env.type.js'
import type { CorsConfig } from '../http/cors-config.type.js'
import type { RateLimitConfig } from '../http/rate-limit-config.type.js'

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'

export type RuntimeConfig = {
  environment: 'development' | 'test' | 'production'
  server: {
    host: string
    port: number
  }
  logging: {
    level: LogLevel
  }
  cors: CorsConfig
  rateLimit: RateLimitConfig
  database: DatabaseEnv
  shutdown: {
    timeoutMs: number
  }
}
