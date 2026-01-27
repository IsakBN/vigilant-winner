/**
 * Cloudflare Workers environment bindings
 */

/**
 * Build job message for queue
 */
export interface BuildJobMessage {
  buildId: string
  buildType: 'ios' | 'android'
  appId: string
  priority: 0 | 1 | 2 | 3
  createdAt: number
}

export interface Env {
  // D1 Database
  DB: D1Database

  // R2 Bucket for bundle storage
  BUNDLES: R2Bucket

  // KV for rate limiting
  RATE_LIMIT: KVNamespace

  // KV for caching (admin dashboard, etc.)
  CACHE: KVNamespace

  // Environment variables
  ENVIRONMENT: 'development' | 'staging' | 'production'
  JWT_SECRET?: string

  // Auth (Better Auth + OAuth)
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string

  // Email
  RESEND_API_KEY: string

  // Stripe
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string

  // Encryption
  ENCRYPTION_KEY: string
  WEBHOOK_ENCRYPTION_KEY: string
  GITHUB_TOKEN_ENCRYPTION_KEY: string

  // GitHub App
  GITHUB_APP_ID: string
  GITHUB_APP_NAME: string
  GITHUB_PRIVATE_KEY: string
  GITHUB_WEBHOOK_SECRET: string

  // URLs
  DASHBOARD_URL: string
  API_URL: string
  APP_URL: string  // Base URL for email links

  // Priority Queues (P0=Enterprise, P1=Team, P2=Pro, P3=Free)
  BUILD_QUEUE_P0: Queue<BuildJobMessage>
  BUILD_QUEUE_P1: Queue<BuildJobMessage>
  BUILD_QUEUE_P2: Queue<BuildJobMessage>
  BUILD_QUEUE_P3: Queue<BuildJobMessage>
  BUILD_QUEUE_DLQ: Queue<BuildJobMessage>

  // Durable Objects
  REALTIME: DurableObjectNamespace
}
