/**
 * E2E Test Fixtures and Helpers
 *
 * Provides test user credentials, mock data, and page objects
 * for BundleNudge dashboard E2E tests.
 */

import { test as base, Page, Locator, expect } from '@playwright/test'

// =============================================================================
// Test User Credentials
// =============================================================================

export const TEST_USERS = {
  owner: {
    email: 'e2e-owner@bundlenudge.test',
    password: 'TestPassword123!',
    name: 'E2E Test Owner',
  },
  admin: {
    email: 'e2e-admin@bundlenudge.test',
    password: 'TestPassword123!',
    name: 'E2E Test Admin',
  },
  member: {
    email: 'e2e-member@bundlenudge.test',
    password: 'TestPassword123!',
    name: 'E2E Test Member',
  },
  newUser: {
    email: 'e2e-new@bundlenudge.test',
    password: 'NewPassword456!',
    name: 'E2E New User',
  },
} as const

// =============================================================================
// Mock Data
// =============================================================================

export const MOCK_APP = {
  name: 'E2E Test App',
  bundleId: 'com.bundlenudge.e2e.test',
  platform: 'ios' as const,
}

export const MOCK_RELEASE = {
  version: '1.0.0',
  description: 'E2E test release',
  channel: 'production',
  rolloutPercentage: 50,
}

export const MOCK_TEAM = {
  name: 'E2E Test Team',
  slug: 'e2e-test-team',
}

export const MOCK_INVITATION = {
  email: 'invited-member@bundlenudge.test',
  role: 'member' as const,
}

// =============================================================================
// Page Object - Login Page
// =============================================================================

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly githubButton: Locator
  readonly forgotPasswordLink: Locator
  readonly signUpLink: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[id="email"]')
    this.passwordInput = page.locator('input[id="password"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.githubButton = page.locator('button:has-text("Continue with GitHub")')
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]')
    this.signUpLink = page.locator('a[href="/sign-up"]')
    this.errorAlert = page.locator('[class*="bg-red"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toContainText(message)
  }
}

// =============================================================================
// Page Object - Sign Up Page
// =============================================================================

export class SignUpPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly githubButton: Locator
  readonly loginLink: Locator
  readonly errorAlert: Locator
  readonly otpInput: Locator
  readonly verifyButton: Locator
  readonly resendButton: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('input[id="name"]')
    this.emailInput = page.locator('input[id="email"]')
    this.passwordInput = page.locator('input[id="password"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.githubButton = page.locator('button:has-text("Continue with GitHub")')
    this.loginLink = page.locator('a[href="/login"]')
    this.errorAlert = page.locator('[class*="bg-red"]')
    this.otpInput = page.locator('input[placeholder*="code"], input[id="otp"]')
    this.verifyButton = page.locator('button:has-text("Verify")')
    this.resendButton = page.locator('button:has-text("Resend")')
  }

  async goto() {
    await this.page.goto('/sign-up')
  }

  async signUp(name: string, email: string, password: string) {
    if (await this.nameInput.isVisible()) {
      await this.nameInput.fill(name)
    }
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

// =============================================================================
// Page Object - Forgot Password Page
// =============================================================================

export class ForgotPasswordPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly backToLoginLink: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[id="email"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.backToLoginLink = page.locator('a[href="/login"]')
    this.successMessage = page.locator('text=Check your email')
  }

  async goto() {
    await this.page.goto('/forgot-password')
  }

  async requestReset(email: string) {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }
}

// =============================================================================
// Page Object - Dashboard Page
// =============================================================================

export class DashboardPage {
  readonly page: Page
  readonly userMenu: Locator
  readonly logoutButton: Locator
  readonly sidebar: Locator
  readonly appsLink: Locator
  readonly teamsLink: Locator
  readonly settingsLink: Locator

