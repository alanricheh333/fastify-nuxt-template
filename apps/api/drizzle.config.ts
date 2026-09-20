import 'dotenv/config'

import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run Drizzle Kit commands.')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/slices/**/*.table.ts',
    './src/shared/db/**/*.table.ts',
  ],
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})
