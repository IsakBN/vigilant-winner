/**
 * Cloudflare Workers environment bindings
 */

export interface Env {
  // D1 Database
  DB: D1Database

  // R2 Bucket for bundle storage
  BUNDLES: R2Bucket

  // KV for rate limiting
  RATE_LIMIT: KVNamespace

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

  // GitHub App
  GITHUB_APP_ID: string
  GITHUB_APP_NAME: string
  GITHUB_PRIVATE_KEY: string
  GITHUB_WEBHOOK_SECRET: string

  // URLs
  DASHBOARD_URL: string
  API_URL: string
}