  constructor(page: Page) {
    this.page = page
    this.userMenu = page.locator('[data-testid="user-menu"], button:has([class*="avatar"])')
    this.logoutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")')
    this.sidebar = page.locator('[data-testid="sidebar"], nav')
    this.appsLink = page.locator('a[href*="/apps"]').first()
    this.teamsLink = page.locator('a[href*="/teams"]').first()
    this.settingsLink = page.locator('a[href*="/settings"]').first()
  }

  async goto(accountId: string = 'default') {
    await this.page.goto(`/dashboard/${accountId}`)
  }

  async logout() {
    await this.userMenu.click()
    await this.logoutButton.click()
  }

  async navigateToApps() {
    await this.appsLink.click()
  }

  async navigateToTeams() {
    await this.teamsLink.click()
  }
}

// =============================================================================
// Page Object - Apps Page
// =============================================================================

export class AppsPage {
  readonly page: Page
  readonly createAppButton: Locator
  readonly appList: Locator
  readonly searchInput: Locator
  readonly platformFilter: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.createAppButton = page.locator('a:has-text("Create App"), button:has-text("Create App")')
    this.appList = page.locator('[data-testid="app-list"], [class*="grid"]')
    this.searchInput = page.locator('input[placeholder*="Search"]')
    this.platformFilter = page.locator('select, [data-testid="platform-filter"]')
    this.emptyState = page.locator('text=No apps')
  }

  async goto(accountId: string) {
    await this.page.goto(`/dashboard/${accountId}/apps`)
  }

  async createApp() {
    await this.createAppButton.click()
  }

  getAppCard(appName: string): Locator {
    return this.page.locator(`[data-testid="app-card"]:has-text("${appName}"), a:has-text("${appName}")`)
  }
}

// =============================================================================
// Page Object - Create App Page
// =============================================================================

export class CreateAppPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly bundleIdInput: Locator
  readonly iosButton: Locator
  readonly androidButton: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('input[id="name"]')
    this.bundleIdInput = page.locator('input[id="bundleId"]')
    this.iosButton = page.locator('button:has-text("iOS")')
    this.androidButton = page.locator('button:has-text("Android")')
    this.submitButton = page.locator('button[type="submit"]')
    this.cancelButton = page.locator('a:has-text("Back"), button:has-text("Cancel")')
    this.errorAlert = page.locator('[class*="bg-red"]')
  }

  async goto(accountId: string) {
    await this.page.goto(`/dashboard/${accountId}/apps/new`)
  }

  async createApp(name: string, platform: 'ios' | 'android', bundleId?: string) {
    await this.nameInput.fill(name)

    if (platform === 'ios') {
      await this.iosButton.click()
    } else {
      await this.androidButton.click()
    }

    if (bundleId) {
      await this.bundleIdInput.fill(bundleId)
    }

    await this.submitButton.click()
  }
}

// =============================================================================
// Page Object - App Settings Page
// =============================================================================

export class AppSettingsPage {
  readonly page: Page
  readonly nameInput: Locator
  readonly saveButton: Locator
  readonly deleteButton: Locator
  readonly deleteConfirmInput: Locator
  readonly deleteConfirmButton: Locator
  readonly apiKeySection: Locator
  readonly regenerateKeyButton: Locator
  readonly copyKeyButton: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('input[id="app-name"]')
    this.saveButton = page.locator('button:has-text("Save")')
    this.deleteButton = page.locator('button:has-text("Delete App")')
    this.deleteConfirmInput = page.locator('[role="alertdialog"] input')
    this.deleteConfirmButton = page.locator('[role="alertdialog"] button:has-text("Delete")')
    this.apiKeySection = page.locator('[data-testid="api-key-section"], :has-text("API Key")')
    this.regenerateKeyButton = page.locator('button:has-text("Regenerate")')
    this.copyKeyButton = page.locator('button:has-text("Copy")')
  }

  async goto(accountId: string, appId: string) {
    await this.page.goto(`/dashboard/${accountId}/apps/${appId}/settings`)
  }

  async updateName(newName: string) {
    await this.nameInput.clear()
    await this.nameInput.fill(newName)
    await this.saveButton.click()
  }

  async deleteApp(appName: string) {
    await this.deleteButton.click()
    await this.deleteConfirmInput.fill(appName)
    await this.deleteConfirmButton.click()
  }

  async regenerateApiKey() {
    await this.regenerateKeyButton.click()
  }
}

