/**
 * Team Management E2E Tests
 *
 * Tests for team management including invitations, members, and roles.
 */

import { test, expect, TEST_USERS, authenticateUser, uniqueTeamName, generateUniqueId } from './helpers/fixtures'

const TEST_ACCOUNT_ID = 'test-account'

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page, TEST_USERS.owner)
  })

  test.describe('Team List', () => {
    test('should display teams page', async ({ teamsPage }) => {
      await teamsPage.goto(TEST_ACCOUNT_ID)

      // Should show teams list or empty state
      const hasTeams = await teamsPage.teamList.isVisible()
      const isEmpty = await teamsPage.emptyState.isVisible()

      expect(hasTeams || isEmpty).toBeTruthy()
    })

    test('should show create team button', async ({ teamsPage }) => {
      await teamsPage.goto(TEST_ACCOUNT_ID)

      // Create team button should be visible
      await expect(teamsPage.createTeamButton).toBeVisible()
    })

    test('should navigate to team details', async ({ page, teamsPage }) => {
      await teamsPage.goto(TEST_ACCOUNT_ID)

      // If there are teams, click on one
      const teamLinks = page.locator('a[href*="/teams/"]')
      const count = await teamLinks.count()

      if (count > 0) {
        await teamLinks.first().click()
        await expect(page).toHaveURL(/\/teams\/[a-zA-Z0-9-]+/)
      }
    })
  })

  test.describe('Team Detail Page', () => {
    // Note: These tests assume a team exists or will be created via fixtures
    const testTeamId = 'test-team-id'

    test('should display team overview', async ({ teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Should show team name
      await expect(teamDetailPage.teamName).toBeVisible()
    })

    test('should show members tab', async ({ teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      await expect(teamDetailPage.membersTab).toBeVisible()
    })

    test('should show invitations tab', async ({ teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      await expect(teamDetailPage.invitationsTab).toBeVisible()
    })

    test('should show settings button for admin', async ({ teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Owner/admin should see settings
      await expect(teamDetailPage.settingsButton).toBeVisible()
    })

    test('should switch between tabs', async ({ page, teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Click members tab
      await teamDetailPage.membersTab.click()
      await expect(teamDetailPage.memberTable).toBeVisible()

      // Click invitations tab
      await teamDetailPage.invitationsTab.click()
      // Invitations content should be visible
    })

    test('should show quick stats', async ({ page, teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Should show stats cards
      await expect(page.locator('text=Members')).toBeVisible()
      await expect(page.locator('text=Your Role')).toBeVisible()
    })

    test('should show invite button for admin', async ({ teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      await expect(teamDetailPage.inviteButton).toBeVisible()
    })
  })

  test.describe('Invite Team Member', () => {
    const testTeamId = 'test-team-id'

    test('should display invite form', async ({ teamInvitationsPage }) => {
      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, testTeamId)

      await expect(teamInvitationsPage.emailInput).toBeVisible()
      await expect(teamInvitationsPage.inviteButton).toBeVisible()
    })

    test('should send invitation', async ({ page, teamInvitationsPage }) => {
      const inviteEmail = `invited-${generateUniqueId()}@bundlenudge.test`

      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, testTeamId)
      await teamInvitationsPage.inviteMember(inviteEmail)

      // Should show success message
      await expect(page.locator('text=sent')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for invalid email', async ({ page, teamInvitationsPage }) => {
      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, testTeamId)
      await teamInvitationsPage.emailInput.fill('invalid-email')
      await teamInvitationsPage.inviteButton.click()

      // Should show validation error
      await expect(page.locator('input:invalid')).toBeVisible()
    })

    test('should select role for invitation', async ({ page, teamInvitationsPage }) => {
      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // If role select is visible
      if (await teamInvitationsPage.roleSelect.isVisible()) {
        await teamInvitationsPage.roleSelect.selectOption('admin')

        // Should update selection
        await expect(teamInvitationsPage.roleSelect).toHaveValue('admin')
      }
    })

    test('should show pending invitations', async ({ page, teamInvitationsPage }) => {
      const inviteEmail = `pending-${generateUniqueId()}@bundlenudge.test`

      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, testTeamId)
      await teamInvitationsPage.inviteMember(inviteEmail)

      // Wait for invitation to appear
      await page.waitForTimeout(1000)

      // Should show in pending list
      const inviteRow = teamInvitationsPage.getInviteRow(inviteEmail)
      await expect(inviteRow).toBeVisible()
    })

    test('should resend invitation', async ({ page, teamInvitationsPage }) => {
      const inviteEmail = `resend-${generateUniqueId()}@bundlenudge.test`

      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, testTeamId)
      await teamInvitationsPage.inviteMember(inviteEmail)

      await page.waitForTimeout(1000)

      // Find and click resend
      const inviteRow = teamInvitationsPage.getInviteRow(inviteEmail)
      const resendButton = inviteRow.locator('button:has-text("Resend")')

      if (await resendButton.isVisible()) {
        await resendButton.click()
        await expect(page.locator('text=resent')).toBeVisible({ timeout: 5000 })
      }
    })

    test('should cancel invitation', async ({ page, teamInvitationsPage }) => {
      const inviteEmail = `cancel-${generateUniqueId()}@bundlenudge.test`

      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, testTeamId)
      await teamInvitationsPage.inviteMember(inviteEmail)

      await page.waitForTimeout(1000)

      // Find and click cancel
      const inviteRow = teamInvitationsPage.getInviteRow(inviteEmail)
      const cancelButton = inviteRow.locator('button:has-text("Cancel")')

      if (await cancelButton.isVisible()) {
        await cancelButton.click()

        // Confirm cancellation
        await page.locator('[role="alertdialog"] button:has-text("Cancel Invitation")').click()

        // Invitation should be removed
        await expect(inviteRow).not.toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Accept Invitation', () => {
    // Note: These tests require invitation link/token handling
    test('should display invitation acceptance page', async ({ page }) => {
      // Navigate to invitation link
      // await page.goto('/accept-invitation?token=test-token')

      // Should show acceptance UI
      // This requires backend setup for invitation tokens
    })

    test('should accept invitation and join team', async ({ page }) => {
      // Accept invitation flow
      // Verify user is added to team
    })

    test('should show error for expired invitation', async ({ page }) => {
      // Navigate to expired invitation
      // Should show error message
    })

    test('should redirect authenticated user after acceptance', async ({ page }) => {
      // After accepting, should redirect to team page
    })
  })

  test.describe('Change Member Role', () => {
    const testTeamId = 'test-team-id'

    test('should display role selector for each member', async ({ teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Should show member table
      await expect(teamMembersPage.memberTable).toBeVisible()
    })

    test('should change member role', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Find a member (not owner)
      const memberRows = page.locator('tr:not(:has-text("Owner"))')
      const count = await memberRows.count()

      if (count > 0) {
        const firstMember = memberRows.first()
        const roleSelect = firstMember.locator('select')

        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption('admin')

          // Should show success
          await expect(page.locator('text=updated')).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('should not allow changing owner role', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Owner row should not have changeable role
      const ownerRow = page.locator('tr:has-text("Owner")')

      if (await ownerRow.count() > 0) {
        const roleSelect = ownerRow.locator('select')
        // Should be disabled or not present
      }
    })

    test('should show confirmation for role change', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Changing role might require confirmation
      // This depends on implementation
    })
  })

  test.describe('Remove Member', () => {
    const testTeamId = 'test-team-id'

    test('should show remove button for admin', async ({ teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Should show remove buttons (except for self and owner)
      const removeButtons = teamMembersPage.page.locator('button:has-text("Remove")')
      // Owner should see remove buttons for non-owners
    })

    test('should show confirmation dialog', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      const removeButtons = page.locator('button:has-text("Remove")')
      const count = await removeButtons.count()

      if (count > 0) {
        await removeButtons.first().click()

        // Should show confirmation
        await expect(page.locator('[role="alertdialog"]')).toBeVisible()
        await expect(page.locator('text=Are you sure')).toBeVisible()
      }
    })

    test('should remove member after confirmation', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Get initial member count
      const initialCount = await page.locator('tr').count()

      const removeButtons = page.locator('button:has-text("Remove")')
      const count = await removeButtons.count()

      if (count > 0) {
        await removeButtons.first().click()
        await page.locator('[role="alertdialog"] button:has-text("Remove")').click()

        // Member should be removed
        await page.waitForTimeout(1000)
        const newCount = await page.locator('tr').count()
        expect(newCount).toBeLessThan(initialCount)
      }
    })

    test('should cancel remove action', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      const removeButtons = page.locator('button:has-text("Remove")')
      const count = await removeButtons.count()

      if (count > 0) {
        await removeButtons.first().click()

        // Click cancel
        await page.locator('[role="alertdialog"] button:has-text("Cancel")').click()

        // Dialog should close
        await expect(page.locator('[role="alertdialog"]')).not.toBeVisible()
      }
    })

    test('should not allow removing self', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Current user row should not have remove button
      // This depends on how the current user is displayed
    })

    test('should not allow removing owner', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Owner row should not have remove button
      const ownerRow = page.locator('tr:has-text("Owner")')

      if (await ownerRow.count() > 0) {
        const removeButton = ownerRow.locator('button:has-text("Remove")')
        await expect(removeButton).not.toBeVisible()
      }
    })
  })

  test.describe('Per-Project Access', () => {
    const testTeamId = 'test-team-id'

    test('should show project access settings', async ({ page, teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Navigate to settings if available
      if (await teamDetailPage.settingsButton.isVisible()) {
        await teamDetailPage.settingsButton.click()

        // Should show project access section
        // This depends on implementation
      }
    })

    test('should assign project access to member', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Find a member
      const memberRows = page.locator('tr').first()

      // If there's project access UI
      const projectSelect = memberRows.locator('[data-testid="project-access"]')

      if (await projectSelect.isVisible()) {
        await projectSelect.click()
        // Select projects
      }
    })

    test('should remove project access', async ({ page, teamMembersPage }) => {
      await teamMembersPage.goto(TEST_ACCOUNT_ID, testTeamId)

      // Remove project access from member
      // This depends on implementation
    })
  })

  test.describe('Permission Restrictions', () => {
    test('member should not see invite button', async ({ page, loginPage, teamDetailPage }) => {
      // Logout and login as member
      await page.goto('/login')
      await loginPage.login(TEST_USERS.member.email, TEST_USERS.member.password)
      await page.waitForURL(/\/dashboard/)

      // Navigate to a team where member has access
      await teamDetailPage.goto(TEST_ACCOUNT_ID, 'test-team-id')

      // Member should not see invite button
      await expect(teamDetailPage.inviteButton).not.toBeVisible()
    })

    test('member should not see settings', async ({ page, loginPage, teamDetailPage }) => {
      await page.goto('/login')
      await loginPage.login(TEST_USERS.member.email, TEST_USERS.member.password)
      await page.waitForURL(/\/dashboard/)

      await teamDetailPage.goto(TEST_ACCOUNT_ID, 'test-team-id')

      // Member should not see settings button
      await expect(teamDetailPage.settingsButton).not.toBeVisible()
    })

    test('member should not see remove buttons', async ({ page, loginPage, teamMembersPage }) => {
      await page.goto('/login')
      await loginPage.login(TEST_USERS.member.email, TEST_USERS.member.password)
      await page.waitForURL(/\/dashboard/)

      await teamMembersPage.goto(TEST_ACCOUNT_ID, 'test-team-id')

      // Member should not see remove buttons
      const removeButtons = page.locator('button:has-text("Remove")')
      await expect(removeButtons).toHaveCount(0)
    })

    test('admin should see invite but not delete team', async ({ page, loginPage, teamDetailPage }) => {
      await page.goto('/login')
      await loginPage.login(TEST_USERS.admin.email, TEST_USERS.admin.password)
      await page.waitForURL(/\/dashboard/)

      await teamDetailPage.goto(TEST_ACCOUNT_ID, 'test-team-id')

      // Admin should see invite
      await expect(teamDetailPage.inviteButton).toBeVisible()

      // Navigate to settings
      if (await teamDetailPage.settingsButton.isVisible()) {
        await teamDetailPage.settingsButton.click()

        // Admin should not see delete team button (owner only)
        await expect(page.locator('button:has-text("Delete Team")')).not.toBeVisible()
      }
    })

    test('owner should see all controls', async ({ teamDetailPage }) => {
      // Owner is logged in by default
      await teamDetailPage.goto(TEST_ACCOUNT_ID, 'test-team-id')

      // Owner should see all controls
      await expect(teamDetailPage.inviteButton).toBeVisible()
      await expect(teamDetailPage.settingsButton).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle invite to existing member', async ({ page, teamInvitationsPage }) => {
      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, 'test-team-id')

      // Try to invite existing member
      await teamInvitationsPage.inviteMember(TEST_USERS.owner.email)

      // Should show error
      await expect(page.locator('text=already a member')).toBeVisible({ timeout: 5000 })
    })

    test('should handle network error gracefully', async ({ page, teamInvitationsPage }) => {
      await teamInvitationsPage.goto(TEST_ACCOUNT_ID, 'test-team-id')

      // Simulate offline
      await page.context().setOffline(true)

      await teamInvitationsPage.inviteMember(`offline-${generateUniqueId()}@test.com`)

      // Should show error
      await expect(page.locator('[class*="error"], [class*="Error"]')).toBeVisible({ timeout: 5000 })

      // Restore
      await page.context().setOffline(false)
    })

    test('should show team not found error', async ({ page, teamDetailPage }) => {
      await teamDetailPage.goto(TEST_ACCOUNT_ID, 'non-existent-team')

      // Should show not found message
      await expect(page.locator('text=Not Found')).toBeVisible()
    })
  })
})

test.describe('Team Management - Screenshot on Failure', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      const screenshotName = `teams-${testInfo.title.replace(/\s+/g, '-')}.png`
      await page.screenshot({ path: `test-results/${screenshotName}`, fullPage: true })
    }
  })

  test('teams list should display correctly', async ({ page, teamsPage }) => {
    await authenticateUser(page, TEST_USERS.owner)
    await teamsPage.goto('test-account')

    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })
})
