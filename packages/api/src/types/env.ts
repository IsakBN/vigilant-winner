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
}
