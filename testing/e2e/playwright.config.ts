import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration for BundleNudge
 *
 * Environment variables:
 * - DASHBOARD_URL: Base URL for the app dashboard (default: http://localhost:3001)
 * - E2E_TEST_EMAIL: Test user email for authenticated flows
 * - E2E_TEST_PASSWORD: Test user password for authenticated flows
 */

const dashboardURL = process.env.DASHBOARD_URL ?? 'http://localhost:3001'
const isCI = !!process.env.CI
const isRemote = !dashboardURL.includes('localhost')

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: dashboardURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Only start local server if not testing against remote URL */
  ...(!isRemote && {
    webServer: {
      command: 'pnpm --filter @bundlenudge/app-dashboard dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !isCI,
      timeout: 120000,
      cwd: '../..',
    },
  }),

  /* Global timeout settings */
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  outputDir: 'test-results/',
})
