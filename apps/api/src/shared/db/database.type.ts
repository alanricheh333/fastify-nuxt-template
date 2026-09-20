import type { createDatabaseClient } from './database-client.js'

export type Database = ReturnType<typeof createDatabaseClient>['db']
