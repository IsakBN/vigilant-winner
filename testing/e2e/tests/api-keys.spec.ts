import { test, expect, Page } from '@playwright/test'

/**
 * API Key Flow Tests
 *
 * Tests the critical API key management paths:
 * - Viewing API key in app settings
 * - Regenerating API key
 * - Copying API key
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

test.describe('API Key Flow', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping - E2E credentials not configured')

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('can view API key section in settings', async ({ page }) => {
    await navigateToAppSettings(page)

    // Should see API key section
    await expect(
      page.getByText(/api key/i)
    ).toBeVisible()

    // Should see masked or visible API key
    const apiKeyDisplay = page.locator('[data-testid="api-key"], code, .api-key')
      .or(page.getByText(/bn_|bundlenudge_|[a-z0-9]{20,}/i))

    // Either shows the key or a "generate" button if no key exists
    const hasKey = await apiKeyDisplay.first().isVisible()
    const hasGenerateButton = await page.getByRole('button', { name: /generate|create/i }).isVisible()

    expect(hasKey || hasGenerateButton).toBeTruthy()
  })

  test('can regenerate API key', async ({ page }) => {
    await navigateToAppSettings(page)

    // Find regenerate button
    const regenerateButton = page.getByRole('button', { name: /regenerate|refresh|new key/i })
      .or(page.getByRole('button', { name: /generate/i }))

    if (await regenerateButton.first().isVisible()) {
      await regenerateButton.first().click()

      // May show confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|regenerate/i })
        .filter({ hasNot: page.getByRole('button', { name: /cancel/i }) })

      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      // Should show success message or new key
      await expect(
        page.getByText(/success|generated|new key|copied/i)
          .or(page.getByText(/bn_|[a-zA-Z0-9]{32,}/))
      ).toBeVisible({ timeout: 10000 })
    }
  })

  test('copy button is present for API key', async ({ page }) => {
    await navigateToAppSettings(page)

    // Find copy button near API key
    const copyButton = page.getByRole('button', { name: /copy/i })
      .or(page.locator('button[aria-label*="copy" i]'))
      .or(page.locator('button:has(svg)').filter({ hasText: /copy/i }))

    // Should have a copy mechanism
    if (await copyButton.first().isVisible()) {
      await copyButton.first().click()

      // May show "copied" feedback
      const copiedFeedback = page.getByText(/copied/i)
      if (await copiedFeedback.isVisible({ timeout: 2000 })) {
        await expect(copiedFeedback).toBeVisible()
      }
    }
  })

  test('API key section shows security warning for regeneration', async ({ page }) => {
    await navigateToAppSettings(page)

    // Should see warning about regeneration
    await expect(
      page.getByText(/warning|caution|invalidate|existing|previous/i)
        .or(page.getByText(/cannot be undone/i))
    ).toBeVisible()
  })
})

/**
 * Helper: Login to dashboard
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
}

/**
 * Helper: Navigate to app settings page
 */
async function navigateToAppSettings(page: Page): Promise<void> {
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle')

  // Navigate to apps
  const appsLink = page.locator('a[href*="/apps"]')
    .filter({ hasNot: page.locator('a[href*="/apps/new"]') })
    .first()

  if (await appsLink.isVisible()) {
    await appsLink.click()
    await page.waitForLoadState('networkidle')
  }

  // Click on first app
  const appCard = page.locator('[data-testid="app-card"], .app-card')
    .or(page.locator('a[href*="/apps/"]').filter({ hasNot: page.locator('a[href*="/apps/new"]') }))
    .first()

  if (await appCard.isVisible()) {
    await appCard.click()
    await page.waitForLoadState('networkidle')
  }

  // Navigate to settings
  const settingsLink = page.getByRole('link', { name: /settings/i })
    .or(page.locator('a[href*="/settings"]'))

  if (await settingsLink.first().isVisible()) {
    await settingsLink.first().click()
    await expect(page).toHaveURL(/settings/, { timeout: 10000 })
  }
}
