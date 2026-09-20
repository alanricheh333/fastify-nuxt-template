export type DatabaseEnv = {
  databaseUrl: string
  maxConnections: number
  idleTimeoutMs: number
  connectionTimeoutMs: number
  ssl: boolean
}
