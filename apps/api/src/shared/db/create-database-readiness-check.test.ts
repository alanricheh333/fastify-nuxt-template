import { describe, expect, it, vi } from 'vitest'

import { createDatabaseReadinessCheck } from './create-database-readiness-check.js'
import type { Database } from './database.type.js'

describe('createDatabaseReadinessCheck', () => {
  it('returns true when the database responds', async () => {
    const execute = vi.fn().mockResolvedValue(undefined)
    const database = { execute } as unknown as Database
    const check = createDatabaseReadinessCheck(database)

    await expect(check()).resolves.toBe(true)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('propagates database errors so readiness becomes unavailable', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('database unavailable'))
    const database = { execute } as unknown as Database
    const check = createDatabaseReadinessCheck(database)

    await expect(check()).rejects.toThrow('database unavailable')
  })
})
