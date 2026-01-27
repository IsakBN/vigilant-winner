import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['api/**/*.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000, // API tests may be slow
    hookTimeout: 60000, // Longer timeout for setup/teardown
    sequence: {
      shuffle: false, // Run tests in order for predictable state
    },
    pool: 'forks', // Use separate processes for isolation
    poolOptions: {
      forks: {
        singleFork: true, // Run all tests in single process to share state
      },
    },
  },
})
