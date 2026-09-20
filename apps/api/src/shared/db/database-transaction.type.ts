import type { Database } from './database.type.js'

export type DatabaseTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0]
