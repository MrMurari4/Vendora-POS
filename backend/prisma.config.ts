import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // We use ts-node to execute the TypeScript seed file
    seed: 'npx ts-node --transpile-only -r dotenv/config src/prisma/seed.ts',
  },
})