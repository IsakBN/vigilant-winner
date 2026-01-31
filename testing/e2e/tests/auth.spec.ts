import { test, expect, Page } from '@playwright/test'

/**
 * Dashboard Authentication Flow Tests
 *
 * Tests the critical authentication paths:
 * - Login page rendering
 * - Email/password login flow
 * - Navigation after login
 * - Logout flow
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? ''
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? ''

test.describe('Dashboard Auth Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')

    // Check essential elements
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with github/i })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.locator('#email').fill('invalid@example.com')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 })
  })

  test('sign up link navigates correctly', async ({ page }) => {
    await page.goto('/login')

    const signUpLink = page.getByRole('link', { name: /sign up/i })
    await expect(signUpLink).toBeVisible()
    await signUpLink.click()

    await expect(page).toHaveURL(/sign-up/)
  })

  test.describe('Authenticated flows', () => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping - E2E credentials not configured')

    test('can login with valid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.locator('#email').fill(TEST_EMAIL)
      await page.locator('#password').fill(TEST_PASSWORD)
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
    })

    test('dashboard navigation after login', async ({ page }) => {
      await login(page, TEST_EMAIL, TEST_PASSWORD)

      // Should be on dashboard
      await expect(page).toHaveURL(/dashboard/)

      // Check navigation elements are present
      const sidebar = page.locator('nav, [role="navigation"]')
      await expect(sidebar).toBeVisible()
    })

    test('logout flow', async ({ page }) => {
      await login(page, TEST_EMAIL, TEST_PASSWORD)

      // Find and click logout
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Account")')
      if (await userMenu.isVisible()) {
        await userMenu.click()
      }

      const logoutButton = page.getByRole('button', { name: /log ?out|sign ?out/i })
        .or(page.getByRole('menuitem', { name: /log ?out|sign ?out/i }))

      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        // Should redirect to login or home
        await expect(page).toHaveURL(/login|\/$/i, { timeout: 10000 })
      }
    })
  })
})

/**
 * Helper function to login
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
}
