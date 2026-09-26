import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/e2e/**/*.e2e.test.ts'],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 15_000,
    testTimeout: 15_000,
  },
})