// =============================================================================
// Page Object - Releases Page
// =============================================================================

export class ReleasesPage {
  readonly page: Page
  readonly createReleaseButton: Locator
  readonly releaseTable: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly emptyState: Locator
  readonly pagination: Locator

  constructor(page: Page) {
    this.page = page
    this.createReleaseButton = page.locator('a:has-text("Create Release")')
    this.releaseTable = page.locator('table, [data-testid="release-table"]')
    this.searchInput = page.locator('input[placeholder*="Search"]')
    this.statusFilter = page.locator('[data-testid="status-filter"], select')
    this.emptyState = page.locator('text=No releases')
    this.pagination = page.locator('[data-testid="pagination"], :has-text("Page")')
  }

  async goto(accountId: string, appId: string) {
    await this.page.goto(`/dashboard/${accountId}/apps/${appId}/releases`)
  }

  getReleaseRow(version: string): Locator {
    return this.page.locator(`tr:has-text("${version}"), [data-testid="release-row"]:has-text("${version}")`)
  }
}

// =============================================================================
// Page Object - Create Release Page
// =============================================================================

export class CreateReleasePage {
  readonly page: Page
  readonly versionInput: Locator
  readonly descriptionInput: Locator
  readonly channelSelect: Locator
  readonly rolloutSlider: Locator
  readonly minVersionInput: Locator
  readonly maxVersionInput: Locator
  readonly bundleUpload: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.versionInput = page.locator('input[id="version"]')
    this.descriptionInput = page.locator('textarea[id="description"]')
    this.channelSelect = page.locator('[data-testid="channel-select"], select')
    this.rolloutSlider = page.locator('[role="slider"]')
    this.minVersionInput = page.locator('input[id="minAppVersion"]')
    this.maxVersionInput = page.locator('input[id="maxAppVersion"]')
    this.bundleUpload = page.locator('input[type="file"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.cancelButton = page.locator('a:has-text("Cancel")')
    this.errorAlert = page.locator('[class*="bg-red"]')
  }

  async goto(accountId: string, appId: string) {
    await this.page.goto(`/dashboard/${accountId}/apps/${appId}/releases/new`)
  }

  async createRelease(options: {
    version: string
    description?: string
    channel?: string
    rolloutPercentage?: number
  }) {
    await this.versionInput.fill(options.version)

    if (options.description) {
      await this.descriptionInput.fill(options.description)
    }

    if (options.channel) {
      await this.channelSelect.click()
      await this.page.locator(`[role="option"]:has-text("${options.channel}")`).click()
    }

    await this.submitButton.click()
  }
}

// =============================================================================
// Page Object - Release Detail Page
// =============================================================================

export class ReleaseDetailPage {
  readonly page: Page
  readonly versionHeader: Locator
  readonly statusBadge: Locator
  readonly rolloutSlider: Locator
  readonly rolloutValue: Locator
  readonly toggleSwitch: Locator
  readonly disableButton: Locator
  readonly disableConfirmButton: Locator
  readonly channelSelect: Locator
  readonly statsSection: Locator

  constructor(page: Page) {
    this.page = page
    this.versionHeader = page.locator('h1')
    this.statusBadge = page.locator('[class*="badge"]')
    this.rolloutSlider = page.locator('[role="slider"]')
    this.rolloutValue = page.locator(':has-text("%")').first()
    this.toggleSwitch = page.locator('[role="switch"]')
    this.disableButton = page.locator('button:has-text("Disable")')
    this.disableConfirmButton = page.locator('[role="alertdialog"] button:has-text("Disable")')
    this.channelSelect = page.locator('[data-testid="channel-select"], select')
    this.statsSection = page.locator('[data-testid="stats"], :has-text("Downloads")')
  }

