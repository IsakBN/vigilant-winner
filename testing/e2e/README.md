# BundleNudge E2E Tests

End-to-end tests for BundleNudge App Dashboard using Playwright.

## Test Scenarios

| Test File | Description |
|-----------|-------------|
| `smoke.spec.ts` | Basic page rendering, no auth required |
| `auth.spec.ts` | Login/logout flows, dashboard navigation |
| `app-management.spec.ts` | Create, view, delete apps |
| `api-keys.spec.ts` | API key generation and management |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DASHBOARD_URL` | No | Base URL (default: `http://localhost:3001`) |
| `E2E_TEST_EMAIL` | For auth tests | Test account email |
| `E2E_TEST_PASSWORD` | For auth tests | Test account password |

## Running Tests

### Local Development

```bash
cd testing/e2e

# Install dependencies
pnpm install

# Install browser
pnpm exec playwright install chromium

# Run all tests (starts dev server automatically)
pnpm test

# Run with visible browser
pnpm test:headed

# Run specific test suite
pnpm test:auth
pnpm test:apps
pnpm test:api-keys

# Debug mode
pnpm test:debug
```

### Against Staging/Production

```bash
DASHBOARD_URL=https://app.bundlenudge.com \
E2E_TEST_EMAIL=test@example.com \
E2E_TEST_PASSWORD=secret \
pnpm test
```

## Test Structure

```
testing/e2e/
├── playwright.config.ts      # Playwright configuration
├── package.json              # Dependencies
├── tests/
│   ├── smoke.spec.ts         # Smoke tests (no auth)
│   ├── auth.spec.ts          # Authentication flows
│   ├── app-management.spec.ts # App CRUD operations
│   └── api-keys.spec.ts      # API key management
└── README.md
```

## Configuration

The Playwright config supports:

- **Configurable Base URL**: Set via `DASHBOARD_URL` environment variable
- **Auto-start Server**: Starts Next.js dev server for localhost URLs
- **CI Mode**: Single worker, retries, JSON reports
- **Artifacts**: Screenshots on failure, video on retry, HTML report

## CI Integration

Tests run via GitHub Actions (`.github/workflows/e2e.yml`):

1. Triggered on push to main or manual dispatch
2. Installs Playwright with Chromium
3. Runs against `DASHBOARD_URL` secret
4. Uploads test artifacts on failure
5. Sends Slack notification with results

### Required Secrets

| Secret | Description |
|--------|-------------|
| `DASHBOARD_URL` | URL to test against |
| `E2E_TEST_EMAIL` | Test account email |
| `E2E_TEST_PASSWORD` | Test account password |
| `SLACK_WEBHOOK_URL` | (Optional) For notifications |

## Writing Tests

```typescript
import { test, expect, Page } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

test.describe('Feature', () => {
  // Skip if credentials not available
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials not configured')

  test('should work', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading')).toBeVisible()
  })
})
```

## Troubleshooting

### Tests fail to start server

Check if port 3001 is in use:

```bash
lsof -i :3001
```

### Browser not found

```bash
pnpm exec playwright install chromium
```

### View test report

```bash
pnpm report
```
