import { test, expect } from '@playwright/test'

/**
 * Smoke Tests for BundleNudge App Dashboard
 *
 * These tests verify that the dashboard is accessible and renders correctly.
 * They do not require authentication and run against any environment.
 */

test.describe('App Dashboard Smoke Tests', () => {
  test('login page renders with email and password form', async ({ page }) => {
    await page.goto('/login')

    // Check page title/heading
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    // Check email input exists
    const emailInput = page.locator('#email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('type', 'email')

    // Check password input exists
    const passwordInput = page.locator('#password')
    await expect(passwordInput).toBeVisible()
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Check sign in button exists
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    // Check GitHub OAuth button exists
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible()

    // Check sign up link exists
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('login page has proper accessibility', async ({ page }) => {
    await page.goto('/login')

    // Check labels are associated with inputs
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('login page has branding', async ({ page }) => {
    await page.goto('/login')

    // Check BundleNudge branding is present
    await expect(page.getByText(/bundlenudge/i).first()).toBeVisible()
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('#password')

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Find and click toggle button
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') })
      .and(page.locator('button:near(#password)'))

    if (await toggleButton.first().isVisible()) {
      await toggleButton.first().click()

      // Should now be text type
      await expect(passwordInput).toHaveAttribute('type', 'text')
    }
  })

  test('forgot password link is present', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
  })

  test('back to home link is present', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible()
  })
})
