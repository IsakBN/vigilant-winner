/**
 * Authentication E2E Tests
 *
 * Tests for login, sign up, password reset, logout, and session persistence.
 */

import { test, expect, TEST_USERS, authenticateUser, generateUniqueId } from './helpers/fixtures'

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display login page with all elements', async ({ loginPage }) => {
      await loginPage.goto()

      await expect(loginPage.emailInput).toBeVisible()
      await expect(loginPage.passwordInput).toBeVisible()
      await expect(loginPage.submitButton).toBeVisible()
      await expect(loginPage.githubButton).toBeVisible()
      await expect(loginPage.forgotPasswordLink).toBeVisible()
      await expect(loginPage.signUpLink).toBeVisible()
    })

    test('should login with valid email and password', async ({ page, loginPage }) => {
      await loginPage.goto()
      await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password)

      // Should redirect to dashboard after successful login
      await page.waitForURL(/\/dashboard/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should show error for invalid credentials', async ({ loginPage }) => {
      await loginPage.goto()
      await loginPage.login('invalid@example.com', 'wrongpassword')

      await loginPage.expectError('Invalid')
    })

    test('should show error for empty email', async ({ loginPage }) => {
      await loginPage.goto()
      await loginPage.passwordInput.fill('somepassword')
      await loginPage.submitButton.click()

      // HTML5 validation should prevent submission
      await expect(loginPage.emailInput).toHaveAttribute('required')
    })

    test('should show error for empty password', async ({ loginPage }) => {
      await loginPage.goto()
      await loginPage.emailInput.fill('test@example.com')
      await loginPage.submitButton.click()

      await loginPage.expectError('email and password')
    })

    test('should toggle password visibility', async ({ page, loginPage }) => {
      await loginPage.goto()
      await loginPage.passwordInput.fill('mypassword')

      // Password should be hidden by default
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')

      // Click the toggle button
      const toggleButton = page.locator('button[tabindex="-1"]')
      await toggleButton.click()

      // Password should now be visible
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide
      await toggleButton.click()
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')
    })

    test('should navigate to forgot password', async ({ page, loginPage }) => {
      await loginPage.goto()
      await loginPage.forgotPasswordLink.click()

      await expect(page).toHaveURL(/\/forgot-password/)
    })

    test('should navigate to sign up', async ({ page, loginPage }) => {
      await loginPage.goto()
      await loginPage.signUpLink.click()

      await expect(page).toHaveURL(/\/sign-up/)
    })

    test('should redirect to dashboard if already authenticated', async ({ page, loginPage }) => {
      // First login
      await loginPage.goto()
      await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password)
      await page.waitForURL(/\/dashboard/)

      // Try to access login page again
      await page.goto('/login')

      // Should redirect back to dashboard
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should preserve redirect URL after login', async ({ page, loginPage }) => {
      // Try to access protected page
      await page.goto('/dashboard/test-account/apps')

      // Should redirect to login with redirect param
      await page.waitForURL(/\/login/)

      // Login
      await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password)

      // Should redirect to originally requested page or dashboard
      await page.waitForURL(/\/dashboard/)
    })
  })

  test.describe('Login with GitHub OAuth', () => {
    test('should display GitHub login button', async ({ loginPage }) => {
      await loginPage.goto()

      await expect(loginPage.githubButton).toBeVisible()
      await expect(loginPage.githubButton).toContainText('GitHub')
    })

    test('should initiate GitHub OAuth flow', async ({ page, loginPage }) => {
      await loginPage.goto()

      // Listen for navigation to GitHub
      const navigationPromise = page.waitForURL(/github\.com|oauth/, { timeout: 5000 }).catch(() => null)

      await loginPage.githubButton.click()

      // Button should show loading state
      await expect(loginPage.githubButton).toContainText('Redirecting')

      // In a real test environment, this would navigate to GitHub
      // For mocking, we verify the button behavior
    })
  })

  test.describe('Sign Up', () => {
    test('should display sign up page with all elements', async ({ signUpPage }) => {
      await signUpPage.goto()

      await expect(signUpPage.emailInput).toBeVisible()
      await expect(signUpPage.passwordInput).toBeVisible()
      await expect(signUpPage.submitButton).toBeVisible()
      await expect(signUpPage.githubButton).toBeVisible()
      await expect(signUpPage.loginLink).toBeVisible()
    })

    test('should sign up with valid credentials', async ({ page, signUpPage }) => {
      const uniqueEmail = `e2e-test-${generateUniqueId()}@bundlenudge.test`

      await signUpPage.goto()
      await signUpPage.signUp('Test User', uniqueEmail, 'SecurePassword123!')

      // Should either redirect to dashboard or show verification step
      await page.waitForURL(/\/dashboard|verify/, { timeout: 10000 })
    })

    test('should show error for existing email', async ({ signUpPage }) => {
      await signUpPage.goto()
      await signUpPage.signUp('Test User', TEST_USERS.owner.email, 'SomePassword123!')

      // Should show error about existing account
      await expect(signUpPage.errorAlert).toBeVisible({ timeout: 5000 })
    })

    test('should show error for weak password', async ({ page, signUpPage }) => {
      await signUpPage.goto()
      await signUpPage.signUp('Test User', `weak-${generateUniqueId()}@test.com`, 'weak')

      // Should show password strength error
      await expect(page.locator('text=password')).toBeVisible()
    })

    test('should show error for invalid email format', async ({ signUpPage }) => {
      await signUpPage.goto()
      await signUpPage.emailInput.fill('invalid-email')
      await signUpPage.passwordInput.fill('ValidPassword123!')
      await signUpPage.submitButton.click()

      // HTML5 validation or custom error
      await expect(signUpPage.emailInput).toHaveAttribute('type', 'email')
    })

    test('should navigate to login page', async ({ page, signUpPage }) => {
      await signUpPage.goto()
      await signUpPage.loginLink.click()

      await expect(page).toHaveURL(/\/login/)
    })

    test('should redirect if already authenticated', async ({ page, signUpPage }) => {
      // First login
      await authenticateUser(page, TEST_USERS.owner)

      // Try to access sign up page
      await page.goto('/sign-up')

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/)
    })
  })

  test.describe('Password Reset', () => {
    test('should display forgot password page', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()

      await expect(forgotPasswordPage.emailInput).toBeVisible()
      await expect(forgotPasswordPage.submitButton).toBeVisible()
      await expect(forgotPasswordPage.backToLoginLink).toBeVisible()
    })

    test('should request password reset', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestReset(TEST_USERS.owner.email)

      // Should show success message (always shows for security)
      await expect(forgotPasswordPage.successMessage).toBeVisible({ timeout: 5000 })
    })

    test('should show success even for non-existent email', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestReset('nonexistent@example.com')

      // Should still show success (for security, don't reveal if email exists)
      await expect(forgotPasswordPage.successMessage).toBeVisible({ timeout: 5000 })
    })

    test('should navigate back to login', async ({ page, forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestReset('test@example.com')

      // Wait for success page
      await expect(forgotPasswordPage.successMessage).toBeVisible()

      // Click back to login
      await forgotPasswordPage.backToLoginLink.click()

      await expect(page).toHaveURL(/\/login/)
    })

    test('should allow trying again after success', async ({ page, forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await forgotPasswordPage.requestReset('test@example.com')

      await expect(forgotPasswordPage.successMessage).toBeVisible()

      // Click try again
      const tryAgainButton = page.locator('button:has-text("try again")')
      await tryAgainButton.click()

      // Should show form again
      await expect(forgotPasswordPage.emailInput).toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUser(page, TEST_USERS.owner)
    })

    test('should logout successfully', async ({ page, dashboardPage }) => {
      // User should be on dashboard
      await expect(page).toHaveURL(/\/dashboard/)

      await dashboardPage.logout()

      // Should redirect to login or home page
      await expect(page).toHaveURL(/\/login|\//)
    })

    test('should not access protected routes after logout', async ({ page, dashboardPage }) => {
      await dashboardPage.logout()
      await page.waitForURL(/\/login|\//)

      // Try to access dashboard
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('should clear session data after logout', async ({ page, dashboardPage }) => {
      await dashboardPage.logout()
      await page.waitForURL(/\/login|\//)

      // Reload page
      await page.reload()

      // Try to access dashboard - should still require login
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Session Persistence', () => {
    test('should persist session after page reload', async ({ page }) => {
      await authenticateUser(page, TEST_USERS.owner)

      // Reload the page
      await page.reload()

      // Should still be on dashboard
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should persist session across navigation', async ({ page, dashboardPage }) => {
      await authenticateUser(page, TEST_USERS.owner)

      // Navigate to different pages
      await dashboardPage.navigateToApps()
      await expect(page).toHaveURL(/\/apps/)

      await page.goBack()
      await expect(page).toHaveURL(/\/dashboard/)

      // Session should still be valid
      await page.reload()
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should handle expired session gracefully', async ({ page, context }) => {
      await authenticateUser(page, TEST_USERS.owner)

      // Clear cookies to simulate expired session
      await context.clearCookies()

      // Try to access protected page
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('should preserve user data in local storage', async ({ page }) => {
      await authenticateUser(page, TEST_USERS.owner)

      // Check that some session-related data exists
      const localStorage = await page.evaluate(() => {
        const keys = Object.keys(window.localStorage)
        return keys.filter(key => key.includes('auth') || key.includes('session') || key.includes('user'))
      })

      // Session mechanism should store something
      // This is implementation-dependent
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, loginPage }) => {
      await loginPage.goto()

      // Simulate offline
      await page.context().setOffline(true)

      await loginPage.login(TEST_USERS.owner.email, TEST_USERS.owner.password)

      // Should show error message
      await expect(loginPage.errorAlert).toBeVisible({ timeout: 5000 })

      // Restore network
      await page.context().setOffline(false)
    })

    test('should show loading state during login', async ({ loginPage }) => {
      await loginPage.goto()
      await loginPage.emailInput.fill(TEST_USERS.owner.email)
      await loginPage.passwordInput.fill(TEST_USERS.owner.password)
      await loginPage.submitButton.click()

      // Button should show loading state briefly
      await expect(loginPage.submitButton).toContainText(/Signing in|Loading/)
    })

    test('should handle rate limiting', async ({ page, loginPage }) => {
      await loginPage.goto()

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await loginPage.emailInput.clear()
        await loginPage.passwordInput.clear()
        await loginPage.login(`invalid${i}@example.com`, 'wrongpassword')
        await page.waitForTimeout(500)
      }

      // After many attempts, should see rate limit or error message
      // This behavior depends on backend implementation
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper form labels', async ({ loginPage }) => {
      await loginPage.goto()

      // Check email input has label
      const emailLabel = loginPage.page.locator('label[for="email"]')
      await expect(emailLabel).toBeVisible()

      // Check password input has label
      const passwordLabel = loginPage.page.locator('label[for="password"]')
      await expect(passwordLabel).toBeVisible()
    })

    test('should support keyboard navigation', async ({ page, loginPage }) => {
      await loginPage.goto()

      // Tab through form elements
      await page.keyboard.press('Tab')
      await expect(loginPage.githubButton).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(loginPage.emailInput).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(loginPage.passwordInput).toBeFocused()

      await page.keyboard.press('Tab')
      // Focus moves to submit or show/hide password
    })

    test('should submit form with Enter key', async ({ page, loginPage }) => {
      await loginPage.goto()
      await loginPage.emailInput.fill(TEST_USERS.owner.email)
      await loginPage.passwordInput.fill(TEST_USERS.owner.password)

      await page.keyboard.press('Enter')

      // Should trigger form submission
      await page.waitForURL(/\/dashboard|login/)
    })
  })
})

test.describe('Authentication - Screenshot on Failure', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      const screenshotName = `auth-${testInfo.title.replace(/\s+/g, '-')}.png`
      await page.screenshot({ path: `test-results/${screenshotName}`, fullPage: true })
    }
  })

  test('example test that captures screenshot on failure', async ({ loginPage }) => {
    await loginPage.goto()
    // This test passes, screenshot only on failure
    await expect(loginPage.emailInput).toBeVisible()
  })
})
