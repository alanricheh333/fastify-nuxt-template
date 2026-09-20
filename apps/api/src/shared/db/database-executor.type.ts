import type { DatabaseTransaction } from './database-transaction.type.js'
import type { Database } from './database.type.js'

export type DatabaseExecutor = Database | DatabaseTransaction
