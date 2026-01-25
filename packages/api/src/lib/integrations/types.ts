/**
 * Integration types
 */

// =============================================================================
// Provider Types
// =============================================================================

export type IntegrationProvider = 'sentry' | 'bugsnag' | 'crashlytics' | 'slack' | 'discord'

// =============================================================================
// Config Types
// =============================================================================

export interface SentryConfig {
  dsn: string
  organization: string
  project: string
  authToken: string
}

export interface BugsnagConfig {
  apiKey: string
  projectKey: string
}

export interface CrashlyticsConfig {
  serviceAccountJson: string
  projectId: string
}

export interface SlackConfig {
  webhookUrl: string
  channel?: string
}

export interface DiscordConfig {
  webhookUrl: string
}

export type IntegrationConfig =
  | SentryConfig
  | BugsnagConfig
  | CrashlyticsConfig
  | SlackConfig
  | DiscordConfig

// =============================================================================
// Message Types
// =============================================================================

export interface CrashReport {
  appId: string
  appName: string
  releaseVersion: string
  bundleVersion: string
  deviceId: string
  platform: 'ios' | 'android'
  errorMessage: string
  stackTrace?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface SlackMessage {
  text: string
  blocks?: SlackBlock[]
}

export interface SlackBlock {
  type: string
  text?: { type: string; text: string }
  fields?: Array<{ type: string; text: string }>
  elements?: Array<{ type: string; text: string }>
}

export interface DiscordMessage {
  content: string
  embeds?: DiscordEmbed[]
}

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  timestamp?: string
}

// =============================================================================
// Result Types
// =============================================================================

export interface IntegrationTestResult {
  success: boolean
  error?: string
}
