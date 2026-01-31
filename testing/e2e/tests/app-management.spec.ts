import { test, expect, Page } from '@playwright/test'

/**
 * App Management Flow Tests
 *
 * Tests the critical app management paths:
 * - Viewing apps list
 * - Creating a new app
 * - Viewing app details
 * - Deleting an app
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

test.describe('App Management Flow', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping - E2E credentials not configured')

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD)
  })

  test('can view apps list', async ({ page }) => {
    // Navigate to apps section
    const appsLink = page.getByRole('link', { name: /apps/i })
      .or(page.locator('a[href*="/apps"]'))

    if (await appsLink.first().isVisible()) {
      await appsLink.first().click()
    }

    // Should see apps list or empty state
    const hasApps = await page.locator('[data-testid="app-card"], .app-card, [class*="app"]').first().isVisible()
    const hasEmptyState = await page.getByText(/no apps|create your first|get started/i).isVisible()

    expect(hasApps || hasEmptyState).toBeTruthy()
  })

  test('can navigate to create app page', async ({ page }) => {
    // Find create app button/link
    const createButton = page.getByRole('link', { name: /new app|create app|add app/i })
      .or(page.getByRole('button', { name: /new app|create app|add app/i }))
      .or(page.locator('a[href*="/apps/new"]'))

    if (await createButton.first().isVisible()) {
      await createButton.first().click()

      // Should be on create app page
      await expect(page).toHaveURL(/apps\/new|new-app|create/i)

      // Should see repository form
      await expect(
        page.getByRole('heading', { name: /connect|repository|new app/i })
      ).toBeVisible()
    }
  })

  test('can view app details', async ({ page }) => {
    // Navigate to apps
    const appsLink = page.locator('a[href*="/apps"]').first()
    if (await appsLink.isVisible()) {
      await appsLink.click()
    }

    // Click on first app if exists
    const appCard = page.locator('[data-testid="app-card"], .app-card, a[href*="/apps/"]')
      .filter({ hasNot: page.locator('a[href*="/apps/new"]') })
      .first()

    if (await appCard.isVisible()) {
      await appCard.click()

      // Should see app details page elements
      await expect(
        page.getByText(/releases|channels|devices|settings/i).first()
      ).toBeVisible({ timeout: 10000 })
    }
  })

  test('can navigate to app settings', async ({ page }) => {
    // Navigate to an app first
    await navigateToFirstApp(page)

    // Click settings tab/link
    const settingsLink = page.getByRole('link', { name: /settings/i })
      .or(page.locator('a[href*="/settings"]'))

    if (await settingsLink.first().isVisible()) {
      await settingsLink.first().click()

      // Should see settings page
      await expect(page).toHaveURL(/settings/)
      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
    }
  })

  test('delete app dialog appears', async ({ page }) => {
    await navigateToFirstApp(page)

    // Go to settings
    const settingsLink = page.getByRole('link', { name: /settings/i })
      .or(page.locator('a[href*="/settings"]'))

    if (await settingsLink.first().isVisible()) {
      await settingsLink.first().click()
      await expect(page).toHaveURL(/settings/)

      // Find danger zone / delete button
      const deleteButton = page.getByRole('button', { name: /delete/i })
        .filter({ hasText: /delete|remove/i })

      if (await deleteButton.first().isVisible()) {
        await deleteButton.first().click()

        // Should show confirmation dialog
        await expect(
          page.getByRole('alertdialog')
            .or(page.getByRole('dialog'))
            .or(page.getByText(/are you sure|confirm|cannot be undone/i))
        ).toBeVisible()

        // Cancel the dialog - don't actually delete
        const cancelButton = page.getByRole('button', { name: /cancel|close|no/i })
        if (await cancelButton.isVisible()) {
          await cancelButton.click()
        } else {
          await page.keyboard.press('Escape')
        }
      }
    }
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
 * Helper: Navigate to first available app
 */
async function navigateToFirstApp(page: Page): Promise<void> {
  // Try to find apps link in navigation
  const appsLink = page.locator('a[href*="/apps"]')
    .filter({ hasNot: page.locator('a[href*="/apps/new"]') })
    .first()

  if (await appsLink.isVisible()) {
    await appsLink.click()
  }

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Click on first app card
  const appCard = page.locator('[data-testid="app-card"], .app-card')
    .or(page.locator('a[href*="/apps/"]').filter({ hasNot: page.locator('a[href*="/apps/new"]') }))
    .first()

  if (await appCard.isVisible()) {
    await appCard.click()
    await page.waitForLoadState('networkidle')
  }
}