  async goto(accountId: string, appId: string, releaseId: string) {
    await this.page.goto(`/dashboard/${accountId}/apps/${appId}/releases/${releaseId}`)
  }

  async setRolloutPercentage(percentage: number) {
    // Use keyboard to set slider value
    await this.rolloutSlider.focus()
    await this.page.keyboard.press('Home')
    for (let i = 0; i < percentage / 5; i++) {
      await this.page.keyboard.press('ArrowRight')
    }
  }

  async toggleRelease() {
    await this.toggleSwitch.click()
  }

  async disableRelease() {
    await this.disableButton.click()
    await this.disableConfirmButton.click()
  }
}

// =============================================================================
// Page Object - Teams Page
// =============================================================================

export class TeamsPage {
  readonly page: Page
  readonly createTeamButton: Locator
  readonly teamList: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.createTeamButton = page.locator('button:has-text("Create Team")')
    this.teamList = page.locator('[data-testid="team-list"]')
    this.emptyState = page.locator('text=No teams')
  }

  async goto(accountId: string) {
    await this.page.goto(`/dashboard/${accountId}/teams`)
  }

  getTeamCard(teamName: string): Locator {
    return this.page.locator(`a:has-text("${teamName}")`)
  }
}

// =============================================================================
// Page Object - Team Detail Page
// =============================================================================

export class TeamDetailPage {
  readonly page: Page
  readonly teamName: Locator
  readonly membersTab: Locator
  readonly invitationsTab: Locator
  readonly inviteButton: Locator
  readonly memberTable: Locator
  readonly settingsButton: Locator

  constructor(page: Page) {
    this.page = page
    this.teamName = page.locator('h1')
    this.membersTab = page.locator('[role="tab"]:has-text("Members")')
    this.invitationsTab = page.locator('[role="tab"]:has-text("Invitations")')
    this.inviteButton = page.locator('a:has-text("Invite Member")')
    this.memberTable = page.locator('table, [data-testid="member-table"]')
    this.settingsButton = page.locator('a:has-text("Settings")')
  }

  async goto(accountId: string, teamId: string) {
    await this.page.goto(`/dashboard/${accountId}/teams/${teamId}`)
  }

  getMemberRow(email: string): Locator {
    return this.page.locator(`tr:has-text("${email}")`)
  }
}

// =============================================================================
// Page Object - Team Invitations Page
// =============================================================================

export class TeamInvitationsPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly roleSelect: Locator
  readonly inviteButton: Locator
  readonly pendingInvites: Locator
  readonly successToast: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[type="email"], input[id="email"]')
    this.roleSelect = page.locator('select, [data-testid="role-select"]')
    this.inviteButton = page.locator('button[type="submit"]:has-text("Invite"), button:has-text("Send")')
    this.pendingInvites = page.locator('[data-testid="pending-invites"]')
    this.successToast = page.locator('[data-testid="toast"]:has-text("sent")')
  }

  async goto(accountId: string, teamId: string) {
    await this.page.goto(`/dashboard/${accountId}/teams/${teamId}/invitations`)
  }

  async inviteMember(email: string, role: 'admin' | 'member' = 'member') {
    await this.emailInput.fill(email)
    if (await this.roleSelect.isVisible()) {
      await this.roleSelect.selectOption(role)
    }
    await this.inviteButton.click()
  }

  getInviteRow(email: string): Locator {
    return this.page.locator(`tr:has-text("${email}"), [data-testid="invite-row"]:has-text("${email}")`)
  }
}

// =============================================================================
// Page Object - Team Members Page
// =============================================================================

export class TeamMembersPage {
  readonly page: Page
  readonly memberTable: Locator
  readonly inviteButton: Locator

  constructor(page: Page) {
    this.page = page
    this.memberTable = page.locator('table, [data-testid="member-table"]')
    this.inviteButton = page.locator('a:has-text("Invite Member")')
  }

