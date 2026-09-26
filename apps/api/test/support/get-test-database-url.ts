export const getTestDatabaseUrl = (): string => {
  const databaseUrl = process.env.TEST_DATABASE_URL

  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for API E2E tests.')
  }

  return databaseUrl
}
