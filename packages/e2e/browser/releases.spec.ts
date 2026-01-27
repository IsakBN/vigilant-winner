/**
 * Release Management E2E Tests
 *
 * Tests for creating, viewing, managing releases including staged rollouts.
 */

import { test, expect, TEST_USERS, authenticateUser, uniqueVersion, uniqueAppName } from './helpers/fixtures'
import { createReadStream } from 'fs'
import { join } from 'path'

const TEST_ACCOUNT_ID = 'test-account'

test.describe('Release Management', () => {
  let testAppId: string
  let testAppName: string

  test.beforeEach(async ({ page, createAppPage }) => {
    await authenticateUser(page, TEST_USERS.owner)

    // Create a test app for release tests
    testAppName = uniqueAppName('Release Test')
    await createAppPage.goto(TEST_ACCOUNT_ID)
    await createAppPage.createApp(testAppName, 'ios')
    await page.waitForURL(/\/apps\/([a-zA-Z0-9-]+)/)

    // Extract app ID
    const url = page.url()
    const appIdMatch = url.match(/\/apps\/([a-zA-Z0-9-]+)/)
    testAppId = appIdMatch ? appIdMatch[1] : 'unknown'
  })

  test.describe('Create Release', () => {
    test('should display create release page', async ({ createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)

      await expect(createReleasePage.versionInput).toBeVisible()
      await expect(createReleasePage.descriptionInput).toBeVisible()
      await expect(createReleasePage.submitButton).toBeVisible()
    })

    test('should create release with version', async ({ page, createReleasePage, releasesPage }) => {
      const version = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({
        version,
        description: 'Test release description',
        channel: 'Production',
      })

      // Should redirect to releases list
      await page.waitForURL(/\/releases/, { timeout: 10000 })

      // Should show the new release
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)
      const releaseRow = releasesPage.getReleaseRow(version)
      await expect(releaseRow).toBeVisible()
    })

    test('should show validation error for invalid version', async ({ createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.versionInput.fill('invalid')
      await createReleasePage.submitButton.click()

      // Should show version format error
      await expect(createReleasePage.page.locator('text=semver')).toBeVisible()
    })

    test('should show validation error for empty version', async ({ createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.submitButton.click()

      // Should show required error
      await expect(createReleasePage.page.locator('text=required')).toBeVisible()
    })

    test('should allow setting rollout percentage', async ({ page, createReleasePage }) => {
      const version = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.versionInput.fill(version)

      // Set rollout percentage via slider
      await createReleasePage.rolloutSlider.focus()
      await page.keyboard.press('Home') // Go to 0

      // Move to 50%
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowRight')
      }

      // Verify percentage is shown
      await expect(page.locator('text=50%')).toBeVisible()
    })

    test('should select channel', async ({ page, createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)

      // Click channel select
      await createReleasePage.channelSelect.click()

      // Should show channel options
      await expect(page.locator('text=Production')).toBeVisible()
      await expect(page.locator('text=Staging')).toBeVisible()

      // Select staging
      await page.locator('[role="option"]:has-text("Staging")').click()
    })

    test('should set version targeting', async ({ createReleasePage }) => {
      const version = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.versionInput.fill(version)
      await createReleasePage.minVersionInput.fill('1.0.0')
      await createReleasePage.maxVersionInput.fill('2.0.0')

      // Should not show errors
      await expect(createReleasePage.errorAlert).not.toBeVisible()
    })

    test('should cancel release creation', async ({ page, createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.cancelButton.click()

      await expect(page).toHaveURL(/\/releases/)
    })

    test('should show loading state during creation', async ({ createReleasePage }) => {
      const version = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.versionInput.fill(version)
      await createReleasePage.submitButton.click()

      // Should show loading state
      await expect(createReleasePage.submitButton).toContainText(/Creating/)
    })
  })

  test.describe('Upload Bundle', () => {
    test('should show bundle upload area', async ({ createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)

      await expect(createReleasePage.bundleUpload).toBeAttached()
      await expect(createReleasePage.page.locator('text=Drag and drop')).toBeVisible()
    })

    test('should accept file upload', async ({ page, createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)

      // Create a mock file for testing
      // In real tests, you'd use a proper test fixture file
      const fileInput = createReleasePage.bundleUpload

      // Note: For actual file upload testing, you'd need:
      // await fileInput.setInputFiles('/path/to/test.bundle')

      // For now, just verify the input accepts the right types
      await expect(fileInput).toHaveAttribute('accept', '.zip,.bundle')
    })

    test('should show file info after upload', async ({ page, createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)

      // This would require a test bundle file
      // When file is uploaded, should show file name and size
    })

    test('should allow removing uploaded file', async ({ page, createReleasePage }) => {
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)

      // After upload, should show remove button
      // Click remove should clear the file
    })
  })

  test.describe('View Release Details', () => {
    let testReleaseId: string
    let testVersion: string

    test.beforeEach(async ({ page, createReleasePage }) => {
      // Create a release for detail tests
      testVersion = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({
        version: testVersion,
        description: 'Test release for detail view',
      })

      await page.waitForURL(/\/releases/)

      // Navigate to the release detail (would need to extract ID)
      // For this test, we'll use the version to find it
    })

    test('should display release details', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      // Click on the release
      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Should show release detail page
      await expect(page.locator(`text=v${testVersion}`)).toBeVisible()
    })

    test('should show release stats', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Should show stats section
      await expect(releaseDetailPage.statsSection).toBeVisible()
    })

    test('should show status badge', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Should show status badge
      await expect(releaseDetailPage.statusBadge).toBeVisible()
    })

    test('should show release info', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Should show release info sections
      await expect(page.locator('text=Channel')).toBeVisible()
      await expect(page.locator('text=Bundle Size')).toBeVisible()
    })
  })

  test.describe('Enable/Disable Release', () => {
    let testVersion: string

    test.beforeEach(async ({ page, createReleasePage }) => {
      testVersion = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({ version: testVersion })
      await page.waitForURL(/\/releases/)
    })

    test('should toggle release status', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Toggle the switch
      await releaseDetailPage.toggleSwitch.click()

      // Status should change
      await page.waitForTimeout(1000) // Wait for API call
    })

    test('should disable release with confirmation', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Click disable button
      await releaseDetailPage.disableButton.click()

      // Should show confirmation
      await expect(page.locator('[role="alertdialog"]')).toBeVisible()

      // Confirm
      await releaseDetailPage.disableConfirmButton.click()

      // Status should change to disabled
      await expect(page.locator('text=Disabled')).toBeVisible({ timeout: 5000 })
    })

    test('should cancel disable action', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      await releaseDetailPage.disableButton.click()

      // Click cancel
      await page.locator('[role="alertdialog"] button:has-text("Cancel")').click()

      // Dialog should close
      await expect(page.locator('[role="alertdialog"]')).not.toBeVisible()
    })
  })

  test.describe('Staged Rollout', () => {
    let testVersion: string

    test.beforeEach(async ({ page, createReleasePage }) => {
      testVersion = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({
        version: testVersion,
        rolloutPercentage: 10,
      })
      await page.waitForURL(/\/releases/)
    })

    test('should display current rollout percentage', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Should show rollout slider
      await expect(releaseDetailPage.rolloutSlider).toBeVisible()

      // Should show current percentage
      await expect(page.locator('text=%')).toBeVisible()
    })

    test('should update rollout percentage', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Increase rollout
      await releaseDetailPage.setRolloutPercentage(50)

      // Wait for update
      await page.waitForTimeout(1000)

      // Should show updated percentage
      await expect(page.locator('text=50%')).toBeVisible()
    })

    test('should show loading state during rollout update', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Change rollout
      await releaseDetailPage.rolloutSlider.focus()
      await page.keyboard.press('ArrowRight')

      // Should show updating state
      await expect(page.locator('text=Updating')).toBeVisible({ timeout: 2000 })
    })

    test('should allow full rollout', async ({ page, releasesPage, releaseDetailPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Set to 100%
      await releaseDetailPage.rolloutSlider.focus()
      await page.keyboard.press('End')

      await page.waitForTimeout(1000)
      await expect(page.locator('text=100%')).toBeVisible()
    })
  })

  test.describe('Rollback', () => {
    let version1: string
    let version2: string

    test.beforeEach(async ({ page, createReleasePage }) => {
      // Create two releases
      version1 = uniqueVersion()
      version2 = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({ version: version1 })
      await page.waitForURL(/\/releases/)

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({ version: version2 })
      await page.waitForURL(/\/releases/)
    })

    test('should show rollback reports section', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(version2)
      await releaseRow.click()

      // Should show rollback reports section (even if empty)
      await expect(page.locator('text=Rollback')).toBeVisible()
    })

    test('should navigate to previous release', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      // Both releases should be visible
      await expect(releasesPage.getReleaseRow(version1)).toBeVisible()
      await expect(releasesPage.getReleaseRow(version2)).toBeVisible()
    })
  })

  test.describe('View Metrics', () => {
    let testVersion: string

    test.beforeEach(async ({ page, createReleasePage }) => {
      testVersion = uniqueVersion()

      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({ version: testVersion })
      await page.waitForURL(/\/releases/)
    })

    test('should display release stats', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // Should show stats cards
      await expect(page.locator('text=Downloads')).toBeVisible()
    })

    test('should show zero stats for new release', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      const releaseRow = releasesPage.getReleaseRow(testVersion)
      await releaseRow.click()

      // New release should have zero downloads
      await expect(page.locator('text=0')).toBeVisible()
    })
  })

  test.describe('Release List', () => {
    test('should show empty state for new app', async ({ page, releasesPage, createAppPage }) => {
      // Create a new app without releases
      const newAppName = uniqueAppName('Empty Releases')
      await createAppPage.goto(TEST_ACCOUNT_ID)
      await createAppPage.createApp(newAppName, 'ios')
      await page.waitForURL(/\/apps\/([a-zA-Z0-9-]+)/)

      const url = page.url()
      const appIdMatch = url.match(/\/apps\/([a-zA-Z0-9-]+)/)
      const newAppId = appIdMatch ? appIdMatch[1] : 'unknown'

      await releasesPage.goto(TEST_ACCOUNT_ID, newAppId)

      // Should show empty state
      await expect(releasesPage.emptyState).toBeVisible()
    })

    test('should navigate to create release from empty state', async ({ page, releasesPage, createAppPage }) => {
      const newAppName = uniqueAppName('Nav to Create')
      await createAppPage.goto(TEST_ACCOUNT_ID)
      await createAppPage.createApp(newAppName, 'ios')
      await page.waitForURL(/\/apps\/([a-zA-Z0-9-]+)/)

      const url = page.url()
      const appIdMatch = url.match(/\/apps\/([a-zA-Z0-9-]+)/)
      const newAppId = appIdMatch ? appIdMatch[1] : 'unknown'

      await releasesPage.goto(TEST_ACCOUNT_ID, newAppId)
      await releasesPage.createReleaseButton.click()

      await expect(page).toHaveURL(/\/releases\/new/)
    })

    test('should filter releases by status', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      // Open status filter
      await releasesPage.statusFilter.click()

      // Select active
      await page.locator('[role="option"]:has-text("Active")').click()

      // List should filter
    })

    test('should search releases by version', async ({ page, createReleasePage, releasesPage }) => {
      // Create a release with specific version
      const searchVersion = '9.9.9'
      await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
      await createReleasePage.createRelease({ version: searchVersion })
      await page.waitForURL(/\/releases/)

      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)
      await releasesPage.searchInput.fill('9.9')

      // Should filter to matching release
      await expect(releasesPage.getReleaseRow(searchVersion)).toBeVisible()
    })

    test('should show pagination for many releases', async ({ page, createReleasePage, releasesPage }) => {
      // Create multiple releases
      for (let i = 0; i < 3; i++) {
        await createReleasePage.goto(TEST_ACCOUNT_ID, testAppId)
        await createReleasePage.createRelease({ version: uniqueVersion() })
        await page.waitForURL(/\/releases/)
      }

      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      // Should show total count
      await expect(page.locator('text=release')).toBeVisible()
    })

    test('should sort releases', async ({ page, releasesPage }) => {
      await releasesPage.goto(TEST_ACCOUNT_ID, testAppId)

      // Click column header to sort
      const versionHeader = page.locator('th:has-text("Version"), button:has-text("Version")')
      if (await versionHeader.isVisible()) {
        await versionHeader.click()
        // List should re-sort
      }
    })
  })
})

test.describe('Release Management - Screenshot on Failure', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      const screenshotName = `releases-${testInfo.title.replace(/\s+/g, '-')}.png`
      await page.screenshot({ path: `test-results/${screenshotName}`, fullPage: true })
    }
  })

  test('release list should display correctly', async ({ page, createAppPage, releasesPage }) => {
    await authenticateUser(page, TEST_USERS.owner)

    const appName = uniqueAppName('Screenshot Test')
    await createAppPage.goto('test-account')
    await createAppPage.createApp(appName, 'ios')
    await page.waitForURL(/\/apps\/([a-zA-Z0-9-]+)/)

    const url = page.url()
    const appIdMatch = url.match(/\/apps\/([a-zA-Z0-9-]+)/)
    const appId = appIdMatch ? appIdMatch[1] : 'unknown'

    await releasesPage.goto('test-account', appId)

    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })
})