  async goto(accountId: string, teamId: string) {
    await this.page.goto(`/dashboard/${accountId}/teams/${teamId}/members`)
  }

  getMemberRow(email: string): Locator {
    return this.page.locator(`tr:has-text("${email}")`)
  }

  async changeRole(email: string, newRole: 'admin' | 'member') {
    const row = this.getMemberRow(email)
    await row.locator('select, [data-testid="role-select"]').selectOption(newRole)
  }

  async removeMember(email: string) {
    const row = this.getMemberRow(email)
    await row.locator('button:has-text("Remove")').click()
    await this.page.locator('[role="alertdialog"] button:has-text("Remove")').click()
  }
}

// =============================================================================
// Extended Test Fixture
// =============================================================================

interface TestFixtures {
  loginPage: LoginPage
  signUpPage: SignUpPage
  forgotPasswordPage: ForgotPasswordPage
  dashboardPage: DashboardPage
  appsPage: AppsPage
  createAppPage: CreateAppPage
  appSettingsPage: AppSettingsPage
  releasesPage: ReleasesPage
  createReleasePage: CreateReleasePage
  releaseDetailPage: ReleaseDetailPage
  teamsPage: TeamsPage
  teamDetailPage: TeamDetailPage
  teamInvitationsPage: TeamInvitationsPage
  teamMembersPage: TeamMembersPage
}

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page))
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page))
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page))
  },
  appsPage: async ({ page }, use) => {
    await use(new AppsPage(page))
  },
  createAppPage: async ({ page }, use) => {
    await use(new CreateAppPage(page))
  },
  appSettingsPage: async ({ page }, use) => {
    await use(new AppSettingsPage(page))
  },
  releasesPage: async ({ page }, use) => {
    await use(new ReleasesPage(page))
  },
  createReleasePage: async ({ page }, use) => {
    await use(new CreateReleasePage(page))
  },
  releaseDetailPage: async ({ page }, use) => {
    await use(new ReleaseDetailPage(page))
  },
  teamsPage: async ({ page }, use) => {
    await use(new TeamsPage(page))
  },
  teamDetailPage: async ({ page }, use) => {
    await use(new TeamDetailPage(page))
  },
  teamInvitationsPage: async ({ page }, use) => {
    await use(new TeamInvitationsPage(page))
  },
  teamMembersPage: async ({ page }, use) => {
    await use(new TeamMembersPage(page))
  },
})

export { expect }

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Login helper - authenticates a user before test
 */
export async function authenticateUser(page: Page, user = TEST_USERS.owner) {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(user.email, user.password)
  await page.waitForURL(/\/dashboard/)
}

/**
 * Generate unique test data to avoid conflicts
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Create a unique app name for testing
 */
export function uniqueAppName(baseName = 'E2E App'): string {
  return `${baseName} ${generateUniqueId()}`
}

/**
 * Create a unique team name for testing
 */
export function uniqueTeamName(baseName = 'E2E Team'): string {
  return `${baseName} ${generateUniqueId()}`
}

/**
 * Create a unique version string
 */
export function uniqueVersion(): string {
  const major = Math.floor(Math.random() * 10)
  const minor = Math.floor(Math.random() * 100)
  const patch = Math.floor(Math.random() * 1000)
  return `${major}.${minor}.${patch}`
}

/**
 * Wait for toast message
 */
export async function waitForToast(page: Page, message: string) {
  await expect(page.locator(`[data-testid="toast"]:has-text("${message}")`)).toBeVisible({
    timeout: 5000,
  })
}

/**
 * Take screenshot on failure
 */
export async function screenshotOnFailure(
  page: Page,
  testInfo: { title: string; status?: string },
  error?: Error
) {
  if (testInfo.status === 'failed' || error) {
    const screenshotName = `${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`
    await page.screenshot({ path: `test-results/screenshots/${screenshotName}`, fullPage: true })
  }
}
